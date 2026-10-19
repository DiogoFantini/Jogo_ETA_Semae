import { registerGameAnimation, getDataAtual } from './tempo.js';
import { atualizarAguaDistribuida } from './hud.js';
import { CONFIG_BOMBA_AGUA, CONFIG_CAIXA_AGUA } from './variaveis-importantes.js';

let totalAguaDistribuida = 0; // Mantida e acumulada para mecânicas futuras
let quantidadeBombas = 0;
let quantidadeCaixas = 0;

const MINUTOS_INGAME_POR_SEGUNDO_REAL = 2.4;

export function adicionarEstruturaAgua(tipo) {
    if (tipo === "bomba_agua") {
        quantidadeBombas++;
    } else if (tipo === "caixa_agua") {
        quantidadeCaixas++;
    }
}

export function removerEstruturaAgua(tipo) {
    if (tipo === "bomba_agua" && quantidadeBombas > 0) {
        quantidadeBombas--;
    } else if (tipo === "caixa_agua" && quantidadeCaixas > 0) {
        quantidadeCaixas--;
    }
}

export function getAguaDistribuida() {
    return totalAguaDistribuida;
}

export function getQuantidadeBombas() {
    return quantidadeBombas;
}

export function getQuantidadeCaixas() {
    return quantidadeCaixas;
}

// Retorna a vazão atual exata em m³/hora considerando bombas e bônus ativos das caixas
export function getVazaoAtualHora() {
    if (quantidadeBombas === 0) return 0;

    const vazaoBaseHora = quantidadeBombas * CONFIG_BOMBA_AGUA.vazaoHora;
    const horaAtual = getDataAtual().getHours();
    const ehHorarioPico = horaAtual >= 7 && horaAtual < 18;

    let multiplicadorCaixa = 1.0;
    if (ehHorarioPico && quantidadeCaixas > 0) {
        multiplicadorCaixa += quantidadeCaixas * CONFIG_CAIXA_AGUA.bonusDistribuicaoDia;
    }

    return vazaoBaseHora * multiplicadorCaixa;
}

export function iniciarSistemaAgua(scene) {
    registerGameAnimation(scene, (dt) => {
        // 1. Acúmulo continuo de água distribuída (mantido para uso futuro)
        if (quantidadeBombas > 0) {
            const minutosInGamePassados = dt * MINUTOS_INGAME_POR_SEGUNDO_REAL;
            const aguaBaseBomba = quantidadeBombas * CONFIG_BOMBA_AGUA.vazaoMinuto * minutosInGamePassados;

            const horaAtual = getDataAtual().getHours();
            const ehHorarioPico = horaAtual >= 7 && horaAtual < 18;

            let multiplicadorCaixa = 1.0;
            if (ehHorarioPico && quantidadeCaixas > 0) {
                multiplicadorCaixa += quantidadeCaixas * CONFIG_CAIXA_AGUA.bonusDistribuicaoDia;
            }

            const aguaGerada = aguaBaseBomba * multiplicadorCaixa;
            totalAguaDistribuida += aguaGerada;
        }

        // 2. Cálculo e atualização da "Vazão atual" na HUD (em m³/h)
        const vazaoHora = getVazaoAtualHora();
        let textoFormatado;
        
        if (vazaoHora % 1 === 0) {
            textoFormatado = `${vazaoHora} m³/h`;
        } else {
            textoFormatado = `${vazaoHora.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} m³/h`;
        }

        atualizarAguaDistribuida(textoFormatado);
    });
}