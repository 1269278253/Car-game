import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/config.js';

export class Enemy extends PIXI.Container {
    constructor() {
        super();
        
        // 添加名字属性
        this.name = 'enemy';
        
        // 初始化属性
        this.health = CONFIG.ENEMY.HEALTH;
        this.speed = CONFIG.ENEMY.SPEED;
        this.damage = CONFIG.ENEMY.DAMAGE;
        this.collisionRadius = CONFIG.ENEMY.SIZE / 2;
        
        // 设置初始位置（在游戏世界边缘随机生成）
        this.setRandomPosition();
        
        // 创建敌人图形
        this.setup();
    }
    
    setup() {
        // 创建敌人主体（使用坦克精灵）
        this.body = PIXI.Sprite.from('tank_red');
        this.body.name = 'enemy_body';
        this.body.anchor.set(0.5);
        this.body.width = CONFIG.ENEMY.SIZE * 1.5;
        this.body.height = CONFIG.ENEMY.SIZE * 1.5;
        this.addChild(this.body);

        // 创建炮塔
        this.turret = PIXI.Sprite.from('tank_barrel_red');
        this.turret.name = 'enemy_turret';
        this.turret.anchor.set(0.25, 0.5);
        this.turret.width = CONFIG.ENEMY.SIZE * 1.2;
        this.turret.height = CONFIG.ENEMY.SIZE * 0.4;
        this.addChild(this.turret);

        // 创建血条
        this.createHealthBar();
    }

    setRandomPosition() {
        // 随机选择生成位置（上、下、左、右边缘）
        const side = Math.floor(Math.random() * 4);
        const worldWidth = CONFIG.GAME.WORLD_WIDTH;
        const worldHeight = CONFIG.GAME.WORLD_HEIGHT;
        
        switch(side) {
            case 0: // 上边缘
                this.x = Math.random() * worldWidth;
                this.y = -CONFIG.ENEMY.SIZE;
                break;
            case 1: // 右边缘
                this.x = worldWidth + CONFIG.ENEMY.SIZE;
                this.y = Math.random() * worldHeight;
                break;
            case 2: // 下边缘
                this.x = Math.random() * worldWidth;
                this.y = worldHeight + CONFIG.ENEMY.SIZE;
                break;
            case 3: // 左边缘
                this.x = -CONFIG.ENEMY.SIZE;
                this.y = Math.random() * worldHeight;
                break;
        }
    }

    update(delta, fortress) {
        // 如果堡垒不存在或已被销毁，停止更新
        if (!fortress || !fortress.parent) {
            return false;
        }

        // 计算到堡垒的方向
        const dx = fortress.x - this.x;
        const dy = fortress.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.speed) {
            // 计算新位置
            const newX = this.x + (dx / distance) * this.speed * delta;
            const newY = this.y + (dy / distance) * this.speed * delta;
            
            // 检查与树木的碰撞
            const playScene = this.parent.parent;
            if (!playScene.checkCollisionWithTrees(this, newX, newY)) {
                this.x = newX;
                this.y = newY;
            } else {
                // 如果发生碰撞，尝试绕过障碍物
                const angle = Math.random() * Math.PI * 2;
                this.x += Math.cos(angle) * this.speed * delta;
                this.y += Math.sin(angle) * this.speed * delta;
            }

            // 更新朝向
            this.rotation = Math.atan2(dy, dx);
            this.turret.rotation = this.rotation;
            
        }

        // 如果接触到堡垒，造成伤害
        if (distance < CONFIG.FORTRESS.SIZE) {
            this.attack(fortress);
        }

        // 更新血条位置
        this.updateHealthBar();
        return false;
    }

    createHealthBar() {
        // 创建血条背景
        this.healthBar = new PIXI.Graphics();
        this.healthBar.y = -30; // 将血条放在敌人上方
        this.addChild(this.healthBar);
        this.updateHealthBar();
    }

    updateHealthBar() {
        this.healthBar.clear();
        
        // 血条背景
        this.healthBar.beginFill(0xFF0000);
        this.healthBar.drawRect(-20, 0, 40, 5);
        this.healthBar.endFill();
        
        // 当前血量
        const healthPercent = this.health / CONFIG.ENEMY.HEALTH;
        this.healthBar.beginFill(0x00FF00);
        this.healthBar.drawRect(-20, 0, 40 * healthPercent, 5);
        this.healthBar.endFill();
    }

    attack(fortress) {
        if (fortress && fortress.parent) {
            fortress.takeDamage(this.damage);
        }
    }

    takeDamage(damage) {
        this.health -= damage;
        this.updateHealthBar();
        return this.health <= 0;
    }
} 