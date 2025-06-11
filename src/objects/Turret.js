import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/config.js';
import { ASSETS } from '../config/assets.js';
import { Bullet } from './Bullet.js';

export class Turret extends PIXI.Container {
    constructor(type = 'normal') {
        super();
        
        this.type = type;
        this.lastFireTime = 0;
        this.fireRate = CONFIG.TURRET.FIRE_RATE;
        this.bulletDamage = CONFIG.TURRET.BULLET_DAMAGE;
        this.bulletSpeed = CONFIG.TURRET.BULLET_SPEED;
        
        this.setup();
    }

    setup() {
        // 创建炮塔精灵
        this.sprite = PIXI.Sprite.from('tank_barrel_blue');
        this.sprite.anchor.set(0.25, 0.5); // 设置锚点在炮管底部中心
        this.sprite.width = CONFIG.TURRET.SIZE * 1.2;
        this.sprite.height = CONFIG.TURRET.SIZE * 0.4;
        this.addChild(this.sprite);
    }

    fire(sourceX, sourceY, rotation) {
        const now = Date.now();
        if (now - this.lastFireTime >= this.fireRate) {
            this.lastFireTime = now;
            return this.createBullets(sourceX, sourceY, rotation);
        }
        return [];
    }

    createBullets(sourceX, sourceY, rotation) {
        // 基础炮台只发射一颗子弹
        const barrelLength = this.sprite.width * 0.75;
        const bulletX = sourceX + Math.cos(rotation) * barrelLength;
        const bulletY = sourceY + Math.sin(rotation) * barrelLength;

        const bullet = new Bullet(
            bulletX, 
            bulletY, 
            rotation,
            this.bulletSpeed,
            this.bulletDamage
        );

        return [bullet];
    }

    destroy() {
        this.sprite.destroy();
        super.destroy();
    }
} 