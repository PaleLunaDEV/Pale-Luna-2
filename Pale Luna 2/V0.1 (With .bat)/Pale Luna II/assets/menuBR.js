// menuBR_fixed.js
// Refatorado e corrigido para criação de conta e fluxo TUI (Blessed)
// Baseado nas melhorias de UI e funcionalidade do menuEN.js

const readline = require('readline');
const { exec, execSync } = require('child_process');
const prompt = require('prompt-sync')();
const fs = require('fs');
const path = require('path');
const blessed = require('blessed');

// =====================
// Constantes de caminho
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

const EN_MENU_FILE = path.join(__dirname, 'MenuEN.js');
const CURRENT_MENU_FILE = path.join(__dirname, 'MenuBR.js');

// =====================
// Garantir estrutura de pastas
// =====================
function ensureDir(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    } catch (e) {
        console.error(`Falha ao garantir diretório ${dirPath}: ${e.message}`);
    }
}

ensureDir(ACCOUNT_DIR);
ensureDir(ACH_FOLDER);
ensureDir(path.join(ASSETS_DIR, 'audios'));

// =====================
// Variáveis de estado
// =====================
let screen = null;
let logoBox = null;
let menuList = null;
let contentBox = null;
let footer = null;
let pauseBox = null;
let splashScreenBox = null; // NOVO: Para a splash screen
let accountForm = null;     // NOVO: Para o formulário de conta TUI

let currentMenu = 'main';
let tocando = false;
let paused = false;

const MIN_WIDTH = 120;
const MIN_HEIGHT = 30;

