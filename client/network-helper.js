const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

class NetworkHelper {
  constructor(config) {
    this.config = config;
    this.proxyConfig = config.proxy || {};
  }

  /**
   * 创建请求配置，支持代理
   */
  createRequestConfig(baseConfig = {}, useProxy = false) {
    const requestConfig = { ...baseConfig };

    if (useProxy && this.proxyConfig.https_proxy) {
      requestConfig.httpsAgent = new HttpsProxyAgent(this.proxyConfig.https_proxy);
      requestConfig.httpAgent = new HttpsProxyAgent(this.proxyConfig.http_proxy || this.proxyConfig.https_proxy);
    }

    return requestConfig;
  }

  /**
   * 带重试机制的HTTP请求
   * 优先直连，失败后切换代理重试
   */
  async requestWithRetry(url, options = {}) {
    const { method = 'GET', data, ...baseConfig } = options;
    let lastError = null;

    // 第一次尝试：直连
    try {
      console.log(`🌐 尝试直连请求: ${url}`);
      const directConfig = this.createRequestConfig(baseConfig, false);
      
      let response;
      if (method.toLowerCase() === 'post') {
        response = await axios.post(url, data, directConfig);
      } else {
        response = await axios.get(url, directConfig);
      }
      
      console.log(`✅ 直连请求成功`);
      return response;
    } catch (error) {
      console.warn(`⚠️ 直连请求失败: ${error.message}`);
      lastError = error;
    }

    // 第二次尝试：使用代理
    if (this.proxyConfig.https_proxy || this.proxyConfig.http_proxy) {
      try {
        console.log(`🔄 尝试代理请求: ${url}`);
        const proxyConfig = this.createRequestConfig(baseConfig, true);
        
        let response;
        if (method.toLowerCase() === 'post') {
          response = await axios.post(url, data, proxyConfig);
        } else {
          response = await axios.get(url, proxyConfig);
        }
        
        console.log(`✅ 代理请求成功`);
        return response;
      } catch (error) {
        console.warn(`⚠️ 代理请求失败: ${error.message}`);
        lastError = error;
      }
    } else {
      console.warn(`⚠️ 未配置代理，跳过代理重试`);
    }

    // 所有尝试都失败
    throw lastError;
  }

  /**
   * GET请求
   */
  async get(url, config = {}) {
    return this.requestWithRetry(url, { method: 'GET', ...config });
  }

  /**
   * POST请求
   */
  async post(url, data, config = {}) {
    return this.requestWithRetry(url, { method: 'POST', data, ...config });
  }

  /**
   * 为OpenAI客户端创建配置
   */
  createOpenAIConfig(baseConfig = {}) {
    const configs = [];
    
    // 直连配置
    configs.push({ ...baseConfig, useProxy: false });
    
    // 代理配置
    if (this.proxyConfig.https_proxy || this.proxyConfig.http_proxy) {
      const proxyConfig = { ...baseConfig };
      proxyConfig.httpAgent = new HttpsProxyAgent(
        this.proxyConfig.https_proxy || this.proxyConfig.http_proxy
      );
      configs.push({ ...proxyConfig, useProxy: true });
    }
    
    return configs;
  }

  /**
   * 带重试的OpenAI请求
   */
  async openaiRequestWithRetry(createClient, requestFn) {
    const configs = this.createOpenAIConfig();
    let lastError = null;

    for (const config of configs) {
      try {
        const logPrefix = config.useProxy ? '🔄 代理' : '🌐 直连';
        console.log(`${logPrefix} OpenAI请求...`);
        
        const client = createClient(config);
        const result = await requestFn(client);
        
        console.log(`✅ ${config.useProxy ? '代理' : '直连'} OpenAI请求成功`);
        return result;
      } catch (error) {
        const logPrefix = config.useProxy ? '⚠️ 代理' : '⚠️ 直连';
        console.warn(`${logPrefix} OpenAI请求失败: ${error.message}`);
        lastError = error;
      }
    }

    throw lastError;
  }
}

module.exports = { NetworkHelper };