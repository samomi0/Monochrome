// UI交互模块 - 导航和滚动控制

/**
 * 滚动到容器末尾
 * @param {HTMLElement} container - 容器元素
 */
export function scrollToEnd(container) {
    if (!container) return;
    setTimeout(() => {
        container.scrollLeft = container.scrollWidth - container.clientWidth;
    }, 100);
}

/**
 * 滚动到容器开始
 * @param {HTMLElement} container - 容器元素
 */
export function scrollToStart(container) {
    if (!container) return;
    setTimeout(() => {
        container.scrollLeft = 0;
    }, 100);
}

/**
 * 滚动到指定事件位置
 * @param {HTMLElement} container - 容器元素
 * @param {number} eventPosition - 事件位置(像素)
 * @param {number} containerWidth - 容器宽度
 */
export function scrollToEvent(container, eventPosition, containerWidth) {
    if (!container) return;
    
    const scrollTarget = eventPosition - (containerWidth / 2);
    
    container.scrollTo({
        left: Math.max(0, scrollTarget),
        behavior: 'smooth'
    });
}
