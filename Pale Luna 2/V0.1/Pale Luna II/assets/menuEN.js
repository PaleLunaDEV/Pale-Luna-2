// ===============================================
// 1. IMPORTS AND GLOBAL VARIABLES
// ===============================================
const readline = require('readline');
// *** execSync é crucial aqui ***
const { exec, execSync, spawn } = require('child_process'); 
const prompt = require('prompt-sync')();
const fs = require('fs');
const path = require('path');
const blessed = require('blessed');

// Path Constants (Cleaner)
const BASE_DIR = path.resolve(__dirname, '..');
const ACH_FOLDER = path.join(BASE_DIR, 'Achievements');
const ACCOUNT_FILE = path.join(BASE_DIR, 'Account', 'AccountInfo.txt');
const ACH_SAVE_FILE = path.join(BASE_DIR, 'Account', 'Achievementsavefile.bin');
const ET_FILE = path.join(BASE_DIR, 'assets', 'ET.txt');
const MUSIC_PATH = path.join(BASE_DIR, 'audios', 'You_Cant_Escape.mp3');
const VLC_COMMAND = `"${path.join(BASE_DIR, 'audios', 'VLC', 'vlc.exe')}" --play-and-exit --qt-start-minimized "${MUSIC_PATH}"`;

// Language Path
const BR_MENU_FILE = path.join(__dirname, 'MenuBR.js');
const CURRENT_MENU_FILE = path.join(__dirname, 'MenuEN.js'); // Not strictly needed, but kept for consistency

let currentMenu = 'main';
let tocando = false; // Playing (music)

// Recommended Minimum Size for TUI layout
const MIN_WIDTH = 120;
const MIN_HEIGHT = 30;

// Variables that will store the BLESSED component references
let screen;
let logoBox;
let menuList;
let contentBox;
let footer;
let pauseBox; // New component for pause logic

// Giant Logo (Kept original for visual consistency)
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


// ===============================================
// 2. DATA VERIFICATION FUNCTIONS
// ===============================================

function achievementAnnoying(fileName) {
    const fullPath = path.join(ACH_FOLDER, fileName);
    return fs.existsSync(fullPath);
}

function readNumberFromFile(fileName) {
    const fullPath = path.join(BASE_DIR, fileName);
    try {
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        const readNumber = parseInt(fileContent.trim(), 10);
        return isNaN(readNumber) ? 0 : readNumber;
    } catch (error) {
        return 0;
    }
}

// ===============================================
// 3. CHEAT / FLOW INITIALIZATION LOGIC
// ===============================================
const SECRET_FILE = 'SECRET_ENDING.bin'
const CHEAT_FILE = 'HAHAHAHAHAHAHA.txt'
let playerHasSecret = achievementAnnoying(SECRET_FILE);
const number = readNumberFromFile(CHEAT_FILE);

if (number == 3) {
    exec('start cmd.exe /c goodbye.bat')
    console.log("-> HAHAHAHHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHHAHAHAHHAH")
    process.exit(0)
} else if (number == 2) {
    console.clear()
    console.log("===========================================================================")
    console.log("-> I think you didn't understand, right?")
    console.log("-> You NEVER had control in this world...")
    console.log("-> And now I will show you how things are around here!")
    console.log("===========================================================================")
    fs.writeFileSync(path.join(BASE_DIR, CHEAT_FILE), "3", 'utf8');
    process.exit(0)
} else if (number == 1) {
    console.clear()
    console.log("===========================================================================")
    console.log("-> Do you really think that after what you did I will leave you alone???")
    console.log("===========================================================================")
    fs.writeFileSync(path.join(BASE_DIR, CHEAT_FILE), "2", 'utf8');
    process.exit(0)
} else if (playerHasSecret == true) {
    console.clear()
    console.log("===========================================================================")
    console.log("-> Seriously? Do you really think you can just close and open the game?")
    console.log("===========================================================================")
    fs.writeFileSync(path.join(BASE_DIR, CHEAT_FILE), "1", 'utf8');
    process.exit(0)
}

