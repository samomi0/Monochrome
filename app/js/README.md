# JS 模块重构说明

## 目录结构

```
js/
├── constants.js                # 全局常量定义
├── core/                       # 核心领域逻辑
│   ├── timeline.js            # 时间轴核心计算
│   ├── event.js               # 事件领域模型
│   └── tag.js                 # 标签领域模型
├── services/                   # 服务层 (外部交互)
│   ├── dataService.js         # YAML数据加载
│   ├── apiService.js          # 后端API调用
│   └── blogService.js         # 博客内容服务
├── utils/                      # 通用工具函数
│   ├── dateUtils.js           # 日期格式化、计算
│   ├── colorUtils.js          # 颜色生成、渐变
│   ├── validators.js          # 数据验证
│   ├── fileUtils.js           # 文件下载、导出
│   └── textUtils.js           # 文本处理(Markdown摘要等)
├── ui/                         # UI相关
│   ├── interactions/          # 交互行为
│   │   ├── dragScroll.js     # 拖拽滚动
│   │   ├── zoom.js           # 缩放控制
│   │   └── navigation.js     # 滚动导航
│   ├── components/            # 组件逻辑
│   │   ├── minimap.js        # 缩略图逻辑
│   │   └── panels.js         # 面板管理
│   └── renderers/             # 渲染辅助
│       └── errorHandler.js   # 错误处理(图片错误等)
└── state/                      # 状态管理
    └── cacheManager.js        # 博客内容缓存管理
```

## 模块职责

### constants.js
存放所有常量定义,包括:
- 默认边距和间距
- 缩放范围配置
- 缩略图配置
- 颜色配置
- 博客配置
- 标签筛选状态常量

### core/ - 核心领域逻辑
不依赖其他层,纯业务逻辑处理。

#### timeline.js
- `getMonthPosition()` - 计算月份刻度位置
- `getEventPosition()` - 计算事件位置
- `getDotOffset()` - 计算圆点垂直偏移
- `generateTicks()` - 生成时间刻度
- `getOriginalIndex()` - 获取事件索引

#### event.js
- `saveNewEvent()` - 保存新事件
- `resetNewEventForm()` - 重置事件表单

#### tag.js
- `toggleTag()` - 三态标签切换
- `clearTags()` - 清空标签筛选
- `addTagToNewEvent()` - 添加标签到新事件
- `selectExistingTag()` - 选择已有标签
- `removeTagFromNewEvent()` - 移除标签

### services/ - 服务层
处理外部依赖(API、文件加载)。

#### dataService.js
- `loadYAMLConfig()` - 加载YAML配置
- `loadYAMLData()` - 加载YAML数据

#### apiService.js
- `loadDataFromAPI()` - 从后端加载数据
- `saveEventToAPI()` - 保存事件到后端

#### blogService.js
- `loadBlogContent()` - 加载博客内容

### utils/ - 工具层
纯函数,无副作用,可独立测试。

#### dateUtils.js
- `formatDate()` - 格式化日期
- `formatTickLabel()` - 格式化刻度标签
- `daysBetween()` - 计算天数差
- `isValidDate()` - 验证日期
- `getMonthStart()` - 获取月初
- `getDaysInMonth()` - 获取月份天数
- `calculateDateRange()` - 计算日期范围

#### colorUtils.js
- `getTagColor()` - 获取标签颜色
- `getTagGradient()` - 获取标签渐变色

#### validators.js
- `validateEvents()` - 验证事件数组
- `validateNewEvent()` - 验证新事件
- `validateTag()` - 验证标签输入

#### fileUtils.js
- `exportToYAML()` - 导出为YAML
- `downloadFile()` - 下载文件

#### textUtils.js
- `extractSummary()` - 提取Markdown摘要
- `isBlogType()` - 检查是否为博客类型

### ui/ - UI层
处理视图和用户交互。

#### ui/interactions/ - 交互行为

##### dragScroll.js
- `initDragScroll()` - 初始化拖拽滚动

##### navigation.js
- `scrollToEnd()` - 滚动到末尾
- `scrollToStart()` - 滚动到开始
- `scrollToEvent()` - 滚动到事件

##### zoom.js
- `zoomIn()` - 放大
- `zoomOut()` - 缩小

#### ui/components/ - 组件逻辑

##### minimap.js
- `updateMinimapViewport()` - 更新缩略图视口
- `updateMinimapPosition()` - 更新缩略图位置
- `getMinimapItemStyle()` - 获取缩略图项样式

##### panels.js
- `togglePanel()` - 切换面板
- `closeAllPanels()` - 关闭所有面板

#### ui/renderers/ - 渲染辅助

##### errorHandler.js
- `handleImageError()` - 处理图片加载错误

### state/ - 状态管理

#### cacheManager.js
- `getCachedBlogContent()` - 获取缓存内容
- `setCachedBlogContent()` - 设置缓存内容
- `clearBlogCache()` - 清空缓存

## 依赖关系

```
app.js
  ↓
ui/ → state/
  ↓     ↓
services/ → core/ ← utils/
              ↑
          constants
```

**规则:**
- `core/` 不依赖任何其他层
- `utils/` 只依赖 `constants`
- `services/` 可依赖 `utils/`
- `ui/` 可依赖 `utils/` 和 `constants`
- `state/` 独立,仅管理状态
- `app.js` 组装所有模块

## 迁移对照表

### 旧文件 → 新文件

#### dataManager.js
- `loadYAMLConfig/Data` → `services/dataService.js`
- `loadDataFromAPI/saveEventToAPI` → `services/apiService.js`
- `validateEvents` → `utils/validators.js`
- `exportToYAML` → `utils/fileUtils.js`
- `downloadFile` → `utils/fileUtils.js`

#### timelineUtils.js
- 位置计算函数 → `core/timeline.js`
- 日期格式化 → `utils/dateUtils.js`
- 缩放逻辑 → `ui/interactions/zoom.js`

#### tagUtils.js
- `getTagColor/Gradient` → `utils/colorUtils.js`
- `toggleTag等` → `core/tag.js`

#### blogUtils.js
- `loadBlogContent` → `services/blogService.js`
- `extractSummary` → `utils/textUtils.js`
- 缓存相关 → `state/cacheManager.js`

#### eventUtils.js
- 全部 → `core/event.js`

#### uiHelpers.js
- `initDragScroll` → `ui/interactions/dragScroll.js`
- `scrollTo*` → `ui/interactions/navigation.js`
- `handleImageError` → `ui/renderers/errorHandler.js`
- `*Minimap*` → `ui/components/minimap.js`
- `*Panel*` → `ui/components/panels.js`

## 优势

### 1. 单一职责
每个模块职责清晰,易于理解和维护。

### 2. 可测试性
纯函数分离,便于单元测试。

### 3. 可复用性
通用工具函数可在其他项目中复用。

### 4. 可扩展性
新功能可按层次添加,不影响现有代码。

### 5. 依赖清晰
模块间依赖方向明确,避免循环依赖。

### 6. 易于维护
代码分类清晰,快速定位功能所在位置。

## 注意事项

1. **旧文件保留**: 原有的 `dataManager.js`、`uiHelpers.js` 等文件暂时保留,确保没有遗漏的引用。
2. **逐步迁移**: 可以先验证新结构正常工作后,再删除旧文件。
3. **JSDoc注释**: 所有函数都添加了JSDoc注释,便于IDE提示。
4. **常量使用**: 尽量从 `constants.js` 导入常量,避免硬编码。
