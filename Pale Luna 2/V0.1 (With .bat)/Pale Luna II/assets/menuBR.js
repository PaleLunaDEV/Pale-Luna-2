// ===============================================
// 1. IMPORTS E VARIÁVEIS GLOBAIS
// ===============================================
const readline = require('readline');
const { exec, execSync, spawn } = require('child_process');
const prompt = require('prompt-sync')();
const fs = require('fs');
const path = require('path');
const blessed = require('blessed');

// Constantes de Caminho (Mais Limpas)
const BASE_DIR = path.resolve(__dirname, '..');
const ACH_FOLDER = path.join(BASE_DIR, 'Achievements');
const ACCOUNT_FILE = path.join(BASE_DIR, 'Account', 'AccountInfo.txt');
const ACH_SAVE_FILE = path.join(BASE_DIR, 'Account', 'Achievementsavefile.bin');
const ET_FILE = path.join(BASE_DIR, 'assets', 'ET.txt');
const MUSIC_PATH = path.join(BASE_DIR, 'audios', 'You_Cant_Escape.mp3');
const VLC_COMMAND = `"${path.join(BASE_DIR, 'audios', 'VLC', 'vlc.exe')}" --play-and-exit --qt-start-minimized "${MUSIC_PATH}"`;

let currentMenu = 'main';
let tocando = false;

// Tamanho Mínimo Recomendado para o layout TUI
const MIN_WIDTH = 120;
const MIN_HEIGHT = 30;

// Variáveis que armazenarão as referências dos componentes BLESSED
let screen;
let logoBox;
let menuList;
let contentBox;
let footer;
let pauseBox; // Novo componente para a lógica de pausa

// Logo Gigante
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
// 2. FUNÇÕES DE VERIFICAÇÃO DE DADOS
// ===============================================

function conquistaannoying(nomeArquivo) {
    const caminhoCompleto = path.join(ACH_FOLDER, nomeArquivo);
    return fs.existsSync(caminhoCompleto);
}

function lerNumeroDoArquivo(nomeDoArquivo) {
    const caminhoCompleto = path.join(BASE_DIR, nomeDoArquivo);
    try {
        const conteudoDoArquivo = fs.readFileSync(caminhoCompleto, 'utf8');
        const numeroLido = parseInt(conteudoDoArquivo.trim(), 10);
        return isNaN(numeroLido) ? 0 : numeroLido;
    } catch (erro) {
        return 0;
    }
}

// ===============================================
// 3. LÓGICA DE TRAPAÇA / INICIALIZAÇÃO DE FLUXO
// ===============================================
const ARQUIVO_SECRETO = 'SECRET_ENDING.bin'
const ARQUIVO_TRAPACA = 'HAHAHAHAHAHAHA.txt'
let jogadortem = conquistaannoying(ARQUIVO_SECRETO);
const numero = lerNumeroDoArquivo(ARQUIVO_TRAPACA);

if (numero == 3) {
    exec('start cmd.exe /c goodbye.bat')
    console.log("-> HAHAHAHHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHHAHAHAHHAH")
    process.exit(0)
} else if (numero == 2) {
    console.clear()
    console.log("===========================================================================")
    console.log("-> Eu acho que você não entendeu, né?")
    console.log("-> Você NUNCA teve controle neste mundo...")
    console.log("-> E agora eu irei te mostrar como as coisas são por aqui!")
    console.log("===========================================================================")
    fs.writeFileSync(path.join(BASE_DIR, ARQUIVO_TRAPACA), "3", 'utf8');
    process.exit(0)
} else if (numero == 1) {
    console.clear()
    console.log("===========================================================================")
    console.log("-> Você acha mesmo que depois do que você fez eu irei te deixar em paz???")
    console.log("===========================================================================")
    fs.writeFileSync(path.join(BASE_DIR, ARQUIVO_TRAPACA), "2", 'utf8');
    process.exit(0)
} else if (jogadortem == true) {
    console.clear()
    console.log("===========================================================================")
    console.log("-> Serio? Você acha mesmo que é só fechar e abrir o jogo?")
    console.log("===========================================================================")
    fs.writeFileSync(path.join(BASE_DIR, ARQUIVO_TRAPACA), "1", 'utf8');
    process.exit(0)
}

