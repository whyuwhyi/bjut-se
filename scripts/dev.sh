#!/bin/bash

# ================================================================
# 微信教育平台统一开发管理脚本
# 整合了开发环境和生产环境的管理功能
# ================================================================

set -e

# 切换到项目根目录
cd "$(dirname "$0")/.."

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

# 检查Node.js和npm
check_dependencies() {
  print_step "检查开发环境依赖..."

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

  # 检查Docker
  if ! command -v docker &>/dev/null; then
    print_error "Docker 未安装，请先安装 Docker"
    exit 1
  fi

  # 检查Docker Compose
  if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null; then
    print_error "Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
  fi

  print_info "Docker 环境检查通过 ✓"
}

# 安装前端依赖
install_frontend() {
  print_step "安装前端依赖..."
  cd frontend
  if [ ! -f package.json ]; then
    print_error "frontend/package.json 不存在"
    exit 1
  fi
  npm install
  cd ..
  print_info "前端依赖安装完成 ✓"
}

# 安装管理后台依赖
install_admin() {
  print_step "安装管理后台依赖..."
  cd admin-frontend
  if [ ! -f package.json ]; then
    print_error "admin-frontend/package.json 不存在"
    exit 1
  fi
  npm install
  cd ..
  print_info "管理后台依赖安装完成 ✓"
}

# 安装后端依赖
install_backend() {
  print_step "安装后端依赖..."
  cd backend
  if [ ! -f package.json ]; then
    print_error "backend/package.json 不存在"
    exit 1
  fi
  npm install
  cd ..
  print_info "后端依赖安装完成 ✓"
}

# 检查端口占用
check_ports() {
  print_step "检查端口占用..."

  # 检查3306端口
  if lsof -Pi :3306 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "端口3306已被占用，将尝试停止现有MySQL容器..."
    docker stop $(docker ps -q --filter "expose=3306") 2>/dev/null || true
  fi

  # 检查6379端口
  if lsof -Pi :6379 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "端口6379已被占用，将尝试停止现有Redis容器..."
    docker stop $(docker ps -q --filter "expose=6379") 2>/dev/null || true
  fi
}

# 启动数据库
start_database() {
  print_step "启动数据库和Redis服务..."

  # 检查端口占用
  check_ports

  # 使用docker目录的docker-compose.yml启动服务
  if [ -f docker/docker-compose.yml ]; then
    if command -v docker-compose &>/dev/null; then
      docker-compose -f docker/docker-compose.yml up -d mysql redis
    else
      docker compose -f docker/docker-compose.yml up -d mysql redis
    fi

    print_info "等待数据库启动..."

    # 等待MySQL完全启动
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
      if docker exec wechat-education-mysql mysqladmin ping -h"localhost" --silent 2>/dev/null; then
        break
      fi
      echo -n "."
      sleep 2
      attempt=$((attempt + 1))
    done
    echo ""

    if [ $attempt -eq $max_attempts ]; then
      print_error "数据库启动超时"
      exit 1
    fi

    print_info "数据库服务启动完成 ✓"
  else
    print_error "docker/docker-compose.yml 不存在"
    exit 1
  fi
}

# 检查数据库状态
check_database() {
  print_step "检查数据库状态..."

  # 检查数据库是否已初始化
  local table_count
  table_count=$(docker exec wechat-education-mysql mysql -uappuser -papppassword wechat_education -e "SHOW TABLES;" 2>/dev/null | wc -l || echo "0")

  if [ "$table_count" -gt 1 ]; then
    print_info "数据库已初始化，包含 $table_count 个表 ✓"
    
    # 检查是否有测试数据
    local user_count
    user_count=$(docker exec wechat-education-mysql mysql -uappuser -papppassword wechat_education -e "SELECT COUNT(*) FROM users;" 2>/dev/null | tail -1 || echo "0")
    
    if [ "$user_count" -gt 0 ]; then
      print_info "测试数据完整，用户数: $user_count"
      print_info "测试账号: 13800138001, 13800138002, 13800138003 (密码: 123456)"
    else
      print_warning "数据库表已创建但缺少测试数据"
      print_info "可以运行 './scripts/dev.sh reset-db' 重新初始化完整测试数据"
    fi
  else
    print_warning "数据库未初始化或表结构不完整"
    print_info "可以运行 './scripts/dev.sh reset-db' 重新初始化数据库和测试数据"
  fi
}

