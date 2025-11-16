const readline = require('readline');
const { exec, execSync } = require('child_process');
const prompt = require('prompt-sync')();
const fs = require('fs');
const path = require('path');
const blessed = require('blessed');

const BASE_DIR = path.resolve(__dirname, '..');
const ACCOUNT_DIR = path.join(BASE_DIR, 'Account');
const ACH_FOLDER = path.join(BASE_DIR, 'Achievements');
const ACCOUNT_FILE = path.join(ACCOUNT_DIR, 'AccountInfo.txt');
const ACH_SAVE_FILE = path.join(ACCOUNT_DIR, 'Achievementsavefile.bin');
const ASSETS_DIR = path.join(BASE_DIR, 'assets');
const ET_FILE = path.join(ASSETS_DIR, 'ET.txt');
const MUSIC_PATH = path.join(ASSETS_DIR, 'audios', 'You_Cant_Escape.mp3');
const VLC_EXE = path.join(ASSETS_DIR, 'audios', 'VLC', 'vlc.exe');


const BR_MENU_FILE = path.join(__dirname, 'MenuBR.js');
const CURRENT_MENU_FILE = path.join(__dirname, 'MenuEN.js');

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

let screen = null;
let logoBox = null;
let menuList = null;
let contentBox = null;
let footer = null;
let pauseBox = null;
let splashScreenBox = null;
let accountForm = null;

let currentMenu = 'main';
let tocando = false;
let paused = false;

const MIN_WIDTH = 120;
const MIN_HEIGHT = 30;

// LOGO PARA O MENU PRINCIPAL (SIMPLES, CONFORME A IMAGEM)
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

// NOVO: LOGO PARA A SPLASH SCREEN (ARTE COMPLEXA)
const PALE_LUNA_LOGO_ASCII = 
`{bold}
██████   █████  ██      ███████   ██      ██   ██ ███    ██  █████  
██   ██ ██   ██ ██      ██        ██      ██   ██ ████   ██ ██   ██
██████  ███████ ██      █████     ██      ██   ██ ██ ██  ██ ███████
██      ██   ██ ██      ██        ██      ██   ██ ██  ██ ██ ██   ██
██      ██   ██ ███████ ███████   ███████  █████  ██   ████ ██   ██

██████ ██████ 
  ██     ██   
  ██     ██   
  ██     ██   
██████ ██████ 
{/bold}`;

const STUDIO_LOGO = 
`{center}{bold}{cyan-fg}
PALE LUNA DEV
{/cyan-fg}{/bold}{/center}
{center}{yellow-fg}P R E S E N T S{/yellow-fg}{/center}
`;

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

function safeDestroyScreen() {
    try {
        if (screen) {
            screen.destroy();
            screen = null;
            logoBox = menuList = contentBox = footer = pauseBox = splashScreenBox = accountForm = null;
        }
    } catch (e) {
    }
}

function startMainMenu() {
    createBlessedScreen(true);
    changeMenu('main', mainMenuItems, 'MAIN MENU');
}

/**
 * Lógica da Barra de Carregamento Falsa (Estágio 2 da Splash Screen)
 * @param {blessed.Box} containerBox - A caixa principal (splashScreenBox) para anexar a barra.
 */
