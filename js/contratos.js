import { getDataAtual, registerGameAnimation } from './tempo.js';
import { formatarDinheiro, adicionarDinheiro, gastarDinheiro, exibirPopUpAviso } from './condicoes.js';
import { getVazaoAtualHora } from './sistema-agua.js';
import { getHistoricoRelatorios, registrarEntradaFinanceira, registrarGastoMulta } from './relatorio.js';
import { getEventoClimaticoAtual } from './clima.js';
import { atualizarMeta } from './hud.js';
import { renderizarAbaInvestimentos } from './investimentos.js';

// ==========================================================
// CONFIGURAÇÕES E LIMITES DE CONTRATOS
// ==========================================================
export let MAX_CONTRATOS_ATIVOS = 5;
let contratosDisponiveis = [];
let contratosAtivos = [];
let proximoIdContrato = 1;

let ultimoDiaGeracao = -1;
let ultimoDiaSemana = -1;

const NOMES_CLIENTES = [
    { nome: "Bairro Residencial das Palmeiras", tipo: "facil" },
    { nome: "Loteamento São José", tipo: "facil" },
    { nome: "Comércio Local do Centro", tipo: "facil" },
    { nome: "Hospital Municipal & Postos de Saúde", tipo: "facil" },
    { nome: "Condomínio Ouro Verde", tipo: "medio" },
    { nome: "Distrito Comercial Leste", tipo: "medio" },
    { nome: "Parque Industrial Leve", tipo: "medio" },
    { nome: "Rede de Hotéis e Turismo", tipo: "medio" },
    { nome: "Complexo Industrial Norte", tipo: "dificil" },
    { nome: "Polo Petroquímico Piracicaba", tipo: "dificil" },
    { nome: "Zona Franca de Manufatura", tipo: "dificil" },
    { nome: "Região Metropolitana Integrada", tipo: "dificil" }
];

