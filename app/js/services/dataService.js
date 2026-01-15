// 数据服务模块 - 处理YAML数据加载

/**
 * 加载YAML配置文件
 * @param {string} url - 配置文件URL
 * @returns {Promise<Object>} 配置对象
 */
export async function loadYAMLConfig(url) {
    const response = await fetch(url);
    const yamlText = await response.text();
    return jsyaml.load(yamlText);
}

/**
 * 加载YAML数据文件
 * @param {string} url - 数据文件URL
 * @returns {Promise<Object>} 数据对象
 */
export async function loadYAMLData(url) {
    const response = await fetch(url);
    const yamlText = await response.text();
    return jsyaml.load(yamlText);
}
