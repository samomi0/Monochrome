// UI交互模块 - 缩放控制（含语义化缩放 + 焦点缩放）
import { MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL, ZOOM_STEP } from '../../constants.js';

/**
 * 放大
 * @param {number} currentZoomLevel - 当前缩放级别
 * @returns {number} 新的缩放级别
 */
export function zoomIn(currentZoomLevel) {
    return currentZoomLevel < MAX_ZOOM_LEVEL ? currentZoomLevel + ZOOM_STEP : currentZoomLevel;
}

/**
 * 缩小
 * @param {number} currentZoomLevel - 当前缩放级别
 * @returns {number} 新的缩放级别
 */
export function zoomOut(currentZoomLevel) {
    return currentZoomLevel > MIN_ZOOM_LEVEL ? currentZoomLevel - ZOOM_STEP : currentZoomLevel;
}

/**
 * 语义化缩放级别定义
 * 不同缩放级别影响刻度标签的显示粒度
 */
export const ZOOM_SEMANTICS = {
    // 缩放级别 -> 标签显示策略
    getGranularity(zoomLevel) {
        if (zoomLevel <= 0.8) return 'year';       // 极小缩放：只显示年份
        if (zoomLevel <= 1.5) return 'quarter';     // 低缩放：显示季度
        return 'month';                              // 正常及以上：显示所有月份
    },
    
    /**
     * 根据缩放级别决定刻度是否应该显示标签
     * @param {Date} date - 刻度日期
     * @param {number} zoomLevel - 当前缩放级别
     * @returns {boolean} 是否显示标签
     */
    shouldShowLabel(date, zoomLevel) {
        const granularity = this.getGranularity(zoomLevel);
        const month = date.getMonth();
        
        switch (granularity) {
            case 'year':
                return month === 0; // 只显示1月（年份）
            case 'quarter':
                return month % 3 === 0; // 1月、4月、7月、10月
            case 'month':
            default:
                return true; // 显示所有月份
        }
    },
    
    /**
     * 根据缩放级别格式化刻度标签
     * @param {Date} date - 刻度日期
     * @param {number} zoomLevel - 当前缩放级别
     * @returns {string} 格式化后的标签
     */
    formatLabel(date, zoomLevel) {
        const granularity = this.getGranularity(zoomLevel);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        switch (granularity) {
            case 'year':
                return `${year}`;
            case 'quarter':
                if (month === 1) return `${year}`;
                return `Q${Math.ceil(month / 3)}`;
            case 'month':
            default:
                if (month === 1) return `${year}-01`;
                return `${String(month).padStart(2, '0')}`;
        }
    }
};

/**
 * 焦点缩放 - 以鼠标位置为中心进行缩放
 * @param {HTMLElement} container - 滚动容器
 * @param {number} mouseClientX - 鼠标在容器内的clientX
 * @param {number} oldZoomLevel - 缩放前的级别
 * @param {number} newZoomLevel - 缩放后的级别
 * @param {Function} getTimelineWidth - 获取时间轴宽度的函数 (zoomLevel) => width
 */
export function focalZoom(container, mouseClientX, oldZoomLevel, newZoomLevel, getTimelineWidth) {
    const containerRect = container.getBoundingClientRect();
    // 鼠标在容器内的相对位置
    const mouseOffsetX = mouseClientX - containerRect.left;
    
    // 鼠标在内容中的绝对位置
    const contentX = container.scrollLeft + mouseOffsetX;
    
    // 计算缩放比例
    const ratio = newZoomLevel / oldZoomLevel;
    
    // 计算新的 scrollLeft 使得鼠标下的内容位置保持不变
    const newScrollLeft = contentX * ratio - mouseOffsetX;
    
    // 延迟一帧执行，等待 Vue 更新 DOM
    requestAnimationFrame(() => {
        container.scrollLeft = Math.max(0, newScrollLeft);
    });
}
