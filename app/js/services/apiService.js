// API服务模块 - 处理与后端API的交互

/**
 * 从后端API加载事件数据
 * @param {string} apiUrl - API基础URL
 * @returns {Promise<Array>} 事件数组
 */
export async function loadDataFromAPI(apiUrl) {
    const response = await fetch(`${apiUrl}/api/events`);
    if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
    }
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.message || 'API返回错误');
    }
    return result.data;
}

/**
 * 向后端API保存事件
 * @param {string} apiUrl - API基础URL
 * @param {Object} eventData - 事件数据对象
 * @param {Object} tagColors - 标签颜色映射（可选）
 * @returns {Promise<Object>} API响应结果
 */
export async function saveEventToAPI(apiUrl, eventData, tagColors = null) {
    // 如果提供了tagColors，合并到eventData中
    const payload = tagColors ? { ...eventData, tagColors } : eventData;
    
    const response = await fetch(`${apiUrl}/api/events`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.message || 'API返回错误');
    }
    
    return result;
}
