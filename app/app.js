const { createApp } = Vue;

createApp({
    data() {
        return {
            events: [],
            selectedTags: {}, // 改为对象: { tagName: 'whitelist' | 'blacklist' }
            zoomLevel: 1,
            basePixelsPerDay: 5, // 基础每天的像素数
            showZoomPanel: false,
            showFilterPanel: false,
            showAddEventPanel: false,
            // 时间轴方向: 'horizontal' 或 'vertical'
            timelineOrientation: 'horizontal',
            // 显示/隐藏选项
            showTags: true,
            showLocation: true,
            showNote: true,
            // 标签颜色映射（将从YAML加载）
            tagColors: {},
            // 应用元信息
            appMeta: {
                author: '',
                year: new Date().getFullYear()
            },
            // 新增事件表单
            newEvent: {
                date: '',
                title: '',
                subtitle: '',
                content: '',
                tags: [],
                location: '',
                note: '',
                image: ''
            },
            newEventTagInput: '',
            newTagColor: '#9fa8a3', // 新标签的颜色
            // 用于存储事件监听器引用，便于清理
            globalClickListener: null,
            wheelListener: null,
            // 缩略图滚动栏
            minimap: {
                isDragging: false,
                viewportWidth: 0,
                scrollRatio: 0
            }
        };
    },
    computed: {
        // 缓存：排序后的有效日期数组
        sortedValidDates() {
            if (this.events.length === 0) {
                return [];
            }
            return this.events
                .map(e => {
                    const date = new Date(e.date);
                    return isNaN(date.getTime()) ? null : date;
                })
                .filter(date => date !== null)
                .sort((a, b) => a - b);
        },
        // 缓存：起始和结束日期
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
        // 缓存：总月份数
        totalMonths() {
            const { start, end } = this.timelineRange;
            return Math.max(
                (end.getFullYear() - start.getFullYear()) * 12 + 
                (end.getMonth() - start.getMonth()) + 1,
                1
            );
        },
        // 所有唯一的标签
        allTags() {
            const tags = new Set();
            this.events.forEach(event => {
                if (event.tags) {
                    event.tags.forEach(tag => tags.add(tag));
                }
            });
            return Array.from(tags).sort();
        },
        // 根据选中的标签过滤事件
        filteredEvents() {
            const whitelistTags = Object.keys(this.selectedTags).filter(tag => this.selectedTags[tag] === 'whitelist');
            const blacklistTags = Object.keys(this.selectedTags).filter(tag => this.selectedTags[tag] === 'blacklist');
            
            if (whitelistTags.length === 0 && blacklistTags.length === 0) {
                return this.events;
            }
            
            return this.events.filter(event => {
                const eventTags = event.tags || [];
                
                // 首先检查黑名单，如果命中黑名单则直接过滤
                if (blacklistTags.some(tag => eventTags.includes(tag))) {
                    return false;
                }
                
                // 如果有白名单，则必须命中白名单
                if (whitelistTags.length > 0) {
                    return whitelistTags.some(tag => eventTags.includes(tag));
                }
                
                // 只有黑名单，没有白名单，且未命中黑名单
                return true;
            });
        },
        // 计算时间范围
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
        // 计算总天数
        totalDays() {
            const range = this.dateRange;
            const diffTime = Math.abs(range.max - range.min);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            // 增加左右边距，确保时间轴不会太紧凑
            return Math.max(diffDays + 120, 365); // 至少显示一年，左右各60天边距
        },
        // 计算时间轴总宽度
        timelineWidth() {
            if (this.sortedValidDates.length === 0) {
                return 2000;
            }
            // 左边距 + 每月间距 * 月份数 + 右边距
            return 400 + (this.totalMonths * 200 * this.zoomLevel) + 400;
        },
        // 垂直时间轴高度
        timelineHeight() {
            if (this.sortedValidDates.length === 0) {
                return 2000;
            }
            // 顶部边距 + 每月间距 * 月份数 + 底部边距
            return 80 + (this.totalMonths * 200 * this.zoomLevel) + 100;
        },
        // 当前每天的像素数
        pixelsPerDay() {
            return this.basePixelsPerDay * this.zoomLevel;
        },
        // 计算刻度（按月生成）
        ticks() {
            if (this.sortedValidDates.length === 0) {
                return [];
            }
            
            const ticks = [];
            const { start, end } = this.timelineRange;
            
            // 从起始月份开始，每月生成一个刻度
            let currentMonth = new Date(start);
            const endMonth = new Date(end);
            
            while (currentMonth <= endMonth) {
                const yearMonth = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
                const monthPosition = this.getMonthPosition(currentMonth);
                
                // 检查该月是否有事件
                const hasEvent = this.events.some(event => {
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
                
                // 移动到下个月
                currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
            }
            
            return ticks.sort((a, b) => a.x - b.x);
        }
    },
    methods: {
        // 加载YAML数据
        async loadData() {
            try {
                const response = await fetch('./data/data.yaml');
                const yamlText = await response.text();
                const data = jsyaml.load(yamlText);
                
                // 加载标签颜色配置
                if (data.tagColors) {
                    this.tagColors = data.tagColors;
                }
                
                // 加载应用配置
                if (data.config) {
                    if (data.config.defaultZoomLevel !== undefined) {
                        this.zoomLevel = data.config.defaultZoomLevel;
                    }
                    if (data.config.basePixelsPerDay !== undefined) {
                        this.basePixelsPerDay = data.config.basePixelsPerDay;
                    }
                    if (data.config.timelineOrientation) {
                        this.timelineOrientation = data.config.timelineOrientation;
                    }
                    if (data.config.display) {
                        if (data.config.display.showTags !== undefined) {
                            this.showTags = data.config.display.showTags;
                        }
                        if (data.config.display.showLocation !== undefined) {
                            this.showLocation = data.config.display.showLocation;
                        }
                        if (data.config.display.showNote !== undefined) {
                            this.showNote = data.config.display.showNote;
                        }
                    }
                    // 加载元信息
                    if (data.config.meta) {
                        this.appMeta = { ...this.appMeta, ...data.config.meta };
                    }
                }
                
                // 加载事件数据
                if (data.events && Array.isArray(data.events)) {
                    // 验证并过滤无效日期的事件
                    const validEvents = data.events.filter(event => {
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
                    
                    this.events = validEvents.sort((a, b) => 
                        new Date(a.date) - new Date(b.date)
                    );
                    
                    const skipped = data.events.length - validEvents.length;
                    if (skipped > 0) {
                        console.warn(`已跳过 ${skipped} 个无效事件`);
                    }
                } else {
                    console.warn('未找到有效的事件数据');
                    this.events = [];
                }
            } catch (error) {
                console.error('加载数据失败:', error);
                // 提供降级方案
                this.events = [];
                alert('加载数据失败，请确保data.yaml文件存在且格式正确。已加载空时间轴。');
            }
        },
        // 计算月份刻度位置
        getMonthPosition(date) {
            const targetDate = new Date(date);
            // 验证日期有效性
            if (isNaN(targetDate.getTime())) {
                console.warn('无效日期:', date);
                return 400;
            }
            
            const targetMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
            
            if (this.sortedValidDates.length === 0) {
                return 400;
            }
            
            const { start } = this.timelineRange;
            
            // 左边距
            const leftMargin = 400;
            // 每个月的基础间距
            const monthSpacing = 200 * this.zoomLevel;
            
            // 计算目标月份与起始月份的差值
            const monthsDiff = (targetMonth.getFullYear() - start.getFullYear()) * 12 + 
                              (targetMonth.getMonth() - start.getMonth());

            console.log(`计算月份位置 - 日期: ${date}, 月份差值: ${monthsDiff}, 位置: ${leftMargin + (monthsDiff * monthSpacing)}`);
            
            return leftMargin + (monthsDiff * monthSpacing);
        },
        // 计算事件在时间轴上的位置（对齐到所在月份的刻度）
        getEventPosition(date) {
            const eventDate = new Date(date);
            // 验证日期有效性
            if (isNaN(eventDate.getTime())) {
                console.warn('无效日期:', date);
                return 400;
            }
            
            const basePosition = this.getMonthPosition(eventDate);
            
            // 计算月内偏移量
            const year = eventDate.getFullYear();
            const month = eventDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const dayOfMonth = eventDate.getDate();
            
            // 边界检查
            if (dayOfMonth < 1 || dayOfMonth > daysInMonth) {
                console.warn('日期超出月份范围:', date);
                return basePosition;
            }
            
            // 月份间距（考虑缩放）
            const monthSpacing = 200 * this.zoomLevel;
            
            // 计算日期在月内的相对位置
            // 1号对齐刻度起点，最后一天在月末（不超出到下月）
            // 使用80%的月份间距来放置事件，避免与下月刻度重叠
            let dayRatio;
            if (daysInMonth === 1 || dayOfMonth === 1) {
                dayRatio = 0;
            } else {
                dayRatio = (dayOfMonth - 1) / (daysInMonth - 1);
            }
            
            // 最大偏移范围：月份间距的80%
            const maxOffsetRange = monthSpacing * 0.8;
            
            // 计算偏移（相对于月份刻度起点）
            // 1号: offset = 0（刻度起点）
            // 最后一天: offset = maxOffsetRange（月末，不超出）
            const offset = dayRatio * maxOffsetRange;

            // 输出日志
            console.log(`计算事件位置 - 日期: ${date}, 月份起点: ${basePosition}, 天数: ${dayOfMonth}/${daysInMonth}, 偏移: ${offset}`);
            
            return basePosition + offset;
        },
        // 格式化日期显示
        formatDate(date) {
            const d = new Date(date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        },
        // 计算圆点的垂直偏移（根据与相邻事件的天数间隔）
        getDotOffset(eventDate, isAboveLine) {
            const currentDate = new Date(eventDate);
            // 验证日期
            if (isNaN(currentDate.getTime())) {
                return 50;
            }
            
            // 使用缓存的排序日期
            const dates = this.sortedValidDates;
            if (dates.length === 0) return 50;
            
            // 找到当前日期在排序数组中的位置
            const currentIndex = dates.findIndex(d => 
                d.getTime() === currentDate.getTime()
            );
            
            if (currentIndex === -1) return 50;
            
            let daysDiff = 0;
            const MS_PER_DAY = 1000 * 60 * 60 * 24;
            
            // 上方事件：计算与前一个事件的间隔
            if (isAboveLine && currentIndex > 0) {
                daysDiff = (currentDate - dates[currentIndex - 1]) / MS_PER_DAY;
            }
            // 下方事件：计算与后一个事件的间隔
            else if (!isAboveLine && currentIndex < dates.length - 1) {
                daysDiff = (dates[currentIndex + 1] - currentDate) / MS_PER_DAY;
            }
            
            // 检查同月事件数量
            const sameMonthCount = dates.filter(d => 
                d.getFullYear() === currentDate.getFullYear() && 
                d.getMonth() === currentDate.getMonth()
            ).length;
            
            const baseOffset = sameMonthCount > 1 ? 30 : 50;
            
            // 根据天数间隔计算偏移：间隔越大，离轴越远
            // 每30天增加10px，最多120px
            const offset = Math.min(baseOffset + Math.floor(daysDiff / 30) * 10, 120);
            return offset;
        },
        // 格式化刻度标签
        formatTickLabel(date, type) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            // 事件类型显示年月
            if (type === 'event') {
                return `${year}-${month}`;
            }
            
            // 其他类型保持原样
            return `${year}-${month}`;
        },
        // 获取事件在原始数组中的索引（用于判断上下位置）
        getOriginalIndex(event) {
            return this.events.findIndex(e => e.date === event.date && e.title === event.title);
        },
        // 获取垂直模式下的事件位置
        getVerticalEventPosition(date) {
            // 垂直模式下使用相同的位置计算逻辑，但应用到Y轴
            return this.getEventPosition(date);
        },
        // 获取垂直模式下的刻度
        getVerticalTicks() {
            const ticks = this.ticks;
            return ticks.map(tick => ({
                ...tick,
                y: tick.x // 将x坐标转换为y坐标
            }));
        },
        // 缩放功能
        zoomIn() {
            if (this.zoomLevel < 10) {
                this.zoomLevel += 0.5;
            }
        },
        zoomOut() {
            if (this.zoomLevel > 0.5) {
                this.zoomLevel -= 0.5;
            }
        },
        // 标签筛选 - 三态切换：未选中 -> 白名单 -> 黑名单 -> 未选中
        toggleTag(tag) {
            if (!this.selectedTags[tag]) {
                // 未选中 -> 白名单
                this.selectedTags[tag] = 'whitelist';
            } else if (this.selectedTags[tag] === 'whitelist') {
                // 白名单 -> 黑名单
                this.selectedTags[tag] = 'blacklist';
            } else {
                // 黑名单 -> 未选中
                delete this.selectedTags[tag];
            }
        },
        clearTags() {
            this.selectedTags = {};
        },
        // 获取标签颜色
        getTagColor(tag) {
            // 如果有预定义颜色则使用，否则生成一个基于标签名的颜色
            if (this.tagColors[tag]) {
                return this.tagColors[tag];
            }
            // 基于标签名生成颜色
            let hash = 0;
            for (let i = 0; i < tag.length; i++) {
                hash = tag.charCodeAt(i) + ((hash << 5) - hash);
            }
            const hue = hash % 360;
            return `hsl(${hue}, 70%, 60%)`;
        },
        // 获取标签渐变色（用于卡片头部）
        getTagGradient(tags) {
            if (!tags || tags.length === 0) {
                return 'linear-gradient(135deg, #667eea, #764ba2)';
            }
            const color1 = this.getTagColor(tags[0]);
            const color2 = tags.length > 1 ? this.getTagColor(tags[1]) : color1;
            return `linear-gradient(135deg, ${color1}, ${color2})`;
        },
        // 切换面板显示
        toggleZoomPanel() {
            this.showZoomPanel = !this.showZoomPanel;
            if (this.showZoomPanel) {
                this.showFilterPanel = false;
                this.showAddEventPanel = false;
            }
        },
        toggleFilterPanel() {
            this.showFilterPanel = !this.showFilterPanel;
            if (this.showFilterPanel) {
                this.showZoomPanel = false;
                this.showAddEventPanel = false;
            }
        },
        toggleAddEventPanel() {
            this.showAddEventPanel = !this.showAddEventPanel;
            if (this.showAddEventPanel) {
                this.showZoomPanel = false;
                this.showFilterPanel = false;
                // 设置默认日期为今天
                if (!this.newEvent.date) {
                    const today = new Date();
                    this.newEvent.date = today.toISOString().split('T')[0];
                }
            }
        },
        closeAllPanels() {
            this.showZoomPanel = false;
            this.showFilterPanel = false;
            this.showAddEventPanel = false;
        },
        // 切换时间轴方向
        toggleOrientation() {
            this.timelineOrientation = this.timelineOrientation === 'horizontal' ? 'vertical' : 'horizontal';
            // 切换后重置滚动位置和容器样式
            this.$nextTick(() => {
                const container = this.$refs.timelineContainer;
                const timeline = this.$refs.timeline;
                
                if (container) {
                    if (this.timelineOrientation === 'horizontal') {
                        // 水平模式：滚动到最右边
                        container.scrollLeft = 0;
                        setTimeout(() => {
                            container.scrollLeft = container.scrollWidth - container.clientWidth;
                        }, 100);
                    } else {
                        // 垂直模式：滚动到最下方
                        container.scrollTop = 0;
                        setTimeout(() => {
                            container.scrollTop = container.scrollHeight - container.clientHeight;
                        }, 100);
                    }
                }
            });
        },
        // 处理图片加载错误
        handleImageError(event) {
            console.error('图片加载失败:', event.target.src);
            // 显示占位图而不是隐藏
            event.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3E图片加载失败%3C/text%3E%3C/svg%3E';
            event.target.style.opacity = '0.5';
            // 防止无限循环
            event.target.onerror = null;
        },
        // 添加标签到新事件
        addTagToNewEvent() {
            const tag = this.newEventTagInput.trim();
            if (!tag) return;
            
            if (this.newEvent.tags.includes(tag)) {
                alert('该标签已添加到当前事件');
                return;
            }
            
            // 如果是新标签且不在tagColors中，添加颜色配置
            if (!this.tagColors[tag]) {
                this.tagColors[tag] = this.newTagColor;
            }
            
            this.newEvent.tags.push(tag);
            this.newEventTagInput = '';
            // 重置为默认颜色
            this.newTagColor = '#9fa8a3';
        },
        // 选择已有标签
        selectExistingTag(tag) {
            if (!this.newEvent.tags.includes(tag)) {
                this.newEvent.tags.push(tag);
            }
        },
        removeTagFromNewEvent(tag) {
            const index = this.newEvent.tags.indexOf(tag);
            if (index > -1) {
                this.newEvent.tags.splice(index, 1);
            }
        },
        // 保存新事件
        saveNewEvent() {
            // 验证必填字段
            if (!this.newEvent.date || !this.newEvent.title) {
                alert('请填写日期和标题');
                return;
            }
            
            // 验证日期格式
            const testDate = new Date(this.newEvent.date);
            if (isNaN(testDate.getTime())) {
                alert('日期格式无效，请使用 YYYY-MM-DD 格式');
                return;
            }
            
            // 创建新事件对象
            const event = {
                date: this.newEvent.date,
                title: this.newEvent.title
            };
            
            // 添加可选字段
            if (this.newEvent.subtitle) event.subtitle = this.newEvent.subtitle;
            if (this.newEvent.content) event.content = this.newEvent.content;
            if (this.newEvent.tags.length > 0) event.tags = [...this.newEvent.tags];
            if (this.newEvent.location) event.location = this.newEvent.location;
            if (this.newEvent.note) event.note = this.newEvent.note;
            if (this.newEvent.image) event.image = this.newEvent.image;
            
            // 添加到事件列表并排序
            this.events.push(event);
            this.events.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // 重置表单
            this.resetNewEventForm();
            this.showAddEventPanel = false;
            
            alert('事件已添加！请点击"导出数据"按钮下载更新后的YAML文件');
        },
        resetNewEventForm() {
            this.newEvent = {
                date: new Date().toISOString().split('T')[0],
                title: '',
                subtitle: '',
                content: '',
                tags: [],
                location: '',
                note: '',
                image: ''
            };
            this.newEventTagInput = '';
            this.newTagColor = '#9fa8a3';
        },
        // 导出数据为YAML
        exportDataAsYAML() {
            try {
                // 构建YAML数据结构
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
                        timelineOrientation: "horizontal",
                        initialScrollPosition: "end"
                    },
                    events: this.events
                };
                
                // 使用js-yaml转换为YAML格式
                const yamlStr = jsyaml.dump(data, {
                    indent: 2,
                    lineWidth: -1,
                    noRefs: true,
                    sortKeys: false
                });
                
                // 创建Blob并下载
                const blob = new Blob([yamlStr], { type: 'text/yaml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'data.yaml';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                // alert('数据已导出！请用下载的文件替换原data.yaml文件');
            } catch (error) {
                console.error('导出失败:', error);
                alert('导出失败，请查看控制台错误信息');
            }
        },
        // 初始化拖动功能
        initDragScroll() {
            const container = this.$refs.timelineContainer;
            let isDown = false;
            let startX;
            let scrollLeft;

            container.addEventListener('mousedown', (e) => {
                // 只在空白区域或时间轴上启用拖动，不在卡片上
                if (e.target.closest('.event-card')) {
                    return;
                }
                isDown = true;
                container.style.cursor = 'grabbing';
                startX = e.pageX - container.offsetLeft;
                scrollLeft = container.scrollLeft;
            });

            container.addEventListener('mouseleave', () => {
                isDown = false;
                container.style.cursor = 'grab';
            });

            container.addEventListener('mouseup', () => {
                isDown = false;
                container.style.cursor = 'grab';
            });

            container.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - container.offsetLeft;
                const walk = (x - startX) * 2; // 拖动速度
                container.scrollLeft = scrollLeft - walk;
            });
        },
        // 缩略图滚动栏相关方法
        updateMinimapViewport() {
            if (this.timelineOrientation !== 'horizontal') return;
            
            const container = this.$refs.timelineContainer;
            if (!container) return;
            
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            const scrollLeft = container.scrollLeft;
            
            this.minimap.viewportWidth = (clientWidth / scrollWidth) * 100;
            this.minimap.scrollRatio = scrollLeft / (scrollWidth - clientWidth);
        },
        startMinimapDrag(event) {
            event.preventDefault();
            this.minimap.isDragging = true;
            this.updateMinimapPosition(event);
        },
        onMinimapDrag(event) {
            if (!this.minimap.isDragging) return;
            event.preventDefault();
            this.updateMinimapPosition(event);
        },
        stopMinimapDrag() {
            this.minimap.isDragging = false;
        },
        updateMinimapPosition(event) {
            const minimapEl = this.$refs.minimapTrack;
            const container = this.$refs.timelineContainer;
            if (!minimapEl || !container) return;
            
            const rect = minimapEl.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const ratio = clickX / rect.width;
            
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            const maxScroll = scrollWidth - clientWidth;
            
            container.scrollLeft = ratio * maxScroll;
        },
        clickMinimapTrack(event) {
            // 点击缩略图轨道直接跳转
            if (event.target === this.$refs.minimapTrack) {
                this.updateMinimapPosition(event);
            }
        },
        getMinimapItemStyle(event) {
            // 计算每个事件在缩略图中的位置和颜色
            const position = this.getEventPosition(event.date);  // 传入 event.date，返回数字
            const totalWidth = this.timelineWidth;
            const leftPercent = (position / totalWidth) * 100;
            
            // 使用与 card-header 相同的渐变逻辑
            const gradient = this.getTagGradient(event.tags);
            
            return {
                position: 'absolute',
                left: leftPercent + '%',
                top: '0',
                width: '5px',
                height: '100%',
                background: gradient,
                opacity: '0.9',
                borderRadius: '2px',
                zIndex: '1'
            };
        },
    },
    mounted() {
        this.loadData().then(() => {
            // 数据加载完成后，滚动到末尾
            this.$nextTick(() => {
                const container = this.$refs.timelineContainer;
                if (container) {
                    container.scrollLeft = container.scrollWidth - container.clientWidth;
                }
            });
        });
        
        // 初始化拖动滚动
        this.initDragScroll();
        
        // 添加鼠标滚轮缩放功能
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
        
        // 监听滚动事件更新缩略图
        const container = this.$refs.timelineContainer;
        if (container) {
            container.addEventListener('scroll', () => {
                this.updateMinimapViewport();
            });
            // 初始化缩略图视口
            this.$nextTick(() => {
                this.updateMinimapViewport();
            });
        }
        
        // 监听全局鼠标事件用于拖动缩略图
        document.addEventListener('mousemove', this.onMinimapDrag);
        document.addEventListener('mouseup', this.stopMinimapDrag);
        
        // 点击外部关闭面板
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
        // 清理全局事件监听器
        if (this.globalClickListener) {
            document.removeEventListener('click', this.globalClickListener);
        }
        if (this.wheelListener && this.$refs.timelineContainer) {
            this.$refs.timelineContainer.removeEventListener('wheel', this.wheelListener);
        }
        // 清理缩略图拖动监听器
        document.removeEventListener('mousemove', this.onMinimapDrag);
        document.removeEventListener('mouseup', this.stopMinimapDrag);
    }
}).mount('#app');
