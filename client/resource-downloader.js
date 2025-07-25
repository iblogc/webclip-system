const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");
const { URL } = require("url");

class ResourceDownloader {
  constructor(config) {
    this.config = config;
    this.downloadedResources = new Map();
  }

  /**
   * 从Markdown内容中提取所有图片URL
   */
  extractImageUrls(markdownContent) {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images = [];
    let match;

    while ((match = imageRegex.exec(markdownContent)) !== null) {
      const altText = match[1];
      const url = match[2];
      
      // 跳过已经是本地路径的图片
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        continue;
      }

      images.push({
        altText,
        originalUrl: url,
        markdownMatch: match[0]
      });
    }

    return images;
  }

  /**
   * 生成本地文件名
   */
  generateLocalFileName(url, index) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const extension = path.extname(pathname).toLowerCase();
      
      // 检查是否是允许的扩展名
      if (!this.config.resources.allowed_extensions.includes(extension)) {
        return null;
      }

      // 生成基于URL的哈希值作为文件名
      const hash = crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
      const fileName = `image-${index + 1}-${hash}${extension || '.jpg'}`;
      
      return fileName;
    } catch (error) {
      console.warn(`⚠️ 无法解析URL: ${url}`, error.message);
      return null;
    }
  }

  /**
   * 下载单个图片
   */
  async downloadImage(url, localPath) {
    try {
      console.log(`📥 下载图片: ${url}`);
      
      // 构建请求配置
      const requestConfig = {
        responseType: 'stream',
        timeout: this.config.resources.download_timeout * 1000,
        maxContentLength: this.config.resources.max_file_size_mb * 1024 * 1024,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      };

      // 添加代理支持
      if (this.config.ai?.proxy?.enabled) {
        const { HttpsProxyAgent } = require('https-proxy-agent');
        const proxyUrl = this.config.ai.proxy.https_proxy || this.config.ai.proxy.http_proxy;
        if (proxyUrl) {
          requestConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
        }
      }

      const response = await axios.get(url, requestConfig);
      
      // 确保目录存在
      await fs.mkdir(path.dirname(localPath), { recursive: true });
      
      // 写入文件
      const writer = require('fs').createWriteStream(localPath);
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`✅ 图片下载成功: ${path.basename(localPath)}`);
          resolve(localPath);
        });
        writer.on('error', reject);
      });
      
    } catch (error) {
      console.warn(`⚠️ 图片下载失败: ${url}`, error.message);
      throw error;
    }
  }

  /**
   * 处理Markdown中的所有图片
   */
  async processMarkdownImages(markdownContent, categoryDir, fileName) {
    if (!this.config.features?.download_resources || !this.config.resources?.download_images) {
      console.log("📷 图片下载功能已禁用");
      return markdownContent;
    }

    const images = this.extractImageUrls(markdownContent);
    
    if (images.length === 0) {
      console.log("📷 未发现需要下载的图片");
      return markdownContent;
    }

    console.log(`📷 发现 ${images.length} 张图片需要下载`);
    
    // 创建资源目录
    const baseFileName = path.basename(fileName, '.md');
    const assetsDir = path.join(categoryDir, this.config.resources.assets_folder, baseFileName);
    
    let updatedMarkdown = markdownContent;
    const downloadPromises = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const localFileName = this.generateLocalFileName(image.originalUrl, i);
      
      if (!localFileName) {
        console.warn(`⚠️ 跳过不支持的图片格式: ${image.originalUrl}`);
        continue;
      }

      const localPath = path.join(assetsDir, localFileName);
      const relativePath = path.posix.join(this.config.resources.assets_folder, baseFileName, localFileName);
      
      // 异步下载图片
      const downloadPromise = this.downloadImage(image.originalUrl, localPath)
        .then(() => {
          // 替换Markdown中的图片引用
          const newMarkdown = `![${image.altText}](${relativePath})`;
          updatedMarkdown = updatedMarkdown.replace(image.markdownMatch, newMarkdown);
          console.log(`🔄 已替换图片引用: ${image.originalUrl} -> ${relativePath}`);
        })
        .catch((error) => {
          console.warn(`⚠️ 图片下载失败，保留原始URL: ${image.originalUrl}`);
        });
      
      downloadPromises.push(downloadPromise);
    }

    // 等待所有下载完成
    await Promise.allSettled(downloadPromises);
    
    const successCount = downloadPromises.length;
    console.log(`📷 图片处理完成，成功处理 ${successCount} 张图片`);
    
    return updatedMarkdown;
  }

  /**
   * 清理失败的下载文件
   */
  async cleanupFailedDownloads(assetsDir) {
    try {
      const files = await fs.readdir(assetsDir);
      for (const file of files) {
        const filePath = path.join(assetsDir, file);
        const stats = await fs.stat(filePath);
        
        // 删除空文件或过小的文件（可能是下载失败的）
        if (stats.size < 100) {
          await fs.unlink(filePath);
          console.log(`🗑️ 清理失败的下载文件: ${file}`);
        }
      }
    } catch (error) {
      // 目录不存在或其他错误，忽略
    }
  }
}

module.exports = { ResourceDownloader };