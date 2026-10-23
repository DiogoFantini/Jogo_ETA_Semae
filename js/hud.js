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

// Calcula o exato momento da próxima Segunda-Feira às 07:00:00
function getProximaSegundaFeira7AM(dataAtual) {
    const d = new Date(dataAtual.getTime());
    const diaDaSemana = d.getDay(); // Domingo=0, Segunda=1, Terça=2...
    
    let diasAteSegunda = (1 - diaDaSemana + 7) % 7;
    
    if (diasAteSegunda === 0 && d.getHours() >= 7) {
        diasAteSegunda = 7;
    }

    const proximaSegunda = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diasAteSegunda, 7, 0, 0, 0);
    return proximaSegunda.getTime();
}

export function setupHUD(scene) {
    const sidebarContainer = document.createElement("div");
    sidebarContainer.id = "hud-sidebar-container";
    sidebarContainer.style.position = "absolute";
    sidebarContainer.style.top = "20px";
    sidebarContainer.style.right = "20px";
    sidebarContainer.style.display = "flex";
    sidebarContainer.style.flexDirection = "column";
    sidebarContainer.style.gap = "10px";
    sidebarContainer.style.zIndex = "10";
    sidebarContainer.style.pointerEvents = "none";

    // 1. HUD Principal
    const hudContainer = document.createElement("div");
    hudContainer.id = "game-stats-hud";
    hudContainer.style.backgroundColor = "rgba(15, 20, 25, 0.85)";
    hudContainer.style.color = "#e0e0e0";
    hudContainer.style.padding = "15px 20px";
    hudContainer.style.borderRadius = "8px";
    hudContainer.style.fontFamily = "Arial, sans-serif";
    hudContainer.style.fontSize = "16px";
    hudContainer.style.boxShadow = "0 4px 8px rgba(0,0,0,0.5)";
    hudContainer.style.pointerEvents = "auto";
    hudContainer.style.display = "flex";
    hudContainer.style.flexDirection = "column";
    hudContainer.style.gap = "12px";
    hudContainer.style.minWidth = "250px";
    hudContainer.style.border = "1px solid #334155";

    hudContainer.innerHTML = `
        <div id="hud-titulo" style="border-bottom: 2px solid #38bdf8; padding-bottom: 8px; margin-bottom: 4px; font-weight: bold; color: #fff; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
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

    sidebarContainer.appendChild(hudContainer);

    // 2. Barra de Controle de Tempo
    const barraTempo = document.createElement("div");
    barraTempo.id = "barra-controle-tempo";
    barraTempo.style.backgroundColor = "rgba(15, 23, 42, 0.95)";
    barraTempo.style.border = "1px solid #334155";
    barraTempo.style.borderRadius = "8px";
    barraTempo.style.padding = "8px 10px";
    barraTempo.style.display = "flex";
    barraTempo.style.flexDirection = "column";
    barraTempo.style.gap = "6px";
    barraTempo.style.boxShadow = "0 4px 8px rgba(0,0,0,0.5)";
    barraTempo.style.pointerEvents = "auto";
    barraTempo.style.transition = "all 0.3s ease-in-out";

    barraTempo.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
            <button id="btnTempoPause" style="background: #1e293b; color: #f87171; border: 1px solid #334155; border-radius: 6px; padding: 6px 10px; font-weight: bold; cursor: pointer; transition: all 0.2s;" title="Pausar Tempo">⏸️</button>
            <button id="btnTempoPlay" style="background: #0284c7; color: #fff; border: 1px solid #38bdf8; border-radius: 6px; padding: 6px 10px; font-weight: bold; cursor: pointer; transition: all 0.2s;" title="Retomar Tempo">▶️</button>
            <button id="btnTempo1x" style="background: #0284c7; color: #fff; border: 1px solid #38bdf8; border-radius: 6px; padding: 6px 10px; font-weight: bold; font-size: 13px; cursor: pointer; transition: all 0.2s;" title="Velocidade Normal (1x)">1x</button>
            <button id="btnTempo5x" style="background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 6px; padding: 6px 10px; font-weight: bold; font-size: 13px; cursor: pointer; transition: all 0.2s;" title="Velocidade Rápida (5x)">5x</button>
            <button id="btnTempo10x" style="background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 6px; padding: 6px 10px; font-weight: bold; font-size: 13px; cursor: pointer; transition: all 0.2s;" title="Velocidade Ultra Rápida (10x)">10x</button>
        </div>

        <div id="container-avancar-semana" style="
            max-height: 0px;
            opacity: 0;
            overflow: hidden;
            transition: all 0.3s ease-in-out;
            margin-top: 0px;
        ">
            <button id="btnAvancarSemana" style="
                width: 100%;
                background-color: #7c3aed;
                color: #ffffff;
                border: 1px solid #a855f7;
                border-radius: 6px;
                padding: 7px;
                font-size: 11px;
                font-weight: bold;
                cursor: pointer;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                transition: background-color 0.2s;
            ">⏩ Avançar p/ Próxima Segunda (07h)</button>
        </div>
    `;

    sidebarContainer.appendChild(barraTempo);
    document.body.appendChild(sidebarContainer);

    setupEventosControleTempo(barraTempo, scene);

    criarModalNomeETA(scene);
    criarMenuConstrucaoHUD();
}

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

    // Monitor do avanço até o horário alvo
    registerGameAnimation(scene, () => {
        if (alvoAceleracaoMs !== null) {
            if (getDataAtual().getTime() >= alvoAceleracaoMs) {
                resetarBotaoAvancar(1);
                destacarVelocidade(btn1x);
            }
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

    // Pausar: Cancela o avanço e congela o tempo
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

    // Play: Cancela o avanço e retoma no tempo normal 1x
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

    btn1x.addEventListener("click", () => {
        resetarBotaoAvancar(1);
        destacarVelocidade(btn1x);
        despausarRelogio();
    });

    btn5x.addEventListener("click", () => {
        resetarBotaoAvancar(5);
        destacarVelocidade(btn5x);
        despausarRelogio();
    });

    btn10x.addEventListener("click", () => {
        resetarBotaoAvancar(10);
        destacarVelocidade(btn10x);
        despausarRelogio();
    });
}

function criarMenuConstrucaoHUD() {
    const menu = document.createElement("div");
    menu.id = "menu-construcao-hud";
    menu.style.position = "absolute";
    menu.style.top = "75px";
    menu.style.left = "20px";
    menu.style.backgroundColor = "rgba(15, 23, 42, 0.95)";
    menu.style.border = "2px solid #38bdf8";
    menu.style.borderRadius = "10px";
    menu.style.padding = "15px";
    menu.style.width = "250px";
    menu.style.boxShadow = "0 8px 16px rgba(0,0,0,0.6)";
    menu.style.zIndex = "100";
    menu.style.display = "none";
    menu.style.flexDirection = "column";
    menu.style.gap = "10px";
    menu.style.fontFamily = "Arial, sans-serif";

    menu.innerHTML = `
        <div style="
            color: #38bdf8;
            font-weight: bold;
            font-size: 14px;
            text-align: center;
            border-bottom: 1px solid #334155;
            padding-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        ">
            🏗️ Opções de Construção
        </div>

        <button class="btn-opcao-construir" data-item="bomba_agua" style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 12px;
            background-color: #1e293b;
            color: #ffffff;
            border: 1px solid #334155;
            border-radius: 6px;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        ">
            <span>💧 Bomba d'água</span>
            <span style="color: #4ade80;">${formatarDinheiro(CUSTOS_ESTRUTURAS.bomba_agua)}</span>
        </button>

        <button class="btn-opcao-construir" data-item="caixa_agua" style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 12px;
            background-color: #1e293b;
            color: #ffffff;
            border: 1px solid #334155;
            border-radius: 6px;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
        ">
            <span>🚰 Caixa d'água</span>
            <span style="color: #4ade80;">${formatarDinheiro(CUSTOS_ESTRUTURAS.caixa_agua)}</span>
        </button>
    `;

    document.body.appendChild(menu);

    const cardInfo = document.createElement("div");
    cardInfo.id = "card-info-estrutura";
    cardInfo.style.position = "absolute";
    cardInfo.style.top = "75px";
    cardInfo.style.left = "285px";
    cardInfo.style.backgroundColor = "rgba(15, 23, 42, 0.98)";
    cardInfo.style.border = "2px solid #38bdf8";
    cardInfo.style.borderRadius = "10px";
    cardInfo.style.padding = "15px";
    cardInfo.style.width = "290px";
    cardInfo.style.boxShadow = "0 8px 20px rgba(0,0,0,0.7)";
    cardInfo.style.zIndex = "101";
    cardInfo.style.display = "none";
    cardInfo.style.flexDirection = "column";
    cardInfo.style.gap = "10px";
    cardInfo.style.fontFamily = "Arial, sans-serif";
    cardInfo.style.color = "#ffffff";
    cardInfo.style.pointerEvents = "none";
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
                botoes.forEach(b => {
                    b.style.backgroundColor = "#1e293b";
                    b.style.borderColor = "#334155";
                });
                btn.style.backgroundColor = "#0284c7";
                btn.style.borderColor = "#38bdf8";
            }

            if (onItemSelectCallback) {
                onItemSelectCallback(itemSelecionado);
            }
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

        btn.addEventListener("mouseleave", () => {
            cardInfo.style.display = "none";
        });
    });
}