// ===============================================
// 4. MENU ITEM DEFINITION
// ===============================================
const mainMenuItems = [
    'START GAME', 'RESET PROGRESS', 'ACHIEVEMENTS', 'SETTINGS',
    'CREDITS', 'SUPPORT', 'EXIT'
];
const settingsMenuItems = [
    'Soundtrack', 'Account Creation', 'Restore Endings',
    'Include Easter Eggs', 'Language', 'Back to main menu'
];
const musicOptionItems = [
    'Activate Soundtrack', 'Deactivate Soundtrack', 'Back'
];
const accountOptionItems = [
    'Create Account', 'Skip', 'Back'
];
const overwriteOptionItems = [
    'Yes, Overwrite', 'No, Back'
];
const easterEggsMenuItems = [
    'Activate Easter Eggs', 'Deactivate Easter Eggs', 'Back to settings menu'
];
const restoreMenuItems = [
    'Yes, Restore', 'No, Back', 'Check Folder'
];
const supportMenuItems = [
    'Yes, Open Link', 'No, Back'
];
// NEW LANGUAGE MENU
const languageMenuItems = [
    'EN (US)',
    'PT (BR)',
    'Back'
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
    'language': { items: languageMenuItems, label: 'LANGUAGE' }, // NEW
};


// ===============================================
// 5. TUI FUNCTIONS
// ===============================================

/**
 * Creates/recreates all Blessed components.
 */
function createBlessedScreen() {
    if (screen) {
        screen.destroy();
    }

    screen = blessed.screen({
        smartCSR: true,
        title: 'Pale Luna II: The Fading Light'
    });

    screen.key(['escape', 'q', 'C-c'], function(ch, key) {
        if (tocando) exec('taskkill /IM vlc.exe /F');
        return process.exit(0);
    });

    // LOGO/HEADER
    logoBox = blessed.box({
        top: 'top', left: 'center', width: '90%', height: 14,
        content: PALE_LUNA_LOGO,
        tags: true,
        style: { fg: 'white', bold: true }
    });
    screen.append(logoBox);

    // LEFT SIDE MENU (List)
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

    // MAIN CONTENT
    contentBox = blessed.box({
        top: 15, left: '32%', width: '67%', height: '60%',
        content: 'Select an option on the side.\nUse the arrows to navigate and Enter to select.',
        tags: true,
        border: { type: 'line' },
        style: { fg: 'white', border: { fg: 'green' } },
        scrollable: true, alwaysScroll: true,
        scrollbar: { ch: ' ', track: { bg: 'gray' }, style: { inverse: true } }
    });
    screen.append(contentBox);

    // PAUSE BOX (Initially invisible)
    pauseBox = blessed.box({
        top: 'center', left: 'center', width: '80%', height: '30%',
        hidden: true,
        border: { type: 'line' },
        style: { fg: 'white', bg: 'red', border: { fg: 'red' } },
        content: ''
    });
    screen.append(pauseBox);

    // FOOTER
    footer = blessed.text({
        bottom: 0, left: 0, width: '100%', height: 1,
        content: 'Use up/down arrows and Enter. Press Q or Ctrl+C to exit.',
        style: { fg: 'yellow', bg: 'black' }
    });
    screen.append(footer);

    // Selection Handler - ensures local lock while processing
    menuList.on('select', async (item, index) => {
        // Disable additional interaction during processing
        menuList.interactive = false;
        menuList.detach();

        try {
            await handleSelection(index);
        } finally {
            // Re-append and re-enable the list to receive new selections
            screen.append(menuList);
            menuList.interactive = true;
            menuList.focus();
            screen.render();
        }
    });

    menuList.focus();
    screen.render();
}

/**
 * Updates the main content box.
 */
function updateContent(title, content) {
    if (Array.isArray(content)) {
        content = content.join('\n');
    }
    contentBox.setLabel(` ${title} `);
    contentBox.setContent(content);
    screen.render();
}

/**
 * Changes the current menu and updates the list.
 */
function changeMenu(menuName, menuItems, label) {
    currentMenu = menuName;
    menuList.setItems(menuItems);
    menuList.setLabel(` ${label} `);
    menuList.select(0);
    menuList.focus();
    updateContent(label, 'Select an option.');
    screen.render();
}

