import * as PIXI from 'pixi.js';

export class SceneManager {
    constructor(app) {
        this.app = app;
        this.currentScene = null;
    }

    // 切换到新场景
    switchScene(scene) {
        // 如果存在当前场景，先清理
        if (this.currentScene) {
            this.currentScene.destroy();
            this.app.stage.removeChild(this.currentScene);
        }

        // 设置新场景
        this.currentScene = scene;
        this.app.stage.addChild(this.currentScene);
        
        // 如果场景有初始化方法，调用它
        if (this.currentScene.init) {
            this.currentScene.init();
        }
    }

    // 更新当前场景
    update(delta) {
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(delta);
        }
    }
} 