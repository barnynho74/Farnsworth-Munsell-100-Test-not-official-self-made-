export const CONFIG = {
    width: 1920,
    height: 1080,
    backgroundColor: '#F5F5DC', // Cream / Off-white
    trayColor: 0x222222,
    slotColor: 0x000000,
    capRadius: 36,
    numColors: 85,
    trays: [
        { id: 1, startHueIdx: 63, endHueIdx: 84, movableRange: [64, 83], label: 'Purple - Red' },
        { id: 2, startHueIdx: 42, endHueIdx: 63, movableRange: [43, 62], label: 'Blue - Purple' },
        { id: 3, startHueIdx: 21, endHueIdx: 42, movableRange: [22, 41], label: 'Yellow - Blue' },
        { id: 4, startHueIdx: 0, endHueIdx: 21, movableRange: [1, 20], label: 'Red - Yellow' }
    ],
    assets: {
        capBase: 'color-cap-base.webp'
    }
};

// Generate 85 hues equally spaced in HSL
export function getHueColor(index) {
    // FM100 hues are specifically calibrated, but we'll use a standard HSL sweep for realism
    const hue = (index / 85) * 360;
    const color = new Phaser.Display.Color();
    color.setFromHSV(hue / 360, 0.5, 0.6); // Saturation and lightness for FM100 look
    return color.color;
}
