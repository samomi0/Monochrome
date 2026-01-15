// 导入所有模块

// Services
import { loadYAMLConfig, loadYAMLData } from './js/services/dataService.js';
import { loadDataFromAPI, saveEventToAPI } from './js/services/apiService.js';
import { loadBlogContent } from './js/services/blogService.js';

// Utils
import { validateEvents } from './js/utils/validators.js';
import { exportToYAML, downloadFile } from './js/utils/fileUtils.js';
import { formatDate, formatTickLabel } from './js/utils/dateUtils.js';
import { getTagColor, getTagGradient } from './js/utils/colorUtils.js';
import { extractSummary, isBlogType } from './js/utils/textUtils.js';

// Core
import { getMonthPosition, getEventPosition, getDotOffset, getOriginalIndex, generateTicks } from './js/core/timeline.js';
import { saveNewEvent as saveEventFn, resetNewEventForm } from './js/core/event.js';
import { toggleTag, addTagToNewEvent as addTagFn } from './js/core/tag.js';

// UI
import { initDragScroll } from './js/ui/interactions/dragScroll.js';
import { scrollToEnd, scrollToEvent } from './js/ui/interactions/navigation.js';
import { zoomIn as zoomInFn, zoomOut as zoomOutFn } from './js/ui/interactions/zoom.js';
import { updateMinimapViewport, updateMinimapPosition, getMinimapItemStyle } from './js/ui/components/minimap.js';
import { togglePanel, closeAllPanels } from './js/ui/components/panels.js';
import { handleImageError } from './js/ui/renderers/errorHandler.js';

// State
import { getCachedBlogContent, setCachedBlogContent } from './js/state/cacheManager.js';

const { createApp } = Vue;