# 重置数据库
reset_database() {
  print_step "重置数据库..."

  # 停止数据库容器
  if command -v docker-compose &>/dev/null; then
    docker-compose -f docker/docker-compose.yml stop mysql
    docker-compose -f docker/docker-compose.yml rm -f mysql
  else
    docker compose -f docker/docker-compose.yml stop mysql
    docker compose -f docker/docker-compose.yml rm -f mysql
  fi

  # 删除数据卷
  docker volume rm wechat_software_mysql_data 2>/dev/null || true

  # 重新启动数据库
  start_database

  # 等待数据库完全就绪后执行初始化脚本
  print_step "执行数据库初始化脚本..."
  local max_attempts=5
  local attempt=0
  while [ $attempt -lt $max_attempts ]; do
    if docker exec wechat-education-mysql mysql -u root -prootpassword wechat_education -e "SELECT 1;" >/dev/null 2>&1; then
      # 执行初始化脚本
      docker exec -i wechat-education-mysql mysql -u root -prootpassword wechat_education < database/init/01-init-database.sql
      if [ $? -eq 0 ]; then
        print_info "数据库初始化脚本执行成功 ✓"
        break
      else
        print_error "数据库初始化脚本执行失败"
        exit 1
      fi
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
  done
  echo ""

  if [ $attempt -eq $max_attempts ]; then
    print_error "数据库初始化超时"
    exit 1
  fi

  print_info "数据库重置完成 ✓"
}

# 启动后端开发服务器
start_backend() {
  print_step "启动后端开发服务器..."
  cd backend

  # 检查环境配置文件
  if [ ! -f .env ]; then
    if [ -f ../.env ]; then
      print_info "使用项目根目录的 .env 配置文件"
    else
      print_warning "未找到 .env 配置文件，使用默认配置"
    fi
  fi

  # 设置开发环境变量
  export NODE_ENV=development
  export DB_HOST=localhost
  export DB_PORT=3306
  export DB_NAME=wechat_education
  export DB_USER=appuser
  export DB_PASSWORD=apppassword
  export REDIS_HOST=localhost
  export REDIS_PORT=6379

  # 后台启动后端服务器
  npm run dev &
  BACKEND_PID=$!
  echo $BACKEND_PID >../backend.pid
  cd ..

  print_info "后端服务器已启动 (PID: $BACKEND_PID) ✓"
  print_info "等待后端服务器准备就绪..."

  # 等待后端服务器启动
  local max_attempts=15
  local attempt=0
  while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:3000/api/v1/health >/dev/null 2>&1; then
      print_info "后端服务器已就绪 ✓"
      break
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
  done
  echo ""

  if [ $attempt -eq $max_attempts ]; then
    print_warning "后端服务器启动可能有问题，请检查日志"
  fi
}

# 启动前端开发服务器
start_frontend() {
  print_step "启动前端H5开发服务器..."

  # 设置开发环境变量
  export NODE_ENV=development

  cd frontend
  npm run dev:h5 &
  FRONTEND_PID=$!
  echo $FRONTEND_PID >../frontend.pid
  cd ..

  print_info "前端开发服务器已启动 (PID: $FRONTEND_PID) ✓"
}

