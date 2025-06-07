import { Game } from './game/Game.js';

// 等待DOM加载完成
window.addEventListener('DOMContentLoaded', () => {
    // 创建游戏实例
    const game = new Game();
    // 启动游戏
    game.start();
}); 