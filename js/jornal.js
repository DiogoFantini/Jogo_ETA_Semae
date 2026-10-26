import { registerGameAnimation, getDataAtual, getDiasDecorridos } from './tempo.js';
import { getVazaoAtualHora, getQuantidadeBombas } from './sistema-agua.js';
import { getConsumoTotalEnergia } from './sistema-energia.js';
import { getEventoSorteadoSemana } from './clima.js';

let temJornalNovo = true;
let ultimoSemanaRegistrada = -1;
let primeiraEdicaoVista = false;

// ==========================================================
// 1. CRIAÇÃO DAS MALHAS 3D DA CAIXA DE JORNAL
// ==========================================================
function criarMalhasCaixaJornal(scene, posX, posZ) {
    const grupoJornal = new BABYLON.TransformNode("grupoCaixaJornal", scene);
    grupoJornal.position.set(posX, 0, posZ);

    // Pedestal
    const matPedestal = new BABYLON.StandardMaterial("matPedestalJornal", scene);
    matPedestal.diffuseColor = BABYLON.Color3.FromHexString("#334155");
    
    const pedestal = BABYLON.MeshBuilder.CreateCylinder("pedestalJornal", { diameter: 0.15, height: 1.0 }, scene);
    pedestal.position.y = 0.5;
    pedestal.material = matPedestal;
    pedestal.parent = grupoJornal;

    // Corpo da Caixa
    const matCaixa = new BABYLON.StandardMaterial("matCaixaJornal", scene);
    matCaixa.diffuseColor = BABYLON.Color3.FromHexString("#0284c7");
    
    const caixa = BABYLON.MeshBuilder.CreateBox("caixaJornalCorpo", { width: 0.6, height: 0.7, depth: 0.45 }, scene);
    caixa.position.y = 1.15;
    caixa.material = matCaixa;
    caixa.parent = grupoJornal;

    // Vidro
    const matVidro = new BABYLON.StandardMaterial("matVidroJornal", scene);
    matVidro.diffuseColor = BABYLON.Color3.FromHexString("#cbd5e1");
    matVidro.alpha = 0.5;

    const vidro = BABYLON.MeshBuilder.CreatePlane("vidroJornal", { width: 0.48, height: 0.45 }, scene);
    vidro.position.set(0, 1.15, -0.23);
    vidro.rotation.y = Math.PI;
    vidro.material = matVidro;
    vidro.parent = grupoJornal;

    // Hitbox para Interação
    const hitbox = BABYLON.MeshBuilder.CreateBox("hitboxJornal", { width: 1.0, height: 1.8, depth: 1.0 }, scene);
    hitbox.position.y = 0.9;
    hitbox.visibility = 0;
    hitbox.isPickable = true;
    hitbox.parent = grupoJornal;

    // Indicador 3D (Exclamação)
    const matExclamacao = new BABYLON.StandardMaterial("matExclamacao", scene);
    matExclamacao.diffuseColor = BABYLON.Color3.FromHexString("#facc15");
    matExclamacao.emissiveColor = BABYLON.Color3.FromHexString("#eab308");
    matExclamacao.disableLighting = true;

    const grupoExclamacao = new BABYLON.TransformNode("grupoExclamacao", scene);
    grupoExclamacao.position.set(posX, 1.8, posZ);

    const partePonto = BABYLON.MeshBuilder.CreateSphere("pontoExcl", { diameter: 0.18 }, scene);
    partePonto.position.y = 0;
    partePonto.material = matExclamacao;
    partePonto.parent = grupoExclamacao;

    const parteHaste = BABYLON.MeshBuilder.CreateCylinder("hasteExcl", { diameterTop: 0.22, diameterBottom: 0.1, height: 0.55 }, scene);
    parteHaste.position.y = 0.42;
    parteHaste.material = matExclamacao;
    parteHaste.parent = grupoExclamacao;

    return { caixa, hitbox, grupoExclamacao };
}

