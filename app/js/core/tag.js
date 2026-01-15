// 标签核心模块 - 标签管理和筛选
import { TAG_FILTER_STATES } from '../constants.js';
import { validateTag } from '../utils/validators.js';

/**
 * 标签筛选 - 三态切换
 * @param {string} tag - 标签名
 * @param {Object} selectedTags - 当前选中的标签对象
 * @returns {Object} 更新后的标签对象
 */
export function toggleTag(tag, selectedTags) {
    const newSelectedTags = { ...selectedTags };
    
    if (!newSelectedTags[tag]) {
        newSelectedTags[tag] = TAG_FILTER_STATES.WHITELIST;
    } else if (newSelectedTags[tag] === TAG_FILTER_STATES.WHITELIST) {
        newSelectedTags[tag] = TAG_FILTER_STATES.BLACKLIST;
    } else {
        delete newSelectedTags[tag];
    }
    
    return newSelectedTags;
}

/**
 * 清空所有标签筛选
 * @returns {Object} 空对象
 */
export function clearTags() {
    return {};
}

/**
 * 添加标签到新事件
 * @param {string} tagInput - 标签输入
 * @param {Array} newEventTags - 新事件的标签数组
 * @param {Object} tagColors - 标签颜色映射
 * @param {string} newTagColor - 新标签颜色
 * @returns {Object} 操作结果
 */
export function addTagToNewEvent(tagInput, newEventTags, tagColors, newTagColor) {
    const validation = validateTag(tagInput);
    if (!validation.valid) {
        return { success: false, message: validation.message };
    }
    
    const tag = validation.tag;
    
    if (newEventTags.includes(tag)) {
        return { success: false, message: '该标签已添加到当前事件' };
    }
    
    const updatedTagColors = { ...tagColors };
    if (!updatedTagColors[tag]) {
        updatedTagColors[tag] = newTagColor;
    }
    
    return {
        success: true,
        updatedTags: [...newEventTags, tag],
        updatedTagColors: updatedTagColors
    };
}

/**
 * 选择已有标签
 * @param {string} tag - 标签名
 * @param {Array} newEventTags - 新事件的标签数组
 * @returns {Array} 更新后的标签数组
 */
export function selectExistingTag(tag, newEventTags) {
    if (!newEventTags.includes(tag)) {
        return [...newEventTags, tag];
    }
    return newEventTags;
}

/**
 * 从新事件中移除标签
 * @param {string} tag - 要移除的标签
 * @param {Array} newEventTags - 新事件的标签数组
 * @returns {Array} 更新后的标签数组
 */
export function removeTagFromNewEvent(tag, newEventTags) {
    return newEventTags.filter(t => t !== tag);
}
