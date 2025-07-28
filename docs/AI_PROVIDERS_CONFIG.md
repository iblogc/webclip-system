# AI服务提供商配置指南

本文档详细说明如何配置多个AI服务提供商和API密钥轮换功能。

## 🎯 功能特点

- ✅ **多API密钥支持**：每个服务可配置多个API密钥，自动轮换使用
- ✅ **自定义模型**：支持配置不同的模型和API端点
- ✅ **故障转移**：API密钥失败时自动切换到下一个
- ✅ **灵活配置**：支持OpenAI兼容的各种服务

## 📋 配置方式

### 1. OpenAI配置

#### 单个API密钥
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_BASE_URL=https://api.openai.com/v1
```

#### 多个API密钥（推荐）
```bash
OPENAI_API_KEY=sk-key1,sk-key2,sk-key3
OPENAI_MODEL=gpt-4
OPENAI_BASE_URL=https://api.openai.com/v1
```

### 2. Gemini配置

#### 单个API密钥
```bash
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-2.0-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com
```

#### 多个API密钥（推荐）
```bash
GEMINI_API_KEY=AIzaSy-key1,AIzaSy-key2,AIzaSy-key3
GEMINI_MODEL=gemini-pro
GEMINI_BASE_URL=https://generativelanguage.googleapis.com
```

### 3. 自定义AI服务配置

使用`CUSTOM_AI_CONFIG`可以配置任何OpenAI兼容的服务：

```json
[
  {
    "type": "openai",
    "api_key": "sk-deepseek-key",
    "model": "deepseek-chat",
    "base_url": "https://api.deepseek.com/v1",
    "name": "deepseek"
  },
  {
    "type": "openai",
    "api_key": "sk-qwen-key",
    "model": "qwen-turbo", 
    "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    "name": "qwen"
  },
  {
    "type": "openai",
    "api_key": "sk-claude-key",
    "model": "claude-3-sonnet",
    "base_url": "https://api.anthropic.com/v1",
    "name": "claude"
  }
]
```

## 🔧 支持的AI服务

### OpenAI官方
```json
{
  "type": "openai",
  "api_key": "sk-xxx",
  "model": "gpt-4",
  "base_url": "https://api.openai.com/v1"
}
```

### DeepSeek
```json
{
  "type": "openai",
  "api_key": "sk-xxx",
  "model": "deepseek-chat",
  "base_url": "https://api.deepseek.com/v1"
}
```

### 阿里云通义千问
```json
{
  "type": "openai", 
  "api_key": "sk-xxx",
  "model": "qwen-turbo",
  "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1"
}
```

### 月之暗面Kimi
```json
{
  "type": "openai",
  "api_key": "sk-xxx", 
  "model": "moonshot-v1-8k",
  "base_url": "https://api.moonshot.cn/v1"
}
```

### 智谱AI
```json
{
  "type": "openai",
  "api_key": "xxx",
  "model": "glm-4",
  "base_url": "https://open.bigmodel.cn/api/paas/v4"
}
```

### 百川AI
```json
{
  "type": "openai",
  "api_key": "sk-xxx",
  "model": "Baichuan2-Turbo",
  "base_url": "https://api.baichuan-ai.com/v1"
}
```

## 🔄 API密钥轮换机制

系统会按照以下顺序尝试API密钥：

1. **顺序轮换**：按配置顺序依次尝试每个API密钥
2. **故障转移**：当前密钥失败时自动切换到下一个
3. **服务切换**：所有密钥都失败时切换到下一个AI服务
4. **错误处理**：记录失败原因，便于调试

### 示例配置效果

配置：
```bash
OPENAI_API_KEY=sk-key1,sk-key2,sk-key3
GEMINI_API_KEY=AIzaSy-key1,AIzaSy-key2
```

生成的提供商列表：
1. openai-1 (gpt-3.5-turbo) - sk-key1
2. openai-2 (gpt-3.5-turbo) - sk-key2  
3. openai-3 (gpt-3.5-turbo) - sk-key3
4. gemini-1 (gemini-2.0-flash) - AIzaSy-key1
5. gemini-2 (gemini-2.0-flash) - AIzaSy-key2

## 💡 最佳实践

- **API密钥管理**: 使用多个密钥提高可用性，定期轮换保证安全
- **服务选择**: 优先配置稳定服务，混合使用不同提供商
- **配置优化**: 最稳定服务放前面，配置备用服务防故障
- **监控调试**: 查看Actions日志，监控成功率，及时处理过期

## 🔐 安全注意事项

- **密钥保护**: 使用GitHub Secrets存储，不硬编码，定期轮换
- **权限控制**: 最小权限原则，限制使用范围，监控异常
- **访问控制**: 私有仓库保护，限制Actions权限，定期审查

## 🚨 故障排除

### 常见问题

1. **API密钥格式错误**
   ```
   Error: Invalid API key format
   ```
   解决：检查密钥格式，确保没有多余空格

2. **所有密钥都失败**
   ```
   Error: 所有AI提供商都失败了
   ```
   解决：检查密钥有效性和余额

3. **自定义配置解析失败**
   ```
   Error: 自定义AI配置解析失败
   ```
   解决：验证JSON格式是否正确

### 调试技巧

1. **查看详细日志**
   - Actions页面查看每个步骤的日志
   - 关注AI提供商的尝试顺序

2. **测试单个密钥**
   - 临时配置单个密钥测试
   - 确认服务可用性

3. **验证配置格式**
   - 使用JSON验证工具检查格式
   - 确保逗号分隔的密钥格式正确

---

通过合理配置多个AI服务和API密钥，可以大大提高系统的稳定性和可用性！