"""
Monochrome Timeline 后端服务
FastAPI 后端服务，提供事件和博客数据的 API
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import os
from pathlib import Path

from models import Event, EventCreate, BlogCreate, ApiResponse
from utils import (
    load_yaml_data,
    save_yaml_data,
    load_blog_content,
    save_blog_content,
    get_data_path,
    get_blog_path
)

app = FastAPI(
    title="Monochrome Timeline API",
    description="时间轴数据管理后端服务",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境建议配置具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """根路径，返回 API 信息"""
    return {
        "name": "Monochrome Timeline API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/events", response_model=ApiResponse)
async def get_events():
    """获取所有事件数据（包括tagColors等配置）"""
    try:
        data = load_yaml_data()
        # 返回完整的数据对象，而不仅仅是events数组
        return ApiResponse(
            success=True,
            data=data,  # 返回整个data对象，包含events、tagColors等
            message="获取事件数据成功"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/events", response_model=ApiResponse)
async def create_event(event: EventCreate):
    """创建新事件"""
    try:
        # 加载现有数据
        data = load_yaml_data()
        events = data.get("events", [])
        
        # 创建新事件对象（排除tagColors字段）
        new_event = event.model_dump(exclude_none=True, exclude={'tagColors'})
        
        # 添加到事件列表
        events.append(new_event)
        
        # 按日期排序（统一转换为字符串以避免类型错误）
        events.sort(key=lambda x: str(x.get("date", "")))
        
        # 更新数据
        data["events"] = events
        
        # 如果提供了tagColors，更新到数据中
        if event.tagColors:
            if "tagColors" not in data:
                data["tagColors"] = {}
            data["tagColors"].update(event.tagColors)
        
        # 保存数据
        save_yaml_data(data)
        
        return ApiResponse(
            success=True,
            data={"event": new_event},
            message="事件创建成功"
        )
    except Exception as e:
        print(f"Error creating event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/blogs/{filename}")
async def get_blog_content(filename: str):
    """获取博客文件内容"""
    try:
        content = load_blog_content(filename)
        return ApiResponse(
            success=True,
            data={"content": content, "filename": filename},
            message="获取博客内容成功"
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"博客文件 {filename} 不存在")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/blogs", response_model=ApiResponse)
async def create_blog(blog: BlogCreate):
    """创建新博客文件"""
    try:
        # 保存博客内容
        save_blog_content(blog.filename, blog.content)
        
        # 如果需要同时创建事件记录
        if blog.create_event:
            data = load_yaml_data()
            events = data.get("events", [])
            
            new_event = {
                "date": blog.date,
                "type": "blog",
                "contentFile": blog.filename,
                "tags": blog.tags or [],
                "location": blog.location or ""
            }
            
            events.append(new_event)
            events.sort(key=lambda x: str(x.get("date", "")))
            
            data["events"] = events
            save_yaml_data(data)
        
        return ApiResponse(
            success=True,
            data={"filename": blog.filename},
            message="博客创建成功"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/config")
async def get_config():
    """获取配置信息"""
    try:
        config_path = get_data_path("config.yaml")
        import yaml
        with open(config_path, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
        return ApiResponse(
            success=True,
            data=config,
            message="获取配置成功"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    import os
    import sys
    
    # 端口配置优先级：命令行参数 > 环境变量 > 默认值
    default_port = 8000
    port = default_port
    
    # 从环境变量读取
    if os.getenv("MONOCHROME_PORT"):
        try:
            port = int(os.getenv("MONOCHROME_PORT"))
        except ValueError:
            print(f"⚠️  环境变量 MONOCHROME_PORT 无效，使用默认端口 {default_port}")
    
    # 从命令行参数读取（优先级最高）
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"⚠️  命令行参数无效，使用端口 {port}")
    
    print(f"\n{'='*50}")
    print(f"🚀 Monochrome Timeline 后端服务启动中...")
    print(f"{'='*50}")
    print(f"📡 服务地址: http://localhost:{port}")
    print(f"{'='*50}\n")
    
    uvicorn.run(app, host="0.0.0.0", port=port)
