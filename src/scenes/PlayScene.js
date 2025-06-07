import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/config';
import { ASSETS } from '../config/assets';
import { Fortress } from '../objects/Fortress';
import { Enemy } from '../objects/Enemy';
import { HealthBar } from '../ui/HealthBar';
import { Inventory } from '../ui/Inventory';

export class PlayScene extends PIXI.Container {
    constructor(app) {
        super();
        this.app = app;
        
        // 初始化游戏对象数组
        this.enemies = [];
        this.bullets = [];
        this.items = [];
        
        // 初始化游戏状态
        this.score = 0;
        this.isGameOver = false;
        
        this.setup();
    }

    async setup() {
        try {
            // 加载所有资源
            await this.loadAssets();
            
            // 创建游戏对象
            this.createGameObjects();
            
            // 初始化UI
            this.initUI();
            
            // 开始生成敌人
            this.startEnemySpawner();

            // 设置事件监听
            this.setupEventListeners();
        } catch (error) {
            console.error('场景设置失败:', error);
        }
    }

    setupEventListeners() {
        // 监听堡垒的生命值变化
        if (this.fortress) {
            this.fortress.on('healthChanged', (health) => {
                if (health <= 0 && !this.isGameOver) {
                    this.gameOver();
                }
            });
        }
    }

    async loadAssets() {
        try {
            // 收集所有需要加载的资源URL
            const assets = [
                ...Object.values(ASSETS.TANKS.BODY),
                ...Object.values(ASSETS.TANKS.BARREL),
                ...Object.values(ASSETS.BULLETS)
            ];

            // 加载所有资源
            await Promise.all(assets.map(asset => PIXI.Assets.load(asset)));
        } catch (error) {
            console.error('资源加载失败:', error);
        }
    }

    createGameObjects() {
        try {
            // 创建堡垒
            this.fortress = new Fortress();
            this.addChild(this.fortress);

            // 设置事件监听
            if (this.fortress) {
                this.fortress.on('bulletFired', this.onBulletFired.bind(this));
            }
        } catch (error) {
            console.error('游戏对象创建失败:', error);
        }
    }

    initUI() {
        try {
            // 创建分数文本
            this.scoreText = new PIXI.Text(`Score: ${this.score}`, {
                fontFamily: 'Arial',
                fontSize: 24,
                fill: 0xFFFFFF
            });
            this.scoreText.x = 10;
            this.scoreText.y = 10;
            this.addChild(this.scoreText);

            // 创建生命值条
            if (this.fortress) {
                this.healthBar = new HealthBar(this.fortress);
                this.healthBar.x = 10;
                this.healthBar.y = 40;
                this.addChild(this.healthBar);
            }

            // 创建物品栏
            this.inventory = new Inventory();
            this.inventory.x = CONFIG.GAME.WIDTH - 210;
            this.inventory.y = 10;
            this.addChild(this.inventory);
        } catch (error) {
            console.error('UI初始化失败:', error);
        }
    }

    startEnemySpawner() {
        try {
            this.enemySpawnTimer = setInterval(() => {
                if (!this.isGameOver) {
                    this.spawnEnemy();
                }
            }, CONFIG.ENEMY.SPAWN_RATE);
        } catch (error) {
            console.error('敌人生成器启动失败:', error);
        }
    }

    update(delta) {
        if (this.isGameOver) return;

        try {
            // 更新堡垒
            if (this.fortress) {
                this.fortress.update(delta);
            }

            // 更新敌人
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                if (enemy.update(delta, this.fortress)) {
                    enemy.destroy();
                    this.enemies.splice(i, 1);
                }
            }

            // 更新子弹和检测碰撞
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                const bullet = this.bullets[i];
                let bulletDestroyed = false;

                // 检查子弹是否超出范围
                if (bullet.update(delta)) {
                    this.bullets.splice(i, 1);
                    bullet.destroy();
                    continue;
                }

                // 检查子弹与敌人的碰撞
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    if (this.checkCollision(bullet, enemy)) {
                        // 对敌人造成伤害
                        if (enemy.takeDamage(CONFIG.BULLET.DAMAGE)) {
                            // 敌人被消灭
                            this.enemies.splice(j, 1);
                            enemy.destroy();
                            this.score += 100;
                            this.updateScore();
                        }
                        
                        // 销毁子弹
                        this.bullets.splice(i, 1);
                        bullet.destroy();
                        bulletDestroyed = true;
                        break;
                    }
                }

                if (bulletDestroyed) continue;
            }

            // 更新UI
            if (this.healthBar) {
                this.healthBar.update();
            }
            if (this.inventory) {
                this.inventory.update();
            }
        } catch (error) {
            console.error('场景更新失败:', error);
        }
    }

    checkCollision(bullet, enemy) {
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (enemy.width / 2 + bullet.width / 2);
    }

    updateScore() {
        if (this.scoreText) {
            this.scoreText.text = `Score: ${this.score}`;
        }
    }

    onBulletFired(bullet) {
        try {
            this.bullets.push(bullet);
            this.addChild(bullet);
        } catch (error) {
            console.error('子弹发射失败:', error);
        }
    }

    spawnEnemy() {
        try {
            const enemy = new Enemy();
            this.enemies.push(enemy);
            this.addChild(enemy);
        } catch (error) {
            console.error('敌人生成失败:', error);
        }
    }

    gameOver() {
        try {
            this.isGameOver = true;
            clearInterval(this.enemySpawnTimer);
            
            // 发出游戏结束事件，并传递最终分数
            this.emit('gameOver', this.score);
        } catch (error) {
            console.error('游戏结束处理失败:', error);
        }
    }

    destroy() {
        try {
            // 清理定时器
            if (this.enemySpawnTimer) {
                clearInterval(this.enemySpawnTimer);
            }

            // 清理所有游戏对象
            this.enemies.forEach(enemy => enemy.destroy());
            this.bullets.forEach(bullet => bullet.destroy());
            
            if (this.fortress) {
                this.fortress.destroy();
            }
            if (this.healthBar) {
                this.healthBar.destroy();
            }
            if (this.inventory) {
                this.inventory.destroy();
            }

            super.destroy();
        } catch (error) {
            console.error('场景销毁失败:', error);
        }
    }
} 