// 获取画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 设置画布大小
canvas.width = 1200;  // 更大的画布
canvas.height = 900;

// 添加摄像机系统
const camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
    // 设置较大的游戏世界范围
    worldWidth: canvas.width * 3,
    worldHeight: canvas.height * 3,
    
    // 更新摄像机位置，跟随目标
    follow(target) {
        // 计算目标位置到摄像机中心的偏移
        const targetX = target.x - this.width / 2;
        const targetY = target.y - this.height / 2;
        
        // 平滑移动摄像机
        this.x += (targetX - this.x) * 0.1;
        this.y += (targetY - this.y) * 0.1;
        
        // 限制摄像机不超出世界边界
        this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.width));
        this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.height));
    },
    
    // 将世界坐标转换为屏幕坐标
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    },
    
    // 将屏幕坐标转换为世界坐标
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }
};

// 武器类型定义
const WeaponTypes = {
    BASIC_GUN: {
        name: '基础机枪',
        damage: 20,
        fireRate: 15,  // 射击冷却时间
        bulletSpeed: 8,
        color: '#FFF',
        spread: 0,     // 散射角度
        bulletSize: 4,
        rotationSpeed: 0.1,  // 基础转向速度
        type: 'normal'  // 普通子弹类型
    },
    RAPID_GUN: {
        name: '速射机枪',
        damage: 15,
        fireRate: 4,
        bulletSpeed: 10,
        color: '#FFD700',
        spread: 5,
        bulletSize: 3,
        rotationSpeed: 0.3,  // 更快的转向速度
        type: 'normal'
    },
    HEAVY_GUN: {
        name: '重型机枪',
        damage: 40,
        fireRate: 25,
        bulletSpeed: 6,
        color: '#FF4444',
        spread: 0,
        bulletSize: 6,
        rotationSpeed: 0.05,  // 较慢的转向速度
        type: 'normal'
    },
    SHOTGUN: {
        name: '散弹枪',
        damage: 10,
        fireRate: 30,
        bulletSpeed: 7,
        color: '#87CEEB',
        spread: 20,
        bulletCount: 5,  // 一次发射的子弹数
        bulletSize: 3,
        rotationSpeed: 0.08,  // 中等转向速度
        type: 'normal'
    },
    LASER_GUN: {
        name: '激光旋转炮',
        damage: 35,
        fireRate: 1,
        bulletSpeed: 15,
        color: '#00CED1',  // 改为青绿色，更护眼
        spread: 0,
        bulletSize: 8,
        rotationSpeed: 0.01,  // 降低旋转速度
        type: 'laser',
        autoRotate: true,
        laserLength: 400
    }
};

// 修改游戏状态
const initialGameState = {
    score: 0,
    enemies: [],
    bullets: [],
    weaponDrops: [],  // 武器掉落物数组
    gameOver: false,
    level: 1,
    killCount: 0,
    debug: true,
    weaponSelection: {
        active: false,
        newWeapon: null,
        dropPosition: null
    }
};

// 游戏状态
const gameState = { ...initialGameState };

// 添加状态验证函数
function validateGameState() {
    console.log('验证游戏状态...');
    // 验证武器选择状态
    if (gameState.weaponSelection.active && !gameState.weaponSelection.newWeapon) {
        console.warn('武器选择界面激活但没有新武器，正在修复...');
        gameState.weaponSelection = {
            active: false,
            newWeapon: null,
            dropPosition: null
        };
    }
    
    // 确保游戏不会卡在选择界面
    if (gameState.weaponSelection.active && gameState.gameOver) {
        console.warn('游戏结束时武器选择界面仍然激活，正在修复...');
        gameState.weaponSelection = {
            active: false,
            newWeapon: null,
            dropPosition: null
        };
    }

    // 验证武器掉落物状态
    if (gameState.weaponSelection.active) {
        const dropExists = gameState.weaponDrops.some(drop => 
            drop.x === gameState.weaponSelection.dropPosition.x && 
            drop.y === gameState.weaponSelection.dropPosition.y
        );
        
        if (!dropExists) {
            console.warn('武器选择界面激活但对应的掉落物不存在，正在修复...');
            gameState.weaponSelection = {
                active: false,
                newWeapon: null,
                dropPosition: null
            };
        }
    }
}

// 修改堡垒车初始属性
const initialFortressStats = {
    x: camera.worldWidth / 2,  // 初始在世界中心
    y: camera.worldHeight / 2,
    width: 50,
    height: 30,
    speed: 5,
    health: 100,
    maxHealth: 100,
    weaponSlots: [{
        weapon: WeaponTypes.BASIC_GUN,
        cooldown: 0,
        angle: 0
    }, null, null],  // 五个武器槽位
    shootRange: 300
};

