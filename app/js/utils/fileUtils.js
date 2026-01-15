// 文件工具模块

/**
 * 导出数据为YAML格式
 * @param {Object} data - 要导出的数据对象
 * @returns {string} YAML格式的字符串
 */
export function exportToYAML(data) {
    return jsyaml.dump(data, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
    });
}

/**
 * 下载文件到本地
 * @param {string} content - 文件内容
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME类型
 */
export function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}
