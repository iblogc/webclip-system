const fs = require('fs').promises;
const path = require('path');
const { initGitRepo } = require('./client/git-sync');

class SetupWizard {
    constructor() {
        this.configPath = path.join(__dirname, 'config/config.json');
    }

    async loadConfig() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('❌ 配置文件加载失败:', error.message);
            return null;
        }
    }

    async saveConfig(config) {
        try {
            await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf8');
            console.log('✅ 配置文件保存成功');
        } catch (error) {
            console.error('❌ 配置文件保存失败:', error.message);
            throw error;
        }
    }

    async setupGitRepo() {
        const config = await this.loadConfig();
        if (!config) return;

        const outputDir = config.output_dir.startsWith('~/') 
            ? path.join(require('os').homedir(), config.output_dir.slice(2))
            : config.output_dir;

        console.log('🔧 设置Git仓库...');
        
        try {
            // 询问是否要初始化Git仓库
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const question = (query) => new Promise(resolve => rl.question(query, resolve));

            const shouldInit = await question('是否初始化Git仓库? (y/n): ');
            
            if (shouldInit.toLowerCase() === 'y') {
                const remoteUrl = await question('远程仓库URL (可选，直接回车跳过): ');
                
                await initGitRepo(outputDir, remoteUrl.trim() || null);
                
                if (remoteUrl.trim()) {
                    console.log('\n📝 下一步操作:');
                    console.log('1. 在GitHub上创建对应的仓库');
                    console.log('2. 执行首次推送:');
                    console.log(`   cd "${outputDir}"`);
                    console.log('   git push -u origin main');
                }
            }

            rl.close();
            
        } catch (error) {
            console.error('❌ Git仓库设置失败:', error.message);
        }
    }

    async setupLaunchd() {
        if (process.platform !== 'darwin') {
            console.log('⚠️ 当前系统不是macOS，跳过launchd设置');
            return;
        }

        console.log('🔧 设置macOS定时任务...');
        
        try {
            const plistPath = path.join(__dirname, 'launchd/com.webclip.processor.plist');
            const plistContent = await fs.readFile(plistPath, 'utf8');
            
            // 替换路径占位符
            const currentDir = __dirname;
            const nodePath = process.execPath;
            
            const updatedContent = plistContent
                .replace('/path/to/webclip-system/client/process_gist.js', path.join(currentDir, 'client/process_gist.js'))
                .replace('/path/to/webclip-system', currentDir)
                .replace('/usr/local/bin/node', nodePath);
            
            // 保存到用户的LaunchAgents目录
            const userLaunchAgents = path.join(require('os').homedir(), 'Library/LaunchAgents');
            await fs.mkdir(userLaunchAgents, { recursive: true });
            
            const targetPath = path.join(userLaunchAgents, 'com.webclip.processor.plist');
            await fs.writeFile(targetPath, updatedContent, 'utf8');
            
            console.log('✅ launchd配置文件已创建');
            console.log('\n📝 下一步操作:');
            console.log('1. 加载定时任务:');
            console.log(`   launchctl load ${targetPath}`);
            console.log('2. 启动定时任务:');
            console.log('   launchctl start com.webclip.processor');
            console.log('3. 查看任务状态:');
            console.log('   launchctl list | grep webclip');
            
        } catch (error) {
            console.error('❌ launchd设置失败:', error.message);
        }
    }

    async setupWindowsTask() {
        if (process.platform !== 'win32') {
            console.log('⚠️ 当前系统不是Windows，跳过任务计划设置');
            return;
        }

        console.log('🔧 设置Windows定时任务...');
        
        const taskName = 'WebClipProcessor';
        const scriptPath = path.join(__dirname, 'client/process_gist.js');
        const nodePath = process.execPath;
        
        // 创建任务计划命令
        const createTaskCmd = `schtasks /create /tn "${taskName}" /tr "\\"${nodePath}\\" \\"${scriptPath}\\"" /sc minute /mo 10 /f`;
        
        console.log('📝 请以管理员身份运行以下命令:');
        console.log(createTaskCmd);
        console.log('\n或者手动在任务计划程序中创建任务:');
        console.log(`- 程序: ${nodePath}`);
        console.log(`- 参数: "${scriptPath}"`);
        console.log('- 触发器: 每10分钟执行一次');
    }

    async checkDependencies() {
        console.log('🔍 检查依赖项...');
        
        const requiredPackages = [
            'puppeteer',
            '@mozilla/readability',
            'turndown',
            'jsdom',
            'axios',
            'js-yaml',
            'openai',
            'simple-git'
        ];

        const packageJson = require('./package.json');
        const dependencies = packageJson.dependencies || {};
        
        const missing = requiredPackages.filter(pkg => !dependencies[pkg]);
        
        if (missing.length > 0) {
            console.log('❌ 缺少以下依赖项:');
            missing.forEach(pkg => console.log(`  - ${pkg}`));
            console.log('\n请运行: npm install');
            return false;
        }
        
        console.log('✅ 所有依赖项已安装');
        return true;
    }

    async validateConfig() {
        console.log('🔍 验证配置文件...');
        
        const config = await this.loadConfig();
        if (!config) return false;

        const required = ['gist_id', 'github_token', 'output_dir'];
        const missing = required.filter(key => !config[key] || config[key].includes('your-'));
        
        if (missing.length > 0) {
            console.log('❌ 配置文件中缺少以下必需项:');
            missing.forEach(key => console.log(`  - ${key}`));
            console.log('\n请编辑 config/config.json 文件');
            return false;
        }

        // 检查AI配置
        if (!config.ai || !config.ai.providers || config.ai.providers.length === 0) {
            console.log('⚠️ 未配置AI提供商，将跳过摘要生成');
        } else {
            const validProviders = config.ai.providers.filter(p => 
                p.api_key && !p.api_key.includes('your-')
            );
            if (validProviders.length === 0) {
                console.log('⚠️ 所有AI提供商的API密钥都未配置');
            }
        }

        console.log('✅ 配置文件验证通过');
        return true;
    }

    async run() {
        console.log('🚀 Web收藏系统设置向导\n');

        // 1. 检查依赖
        const depsOk = await this.checkDependencies();
        if (!depsOk) return;

        // 2. 验证配置
        const configOk = await this.validateConfig();
        if (!configOk) return;

        // 3. 设置Git仓库
        await this.setupGitRepo();

        // 4. 设置定时任务
        if (process.platform === 'darwin') {
            await this.setupLaunchd();
        } else if (process.platform === 'win32') {
            await this.setupWindowsTask();
        } else {
            console.log('⚠️ 当前系统不支持自动设置定时任务，请手动配置');
            console.log('建议每10分钟执行一次: node client/process_gist.js');
        }

        console.log('\n🎉 设置完成！');
        console.log('\n📝 接下来的步骤:');
        console.log('1. 在浏览器中安装油猴脚本 (oilmonkey/clip-to-gist.user.js)');
        console.log('2. 修改脚本中的GIST_ID和GITHUB_TOKEN');
        console.log('3. 开始收藏网页！');
    }
}

// 如果直接运行此文件
if (require.main === module) {
    const wizard = new SetupWizard();
    wizard.run().catch(console.error);
}

module.exports = SetupWizard;