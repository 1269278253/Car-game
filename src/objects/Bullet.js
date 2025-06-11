/**
 * 堡垒发射的子弹类
 * @class Bullet
 * @extends PIXI.Container
 */
import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/config.js';

export class Bullet extends PIXI.Container {
    /**
     * 初始化子弹
     * @param {number} x - 初始X坐标
     * @param {number} y - 初始Y坐标
     * @param {number} angle - 发射角度（弧度）
     * @param {number} speed - 移动速度
     * @param {number} damage - 伤害值
     */
    constructor(x, y, angle, speed = CONFIG.BULLET.SPEED, damage = CONFIG.BULLET.DAMAGE) {
        super();
        
        // 添加名字属性
        this.name = 'bullet';
        
        // 设置位置
        this.x = x;
        this.y = y;
        
        // 设置属性
        this.angle = angle;
        this.speed = speed;
        this.damage = damage;
        this.initialX = x;
        this.initialY = y;

        // 初始化图形
        this.setup();
    }

    /**
     * 设置子弹的图形表现
     * @private
     */
    setup() {
        // 创建子弹精灵
        this.sprite = PIXI.Sprite.from('bullet_blue');
        this.sprite.name = 'bullet_sprite';
        this.sprite.anchor.set(0.5);
        this.sprite.width = CONFIG.BULLET.SIZE * 2;
        this.sprite.height = CONFIG.BULLET.SIZE * 2;
        this.sprite.rotation = this.angle + Math.PI / 2; // 调整子弹方向
        this.addChild(this.sprite);
    }

    /**
     * 更新子弹位置
     * @param {number} delta - 时间增量
     * @returns {boolean} 是否超出屏幕范围
     */
    update(delta) {
        try {
            // 根据角度和速度更新位置
            this.x += Math.cos(this.angle) * this.speed * delta;
            this.y += Math.sin(this.angle) * this.speed * delta;
            // 检查是否超出屏幕范围
            return this.isOutOfBounds();
        } catch (error) {
            console.error('子弹更新出错:', error);
            return true; // 出错时移除子弹
        }
    }

    /**
     * 检查是否超出屏幕范围
     * @private
     * @returns {boolean}
     */
    isOutOfBounds() {
        return (
            this.x < 0 ||
            this.x > CONFIG.GAME.WORLD_WIDTH ||
            this.y < 0 ||
            this.y > CONFIG.GAME.WORLD_HEIGHT ||
            // 检查子弹是否超出最大射程
            Math.abs(this.x - this.initialX) > CONFIG.BULLET.RANGE ||
            Math.abs(this.y - this.initialY) > CONFIG.BULLET.RANGE
        );
    }

    /**
     * 检查是否击中目标
     * @param {Enemy} enemy - 敌人对象
     * @returns {boolean} 是否击中
     */
    checkHit(enemy) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (enemy.width / 2);
    }
} 