import { atualizarTerreno, atualizarDinheiro } from './hud.js';

let terrenoUsado = 0;
let terrenoMax = 4; // Limite padrão de terrenos
let dinheiro = 450000; // Saldo inicial: R$ 450.000,00

// Tabela de Custos Realistas das Estruturas
export const CUSTOS_ESTRUTURAS = {
    bomba_agua: 33000,   // R$ 33.000
    caixa_agua: 150000   // R$ 150.000
};

// Taxa de Reembolso na Desconstrução (45%)
const TAXA_REEMBOLSO = 0.45;

// ==========================================================
// GESTÃO DE DINHEIRO
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

export function reembolsarDinheiro(itemTipo) {
    const valorInvestido = CUSTOS_ESTRUTURAS[itemTipo] || 0;
    const reembolso = Math.round(valorInvestido * TAXA_REEMBOLSO); // Reembolso de 45% do valor investido
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
// POP-UPS DE ALERTA DO JOGO
// ==========================================================
export function exibirPopUpAviso(mensagem) {
    let popup = document.getElementById("popup-aviso-gameplay");
    
    if (popup) {
        popup.remove();
    }

    popup = document.createElement("div");
    popup.id = "popup-aviso-gameplay";
    
    popup.style.position = "fixed";
    popup.style.top = "12%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.backgroundColor = "rgba(15, 23, 42, 0.95)";
    popup.style.color = "#f87171"; 
    popup.style.border = "2px solid #ef4444";
    popup.style.borderRadius = "10px";
    popup.style.padding = "12px 24px";
    popup.style.fontFamily = "Arial, sans-serif";
    popup.style.fontSize = "16px";
    popup.style.fontWeight = "bold";
    popup.style.boxShadow = "0 8px 20px rgba(0,0,0,0.7)";
    popup.style.zIndex = "2000";
    popup.style.pointerEvents = "none";
    popup.style.transition = "all 0.4s ease-in-out";
    popup.style.opacity = "0";

    popup.innerHTML = mensagem;

    document.body.appendChild(popup);

    requestAnimationFrame(() => {
        popup.style.opacity = "1";
        popup.style.transform = "translate(-50%, -30%)";
    });

    setTimeout(() => {
        if (popup) {
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