// ===============================================
// 6. FLOW CONTROL FUNCTIONS (PAUSE AND SIZE)
// ===============================================

/**
 * Initial warning functions (maintained)
 */
function displayInitialResizeWarning() {
    console.clear();
    console.log("=========================================================");
    console.log("             🚨 TERMINAL SIZE WARNING 🚨           ");
    console.log("=========================================================");
    console.log(`For an optimal experience with the side menu,`);
    console.log(`resize the terminal to at least ${MIN_WIDTH}x${MIN_HEIGHT}.`);
    console.log(`Press **ENTER** to check current size and start.`);
    console.log("=========================================================");

    prompt('');

    while (process.stdout.columns < MIN_WIDTH || process.stdout.rows < MIN_HEIGHT) {
        console.clear();
        console.log("=========================================================");
        console.log("             ⚠️ INSUFFICIENT SIZE ⚠️                   ");
        console.log("=========================================================");
        console.log(`The terminal is too small.`);
        console.log(`Recommended: ${MIN_WIDTH}x${MIN_HEIGHT}.`);
        console.log(`Current: ${process.stdout.columns}x${process.stdout.rows}.`);
        console.log("=========================================================");
        console.log("[Adjust the window and press **ENTER** to check again]");
        prompt('');
    }

    console.clear();
    console.log("Size verified. Starting TUI...");
}

/**
 * SIMPLIFIED AND ROBUST PAUSE: Uses prompt-sync and recreates EVERYTHING
 * to ensure the console is clean before any external I/O.
 */
function pauseToContinueAndRecreate(message) {
    // 1. Destroy the Blessed screen
    if (screen) {
        screen.destroy();
    }

    // 2. Display the pause message
    console.clear();
    console.log("===========================================================================");
    if (message) console.log(message);
    console.log("[PRESS [ENTER] TO CONTINUE]");
    console.log("===========================================================================");
    prompt('');

    // 3. Check window size again
    while (process.stdout.columns < MIN_WIDTH || process.stdout.rows < MIN_HEIGHT) {
        console.clear();
        console.log("=========================================================");
        console.log("             ⚠️ INSUFFICIENT SIZE ⚠️                   ");
        console.log("=========================================================");
        console.log(`The terminal is too small.`);
        console.log(`Recommended: ${MIN_WIDTH}x${MIN_HEIGHT}.`);
        console.log(`Current: ${process.stdout.columns}x${process.stdout.rows}.`);
        console.log("=========================================================");
        console.log("[Adjust the window and press **ENTER** to check again]");
        prompt('');
    }

    // 4. Recreate the screen and restore the state
    createBlessedScreen();
    const menuState = menuItemsMap[currentMenu];

    if (menuState) {
        changeMenu(currentMenu, menuState.items, menuState.label);
    } else {
        changeMenu('main', mainMenuItems, 'MAIN MENU');
    }
}

// ===============================================
// 7. ACTION FUNCTIONS
// ===============================================

function playMusic() {
    const command = `start /min "" ${VLC_COMMAND}`;
    exec(`cmd.exe /c "${command}"`, (error, stdout, stderr) => {});
}

async function achievementsBlessed() {
    let endings = [];
    try {
        endings = fs.readdirSync(ACH_FOLDER).filter(f => f.endsWith('.bin'));
    } catch (e) {
        updateContent('ACHIEVEMENTS', `[FILE ERROR]: Could not read achievements folder. ${e.message}`);
        pauseToContinueAndRecreate("[ACHIEVEMENTS]");
        return;
    }

    const count = endings.length;
    let content = "CHECKING FOLDERS\n\n";

    if (count > 0) {
        content += "[FILES FOUND]\n" + endings.join('\n') +
            "\n\n-> If you want to keep these endings, DO NOT RESTORE THEM";
    } else {
        content += "-> No ending files found!";
    }

    updateContent('ACHIEVEMENTS', content);
    pauseToContinueAndRecreate("[ACHIEVEMENTS]");
}

