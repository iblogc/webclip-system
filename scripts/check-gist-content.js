#!/usr/bin/env node

/**
 * Gist内容预检查脚本
 * 在Actions早期检查Gist是否有待处理的内容，避免不必要的资源消耗
 */

const https = require('https');
const { setOutput, setFailed, info, warning } = require('@actions/core');

async function checkGistContent() {
    const gistId = process.env.GIST_ID;
    const token = process.env.TOKEN;
    
    if (!gistId || !token) {
        setFailed('缺少必要的环境变量: GIST_ID 或 TOKEN');
        return;
    }
    
    try {
        info('🔍 检查Gist内容...');
        
        const gistData = await fetchGist(gistId, token);
        
        if (!gistData || !gistData.files) {
            warning('⚠️ 无法获取Gist文件信息');
            setOutput('should_process', 'true'); // 保险起见，继续处理
            return;
        }
        
        // 检查是否有待处理的内容
        const hasContent = checkForContent(gistData.files);
        
        if (hasContent) {
            info('✅ 发现待处理内容，继续执行Actions');
            setOutput('should_process', 'true');
            setOutput('content_summary', hasContent.summary);
        } else {
            info('📭 Gist为空或无待处理内容，跳过处理');
            setOutput('should_process', 'false');
            setOutput('skip_reason', 'Gist内容为空');
        }
        
    } catch (error) {
        warning(`检查Gist时出错: ${error.message}`);
        // 出错时保险起见继续处理
        setOutput('should_process', 'true');
        setOutput('skip_reason', `检查失败: ${error.message}`);
    }
}

function fetchGist(gistId, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: `/gists/${gistId}`,
            method: 'GET',
            headers: {
                'Authorization': `token ${token}`,
                'User-Agent': 'WebClip-Processor',
                'Accept': 'application/vnd.github.v3+json'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error(`解析响应失败: ${e.message}`));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('请求超时'));
        });
        
        req.end();
    });
}

function checkForContent(files) {
    const contentFiles = [];
    let totalSize = 0;
    
    for (const [filename, fileData] of Object.entries(files)) {
        if (!fileData.content) continue;
        
        const content = fileData.content.trim();
        if (content.length === 0) continue;
        
        // 跳过明显的空文件或占位符
        if (content === '[]' || content === '{}' || content === 'null') continue;
        
        contentFiles.push({
            filename,
            size: content.length,
            preview: content.substring(0, 100)
        });
        
        totalSize += content.length;
    }
    
    if (contentFiles.length === 0) {
        return null;
    }
    
    return {
        summary: `发现 ${contentFiles.length} 个文件，总大小 ${totalSize} 字符`,
        files: contentFiles,
        totalSize
    };
}

// 如果直接运行此脚本
if (require.main === module) {
    checkGistContent().catch(error => {
        setFailed(`预检查失败: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { checkGistContent };