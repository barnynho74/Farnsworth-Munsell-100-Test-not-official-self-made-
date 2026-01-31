import Phaser from 'phaser';
import { CONFIG, getHueColor } from './config.js';

export default class ResultScene extends Phaser.Scene {
    constructor() {
        super('ResultScene');
    }

    create(data) {
        const sequence = data.sequence; // Array of hue indices (0-84)
        
        this.add.rectangle(0, 0, CONFIG.width, CONFIG.height, 0xF5F5DC).setOrigin(0);

        this.add.text(CONFIG.width / 2, 60, 'Test Performance Analysis', {
            fontSize: '48px',
            color: '#222222',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Calculate scores
        let totalErrorScore = 0;
        const individualScores = [];
        const trayErrors = [0, 0, 0, 0];
        let maxErrorVal = 0;
        let peakHueIdx = -1;
        let misplacedCount = 0;

        for (let i = 0; i < sequence.length; i++) {
            const current = sequence[i];
            const prev = sequence[i === 0 ? sequence.length - 1 : i - 1];
            const next = sequence[i === sequence.length - 1 ? 0 : i + 1];

            const diff1 = this.getCircularDist(current, prev, 85);
            const diff2 = this.getCircularDist(current, next, 85);
            
            const error = diff1 + diff2;
            const netError = error - 2;
            individualScores.push(error);
            totalErrorScore += netError;

            if (netError > 0) {
                misplacedCount++;
                // Attribute to trays (approximate based on hue index ranges)
                if (current >= 63) trayErrors[0] += netError;
                else if (current >= 42) trayErrors[1] += netError;
                else if (current >= 21) trayErrors[2] += netError;
                else trayErrors[3] += netError;

                if (netError > maxErrorVal) {
                    maxErrorVal = netError;
                    peakHueIdx = current;
                }
            }
        }

        // --- Left Panel: Score and Chart ---
        const chartX = 100;
        const chartY = 850;
        const chartWidth = 1000;
        const chartHeight = 400;
        const barWidth = chartWidth / sequence.length;

        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x888888);
        graphics.lineBetween(chartX, chartY, chartX + chartWidth, chartY);
        graphics.lineBetween(chartX, chartY, chartX, chartY - chartHeight);

        individualScores.forEach((score, i) => {
            const h = (score - 2) * 25; 
            const x = chartX + i * barWidth;
            graphics.fillStyle(getHueColor(sequence[i]), 1);
            graphics.fillRect(x, chartY - h, barWidth - 1, h);
            if (score > 2) {
                graphics.lineStyle(1, 0xB22222, 0.4);
                graphics.strokeRect(x, chartY - h, barWidth - 1, h);
            }
        });

        this.add.text(chartX + chartWidth / 2, chartY + 30, 'Visible Spectrum Sequence (Red → Purple)', { 
            fontSize: '18px', color: '#666666' 
        }).setOrigin(0.5);

        // --- Right Panel: Detailed Stats ---
        const statsX = 1200;
        const statsY = 150;

        const mainScoreContainer = this.add.container(statsX, statsY);
        
        const scoreLabel = this.add.text(0, 0, 'TOTAL ERROR SCORE', { fontSize: '24px', color: '#666666', fontStyle: 'bold' });
        const scoreValue = this.add.text(0, 40, totalErrorScore.toString(), { 
            fontSize: '84px', 
            color: totalErrorScore <= 16 ? '#228B22' : totalErrorScore > 100 ? '#B22222' : '#DAA520', 
            fontStyle: 'bold' 
        });
        mainScoreContainer.add([scoreLabel, scoreValue]);

        const statsList = this.add.container(statsX, statsY + 160);
        let offset = 0;

        const addStat = (label, value, color = '#333333') => {
            statsList.add(this.add.text(0, offset, label, { fontSize: '18px', color: '#777777' }));
            statsList.add(this.add.text(0, offset + 25, value, { fontSize: '24px', color: color, fontStyle: 'bold' }));
            offset += 70;
        };

        addStat('Global Ranking', this.getInterpretation(totalErrorScore));
        addStat('Misplaced Caps', `${misplacedCount} out of 85`, misplacedCount > 10 ? '#B22222' : '#228B22');
        
        const peakRegion = this.getRegionName(peakHueIdx);
        addStat('Weakest Color Region', peakHueIdx === -1 ? 'None (Perfect)' : peakRegion, '#B22222');

        // Tray Breakdown
        statsList.add(this.add.text(0, offset, 'Error Distribution by Tray', { fontSize: '18px', color: '#777777' }));
        offset += 30;
        
        const trayNames = ['Purple-Red', 'Blue-Purple', 'Yellow-Blue', 'Red-Yellow'];
        trayNames.forEach((name, i) => {
            const trayScore = trayErrors[i];
            const barMax = 200;
            const barW = (trayScore / (totalErrorScore || 1)) * barMax;
            
            statsList.add(this.add.text(0, offset, name, { fontSize: '16px', color: '#444444' }));
            const barBg = this.add.rectangle(130, offset + 10, barMax, 12, 0xdddddd).setOrigin(0, 0.5);
            const barFill = this.add.rectangle(130, offset + 10, Math.max(2, barW), 12, 0x444444).setOrigin(0, 0.5);
            statsList.add([barBg, barFill]);
            statsList.add(this.add.text(340, offset, trayScore.toString(), { fontSize: '16px', color: '#666666', fontStyle: 'bold' }));
            offset += 30;
        });

        // Retry Button
        const retryBtn = this.add.rectangle(statsX + 150, statsY + 700, 300, 60, 0x333333).setInteractive();
        this.add.text(statsX + 150, statsY + 700, 'RETRY TEST', { fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        retryBtn.on('pointerdown', () => this.scene.start('GameScene'));
        retryBtn.on('pointerover', () => retryBtn.setFillStyle(0x555555));
        retryBtn.on('pointerout', () => retryBtn.setFillStyle(0x333333));
    }

    getRegionName(hueIdx) {
        if (hueIdx === -1) return "N/A";
        if (hueIdx >= 75 || hueIdx < 5) return "Deep Red";
        if (hueIdx >= 5 && hueIdx < 15) return "Orange / Red";
        if (hueIdx >= 15 && hueIdx < 25) return "Yellow / Orange";
        if (hueIdx >= 25 && hueIdx < 35) return "Yellow / Green";
        if (hueIdx >= 35 && hueIdx < 50) return "Green / Cyan";
        if (hueIdx >= 50 && hueIdx < 65) return "Blue / Cyan";
        if (hueIdx >= 65 && hueIdx < 75) return "Purple / Violet";
        return "Unknown";
    }

    getCircularDist(a, b, max) {
        const dist = Math.abs(a - b);
        return Math.min(dist, max - dist);
    }

    getInterpretation(score) {
        if (score <= 16) return "Superior Color Discrimination\n(Typically found in 16% of the population)";
        if (score <= 100) return "Average Color Discrimination\n(Typically found in 68% of the population)";
        return "Low Color Discrimination\n(Typically found in 16% of the population)";
    }
}