async function createAccountBlessed() {
    if (screen) {
        screen.destroy();
    }
    console.clear();
    console.log("===========================================================================");
    console.log("                     [ACCOUNT CREATION]                      ");
    console.log("===========================================================================");

    const Username = prompt("[USERNAME]: ");
    const Password = prompt("[PASSWORD]: ");
    console.log("===========================================================================");

    const content = `[NAME]: ${Username}\r\n[PASSWORD]: ${Password}\r\n[LANGUAGE]: English \r\n`;

    try {
        fs.writeFileSync(ACCOUNT_FILE, content, 'utf8');
        let endings = [];
        try {
            endings = fs.readdirSync(ACH_FOLDER).filter(f => f.endsWith('.bin'));
        } catch (e) { /* Ignore */ }

        if (endings.length > 0) {
            fs.writeFileSync(ACH_SAVE_FILE, endings.join('\r\n'), 'utf8');
            console.log("[SYSTEM]: Account created successfully! Your endings are saved.");
        } else {
            console.log("[SYSTEM]: Account created successfully! You don't have endings yet.");
        }
    } catch (error) {
        console.error(`[CRITICAL ERROR]: Failed to create account or save file. ${error.message}`);
    }


    pauseToContinueAndRecreate();
    updateContent('ACCOUNT CREATION', "[SYSTEM]: Account created and save file verified.");
}

/**
 * Handles the menu item selection.
 */
