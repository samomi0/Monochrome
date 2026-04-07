@echo off
chcp 65001 > nul
echo ====================================
echo Monochrome Timeline 后端服务启动器
echo ====================================
echo.

cd /d "%~dp0"

echo [1/3] 检查 Python 环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Python，请先安装 Python 3.8+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [2/3] 检查依赖...
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo [提示] 正在安装依赖包...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

echo [3/3] 启动后端服务...
echo.

REM 端口配置（可通过参数传递，如：start.bat 8000）
set PORT=%1
if "%PORT%"=="" set PORT=8000

echo 使用端口: %PORT%
echo.
echo 按 Ctrl+C 停止服务
echo.

python main.py %PORT%

pause
