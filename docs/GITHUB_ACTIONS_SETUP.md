# GitHub Actions 部署指南

本指南将帮助你将Web收藏系统部署到GitHub Actions，实现完全在线运行。

## 🏗️ 架构概述

```
浏览器收藏 → GitHub Gist → GitHub Actions → 处理 → 推送到私有仓库
     ↓              ↓              ↓           ↓         ↓
  油猴脚本      队列存储        定时触发      转换处理    结果存储
```

## 📋 部署步骤

### 1. 准备仓库

**公开仓库**（运行Actions）：
- Fork或创建此项目的公开仓库
- 用于运行GitHub Actions工作流

**私有仓库**（存储结果）：
- 创建私有仓库存储处理后的Markdown文件
- 例如：`username/my-knowledge-base`

### 2. 配置GitHub Secrets

在公开仓库的Settings > Secrets and variables > Actions中添加以下Secrets：

#### 必需配置
```
GIST_ID=your-gist-id-here
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TARGET_REPO=username/my-knowledge-base
TARGET_REPO_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### AI服务配置（至少配置一个）
```
# OpenAI配置（支持多个API密钥，逗号分隔）
OPENAI_API_KEY=sk-key1,sk-key2,sk-key3
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_BASE_URL=https://api.openai.com/v1

# Gemini配置（支持多个API密钥，逗号分隔）
GEMINI_API_KEY=AIzaSy-key1,AIzaSy-key2
GEMINI_MODEL=gemini-2.0-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com

# 自定义AI配置（JSON格式）
CUSTOM_AI_CONFIG=[{"type":"openai","api_key":"sk-xxx","model":"gpt-4","base_url":"https://api.deepseek.com/v1","name":"deepseek"}]
```

### GitHub Secrets 详细配置

#### 必需配置
```
Name: GIST_ID
Secret: 99cf68d262106d70a44d224f95642139

Name: GITHUB_TOKEN  
Secret: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Name: TARGET_REPO
Secret: username/my-knowledge-base

Name: TARGET_REPO_TOKEN
Secret: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### AI服务配置（选择一个或多个）
```
# OpenAI配置（支持多个API密钥，逗号分隔）
Name: OPENAI_API_KEY
Secret: sk-key1,sk-key2,sk-key3

Name: OPENAI_MODEL
Secret: gpt-3.5-turbo

Name: OPENAI_BASE_URL
Secret: https://api.openai.com/v1

# Gemini配置（支持多个API密钥，逗号分隔）
Name: GEMINI_API_KEY  
Secret: AIzaSy-key1,AIzaSy-key2

Name: GEMINI_MODEL
Secret: gemini-2.0-flash

Name: GEMINI_BASE_URL
Secret: https://generativelanguage.googleapis.com

# 自定义AI配置（JSON格式，可配置多个不同服务）
Name: CUSTOM_AI_CONFIG
Secret: [{"type":"openai","api_key":"sk-xxx","model":"gpt-4","base_url":"https://api.deepseek.com/v1","name":"deepseek"},{"type":"openai","api_key":"sk-yyy","model":"qwen-turbo","base_url":"https://dashscope.aliyuncs.com/compatible-mode/v1","name":"qwen"}]
```

#### 可选配置
```
Name: CRON_EXPRESSION
Secret: */15 * * * *

Name: ENABLE_AI_SUMMARY
Secret: true

Name: ENABLE_RESOURCE_DOWNLOAD
Secret: true

# 代理配置（如需要）
Name: HTTP_PROXY
Secret: http://127.0.0.1:7890

Name: HTTPS_PROXY
Secret: http://127.0.0.1:7890
```

#### 邮件通知配置（可选）
```
Name: NOTIFICATION_EMAIL
Secret: your-email@example.com

Name: EMAIL_SMTP_HOST
Secret: smtp.gmail.com

Name: EMAIL_SMTP_PORT
Secret: 587

Name: EMAIL_USER
Secret: your-email@gmail.com

Name: EMAIL_PASS
Secret: your-app-password
```

