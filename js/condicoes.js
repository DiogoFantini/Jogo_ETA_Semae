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
// SISTEMA DE NOTIFICAÇÕES E POP-UPS (UI)
// ==========================================================
let containerNotificacoes = null;

function obterOuCriarContainerNotificacoes() {
    if (!containerNotificacoes || !document.body.contains(containerNotificacoes)) {
        containerNotificacoes = document.createElement("div");
        containerNotificacoes.id = "hud-container-notificacoes";
        containerNotificacoes.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            display: flex; flex-direction: column; align-items: center; gap: 10px;
            z-index: 10000; pointer-events: none; width: 90%; max-width: 520px;
        `;
        document.body.appendChild(containerNotificacoes);
    }
    return containerNotificacoes;
}

/**
 * Exibe notificação na HUD com cor temática e duração estendida
 * @param {string} mensagem Texto da notificação
 * @param {string|null} tipo 'contrato', 'multa', 'clima' ou null para auto-detecção
 * @param {number} duracaoMs Tempo em milissegundos (padrão 8000ms / 8s)
 */
export function exibirPopUpAviso(mensagem, tipo = null, duracaoMs = 8000) {
    const container = obterOuCriarContainerNotificacoes();

    // Auto-detecção de categoria por palavras-chave caso não informado
    let tipoEfetivo = tipo;
    if (!tipoEfetivo) {
        const msgLower = mensagem.toLowerCase();
        if (msgLower.includes("multa") || msgLower.includes("déficit") || msgLower.includes("insuficiente") || msgLower.includes("cancelad") || msgLower.includes("limite") || msgLower.includes("❌")) {
            tipoEfetivo = "multa";
        } else if (msgLower.includes("clima") || msgLower.includes("climático") || msgLower.includes("chuva") || msgLower.includes("calor") || msgLower.includes("seca") || msgLower.includes("trégua") || msgLower.includes("🌤️") || msgLower.includes("🌧️")) {
            tipoEfetivo = "clima";
        } else if (msgLower.includes("contrato") || msgLower.includes("sucesso") || msgLower.includes("adquirido") || msgLower.includes("investimento") || msgLower.includes("liberad") || msgLower.includes("🎉") || msgLower.includes("📜") || msgLower.includes("✅")) {
            tipoEfetivo = "contrato";
        } else {
            tipoEfetivo = "padrao";
        }
    }

    // Configuração das cores por tipo
    let bgCor = "rgba(15, 23, 42, 0.95)";
    let borderCor = "#38bdf8";
    let textoCor = "#ffffff";
    let icone = "ℹ️";

    if (tipoEfetivo === "contrato" || tipoEfetivo === "verde") {
        bgCor = "rgba(20, 83, 45, 0.95)";     // Verde escuro
        borderCor = "#22c55e";                 // Verde brilhante
        textoCor = "#f0fdf4";
        icone = "📜";
    } else if (tipoEfetivo === "multa" || tipoEfetivo === "vermelho") {
        bgCor = "rgba(127, 29, 29, 0.95)";    // Vermelho escuro
        borderCor = "#ef4444";                 // Vermelho brilhante
        textoCor = "#fef2f2";
        icone = "⚠️";
    } else if (tipoEfetivo === "clima" || tipoEfetivo === "azul-escuro") {
        bgCor = "rgba(30, 58, 138, 0.95)";    // Azul marinho escuro
        borderCor = "#3b82f6";                 // Azul brilhante
        textoCor = "#eff6ff";
        icone = "🌤️";
    }

    const toast = document.createElement("div");
    toast.style.cssText = `
        background-color: ${bgCor};
        border: 2px solid ${borderCor};
        color: ${textoCor};
        padding: 12px 18px;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 10px 25px rgba(0,0,0,0.6);
        backdrop-filter: blur(5px);
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        box-sizing: border-box;
        opacity: 0;
        transform: translateY(-15px);
        transition: all 0.4s ease-in-out;
    `;

    toast.innerHTML = `
        <span style="font-size: 18px; flex-shrink: 0;">${icone}</span>
        <span style="flex: 1; line-height: 1.4;">${mensagem}</span>
        <button style="background: none; border: none; color: ${borderCor}; font-size: 16px; font-weight: bold; cursor: pointer; padding: 0 4px;" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    });

    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(-15px)";
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 400);
        }
    }, duracaoMs);
}

export function exibirPopUpLimite() {
    exibirPopUpAviso("⚠️ Limite máximo de terrenos atingido!", "multa");
}

export function exibirPopUpSemDinheiro() {
    exibirPopUpAviso("💸 Dinheiro insuficiente!", "multa");
}