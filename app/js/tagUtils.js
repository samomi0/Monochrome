// 标签工具模块

// 获取标签颜色
export function getTagColor(tag, tagColors) {
    if (tagColors[tag]) {
        return tagColors[tag];
    }
    // 基于标签名生成颜色
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
}

// 获取标签渐变色
export function getTagGradient(tags, tagColors) {
    if (!tags || tags.length === 0) {
        return 'linear-gradient(135deg, #667eea, #764ba2)';
    }
    const color1 = getTagColor(tags[0], tagColors);
    const color2 = tags.length > 1 ? getTagColor(tags[1], tagColors) : color1;
    return `linear-gradient(135deg, ${color1}, ${color2})`;
}

// 标签筛选 - 三态切换
export function toggleTag(tag, selectedTags) {
    const newSelectedTags = { ...selectedTags };
    
    if (!newSelectedTags[tag]) {
        newSelectedTags[tag] = 'whitelist';
    } else if (newSelectedTags[tag] === 'whitelist') {
        newSelectedTags[tag] = 'blacklist';
    } else {
        delete newSelectedTags[tag];
    }
    
    return newSelectedTags;
}

// 清空所有标签筛选
export function clearTags() {
    return {};
}

// 添加标签到新事件
export function addTagToNewEvent(tagInput, newEventTags, tagColors, newTagColor) {
    const tag = tagInput.trim();
    if (!tag) {
        return { success: false, message: '标签不能为空' };
    }
    
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

// 选择已有标签
export function selectExistingTag(tag, newEventTags) {
    if (!newEventTags.includes(tag)) {
        return [...newEventTags, tag];
    }
    return newEventTags;
}

// 从新事件中移除标签
export function removeTagFromNewEvent(tag, newEventTags) {
    return newEventTags.filter(t => t !== tag);
}
