// menuEN.js
// Refactored and corrected for account creation and TUI (Blessed) flow
// Requirements: node, prompt-sync, blessed

const readline = require('readline');
const { exec, execSync } = require('child_process');
const prompt = require('prompt-sync')();
const fs = require('fs');
const path = require('path');
const blessed = require('blessed');

// =====================
// Path Constants
// =====================
const BASE_DIR = path.resolve(__dirname, '..');
const ACCOUNT_DIR = path.join(BASE_DIR, 'Account');
const ACH_FOLDER = path.join(BASE_DIR, 'Achievements');
const ACCOUNT_FILE = path.join(ACCOUNT_DIR, 'AccountInfo.txt');
const ACH_SAVE_FILE = path.join(ACCOUNT_DIR, 'Achievementsavefile.bin');
const ASSETS_DIR = path.join(BASE_DIR, 'assets');
const ET_FILE = path.join(ASSETS_DIR, 'ET.txt');
const MUSIC_PATH = path.join(ASSETS_DIR, 'audios', 'You_Cant_Escape.mp3');
const VLC_EXE = path.join(ASSETS_DIR, 'audios', 'VLC', 'vlc.exe');

// Language files
// (The original referenced MenuEN.js / MenuBR.js)
const BR_MENU_FILE = path.join(__dirname, 'MenuBR.js'); // Pointing to Portuguese file
const CURRENT_MENU_FILE = path.join(__dirname, 'MenuEN.js'); // This file

// =====================
// Ensure folder structure
// =====================
function ensureDir(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    } catch (e) {
        console.error(`Failed to ensure directory ${dirPath}: ${e.message}`);
    }
}

ensureDir(ACCOUNT_DIR);
ensureDir(ACH_FOLDER);
ensureDir(path.join(ASSETS_DIR, 'audios'));

// =====================
// State Variables
// =====================
let screen = null;
let logoBox = null;
let menuList = null;
let contentBox = null;
let footer = null;
let pauseBox = null;

let currentMenu = 'main';
let tocando = false;
let paused = false;

const MIN_WIDTH = 120;
const MIN_HEIGHT = 30;

// Logo (simplified to avoid rendering issues)
const PALE_LUNA_LOGO = '\x1b[0m\n' +
    "██████╗  █████╗ ██╗     ███████╗     ████████║ ████████║\n" +
    "██╔══██╗██╔══██╗██║     ██╔════╝       ████╔═╝   ████╔═╝\n" +
    "██████╔╝███████║██║     █████╗         ████║     ████║  \n" +
    "██╔═══╝ ██╔══██║██║     ██╔══╝         ████║     ████║  \n" +
    "██║     ██║  ██║███████╗███████╗       ████║     ████║  \n" +
    "╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝       ████║     ████║  \n" +
    "██╗     ██╗   ██╗███╗   ██╗ █████╗     ████║     ████║  \n" +
    "██║     ██║   ██║████╗  ██║██╔══██╗    ████║     ████║  \n" +
    "██║     ██║   ██║██╔██╗ ██║███████║    ████║     ████║  \n" +
    "██║     ██║   ██║██║╚██╗██║██╔══██║    ████╚═╗   ████╚═╗\n" +
    "███████╗╚██████╔╝██║ ╚████║██║  ██║  ████████║ ████████║\n" +
    "╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝  ╚═══════╝ ╚═══════╝";

// =====================
// Menus and maps (TRANSLATED)
// =====================
const mainMenuItems = [
    'START GAME', 'RESTART PROGRESS', 'ACHIEVEMENTS', 'SETTINGS',
    'CREDITS', 'SUPPORT', 'EXIT'
];
const settingsMenuItems = [
    'Soundtrack', 'Account Creation', 'Restore Endings',
    'Easter Eggs', 'Language', 'Back to main menu'
];
const musicOptionItems = [
    'Activate Soundtrack', 'Deactivate Soundtrack', 'Back'
];
const accountOptionItems = [
    'Create Account', 'Skip', 'Back'
];
const overwriteOptionItems = [
    'Yes, Overwrite', 'No, Go Back'
];
const easterEggsMenuItems = [
    'Activate Easter Eggs', 'Deactivate Easter Eggs', 'Back to settings menu'
];
const restoreMenuItems = [
    'Yes, Restore', 'No, Go Back', 'Check Folder'
];
const supportMenuItems = [
    'Yes, Open Link', 'No, Go Back'
];
const languageMenuItems = [
    'PT (BR)', 'EN (US)', 'Back'
];

