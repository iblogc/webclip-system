const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs').promises;

async function syncToGit(outputDir, title, commitMessageTemplate) {
    try {
        console.log(`🔄 开始Git同步: ${outputDir}`);
        
        // 确保输出目录存在
        await fs.mkdir(outputDir, { recursive: true });
        
        const git = simpleGit(outputDir);
        
        // 检查是否是Git仓库
        const isRepo = await git.checkIsRepo();
        if (!isRepo) {
            console.log('📁 初始化Git仓库...');
            await git.init();
            
            // 创建.gitignore文件
            const gitignorePath = path.join(outputDir, '.gitignore');
            const gitignoreContent = `# 系统文件
.DS_Store
Thumbs.db

# 错误日志
errors/
*.log

# 临时文件
*.tmp
*.temp
`;
            await fs.writeFile(gitignorePath, gitignoreContent, 'utf8');
        }
        
        // 检查是否有远程仓库
        const remotes = await git.getRemotes(true);
        if (remotes.length === 0) {
            console.log('⚠️ 未配置远程仓库，仅执行本地提交');
        }
        
        // 添加所有更改
        await git.add('.');
        
        // 检查是否有更改需要提交
        const status = await git.status();
        if (status.files.length === 0) {
            console.log('📝 没有更改需要提交');
            return;
        }
        
        // 生成提交消息
        const commitMessage = commitMessageTemplate.replace('{title}', title);
        
        // 提交更改
        await git.commit(commitMessage);
        console.log(`✅ 本地提交成功: ${commitMessage}`);
        
        // 推送到远程仓库（如果存在）
        if (remotes.length > 0) {
            try {
                // 获取当前分支
                const branches = await git.branch();
                const currentBranch = branches.current;
                
                // 推送到远程
                await git.push('origin', currentBranch);
                console.log(`🚀 推送到远程仓库成功: ${currentBranch}`);
            } catch (pushError) {
                console.warn('⚠️ 推送到远程仓库失败:', pushError.message);
                console.log('💡 提示: 请检查远程仓库配置和网络连接');
            }
        }
        
    } catch (error) {
        console.error('❌ Git同步失败:', error.message);
        throw error;
    }
}

async function initGitRepo(outputDir, remoteUrl = null) {
    try {
        console.log(`🔧 初始化Git仓库: ${outputDir}`);
        
        // 确保目录存在
        await fs.mkdir(outputDir, { recursive: true });
        
        const git = simpleGit(outputDir);
        
        // 初始化仓库
        await git.init();
        
        // 添加远程仓库
        if (remoteUrl) {
            await git.addRemote('origin', remoteUrl);
            console.log(`🔗 添加远程仓库: ${remoteUrl}`);
        }
        
        // 创建README文件
        const readmePath = path.join(outputDir, 'README.md');
        const readmeContent = `# 我的知识库

这是通过Web收藏系统自动生成的知识库。

## 目录结构

- \`阅读/\` - 阅读相关文章
- \`写作/\` - 写作相关资源
- \`设计/\` - 设计相关内容
- \`产品/\` - 产品相关文档
- \`技术/\` - 技术文章和资源
- \`其他/\` - 其他分类内容

## 使用说明

每个Markdown文件都包含以下信息：
- 原文标题和链接
- 创建时间和分类
- AI生成的摘要和标签
- 完整的文章内容

---

*此仓库由Web收藏系统自动维护*
`;
        
        await fs.writeFile(readmePath, readmeContent, 'utf8');
        
        // 创建.gitignore
        const gitignorePath = path.join(outputDir, '.gitignore');
        const gitignoreContent = `# 系统文件
.DS_Store
Thumbs.db

# 错误日志
errors/
*.log

# 临时文件
*.tmp
*.temp
`;
        await fs.writeFile(gitignorePath, gitignoreContent, 'utf8');
        
        // 初始提交
        await git.add('.');
        await git.commit('初始化知识库');
        
        console.log('✅ Git仓库初始化完成');
        
        if (remoteUrl) {
            console.log('💡 提示: 请手动执行首次推送:');
            console.log(`   cd "${outputDir}"`);
            console.log('   git push -u origin main');
        }
        
    } catch (error) {
        console.error('❌ Git仓库初始化失败:', error.message);
        throw error;
    }
}

async function getGitStatus(outputDir) {
    try {
        const git = simpleGit(outputDir);
        const isRepo = await git.checkIsRepo();
        
        if (!isRepo) {
            return { isRepo: false };
        }
        
        const status = await git.status();
        const remotes = await git.getRemotes(true);
        const branches = await git.branch();
        
        return {
            isRepo: true,
            status,
            remotes,
            currentBranch: branches.current,
            hasChanges: status.files.length > 0
        };
        
    } catch (error) {
        console.error('❌ 获取Git状态失败:', error.message);
        return { isRepo: false, error: error.message };
    }
}

module.exports = {
    syncToGit,
    initGitRepo,
    getGitStatus
};