function startFakeLoadingFixed(containerBox) {
    
    // 1. Limpa os elementos antigos se existirem, e cria os novos.
    if (containerBox.children.length > 0) {
        containerBox.children.forEach(child => child.destroy());
    }

    // Caixa para o texto "LOADING..."
    const loadingText = blessed.text({
        parent: containerBox,
        // Posição ajustada para a barra ficar logo abaixo do logo centralizado
        top: '70%', 
        left: 'center',
        width: 'shrink',
        height: 1,
        content: '{bold}LOADING...{/bold}',
        tags: true,
        style: { fg: 'white', bold: true }
    });

    // Caixa para a barra de progresso pixel art
    const pixelLoadingBar = blessed.box({
        parent: containerBox,
        top: '73%', // Um pouco abaixo do texto
        left: 'center',
        width: 42, 
        height: 3, 
        content: '',
        style: { 
            fg: 'white', 
            bg: 'black',
            border: { fg: 'white' } 
        },
        border: { type: 'line' }
    });

    // Caixa para a porcentagem
    const percentageText = blessed.text({
        parent: containerBox,
        top: '74%', // Alinhado verticalmente com o centro da barra (altura 3)
        left: 'center',
        width: 'shrink',
        height: 1,
        content: '  0%', 
        style: { fg: 'white', bold: true }
    });

    // Ajuste de posicionamento da porcentagem: ao lado direito da barra
    percentageText.left = pixelLoadingBar.left + pixelLoadingBar.width + 2;


    // 2. Lógica de Carregamento Sincronizada
    
    const maxTime = 4000;          
    const totalSteps = 40;         
    const stepInterval = maxTime / totalSteps; 
    const progressPerStep = 100 / totalSteps; 
    
    const totalBlocks = 40; 
    let currentStep = 0;
    let fakeLoadingInterval = null;


    fakeLoadingInterval = setInterval(() => {
        currentStep++;
        
        const progress = Math.min(100, Math.floor(currentStep * progressPerStep));
        
        const filledBlocks = Math.floor(progress / (100 / totalBlocks));
        const emptyBlocks = totalBlocks - filledBlocks;
        
        const barContent = '█'.repeat(filledBlocks) + ' '.repeat(emptyBlocks);
        pixelLoadingBar.setContent(barContent); 
        
        percentageText.setContent(`${String(progress).padStart(3, ' ')}%`); 
        
        screen.render();
        
        if (currentStep >= totalSteps) {
            clearInterval(fakeLoadingInterval);
            
            // Garantir 100% no último frame
            pixelLoadingBar.setContent('█'.repeat(totalBlocks)); 
            percentageText.setContent('100%'); 
            screen.render();

            // Inicia o menu principal
            setTimeout(() => {
                if (containerBox) containerBox.destroy();
                splashScreenBox = null;
                startMainMenu();
            }, stepInterval); 
        }
    }, stepInterval);
}


function showSplashScreen() {
    safeDestroyScreen(); 
    
    screen = blessed.screen({
        smartCSR: true,
        title: 'Pale Luna DEV'
    });

    // Estágio 1: STUDIO LOGO (PALE LUNA DEV PRESENTS) - Centralizado
    splashScreenBox = blessed.box({
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        content: STUDIO_LOGO, // Conteúdo inicial
        tags: true,
        valign: 'middle', // CENTRALIZA VERTICALMENTE
        style: { fg: 'white', bold: true, bg: 'black' }
    });
    screen.append(splashScreenBox);

    screen.key(['escape', 'q', 'C-c'], function() {
        if (tocando) try { execSync('taskkill /IM vlc.exe /F'); } catch (e) {}
        safeDestroyScreen();
        process.exit(0);
    });

    screen.render();
    
    // Transição após 1 segundo (1000ms)
    setTimeout(() => {
        if (!splashScreenBox) return;

        // Estágio 2: JOGO LOGO ASCII + BARRA DE CARREGAMENTO
        
        // 1. Define o novo conteúdo com a arte complexa (PALE_LUNA_LOGO_ASCII)
        // Adiciona a tag {center} para centralizar horizontalmente.
        const centeredAsciiLogo = `\n{center}${PALE_LUNA_LOGO_ASCII}{/center}`; 
        splashScreenBox.setContent(centeredAsciiLogo);
        splashScreenBox.setLabel('');
        // Mantemos valign: 'middle' (centralizado verticalmente)
        
        // 2. Iniciar a barra de carregamento falsa
        startFakeLoadingFixed(splashScreenBox);

    }, 1000); // 1 segundo para o Studio Logo

}


