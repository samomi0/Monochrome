// Blog工具模块

// 加载blog内容
export async function loadBlogContent(contentFile, basePath = './data/blog/') {
    try {
        const response = await fetch(basePath + contentFile);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.text();
        return { success: true, content };
    } catch (error) {
        console.error('加载blog内容失败:', error);
        return { success: false, error: error.message };
    }
}

// 从Markdown内容中提取摘要
export function extractSummary(markdownContent, maxLength = 150) {
    if (!markdownContent) return '';
    
    // 移除Markdown标题标记（# ## ### 等）
    let text = markdownContent.replace(/^#+\s+/gm, '');
    
    // 移除粗体、斜体标记
    text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
    text = text.replace(/(\*|_)(.*?)\1/g, '$2');
    
    // 移除链接，保留文字
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    
    // 移除图片
    text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '');
    
    // 移除代码块
    text = text.replace(/```[\s\S]*?```/g, '');
    text = text.replace(/`([^`]+)`/g, '$1');
    
    // 移除引用标记
    text = text.replace(/^>\s+/gm, '');
    
    // 移除多余的空行和空格
    text = text.replace(/\n\s*\n/g, '\n').trim();
    
    // 截取指定长度
    if (text.length > maxLength) {
        text = text.substring(0, maxLength) + '...';
    }
    
    return text;
}

// 检查是否为blog类型
export function isBlogType(event) {
    return event.type === 'blog';
}

// 缓存管理
const blogContentCache = new Map();

export function getCachedBlogContent(contentFile) {
    return blogContentCache.get(contentFile);
}

export function setCachedBlogContent(contentFile, content) {
    blogContentCache.set(contentFile, content);
}

export function clearBlogCache() {
    blogContentCache.clear();
}
