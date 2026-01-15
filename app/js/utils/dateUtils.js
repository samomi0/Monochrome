// 日期工具模块

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {string|Date} dateString - 日期字符串或Date对象
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 格式化时间刻度标签
 * @param {Date} date - 日期对象
 * @param {string} type - 标签类型
 * @returns {string} 格式化后的标签
 */
export function formatTickLabel(date, type) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    if (type === 'event') {
        return `${year}-${month}`;
    }
    
    return `${year}-${month}`;
}

/**
 * 计算两个日期之间的天数差
 * @param {Date} date1 - 第一个日期
 * @param {Date} date2 - 第二个日期
 * @returns {number} 天数差
 */
export function daysBetween(date1, date2) {
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    return (date2 - date1) / MS_PER_DAY;
}

/**
 * 验证日期是否有效
 * @param {string|Date} date - 待验证的日期
 * @returns {boolean} 是否有效
 */
export function isValidDate(date) {
    const d = new Date(date);
    return !isNaN(d.getTime());
}

/**
 * 获取月份的第一天
 * @param {Date} date - 日期对象
 * @returns {Date} 月份第一天
 */
export function getMonthStart(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 获取月份的天数
 * @param {number} year - 年份
 * @param {number} month - 月份 (0-11)
 * @returns {number} 该月的天数
 */
export function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * 计算日期范围
 * @param {Array} events - 事件数组
 * @returns {Object} {min: Date, max: Date}
 */
export function calculateDateRange(events) {
    if (events.length === 0) {
        const now = new Date();
        return {
            min: new Date(now.getFullYear(), now.getMonth(), 1),
            max: new Date(now.getFullYear(), now.getMonth(), 1)
        };
    }
    
    const dates = events
        .map(e => new Date(e.date))
        .filter(date => !isNaN(date.getTime()))
        .sort((a, b) => a - b);
    
    if (dates.length === 0) {
        const now = new Date();
        return {
            min: new Date(now.getFullYear(), now.getMonth(), 1),
            max: new Date(now.getFullYear(), now.getMonth(), 1)
        };
    }
    
    return {
        min: dates[0],
        max: dates[dates.length - 1]
    };
}
