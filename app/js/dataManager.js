// 数据加载模块
export async function loadYAMLConfig(url) {
    const response = await fetch(url);
    const yamlText = await response.text();
    return jsyaml.load(yamlText);
}

export async function loadYAMLData(url) {
    const response = await fetch(url);
    const yamlText = await response.text();
    return jsyaml.load(yamlText);
}

// 验证事件数据
export function validateEvents(events) {
    return events.filter(event => {
        if (!event.date || !event.title) {
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

// 导出数据为YAML
export function exportToYAML(data) {
    return jsyaml.dump(data, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
    });
}

// 下载文件
export function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}
