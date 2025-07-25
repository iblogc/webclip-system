const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");
const { NetworkHelper } = require("./network-helper");

class ResourceDownloader {
  constructor(config) {
    this.config = config;
    this.downloadedResources = new Map();
    this.networkHelper = new NetworkHelper(config);
  }

  /**
   * 从Markdown内容中提取所有图片URL（包括HTTP URL和base64）
   */
  extractImageUrls(markdownContent) {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images = [];
    let match;

    while ((match = imageRegex.exec(markdownContent)) !== null) {
      const altText = match[1];
      const url = match[2];

      // 检查是否是base64图片
      if (url.startsWith("data:image/")) {
        images.push({
          altText,
          originalUrl: url,
          markdownMatch: match[0],
          type: 'base64'
        });
        continue;
      }

      // 检查是否是HTTP URL
      if (url.startsWith("http://") || url.startsWith("https://")) {
        images.push({
          altText,
          originalUrl: url,
          markdownMatch: match[0],
          type: 'url'
        });
        continue;
      }

      // 跳过本地路径的图片
    }

    return images;
  }

  /**
   * 生成本地文件名
   */
  generateLocalFileName(url, index, type = 'url') {
    try {
      let extension = '.jpg'; // 默认扩展名
      
      if (type === 'base64') {
        // 从base64 data URL中提取MIME类型
        const mimeMatch = url.match(/^data:image\/([^;]+)/);
        if (mimeMatch) {
          const mimeType = mimeMatch[1].toLowerCase();
          extension = `.${mimeType === 'jpeg' ? 'jpg' : mimeType}`;
        }
      } else {
        // HTTP URL处理
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        extension = path.extname(pathname).toLowerCase() || '.jpg';
      }

      // 检查是否是允许的扩展名
      if (!this.config.resources.allowed_extensions.includes(extension)) {
        return null;
      }

      // 生成基于URL的哈希值作为文件名
      const hash = crypto
        .createHash("md5")
        .update(url)
        .digest("hex")
        .substring(0, 8);
      const fileName = `image-${index + 1}-${hash}${extension}`;

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
      console.log(`📥 下载图片: ${url.substring(0, 50)}...`);

      // 构建请求配置
      const requestConfig = {
        responseType: "stream",
        timeout: this.config.resources.download_timeout * 1000,
        maxContentLength: this.config.resources.max_file_size_mb * 1024 * 1024,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      };

      // 使用网络助手进行带重试的请求
      const response = await this.networkHelper.get(url, requestConfig);

      // 确保目录存在
      await fs.mkdir(path.dirname(localPath), { recursive: true });

      // 写入文件
      const writer = require("fs").createWriteStream(localPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on("finish", () => {
          console.log(`✅ 图片下载成功: ${path.basename(localPath)}`);
          resolve(localPath);
        });
        writer.on("error", reject);
      });
    } catch (error) {
      console.warn(`⚠️ 图片下载失败: ${url.substring(0, 50)}...`, error.message);
      throw error;
    }
  }

  /**
   * 保存base64图片
   */
  async saveBase64Image(base64Data, localPath) {
    try {
      console.log(`💾 保存base64图片: ${path.basename(localPath)}`);

      // 解析base64数据
      const matches = base64Data.match(/^data:image\/[^;]+;base64,(.+)$/);
      if (!matches) {
        throw new Error('无效的base64图片格式');
      }

      const imageBuffer = Buffer.from(matches[1], 'base64');
      
      // 检查文件大小
      const maxSize = this.config.resources.max_file_size_mb * 1024 * 1024;
      if (imageBuffer.length > maxSize) {
        throw new Error(`文件大小超过限制: ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB > ${this.config.resources.max_file_size_mb}MB`);
      }

      // 确保目录存在
      await fs.mkdir(path.dirname(localPath), { recursive: true });

      // 写入文件
      await fs.writeFile(localPath, imageBuffer);
      
      console.log(`✅ base64图片保存成功: ${path.basename(localPath)}`);
      return localPath;
    } catch (error) {
      console.warn(`⚠️ base64图片保存失败: ${path.basename(localPath)}`, error.message);
      throw error;
    }
  }

  /**
   * 处理Markdown中的所有图片（包括HTTP URL和base64）
   */
  async processMarkdownImages(markdownContent, categoryDir, fileName) {
    if (
      !this.config.features?.download_resources ||
      !this.config.resources?.download_images
    ) {
      console.log("📷 图片下载功能已禁用");
      return markdownContent;
    }

    const images = this.extractImageUrls(markdownContent);

    if (images.length === 0) {
      console.log("📷 未发现需要处理的图片");
      return markdownContent;
    }

    const urlImages = images.filter(img => img.type === 'url');
    const base64Images = images.filter(img => img.type === 'base64');
    
    console.log(`📷 发现 ${images.length} 张图片需要处理 (HTTP: ${urlImages.length}, Base64: ${base64Images.length})`);

    // 创建资源目录
    const baseFileName = path.basename(fileName, ".md");
    const assetsDir = path.join(
      categoryDir,
      this.config.resources.assets_folder,
      baseFileName
    );

    let updatedMarkdown = markdownContent;
    const processPromises = [];

    // 处理所有图片
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const localFileName = this.generateLocalFileName(image.originalUrl, i, image.type);

      if (!localFileName) {
        const urlPreview = image.type === 'base64' ? 'base64图片' : image.originalUrl;
        console.warn(`⚠️ 跳过不支持的图片格式: ${urlPreview}`);
        continue;
      }

      const localPath = path.join(assetsDir, localFileName);
      const relativePath = path.posix.join(
        this.config.resources.assets_folder,
        baseFileName,
        localFileName
      );

      // 根据类型选择处理方法
      let processPromise;
      if (image.type === 'base64') {
        processPromise = this.saveBase64Image(image.originalUrl, localPath);
      } else {
        processPromise = this.downloadImage(image.originalUrl, localPath);
      }

      // 处理图片并更新Markdown
      const finalPromise = processPromise
        .then(() => {
          // 替换Markdown中的图片引用
          const newMarkdown = `![${image.altText}](${relativePath})`;
          updatedMarkdown = updatedMarkdown.replace(
            image.markdownMatch,
            newMarkdown
          );
          
          const urlPreview = image.type === 'base64' ? 'base64图片' : image.originalUrl;
          console.log(`🔄 已替换图片引用: ${urlPreview} -> ${relativePath}`);
        })
        .catch((error) => {
          const urlPreview = image.type === 'base64' ? 'base64图片' : image.originalUrl;
          console.warn(`⚠️ 图片处理失败，保留原始引用: ${urlPreview}`);
        });

      processPromises.push(finalPromise);
    }

    // 等待所有处理完成
    await Promise.allSettled(processPromises);

    console.log(`📷 图片处理完成，处理了 ${processPromises.length} 张图片`);

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
