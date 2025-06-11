import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/config.js';

import { Bullet } from './Bullet.js';
import { Turret } from './Turret.js';
import { ShotgunTurret } from './ShotgunTurret.js';

export class Fortress extends PIXI.Container {
    constructor() {
        super();
        this.name = 'fortress';
        this.health = CONFIG.FORTRESS.INITIAL_HEALTH;
        this.speed = CONFIG.FORTRESS.SPEED;
        this.rotation = 0;
        
        // 初始化炮台数组
        this.turrets = [];
        
        // 初始化按键状态
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            ArrowDown: false
        };

        // 使堡垒可以发出事件
        this.eventMode = 'static';
        
        this.setup();
    }

    setup() {
        // 创建坦克主体
        this.body = PIXI.Sprite.from('tank_blue');
        this.body.name = 'fortress_body';
        this.body.anchor.set(0.5);
        this.body.width = CONFIG.FORTRESS.SIZE * 1.5;
        this.body.height = CONFIG.FORTRESS.SIZE * 1.5;
        this.addChild(this.body);

        // 创建炮台容器
        this.turretContainer = new PIXI.Container();
        this.addChild(this.turretContainer);

        // 添加默认炮台
        this.addTurret(new Turret());

        // 设置初始位置
        this.x = CONFIG.GAME.WIDTH / 2;
        this.y = CONFIG.GAME.HEIGHT / 2;

        // 设置键盘事件
        this.setupKeyboardEvents();

        // 开始自动射击
        this.startAutoFire();
    }

    setupKeyboardEvents() {
        // 设置键盘事件监听
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
            }
        });
    }

    startAutoFire() {
        // 每隔一定时间发射子弹
        this.fireTimer = setInterval(() => {
            this.fire();
        }, CONFIG.FORTRESS.FIRE_RATE);
    }

    // 添加新炮台
    addTurret(turret) {
        // 计算炮台位置
        const angle = (this.turrets.length * Math.PI * 2) / CONFIG.FORTRESS.MAX_TURRETS;
        const radius = CONFIG.FORTRESS.SIZE * 0.5;
        
        turret.x = Math.cos(angle) * radius;
        turret.y = Math.sin(angle) * radius;
        
        this.turretContainer.addChild(turret);
        this.turrets.push(turret);
    }

    // 移除炮台
    removeTurret(index) {
        if (index >= 0 && index < this.turrets.length) {
            const turret = this.turrets[index];
            this.turretContainer.removeChild(turret);
            turret.destroy();
            this.turrets.splice(index, 1);
            
            // 重新排列剩余炮台
            this.repositionTurrets();
        }
    }

    // 重新排列炮台位置
    repositionTurrets() {
        this.turrets.forEach((turret, index) => {
            const angle = (index * Math.PI * 2) / CONFIG.FORTRESS.MAX_TURRETS;
            const radius = CONFIG.FORTRESS.SIZE * 0.5;
            
            turret.x = Math.cos(angle) * radius;
            turret.y = Math.sin(angle) * radius;
        });
    }

    fire() {
        try {
            // 所有炮台同时发射
            this.turrets.forEach(turret => {
                const bullets = turret.fire(
                    this.x + turret.x, 
                    this.y + turret.y, 
                    turret.rotation
                );
                
                // 发出发射事件
                bullets.forEach(bullet => {
                    this.emit('bulletFired', bullet);
                });
            });
        } catch (error) {
            console.error('子弹创建失败:', error);
        }
    }

    findNearestEnemy() {
        // 获取场景中的敌人数组
        const playScene = this.parent.parent;
        if (!playScene || !playScene.enemies || playScene.enemies.length === 0) {
            return null;
        }

        let nearestEnemy = null;
        let minDistance = Infinity;

        playScene.enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        });

        return nearestEnemy;
    }

    update(delta) {
        // 处理移动
        let targetX = this.x;
        let targetY = this.y;
        
        if (this.keys.ArrowLeft) targetX -= this.speed * delta;
        if (this.keys.ArrowRight) targetX += this.speed * delta;
        if (this.keys.ArrowUp) targetY -= this.speed * delta;
        if (this.keys.ArrowDown) targetY += this.speed * delta;

        // 限制世界边界
        const boundedX = Math.max(CONFIG.FORTRESS.SIZE / 2, Math.min(targetX, CONFIG.GAME.WORLD_WIDTH - CONFIG.FORTRESS.SIZE / 2));
        const boundedY = Math.max(CONFIG.FORTRESS.SIZE / 2, Math.min(targetY, CONFIG.GAME.WORLD_HEIGHT - CONFIG.FORTRESS.SIZE / 2));

        // 发出移动意图事件，让场景检查是否可以移动
        if (this.emit('moveAttempt', { x: boundedX, y: boundedY })) {
            this.x = boundedX;
            this.y = boundedY;
        }

        // 更新所有炮台的旋转
        const nearestEnemy = this.findNearestEnemy();
        if (nearestEnemy) {
            this.turrets.forEach(turret => {
                const dx = nearestEnemy.x - (this.x + turret.x);
                const dy = nearestEnemy.y - (this.y + turret.y);
                const targetRotation = Math.atan2(dy, dx);
                
                // 计算最短旋转路径
                let rotationDiff = targetRotation - turret.rotation;
                while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
                while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
                
                // 使用线性插值实现平滑旋转
                const rotationSpeed = CONFIG.FORTRESS.ROTATION_SPEED * delta;
                turret.rotation += Math.sign(rotationDiff) * Math.min(Math.abs(rotationDiff), rotationSpeed);
            });
        }
    }

    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        
        // 发出生命值变化事件
        this.emit('healthChanged', this.health);
        
        // 更新外观
        this.updateAppearance();
        
        return this.health <= 0;
    }

    updateAppearance() {
        // 根据生命值改变坦克的外观
        const healthPercent = this.health / CONFIG.FORTRESS.MAX_HEALTH;
        
        // 设置坦克的透明度
        this.alpha = 0.5 + (healthPercent * 0.5);
        
        // 根据生命值切换坦克颜色
        let tankTexture;
        let barrelTexture;
        if (healthPercent > 0.7) {
            tankTexture = 'tank_blue';
            barrelTexture = 'tank_barrel_blue';
        } else if (healthPercent > 0.3) {
            tankTexture = 'tank_green';
            barrelTexture = 'tank_barrel_green';
        } else {
            tankTexture = 'tank_red';
            barrelTexture = 'tank_barrel_red';
        }
        
        this.body.texture = PIXI.Texture.from(tankTexture);
        this.turrets.forEach(turret => turret.texture = PIXI.Texture.from(barrelTexture));
    }

    destroy() {
        // 清理所有炮台
        this.turrets.forEach(turret => turret.destroy());
        this.turrets = [];
        
        // 清理定时器
        if (this.fireTimer) {
            clearInterval(this.fireTimer);
        }
        
        // 移除键盘事件监听
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        
        super.destroy();
    }

    // 切换炮台类型
    switchTurret(type) {
        // 移除旧炮台
        this.turrets.forEach(turret => turret.destroy());
        this.turrets = [];

        // 创建新炮台
        switch (type) {
            case 'shotgun':
                this.addTurret(new ShotgunTurret());
                break;
            default:
                this.addTurret(new Turret());
        }
    }
} 