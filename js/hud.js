import { ativarCamera } from './camera.js';
import { formatarDinheiro, CUSTOS_ESTRUTURAS } from './condicoes.js';
import { 
    iniciarRelogio, 
    pausarRelogio, 
    despausarRelogio, 
    setVelocidadeTempo,
    getDataAtual,
    registerGameAnimation
} from './tempo.js';
import { CONFIG_BOMBA_AGUA, CONFIG_CAIXA_AGUA } from './variaveis-importantes.js';
import { CUSTO_MANUTENCAO_ESTRUTURAS } from './relatorio.js';
import { alternarModoExpansaoTerreno } from './expandirTerreno.js';

// ==========================================================
// ESTADO E CONFIGURAÇÕES DO HUD
// ==========================================================
export let itemSelecionado = null; 
let onItemSelectCallback = null;

const INFO_ESTRUTURAS = {
    bomba_agua: {
        titulo: "💧 Bomba d'água (SEMAE)",
        descricao: CONFIG_BOMBA_AGUA.descricao,
        rotuloEspecificacao: "Vazão de Captação:",
        vazao: CONFIG_BOMBA_AGUA.vazaoTextoCard,
        energia: CONFIG_BOMBA_AGUA.energia,
        manutencao: `${formatarDinheiro(CUSTO_MANUTENCAO_ESTRUTURAS.bomba_agua)}/semana`
    },
    caixa_agua: {
        titulo: "🚰 Caixa d'água Elevada",
        descricao: CONFIG_CAIXA_AGUA.descricao,
        rotuloEspecificacao: "Abastecimento (passivo):",
        vazao: CONFIG_CAIXA_AGUA.mecanicaTextoCard,
        energia: CONFIG_CAIXA_AGUA.energia,
        manutencao: `${formatarDinheiro(CUSTO_MANUTENCAO_ESTRUTURAS.caixa_agua)}/semana`
    }
};

export function setOnItemSelectCallback(callback) {
    onItemSelectCallback = callback;
}

function getProximaSegundaFeira7AM(dataAtual) {
    const d = new Date(dataAtual.getTime());
    const diaDaSemana = d.getDay();
    let diasAteSegunda = (1 - diaDaSemana + 7) % 7;
    
    if (diasAteSegunda === 0 && d.getHours() >= 7) {
        diasAteSegunda = 7;
    }

    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diasAteSegunda, 7, 0, 0, 0).getTime();
}

// ==========================================================
// INICIALIZAÇÃO PRINCIPAL DO HUD
// ==========================================================
export function setupHUD(scene) {
    const sidebarContainer = document.createElement("div");
    sidebarContainer.id = "hud-sidebar-container";
    sidebarContainer.style.cssText = `
        position: absolute; top: 20px; right: 20px;
        display: flex; flex-direction: column; gap: 10px;
        z-index: 10; pointer-events: none;
    `;

    // 1. Painel Principal de Estatísticas
    const hudContainer = criarPainelEstatisticaHTML();
    sidebarContainer.appendChild(hudContainer);

    // 2. Barra de Controlo de Tempo
    const barraTempo = criarBarraControloTempoHTML();
    sidebarContainer.appendChild(barraTempo);

    document.body.appendChild(sidebarContainer);

    // Configuração de Eventos
    setupEventosControleTempo(barraTempo, scene);
    criarModalNomeETA(scene);
    criarMenuConstrucaoHUD();
}