async function handleSelection(index) {
    const selectedItem = menuList.getItem(index).getText().trim();

    try {
        if (currentMenu === 'main') {
            switch (selectedItem) {
                case 'START GAME':
                    if (tocando) exec('taskkill /IM vlc.exe /F');
                    screen.destroy();
                    // Assumes the English game file is 'mainEN.js'
                    require('./mainEN.js'); 
                    break;
                case 'RESET PROGRESS':
                    exec('start cmd.exe /c node eraseData.js', async (error) => {
                        const msg = error ? `[ERROR: FILE FAILED ${error.message}]` : '[PROGRESS RESET]';
                        pauseToContinueAndRecreate(`[RESET PROGRESS]\n${msg}`);
                    });
                    break;
                case 'ACHIEVEMENTS':
                    await achievementsBlessed();
                    break;
                case 'SETTINGS':
                    changeMenu('settings', settingsMenuItems, 'SETTINGS');
                    break;
                case 'CREDITS':
                    updateContent('CREDITS',
                        "[OUR TEAM]\nProgramming:\nLucas Eduardo\n\nBeta Testers:\n\nScript:\nLucas Eduardo\n\nArt:\nLucas Eduardo\n\n" +
                        "Music:\nRyan Creep (Youtube.com)\n\nSpecial thanks:\nSENAI Team\n\nTHANK YOU FOR PLAYING OUR GAME!");
                    break;
                case 'SUPPORT':
                    changeMenu('support', supportMenuItems, 'SUPPORT THE GAME');
                    updateContent('SUPPORT THE GAME',
                        "If you want to support the game's development, you can make a donation,\nany amount is welcome and helps a lot with the game's development!\n" +
                        "You can also leave a review on the game page!\n\nDonation link: https://the-last-deploy.itch.io/pale-luna-2\n\n[OPEN?]");
                    break;
                case 'EXIT':
                    if (tocando) exec('taskkill /IM vlc.exe /F');
                    process.exit(0);
            }
        } else if (currentMenu === 'settings') {
            switch (selectedItem) {
                case 'Soundtrack': changeMenu('music', musicOptionItems, 'SOUNDTRACK'); break;
                case 'Account Creation':
                    if (fs.existsSync(ACCOUNT_FILE)) {
                        changeMenu('overwrite', overwriteOptionItems, 'OVERWRITE ACCOUNT');
                        updateContent('OVERWRITE ACCOUNT', "[A ACCOUNT FILE EXISTS, DO YOU WANT TO OVERWRITE IT?]");
                    } else {
                        await createAccountBlessed();
                        changeMenu('settings', settingsMenuItems, 'SETTINGS');
                    }
                    break;
                case 'Restore Endings': changeMenu('restore', restoreMenuItems, 'RESTORE ENDINGS'); break;
                case 'Include Easter Eggs': changeMenu('easterEggs', easterEggsMenuItems, 'EASTER EGGS'); break;
                case 'Language': changeMenu('language', languageMenuItems, 'LANGUAGE'); break; // NEW
                case 'Back to main menu': changeMenu('main', mainMenuItems, 'MAIN MENU'); break;
            }
        } else if (currentMenu === 'language') { // NEW LANGUAGE HANDLER
            if (selectedItem === 'PT (BR)') {
                
                // 1. Limpa a música e destrói o TUI
                if (tocando) exec('taskkill /IM vlc.exe /F');
                screen.destroy(); 
                
                // 2. Comando usando 'call' para forçar a execução na mesma janela do terminal
                // O 'call' é crucial no cmd.exe para trocar de script sem abrir nova janela.
                const command = `call node "${BR_MENU_FILE}"`;
                
                try {
                    // *** PASSO CRÍTICO: execSync com stdio: 'inherit' ***
                    // Garante que o comando seja enviado e o novo processo assuma o I/O
                    execSync(command, { stdio: 'inherit' });
                    
                    // 3. Mata o processo Node atual imediatamente.
                    process.exit(0); 
                    
                } catch (error) {
                    // Fallback em caso de erro crítico
                    console.error(`[CRITICAL ERROR]: Language switch failed via execSync: ${error.message}`);
                    createBlessedScreen();
                    changeMenu('language', languageMenuItems, 'LANGUAGE');
                    pauseToContinueAndRecreate(`[LANGUAGE SWITCH FAILED]\nError: ${error.message}`);
                }
            } else if (selectedItem === 'EN (US)') {
                // Already in EN (US) - just give feedback
                pauseToContinueAndRecreate("[SYSTEM]\nAlready in English (US).");
                changeMenu('settings', settingsMenuItems, 'SETTINGS');
            } else if (selectedItem === 'Back') {
                changeMenu('settings', settingsMenuItems, 'SETTINGS');
            }
        } else if (currentMenu === 'music') {
            let message = '';
            if (selectedItem.includes('Activate') || selectedItem.includes('Deactivate')) {
                if (selectedItem.includes('Activate')) {
                    if (tocando) { message = "[MUSIC IS ALREADY PLAYING]"; }
                    else { playMusic(); tocando = true; message = "[SOUNDTRACK STARTED]"; }
                } else if (selectedItem.includes('Deactivate')) {
                    if (tocando) { exec('taskkill /IM vlc.exe /F'); tocando = false; message = "[MUSIC STOPPED]"; }
                    else { message = "[MUSIC IS ALREADY STOPPED]"; }
                }
                pauseToContinueAndRecreate(`[SOUNDTRACK]\n${message}`);
                changeMenu('settings', settingsMenuItems, 'SETTINGS');
            } else if (selectedItem.includes('Back')) {
                changeMenu('settings', settingsMenuItems, 'SETTINGS');
            }
        } else if (currentMenu === 'account') {
            if (selectedItem === 'Create Account') {
                if (fs.existsSync(ACCOUNT_FILE)) {
                    changeMenu('overwrite', overwriteOptionItems, 'OVERWRITE ACCOUNT');
                    updateContent('OVERWRITE ACCOUNT', "[A ACCOUNT FILE EXISTS, DO YOU WANT TO OVERWRITE IT?]");
                } else {
                    await createAccountBlessed();
                    changeMenu('settings', settingsMenuItems, 'SETTINGS');
                }
            } else if (selectedItem === 'Skip') {
                pauseToContinueAndRecreate("[ACCOUNT CREATION SKIPPED]");
                changeMenu('settings', settingsMenuItems, 'SETTINGS');
            } else if (selectedItem === 'Back') {
                changeMenu('settings', settingsMenuItems, 'SETTINGS');
            }
        } else if (currentMenu === 'overwrite') {
            if (selectedItem.includes('Yes')) {
                await createAccountBlessed();
            } else {
                pauseToContinueAndRecreate("[ACCOUNT CREATION CANCELED]");
            }
            changeMenu('settings', settingsMenuItems, 'SETTINGS');
        } else if (currentMenu === 'easterEggs') {
            let message = '';
            if (selectedItem.includes('Activate') || selectedItem.includes('Deactivate')) {
                if (selectedItem.includes('Activate')) {
                    if (fs.existsSync(ET_FILE)) { message = "[EASTER EGGS ARE ALREADY ACTIVATED]"; }
                    else { fs.writeFileSync(ET_FILE, 'Easter Eggs Activated', 'utf8'); message = "[EASTER EGGS ACTIVATED!]"; }
                } else if (selectedItem.includes('Deactivate')) {
                    if (!fs.existsSync(ET_FILE)) { message = "[EASTER EGGS ARE ALREADY DEACTIVATED]"; }
                    else { fs.unlinkSync(ET_FILE); message = "[EASTER EGGS DEACTIVATED!]"; }
                }
                pauseToContinueAndRecreate(`[EASTER EGGS]\n${message}`);
                changeMenu('settings', settingsMenuItems, 'SETTINGS');
            } else if (selectedItem.includes('Back')) {
                changeMenu('settings', settingsMenuItems, 'SETTINGS');
            }
        } else if (currentMenu === 'restore') {
            let message = '';
            let endingsFolder = [];
            try {
                endingsFolder = fs.readdirSync(ACH_FOLDER).filter(f => f.endsWith('.bin'));
            } catch (e) { /* Ignore */ }


            if (selectedItem.includes('Yes')) {
                if (!fs.existsSync(ACH_SAVE_FILE)) {
                    message = "[SAVED ENDINGS FILE NOT FOUND]";
                } else {
                    try {
                        const data = fs.readFileSync(ACH_SAVE_FILE, 'utf8');
                        let restored = [];
                        const endingsToRestore = data.split('\n').map(f => f.trim()).filter(f => f.length > 0);

                        if (endingsToRestore.length > 0) {
                            endingsToRestore.forEach(ending => {
                                if (!fs.existsSync(path.join(ACH_FOLDER, ending))) {
                                    fs.writeFileSync(path.join(ACH_FOLDER, ending), 'a', 'utf8');
                                    restored.push(ending);
                                }
                            });

                            if (restored.length > 0) { message = `[ENDINGS RESTORED SUCCESSFULLY]:\n${restored.join('\n')}`; }
                            else { message = "[ENDINGS WERE ALREADY PRESENT IN THE FOLDER]"; }
                        } else { message = "[NO ENDINGS FOUND IN THE SAVE FILE]"; }
                    } catch (err) { message = `[ERROR]: Failed to read or restore files: ${err.message}`; }
                }
                pauseToContinueAndRecreate(`[RESTORE ENDINGS]\n${message}`);
                changeMenu('settings', settingsMenuItems, 'SETTINGS');
            } else if (selectedItem.includes('No')) {
                pauseToContinueAndRecreate("[RESTORATION CANCELED]");
                changeMenu('settings', settingsMenuItems, 'SETTINGS');
            } else if (selectedItem.includes('Check')) {
                if (endingsFolder.length > 0) {
                    message = `[FILES FOUND IN CURRENT PROGRESS]:\n${endingsFolder.join('\n')}\n\n-> If you want to keep these endings, DO NOT RESTORE THEM`;
                } else { message = "[NO ENDINGS FOUND!]"; }
                pauseToContinueAndRecreate(`[ENDINGS CHECK]\n${message}`);
                changeMenu('restore', restoreMenuItems, 'RESTORE ENDINGS');
            }
        } else if (currentMenu === 'support') {
            if (selectedItem.includes('Yes')) {
                pauseToContinueAndRecreate("[OPENING LINK IN DEFAULT BROWSER...]");
                exec('start https://the-last-deploy.itch.io/pale-luna-2');
            } else {
                pauseToContinueAndRecreate("[OPTION DECLINED]");
            }
            changeMenu('main', mainMenuItems, 'MAIN MENU');
        }
    } catch (error) {
        console.error(`[CRITICAL MENU ERROR]: ${error.message}`);
        pauseToContinueAndRecreate(`[CRITICAL ERROR]\nAn error occurred while processing the menu: ${error.message}`);
        changeMenu('main', mainMenuItems, 'MAIN MENU');
    }
}

// ===============================================
// 8. PROGRAM INITIALIZATION
// ===============================================
displayInitialResizeWarning();
createBlessedScreen();
changeMenu('main', mainMenuItems, 'MAIN MENU');