# 启动管理后台开发服务器
start_admin() {
  print_step "启动管理后台开发服务器..."

  # 设置开发环境变量
  export NODE_ENV=development

  cd admin-frontend
  npm run dev &
  ADMIN_PID=$!
  echo $ADMIN_PID >../admin.pid
  cd ..

  print_info "管理后台开发服务器已启动 (PID: $ADMIN_PID) ✓"
  print_info "等待管理后台服务器准备就绪..."

  # 等待管理后台服务器启动
  local max_attempts=15
  local attempt=0
  while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:5173 >/dev/null 2>&1; then
      print_info "管理后台服务器已就绪 ✓"
      break
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
  done
  echo ""

  if [ $attempt -eq $max_attempts ]; then
    print_warning "管理后台服务器启动可能有问题，请检查日志"
  fi
}

# 停止开发服务器
stop_servers() {
  print_step "停止开发服务器..."

  if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if ps -p $FRONTEND_PID >/dev/null 2>&1; then
      kill $FRONTEND_PID 2>/dev/null
      print_info "前端服务器已停止 ✓"
    fi
    rm -f frontend.pid
  fi

  if [ -f admin.pid ]; then
    ADMIN_PID=$(cat admin.pid)
    if ps -p $ADMIN_PID >/dev/null 2>&1; then
      kill $ADMIN_PID 2>/dev/null
      print_info "管理后台服务器已停止 ✓"
    fi
    rm -f admin.pid
  fi

  if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if ps -p $BACKEND_PID >/dev/null 2>&1; then
      kill $BACKEND_PID 2>/dev/null
      print_info "后端服务器已停止 ✓"
    fi
    rm -f backend.pid
  fi

  # 停止Docker容器
  if [ -f docker/docker-compose.yml ]; then
    print_step "停止数据库服务..."
    if command -v docker-compose &>/dev/null; then
      docker-compose -f docker/docker-compose.yml stop mysql redis
    else
      docker compose -f docker/docker-compose.yml stop mysql redis
    fi
    print_info "数据库服务已停止 ✓"
  fi
}

# 显示开发信息
show_dev_info() {
  echo ""
  print_info "开发环境启动完成！"
  echo ""
  echo "🌐 服务访问地址："
  echo "   - 前端H5: http://localhost:8080"
  echo "   - 管理后台: http://localhost:5173"
  echo "   - 后端API: http://localhost:3000"
  echo "   - 健康检查: http://localhost:3000/api/v1/health"
  echo ""
  echo "📚 数据库信息："
  echo "   - MySQL: localhost:3306"
  echo "   - Redis: localhost:6379"
  echo "   - 数据库: wechat_education"
  echo "   - 用户: appuser"
  echo ""
  echo "👤 测试账号："
  echo "   - 普通用户: 13800138002, 13800138003 (密码: 123456)"
  echo "   - 管理员: 13800138001 (密码: 123456)"
  echo ""
  echo "🛠️  开发命令："
  echo "   - 停止服务: ./scripts/dev.sh stop"
  echo "   - 重启服务: ./scripts/dev.sh restart"
  echo "   - 查看日志: ./scripts/dev.sh logs"
  echo "   - 运行测试: ./scripts/dev.sh test"
  echo "   - 重置数据库: ./scripts/dev.sh reset-db"
  echo ""
  echo "按 Ctrl+C 停止所有服务"
}

