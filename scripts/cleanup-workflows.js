const { Octokit } = require('@octokit/rest');
const core = require('@actions/core');

async function cleanupWorkflows() {
  try {
    const token = process.env.TOKEN;
    if (!token) {
      console.log('⚠️ 未提供GitHub Token，跳过清理');
      return;
    }
    
    console.log('🧹 开始清理旧的工作流运行记录...');
    
    const octokit = new Octokit({
      auth: token
    });
    
    // 获取当前仓库信息
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    
    // 获取工作流列表
    const { data: workflows } = await octokit.rest.actions.listRepoWorkflows({
      owner,
      repo
    });
    
    const webclipWorkflow = workflows.workflows.find(
      workflow => workflow.name === 'Web Clip Processor'
    );
    
    if (!webclipWorkflow) {
      console.log('⚠️ 未找到Web Clip Processor工作流');
      return;
    }
    
    // 获取工作流运行记录
    const { data: runs } = await octokit.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: webclipWorkflow.id,
      per_page: 100
    });
    
    console.log(`📋 发现 ${runs.workflow_runs.length} 个工作流运行记录`);
    
    // 保留最近的20个运行记录，删除其余的
    const runsToDelete = runs.workflow_runs.slice(20);
    
    if (runsToDelete.length === 0) {
      console.log('✅ 无需清理，运行记录数量合理');
      return;
    }
    
    console.log(`🗑️ 准备删除 ${runsToDelete.length} 个旧的运行记录`);
    
    let deletedCount = 0;
    let failedCount = 0;
    
    for (const run of runsToDelete) {
      try {
        // 只删除已完成的运行记录
        if (run.status === 'completed') {
          await octokit.rest.actions.deleteWorkflowRun({
            owner,
            repo,
            run_id: run.id
          });
          deletedCount++;
          
          // 添加延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.warn(`⚠️ 删除运行记录 ${run.id} 失败: ${error.message}`);
        failedCount++;
      }
    }
    
    console.log(`✅ 清理完成: 删除 ${deletedCount} 个，失败 ${failedCount} 个`);
    
    // 清理工作流日志（可选）
    await cleanupWorkflowLogs(octokit, owner, repo, webclipWorkflow.id);
    
  } catch (error) {
    console.error('❌ 清理工作流失败:', error.message);
    // 清理失败不应该导致整个流程失败
  }
}

async function cleanupWorkflowLogs(octokit, owner, repo, workflowId) {
  try {
    console.log('🧹 清理工作流日志...');
    
    // 获取最近的运行记录
    const { data: runs } = await octokit.rest.actions.listWorkflowRuns({
      owner,
      repo,
      workflow_id: workflowId,
      per_page: 50
    });
    
    // 删除30天前的日志
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let logDeletedCount = 0;
    
    for (const run of runs.workflow_runs) {
      const runDate = new Date(run.created_at);
      
      if (runDate < thirtyDaysAgo && run.status === 'completed') {
        try {
          await octokit.rest.actions.deleteWorkflowRunLogs({
            owner,
            repo,
            run_id: run.id
          });
          logDeletedCount++;
          
          // 添加延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          // 日志可能已经被删除或无权限删除
          if (!error.message.includes('404')) {
            console.warn(`⚠️ 删除日志 ${run.id} 失败: ${error.message}`);
          }
        }
      }
    }
    
    console.log(`✅ 日志清理完成: 删除 ${logDeletedCount} 个日志文件`);
    
  } catch (error) {
    console.warn('⚠️ 日志清理失败:', error.message);
  }
}

if (require.main === module) {
  cleanupWorkflows();
}

module.exports = { cleanupWorkflows };