import Phaser from 'phaser';
import { CONFIG, getHueColor } from './config.js';

export default class ColorCap extends Phaser.GameObjects.Container {
    constructor(scene, x, y, hueIndex, isFixed = false) {
        super(scene, x, y);
        this.hueIndex = hueIndex;
        this.isFixed = isFixed;
        this.originalX = x;
        this.originalY = y;
        this.currentSlot = null;

        // Shadow for realism
        this.shadow = scene.add.circle(2, 4, CONFIG.capRadius, 0x000000, 0.2);
        this.add(this.shadow);
        this.sendToBack(this.shadow);

        // Base sprite
        this.base = scene.add.sprite(0, 0, 'cap-base');
        this.base.setDisplaySize(CONFIG.capRadius * 2.2, CONFIG.capRadius * 2.2);
        this.add(this.base);

        // Color circle center
        this.colorCircle = scene.add.circle(0, 0, CONFIG.capRadius * 0.7, getHueColor(hueIndex));
        this.add(this.colorCircle);

        // If fixed, add a small indicator or just disable input
        if (this.isFixed) {
            const lockIcon = scene.add.circle(0, 0, 4, 0xffffff, 0.5);
            this.add(lockIcon);
        } else {
            this.setInteractive(new Phaser.Geom.Circle(0, 0, CONFIG.capRadius), Phaser.Geom.Circle.Contains);
            scene.input.setDraggable(this);
            
            this.on('dragstart', (pointer) => {
                scene.children.bringToTop(this);
                this.setScale(1.1);
                this.shadow.setAlpha(0.4);
                this.shadow.setPosition(10, 20);
                this.base.setTint(0xaaaaaa);
            });

            this.on('drag', (pointer, dragX, dragY) => {
                this.x = dragX;
                this.y = dragY;
            });

            this.on('dragend', (pointer) => {
                this.setScale(1.0);
                this.shadow.setAlpha(0.2);
                this.shadow.setPosition(2, 4);
                this.base.clearTint();
                scene.handleCapDrop(this);
            });
        }

        scene.add.existing(this);
    }

    moveTo(x, y, duration = 200) {
        this.scene.tweens.add({
            targets: this,
            x: x,
            y: y,
            duration: duration,
            ease: 'Power2'
        });
        this.originalX = x;
        this.originalY = y;
    }

    setSlot(slot) {
        this.currentSlot = slot;
        if (slot) {
            this.moveTo(slot.x, slot.y);
        }
    }
}
