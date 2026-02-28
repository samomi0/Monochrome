// UI交互模块 - 入场动画

/**
 * 初始化事件卡片入场动画
 * 使用 IntersectionObserver 检测卡片进入/离开可视区域
 * - 进入时触发入场动画（带交错延迟）
 * - 离开时重置状态，允许下次再进入时重新播放
 * - 动画结束后立即移除动画 class，避免与 hover transition 冲突
 * 
 * @param {HTMLElement} container - 滚动容器（timeline-container）
 * @param {Object} options - 配置选项
 * @param {number} [options.staggerDelay=60] - 交错动画间隔(ms)
 * @returns {{ refresh: Function, destroy: Function }}
 */
export function initEntryAnimations(container, options = {}) {
    const {
        staggerDelay = 60
    } = options;

    // CSS class 约定：
    // .entry-pending  — 等待入场（opacity: 0）
    // .animate-in     — 正在播放入场动画
    // .entry-visible  — 动画播放完毕，正常显示

    let observer = null;
    let pendingBatch = [];
    let batchTimer = null;

    /**
     * 处理一批同时进入视口的节点
     */
    const processBatch = () => {
        if (pendingBatch.length === 0) return;

        // 按水平位置排序
        const batch = pendingBatch.splice(0);
        batch.sort((a, b) => {
            const aLeft = parseFloat(a.style.left) || 0;
            const bLeft = parseFloat(b.style.left) || 0;
            return aLeft - bLeft;
        });

        batch.forEach((node, index) => {
            setTimeout(() => {
                // 只处理仍处于 pending 状态的节点（可能已被 refresh 重置）
                if (!node.classList.contains('entry-pending')) return;

                const card = node.querySelector('.event-card');
                const dot = node.querySelector('.event-dot');

                // 切换到动画状态
                node.classList.remove('entry-pending');

                if (dot) {
                    dot.classList.add('animate-in');
                }
                if (card) {
                    card.classList.add('animate-in');
                }

                // 动画结束后：移除动画 class，标记为 visible
                const onAnimEnd = () => {
                    if (card) {
                        card.classList.remove('animate-in');
                        card.removeEventListener('animationend', onAnimEnd);
                    }
                    if (dot) {
                        dot.classList.remove('animate-in');
                    }
                    node.classList.add('entry-visible');
                };

                if (card) {
                    card.addEventListener('animationend', onAnimEnd, { once: true });
                } else {
                    // 没有 card 的情况下直接标记
                    node.classList.add('entry-visible');
                }
            }, index * staggerDelay);
        });
    };

    /**
     * IntersectionObserver 回调
     */
    const onIntersect = (entries) => {
        entries.forEach(entry => {
            const node = entry.target;

            if (entry.isIntersecting) {
                // 进入视口
                if (node.classList.contains('entry-pending')) {
                    pendingBatch.push(node);
                    // 用 microtask 批量处理同一帧内进入的多个节点
                    clearTimeout(batchTimer);
                    batchTimer = setTimeout(processBatch, 16);
                }
            } else {
                // 离开视口 — 重置状态以便下次重新播放
                if (node.classList.contains('entry-visible')) {
                    node.classList.remove('entry-visible');
                    node.classList.add('entry-pending');

                    const card = node.querySelector('.event-card');
                    const dot = node.querySelector('.event-dot');
                    if (card) card.classList.remove('animate-in');
                    if (dot) dot.classList.remove('animate-in');
                }
            }
        });
    };

    const createObserver = () => {
        observer = new IntersectionObserver(onIntersect, {
            root: container,
            rootMargin: '0px 80px 0px 80px',
            threshold: 0.05
        });
    };

    /**
     * 观察所有事件节点
     */
    const observeNodes = () => {
        if (!observer) createObserver();

        const nodes = container.querySelectorAll('.event-node');
        nodes.forEach(node => {
            // 跳过已经在观察中或已 visible 的节点
            if (node.classList.contains('entry-pending') ||
                node.classList.contains('entry-visible') ||
                node.classList.contains('animate-in')) {
                return;
            }

            // 标记为待入场
            node.classList.add('entry-pending');
            observer.observe(node);
        });
    };

    /**
     * 数据变化后刷新（重新观察新节点）
     */
    const refresh = () => {
        requestAnimationFrame(() => {
            observeNodes();
        });
    };

    createObserver();

    return {
        refresh,
        destroy() {
            clearTimeout(batchTimer);
            if (observer) {
                observer.disconnect();
                observer = null;
            }
            pendingBatch = [];
        }
    };
}
