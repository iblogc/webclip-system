const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const { summarizeContent } = require("./summarize");
const { buildMarkdown } = require("./markdown-builder");
const { syncToGit } = require("./git-sync");
const { ResourceDownloader } = require("./resource-downloader");

class GistProcessor {
  constructor() {
    this.config = null;
    this.isProcessing = false;
    this.resourceDownloader = null;
  }

  async loadConfig() {
    try {
      const configPath = path.join(__dirname, "../config/config.json");
      const configData = await fs.readFile(configPath, "utf8");
      this.config = JSON.parse(configData);

      // 展开用户目录路径
      if (this.config.output_dir.startsWith("~/")) {
        const os = require("os");
        this.config.output_dir = path.join(
          os.homedir(),
          this.config.output_dir.slice(2)
        );
      }

      // 初始化资源下载器
      this.resourceDownloader = new ResourceDownloader(this.config);
      
      console.log("✅ 配置加载成功");
    } catch (error) {
      console.error("❌ 配置加载失败:", error.message);
      throw error;
    }
  }

  async fetchGistContent() {
    try {
      const response = await axios.get(
        `https://api.github.com/gists/${this.config.gist_id}`,
        {
          headers: {
            Authorization: `token ${this.config.github_token}`,
            Accept: "application/vnd.github.v3+json",
          },
          timeout: this.config.processing.timeout_seconds * 1000,
        }
      );

      const content = response.data.files["webclip-queue.json"]?.content;
      if (!content) {
        return { items: [] };
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("❌ 获取Gist内容失败:", error.message);
      throw error;
    }
  }

  async updateGistContent(data) {
    try {
      await axios.patch(
        `https://api.github.com/gists/${this.config.gist_id}`,
        {
          files: {
            "webclip-queue.json": {
              content: JSON.stringify(data, null, 2),
            },
          },
        },
        {
          headers: {
            Authorization: `token ${this.config.github_token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          timeout: this.config.processing.timeout_seconds * 1000,
        }
      );

      console.log("✅ Gist更新成功");
    } catch (error) {
      console.error("❌ 更新Gist失败:", error.message);
      throw error;
    }
  }

  async processItem(item) {
    console.log(`📄 处理项目: ${item.title}`);

    try {
      // 1. 抓取网页内容并转换为Markdown
      const markdownContent = await buildMarkdown(item.url);

      // 2. 生成AI摘要和标签（可选）
      let summary = "";
      let tags = [];

      if (this.config.features?.ai_summary) {
        try {
          const aiResult = await summarizeContent(
            markdownContent,
            this.config.ai,
            this.config
          );
          summary = aiResult.summary;
          tags = aiResult.tags;
          console.log("✅ AI摘要生成成功");
        } catch (error) {
          console.warn("⚠️ AI摘要生成失败，跳过:", error.message);
        }
      } else {
        console.log("🤖 AI摘要功能已禁用");
      }

      // 3. 构建完整的Markdown文件
      const frontmatter = {
        title: item.title,
        url: item.url,
        created: item.created,
        category: item.category,
        note: item.note || "",
        tags: tags,
        summary: summary,
      };

      const fullMarkdown = this.buildFullMarkdown(frontmatter, markdownContent);

      // 4. 保存文件
      const fileName = this.generateFileName(item);
      const categoryDir = path.join(this.config.output_dir, item.category);
      const filePath = path.join(categoryDir, fileName);
      
      // 确保目录存在
      await fs.mkdir(categoryDir, { recursive: true });
      
      // 写入初始文件
      await fs.writeFile(filePath, fullMarkdown, "utf8");
      console.log(`✅ 文件保存成功: ${filePath}`);

      // 5. 下载并处理图片资源
      try {
        const updatedMarkdown = await this.resourceDownloader.processMarkdownImages(
          fullMarkdown,
          categoryDir,
          fileName
        );
        
        // 如果内容有更新，重新写入文件
        if (updatedMarkdown !== fullMarkdown) {
          await fs.writeFile(filePath, updatedMarkdown, "utf8");
          console.log("✅ 图片资源处理完成，文件已更新");
        }
      } catch (error) {
        console.warn("⚠️ 图片资源处理失败:", error.message);
      }

      // 6. Git同步
      if (this.config.git.auto_commit) {
        try {
          await syncToGit(
            this.config.output_dir,
            item.title,
            this.config.git.commit_message_template
          );
          console.log("✅ Git同步成功");
        } catch (error) {
          console.warn("⚠️ Git同步失败:", error.message);
        }
      }

      return true;
    } catch (error) {
      console.error(`❌ 处理项目失败: ${item.title}`, error.message);

      // 保存错误副本
      await this.saveErrorCopy(item, error);
      return false;
    }
  }

  buildFullMarkdown(frontmatter, content) {
    const yaml = require("js-yaml");
    const frontmatterStr = yaml.dump(frontmatter, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
    });

    return `---\n${frontmatterStr}---\n\n${content}`;
  }

  generateFileName(item) {
    const date = new Date(item.created).toISOString().split("T")[0];
    const title = item.title
      .replace(/[^\w\s\u4e00-\u9fff-]/g, "") // 移除特殊字符，保留中文
      .replace(/\s+/g, "-") // 空格替换为连字符
      .toLowerCase()
      .substring(0, 50); // 限制长度

    return `${date}-${title}.md`;
  }



  async saveErrorCopy(item, error) {
    try {
      const errorDir = path.join(this.config.output_dir, "errors");
      await fs.mkdir(errorDir, { recursive: true });

      const errorFile = path.join(errorDir, `error-${Date.now()}.json`);
      const errorData = {
        item,
        error: error.message,
        timestamp: new Date().toISOString(),
      };

      await fs.writeFile(errorFile, JSON.stringify(errorData, null, 2), "utf8");
      console.log(`💾 错误副本已保存: ${errorFile}`);
    } catch (saveError) {
      console.error("❌ 保存错误副本失败:", saveError.message);
    }
  }

  async processQueue() {
    if (this.isProcessing) {
      console.log("⏳ 正在处理中，跳过本次执行");
      return;
    }

    this.isProcessing = true;
    console.log("🚀 开始处理队列...");

    try {
      const gistData = await this.fetchGistContent();

      if (!gistData.items || gistData.items.length === 0) {
        console.log("📭 队列为空，无需处理");
        return;
      }

      console.log(`📋 发现 ${gistData.items.length} 个待处理项目`);

      const processedItems = [];
      const failedItems = [];

      // 逐个处理项目
      for (const item of gistData.items) {
        const success = await this.processItem(item);
        if (success) {
          processedItems.push(item);
        } else {
          failedItems.push(item);
        }
      }

      // 更新Gist，移除成功处理的项目
      if (processedItems.length > 0) {
        const updatedData = { items: failedItems };
        await this.updateGistContent(updatedData);
        console.log(`✅ 成功处理 ${processedItems.length} 个项目`);
      }

      if (failedItems.length > 0) {
        console.log(`⚠️ ${failedItems.length} 个项目处理失败，将在下次重试`);
      }
    } catch (error) {
      console.error("❌ 队列处理失败:", error.message);
    } finally {
      this.isProcessing = false;
      console.log("🏁 队列处理完成\n");
    }
  }

  async start() {
    console.log("🎯 Web收藏处理器启动");

    try {
      await this.loadConfig();

      // 立即执行一次
      await this.processQueue();

      // 设置定时执行
      const intervalMs = this.config.processing.interval_minutes * 60 * 1000;
      setInterval(() => {
        this.processQueue();
      }, intervalMs);

      console.log(
        `⏰ 定时器已设置，每 ${this.config.processing.interval_minutes} 分钟执行一次`
      );
    } catch (error) {
      console.error("❌ 启动失败:", error.message);
      process.exit(1);
    }
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const processor = new GistProcessor();
  processor.start();
}

module.exports = GistProcessor;
