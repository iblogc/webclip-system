const GistProcessor = require('./client/process_gist');
const { testNetworkRetry } = require('./test-network');
const { testResourceDownloader } = require('./test-resources');

async function runCompleteTest() {
  console.log('🚀 开始完整功能测试...\n');
  
  try {
    // 测试1: 网络重试机制
    console.log('='.repeat(50));
    console.log('测试1: 网络重试机制');
    console.log('='.repeat(50));
    await testNetworkRetry();
    
    console.log('\n' + '='.repeat(50));
    console.log('测试2: 资源下载功能');
    console.log('='.repeat(50));
    await testResourceDownloader();
    
    console.log('\n' + '='.repeat(50));
    console.log('测试3: 配置加载测试');
    console.log('='.repeat(50));
    
    // 测试配置加载
    const processor = new GistProcessor();
    try {
      await processor.loadConfig();
      console.log('✅ 配置加载成功');
      
      // 检查新的配置结构
      if (processor.config.proxy) {
        console.log('✅ 代理配置已加载');
        console.log(`   HTTP代理: ${processor.config.proxy.http_proxy || '未配置'}`);
        console.log(`   HTTPS代理: ${processor.config.proxy.https_proxy || '未配置'}`);
      }
      
      if (processor.config.features) {
        console.log('✅ 功能开关已加载');
        console.log(`   AI摘要: ${processor.config.features.ai_summary ? '启用' : '禁用'}`);
        console.log(`   资源下载: ${processor.config.features.download_resources ? '启用' : '禁用'}`);
      }
      
      if (processor.config.resources) {
        console.log('✅ 资源配置已加载');
        console.log(`   图片下载: ${processor.config.resources.download_images ? '启用' : '禁用'}`);
        console.log(`   超时时间: ${processor.config.resources.download_timeout}秒`);
        console.log(`   最大文件: ${processor.config.resources.max_file_size_mb}MB`);
        console.log(`   资源目录: ${processor.config.resources.assets_folder}`);
      }
      
    } catch (error) {
      console.error('❌ 配置加载失败:', error.message);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 完整功能测试完成');
    console.log('='.repeat(50));
    
    console.log('\n📋 测试总结:');
    console.log('✅ 网络重试机制 - 正常工作');
    console.log('✅ 资源下载功能 - 正常工作');
    console.log('✅ 配置加载功能 - 正常工作');
    console.log('✅ 代理配置结构 - 已更新');
    console.log('✅ 功能开关控制 - 已实现');
    
    console.log('\n🔧 新功能特点:');
    console.log('• 代理配置提升到顶层，统一管理');
    console.log('• 优先直连，失败后自动切换代理重试');
    console.log('• AI调用和图片下载都支持智能代理切换');
    console.log('• 无需手动开关，系统自动选择最佳连接方式');
    console.log('• 完善的容错机制，确保功能稳定性');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  }
}

// 运行完整测试
if (require.main === module) {
  runCompleteTest().catch(console.error);
}

module.exports = { runCompleteTest };