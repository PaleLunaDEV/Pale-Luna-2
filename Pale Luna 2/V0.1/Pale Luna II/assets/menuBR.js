// menuBR_fixed.js
// Refatorado e corrigido para criação de conta e fluxo TUI (Blessed)
// Requisitos: node, prompt-sync, blessed

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

// Arquivos de linguagem (se existir)
// (o original referenciava MenuEN.js / MenuBR.js — mantive as variáveis para compatibilidade)
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

let currentMenu = 'main';
let tocando = false;
let paused = false;

const MIN_WIDTH = 120;
const MIN_HEIGHT = 30;

// Logo (simplificado para evitar problemas de render)
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
// Menus e mapas
// =====================
const mainMenuItems = [
    'INICIAR JOGO', 'REINICIAR PROGRESSO', 'CONQUISTAS', 'CONFIGURAÇÕES',
    'CRÉDITOS', 'SUPORTE', 'SAIR'
];
const settingsMenuItems = [
    'TRILHA SONORA', 'CRIAÇÃO DE CONTA', 'RESTAURAÇÃO DE FINAIS',
    'EASTER EGGS', 'IDIOMA', 'VOLTAR AO MENU PRINCIPAL'
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
// Utilitários de arquivo
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

// =====================
// Checagens iniciais (truques antigos preservados)
// =====================
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
            logoBox = menuList = contentBox = footer = pauseBox = null;
        }
    } catch (e) {
        // ignore
    }
}

