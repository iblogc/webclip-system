const puppeteer = require('puppeteer');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const TurndownService = require('turndown');

class MarkdownBuilder {
    constructor() {
        this.browser = null;
        this.turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-',
            emDelimiter: '*'
        });
        
        // 配置Turndown规则
        this.setupTurndownRules();
    }

    setupTurndownRules() {
        // 移除不需要的元素
        this.turndownService.remove(['script', 'style', 'nav', 'header', 'footer', 'aside']);
        
        // 处理图片
        this.turndownService.addRule('images', {
            filter: 'img',
            replacement: function(content, node) {
                const alt = node.getAttribute('alt') || '';
                const src = node.getAttribute('src') || '';
                const title = node.getAttribute('title') || '';
                
                if (!src) return '';
                
                // 如果是相对路径，尝试转换为绝对路径
                let absoluteSrc = src;
                if (src.startsWith('/') || src.startsWith('./') || src.startsWith('../')) {
                    // 这里可以根据需要处理相对路径
                    absoluteSrc = src;
                }
                
                return title ? `![${alt}](${absoluteSrc} "${title}")` : `![${alt}](${absoluteSrc})`;
            }
        });

        // 处理代码块
        this.turndownService.addRule('codeBlocks', {
            filter: function(node) {
                return node.nodeName === 'PRE' && node.firstChild && node.firstChild.nodeName === 'CODE';
            },
            replacement: function(content, node) {
                const code = node.firstChild;
                const language = code.className.replace(/^language-/, '') || '';
                return `\n\`\`\`${language}\n${code.textContent}\n\`\`\`\n`;
            }
        });
    }

    async initBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process'
                ]
            });
        }
        return this.browser;
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    async fetchPageContent(url) {
        const browser = await this.initBrowser();
        const page = await browser.newPage();
        
        try {
            // 设置用户代理
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            
            // 设置视口
            await page.setViewport({ width: 1200, height: 800 });
            
            // 导航到页面
            console.log(`🌐 正在加载页面: ${url}`);
            await page.goto(url, { 
                waitUntil: 'domcontentloaded',
                timeout: 15000 
            });
            
            // 等待页面内容加载
            await page.waitForTimeout(2000);
            
            // 获取页面HTML
            const html = await page.content();
            
            return html;
            
        } catch (error) {
            console.error(`❌ 页面加载失败: ${error.message}`);
            throw error;
        } finally {
            await page.close();
        }
    }

    extractReadableContent(html, url) {
        try {
            // 创建JSDOM实例
            const dom = new JSDOM(html, { url });
            const document = dom.window.document;
            
            // 使用Readability提取主要内容
            const reader = new Readability(document);
            const article = reader.parse();
            
            if (!article) {
                throw new Error('无法提取页面主要内容');
            }
            
            console.log(`📖 提取内容成功: ${article.title}`);
            
            return {
                title: article.title,
                content: article.content,
                textContent: article.textContent,
                length: article.length,
                excerpt: article.excerpt
            };
            
        } catch (error) {
            console.error(`❌ 内容提取失败: ${error.message}`);
            throw error;
        }
    }

    htmlToMarkdown(html) {
        try {
            // 清理HTML
            const cleanHtml = this.cleanHtml(html);
            
            // 转换为Markdown
            const markdown = this.turndownService.turndown(cleanHtml);
            
            // 后处理Markdown
            return this.postProcessMarkdown(markdown);
            
        } catch (error) {
            console.error(`❌ Markdown转换失败: ${error.message}`);
            throw error;
        }
    }

    cleanHtml(html) {
        // 移除多余的空白字符
        let cleaned = html.replace(/\s+/g, ' ');
        
        // 移除空的段落和div
        cleaned = cleaned.replace(/<(p|div)\s*>\s*<\/(p|div)>/gi, '');
        
        // 移除注释
        cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
        
        return cleaned;
    }

    postProcessMarkdown(markdown) {
        // 移除多余的空行
        let processed = markdown.replace(/\n{3,}/g, '\n\n');
        
        // 修复列表格式
        processed = processed.replace(/^(\s*)-\s+/gm, '- ');
        processed = processed.replace(/^(\s*)\d+\.\s+/gm, '$1. ');
        
        // 修复标题格式
        processed = processed.replace(/^(#{1,6})\s*/gm, '$1 ');
        
        // 移除首尾空白
        processed = processed.trim();
        
        return processed;
    }

    async buildMarkdown(url) {
        try {
            console.log(`🔧 开始构建Markdown: ${url}`);
            
            // 1. 获取页面HTML
            const html = await this.fetchPageContent(url);
            
            // 2. 提取可读内容
            const article = this.extractReadableContent(html, url);
            
            // 3. 转换为Markdown
            const markdown = this.htmlToMarkdown(article.content);
            
            console.log(`✅ Markdown构建完成，长度: ${markdown.length} 字符`);
            
            return markdown;
            
        } catch (error) {
            console.error(`❌ Markdown构建失败: ${error.message}`);
            throw error;
        }
    }
}

// 创建单例实例
const markdownBuilder = new MarkdownBuilder();

// 导出函数
async function buildMarkdown(url) {
    return await markdownBuilder.buildMarkdown(url);
}

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n🛑 正在关闭浏览器...');
    await markdownBuilder.closeBrowser();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await markdownBuilder.closeBrowser();
    process.exit(0);
});

module.exports = {
    buildMarkdown,
    MarkdownBuilder
};