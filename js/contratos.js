import { registerGameAnimation, getDataAtual } from './tempo.js';
import { adicionarDinheiro, formatarDinheiro } from './condicoes.js';
import { getQuantidadeBombas, getQuantidadeCaixas } from './sistema-agua.js';
import { CONFIG_BOMBA_AGUA, CONFIG_CAIXA_AGUA } from './variaveis-importantes.js';

// ==========================================================
// BANCO DE CONTRATOS E GERADOR DINÂMICO
// ==========================================================
let contratosDisponiveis = [];
let contratosAtivos = [];
let contratosConcluidos = [];
let contadorIdContrato = 1;

// NÍVEIS DE DIFICULDADE
const NIVEIS_DIFICULDADE = {
    FACIL: { nome: "Fácil", cor: "#4ade80", tagCor: "#166534" },
    MEDIO: { nome: "Médio", cor: "#fde047", tagCor: "#854d0e" },
    DIFACIL: { nome: "Difícil", cor: "#f97316", tagCor: "#9a3412" },
    EPICO: { nome: "Épico", cor: "#a855f7", tagCor: "#6b21a8" }
};

const NOMES_CLIENTES = [
    { nome: "Bairro Jardim Alvorada", nivel: "FACIL", minVazao: 5, maxVazao: 12, minSemanas: 1, maxSemanas: 2, minPagto: 8000, maxPagto: 15000 },
    { nome: "Escola Municipal Maria Clara", nivel: "FACIL", minVazao: 8, maxVazao: 15, minSemanas: 2, maxSemanas: 3, minPagto: 12000, maxPagto: 20000 },
    { nome: "Condomínio Residencial Parque das Águas", nivel: "MEDIO", minVazao: 20, maxVazao: 35, minSemanas: 2, maxSemanas: 4, minPagto: 28000, maxPagto: 50000 },
    { nome: "Hospital Geral de Emergência", nivel: "MEDIO", minVazao: 30, maxVazao: 45, minSemanas: 3, maxSemanas: 6, minPagto: 45000, maxPagto: 75000 },
    { nome: "Distrito Industrial Norte", nivel: "DIFACIL", minVazao: 55, maxVazao: 95, minSemanas: 4, maxSemanas: 8, minPagto: 80000, maxPagto: 140000 },
    { nome: "Shopping Center Plaza Piracicaba", nivel: "DIFACIL", minVazao: 65, maxVazao: 110, minSemanas: 5, maxSemanas: 10, minPagto: 100000, maxPagto: 170000 },
    { nome: "Complexo Petroquímico Regional", nivel: "EPICO", minVazao: 130, maxVazao: 220, minSemanas: 8, maxSemanas: 12, minPagto: 200000, maxPagto: 350000 },
    { nome: "Rede Metropolitana de Abastecimento", nivel: "EPICO", minVazao: 160, maxVazao: 250, minSemanas: 10, maxSemanas: 16, minPagto: 280000, maxPagto: 480000 }
];

function entreRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gerarContratoAleatorio() {
    const modelo = NOMES_CLIENTES[Math.floor(Math.random() * NOMES_CLIENTES.length)];
    const semanasTotais = entreRandom(modelo.minSemanas, modelo.maxSemanas);
    const pagtoSemanal = entreRandom(modelo.minPagto, modelo.maxPagto);
    const vazaoHoraExigida = entreRandom(modelo.minVazao, modelo.maxVazao);

    return {
        id: contadorIdContrato++,
        cliente: modelo.nome,
        dificuldade: NIVEIS_DIFICULDADE[modelo.nivel],
        vazaoExigidaHora: vazaoHoraExigida, // em m³/h
        semanasTotais: semanasTotais,
        semanasRestantes: semanasTotais,
        pagamentoSemanal: pagtoSemanal,
        pagamentoTotal: pagtoSemanal * semanasTotais,
        dataInicio: null,
        dataUltimoPagamento: null,
        totalFaturado: 0
    };
}

// Inicializa a lista com 4 contratos diversos
function inicializarContratosIniciais() {
    while (contratosDisponiveis.length < 4) {
        contratosDisponiveis.push(gerarContratoAleatorio());
    }
}

