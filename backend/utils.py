"""
工具函数模块
处理 YAML 文件读写和博客文件操作
"""
import yaml
import os
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, Any


# 数据文件路径配置
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "app" / "data"
BLOG_DIR = DATA_DIR / "blog"
DATA_FILE = DATA_DIR / "data.yaml"
CONFIG_FILE = DATA_DIR / "config.yaml"
BACKUP_DIR = BASE_DIR / "backend" / "data_backup"
MAX_BACKUPS = 100


def get_data_path(filename: str = "data.yaml") -> Path:
    """获取数据文件的完整路径"""
    return DATA_DIR / filename


def get_blog_path(filename: str) -> Path:
    """获取博客文件的完整路径"""
    return BLOG_DIR / filename


def load_yaml_data() -> Dict[str, Any]:
    """
    加载 YAML 数据文件
    
    Returns:
        Dict: YAML 数据字典
    """
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
            return data if data else {"events": []}
    except FileNotFoundError:
        return {"events": []}
    except Exception as e:
        raise Exception(f"加载数据文件失败: {str(e)}")


def backup_yaml_data() -> None:
    """
    备份当前的 YAML 数据文件
    保留最多 MAX_BACKUPS 个备份
    """
    # 确保备份目录存在
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    
    # 如果数据文件不存在，无需备份
    if not DATA_FILE.exists():
        return
    
    # 生成备份文件名（带时间戳）
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f"data_backup_{timestamp}.yaml"
    backup_path = BACKUP_DIR / backup_filename
    
    try:
        # 复制当前数据文件到备份目录
        shutil.copy2(DATA_FILE, backup_path)
        print(f"✅ 数据已备份到: {backup_filename}")
        
        # 清理旧备份，保留最新的 MAX_BACKUPS 个
        cleanup_old_backups()
    except Exception as e:
        print(f"⚠️  备份数据失败: {str(e)}")
        # 备份失败不影响主流程，只记录错误


def cleanup_old_backups() -> None:
    """
    清理旧备份文件，只保留最新的 MAX_BACKUPS 个
    """
    try:
        # 获取所有备份文件
        backup_files = sorted(
            BACKUP_DIR.glob("data_backup_*.yaml"),
            key=lambda p: p.stat().st_mtime,
            reverse=True  # 最新的在前
        )
        
        # 删除超出数量限制的备份
        for old_backup in backup_files[MAX_BACKUPS:]:
            old_backup.unlink()
            print(f"🗑️  删除旧备份: {old_backup.name}")
    except Exception as e:
        print(f"⚠️  清理旧备份失败: {str(e)}")


def save_yaml_data(data: Dict[str, Any]) -> None:
    """
    保存数据到 YAML 文件
    保存前会先备份当前数据
    
    Args:
        data: 要保存的数据字典
    """
    try:
        # 保存前先备份
        backup_yaml_data()
        
        # 保存新数据
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            yaml.dump(
                data,
                f,
                allow_unicode=True,
                default_flow_style=False,
                sort_keys=False,
                indent=2
            )
    except Exception as e:
        raise Exception(f"保存数据文件失败: {str(e)}")


def load_blog_content(filename: str) -> str:
    """
    加载博客文件内容
    
    Args:
        filename: 博客文件名
        
    Returns:
        str: 博客内容
    """
    blog_path = get_blog_path(filename)
    
    if not blog_path.exists():
        raise FileNotFoundError(f"博客文件不存在: {filename}")
    
    try:
        with open(blog_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        raise Exception(f"读取博客文件失败: {str(e)}")


def save_blog_content(filename: str, content: str) -> None:
    """
    保存博客内容到文件
    
    Args:
        filename: 博客文件名
        content: 博客内容
    """
    blog_path = get_blog_path(filename)
    
    # 确保目录存在
    blog_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        with open(blog_path, 'w', encoding='utf-8') as f:
            f.write(content)
    except Exception as e:
        raise Exception(f"保存博客文件失败: {str(e)}")


def validate_date_format(date_str: str) -> bool:
    """
    验证日期格式是否为 YYYY-MM-DD
    
    Args:
        date_str: 日期字符串
        
    Returns:
        bool: 是否有效
    """
    from datetime import datetime
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False
