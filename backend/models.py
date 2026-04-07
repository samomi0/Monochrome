"""
数据模型定义
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import date


class EventBase(BaseModel):
    """事件基础模型"""
    date: str = Field(..., description="事件日期，格式：YYYY-MM-DD")
    title: Optional[str] = Field(None, description="事件标题")
    subtitle: Optional[str] = Field(None, description="副标题")
    content: Optional[str] = Field(None, description="事件内容")
    tags: Optional[List[str]] = Field(None, description="标签列表")
    location: Optional[str] = Field(None, description="地点")
    note: Optional[str] = Field(None, description="备注")
    image: Optional[str] = Field(None, description="图片路径")
    type: Optional[str] = Field(None, description="事件类型，如 blog")
    contentFile: Optional[str] = Field(None, description="博客文件名")


class EventCreate(EventBase):
    """创建事件的请求模型"""
    tagColors: Optional[Dict[str, str]] = Field(None, description="标签颜色映射（仅用于新标签）")


class Event(EventBase):
    """事件完整模型"""
    pass


class BlogCreate(BaseModel):
    """创建博客的请求模型"""
    filename: str = Field(..., description="博客文件名，如 20260114.md")
    content: str = Field(..., description="博客内容（Markdown格式）")
    date: str = Field(..., description="博客日期，格式：YYYY-MM-DD")
    tags: Optional[List[str]] = Field(None, description="标签列表")
    location: Optional[str] = Field(None, description="地点")
    create_event: bool = Field(True, description="是否同时创建事件记录")


class ApiResponse(BaseModel):
    """统一的 API 响应模型"""
    success: bool = Field(..., description="请求是否成功")
    data: Optional[Any] = Field(None, description="响应数据")
    message: Optional[str] = Field(None, description="响应消息")
