// 颜色工具模块
import { DARK_MODE_COLOR_CONFIG, LIGHT_MODE_COLOR_CONFIG, DEFAULT_GRADIENT } from '../constants.js';

/**
 * 获取标签颜色
 * @param {string} tag - 标签名称
 * @param {Object} tagColors - 标签颜色映射对象
 * @param {boolean} isDarkMode - 是否为深色模式
 * @returns {string} CSS颜色值
 */
export function getTagColor(tag, tagColors, isDarkMode = false) {
    if (tagColors[tag]) {
        return tagColors[tag];
    }
    // 基于标签名生成颜色
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    
    // 深色主题下调整颜色参数
    if (isDarkMode) {
        const { saturation, lightness } = DARK_MODE_COLOR_CONFIG;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
    const { saturation, lightness } = LIGHT_MODE_COLOR_CONFIG;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * 获取标签渐变色
 * @param {Array<string>} tags - 标签数组
 * @param {Object} tagColors - 标签颜色映射对象
 * @param {boolean} isDarkMode - 是否为深色模式
 * @returns {string} CSS渐变色
 */
export function getTagGradient(tags, tagColors, isDarkMode = false) {
    if (!tags || tags.length === 0) {
        return DEFAULT_GRADIENT;
    }
    const color1 = getTagColor(tags[0], tagColors, isDarkMode);
    const color2 = tags.length > 1 ? getTagColor(tags[1], tagColors, isDarkMode) : color1;
    return `linear-gradient(135deg, ${color1}, ${color2})`;
}