// LOGO PARA O MENU PRINCIPAL (SIMPLES)
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
{center}{yellow-fg}A P R E S E N T A{/yellow-fg}{/center}
`;

// =====================
// Menus e mapas
// =====================
const mainMenuItems = [
    'INICIAR JOGO', 'REINICIAR PROGRESSO', 'CONQUISTAS', 'CONFIGURAÇÕES',
    'CRÉDITOS', 'SUPORTE', 'SAIR'
];
const settingsMenuItems = [
    'Trilha Sonora', 'Criação de conta', 'Restauração de finais',
    'Easter Eggs', 'Idioma', 'Voltar para o menu principal'
];
const musicOptionItems = [
    'Ativar Trilha Sonora', 'Desativar Trilha Sonora', 'Voltar'
];
const accountOptionItems = [
    'Criar Conta', 'Pular', 'Voltar'
];
const overwriteOptionItems = [
    'Sim, Sobrescrever', 'Não, Voltar'
];
const easterEggsMenuItems = [
    'Ativar Easter Eggs', 'Desativar Easter Eggs', 'Voltar ao menu de configurações'
];
const restoreMenuItems = [
    'Sim, Restaurar', 'Não, Voltar', 'Verificar Pasta'
];
const supportMenuItems = [
    'Sim, Abrir Link', 'Não, Voltar'
];
const languageMenuItems = [
    'PT (BR)', 'EN (US)', 'Voltar'
];

const menuItemsMap = {
    'main': { items: mainMenuItems, label: 'MENU PRINCIPAL' },
    'settings': { items: settingsMenuItems, label: 'CONFIGURAÇÕES' },
    'music': { items: musicOptionItems, label: 'TRILHA SONORA' },
    'account': { items: accountOptionItems, label: 'CRIAÇÃO DE CONTA' },
    'overwrite': { items: overwriteOptionItems, label: 'SOBRESCREVER CONTA' },
    'easterEggs': { items: easterEggsMenuItems, label: 'EASTER EGGS' },
    'restore': { items: restoreMenuItems, label: 'RESTAURAR FINAIS' },
    'support': { items: supportMenuItems, label: 'APOIE O JOGO' },
    'language': { items: languageMenuItems, label: 'IDIOMA' },
};

// =====================
// Utilitários de arquivo e Checagens iniciais
// (Preservado o código "anti-cheat" do arquivo original)
// =====================
function conquistaannoying(nomeArquivo) {
    const caminhoCompleto = path.join(ACH_FOLDER, nomeArquivo);
    try { return fs.existsSync(caminhoCompleto); } catch (e) { return false; }
}

function lerNumeroDoArquivo(nomeDoArquivoRelativo) {
    const caminhoCompleto = path.join(BASE_DIR, nomeDoArquivoRelativo);
    try {
        if (!fs.existsSync(caminhoCompleto)) return 0;
        const conteudoDoArquivo = fs.readFileSync(caminhoCompleto, 'utf8');
        const numeroLido = parseInt(conteudoDoArquivo.trim(), 10);
        return isNaN(numeroLido) ? 0 : numeroLido;
    } catch (erro) {
        return 0;
    }
}

const ARQUIVO_SECRETO = 'SECRET_ENDING.bin';
const ARQUIVO_TRAPACA = 'HAHAHAHAHAHAHA.txt';
let jogadortem = conquistaannoying(ARQUIVO_SECRETO);
const numeroTrap = lerNumeroDoArquivo(ARQUIVO_TRAPACA);

if (numeroTrap === 3) {
    try { exec('start cmd.exe /c goodbye.bat'); } catch (e) {}
    console.log("-> HAHAHAH... encerrando.");
    process.exit(0);
} else if (numeroTrap === 2) {
    console.clear();
    console.log("-> Você NUNCA teve controle neste mundo...");
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
// FUNÇÕES BLESSED / UI
// =====================

function safeDestroyScreen() {
    try {
        if (screen) {
            screen.destroy();
            screen = null;
            logoBox = menuList = contentBox = footer = pauseBox = splashScreenBox = accountForm = null;
        }
    } catch (e) {
        // ignore
    }
}

function startMainMenu() {
    createBlessedScreen(true);
    changeMenu('main', mainMenuItems, 'MENU PRINCIPAL');
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

    // Caixa para o texto "CARREGANDO..."
    const loadingText = blessed.text({
        parent: containerBox,
        // Posição ajustada para a barra ficar logo abaixo do logo centralizado
        top: '70%', 
        left: 'center',
        width: 'shrink',
        height: 1,
        content: '{bold}CARREGANDO...{/bold}',
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
            title: 'Pale Luna: Echoes Of The Night',
            // Adicionar as duas linhas abaixo é o que resolve o problema:
            input: process.stdin,
            terminal: 'xterm-256color' // Ou 'xterm'
        });
        
        // Assegurar que a TTY está em modo raw
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
            // Captura o input
            screen.program.key(['up', 'down', 'enter', 'escape'], (ch, key) => {
                screen.emit('keypress', ch, key);
            });
        }
        
        screen.key(['escape', 'q', 'C-c'], function() {
            if (tocando) try { execSync('taskkill /IM vlc.exe /F'); } catch (e) {}
            safeDestroyScreen();
            process.exit(0);
        });
    }
    
    // NOVO: Ajuste de posicionamento para o logo simples (como no EN)
    logoBox = blessed.box({
        top: 'top', left: 3, width: '90%', height: 14, 
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

    // REFINAMENTO VISUAL DO PAUSE BOX (Baseado no EN)
    pauseBox = blessed.box({
        top: 'center', left: 'center', width: '70%', height: '30%',
        hidden: true,
        border: { type: 'line' },
        style: { 
            fg: 'white', 
            bg: '#1a1a1a', // Fundo mais escuro
            border: { fg: 'red' } 
        }, 
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
        menuList.interactive = false;
        try {
            await handleSelection(index);
        } catch (e) {
            blessedPause(`[ERRO CRÍTICO NO HANDLER]\n${e.message}`, () => {
                changeMenu(currentMenu, menuItemsMap[currentMenu].items, menuItemsMap[currentMenu].label);
            });
        } finally {
            if (!paused && !accountForm) { // Verifica se não está pausado ou no formulário
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
    // NOVO: Destruir formulário se houver (como no EN)
    if (accountForm) {
        accountForm.destroy();
        accountForm = null;
        contentBox.setContent('Selecione uma opção.'); // Restaura o conteúdo padrão
        contentBox.setLabel(` ${label} `);
        contentBox.style.border.fg = 'green';
    }
    try { menuList.focus(); } catch (e) {}
    updateContent(label, 'Selecione uma opção.');
    if (screen) screen.render();
}

// PAUSA interna (Blessed) - Versão aprimorada do EN
function blessedPause(message, callback) {
    paused = true;
    if (menuList) menuList.interactive = false;
    if (accountForm) {
        accountForm.hide();
    }


    // Conteúdo formatado para ser mais impactante
    const formattedMessage = `
[ALERTA DO SISTEMA]
  
${message}

