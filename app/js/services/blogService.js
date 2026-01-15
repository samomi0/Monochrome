// 博客服务模块 - 处理博客内容加载

/**
 * 加载博客内容
 * @param {string} contentFile - 博客文件名
 * @param {string} basePath - 博客文件基础路径
 * @returns {Promise<Object>} 包含success和content的对象
 */
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
