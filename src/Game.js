import * as PIXI from 'pixi.js';
import { CONFIG } from './config/config';
import { SceneManager } from './scenes/SceneManager';
import { PlayScene } from './scenes/PlayScene';

export class Game {
    constructor() {
        this.app = new PIXI.Application({
            width: CONFIG.GAME.WIDTH,
            height: CONFIG.GAME.HEIGHT,
            backgroundColor: CONFIG.GAME.BACKGROUND_COLOR,
            antialias: true
        });

        // 创建场景管理器
        this.sceneManager = new SceneManager(this.app);
        
        // 添加到页面
        document.body.appendChild(this.app.view);
    }

    async start() {
        try {
            // 启动游戏
            await this.startNewGame();
            
            // 设置游戏循环
            this.app.ticker.add(this.update.bind(this));
        } catch (error) {
            console.error('游戏启动失败:', error);
        }
    }

    async startNewGame() {
        try {
            // 创建并切换到游戏场景
            const playScene = new PlayScene(this.app);
            await this.sceneManager.switchScene(playScene);
        } catch (error) {
            console.error('新游戏启动失败:', error);
        }
    }

    update(delta) {
        // 更新当前场景
        this.sceneManager.update(delta);
    }
} 