const menuItemsMap = {
    'main': { items: mainMenuItems, label: 'MAIN MENU' },
    'settings': { items: settingsMenuItems, label: 'SETTINGS' },
    'music': { items: musicOptionItems, label: 'SOUNDTRACK' },
    'account': { items: accountOptionItems, label: 'ACCOUNT CREATION' },
    'overwrite': { items: overwriteOptionItems, label: 'OVERWRITE ACCOUNT' },
    'easterEggs': { items: easterEggsMenuItems, label: 'EASTER EGGS' },
    'restore': { items: restoreMenuItems, label: 'RESTORE ENDINGS' },
    'support': { items: supportMenuItems, label: 'SUPPORT THE GAME' },
    'language': { items: languageMenuItems, label: 'LANGUAGE' },
};

// =====================
// File Utilities (TRANSLATED COMMENTS)
// =====================
function conquistaannoying(fileName) {
    const fullPath = path.join(ACH_FOLDER, fileName);
    try { return fs.existsSync(fullPath); } catch (e) { return false; }
}

function lerNumeroDoArquivo(relativeFileName) {
    const fullPath = path.join(BASE_DIR, relativeFileName);
    try {
        if (!fs.existsSync(fullPath)) return 0;
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        const readNumber = parseInt(fileContent.trim(), 10);
        return isNaN(readNumber) ? 0 : readNumber;
    } catch (error) {
        return 0;
    }
}

// =====================
// Initial Checks (preserved old tricks) (TRANSLATED CONSOLE LOGS)
// =====================
const ARQUIVO_SECRETO = 'SECRET_ENDING.bin';
const ARQUIVO_TRAPACA = 'HAHAHAHAHAHAHA.txt';
let jogadortem = conquistaannoying(ARQUIVO_SECRETO);
const numeroTrap = lerNumeroDoArquivo(ARQUIVO_TRAPACA);

if (numeroTrap === 3) {
    try { exec('start cmd.exe /c goodbye.bat'); } catch (e) {}
    console.log("-> HAHAHAH... exiting.");
    process.exit(0);
} else if (numeroTrap === 2) {
    console.clear();
    console.log("-> You NEVER had control in this world...");
    try { fs.writeFileSync(path.join(BASE_DIR, ARQUIVO_TRAPACA), "3", 'utf8'); } catch(e){}
    process.exit(0);
} else if (numeroTrap === 1) {
    console.clear();
    try { fs.writeFileSync(path.join(BASE_DIR, ARQUIVO_TRAPACA), "2", 'utf8'); } catch(e){}
    process.exit(0);
} else if (jogadortem === true) {
    console.clear();
    try { fs.writeFileSync(path.join(BASE_DIR, ARQUIVO_TRAPACA), "1", 'utf8'); } catch(e){}
    process.exit(0);
}

// =====================
// BLESSED / UI FUNCTIONS (TRANSLATED TEXT)
// =====================

function safeDestroyScreen() {
    try {
        if (screen) {
            screen.destroy();
            screen = null;
            logoBox = menuList = contentBox = footer = pauseBox = null;
        }
    } catch (e) {
        // ignore
    }
}