// ==========================================================
// 2. MODAL HTML E INTERFACE DO JORNAL
// ==========================================================
function criarModalJornalHTML() {
    const jornalOverlay = document.createElement("div");
    jornalOverlay.id = "modal-jornal-overlay";
    jornalOverlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background-color: rgba(0, 0, 0, 0.85); backdrop-filter: blur(6px);
        display: none; justify-content: center; align-items: center; z-index: 9999;
    `;

    const jornalPapel = document.createElement("div");
    jornalPapel.style.cssText = `
        background-color: #fcf8f2; color: #1e1e1e; border: 3px solid #332d27;
        border-radius: 4px; padding: 30px; width: 90%; max-width: 650px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.9); font-family: 'Georgia', 'Times New Roman', serif;
    `;

    jornalOverlay.appendChild(jornalPapel);
    document.body.appendChild(jornalOverlay);

    return { jornalOverlay, jornalPapel };
}

// ==========================================================
// 3. GERAÇÃO DINÂMICA DE CONTEÚDO DO JORNAL
// ==========================================================
function gerarConteudoJornal() {
    const data = getDataAtual();
    const dataFormatada = data.toLocaleDateString('pt-BR');
    const climaSorteado = getEventoSorteadoSemana();

    let textoPrevisao = "Previsão do clima: Probabilidade alta de tempo ameno";
    if (climaSorteado.id === "chuva_forte") {
        textoPrevisao = "Previsão do clima: Probabilidade alta de chuva";
    } else if (climaSorteado.id === "onda_calor") {
        textoPrevisao = "Previsão do clima: Probabilidade alta de onda de calor";
    } else if (climaSorteado.id === "seca_severa") {
        textoPrevisao = "Previsão do clima: Probabilidade alta de seca severa";
    }

    let manchete = "";
    let artigoOpiniao = "";
    let painelComunidadeHTML = "";

    if (!primeiraEdicaoVista) {
        manchete = "NOVO(A) GESTOR(A) ASSUME O COMANDO DA ESTAÇÃO DE TRATAMENTO DE ÁGUA!";
        artigoOpiniao = "A administração local confirmou hoje a nomeação do(a) novo(a) representante responsável por gerenciar as operações da ETA. A população e os setores da cidade acompanham com grande expectativa o início dos trabalhos, aguardando investimentos em infraestrutura, estabilidade no fornecimento e gestão eficiente do saneamento. Desejamos uma excelente gestão ao(à) novo(a) gestor(a)!";
        
        painelComunidadeHTML = `
            <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #999; padding-bottom: 4px; margin-bottom: 8px;">
                📌 Nota de Boas-Vindas
            </div>
            <div style="font-size: 12px; line-height: 1.5; color: #333;">
                "Iniciamos uma nova fase no saneamento. O objetivo é estruturar a captação e garantir o abastecimento contínuo para todos os distritos nos próximos meses."
            </div>
        `;
    } else {
        const vazao = Math.round(getVazaoAtualHora());
        const energia = getConsumoTotalEnergia();
        const bombas = getQuantidadeBombas();

        manchete = "A CIDADE CELEBRA A REGULARIDADE NO ABASTECIMENTO!";
        artigoOpiniao = "Moradores do Centro e Bairros vizinhos relatam ótima pressão nas torneiras. A gestão da ETA vem se mostrando eficiente.";

        if (bombas === 0) {
            manchete = "CRISE DE ABASTECIMENTO: CIDADE SEM ÁGUA!";
            artigoOpiniao = "Moradores protestam nas ruas por conta da falta de captação de água na ETA local. Comerciantes cobram providências imediatas.";
        } else if (energia > 40) {
            manchete = "ALERTAS DE CONSUMO ELEVADO DE ENERGIA ELÉTRICA!";
            artigoOpiniao = "Especialistas da prefeitura questionam o alto gasto energético da estação. A população pede investimentos em eficiência.";
        }

        painelComunidadeHTML = `
            <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #999; padding-bottom: 4px; margin-bottom: 8px;">
                📊 Painel da Comunidade
            </div>
            <ul style="margin: 0; padding-left: 15px; font-size: 12px; line-height: 1.5; color: #333;">
                <li>Vazão Atual: <strong>${vazao} m³/h</strong></li>
                <li>Consumo Elétrico: <strong>${energia} kW/h</strong></li>
                <li>Bombas Operacionais: <strong>${bombas} unidades</strong></li>
            </ul>
        `;
    }

    return `
        <div style="border-bottom: 3px double #1e1e1e; padding-bottom: 10px; margin-bottom: 15px; text-align: center;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #555;">Edição Semanal • Ano I</div>
            <h1 style="margin: 5px 0; font-size: 34px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; border-top: 1px solid #1e1e1e; border-bottom: 1px solid #1e1e1e; padding: 4px 0;">GAZETA DO POVO</h1>
            <div style="font-size: 12px; display: flex; justify-content: space-between; margin-top: 5px; color: #444; font-style: italic;">
                <span>Estado de São Paulo</span>
                <span>${dataFormatada}</span>
                <span>Preço: R$ 2,50</span>
            </div>
        </div>

        <!-- MANCHETE PRINCIPAL -->
        <div style="margin-bottom: 20px;">
            <h2 style="font-size: 20px; margin: 0 0 8px 0; text-transform: uppercase; line-height: 1.2; color: #0f172a;">${manchete}</h2>
            <p style="font-size: 14px; line-height: 1.5; margin: 0; text-align: justify; color: #334155;">${artigoOpiniao}</p>
        </div>

        <!-- GRID COM PREVISÃO DO TEMPO E ESTATÍSTICAS -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border-top: 2px solid #1e1e1e; padding-top: 15px;">
            
            <!-- PREVISÃO CLIMÁTICA DA SEMANA -->
            <div style="background-color: #f1ece1; padding: 12px; border: 1px solid #d4ceb8; border-radius: 4px;">
                <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #999; padding-bottom: 4px; margin-bottom: 8px;">
                    🌤️ Previsão Climática Semanal
                </div>
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 6px; color: #0f172a;">
                    ${climaSorteado.icone} ${textoPrevisao}
                </div>
                <div style="font-size: 12px; font-weight: bold; color: #b91c1c; margin-bottom: 4px;">
                    Efeito: ${climaSorteado.efeitoTexto}
                </div>
                <div style="font-size: 11px; color: #555; line-height: 1.3;">
                    ${climaSorteado.detalhe}
                </div>
            </div>

            <!-- NOTAS OPERACIONAIS / BOAS-VINDAS -->
            <div style="background-color: #f1ece1; padding: 12px; border: 1px solid #d4ceb8; border-radius: 4px;">
                ${painelComunidadeHTML}
            </div>
        </div>

        <!-- BOTÃO FECHAR -->
        <div style="margin-top: 20px; text-align: center;">
            <button id="btn-fechar-jornal" style="
                background-color: #1e1e1e;
                color: #ffffff;
                border: none;
                padding: 10px 25px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                border-radius: 4px;
                text-transform: uppercase;
            ">Fechar Jornal</button>
        </div>
    `;
}

// ==========================================================
// 4. CONFIGURAÇÃO PRINCIPAL DO SISTEMA
// ==========================================================
export function setupSistemaJornal(scene) {
    const posX = 2.2;
    const posZ = -8.5;

    const { caixa, hitbox, grupoExclamacao } = criarMalhasCaixaJornal(scene, posX, posZ);
    const { jornalOverlay, jornalPapel } = criarModalJornalHTML();

    const abrirJornal = () => {
        temJornalNovo = false;
        grupoExclamacao.setEnabled(false);

        jornalPapel.innerHTML = gerarConteudoJornal();
        jornalOverlay.style.display = "flex";

        document.getElementById("btn-fechar-jornal").addEventListener("click", () => {
            jornalOverlay.style.display = "none";
        });
    };

    jornalOverlay.addEventListener("click", (e) => {
        if (e.target === jornalOverlay) {
            jornalOverlay.style.display = "none";
        }
    });

    [caixa, hitbox].forEach(mesh => {
        mesh.isPickable = true;
        mesh.actionManager = new BABYLON.ActionManager(scene);
        mesh.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                () => abrirJornal()
            )
        );
    });

    let tempoAnimacao = 0;

    registerGameAnimation(scene, (dt) => {
        if (temJornalNovo) {
            tempoAnimacao += dt * 3;
            grupoExclamacao.position.y = 1.8 + Math.sin(tempoAnimacao) * 0.12;
            grupoExclamacao.rotation.y += dt * 1.5;
            grupoExclamacao.setEnabled(true);
        } else {
            grupoExclamacao.setEnabled(false);
        }

        const data = getDataAtual();
        const diasDecorridos = getDiasDecorridos(data);
        const semanaAtual = Math.floor(diasDecorridos / 7);

        if (ultimoSemanaRegistrada !== -1 && semanaAtual > ultimoSemanaRegistrada) {
            temJornalNovo = true;
            primeiraEdicaoVista = true;
        }
        
        ultimoSemanaRegistrada = semanaAtual;
    });
}