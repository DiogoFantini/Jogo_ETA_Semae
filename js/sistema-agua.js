import { registerGameAnimation, getDataAtual } from './tempo.js';
import { atualizarAguaDistribuida } from './hud.js';
import { CONFIG_BOMBA_AGUA, CONFIG_CAIXA_AGUA } from './variaveis-importantes.js';
import { getEventoClimaticoAtual } from './clima.js';

// ==========================================================
// ESTADO DO SISTEMA DE ÁGUA
// ==========================================================
let totalAguaDistribuida = 0;
let quantidadeBombas = 0;
let quantidadeCaixas = 0;
let ultimoTextoHUD = ""; // Cache para evitar atualizações redundantes no DOM

const MINUTOS_INGAME_POR_SEGUNDO_REAL = 2.4;

// ==========================================================
// GESTÃO DE ESTRUTURAS (EXPORTADAS)
// ==========================================================
export function adicionarEstruturaAgua(tipo) {
    if (tipo === "bomba_agua") quantidadeBombas++;
    else if (tipo === "caixa_agua") quantidadeCaixas++;
}

export function removerEstruturaAgua(tipo) {
    if (tipo === "bomba_agua" && quantidadeBombas > 0) quantidadeBombas--;
    else if (tipo === "caixa_agua" && quantidadeCaixas > 0) quantidadeCaixas--;
}

export function getAguaDistribuida() { return totalAguaDistribuida; }
export function getQuantidadeBombas() { return quantidadeBombas; }
export function getQuantidadeCaixas() { return quantidadeCaixas; }

// ==========================================================
// CÁLCULO DE CAUDAL E PRODUÇÃO
// ==========================================================
export function getVazaoAtualHora() {
    if (quantidadeBombas === 0) return 0;

    const clima = getEventoClimaticoAtual();
    const multSeca = clima ? clima.multiplicadorVazaoBombas : 1.0;

    const vazaoBaseHora = quantidadeBombas * CONFIG_BOMBA_AGUA.vazaoHora * multSeca;
    const horaAtual = getDataAtual().getHours();
    const ehHorarioPico = horaAtual >= 7 && horaAtual < 18;

    let multiplicadorCaixa = 1.0;
    if (ehHorarioPico && quantidadeCaixas > 0) {
        multiplicadorCaixa += quantidadeCaixas * CONFIG_CAIXA_AGUA.bonusDistribuicaoDia;
    }

    return vazaoBaseHora * multiplicadorCaixa;
}

// ==========================================================
// SIMULAÇÃO CONTÍNUA (INTEGRADA AO LOOP DE ANIMAÇÃO)
// ==========================================================
export function iniciarSistemaAgua(scene) {
    registerGameAnimation(scene, (dt) => {
        const clima = getEventoClimaticoAtual();
        const multSeca = clima ? clima.multiplicadorVazaoBombas : 1.0;
        const ehChuva = clima && clima.id === "chuva_forte";

        if (quantidadeBombas > 0) {
            const minutosInGamePassados = dt * MINUTOS_INGAME_POR_SEGUNDO_REAL;
            const horaAtual = getDataAtual().getHours();
            const ehHorarioPico = horaAtual >= 7 && horaAtual < 18;

            let multiplicadorCaixa = 1.0;
            if (ehHorarioPico && quantidadeCaixas > 0) {
                multiplicadorCaixa += quantidadeCaixas * CONFIG_CAIXA_AGUA.bonusDistribuicaoDia;
            }

            const aguaProduzidaNoFrame = quantidadeBombas * (CONFIG_BOMBA_AGUA.vazaoMinuto * multSeca) * minutosInGamePassados;
            totalAguaDistribuida += aguaProduzidaNoFrame * multiplicadorCaixa;
        }

        // Formatação do valor para o HUD
        const vazaoHora = getVazaoAtualHora();
        let valorFormatado = vazaoHora % 1 === 0 
            ? `${vazaoHora} m³/h` 
            : `${vazaoHora.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} m³/h`;

        if (multSeca < 1.0) {
            valorFormatado += " <span style='color: #fb923c; font-size: 13px;'>(🌵 -30% Seca)</span>";
        } else if (ehChuva) {
            valorFormatado += " <span style='color: #60a5fa; font-size: 13px;'>(🌧️ Manutenção +50%/h)</span>";
        }

        // Só atualiza o elemento DOM se a string tiver mudado
        if (valorFormatado !== ultimoTextoHUD) {
            ultimoTextoHUD = valorFormatado;
            atualizarAguaDistribuida(valorFormatado);
        }
    });
}