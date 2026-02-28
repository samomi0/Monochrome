// UI交互模块 - 博客阅读进度条

/**
 * 初始化博客阅读进度条
 * 追踪博客弹窗内滚动位置并更新进度条宽度
 * 
 * @param {HTMLElement} modalBody - 博客弹窗的可滚动内容区域
 * @param {HTMLElement} progressBar - 进度条 DOM 元素
 * @returns {Function} 清理函数
 */
export function initBlogProgress(modalBody, progressBar) {
    if (!modalBody || !progressBar) return () => {};

    const updateProgress = () => {
        const scrollTop = modalBody.scrollTop;
        const scrollHeight = modalBody.scrollHeight - modalBody.clientHeight;
        
        if (scrollHeight <= 0) {
            progressBar.style.width = '0%';
            return;
        }
        
        const progress = Math.min((scrollTop / scrollHeight) * 100, 100);
        progressBar.style.width = `${progress}%`;
    };

    modalBody.addEventListener('scroll', updateProgress, { passive: true });
    
    // 初始化
    updateProgress();

    return () => {
        modalBody.removeEventListener('scroll', updateProgress);
        progressBar.style.width = '0%';
    };
}