// 敌人基础属性
const baseEnemyStats = {
    width: 30,
    height: 30,
    baseSpeed: 2,
    baseHealth: 20,
    baseSpawnRate: 0.02,
    maxEnemies: 10,
    minSpawnDistance: 400
};

// 子弹类
class Bullet {
    constructor(x, y, targetX, targetY, speed, damage, color = '#FFF', size = 4, type = 'normal') {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.baseDamage = damage;
        this.color = color;
        this.width = size;
        this.height = size * 2;
        this.type = type;
        
        if (type === 'laser') {
            this.endX = targetX;
            this.endY = targetY;
            this.lifeTime = 10;
        } else {
            const angle = Math.atan2(targetY - y, targetX - x);
            this.speedX = Math.cos(angle) * speed;
            this.speedY = Math.sin(angle) * speed;
        }
        
        this.distanceTraveled = 0;
    }

    getCurrentDamage() {
        if (this.type === 'laser') {
            return this.baseDamage; // 激光伤害不衰减
        }
        // 普通子弹伤害随距离衰减，最低为基础伤害的20%
        const damageMultiplier = Math.max(0.2, 1 - (this.distanceTraveled / fortress.shootRange));
        return this.baseDamage * damageMultiplier;
    }

    draw() {
        const screen = camera.worldToScreen(this.x, this.y);
        
        if (this.type === 'laser') {
            const endScreen = camera.worldToScreen(this.endX, this.endY);
            
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.width;
            ctx.moveTo(screen.x, screen.y);
            ctx.lineTo(endScreen.x, endScreen.y);
            ctx.stroke();

            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(endScreen.x, endScreen.y, this.width/2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.save();
            ctx.translate(screen.x, screen.y);
            ctx.rotate(Math.atan2(this.speedY, this.speedX));
            
            const damageRatio = this.getCurrentDamage() / this.baseDamage;
            const alpha = 0.5 + damageRatio * 0.5;
            ctx.fillStyle = this.color.replace('rgb', 'rgba').replace(')', `,${alpha})`);
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
            
            ctx.restore();
        }
    }

    update() {
        if (this.type === 'laser') {
            this.lifeTime--;
            return this.lifeTime > 0;
        } else {
            const prevX = this.x;
            const prevY = this.y;
            
            this.x += this.speedX;
            this.y += this.speedY;
            
            const dx = this.x - prevX;
            const dy = this.y - prevY;
            this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);
            
            // 检查是否在世界范围内
            return this.x > 0 && this.x < camera.worldWidth && 
                   this.y > 0 && this.y < camera.worldHeight;
        }
    }
}

// 堡垒车类
class Fortress {
    constructor() {
        Object.assign(this, { ...initialFortressStats });
    }

    // 修改添加武器方法
    addWeapon(weaponType, dropX, dropY) {
        // 找到第一个空槽位
        const emptySlot = this.weaponSlots.findIndex(slot => slot === null);
        if (emptySlot !== -1) {
            this.weaponSlots[emptySlot] = {
                weapon: weaponType,
                cooldown: 0,
                angle: 0
            };
            return true;
        } else {
            // 如果没有空槽位，激活选择界面
            gameState.weaponSelection = {
                active: true,
                newWeapon: weaponType,
                dropPosition: { x: dropX, y: dropY }
            };
            return false;
        }
    }

    // 替换武器方法
    replaceWeapon(slotIndex, newWeapon) {
        if (slotIndex >= 0 && slotIndex < this.weaponSlots.length) {
            this.weaponSlots[slotIndex] = {
                weapon: newWeapon,
                cooldown: 0,
                angle: 0
            };
            return true;
        }
        return false;
    }

