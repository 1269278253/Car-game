export const CONFIG = {
    // 游戏窗口设置
    GAME: {
        WIDTH: 800,
        HEIGHT: 600,
        BACKGROUND_COLOR: 0x000000
    },
    
    // 堡垒设置
    FORTRESS: {
        SPEED: 5,
        MAX_HEALTH: 100,
        INITIAL_HEALTH: 10,
        DAMAGE: 10,
        SIZE: 32,
        FIRE_RATE: 500, // 射击间隔（毫秒）
        ROTATION_SPEED: 0.15 // 增加旋转速度以提高响应性
    },
    
    // 子弹设置
    BULLET: {
        SPEED: 8,
        DAMAGE: 20,
        SIZE: 4,
        COLOR: 0xFFFF00,
        RANGE: 400 // 子弹最大射程
    },
    
    // 敌人设置
    ENEMY: {
        SPAWN_RATE: 2000, // 毫秒
        SPEED: 2,
        HEALTH: 30,
        DAMAGE: 50,
        SIZE: 24
    },
    
    // 道具设置
    ITEM: {
        DROP_CHANCE: 0.3, // 30%掉落率
        COLLECT_RADIUS: 40
    },
    
    // UI设置
    UI: {
        HEALTH_BAR_WIDTH: 100,
        HEALTH_BAR_HEIGHT: 10,
        INVENTORY_SLOTS: 6
    }
}; 