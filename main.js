import Phaser from 'phaser';
import { CONFIG } from './config.js';
import GameScene from './GameScene.js';
import ResultScene from './ResultScene.js';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: CONFIG.width,
        height: CONFIG.height
    },
    backgroundColor: CONFIG.backgroundColor,
    scene: [GameScene, ResultScene]
};

new Phaser.Game(config);
