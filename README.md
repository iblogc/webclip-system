# Web 收藏转 Markdown 系统

一个轻量化的网页收藏系统，支持一键收藏网页并自动转换为结构化的 Markdown 文件，包含 AI 摘要和标签。

## ✨ 特性

- 🌐 **浏览器一键收藏**: 通过油猴脚本在任何网页上一键收藏
- 📝 **自动 Markdown 转换**: 使用 Puppeteer + Readability 提取正文内容
- 🤖 **AI 智能摘要**: 支持多种 AI 服务生成摘要和标签，支持 API 密钥轮换（可开关）
- 📷 **图片资源下载**: 自动下载网络图片和转换 base64 图片为本地文件
- ⚡ **智能预检查**: 自动检测待处理内容，空队列时跳过处理节省资源
- 🌐 **代理支持**: AI 调用和图片下载支持 HTTP 代理
- 📁 **分类管理**: 按分类自动整理文件
- 🔄 **Git 自动同步**: 自动提交并推送到 GitHub 仓库
- ⏰ **定时处理**: 支持 macOS 和 Windows 定时任务

## 🚀 快速开始

### 部署方式选择

**方式一：GitHub Actions部署（推荐）**
- ✅ 完全在线运行，无需本地环境
- ✅ 自动定时处理，无需手动维护
- ✅ 免费使用（公开仓库）
- ✅ 智能预检查，空内容时自动跳过节省资源
- ✅ 支持邮件通知和自动清理

**方式二：本地部署**
- 需要本地Node.js环境
- 需要配置定时任务
- 适合高度自定义需求

### GitHub Actions部署（推荐）

#### 🏗️ 架构概述

```
浏览器收藏 → GitHub Gist → GitHub Actions → 处理 → 推送到私有仓库
     ↓              ↓              ↓           ↓         ↓
  油猴脚本      队列存储    预检查+定时触发   转换处理    结果存储
```

#### ⚡ 性能优化

系统包含智能预检查机制，在Actions早期检查Gist内容：
- 📭 **空内容跳过**：如果Gist为空或无待处理内容，直接跳过处理，节省资源
- 🔍 **快速检查**：仅需几秒钟即可判断是否需要完整处理流程
- 💰 **成本节约**：避免不必要的Chrome启动、依赖安装等耗时操作
- 🚀 **强制运行**：支持手动触发时强制运行，无视内容检查

#### 📋 部署步骤

**1. 准备仓库**

**公开仓库**（运行Actions）：
- Fork或创建此项目的公开仓库
- 用于运行GitHub Actions工作流

**私有仓库**（存储结果）：
- 创建私有仓库存储处理后的Markdown文件
- 例如：`username/my-knowledge-base`

**2. 配置GitHub Secrets**

在公开仓库的Settings > Secrets and variables > Actions中添加以下Secrets：

**必需配置**：
```
GIST_ID                 # GitHub Gist ID
TOKEN                   # GitHub访问令牌
TARGET_REPO            # 目标私有仓库 (username/repo-name)
```

**AI服务配置**（至少配置一个）：
```
# OpenAI（支持多个API密钥，逗号分隔）
OPENAI_API_KEY         # sk-key1,sk-key2,sk-key3
OPENAI_MODEL           # gpt-3.5-turbo (可选)
OPENAI_BASE_URL        # https://api.openai.com/v1 (可选)

# Gemini（支持多个API密钥，逗号分隔）
GEMINI_API_KEY         # AIzaSy-key1,AIzaSy-key2
GEMINI_MODEL           # gemini-2.0-flash (可选)
GEMINI_BASE_URL        # https://generativelanguage.googleapis.com (可选)

# Claude（支持多个API密钥，逗号分隔）
CLAUDE_API_KEY         # sk-ant-key1,sk-ant-key2
CLAUDE_MODEL           # claude-3-sonnet-20240229 (可选)
CLAUDE_BASE_URL        # https://api.anthropic.com (可选)
```

**可选配置**：
```
ENABLE_AI_SUMMARY      # true/false (启用AI摘要)
ENABLE_RESOURCE_DOWNLOAD # true/false (启用资源下载)
HTTP_PROXY             # 代理设置
HTTPS_PROXY            # 代理设置
NOTIFICATION_EMAIL     # 邮件通知
EMAIL_SMTP_HOST        # 邮件服务器
EMAIL_SMTP_PORT        # 邮件端口
EMAIL_USER             # 邮件用户名
EMAIL_PASS             # 邮件密码
```