// ==========================================================
// INTERFACE DO PAINEL DE CONTRATOS (UI)
// ==========================================================
export function setupPainelContratos(scene) {
    inicializarContratosIniciais();

    const painelOverlay = document.createElement("div");
    painelOverlay.id = "painel-contratos-overlay";
    painelOverlay.style.position = "fixed";
    painelOverlay.style.top = "0";
    painelOverlay.style.left = "0";
    painelOverlay.style.width = "100vw";
    painelOverlay.style.height = "100vh";
    painelOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.75)";
    painelOverlay.style.backdropFilter = "blur(4px)";
    painelOverlay.style.display = "flex";
    painelOverlay.style.justifyContent = "center";
    painelOverlay.style.alignItems = "center";
    painelOverlay.style.zIndex = "9998";
    painelOverlay.style.display = "none";

    const painelBox = document.createElement("div");
    painelBox.style.backgroundColor = "#0f172a";
    painelBox.style.border = "2px solid #38bdf8";
    painelBox.style.borderRadius = "12px";
    painelBox.style.padding = "25px 30px";
    painelBox.style.width = "90%";
    painelBox.style.maxWidth = "620px";
    painelBox.style.boxShadow = "0 15px 35px rgba(0,0,0,0.8)";
    painelBox.style.fontFamily = "Arial, sans-serif";
    painelBox.style.color = "#ffffff";

    painelBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 15px;">
            <h2 style="margin: 0; color: #38bdf8; font-size: 20px;">📜 Central de Contratos de Fornecimento</h2>
            <button id="btn-fechar-contratos" style="background: transparent; border: none; color: #94a3b8; font-size: 20px; font-weight: bold; cursor: pointer;">✕</button>
        </div>

        <!-- Abas de Navegação -->
        <div style="display: flex; gap: 8px; margin-bottom: 15px; border-bottom: 1px solid #334155; padding-bottom: 8px;">
            <button id="aba-disponiveis" class="btn-aba-contratos" style="flex: 1; padding: 8px; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">📋 Disponíveis (<span id="num-disponiveis">0</span>)</button>
            <button id="aba-ativos" class="btn-aba-contratos" style="flex: 1; padding: 8px; background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">⚡ Ativos (<span id="num-ativos">0</span>)</button>
            <button id="aba-historico" class="btn-aba-contratos" style="flex: 1; padding: 8px; background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">✅ Histórico (<span id="num-historico">0</span>)</button>
        </div>

        <!-- Conteúdo dos Contratos -->
        <div id="lista-contratos-container" style="display: flex; flex-direction: column; gap: 12px; max-height: 340px; overflow-y: auto; padding-right: 5px;">
        </div>
    `;

    painelOverlay.appendChild(painelBox);
    document.body.appendChild(painelOverlay);

    let abaAtual = "disponiveis";

    const renderizarLista = () => {
        const container = document.getElementById("lista-contratos-container");
        document.getElementById("num-disponiveis").innerText = contratosDisponiveis.length;
        document.getElementById("num-ativos").innerText = contratosAtivos.length;
        document.getElementById("num-historico").innerText = contratosConcluidos.length;

        container.innerHTML = "";

        let listaExibida = [];
        if (abaAtual === "disponiveis") listaExibida = contratosDisponiveis;
        else if (abaAtual === "ativos") listaExibida = contratosAtivos;
        else if (abaAtual === "historico") listaExibida = contratosConcluidos;

        if (listaExibida.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #64748b; padding: 30px 0; font-size: 14px;">
                    Nenhum contrato nesta categoria no momento.
                </div>
            `;
            return;
        }

        // Calcula a vazão média da ETA atual em m³/h
        const vazaoHoraAtual = (getQuantidadeBombas() * CONFIG_BOMBA_AGUA.vazaoHora);

        listaExibida.forEach(c => {
            const card = document.createElement("div");
            card.style.backgroundColor = "#1e293b";
            card.style.border = "1px solid #334155";
            card.style.borderRadius = "8px";
            card.style.padding = "14px";
            card.style.display = "flex";
            card.style.flexDirection = "column";
            card.style.gap = "8px";

            const atendeVazao = vazaoHoraAtual >= c.vazaoExigidaHora;
            const tempoTexto = c.semanasTotais >= 4 
                ? `${c.semanasTotais} semanas (${Math.floor(c.semanasTotais / 4)} mês)` 
                : `${c.semanasTotais} semanas`;

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: #ffffff; font-size: 15px;">${c.cliente}</strong>
                    <span style="background-color: ${c.dificuldade.tagCor}; color: ${c.dificuldade.cor}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                        ${c.dificuldade.nome}
                    </span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px; color: #cbd5e1; background: #0f172a; padding: 8px; border-radius: 6px;">
                    <div>🌊 <strong style="color: #94a3b8;">Vazão Exigida:</strong> <span style="color: ${atendeVazao ? '#38bdf8' : '#f87171'}; font-weight: bold;">${c.vazaoExigidaHora} m³/h</span></div>
                    <div>⏱️ <strong style="color: #94a3b8;">Duração:</strong> <span style="color: #fff; font-weight: bold;">${tempoTexto}</span></div>
                    <div>💰 <strong style="color: #94a3b8;">Semanal:</strong> <span style="color: #4ade80; font-weight: bold;">${formatarDinheiro(c.pagamentoSemanal)}/sem</span></div>
                    <div>💎 <strong style="color: #94a3b8;">Total Final:</strong> <span style="color: #4ade80; font-weight: bold;">${formatarDinheiro(c.pagamentoTotal)}</span></div>
                </div>
            `;

            if (abaAtual === "disponiveis") {
                const btnAssinar = document.createElement("button");
                btnAssinar.innerText = "Assinar Contrato";
                btnAssinar.style.backgroundColor = "#0284c7";
                btnAssinar.style.color = "#fff";
                btnAssinar.style.border = "none";
                btnAssinar.style.padding = "8px";
                btnAssinar.style.borderRadius = "6px";
                btnAssinar.style.fontWeight = "bold";
                btnAssinar.style.cursor = "pointer";
                btnAssinar.style.fontSize = "13px";

                btnAssinar.addEventListener("click", () => {
                    assinarContrato(c.id);
                    renderizarLista();
                });

                card.appendChild(btnAssinar);
            } else if (abaAtual === "ativos") {
                const progressoDiv = document.createElement("div");
                progressoDiv.style.fontSize = "12px";
                progressoDiv.style.color = "#94a3b8";
                progressoDiv.style.display = "flex";
                progressoDiv.style.justifyContent = "space-between";
                progressoDiv.style.alignItems = "center";
                progressoDiv.style.marginTop = "2px";

                progressoDiv.innerHTML = `
                    <span>⏳ Restam: <strong style="color: #38bdf8;">${c.semanasRestantes} de ${c.semanasTotais} semanas</strong></span>
                    <span>💵 Faturado: <strong style="color: #4ade80;">${formatarDinheiro(c.totalFaturado)}</strong></span>
                `;

                card.appendChild(progressoDiv);
            } else if (abaAtual === "historico") {
                const tagConcluido = document.createElement("div");
                tagConcluido.style.color = "#4ade80";
                tagConcluido.style.fontSize = "12px";
                tagConcluido.style.fontWeight = "bold";
                tagConcluido.style.textAlign = "right";
                tagConcluido.innerText = `✓ Contrato Concluído — Total Recebido: ${formatarDinheiro(c.pagamentoTotal)}`;
                card.appendChild(tagConcluido);
            }

            container.appendChild(card);
        });
    };

    // Alternância de Abas
    const btnDisponiveis = document.getElementById("aba-disponiveis");
    const btnAtivos = document.getElementById("aba-ativos");
    const btnHistorico = document.getElementById("aba-historico");

    const atualizarVisualAbas = (abaSelecionada) => {
        abaAtual = abaSelecionada;
        [btnDisponiveis, btnAtivos, btnHistorico].forEach(btn => {
            btn.style.backgroundColor = "#1e293b";
            btn.style.color = "#94a3b8";
            btn.style.border = "1px solid #334155";
        });

        if (abaSelecionada === "disponiveis") {
            btnDisponiveis.style.backgroundColor = "#0284c7";
            btnDisponiveis.style.color = "#fff";
        } else if (abaSelecionada === "ativos") {
            btnAtivos.style.backgroundColor = "#0284c7";
            btnAtivos.style.color = "#fff";
        } else if (abaSelecionada === "historico") {
            btnHistorico.style.backgroundColor = "#0284c7";
            btnHistorico.style.color = "#fff";
        }

        renderizarLista();
    };

    btnDisponiveis.addEventListener("click", () => atualizarVisualAbas("disponiveis"));
    btnAtivos.addEventListener("click", () => atualizarVisualAbas("ativos"));
    btnHistorico.addEventListener("click", () => atualizarVisualAbas("historico"));

    // Fechar painel
    document.getElementById("btn-fechar-contratos").addEventListener("click", () => {
        painelOverlay.style.display = "none";
    });

    painelOverlay.addEventListener("click", (e) => {
        if (e.target === painelOverlay) painelOverlay.style.display = "none";
    });

    // Configurar interações 3D da Sede Administrativa (Hover Cursor + ActionManager)
    const configurarInteracaoSede = () => {
        const predioVisual = scene.getMeshByName("centroAdministrativoVisual");
        const hitbox = scene.getMeshByName("centroAdminHitbox");

        if (hitbox) {
            hitbox.isVisible = true;
            hitbox.visibility = 0;
            hitbox.isPickable = true;
        }

        const alvos = [predioVisual, hitbox].filter(Boolean);

        alvos.forEach(mesh => {
            mesh.isPickable = true;
            mesh.actionManager = new BABYLON.ActionManager(scene);
            mesh.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(
                    BABYLON.ActionManager.OnPickTrigger,
                    () => {
                        atualizarVisualAbas(abaAtual);
                        painelOverlay.style.display = "flex";
                    }
                )
            );
        });
    };

    configurarInteracaoSede();
    iniciarMonitoramentoTempoContratos(scene);
}

// ==========================================================
// LÓGICA DE ASSINATURA E CICLO SEMANAL DOS CONTRATOS
// ==========================================================
function assinarContrato(id) {
    const idx = contratosDisponiveis.findIndex(c => c.id === id);
    if (idx !== -1) {
        const contrato = contratosDisponiveis.splice(idx, 1)[0];
        contrato.dataInicio = new Date(getDataAtual());
        contrato.dataUltimoPagamento = new Date(getDataAtual());
        contratosAtivos.push(contrato);

        console.log(`[CONTRATOS] Contrato assinado: ${contrato.cliente}`);

        // Repõe novo contrato disponível se houver poucos
        if (contratosDisponiveis.length < 3) {
            contratosDisponiveis.push(gerarContratoAleatorio());
        }
    }
}

// Monitora a passagem das semanas in-game (A cada 7 dias in-game)
function iniciarMonitoramentoTempoContratos(scene) {
    let ultimoDiaVerificado = -1;

    registerGameAnimation(scene, () => {
        const dataAtual = getDataAtual();
        const diaAtualAbsoluto = Math.floor(dataAtual.getTime() / (1000 * 60 * 60 * 24));

        if (diaAtualAbsoluto === ultimoDiaVerificado) return;
        ultimoDiaVerificado = diaAtualAbsoluto;

        // Processa cada contrato ativo
        for (let i = contratosAtivos.length - 1; i >= 0; i--) {
            const c = contratosAtivos[i];
            const diffMs = dataAtual.getTime() - c.dataUltimoPagamento.getTime();
            const diasInGamePassados = diffMs / (1000 * 60 * 60 * 24);

            // A cada 7 dias de jogo decorridos: realiza o pagamento semanal
            if (diasInGamePassados >= 7) {
                c.dataUltimoPagamento = new Date(dataAtual);
                c.semanasRestantes--;
                c.totalFaturado += c.pagamentoSemanal;

                // Credita o dinheiro do pagamento na conta do jogador
                adicionarDinheiro(c.pagamentoSemanal);

                exibirNotificacaoPagamento(c.cliente, c.pagamentoSemanal);

                // Se o prazo do contrato acabou, move para concluídos
                if (c.semanasRestantes <= 0) {
                    contratosAtivos.splice(i, 1);
                    contratosConcluidos.push(c);
                    console.log(`[CONTRATOS] Contrato concluído com sucesso: ${c.cliente}`);
                }
            }
        }
    });
}

// Notificação flutuante na tela ao receber o pagamento semanal
function exibirNotificacaoPagamento(cliente, valor) {
    const toast = document.createElement("div");
    toast.style.position = "fixed";
    toast.style.bottom = "80px";
    toast.style.left = "20px";
    toast.style.backgroundColor = "rgba(15, 23, 42, 0.95)";
    toast.style.border = "2px solid #4ade80";
    toast.style.borderRadius = "8px";
    toast.style.padding = "12px 18px";
    toast.style.color = "#ffffff";
    toast.style.fontFamily = "Arial, sans-serif";
    toast.style.fontSize = "14px";
    toast.style.boxShadow = "0 8px 20px rgba(0,0,0,0.6)";
    toast.style.zIndex = "9999";
    toast.style.transition = "all 0.5s ease";

    toast.innerHTML = `
        <div style="color: #4ade80; font-weight: bold; font-size: 13px;">💰 Pagamento Semanal Recebido!</div>
        <div style="font-size: 14px; margin-top: 2px;"><strong>${cliente}</strong>: <span style="color: #4ade80; font-weight: bold;">+ ${formatarDinheiro(valor)}</span></div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}