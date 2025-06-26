#!/bin/bash

# 开发环境启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 检查Node.js和npm
check_dependencies() {
  print_info "检查开发环境依赖..."

  if ! command -v node &>/dev/null; then
    print_error "Node.js 未安装，请先安装 Node.js 16+"
    exit 1
  fi

  if ! command -v npm &>/dev/null; then
    print_error "npm 未安装，请先安装 npm"
    exit 1
  fi

  NODE_VERSION=$(node -v | sed 's/v//')
  MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)

  if [ "$MAJOR_VERSION" -lt 16 ]; then
    print_error "Node.js 版本过低，需要 16.0.0 以上版本"
    exit 1
  fi

  print_info "Node.js 版本: $NODE_VERSION ✓"
}

# 安装前端依赖
install_frontend() {
  print_info "安装前端依赖..."
  npm install
  print_info "前端依赖安装完成"
}

# 安装后端依赖
install_backend() {
  print_info "安装后端依赖..."
  cd backend
  if [ ! -f package.json ]; then
    print_error "backend/package.json 不存在"
    exit 1
  fi
  npm install
  cd ..
  print_info "后端依赖安装完成"
}

# 初始化数据库
init_database() {
  print_info "初始化数据库..."

  if ! command -v docker &>/dev/null; then
    print_warning "Docker 未安装，请手动初始化数据库"
    return
  fi

  # 检查MySQL容器是否运行
  if ! docker ps | grep -q mysql; then
    print_error "MySQL容器未运行，请先启动数据库"
    return
  fi

  # 等待MySQL完全启动
  print_info "等待MySQL准备就绪..."
  sleep 5

  # 检查是否需要初始化
  MYSQL_CONTAINER=$(docker ps --filter "name=mysql" --format "{{.Names}}" | head -1)
  if [ -z "$MYSQL_CONTAINER" ]; then
    print_warning "找不到MySQL容器"
    return
  fi

  # 检查数据库是否已初始化
  TABLE_COUNT=$(docker exec $MYSQL_CONTAINER mysql -uroot -ppassword -e "USE wechat_education; SHOW TABLES;" 2>/dev/null | wc -l || echo "0")
  
  if [ "$TABLE_COUNT" -gt 1 ]; then
    print_info "数据库已初始化，跳过数据初始化"
  else
    print_info "初始化测试数据..."
    # 执行数据库初始化脚本
    if [ -f "database/init/02-init-test-data.sql" ]; then
      docker exec $MYSQL_CONTAINER mysql -uroot -ppassword wechat_education < database/init/02-init-test-data.sql
      print_info "测试数据初始化完成"
      print_info "测试账号: 13800138001, 13800138002, 13800138003 (密码: 123456)"
    else
      print_warning "初始化脚本不存在: database/init/02-init-test-data.sql"
    fi
  fi
}

# 启动数据库
start_database() {
  print_info "启动数据库服务..."

  if ! command -v docker &>/dev/null; then
    print_warning "Docker 未安装，请手动启动 MySQL 和 Redis"
    return
  fi

  # 启动数据库容器
  cd backend
  if [ -f docker-compose.yml ]; then
    if command -v docker-compose &>/dev/null; then
      docker-compose up -d mysql redis
    elif docker compose version &>/dev/null; then
      docker compose up -d mysql redis
    else
      print_warning "Docker Compose 不可用，请确保已安装 docker-compose"
      exit 1
    fi
    print_info "等待数据库启动..."
    sleep 10
  else
    print_warning "docker-compose.yml 不存在，请手动启动数据库"
    # 直接启动MySQL容器
    if ! docker ps | grep -q wechat_education_mysql; then
      print_info "启动MySQL容器..."
      docker run -d --name wechat_education_mysql \
        -e MYSQL_ROOT_PASSWORD=password \
        -e MYSQL_DATABASE=wechat_education \
        -p 3306:3306 \
        -v $(pwd)/../database/init:/docker-entrypoint-initdb.d \
        --restart unless-stopped \
        mysql:8.0
      print_info "等待MySQL启动..."
      sleep 15
    fi
  fi
  cd ..
  
  # 初始化数据库
  init_database
}

