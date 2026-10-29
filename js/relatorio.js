import { registerGameAnimation, getDataAtual, getDiasDecorridos } from './tempo.js';
import { formatarDinheiro, gastarDinheiro, exibirPopUpAviso } from './condicoes.js';
import { getConsumoTotalEnergia } from './sistema-energia.js';
import { getQuantidadeBombas, getQuantidadeCaixas, getAguaDistribuida } from './sistema-agua.js';

export const CUSTO_MANUTENCAO_ESTRUTURAS = {
    bomba_agua: 350,
    caixa_agua: 150
};

export const VALOR_KWH_SEMANAL = 120;

let receitaAtualSemana = 0;
let detalheReceitasContratos = []; // Guarda { cliente, valor } dos pagamentos da semana
let gastosConstrucaoAtual = 0;
let gastosManutencaoChuvaAtual = 0;
let gastosMultasAtual = 0;
let aguaAcumuladaSemanaInicio = 0;

let historicoRelatoriosSemanais = [];
let ultimaSemanaCobrada = 0;

export function registrarEntradaFinanceira(valor, nomeCliente = null) { 
    receitaAtualSemana += valor; 
    if (nomeCliente && valor > 0) {
        detalheReceitasContratos.push({ cliente: nomeCliente, valor: valor });
    }
}
export function registrarGastoConstrucao(valor) { gastosConstrucaoAtual += valor; }
export function registrarAdicionalManutencaoChuva(valor) { gastosManutencaoChuvaAtual += valor; }
export function registrarGastoMulta(valor) { gastosMultasAtual += valor; }
export function getHistoricoRelatorios() { return historicoRelatoriosSemanais; }

export function setupSistemaRelatorio(scene) {
    aguaAcumuladaSemanaInicio = getAguaDistribuida();

    registerGameAnimation(scene, () => {
        const data = getDataAtual();
        const diasDecorridos = getDiasDecorridos(data);
        const semanaAtual = Math.floor(diasDecorridos / 7);

        // Dispara o fechamento do relatório a cada virada de semana
        if (semanaAtual > ultimaSemanaCobrada) {
            fecharEGerarRelatorioSemanal(ultimaSemanaCobrada + 1);
            ultimaSemanaCobrada = semanaAtual;
        }
    });
}

function fecharEGerarRelatorioSemanal(numSemana) {
    const kwTotal = getConsumoTotalEnergia();
    const gastoEnergia = kwTotal * VALOR_KWH_SEMANAL;

    const qtdBombas = getQuantidadeBombas();
    const qtdCaixas = getQuantidadeCaixas();
    const manutencaoBaseBombas = qtdBombas * CUSTO_MANUTENCAO_ESTRUTURAS.bomba_agua;
    const manutencaoBaseCaixas = qtdCaixas * CUSTO_MANUTENCAO_ESTRUTURAS.caixa_agua;
    const manutencaoBaseTotal = manutencaoBaseBombas + manutencaoBaseCaixas;

    const manutencaoChuvaArredondada = Math.round(gastosManutencaoChuvaAtual);
    const manutencaoTotalFinal = manutencaoBaseTotal + manutencaoChuvaArredondada;

    const totalDespesasFixas = gastoEnergia + manutencaoTotalFinal;

    if (totalDespesasFixas > 0) {
        gastarDinheiro(totalDespesasFixas);
    }

    const totalAguaAgora = getAguaDistribuida();
    const aguaProduzidaSemana = Math.max(0, totalAguaAgora - aguaAcumuladaSemanaInicio);
    aguaAcumuladaSemanaInicio = totalAguaAgora;

    const totalGastosGerais = gastoEnergia + manutencaoTotalFinal + gastosConstrucaoAtual + gastosMultasAtual;
    const saldoLiquidoSemana = receitaAtualSemana - totalGastosGerais;

    const relatorioSemana = {
        semana: numSemana,
        aguaDistribuidaM3: Math.round(aguaProduzidaSemana),
        kwConsumo: kwTotal,
        qtdBombas: qtdBombas,
        qtdCaixas: qtdCaixas,
        receitas: {
            contratos: receitaAtualSemana,
            detalhesContratos: [...detalheReceitasContratos],
            total: receitaAtualSemana
        },
        despesas: {
            energia: gastoEnergia,
            manutencaoBase: manutencaoBaseTotal,
            manutencaoChuva: manutencaoChuvaArredondada,
            manutencaoTotal: manutencaoTotalFinal,
            construcao: gastosConstrucaoAtual,
            multasDeficit: gastosMultasAtual,
            total: totalGastosGerais
        },
        saldoLiquido: saldoLiquidoSemana
    };

    historicoRelatoriosSemanais.unshift(relatorioSemana);

    receitaAtualSemana = 0;
    detalheReceitasContratos = [];
    gastosConstrucaoAtual = 0;
    gastosManutencaoChuvaAtual = 0;
    gastosMultasAtual = 0;

    exibirAvisoRelatorioDisponivel();
}

function exibirAvisoRelatorioDisponivel() {
    exibirPopUpAviso("📊 Relatório mensal disponível na Sede");
}

window.addEventListener("DANO_CHUVA", () => {
    const qtdBombas = getQuantidadeBombas();
    const qtdCaixas = getQuantidadeCaixas();
    const manutencaoSemanaBase = (qtdBombas * CUSTO_MANUTENCAO_ESTRUTURAS.bomba_agua) + (qtdCaixas * CUSTO_MANUTENCAO_ESTRUTURAS.caixa_agua);
    const manutencaoHoraBase = manutencaoSemanaBase / 168;
    
    registrarAdicionalManutencaoChuva(manutencaoHoraBase * 0.50);
});