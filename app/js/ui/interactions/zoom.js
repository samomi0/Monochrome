// UI交互模块 - 缩放控制
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
