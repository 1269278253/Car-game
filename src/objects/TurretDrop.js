import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/config.js';

export class TurretDrop extends PIXI.Container {
    constructor(type = 'normal', x, y) {
        super();
        
        this.type = type;
        this.x = x;
        this.y = y;
        this.collectRadius = CONFIG.ITEM.COLLECT_RADIUS;
        
        // 添加生命周期相关属性
        this.lifeTime = CONFIG.ITEM.LIFE_TIME; // 总生命时间（毫秒）
        this.blinkStartTime = CONFIG.ITEM.LIFE_TIME * 0.7; // 开始闪烁的时间点
        this.createTime = Date.now(); // 创建时间
        this.isExpired = false; // 是否已过期
        
        this.setup();
    }

    setup() {
        // 创建掉落物精灵
        const texture = this.type === 'shotgun' ? 'tank_barrel_red' : 'tank_barrel_blue';
        this.sprite = PIXI.Sprite.from(texture);
        this.sprite.anchor.set(0.5);
        this.sprite.width = CONFIG.TURRET.SIZE;
        this.sprite.height = CONFIG.TURRET.SIZE * 0.4;
        this.addChild(this.sprite);

        // 添加发光效果
        this.glow = new PIXI.Graphics();
        this.glow.beginFill(0xFFFFFF, 0.3);
        this.glow.drawCircle(0, 0, this.collectRadius);
        this.glow.endFill();
        this.addChildAt(this.glow, 0);

        // 添加动画效果
        this.animate();
    }

    animate() {
        // 上下浮动动画
        const floatAnimation = () => {
            if (this.destroyed) return;
            const targetY = this.y + Math.sin(Date.now() / 500) * 2;
            this.y = targetY;
            requestAnimationFrame(floatAnimation);
        };
        floatAnimation();

        // 旋转动画
        const rotateAnimation = () => {
            if (this.destroyed) return;
            this.sprite.rotation += 0.02;
            requestAnimationFrame(rotateAnimation);
        };
        rotateAnimation();
    }

    update() {
        const currentTime = Date.now();
        const aliveTime = currentTime - this.createTime;
        
        // 检查是否应该消失
        if (aliveTime >= this.lifeTime) {
            if (!this.isExpired) {
                this.expire();
            }
            return true; // 返回true表示应该被移除
        }
        
        // 检查是否应该开始闪烁
        if (aliveTime >= this.blinkStartTime) {
            const blinkPhase = Math.sin(currentTime / 100); // 闪烁频率
            this.alpha = Math.max(0.3, blinkPhase); // 最小透明度0.3
        }
        
        return false;
    }

    expire() {
        this.isExpired = true;
        return new Promise((resolve) => {
            // 创建消失动画
            const startScale = this.scale.x;
            let progress = 0;
            const duration = 20; // 动画持续的帧数
            
            const expireAnimation = () => {
                if (this.destroyed) {
                    resolve();
                    return;
                }
                
                progress++;
                const ratio = progress / duration;
                const currentScale = startScale * (1 - ratio);
                
                this.scale.set(currentScale);
                this.alpha = 1 - ratio;
                
                if (progress >= duration) {
                    this.destroy();
                    resolve();
                } else {
                    requestAnimationFrame(expireAnimation);
                }
            };
            
            expireAnimation();
        });
    }

    collect() {
        if (this.isExpired) return Promise.resolve();
        
        return new Promise((resolve) => {
            // 创建收集动画
            const startScale = this.scale.x;
            let progress = 0;
            const duration = 30; // 动画持续的帧数
            
            const collectAnimation = () => {
                if (this.destroyed) {
                    resolve();
                    return;
                }
                
                progress++;
                const ratio = progress / duration;
                const currentScale = startScale * (1 - ratio);
                
                this.scale.set(currentScale);
                
                if (progress >= duration) {
                    this.destroy();
                    resolve();
                } else {
                    requestAnimationFrame(collectAnimation);
                }
            };
            
            collectAnimation();
        });
    }
} 