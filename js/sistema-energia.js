import { atualizarConsumoEnergia } from './hud.js';
import { CONFIG_BOMBA_AGUA, CONFIG_CAIXA_AGUA } from './variaveis-importantes.js';

// ==========================================================
// CONSTANTES E CONFIGURAÇÕES DE ENERGIA
// ==========================================================
const CONSUMO_BASE_SEDE = 10; // Consumo fixo inicial da Sede Administrativa
const CONSUMO_POR_CONSTRUCAO = 1; // Adicional fixo por qualquer estrutura no mapa

let consumoTotalEnergia = CONSUMO_BASE_SEDE;

// ==========================================================
// FUNÇÕES AUXILIARES
// ==========================================================
function obterConsumoPorTipo(tipo) {
    if (tipo === "bomba_agua") {
        return CONFIG_BOMBA_AGUA.consumoEnergia;
    }
    if (tipo === "caixa_agua") {
        return CONFIG_CAIXA_AGUA.consumoEnergia;
    }
    return 0;
}

// ==========================================================
// GESTÃO DO CONSUMO DE ENERGIA (EXPORTADAS)
// ==========================================================
export function adicionarConsumoEstrutura(tipo) {
    const consumoAdicional = CONSUMO_POR_CONSTRUCAO + obterConsumoPorTipo(tipo);
    consumoTotalEnergia += consumoAdicional;
    atualizarConsumoEnergia(consumoTotalEnergia);
}

export function removerConsumoEstrutura(tipo) {
    const reducao = CONSUMO_POR_CONSTRUCAO + obterConsumoPorTipo(tipo);
    consumoTotalEnergia = Math.max(CONSUMO_BASE_SEDE, consumoTotalEnergia - reducao);
    atualizarConsumoEnergia(consumoTotalEnergia);
}

export function getConsumoTotalEnergia() {
    return consumoTotalEnergia;
}

export function resetarConsumoEnergia() {
    consumoTotalEnergia = CONSUMO_BASE_SEDE;
    atualizarConsumoEnergia(consumoTotalEnergia);
}