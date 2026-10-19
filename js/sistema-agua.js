import { registerGameAnimation, getDataAtual } from './tempo.js';
import { atualizarAguaDistribuida } from './hud.js';
import { CONFIG_BOMBA_AGUA, CONFIG_CAIXA_AGUA } from './variaveis-importantes.js';
import { getEventoClimaticoAtual } from './clima.js';
import { gastarDinheiro } from './condicoes.js';

let totalAguaDistribuida = 0;
let quantidadeBombas = 0;
let quantidadeCaixas = 0;

const MINUTOS_INGAME_POR_SEGUNDO_REAL = 2.4;
const CUSTO_QUIMICO_TURBIDEZ_M3 = 0.50; // R$ 0,50 extra por m³ em dias de chuva forte

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

export function iniciarSistemaAgua(scene) {
    registerGameAnimation(scene, (dt) => {
        const clima = getEventoClimaticoAtual();
        const multSeca = clima ? clima.multiplicadorVazaoBombas : 1.0;
        const ehChuva = clima && clima.id === "chuva_forte";

        if (quantidadeBombas > 0) {
            const minutosInGamePassados = dt * MINUTOS_INGAME_POR_SEGUNDO_REAL;
            const aguaProduzidaNoFrame = quantidadeBombas * (CONFIG_BOMBA_AGUA.vazaoMinuto * multSeca) * minutosInGamePassados;

            const horaAtual = getDataAtual().getHours();
            const ehHorarioPico = horaAtual >= 7 && horaAtual < 18;

            let multiplicadorCaixa = 1.0;
            if (ehHorarioPico && quantidadeCaixas > 0) {
                multiplicadorCaixa += quantidadeCaixas * CONFIG_CAIXA_AGUA.bonusDistribuicaoDia;
            }

            const aguaFinalDistribuida = aguaProduzidaNoFrame * multiplicadorCaixa;
            totalAguaDistribuida += aguaFinalDistribuida;

            // Se estiver chovendo, cobra o custo extra dos produtos químicos de tratamento
            if (ehChuva) {
                const custoQuimico = aguaFinalDistribuida * CUSTO_QUIMICO_TURBIDEZ_M3;
                gastarDinheiro(custoQuimico);
            }
        }

        const vazaoHora = getVazaoAtualHora();
        let valorFormatado = vazaoHora % 1 === 0 
            ? `${vazaoHora} m³/h` 
            : `${vazaoHora.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} m³/h`;

        if (multSeca < 1.0) {
            valorFormatado += " <span style='color: #fb923c; font-size: 13px;'>(🌵 -30% Seca)</span>";
        } else if (ehChuva) {
            valorFormatado += " <span style='color: #60a5fa; font-size: 13px;'>(🌧️ Tratamento Complexo)</span>";
        }

        atualizarAguaDistribuida(valorFormatado);
    });
}