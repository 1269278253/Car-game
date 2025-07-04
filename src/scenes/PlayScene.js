import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/config.js';
import { ASSETS } from '../config/assets.js';
import { Fortress } from '../objects/Fortress.js';
import { Enemy } from '../objects/Enemy.js';
import { HealthBar } from '../ui/HealthBar.js';
import { Inventory } from '../ui/Inventory.js';
import { TurretDrop } from '../objects/TurretDrop.js';
import { ShotgunTurret } from '../objects/ShotgunTurret.js';
import { Turret } from '../objects/Turret.js';

export class PlayScene extends PIXI.Container {
    constructor(app) {
        super();
        this.app = app;
        
        // 初始化游戏对象数组
        this.enemies = [];
        this.bullets = [];
        this.items = [];
        this.trees = []; // 添加树木数组
        this.drops = []; // 初始化掉落物数组
        
        // 初始化游戏状态
        this.score = 0;
        this.isGameOver = false;
        
        // 创建游戏世界容器（用于实现摄像机移动）
        this.gameWorld = new PIXI.Container();
        this.addChild(this.gameWorld);
        
        // 设置游戏世界的大小（可以根据需要调整）
        this.worldWidth = CONFIG.GAME.WORLD_WIDTH || CONFIG.GAME.WIDTH * 2;
        this.worldHeight = CONFIG.GAME.WORLD_HEIGHT || CONFIG.GAME.HEIGHT * 2;
        
        this.setup();
    }

    async setup() {
        try {
            // 加载所有资源
            await this.loadAssets();
            
            // 创建背景
            this.createBackground();
            
            // 创建游戏对象
            this.createGameObjects();
            
            // 初始化UI
            this.initUI();
            
            // 设置事件监听
            this.setupEventListeners();
            
            // 开始生成敌人
            this.startEnemySpawner();
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
            // 定义资源清单
            const assetManifest = {
                bundles: [{
                    name: 'game-assets',
                    assets: [
                        // 坦克资源
                        {
                            name: 'tank_blue',
                            srcs: ASSETS.TANKS.BODY.BLUE
                        },
                        {
                            name: 'tank_red',
                            srcs: ASSETS.TANKS.BODY.RED
                        },
                        {
                            name: 'tank_green',
                            srcs: ASSETS.TANKS.BODY.GREEN
                        },
                        {
                            name: 'tank_black',
                            srcs: ASSETS.TANKS.BODY.BLACK
                        },
                        {
                            name: 'tank_barrel_blue',
                            srcs: ASSETS.TANKS.BARREL.BLUE
                        },
                        {
                            name: 'tank_barrel_red',
                            srcs: ASSETS.TANKS.BARREL.RED
                        },
                        {
                            name: 'tank_barrel_green',
                            srcs: ASSETS.TANKS.BARREL.GREEN
                        },
                        {
                            name: 'tank_barrel_black',
                            srcs: ASSETS.TANKS.BARREL.BLACK
                        },
                        {
                            name: 'tank_barrel_beige',
                            srcs: ASSETS.TANKS.BARREL.BEIGE
                        },
                        // 子弹资源
                        {
                            name: 'bullet_blue',
                            srcs: ASSETS.BULLETS.BLUE
                        },
                        // 环境资源
                        {
                            name: 'env_sand',
                            srcs: ASSETS.ENVIRONMENT.SAND
                        },
                        {
                            name: 'env_tree_large',
                            srcs: ASSETS.ENVIRONMENT.TREE_LARGE
                        },
                        {
                            name: 'env_tree_small',
                            srcs: ASSETS.ENVIRONMENT.TREE_SMALL
                        },
                        // 烟雾效果
                        {
                            name: 'smoke',
                            srcs: ASSETS.EFFECTS.SMOKE
                        }
                    ]
                }]
            };

            // 初始化资源
            await PIXI.Assets.init({ manifest: assetManifest });

            // 加载资源包
            console.log('开始加载资源...');
            await PIXI.Assets.loadBundle('game-assets');
            console.log('所有资源加载完成');

        } catch (error) {
            console.error('资源加载失败:', error);
            throw error;
        }
    }

