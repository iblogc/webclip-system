const fs = require('fs').promises;
const path = require('path');
const core = require('@actions/core');
const GistProcessor = require('../client/process_gist');

class ActionsGistProcessor extends GistProcessor {
  constructor() {
    super();
    this.logFile = './logs/processor.log';
    this.processedItems = [];
    this.failedItems = [];
  }

  async loadConfig() {
    try {
      const configPath = './temp/config.json';
      const configData = await fs.readFile(configPath, 'utf8');
      this.config = JSON.parse(configData);
      
      // Actions环境特殊配置
      this.config.puppeteer = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ]
      };
      
      // 初始化资源下载器
      const { ResourceDownloader } = require('../client/resource-downloader');
      this.resourceDownloader = new ResourceDownloader(this.config);
      
      await this.log('✅ Actions配置加载成功');
    } catch (error) {
      await this.log(`❌ 配置加载失败: ${error.message}`);
      throw error;
    }
  }

  async log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    try {
      await fs.appendFile(this.logFile, logMessage + '\n');
    } catch (error) {
      console.error('日志写入失败:', error.message);
    }
  }

  async processItem(item) {
    await this.log(`📄 开始处理项目: ${item.title}`);
    
    try {
      // 1. 抓取网页内容并转换为Markdown
      const { buildMarkdown } = require('../client/markdown-builder');
      const markdownContent = await buildMarkdown(item.url, this.config.puppeteer);
      
      // 2. 生成AI摘要和标签（可选）
      let summary = '';
      let tags = [];
      
      if (this.config.features?.ai_summary && this.config.ai.providers.length > 0) {
        try {
          const { summarizeContent } = require('../client/summarize');
          const aiResult = await summarizeContent(
            markdownContent,
            this.config.ai,
            this.config
          );
          summary = aiResult.summary;
          tags = aiResult.tags;
          await this.log('✅ AI摘要生成成功');
        } catch (error) {
          await this.log(`⚠️ AI摘要生成失败: ${error.message}`);
        }
      } else {
        await this.log('🤖 AI摘要功能已禁用');
      }
      
      // 3. 构建完整的Markdown文件
      const frontmatter = {
        title: item.title,
        url: item.url,
        created: item.created,
        category: item.category,
        note: item.note || '',
        tags: tags,
        summary: summary,
        processed_by: 'GitHub Actions',
        processed_at: new Date().toISOString()
      };
      
      const fullMarkdown = this.buildFullMarkdown(frontmatter, markdownContent);
      
      // 4. 保存文件
      const fileName = this.generateFileName(item);
      const categoryDir = path.join(this.config.output_dir, item.category);
      const filePath = path.join(categoryDir, fileName);
      
      // 确保目录存在
      await fs.mkdir(categoryDir, { recursive: true });
      
      // 写入初始文件
      await fs.writeFile(filePath, fullMarkdown, 'utf8');
      await this.log(`✅ 文件保存成功: ${filePath}`);
      
      // 5. 下载并处理图片资源
      try {
        const updatedMarkdown = await this.resourceDownloader.processMarkdownImages(
          fullMarkdown,
          categoryDir,
          fileName
        );
        
        // 如果内容有更新，重新写入文件
        if (updatedMarkdown !== fullMarkdown) {
          await fs.writeFile(filePath, updatedMarkdown, 'utf8');
          await this.log('✅ 图片资源处理完成，文件已更新');
        }
      } catch (error) {
        await this.log(`⚠️ 图片资源处理失败: ${error.message}`);
      }
      
      this.processedItems.push({
        ...item,
        filePath: filePath,
        fileName: fileName
      });
      
      return true;
    } catch (error) {
      await this.log(`❌ 处理项目失败: ${item.title} - ${error.message}`);
      
      // 保存错误副本
      await this.saveErrorCopy(item, error);
      this.failedItems.push({
        ...item,
        error: error.message
      });
      
      return false;
    }
  }

  async processQueue() {
    await this.log('🚀 开始处理队列...');
    
    try {
      const gistData = await this.fetchGistContent();
      
      if (!gistData.items || gistData.items.length === 0) {
        await this.log('📭 队列为空，无需处理');
        return;
      }
      
      await this.log(`📋 发现 ${gistData.items.length} 个待处理项目`);
      
      // 逐个处理项目
      for (const item of gistData.items) {
        await this.processItem(item);
      }
      
      // 更新Gist，移除成功处理的项目
      if (this.processedItems.length > 0) {
        const updatedData = { items: this.failedItems };
        await this.updateGistContent(updatedData);
        await this.log(`✅ 成功处理 ${this.processedItems.length} 个项目`);
      }
      
      if (this.failedItems.length > 0) {
        await this.log(`⚠️ ${this.failedItems.length} 个项目处理失败，将在下次重试`);
      }
      
      // 设置Actions输出
      core.setOutput('processed-count', this.processedItems.length.toString());
      core.setOutput('failed-count', this.failedItems.length.toString());
      core.setOutput('total-count', gistData.items.length.toString());
      
    } catch (error) {
      await this.log(`❌ 队列处理失败: ${error.message}`);
      core.setFailed(error.message);
      throw error;
    } finally {
      await this.log('🏁 队列处理完成');
    }
  }

  async run() {
    try {
      await this.log('🎯 GitHub Actions Web收藏处理器启动');
      await this.loadConfig();
      await this.processQueue();
      
      // 生成处理报告
      const report = {
        timestamp: new Date().toISOString(),
        processed: this.processedItems.length,
        failed: this.failedItems.length,
        processedItems: this.processedItems.map(item => ({
          title: item.title,
          category: item.category,
          fileName: item.fileName
        })),
        failedItems: this.failedItems.map(item => ({
          title: item.title,
          error: item.error
        }))
      };
      
      await fs.writeFile('./temp/report.json', JSON.stringify(report, null, 2));
      await this.log('📊 处理报告已生成');
      process.exit(0)
    } catch (error) {
      await this.log(`❌ 处理器运行失败: ${error.message}`);
      core.setFailed(error.message);
      process.exit(1);
    }
  }
}

async function main() {
  const processor = new ActionsGistProcessor();
  await processor.run();
}

if (require.main === module) {
  main();
}

module.exports = { ActionsGistProcessor };