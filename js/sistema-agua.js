import { registerGameAnimation, getDataAtual } from './tempo.js';
import { atualizarAguaDistribuida } from './hud.js';
import { CONFIG_BOMBA_AGUA, CONFIG_CAIXA_AGUA } from './variaveis-importantes.js';

let totalAguaDistribuida = 0;
let quantidadeBombas = 0;
let quantidadeCaixas = 0;

// Proporção do tempo in-game a 1x: 2.4 minutos in-game por segundo real (144s / 60)
const MINUTOS_INGAME_POR_SEGUNDO_REAL = 2.4;

export function adicionarEstruturaAgua(tipo) {
    if (tipo === "bomba_agua") {
        quantidadeBombas++;
    } else if (tipo === "caixa_agua") {
        quantidadeCaixas++;
    }
    console.log(`[SISTEMA DE ÁGUA] Estrutura Adicionada: ${tipo} | Total Bombas: ${quantidadeBombas} | Total Caixas: ${quantidadeCaixas}`);
}

export function removerEstruturaAgua(tipo) {
    if (tipo === "bomba_agua" && quantidadeBombas > 0) {
        quantidadeBombas--;
    } else if (tipo === "caixa_agua" && quantidadeCaixas > 0) {
        quantidadeCaixas--;
    }
    console.log(`[SISTEMA DE ÁGUA] Estrutura Removida: ${tipo} | Total Bombas: ${quantidadeBombas} | Total Caixas: ${quantidadeCaixas}`);
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

export function iniciarSistemaAgua(scene) {
    registerGameAnimation(scene, (dt) => {
        if (quantidadeBombas === 0) return;

        // 1. Minutos in-game transcorridos no frame
        const minutosInGamePassados = dt * MINUTOS_INGAME_POR_SEGUNDO_REAL;
        
        // 2. Captação base das bombas d'água
        const aguaBaseBomba = quantidadeBombas * CONFIG_BOMBA_AGUA.vazaoMinuto * minutosInGamePassados;

        // 3. Verifica se está no horário de pico (07:00 até 18:00)
        const horaAtual = getDataAtual().getHours();
        const ehHorarioPico = horaAtual >= 7 && horaAtual < 18;

        // Multiplicador percentual: +25% por caixa d'água no horário de pico
        let multiplicadorCaixa = 1.0;
        if (ehHorarioPico && quantidadeCaixas > 0) {
            multiplicadorCaixa += quantidadeCaixas * CONFIG_CAIXA_AGUA.bonusDistribuicaoDia;
        }

        // 4. Volume total de água gerada no frame
        const aguaGerada = aguaBaseBomba * multiplicadorCaixa;
        totalAguaDistribuida += aguaGerada;

        // 5. Formatação de exibição na HUD
        let textoFormatado;
        if (totalAguaDistribuida < 100) {
            textoFormatado = `${totalAguaDistribuida.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m³`;
        } else {
            textoFormatado = `${Math.floor(totalAguaDistribuida).toLocaleString('pt-BR')} m³`;
        }

        atualizarAguaDistribuida(textoFormatado);
    });
}