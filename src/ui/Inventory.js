import * as PIXI from 'https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.3.2/pixi.min.mjs';
import { CONFIG } from '../config/config.js';

export class Inventory extends PIXI.Container {
    constructor() {
        super();
        this.slots = [];
        this.items = [];
        this.setup();
    }

    setup() {
        // 创建物品栏背景
        this.background = new PIXI.Graphics();
        this.background.beginFill(0x333333);
        this.background.drawRect(0, 0, CONFIG.UI.INVENTORY_SLOTS * 40 + 10, 50);
        this.background.endFill();
        this.addChild(this.background);

        // 创建物品槽
        for (let i = 0; i < CONFIG.UI.INVENTORY_SLOTS; i++) {
            const slot = new PIXI.Graphics();
            slot.beginFill(0x666666);
            slot.drawRect(i * 40 + 5, 5, 35, 35);
            slot.endFill();
            this.slots.push(slot);
            this.addChild(slot);
        }

        // 设置位置
        this.x = CONFIG.GAME.WIDTH - (CONFIG.UI.INVENTORY_SLOTS * 40 + 20);
        this.y = 10;
    }

    addItem(item) {
        if (this.items.length < CONFIG.UI.INVENTORY_SLOTS) {
            this.items.push(item);
            this.updateSlots();
            return true;
        }
        return false;
    }

    updateSlots() {
        // 更新物品槽显示
        this.items.forEach((item, index) => {
            const slot = this.slots[index];
            // 这里可以添加物品图标的显示逻辑
        });
    }

    update() {
        // 这里可以添加物品栏的动画或其他更新逻辑
    }
} 