function createBlessedScreen() {
    // If it already exists, don't recreate it — but allow recreation if screen == null
    if (screen) return;
    
        screen = blessed.screen({
            smartCSR: true,
            title: 'Pale Luna II: The Fading Light'
        });
    
        screen.key(['escape', 'q', 'C-c'], function() {
            if (tocando) try { execSync('taskkill /IM vlc.exe /F'); } catch (e) {}
            safeDestroyScreen();
            process.exit(0);
        });
    
        logoBox = blessed.box({
                    top: 'top', left: 'center', width: '90%', height: 14,
                    content: PALE_LUNA_LOGO,
                    tags: true,
                    style: { fg: 'white', bold: true }
                });
                screen.append(logoBox);
    
        menuList = blessed.list({
                    top: 15,
                    left: 1,
                    width: '30%',
                    height: '100%-16',
                    keys: true,
                    mouse: true,
                    style: {
                        selected: { fg: 'black', bg: 'white' },
                        item: { fg: 'white', bg: 'black' },
                        border: { fg: 'cyan' }
                    },
                    border: { type: 'line' },
                    label: ' MENU ',
                    items: []
                });
                screen.append(menuList);
    
        contentBox = blessed.box({
                    top: 15, left: '32%', width: '67%', height: '90%-16',
                    content: 'Selecione uma opção ao lado.\nUse as setas para navegar e Enter para selecionar.',
                    tags: true,
                    border: { type: 'line' },
                    style: { fg: 'white', border: { fg: 'green' } },
                    scrollable: true, alwaysScroll: true,
                    scrollbar: { ch: ' ', track: { bg: 'gray' }, style: { inverse: true } }
                });
                screen.append(contentBox);
        
                // BOX DE PAUSA (Sobrepõe o contentBox)
                pauseBox = blessed.box({
                    top: 'center', left: 'center', width: '70%', height: '30%',
                    hidden: true,
                    border: { type: 'line' },
                    style: { fg: 'white', bg: 'red', border: { fg: 'red' } },
                    content: ''
                });
                screen.append(pauseBox);
        
    
        footer = blessed.text({
            bottom: 0, left: 0, width: '100%', height: 1,
            content: 'Use as setas ↑/↓ e Enter. Pressione Q ou Ctrl+C para sair.',
            style: { fg: 'yellow', bg: 'black' }
        });
        screen.append(footer);

    menuList.on('select', async (item, index) => {
        if (paused) return;
        // disable extra interactions
        menuList.interactive = false;
        try {
            await handleSelection(index);
        } catch (e) {
            blessedPause(`[CRITICAL HANDLER ERROR]\n${e.message}`, () => {
                changeMenu(currentMenu, menuItemsMap[currentMenu].items, menuItemsMap[currentMenu].label);
            });
        } finally {
            if (!paused) {
                menuList.interactive = true;
                try { menuList.focus(); } catch(e){}
                screen.render();
            }
        }
    });

    menuList.focus();
    screen.render();
}

function updateContent(title, content) {
    if (!contentBox) return;
    if (Array.isArray(content)) content = content.join('\n');
    contentBox.setLabel(` ${title} `);
    contentBox.setContent(content);
    if (screen) screen.render();
}

function changeMenu(menuName, menuItems, label) {
    currentMenu = menuName;
    if (!menuList) return;
    menuList.setItems(menuItems);
    menuList.setLabel(` ${label} `);
    menuList.select(0);
    try { menuList.focus(); } catch (e) {}
    updateContent(label, 'Select an option.');
    if (screen) screen.render();
}

// =====================
// Internal Pause (Blessed) (TRANSLATED TEXT)
// =====================
function blessedPause(message, callback) {
    paused = true;
    if (menuList) menuList.interactive = false;

    pauseBox.setContent(`[SYSTEM]\n${message}\n\n[PRESS ANY KEY TO CONTINUE]`);
    pauseBox.show();
    pauseBox.focus();
    if (screen) screen.render();

    screen.once('keypress', () => {
        paused = false;
        pauseBox.hide();
        if (menuList) menuList.interactive = true;
        try { menuList.focus(); } catch(e){}
        if (screen) screen.render();
        if (typeof callback === 'function') callback();
    });
}

