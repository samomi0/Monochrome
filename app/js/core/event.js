// 事件核心模块 - 事件数据管理
import { validateNewEvent } from '../utils/validators.js';

/**
 * 保存新事件
 * @param {Object} newEvent - 新事件对象
 * @param {Array} events - 现有事件数组
 * @param {Object} backendConfig - 后端配置
 * @param {Object} tagColors - 标签颜色映射
 * @returns {Object} 保存结果
 */
export function saveNewEvent(newEvent, events, backendConfig = null, tagColors = null) {
    // 验证必填字段
    const validation = validateNewEvent(newEvent);
    if (!validation.valid) {
        return { success: false, message: validation.message };
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
    
    // 提取新标签的颜色
    const newTagColors = {};
    if (tagColors && newEvent.tags && newEvent.tags.length > 0) {
        newEvent.tags.forEach(tag => {
            if (tagColors[tag]) {
                newTagColors[tag] = tagColors[tag];
            }
        });
    }
    
    // 如果配置了后端，返回特殊标记表示需要调用API
    if (backendConfig && backendConfig.enabled && backendConfig.apiUrl) {
        return {
            success: true,
            useBackend: true,
            event: event,
            tagColors: Object.keys(newTagColors).length > 0 ? newTagColors : null,
            message: '准备保存到后端服务'
        };
    }
    
    // 本地模式：添加到事件列表并排序
    const updatedEvents = [...events, event].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );
    
    return { 
        success: true, 
        useBackend: false,
        events: updatedEvents,
        message: '事件已添加！请点击"导出数据"按钮下载更新后的YAML文件'
    };
}

/**
 * 重置新事件表单
 * @returns {Object} 空的新事件对象
 */
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
