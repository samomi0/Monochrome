// UI交互模块 - 拖拽滚动

/**
 * 初始化拖拽滚动功能
 * @param {HTMLElement} container - 容器元素
 * @returns {Function} 清理函数
 */
export function initDragScroll(container) {
    let isDown = false;
    let startX;
    let scrollLeft;

    const onMouseDown = (e) => {
        if (e.target.closest('.event-card')) {
            return;
        }
        isDown = true;
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    };

    const onMouseLeave = () => {
        isDown = false;
    };

    const onMouseUp = () => {
        isDown = false;
    };

    const onMouseMove = (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mousemove', onMouseMove);

    return () => {
        container.removeEventListener('mousedown', onMouseDown);
        container.removeEventListener('mouseleave', onMouseLeave);
        container.removeEventListener('mouseup', onMouseUp);
        container.removeEventListener('mousemove', onMouseMove);
    };
}
