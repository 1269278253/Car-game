import * as PIXI from 'pixi.js';

export class SceneManager {
    constructor(app) {
        this.app = app;
        this.currentScene = null;
    }

    async switchScene(newScene) {
        try {
            // 移除当前场景
            if (this.currentScene) {
                this.app.stage.removeChild(this.currentScene);
                if (typeof this.currentScene.destroy === 'function') {
                    this.currentScene.destroy();
                }
            }

            // 设置新场景
            this.currentScene = newScene;
            this.app.stage.addChild(this.currentScene);

        } catch (error) {
            console.error('场景切换失败:', error);
        }
    }

    update(delta) {
        if (this.currentScene && typeof this.currentScene.update === 'function') {
            this.currentScene.update(delta);
        }
    }
} 