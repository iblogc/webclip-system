# 使用指南

## 📋 配置步骤

### 1. 获取GitHub Token

1. 访问 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 选择权限：
   - ✅ `gist` - 创建和管理Gist
   - ✅ `repo` (如果需要推送到私有仓库)
4. 复制生成的token（格式：`ghp_xxxxxxxxxxxxxxxxxxxx`）

### 2. 创建GitHub Gist

1. 访问 [https://gist.github.com](https://gist.github.com)
2. 创建新的**私有**Gist
3. 文件名：`webclip-queue.json`
4. 内容：
   ```json
   {"items":[]}
   ```
5. 点击 "Create secret gist"
6. 复制URL中的Gist ID（格式：`https://gist.github.com/username/GIST_ID`）

### 3. 获取AI API密钥（可选）

#### OpenAI
1. 访问 [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. 创建新的API密钥
3. 复制密钥（格式：`sk-xxxxxxxxxxxxxxxxxxxxxxxx`）

#### Google Gemini
1. 访问 [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. 创建新的API密钥
3. 复制密钥（格式：`AIzaSyxxxxxxxxxxxxxxxxxxxxxxx`）

### 4. 配置系统

编辑 `config/config.json`：

```json
{
  "gist_id": "你的Gist ID",
  "github_token": "你的GitHub Token",
  "output_dir": "~/Documents/KnowledgeRepo",
  "ai": {
    "providers": [
      { 
        "type": "openai", 
        "api_key": "你的OpenAI API Key",
        "model": "gpt-3.5-turbo"
      }
    ]
  }
}
```

## 🚀 启动系统

### 方法1：使用设置向导（推荐）

```bash
npm run setup
```

设置向导会：
- 检查依赖项
- 验证配置
- 初始化Git仓库
- 设置定时任务

### 方法2：手动启动

```bash
# 安装依赖
npm install

# 安装Chrome浏览器
npx puppeteer browsers install chrome

# 测试系统
npm test

# 手动处理一次
npm run process
```

## 🌐 安装浏览器脚本

### 1. 安装Tampermonkey

- Chrome: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- Firefox: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- Edge: [Microsoft Store](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

### 2. 安装脚本

1. 复制 `oilmonkey/clip-to-gist.user.js` 内容
2. 在Tampermonkey中创建新脚本，粘贴内容
3. 保存脚本
4. 访问任意网页，点击⚙️配置按钮
5. 在配置界面填写：
   - Gist ID
   - GitHub Token
   - 自定义分类选项
   - 界面设置（可选）
6. 点击"保存"完成配置

**脚本特性**：
- ✅ **可视化配置**: 无需修改代码，通过UI界面设置
- ✅ **Apple HIG设计**: 符合苹果设计规范的界面
- ✅ **完全自定义**: 按钮位置、大小、颜色可调
- ✅ **智能交互**: 左键收藏，右键配置
- ✅ **实时生效**: 配置修改立即生效
- ✅ **数据持久**: 配置自动保存到本地

## 📱 使用方法

### 收藏网页

1. 在任何网页上，点击右下角的📌按钮
2. 在弹出的表单中：
   - 确认标题和URL
   - 选择分类
   - 添加备注（可选）
3. 点击"确认收藏"
4. 看到"✅ 收藏成功！"提示

### 查看结果

收藏的网页会自动处理并保存到：
```
~/Documents/KnowledgeRepo/
├── 阅读/
│   └── 2025-07-25-文章标题.md
├── 写作/
├── 设计/
└── ...
```

每个Markdown文件包含：
- 原文标题和链接
- 创建时间和分类
- AI生成的摘要和标签
- 完整的文章内容

## ⏰ 定时任务

### macOS

```bash
# 加载任务
launchctl load ~/Library/LaunchAgents/com.webclip.processor.plist

# 启动任务
launchctl start com.webclip.processor

# 停止任务
launchctl stop com.webclip.processor

# 卸载任务
launchctl unload ~/Library/LaunchAgents/com.webclip.processor.plist
```

### Windows

以管理员身份运行PowerShell：

```powershell
# 创建任务
schtasks /create /tn "WebClipProcessor" /tr "\"C:\path\to\node.exe\" \"C:\path\to\webclip-system\client\process_gist.js\"" /sc minute /mo 10 /f

# 启动任务
schtasks /run /tn "WebClipProcessor"

# 查看任务状态
schtasks /query /tn "WebClipProcessor"

# 删除任务
schtasks /delete /tn "WebClipProcessor" /f
```

## 🔧 高级配置

### 自定义分类

修改油猴脚本中的分类选项：

```javascript
const CONFIG = {
    // ...
    CATEGORY_OPTIONS: ["技术", "产品", "设计", "管理", "生活"]
};
```

### 调整处理频率

修改 `config/config.json`：

```json
{
  "processing": {
    "interval_minutes": 5,  // 改为5分钟执行一次
    "timeout_seconds": 60,  // 增加超时时间
    "max_retries": 5        // 增加重试次数
  }
}
```

### 自定义输出目录

```json
{
  "output_dir": "/path/to/your/knowledge/base"
}
```

### 配置多个AI提供商

```json
{
  "ai": {
    "providers": [
      { 
        "type": "openai", 
        "api_key": "sk-...",
        "model": "gpt-4",
        "base_url": "https://api.openai.com/v1"
      },
      { 
        "type": "gemini", 
        "api_key": "AIza...",
        "model": "gemini-pro",
        "base_url": "https://generativelanguage.googleapis.com"
      },
      { 
        "type": "openai", 
        "api_key": "sk-backup-key...",
        "model": "gpt-3.5-turbo",
        "base_url": "https://api.deepseek.com/v1"
      }
    ]
  }
}
```

### 使用第三方AI服务

系统支持通过自定义`base_url`使用各种兼容OpenAI API的服务：

#### DeepSeek API
```json
{
  "type": "openai",
  "api_key": "sk-...",
  "model": "deepseek-chat",
  "base_url": "https://api.deepseek.com/v1"
}
```

#### 阿里云通义千问
```json
{
  "type": "openai",
  "api_key": "sk-...",
  "model": "qwen-turbo",
  "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1"
}
```

#### 本地部署的模型（如Ollama）
```json
{
  "type": "openai",
  "api_key": "ollama",
  "model": "llama2",
  "base_url": "http://localhost:11434/v1"
}
```

#### 代理服务
```json
{
  "type": "openai",
  "api_key": "sk-...",
  "model": "gpt-3.5-turbo",
  "base_url": "https://your-proxy-domain.com/v1"
}
```

## 🐛 故障排除

### 常见错误

1. **"Could not find Chrome"**
   ```bash
   npx puppeteer browsers install chrome
   ```

2. **"获取Gist内容失败"**
   - 检查GitHub Token权限
   - 确认Gist ID正确
   - 检查网络连接

3. **"AI摘要生成失败"**
   - 检查API密钥是否正确
   - 确认账户有足够余额
   - 尝试其他AI提供商

4. **"Git同步失败"**
   - 检查输出目录权限
   - 确认Git配置正确
   - 检查远程仓库访问权限

### 日志查看

- **macOS**: `/tmp/webclip-processor.log`
- **Windows**: 任务计划程序历史记录
- **错误文件**: `输出目录/errors/`

### 手动调试

```bash
# 查看详细日志
node client/process_gist.js

# 测试单个组件
node -e "require('./client/markdown-builder').buildMarkdown('https://example.com').then(console.log)"

# 测试AI摘要
node -e "require('./client/summarize').summarizeContent('测试内容', require('./config/config.json').ai).then(console.log)"
```

## 📊 监控和维护

### 检查系统状态

```bash
# 运行完整测试
npm test

# 检查Git状态
node -e "require('./client/git-sync').getGitStatus('~/Documents/KnowledgeRepo').then(console.log)"

# 查看队列状态
node -e "const axios = require('axios'); axios.get('https://api.github.com/gists/YOUR_GIST_ID', {headers: {'Authorization': 'token YOUR_TOKEN'}}).then(r => console.log(JSON.parse(r.data.files['webclip-queue.json'].content)))"
```

### 清理和维护

```bash
# 清理错误文件
rm -rf ~/Documents/KnowledgeRepo/errors/*

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

## 💡 使用技巧

1. **批量收藏**: 可以快速收藏多个网页，系统会按顺序处理
2. **分类管理**: 合理使用分类功能，便于后续查找
3. **备注信息**: 添加有意义的备注，帮助记忆收藏原因
4. **定期检查**: 定期查看错误日志，及时处理失败的任务
5. **备份重要**: 定期备份配置文件和输出目录

---

*享受高效的知识管理体验！* 🚀