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
            
            // 如果有错误，也输出错误信息
            if (hasContent.error) {
                setOutput('queue_error', hasContent.error);
            }
        } else {
            info('📭 webclip-queue.json为空或无待处理项目，跳过处理');
            setOutput('should_process', 'false');
            setOutput('skip_reason', 'webclip-queue.json中无待处理项目');
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
    // 专门检查 webclip-queue.json 文件
    const queueFile = files['webclip-queue.json'];
    
    if (!queueFile || !queueFile.content) {
        return null; // 没有队列文件
    }
    
    try {
        const content = queueFile.content.trim();
        if (!content) {
            return null; // 文件内容为空
        }
        
        // 解析JSON内容
        const queueData = JSON.parse(content);
        
        // 检查items数组
        if (!queueData.items || !Array.isArray(queueData.items)) {
            return null; // 没有items数组
        }
        
        const itemCount = queueData.items.length;
        
        if (itemCount === 0) {
            return null; // items数组为空
        }
        
        // 有待处理的items
        return {
            summary: `发现 ${itemCount} 个待处理项目`,
            itemCount: itemCount,
            queueSize: content.length,
            items: queueData.items.slice(0, 3).map(item => ({
                title: item.title || '未知标题',
                url: item.url || '未知URL',
                category: item.category || '未分类'
            })) // 只显示前3个项目作为预览
        };
        
    } catch (error) {
        // JSON解析失败，可能文件损坏，保险起见继续处理
        warning(`⚠️ 解析webclip-queue.json失败: ${error.message}`);
        return {
            summary: `队列文件存在但解析失败，建议检查格式`,
            error: error.message,
            queueSize: queueFile.content.length
        };
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    checkGistContent().catch(error => {
        setFailed(`预检查失败: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { checkGistContent };