function createBlessedScreen(isMainMenu = false) {
    if (screen && !isMainMenu) return; 

    if (!screen) {
        screen = blessed.screen({
            smartCSR: true,
            title: 'Pale Luna: Echoes Of The Night'
        });
        
        screen.key(['escape', 'q', 'C-c'], function() {
            if (tocando) try { execSync('taskkill /IM vlc.exe /F'); } catch (e) {}
            safeDestroyScreen();
            process.exit(0);
        });
    }

    // MENU PRINCIPAL: Usa o logo simples (PALE_LUNA_LOGO) e centraliza-o no topo.
    logoBox = blessed.box({
        top: 'top', left: 3, width: '90%', height: 14, // ALTERADO: left: 'center' para left: 1
        content: PALE_LUNA_LOGO, // ALTERADO: Removida a tag {center}
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

    // INÍCIO: MELHORIA VISUAL DO PAUSE BOX 
    pauseBox = blessed.box({
        top: 'center', left: 'center', width: '70%', height: '30%',
        hidden: true,
        border: { type: 'line' },
        style: { 
            fg: 'white', 
            // Fundo um pouco mais escuro que o preto (se o terminal suportar hex, senão usa 'black')
            bg: '#1a1a1a', 
            // Borda vermelha mais intensa
            border: { fg: 'red' } 
        }, 
        content: ''
    });
    screen.append(pauseBox);
    // FIM: MELHORIA VISUAL DO PAUSE BOX


    footer = blessed.text({
        bottom: 0, left: 0, width: '100%', height: 1,
        content: 'Use the ↑/↓ arrow keys and Enter. Press Q or Ctrl+C to exit.',
        style: { fg: 'yellow', bg: 'black' }
    });
    screen.append(footer);

    menuList.on('select', async (item, index) => {
        if (paused) return;
        menuList.interactive = false;
        try {
            await handleSelection(index);
        } catch (e) {
            blessedPause(`[CRITICAL HANDLER ERROR]\n${e.message}`, () => {
                changeMenu(currentMenu, menuItemsMap[currentMenu].items, menuItemsMap[currentMenu].label);
            });
        } finally {
            if (!paused && !accountForm) { 
                menuList.interactive = true;
                try { menuList.focus(); } catch(e){}
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
    // Destruir formulário se houver
    if (accountForm) {
        accountForm.destroy();
        accountForm = null;
        contentBox.setContent('Select an option.'); // Restaura o conteúdo padrão
        contentBox.setLabel(` ${label} `);
        contentBox.style.border.fg = 'green';
    }
    try { menuList.focus(); } catch (e) {}
    updateContent(label, 'Select an option.');
    if (screen) screen.render();
}

// INÍCIO: REFINAMENTO DO BLESSED PAUSE
function blessedPause(message, callback) {
    paused = true;
    if (menuList) menuList.interactive = false;
    if (accountForm) {
        accountForm.hide();
    }


    // Content formatted to be more impactful (Translated from user's request)
    const formattedMessage = `
[SYSTEM ALERT]
  
${message}

[PRESS ANY KEY TO CONTINUE]
`;

    pauseBox.setLabel(` ALERT `);
    pauseBox.style.border.fg = 'red'; 
    pauseBox.style.bg = 'black'; 
    pauseBox.setContent(formattedMessage);
    pauseBox.show();
    pauseBox.focus(); // Ensure focus on the pause box
    if (screen) screen.render();

    // 🛑 CRITICAL FIX: Adds a small delay before attaching the keypress listener.
    // This ignores any residual terminal input ("TTY noise") that prematurely executes the callback.
    setTimeout(() => {
        screen.once('keypress', (ch, key) => {
            paused = false;
            pauseBox.hide();
            
            if (accountForm) {
                accountForm.show();
                if (accountForm.children[1]) { 
                    accountForm.children[1].focus();
                }
            }
            else if (menuList) { 
                menuList.interactive = true;
                try { menuList.focus(); } catch(e){}
            }

            // Ensure screen.render() is called at the end of the flow
            if (screen) screen.render();
            
            if (typeof callback === 'function') callback();
        });
    }, 100); // 100ms delay is usually enough to ignore TTY noise
}
// FIM: REFINAMENTO DO BLESSED PAUSE

function tocamusic() {
    if (!fs.existsSync(MUSIC_PATH) || !fs.existsSync(VLC_EXE)) {
        blessedPause("[SOUNDTRACK]\nAudio file or vlc.exe not found.");
        return;
    }
    const cmd = `"${VLC_EXE}" --play-and-exit --qt-start-minimized "${MUSIC_PATH}"`;
    try {
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

function createAccountBlessed(isOverwrite = false) {
    
    if (accountForm) {
        accountForm.destroy();
        accountForm = null;
    }
    
    contentBox.setContent('');
    contentBox.setLabel(` ACCOUNT CREATION `);
    contentBox.style.border.fg = 'yellow'; 
    if (menuList) menuList.interactive = false; 
    
    accountForm = blessed.form({
        parent: contentBox,
        keys: true,
        left: 'center',
        top: 'center',
        width: '80%',
        height: '80%',
        content: `\n{center}{bold} ${isOverwrite ? 'OVERWRITE ACCOUNT' : 'CREATE NEW ACCOUNT'} {/bold}{/center}\n\n`,
        tags: true
    });

    blessed.text({
        parent: accountForm,
        top: 3,
        left: 2,
        content: '{bold}USERNAME:{/bold}',
        tags: true
    });
    const usernameInput = blessed.textbox({
        parent: accountForm,
        inputOnFocus: true,
        mouse: true,
        keys: true,
        top: 3,
        left: 15,
        width: '70%',
        height: 1,
        style: { fg: 'black', bg: 'white', focus: { bg: 'cyan' } }
    });

    blessed.text({
        parent: accountForm,
        top: 5,
        left: 2,
        content: '{bold}PASSWORD:{/bold}',
        tags: true
    });
    const passwordInput = blessed.textbox({
        parent: accountForm,
        inputOnFocus: true,
        mouse: true,
        keys: true,
        censor: true, 
        top: 5,
        left: 15,
        width: '70%',
        height: 1,
        style: { fg: 'black', bg: 'white', focus: { bg: 'cyan' } }
    });
    
    const createButton = blessed.button({
        parent: accountForm,
        mouse: true,
        keys: true,
        shrink: true,
        padding: { left: 1, right: 1 },
        left: 'center',
        top: 8,
        content: '{bold}CREATE ACCOUNT{/bold}',
        tags: true,
        style: {
            fg: 'white',
            bg: 'green',
            focus: { bg: 'lime', fg: 'black' }
        }
    });

    const backButton = blessed.button({
        parent: accountForm,
        mouse: true,
        keys: true,
        shrink: true,
        padding: { left: 1, right: 1 },
        left: 'center',
        top: 10,
        content: '{bold}CANCEL / BACK{/bold}',
        tags: true,
        style: {
            fg: 'white',
            bg: 'red',
            focus: { bg: 'yellow', fg: 'black' }
        }
    });

    createButton.on('press', () => {
        const usuario = usernameInput.getValue().trim();
        const senha = passwordInput.getValue(); 

        if (!usuario || !senha) {
            blessedPause("[ERROR]\nUsername and password cannot be empty.");
            return;
        }

        const conteudo = `[NAME]: ${usuario}\r\n[PASSWORD]: ${senha}\r\n[LANGUAGE]: English\r\n`;

        let resultMessage = '';
        try {
            ensureDir(ACCOUNT_DIR);
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
        
        accountForm.destroy();
        accountForm = null;
        blessedPause(resultMessage, () => {
            changeMenu('settings', settingsMenuItems, 'SETTINGS');
        });
    });
    
    backButton.on('press', () => {
        accountForm.destroy();
        accountForm = null;
        blessedPause("[ACCOUNT CREATION CANCELED]", () => {
            changeMenu('settings', settingsMenuItems, 'SETTINGS');
        });
    });

    usernameInput.focus();
    screen.render();
}


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
                        execSync(`node "${path.join(__dirname, 'mainEN.js')}"`, { stdio: 'inherit' });
                    } catch (e) {
                        console.error("Error starting game:", e.message);
                    }
                    process.exit(0);
                    break;
                case 'RESTART PROGRESS':
                    exec('start cmd.exe /c node eraseData.js', (error) => {
                        const msg = error ? `[ERROR: FILE FAILED ${error.message}]` : '\n[RESTART PROGRESS COMPLETED]\n';
                        blessedPause(`PROGRESS RESTARTING...${msg}`);
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
                        "[OUR TEAM]\nProgramming:\nLucas Eduardo\n\nBeta Testers:\nIsabella Sanches, Kayc Felix and Luiz Otávio\n\nScript:\nLucas Eduardo\n\nArt:\nLucas Eduardo\n\n" +
                        "Music:\nRyan Creep (Youtube.com)\n\nSpecial Thanks:\nSENAI Team\n\nTHANK YOU FOR PLAYING OUR GAME!");
                    break;
                case 'SUPPORT':
                    changeMenu('support', supportMenuItems, 'SUPPORT THE GAME');
                    updateContent('SUPPORT THE GAME',
                        "If you want to support the game's development, you can make a donation,\nany amount is welcome and helps a lot with the game's development!\n" +
                        "You can also leave a review on the game page!\n\nDonation link: https://the-last-deploy.itch.io/pale-luna\n\n[OPEN?]");
                    break;
                case 'EXIT':
                    if (tocando) try { execSync('taskkill /IM vlc.exe /F'); } catch(e){}
                    safeDestroyScreen();
                    process.exit(0);
                    break;
                default:
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
                        createAccountBlessed(false); 
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
                if (tocando) try { execSync('taskkill /IM vlc.exe /F'); } catch(e){}
                
                // 🛑 PAUSA COM INSTRUÇÃO EM INGLÊS (Alerta sobre o bug de TTY):
                blessedPause(
                    "[CRITICAL PROCESS WARNING]\n\n" +
                    "The game will RESTART (LANGUAGE SWAP).\n" +
                    "IF THE TERMINAL DISPLAYS VISUAL ERRORS ('^[['), IT IS EXPECTED.\n" +
                    "ACTION: Upon seeing the menu, press **ENTER** ONCE to re-establish control.\n\n" +
                    "[PRESS ANY KEY TO PROCEED WITH RESTART]"
                , () => {
                    // Lógica de troca, executada DEPOIS do aviso
                    safeDestroyScreen();
                    try {
                        execSync(`node "${BR_MENU_FILE}"`, { stdio: 'inherit' });
                        process.exit(0);
                    } catch (error) {
                        console.error(`[CRITICAL ERROR]: Failed to start BR Menu: ${error.message}`);
                        // Recria a tela em EN para dar a mensagem de erro
                        createBlessedScreen(true);
                        blessedPause(`[LANGUAGE SWAP FAILED]\nError: ${error.message}`, () => {
                            changeMenu('settings', settingsMenuItems, 'SETTINGS');
                        });
                    }
                });
                
                // CRÍTICO: O 'return' garante que a execução do handleSelection pare.
                return; 

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
                    createAccountBlessed(false);
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
                createAccountBlessed(true); 
            } else {
                blessedPause("[OVERWRITE CANCELED]", () => {
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
                    try { exec('start https://the-last-deploy.itch.io/pale-luna'); } catch (e) {}
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

showSplashScreen();