function createBlessedScreen() {
    // Se já existe, não recria — mas permitir recriação se screen == null
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
        // desabilita interações extras
        menuList.interactive = false;
        try {
            await handleSelection(index);
        } catch (e) {
            blessedPause(`[ERRO CRÍTICO NO HANDLER]\n${e.message}`, () => {
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
    updateContent(label, 'Selecione uma opção.');
    if (screen) screen.render();
}

// =====================
// PAUSA interna (Blessed)
// =====================
function blessedPause(message, callback) {
    paused = true;
    if (menuList) menuList.interactive = false;

    pauseBox.setContent(`[SISTEMA]\n${message}\n\n[PRESSIONE QUALQUER TECLA PARA CONTINUAR]`);
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
// Ações (música, conquistas, criar conta...)
// =====================

function tocamusic() {
    if (!fs.existsSync(MUSIC_PATH) || !fs.existsSync(VLC_EXE)) {
        // não falha silenciosamente — avisa
        blessedPause("[TRILHA SONORA]\nArquivo de áudio ou vlc.exe não encontrado.");
        return;
    }
    const cmd = `"${VLC_EXE}" --play-and-exit --qt-start-minimized "${MUSIC_PATH}"`;
    try {
        // start minimized on windows
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
 * Criação de conta:
 * - Destroi a TUI
 * - Faz I/O no console nativo com prompt-sync
 * - Recria TUI e mostra resultado com blessedPause
 */
async function createAccountBlessedAndPause() {
    // destruir TUI para evitar conflitos de stdin
    safeDestroyScreen();
    console.clear();
    console.log("===========================================================================");
    console.log("                 [CRIAÇÃO DE CONTA - ENTRADA NO CONSOLE]                   ");
    console.log("===========================================================================");

    try {
        const usuario = prompt("[NOME DE USUÁRIO]: ");
        const senha = prompt.hide ? prompt.hide("[SENHA]: ") : prompt("[SENHA]: "); // prompt-sync tem hide em algumas versões
        console.log("===========================================================================");

        const conteudo = `[NOME]: ${usuario}\r\n[SENHA]: ${senha}\r\n[IDIOMA]: Português\r\n`;

        ensureDir(ACCOUNT_DIR);

        let resultMessage = '';
        try {
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

        console.log(`\n[RESULTADO]: ${resultMessage}`);
    } catch (errConsole) {
        console.error("Erro durante a entrada no console:", errConsole.message);
    }

    prompt("Pressione ENTER para retornar ao menu...");

    // recriar a tela TUI
    createBlessedScreen();

    // exibir pausa e retornar para Configurações
    blessedPause("[SISTEMA]\nConta processada com sucesso.", () => {
        changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
    });
}

// =====================
// Handler de seleção
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
                        "[NOSSA EQUIPE]\nProgramação:\nLucas Eduardo\n\nTestadores Beta:\n\nRoteiro:\nLucas Eduardo\n\nArtes:\nLucas Eduardo\n\n" +
                        "Música:\nRyan Creep (Youtube.com)\n\nAgradecimentos especiais:\nEquipe do SENAI\n\nOBRIGADO POR JOGAR NOSSO JOGO!");
                    break;
                case 'SUPORTE':
                    changeMenu('support', supportMenuItems, 'APOIE O JOGO');
                    updateContent('APOIE O JOGO',
                        "Se você quiser apoiar o desenvolvimento do jogo, você pode fazer uma doação,\nqualquer valor é bem-vindo e ajuda muito com o desenvolvimento do jogo!\n" +
                        "Você também pode deixar uma avaliação na página do jogo!\n\nLink para doação: https://the-last-deploy.itch.io/pale-luna-2\n\n[ABRIR?]");
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
                case 'TRILHA SONORA':
                    changeMenu('music', musicOptionItems, 'TRILHA SONORA');
                    break;
                case 'CRIAÇÃO DE CONTA':
                    if (fs.existsSync(ACCOUNT_FILE)) {
                        changeMenu('overwrite', overwriteOptionItems, 'SOBRESCREVER CONTA');
                        updateContent('SOBRESCREVER CONTA', "[EXISTE UM ARQUIVO DE CONTA, DESEJA SOBRESCREVE-LO?]");
                    } else {
                        await createAccountBlessedAndPause();
                    }
                    break;
                case 'RESTAURAÇÃO DE FINAIS':
                    changeMenu('restore', restoreMenuItems, 'RESTAURAR FINAIS');
                    break;
                case 'EASTER EGGS':
                    changeMenu('easterEggs', easterEggsMenuItems, 'EASTER EGGS');
                    break;
                case 'IDIOMA':
                    changeMenu('language', languageMenuItems, 'IDIOMA');
                    break;
                case 'VOLTAR AO MENU PRINCIPAL':
                    changeMenu('main', mainMenuItems, 'MENU PRINCIPAL');
                    break;
            }
        } else if (currentMenu === 'language') {
            if (selectedItem === 'EN (US)') {
                // tenta trocar para menu em inglês salvando estado
                if (tocando) try { execSync('taskkill /IM vlc.exe /F'); } catch(e){}
                safeDestroyScreen();
                try {
                    execSync(`node "${EN_MENU_FILE}"`, { stdio: 'inherit' });
                    process.exit(0);
                } catch (error) {
                    console.error(`[ERRO CRÍTICO]: Falha ao iniciar Menu EN: ${error.message}`);
                    createBlessedScreen();
                    changeMenu('language', languageMenuItems, 'IDIOMA');
                    blessedPause(`[FALHA NA TROCA DE IDIOMA]\nErro: ${error.message}`, () => {
                        changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
                    });
                }
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
                    await createAccountBlessedAndPause();
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
                await createAccountBlessedAndPause();
            } else {
                blessedPause("[CRIAÇÃO DE CONTA CANCELADA]", () => {
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
                    try { exec('start https://the-last-deploy.itch.io/pale-luna-2'); } catch (e) {}
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
// INICIALIZAÇÃO
// =====================
function displayInitialResizeWarning() {
    console.clear();
    console.log("=========================================================");
    console.log("             🚨 AVISO DE TAMANHO DO TERMINAL 🚨           ");
    console.log("=========================================================");
    console.log(`Redimensione o terminal para pelo menos ${MIN_WIDTH}x${MIN_HEIGHT}.`);
    console.log(`Pressione ENTER para verificar o tamanho atual e iniciar.`);
    prompt('');
    while (process.stdout.columns < MIN_WIDTH || process.stdout.rows < MIN_HEIGHT) {
        console.clear();
        console.log("=========================================================");
        console.log("             ⚠️ TAMANHO INSUFICIENTE ⚠️                 ");
        console.log("=========================================================");
        console.log(`Recomendado: ${MIN_WIDTH}x${MIN_HEIGHT}. Atual: ${process.stdout.columns}x${process.stdout.rows}.`);
        console.log("[Ajuste a janela e pressione ENTER para verificar novamente]");
        prompt('');
    }
    console.clear();
    console.log("Tamanho verificado. Iniciando TUI...");
}

displayInitialResizeWarning();
createBlessedScreen();
changeMenu('main', mainMenuItems, 'MENU PRINCIPAL');