    // 更新方法
    update() {
        // 移动控制
        const moveSpeed = this.speed;
        if (keys.ArrowLeft) this.x -= moveSpeed;
        if (keys.ArrowRight) this.x += moveSpeed;
        if (keys.ArrowUp) this.y -= moveSpeed;
        if (keys.ArrowDown) this.y += moveSpeed;

        // 限制在世界范围内
        this.x = Math.max(this.width/2, Math.min(this.x, camera.worldWidth - this.width/2));
        this.y = Math.max(this.height/2, Math.min(this.y, camera.worldHeight - this.height/2));

        // 寻找最近的敌人
        const nearestEnemy = this.findNearestEnemy();

        // 更新每个武器
        this.weaponSlots.forEach((slot, index) => {
            if (slot) {
                // 更新冷却
                if (slot.cooldown > 0) {
                    slot.cooldown--;
                }

                if (slot.weapon.autoRotate) {
                    // 自动旋转的武器（如激光枪）
                    slot.angle += slot.weapon.rotationSpeed;
                    if (slot.cooldown <= 0) {
                        this.shootFromSlot(index, null);
                    }
                } else if (nearestEnemy) {
                    // 普通武器的瞄准逻辑
                    const dx = nearestEnemy.x - this.x;
                    const dy = nearestEnemy.y - this.y;
                    const targetAngle = Math.atan2(dy, dx);
                    
                    const angleDiff = targetAngle - slot.angle;
                    const normalizedAngleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
                    slot.angle += normalizedAngleDiff * slot.weapon.rotationSpeed;

                    if (slot.cooldown <= 0) {
                        this.shootFromSlot(index, nearestEnemy);
                    }
                }
            }
        });

        // 检查武器掉落物
        gameState.weaponDrops = gameState.weaponDrops.filter(drop => {
            if (drop.checkCollision(this)) {
                if (this.addWeapon(drop.weaponType, drop.x, drop.y)) {
                    return false;
                }
            }
            return true;
        });
    }

    // 从指定槽位射击
    shootFromSlot(slotIndex, target) {
        const slot = this.weaponSlots[slotIndex];
        if (!slot) return;

        const weapon = slot.weapon;
        const turretOffset = this.getTurretOffset(slotIndex);
        const startX = this.x + turretOffset.x;
        const startY = this.y + turretOffset.y;

        const bullets = [];
        if (weapon.type === 'laser') {
            // 激光武器的射击逻辑
            const angle = slot.angle;
            const endX = startX + Math.cos(angle) * weapon.laserLength;
            const endY = startY + Math.sin(angle) * weapon.laserLength;
            
            bullets.push(new Bullet(
                startX, startY,
                endX, endY,
                weapon.bulletSpeed,
                weapon.damage,
                weapon.color,
                weapon.bulletSize,
                'laser'
            ));
        } else if (weapon.bulletCount) {
            // 散射类武器的逻辑
            for (let i = 0; i < weapon.bulletCount; i++) {
                const spread = (Math.random() - 0.5) * weapon.spread * (Math.PI / 180);
                const angle = slot.angle + spread;
                
                bullets.push(new Bullet(
                    startX,
                    startY,
                    startX + Math.cos(angle) * 1000,
                    startY + Math.sin(angle) * 1000,
                    weapon.bulletSpeed,
                    weapon.damage,
                    weapon.color,
                    weapon.bulletSize
                ));
            }
        } else {
            // 单发武器的逻辑
            const spread = (Math.random() - 0.5) * weapon.spread * (Math.PI / 180);
            const angle = slot.angle + spread;
            
            bullets.push(new Bullet(
                startX,
                startY,
                startX + Math.cos(angle) * 1000,
                startY + Math.sin(angle) * 1000,
                weapon.bulletSpeed,
                weapon.damage,
                weapon.color,
                weapon.bulletSize
            ));
        }

        gameState.bullets.push(...bullets);
        slot.cooldown = weapon.fireRate;
    }

    // 获取炮塔位置偏移
    getTurretOffset(slotIndex) {
        const baseOffset = 20; // 炮塔间距
        switch(slotIndex) {
            case 0:
                return { x: 0, y: -baseOffset };  // 顶部
            case 1:
                return { x: -baseOffset, y: 0 };  // 左侧
            case 2:
                return { x: baseOffset, y: 0 };   // 右侧
            case 3:
                return { x: -baseOffset/2, y: baseOffset };  // 左下
            case 4:
                return { x: baseOffset/2, y: baseOffset };   // 右下
            default:
                return { x: 0, y: 0 };
        }
    }

    // 绘制方法
    draw() {
        const screen = camera.worldToScreen(this.x, this.y);
        
        // 绘制底座
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(screen.x - this.width/2, screen.y - this.height/2, this.width, this.height);
        
        // 绘制每个武器的炮塔
        this.weaponSlots.forEach((slot, index) => {
            if (slot) {
                const offset = this.getTurretOffset(index);
                const turretScreen = camera.worldToScreen(this.x + offset.x, this.y + offset.y);
                
                ctx.save();
                ctx.translate(turretScreen.x, turretScreen.y);
                ctx.rotate(slot.angle);
                
                ctx.fillStyle = slot.weapon.color;
                ctx.fillRect(-10, -15, 20, 30);
                
                ctx.restore();
            }
        });

        // 绘制武器栏
        this.drawWeaponSlots();
    }

