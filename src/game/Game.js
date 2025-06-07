import * as PIXI from 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.3.2/pixi.min.mjs';
import { SceneManager } from '../core/SceneManager.js';
import { CONFIG } from '../config/config.js';
import { PlayScene } from '../scenes/PlayScene.js';
import { GameOverScene } from '../scenes/GameOverScene.js';

export class Game {
    constructor() {
        // 创建PIXI应用
        this.app = new PIXI.Application({
            width: CONFIG.GAME.WIDTH,
            height: CONFIG.GAME.HEIGHT,
            backgroundColor: CONFIG.GAME.BACKGROUND_COLOR,
            antialias: true
        });

        // 添加到DOM
        document.getElementById('game-container').appendChild(this.app.view);

        // 初始化场景管理器
        this.sceneManager = new SceneManager(this.app);

        // 设置游戏循环
        this.app.ticker.add(this.update.bind(this));
    }

    // 启动游戏
    start() {
        this.startNewGame();
    }

    // 开始新游戏
    startNewGame() {
        // 创建新的游戏场景实例
        const playScene = new PlayScene(this.app);
        
        // 监听游戏结束事件
        playScene.once('gameOver', (score) => {
            console.log('Game Over! Score:', score);
            const gameOverScene = new GameOverScene(this.app, score);
            
            // 监听重新开始事件
            gameOverScene.once('restart', () => {
                this.startNewGame();
            });
            
            this.sceneManager.switchScene(gameOverScene);
        });

        // 切换到游戏场景
        this.sceneManager.switchScene(playScene);
    }

    // 游戏主循环
    update(delta) {
        this.sceneManager.update(delta);
    }
} 