const fs = require("fs").promises;
const path = require("path");
const core = require("@actions/core");

async function setupConfig() {
  try {
    console.log("🔧 开始生成动态配置...");

    // 从环境变量读取配置
    const config = {
      gist_id: process.env.GIST_ID,
      github_token: process.env.TOKEN,
      target_repo: process.env.TARGET_REPO,
      target_repo_token: process.env.TOKEN,
      output_dir: "./temp/output",

      proxy: {
        http_proxy: process.env.HTTP_PROXY || "",
        https_proxy: process.env.HTTPS_PROXY || "",
      },

      ai: {
        providers: [],
      },

      features: {
        ai_summary: process.env.ENABLE_AI_SUMMARY !== "false",
        download_resources: process.env.ENABLE_RESOURCE_DOWNLOAD !== "false",
      },

      resources: {
        download_images: true,
        download_timeout: 30,
        max_file_size_mb: 10,
        allowed_extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
        assets_folder: "assets",
      },

      git: {
        auto_commit: false, // Actions中手动处理Git操作
        commit_message_template: "新增网页记录：{title}",
      },

      processing: {
        interval_minutes: 10,
        timeout_seconds: 60,
        max_retries: 3,
      },

      actions: {
        cron_expression: process.env.CRON_EXPRESSION || "*/10 * * * *",
        notification_email: process.env.NOTIFICATION_EMAIL,
        email_config: {
          smtp_host: process.env.EMAIL_SMTP_HOST,
          smtp_port: parseInt(process.env.EMAIL_SMTP_PORT) || 587,
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
    };

    // 配置AI提供商 - 支持多个API密钥
    if (process.env.OPENAI_API_KEY) {
      const apiKeys = process.env.OPENAI_API_KEY.split(",").map((key) =>
        key.trim()
      );
      const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
      const baseUrl =
        process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

      apiKeys.forEach((apiKey, index) => {
        config.ai.providers.push({
          type: "openai",
          api_key: apiKey,
          model: model,
          base_url: baseUrl,
          name: `openai-${index + 1}`,
        });
      });
    }

    if (process.env.GEMINI_API_KEY) {
      const apiKeys = process.env.GEMINI_API_KEY.split(",").map((key) =>
        key.trim()
      );
      const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
      const baseUrl =
        process.env.GEMINI_BASE_URL ||
        "https://generativelanguage.googleapis.com";

      apiKeys.forEach((apiKey, index) => {
        config.ai.providers.push({
          type: "gemini",
          api_key: apiKey,
          model: model,
          base_url: baseUrl,
          name: `gemini-${index + 1}`,
        });
      });
    }

    // 支持自定义AI提供商配置
    if (process.env.CUSTOM_AI_CONFIG) {
      try {
        const customConfigs = JSON.parse(process.env.CUSTOM_AI_CONFIG);
        if (Array.isArray(customConfigs)) {
          customConfigs.forEach((customConfig, index) => {
            if (customConfig.api_key && customConfig.type) {
              config.ai.providers.push({
                ...customConfig,
                name: customConfig.name || `custom-${index + 1}`,
              });
            }
          });
        }
      } catch (error) {
        console.warn("⚠️ 自定义AI配置解析失败:", error.message);
      }
    }

    // 验证必需配置
    const requiredFields = [
      "gist_id",
      "github_token",
      "target_repo",
      "target_repo_token",
    ];
    for (const field of requiredFields) {
      if (!config[field] && !config[field.replace("_", ".")]) {
        throw new Error(`缺少必需配置: ${field}`);
      }
    }

    // 创建必要目录
    await fs.mkdir("./temp", { recursive: true });
    await fs.mkdir("./temp/output", { recursive: true });
    await fs.mkdir("./logs", { recursive: true });

    // 写入配置文件
    const configPath = "./temp/config.json";
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));

    console.log("✅ 动态配置生成成功");
    console.log(`📁 配置文件路径: ${configPath}`);
    console.log(`🤖 AI提供商数量: ${config.ai.providers.length}`);
    console.log(
      `📧 邮件通知: ${config.actions.notification_email ? "启用" : "禁用"}`
    );
    console.log(`⏰ Cron表达式: ${config.actions.cron_expression}`);

    // 设置Actions输出
    core.setOutput("config-path", configPath);
    core.setOutput("ai-providers", config.ai.providers.length.toString());
  } catch (error) {
    console.error("❌ 配置生成失败:", error.message);
    core.setFailed(error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  setupConfig();
}

module.exports = { setupConfig };