    // 绘制武器栏
    drawWeaponSlots() {
        const slotWidth = 60;
        const slotHeight = 40;
        const startX = 20;
        const startY = canvas.height - 60;

        this.weaponSlots.forEach((slot, index) => {
            // 绘制槽位背景
            ctx.fillStyle = '#333';
            ctx.fillRect(startX + index * (slotWidth + 10), startY, slotWidth, slotHeight);

            if (slot) {
                // 绘制武器图标
                ctx.fillStyle = slot.weapon.color;
                ctx.fillRect(
                    startX + index * (slotWidth + 10) + 10,
                    startY + 10,
                    slotWidth - 20,
                    slotHeight - 20
                );

                // 绘制武器名称
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(
                    slot.weapon.name,
                    startX + index * (slotWidth + 10) + slotWidth/2,
                    startY + slotHeight + 15
                );

                // 绘制冷却进度
                const cooldownPercent = slot.cooldown / slot.weapon.fireRate;
                if (cooldownPercent > 0) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    ctx.fillRect(
                        startX + index * (slotWidth + 10),
                        startY,
                        slotWidth,
                        slotHeight * cooldownPercent
                    );
                }
            }
        });
    }

    // 寻找最近的敌人
    findNearestEnemy() {
        let nearestEnemy = null;
        let minDistance = Infinity;

        for (const enemy of gameState.enemies) {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        }

        // 只在射程内返回敌人
        return minDistance <= this.shootRange ? nearestEnemy : null;
    }

    // 受到伤害
    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            gameState.gameOver = true;
        }
    }

    reset() {
        Object.assign(this, { ...initialFortressStats });
    }
}

// 敌人类
class Enemy {
    constructor() {
        this.width = baseEnemyStats.width;
        this.height = baseEnemyStats.height;
        
        // 根据等级计算属性
        const levelMultiplier = 1 + (gameState.level - 1) * 0.01;
        this.speed = baseEnemyStats.baseSpeed * levelMultiplier;
        this.maxHealth = Math.ceil(baseEnemyStats.baseHealth * levelMultiplier);
        this.health = this.maxHealth;
        
        // 生成位置
        this.setSpawnPosition();

        // 为不同等级的敌人设置不同颜色
        const healthRatio = this.health / baseEnemyStats.baseHealth;
        const red = Math.min(255, Math.floor(200 + healthRatio * 55));
        const green = Math.max(0, Math.floor(100 - healthRatio * 100));
        this.color = `rgb(${red}, ${green}, ${green})`;
    }

    // 设置生成位置
    setSpawnPosition() {
        let attempts = 0;
        let validPosition = false;
        
        while (!validPosition && attempts < 100) {
            attempts++;
            
            // 相对于摄像机视角的边缘生成
            const side = Math.floor(Math.random() * 4);
            let potentialX, potentialY;
            
            switch(side) {
                case 0: // 上
                    potentialX = camera.x + Math.random() * camera.width;
                    potentialY = camera.y - this.height;
                    break;
                case 1: // 右
                    potentialX = camera.x + camera.width + this.width;
                    potentialY = camera.y + Math.random() * camera.height;
                    break;
                case 2: // 下
                    potentialX = camera.x + Math.random() * camera.width;
                    potentialY = camera.y + camera.height + this.height;
                    break;
                case 3: // 左
                    potentialX = camera.x - this.width;
                    potentialY = camera.y + Math.random() * camera.height;
                    break;
            }

            // 检查与堡垒车的距离
            const dx = potentialX - fortress.x;
            const dy = potentialY - fortress.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance >= baseEnemyStats.minSpawnDistance) {
                this.x = potentialX;
                this.y = potentialY;
                validPosition = true;
            }
        }

