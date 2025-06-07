export const CONFIG = {
    // 游戏窗口设置
    GAME: {
        WIDTH: 800,
        HEIGHT: 600,
        BACKGROUND_COLOR: 0x000000,
        WORLD_WIDTH: 1600,  // 游戏世界宽度（屏幕宽度的2倍）
        WORLD_HEIGHT: 1200  // 游戏世界高度（屏幕高度的2倍）
    },
    
    // 堡垒设置
    FORTRESS: {
        SPEED: 3,
        MAX_HEALTH: 100,
        INITIAL_HEALTH: 100,
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
    },

    // 环境设置
    ENVIRONMENT: {
        TREE_LARGE_RADIUS: 30,  // 大树碰撞半径
        TREE_SMALL_RADIUS: 20   // 小树碰撞半径
    }
}; 