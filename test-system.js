const { buildMarkdown } = require('./client/markdown-builder');
const { summarizeContent } = require('./client/summarize');
const fs = require('fs').promises;
const path = require('path');

async function testMarkdownBuilder() {
    console.log('🧪 测试Markdown构建器...');
    
    try {
        // 测试一个简单的网页
        const testUrl = 'https://httpbin.org/html';
        console.log(`📄 测试URL: ${testUrl}`);
        
        const markdown = await buildMarkdown(testUrl);
        console.log(`✅ Markdown生成成功，长度: ${markdown.length} 字符`);
        console.log('预览:', markdown.substring(0, 200) + '...');
        
        return markdown;
    } catch (error) {
        console.error('❌ Markdown构建测试失败:', error.message);
        return null;
    }
}

async function testAISummarize() {
    console.log('\n🤖 测试AI摘要功能...');
    
    try {
        // 加载配置
        const configPath = path.join(__dirname, 'config/config.json');
        const configData = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configData);
        
        // 检查AI配置
        if (!config.ai || !config.ai.providers || config.ai.providers.length === 0) {
            console.log('⚠️ 未配置AI提供商，跳过AI测试');
            return;
        }
        
        const hasValidProvider = config.ai.providers.some(p => 
            p.api_key && !p.api_key.includes('your-')
        );
        
        if (!hasValidProvider) {
            console.log('⚠️ 所有AI提供商的API密钥都未配置，跳过AI测试');
            return;
        }
        
        const testContent = `
        # 测试文章
        
        这是一篇关于人工智能发展的文章。人工智能（AI）正在快速发展，
        影响着我们生活的方方面面。从自动驾驶汽车到智能助手，
        AI技术正在改变世界。
        
        ## 主要应用领域
        
        1. 自然语言处理
        2. 计算机视觉
        3. 机器学习
        4. 深度学习
        
        未来，AI将在更多领域发挥重要作用。
        `;
        
        const result = await summarizeContent(testContent, config.ai);
        console.log('✅ AI摘要生成成功:');
        console.log('摘要:', result.summary);
        console.log('标签:', result.tags);
        
    } catch (error) {
        console.error('❌ AI摘要测试失败:', error.message);
    }
}

async function testGitOperations() {
    console.log('\n🔄 测试Git操作...');
    
    try {
        const { getGitStatus } = require('./client/git-sync');
        
        // 加载配置
        const configPath = path.join(__dirname, 'config/config.json');
        const configData = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configData);
        
        let outputDir = config.output_dir;
        if (outputDir.startsWith('~/')) {
            const os = require('os');
            outputDir = path.join(os.homedir(), outputDir.slice(2));
        }
        
        const status = await getGitStatus(outputDir);
        
        if (status.isRepo) {
            console.log('✅ Git仓库状态正常');
            console.log('当前分支:', status.currentBranch);
            console.log('是否有更改:', status.hasChanges);
            console.log('远程仓库数量:', status.remotes.length);
        } else {
            console.log('⚠️ 输出目录不是Git仓库');
            console.log('建议运行: node setup.js');
        }
        
    } catch (error) {
        console.error('❌ Git操作测试失败:', error.message);
    }
}

async function runTests() {
    console.log('🚀 开始系统测试\n');
    
    // 1. 测试Markdown构建
    const markdown = await testMarkdownBuilder();
    
    // 2. 测试AI摘要
    await testAISummarize();
    
    // 3. 测试Git操作
    await testGitOperations();
    
    console.log('\n🏁 测试完成');
    
    // 关闭浏览器
    process.exit(0);
}

// 运行测试
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    testMarkdownBuilder,
    testAISummarize,
    testGitOperations
};