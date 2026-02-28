// UI交互模块 - 拖拽滚动（含惯性滚动 + 吸附效果）

/**
 * 初始化拖拽滚动功能（支持惯性滚动和吸附）
 * @param {HTMLElement} container - 容器元素
 * @param {Object} options - 配置选项
 * @param {Function} [options.getEventPositions] - 获取事件位置数组的回调
 * @param {boolean} [options.enableSnap=true] - 是否启用吸附效果
 * @param {number} [options.snapThreshold=200] - 吸附触发的最大距离(px)
 * @returns {Function} 清理函数
 */
export function initDragScroll(container, options = {}) {
    const {
        getEventPositions = null,
        enableSnap = true,
        snapThreshold = 200
    } = options;

    let isDown = false;
    let startX;
    let scrollLeft;
    
    // 惯性滚动相关
    let velocityX = 0;
    let lastMoveX = 0;
    let lastMoveTime = 0;
    let inertiaAnimId = null;
    
    // 摩擦系数（越小衰减越快）
    const FRICTION = 0.95;
    // 最小速度阈值（低于此值停止惯性）
    const MIN_VELOCITY = 0.5;
    // 速度缩放因子
    const VELOCITY_SCALE = 2;

    const stopInertia = () => {
        if (inertiaAnimId) {
            cancelAnimationFrame(inertiaAnimId);
            inertiaAnimId = null;
        }
    };

    /**
     * 吸附到最近的事件节点
     */
    const snapToNearestEvent = () => {
        if (!enableSnap || !getEventPositions) return;
        
        const positions = getEventPositions();
        if (!positions || positions.length === 0) return;
        
        const containerCenter = container.scrollLeft + container.clientWidth / 2;
        
        // 找到距离容器中心最近的事件
        let nearestPos = positions[0];
        let minDist = Math.abs(positions[0] - containerCenter);
        
        for (let i = 1; i < positions.length; i++) {
            const dist = Math.abs(positions[i] - containerCenter);
            if (dist < minDist) {
                minDist = dist;
                nearestPos = positions[i];
            }
        }
        
        // 仅在距离足够近时才吸附
        if (minDist < snapThreshold) {
            const targetScroll = nearestPos - container.clientWidth / 2;
            container.scrollTo({
                left: Math.max(0, targetScroll),
                behavior: 'smooth'
            });
        }
    };

    /**
     * 惯性滚动动画循环
     */
    const inertiaLoop = () => {
        if (Math.abs(velocityX) < MIN_VELOCITY) {
            velocityX = 0;
            inertiaAnimId = null;
            // 惯性结束后触发吸附
            snapToNearestEvent();
            return;
        }
        
        container.scrollLeft -= velocityX;
        velocityX *= FRICTION;
        
        inertiaAnimId = requestAnimationFrame(inertiaLoop);
    };

    const onMouseDown = (e) => {
        if (e.target.closest('.event-card')) {
            return;
        }
        
        stopInertia();
        isDown = true;
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        lastMoveX = e.pageX;
        lastMoveTime = Date.now();
        velocityX = 0;
        
        container.style.cursor = 'grabbing';
    };

    const onMouseLeave = () => {
        if (isDown) {
            isDown = false;
            container.style.cursor = '';
            startInertia();
        }
    };

    const onMouseUp = () => {
        if (!isDown) return;
        isDown = false;
        container.style.cursor = '';
        startInertia();
    };
    
    const startInertia = () => {
        if (Math.abs(velocityX) > MIN_VELOCITY) {
            inertiaAnimId = requestAnimationFrame(inertiaLoop);
        } else {
            // 无惯性时直接触发吸附
            snapToNearestEvent();
        }
    };

    const onMouseMove = (e) => {
        if (!isDown) return;
        e.preventDefault();
        
        const now = Date.now();
        const dt = now - lastMoveTime;
        
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * VELOCITY_SCALE;
        container.scrollLeft = scrollLeft - walk;
        
        // 计算瞬时速度
        if (dt > 0) {
            velocityX = (e.pageX - lastMoveX) * VELOCITY_SCALE / Math.max(dt, 8) * 16;
        }
        
        lastMoveX = e.pageX;
        lastMoveTime = now;
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseleave', onMouseLeave);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mousemove', onMouseMove);

    return () => {
        stopInertia();
        container.removeEventListener('mousedown', onMouseDown);
        container.removeEventListener('mouseleave', onMouseLeave);
        container.removeEventListener('mouseup', onMouseUp);
        container.removeEventListener('mousemove', onMouseMove);
    };
}