export function toggleMenuConstrucao(exibir) {
    const menu = document.getElementById("menu-construcao-hud");
    const cardInfo = document.getElementById("card-info-estrutura");

    if (menu) {
        if (exibir !== undefined) {
            menu.style.display = exibir ? "flex" : "none";
        } else {
            menu.style.display = menu.style.display === "none" ? "flex" : "none";
        }

        if (menu.style.display === "none") {
            itemSelecionado = null;
            if (cardInfo) cardInfo.style.display = "none";

            const botoes = menu.querySelectorAll(".btn-opcao-construir");
            botoes.forEach(b => {
                b.style.backgroundColor = "#1e293b";
                b.style.borderColor = "#334155";
            });

            if (onItemSelectCallback) {
                onItemSelectCallback(null);
            }
        }
    }
}

function criarModalNomeETA(scene) {
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "modal-nome-overlay";
    modalOverlay.style.position = "fixed";
    modalOverlay.style.top = "0";
    modalOverlay.style.left = "0";
    modalOverlay.style.width = "100vw";
    modalOverlay.style.height = "100vh";
    modalOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
    modalOverlay.style.backdropFilter = "blur(4px)";
    modalOverlay.style.display = "flex";
    modalOverlay.style.justifyContent = "center";
    modalOverlay.style.alignItems = "center";
    modalOverlay.style.zIndex = "1000";

    const modalBox = document.createElement("div");
    modalBox.style.backgroundColor = "#0f172a";
    modalBox.style.border = "2px solid #38bdf8";
    modalBox.style.borderRadius = "12px";
    modalBox.style.padding = "30px";
    modalBox.style.width = "90%";
    modalBox.style.maxWidth = "400px";
    modalBox.style.boxShadow = "0 10px 25px rgba(0,0,0,0.8)";
    modalBox.style.textAlign = "center";
    modalBox.style.fontFamily = "Arial, sans-serif";
    modalBox.style.color = "#ffffff";

    modalBox.innerHTML = `
        <h2 style="margin-top: 0; color: #38bdf8; font-size: 22px;">💧 Nova Estação de Tratamento</h2>
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">Insira a identificação da sua estação de água:</p>
        
        <div style="
            display: flex;
            align-items: center;
            background-color: #1e293b;
            border: 1px solid #334155;
            border-radius: 6px;
            padding: 0 12px;
            margin-bottom: 20px;
        ">
            <span style="color: #38bdf8; font-weight: bold; font-size: 16px; margin-right: 6px; user-select: none;">ETA</span>
            <input type="text" id="input-nome-eta" placeholder="Piracicaba" style="
                width: 100%;
                padding: 12px 0;
                border: none;
                background: transparent;
                color: #ffffff;
                font-size: 16px;
                outline: none;
            " />
        </div>

        <button id="btn-confirmar-nome" style="
            width: 100%;
            padding: 12px;
            border-radius: 6px;
            border: none;
            background-color: #38bdf8;
            color: #0f172a;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.2s;
        ">Iniciar Operação</button>
    `;

    modalOverlay.appendChild(modalBox);
    document.body.appendChild(modalOverlay);

    const input = document.getElementById("input-nome-eta");
    const btn = document.getElementById("btn-confirmar-nome");

    setTimeout(() => input.focus(), 100);

    const confirmar = () => {
        let nomeDigitado = input.value.trim();
        
        if (!nomeDigitado) {
            nomeDigitado = "Central";
        }

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

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            confirmar();
        }
    });
}

