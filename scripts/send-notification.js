const fs = require('fs').promises;
const nodemailer = require('nodemailer');
const core = require('@actions/core');

async function sendNotification() {
  try {
    const notificationEmail = process.env.NOTIFICATION_EMAIL;
    
    if (!notificationEmail) {
      console.log('📧 未配置通知邮箱，跳过邮件通知');
      return;
    }
    
    console.log('📧 开始发送邮件通知...');
    
    // 读取配置
    const configPath = './temp/config.json';
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    // 读取处理报告
    let report = null;
    try {
      const reportData = await fs.readFile('./temp/report.json', 'utf8');
      report = JSON.parse(reportData);
    } catch (error) {
      console.warn('⚠️ 无法读取处理报告');
    }
    
    // 读取日志
    let logs = '';
    try {
      logs = await fs.readFile('./logs/processor.log', 'utf8');
      // 只保留最后50行日志
      logs = logs.split('\n').slice(-50).join('\n');
    } catch (error) {
      logs = '无法读取日志文件';
    }
    
    // 创建邮件传输器
    const transporter = nodemailer.createTransporter({
      host: config.actions.email_config.smtp_host,
      port: config.actions.email_config.smtp_port,
      secure: config.actions.email_config.smtp_port === 465,
      auth: {
        user: config.actions.email_config.user,
        pass: config.actions.email_config.pass
      }
    });
    
    // 构建邮件内容
    const processResult = process.env.PROCESS_RESULT;
    const isSuccess = processResult === 'success';
    
    const subject = isSuccess 
      ? `✅ Web收藏处理成功 - ${report?.processed || 0}篇文章`
      : `❌ Web收藏处理失败`;
    
    let htmlContent = `
    <h2>${isSuccess ? '✅ 处理成功' : '❌ 处理失败'}</h2>
    <p><strong>执行时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
    `;
    
    if (report) {
      htmlContent += `
      <h3>📊 处理统计</h3>
      <ul>
        <li>成功处理: ${report.processed} 篇</li>
        <li>处理失败: ${report.failed} 篇</li>
        <li>总计: ${report.processed + report.failed} 篇</li>
      </ul>
      `;
      
      if (report.processedItems.length > 0) {
        htmlContent += `
        <h3>✅ 成功处理的文章</h3>
        <ul>
        ${report.processedItems.map(item => 
          `<li><strong>${item.title}</strong> (${item.category})</li>`
        ).join('')}
        </ul>
        `;
      }
      
      if (report.failedItems.length > 0) {
        htmlContent += `
        <h3>❌ 处理失败的文章</h3>
        <ul>
        ${report.failedItems.map(item => 
          `<li><strong>${item.title}</strong><br><small>错误: ${item.error}</small></li>`
        ).join('')}
        </ul>
        `;
      }
    }
    
    htmlContent += `
    <h3>📋 执行日志</h3>
    <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px; overflow-x: auto;">
${logs}
    </pre>
    
    <hr>
    <p><small>此邮件由 GitHub Actions 自动发送</small></p>
    `;
    
    // 发送邮件
    const mailOptions = {
      from: config.actions.email_config.user,
      to: notificationEmail,
      subject: subject,
      html: htmlContent
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ 邮件通知发送成功');
    
  } catch (error) {
    console.error('❌ 邮件通知发送失败:', error.message);
    // 邮件发送失败不应该导致整个流程失败
  }
}

if (require.main === module) {
  sendNotification();
}

module.exports = { sendNotification };