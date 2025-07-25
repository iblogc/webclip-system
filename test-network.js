const { NetworkHelper } = require('./client/network-helper');

// 测试配置
const testConfig = {
  proxy: {
    http_proxy: "http://127.0.0.1:1080",
    https_proxy: "http://127.0.0.1:1080"
  }
};

async function testNetworkRetry() {
  console.log('🧪 开始测试网络重试机制...\n');
  
  const networkHelper = new NetworkHelper(testConfig);
  
  // 测试1: 测试可访问的URL
  console.log('1. 测试可访问的URL (httpbin.org):');
  try {
    const response = await networkHelper.get('https://httpbin.org/get', {
      timeout: 5000
    });
    console.log(`✅ 请求成功，状态码: ${response.status}`);
    console.log(`📊 响应数据: ${JSON.stringify(response.data.headers['User-Agent'])}\n`);
  } catch (error) {
    console.error(`❌ 请求失败: ${error.message}\n`);
  }
  
  // 测试2: 测试不存在的域名（会触发重试）
  console.log('2. 测试不存在的域名 (触发重试):');
  try {
    const response = await networkHelper.get('https://nonexistent-domain-12345.com', {
      timeout: 3000
    });
    console.log(`✅ 请求成功: ${response.status}\n`);
  } catch (error) {
    console.error(`❌ 所有重试都失败: ${error.message}\n`);
  }
  
  // 测试3: 测试POST请求
  console.log('3. 测试POST请求:');
  try {
    const testData = { test: 'data', timestamp: new Date().toISOString() };
    const response = await networkHelper.post('https://httpbin.org/post', testData, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ POST请求成功，状态码: ${response.status}`);
    console.log(`📊 服务器收到的数据: ${JSON.stringify(response.data.json)}\n`);
  } catch (error) {
    console.error(`❌ POST请求失败: ${error.message}\n`);
  }
  
  // 测试4: 测试OpenAI配置生成
  console.log('4. 测试OpenAI配置生成:');
  const openaiConfigs = networkHelper.createOpenAIConfig({
    apiKey: 'test-key',
    baseURL: 'https://api.openai.com/v1'
  });
  
  console.log(`生成了 ${openaiConfigs.length} 个配置:`);
  openaiConfigs.forEach((config, index) => {
    console.log(`  配置 ${index + 1}: ${config.useProxy ? '代理模式' : '直连模式'}`);
  });
  
  console.log('\n🏁 网络重试机制测试完成');
}

// 运行测试
if (require.main === module) {
  testNetworkRetry().catch(console.error);
}

module.exports = { testNetworkRetry };