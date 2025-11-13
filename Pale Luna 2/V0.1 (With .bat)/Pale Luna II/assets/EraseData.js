const readline = require('readline');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let selectedIndex = 0;
const menuItems = [
    'Yes',
    'No'
];
let currentMenu = 'main';

function centerText(text) {
    const terminalWidth = process.stdout.columns;
    const padding = Math.max(0, Math.floor((terminalWidth - text.length) / 2));
    console.log(' '.repeat(padding) + text);
}

function drawMenu(menuItems, title) {
    console.clear();
    centerText("\x1b[96m===========================================================================");
    centerText(title);
    centerText("\x1b[96m===========================================================================");
    menuItems.forEach((item, index) => {
        centerText((index === selectedIndex ? `[> ${item} <]` : `  ${item}`));
    });
    centerText("\x1b[96m===========================================================================");
    centerText('\x1b[96mUse the up/down arrows to navigate, Enter to select.');
}

async function main() {
    console.clear();
    centerText("\x1b[96m===========================================================================");
    centerText("\x1b[96mDELETING PROGRESS...");
    centerText("\x1b[96m===========================================================================");
    const folderPath = '../Achievements';
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
        if (file.endsWith('.bin')) {
            fs.unlinkSync(path.join(folderPath, file));
        }
    }
    centerText("\x1b[96mFiles deleted successfully!");
    await pausarParaContinuar();
    
    showWebsiteMenu();
}

async function showWebsiteMenu() {
    currentMenu = 'website';
    selectedIndex = 0;
    drawMenu(menuItems, "\x1b[96mDo you want to see the developer's ITCH.IO?");
}

async function pausarParaContinuar() {
    centerText("\x1b[96m===========================================================================");
    centerText("\x1b[96m[PRESS ANY KEY TO CONTINUE]");
    centerText("\x1b[96m===========================================================================");
    return new Promise(resolve => {
        process.stdin.once('data', () => {
            console.clear();
            resolve();
        });
    });
}

process.stdin.setRawMode(true);
process.stdin.resume();

process.stdin.on('data', async (chunk) => {
    const key = chunk.toString('hex');

    if (currentMenu === 'website') {
        if (key === '1b5b41') { // Up arrow
            selectedIndex = (selectedIndex - 1 + menuItems.length) % menuItems.length;
            drawMenu(menuItems, "Do you want to see the developer's ITCH.IO?");
        } else if (key === '1b5b42') { // Down arrow
            selectedIndex = (selectedIndex + 1) % menuItems.length;
            drawMenu(menuItems, "Do you want to see the developer's ITCH.IO?");
        } else if (key === '0d') { // Enter
            if (selectedIndex === 0) { // Yes
                console.clear();
                centerText("\x1b[96m===========================================================================");
                centerText("\x1b[96mOPENING WEBSITE...");
                centerText("\x1b[96m===========================================================================");
                exec('start Massivestudios.itch.io/pale-luna');
                await pausarParaContinuar();
                process.exit();
            } else { // No
                process.exit();
            }
        }
    }
});

main();