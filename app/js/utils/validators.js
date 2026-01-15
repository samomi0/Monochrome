// 验证工具模块

/**
 * 验证事件数据
 * @param {Array} events - 事件数组
 * @returns {Array} 过滤后的有效事件数组
 */
export function validateEvents(events) {
    return events.filter(event => {
        if (!event.date || (!event.title && event.type !== 'blog')) {
            console.warn('跳过无效事件（缺少日期或标题）:', event);
            return false;
        }
        const date = new Date(event.date);
        if (isNaN(date.getTime())) {
            console.warn('跳过无效日期的事件:', event.date);
            return false;
        }
        return true;
    });
}

/**
 * 验证新事件数据
 * @param {Object} newEvent - 新事件对象
 * @returns {Object} {valid: boolean, message: string}
 */
export function validateNewEvent(newEvent) {
    if (!newEvent.date || !newEvent.title) {
        return { valid: false, message: '请填写日期和标题' };
    }
    
    const testDate = new Date(newEvent.date);
    if (isNaN(testDate.getTime())) {
        return { valid: false, message: '日期格式无效，请使用 YYYY-MM-DD 格式' };
    }
    
    return { valid: true, message: '' };
}

/**
 * 验证标签输入
 * @param {string} tag - 标签字符串
 * @returns {Object} {valid: boolean, message: string}
 */
export function validateTag(tag) {
    const trimmedTag = tag.trim();
    if (!trimmedTag) {
        return { valid: false, message: '标签不能为空' };
    }
    return { valid: true, message: '', tag: trimmedTag };
}
