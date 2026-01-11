// 时间轴位置计算工具

// 计算月份刻度位置
export function getMonthPosition(date, timelineRange, zoomLevel) {
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
        console.warn('无效日期:', date);
        return 400;
    }
    
    const targetMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const { start } = timelineRange;
    
    const leftMargin = 400;
    const monthSpacing = 200 * zoomLevel;
    
    const monthsDiff = (targetMonth.getFullYear() - start.getFullYear()) * 12 + 
                      (targetMonth.getMonth() - start.getMonth());
    
    return leftMargin + (monthsDiff * monthSpacing);
}

// 计算事件在时间轴上的位置
export function getEventPosition(date, timelineRange, zoomLevel) {
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
        console.warn('无效日期:', date);
        return 400;
    }
    
    const basePosition = getMonthPosition(eventDate, timelineRange, zoomLevel);
    
    const year = eventDate.getFullYear();
    const month = eventDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayOfMonth = eventDate.getDate();
    
    if (dayOfMonth < 1 || dayOfMonth > daysInMonth) {
        console.warn('日期超出月份范围:', date);
        return basePosition;
    }
    
    const monthSpacing = 200 * zoomLevel;
    
    let dayRatio;
    if (daysInMonth === 1 || dayOfMonth === 1) {
        dayRatio = 0;
    } else {
        dayRatio = (dayOfMonth - 1) / (daysInMonth - 1);
    }
    
    const maxOffsetRange = monthSpacing * 0.8;
    const offset = dayRatio * maxOffsetRange;
    
    return basePosition + offset;
}

// 计算圆点的垂直偏移
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
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    
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

// 格式化刻度标签
export function formatTickLabel(date, type) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    if (type === 'event') {
        return `${year}-${month}`;
    }
    
    return `${year}-${month}`;
}

// 日期格式化
export function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 获取事件在原始数组中的索引
export function getOriginalIndex(event, events) {
    return events.findIndex(e => e.date === event.date && e.title === event.title);
}

// 生成时间刻度
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

// 计算日期范围
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

// 计算缩放相关
export function zoomIn(currentZoomLevel) {
    return currentZoomLevel < 10 ? currentZoomLevel + 0.5 : currentZoomLevel;
}

export function zoomOut(currentZoomLevel) {
    return currentZoomLevel > 0.5 ? currentZoomLevel - 0.5 : currentZoomLevel;
}