export function atualizarNomeETA(nome) {
    const el = document.getElementById("hud-titulo");
    if (el) el.innerText = nome;

    if (typeof window.atualizarPlacaETA === "function") {
        window.atualizarPlacaETA(nome);
    }
}

export function atualizarRelogioHUD(textoDataHora) {
    const el = document.getElementById("hud-relogio");
    if (el) el.innerText = textoDataHora;
}

export function atualizarDinheiro(valor) {
    const el = document.getElementById("hud-dinheiro");
    if (el) el.innerText = formatarDinheiro(valor);
}

export function atualizarTerreno(usado, total) {
    const el = document.getElementById("hud-terreno");
    if (el) el.innerText = `${usado}/${total}`;
}

export function atualizarAguaDistribuida(valor) {
    const el = document.getElementById("hud-distribuida");
    if (el) el.innerHTML = valor;
}

export function atualizarAguaTratada(porcentagem) {
    const el = document.getElementById("hud-tratada");
    const valorTratado = Math.min(100, Math.max(0, Math.round(porcentagem))); 
    if (el) el.innerText = `${valorTratado}%`;
}

export function atualizarConsumoEnergia(valorKw) {
    const el = document.getElementById("hud-energia");
    if (el) el.innerText = `${valorKw} kW/h`;
}