        // 如果找不到合适的位置，强制在最远处生成
        if (!validPosition) {
            const angle = Math.random() * Math.PI * 2;
            this.x = fortress.x + Math.cos(angle) * baseEnemyStats.minSpawnDistance;
            this.y = fortress.y + Math.sin(angle) * baseEnemyStats.minSpawnDistance;
        }
    }

    draw() {
        const screen = camera.worldToScreen(this.x, this.y);
        
        // 只在屏幕附近绘制
        const margin = 100;  // 增加边距，确保血条完整显示
        if (screen.x >= -margin && screen.x <= camera.width + margin &&
            screen.y >= -margin && screen.y <= camera.height + margin) {
            
            // 绘制敌人本体
            ctx.fillStyle = this.color;
            ctx.fillRect(screen.x - this.width/2, screen.y - this.height/2, this.width, this.height);
            
            // 绘制血条，确保血条始终在敌人上方
            const healthBarWidth = this.width;
            const healthBarHeight = 4;
            const healthBarY = screen.y - this.height/2 - 10;  // 固定在敌人上方10像素
            const healthPercentage = this.health / this.maxHealth;
            
            // 血条背景
            ctx.fillStyle = '#333';
            ctx.fillRect(screen.x - healthBarWidth/2, healthBarY, healthBarWidth, healthBarHeight);
            
            // 当前血量
            ctx.fillStyle = healthPercentage > 0.5 ? '#4CAF50' : healthPercentage > 0.25 ? '#FFA500' : '#FF0000';
            ctx.fillRect(screen.x - healthBarWidth/2, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);

            // 如果在调试模式下，显示血量数值
            if (gameState.debug) {
                ctx.fillStyle = '#fff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${Math.ceil(this.health)}/${this.maxHealth}`, screen.x, healthBarY - 5);
            }
        }
    }

    update() {
        // 计算到堡垒车的方向
        const dx = fortress.x - this.x;
        const dy = fortress.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // 标准化方向向量并应用速度
            const moveX = (dx / distance) * this.speed;
            const moveY = (dy / distance) * this.speed;

            // 更新位置
            this.x += moveX;
            this.y += moveY;
        }

        // 检查与堡垒车的碰撞
        if (this.checkCollision(fortress)) {
            fortress.takeDamage(10);
            return false;
        }

        return this.health > 0;
    }

    checkCollision(other) {
        return Math.abs(this.x - other.x) < (this.width + other.width) / 2 &&
               Math.abs(this.y - other.y) < (this.height + other.height) / 2;
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            gameState.score += 100;
            gameState.killCount++;
            
            // 每击杀10个敌人提升一个等级
            if (gameState.killCount % 10 === 0) {
                gameState.level++;
            }
        }
    }
}

// 武器掉落物类
class WeaponDrop {
    constructor(x, y, weaponType) {
        console.log('创建新的武器掉落物:', { x, y, weaponType: weaponType.name });
        this.x = x;
        this.y = y;
        this.weaponType = weaponType;
        this.width = 30;
        this.height = 30;
        this.pulseTime = 0;
        this.lifeTime = 600;  // 10秒的生命周期
        this.fadeOutTime = 120;  // 2秒的淡出时间
    }

    update() {
        console.log('更新武器掉落物:', { 
            x: this.x, 
            y: this.y, 
            lifeTime: this.lifeTime,
            pulseTime: this.pulseTime 
        });
        
        // 更新脉冲动画时间
        this.pulseTime += 0.1;
        
        // 更新生命周期
        this.lifeTime--;
        
        // 如果生命周期结束，返回false以移除此掉落物
        return this.lifeTime > 0;
    }