# 查看日志
show_logs() {
  print_info "显示服务日志..."
  if [ -f backend.pid ] && [ -f frontend.pid ]; then
    if [ -d backend/logs ]; then
      tail -f backend/logs/*.log 2>/dev/null &
    fi
    # 显示Docker容器日志
    if [ -f docker/docker-compose.yml ]; then
      if command -v docker-compose &>/dev/null; then
        docker-compose -f docker/docker-compose.yml logs -f mysql redis &
      else
        docker compose -f docker/docker-compose.yml logs -f mysql redis &
      fi
    fi
    wait
  else
    print_warning "服务未运行"
  fi
}

# 运行测试
run_tests() {
  print_step "运行测试..."

  # 确保数据库运行
  start_database

  # 后端测试
  print_step "运行后端测试..."
  cd backend
  npm test
  cd ..

  # 前端测试（如果存在）
  cd frontend
  if grep -q "test:h5" package.json 2>/dev/null; then
    print_step "运行前端测试..."
    npm run test:h5
  fi
  cd ..

  print_info "测试完成 ✓"
}

# 显示服务状态
show_status() {
  print_step "检查服务状态..."

  # 检查前端进程
  if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if ps -p $FRONTEND_PID >/dev/null 2>&1; then
      print_info "前端服务器运行中 (PID: $FRONTEND_PID) ✓"
    else
      print_warning "前端服务器未运行"
    fi
  else
    print_warning "前端服务器未启动"
  fi

  # 检查管理后台进程
  if [ -f admin.pid ]; then
    ADMIN_PID=$(cat admin.pid)
    if ps -p $ADMIN_PID >/dev/null 2>&1; then
      print_info "管理后台服务器运行中 (PID: $ADMIN_PID) ✓"
    else
      print_warning "管理后台服务器未运行"
    fi
  else
    print_warning "管理后台服务器未启动"
  fi

  # 检查后端进程
  if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if ps -p $BACKEND_PID >/dev/null 2>&1; then
      print_info "后端服务器运行中 (PID: $BACKEND_PID) ✓"
    else
      print_warning "后端服务器未运行"
    fi
  else
    print_warning "后端服务器未启动"
  fi

  # 检查Docker容器
  if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(mysql|redis)"; then
    print_info "数据库服务运行正常 ✓"
  else
    print_warning "数据库服务未运行"
  fi
}

# 启动生产环境
start_prod_mode() {
  print_step "启动生产环境..."

  # 设置生产环境变量
  export NODE_ENV=production

  # 检查环境配置
  if [ ! -f ".env" ]; then
    print_warning ".env文件不存在，从示例文件复制..."
    if [ -f ".env.example" ]; then
      cp .env.example .env
      print_info "已创建.env文件，请根据需要修改配置"
    else
      print_error ".env.example文件不存在"
      exit 1
    fi
  fi

  # 构建并启动所有服务
  if command -v docker-compose &>/dev/null; then
    docker-compose -f docker/docker-compose.yml up --build -d
  else
    docker compose -f docker/docker-compose.yml up --build -d
  fi

  print_info "生产环境启动完成 ✓"
  print_info "服务地址: http://localhost"
  print_info "后端API: http://localhost:3000"
}

# 主函数
main() {
  case "${1:-start}" in
  "start")
    check_dependencies
    install_frontend
    install_admin
    install_backend
    start_database
    check_database
    start_backend
    start_frontend
    start_admin
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
    sleep 3
    main start
    ;;
  "logs")
    show_logs
    ;;
  "test")
    run_tests
    ;;
  "status")
    show_status
    ;;
  "reset-db")
    reset_database
    ;;
  "prod")
    check_dependencies
    start_prod_mode
    ;;
  "install-deps")
    install_frontend
    install_admin
    install_backend
    ;;
  "help" | "-h" | "--help")
    echo "微信教育平台统一管理脚本"
    echo ""
    echo "用法: $0 [命令]"
    echo ""
    echo "命令："
    echo "  start        - 启动开发环境（默认）"
    echo "  prod         - 启动生产环境"
    echo "  stop         - 停止所有服务"
    echo "  restart      - 重启所有服务"
    echo "  logs         - 查看服务日志"
    echo "  test         - 运行测试"
    echo "  status       - 显示服务状态"
    echo "  reset-db     - 重置数据库"
    echo "  install-deps - 安装项目依赖"
    echo ""
    echo "  help         - 显示帮助"
    echo ""
    echo "示例："
    echo "  $0 start      # 启动开发环境"
    echo "  $0 prod       # 启动生产环境"
    echo "  $0 status     # 检查服务状态"
    echo "  $0 reset-db   # 重置数据库"
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

