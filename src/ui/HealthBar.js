import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/config';

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
        if (!this.target || typeof this.target.health === 'undefined') {
            console.warn('Target object is missing or does not have health property');
            return;
        }

        const healthPercent = Math.max(0, Math.min(1, this.target.health / CONFIG.FORTRESS.MAX_HEALTH));
        const barWidth = this.maxWidth * healthPercent;

        this.bar.clear();
        this.bar.beginFill(0x00FF00);
        this.bar.drawRect(0, 0, barWidth, this.height);
        this.bar.endFill();
    }
} 