# 启动后端开发服务器
start_backend() {
  print_info "启动后端开发服务器..."
  cd backend

  # 创建环境配置文件
  if [ ! -f .env ]; then
    if [ -f .env.example ]; then
      cp .env.example .env
      print_warning "已创建 .env 文件，请根据需要修改配置"
    else
      print_error ".env.example 文件不存在"
      exit 1
    fi
  fi

  # 后台启动后端服务器
  npm run dev &
  BACKEND_PID=$!
  echo $BACKEND_PID >../backend.pid
  cd ..

  print_info "后端服务器已启动 (PID: $BACKEND_PID)"
  print_info "等待后端服务器准备就绪..."
  sleep 5
}

# 启动前端开发服务器
start_frontend() {
  print_info "启动前端H5开发服务器..."
  npm run dev:h5 &
  FRONTEND_PID=$!
  echo $FRONTEND_PID >frontend.pid

  print_info "前端开发服务器已启动 (PID: $FRONTEND_PID)"
}

# 停止开发服务器
stop_servers() {
  print_info "停止开发服务器..."

  if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if ps -p $FRONTEND_PID >/dev/null; then
      kill $FRONTEND_PID
      print_info "前端服务器已停止"
    fi
    rm -f frontend.pid
  fi

  if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if ps -p $BACKEND_PID >/dev/null; then
      kill $BACKEND_PID
      print_info "后端服务器已停止"
    fi
    rm -f backend.pid
  fi
}

# 显示开发信息
show_dev_info() {
  print_info "开发环境启动完成！"
  echo ""
  echo "服务访问地址："
  echo "- 前端H5: http://localhost:8080"
  echo "- 后端API: http://localhost:3000"
  echo "- API文档: http://localhost:3000/api/v1/health"
  echo ""
  echo "开发命令："
  echo "- 停止服务: ./dev.sh stop"
  echo "- 重启服务: ./dev.sh restart"
  echo "- 查看日志: ./dev.sh logs"
  echo "- 运行测试: ./dev.sh test"
  echo ""
  echo "按 Ctrl+C 停止所有服务"
}

# 查看日志
show_logs() {
  print_info "显示服务日志..."
  if [ -f backend.pid ] && [ -f frontend.pid ]; then
    tail -f backend/logs/*.log &
  else
    print_warning "服务未运行"
  fi
}

# 运行测试
run_tests() {
  print_info "运行测试..."

  # 后端测试
  print_info "运行后端测试..."
  cd backend
  npm test
  cd ..

  # 前端测试
  print_info "运行前端测试..."
  npm run test:h5
}

# 主函数
main() {
  case "${1:-start}" in
  "start")
    check_dependencies
    install_frontend
    install_backend
    start_database
    start_backend
    start_frontend
    show_dev_info

    # 等待用户中断
    trap stop_servers EXIT
    wait
    ;;
  "stop")
    stop_servers
    ;;
  "restart")
    stop_servers
    sleep 2
    main start
    ;;
  "logs")
    show_logs
    ;;
  "test")
    run_tests
    ;;
  "help" | "-h" | "--help")
    echo "用法: $0 [命令]"
    echo ""
    echo "可用命令："
    echo "  start    - 启动开发环境（默认）"
    echo "  stop     - 停止所有服务"
    echo "  restart  - 重启所有服务"
    echo "  logs     - 查看服务日志"
    echo "  test     - 运行测试"
    echo "  help     - 显示帮助"
    ;;
  *)
    print_error "未知命令: $1"
    echo "使用 '$0 help' 查看可用命令"
    exit 1
    ;;
  esac
}

# 执行主函数
main "$@"