#### 可选配置
```
# 代理设置（如需要）
HTTP_PROXY=http://proxy.example.com:8080
HTTPS_PROXY=http://proxy.example.com:8080

# 邮件通知
NOTIFICATION_EMAIL=your-email@example.com
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# 功能开关
ENABLE_AI_SUMMARY=true
ENABLE_RESOURCE_DOWNLOAD=true

# 定时设置
CRON_EXPRESSION=*/15 * * * *
```

### 3. Token权限配置

**GITHUB_TOKEN**（用于访问Gist）：
- 权限：`gist`, `repo`（如果Gist在私有仓库中）

**TARGET_REPO_TOKEN**（用于推送到目标仓库）：
- 权限：`repo`
- 必须有目标仓库的写入权限

### 4. 邮件通知配置

#### Gmail配置示例
```
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # 使用应用专用密码
```

#### 其他邮件服务
- **Outlook**: `smtp-mail.outlook.com:587`
- **QQ邮箱**: `smtp.qq.com:587`
- **163邮箱**: `smtp.163.com:587`

### 5. 定时配置

通过`CRON_EXPRESSION`控制运行频率：

```bash
# 每10分钟
*/10 * * * *

# 每30分钟
*/30 * * * *

# 每小时
0 * * * *

# 每天上午9点
0 9 * * *

# 工作日每2小时
0 */2 * * 1-5
```

## 🚀 启用工作流

1. 推送代码到公开仓库
2. 进入Actions页面
3. 启用"Web Clip Processor"工作流
4. 可以手动触发测试

## 📊 监控和管理

### 查看运行状态
- 访问仓库的Actions页面
- 查看工作流运行历史
- 检查日志输出

### 手动触发
- 在Actions页面点击"Run workflow"
- 可以强制运行或测试自定义cron表达式

### 邮件通知
- 每次运行后会发送邮件通知
- 包含处理统计和详细日志
- 成功和失败都会通知

## 🔧 故障排除

### 常见问题

1. **Token权限不足**
   ```
   Error: Resource not accessible by integration
   ```
   解决：检查Token权限，确保包含必要的scope

2. **Puppeteer启动失败**
   ```
   Error: Failed to launch the browser process
   ```
   解决：Actions环境已配置Chrome，通常不会出现此问题

3. **推送到目标仓库失败**
   ```
   Error: Permission denied
   ```
   解决：检查TARGET_REPO_TOKEN权限和仓库名称

4. **邮件发送失败**
   ```
   Error: Invalid login
   ```
   解决：检查邮箱配置，Gmail需要使用应用专用密码

### 调试技巧

1. **查看详细日志**
   - Actions页面展开每个步骤
   - 下载artifacts查看错误日志

2. **测试配置**
   - 手动触发工作流测试
   - 检查Secrets配置是否正确

3. **本地测试**
   - 使用相同的环境变量本地运行
   - 验证配置文件生成是否正确

## 💰 成本考虑

### 免费额度
- 公开仓库：无限制使用GitHub Actions
- 私有仓库：每月2000分钟免费额度

### 优化建议
- 调整运行频率（15-30分钟一次）
- 及时清理旧的运行记录
- 监控使用量避免超额

## 🔐 安全最佳实践

1. **敏感信息保护**
   - 所有密钥使用GitHub Secrets
   - 不在代码中硬编码任何敏感信息

2. **权限最小化**
   - Token只授予必要权限
   - 定期轮换API密钥

3. **仓库安全**
   - 公开仓库不包含敏感信息
   - 私有仓库存储个人数据

## 📈 扩展功能

系统支持自定义处理逻辑、集成其他服务和添加监控统计功能。详见项目代码中的相关模块。

## 🆘 获取帮助

如果遇到问题：
1. 查看Actions运行日志
2. 检查配置是否正确
3. 参考故障排除部分
4. 提交Issue获取帮助

---

*享受你的云端知识收藏之旅！* ☁️📚