// ==========================================================
// CONSTRUÇÃO DE ELEMENTOS HTML
// ==========================================================
function criarPainelEstatisticaHTML() {
    const hud = document.createElement("div");
    hud.id = "game-stats-hud";
    hud.style.cssText = `
        background-color: rgba(15, 20, 25, 0.85); color: #e0e0e0;
        padding: 15px 20px; border-radius: 8px; font-family: Arial, sans-serif;
        font-size: 16px; box-shadow: 0 4px 8px rgba(0,0,0,0.5);
        pointer-events: auto; display: flex; flex-direction: column;
        gap: 12px; min-width: 250px; border: 1px solid #334155;
    `;

    hud.innerHTML = `
        <div id="hud-titulo" style="border-bottom: 2px solid #38bdf8; padding-bottom: 8px; font-weight: bold; color: #fff; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
            ETA Central
        </div>
        <div>💰 Dinheiro: <span id="hud-dinheiro" style="font-weight: bold; float: right; color: #4ade80;">R$ 450.000</span></div>
        <div>🏗️ Terreno utilizado: <span id="hud-terreno" style="font-weight: bold; float: right; color: #fde047;">0/4</span></div>
        <div>💧 Vazão atual: <span id="hud-distribuida" style="font-weight: bold; float: right; color: #38bdf8;">0 m³/h</span></div>
        <div>🧪 Água tratada: <span id="hud-tratada" style="font-weight: bold; float: right; color: #4ade80;">0%</span></div>
        <div>⚡ Consumo de kW/h: <span id="hud-energia" style="font-weight: bold; float: right; color: #f87171;">10 kW/h</span></div>
        <div style="margin-top: 5px; padding-top: 10px; border-top: 1px dashed #475569;">
            🎯 Meta de Abastecimento:<br>
            <span id="hud-meta" style="font-weight: bold; color: #f87171; display: block; margin-top: 5px;">Pegue um contrato na sede</span>
        </div>
        <div style="margin-top: 2px; padding-top: 10px; border-top: 1px dashed #475569; text-align: center;">
            🕒 <span id="hud-relogio" style="font-weight: bold; color: #38bdf8; font-size: 14px;">07:00 - Quinta-Feira - 01/01/2026</span>
        </div>
    `;
    return hud;
}