[PRESSIONE QUALQUER TECLA PARA CONTINUAR]
`;

    pauseBox.setLabel(` ALERTA `);
    pauseBox.style.border.fg = 'red'; 
    pauseBox.style.bg = 'black'; 
    pauseBox.setContent(formattedMessage);
    pauseBox.show();
    pauseBox.focus(); // Garantir foco no box de pausa
    if (screen) screen.render();

    // 🛑 CRÍTICO: Adiciona um pequeno atraso antes de anexar o listener de keypress.
    // Isso ignora qualquer evento de tecla residual do terminal (o "lixo" TTY)
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

            // Garante que o screen.render() seja chamado no final do fluxo
            if (screen) screen.render();
            
            if (typeof callback === 'function') callback();
        });
    }, 100); // 100ms de atraso é geralmente suficiente para ignorar ruído TTY
}

// =====================
// Ações (música, conquistas, criar conta TUI)
// =====================

function tocamusic() {
    if (!fs.existsSync(MUSIC_PATH) || !fs.existsSync(VLC_EXE)) {
        blessedPause("[TRILHA SONORA]\nArquivo de áudio ou vlc.exe não encontrado.");
        return;
    }
    const cmd = `"${VLC_EXE}" --play-and-exit --qt-start-minimized "${MUSIC_PATH}"`;
    try {
        exec(`start /min "" ${cmd}`, (err) => {});
    } catch (e) {
        console.error("Falha ao iniciar música:", e.message);
    }
}

async function conquistasBlessed() {
    let finais = [];
    try {
        finais = fs.readdirSync(ACH_FOLDER).filter(f => f.endsWith('.bin'));
    } catch (e) {
        updateContent('CONQUISTAS', `[ERRO DE ARQUIVO]: Não foi possível ler a pasta de conquistas. ${e.message}`);
        if (menuList) menuList.focus();
        return;
    }

    const count = finais.length;
    let content = "\nVERIFICANDO PASTAS...\n\n";
    if (count > 0) {
        content += `[${count} ARQUIVOS ENCONTRADOS]\n${finais.join('\n')}\n\n-> Se você quiser manter esses finais, NÃO OS RESTAURE.`;
    } else {
        content += "[NENHUM ARQUIVO DE FINAL ENCONTRADO]";
    }
    updateContent('CONQUISTAS', content);
    if (menuList) menuList.focus();
}

/**
 * NOVO: Implementação do Formulário TUI (Blessed) para Criação de Conta
 * Substitui o fluxo que quebrava para o console nativo (`createAccountBlessedAndPause` removido).
 * @param {boolean} isOverwrite - Se deve tratar como uma sobrescrita.
 */
function createAccountBlessed(isOverwrite = false) {
    
    if (accountForm) {
        accountForm.destroy();
        accountForm = null;
    }
    
    // Configura o contentBox para ser o contêiner do formulário
    contentBox.setContent('');
    contentBox.setLabel(` CRIAÇÃO DE CONTA `);
    contentBox.style.border.fg = 'yellow'; 
    if (menuList) menuList.interactive = false; 
    
    accountForm = blessed.form({
        parent: contentBox,
        keys: true,
        left: 'center',
        top: 'center',
        width: '80%',
        height: '80%',
        content: `\n{center}{bold} ${isOverwrite ? 'SOBRESCREVER CONTA' : 'CRIAR NOVA CONTA'} {/bold}{/center}\n\n`,
        tags: true
    });

    blessed.text({
        parent: accountForm,
        top: 3,
        left: 2,
        content: '{bold}NOME DE USUÁRIO:{/bold}',
        tags: true
    });
    const usernameInput = blessed.textbox({
        parent: accountForm,
        inputOnFocus: true,
        mouse: true,
        keys: true,
        top: 3,
        left: 19, // Ajuste de posição para PT
        width: '65%', // Ajuste de largura
        height: 1,
        style: { fg: 'black', bg: 'white', focus: { bg: 'cyan' } }
    });

    blessed.text({
        parent: accountForm,
        top: 5,
        left: 2,
        content: '{bold}SENHA:{/bold}',
        tags: true
    });
    const passwordInput = blessed.textbox({
        parent: accountForm,
        inputOnFocus: true,
        mouse: true,
        keys: true,
        censor: true, 
        top: 5,
        left: 19, // Ajuste de posição para PT
        width: '65%', // Ajuste de largura
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
        content: '{bold}CRIAR CONTA{/bold}',
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
        content: '{bold}CANCELAR / VOLTAR{/bold}',
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
            blessedPause("[ERRO]\nNome de usuário e senha não podem estar vazios.");
            return;
        }

        const conteudo = `[NOME]: ${usuario}\r\n[SENHA]: ${senha}\r\n[IDIOMA]: Português\r\n`; // Idioma correto

        let resultMessage = '';
        try {
            ensureDir(ACCOUNT_DIR);
            fs.writeFileSync(ACCOUNT_FILE, conteudo, 'utf8');

            let finais = [];
            try {
                finais = fs.readdirSync(ACH_FOLDER).filter(f => f.endsWith('.bin'));
            } catch (e) { /* ignora, não crítico */ }

            if (finais.length > 0) {
                fs.writeFileSync(ACH_SAVE_FILE, finais.join('\r\n'), 'utf8');
                resultMessage = "[SISTEMA]: Conta criada com sucesso! Seus finais estão salvos.";
            } else {
                resultMessage = "[SISTEMA]: Conta criada com sucesso! Você não tem finais ainda.";
            }
        } catch (errWrite) {
            resultMessage = `[ERRO CRÍTICO]: Falha ao criar arquivo de conta ou salvamento. ${errWrite.message}`;
        }
        
        // Destrói o formulário e pausa
        accountForm.destroy();
        accountForm = null;
        blessedPause(resultMessage, () => {
            changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
        });
    });
    
    backButton.on('press', () => {
        accountForm.destroy();
        accountForm = null;
        blessedPause("[CRIAÇÃO DE CONTA CANCELADA]", () => {
            changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
        });
    });

    usernameInput.focus();
    screen.render();
}

// =====================
// Handler de seleção (Lógica atualizada para usar createAccountBlessed)
// =====================
async function handleSelection(index) {
    if (!menuList) return;
    const itemObj = menuList.getItem(index);
    if (!itemObj) return;
    const selectedItem = (itemObj.getText ? itemObj.getText() : String(itemObj)).trim();

    try {
        if (currentMenu === 'main') {
            switch (selectedItem) {
                case 'INICIAR JOGO':
                    if (tocando) try { execSync('taskkill /IM vlc.exe /F'); } catch(e){}
                    safeDestroyScreen();
                    try {
                        execSync(`node "${path.join(__dirname, 'mainBR.js')}"`, { stdio: 'inherit' });
                    } catch (e) {
                        console.error("Erro ao iniciar jogo:", e.message);
                    }
                    process.exit(0);
                    break;
                case 'REINICIAR PROGRESSO':
                    exec('start cmd.exe /c node eraseData.js', (error) => {
                        const msg = error ? `[ERRO: ARQUIVO FALHOU ${error.message}]` : '[PROGRESSO REINICIADO]';
                        blessedPause(`[REINICIAR PROGRESSO]\n${msg}`);
                    });
                    break;
                case 'CONQUISTAS':
                    await conquistasBlessed();
                    break;
                case 'CONFIGURAÇÕES':
                    changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
                    break;
                case 'CRÉDITOS':
                    updateContent('CRÉDITOS',
                                            "[NOSSA EQUIPE]\nProgramação:\nLucas Eduardo\n\nTestadores Beta:\nIsabella Sanches, Kayc Felix e Luiz Otávio\n\nRoteiro:\nLucas Eduardo\n\nArtes:\nLucas Eduardo\n\n" +
                                            "Música:\nRyan Creep (Youtube.com)\n\nAgradecimentos especiais:\nEquipe do SENAI\n\nOBRIGADO POR JOGAR NOSSO JOGO!");
                                        break;
                                    case 'SUPORTE':
                                        changeMenu('support', supportMenuItems, 'APOIE O JOGO');
                                        updateContent('APOIE O JOGO',
                                            "Se você quiser apoiar o desenvolvimento do jogo, você pode fazer uma doação,\nqualquer valor é bem-vindo e ajuda muito com o desenvolvimento do jogo!\n" +
                                            "Você também pode deixar uma avaliação na página do jogo!\n\nLink para doação: https://the-last-deploy.itch.io/pale-luna\n\n[ABRIR?]"); // Link atualizado
                                        break;
                                    case 'SAIR':
                                        if (tocando) try { execSync('taskkill /IM vlc.exe /F'); } catch(e){}
                                        safeDestroyScreen();
                                        process.exit(0);
                                        break;
                                    default:
                                        // ação padrão
                                        break;
                                }
                            } else if (currentMenu === 'settings') {
                                switch (selectedItem) {
                                    case 'Trilha Sonora':
                                        changeMenu('music', musicOptionItems, 'TRILHA SONORA');
                                        break;
                                    case 'Criação de conta':
                                        if (fs.existsSync(ACCOUNT_FILE)) {
                                            changeMenu('overwrite', overwriteOptionItems, 'SOBRESCREVER CONTA');
                                            updateContent('SOBRESCREVER CONTA', "[EXISTE UM ARQUIVO DE CONTA, DESEJA SOBRESCREVE-LO?]");
                                        } else {
                                            createAccountBlessed(false); // ATUALIZADO: Chama a nova função TUI
                                        }
                                        break;
                                    case 'Restauração de finais':
                                        changeMenu('restore', restoreMenuItems, 'RESTAURAR FINAIS');
                                        break;
                                    case 'Easter Eggs':
                                        changeMenu('easterEggs', easterEggsMenuItems, 'EASTER EGGS');
                                        break;
                                    case 'Idioma':
                                        changeMenu('language', languageMenuItems, 'IDIOMA');
                                        break;
                                    case 'Voltar para o menu principal':
                                        changeMenu('main', mainMenuItems, 'MENU PRINCIPAL');
                                        break;
                                }
                            } else if (currentMenu === 'language') {
                                if (selectedItem === 'EN (US)') {
                                    if (tocando) try { execSync('taskkill /IM vlc.exe /F'); } catch(e){}
                                    
                                    // 🛑 PAUSA FORÇADA: O aviso deve ser visto antes da execução síncrona.
                                    blessedPause(
                                        "[AVISO CRÍTICO DE PROCESSO]\n\n" +
                                        "O jogo será REINICIADO (TROCA DE IDIOMA).\n" +
                                        "SE O TERMINAL APRESENTAR ERROS VISUAIS ('^[['), É ESPERADO.\n" +
                                        "AÇÃO: Ao ver o menu, pressione **ENTER** UMA VEZ para restabelecer o controle.\n\n" +
                                        "[PRESSIONE QUALQUER TECLA PARA PROSSEGUIR COM A REINICIALIZAÇÃO]"
                                    , () => {
                                        // Ação de troca para EN (Lógica original, executada DEPOIS do aviso)
                                        safeDestroyScreen();
                                        try {
                                            // Mantém execSync, conforme solicitado
                                            execSync(`node "${EN_MENU_FILE}"`, { stdio: 'inherit' });
                                            process.exit(0);
                                        } catch (error) {
                                            console.error(`[ERRO CRÍTICO]: Falha ao iniciar Menu EN: ${error.message}`);
                                            createBlessedScreen(true);
                                            blessedPause(`[FALHA NA TROCA DE IDIOMA]\nErro: ${error.message}`, () => {
                                                changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
                                            });
                                        }
                                    });
                                    
                                    // 🛑 CRÍTICO: O 'return' impede que o handleSelection continue rodando
                                    // antes que a pausa seja resolvida pelo usuário.
                                    return; 
                                    
                                } else if (selectedItem === 'PT (BR)') {
                                    blessedPause("[SISTEMA]\nJá está em Português (BR).", () => {
                                        changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
                                    });
                                } else if (selectedItem === 'Voltar') {
                                    changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
                                }
                            } else if (currentMenu === 'music') {
                                let message = '';
                                if (selectedItem.includes('Ativar') || selectedItem.includes('Desativar')) {
                                    if (selectedItem.includes('Ativar')) {
                                        if (tocando) { message = "[A MÚSICA JÁ ESTÁ TOCANDO]"; }
                                        else { tocamusic(); tocando = true; message = "[TRILHA SONORA INICIADA]"; }
                                    } else if (selectedItem.includes('Desativar')) {
                                        if (tocando) { try { execSync('taskkill /IM vlc.exe /F'); } catch(e){} tocando = false; message = "[MÚSICA PARADA]"; }
                                        else { message = "[A MÚSICA JÁ ESTÁ PARADA]"; }
                                    }
                                    blessedPause(`[TRILHA SONORA]\n${message}`, () => {
                                        changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
                                    });
                                } else if (selectedItem.includes('Voltar')) {
                                    changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
                                }
                            } else if (currentMenu === 'account') {
                                if (selectedItem === 'Criar Conta') {
                                    if (fs.existsSync(ACCOUNT_FILE)) {
                                        changeMenu('overwrite', overwriteOptionItems, 'SOBRESCREVER CONTA');
                                        updateContent('SOBRESCREVER CONTA', "[EXISTE UM ARQUIVO DE CONTA, DESEJA SOBRESCREVE-LO?]");
                                    } else {
                                        createAccountBlessed(false); // ATUALIZADO: Chama a nova função TUI
                                    }
                                } else if (selectedItem === 'Pular') {
                                    blessedPause("[CRIAÇÃO DE CONTA PULADA]", () => {
                                        changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
                                    });
                                } else if (selectedItem === 'Voltar') {
                                    changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
                                }
                            } else if (currentMenu === 'overwrite') {
                                if (selectedItem.includes('Sim')) {
                                    createAccountBlessed(true); // ATUALIZADO: Chama a nova função TUI
                                } else {
                                    blessedPause("[SOBRESCRIÇÃO CANCELADA]", () => { // Mensagem mais precisa
                                        changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
                                    });
                                }
                            } else if (currentMenu === 'easterEggs') {
                                let message = '';
                                if (selectedItem.includes('Ativar') || selectedItem.includes('Desativar')) {
                                    if (selectedItem.includes('Ativar')) {
                                        if (fs.existsSync(ET_FILE)) { message = "[EASTER EGGS JÁ ESTÃO ATIVADOS]"; }
                                        else { fs.writeFileSync(ET_FILE, 'Easter Eggs Activated', 'utf8'); message = "[EASTER EGGS ATIVADOS!]"; }
                                    } else {
                                        if (!fs.existsSync(ET_FILE)) { message = "[EASTER EGGS JÁ ESTÃO DESATIVADOS]"; }
                                        else { fs.unlinkSync(ET_FILE); message = "[EASTER EGGS DESATIVADOS!]"; }
                                    }
                                    blessedPause(`[EASTER EGGS]\n${message}`, () => {
                                        changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
                                    });
                                } else if (selectedItem.includes('Voltar')) {
                                    changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
                                }
                            } else if (currentMenu === 'restore') {
                                let message = '';
                                let finaisPasta = [];
                                try { finaisPasta = fs.readdirSync(ACH_FOLDER).filter(f => f.endsWith('.bin')); } catch (e) { /* ignora */ }
                    
                                if (selectedItem.includes('Sim')) {
                                    if (!fs.existsSync(ACH_SAVE_FILE)) {
                                        message = "[ARQUIVO DE FINAIS SALVOS NÃO ENCONTRADO]";
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
                                            if (restored.length > 0) { message = `[FINAIS RESTAURADOS COM SUCESSO]:\n${restored.join('\n')}`; }
                                            else { message = "[FINAIS JÁ ESTAVAM PRESENTES NA PASTA]"; }
                                        } catch (err) {
                                            message = `[ERRO]: Falha ao ler ou restaurar arquivos: ${err.message}`;
                                        }
                                    }
                                    blessedPause(`[RESTAURAR FINAIS]\n${message}`, () => {
                                        changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
                                    });
                                } else if (selectedItem.includes('Não')) {
                                    blessedPause("[RESTAURAÇÃO CANCELADA]", () => {
                                        changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
                                    });
                                } else if (selectedItem.includes('Verificar')) {
                                    if (finaisPasta.length > 0) {
                                        updateContent('VERIFICAÇÃO DE FINAIS', `[ARQUIVOS ENCONTRADOS NO PROGRESSO ATUAL]:\n${finaisPasta.join('\n')}\n\n-> Se você quiser manter esses finais, NÃO OS RESTAURE`);
                                    } else {
                                        updateContent('VERIFICAÇÃO DE FINAIS', "[NENHUM FINAL ENCONTRADO!]");
                                    }
                                    if (menuList) menuList.focus();
                                }
                            } else if (currentMenu === 'support') {
                                if (selectedItem.includes('Sim')) {
                                    blessedPause("[ABRINDO LINK NO NAVEGADOR PADRÃO...]", () => {
                                        try { exec('start https://the-last-deploy.itch.io/pale-luna'); } catch (e) {}
                                        changeMenu('main', mainMenuItems, 'MENU PRINCIPAL');
                                    });
                                } else {
                                    blessedPause("[OPÇÃO RECUSADA]", () => {
                                        changeMenu('main', mainMenuItems, 'MENU PRINCIPAL');
                                    });
                                }
                            }
                        } catch (error) {
                            blessedPause(`[ERRO CRÍTICO NA AÇÃO]\nOcorreu um erro: ${error.message}`, () => {
                                changeMenu('main', mainMenuItems, 'MENU PRINCIPAL');
                            });
                        }
                    }

// =====================
// INICIALIZAÇÃO (Usa a Splash Screen)
// =====================
showSplashScreen();