// UI组件模块 - 面板管理

/**
 * 切换面板显示状态
 * @param {string} panelName - 面板名称 ('zoom', 'filter', 'addEvent')
 * @param {Object} currentState - 当前面板状态
 * @returns {Object} 新的面板状态
 */
export function togglePanel(panelName, currentState) {
    return {
        showZoomPanel: panelName === 'zoom' ? !currentState.showZoomPanel : false,
        showFilterPanel: panelName === 'filter' ? !currentState.showFilterPanel : false,
        showAddEventPanel: panelName === 'addEvent' ? !currentState.showAddEventPanel : false
    };
}

/**
 * 关闭所有面板
 * @returns {Object} 所有面板关闭的状态
 */
export function closeAllPanels() {
    return {
        showZoomPanel: false,
        showFilterPanel: false,
        showAddEventPanel: false
    };
}
