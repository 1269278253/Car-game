import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/config';

export class Enemy extends PIXI.Container {
    constructor() {
        super();
        
        // 初始化属性
        this.health = CONFIG.ENEMY.HEALTH;
        this.speed = CONFIG.ENEMY.SPEED;
        this.damage = CONFIG.ENEMY.DAMAGE;
        
        // 设置初始位置（在屏幕边缘随机生成）
        this.setRandomPosition();
        
        // 创建敌人图形
        this.setup();
    }

    setup() {
        // 创建敌人主体
        this.body = new PIXI.Graphics();
        this.updateAppearance();
        this.addChild(this.body);

        // 创建血条
        this.healthBar = new PIXI.Graphics();
        this.healthBar.y = -20; // 将血条放在敌人上方
        this.addChild(this.healthBar);
        this.updateHealthBar();
    }

    setRandomPosition() {
        // 随机选择生成位置（上、下、左、右四个边）
        const side = Math.floor(Math.random() * 4);
        switch(side) {
            case 0: // 上边
                this.x = Math.random() * CONFIG.GAME.WIDTH;
                this.y = -CONFIG.ENEMY.SIZE;
                break;
            case 1: // 右边
                this.x = CONFIG.GAME.WIDTH + CONFIG.ENEMY.SIZE;
                this.y = Math.random() * CONFIG.GAME.HEIGHT;
                break;
            case 2: // 下边
                this.x = Math.random() * CONFIG.GAME.WIDTH;
                this.y = CONFIG.GAME.HEIGHT + CONFIG.ENEMY.SIZE;
                break;
            case 3: // 左边
                this.x = -CONFIG.ENEMY.SIZE;
                this.y = Math.random() * CONFIG.GAME.HEIGHT;
                break;
        }
    }

    updateAppearance() {
        this.body.clear();
        
        // 根据生命值设置颜色
        const healthPercent = this.health / CONFIG.ENEMY.HEALTH;
        const color = this.getHealthColor(healthPercent);
        
        // 绘制敌人形状（三角形）
        this.body.beginFill(color);
        this.body.moveTo(-CONFIG.ENEMY.SIZE/2, CONFIG.ENEMY.SIZE/2);
        this.body.lineTo(CONFIG.ENEMY.SIZE/2, CONFIG.ENEMY.SIZE/2);
        this.body.lineTo(0, -CONFIG.ENEMY.SIZE/2);
        this.body.closePath();
        this.body.endFill();
    }

    updateHealthBar() {
        this.healthBar.clear();
        
        // 血条背景
        this.healthBar.beginFill(0xFF0000);
        this.healthBar.drawRect(-15, 0, 30, 4);
        this.healthBar.endFill();
        
        // 当前血量
        const healthPercent = this.health / CONFIG.ENEMY.HEALTH;
        this.healthBar.beginFill(0x00FF00);
        this.healthBar.drawRect(-15, 0, 30 * healthPercent, 4);
        this.healthBar.endFill();
    }

    getHealthColor(percent) {
        if (percent > 0.6) return 0xFF0000; // 红色
        if (percent > 0.3) return 0xFF6600; // 橙色
        return 0xFF9900; // 深橙色
    }

    update(delta, fortress) {
        if (!fortress) return false;

        // 计算到堡垒的方向
        const dx = fortress.x - this.x;
        const dy = fortress.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 移动向堡垒
        if (distance > 0) {
            this.x += (dx / distance) * this.speed * delta;
            this.y += (dy / distance) * this.speed * delta;

            // 如果接触到堡垒，造成伤害
            if (distance < CONFIG.FORTRESS.SIZE) {
                this.attack(fortress);
            }
        }

        return false;
    }

    attack(fortress) {
        fortress.takeDamage(this.damage);
    }

    takeDamage(damage) {
        this.health -= damage;
        this.updateAppearance();
        this.updateHealthBar();
        return this.health <= 0;
    }
} 