    draw() {
        const screen = camera.worldToScreen(this.x, this.y);
        
        // 在淡出阶段闪烁提示即将消失
        if (this.lifeTime <= this.fadeOutTime) {
            if (Math.floor(this.lifeTime / 15) % 2 === 0) return;
        }

        const pulse = Math.sin(this.pulseTime) * 5;
        const alpha = Math.min(1, this.lifeTime / this.fadeOutTime);
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = this.weaponType.color;
        ctx.fillRect(screen.x - this.width/2, screen.y - this.height/2 + pulse, this.width, this.height);
        
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${(0.3 + Math.sin(this.pulseTime) * 0.2) * alpha})`;
        ctx.arc(screen.x, screen.y + pulse, this.width * 0.8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.weaponType.name, screen.x, screen.y + this.height + 15 + pulse);
        
        ctx.globalAlpha = 1;
    }

    checkCollision(entity) {
        // 如果武器选择界面激活，或者这个掉落物已经被拒绝过，则禁用碰撞检测
        if (gameState.weaponSelection.active) {
            return false;
        }

        const collision = Math.abs(this.x - entity.x) < (this.width + entity.width) / 2 &&
                         Math.abs(this.y - entity.y) < (this.height + entity.height) / 2;
        
        if (collision) {
            console.log('检测到武器掉落物碰撞');
        }
        return collision;
    }
}

// 键盘控制
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    Space: false,
    KeyR: false,
    Digit1: false,
    Digit2: false,
    Digit3: false,
    Digit4: false,
    Digit5: false,
    Escape: false
};

// 监听键盘事件
window.addEventListener('keydown', (e) => {
    console.log('键盘按下事件:', e.code, '当前选择状态:', gameState.weaponSelection);
    if (gameState.weaponSelection.active) {
        if (e.code >= 'Digit1' && e.code <= 'Digit3') {
            const slotIndex = parseInt(e.code.slice(-1)) - 1;
            console.log('尝试替换武器槽位:', slotIndex);
            if (fortress.replaceWeapon(slotIndex, gameState.weaponSelection.newWeapon)) {
                console.log('武器替换成功');
                // 移除对应的武器掉落物
                gameState.weaponDrops = gameState.weaponDrops.filter(drop => 
                    drop.x !== gameState.weaponSelection.dropPosition.x || 
                    drop.y !== gameState.weaponSelection.dropPosition.y
                );
                // 重置选择界面状态
                gameState.weaponSelection = {
                    active: false,
                    newWeapon: null,
                    dropPosition: null
                };
            }
        } else if (e.code === 'Escape') {
            console.log('ESC键被按下，取消选择并移除武器掉落物');
            // 移除对应的武器掉落物
            gameState.weaponDrops = gameState.weaponDrops.filter(drop => 
                drop.x !== gameState.weaponSelection.dropPosition.x || 
                drop.y !== gameState.weaponSelection.dropPosition.y
            );
            // 取消选择
            gameState.weaponSelection = {
                active: false,
                newWeapon: null,
                dropPosition: null
            };
        }
        return;
    }

    if (e.code === 'Space') {
        keys.Space = true;
    } else if (e.code === 'KeyR') {
        keys.KeyR = true;
        if (gameState.gameOver) {
            resetGame();
        }
    } else if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
        keys.Space = false;
    } else if (e.code === 'KeyR') {
        keys.KeyR = false;
    } else if (e.code === 'Escape') {
        keys.Escape = false;
    } else if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
});

// 重置游戏状态
function resetGame() {
    // 重置游戏状态
    Object.assign(gameState, { ...initialGameState });
    
    // 重置堡垒车
    fortress.reset();
    
    // 清空所有数组
    gameState.enemies.length = 0;
    gameState.bullets.length = 0;
    gameState.weaponDrops.length = 0;
    
    // 重置键盘状态
    Object.keys(keys).forEach(key => {
        keys[key] = false;
    });
    
    // 重置画布文本对齐
    ctx.textAlign = 'left';
    
    // 重新开始游戏循环
    requestAnimationFrame(gameLoop);
}

// 创建堡垒车实例
const fortress = new Fortress();

// 修改生成敌人的函数
function spawnEnemy() {
    const maxEnemies = Math.ceil(baseEnemyStats.maxEnemies * (1 + (gameState.level - 1) * 0.2));
    
    // 只在敌人数量小于最大值时生成新敌人
    if (gameState.enemies.length < maxEnemies) {
        const spawnRate = baseEnemyStats.baseSpawnRate * (1 + (gameState.level - 1) * 0.1);
        
        if (Math.random() < spawnRate) {
            const enemy = new Enemy();
            gameState.enemies.push(enemy);
            
            if (gameState.debug) {
                console.log('敌人已生成:', {
                    x: Math.round(enemy.x),
                    y: Math.round(enemy.y),
                    distance: Math.round(Math.sqrt(
                        Math.pow(enemy.x - fortress.x, 2) + 
                        Math.pow(enemy.y - fortress.y, 2)
                    ))
                });
            }
        }
    }
}

// 更新所有游戏对象
function updateGameObjects() {
    // 更新子弹
    gameState.bullets = gameState.bullets.filter(bullet => {
        const stillActive = bullet.update();
        // 检查子弹与敌人的碰撞
        for (let i = gameState.enemies.length - 1; i >= 0; i--) {
            const enemy = gameState.enemies[i];
            if (bullet.type === 'laser') {
                // 激光的碰撞检测逻辑
                const dx = bullet.endX - bullet.x;
                const dy = bullet.endY - bullet.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const normalX = dx / length;
                const normalY = dy / length;

                const enemyDx = enemy.x - bullet.x;
                const enemyDy = enemy.y - bullet.y;
                const projection = enemyDx * normalX + enemyDy * normalY;

                if (projection >= 0 && projection <= length) {
                    const perpX = enemyDx - projection * normalX;
                    const perpY = enemyDy - projection * normalY;
                    const distance = Math.sqrt(perpX * perpX + perpY * perpY);

                    if (distance < (bullet.width + enemy.width) / 2) {
                        enemy.takeDamage(bullet.getCurrentDamage());
                        if (enemy.health <= 0) {
                            gameState.enemies.splice(i, 1);
                        }
                    }
                }
            } else if (Math.abs(bullet.x - enemy.x) < (bullet.width + enemy.width) / 2 &&
                       Math.abs(bullet.y - enemy.y) < (bullet.height + enemy.height) / 2) {
                enemy.takeDamage(bullet.getCurrentDamage());
                if (enemy.health <= 0) {
                    gameState.enemies.splice(i, 1);
                }
                return false;
            }
        }
        return stillActive;
    });

    // 更新敌人
    gameState.enemies = gameState.enemies.filter(enemy => enemy.update());

    // 检查是否需要生成新武器
    if (gameState.level > 1 && gameState.level % 2 === 0) {
        const availableWeapons = Object.values(WeaponTypes).filter(w => w !== WeaponTypes.BASIC_GUN);
        if (gameState.weaponDrops.length === 0 && Math.random() < 0.01) {
            try {
                console.log('尝试生成新武器');
                const randomWeapon = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
                
                if (!randomWeapon || !randomWeapon.name) {
                    console.error('无效的武器类型:', randomWeapon);
                    return;
                }
                
                console.log('选择的武器类型:', randomWeapon.name);
                
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 200 + 100;
                
                const dropX = fortress.x + Math.cos(angle) * distance;
                const dropY = fortress.y + Math.sin(angle) * distance;
                
                if (isNaN(dropX) || isNaN(dropY)) {
                    console.error('无效的掉落位置:', { dropX, dropY });
                    return;
                }
                
                const newDrop = new WeaponDrop(dropX, dropY, randomWeapon);
                
                if (!(newDrop instanceof WeaponDrop) || !newDrop.update || !newDrop.draw) {
                    console.error('创建的掉落物无效:', newDrop);
                    return;
                }
                
                console.log('创建的新掉落物:', newDrop);
                gameState.weaponDrops.push(newDrop);
                console.log('武器掉落物已添加到游戏');
            } catch (error) {
                console.error('生成武器掉落物时发生错误:', error);
            }
        }
    }

    // 更新武器掉落物
    console.log('当前武器掉落物数量:', gameState.weaponDrops.length);
    console.log('武器掉落物列表:', gameState.weaponDrops);
    
    gameState.weaponDrops = gameState.weaponDrops.filter(drop => {
        if (!drop || !(drop instanceof WeaponDrop)) {
            console.error('无效的武器掉落物:', drop);
            return false;
        }

        try {
            if (drop.checkCollision(fortress)) {
                console.log('检测到与堡垒车碰撞');
                if (fortress.addWeapon(drop.weaponType, drop.x, drop.y)) {
                    console.log('武器已添加到堡垒车');
                    return false;
                }
            }
            
            const updateResult = drop.update();
            console.log('掉落物更新结果:', updateResult);
            return updateResult;
        } catch (error) {
            console.error('更新武器掉落物时发生错误:', error);
            return false;
        }
    });
}

// 绘制所有游戏对象
function drawGameObjects() {
    // 绘制调试信息
    if (gameState.debug) {
        // 绘制射程范围
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.arc(fortress.x, fortress.y, baseEnemyStats.minSpawnDistance, 0, Math.PI * 2);
        ctx.stroke();
    }

    // 绘制武器掉落物
    gameState.weaponDrops.forEach(drop => drop.draw());

    // 绘制子弹
    gameState.bullets.forEach(bullet => bullet.draw());

    // 绘制敌人
    gameState.enemies.forEach(enemy => {
        enemy.draw();
        
        // 在调试模式下显示敌人信息
        if (gameState.debug) {
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            
            // 绘制到堡垒车的连线
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.moveTo(enemy.x, enemy.y);
            ctx.lineTo(fortress.x, fortress.y);
            ctx.stroke();
        }
    });
}

// 添加绘制武器选择界面的函数
function drawWeaponSelection() {
    if (!gameState.weaponSelection.active || !gameState.weaponSelection.newWeapon) {
        console.log('武器选择条件不满足，不进行绘制');
        return;
    }

    // 使用固定屏幕坐标绘制选择界面
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('选择要替换的武器', canvas.width/2, canvas.height/2 - 100);

    const newWeapon = gameState.weaponSelection.newWeapon;
    ctx.fillStyle = newWeapon.color;
    ctx.fillRect(canvas.width/2 - 100, canvas.height/2 - 80, 200, 40);
    ctx.fillStyle = '#fff';
    ctx.fillText(newWeapon.name, canvas.width/2, canvas.height/2 - 50);

    // 只显示已有的武器槽位
    fortress.weaponSlots.forEach((slot, index) => {
        if (slot) {
            const x = canvas.width/2 - 200 + index * 150;
            const y = canvas.height/2 + 50;
            
            ctx.fillStyle = slot.weapon.color;
            ctx.fillRect(x - 40, y - 20, 80, 40);
            
            ctx.fillStyle = '#fff';
            ctx.fillText(slot.weapon.name, x, y + 40);
            
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(x - 50, y - 30, 100, 100);
            ctx.fillText(`按 ${index + 1} 选择`, x, y + 70);
        }
    });

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('按 ESC 取消', canvas.width/2, canvas.height/2 + 150);
}

// 游戏主循环
function gameLoop() {
    try {
        // 验证游戏状态
        validateGameState();
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (!gameState.gameOver) {
            // 检查是否需要强制退出武器选择界面
            if (gameState.weaponSelection.active) {
                console.log('当前武器选择状态:', {
                    active: gameState.weaponSelection.active,
                    hasNewWeapon: !!gameState.weaponSelection.newWeapon,
                    hasDropPosition: !!gameState.weaponSelection.dropPosition
                });
            }

            // 绘制背景网格
            drawBackground();
            
            // 绘制游戏对象
            fortress.draw();
            drawGameObjects();
            drawUI();
            
            // 只在武器选择界面激活且有新武器时绘制选择界面
            if (gameState.weaponSelection.active && 
                gameState.weaponSelection.newWeapon && 
                gameState.weaponSelection.dropPosition) {
                console.log('绘制武器选择界面');
                drawWeaponSelection();
            } else {
                // 如果不满足条件但状态为激活，强制重置状态
                if (gameState.weaponSelection.active) {
                    console.warn('检测到不完整的武器选择状态，强制重置');
                    gameState.weaponSelection = {
                        active: false,
                        newWeapon: null,
                        dropPosition: null
                    };
                }
                
                // 正常游戏逻辑
                camera.follow(fortress);
                spawnEnemy();
                fortress.update();
                updateGameObjects();
            }
            
            // 显示调试信息
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`当前敌人数量: ${gameState.enemies.length}`, canvas.width - 20, 20);
            ctx.fillText(`选择界面: ${gameState.weaponSelection.active}`, canvas.width - 20, 40);
            if (gameState.weaponSelection.active) {
                ctx.fillText(`新武器: ${gameState.weaponSelection.newWeapon?.name || 'null'}`, canvas.width - 20, 60);
            }
        } else {
            drawGameOver();
        }
        
        requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error('游戏循环发生错误:', error);
        console.error(error.stack);
        resetGame();
        requestAnimationFrame(gameLoop);
    }
}

// 绘制UI
function drawUI() {
    // 使用固定屏幕坐标绘制UI
    const uiX = 20;
    const uiY = 20;
    
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    
    // 绘制生命值条
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthPercentage = fortress.health / fortress.maxHealth;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(uiX, uiY, healthBarWidth, healthBarHeight);
    
    ctx.fillStyle = healthPercentage > 0.5 ? '#4CAF50' : healthPercentage > 0.25 ? '#FFA500' : '#FF0000';
    ctx.fillRect(uiX, uiY, healthBarWidth * healthPercentage, healthBarHeight);
    
    ctx.fillStyle = '#fff';
    ctx.fillText(`生命值: ${Math.ceil(fortress.health)}/${fortress.maxHealth}`, uiX + 210, uiY + 15);
    
    // 绘制游戏信息
    ctx.fillText(`分数: ${gameState.score}`, uiX, uiY + 40);
    ctx.fillText(`击杀数: ${gameState.killCount}`, uiX, uiY + 65);
    ctx.fillText(`等级: ${gameState.level}`, uiX, uiY + 90);
    
    // 显示当前难度信息
    const levelMultiplier = 1 + (gameState.level - 1) * 0.01;
    ctx.fillText(`敌人属性: +${Math.floor((levelMultiplier - 1) * 100)}%`, uiX, uiY + 115);
    ctx.fillText(`最大敌人数: ${Math.ceil(baseEnemyStats.maxEnemies * (1 + (gameState.level - 1) * 0.2))}`, uiX, uiY + 140);
}

// 绘制游戏结束画面
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', canvas.width/2, canvas.height/2);
    ctx.font = '24px Arial';
    ctx.fillText(`最终分数: ${gameState.score}`, canvas.width/2, canvas.height/2 + 50);
    ctx.fillText('按R键重新开始', canvas.width/2, canvas.height/2 + 100);
}

// 添加背景网格绘制函数
function drawBackground() {
    const gridSize = 50;
    const startX = Math.floor(camera.x / gridSize) * gridSize;
    const startY = Math.floor(camera.y / gridSize) * gridSize;
    const endX = startX + camera.width + gridSize;
    const endY = startY + camera.height + gridSize;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    // 绘制垂直线
    for (let x = startX; x <= endX; x += gridSize) {
        const screenX = x - camera.x;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, camera.height);
        ctx.stroke();
    }

    // 绘制水平线
    for (let y = startY; y <= endY; y += gridSize) {
        const screenY = y - camera.y;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(camera.width, screenY);
        ctx.stroke();
    }
}

// 启动游戏
gameLoop(); 