import { getDataAtual, registerGameAnimation } from './tempo.js';
import { formatarDinheiro, adicionarDinheiro, gastarDinheiro, exibirPopUpAviso } from './condicoes.js';
import { CONFIG_BOMBA_AGUA, CONFIG_CAIXA_AGUA } from './variaveis-importantes.js';
import { getQuantidadeBombas, getQuantidadeCaixas, getVazaoAtualHora } from './sistema-agua.js';
import { atualizarMeta } from './hud.js';

// ==========================================================
// ESTADO GLOBAL DOS CONTRATOS
// ==========================================================
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

function gerarNovoContrato(dificuldadeForçada = null) {
    const tipos = ["facil", "medio", "dificil"];
    const dif = dificuldadeForçada || tipos[Math.floor(Math.random() * tipos.length)];

    const clientesFiltrados = NOMES_CLIENTES.filter(c => c.tipo === dif);
    const clienteEscolhido = clientesFiltrados[Math.floor(Math.random() * clientesFiltrados.length)].nome;

    let demandaVazaoHora = 0;
    let duracaoSemanas = 0;
    let pagamentoSemanal = 0;

    if (dif === "facil") {
        demandaVazaoHora = entre(12, 25);
        duracaoSemanas = entre(2, 4);
        pagamentoSemanal = entre(4000, 9000);
    } else if (dif === "medio") {
        demandaVazaoHora = entre(30, 75);
        duracaoSemanas = entre(4, 8);
        pagamentoSemanal = entre(15000, 32000);
    } else { // dificil
        demandaVazaoHora = entre(80, 180);
        duracaoSemanas = entre(8, 16);
        pagamentoSemanal = entre(45000, 95000);
    }

    const valorTotalFinal = pagamentoSemanal * duracaoSemanas;

    return {
        id: proximoIdContrato++,
        cliente: clienteEscolhido,
        dificuldade: dif,
        demandaHora: demandaVazaoHora,
        duracaoSemanas: duracaoSemanas,
        semanasConcluidas: 0,
        pagamentoSemanal: pagamentoSemanal,
        valorTotalFinal: valorTotalFinal
    };
}

// Atualiza o indicador "Meta de Abastecimento" no HUD principal
export function atualizarMetaHUDContratos() {
    if (contratosAtivos.length === 0) {
        atualizarMeta("Pegue um contrato na sede", false);
    } else {
        const demandaTotal = contratosAtivos.reduce((acc, c) => acc + c.demandaHora, 0);
        const vazaoAtualETA = Math.round(getVazaoAtualHora());
        const atendeDemanda = vazaoAtualETA >= demandaTotal;
        
        const textoMeta = `${demandaTotal} m³/h (${contratosAtivos.length} ${contratosAtivos.length === 1 ? 'contrato' : 'contratos'})`;
        atualizarMeta(textoMeta, atendeDemanda);
    }
}

