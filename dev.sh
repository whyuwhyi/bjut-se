#!/bin/bash

# 开发环境启动脚本 - 使用 scripts/dev.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
  echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查脚本目录
if [ -f "scripts/dev.sh" ]; then
  print_info "使用 scripts/dev.sh 启动开发环境..."
  exec ./scripts/dev.sh "$@"
else
  print_error "scripts/dev.sh 不存在"
  exit 1
fi

