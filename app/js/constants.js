// 常量定义

// 默认边距和间距
export const DEFAULT_MARGIN = 400;
export const BASE_MONTH_SPACING = 200;
export const MAX_OFFSET_RATIO = 0.8;

// 缩放范围
export const MIN_ZOOM_LEVEL = 0.5;
export const MAX_ZOOM_LEVEL = 10;
export const ZOOM_STEP = 0.5;

// 缩略图配置
export const MINIMAP_ITEM_WIDTH = 5;
export const MINIMAP_ITEM_OPACITY = 0.9;

// 圆点偏移配置
export const BASE_DOT_OFFSET = 50;
export const MIN_DOT_OFFSET = 30;
export const MAX_DOT_OFFSET = 120;
export const DOT_OFFSET_INCREMENT = 10;

// 博客配置
export const DEFAULT_BLOG_SUMMARY_LENGTH = 150;
export const DEFAULT_BLOG_PATH = './data/blog/';

// 颜色配置
export const DEFAULT_TAG_COLOR = '#9fa8a3';

// 深色模式下的颜色配置
export const DARK_MODE_COLOR_CONFIG = {
    saturation: 45,
    lightness: 70
};

export const LIGHT_MODE_COLOR_CONFIG = {
    saturation: 70,
    lightness: 60
};

// 日期相关常量
export const MS_PER_DAY = 1000 * 60 * 60 * 24;

// 默认渐变色
export const DEFAULT_GRADIENT = 'linear-gradient(135deg, #667eea, #764ba2)';

// 标签筛选状态
export const TAG_FILTER_STATES = {
    WHITELIST: 'whitelist',
    BLACKLIST: 'blacklist'
};

// 错误图片占位符
export const ERROR_IMAGE_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="14"%3E图片加载失败%3C/text%3E%3C/svg%3E';
