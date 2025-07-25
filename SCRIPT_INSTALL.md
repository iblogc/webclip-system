# 油猴脚本安装指南

## 🔧 最新功能

最新版本的油猴脚本支持以下功能：
- ✅ **完全可配置化**: 无需修改代码，通过UI界面配置
- ✅ **智能初始化**: 首次使用显示配置界面
- ✅ **右键配置**: 右键点击按钮快速打开配置
- ✅ **实时生效**: 配置修改立即生效
- ✅ **数据持久化**: 配置自动保存到本地
- ✅ **界面自定义**: 按钮位置、大小、颜色可调
- ✅ **行为控制**: 通知、聚焦等行为可开关

## 📦 安装步骤

### 1. 安装Tampermonkey扩展

根据你的浏览器选择对应的扩展：

- **Chrome**: [Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox**: [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- **Edge**: [Microsoft Store](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
- **Safari**: [App Store](https://apps.apple.com/us/app/tampermonkey/id1482490089)

### 2. 配置GitHub

#### 创建GitHub Token
1. 访问 [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 选择权限：
   - ✅ `gist` - 创建和管理Gist
4. 复制生成的token（格式：`ghp_xxxxxxxxxxxxxxxxxxxx`）

#### 创建GitHub Gist
1. 访问 [https://gist.github.com](https://gist.github.com)
2. 创建新的**私有**Gist
3. 文件名：`webclip-queue.json`
4. 内容：
   ```json
   {"items":[]}
   ```
5. 点击 "Create secret gist"
6. 复制URL中的Gist ID（格式：`https://gist.github.com/username/GIST_ID`）

### 3. 安装脚本

#### 直接安装
1. 打开 `oilmonkey/clip-to-gist.user.js` 文件
2. 复制全部内容
3. 在Tampermonkey中点击 "创建新脚本"
4. 删除默认内容，粘贴复制的脚本
5. 修改配置部分：
   ```javascript
   const CONFIG = {
       GIST_ID: '你的Gist ID',
       GITHUB_TOKEN: '你的GitHub Token',
       CATEGORY_OPTIONS: ["阅读", "写作", "设计", "产品", "技术", "其他"]
   };
   ```
6. 按 `Ctrl+S` 保存脚本

### 4. 首次配置

1. 访问任意网页
2. 查看右下角是否出现⚙️配置按钮
3. 点击配置按钮，填写必要信息：
   - **Gist ID**: 从GitHub Gist URL获取
   - **GitHub Token**: 个人访问令牌
   - **分类选项**: 可自定义修改
4. 点击"保存"完成配置
5. 按钮变成📌后即可开始收藏网页

## 🎨 界面特性

### Apple HIG设计规范
- 使用 `-apple-system` 字体
- 自然圆角和柔和阴影
- 高对比度配色
- 支持亮/暗色模式

### 交互体验
- **浮动按钮**: 右下角📌按钮，悬停放大效果
- **模态弹窗**: 居中显示，背景模糊
- **自动聚焦**: 打开弹窗自动聚焦标题输入框
- **键盘支持**: 
  - `Esc` - 关闭弹窗
  - `Ctrl/Cmd + Enter` - 提交表单
- **状态反馈**: 保存时显示"保存中..."状态
- **通知系统**: 成功/失败通知，自动消失

### 表单功能
- **标题**: 自动填充当前网页标题
- **URL**: 自动填充当前网页URL
- **分类**: 下拉选择，支持自定义选项
- **备注**: 可选的多行文本输入
- **验证**: 标题和URL必填验证

## 🔧 自定义配置

### 修改分类选项
```javascript
CATEGORY_OPTIONS: ["技术", "产品", "设计", "管理", "生活", "学习"]
```

### 修改按钮样式
可以在CSS部分修改 `.webclip-floating-btn` 样式：
```css
.webclip-floating-btn {
    bottom: 20px;    /* 距离底部距离 */
    right: 20px;     /* 距离右侧距离 */
    width: 56px;     /* 按钮宽度 */
    height: 56px;    /* 按钮高度 */
    background: #007aff;  /* 背景颜色 */
}
```

### 修改弹窗尺寸
```css
.webclip-form {
    width: 400px;    /* 弹窗宽度 */
    max-width: 90vw; /* 最大宽度 */
}
```

## 🐛 故障排除

### 常见问题

1. **按钮不显示**
   - 检查脚本是否正确安装和启用
   - 确认网站匹配规则 `@match *://*/*`
   - 查看浏览器控制台是否有错误

2. **点击按钮无反应**
   - 检查是否有JavaScript错误
   - 确认脚本权限设置正确
   - 尝试刷新页面

3. **保存失败**
   - 检查GitHub Token是否正确
   - 确认Gist ID是否正确
   - 检查网络连接
   - 查看控制台错误信息

4. **样式显示异常**
   - 检查是否与网站CSS冲突
   - 尝试增加CSS优先级
   - 清除浏览器缓存

### 调试方法

1. **查看控制台**
   - 按 `F12` 打开开发者工具
   - 查看 Console 标签页的错误信息

2. **检查网络请求**
   - 在 Network 标签页查看API请求
   - 确认请求状态码和响应内容

3. **测试API连接**
   ```javascript
   // 在控制台执行测试
   fetch('https://api.github.com/gists/YOUR_GIST_ID', {
       headers: {
           'Authorization': 'token YOUR_TOKEN'
       }
   }).then(r => r.json()).then(console.log);
   ```

## 📱 移动端支持

脚本在移动端浏览器中也能正常工作：
- 响应式设计，适配小屏幕
- 触摸友好的按钮尺寸
- 移动端键盘支持

## 🔄 更新脚本

当有新版本时：
1. 复制新版本脚本内容
2. 在Tampermonkey中编辑现有脚本
3. 替换内容并保存
4. 保留你的配置信息

---

*享受便捷的网页收藏体验！* 📌✨