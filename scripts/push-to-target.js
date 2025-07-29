const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const core = require('@actions/core');

async function pushToTargetRepo() {
  try {
    console.log('🚀 开始推送到目标仓库...');
    
    // 读取配置
    const configPath = './temp/config.json';
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    const targetRepo = process.env.TARGET_REPO;
    const targetToken = process.env.TOKEN;
    
    if (!targetRepo || !targetToken) {
      throw new Error('缺少目标仓库配置');
    }
    
    // 检查是否有文件需要推送
    const outputDir = './temp/output';
    const files = await getFilesRecursively(outputDir);
    
    if (files.length === 0) {
      console.log('📭 没有文件需要推送');
      return;
    }
    
    console.log(`📁 发现 ${files.length} 个文件需要推送`);
    
    // 克隆目标仓库
    const repoDir = './temp/target-repo';
    const repoUrl = `https://${targetToken}@github.com/${targetRepo}.git`;
    
    console.log('📥 克隆目标仓库...');
    execSync(`git clone ${repoUrl} ${repoDir}`, { stdio: 'inherit' });
    
    // 配置Git用户
    execSync('git config user.name "GitHub Actions"', { cwd: repoDir });
    execSync('git config user.email "actions@github.com"', { cwd: repoDir });
    
    // 复制文件到目标仓库
    console.log('📋 复制文件到目标仓库...');
    await copyFiles(outputDir, repoDir);
    
    // 检查是否有变更
    const status = execSync('git status --porcelain', { cwd: repoDir, encoding: 'utf8' });
    
    if (!status.trim()) {
      console.log('📭 没有文件变更，跳过提交');
      return;
    }
    
    // 添加所有文件
    execSync('git add .', { cwd: repoDir });
    
    // 读取处理报告生成提交信息
    let commitMessage = '更新网页收藏';
    try {
      const reportData = await fs.readFile('./temp/report.json', 'utf8');
      const report = JSON.parse(reportData);
      
      if (report.processed > 0) {
        const titles = report.processedItems.map(item => item.title).slice(0, 20);
        commitMessage = `新增 ${report.processed} 篇文章`;
        if (titles.length > 0) {
          commitMessage += `\n\n包含:\n${titles.map(title => `- ${title}`).join('\n')}`;
          if (report.processed > 20) {
            commitMessage += `\n- 以及其他 ${report.processed - 20} 篇文章`;
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ 无法读取处理报告，使用默认提交信息');
    }
    
    // 提交变更
    console.log('💾 提交变更...');
    execSync(`git commit -m "${commitMessage}"`, { cwd: repoDir });
    
    // 推送到远程仓库
    console.log('🚀 推送到远程仓库...');
    execSync('git push origin main', { cwd: repoDir });
    
    console.log('✅ 成功推送到目标仓库');
    
    // 设置Actions输出
    core.setOutput('pushed-files', files.length.toString());
    core.setOutput('commit-message', commitMessage);
    
  } catch (error) {
    console.error('❌ 推送失败:', error.message);
    core.setFailed(error.message);
    throw error;
  }
}

async function getFilesRecursively(dir) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await getFilesRecursively(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // 目录不存在或无法访问
  }
  
  return files;
}

async function copyFiles(sourceDir, targetDir) {
  const files = await getFilesRecursively(sourceDir);
  
  for (const file of files) {
    const relativePath = path.relative(sourceDir, file);
    const targetPath = path.join(targetDir, relativePath);
    
    // 确保目标目录存在
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    
    // 复制文件
    await fs.copyFile(file, targetPath);
  }
}

if (require.main === module) {
  pushToTargetRepo();
}

module.exports = { pushToTargetRepo };