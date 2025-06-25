#!/bin/bash

# 微信小程序教育资源分享平台部署脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印彩色信息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    print_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    print_info "依赖检查完成"
}

# 创建环境文件
create_env_file() {
    print_info "创建环境配置文件..."
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_warning "已从 .env.example 创建 .env 文件，请根据实际情况修改配置"
        else
            print_error ".env.example 文件不存在"
            exit 1
        fi
    else
        print_info ".env 文件已存在"
    fi
}

# 构建镜像
build_images() {
    print_info "构建 Docker 镜像..."
    docker-compose build --no-cache
    print_info "镜像构建完成"
}

# 启动服务
start_services() {
    print_info "启动服务..."
    docker-compose up -d
    print_info "等待服务启动..."
    sleep 30
}

# 检查服务状态
check_services() {
    print_info "检查服务状态..."
    
    # 检查数据库
    if docker-compose exec mysql mysqladmin ping -h localhost --silent; then
        print_info "MySQL 服务正常"
    else
        print_error "MySQL 服务异常"
        return 1
    fi
    
    # 检查 Redis
    if docker-compose exec redis redis-cli ping | grep -q PONG; then
        print_info "Redis 服务正常"
    else
        print_error "Redis 服务异常"
        return 1
    fi
    
    # 检查后端 API
    if curl -f http://localhost:3000/api/v1/health &> /dev/null; then
        print_info "后端 API 服务正常"
    else
        print_error "后端 API 服务异常"
        return 1
    fi
    
    # 检查 Nginx
    if curl -f http://localhost/health &> /dev/null; then
        print_info "Nginx 服务正常"
    else
        print_error "Nginx 服务异常"
        return 1
    fi
    
    print_info "所有服务运行正常"
}

# 显示服务信息
show_info() {
    print_info "部署完成！"
    echo ""
    echo "服务访问信息："
    echo "- API 健康检查: http://localhost/health"
    echo "- 后端 API: http://localhost/api/v1/"
    echo "- 上传文件: http://localhost/uploads/"
    echo ""
    echo "管理命令："
    echo "- 查看日志: docker-compose logs -f [service_name]"
    echo "- 停止服务: docker-compose down"
    echo "- 重启服务: docker-compose restart [service_name]"
    echo "- 查看状态: docker-compose ps"
}

# 停止服务
stop_services() {
    print_info "停止服务..."
    docker-compose down
    print_info "服务已停止"
}

# 清理
cleanup() {
    print_info "清理资源..."
    docker-compose down -v --remove-orphans
    docker system prune -f
    print_info "清理完成"
}

# 主函数
main() {
    case "${1:-deploy}" in
        "deploy")
            check_dependencies
            create_env_file
            build_images
            start_services
            if check_services; then
                show_info
            else
                print_error "部署失败，请检查日志"
                docker-compose logs
                exit 1
            fi
            ;;
        "start")
            start_services
            check_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            start_services
            check_services
            ;;
        "logs")
            docker-compose logs -f ${2:-}
            ;;
        "status")
            docker-compose ps
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"-h"|"--help")
            echo "使用方法: $0 [命令]"
            echo ""
            echo "可用命令："
            echo "  deploy   - 完整部署（默认）"
            echo "  start    - 启动服务"
            echo "  stop     - 停止服务"
            echo "  restart  - 重启服务"
            echo "  logs     - 查看日志"
            echo "  status   - 查看状态"
            echo "  cleanup  - 清理所有资源"
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