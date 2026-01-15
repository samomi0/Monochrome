// UI渲染模块 - 错误处理
import { ERROR_IMAGE_PLACEHOLDER } from '../../constants.js';

/**
 * 处理图片加载错误
 * @param {Event} event - 错误事件对象
 */
export function handleImageError(event) {
    console.error('图片加载失败:', event.target.src);
    event.target.src = ERROR_IMAGE_PLACEHOLDER;
    event.target.style.opacity = '0.5';
    event.target.onerror = null;
}