function criarBarraControloTempoHTML() {
    const barra = document.createElement("div");
    barra.id = "barra-controle-tempo";
    barra.style.cssText = `
        background-color: rgba(15, 23, 42, 0.95); border: 1px solid #334155;
        border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column;
        gap: 6px; box-shadow: 0 4px 8px rgba(0,0,0,0.5); pointer-events: auto;
        transition: all 0.3s ease-in-out;
    `;

    barra.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
            <button id="btnTempoPause" style="background: #1e293b; color: #f87171; border: 1px solid #334155; border-radius: 6px; padding: 6px 10px; font-weight: bold; cursor: pointer; transition: all 0.2s;" title="Pausar Tempo">⏸️</button>
            <button id="btnTempoPlay" style="background: #0284c7; color: #fff; border: 1px solid #38bdf8; border-radius: 6px; padding: 6px 10px; font-weight: bold; cursor: pointer; transition: all 0.2s;" title="Retomar Tempo">▶️</button>
            <button id="btnTempo1x" style="background: #0284c7; color: #fff; border: 1px solid #38bdf8; border-radius: 6px; padding: 6px 10px; font-weight: bold; font-size: 13px; cursor: pointer; transition: all 0.2s;" title="Velocidade Normal (1x)">1x</button>
            <button id="btnTempo5x" style="background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 6px; padding: 6px 10px; font-weight: bold; font-size: 13px; cursor: pointer; transition: all 0.2s;" title="Velocidade Rápida (5x)">5x</button>
            <button id="btnTempo10x" style="background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 6px; padding: 6px 10px; font-weight: bold; font-size: 13px; cursor: pointer; transition: all 0.2s;" title="Velocidade Ultra Rápida (10x)">10x</button>
        </div>

        <div id="container-avancar-semana" style="max-height: 0px; opacity: 0; overflow: hidden; transition: all 0.3s ease-in-out; margin-top: 0px;">
            <button id="btnAvancarSemana" style="width: 100%; background-color: #7c3aed; color: #ffffff; border: 1px solid #a855f7; border-radius: 6px; padding: 7px; font-size: 11px; font-weight: bold; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: background-color 0.2s;">
                ⏩ Avançar p/ Próxima Segunda (07h)
            </button>
        </div>
    `;
    return barra;
}

// ==========================================================
// CONTROLO DE TEMPO E ANIMAÇÃO
// ==========================================================
function setupEventosControleTempo(container, scene) {
    const btnPause = container.querySelector("#btnTempoPause");
    const btnPlay = container.querySelector("#btnTempoPlay");
    const btn1x = container.querySelector("#btnTempo1x");
    const btn5x = container.querySelector("#btnTempo5x");
    const btn10x = container.querySelector("#btnTempo10x");
    
    const containerAvancar = container.querySelector("#container-avancar-semana");
    const btnAvancar = container.querySelector("#btnAvancarSemana");
    const botoesVelocidade = [btn1x, btn5x, btn10x];

    function destacarVelocidade(btnAtivo) {
        botoesVelocidade.forEach(btn => {
            btn.style.backgroundColor = "#1e293b";
            btn.style.color = "#94a3b8";
            btn.style.borderColor = "#334155";
        });
        if (btnAtivo) {
            btnAtivo.style.backgroundColor = "#0284c7";
            btnAtivo.style.color = "#ffffff";
            btnAtivo.style.borderColor = "#38bdf8";
        }
    }

    container.addEventListener("mouseenter", () => {
        containerAvancar.style.maxHeight = "40px";
        containerAvancar.style.opacity = "1";
        containerAvancar.style.marginTop = "4px";
    });

    container.addEventListener("mouseleave", () => {
        containerAvancar.style.maxHeight = "0px";
        containerAvancar.style.opacity = "0";
        containerAvancar.style.marginTop = "0px";
    });

    let alvoAceleracaoMs = null;

    function resetarBotaoAvancar(novaVelocidade = 1) {
        alvoAceleracaoMs = null;
        setVelocidadeTempo(novaVelocidade);
        btnAvancar.innerText = "⏩ Avançar p/ Próxima Segunda (07h)";
        btnAvancar.style.backgroundColor = "#7c3aed";
    }

    registerGameAnimation(scene, () => {
        if (alvoAceleracaoMs !== null && getDataAtual().getTime() >= alvoAceleracaoMs) {
            resetarBotaoAvancar(1);
            destacarVelocidade(btn1x);
        }
    });

    btnAvancar.addEventListener("click", () => {
        if (alvoAceleracaoMs !== null) return;
        alvoAceleracaoMs = getProximaSegundaFeira7AM(getDataAtual());
        despausarRelogio();
        setVelocidadeTempo(150);

        btnAvancar.innerText = "⏳ Acelerando...";
        btnAvancar.style.backgroundColor = "#5b21b6";

        btnPlay.style.backgroundColor = "#0284c7";
        btnPlay.style.color = "#ffffff";
        btnPlay.style.borderColor = "#38bdf8";

        btnPause.style.backgroundColor = "#1e293b";
        btnPause.style.color = "#f87171";
        btnPause.style.borderColor = "#334155";
    });

    btnPause.addEventListener("click", () => {
        resetarBotaoAvancar(1);
        pausarRelogio();

        btnPause.style.backgroundColor = "#ef4444";
        btnPause.style.color = "#ffffff";
        btnPause.style.borderColor = "#f87171";

        btnPlay.style.backgroundColor = "#1e293b";
        btnPlay.style.color = "#94a3b8";
        btnPlay.style.borderColor = "#334155";
    });

    btnPlay.addEventListener("click", () => {
        resetarBotaoAvancar(1);
        despausarRelogio();
        destacarVelocidade(btn1x);

        btnPlay.style.backgroundColor = "#0284c7";
        btnPlay.style.color = "#ffffff";
        btnPlay.style.borderColor = "#38bdf8";

        btnPause.style.backgroundColor = "#1e293b";
        btnPause.style.color = "#f87171";
        btnPause.style.borderColor = "#334155";
    });

    btn1x.addEventListener("click", () => { resetarBotaoAvancar(1); destacarVelocidade(btn1x); despausarRelogio(); });
    btn5x.addEventListener("click", () => { resetarBotaoAvancar(5); destacarVelocidade(btn5x); despausarRelogio(); });
    btn10x.addEventListener("click", () => { resetarBotaoAvancar(10); destacarVelocidade(btn10x); despausarRelogio(); });
}

// ==========================================================
// BOTÃO COMPRAR TERRENO (EXPANSÃO)
// ==========================================================
export function exibirBotaoComprarTerreno() {
    let btnComprar = document.getElementById("btnComprarTerreno");
    const btnConstruir = document.getElementById("btnConstruir");

    if (!btnConstruir) return;

    if (!btnComprar) {
        btnComprar = document.createElement("button");
        btnComprar.id = "btnComprarTerreno";
        btnComprar.innerHTML = "🚜 Comprar terreno";

        // Estilos e interatividade garantida para o clique do mouse
        btnComprar.style.cssText = `
            display: block;
            width: 100%;
            margin-top: 8px;
            padding: 10px 16px;
            background: rgba(0, 0, 0, 0.7);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            transition: all 0.2s ease-in-out;
            box-sizing: border-box;
            pointer-events: auto;
            z-index: 100;
        `;

        btnComprar.addEventListener("mouseenter", () => {
            btnComprar.style.background = "rgba(0, 0, 0, 0.85)";
            btnComprar.style.borderColor = "#38bdf8";
        });
        btnComprar.addEventListener("mouseleave", () => {
            btnComprar.style.background = "rgba(0, 0, 0, 0.7)";
            btnComprar.style.borderColor = "rgba(255, 255, 255, 0.3)";
        });

        btnComprar.addEventListener("click", (e) => {
            e.stopPropagation();
            if (typeof alternarModoExpansaoTerreno === "function") {
                alternarModoExpansaoTerreno();
            }
        });

        let wrapper = document.getElementById("wrapper-btn-construir");
        if (!wrapper) {
            wrapper = document.createElement("div");
            wrapper.id = "wrapper-btn-construir";
            wrapper.style.cssText = "display: flex; flex-direction: column; align-items: stretch; width: fit-content; pointer-events: auto; z-index: 100;";
            btnConstruir.parentNode.insertBefore(wrapper, btnConstruir);
            wrapper.appendChild(btnConstruir);
        }
        wrapper.appendChild(btnComprar);
    } else {
        btnComprar.style.display = "block";
    }
}

// ==========================================================
// MENU DE CONSTRUÇÃO E CARDS
// ==========================================================
function criarMenuConstrucaoHUD() {
    const menu = document.createElement("div");
    menu.id = "menu-construcao-hud";
    menu.style.cssText = `
        position: absolute; top: 75px; left: 20px;
        background-color: rgba(15, 23, 42, 0.95); border: 2px solid #38bdf8;
        border-radius: 10px; padding: 15px; width: 250px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.6); z-index: 100;
        display: none; flex-direction: column; gap: 10px; font-family: Arial, sans-serif;
    `;

    menu.innerHTML = `
        <div style="color: #38bdf8; font-weight: bold; font-size: 14px; text-align: center; border-bottom: 1px solid #334155; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            🏗️ Opções de Construção
        </div>
        <button class="btn-opcao-construir" data-item="bomba_agua" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background-color: #1e293b; color: #ffffff; border: 1px solid #334155; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer; transition: all 0.2s;">
            <span>💧 Bomba d'água</span><span style="color: #4ade80;">${formatarDinheiro(CUSTOS_ESTRUTURAS.bomba_agua)}</span>
        </button>
        <button class="btn-opcao-construir" data-item="caixa_agua" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background-color: #1e293b; color: #ffffff; border: 1px solid #334155; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer; transition: all 0.2s;">
            <span>🚰 Caixa d'água</span><span style="color: #4ade80;">${formatarDinheiro(CUSTOS_ESTRUTURAS.caixa_agua)}</span>
        </button>
    `;
    document.body.appendChild(menu);

    const cardInfo = document.createElement("div");
    cardInfo.id = "card-info-estrutura";
    cardInfo.style.cssText = `
        position: absolute; top: 75px; left: 285px;
        background-color: rgba(15, 23, 42, 0.98); border: 2px solid #38bdf8;
        border-radius: 10px; padding: 15px; width: 290px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.7); z-index: 101;
        display: none; flex-direction: column; gap: 10px;
        font-family: Arial, sans-serif; color: #ffffff; pointer-events: none;
    `;
    document.body.appendChild(cardInfo);

    const botoes = menu.querySelectorAll(".btn-opcao-construir");
    botoes.forEach((btn) => {
        const item = btn.getAttribute("data-item");

        btn.addEventListener("click", () => {
            if (itemSelecionado === item) {
                itemSelecionado = null;
                btn.style.backgroundColor = "#1e293b";
                btn.style.borderColor = "#334155";
            } else {
                itemSelecionado = item;
                botoes.forEach(b => { b.style.backgroundColor = "#1e293b"; b.style.borderColor = "#334155"; });
                btn.style.backgroundColor = "#0284c7";
                btn.style.borderColor = "#38bdf8";
            }

            if (onItemSelectCallback) onItemSelectCallback(itemSelecionado);
        });

        btn.addEventListener("mouseenter", () => {
            const info = INFO_ESTRUTURAS[item];
            if (info) {
                cardInfo.innerHTML = `
                    <div style="font-weight: bold; color: #38bdf8; font-size: 15px; border-bottom: 1px solid #334155; padding-bottom: 6px;">
                        ${info.titulo}
                    </div>
                    <div style="font-size: 13px; color: #cbd5e1; line-height: 1.4;">
                        ${info.descricao}
                    </div>
                    <div style="border-top: 1px dashed #334155; padding-top: 8px; font-size: 12px; display: flex; flex-direction: column; gap: 4px;">
                        <div>🌊 <strong style="color: #94a3b8;">${info.rotuloEspecificacao}</strong><br><span style="color: #38bdf8; font-weight: bold; display: block; margin-top: 2px;">${info.vazao}</span></div>
                        <div style="margin-top: 4px;">⚡ <strong style="color: #94a3b8;">Consumo de Energia:</strong> <span style="color: #f87171; font-weight: bold; float: right;">${info.energia}</span></div>
                        <div>🛠️ <strong style="color: #94a3b8;">Custo de Manutenção:</strong> <span style="color: #fde047; font-weight: bold; float: right;">${info.manutencao}</span></div>
                    </div>
                `;
                
                const rectBtn = btn.getBoundingClientRect();
                cardInfo.style.top = `${rectBtn.top}px`;
                cardInfo.style.display = "flex";
            }
        });

        btn.addEventListener("mouseleave", () => { cardInfo.style.display = "none"; });
    });
}

export function toggleMenuConstrucao(exibir) {
    const menu = document.getElementById("menu-construcao-hud");
    const cardInfo = document.getElementById("card-info-estrutura");

    if (menu) {
        menu.style.display = (exibir !== undefined) 
            ? (exibir ? "flex" : "none") 
            : (menu.style.display === "none" ? "flex" : "none");

        if (menu.style.display === "none") {
            itemSelecionado = null;
            if (cardInfo) cardInfo.style.display = "none";

            menu.querySelectorAll(".btn-opcao-construir").forEach(b => {
                b.style.backgroundColor = "#1e293b";
                b.style.borderColor = "#334155";
            });

            if (onItemSelectCallback) onItemSelectCallback(null);
        }
    }
}

// ==========================================================
// MODAIS (NOME DA ETA & SETOR DE TI)
// ==========================================================
function criarModalNomeETA(scene) {
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "modal-nome-overlay";
    modalOverlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background-color: rgba(0, 0, 0, 0.75); backdrop-filter: blur(4px);
        display: flex; justify-content: center; align-items: center; z-index: 1000;
    `;

    const modalBox = document.createElement("div");
    modalBox.style.cssText = `
        background-color: #0f172a; border: 2px solid #38bdf8; border-radius: 12px;
        padding: 30px; width: 90%; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.8);
        text-align: center; font-family: Arial, sans-serif; color: #ffffff;
    `;

    modalBox.innerHTML = `
        <h2 style="margin-top: 0; color: #38bdf8; font-size: 22px;">💧 Nova Estação de Tratamento</h2>
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">Insira a identificação da sua estação de água:</p>
        
        <div style="display: flex; align-items: center; background-color: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 0 12px; margin-bottom: 20px;">
            <span style="color: #38bdf8; font-weight: bold; font-size: 16px; margin-right: 6px; user-select: none;">ETA</span>
            <input type="text" id="input-nome-eta" placeholder="Piracicaba" style="width: 100%; padding: 12px 0; border: none; background: transparent; color: #ffffff; font-size: 16px; outline: none;" />
        </div>

        <button id="btn-confirmar-nome" style="width: 100%; padding: 12px; border-radius: 6px; border: none; background-color: #38bdf8; color: #0f172a; font-size: 16px; font-weight: bold; cursor: pointer; transition: background 0.2s;">
            Iniciar Operação
        </button>
    `;

    modalOverlay.appendChild(modalBox);
    document.body.appendChild(modalOverlay);

    const input = document.getElementById("input-nome-eta");
    const btn = document.getElementById("btn-confirmar-nome");

    setTimeout(() => input.focus(), 100);

    const confirmar = () => {
        let nomeDigitado = input.value.trim() || "Central";
        if (/^ETA\s+/i.test(nomeDigitado)) {
            nomeDigitado = nomeDigitado.replace(/^ETA\s+/i, "");
        }
        const nomeFinal = `ETA ${nomeDigitado}`;
        
        atualizarNomeETA(nomeFinal);
        modalOverlay.remove();

        ativarCamera();
        iniciarRelogio(scene);
    };

    btn.addEventListener("click", confirmar);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") confirmar(); });
}

