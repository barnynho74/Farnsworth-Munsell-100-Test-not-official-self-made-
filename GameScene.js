import Phaser from 'phaser';
import { CONFIG } from './config.js';
import Tray from './Tray.js';
import ColorCap from './ColorCap.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('cap-base', CONFIG.assets.capBase);
    }

    create() {
        this.add.rectangle(0, 0, CONFIG.width, CONFIG.height, 0xF5F5DC).setOrigin(0);
        
        this.trays = [];
        this.allMovableCaps = [];
        this.allSlots = [];

        const startY = 200;
        const spacingY = 200;

        CONFIG.trays.forEach((tConfig, index) => {
            const tray = new Tray(this, CONFIG.width / 2, startY + index * spacingY, tConfig);
            this.trays.push(tray);
            this.allSlots.push(...tray.slots);

            // Create fixed caps
            const firstSlot = tray.slots[0];
            const lastSlot = tray.slots[tray.slots.length - 1];
            
            const startCap = new ColorCap(this, firstSlot.x, firstSlot.y, tConfig.startHueIdx, true);
            startCap.setSlot(firstSlot);
            firstSlot.cap = startCap;

            const endCap = new ColorCap(this, lastSlot.x, lastSlot.y, tConfig.endHueIdx, true);
            endCap.setSlot(lastSlot);
            lastSlot.cap = endCap;
        });

        // Create movable caps
        const movableIndices = [];
        CONFIG.trays.forEach(t => {
            for (let i = t.movableRange[0]; i <= t.movableRange[1]; i++) {
                movableIndices.push(i);
            }
        });
        
        const shuffledMovable = Phaser.Utils.Array.Shuffle([...movableIndices]);
        
        let capIdx = 0;
        this.allSlots.forEach(slot => {
            if (!slot.isFixed) {
                const hueIdx = shuffledMovable[capIdx++];
                const cap = new ColorCap(this, slot.x, slot.y, hueIdx, false);
                cap.setSlot(slot);
                slot.cap = cap;
                this.allMovableCaps.push(cap);
            }
        });

        // Finish button
        const btnBg = this.add.rectangle(CONFIG.width - 150, CONFIG.height - 80, 200, 60, 0x333333).setInteractive();
        const btnText = this.add.text(CONFIG.width - 150, CONFIG.height - 80, 'FINISH', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
        
        btnBg.on('pointerover', () => btnBg.setFillStyle(0x555555));
        btnBg.on('pointerout', () => btnBg.setFillStyle(0x333333));
        btnBg.on('pointerdown', () => this.calculateResults());

        this.add.text(CONFIG.width / 2, 50, 'Farnsworth-Munsell 100 Hue Test', { 
            fontSize: '42px', 
            color: '#222222', 
            fontStyle: 'bold' 
        }).setOrigin(0.5);

        this.add.text(CONFIG.width / 2, 100, 'Arrange the colors in each tray to form a smooth transition.', { 
            fontSize: '20px', 
            color: '#666666' 
        }).setOrigin(0.5);
    }

    handleCapDrop(cap) {
        let bestSlot = null;
        for (const tray of this.trays) {
            bestSlot = tray.getAvailableSlot(cap.x, cap.y);
            if (bestSlot) break;
        }

        if (bestSlot && bestSlot !== cap.currentSlot) {
            // Swap caps
            const otherCap = bestSlot.cap;
            const oldSlot = cap.currentSlot;

            if (otherCap) {
                otherCap.setSlot(oldSlot);
                oldSlot.cap = otherCap;
            } else {
                oldSlot.cap = null;
            }

            cap.setSlot(bestSlot);
            bestSlot.cap = cap;
        } else {
            // Snap back
            cap.setSlot(cap.currentSlot);
        }
    }

    calculateResults() {
        const sequence = [];     
        // Logical Order for scoring:
        // Tray 4 (0...21) -> Tray 3 (22...41) -> Tray 2 (42...62) -> Tray 1 (63...84)
        
        // Tray 4 (Red-Yellow)
        this.trays[3].slots.forEach(s => sequence.push(s.cap.hueIndex)); // 0...21 (22 caps)
        // Tray 3 (Yellow-Blue, skip first as it is 21)
        this.trays[2].slots.slice(1).forEach(s => sequence.push(s.cap.hueIndex)); // 22...42 (21 caps)
        // Tray 2 (Blue-Purple, skip first as it is 42)
        this.trays[1].slots.slice(1).forEach(s => sequence.push(s.cap.hueIndex)); // 43...63 (21 caps)
        // Tray 1 (Purple-Red, skip first as it is 63, and skip last as it is 84)
        this.trays[0].slots.slice(1, -1).forEach(s => sequence.push(s.cap.hueIndex)); // 64...83 (20 caps)
        
        const finalSequence = [];
        this.trays[3].slots.forEach(s => finalSequence.push(s.cap.hueIndex));
        this.trays[2].slots.slice(1).forEach(s => finalSequence.push(s.cap.hueIndex));
        this.trays[1].slots.slice(1).forEach(s => finalSequence.push(s.cap.hueIndex));
        this.trays[0].slots.slice(1).forEach(s => finalSequence.push(s.cap.hueIndex));
        
        // Since Tray 1 end is 84 and Tray 4 start is 0, they are adjacent.
        this.scene.start('ResultScene', { sequence: finalSequence });
    }
}