    createBackground() {
        // 创建背景容器
        this.background = new PIXI.Container();
        this.gameWorld.addChild(this.background);

        // 使用沙地纹理创建平铺背景
        const texture = PIXI.Texture.from('env_sand');
        const tilingSprite = new PIXI.TilingSprite(
            texture,
            this.worldWidth,
            this.worldHeight
        );
        
        // 将平铺精灵添加到背景容器
        this.background.addChild(tilingSprite);

        // 随机添加一些树木装饰
        const numTrees = 20; // 可以调整树的数量
        for (let i = 0; i < numTrees; i++) {
            const isLarge = Math.random() > 0.5;
            const tree = PIXI.Sprite.from(
                isLarge ? 'env_tree_large' : 'env_tree_small'
            );
            
            // 添加名字属性
            tree.name = `tree_${i}_${isLarge ? 'large' : 'small'}`;
            
            // 随机位置
            tree.x = Math.random() * this.worldWidth;
            tree.y = Math.random() * this.worldHeight;
            
            // 设置锚点和缩放
            tree.anchor.set(0.5);
            tree.scale.set(0.5);
            
            // 设置碰撞半径
            tree.collisionRadius = (isLarge ? CONFIG.ENVIRONMENT.TREE_LARGE_RADIUS : CONFIG.ENVIRONMENT.TREE_SMALL_RADIUS) * tree.scale.x;
            
            // 添加到背景和树木数组
            this.background.addChild(tree);
            this.trees.push(tree);
        }
    }

