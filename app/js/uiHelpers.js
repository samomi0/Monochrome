// UI控制辅助函数
export function initDragScroll(container) {
    let isDown = false;
    let startX;
    let scrollLeft;

    const onMouseDown = (e) => {
        if (e.target.closest('.event-card')) {
            return;
        }
        isDown = true;
        container.style.cursor = 'grabbing';
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    };

    const onMouseLeave = () => {
        isDown = false;
        container.style.cursor = 'grab';
    };

    const onMouseUp = () => {
        isDown = false;
        container.style.cursor = 'grab';
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

// 滚动到指定位置
export function scrollToEnd(container) {
    if (!container) return;
    setTimeout(() => {
        container.scrollLeft = container.scrollWidth - container.clientWidth;
    }, 100);
}

export function scrollToStart(container) {
    if (!container) return;
    setTimeout(() => {
        container.scrollLeft = 0;
    }, 100);
}

// 处理图片加载错误
export function handleImageError(event) {
    console.error('图片加载失败:', event.target.src);
    event.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3E图片加载失败%3C/text%3E%3C/svg%3E';
    event.target.style.opacity = '0.5';
    event.target.onerror = null;
}

// 缩略图滚动栏辅助函数
export function updateMinimapViewport(container) {
    if (!container) return null;
    
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    
    return {
        viewportWidth: (clientWidth / scrollWidth) * 100,
        scrollRatio: scrollLeft / (scrollWidth - clientWidth)
    };
}

export function updateMinimapPosition(event, minimapTrack, container) {
    const trackRect = minimapTrack.getBoundingClientRect();
    const clickX = event.clientX - trackRect.left;
    const ratio = clickX / trackRect.width;
    
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    container.scrollLeft = ratio * (scrollWidth - clientWidth);
}

// 缩略图事件样式计算
export function getMinimapItemStyle(event, getEventPositionFn, timelineWidth, getTagGradientFn) {
    const position = getEventPositionFn(event.date);
    const totalWidth = timelineWidth;
    const leftPercent = (position / totalWidth) * 100;
    const gradient = getTagGradientFn(event.tags);
    
    return {
        position: 'absolute',
        left: leftPercent + '%',
        top: '0',
        width: '5px',
        height: '100%',
        background: gradient,
        opacity: '0.9',
        borderRadius: '2px',
        zIndex: '1',
        cursor: 'pointer'
    };
}

// 滚动到事件位置
export function scrollToEvent(container, eventPosition, containerWidth) {
    if (!container) return;
    
    const scrollTarget = eventPosition - (containerWidth / 2);
    
    container.scrollTo({
        left: Math.max(0, scrollTarget),
        behavior: 'smooth'
    });
}

// 面板切换工具
export function togglePanel(panelName, currentState) {
    return {
        showZoomPanel: panelName === 'zoom' ? !currentState.showZoomPanel : false,
        showFilterPanel: panelName === 'filter' ? !currentState.showFilterPanel : false,
        showAddEventPanel: panelName === 'addEvent' ? !currentState.showAddEventPanel : false
    };
}

export function closeAllPanels() {
    return {
        showZoomPanel: false,
        showFilterPanel: false,
        showAddEventPanel: false
    };
}
