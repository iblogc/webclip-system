#!/bin/bash

# Gist内容预检查脚本 - Shell版本
# 在Actions早期检查Gist是否有待处理的内容，避免不必要的资源消耗

set -e

# 检查必要的环境变量
if [ -z "$GIST_ID" ] || [ -z "$TOKEN" ]; then
    echo "❌ 缺少必要的环境变量: GIST_ID 或 TOKEN"
    exit 1
fi

echo "🔍 检查Gist内容..."

# 使用curl获取Gist数据
response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -H "Authorization: token $TOKEN" \
    -H "User-Agent: WebClip-Processor" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/gists/$GIST_ID")

# 分离HTTP状态码和响应体
http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')

# 检查HTTP状态码
if [ "$http_code" != "200" ]; then
    echo "⚠️ 获取Gist失败 (HTTP $http_code)，保险起见继续处理"
    echo "should_process=true" >> $GITHUB_OUTPUT
    echo "skip_reason=获取Gist失败: HTTP $http_code" >> $GITHUB_OUTPUT
    exit 0
fi

# 提取webclip-queue.json文件内容
queue_content=$(echo "$response_body" | jq -r '.files["webclip-queue.json"].content // empty' 2>/dev/null || echo "")

# 检查是否获取到队列文件
if [ -z "$queue_content" ]; then
    echo "📭 未找到webclip-queue.json文件，跳过处理"
    echo "should_process=false" >> $GITHUB_OUTPUT
    echo "skip_reason=未找到webclip-queue.json文件" >> $GITHUB_OUTPUT
    exit 0
fi

# 去除空白字符
queue_content_trimmed=$(echo "$queue_content" | tr -d '[:space:]')

# 检查内容是否为空
if [ -z "$queue_content_trimmed" ]; then
    echo "📭 webclip-queue.json文件为空，跳过处理"
    echo "should_process=false" >> $GITHUB_OUTPUT
    echo "skip_reason=webclip-queue.json文件为空" >> $GITHUB_OUTPUT
    exit 0
fi

# 解析JSON并检查items数组
item_count=$(echo "$queue_content" | jq '.items | length' 2>/dev/null || echo "error")

if [ "$item_count" = "error" ]; then
    echo "⚠️ 解析webclip-queue.json失败，保险起见继续处理"
    echo "should_process=true" >> $GITHUB_OUTPUT
    echo "skip_reason=JSON解析失败，建议检查格式" >> $GITHUB_OUTPUT
    exit 0
fi

# 检查items数量
if [ "$item_count" -eq 0 ]; then
    echo "📭 webclip-queue.json中无待处理项目，跳过处理"
    echo "should_process=false" >> $GITHUB_OUTPUT
    echo "skip_reason=webclip-queue.json中无待处理项目" >> $GITHUB_OUTPUT
else
    echo "✅ 发现 $item_count 个待处理项目，继续执行Actions"
    echo "should_process=true" >> $GITHUB_OUTPUT
    echo "content_summary=发现 $item_count 个待处理项目" >> $GITHUB_OUTPUT
    
    # 提取前3个项目作为预览
    preview=$(echo "$queue_content" | jq -r '.items[:3] | map("- " + (.title // "未知标题") + " (" + (.url // "未知URL") + ")") | join("\n")' 2>/dev/null || echo "")
    if [ -n "$preview" ]; then
        echo "content_preview<<EOF" >> $GITHUB_OUTPUT
        echo "$preview" >> $GITHUB_OUTPUT
        echo "EOF" >> $GITHUB_OUTPUT
    fi
fi

echo "🎯 检查完成"