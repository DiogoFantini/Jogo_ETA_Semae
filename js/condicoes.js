import { atualizarTerreno, atualizarDinheiro } from './hud.js';

// ==========================================================
// CONFIGURAÇÕES E ESTADO DO JOGO
// ==========================================================
let terrenoUsado = 0;
let terrenoMax = 4; // Limite padrão de terrenos
let dinheiro = 450000; // Saldo inicial: R$ 450.000,00

export const CUSTOS_ESTRUTURAS = {
    bomba_agua: 33000,   // R$ 33.000
    caixa_agua: 150000   // R$ 150.000
};

const TAXA_REEMBOLSO = 0.45; // 45% de reembolso na desconstrução

// ==========================================================
// GESTÃO FINANCEIRA
// ==========================================================
export function getDinheiro() {
    return dinheiro;
}

export function formatarDinheiro(valor) {
    return `R$ ${valor.toLocaleString('pt-BR')}`;
}

export function podePagar(custo) {
    return dinheiro >= custo;
}

export function gastarDinheiro(custo) {
    if (dinheiro >= custo) {
        dinheiro -= custo;
        atualizarDinheiro(dinheiro);
        return true;
    }
    return false;
}

export function adicionarDinheiro(valor) {
    dinheiro += valor;
    atualizarDinheiro(dinheiro);
}

export function reembolsarDinheiro(itemTipo) {
    const valorInvestido = CUSTOS_ESTRUTURAS[itemTipo] || 0;
    const reembolso = Math.round(valorInvestido * TAXA_REEMBOLSO);
    dinheiro += reembolso;
    atualizarDinheiro(dinheiro);
}

// ==========================================================
// GESTÃO DE TERRENO
// ==========================================================
export function getTerrenoUsado() {
    return terrenoUsado;
}

export function getTerrenoMax() {
    return terrenoMax;
}

export function podeConstruir() {
    return terrenoUsado < terrenoMax;
}

export function adicionarConstrucao() {
    if (terrenoUsado < terrenoMax) {
        terrenoUsado++;
        atualizarTerreno(terrenoUsado, terrenoMax);
        return true;
    }
    return false;
}

export function removerConstrucao() {
    if (terrenoUsado > 0) {
        terrenoUsado--;
        atualizarTerreno(terrenoUsado, terrenoMax);
    }
}

export function definirLimiteTerreno(novoLimite) {
    terrenoMax = novoLimite;
    atualizarTerreno(terrenoUsado, terrenoMax);
}

// ==========================================================
// SISTEMA DE NOTIFICAÇÃO E POP-UPS (UI)
// ==========================================================
let timerPopup = null;

export function exibirPopUpAviso(mensagem) {
    let popup = document.getElementById("popup-aviso-gameplay");
    
    if (popup) {
        popup.remove();
        if (timerPopup) clearTimeout(timerPopup);
    }

    popup = document.createElement("div");
    popup.id = "popup-aviso-gameplay";
    
    popup.style.cssText = `
        position: fixed; top: 12%; left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(15, 23, 42, 0.95);
        color: #f87171; border: 2px solid #ef4444;
        border-radius: 10px; padding: 12px 24px;
        font-family: Arial, sans-serif; font-size: 16px;
        font-weight: bold; box-shadow: 0 8px 20px rgba(0,0,0,0.7);
        z-index: 2000; pointer-events: none;
        transition: all 0.4s ease-in-out; opacity: 0;
    `;

    popup.innerHTML = mensagem;
    document.body.appendChild(popup);

    requestAnimationFrame(() => {
        popup.style.opacity = "1";
        popup.style.transform = "translate(-50%, -30%)";
    });

    timerPopup = setTimeout(() => {
        if (popup && popup.parentElement) {
            popup.style.opacity = "0";
            popup.style.transform = "translate(-50%, -60%)";
            setTimeout(() => popup.remove(), 400);
        }
    }, 2500);
}

export function exibirPopUpLimite() {
    exibirPopUpAviso("⚠️ Limite máximo de terrenos atingido");
}

export function exibirPopUpSemDinheiro() {
    exibirPopUpAviso("💸 Dinheiro insuficiente");
}