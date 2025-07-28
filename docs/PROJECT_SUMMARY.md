# Web收藏系统 - 项目总结

## 🎯 项目概述

Web收藏转Markdown系统是一个完整的网页收藏解决方案，支持从浏览器一键收藏到自动处理生成结构化Markdown文件的全流程。

## ✨ 核心功能

### 📱 浏览器端
- **油猴脚本**: 支持任意网页一键收藏
- **可视化配置**: 无需修改代码，界面化配置
- **快捷键支持**: Ctrl+Shift+S 快速收藏
- **多种触发方式**: 浮动按钮、右键菜单、快捷键

### 🔄 处理端
- **GitHub Actions**: 完全云端运行，无需本地环境
- **智能网页解析**: Puppeteer + Readability 提取正文
- **AI智能摘要**: 支持多种AI服务，API密钥轮换
- **图片资源处理**: 自动下载网络图片和转换base64图片
- **智能代理**: 优先直连，失败后自动切换代理

### 📁 输出端
- **结构化Markdown**: 包含frontmatter元数据
- **分类管理**: 按用户指定分类自动整理
- **Git同步**: 自动提交推送到GitHub仓库
- **邮件通知**: 处理结果实时通知

## 🏗️ 技术架构

```
浏览器 → GitHub Gist → GitHub Actions → 私有仓库
  ↓           ↓              ↓            ↓
油猴脚本    任务队列        云端处理      结果存储
```

### 技术栈
- **前端**: 原生JavaScript (油猴脚本)
- **后端**: Node.js + GitHub Actions
- **网页解析**: Puppeteer + Readability.js + Turndown
- **AI服务**: OpenAI、Gemini、DeepSeek等多种支持
- **存储**: GitHub Gist (队列) + GitHub仓库 (结果)

## 🚀 部署方式

### GitHub Actions部署（推荐）
- ✅ 完全在线运行
- ✅ 免费使用（公开仓库）
- ✅ 自动定时处理
- ✅ 邮件通知和日志清理

### 本地部署
- 支持macOS和Windows
- 使用launchd/任务计划程序定时执行
- 适合高度自定义需求

## 🔧 核心特性

### AI服务支持
- **多提供商**: OpenAI、Gemini、DeepSeek、通义千问等
- **API密钥轮换**: 支持多个密钥自动切换
- **故障转移**: 服务失败时自动切换到备用服务
- **自定义配置**: JSON格式灵活配置任意兼容服务

### 网络优化
- **智能代理**: 优先直连，失败后切换代理
- **重试机制**: 网络请求失败自动重试
- **超时控制**: 可配置的超时和重试参数

### 资源处理
- **图片下载**: 自动下载网络图片到本地
- **Base64转换**: 将内嵌base64图片转为本地文件
- **格式支持**: JPG、PNG、GIF、WebP、SVG等
- **大小限制**: 可配置文件大小和超时限制

## 📊 配置管理

### GitHub Secrets配置
```
# 基础配置
GIST_ID, GITHUB_TOKEN, TARGET_REPO, TARGET_REPO_TOKEN

# AI服务（支持多密钥）
OPENAI_API_KEY=key1,key2,key3
GEMINI_API_KEY=key1,key2

# 自定义AI服务
CUSTOM_AI_CONFIG=[{"type":"openai","api_key":"xxx","model":"gpt-4"}]

# 可选功能
CRON_EXPRESSION, HTTP_PROXY, NOTIFICATION_EMAIL
```

### 功能开关
- `ENABLE_AI_SUMMARY`: 控制AI摘要功能
- `ENABLE_RESOURCE_DOWNLOAD`: 控制资源下载功能
- 支持运行时动态配置

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

- 支持更多输出格式（PDF、EPUB等）
- 集成更多AI服务和功能
- 添加全文搜索和标签管理
- 支持批量处理和数据分析

---

这个项目展示了如何将现代云服务、AI技术和自动化工具结合，创建一个实用的知识管理解决方案。