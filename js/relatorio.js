import { registerGameAnimation, getDataAtual } from './tempo.js';
import { formatarDinheiro, gastarDinheiro, exibirPopUpAviso } from './condicoes.js';
import { getConsumoTotalEnergia } from './sistema-energia.js';
import { getQuantidadeBombas, getQuantidadeCaixas, getAguaDistribuida } from './sistema-agua.js';

// Custos Razoáveis de Manutenção Semanal das Estruturas
export const CUSTO_MANUTENCAO_ESTRUTURAS = {
    bomba_agua: 350, // R$ 350 por semana por bomba
    caixa_agua: 150  // R$ 150 por semana por caixa d'água
};

// Custo do kW/h por semana (R$ 120,00 por kW/h acumulado na semana)
export const VALOR_KWH_SEMANAL = 120;

// Registros do Período Atual
let receitaAtualSemana = 0;
let gastosConstrucaoAtual = 0;
let gastosQuimicosAtual = 0;
let gastosMultasAtual = 0;
let aguaAcumuladaSemanaInicio = 0;

let historicoRelatoriosSemanais = [];
let ultimoDiaCobrado = -1;

// ==========================================================
// REGISTRO DE TRANSAÇÕES FINANCEIRAS E OPERACIONAIS
// ==========================================================
export function registrarEntradaFinanceira(valor) {
    receitaAtualSemana += valor;
}

export function registrarGastoConstrucao(valor) {
    gastosConstrucaoAtual += valor;
}

export function registrarGastoQuimico(valor) {
    gastosQuimicosAtual += valor;
}

export function registrarGastoMulta(valor) {
    gastosMultasAtual += valor;
}

export function getHistoricoRelatorios() {
    return historicoRelatoriosSemanais;
}

// ==========================================================
// PROCESSAMENTO SEMANAL DE DESPESAS E RELATÓRIO
// ==========================================================
export function setupSistemaRelatorio(scene) {
    registerGameAnimation(scene, () => {
        const data = getDataAtual();
        const diasTotais = Math.floor(data.getTime() / (1000 * 60 * 60 * 24));

        if (ultimoDiaCobrado !== -1 && (diasTotais - ultimoDiaCobrado) >= 7) {
            fecharEGerarRelatorioSemanal(diasTotais);
            ultimoDiaCobrado = diasTotais;
        } else if (ultimoDiaCobrado === -1) {
            ultimoDiaCobrado = diasTotais;
            aguaAcumuladaSemanaInicio = getAguaDistribuida();
        }
    });
}

function fecharEGerarRelatorioSemanal(diasTotais) {
    const numSemana = Math.floor(diasTotais / 7);
    const kwTotal = getConsumoTotalEnergia();
    const gastoEnergia = kwTotal * VALOR_KWH_SEMANAL;

    const qtdBombas = getQuantidadeBombas();
    const qtdCaixas = getQuantidadeCaixas();
    const manutencaoBombas = qtdBombas * CUSTO_MANUTENCAO_ESTRUTURAS.bomba_agua;
    const manutencaoCaixas = qtdCaixas * CUSTO_MANUTENCAO_ESTRUTURAS.caixa_agua;
    const gastoManutencaoTotal = manutencaoBombas + manutencaoCaixas;

    const totalDespesasFixas = gastoEnergia + gastoManutencaoTotal;

    // Cobra o valor de energia e manutenção
    if (totalDespesasFixas > 0) {
        gastarDinheiro(totalDespesasFixas);
    }

    const totalAguaAgora = getAguaDistribuida();
    const aguaProduzidaSemana = Math.max(0, totalAguaAgora - aguaAcumuladaSemanaInicio);
    aguaAcumuladaSemanaInicio = totalAguaAgora;

    const totalGastosGerais = gastoEnergia + gastoManutencaoTotal + gastosConstrucaoAtual + gastosQuimicosAtual + gastosMultasAtual;
    const saldoLiquidoSemana = receitaAtualSemana - totalGastosGerais;

    const relatorioSemana = {
        semana: numSemana,
        aguaDistribuidaM3: Math.round(aguaProduzidaSemana),
        kwConsumo: kwTotal,
        qtdBombas: qtdBombas,
        qtdCaixas: qtdCaixas,
        receitas: {
            contratos: receitaAtualSemana,
            total: receitaAtualSemana
        },
        despesas: {
            energia: gastoEnergia,
            manutencaoBombas: manutencaoBombas,
            manutencaoCaixas: manutencaoCaixas,
            manutencaoTotal: gastoManutencaoTotal,
            construcao: gastosConstrucaoAtual,
            quimicosChuva: gastosQuimicosAtual,
            multasDeficit: gastosMultasAtual,
            total: totalGastosGerais
        },
        saldoLiquido: saldoLiquidoSemana
    };

    historicoRelatoriosSemanais.unshift(relatorioSemana); // Mais recente primeiro

    // Reseta acumuladores para a próxima semana
    receitaAtualSemana = 0;
    gastosConstrucaoAtual = 0;
    gastosQuimicosAtual = 0;
    gastosMultasAtual = 0;

    // POP-UP DE AVISO AO FINAL DA SEMANA
    exibirAvisoRelatorioDisponivel();
}

function exibirAvisoRelatorioDisponivel() {
    exibirPopUpAviso("📊 Relatório mensal disponível na Sede");
}