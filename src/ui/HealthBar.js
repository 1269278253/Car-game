import * as PIXI from 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.3.2/pixi.min.mjs';
import { CONFIG } from '../config/config.js';

export class HealthBar extends PIXI.Container {
    constructor(target) {
        super();
        
        if (!target) {
            throw new Error('HealthBar requires a target object with health property');
        }
        
        this.target = target;
        this.maxWidth = CONFIG.UI.HEALTH_BAR_WIDTH;
        this.height = CONFIG.UI.HEALTH_BAR_HEIGHT;
        
        this.setup();
    }

    setup() {
        // 创建背景
        this.background = new PIXI.Graphics();
        this.background.beginFill(0xFF0000);
        this.background.drawRect(0, 0, this.maxWidth, this.height);
        this.background.endFill();
        this.addChild(this.background);

        // 创建血量条
        this.bar = new PIXI.Graphics();
        this.bar.beginFill(0x00FF00);
        this.bar.drawRect(0, 0, this.maxWidth, this.height);
        this.bar.endFill();
        this.addChild(this.bar);

        // 初始更新
        this.update();
    }

    update() {
        // 检查目标是否存在且未被销毁
        if (!this.target || !this.target.parent || typeof this.target.health === 'undefined') {
            // 如果目标不存在，将血条设置为空
            this.bar.clear();
            this.bar.beginFill(0x00FF00);
            this.bar.drawRect(0, 0, 0, this.height);
            this.bar.endFill();
            return;
        }

        const healthPercent = Math.max(0, Math.min(1, this.target.health / CONFIG.FORTRESS.MAX_HEALTH));
        const barWidth = this.maxWidth * healthPercent;

        this.bar.clear();
        this.bar.beginFill(0x00FF00);
        this.bar.drawRect(0, 0, barWidth, this.height);
        this.bar.endFill();
    }

    destroy() {
        // 清除对目标的引用
        this.target = null;
        super.destroy();
    }
} 