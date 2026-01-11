// 事件管理工具模块

// 保存新事件
export function saveNewEvent(newEvent, events) {
    // 验证必填字段
    if (!newEvent.date || !newEvent.title) {
        return { success: false, message: '请填写日期和标题' };
    }
    
    // 验证日期格式
    const testDate = new Date(newEvent.date);
    if (isNaN(testDate.getTime())) {
        return { success: false, message: '日期格式无效，请使用 YYYY-MM-DD 格式' };
    }
    
    // 创建新事件对象
    const event = {
        date: newEvent.date,
        title: newEvent.title
    };
    
    // 添加可选字段
    if (newEvent.subtitle) event.subtitle = newEvent.subtitle;
    if (newEvent.content) event.content = newEvent.content;
    if (newEvent.tags && newEvent.tags.length > 0) event.tags = [...newEvent.tags];
    if (newEvent.location) event.location = newEvent.location;
    if (newEvent.note) event.note = newEvent.note;
    if (newEvent.image) event.image = newEvent.image;
    
    // 添加到事件列表并排序
    const updatedEvents = [...events, event].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );
    
    return { 
        success: true, 
        events: updatedEvents,
        message: '事件已添加！请点击"导出数据"按钮下载更新后的YAML文件'
    };
}

// 重置新事件表单
export function resetNewEventForm() {
    return {
        date: new Date().toISOString().split('T')[0],
        title: '',
        subtitle: '',
        content: '',
        tags: [],
        location: '',
        note: '',
        image: ''
    };
}

// 获取事件的原始索引
export function getOriginalIndex(event, events) {
    return events.findIndex(e => e.date === event.date && e.title === event.title);
}