    createGameObjects() {
        try {
            // 创建堡垒
            this.fortress = new Fortress();
            this.gameWorld.addChild(this.fortress);
            
            // 设置堡垒事件监听
            if (this.fortress) {
                this.fortress.on('bulletFired', bullet => {
                    if (bullet) {
                        this.gameWorld.addChild(bullet);
                        this.bullets.push(bullet);
                    }
                });
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

    async update(delta) {
        try {
            if (this.isGameOver) return;

            // 更新堡垒
            if (this.fortress && this.fortress.parent) {
                // 保存当前位置
                const currentX = this.fortress.x;
                const currentY = this.fortress.y;
                
                // 计算目标位置
                let targetX = currentX;
                let targetY = currentY;
                
                if (this.fortress.keys.ArrowLeft) targetX -= this.fortress.speed * delta;
                if (this.fortress.keys.ArrowRight) targetX += this.fortress.speed * delta;
                if (this.fortress.keys.ArrowUp) targetY -= this.fortress.speed * delta;
                if (this.fortress.keys.ArrowDown) targetY += this.fortress.speed * delta;

                // 限制世界边界
                targetX = Math.max(CONFIG.FORTRESS.SIZE / 2, Math.min(targetX, CONFIG.GAME.WORLD_WIDTH - CONFIG.FORTRESS.SIZE / 2));
                targetY = Math.max(CONFIG.FORTRESS.SIZE / 2, Math.min(targetY, CONFIG.GAME.WORLD_HEIGHT - CONFIG.FORTRESS.SIZE / 2));

                // 检查与树木的碰撞
                if (!this.checkCollisionWithTrees(this.fortress, targetX, targetY)) {
                    this.fortress.x = targetX;
                    this.fortress.y = targetY;
                }
                // 碰撞时不需要做任何事，自然就停在原地

                this.fortress.update(delta);
                
                // 更新摄像机位置（使堡垒保持在屏幕中心）
                const targetCameraX = -this.fortress.x + CONFIG.GAME.WIDTH / 2;
                const targetCameraY = -this.fortress.y + CONFIG.GAME.HEIGHT / 2;
                
                // 添加缓动效果使移动更平滑
                this.gameWorld.x += (targetCameraX - this.gameWorld.x) * 0.1;
                this.gameWorld.y += (targetCameraY - this.gameWorld.y) * 0.1;
                
                // 限制世界边界
                this.gameWorld.x = Math.min(0, Math.max(this.gameWorld.x, -(this.worldWidth - CONFIG.GAME.WIDTH)));
                this.gameWorld.y = Math.min(0, Math.max(this.gameWorld.y, -(this.worldHeight - CONFIG.GAME.HEIGHT)));
            }

            // 更新敌人
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                if (!enemy || !enemy.parent) {
                    this.enemies.splice(i, 1);
                    continue;
                }
                if (enemy.update(delta, this.fortress)) {
                    enemy.destroy();
                    this.enemies.splice(i, 1);
                    this.handleEnemyDeath(enemy);
                }
            }

            // 更新子弹和检测碰撞
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                const bullet = this.bullets[i];
                if (!bullet || !bullet.parent) {
                    this.bullets.splice(i, 1);
                    continue;
                }
                let bulletDestroyed = false;

                if (bullet.update(delta)) {
                    this.bullets.splice(i, 1);
                    bullet.destroy();
                    continue;
                }

                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    if (!enemy || !enemy.parent) {
                        this.enemies.splice(j, 1);
                        continue;
                    }
                    if (this.checkCollision(bullet, enemy)) {
                        if (enemy.takeDamage(bullet.damage)) {
                            // 敌人死亡，处理掉落
                            this.handleEnemyDeath(enemy);
                            this.enemies.splice(j, 1);
                            enemy.destroy();
                            this.score += 100;
                            this.updateScore();
                        }
                        
                        this.bullets.splice(i, 1);
                        bullet.destroy();
                        bulletDestroyed = true;
                        break;
                    }
                }

                if (bulletDestroyed) continue;
            }

            // 更新掉落物
            for (let i = this.drops.length - 1; i >= 0; i--) {
                const drop = this.drops[i];
                if (!drop || !drop.parent) {
                    this.drops.splice(i, 1);
                    continue;
                }

                // 更新掉落物状态（闪烁和消失）
                if (drop.update()) {
                    this.drops.splice(i, 1);
                    continue;
                }

                // 检查与堡垒的距离
                const dx = this.fortress.x - drop.x;
                const dy = this.fortress.y - drop.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < drop.collectRadius) {
                    // 检查是否还有炮台位置
                    if (this.fortress.turrets.length < CONFIG.FORTRESS.MAX_TURRETS) {
                        // 收集掉落物
                        this.drops.splice(i, 1);
                        await drop.collect();
                        
                        // 添加新炮台
                        switch (drop.type) {
                            case 'shotgun':
                                this.fortress.addTurret(new ShotgunTurret());
                                break;
                            default:
                                this.fortress.addTurret(new Turret());
                        }
                    }
                }
            }

            // 更新UI
            if (this.healthBar && this.healthBar.parent) {
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

    checkCollisionWithTrees(object, newX, newY) {
        const objectRadius = object.width / 2; // 使用对象宽度的一半作为碰撞半径
        
        for (const tree of this.trees) {
            const dx = newX - tree.x;
            const dy = newY - tree.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 如果距离小于两者半径之和，说明发生碰撞
            if (distance < (objectRadius + tree.collisionRadius)) {
                console.log('碰撞检测：与树木发生碰撞！距离:', Math.round(distance), '碰撞阈值:', Math.round(objectRadius + tree.collisionRadius),'我是?',object);
                return true; // 发生碰撞
            }
        }
        
        return false; // 没有碰撞
    }

    updateScore() {
        if (this.scoreText) {
            this.scoreText.text = `Score: ${this.score}`;
        }
    }

    onBulletFired(bullet) {
        try {
            // 将子弹添加到游戏世界容器中
            this.gameWorld.addChild(bullet);
            this.bullets.push(bullet);
        } catch (error) {
            console.error('子弹发射失败:', error);
        }
    }

    spawnEnemy() {
        try {
            // 创建新敌人
            const enemy = new Enemy();
            
            // 将敌人添加到游戏世界
            this.gameWorld.addChild(enemy);
            
            // 添加到敌人数组
            this.enemies.push(enemy);
        } catch (error) {
            console.error('敌人生成失败:', error);
        }
    }

    gameOver() {
        try {
            this.isGameOver = true;
            
            // 清理定时器
            if (this.enemySpawnTimer) {
                clearInterval(this.enemySpawnTimer);
            }

            // 清理所有敌人
            this.enemies.forEach(enemy => enemy.destroy());
            this.enemies = [];

            // 清理所有子弹
            this.bullets.forEach(bullet => bullet.destroy());
            this.bullets = [];

            // 销毁堡垒
            if (this.fortress) {
                this.fortress.destroy();
                this.fortress = null;
            }

            // 清理UI
            if (this.healthBar) {
                this.healthBar.destroy();
                this.healthBar = null;
            }
            
            // 发出游戏结束事件，并传递最终分数
            this.emit('gameOver', this.score);
        } catch (error) {
            console.error('游戏结束处理失败:', error);
        }
    }

    handleEnemyDeath(enemy) {
        try {
            // 增加掉落概率便于测试
            if (Math.random() < CONFIG.ITEM.DROP_CHANCE) { // 30%的掉落概率
                const drop = new TurretDrop('shotgun', enemy.x, enemy.y);
                this.gameWorld.addChild(drop);
                this.drops.push(drop);
                console.log('炮台掉落在位置:', enemy.x, enemy.y);
            }
        } catch (error) {
            console.error('处理敌人死亡失败:', error);
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

            // 清理掉落物
            this.drops.forEach(drop => drop.destroy());

            super.destroy();
        } catch (error) {
            console.error('场景销毁失败:', error);
        }
    }
} 