// =====================
// Actions (music, achievements, account creation...) (TRANSLATED TEXT)
// =====================

function tocamusic() {
    if (!fs.existsSync(MUSIC_PATH) || !fs.existsSync(VLC_EXE)) {
        // doesn't fail silently — warns
        blessedPause("[SOUNDTRACK]\nAudio file or vlc.exe not found.");
        return;
    }
    const cmd = `"${VLC_EXE}" --play-and-exit --qt-start-minimized "${MUSIC_PATH}"`;
    try {
        // start minimized on windows
        exec(`start /min "" ${cmd}`, (err) => {});
    } catch (e) {
        console.error("Failed to start music:", e.message);
    }
}

async function conquistasBlessed() {
    let finais = [];
    try {
        finais = fs.readdirSync(ACH_FOLDER).filter(f => f.endsWith('.bin'));
    } catch (e) {
        updateContent('ACHIEVEMENTS', `[FILE ERROR]: Could not read the achievements folder. ${e.message}`);
        if (menuList) menuList.focus();
        return;
    }

    const count = finais.length;
    let content = "\nCHECKING FOLDERS...\n\n";
    if (count > 0) {
        content += `[${count} FILES FOUND]\n${finais.join('\n')}\n\n-> If you want to keep these endings, DO NOT RESTORE THEM.`;
    } else {
        content += "[NO ENDING FILES FOUND]";
    }
    updateContent('ACHIEVEMENTS', content);
    if (menuList) menuList.focus();
}

/**
 * Account creation:
 * - Destroys the TUI
 * - Does I/O in the native console with prompt-sync
 * - Recreates TUI and displays result with blessedPause
 */
async function createAccountBlessedAndPause() {
    // destroy TUI to avoid stdin conflicts
    safeDestroyScreen();
    console.clear();
    console.log("===========================================================================");
    console.log("              [ACCOUNT CREATION - CONSOLE INPUT]                           ");
    console.log("===========================================================================");

    try {
        const usuario = prompt("[USERNAME]: ");
        // prompt-sync has hide in some versions
        const senha = prompt.hide ? prompt.hide("[PASSWORD]: ") : prompt("[PASSWORD]: "); 
        console.log("===========================================================================");

        // TRANSLATED: [IDIOMA]: Português -> [LANGUAGE]: English
        const conteudo = `[NAME]: ${usuario}\r\n[PASSWORD]: ${senha}\r\n[LANGUAGE]: English\r\n`;

        ensureDir(ACCOUNT_DIR);

        let resultMessage = '';
        try {
            fs.writeFileSync(ACCOUNT_FILE, conteudo, 'utf8');

            let finais = [];
            try {
                finais = fs.readdirSync(ACH_FOLDER).filter(f => f.endsWith('.bin'));
            } catch (e) { /* ignore, not critical */ }

            if (finais.length > 0) {
                fs.writeFileSync(ACH_SAVE_FILE, finais.join('\r\n'), 'utf8');
                resultMessage = "[SYSTEM]: Account created successfully! Your endings are saved.";
            } else {
                resultMessage = "[SYSTEM]: Account created successfully! You do not have any endings yet.";
            }
        } catch (errWrite) {
            resultMessage = `[CRITICAL ERROR]: Failed to create account or save file. ${errWrite.message}`;
        }

        console.log(`\n[RESULT]: ${resultMessage}`);
    } catch (errConsole) {
        console.error("Error during console input:", errConsole.message);
    }

    prompt("Press ENTER to return to the menu...");

    // recreate the TUI screen
    createBlessedScreen();

    // display pause and return to Settings
    blessedPause("[SYSTEM]\nAccount processed successfully.", () => {
        changeMenu('settings', settingsMenuItems, 'SETTINGS');
    });
}