**3. Token权限配置**

**TOKEN**（用于访问Gist）：
- 权限：`gist`, 目标仓库的写入权限,当前仓库 Actions 读写权限

**4. 邮件通知配置**

**Gmail配置示例**：
```
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # 使用应用专用密码
```

**其他邮件服务**：
- **Outlook**: `smtp-mail.outlook.com:587`
- **QQ邮箱**: `smtp.qq.com:587`
- **163邮箱**: `smtp.163.com:587`

**5. 启用工作流**

1. 推送代码到公开仓库
2. 进入Actions页面
3. 启用"Web Clip Processor"工作流
4. 可以手动触发测试

### 本地部署

#### 1. 安装依赖

```bash
npm install

# 安装Chrome浏览器（Puppeteer需要）
npx puppeteer browsers install chrome
```

#### 2. 配置系统

编辑 `config/config.json` 文件：

```json
{
  "gist_id": "你的Gist ID",
  "github_token": "你的GitHub Token",
  "output_dir": "~/Documents/KnowledgeRepo",
  "proxy": {
    "http_proxy": "http://127.0.0.1:7890",
    "https_proxy": "http://127.0.0.1:7890"
  },
  "ai": {
    "providers": [
      {
        "type": "openai",
        "api_key": "你的OpenAI API Key",
        "model": "gpt-3.5-turbo",
        "base_url": "https://api.openai.com/v1"
      }
    ]
  },
  "features": {
    "ai_summary": true,
    "download_resources": true
  },
  "resources": {
    "download_images": true,
    "download_timeout": 10,
    "max_file_size_mb": 10,
    "allowed_extensions": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    "assets_folder": "assets"
  }
}
```

**支持的 AI 服务**：

- OpenAI 官方 API
- DeepSeek API
- 阿里云通义千问
- 月之暗面 Kimi
- 智谱 AI
- 百川 AI
- Claude API
- 本地部署模型（Ollama 等）
- 任何兼容 OpenAI API 的服务

#### 3. 运行设置向导

```bash
node setup.js
```

设置向导会帮你：
- 检查依赖项
- 验证配置文件
- 初始化 Git 仓库
- 设置定时任务

## 📱 浏览器脚本安装

### 🔧 最新功能

最新版本的油猴脚本支持以下功能：

- ✅ **完全可配置化**: 无需修改代码，通过 UI 界面配置
- ✅ **智能初始化**: 首次使用显示配置界面
- ✅ **右键配置**: 右键点击按钮快速打开配置
- ✅ **实时生效**: 配置修改立即生效
- ✅ **数据持久化**: 配置自动保存到本地
- ✅ **界面自定义**: 按钮位置、大小、颜色可调
- ✅ **行为控制**: 通知、聚焦等行为可开关

### 📦 安装步骤

**1. 安装 Tampermonkey 扩展**

根据你的浏览器选择对应的扩展：

