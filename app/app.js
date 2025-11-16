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
            newTagColor: '#9fa8a3' // 新标签的颜色
        };
    },
    computed: {
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
            if (this.events.length === 0) {
                return { min: new Date(), max: new Date() };
            }
            const dates = this.events.map(e => new Date(e.date));
            return {
                min: new Date(Math.min(...dates)),
                max: new Date(Math.max(...dates))
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
        // 计算时间轴总宽度（基于压缩后的位置）
        timelineWidth() {
            if (this.events.length === 0) {
                return 2000;
            }
            // 获取最后一个事件的位置，然后加上右边距
            const lastEventDate = this.events[this.events.length - 1].date;
            const lastPosition = this.getEventPosition(lastEventDate);
            return lastPosition + 800 + 400; // 添加右边距和左边距补偿
        },
        // 垂直时间轴高度
        timelineHeight() {
            if (this.events.length === 0) {
                return 2000;
            }
            // 垂直模式下，使用与水平模式相同的计算逻辑
            const lastEventDate = this.events[this.events.length - 1].date;
            const lastPosition = this.getEventPosition(lastEventDate);
            return lastPosition + 400; // 添加底部边距
        },
        // 当前每天的像素数
        pixelsPerDay() {
            return this.basePixelsPerDay * this.zoomLevel;
        },
        // 计算刻度（基于实际事件位置 + 间隙中间刻度）
        ticks() {
            if (this.events.length === 0) {
                return [];
            }
            
            const ticks = [];
            const allDates = this.events.map(e => new Date(e.date)).sort((a, b) => a - b);
            const addedMonths = new Set(); // 记录已添加的年月，避免重复
            
            // 为每个事件添加刻度（只在该月首次出现时显示）
            this.events.forEach(event => {
                const eventDate = new Date(event.date);
                const yearMonth = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
                
                // 只有该月份首次出现时才添加刻度
                if (!addedMonths.has(yearMonth)) {
                    addedMonths.add(yearMonth);
                    ticks.push({
                        date: eventDate,
                        x: this.getEventPosition(event.date),
                        label: yearMonth,
                        isEvent: true,
                        isTimeJump: false
                    });
                }
            });
            
            // 在事件间隙添加折跃标记
            for (let i = 0; i < allDates.length - 1; i++) {
                const currentDate = allDates[i];
                const nextDate = allDates[i + 1];
                const daysDiff = (nextDate - currentDate) / (1000 * 60 * 60 * 24);
                
                // 如果间隙超过180天，添加折跃标记
                if (daysDiff > 180) {
                    const currentPos = this.getEventPosition(this.events.find(e => 
                        new Date(e.date).getTime() === currentDate.getTime()).date);
                    const nextPos = this.getEventPosition(this.events.find(e => 
                        new Date(e.date).getTime() === nextDate.getTime()).date);
                    
                    const midPos = (currentPos + nextPos) / 2;
                    const jumpDays = Math.floor(daysDiff);
                    
                    ticks.push({
                        date: new Date((currentDate.getTime() + nextDate.getTime()) / 2),
                        x: midPos,
                        label: `⚡ ${jumpDays}天`,
                        isEvent: false,
                        isTimeJump: true,
                        jumpDays: jumpDays
                    });
                }
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
                if (data.events) {
                    this.events = data.events.sort((a, b) => 
                        new Date(a.date) - new Date(b.date)
                    );
                }
            } catch (error) {
                console.error('加载数据失败:', error);
                alert('加载数据失败，请确保data.yaml文件存在且格式正确');
            }
        },
        // 计算事件在时间轴上的位置（使用压缩算法）
        getEventPosition(date) {
            const eventDate = new Date(date);
            const startDate = new Date(this.dateRange.min);
            startDate.setDate(startDate.getDate() - 60);
            
            // 获取所有事件日期并排序
            const allDates = this.events.map(e => new Date(e.date)).sort((a, b) => a - b);
            
            // 左边距起始位置
            const leftMargin = 400;
            let position = leftMargin;
            const minGap = 150; // 最小间距（像素）
            const maxGap = 500; // 最大间距（像素）
            const normalDaysPerPixel = this.basePixelsPerDay * this.zoomLevel;
            const compressionThreshold = 90; // 超过90天的间隔开始压缩
            
            // 遍历所有事件，计算压缩后的位置
            for (let i = 0; i < allDates.length; i++) {
                if (eventDate.getTime() === allDates[i].getTime()) {
                    return position;
                }
                
                // 计算到下一个事件的天数
                if (i < allDates.length - 1) {
                    const currentDate = allDates[i];
                    const nextDate = allDates[i + 1];
                    const daysDiff = (nextDate - currentDate) / (1000 * 60 * 60 * 24);
                    
                    let segmentWidth;
                    if (daysDiff <= compressionThreshold) {
                        // 正常间距
                        segmentWidth = daysDiff * normalDaysPerPixel;
                    } else {
                        // 压缩间距：保持最小间距 + 对数缩放
                        const excessDays = daysDiff - compressionThreshold;
                        const compressedExtra = Math.log(excessDays + 1) * 50 * this.zoomLevel;
                        segmentWidth = compressionThreshold * normalDaysPerPixel + compressedExtra;
                    }
                    
                    // 限制在最小和最大间距之间
                    segmentWidth = Math.max(minGap, Math.min(maxGap * this.zoomLevel, segmentWidth));
                    position += segmentWidth;
                }
            }
            
            // 如果是起始日期前的位置
            if (eventDate < allDates[0]) {
                const daysDiff = (allDates[0] - eventDate) / (1000 * 60 * 60 * 24);
                return leftMargin - (daysDiff * normalDaysPerPixel);
            }
            
            return position;
        },
        // 格式化日期显示
        formatDate(date) {
            const d = new Date(date);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        },
        // 计算圆点的垂直偏移（根据与相邻事件的天数间隔）
        getDotOffset(eventDate, isAboveLine) {
            // 找到当前事件在原始数据中的索引
            const originalIndex = this.events.findIndex(e => e.date === eventDate);
            if (originalIndex === -1) return 50; // 默认偏移增加到50px
            
            const allDates = this.events.map(e => new Date(e.date));
            const currentDate = new Date(eventDate);
            
            let daysDiff = 0;
            
            // 上方事件：计算与前一个事件的间隔
            if (isAboveLine) {
                if (originalIndex > 0) {
                    const prevDate = allDates[originalIndex - 1];
                    daysDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
                }
            }
            // 下方事件：计算与后一个事件的间隔
            else {
                if (originalIndex < allDates.length - 1) {
                    const nextDate = allDates[originalIndex + 1];
                    daysDiff = (nextDate - currentDate) / (1000 * 60 * 60 * 24);
                }
            }
            
            // 根据天数间隔计算偏移：间隔越大，离轴越远
            // 基础偏移50px，每30天增加12px，最多150px
            const offset = Math.min(50 + Math.floor(daysDiff / 30) * 12, 150);
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
            event.target.style.display = 'none';
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
        }
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
        this.$refs.timelineContainer.addEventListener('wheel', (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    this.zoomIn();
                } else {
                    this.zoomOut();
                }
            }
        });
        
        // 点击外部关闭面板
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.floating-button') && !e.target.closest('.control-panel') && !e.target.closest('.add-event-modal')) {
                this.closeAllPanels();
            }
        });
    }
}).mount('#app');
