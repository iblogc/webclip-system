# 配置管理指南

## 🎛️ 新版本配置功能

最新版本的油猴脚本支持完全可配置化，无需手动修改代码即可完成所有设置。

## ✨ 配置功能特性

### 🔧 基础配置
- **Gist ID**: GitHub Gist标识符
- **GitHub Token**: 个人访问令牌
- **分类选项**: 自定义收藏分类

### 🎨 界面配置
- **按钮位置**: 四个角落任意选择
- **按钮大小**: 40-80px可调节
- **按钮颜色**: 自定义颜色选择
- **自动聚焦**: 是否自动聚焦标题输入框
- **通知设置**: 开关和持续时间

## 🚀 首次使用

### 1. 安装脚本
1. 复制 `oilmonkey/clip-to-gist.user.js` 内容
2. 在Tampermonkey中创建新脚本
3. 粘贴内容并保存

### 2. 初始配置
1. 刷新任意网页
2. 点击右下角的⚙️配置按钮
3. 填写必要信息：
   - Gist ID
   - GitHub Token
4. 点击"保存"

### 3. 开始使用
配置完成后，按钮会变成📌，可以开始收藏网页。

## ⚙️ 配置界面详解

### 必填项
- **Gist ID**: 从GitHub Gist URL中获取
  ```
  https://gist.github.com/username/GIST_ID
  ```
- **GitHub Token**: 需要`gist`权限的个人访问令牌

### 分类管理
- 每行输入一个分类名称
- 支持中文和英文
- 至少需要一个分类
- 示例：
  ```
  阅读
  写作
  设计
  产品
  技术
  其他
  ```

### 按钮设置
- **位置**: 四个角落可选
  - 右下角 (默认)
  - 左下角
  - 右上角
  - 左上角
- **大小**: 40-80像素滑块调节
- **颜色**: 颜色选择器自定义

### 行为设置
- **自动聚焦**: 打开弹窗时自动聚焦标题输入框
- **显示通知**: 是否显示操作结果通知
- **通知持续时间**: 1000-10000毫秒

## 🎯 使用技巧

### 快速配置
- 左键点击：收藏网页
- 右键点击：打开配置界面
- 配置界面支持Esc键关闭

### 配置管理
- **保存**: 立即生效，无需重启
- **重置**: 恢复所有默认设置
- **取消**: 放弃当前修改

### 数据存储
- 配置数据存储在Tampermonkey的本地存储中
- 跨浏览器会话保持
- 卸载脚本时自动清除

## 🔄 配置迁移

### 导出配置
在浏览器控制台执行：
```javascript
// 导出当前配置
console.log(JSON.stringify(GM_getValue('webclip_config'), null, 2));
```

### 导入配置
在浏览器控制台执行：
```javascript
// 导入配置（替换YOUR_CONFIG为实际配置）
GM_setValue('webclip_config', JSON.stringify(YOUR_CONFIG));
location.reload(); // 刷新页面生效
```

### 批量部署
对于团队使用，可以预设配置：
```javascript
const TEAM_CONFIG = {
    "GIST_ID": "team-gist-id",
    "GITHUB_TOKEN": "team-token",
    "CATEGORY_OPTIONS": ["技术文档", "产品需求", "设计规范", "会议记录"],
    "BUTTON_POSITION": "top-right",
    "BUTTON_SIZE": 48,
    "BUTTON_COLOR": "#28a745"
};

GM_setValue('webclip_config', JSON.stringify(TEAM_CONFIG));
```

## 🛠️ 高级配置

### 自定义样式
可以通过修改脚本中的CSS来自定义更多样式：

```css
/* 自定义弹窗样式 */
.webclip-form {
    border: 2px solid #007aff;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 自定义按钮悬停效果 */
.webclip-floating-btn:hover {
    transform: scale(1.2) rotate(10deg);
}
```

### 扩展分类选项
支持更复杂的分类结构：
```javascript
CATEGORY_OPTIONS: [
    "📚 学习资料",
    "💼 工作相关", 
    "🎨 设计灵感",
    "🔧 开发工具",
    "📰 新闻资讯",
    "🎯 待办事项"
]
```

## 🔒 安全建议

### Token安全
- 使用最小权限原则，只授予`gist`权限
- 定期轮换GitHub Token
- 不要在公共场所展示配置界面

### 数据隐私
- Gist设置为私有
- 敏感信息不要放在备注中
- 定期清理不需要的收藏

## 🐛 故障排除

### 配置不生效
1. 检查浏览器控制台错误
2. 确认Tampermonkey权限设置
3. 尝试重置配置后重新设置

### 按钮不显示
1. 检查脚本是否启用
2. 确认网站匹配规则
3. 查看是否被其他元素遮挡

### 保存失败
1. 验证Gist ID和Token正确性
2. 检查网络连接
3. 确认GitHub API访问正常

## 📊 配置示例

### 个人博客作者
```json
{
    "CATEGORY_OPTIONS": ["写作素材", "技术教程", "行业动态", "工具推荐"],
    "BUTTON_POSITION": "top-left",
    "BUTTON_COLOR": "#ff6b6b",
    "AUTO_FOCUS": true,
    "NOTIFICATION_DURATION": 2000
}
```

### 产品经理
```json
{
    "CATEGORY_OPTIONS": ["竞品分析", "用户反馈", "功能需求", "市场趋势"],
    "BUTTON_POSITION": "bottom-left", 
    "BUTTON_COLOR": "#4ecdc4",
    "BUTTON_SIZE": 64
}
```

### 开发者
```json
{
    "CATEGORY_OPTIONS": ["技术文档", "开源项目", "解决方案", "学习资源"],
    "BUTTON_POSITION": "top-right",
    "BUTTON_COLOR": "#45b7d1",
    "AUTO_FOCUS": false
}
```

---

*通过灵活的配置系统，让Web收藏更符合你的使用习惯！* ⚙️✨