// =====================
// Selection Handler (TRANSLATED TEXT)
// =====================
async function handleSelection(index) {
    if (!menuList) return;
    const itemObj = menuList.getItem(index);
    if (!itemObj) return;
    const selectedItem = (itemObj.getText ? itemObj.getText() : String(itemObj)).trim();

    try {
        if (currentMenu === 'main') {
            switch (selectedItem) {
                case 'START GAME':
                    if (tocando) try { execSync('taskkill /IM vlc.exe /F'); } catch(e){}
                    safeDestroyScreen();
                    try {
                        // Assuming mainEN.js exists for the game logic
                        execSync(`node "${path.join(__dirname, 'mainEN.js')}"`, { stdio: 'inherit' });
                    } catch (e) {
                        console.error("Error starting game:", e.message);
                    }
                    process.exit(0);
                    break;
                case 'RESTART PROGRESS':
                    exec('start cmd.exe /c node eraseData.js', (error) => {
                        const msg = error ? `[ERROR: FILE FAILED ${error.message}]` : '[PROGRESS RESTARTED]';
                        blessedPause(`[RESTART PROGRESS]\n${msg}`);
                    });
                    break;
                case 'ACHIEVEMENTS':
                    await conquistasBlessed();
                    break;
                case 'SETTINGS':
                    changeMenu('settings', settingsMenuItems, 'SETTINGS');
                    break;
                case 'CREDITS':
                    updateContent('CREDITS',
                        "[OUR TEAM]\nProgramming:\nLucas Eduardo\n\nBeta Testers:\n\nScript:\nLucas Eduardo\n\nArt:\nLucas Eduardo\n\n" +
                        "Music:\nRyan Creep (Youtube.com)\n\nSpecial Thanks:\nSENAI Team\n\nTHANK YOU FOR PLAYING OUR GAME!");
                    break;
                case 'SUPPORT':
                    changeMenu('support', supportMenuItems, 'SUPPORT THE GAME');
                    updateContent('SUPPORT THE GAME',
                        "If you want to support the game's development, you can make a donation,\nany amount is welcome and helps a lot with the game's development!\n" +
                        "You can also leave a review on the game page!\n\nDonation link: https://the-last-deploy.itch.io/pale-luna-2\n\n[OPEN?]");
                    break;
                case 'EXIT':
                    if (tocando) try { execSync('taskkill /IM vlc.exe /F'); } catch(e){}
                    safeDestroyScreen();
                    process.exit(0);
                    break;
                default:
                    // default action
                    break;
            }
        } else if (currentMenu === 'settings') {
            switch (selectedItem) {
                case 'Soundtrack':
                    changeMenu('music', musicOptionItems, 'SOUNDTRACK');
                    break;
                case 'Account Creation':
                    if (fs.existsSync(ACCOUNT_FILE)) {
                        changeMenu('overwrite', overwriteOptionItems, 'OVERWRITE ACCOUNT');
                        updateContent('OVERWRITE ACCOUNT', "[AN ACCOUNT FILE EXISTS, DO YOU WANT TO OVERWRITE IT?]");
                    } else {
                        await createAccountBlessedAndPause();
                    }
                    break;
                case 'Restore Endings':
                    changeMenu('restore', restoreMenuItems, 'RESTORE ENDINGS');
                    break;
                case 'Easter Eggs':
                    changeMenu('easterEggs', easterEggsMenuItems, 'EASTER EGGS');
                    break;
                case 'Language':
                    changeMenu('language', languageMenuItems, 'LANGUAGE');
                    break;
                case 'Back to main menu':
                    changeMenu('main', mainMenuItems, 'MAIN MENU');
                    break;
            }
        } else if (currentMenu === 'language') {
            if (selectedItem === 'PT (BR)') {
                // tries to switch to Portuguese menu, saving state
                if (tocando) try { execSync('taskkill /IM vlc.exe /F'); } catch(e){}
                safeDestroyScreen();
                try {
                    execSync(`node "${BR_MENU_FILE}"`, { stdio: 'inherit' });
                    process.exit(0);
                } catch (error) {
                    console.error(`[CRITICAL ERROR]: Failed to start BR Menu: ${error.message}`);
                    createBlessedScreen();
                    changeMenu('language', languageMenuItems, 'LANGUAGE');
                    blessedPause(`[LANGUAGE SWAP FAILED]\nError: ${error.message}`, () => {
                        changeMenu('settings', settingsMenuItems, 'SETTINGS');
                    });
                }
            } else if (selectedItem === 'EN (US)') {
                blessedPause("[SYSTEM]\nAlready in English (US).", () => {
                    changeMenu('settings', settingsMenuItems, 'SETTINGS');
                });
            } else if (selectedItem === 'Back') {
                changeMenu('settings', settingsMenuItems, 'SETTINGS');
            }
        } else if (currentMenu === 'music') {
            let message = '';
            if (selectedItem.includes('Activate') || selectedItem.includes('Deactivate')) {
                if (selectedItem.includes('Activate')) {
                    if (tocando) { message = "[MUSIC IS ALREADY PLAYING]"; }
                    else { tocamusic(); tocando = true; message = "[SOUNDTRACK STARTED]"; }
                } else if (selectedItem.includes('Deactivate')) {
                    if (tocando) { try { execSync('taskkill /IM vlc.exe /F'); } catch(e){} tocando = false; message = "[MUSIC STOPPED]"; }
                    else { message = "[MUSIC IS ALREADY STOPPED]"; }
                }
                blessedPause(`[SOUNDTRACK]\n${message}`, () => {
                    changeMenu('settings', settingsMenuItems, 'SETTINGS');
                });
            } else if (selectedItem.includes('Back')) {
                changeMenu('settings', settingsMenuItems, 'SETTINGS');
            }
        } else if (currentMenu === 'account') {
            if (selectedItem === 'Create Account') {
                if (fs.existsSync(ACCOUNT_FILE)) {
                    changeMenu('overwrite', overwriteOptionItems, 'OVERWRITE ACCOUNT');
                    updateContent('OVERWRITE ACCOUNT', "[AN ACCOUNT FILE EXISTS, DO YOU WANT TO OVERWRITE IT?]");
                } else {
                    await createAccountBlessedAndPause();
                }
            } else if (selectedItem === 'Skip') {
                blessedPause("[ACCOUNT CREATION SKIPPED]", () => {
                    changeMenu('settings', settingsMenuItems, 'SETTINGS');
                });
            } else if (selectedItem === 'Back') {
                changeMenu('settings', settingsMenuItems, 'SETTINGS');
            }
        } else if (currentMenu === 'overwrite') {
            if (selectedItem.includes('Yes')) {
                await createAccountBlessedAndPause();
            } else {
                blessedPause("[ACCOUNT CREATION CANCELED]", () => {
                    changeMenu('settings', settingsMenuItems, 'SETTINGS');
                });
            }
        } else if (currentMenu === 'easterEggs') {
            let message = '';
            if (selectedItem.includes('Activate') || selectedItem.includes('Deactivate')) {
                if (selectedItem.includes('Activate')) {
                    if (fs.existsSync(ET_FILE)) { message = "[EASTER EGGS ARE ALREADY ACTIVATED]"; }
                    else { fs.writeFileSync(ET_FILE, 'Easter Eggs Activated', 'utf8'); message = "[EASTER EGGS ACTIVATED!]"; }
                } else {
                    if (!fs.existsSync(ET_FILE)) { message = "[EASTER EGGS ARE ALREADY DEACTIVATED]"; }
                    else { fs.unlinkSync(ET_FILE); message = "[EASTER EGGS DEACTIVATED!]"; }
                }
                blessedPause(`[EASTER EGGS]\n${message}`, () => {
                    changeMenu('settings', settingsMenuItems, 'SETTINGS');
                });
            } else if (selectedItem.includes('Back')) {
                changeMenu('settings', settingsMenuItems, 'SETTINGS');
            }
        } else if (currentMenu === 'restore') {
            let message = '';
            let finaisPasta = [];
            try { finaisPasta = fs.readdirSync(ACH_FOLDER).filter(f => f.endsWith('.bin')); } catch (e) { /* ignore */ }

            if (selectedItem.includes('Yes')) {
                if (!fs.existsSync(ACH_SAVE_FILE)) {
                    message = "[SAVED ENDINGS FILE NOT FOUND]";
                } else {
                    try {
                        const dados = fs.readFileSync(ACH_SAVE_FILE, 'utf8');
                        const finaisToRestore = dados.split('\n').map(f => f.trim()).filter(f => f.length > 0);
                        const restored = [];
                        finaisToRestore.forEach(final => {
                            const destino = path.join(ACH_FOLDER, final);
                            if (!fs.existsSync(destino)) {
                                fs.writeFileSync(destino, 'a', 'utf8');
                                restored.push(final);
                            }
                        });
                        if (restored.length > 0) { message = `[ENDINGS RESTORED SUCCESSFULLY]:\n${restored.join('\n')}`; }
                        else { message = "[ENDINGS WERE ALREADY PRESENT IN THE FOLDER]"; }
                    } catch (err) {
                        message = `[ERROR]: Failed to read or restore files: ${err.message}`;
                    }
                }
                blessedPause(`[RESTORE ENDINGS]\n${message}`, () => {
                    changeMenu('settings', settingsMenuItems, 'SETTINGS');
                });
            } else if (selectedItem.includes('No')) {
                blessedPause("[RESTORATION CANCELED]", () => {
                    changeMenu('settings', settingsMenuItems, 'SETTINGS');
                });
            } else if (selectedItem.includes('Check')) {
                if (finaisPasta.length > 0) {
                    updateContent('ENDING VERIFICATION', `[FILES FOUND IN CURRENT PROGRESS]:\n${finaisPasta.join('\n')}\n\n-> If you want to keep these endings, DO NOT RESTORE THEM`);
                } else {
                    updateContent('ENDING VERIFICATION', "[NO ENDINGS FOUND!]");
                }
                if (menuList) menuList.focus();
            }
        } else if (currentMenu === 'support') {
            if (selectedItem.includes('Yes')) {
                blessedPause("[OPENING LINK IN DEFAULT BROWSER...]", () => {
                    try { exec('start https://the-last-deploy.itch.io/pale-luna-2'); } catch (e) {}
                    changeMenu('main', mainMenuItems, 'MAIN MENU');
                });
            } else {
                blessedPause("[OPTION DECLINED]", () => {
                    changeMenu('main', mainMenuItems, 'MAIN MENU');
                });
            }
        }
    } catch (error) {
        blessedPause(`[CRITICAL ACTION ERROR]\nAn error occurred: ${error.message}`, () => {
            changeMenu('main', mainMenuItems, 'MAIN MENU');
        });
    }
}

// =====================
// INITIALIZATION (TRANSLATED TEXT)
// =====================
function displayInitialResizeWarning() {
    console.clear();
    console.log("=========================================================");
    console.log("             🚨 TERMINAL SIZE WARNING 🚨               ");
    console.log("=========================================================");
    console.log(`Resize the terminal to at least ${MIN_WIDTH}x${MIN_HEIGHT}.`);
    console.log(`Press ENTER to check the current size and start.`);
    prompt('');
    while (process.stdout.columns < MIN_WIDTH || process.stdout.rows < MIN_HEIGHT) {
        console.clear();
        console.log("=========================================================");
        console.log("             ⚠️ INSUFFICIENT SIZE ⚠️                   ");
        console.log("=========================================================");
        console.log(`Recommended: ${MIN_WIDTH}x${MIN_HEIGHT}. Current: ${process.stdout.columns}x${process.stdout.rows}.`);
        console.log("[Adjust the window and press ENTER to check again]");
        prompt('');
    }
    console.clear();
    console.log("Size verified. Starting TUI...");
}

displayInitialResizeWarning();
createBlessedScreen();
changeMenu('main', mainMenuItems, 'MAIN MENU');