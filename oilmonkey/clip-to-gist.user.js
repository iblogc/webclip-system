// ==UserScript==
// @name         Web收藏到Gist
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  一键收藏网页到GitHub Gist
// @author       iblogc
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// ==/UserScript==

(function () {
  "use strict";

  // 默认配置
  const DEFAULT_CONFIG = {
    GIST_ID: "",
    TOKEN: "",
    CATEGORY_OPTIONS: ["阅读", "写作", "设计", "产品", "技术", "其他"],
    BUTTON_POSITION: "bottom-right", // bottom-right, bottom-left, top-right, top-left
    BUTTON_SIZE: 56,
    BUTTON_COLOR: "#007aff",
    AUTO_FOCUS: true,
    SHOW_NOTIFICATIONS: true,
    NOTIFICATION_DURATION: 3000,
    SHOW_FLOATING_BUTTON: true, // 是否显示浮动按钮
  };

  // 配置管理
  class ConfigManager {
    constructor() {
      this.config = this.loadConfig();
    }

    loadConfig() {
      try {
        const saved = GM_getValue("webclip_config", null);
        if (saved) {
          return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        }
      } catch (error) {
        console.warn("配置加载失败，使用默认配置:", error);
      }
      return { ...DEFAULT_CONFIG };
    }

    saveConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      GM_setValue("webclip_config", JSON.stringify(this.config));
    }

    get(key) {
      return this.config[key];
    }

    set(key, value) {
      this.config[key] = value;
      this.saveConfig({ [key]: value });
    }

    getAll() {
      return { ...this.config };
    }

    isConfigured() {
      return this.config.GIST_ID && this.config.TOKEN;
    }

    reset() {
      GM_deleteValue("webclip_config");
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  const configManager = new ConfigManager();

  // 菜单命令ID存储
  let menuCommands = {
    clip: null,
    config: null,
  };

  // 模态框状态管理
  let isModalOpen = false;

  // 注册油猴菜单
  function registerMenuCommands() {
    // 注销现有菜单
    if (menuCommands.clip) GM_unregisterMenuCommand(menuCommands.clip);
    if (menuCommands.config) GM_unregisterMenuCommand(menuCommands.config);

    const isConfigured = configManager.isConfigured();
    const statusIcon = isConfigured ? "✅" : "❌";

    // 注册收藏菜单
    menuCommands.clip = GM_registerMenuCommand(
      `📌 收藏当前页面 (Ctrl+Shift+S) ${statusIcon}`,
      () => {
        if (isConfigured) {
          showClipModal();
        } else {
          alert("请先配置 Gist ID 和 GitHub Token");
          showConfigModal();
        }
      }
    );

    // 注册设置菜单
    menuCommands.config = GM_registerMenuCommand(
      "⚙️ 打开设置",
      showConfigModal
    );
  }

  // 添加样式
  GM_addStyle(`
        .webclip-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .webclip-form {
            background: white;
            border-radius: 12px;
            padding: 20px;
            width: 400px;
            max-width: 90vw;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease-out;
        }

        @media (prefers-color-scheme: dark) {
            .webclip-form {
                background: #2c2c2e;
                color: white;
            }
        }

        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .webclip-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            text-align: center;
        }

        .webclip-field {
            margin-bottom: 12px;
        }
        
        .webclip-field.compact {
            margin-bottom: 8px;
        }

        .webclip-label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 6px;
            color: #333;
        }

        @media (prefers-color-scheme: dark) {
            .webclip-label {
                color: #e5e5e7;
            }
            
            .webclip-label small {
                color: #a1a1a6 !important;
            }
        }

        .webclip-input, .webclip-select, .webclip-textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d1d6;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            box-sizing: border-box;
        }

        @media (prefers-color-scheme: dark) {
            .webclip-input, .webclip-select, .webclip-textarea {
                background: #1c1c1e;
                border-color: #48484a;
                color: white;
            }
        }

        .webclip-textarea {
            resize: vertical;
            min-height: 60px;
        }

        .webclip-buttons {
            display: flex;
            gap: 8px;
            margin-top: 16px;
            flex-wrap: wrap;
        }

        .webclip-btn {
            flex: 1;
            padding: 10px 12px;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            min-width: 70px;
        }

        .webclip-btn-primary {
            background: #007aff;
            color: white;
        }

        .webclip-btn-primary:hover:not(:disabled) {
            background: #0056cc;
        }
        
        .webclip-btn-primary:disabled {
            background: #8e8e93;
            cursor: not-allowed;
        }

        .webclip-btn-secondary {
            background: #f2f2f7;
            color: #333;
        }

        @media (prefers-color-scheme: dark) {
            .webclip-btn-secondary {
                background: #48484a;
                color: white;
            }
        }

        .webclip-btn-secondary:hover {
            background: #e5e5ea;
        }

        .webclip-floating-btn {
            position: fixed;
            border: none;
            border-radius: 50%;
            color: white;
            font-size: 24px;
            cursor: pointer;
            z-index: 9999;
            transition: all 0.3s;
        }

        .webclip-floating-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(0, 122, 255, 0.4);
        }
        
        /* 响应式设计 */
        @media (max-height: 600px) {
            .webclip-form {
                padding: 16px;
                max-height: 85vh;
            }
            
            .webclip-title {
                font-size: 16px;
                margin-bottom: 12px;
            }
            
            .webclip-field {
                margin-bottom: 10px;
            }
            
            .webclip-field.compact {
                margin-bottom: 6px;
            }
        }
        
        @media (max-width: 500px) {
            .webclip-form {
                width: 95vw !important;
                padding: 16px;
            }
            
            .webclip-buttons {
                flex-direction: column;
                gap: 6px;
            }
            
            .webclip-btn {
                width: 100%;
            }
        }
    `);

  // 创建浮动按钮
  function createFloatingButton() {
    // 检查是否显示浮动按钮
    if (!configManager.get("SHOW_FLOATING_BUTTON")) {
      return;
    }

    // 如果未配置，显示配置按钮
    if (!configManager.isConfigured()) {
      createConfigButton();
      return;
    }

    const btn = document.createElement("button");
    btn.className = "webclip-floating-btn";
    btn.innerHTML = "📌";
    btn.title = "收藏网页 (右键配置)";

    // 应用配置样式
    applyButtonStyle(btn);

    // 左键收藏，右键配置
    btn.onclick = showClipModal;
    btn.oncontextmenu = (e) => {
      e.preventDefault();
      showConfigModal();
    };

    document.body.appendChild(btn);
  }

  // 创建配置按钮
  function createConfigButton() {
    // 检查是否显示浮动按钮
    if (!configManager.get("SHOW_FLOATING_BUTTON")) {
      return;
    }

    const btn = document.createElement("button");
    btn.className = "webclip-floating-btn";
    btn.innerHTML = "⚙️";
    btn.title = "配置Web收藏";

    applyButtonStyle(btn);
    btn.onclick = showConfigModal;

    document.body.appendChild(btn);
  }

  // 应用按钮样式
  function applyButtonStyle(btn) {
    const position = configManager.get("BUTTON_POSITION");
    const size = configManager.get("BUTTON_SIZE");
    const color = configManager.get("BUTTON_COLOR");

    // 设置位置
    const positions = {
      "bottom-right": { bottom: "20px", right: "20px" },
      "bottom-left": { bottom: "20px", left: "20px" },
      "top-right": { top: "20px", right: "20px" },
      "top-left": { top: "20px", left: "20px" },
    };

    const pos = positions[position] || positions["bottom-right"];
    Object.assign(btn.style, {
      ...pos,
      width: size + "px",
      height: size + "px",
      background: color,
      boxShadow: `0 4px 12px ${color}30`,
      fontSize: Math.floor(size * 0.4) + "px",
    });
  }

  // 显示收藏弹窗
  function showClipModal() {
    if (isModalOpen) return;
    isModalOpen = true;

    const modal = document.createElement("div");
    modal.className = "webclip-modal";

    const form = document.createElement("div");
    form.className = "webclip-form";

    form.innerHTML = `
            <div class="webclip-title">📌 收藏网页</div>
            
            <div class="webclip-field">
                <label class="webclip-label">标题</label>
                <input type="text" class="webclip-input" id="webclip-title" value="${
                  document.title
                }">
            </div>
            
            <div class="webclip-field">
                <label class="webclip-label">URL</label>
                <input type="text" class="webclip-input" id="webclip-url" value="${
                  window.location.href
                }">
            </div>
            
            <div class="webclip-field">
                <label class="webclip-label">分类</label>
                <select class="webclip-select" id="webclip-category">
                    ${configManager
                      .get("CATEGORY_OPTIONS")
                      .map((cat) => `<option value="${cat}">${cat}</option>`)
                      .join("")}
                </select>
            </div>
            
            <div class="webclip-field">
                <label class="webclip-label">备注（可选）</label>
                <textarea class="webclip-textarea" id="webclip-note" placeholder="添加备注..."></textarea>
            </div>
            
            <div class="webclip-buttons">
                <button class="webclip-btn webclip-btn-secondary" id="webclip-cancel">取消</button>
                <button class="webclip-btn webclip-btn-primary" id="webclip-submit">确认收藏</button>
            </div>
        `;

    modal.appendChild(form);
    document.body.appendChild(modal);

    // 绑定事件
    document.getElementById("webclip-cancel").addEventListener("click", () => {
      modal.remove();
      isModalOpen = false;
    });

    document
      .getElementById("webclip-submit")
      .addEventListener("click", submitClip);

    // 点击背景关闭
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
        isModalOpen = false;
      }
    });

    // 键盘支持
    modal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        modal.remove();
        isModalOpen = false;
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        submitClip();
      }
    });

    // 自动聚焦到标题输入框
    if (configManager.get("AUTO_FOCUS")) {
      setTimeout(() => {
        document.getElementById("webclip-title").focus();
      }, 100);
    }
  }

  // 提交收藏
  function submitClip() {
    const title = document.getElementById("webclip-title").value.trim();
    const url = document.getElementById("webclip-url").value.trim();
    const category = document.getElementById("webclip-category").value;
    const note = document.getElementById("webclip-note").value.trim();

    if (!title || !url) {
      alert("标题和URL不能为空");
      return;
    }

    const clipData = {
      title,
      url,
      category,
      note,
      created: new Date().toISOString(),
    };

    // 显示加载状态
    const btn = document.getElementById("webclip-submit");
    const originalText = btn.textContent;
    btn.textContent = "保存中...";
    btn.disabled = true;

    saveToGist(clipData)
      .then(() => {
        document.querySelector(".webclip-modal").remove();
        isModalOpen = false;
        showNotification("✅ 收藏成功！", "success");
      })
      .catch((error) => {
        console.error("保存失败:", error);
        showNotification("❌ 保存失败，请重试", "error");
        btn.textContent = originalText;
        btn.disabled = false;
      });
  }

  // 保存到Gist
  async function saveToGist(clipData) {
    // 先获取现有内容
    const gistData = await getGistContent();

    // 添加新项目
    if (!gistData.items) {
      gistData.items = [];
    }
    gistData.items.push(clipData);

    // 更新Gist
    return updateGist(gistData);
  }

  // 获取Gist内容
  function getGistContent() {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: `https://api.github.com/gists/${configManager.get("GIST_ID")}`,
        headers: {
          Authorization: `token ${configManager.get("TOKEN")}`,
          Accept: "application/vnd.github.v3+json",
        },
        onload: function (response) {
          if (response.status === 200) {
            const gist = JSON.parse(response.responseText);
            const content =
              gist.files["webclip-queue.json"]?.content || '{"items":[]}';
            resolve(JSON.parse(content));
          } else {
            reject(new Error(`获取Gist失败: ${response.status}`));
          }
        },
        onerror: reject,
      });
    });
  }

  // 更新Gist
  function updateGist(data) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "PATCH",
        url: `https://api.github.com/gists/${configManager.get("GIST_ID")}`,
        headers: {
          Authorization: `token ${configManager.get("TOKEN")}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        data: JSON.stringify({
          files: {
            "webclip-queue.json": {
              content: JSON.stringify(data, null, 2),
            },
          },
        }),
        onload: function (response) {
          if (response.status === 200) {
            resolve();
          } else {
            reject(new Error(`更新Gist失败: ${response.status}`));
          }
        },
        onerror: reject,
      });
    });
  }

  // 显示通知
  function showNotification(message, type = "success") {
    if (!configManager.get("SHOW_NOTIFICATIONS")) {
      return;
    }

    const notification = document.createElement("div");
    const backgroundColor = type === "success" ? "#34c759" : "#ff3b30";

    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${backgroundColor};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 14px;
            z-index: 10001;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        `;
    notification.textContent = message;
    document.body.appendChild(notification);

    const duration = configManager.get("NOTIFICATION_DURATION");
    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease-in";
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  // 添加动画样式
  GM_addStyle(`
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `);

  // 显示配置弹窗
  function showConfigModal() {
    if (isModalOpen) return;
    isModalOpen = true;

    const modal = document.createElement("div");
    modal.className = "webclip-modal";

    const form = document.createElement("div");
    form.className = "webclip-form";
    form.style.width = "480px";

    const config = configManager.getAll();

    form.innerHTML = `
            <div class="webclip-title">⚙️ Web收藏配置</div>
            
            <!-- GitHub 配置 -->
            <div class="webclip-field">
                <label class="webclip-label">Gist ID *</label>
                <input type="text" class="webclip-input" id="config-gist-id" value="${
                  config.GIST_ID
                }" placeholder="32位十六进制字符" title="32位十六进制字符的Gist ID">
                <small style="color: #666; font-size: 11px; margin-top: 2px; display: block;">
                    在 GitHub Gist URL 中找到
                </small>
            </div>
            
            <div class="webclip-field">
                <label class="webclip-label">GitHub Token *</label>
                <input type="password" class="webclip-input" id="config-github-token" value="${
                  config.TOKEN
                }" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" title="需要 gist 权限的 GitHub Personal Access Token">
                <small style="color: #666; font-size: 11px; margin-top: 2px; display: block;">
                    需要 <strong>gist</strong> 权限
                </small>
            </div>
            
            <!-- 分类配置 -->
            <div class="webclip-field">
                <label class="webclip-label">分类选项 (每行一个)</label>
                <textarea class="webclip-textarea" id="config-categories" rows="3" style="min-height: 50px;">${config.CATEGORY_OPTIONS.join(
                  "\n"
                )}</textarea>
            </div>
            
            <!-- 按钮样式配置 -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                <div>
                    <label class="webclip-label">按钮位置</label>
                    <select class="webclip-select" id="config-position">
                        <option value="bottom-right" ${
                          config.BUTTON_POSITION === "bottom-right"
                            ? "selected"
                            : ""
                        }>右下角</option>
                        <option value="bottom-left" ${
                          config.BUTTON_POSITION === "bottom-left"
                            ? "selected"
                            : ""
                        }>左下角</option>
                        <option value="top-right" ${
                          config.BUTTON_POSITION === "top-right"
                            ? "selected"
                            : ""
                        }>右上角</option>
                        <option value="top-left" ${
                          config.BUTTON_POSITION === "top-left"
                            ? "selected"
                            : ""
                        }>左上角</option>
                    </select>
                </div>
                <div>
                    <label class="webclip-label">按钮颜色</label>
                    <input type="color" class="webclip-input" id="config-color" value="${
                      config.BUTTON_COLOR
                    }" style="width: 100%; height: 36px;">
                </div>
            </div>
            
            <div class="webclip-field compact">
                <label class="webclip-label">按钮大小: <span id="size-value">${
                  config.BUTTON_SIZE
                }px</span></label>
                <input type="range" class="webclip-input" id="config-size" min="40" max="80" value="${
                  config.BUTTON_SIZE
                }" style="width: 100%;">
            </div>
            
            <!-- 功能选项 -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                <label class="webclip-label" style="display: flex; align-items: center; font-size: 13px;">
                    <input type="checkbox" id="config-auto-focus" ${
                      config.AUTO_FOCUS ? "checked" : ""
                    } style="margin-right: 6px;">
                    自动聚焦标题
                </label>
                <label class="webclip-label" style="display: flex; align-items: center; font-size: 13px;">
                    <input type="checkbox" id="config-notifications" ${
                      config.SHOW_NOTIFICATIONS ? "checked" : ""
                    } style="margin-right: 6px;">
                    显示通知消息
                </label>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 120px; gap: 12px; margin-bottom: 12px;">
                <div class="webclip-field compact">
                    <label class="webclip-label" style="display: flex; align-items: center; font-size: 13px;">
                        <input type="checkbox" id="config-show-button" ${
                          config.SHOW_FLOATING_BUTTON ? "checked" : ""
                        } style="margin-right: 6px;">
                        显示浮动按钮
                    </label>
                    <small style="color: #666; font-size: 10px; margin-top: 2px; display: block;">
                        可用菜单或 Ctrl+Shift+S
                    </small>
                </div>
                <div>
                    <label class="webclip-label" style="font-size: 13px;">通知时长(ms)</label>
                    <input type="number" class="webclip-input" id="config-duration" value="${
                      config.NOTIFICATION_DURATION
                    }" min="1000" max="10000" step="500" style="font-size: 12px;">
                </div>
            </div>
            
            <div class="webclip-buttons">
                <button class="webclip-btn webclip-btn-secondary" id="config-reset">重置</button>
                <button class="webclip-btn webclip-btn-secondary" id="config-test">测试</button>
                <button class="webclip-btn webclip-btn-secondary" id="config-cancel">取消</button>
                <button class="webclip-btn webclip-btn-primary" id="config-save">保存</button>
            </div>
        `;

    modal.appendChild(form);
    document.body.appendChild(modal);

    // 实时更新按钮大小显示
    const sizeSlider = document.getElementById("config-size");
    const sizeValue = document.getElementById("size-value");
    sizeSlider.oninput = () => {
      sizeValue.textContent = sizeSlider.value + "px";
    };

    // 绑定事件
    document.getElementById("config-cancel").addEventListener("click", () => {
      modal.remove();
      isModalOpen = false;
    });

    document.getElementById("config-reset").addEventListener("click", () => {
      if (confirm("确定要重置所有配置吗？")) {
        configManager.reset();
        modal.remove();
        isModalOpen = false;
        // 重新创建按钮
        document.querySelector(".webclip-floating-btn")?.remove();
        createFloatingButton();
        // 重新注册菜单命令
        registerMenuCommands();
        showNotification("配置已重置", "success");
      }
    });

    document.getElementById("config-test").addEventListener("click", () => {
      testConnection();
    });

    document.getElementById("config-save").addEventListener("click", () => {
      saveConfiguration(modal);
    });

    // 键盘支持
    modal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        modal.remove();
        isModalOpen = false;
      }
    });
  }

  // 测试连接
  function testConnection() {
    const gistId = document.getElementById("config-gist-id").value.trim();
    const githubToken = document
      .getElementById("config-github-token")
      .value.trim();

    if (!gistId || !githubToken) {
      alert("请先填写 Gist ID 和 GitHub Token");
      return;
    }

    const btn = document.getElementById("config-test");
    const originalText = btn.textContent;
    btn.textContent = "测试中...";
    btn.disabled = true;

    // 测试获取 Gist
    GM_xmlhttpRequest({
      method: "GET",
      url: `https://api.github.com/gists/${gistId}`,
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      onload: function (response) {
        btn.textContent = originalText;
        btn.disabled = false;

        if (response.status === 200) {
          const gist = JSON.parse(response.responseText);
          showNotification(`✅ Gist 连接成功！`, "success");
        } else if (response.status === 404) {
          showNotification("❌ Gist 不存在或无权限访问", "error");
        } else if (response.status === 401) {
          showNotification("❌ GitHub Token 无效或权限不足", "error");
        } else {
          showNotification(`❌ 连接失败: ${response.status}`, "error");
        }
      },
      onerror: function () {
        btn.textContent = originalText;
        btn.disabled = false;
        showNotification("❌ 网络连接失败", "error");
      },
    });
  }

  // 保存配置
  function saveConfiguration(modal) {
    const gistId = document.getElementById("config-gist-id").value.trim();
    const githubToken = document
      .getElementById("config-github-token")
      .value.trim();
    const categories = document
      .getElementById("config-categories")
      .value.split("\n")
      .map((cat) => cat.trim())
      .filter((cat) => cat);
    const position = document.getElementById("config-position").value;
    const size = parseInt(document.getElementById("config-size").value);
    const color = document.getElementById("config-color").value;
    const autoFocus = document.getElementById("config-auto-focus").checked;
    const notifications = document.getElementById(
      "config-notifications"
    ).checked;
    const duration = parseInt(document.getElementById("config-duration").value);
    const showButton = document.getElementById("config-show-button").checked;

    // 验证必填项
    if (!gistId || !githubToken) {
      alert("Gist ID 和 GitHub Token 是必填项");
      return;
    }

    // 验证 Gist ID 格式（应该是32位十六进制字符）
    if (!/^[a-f0-9]{32}$/i.test(gistId)) {
      alert("Gist ID 格式不正确，应该是32位十六进制字符");
      return;
    }

    // 验证 GitHub Token 格式
    if (!/^(ghp_|github_pat_)[a-zA-Z0-9_]+$/.test(githubToken)) {
      alert("GitHub Token 格式不正确，应该以 ghp_ 或 github_pat_ 开头");
      return;
    }

    if (categories.length === 0) {
      alert("至少需要一个分类选项");
      return;
    }

    // 保存配置
    configManager.saveConfig({
      GIST_ID: gistId,
      TOKEN: githubToken,
      CATEGORY_OPTIONS: categories,
      BUTTON_POSITION: position,
      BUTTON_SIZE: size,
      BUTTON_COLOR: color,
      AUTO_FOCUS: autoFocus,
      SHOW_NOTIFICATIONS: notifications,
      NOTIFICATION_DURATION: duration,
      SHOW_FLOATING_BUTTON: showButton,
    });

    modal.remove();
    isModalOpen = false;

    // 重新创建按钮
    document.querySelector(".webclip-floating-btn")?.remove();
    createFloatingButton();

    // 重新注册菜单命令（以防配置状态改变）
    registerMenuCommands();

    showNotification("配置保存成功！", "success");
  }

  // 键盘快捷键支持
  function setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + Shift + S 快速收藏
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
        e.preventDefault();
        if (configManager.isConfigured()) {
          showClipModal();
        } else {
          showNotification("⚠️ 请先配置 Gist ID 和 GitHub Token", "error");
          setTimeout(() => showConfigModal(), 1000);
        }
      }
    });
  }

  // 初始化
  function init() {
    // 注册油猴菜单
    registerMenuCommands();

    // 设置键盘快捷键
    setupKeyboardShortcuts();

    // 创建浮动按钮（如果启用）
    createFloatingButton();
  }

  // 页面加载完成后初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
