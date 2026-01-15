// 时间轴核心模块 - 位置计算和刻度生成
import { DEFAULT_MARGIN, BASE_MONTH_SPACING, MAX_OFFSET_RATIO, MS_PER_DAY } from '../constants.js';
import { getMonthStart, getDaysInMonth } from '../utils/dateUtils.js';

/**
 * 计算月份刻度位置
 * @param {string|Date} date - 日期
 * @param {Object} timelineRange - 时间轴范围 {start, end}
 * @param {number} zoomLevel - 缩放级别
 * @returns {number} 位置(像素)
 */
export function getMonthPosition(date, timelineRange, zoomLevel) {
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
        console.warn('无效日期:', date);
        return DEFAULT_MARGIN;
    }
    
    const targetMonth = getMonthStart(targetDate);
    const { start } = timelineRange;
    
    const monthSpacing = BASE_MONTH_SPACING * zoomLevel;
    
    const monthsDiff = (targetMonth.getFullYear() - start.getFullYear()) * 12 + 
                      (targetMonth.getMonth() - start.getMonth());
    
    return DEFAULT_MARGIN + (monthsDiff * monthSpacing);
}

/**
 * 计算事件在时间轴上的位置
 * @param {string|Date} date - 事件日期
 * @param {Object} timelineRange - 时间轴范围 {start, end}
 * @param {number} zoomLevel - 缩放级别
 * @returns {number} 位置(像素)
 */
export function getEventPosition(date, timelineRange, zoomLevel) {
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
        console.warn('无效日期:', date);
        return DEFAULT_MARGIN;
    }
    
    const basePosition = getMonthPosition(eventDate, timelineRange, zoomLevel);
    
    const year = eventDate.getFullYear();
    const month = eventDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const dayOfMonth = eventDate.getDate();
    
    if (dayOfMonth < 1 || dayOfMonth > daysInMonth) {
        console.warn('日期超出月份范围:', date);
        return basePosition;
    }
    
    const monthSpacing = BASE_MONTH_SPACING * zoomLevel;
    
    let dayRatio;
    if (daysInMonth === 1 || dayOfMonth === 1) {
        dayRatio = 0;
    } else {
        dayRatio = (dayOfMonth - 1) / (daysInMonth - 1);
    }
    
    const maxOffsetRange = monthSpacing * MAX_OFFSET_RATIO;
    const offset = dayRatio * maxOffsetRange;
    
    return basePosition + offset;
}

/**
 * 计算圆点的垂直偏移
 * @param {string|Date} eventDate - 事件日期
 * @param {boolean} isAboveLine - 是否在时间轴上方
 * @param {Array<Date>} sortedValidDates - 排序后的有效日期数组
 * @returns {number} 垂直偏移量(像素)
 */
export function getDotOffset(eventDate, isAboveLine, sortedValidDates) {
    const currentDate = new Date(eventDate);
    if (isNaN(currentDate.getTime())) {
        return 50;
    }
    
    const dates = sortedValidDates;
    if (dates.length === 0) return 50;
    
    const currentIndex = dates.findIndex(d => 
        d.getTime() === currentDate.getTime()
    );
    
    if (currentIndex === -1) return 50;
    
    let daysDiff = 0;
    
    if (isAboveLine && currentIndex > 0) {
        daysDiff = (currentDate - dates[currentIndex - 1]) / MS_PER_DAY;
    } else if (!isAboveLine && currentIndex < dates.length - 1) {
        daysDiff = (dates[currentIndex + 1] - currentDate) / MS_PER_DAY;
    }
    
    const sameMonthCount = dates.filter(d => 
        d.getFullYear() === currentDate.getFullYear() && 
        d.getMonth() === currentDate.getMonth()
    ).length;
    
    const baseOffset = sameMonthCount > 1 ? 30 : 50;
    const offset = Math.min(baseOffset + Math.floor(daysDiff / 30) * 10, 120);
    return offset;
}

/**
 * 生成时间刻度
 * @param {Array} events - 事件数组
 * @param {Object} timelineRange - 时间轴范围 {start, end}
 * @param {number} zoomLevel - 缩放级别
 * @returns {Array} 刻度数组
 */
export function generateTicks(events, timelineRange, zoomLevel) {
    const ticks = [];
    const { start, end } = timelineRange;
    
    let currentMonth = new Date(start);
    const endMonth = new Date(end);
    
    while (currentMonth <= endMonth) {
        const yearMonth = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
        const monthPosition = getMonthPosition(currentMonth, timelineRange, zoomLevel);
        
        const hasEvent = events.some(event => {
            const eventDate = new Date(event.date);
            return eventDate.getFullYear() === currentMonth.getFullYear() && 
                   eventDate.getMonth() === currentMonth.getMonth();
        });
        
        ticks.push({
            date: new Date(currentMonth),
            x: monthPosition,
            label: yearMonth,
            isEvent: hasEvent,
            isTimeJump: false
        });
        
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    }
    
    return ticks.sort((a, b) => a.x - b.x);
}

/**
 * 获取事件在原始数组中的索引
 * @param {Object} event - 事件对象
 * @param {Array} events - 事件数组
 * @returns {number} 索引
 */
export function getOriginalIndex(event, events) {
    return events.findIndex(e => e.date === event.date && e.title === event.title);
}
