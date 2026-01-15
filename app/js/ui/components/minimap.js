// UI组件模块 - 缩略图管理
import { MINIMAP_ITEM_WIDTH, MINIMAP_ITEM_OPACITY } from '../../constants.js';

/**
 * 更新缩略图视口信息
 * @param {HTMLElement} container - 时间轴容器元素
 * @returns {Object|null} {viewportWidth, scrollRatio}
 */
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

/**
 * 更新缩略图位置(点击缩略图轨道)
 * @param {MouseEvent} event - 鼠标事件
 * @param {HTMLElement} minimapTrack - 缩略图轨道元素
 * @param {HTMLElement} container - 时间轴容器元素
 */
export function updateMinimapPosition(event, minimapTrack, container) {
    const trackRect = minimapTrack.getBoundingClientRect();
    const clickX = event.clientX - trackRect.left;
    const ratio = clickX / trackRect.width;
    
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    container.scrollLeft = ratio * (scrollWidth - clientWidth);
}

/**
 * 获取缩略图事件项样式
 * @param {Object} event - 事件对象
 * @param {Function} getEventPositionFn - 获取事件位置的函数
 * @param {number} timelineWidth - 时间轴总宽度
 * @param {Function} getTagGradientFn - 获取标签渐变色的函数
 * @returns {Object} 样式对象
 */
export function getMinimapItemStyle(event, getEventPositionFn, timelineWidth, getTagGradientFn) {
    const position = getEventPositionFn(event.date);
    const totalWidth = timelineWidth;
    const leftPercent = (position / totalWidth) * 100;
    const gradient = getTagGradientFn(event.tags);
    
    return {
        position: 'absolute',
        left: leftPercent + '%',
        top: '0',
        width: MINIMAP_ITEM_WIDTH + 'px',
        height: '100%',
        background: gradient,
        opacity: MINIMAP_ITEM_OPACITY,
        borderRadius: '2px',
        zIndex: '1',
        cursor: 'pointer'
    };
}