createApp({
    data() {
        return {
            events: [],
            selectedTags: {},
            zoomLevel: 1,
            basePixelsPerDay: 5,
            showZoomPanel: false,
            showFilterPanel: false,
            showAddEventPanel: false,
            showAnalysisPanel: false,
            // analysisTab: 'overview', // Removed
            hoveredCell: null,
            showTags: true,
            showLocation: true,
            showNote: true,
            isDarkMode: false,
            tagColors: {},
            newEvent: resetNewEventForm(),
            newEventTagInput: '',
            newTagColor: '#9fa8a3',
            globalClickListener: null,
            wheelListener: null,
            dragScrollCleanup: null,
            minimap: {
                isDragging: false,
                viewportWidth: 0,
                scrollRatio: 0
            },
            // Blog相关状态
            blogConfig: {
                enabled: true,
                summaryLength: 150,
                basePath: './data/blog/'
            },
            currentBlog: {
                visible: false,
                loading: false,
                event: null,
                content: '',
                renderedContent: ''
            },
            // 后端配置
            backendConfig: {
                enabled: false,
                apiUrl: ''
            }
        };
    },
    computed: {
        sortedValidDates() {
            if (this.events.length === 0) return [];
            return this.events
                .map(e => {
                    const date = new Date(e.date);
                    return isNaN(date.getTime()) ? null : date;
                })
                .filter(date => date !== null)
                .sort((a, b) => a - b);
        },
        timelineRange() {
            const dates = this.sortedValidDates;
            if (dates.length === 0) {
                const now = new Date();
                return { 
                    start: new Date(now.getFullYear(), now.getMonth(), 1),
                    end: new Date(now.getFullYear(), now.getMonth(), 1)
                };
            }
            const start = dates[0];
            const end = dates[dates.length - 1];
            return {
                start: new Date(start.getFullYear(), start.getMonth(), 1),
                end: new Date(end.getFullYear(), end.getMonth(), 1)
            };
        },
        totalMonths() {
            const { start, end } = this.timelineRange;
            return Math.max(
                (end.getFullYear() - start.getFullYear()) * 12 + 
                (end.getMonth() - start.getMonth()) + 1,
                1
            );
        },
        allTags() {
            const tags = new Set();
            this.events.forEach(event => {
                if (event.tags) {
                    event.tags.forEach(tag => tags.add(tag));
                }
            });
            return Array.from(tags).sort();
        },
        // 数据分析统计
        analysisData() {
            const blogEvents = this.events.filter(e => this.isBlogEvent(e));
            const regularEvents = this.events.filter(e => !this.isBlogEvent(e));
            
            // 标签统计
            const tagCount = {};
            this.events.forEach(event => {
                if (event.tags) {
                    event.tags.forEach(tag => {
                        tagCount[tag] = (tagCount[tag] || 0) + 1;
                    });
                }
            });
            const topTags = Object.entries(tagCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);
            
            // 新的热力图逻辑：按年-月统计
            const heatmapMap = {}; // { year: { month (0-11): count } }
            let minYear = new Date().getFullYear();
            let maxYear = new Date().getFullYear();

            // 如果有事件，先找到年份范围
            if (this.events.length > 0) {
                 const years = this.events.map(e => new Date(e.date).getFullYear()).filter(y => !isNaN(y));
                 if (years.length > 0) {
                     minYear = Math.min(...years);
                     maxYear = Math.max(...years);
                 }
            }

            // 初始化 map
            for (let y = minYear; y <= maxYear; y++) {
                heatmapMap[y] = Array(12).fill(null).map(() => ({ count: 0, tags: {}, blogs: 0 }));
            }

            this.events.forEach(event => {
                const date = new Date(event.date);
                if (!isNaN(date.getTime())) {
                    const y = date.getFullYear();
                    const m = date.getMonth();
                    if (heatmapMap[y]) {
                        const cell = heatmapMap[y][m];
                        cell.count++;
                        if (this.isBlogEvent(event)) {
                            cell.blogs++;
                        }
                        if (event.tags && event.tags.length > 0) {
                            event.tags.forEach(tag => {
                                cell.tags[tag] = (cell.tags[tag] || 0) + 1;
                            });
                        }
                    }
                }
            });

            // 转换为数组，按年份倒序（最近的在上面）
            const heatmapData = [];
            for (let y = maxYear; y >= minYear; y--) {
                heatmapData.push({
                    year: y,
                    months: heatmapMap[y].map(data => ({
                        count: data.count,
                        blogs: data.blogs,
                        tags: data.tags
                    }))
                });
            }

             // 计算最大值用于颜色映射
            let maxHeatValue = 0;
            heatmapData.forEach(yData => {
                yData.months.forEach(m => {
                    if (m.count > maxHeatValue) maxHeatValue = m.count;
                });
            });

            const uniqueTagsCount = new Set();
            this.events.forEach(e => {
                if (e.tags) e.tags.forEach(t => uniqueTagsCount.add(t));
            });

            return {
                total: this.events.length,
                blogs: blogEvents.length,
                totalTags: uniqueTagsCount.size,
                heatmapData, // 新结构
                maxHeatValue: Math.max(maxHeatValue, 1), // 避免 0
                timeSpan: this.sortedValidDates.length > 0 ? {
                    start: this.sortedValidDates[0].toLocaleDateString('zh-CN'),
                    end: this.sortedValidDates[this.sortedValidDates.length - 1].toLocaleDateString('zh-CN')
                } : null
            };
        },
        filteredEvents() {
            const whitelistTags = Object.keys(this.selectedTags).filter(tag => this.selectedTags[tag] === 'whitelist');
            const blacklistTags = Object.keys(this.selectedTags).filter(tag => this.selectedTags[tag] === 'blacklist');
            
            if (whitelistTags.length === 0 && blacklistTags.length === 0) {
                return this.events;
            }
            
            return this.events.filter(event => {
                const eventTags = event.tags || [];
                if (blacklistTags.some(tag => eventTags.includes(tag))) {
                    return false;
                }
                if (whitelistTags.length > 0) {
                    return whitelistTags.some(tag => eventTags.includes(tag));
                }
                return true;
            });
        },
        dateRange() {
            const dates = this.sortedValidDates;
            if (dates.length === 0) {
                const now = new Date();
                return { min: now, max: now };
            }
            return {
                min: dates[0],
                max: dates[dates.length - 1]
            };
        },
        totalDays() {
            const range = this.dateRange;
            const diffTime = Math.abs(range.max - range.min);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return Math.max(diffDays + 120, 365);
        },
        timelineWidth() {
            if (this.sortedValidDates.length === 0) {
                return 2000;
            }
            return 400 + (this.totalMonths * 200 * this.zoomLevel) + 400;
        },
        pixelsPerDay() {
            return this.basePixelsPerDay * this.zoomLevel;
        },
        ticks() {
            if (this.sortedValidDates.length === 0) {
                return [];
            }
            return generateTicks(this.events, this.timelineRange, this.zoomLevel);
        }
    },
    methods: {
        // 数据加载
        async loadData() {
            try {
                const configData = await loadYAMLConfig('./data/config.yaml');
                
                if (configData.tagColors) {
                    this.tagColors = configData.tagColors;
                }
                
                if (configData.config) {
                    if (configData.config.defaultZoomLevel !== undefined) {
                        this.zoomLevel = configData.config.defaultZoomLevel;
                    }
                    if (configData.config.basePixelsPerDay !== undefined) {
                        this.basePixelsPerDay = configData.config.basePixelsPerDay;
                    }
                    if (configData.config.display) {
                        if (configData.config.display.showTags !== undefined) {
                            this.showTags = configData.config.display.showTags;
                        }
                        if (configData.config.display.showLocation !== undefined) {
                            this.showLocation = configData.config.display.showLocation;
                        }
                        if (configData.config.display.showNote !== undefined) {
                            this.showNote = configData.config.display.showNote;
                        }
                    }
                    // 加载blog配置
                    if (configData.config.blog) {
                        if (configData.config.blog.enabled !== undefined) {
                            this.blogConfig.enabled = configData.config.blog.enabled;
                        }
                        if (configData.config.blog.summaryLength !== undefined) {
                            this.blogConfig.summaryLength = configData.config.blog.summaryLength;
                        }
                        if (configData.config.blog.basePath !== undefined) {
                            this.blogConfig.basePath = configData.config.blog.basePath;
                        }
                        if (configData.config.blog.readMoreColor !== undefined) {
                            // 设置CSS变量
                            document.documentElement.style.setProperty('--read-more-color', configData.config.blog.readMoreColor);
                        }
                    }
                    // 加载后端配置
                    if (configData.config.backend) {
                        if (configData.config.backend.enabled !== undefined) {
                            this.backendConfig.enabled = configData.config.backend.enabled;
                        }
                        if (configData.config.backend.apiUrl !== undefined) {
                            this.backendConfig.apiUrl = configData.config.backend.apiUrl;
                        }
                    }
                }
                
                // 根据配置选择数据源
                let data;
                if (this.backendConfig.enabled && this.backendConfig.apiUrl) {
                    // 从后端API加载
                    console.log('从后端API加载数据:', this.backendConfig.apiUrl);
                    data = await loadDataFromAPI(this.backendConfig.apiUrl);
                } else {
                    // 从本地YAML加载
                    data = await loadYAMLData('./data/data.yaml');
                }
                
                if (data.events && Array.isArray(data.events)) {
                    const validEvents = validateEvents(data.events);
                    this.events = validEvents.sort((a, b) => 
                        new Date(a.date) - new Date(b.date)
                    );
                    
                    const skipped = data.events.length - validEvents.length;
                    if (skipped > 0) {
                        console.warn(`已跳过 ${skipped} 个无效事件`);
                    }
                    
                    // 预加载blog摘要
                    if (this.blogConfig.enabled) {
                        validEvents.forEach(async (event) => {
                            if (this.isBlogEvent(event) && event.contentFile) {
                                const result = await loadBlogContent(event.contentFile, this.blogConfig.basePath);
                                if (result.success) {
                                    setCachedBlogContent(event.contentFile, result.content);
                                }
                            }
                        });
                    }
                } else {
                    console.warn('未找到有效的事件数据');
                    this.events = [];
                }
            } catch (error) {
                console.error('加载数据失败:', error);
                this.events = [];
                alert('加载数据失败,请确保config.yaml和data.yaml文件存在且格式正确。已加载空时间轴。');
            }
        },
        
        // 时间轴位置计算 - 使用timelineUtils模块
        getMonthPosition(date) {
            return getMonthPosition(date, this.timelineRange, this.zoomLevel);
        },
        getEventPosition(date) {
            return getEventPosition(date, this.timelineRange, this.zoomLevel);
        },
        getDotOffset(eventDate, isAboveLine) {
            return getDotOffset(eventDate, isAboveLine, this.sortedValidDates);
        },
        getOriginalIndex(event) {
            return getOriginalIndex(event, this.events);
        },
        // 纯函数直接引用
        formatDate,
        formatTickLabel,
        
        // 缩放功能 - 使用timelineUtils模块
        zoomIn() {
            this.zoomLevel = zoomInFn(this.zoomLevel);
        },
        zoomOut() {
            this.zoomLevel = zoomOutFn(this.zoomLevel);
        },
        
        // 标签操作 - 使用tagUtils模块
        toggleTag(tag) {
            this.selectedTags = toggleTag(tag, this.selectedTags);
        },
        clearTags() {
            this.selectedTags = {};
        },
        getTagColor(tag) {
            return getTagColor(tag, this.tagColors, this.isDarkMode);
        },
        getTagGradient(tags) {
            return getTagGradient(tags, this.tagColors, this.isDarkMode);
        },
        
        // 面板切换 - 使用uiHelpers模块
        toggleZoomPanel() {
            const state = togglePanel('zoom', this);
            Object.assign(this, state);
            if (this.showZoomPanel) this.showAddEventPanel = false;
        },
        toggleFilterPanel() {
            const state = togglePanel('filter', this);
            Object.assign(this, state);
            if (this.showFilterPanel) this.showAddEventPanel = false;
        },
        toggleAddEventPanel() {
            const state = togglePanel('addEvent', this);
            Object.assign(this, state);
            if (this.showAddEventPanel) {
                this.showZoomPanel = false;
                this.showFilterPanel = false;
                this.showAnalysisPanel = false;
                if (!this.newEvent.date) {
                    const today = new Date();
                    this.newEvent.date = today.toISOString().split('T')[0];
                }
            }
        },
        toggleAnalysisPanel() {
            this.showAnalysisPanel = !this.showAnalysisPanel;
            if (this.showAnalysisPanel) {
                this.showZoomPanel = false;
                this.showFilterPanel = false;
                this.showAddEventPanel = false;
                this.analysisTab = 'overview';
            }
        },
        switchAnalysisTab(tab) {
            this.analysisTab = tab;
        },
        closeAllPanels() {
            const state = closeAllPanels();
            Object.assign(this, state);
        },
        
        // 主题切换
        toggleTheme() {
            this.isDarkMode = !this.isDarkMode;
            document.body.classList.toggle('dark-mode', this.isDarkMode);
            localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
        },
        
        // 图片处理 - 使用uiHelpers模块
        handleImageError,
        
        // 新事件管理 - 使用tagUtils和eventUtils模块
        addTagToNewEvent() {
            const result = addTagFn(this.newEventTagInput, this.newEvent.tags, this.tagColors, this.newTagColor);
            if (!result.success) {
                if (result.message) alert(result.message);
                return;
            }
            this.newEvent.tags = result.updatedTags;
            this.tagColors = result.updatedTagColors;
            this.newEventTagInput = '';
            this.newTagColor = '#9fa8a3';
        },
        selectExistingTag(tag) {
            if (!this.newEvent.tags.includes(tag)) {
                this.newEvent.tags.push(tag);
            }
        },
        removeTagFromNewEvent(tag) {
            this.newEvent.tags = this.newEvent.tags.filter(t => t !== tag);
        },
        async saveNewEvent() {
            const result = saveEventFn(this.newEvent, this.events, this.backendConfig);
            if (!result.success) {
                alert(result.message);
                return;
            }
            
            // 如果使用后端API
            if (result.useBackend) {
                try {
                    const apiResult = await saveEventToAPI(this.backendConfig.apiUrl, result.event);
                    // 保存成功后重新加载数据
                    await this.loadData();
                    this.newEvent = resetNewEventForm();
                    this.showAddEventPanel = false;
                    alert('事件已成功保存到后端服务！');
                } catch (error) {
                    console.error('保存到后端失败:', error);
                    alert('保存到后端失败: ' + error.message);
                }
            } else {
                // 本地模式
                this.events = result.events;
                this.newEvent = resetNewEventForm();
                this.showAddEventPanel = false;
                alert(result.message);
            }
        },
        resetNewEventForm() {
            Object.assign(this, {
                newEvent: resetNewEventForm(),
                newEventTagInput: '',
                newTagColor: '#9fa8a3'
            });
        },
        
        // 热力图颜色
        getHeatmapColor(count) {
            if (count === 0) return '#ebedf0';
            if (count === 1) return '#c6e0d4';
            if (count === 2) return '#9cc5af';
            if (count <= 4) return '#6ba989';
            return '#468863';
        },
        getHeatmapLevel(count) {
            if (count === 0) return 0;
            if (count === 1) return 1;
            if (count === 2) return 2;
            if (count <= 4) return 3;
            return 4;
        },
        
        // 导出数据 - 使用dataManager模块
        exportDataAsYAML() {
            try {
                const data = {
                    tagColors: this.tagColors,
                    config: {
                        defaultZoomLevel: this.zoomLevel,
                        basePixelsPerDay: this.basePixelsPerDay,
                        display: {
                            showTags: this.showTags,
                            showLocation: this.showLocation,
                            showNote: this.showNote
                        },
                        initialScrollPosition: "end"
                    },
                    events: this.events
                };
                
                const yamlStr = exportToYAML(data);
                downloadFile(yamlStr, 'data.yaml', 'text/yaml;charset=utf-8');
            } catch (error) {
                console.error('导出失败:', error);
                alert('导出失败，请查看控制台错误信息');
            }
        },
        
        // UI辅助功能 - 使用uiHelpers模块
        setupDragScroll() {
            const container = this.$refs.timelineContainer;
            if (container) {
                this.dragScrollCleanup = initDragScroll(container);
            }
        },
        updateMinimapViewport() {
            const container = this.$refs.timelineContainer;
            const result = updateMinimapViewport(container);
            if (result) {
                this.minimap.viewportWidth = result.viewportWidth;
                this.minimap.scrollRatio = result.scrollRatio;
            }
        },
        startMinimapDrag(event) {
            event.preventDefault();
            this.minimap.isDragging = true;
            const { minimapTrack, timelineContainer } = this.$refs;
            if (minimapTrack && timelineContainer) {
                updateMinimapPosition(event, minimapTrack, timelineContainer);
            }
        },
        onMinimapDrag(event) {
            if (!this.minimap.isDragging) return;
            event.preventDefault();
            const { minimapTrack, timelineContainer } = this.$refs;
            if (minimapTrack && timelineContainer) {
                updateMinimapPosition(event, minimapTrack, timelineContainer);
            }
        },
        stopMinimapDrag() {
            this.minimap.isDragging = false;
        },
        clickMinimapTrack(event) {
            if (event.target === this.$refs.minimapTrack) {
                const { minimapTrack, timelineContainer } = this.$refs;
                if (minimapTrack && timelineContainer) {
                    updateMinimapPosition(event, minimapTrack, timelineContainer);
                }
            }
        },
        getMinimapItemStyle(event) {
            const position = getEventPosition(event.date, this.timelineRange, this.zoomLevel);
            const gradient = getTagGradient(event.tags, this.tagColors);
            return getMinimapItemStyle(event, () => position, this.timelineWidth, () => gradient);
        },
        scrollToEvent(event) {
            const container = this.$refs.timelineContainer;
            if (!container) return;
            const position = getEventPosition(event.date, this.timelineRange, this.zoomLevel);
            scrollToEvent(container, position, container.clientWidth);
        },
        
        onHeatmapCellHover(year, monthIndex, data) {
            if (data.count === 0) {
                 this.hoveredCell = null;
                 return;
            }
            this.hoveredCell = {
                year,
                month: monthIndex + 1,
                ...data
            };
        },
        onHeatmapCellLeave() {
            this.hoveredCell = null;
        },
        
        switchAnalysisTab(tab) {
            this.analysisTab = tab;
        },

        // Blog功能
        isBlogEvent(event) {
            return isBlogType(event);
        },
        getBlogSummary(event) {
            if (!event.contentFile) return '';
            const cached = getCachedBlogContent(event.contentFile);
            if (cached) {
                return extractSummary(cached, this.blogConfig.summaryLength);
            }
            return '加载中...';
        },
        async openBlog(event) {
            if (!this.isBlogEvent(event)) return;
            
            this.currentBlog.event = event;
            this.currentBlog.visible = true;
            this.currentBlog.loading = true;
            
            // 检查缓存
            let content = getCachedBlogContent(event.contentFile);
            
            if (!content) {
                // 加载内容
                const result = await loadBlogContent(event.contentFile, this.blogConfig.basePath);
                if (result.success) {
                    content = result.content;
                    setCachedBlogContent(event.contentFile, content);
                } else {
                    content = `# 加载失败\n\n无法加载博客内容：${result.error}`;
                }
            }
            
            this.currentBlog.content = content;
            // 使用marked渲染Markdown
            this.currentBlog.renderedContent = marked.parse(content);
            this.currentBlog.loading = false;
        },
        closeBlog() {
            this.currentBlog.visible = false;
            setTimeout(() => {
                if (!this.currentBlog.visible) {
                    this.currentBlog.event = null;
                    this.currentBlog.content = '';
                    this.currentBlog.renderedContent = '';
                }
            }, 300);
        },
    },
    mounted() {
        // 加载保存的主题偏好
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            this.isDarkMode = true;
            document.body.classList.add('dark-mode');
        }
        
        this.loadData().then(() => {
            this.$nextTick(() => {
                const container = this.$refs.timelineContainer;
                if (container) {
                    scrollToEnd(container);
                }
            });
        });
        
        this.setupDragScroll();
        
        this.wheelListener = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    this.zoomIn();
                } else {
                    this.zoomOut();
                }
            }
        };
        this.$refs.timelineContainer.addEventListener('wheel', this.wheelListener);
        
        const container = this.$refs.timelineContainer;
        if (container) {
            container.addEventListener('scroll', () => {
                this.updateMinimapViewport();
            });
            this.$nextTick(() => {
                this.updateMinimapViewport();
            });
        }
        
        document.addEventListener('mousemove', this.onMinimapDrag);
        document.addEventListener('mouseup', this.stopMinimapDrag);
        
        this.globalClickListener = (e) => {
            if (!e.target.closest('.floating-button') && 
                !e.target.closest('.control-panel') && 
                !e.target.closest('.add-event-modal')) {
                this.closeAllPanels();
            }
        };
        document.addEventListener('click', this.globalClickListener);
    },
    beforeUnmount() {
        if (this.globalClickListener) {
            document.removeEventListener('click', this.globalClickListener);
        }
        if (this.wheelListener && this.$refs.timelineContainer) {
            this.$refs.timelineContainer.removeEventListener('wheel', this.wheelListener);
        }
        if (this.dragScrollCleanup) {
            this.dragScrollCleanup();
        }
        document.removeEventListener('mousemove', this.onMinimapDrag);
        document.removeEventListener('mouseup', this.stopMinimapDrag);
    }
}).mount('#app');