export function abrirModalSetorTI() {
    const modalExistente = document.getElementById("modalSetorTI-overlay");
    if (modalExistente) modalExistente.remove();

    const painelOverlay = document.createElement("div");
    painelOverlay.id = "modalSetorTI-overlay";
    painelOverlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background-color: rgba(0, 0, 0, 0.8); backdrop-filter: blur(5px);
        display: flex; justify-content: center; align-items: center; z-index: 9999;
    `;

    const painelBox = document.createElement("div");
    painelBox.style.cssText = `
        background-color: #0f172a; border: 2px solid #38bdf8; border-radius: 12px;
        padding: 25px; width: 90%; max-width: 720px; box-shadow: 0 15px 35px rgba(0,0,0,0.8);
        font-family: Arial, sans-serif; color: #ffffff;
    `;

    painelBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 15px;">
            <h2 style="margin: 0; color: #38bdf8; font-size: 20px;">💻 Setor de Tecnologia e Inovação</h2>
            <button id="fecharModalTI" style="background: transparent; border: none; color: #94a3b8; font-size: 20px; font-weight: bold; cursor: pointer;">✕</button>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 15px; border-bottom: 1px solid #334155; padding-bottom: 10px;">
            <button id="aba-pesquisas-ti" style="flex: 1; background-color: #0284c7; color: white; border: none; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">
                🔬 Menu de Pesquisas & P&D
            </button>
        </div>

        <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 25px; min-height: 180px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
            <p style="color: #cbd5e1; font-size: 15px; margin: 0; line-height: 1.6;">
                Bem-vindo ao centro de P&D da ETA. Aqui você poderá pesquisar novas tecnologias de tratamento de água e automação.
            </p>
        </div>
    `;

    painelOverlay.appendChild(painelBox);
    document.body.appendChild(painelOverlay);

    const fechar = () => painelOverlay.remove();
    document.getElementById("fecharModalTI").onclick = fechar;
    painelOverlay.addEventListener("click", (e) => {
        if (e.target === painelOverlay) fechar();
    });
}

