import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/config.js';
import { ASSETS } from '../config/assets.js';
import { Bullet } from './Bullet.js';

export class Fortress extends PIXI.Container {
    constructor() {
        super();
        this.name = 'fortress';
        this.health = CONFIG.FORTRESS.INITIAL_HEALTH;
        this.speed = CONFIG.FORTRESS.SPEED;
        this.rotation = 0;
        this.lastFireTime = 0;
        this.bullets = [];
        
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
        this.body = PIXI.Sprite.from('tank_body_blue');
        this.body.name = 'fortress_body';
        this.body.anchor.set(0.5);
        this.body.width = CONFIG.FORTRESS.SIZE * 1.5;
        this.body.height = CONFIG.FORTRESS.SIZE * 1.5;
        this.addChild(this.body);

        // 创建炮塔
        this.turret = PIXI.Sprite.from('tank_barrel_blue');
        this.turret.name = 'fortress_turret';
        this.turret.anchor.set(0.25, 0.5); // 设置锚点在炮管底部中心
        this.turret.width = CONFIG.FORTRESS.SIZE * 1.2;
        this.turret.height = CONFIG.FORTRESS.SIZE * 0.4;
        this.addChild(this.turret);

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

    fire() {
        const now = Date.now();
        if (now - this.lastFireTime >= CONFIG.FORTRESS.FIRE_RATE) {
            try {
                // 计算子弹发射位置（从炮管前端发射）
                const barrelLength = this.turret.width * 0.75;
                const bulletX = this.x + Math.cos(this.turret.rotation) * barrelLength;
                const bulletY = this.y + Math.sin(this.turret.rotation) * barrelLength;

                // 创建新子弹
                const bullet = new Bullet(bulletX, bulletY, this.turret.rotation);
                
                // 发出发射事件
                this.emit('bulletFired', bullet);
                this.lastFireTime = now;
            } catch (error) {
                console.error('子弹创建失败:', error);
            }
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

        // 更新炮塔旋转
        const nearestEnemy = this.findNearestEnemy();
        if (nearestEnemy) {
            const dx = nearestEnemy.x - this.x;
            const dy = nearestEnemy.y - this.y;
            const targetRotation = Math.atan2(dy, dx);
            
            // 计算最短旋转路径
            let rotationDiff = targetRotation - this.turret.rotation;
            while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
            while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
            
            // 使用线性插值实现平滑旋转
            const rotationSpeed = CONFIG.FORTRESS.ROTATION_SPEED * delta;
            this.turret.rotation += Math.sign(rotationDiff) * Math.min(Math.abs(rotationDiff), rotationSpeed);
            
            // 确保rotation始终在-PI到PI之间
            this.turret.rotation = ((this.turret.rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            if (this.turret.rotation > Math.PI) {
                this.turret.rotation -= Math.PI * 2;
            }
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
        let tankColor;
        if (healthPercent > 0.7) {
            tankColor = ASSETS.TANKS.BODY.BLUE;
            this.turret.texture = PIXI.Texture.from(ASSETS.TANKS.BARREL.BLUE);
        } else if (healthPercent > 0.3) {
            tankColor = ASSETS.TANKS.BODY.GREEN;
            this.turret.texture = PIXI.Texture.from(ASSETS.TANKS.BARREL.GREEN);
        } else {
            tankColor = ASSETS.TANKS.BODY.RED;
            this.turret.texture = PIXI.Texture.from(ASSETS.TANKS.BARREL.RED);
        }
        
        this.body.texture = PIXI.Texture.from(tankColor);
    }

    destroy() {
        // 清理定时器
        if (this.fireTimer) {
            clearInterval(this.fireTimer);
        }
        
        // 移除键盘事件监听
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        
        // 调用父类的destroy方法
        super.destroy();
    }
} 