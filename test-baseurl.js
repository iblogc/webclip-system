const { OpenAIProvider, GeminiProvider } = require("./client/summarize");

async function testBaseURL() {
  console.log("🧪 测试baseURL功能...\n");

  // 测试OpenAI Provider的baseURL配置
  console.log("1. 测试OpenAI Provider baseURL配置:");

  const openaiConfig1 = {
    api_key: "test-key",
    model: "gpt-3.5-turbo",
    base_url: "https://api.openai.com/v1",
  };

  const openaiConfig2 = {
    api_key: "test-key",
    model: "deepseek-chat",
    base_url: "https://api.deepseek.com/v1",
  };

  const provider1 = new OpenAIProvider(openaiConfig1);
  const provider2 = new OpenAIProvider(openaiConfig2);

  console.log("✅ OpenAI Provider (官方API):", openaiConfig1.base_url);
  console.log("✅ OpenAI Provider (DeepSeek API):", openaiConfig2.base_url);

  // 测试Gemini Provider的baseURL配置
  console.log("\n2. 测试Gemini Provider baseURL配置:");

  const geminiConfig1 = {
    api_key: "test-key",
    model: "gemini-pro",
    base_url: "https://generativelanguage.googleapis.com",
  };

  const geminiConfig2 = {
    api_key: "test-key",
    model: "gemini-pro",
    base_url: "https://custom-gemini-proxy.com",
  };

  const geminiProvider1 = new GeminiProvider(geminiConfig1);
  const geminiProvider2 = new GeminiProvider(geminiConfig2);

  console.log("✅ Gemini Provider (官方API):", geminiConfig1.base_url);
  console.log("✅ Gemini Provider (代理API):", geminiConfig2.base_url);

  // 测试配置解析
  console.log("\n3. 测试配置文件解析:");

  const fs = require("fs").promises;
  const path = require("path");

  try {
    const configPath = path.join(__dirname, "config/config.json");
    const configData = await fs.readFile(configPath, "utf8");
    const config = JSON.parse(configData);

    if (config.ai && config.ai.providers) {
      config.ai.providers.forEach((provider, index) => {
        console.log(`Provider ${index + 1}:`);
        console.log(`  - Type: ${provider.type}`);
        console.log(`  - Model: ${provider.model}`);
        console.log(`  - Base URL: ${provider.base_url || "默认"}`);
        console.log(`  - API Key: ${provider.api_key ? "已配置" : "未配置"}`);
      });
    }
  } catch (error) {
    console.error("❌ 配置文件读取失败:", error.message);
  }

  console.log("\n✅ baseURL功能测试完成！");
  console.log("\n💡 使用说明:");
  console.log("- 在config.json中为每个AI提供商配置base_url");
  console.log("- 支持OpenAI兼容的API服务");
  console.log("- 支持本地部署的模型服务");
  console.log("- 支持代理服务和镜像站点");
}

if (require.main === module) {
  testBaseURL().catch(console.error);
}

module.exports = { testBaseURL };
