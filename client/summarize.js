const { NetworkHelper } = require('./network-helper');

class AIProvider {
    constructor(config, globalConfig) {
        this.config = config;
        this.networkHelper = new NetworkHelper(globalConfig);
    }

    async summarize(content) {
        throw new Error('子类必须实现 summarize 方法');
    }
}

class OpenAIProvider extends AIProvider {
    async summarize(content) {
        const { OpenAI } = require('openai');
        
        const prompt = `请为以下网页内容生成简明摘要和关键词标签：

内容：
${content.substring(0, 4000)} ${content.length > 4000 ? '...' : ''}

请以JSON格式返回结果：
{
  "summary": "简明摘要（100字以内）",
  "tags": ["标签1", "标签2", "标签3"]
}

要求：
- 摘要要简洁明了，突出核心内容
- 标签最多5个，使用中文
- 只返回JSON，不要其他内容`;

        // 使用网络助手进行带重试的请求
        const response = await this.networkHelper.openaiRequestWithRetry(
            (config) => {
                const openaiConfig = {
                    apiKey: this.config.api_key
                };
                
                // 如果配置了自定义baseURL，则使用它
                if (this.config.base_url) {
                    openaiConfig.baseURL = this.config.base_url;
                }
                
                // 添加代理配置
                if (config.httpAgent) {
                    openaiConfig.httpAgent = config.httpAgent;
                }
                
                return new OpenAI(openaiConfig);
            },
            async (openai) => {
                return await openai.chat.completions.create({
                    model: this.config.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 500,
                    temperature: 0.3
                });
            }
        );

        const result = response.choices[0].message.content.trim();
        
        try {
            return JSON.parse(result);
        } catch (error) {
            // 如果JSON解析失败，尝试提取内容
            const summaryMatch = result.match(/"summary":\s*"([^"]+)"/);
            const tagsMatch = result.match(/"tags":\s*\[(.*?)\]/);
            
            return {
                summary: summaryMatch ? summaryMatch[1] : '摘要生成失败',
                tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim().replace(/"/g, '')) : []
            };
        }
    }
}

class GeminiProvider extends AIProvider {
    async summarize(content) {
        const prompt = `请为以下网页内容生成简明摘要和关键词标签：

内容：
${content.substring(0, 4000)} ${content.length > 4000 ? '...' : ''}

请以JSON格式返回结果：
{
  "summary": "简明摘要（100字以内）",
  "tags": ["标签1", "标签2", "标签3"]
}

要求：
- 摘要要简洁明了，突出核心内容
- 标签最多5个，使用中文
- 只返回JSON，不要其他内容`;

        // 构建API URL，支持自定义baseURL
        const baseUrl = this.config.base_url || 'https://generativelanguage.googleapis.com';
        const apiUrl = `${baseUrl}/v1beta/models/${this.config.model || 'gemini-pro'}:generateContent?key=${this.config.api_key}`;

        const requestData = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 500
            }
        };

        const requestConfig = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // 使用网络助手进行带重试的请求
        const response = await this.networkHelper.post(apiUrl, requestData, requestConfig);

        const result = response.data.candidates[0].content.parts[0].text.trim();
        
        try {
            return JSON.parse(result);
        } catch (error) {
            // 如果JSON解析失败，尝试提取内容
            const summaryMatch = result.match(/"summary":\s*"([^"]+)"/);
            const tagsMatch = result.match(/"tags":\s*\[(.*?)\]/);
            
            return {
                summary: summaryMatch ? summaryMatch[1] : '摘要生成失败',
                tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.trim().replace(/"/g, '')) : []
            };
        }
    }
}

async function summarizeContent(content, aiConfig, globalConfig) {
    const providers = aiConfig.providers || [];
    
    if (providers.length === 0) {
        throw new Error('未配置AI提供商');
    }

    let lastError = null;

    // 依次尝试每个提供商
    for (const providerConfig of providers) {
        try {
            let provider;
            
            switch (providerConfig.type) {
                case 'openai':
                    provider = new OpenAIProvider(providerConfig, globalConfig);
                    break;
                case 'gemini':
                    provider = new GeminiProvider(providerConfig, globalConfig);
                    break;
                default:
                    console.warn(`⚠️ 未知的AI提供商类型: ${providerConfig.type}`);
                    continue;
            }

            console.log(`🤖 尝试使用 ${providerConfig.type} 生成摘要...`);
            const result = await provider.summarize(content);
            
            // 验证结果
            if (!result.summary || !Array.isArray(result.tags)) {
                throw new Error('AI返回结果格式不正确');
            }

            // 限制标签数量
            result.tags = result.tags.slice(0, 5);
            
            console.log(`✅ ${providerConfig.type} 摘要生成成功`);
            return result;

        } catch (error) {
            console.warn(`⚠️ ${providerConfig.type} 失败: ${error.message}`);
            lastError = error;
            continue;
        }
    }

    // 所有提供商都失败了
    throw new Error(`所有AI提供商都失败了，最后错误: ${lastError?.message || '未知错误'}`);
}

module.exports = {
    summarizeContent,
    OpenAIProvider,
    GeminiProvider
};