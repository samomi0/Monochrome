# Monochrome Timeline 后端服务

这是一个基于 FastAPI 的后端服务，为 Monochrome Timeline 提供数据管理接口。

## 功能特性

- ✅ RESTful API 接口
- ✅ 读取和保存 YAML 数据文件
- ✅ 事件 CRUD 操作
- ✅ 博客内容管理
- ✅ 自动数据备份（保留最多10个备份）
- ✅ 自动文档生成 (Swagger UI)
- ✅ CORS 跨域支持

## 快速开始

### 1. 安装依赖

**Windows:**
```bash
pip install -r requirements.txt
```

**Linux/MacOS:**
```bash
pip3 install -r requirements.txt
```

### 2. 启动服务

**使用默认端口 (8000):**

Windows:
```bash
start.bat
```

Linux/MacOS:
```bash
chmod +x start.sh
./start.sh
```

**使用自定义端口:**

Windows:
```bash
start.bat 8000
```

Linux/MacOS:
```bash
./start.sh 8000
```

**手动启动:**
```bash
# 默认端口
python main.py

# 自定义端口
python main.py 8000

# 使用环境变量
export MONOCHROME_PORT=8080
python main.py
```

### 3. 访问服务

- 服务地址: http://localhost:8000
- API 文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/api/health

## 配置前端

在 `app/data/config.yaml` 中配置：

```yaml
config:
  backend:
    enabled: true                        # 启用后端服务
    apiUrl: "http://localhost:8000"     # 后端地址（需与实际端口一致）
```

## API 接口

### 获取所有事件
```http
GET /api/events
```

### 创建新事件
```http
POST /api/events
Content-Type: application/json

{
  "date": "2026-01-14",
  "title": "测试事件",
  "subtitle": "可选副标题",
  "content": "事件内容",
  "tags": ["标签1", "标签2"],
  "location": "地点",
  "note": "备注",
  "image": "./image/test.jpg"
}
```

### 获取博客内容
```http
GET /api/blogs/{filename}
```

### 创建博客
```http
POST /api/blogs
Content-Type: application/json

{
  "filename": "20260114.md",
  "content": "# 博客标题\n\n博客内容...",
  "date": "2026-01-14",
  "tags": ["示例标签"],
  "location": "示例地点",
  "create_event": true
}
```

### 获取配置
```http
GET /api/config
```

## 项目结构

```
backend/
├── main.py              # FastAPI 主应用
├── models.py            # 数据模型定义
├── utils.py             # 工具函数（含备份功能）
├── requirements.txt     # Python 依赖
├── start.bat           # Windows 启动脚本
├── start.sh            # Linux/Mac 启动脚本
├── data_backup/        # 数据备份目录（自动生成）
└── README.md           # 本文档
```

## 数据存储

后端服务直接操作以下文件：
- `app/data/data.yaml` - 事件数据
- `app/data/config.yaml` - 配置数据
- `app/data/blog/*.md` - 博客文件
- `backend/data_backup/` - 数据备份目录（最多保留10个备份）

## 数据备份

### 自动备份
每次保存数据时，系统会自动：
1. 备份当前 `data.yaml` 到 `backend/data_backup/` 目录
2. 使用时间戳命名备份文件：`data_backup_YYYYMMDD_HHMMSS.yaml`
3. 自动清理旧备份，只保留最新的100个

### 手动测试备份
```bash
cd backend
python test_backup.py
```

### 查看备份文件
备份文件位于 `backend/data_backup/` 目录，可以直接查看或恢复。

### 恢复备份
手动将备份文件复制到 `app/data/data.yaml` 即可：
```bash
# 示例：恢复某个备份
cp backend/data_backup/data_backup_20260117_120000.yaml app/data/data.yaml
```

## 开发说明

### 依赖项
- FastAPI 0.109.0 - Web 框架
- Uvicorn 0.27.0 - ASGI 服务器
- Pydantic 2.5.3 - 数据验证
- PyYAML 6.0.1 - YAML 解析

### 开发模式
启动时添加 `--reload` 参数支持热重载：
```bash
uvicorn main:app --reload
```

### API 文档
访问 http://localhost:8000/docs 查看自动生成的 Swagger UI 文档

## 注意事项

1. **端口占用**: 默认端口为 8000，确保端口未被占用
2. **文件权限**: 确保后端有读写 `app/data` 目录的权限
3. **CORS 配置**: 生产环境建议配置具体的允许域名
4. **数据备份**: 系统会自动备份，无需手动备份（最多保留10个）

## 故障排查

### 问题: 启动失败
- 检查 Python 版本 (需要 3.8+)
- 检查依赖是否完整安装: `pip list`
- 查看错误日志

### 问题: 前端无法连接
- 确认后端服务已启动
- 检查 config.yaml 中的 apiUrl 配置
- 检查浏览器控制台的 CORS 错误

### 问题: 数据保存失败
- 检查文件路径是否正确
- 确认有文件写入权限
- 查看后端日志输出

## 许可证

与主项目相同
