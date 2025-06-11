import * as PIXI from 'pixi.js';
import { Turret } from './Turret.js';
import { Bullet } from './Bullet.js';
import { CONFIG } from '../config/config.js';

export class ShotgunTurret extends Turret {
    constructor() {
        super('shotgun');
        this.bulletCount = CONFIG.TURRET.SHOTGUN.BULLET_COUNT;
        this.spreadAngle = CONFIG.TURRET.SHOTGUN.SPREAD_ANGLE;
        this.fireRate = CONFIG.TURRET.SHOTGUN.FIRE_RATE;
        this.bulletDamage = CONFIG.TURRET.SHOTGUN.BULLET_DAMAGE;
        this.bulletSpeed = CONFIG.TURRET.SHOTGUN.BULLET_SPEED;
    }

    setup() {
        super.setup();
        // 使用红色炮管来区分散弹炮台
        this.sprite.texture = PIXI.Texture.from('tank_barrel_red');
    }

    createBullets(sourceX, sourceY, rotation) {
        const bullets = [];
        const barrelLength = this.sprite.width * 0.75;

        // 计算散弹的角度范围
        const angleStep = this.spreadAngle / (this.bulletCount - 1);
        const startAngle = rotation - this.spreadAngle / 2;

        // 创建多颗子弹
        for (let i = 0; i < this.bulletCount; i++) {
            const bulletAngle = startAngle + angleStep * i;
            const bulletX = sourceX + Math.cos(bulletAngle) * barrelLength;
            const bulletY = sourceY + Math.sin(bulletAngle) * barrelLength;

            const bullet = new Bullet(
                bulletX,
                bulletY,
                bulletAngle,
                this.bulletSpeed,
                this.bulletDamage
            );

            bullets.push(bullet);
        }

        return bullets;
    }
} 