function entre(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gerarNovoContrato(dificuldadeForçada) {
    const clientesFiltrados = NOMES_CLIENTES.filter(c => c.tipo === dificuldadeForçada);
    const clienteEscolhido = clientesFiltrados[Math.floor(Math.random() * clientesFiltrados.length)].nome;

    let demandaVazaoHora = 0;
    let duracaoSemanas = 0;
    let valorPorM3Semanal = 0;

    if (dificuldadeForçada === "facil") {
        demandaVazaoHora = entre(12, 25);
        duracaoSemanas = entre(2, 4);
        valorPorM3Semanal = entre(290, 330);
    } else if (dificuldadeForçada === "medio") {
        demandaVazaoHora = entre(30, 75);
        duracaoSemanas = entre(4, 8);
        valorPorM3Semanal = entre(380, 430);
    } else { // dificil
        demandaVazaoHora = entre(80, 180);
        duracaoSemanas = entre(8, 16);
        valorPorM3Semanal = entre(480, 540);
    }

    const pagamentoSemanal = Math.round(demandaVazaoHora * valorPorM3Semanal);
    const valorTotalFinal = pagamentoSemanal * duracaoSemanas;

    return {
        id: proximoIdContrato++,
        cliente: clienteEscolhido,
        dificuldade: dificuldadeForçada,
        demandaHora: demandaVazaoHora,
        duracaoSemanas: duracaoSemanas,
        semanasConcluidas: 0,
        pagamentoSemanal: pagamentoSemanal,
        valorTotalFinal: valorTotalFinal
    };
}

function gerarLoteEquilibradoContratos() {
    contratosDisponiveis = [
        gerarNovoContrato("facil"),
        gerarNovoContrato("facil"),
        gerarNovoContrato("medio"),
        gerarNovoContrato("medio"),
        gerarNovoContrato("dificil"),
        gerarNovoContrato("dificil")
    ];
}

export function atualizarMetaHUDContratos() {
    if (contratosAtivos.length === 0) {
        atualizarMeta("Pegue um contrato na sede", false);
    } else {
        const clima = getEventoClimaticoAtual();
        const multDemanda = clima ? clima.multiplicadorDemanda : 1.0;

        const demandaBaseTotal = contratosAtivos.reduce((acc, c) => acc + c.demandaHora, 0);
        const demandaEfetivaTotal = Math.round(demandaBaseTotal * multDemanda);
        const vazaoAtualETA = Math.round(getVazaoAtualHora());
        const atendeDemanda = vazaoAtualETA >= demandaEfetivaTotal;
        
        const sufixoCalor = multDemanda > 1.0 ? " 🔥 +25%" : "";
        const textoMeta = `${demandaEfetivaTotal} m³/h${sufixoCalor} (${contratosAtivos.length}/${MAX_CONTRATOS_ATIVOS} ${contratosAtivos.length === 1 ? 'contrato' : 'contratos'})`;
        atualizarMeta(textoMeta, atendeDemanda);
    }
}

export function setupPainelContratos(scene, predioVisual, hitbox) {
    if (contratosDisponiveis.length === 0) {
        gerarLoteEquilibradoContratos();
    }

    atualizarMetaHUDContratos();

    const painelOverlay = document.createElement("div");
    painelOverlay.id = "painel-contratos-overlay";
    painelOverlay.style.position = "fixed";
    painelOverlay.style.top = "0";
    painelOverlay.style.left = "0";
    painelOverlay.style.width = "100vw";
    painelOverlay.style.height = "100vh";
    painelOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    painelOverlay.style.backdropFilter = "blur(5px)";
    painelOverlay.style.display = "none";
    painelOverlay.style.justifyContent = "center";
    painelOverlay.style.alignItems = "center";
    painelOverlay.style.zIndex = "9998";

    const painelBox = document.createElement("div");
    painelBox.style.backgroundColor = "#0f172a";
    painelBox.style.border = "2px solid #38bdf8";
    painelBox.style.borderRadius = "12px";
    painelBox.style.padding = "25px";
    painelBox.style.width = "90%";
    painelBox.style.maxWidth = "720px";
    painelBox.style.boxShadow = "0 15px 35px rgba(0,0,0,0.8)";
    painelBox.style.fontFamily = "Arial, sans-serif";
    painelBox.style.color = "#ffffff";

    painelBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 15px;">
            <h2 style="margin: 0; color: #38bdf8; font-size: 20px;">🏛️ Sede Administrativa</h2>
            <button id="btn-fechar-contratos" style="background: transparent; border: none; color: #94a3b8; font-size: 20px; font-weight: bold; cursor: pointer;">✕</button>
        </div>

        <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 15px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
            <div>🌊 Vazão Atual da ETA: <strong id="val-vazao-eta" style="color: #38bdf8;">0 m³/h</strong></div>
            <div>📋 Demanda Contratada: <strong id="val-demanda-contratada" style="color: #fde047;">0 m³/h</strong></div>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 15px; border-bottom: 1px solid #334155; padding-bottom: 10px;">
            <button id="aba-disponiveis" style="flex: 1; background-color: #0284c7; color: white; border: none; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">Contratos disponíveis</button>
            <button id="aba-ativos" style="flex: 1; background-color: #1e293b; color: #94a3b8; border: 1px solid #334155; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">Contratos ativos (${contratosAtivos.length}/${MAX_CONTRATOS_ATIVOS})</button>
            <button id="aba-relatorio" style="flex: 1; background-color: #1e293b; color: #94a3b8; border: 1px solid #334155; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">📊 Relatório Mensal</button>
            <button id="aba-investimentos" style="flex: 1; background-color: #1e293b; color: #94a3b8; border: 1px solid #334155; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">📈 Investimentos</button>
        </div>

        <div id="lista-contratos-container" style="display: flex; flex-direction: column; gap: 12px; max-height: 350px; overflow-y: auto; padding-right: 5px;"></div>
    `;

    painelOverlay.appendChild(painelBox);
    document.body.appendChild(painelOverlay);

    let abaAtual = "disponiveis";

    const renderizarLista = () => {
        const container = document.getElementById("lista-contratos-container");
        const btnAbaDisp = document.getElementById("aba-disponiveis");
        const btnAbaAtivos = document.getElementById("aba-ativos");
        const btnAbaRelatorio = document.getElementById("aba-relatorio");
        const btnAbaInvestimentos = document.getElementById("aba-investimentos");

        const clima = getEventoClimaticoAtual();
        const multDemanda = clima ? clima.multiplicadorDemanda : 1.0;

        const vazaoAtualETA = Math.round(getVazaoAtualHora());
        const demandaBaseTotal = contratosAtivos.reduce((acc, c) => acc + c.demandaHora, 0);
        const demandaContratadaTotal = Math.round(demandaBaseTotal * multDemanda);

        document.getElementById("val-vazao-eta").innerText = `${vazaoAtualETA} m³/h`;
        document.getElementById("val-demanda-contratada").innerText = `${demandaContratadaTotal} m³/h ${multDemanda > 1.0 ? '(🔥 Onda de Calor)' : ''}`;

        btnAbaDisp.innerText = `Contratos disponíveis`;
        btnAbaAtivos.innerText = `Contratos ativos (${contratosAtivos.length}/${MAX_CONTRATOS_ATIVOS})`;

        [btnAbaDisp, btnAbaAtivos, btnAbaRelatorio, btnAbaInvestimentos].forEach(b => {
            if (b) {
                b.style.backgroundColor = "#1e293b";
                b.style.color = "#94a3b8";
            }
        });

        if (abaAtual === "disponiveis") btnAbaDisp.style.backgroundColor = "#0284c7", btnAbaDisp.style.color = "#fff";
        else if (abaAtual === "ativos") btnAbaAtivos.style.backgroundColor = "#0284c7", btnAbaAtivos.style.color = "#fff";
        else if (abaAtual === "relatorio") btnAbaRelatorio.style.backgroundColor = "#0284c7", btnAbaRelatorio.style.color = "#fff";
        else if (abaAtual === "investimentos") btnAbaInvestimentos.style.backgroundColor = "#0284c7", btnAbaInvestimentos.style.color = "#fff";

        container.innerHTML = "";

        if (abaAtual === "investimentos") {
            renderizarAbaInvestimentos(container);
            return;
        }

        if (abaAtual === "relatorio") {
            const relatorios = getHistoricoRelatorios();

            if (relatorios.length === 0) {
                container.innerHTML = `<div style="text-align: center; color: #64748b; padding: 30px; font-size: 14px;">Ainda não há relatorios semanais fechados. Complete a primeira semana de operação!</div>`;
                return;
            }

            relatorios.forEach(r => {
                const cardRelatorio = document.createElement("div");
                cardRelatorio.style.backgroundColor = "#1e293b";
                cardRelatorio.style.border = "1px solid #334155";
                cardRelatorio.style.borderRadius = "8px";
                cardRelatorio.style.padding = "15px";
                cardRelatorio.style.marginBottom = "10px";

                const saldo = r.saldoLiquido || 0;
                const corSaldo = saldo >= 0 ? "#4ade80" : "#f87171";

                const gastoEnergia = r.despesas?.energia || 0;
                const manutencaoBase = r.despesas?.manutencaoBase || r.despesas?.manutencaoTotal || 0;
                const manutencaoChuva = r.despesas?.manutencaoChuva || r.despesas?.quimicosChuva || 0;
                const gastoConstrucao = r.despesas?.construcao || 0;
                const multas = r.despesas?.multasDeficit || 0;
                const totalDespesas = r.despesas?.total || 0;
                const receitaContratos = r.receitas?.contratos || 0;
                const receitaTotal = r.receitas?.total || 0;

                cardRelatorio.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 8px; margin-bottom: 10px;">
                        <strong style="color: #38bdf8; font-size: 15px;">📅 Relatório da Semana ${r.semana}</strong>
                        <span style="font-size: 13px;">Resultado Líquido: <strong style="color: ${corSaldo}; font-size: 15px;">${formatarDinheiro(saldo)}</strong></span>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 12px;">
                        <div style="background: rgba(74, 222, 128, 0.05); padding: 10px; border-radius: 6px; border: 1px solid rgba(74, 222, 128, 0.2);">
                            <div style="font-weight: bold; color: #4ade80; margin-bottom: 6px; text-transform: uppercase;">📈 Receitas (Entradas)</div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                                <span>Contratos de Água:</span>
                                <strong>${formatarDinheiro(receitaContratos)}</strong>
                            </div>
                            <div style="border-top: 1px solid #334155; margin-top: 6px; padding-top: 4px; display: flex; justify-content: space-between; font-weight: bold; color: #4ade80;">
                                <span>Total Recebido:</span>
                                <span>${formatarDinheiro(receitaTotal)}</span>
                            </div>
                        </div>

                        <div style="background: rgba(248, 113, 113, 0.05); padding: 10px; border-radius: 6px; border: 1px solid rgba(248, 113, 113, 0.2);">
                            <div style="font-weight: bold; color: #f87171; margin-bottom: 6px; text-transform: uppercase;">📉 Despesas (Saídas)</div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                                <span>⚡ Energia (${r.kwConsumo || 0} kW/h):</span>
                                <span style="color: #f87171;">-${formatarDinheiro(gastoEnergia)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                                <span>🛠️ Manutenção Base:</span>
                                <span style="color: #f87171;">-${formatarDinheiro(manutencaoBase)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                                <span>🌧️ Adicional Chuva Forte:</span>
                                <span style="color: #f87171;">-${formatarDinheiro(manutencaoChuva)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                                <span>🏗️ Novas Construções:</span>
                                <span style="color: #f87171;">-${formatarDinheiro(gastoConstrucao)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                                <span>⚠️ Multas por Déficit:</span>
                                <span style="color: #f87171;">-${formatarDinheiro(multas)}</span>
                            </div>
                            <div style="border-top: 1px solid #334155; margin-top: 6px; padding-top: 4px; display: flex; justify-content: space-between; font-weight: bold; color: #f87171;">
                                <span>Total Gastos:</span>
                                <span>-${formatarDinheiro(totalDespesas)}</span>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 10px; padding-top: 6px; border-top: 1px dashed #334155; font-size: 11px; color: #38bdf8; text-align: center;">
                        💧 Volume Total de Água Tratada/Distribuída na Semana: <strong>${(r.aguaDistribuidaM3 || 0).toLocaleString('pt-BR')} m³</strong>
                    </div>
                `;

                container.appendChild(cardRelatorio);
            });
            return;
        }

        const lista = abaAtual === "disponiveis" ? contratosDisponiveis : contratosAtivos;

        if (lista.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: #64748b; padding: 20px; font-size: 14px;">Nenhum contrato ${abaAtual === "disponiveis" ? "disponível no momento" : "ativo no momento"}.</div>`;
            return;
        }

        lista.forEach(c => {
            const card = document.createElement("div");
            card.style.backgroundColor = "#1e293b";
            card.style.border = "1px solid #334155";
            card.style.borderRadius = "8px";
            card.style.padding = "12px 15px";
            card.style.display = "flex";
            card.style.flexDirection = "column";
            card.style.gap = "8px";

            let corDificuldade = "#4ade80";
            let rotuloDif = "Fácil";

            if (c.dificuldade === "medio") { corDificuldade = "#fde047"; rotuloDif = "Médio"; }
            else if (c.dificuldade === "dificil") { corDificuldade = "#f87171"; rotuloDif = "Difícil"; }

            const demandaExibicao = abaAtual === "ativos" ? Math.round(c.demandaHora * multDemanda) : c.demandaHora;

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <strong style="color: #ffffff; font-size: 14px;">${c.cliente}</strong>
                            <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background-color: rgba(255,255,255,0.1); color: ${corDificuldade};">${rotuloDif}</span>
                        </div>
                        <div style="font-size: 12px; color: #cbd5e1; display: flex; flex-direction: column; gap: 2px;">
                            <span>🌊 Demanda: <strong style="color: #38bdf8;">${demandaExibicao} m³/h</strong> | ⏳ Duração: <strong>${c.duracaoSemanas} semanas</strong></span>
                            <span>💵 Ganho Semanal: <strong style="color: #4ade80;">${formatarDinheiro(c.pagamentoSemanal || 0)}/sem</strong></span>
                        </div>
                    </div>
                    <div>
                        ${abaAtual === "disponiveis" ? 
                            `<button class="btn-assinar-contrato" data-id="${c.id}" style="background-color: #0284c7; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">Assinar Contrato</button>` :
                            `<span style="color: #4ade80; font-size: 12px; font-weight: bold;">● Ativo</span>`
                        }
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

        container.querySelectorAll(".btn-assinar-contrato").forEach(btn => {
            btn.addEventListener("click", (e) => {
                if (contratosAtivos.length >= MAX_CONTRATOS_ATIVOS) {
                    exibirPopUpAviso(`⚠️ Limite de ${MAX_CONTRATOS_ATIVOS} contratos ativos atingido! Conclua um contrato antes de assinar outro.`);
                    return;
                }

                const id = parseInt(e.target.getAttribute("data-id"));
                const idx = contratosDisponiveis.findIndex(c => c.id === id);
                if (idx !== -1) {
                    const contratoAssinado = contratosDisponiveis.splice(idx, 1)[0];
                    contratosAtivos.push(contratoAssinado);
                    atualizarMetaHUDContratos();
                    renderizarLista();
                }
            });
        });
    };

    document.getElementById("aba-disponiveis").addEventListener("click", () => { abaAtual = "disponiveis"; renderizarLista(); });
    document.getElementById("aba-ativos").addEventListener("click", () => { abaAtual = "ativos"; renderizarLista(); });
    document.getElementById("aba-relatorio").addEventListener("click", () => { abaAtual = "relatorio"; renderizarLista(); });
    document.getElementById("aba-investimentos").addEventListener("click", () => { abaAtual = "investimentos"; renderizarLista(); });

    document.getElementById("btn-fechar-contratos").addEventListener("click", () => { painelOverlay.style.display = "none"; });
    painelOverlay.addEventListener("click", (e) => { if (e.target === painelOverlay) painelOverlay.style.display = "none"; });

    registerGameAnimation(scene, () => {
        const data = getDataAtual();
        const diaAtual = Math.floor(data.getTime() / (1000 * 60 * 60 * 24));

        if (ultimoDiaGeracao !== -1 && (diaAtual - ultimoDiaGeracao) >= 3) {
            gerarLoteEquilibradoContratos();
            exibirPopUpAviso("📜 Novos contratos disponíveis na Sede!");
            if (painelOverlay.style.display === "flex") renderizarLista();
            ultimoDiaGeracao = diaAtual;
        } else if (ultimoDiaGeracao === -1) {
            ultimoDiaGeracao = diaAtual;
        }

        if (ultimoDiaSemana !== -1 && (diaAtual - ultimoDiaSemana) >= 7) {
            ultimoDiaSemana = diaAtual;

            if (contratosAtivos.length > 0) {
                const vazaoAtualETA = Math.round(getVazaoAtualHora());
                const clima = getEventoClimaticoAtual();
                const multDemanda = clima ? clima.multiplicadorDemanda : 1.0;

                let totalDebitoCredito = 0;
                let valorMultasAplicadas = 0;

                for (let i = contratosAtivos.length - 1; i >= 0; i--) {
                    const c = contratosAtivos[i];
                    c.semanasConcluidas++;

                    const demandaEfetiva = Math.round(c.demandaHora * multDemanda);
                    const faltaVazao = Math.max(0, demandaEfetiva - vazaoAtualETA);
                    const percentualDeficit = (faltaVazao / demandaEfetiva) * 100;

                    let fracaoMulta = 0;
                    if (c.dificuldade === "dificil") {
                        if (percentualDeficit > 15) fracaoMulta = 3;
                        else if (percentualDeficit > 7.5) fracaoMulta = 2;
                        else if (percentualDeficit > 0) fracaoMulta = 1;
                    } else {
                        if (percentualDeficit > 60) fracaoMulta = 3;
                        else if (percentualDeficit > 30) fracaoMulta = 2;
                        else if (percentualDeficit > 0) fracaoMulta = 1;
                    }

                    if (fracaoMulta === 0) {
                        totalDebitoCredito += c.pagamentoSemanal;
                    } else {
                        const valorMulta = Math.round((c.pagamentoSemanal / 3) * fracaoMulta);
                        totalDebitoCredito += (c.pagamentoSemanal - valorMulta);
                        valorMultasAplicadas += valorMulta;
                    }

                    if (c.semanasConcluidas >= c.duracaoSemanas) {
                        contratosAtivos.splice(i, 1);
                    }
                }

                if (totalDebitoCredito > 0) {
                    adicionarDinheiro(totalDebitoCredito);
                    registrarEntradaFinanceira(totalDebitoCredito);
                }

                if (valorMultasAplicadas > 0) {
                    registrarGastoMulta(valorMultasAplicadas);
                    exibirPopUpAviso(`⚠️ Multa semanal de ${formatarDinheiro(valorMultasAplicadas)} por déficit de abastecimento!`);
                }

                atualizarMetaHUDContratos();
                if (painelOverlay.style.display === "flex") renderizarLista();
            }
        } else if (ultimoDiaSemana === -1) { // CORRIGIDO: de !== -1 para === -1
            ultimoDiaSemana = diaAtual;
        }

        atualizarMetaHUDContratos();
    });

if (hitbox) {
        hitbox.isVisible = true;
        hitbox.visibility = 0;
        hitbox.isPickable = true;
    }

    const alvosSede = [predioVisual, hitbox].filter(Boolean);
    alvosSede.forEach(mesh => {
        mesh.isPickable = true;
        mesh.actionManager = new BABYLON.ActionManager(scene);
        mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                () => {
                    renderizarLista();
                    painelOverlay.style.display = "flex";
                }
            )
        );
    });
}