#!/bin/bash

# 修复项目中的Windows行尾符问题

echo "🔧 检查并修复项目中的行尾符问题..."

# 查找所有脚本文件
SCRIPT_FILES=$(find . -name "*.sh" -type f)

for file in $SCRIPT_FILES; do
    if file "$file" | grep -q "CRLF"; then
        echo "修复: $file"
        sed -i 's/\r$//' "$file"
    else
        echo "正常: $file"
    fi
done

# 检查其他可能有问题的文件
OTHER_FILES=$(find . -name "*.yml" -o -name "*.yaml" -o -name "*.conf" -type f)

for file in $OTHER_FILES; do
    if file "$file" | grep -q "CRLF"; then
        echo "修复: $file"
        sed -i 's/\r$//' "$file"
    fi
done

echo "✅ 行尾符检查完成！"