import { ativarCamera } from './camera.js';
import { formatarDinheiro, CUSTOS_ESTRUTURAS } from './condicoes.js';
import { iniciarRelogio } from './tempo.js';

export let itemSelecionado = null; 
let onItemSelectCallback = null;

export function setOnItemSelectCallback(callback) {
    onItemSelectCallback = callback;
}

export function setupHUD() {
    const hudContainer = document.createElement("div");
    hudContainer.id = "game-stats-hud";
    
    hudContainer.style.position = "absolute";
    hudContainer.style.top = "20px";
    hudContainer.style.right = "20px";
    hudContainer.style.backgroundColor = "rgba(15, 20, 25, 0.85)";
    hudContainer.style.color = "#e0e0e0";
    hudContainer.style.padding = "15px 20px";
    hudContainer.style.borderRadius = "8px";
    hudContainer.style.fontFamily = "Arial, sans-serif";
    hudContainer.style.fontSize = "16px";
    hudContainer.style.boxShadow = "0 4px 8px rgba(0,0,0,0.5)";
    hudContainer.style.pointerEvents = "none";
    hudContainer.style.zIndex = "10";
    hudContainer.style.display = "flex";
    hudContainer.style.flexDirection = "column";
    hudContainer.style.gap = "12px";
    hudContainer.style.minWidth = "230px";
    hudContainer.style.border = "1px solid #334155";

    hudContainer.innerHTML = `
        <div id="hud-titulo" style="border-bottom: 2px solid #38bdf8; padding-bottom: 8px; margin-bottom: 4px; font-weight: bold; color: #fff; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
            ETA Central
        </div>
        <div>💰 Dinheiro: <span id="hud-dinheiro" style="font-weight: bold; float: right; color: #4ade80;">R$ 450.000</span></div>
        <div>🏗️ Terreno utilizado: <span id="hud-terreno" style="font-weight: bold; float: right; color: #fde047;">0/4</span></div>
        <div>💧 Água distribuída: <span id="hud-distribuida" style="font-weight: bold; float: right; color: #38bdf8;">0</span></div>
        <div>🧪 Água tratada: <span id="hud-tratada" style="font-weight: bold; float: right; color: #4ade80;">0%</span></div>
        <div style="margin-top: 5px; padding-top: 10px; border-top: 1px dashed #475569;">
            🎯 Meta de Abastecimento:<br>
            <span id="hud-meta" style="font-weight: bold; color: #f87171; display: block; margin-top: 5px;">Pendente</span>
        </div>
        <div style="margin-top: 2px; padding-top: 10px; border-top: 1px dashed #475569; text-align: center;">
            🕒 <span id="hud-relogio" style="font-weight: bold; color: #38bdf8; font-size: 15px;">07:00 - 15/10/2026</span>
        </div>
    `;

    document.body.appendChild(hudContainer);

    criarModalNomeETA();
    criarMenuConstrucaoHUD();
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

    const botoes = menu.querySelectorAll(".btn-opcao-construir");
    botoes.forEach((btn) => {
        btn.addEventListener("click", () => {
            const item = btn.getAttribute("data-item");

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
    });
}

export function toggleMenuConstrucao(exibir) {
    const menu = document.getElementById("menu-construcao-hud");
    if (menu) {
        if (exibir !== undefined) {
            menu.style.display = exibir ? "flex" : "none";
        } else {
            menu.style.display = menu.style.display === "none" ? "flex" : "none";
        }

        if (menu.style.display === "none") {
            itemSelecionado = null;
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

function criarModalNomeETA() {
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
        iniciarRelogio(); // Inicia a passagem do tempo
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
    if (el) el.innerText = valor;
}

export function atualizarAguaTratada(porcentagem) {
    const el = document.getElementById("hud-tratada");
    const valorTratado = Math.min(100, Math.max(0, Math.round(porcentagem))); 
    if (el) el.innerText = `${valorTratado}%`;
}

export function atualizarMeta(statusTexto, completada = false) {
    const el = document.getElementById("hud-meta");
    if (el) {
        el.innerText = statusTexto;
        el.style.color = completada ? "#4ade80" : "#f87171"; 
    }
}