// ===============================================
// 4. DEFINIÇÃO DOS ITENS DE MENU
// ===============================================
const mainMenuItems = [
    'INICIAR JOGO', 'REINICIAR PROGRESSO', 'CONQUISTAS', 'CONFIGURAÇÕES',
    'CRÉDITOS', 'SUPORTE', 'SAIR'
];
const settingsMenuItems = [
    'Trilha Sonora', 'Criação de Conta', 'Restaurar Finais',
    'Incluir Easter Eggs', 'Voltar ao menu principal'
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

const menuItemsMap = {
    'main': { items: mainMenuItems, label: 'MENU PRINCIPAL' },
    'settings': { items: settingsMenuItems, label: 'CONFIGURAÇÕES' },
    'music': { items: musicOptionItems, label: 'TRILHA SONORA' },
    'account': { items: accountOptionItems, label: 'CRIAÇÃO DE CONTA' },
    'overwrite': { items: overwriteOptionItems, label: 'SOBRESCREVER CONTA' },
    'easterEggs': { items: easterEggsMenuItems, label: 'EASTER EGGS' },
    'restore': { items: restoreMenuItems, label: 'RESTAURAR FINAIS' },
    'support': { items: supportMenuItems, label: 'APOIE O JOGO' },
};


// ===============================================
// 5. FUNÇÕES DE TUI
// ===============================================

/**
 * Cria/recria todos os componentes Blessed.
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

    // MENU LATERAL ESQUERDO (Lista)
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

    // CONTEÚDO PRINCIPAL
    contentBox = blessed.box({
        top: 15, left: '32%', width: '67%', height: '60%',
        content: 'Selecione uma opção ao lado.\nUse as setas para navegar e Enter para selecionar.',
        tags: true,
        border: { type: 'line' },
        style: { fg: 'white', border: { fg: 'green' } },
        scrollable: true, alwaysScroll: true,
        scrollbar: { ch: ' ', track: { bg: 'gray' }, style: { inverse: true } }
    });
    screen.append(contentBox);

    // BOX DE PAUSA (Inicialmente invisível)
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
        content: 'Use as setas para cima/baixo e Enter. Pressione Q ou Ctrl+C para sair.',
        style: { fg: 'yellow', bg: 'black' }
    });
    screen.append(footer);

    // Handler de seleção - garante bloqueio local enquanto processa
    menuList.on('select', async (item, index) => {
        // Desabilita interação adicional durante o processamento
        menuList.interactive = false;
        menuList.detach();

        try {
            await handleSelection(index);
        } finally {
            // Reanexa e reabilita a lista para receber novas seleções
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
 * Atualiza o conteúdo da caixa principal.
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
 * Altera o menu atual e atualiza a lista.
 */
function changeMenu(menuName, menuItems, label) {
    currentMenu = menuName;
    menuList.setItems(menuItems);
    menuList.setLabel(` ${label} `);
    menuList.select(0);
    menuList.focus();
    updateContent(label, 'Selecione uma opção.');
    screen.render();
}

// ===============================================
// 6. FUNÇÕES DE CONTROLE DE FLUXO (PAUSA E TAMANHO)
// ===============================================

/**
 * Funções de aviso inicial (mantidas)
 */
function displayInitialResizeWarning() {
    console.clear();
    console.log("=========================================================");
    console.log("             🚨 AVISO DE TAMANHO DO TERMINAL 🚨           ");
    console.log("=========================================================");
    console.log(`Para uma experiência ideal com o menu lateral,`);
    console.log(`redimensione o terminal para pelo menos ${MIN_WIDTH}x${MIN_HEIGHT}.`);
    console.log(`Pressione **ENTER** para verificar o tamanho atual e iniciar.`);
    console.log("=========================================================");

    prompt('');

    while (process.stdout.columns < MIN_WIDTH || process.stdout.rows < MIN_HEIGHT) {
        console.clear();
        console.log("=========================================================");
        console.log("             ⚠️ TAMANHO INSUFICIENTE ⚠️                   ");
        console.log("=========================================================");
        console.log(`O terminal está muito pequeno.`);
        console.log(`Recomendado: ${MIN_WIDTH}x${MIN_HEIGHT}.`);
        console.log(`Atual: ${process.stdout.columns}x${process.stdout.rows}.`);
        console.log("=========================================================");
        console.log("[Ajuste a janela e pressione **ENTER** para verificar novamente]");
        prompt('');
    }

    console.clear();
    console.log("Tamanho verificado. Iniciando TUI...");
}

/**
 * PAUSA SIMPLIFICADA E ROBUSTA: Usa o prompt-sync e recria TUDO
 * para garantir que o console esteja limpo antes de qualquer I/O externo.
 * Isto é necessário devido ao uso do prompt-sync e exec/console.log misturado.
 */
function pausarParaContinuarAndRecreate(message) {
    // 1. Destrói a tela Blessed
    if (screen) {
        screen.destroy();
    }

    // 2. Exibe a mensagem de pausa
    console.clear();
    console.log("===========================================================================");
    if (message) console.log(message);
    console.log("[PRESSIONE [ENTER] PARA CONTINUAR]");
    console.log("===========================================================================");
    prompt('');

    // 3. Verifica o tamanho da janela novamente
    while (process.stdout.columns < MIN_WIDTH || process.stdout.rows < MIN_HEIGHT) {
        console.clear();
        console.log("=========================================================");
        console.log("             ⚠️ TAMANHO INSUFICIENTE ⚠️                   ");
        console.log("=========================================================");
        console.log(`O terminal está muito pequeno.`);
        console.log(`Recomendado: ${MIN_WIDTH}x${MIN_HEIGHT}.`);
        console.log(`Atual: ${process.stdout.columns}x${process.stdout.rows}.`);
        console.log("=========================================================");
        console.log("[Ajuste a janela e pressione **ENTER** para verificar novamente]");
        prompt('');
    }

    // 4. Recria a tela e restaura o estado
    createBlessedScreen();
    const menuState = menuItemsMap[currentMenu];

    if (menuState) {
        changeMenu(currentMenu, menuState.items, menuState.label);
    } else {
        changeMenu('main', mainMenuItems, 'MENU PRINCIPAL');
    }
}

// ===============================================
// 7. FUNÇÕES DE AÇÃO
// ===============================================

function tocamusic() {
    const command = `start /min "" ${VLC_COMMAND}`;
    exec(`cmd.exe /c "${command}"`, (error, stdout, stderr) => {});
}

async function conquistasBlessed() {
    let finais = [];
    try {
        finais = fs.readdirSync(ACH_FOLDER).filter(f => f.endsWith('.bin'));
    } catch (e) {
        updateContent('CONQUISTAS', `[ERRO DE ARQUIVO]: Não foi possível ler a pasta de conquistas. ${e.message}`);
        pausarParaContinuarAndRecreate("[CONQUISTAS]");
        return;
    }

    const count = finais.length;
    let content = "VERIFICANDO PASTAS\n\n";

    if (count > 0) {
        content += "[ARQUIVOS ENCONTRADOS]\n" + finais.join('\n') +
            "\n\n-> Se você quiser manter esses finais, NÃO OS RESTAURE";
    } else {
        content += "-> Nenhum arquivo de final encontrado!";
    }

    updateContent('CONQUISTAS', content);
    pausarParaContinuarAndRecreate("[CONQUISTAS]");
}

async function createAccountBlessed() {
    if (screen) {
        screen.destroy();
    }
    console.clear();
    console.log("===========================================================================");
    console.log("                     [CRIAÇÃO DE CONTA]                      ");
    console.log("===========================================================================");

    const Usuario = prompt("[NOME DE USUÁRIO]: ");
    const Senha = prompt("[SENHA]: ");
    console.log("===========================================================================");

    const conteudo = `[NOME]: ${Usuario}\r\n[SENHA]: ${Senha}\r\n[IDIOMA]: Português \r\n`;

    try {
        fs.writeFileSync(ACCOUNT_FILE, conteudo, 'utf8');
        let finais = [];
        try {
            finais = fs.readdirSync(ACH_FOLDER).filter(f => f.endsWith('.bin'));
        } catch (e) { /* Ignora */ }

        if (finais.length > 0) {
            fs.writeFileSync(ACH_SAVE_FILE, finais.join('\r\n'), 'utf8');
            console.log("[SISTEMA]: Conta criada com sucesso! Seus finais estão salvos.");
        } else {
            console.log("[SISTEMA]: Conta criada com sucesso! Você não tem finais ainda.");
        }
    } catch (error) {
        console.error(`[ERRO CRÍTICO]: Falha ao criar arquivo de conta ou salvamento. ${error.message}`);
    }


    pausarParaContinuarAndRecreate();
    updateContent('CRIAÇÃO DE CONTA', "[SISTEMA]: Conta criada e salvamento verificado.");
}

/**
 * Lida com a seleção de item no menu.
 */
async function handleSelection(index) {
    const selectedItem = menuList.getItem(index).getText().trim();

    try {
        if (currentMenu === 'main') {
            switch (selectedItem) {
                case 'INICIAR JOGO':
                    if (tocando) exec('taskkill /IM vlc.exe /F');
                    screen.destroy();
                    require('./mainBR.js');
                    break;
                case 'REINICIAR PROGRESSO':
                    exec('start cmd.exe /c node eraseData.js', async (error) => {
                        const msg = error ? `[ERRO: ARQUIVO FALHOU ${error.message}]` : '[PROGRESSO REINICIADO]';
                        pausarParaContinuarAndRecreate(`[REINICIAR PROGRESSO]\n${msg}`);
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
                    if (tocando) exec('taskkill /IM vlc.exe /F');
                    process.exit(0);
            }
        } else if (currentMenu === 'settings') {
            switch (selectedItem) {
                case 'Trilha Sonora': changeMenu('music', musicOptionItems, 'TRILHA SONORA'); break;
                case 'Criação de Conta':
                    if (fs.existsSync(ACCOUNT_FILE)) {
                        changeMenu('overwrite', overwriteOptionItems, 'SOBRESCREVER CONTA');
                        updateContent('SOBRESCREVER CONTA', "[EXISTE UM ARQUIVO DE CONTA, DESEJA SOBRESCREVE-LO?]");
                    } else {
                        await createAccountBlessed();
                        changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
                    }
                    break;
                case 'Restaurar Finais': changeMenu('restore', restoreMenuItems, 'RESTAURAR FINAIS'); break;
                case 'Incluir Easter Eggs': changeMenu('easterEggs', easterEggsMenuItems, 'EASTER EGGS'); break;
                case 'Voltar ao menu principal': changeMenu('main', mainMenuItems, 'MENU PRINCIPAL'); break;
            }
        } else if (currentMenu === 'music') {
            let message = '';
            if (selectedItem.includes('Ativar') || selectedItem.includes('Desativar')) {
                if (selectedItem.includes('Ativar')) {
                    if (tocando) { message = "[A MÚSICA JÁ ESTÁ TOCANDO]"; }
                    else { tocamusic(); tocando = true; message = "[TRILHA SONORA INICIADA]"; }
                } else if (selectedItem.includes('Desativar')) {
                    if (tocando) { exec('taskkill /IM vlc.exe /F'); tocando = false; message = "[MÚSICA PARADA]"; }
                    else { message = "[A MÚSICA JÁ ESTÁ PARADA]"; }
                }
                pausarParaContinuarAndRecreate(`[TRILHA SONORA]\n${message}`);
                changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
            } else if (selectedItem.includes('Voltar')) {
                changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
            }
        } else if (currentMenu === 'account') {
            if (selectedItem === 'Criar Conta') {
                if (fs.existsSync(ACCOUNT_FILE)) {
                    changeMenu('overwrite', overwriteOptionItems, 'SOBRESCREVER CONTA');
                    updateContent('SOBRESCREVER CONTA', "[EXISTE UM ARQUIVO DE CONTA, DESEJA SOBRESCREVE-LO?]");
                } else {
                    await createAccountBlessed();
                    changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
                }
            } else if (selectedItem === 'Pular') {
                pausarParaContinuarAndRecreate("[CRIAÇÃO DE CONTA PULADA]");
                changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
            } else if (selectedItem === 'Voltar') {
                changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
            }
        } else if (currentMenu === 'overwrite') {
            if (selectedItem.includes('Sim')) {
                await createAccountBlessed();
            } else {
                pausarParaContinuarAndRecreate("[CRIAÇÃO DE CONTA CANCELADA]");
            }
            changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
        } else if (currentMenu === 'easterEggs') {
            let message = '';
            if (selectedItem.includes('Ativar') || selectedItem.includes('Desativar')) {
                if (selectedItem.includes('Ativar')) {
                    if (fs.existsSync(ET_FILE)) { message = "[EASTER EGGS JÁ ESTÃO ATIVADOS]"; }
                    else { fs.writeFileSync(ET_FILE, 'Easter Eggs Activated', 'utf8'); message = "[EASTER EGGS ATIVADOS!]"; }
                } else if (selectedItem.includes('Desativar')) {
                    if (!fs.existsSync(ET_FILE)) { message = "[EASTER EGGS JÁ ESTÃO DESATIVADOS]"; }
                    else { fs.unlinkSync(ET_FILE); message = "[EASTER EGGS DESATIVADOS!]"; }
                }
                pausarParaContinuarAndRecreate(`[EASTER EGGS]\n${message}`);
                changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
            } else if (selectedItem.includes('Voltar')) {
                changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
            }
        } else if (currentMenu === 'restore') {
            let message = '';
            let finaisPasta = [];
            try {
                finaisPasta = fs.readdirSync(ACH_FOLDER).filter(f => f.endsWith('.bin'));
            } catch (e) { /* Ignora */ }


            if (selectedItem.includes('Sim')) {
                if (!fs.existsSync(ACH_SAVE_FILE)) {
                    message = "[ARQUIVO DE FINAIS SALVOS NÃO ENCONTRADO]";
                } else {
                    try {
                        const dados = fs.readFileSync(ACH_SAVE_FILE, 'utf8');
                        let restored = [];
                        const finaisToRestore = dados.split('\n').map(f => f.trim()).filter(f => f.length > 0);

                        if (finaisToRestore.length > 0) {
                            finaisToRestore.forEach(final => {
                                if (!fs.existsSync(path.join(ACH_FOLDER, final))) {
                                    fs.writeFileSync(path.join(ACH_FOLDER, final), 'a', 'utf8');
                                    restored.push(final);
                                }
                            });

                            if (restored.length > 0) { message = `[FINAIS RESTAURADOS COM SUCESSO]:\n${restored.join('\n')}`; }
                            else { message = "[FINAIS JÁ ESTAVAM PRESENTES NA PASTA]"; }
                        } else { message = "[NENHUM FINAL ENCONTRADO NO ARQUIVO DE SALVAMENTO]"; }
                    } catch (err) { message = `[ERRO]: Falha ao ler ou restaurar arquivos: ${err.message}`; }
                }
                pausarParaContinuarAndRecreate(`[RESTAURAR FINAIS]\n${message}`);
                changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
            } else if (selectedItem.includes('Não')) {
                pausarParaContinuarAndRecreate("[RESTAURAÇÃO CANCELADA]");
                changeMenu('settings', settingsMenuItems, 'CONFIGURAÇÕES');
            } else if (selectedItem.includes('Verificar')) {
                if (finaisPasta.length > 0) {
                    message = `[ARQUIVOS ENCONTRADOS NO PROGRESSO ATUAL]:\n${finaisPasta.join('\n')}\n\n-> Se você quiser manter esses finais, NÃO OS RESTAURE`;
                } else { message = "[NENHUM FINAL ENCONTRADO!]"; }
                pausarParaContinuarAndRecreate(`[VERIFICAÇÃO DE FINAIS]\n${message}`);
                changeMenu('restore', restoreMenuItems, 'RESTAURAR FINAIS');
            }
        } else if (currentMenu === 'support') {
            if (selectedItem.includes('Sim')) {
                pausarParaContinuarAndRecreate("[ABRINDO LINK NO NAVEGADOR PADRÃO...]");
                exec('start https://the-last-deploy.itch.io/pale-luna-2');
            } else {
                pausarParaContinuarAndRecreate("[OPÇÃO RECUSADA]");
            }
            changeMenu('main', mainMenuItems, 'MENU PRINCIPAL');
        }
    } catch (error) {
        console.error(`[ERRO CRÍTICO NO MENU]: ${error.message}`);
        pausarParaContinuarAndRecreate(`[ERRO CRÍTICO]\nOcorreu um erro no processamento do menu: ${error.message}`);
        changeMenu('main', mainMenuItems, 'MENU PRINCIPAL');
    }
}

// ===============================================
// 8. INICIALIZAÇÃO DO PROGRAMA
// ===============================================
displayInitialResizeWarning();
createBlessedScreen();
changeMenu('main', mainMenuItems, 'MENU PRINCIPAL');
