import * as PIXI from 'pixi.js';
import { CONFIG } from '../config/config.js';

export class GameOverScene extends PIXI.Container {
    constructor(app, finalScore) {
        super();
        this.app = app;
        this.finalScore = finalScore;
        this.setup();
    }

    setup() {
        // 创建半透明黑色背景
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0x000000, 0.7);
        overlay.drawRect(0, 0, CONFIG.GAME.WIDTH, CONFIG.GAME.HEIGHT);
        overlay.endFill();
        this.addChild(overlay);

        // 创建游戏结束文本
        const gameOverText = new PIXI.Text('游戏结束', {
            fontFamily: 'Arial',
            fontSize: 64,
            fill: 0xFF0000,
            align: 'center',
            stroke: 0xFFFFFF,
            strokeThickness: 6
        });
        gameOverText.anchor.set(0.5);
        gameOverText.x = CONFIG.GAME.WIDTH / 2;
        gameOverText.y = CONFIG.GAME.HEIGHT / 3;
        this.addChild(gameOverText);

        // 创建最终分数文本
        const scoreText = new PIXI.Text(`最终得分: ${this.finalScore}`, {
            fontFamily: 'Arial',
            fontSize: 48,
            fill: 0xFFFFFF,
            align: 'center'
        });
        scoreText.anchor.set(0.5);
        scoreText.x = CONFIG.GAME.WIDTH / 2;
        scoreText.y = CONFIG.GAME.HEIGHT / 2;
        this.addChild(scoreText);

        // 创建重新开始按钮
        const restartButton = new PIXI.Container();
        
        // 按钮背景
        const buttonBg = new PIXI.Graphics();
        buttonBg.beginFill(0x4CAF50);
        buttonBg.drawRoundedRect(0, 0, 200, 50, 10);
        buttonBg.endFill();
        restartButton.addChild(buttonBg);

        // 按钮文本
        const buttonText = new PIXI.Text('重新开始', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFFFFF
        });
        buttonText.anchor.set(0.5);
        buttonText.x = 100;
        buttonText.y = 25;
        restartButton.addChild(buttonText);

        // 设置按钮位置
        restartButton.x = (CONFIG.GAME.WIDTH - 200) / 2;
        restartButton.y = CONFIG.GAME.HEIGHT * 2/3;

        // 设置按钮交互
        restartButton.eventMode = 'static';
        restartButton.cursor = 'pointer';

        // 添加鼠标悬停效果
        restartButton.on('pointerover', () => {
            buttonBg.tint = 0x66BB6A;
            this.app.view.style.cursor = 'pointer';
        });

        restartButton.on('pointerout', () => {
            buttonBg.tint = 0xFFFFFF;
            this.app.view.style.cursor = 'default';
        });

        // 添加点击事件
        restartButton.on('pointerdown', () => {
            buttonBg.tint = 0x43A047;
        });

        restartButton.on('pointerup', () => {
            buttonBg.tint = 0xFFFFFF;
            this.emit('restart');
        });

        this.addChild(restartButton);

        // 添加渐入动画
        this.alpha = 0;
        this.app.ticker.add(() => {
            if (this.alpha < 1) {
                this.alpha += 0.05;
            }
        });
    }
} 