import { registerGameAnimation } from './tempo.js';
import { atualizarAguaDistribuida } from './hud.js';
import { CONFIG_BOMBA_AGUA } from './variaveis-importantes.js';

let totalAguaDistribuida = 0;
let quantidadeBombas = 0;

// Proporção do tempo in-game a 1x: 2.4 minutos in-game por segundo real (144s / 60)
const MINUTOS_INGAME_POR_SEGUNDO_REAL = 2.4;

export function adicionarEstruturaAgua(tipo) {
    if (tipo === "bomba_agua") {
        quantidadeBombas++;
    }
}

export function removerEstruturaAgua(tipo) {
    if (tipo === "bomba_agua" && quantidadeBombas > 0) {
        quantidadeBombas--;
    }
}

export function getAguaDistribuida() {
    return totalAguaDistribuida;
}

export function getQuantidadeBombas() {
    return quantidadeBombas;
}

export function iniciarSistemaAgua(scene) {
    registerGameAnimation(scene, (dt) => {
        if (quantidadeBombas === 0) return;

        // Calcula os minutos passados no relógio do jogo
        const minutosInGamePassados = dt * MINUTOS_INGAME_POR_SEGUNDO_REAL;
        
        // Puxa o valor da vazão por minuto configurado em variaveis-importantes.js (0.25 m³)
        const aguaGerada = quantidadeBombas * CONFIG_BOMBA_AGUA.vazaoMinuto * minutosInGamePassados;

        totalAguaDistribuida += aguaGerada;

        // Exibe o acumulado formatado com casas decimais se for menor que 10 m³, ou valor inteiro formatado
        let textoFormatado;
        if (totalAguaDistribuida < 10) {
            textoFormatado = `${totalAguaDistribuida.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m³`;
        } else {
            textoFormatado = `${Math.floor(totalAguaDistribuida).toLocaleString('pt-BR')} m³`;
        }

        atualizarAguaDistribuida(textoFormatado);
    });
}