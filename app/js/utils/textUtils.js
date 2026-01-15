// 文本工具模块

/**
 * 从Markdown内容中提取摘要
 * @param {string} markdownContent - Markdown内容
 * @param {number} maxLength - 最大长度
 * @returns {string} 摘要文本
 */
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

/**
 * 检查是否为博客类型
 * @param {Object} event - 事件对象
 * @returns {boolean} 是否为博客类型
 */
export function isBlogType(event) {
    return event.type === 'blog';
}
