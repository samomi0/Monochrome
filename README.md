# Monochrome

这是一个时间轴。

起因只是我想有个能展示我过去事件经历的东西，

至于名字，来自Geebar《褪色的佛》的歌词 —— “直到故事都变成灰照片”。

*Powered By Claude Sonnet 4.5*

## 使用

### 数据配置

#### 事件数据 (`app/data/data.yaml`)

支持两种类型的内容：

**1. 普通事件 (event)**
```yaml
- date: 2025-01-01        # 必须，日期格式 YYYY-MM-DD
  title: 事件标题         # 必须
  type: event             # 可选，默认为 event
  subtitle: 副标题        # 可选
  content: 事件详细描述   # 可选，支持多行
  tags:                   # 可选
    - 标签1
    - 标签2
  location: 地点          # 可选
  note: 备注信息          # 可选
  image: image.jpg        # 可选，图片文件名
```

**2. 博客文章 (blog)**
```yaml
- date: 2026-01-11
  type: blog                    # 必须
  contentFile: "20260111.md"    # 必须，Markdown 文件名
  tags: [随笔]                  # 可选
  location: 地点                # 可选
  image: blog_image.jpg         # 可选
  note: 备注                    # 可选
```

博客内容使用 Markdown 格式编写，文件保存在 `app/data/blog/` 目录下。

#### 应用配置 (`app/data/config.yaml`)

**标签颜色配置**
```yaml
tagColors:
  标签名称: "#颜色代码"  # 支持十六进制颜色
```

**应用设置**
```yaml
config:
  defaultZoomLevel: 1              # 默认缩放级别
  basePixelsPerDay: 5              # 时间轴每天的像素数
  initialScrollPosition: "end"     # 初始滚动位置 (start/end)
  display:
    showTags: true                 # 是否显示标签
    showLocation: true             # 是否显示地点
    showNote: true                 # 是否显示备注
  blog:
    enabled: true                  # 启用博客功能
    summaryLength: 100             # 摘要字符数
    basePath: "./data/blog/"       # 博客文件路径
    readMoreColor: "#d4a5a5"       # 阅读全文按钮颜色
```

#### 图像文件

图片文件放置在 `app/image/` 目录下，在事件数据中通过文件名引用。

### 启动

在app目录下运行：
~~~py
python -m http.server 8000
~~~

## 展示

![image](./example/image1.jpg)