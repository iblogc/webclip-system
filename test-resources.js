const { ResourceDownloader } = require('./client/resource-downloader');
const path = require('path');

// 测试配置
const testConfig = {
  proxy: {
    http_proxy: "http://127.0.0.1:1080",
    https_proxy: "http://127.0.0.1:1080"
  },
  features: {
    ai_summary: true,
    download_resources: true
  },
  resources: {
    download_images: true,
    download_timeout: 10,
    max_file_size_mb: 10,
    allowed_extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    assets_folder: "assets"
  }
};

// 测试Markdown内容
const testMarkdown = `# 测试文章

这是一个测试文章，包含一些图片：

![测试图片1](https://via.placeholder.com/300x200.png?text=Test+Image+1)

一些文本内容...

![测试图片2](https://via.placeholder.com/400x300.jpg?text=Test+Image+2)

Base64图片测试：

![Base64图片](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==)

更多内容...

![本地图片](./local-image.png)

结束。
`;

async function testResourceDownloader() {
  console.log('🧪 开始测试资源下载功能...\n');
  
  const downloader = new ResourceDownloader(testConfig);
  
  // 测试提取图片URL
  console.log('1. 测试提取图片URL:');
  const images = downloader.extractImageUrls(testMarkdown);
  console.log(`发现 ${images.length} 张图片:`);
  images.forEach((img, index) => {
    console.log(`  ${index + 1}. ${img.originalUrl} (alt: "${img.altText}")`);
  });
  console.log();
  
  // 测试生成文件名
  console.log('2. 测试生成本地文件名:');
  images.forEach((img, index) => {
    const fileName = downloader.generateLocalFileName(img.originalUrl, index, img.type);
    console.log(`  ${img.originalUrl.substring(0, 50)}... -> ${fileName}`);
  });
  console.log();
  
  // 测试处理Markdown（不实际下载）
  console.log('3. 测试Markdown处理（模拟）:');
  const testDir = path.join(__dirname, 'test-output');
  const testFileName = 'test-article.md';
  
  try {
    // 注意：这里会实际尝试下载图片，如果网络不通可能会失败
    const result = await downloader.processMarkdownImages(testMarkdown, testDir, testFileName);
    console.log('处理结果:');
    console.log(result);
  } catch (error) {
    console.error('处理失败:', error.message);
  }
}

// 运行测试
if (require.main === module) {
  testResourceDownloader().catch(console.error);
}

module.exports = { testResourceDownloader };