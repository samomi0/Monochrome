#!/bin/bash

echo "===================================="
echo "Monochrome Timeline 后端服务启动器"
echo "===================================="
echo ""

cd "$(dirname "$0")"

echo "[1/3] 检查 Python 环境..."
if ! command -v python3 &> /dev/null; then
    echo "[错误] 未找到 Python3，请先安装 Python 3.8+"
    exit 1
fi

python3 --version

echo "[2/3] 检查依赖..."
if ! python3 -c "import fastapi" &> /dev/null; then
    echo "[提示] 正在安装依赖包..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "[错误] 依赖安装失败"
        exit 1
    fi
fi

echo "[3/3] 启动后端服务..."
echo ""
echo "===================================="

# 端口配置（可通过参数传递，如：./start.sh 8000）
PORT=${1:-8000}

echo "使用端口: $PORT"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

python3 main.py $PORT
