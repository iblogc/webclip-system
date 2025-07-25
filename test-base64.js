const { ResourceDownloader } = require('./client/resource-downloader');
const path = require('path');

// 测试配置
const testConfig = {
  proxy: {
    http_proxy: "http://127.0.0.1:7890",
    https_proxy: "http://127.0.0.1:7890"
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

// 测试用的base64图片（不同格式）
const testMarkdownWithBase64 = `# Base64图片测试

## PNG格式
![PNG图片](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==)

## JPEG格式
![JPEG图片](data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==)

## GIF格式
![GIF图片](data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7)

## WebP格式（如果支持）
![WebP图片](data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA)

## 混合测试
![HTTP图片](https://via.placeholder.com/100x100.png)
![Base64图片](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==)
![本地图片](./local.png)

结束测试。
`;

async function testBase64Processing() {
  console.log('🧪 开始测试Base64图片处理功能...\n');
  
  const downloader = new ResourceDownloader(testConfig);
  
  // 测试1: 提取不同格式的base64图片
  console.log('1. 测试提取不同格式的图片:');
  const images = downloader.extractImageUrls(testMarkdownWithBase64);
  
  const urlImages = images.filter(img => img.type === 'url');
  const base64Images = images.filter(img => img.type === 'base64');
  
  console.log(`总共发现 ${images.length} 张图片:`);
  console.log(`  HTTP URL: ${urlImages.length} 张`);
  console.log(`  Base64: ${base64Images.length} 张`);
  
  console.log('\nBase64图片详情:');
  base64Images.forEach((img, index) => {
    const mimeMatch = img.originalUrl.match(/^data:image\/([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : '未知';
    console.log(`  ${index + 1}. ${mimeType.toUpperCase()} 格式 (alt: "${img.altText}")`);
  });
  
  // 测试2: 生成文件名
  console.log('\n2. 测试文件名生成:');
  images.forEach((img, index) => {
    const fileName = downloader.generateLocalFileName(img.originalUrl, index, img.type);
    const urlPreview = img.type === 'base64' ? `base64-${img.altText}` : img.originalUrl;
    console.log(`  ${urlPreview} -> ${fileName}`);
  });
  
  // 测试3: 实际处理
  console.log('\n3. 测试实际处理:');
  const testDir = path.join(__dirname, 'test-output');
  const testFileName = 'base64-test.md';
  
  try {
    const result = await downloader.processMarkdownImages(testMarkdownWithBase64, testDir, testFileName);
    
    console.log('\n处理结果预览:');
    const lines = result.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('![') && line.includes('](')) {
        console.log(`  第${index + 1}行: ${line.trim()}`);
      }
    });
    
    console.log('\n✅ Base64图片处理测试完成');
    
  } catch (error) {
    console.error('❌ 处理失败:', error.message);
  }
}

// 运行测试
if (require.main === module) {
  testBase64Processing().catch(console.error);
}

module.exports = { testBase64Processing };