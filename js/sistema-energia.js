import { atualizarConsumoEnergia } from './hud.js';
import { CONFIG_BOMBA_AGUA, CONFIG_CAIXA_AGUA } from './variaveis-importantes.js';

// Consumo base inicial: 10 kW/h apenas da Sede Administrativa
const CONSUMO_BASE_SEDE = 10;
// Adicional fixo por qualquer construção no mapa
const CONSUMO_POR_CONSTRUCAO = 1;

let consumoTotalEnergia = CONSUMO_BASE_SEDE;

export function adicionarConsumoEstrutura(tipo) {
    // 1. Adiciona o custo fixo de +1 kW/h por qualquer construção
    consumoTotalEnergia += CONSUMO_POR_CONSTRUCAO;

    // 2. Adiciona o consumo específico do tipo de estrutura (ex: Bomba = 15 kW/h)
    if (tipo === "bomba_agua") {
        consumoTotalEnergia += CONFIG_BOMBA_AGUA.consumoEnergia;
    } else if (tipo === "caixa_agua") {
        consumoTotalEnergia += CONFIG_CAIXA_AGUA.consumoEnergia;
    }

    atualizarConsumoEnergia(consumoTotalEnergia);
}

export function removerConsumoEstrutura(tipo) {
    // 1. Subtrai o custo fixo de +1 kW/h da construção
    let reducao = CONSUMO_POR_CONSTRUCAO;

    // 2. Subtrai o consumo específico do tipo de estrutura
    if (tipo === "bomba_agua") {
        reducao += CONFIG_BOMBA_AGUA.consumoEnergia;
    } else if (tipo === "caixa_agua") {
        reducao += CONFIG_CAIXA_AGUA.consumoEnergia;
    }

    // Não permite reduzir abaixo do consumo base da Sede Administrativa (10 kW/h)
    consumoTotalEnergia = Math.max(CONSUMO_BASE_SEDE, consumoTotalEnergia - reducao);

    atualizarConsumoEnergia(consumoTotalEnergia);
}

export function getConsumoTotalEnergia() {
    return consumoTotalEnergia;
}