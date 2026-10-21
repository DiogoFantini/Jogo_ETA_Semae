import { formatarDinheiro, gastarDinheiro, exibirPopUpAviso } from './condicoes.js';

// ==========================================================
// CATÁLOGO DE INVESTIMENTOS DA ETA
// ==========================================================
export const INVESTIMENTOS = [
    {
        id: "tecnologia_inovacao",
        nome: "Setor de Tecnologia e Inovação",
        icone: "💡",
        preco: 80000,
        descricao: "Estruturação do departamento de P&D para modernização e futura automação dos processos de tratamento de água.",
        comprado: false
    }
];

export function isInvestimentoComprado(id) {
    const inv = INVESTIMENTOS.find(item => item.id === id);
    return inv ? inv.comprado : false;
}

export function comprarInvestimento(id, callbackAtualizarUI) {
    const inv = INVESTIMENTOS.find(item => item.id === id);
    if (!inv) return false;

    if (inv.comprado) {
        exibirPopUpAviso("⚠️ Este investimento já foi realizado!");
        return false;
    }

    if (gastarDinheiro(inv.preco)) {
        inv.comprado = true;
        exibirPopUpAviso(`🎉 Investimento "${inv.nome}" realizado com sucesso!`);
        if (callbackAtualizarUI) callbackAtualizarUI();
        return true;
    } else {
        exibirPopUpAviso(`❌ Saldo insuficiente! Você precisa de ${formatarDinheiro(inv.preco)} para este investimento.`);
        return false;
    }
}

// ==========================================================
// RENDERIZAÇÃO DA ABA DE INVESTIMENTOS
// ==========================================================
export function renderizarAbaInvestimentos(container) {
    container.innerHTML = "";

    const cabecalho = document.createElement("div");
    cabecalho.style.marginBottom = "14px";
    cabecalho.style.fontSize = "13px";
    cabecalho.style.color = "#94a3b8";
    cabecalho.style.lineHeight = "1.4";
    cabecalho.innerText = "Invista no desenvolvimento institucional e tecnológico da ETA para obter melhorias de longo prazo.";
    container.appendChild(cabecalho);

    INVESTIMENTOS.forEach(inv => {
        const card = document.createElement("div");
        card.style.backgroundColor = "#1e293b";
        card.style.border = inv.comprado ? "1px solid #10b981" : "1px solid #334155";
        card.style.borderRadius = "8px";
        card.style.padding = "14px 16px";
        card.style.display = "flex";
        card.style.justifyContent = "space-between";
        card.style.alignItems = "center";
        card.style.gap = "12px";

        card.innerHTML = `
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span style="font-size: 20px;">${inv.icone}</span>
                    <strong style="color: #ffffff; font-size: 15px;">${inv.nome}</strong>
                </div>
                <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 8px;">
                    ${inv.descricao}
                </div>
                <div style="font-size: 13px; font-weight: bold; color: ${inv.comprado ? '#4ade80' : '#fde047'};">
                    ${inv.comprado ? '✅ Investimento Realizado' : '💰 Custo: ' + formatarDinheiro(inv.preco)}
                </div>
            </div>
            <div>
                ${inv.comprado ? 
                    `<span style="color: #4ade80; font-size: 12px; font-weight: bold; padding: 6px 12px; background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.3); border-radius: 6px;">Adquirido</span>` :
                    `<button class="btn-comprar-investimento" data-id="${inv.id}" style="
                        background-color: #10b981;
                        color: white;
                        border: none;
                        padding: 8px 14px;
                        border-radius: 6px;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 12px;
                        transition: background-color 0.2s;
                    ">Investir</button>`
                }
            </div>
        `;

        container.appendChild(card);
    });

    container.querySelectorAll(".btn-comprar-investimento").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.target.getAttribute("data-id");
            comprarInvestimento(id, () => {
                renderizarAbaInvestimentos(container);
            });
        });
    });
}