- **Chrome**: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- **Edge**: [Microsoft Store](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
- **Safari**: [App Store](https://apps.apple.com/us/app/tampermonkey/id1482490089)

**2. 配置 GitHub**

**创建 GitHub Token**：
1. 访问 [GitHub Settings > Developer settings > Personal access tokens > Fine-grained tokens](https://github.com/settings/personal-access-tokens)
2. 点击 "Generate new token"
3. Only select repositories，选择当前仓库和md存储仓库
4. 选择权限：
   仓库权限
   - ✅ Actions: Read and write
   - ✅ Contents: Read and write
    账户权限
   - ✅ Gists: Read and write
5. 复制生成的 token（格式：`github_pat_xxxxxxx`）

**创建 GitHub Gist**：
1. 访问 [https://gist.github.com](https://gist.github.com)
2. 创建新的**私有**Gist
3. 文件名：`webclip-queue.json`
4. 内容：
   ```json
   { "items": [] }
   ```
5. 点击 "Create secret gist"
6. 复制 URL 中的 Gist ID（格式：`https://gist.github.com/username/GIST_ID`）

**3. 安装脚本**

1. 打开 `oilmonkey/clip-to-gist.user.js` 文件
2. 复制全部内容到 Tampermonkey
3. 保存脚本
4. 访问任意网页，点击 ⚙️ 配置按钮
5. 填写 Gist ID 和 GitHub Token
6. 完成配置后开始使用

**特性**：
- 🎛️ **可视化配置**: 无需修改代码，通过界面配置
- 🎨 **界面自定义**: 按钮位置、大小、颜色可调
- ⚙️ **右键配置**: 右键点击按钮快速打开设置

## 📝 开始使用

1. 在任何网页上点击右下角的 📌 按钮
2. 填写分类和备注信息
3. 点击"确认收藏"
4. 系统会自动处理并生成 Markdown 文件

## 🤖 AI 服务配置

### 🎯 功能特点

- ✅ **多API密钥支持**：每个服务可配置多个API密钥，自动轮换使用
- ✅ **自定义模型**：支持配置不同的模型和API端点
- ✅ **故障转移**：API密钥失败时自动切换到下一个
- ✅ **灵活配置**：支持OpenAI兼容的各种服务

### 🔧 支持的AI服务

**OpenAI官方**：
```json
{
  "type": "openai",
  "api_key": "sk-xxx",
  "model": "gpt-4",
  "base_url": "https://api.openai.com/v1"
}
```

**DeepSeek**：
```json
{
  "type": "openai",
  "api_key": "sk-xxx",
  "model": "deepseek-chat",
  "base_url": "https://api.deepseek.com/v1"
}
```

**阿里云通义千问**：
```json
{
  "type": "openai", 
  "api_key": "sk-xxx",
  "model": "qwen-turbo",
  "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1"
}
```

**月之暗面Kimi**：
```json
{
  "type": "openai",
  "api_key": "sk-xxx", 
  "model": "moonshot-v1-8k",
  "base_url": "https://api.moonshot.cn/v1"
}
```

**智谱AI**：
```json
{
  "type": "openai",
  "api_key": "xxx",
  "model": "glm-4",
  "base_url": "https://open.bigmodel.cn/api/paas/v4"
}
```

**百川AI**：
```json
{
  "type": "openai",
  "api_key": "sk-xxx",
  "model": "Baichuan2-Turbo",
  "base_url": "https://api.baichuan-ai.com/v1"
}
```

**Claude**：
```json
{
  "type": "claude",
  "api_key": "sk-ant-xxx",
  "model": "claude-3-sonnet-20240229",
  "base_url": "https://api.anthropic.com"
}
```

### 🔄 API密钥轮换机制

系统会按照以下顺序尝试API密钥：

1. **顺序轮换**：按配置顺序依次尝试每个API密钥
2. **故障转移**：当前密钥失败时自动切换到下一个
3. **服务切换**：所有密钥都失败时切换到下一个AI服务
4. **错误处理**：记录失败原因，便于调试

**示例配置效果**：

配置：
```bash
OPENAI_API_KEY=sk-key1,sk-key2,sk-key3
GEMINI_API_KEY=AIzaSy-key1,AIzaSy-key2
CLAUDE_API_KEY=sk-ant-key1,sk-ant-key2
```

生成的提供商列表：
1. openai-1 (gpt-3.5-turbo) - sk-key1
2. openai-2 (gpt-3.5-turbo) - sk-key2  
3. openai-3 (gpt-3.5-turbo) - sk-key3
4. gemini-1 (gemini-2.0-flash) - AIzaSy-key1
5. gemini-2 (gemini-2.0-flash) - AIzaSy-key2
6. claude-1 (claude-3-sonnet-20240229) - sk-ant-key1
7. claude-2 (claude-3-sonnet-20240229) - sk-ant-key2

### 🔧 配置选项

**强制运行**：

当需要测试或调试时，可以强制跳过预检查：

1. 进入GitHub仓库的Actions页面
2. 点击"Run workflow"
3. 设置`force_run`为`true`
4. 点击"Run workflow"

**预检查逻辑**：

系统专门检查`webclip-queue.json`文件，会跳过以下情况：
- 文件不存在或内容为空
- JSON解析失败
- 没有`items`数组
- `items`数组为空（`[]`）

**检查流程**：
1. 查找`webclip-queue.json`文件
2. 解析JSON内容
3. 检查`items`数组长度
4. 返回待处理项目数量和预览信息

## 📊 监控和管理

### 查看运行状态
- 访问仓库的Actions页面
- 查看工作流运行历史
- 检查日志输出

### 手动触发
- 在Actions页面点击"Run workflow"
- 可以强制运行或测试自定义cron表达式
- **强制运行**：设置`force_run`为`true`可跳过内容检查，强制执行完整流程

### 邮件通知
- 每次运行后会发送邮件通知
- 包含处理统计和详细日志
- 成功、失败和跳过都会通知
- **跳过通知**：当Gist内容为空时，会发送简短的跳过通知

## 📂 项目结构

```
webclip-system/
├── oilmonkey/              # 浏览器脚本
│   └── clip-to-gist.user.js
├── config/                 # 配置文件
│   └── config.json
├── .github/workflows/      # GitHub Actions工作流
│   └── webclip-processor.yml
├── scripts/                # Actions脚本
│   ├── setup-config.js     # 动态配置生成
│   ├── actions-processor.js # Actions处理器
│   ├── push-to-target.js   # 推送到目标仓库
│   ├── send-notification.js # 邮件通知
│   └── cleanup-workflows.js # 清理旧工作流
├── client/                 # 客户端处理器
│   ├── process_gist.js     # 主处理程序
│   ├── summarize.js        # AI摘要模块
│   ├── markdown-builder.js # Markdown构建器
│   ├── resource-downloader.js # 资源下载模块
│   ├── network-helper.js   # 网络请求助手
│   └── git-sync.js         # Git同步模块
├── launchd/               # macOS定时任务
│   └── com.webclip.processor.plist
├── setup.js               # 设置向导
└── README.md
```

## 📄 生成的 Markdown 格式

```markdown
---
title: 网页标题
url: https://example.com
created: 2025-07-25T15:22:00Z
category: 阅读
note: 可选备注
tags: [标签1, 标签2, 标签3]
summary: |
  AI自动摘要内容
---

## 正文内容

网页的主要内容...
```

## 🛠️ 手动运行

如果不想使用定时任务，可以手动运行：

```bash
# 处理一次队列
node client/process_gist.js

# 或者持续运行
npm start
```

## 🐛 故障排除

### 常见问题

**1. Token权限不足**
```
Error: Resource not accessible by integration
```
解决：检查Token权限，确保包含必要的scope

**2. Puppeteer启动失败**
```
Error: Failed to launch the browser process
```
解决：Actions环境已配置Chrome，通常不会出现此问题

**3. 推送到目标仓库失败**
```
Error: Permission denied
```
解决：检查TARGET_REPO_TOKEN权限和仓库名称

**4. 邮件发送失败**
```
Error: Invalid login
```
解决：检查邮箱配置，Gmail需要使用应用专用密码

**5. API密钥格式错误**
```
Error: Invalid API key format
```
解决：检查密钥格式，确保没有多余空格

**6. 所有密钥都失败**
```
Error: 所有AI提供商都失败了
```
解决：检查密钥有效性和余额

### 调试技巧

**1. 查看详细日志**
- Actions页面展开每个步骤
- 下载artifacts查看错误日志

**2. 测试配置**
- 手动触发工作流测试
- 检查Secrets配置是否正确

**3. 本地测试**
- 使用相同的环境变量本地运行
- 验证配置文件生成是否正确

**4. 预检查调试**

本地测试预检查：
```bash
# 设置环境变量
export GIST_ID=your-gist-id
export TOKEN=your-token

# 运行测试
node scripts/test-gist-check.js
```

## 🎉 项目亮点

1. **完全云端化**: 基于GitHub Actions，无需本地环境
2. **高可用性**: 多AI服务商、多API密钥轮换
3. **智能网络**: 代理自动切换，网络适应性强
4. **用户友好**: 可视化配置，一键部署
5. **功能完整**: 从收藏到处理到存储的完整链路
6. **扩展性强**: 支持自定义AI服务和处理逻辑

## 📈 使用场景

- **知识管理**: 收藏文章并自动生成摘要和标签
- **内容归档**: 将网页内容转为本地Markdown文件
- **团队协作**: 共享知识库，统一格式管理
- **研究工作**: 快速收集和整理研究资料

## 🔮 未来扩展

/

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

如果你有优化想法，欢迎：
1. 提交Issue讨论
2. 创建Pull Request
3. 分享使用经验和数据

---

_享受你的知识收藏之旅！_ 📚✨