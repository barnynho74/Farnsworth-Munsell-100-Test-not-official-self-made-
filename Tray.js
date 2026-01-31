import Phaser from 'phaser';
import { CONFIG } from './config.js';

export default class Tray extends Phaser.GameObjects.Container {
    constructor(scene, x, y, trayConfig) {
        super(scene, x, y);
        this.trayConfig = trayConfig;
        this.slots = [];

        const slotSpacing = CONFIG.capRadius * 2.1;
        const padding = 40;
        const numSlots = trayConfig.movableRange[1] - trayConfig.movableRange[0] + 3; // +2 for fixed ends
        const width = (numSlots * slotSpacing) + padding;
        const height = CONFIG.capRadius * 2.8;

        // Tray Background
        const bg = scene.add.graphics();
        bg.fillStyle(CONFIG.trayColor, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 15);
        bg.lineStyle(2, 0x444444, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 15);
        this.add(bg);

        // Label
        const label = scene.add.text(0, -height / 2 - 25, trayConfig.label, {
            fontSize: '24px',
            color: '#333333',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add(label);

        // Create slots
        const startX = -(numSlots - 1) * slotSpacing / 2;
        for (let i = 0; i < numSlots; i++) {
            const slotX = startX + i * slotSpacing;
            const slotY = 0;
            
            // Slot hole visual
            const hole = scene.add.circle(slotX, slotY, CONFIG.capRadius, CONFIG.slotColor);
            this.add(hole);

            const isFixed = (i === 0 || i === numSlots - 1);
            this.slots.push({
                x: x + slotX,
                y: y + slotY,
                index: i,
                isFixed: isFixed,
                cap: null
            });
        }

        scene.add.existing(this);
    }

    getAvailableSlot(x, y) {
        let closest = null;
        let minDist = 50; // Threshold for snapping

        for (const slot of this.slots) {
            if (slot.isFixed) continue;
            const dist = Phaser.Math.Distance.Between(x, y, slot.x, slot.y);
            if (dist < minDist) {
                minDist = dist;
                closest = slot;
            }
        }
        return closest;
    }
}
