# AI服务配置指南

本系统支持多种AI服务提供商，通过配置不同的`base_url`可以使用各种兼容OpenAI API的服务。

## 🤖 支持的AI服务

### 1. OpenAI 官方API

```json
{
  "type": "openai",
  "api_key": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "model": "gpt-3.5-turbo",
  "base_url": "https://api.openai.com/v1"
}
```

**获取方式**：
1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 创建API密钥
3. 支持模型：`gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo`等

### 2. Google Gemini

```json
{
  "type": "gemini",
  "api_key": "AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "model": "gemini-pro",
  "base_url": "https://generativelanguage.googleapis.com"
}
```

**获取方式**：
1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 创建API密钥
3. 支持模型：`gemini-pro`, `gemini-pro-vision`

### 3. DeepSeek API

```json
{
  "type": "openai",
  "api_key": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "model": "deepseek-chat",
  "base_url": "https://api.deepseek.com/v1"
}
```

**获取方式**：
1. 访问 [DeepSeek Platform](https://platform.deepseek.com/)
2. 注册并获取API密钥
3. 支持模型：`deepseek-chat`, `deepseek-coder`

### 4. 阿里云通义千问

```json
{
  "type": "openai",
  "api_key": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "model": "qwen-turbo",
  "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1"
}
```

**获取方式**：
1. 访问 [阿里云DashScope](https://dashscope.console.aliyun.com/)
2. 开通服务并获取API密钥
3. 支持模型：`qwen-turbo`, `qwen-plus`, `qwen-max`

### 5. 智谱AI (ChatGLM)

```json
{
  "type": "openai",
  "api_key": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxx",
  "model": "glm-4",
  "base_url": "https://open.bigmodel.cn/api/paas/v4"
}
```

**获取方式**：
1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册并获取API密钥
3. 支持模型：`glm-4`, `glm-3-turbo`

### 6. 月之暗面 Kimi

```json
{
  "type": "openai",
  "api_key": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "model": "moonshot-v1-8k",
  "base_url": "https://api.moonshot.cn/v1"
}
```

**获取方式**：
1. 访问 [Kimi开放平台](https://platform.moonshot.cn/)
2. 注册并获取API密钥
3. 支持模型：`moonshot-v1-8k`, `moonshot-v1-32k`, `moonshot-v1-128k`

### 7. 本地部署模型 (Ollama)

```json
{
  "type": "openai",
  "api_key": "ollama",
  "model": "llama2",
  "base_url": "http://localhost:11434/v1"
}
```

**设置方式**：
1. 安装 [Ollama](https://ollama.ai/)
2. 下载模型：`ollama pull llama2`
3. 启动服务：`ollama serve`
4. 支持模型：`llama2`, `codellama`, `mistral`等

### 8. 代理服务

如果你使用代理服务访问OpenAI API：

```json
{
  "type": "openai",
  "api_key": "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "model": "gpt-3.5-turbo",
  "base_url": "https://your-proxy-domain.com/v1"
}
```

## 🔧 多提供商配置示例

```json
{
  "ai": {
    "providers": [
      {
        "type": "openai",
        "api_key": "sk-...",
        "model": "gpt-3.5-turbo",
        "base_url": "https://api.openai.com/v1",
        "comment": "OpenAI官方API - 主要服务"
      },
      {
        "type": "openai",
        "api_key": "sk-...",
        "model": "deepseek-chat",
        "base_url": "https://api.deepseek.com/v1",
        "comment": "DeepSeek API - 备用服务"
      },
      {
        "type": "gemini",
        "api_key": "AIza...",
        "model": "gemini-pro",
        "base_url": "https://generativelanguage.googleapis.com",
        "comment": "Google Gemini - 备用服务"
      },
      {
        "type": "openai",
        "api_key": "ollama",
        "model": "llama2",
        "base_url": "http://localhost:11434/v1",
        "comment": "本地Ollama - 离线服务"
      }
    ]
  }
}
```

## 🚀 故障转移机制

系统会按照配置顺序依次尝试每个AI提供商：

1. **第一个提供商失败** → 自动切换到第二个
2. **第二个提供商失败** → 自动切换到第三个
3. **所有提供商都失败** → 跳过AI摘要，继续处理其他内容

## 💡 使用建议

### 成本优化
1. **主要服务**：使用性价比高的服务（如DeepSeek）
2. **备用服务**：配置免费或低成本的服务
3. **本地服务**：配置Ollama作为离线备用

### 性能优化
1. **快速服务**：优先配置响应快的服务
2. **稳定服务**：选择稳定性好的服务商
3. **地理位置**：选择地理位置近的服务

### 安全考虑
1. **API密钥管理**：定期轮换API密钥
2. **网络安全**：使用HTTPS连接
3. **数据隐私**：了解各服务商的数据处理政策

## 🔍 测试配置

使用以下命令测试AI配置：

```bash
# 测试所有AI提供商
npm test

# 手动测试特定配置
node -e "
const { summarizeContent } = require('./client/summarize');
const config = require('./config/config.json');
summarizeContent('测试内容', config.ai).then(console.log);
"
```

## ❓ 常见问题

### Q: 如何选择合适的模型？
A: 
- **摘要任务**：推荐使用`gpt-3.5-turbo`、`deepseek-chat`
- **成本考虑**：DeepSeek和通义千问性价比较高
- **离线需求**：使用Ollama本地部署

### Q: API调用失败怎么办？
A:
1. 检查API密钥是否正确
2. 确认账户余额充足
3. 验证base_url是否正确
4. 查看网络连接状态

### Q: 如何提高成功率？
A:
1. 配置多个提供商
2. 设置合理的超时时间
3. 选择稳定的服务商
4. 定期检查服务状态

---

*选择合适的AI服务，让你的知识收藏更智能！* 🤖✨