// ==========================================================
// FUNÇÕES UTILITÁRIAS DE ATUALIZAÇÃO DA INTERFACE (EXPORTADAS COM CACHE DE DOM)
// ==========================================================
const domCache = {};
function getCachedEl(id) {
    if (!domCache[id]) domCache[id] = document.getElementById(id);
    return domCache[id];
}

export function atualizarNomeETA(nome) {
    const el = getCachedEl("hud-titulo");
    if (el) el.textContent = nome;
    if (typeof window.atualizarPlacaETA === "function") window.atualizarPlacaETA(nome);
}

export function atualizarRelogioHUD(textoDataHora) {
    const el = getCachedEl("hud-relogio");
    if (el) el.textContent = textoDataHora;
}

export function atualizarDinheiro(valor) {
    const el = getCachedEl("hud-dinheiro");
    if (el) el.textContent = formatarDinheiro(valor);
}

export function atualizarTerreno(usado, total) {
    const el = getCachedEl("hud-terreno");
    if (el) el.textContent = `${usado}/${total}`;
}

export function atualizarAguaDistribuida(valor) {
    const el = getCachedEl("hud-distribuida");
    if (el) el.innerHTML = valor;
}

export function atualizarAguaTratada(porcentagem) {
    const el = getCachedEl("hud-tratada");
    if (el) el.textContent = `${Math.min(100, Math.max(0, Math.round(porcentagem)))}%`;
}

export function atualizarConsumoEnergia(valorKw) {
    const el = getCachedEl("hud-energia");
    if (el) el.textContent = `${valorKw} kW/h`;
}

export function atualizarMeta(statusTexto, completada = false) {
    const el = getCachedEl("hud-meta");
    if (el) {
        el.textContent = statusTexto;
        el.style.color = completada ? "#4ade80" : "#f87171"; 
    }
}