export function atualizarMeta(statusTexto, completada = false) {
    const el = document.getElementById("hud-meta");
    if (el) {
        el.innerText = statusTexto;
        el.style.color = completada ? "#4ade80" : "#f87171"; 
    }
}

export function abrirModalSetorTI() {
    const modalExistente = document.getElementById("modalSetorTI");
    if (modalExistente) modalExistente.remove();

    const containerModal = document.createElement("div");
    containerModal.id = "modalSetorTI";
    containerModal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 600px;
        max-width: 90vw;
        background: #0f172a;
        border: 2px solid #38bdf8;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.7);
        z-index: 1000;
        color: #ffffff;
        font-family: Arial, sans-serif;
        overflow: hidden;
    `;

    containerModal.innerHTML = `
        <div style="background: #1e293b; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155;">
            <h2 style="margin: 0; font-size: 20px; color: #38bdf8;">Setor de Tecnologia e Inovação</h2>
            <button id="fecharModalTI" style="background: transparent; border: none; color: #94a3b8; font-size: 24px; cursor: pointer;">&times;</button>
        </div>

        <div style="display: flex; background: #0f172a; border-bottom: 1px solid #334155;">
            <button style="padding: 12px 24px; background: #1e293b; color: #38bdf8; border: none; border-bottom: 3px solid #38bdf8; font-weight: bold; cursor: pointer;">
                Menu de pesquisas
            </button>
        </div>

        <div style="padding: 24px; min-height: 200px;">
            <p style="color: #94a3b8; font-size: 15px; margin: 0;">
                Bem-vindo ao centro de P&D da ETA. Aqui você poderá pesquisar novas tecnologias de tratamento de água e automação.
            </p>
        </div>
    `;

    document.body.appendChild(containerModal);

    document.getElementById("fecharModalTI").onclick = () => {
        containerModal.remove();
    };
}