export function setupPainelContratos(scene) {
    if (contratosDisponiveis.length === 0) {
        contratosDisponiveis.push(gerarNovoContrato("facil"));
        contratosDisponiveis.push(gerarNovoContrato("medio"));
        contratosDisponiveis.push(gerarNovoContrato("dificil"));
    }

    atualizarMetaHUDContratos();

    // Criar Overlay do Painel
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
    painelBox.style.maxWidth = "640px";
    painelBox.style.boxShadow = "0 15px 35px rgba(0,0,0,0.8)";
    painelBox.style.fontFamily = "Arial, sans-serif";
    painelBox.style.color = "#ffffff";

    painelBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 15px;">
            <h2 style="margin: 0; color: #38bdf8; font-size: 20px;">📜 Central de Contratos de Abastecimento</h2>
            <button id="btn-fechar-contratos" style="background: transparent; border: none; color: #94a3b8; font-size: 20px; font-weight: bold; cursor: pointer;">✕</button>
        </div>

        <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 15px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
            <div>🌊 Vazão Atual da ETA: <strong id="val-vazao-eta" style="color: #38bdf8;">0 m³/h</strong></div>
            <div>📋 Demanda Contratada: <strong id="val-demanda-contratada" style="color: #fde047;">0 m³/h</strong></div>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 15px; border-bottom: 1px solid #334155; padding-bottom: 10px;">
            <button id="aba-disponiveis" style="flex: 1; background-color: #0284c7; color: white; border: none; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">Disponíveis (${contratosDisponiveis.length})</button>
            <button id="aba-ativos" style="flex: 1; background-color: #1e293b; color: #94a3b8; border: 1px solid #334155; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">Ativos (${contratosAtivos.length})</button>
        </div>

        <div id="lista-contratos-container" style="display: flex; flex-direction: column; gap: 12px; max-height: 330px; overflow-y: auto; padding-right: 5px;"></div>
    `;

    painelOverlay.appendChild(painelBox);
    document.body.appendChild(painelOverlay);

    let abaAtual = "disponiveis";

    const renderizarLista = () => {
        const container = document.getElementById("lista-contratos-container");
        const btnAbaDisp = document.getElementById("aba-disponiveis");
        const btnAbaAtivos = document.getElementById("aba-ativos");

        const vazaoAtualETA = Math.round(getVazaoAtualHora());
        const demandaContratadaTotal = contratosAtivos.reduce((acc, c) => acc + c.demandaHora, 0);

        document.getElementById("val-vazao-eta").innerText = `${vazaoAtualETA} m³/h`;
        document.getElementById("val-demanda-contratada").innerText = `${demandaContratadaTotal} m³/h`;

        if (demandaContratadaTotal > vazaoAtualETA) {
            document.getElementById("val-demanda-contratada").style.color = "#f87171";
        } else {
            document.getElementById("val-demanda-contratada").style.color = "#fde047";
        }

        btnAbaDisp.innerText = `Disponíveis (${contratosDisponiveis.length})`;
        btnAbaAtivos.innerText = `Ativos (${contratosAtivos.length})`;

        if (abaAtual === "disponiveis") {
            btnAbaDisp.style.backgroundColor = "#0284c7";
            btnAbaDisp.style.color = "#ffffff";
            btnAbaAtivos.style.backgroundColor = "#1e293b";
            btnAbaAtivos.style.color = "#94a3b8";
        } else {
            btnAbaAtivos.style.backgroundColor = "#0284c7";
            btnAbaAtivos.style.color = "#ffffff";
            btnAbaDisp.style.backgroundColor = "#1e293b";
            btnAbaDisp.style.color = "#94a3b8";
        }

        container.innerHTML = "";
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
            let regraMultaTexto = "⚠️ Multas: Déficit até 30% (-1/3) | até 60% (-2/3) | acima de 60% (-3/3)";

            if (c.dificuldade === "medio") {
                corDificuldade = "#fde047";
                rotuloDif = "Médio";
                regraMultaTexto = "⚠️ Multas: Déficit até 30% (-1/3) | até 60% (-2/3) | acima de 60% (-3/3)";
            } else if (c.dificuldade === "dificil") {
                corDificuldade = "#f87171";
                rotuloDif = "Difícil";
                regraMultaTexto = "⚡ Rigoroso: Déficit até 7.5% (-1/3) | até 15% (-2/3) | acima de 15% (-3/3)";
            }

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <strong style="color: #ffffff; font-size: 14px;">${c.cliente}</strong>
                            <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background-color: rgba(255,255,255,0.1); color: ${corDificuldade};">${rotuloDif}</span>
                        </div>
                        <div style="font-size: 12px; color: #cbd5e1; display: flex; flex-direction: column; gap: 2px;">
                            <span>🌊 Demanda: <strong style="color: #38bdf8;">${c.demandaHora} m³/h</strong> | ⏳ Duração: <strong>${c.duracaoSemanas} semanas</strong> ${abaAtual === 'ativos' ? `(Semana ${c.semanasConcluidas}/${c.duracaoSemanas})` : ''}</span>
                            <span>💵 Ganho Semanal: <strong style="color: #4ade80;">${formatarDinheiro(c.pagamentoSemanal)}/sem</strong></span>
                            <span style="color: #94a3b8; font-size: 11px;">🏆 Total ao Final do Contrato: <strong style="color: #38bdf8;">${formatarDinheiro(c.valorTotalFinal)}</strong></span>
                        </div>
                    </div>
                    <div>
                        ${abaAtual === "disponiveis" ? 
                            `<button class="btn-assinar-contrato" data-id="${c.id}" style="background-color: #0284c7; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">Assinar Contrato</button>` :
                            `<span style="color: #4ade80; font-size: 12px; font-weight: bold;">● Ativo</span>`
                        }
                    </div>
                </div>
                <div style="font-size: 11px; color: #f87171; background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); padding: 4px 8px; border-radius: 4px;">
                    ${regraMultaTexto}
                </div>
            `;

            container.appendChild(card);
        });

        // Eventos de assinar contrato
        container.querySelectorAll(".btn-assinar-contrato").forEach(btn => {
            btn.addEventListener("click", (e) => {
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

    document.getElementById("aba-disponiveis").addEventListener("click", () => {
        abaAtual = "disponiveis";
        renderizarLista();
    });

    document.getElementById("aba-ativos").addEventListener("click", () => {
        abaAtual = "ativos";
        renderizarLista();
    });

    document.getElementById("btn-fechar-contratos").addEventListener("click", () => {
        painelOverlay.style.display = "none";
    });

    painelOverlay.addEventListener("click", (e) => {
        if (e.target === painelOverlay) {
            painelOverlay.style.display = "none";
        }
    });

    // ==========================================================
    // CICLO DO TEMPO: GERAÇÃO, PAGAMENTOS, MULTAS E META
    // ==========================================================
    registerGameAnimation(scene, () => {
        const data = getDataAtual();
        const diaAtual = Math.floor(data.getTime() / (1000 * 60 * 60 * 24));

        // 1. Gera novos contratos a cada 3 dias in-game
        if (ultimoDiaGeracao !== -1 && (diaAtual - ultimoDiaGeracao) >= 3) {
            if (contratosDisponiveis.length < 5) {
                contratosDisponiveis.push(gerarNovoContrato());
                if (painelOverlay.style.display === "flex") renderizarLista();
            }
            ultimoDiaGeracao = diaAtual;
        } else if (ultimoDiaGeracao === -1) {
            ultimoDiaGeracao = diaAtual;
        }

        // 2. Avaliação e Pagamento/Multa semanal a cada 7 dias in-game
        if (ultimoDiaSemana !== -1 && (diaAtual - ultimoDiaSemana) >= 7) {
            ultimoDiaSemana = diaAtual;

            if (contratosAtivos.length > 0) {
                const vazaoAtualETA = Math.round(getVazaoAtualHora());
                let totalDebitoCredito = 0;
                let valorMultasAplicadas = 0;

                for (let i = contratosAtivos.length - 1; i >= 0; i--) {
                    const c = contratosAtivos[i];
                    c.semanasConcluidas++;

                    // Calcula o déficit relativo em relação à demanda do contrato
                    const faltaVazao = Math.max(0, c.demandaHora - vazaoAtualETA);
                    const percentualDeficit = (faltaVazao / c.demandaHora) * 100;

                    let fracaoMulta = 0; // 0 = sem multa, 1 = 1/3, 2 = 2/3, 3 = 3/3 (100%)

                    if (c.dificuldade === "dificil") {
                        if (percentualDeficit > 15) {
                            fracaoMulta = 3;
                        } else if (percentualDeficit > 7.5) {
                            fracaoMulta = 2;
                        } else if (percentualDeficit > 0) {
                            fracaoMulta = 1;
                        }
                    } else { // facil e medio
                        if (percentualDeficit > 60) {
                            fracaoMulta = 3;
                        } else if (percentualDeficit > 30) {
                            fracaoMulta = 2;
                        } else if (percentualDeficit > 0) {
                            fracaoMulta = 1;
                        }
                    }

                    if (fracaoMulta === 0) {
                        // Atendeu totalmente: recebe 100% do pagamento semanal
                        totalDebitoCredito += c.pagamentoSemanal;
                    } else {
                        // Multa proporcional cobrada do valor semanal
                        const valorMulta = Math.round((c.pagamentoSemanal / 3) * fracaoMulta);
                        const pagamentoLiquido = c.pagamentoSemanal - valorMulta;
                        
                        totalDebitoCredito += pagamentoLiquido;
                        valorMultasAplicadas += valorMulta;
                    }

                    // Remove contrato se concluído
                    if (c.semanasConcluidas >= c.duracaoSemanas) {
                        contratosAtivos.splice(i, 1);
                        console.log(`[CONTRATOS] Contrato finalizado: ${c.cliente}`);
                    }
                }

                if (totalDebitoCredito > 0) {
                    adicionarDinheiro(totalDebitoCredito);
                }

                if (valorMultasAplicadas > 0) {
                    exibirPopUpAviso(`⚠️ Multa semanal de ${formatarDinheiro(valorMultasAplicadas)} por déficit de abastecimento!`);
                }

                atualizarMetaHUDContratos();
                if (painelOverlay.style.display === "flex") renderizarLista();
            }
        } else if (ultimoDiaSemana === -1) {
            ultimoDiaSemana = diaAtual;
        }

        atualizarMetaHUDContratos();
    });

    // ==========================================================
    // CONFIGURAÇÃO DE INTERAÇÃO COM A SEDE
    // ==========================================================
    const predioVisual = scene.getMeshByName("centroAdministrativoVisual");
    const hitbox = scene.getMeshByName("centroAdminHitbox");

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