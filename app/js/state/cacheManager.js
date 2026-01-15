// 状态管理模块 - 博客内容缓存

const blogContentCache = new Map();

/**
 * 获取缓存的博客内容
 * @param {string} contentFile - 博客文件名
 * @returns {string|undefined} 缓存的内容
 */
export function getCachedBlogContent(contentFile) {
    return blogContentCache.get(contentFile);
}

/**
 * 设置博客内容缓存
 * @param {string} contentFile - 博客文件名
 * @param {string} content - 博客内容
 */
export function setCachedBlogContent(contentFile, content) {
    blogContentCache.set(contentFile, content);
}

/**
 * 清空博客缓存
 */
export function clearBlogCache() {
    blogContentCache.clear();
}
