import { registerGameAnimation, getDataAtual } from './tempo.js';
import { getVazaoAtualHora, getQuantidadeBombas } from './sistema-agua.js';
import { getConsumoTotalEnergia } from './sistema-energia.js';

let temJornalNovo = true; // Começa com a edição inaugural da semana 1
let ultimoSemanaRegistrada = -1;
let primeiraEdicaoVista = false; // Controle para a notícia inaugural

// Previsões do tempo possíveis para a semana
const CLIMAS_POSSIVEIS = [
    { nome: "Ensolarado & Seco", icone: "☀️", efeito: "Consumo de água normal", detalhe: "Dias quentes e secos previstos. Estabilidade no consumo." },
    { nome: "Onda de Calor Repentina", icone: "🔥", efeito: "Demanda de água +25%", detalhe: "Temperaturas altas farão a população consumir mais água. Fique atento às metas!" },
    { nome: "Chuva Forte & Temporal", icone: "🌧️", efeito: "Turbidez do rio elevada", detalhe: "A chuva forte trará mais areia e sujeira ao leito do rio." },
    { nome: "Clima Ameno & Nublado", icone: "🌤️", efeito: "Operação estável", detalhe: "Semana tranquila sem sobressaltos operacionais." }
];

let climaAtualSemana = CLIMAS_POSSIVEIS[0];

export function getClimaSemanaAtual() {
    return climaAtualSemana;
}

export function setupSistemaJornal(scene) {
    // ------------------------------------------------------------------
    // 1. ESTRUTURA 3D DA CAIXA DE JORNAL (DENTRO DA ETA, AO LADO DO PORTÃO)
    // ------------------------------------------------------------------
    const posX = 2.2;
    const posZ = -8.5; // Logo ao lado do portão (Z: -10), dentro da ETA

    const grupoJornal = new BABYLON.TransformNode("grupoCaixaJornal", scene);
    grupoJornal.position.set(posX, 0, posZ);

    // Pedestal
    const matPedestal = new BABYLON.StandardMaterial("matPedestalJornal", scene);
    matPedestal.diffuseColor = BABYLON.Color3.FromHexString("#334155");
    
    const pedestal = BABYLON.MeshBuilder.CreateCylinder("pedestalJornal", { diameter: 0.15, height: 1.0 }, scene);
    pedestal.position.y = 0.5;
    pedestal.material = matPedestal;
    pedestal.parent = grupoJornal;

    // Caixa de metal
    const matCaixa = new BABYLON.StandardMaterial("matCaixaJornal", scene);
    matCaixa.diffuseColor = BABYLON.Color3.FromHexString("#0284c7");
    
    const caixa = BABYLON.MeshBuilder.CreateBox("caixaJornalCorpo", { width: 0.6, height: 0.7, depth: 0.45 }, scene);
    caixa.position.y = 1.15;
    caixa.material = matCaixa;
    caixa.parent = grupoJornal;

    // Vidro transparente frontal
    const matVidro = new BABYLON.StandardMaterial("matVidroJornal", scene);
    matVidro.diffuseColor = BABYLON.Color3.FromHexString("#cbd5e1");
    matVidro.alpha = 0.5;

    const vidro = BABYLON.MeshBuilder.CreatePlane("vidroJornal", { width: 0.48, height: 0.45 }, scene);
    vidro.position.set(0, 1.15, -0.23);
    vidro.rotation.y = Math.PI;
    vidro.material = matVidro;
    vidro.parent = grupoJornal;

    // Hitbox invisível para facilitar o clique
    const hitbox = BABYLON.MeshBuilder.CreateBox("hitboxJornal", { width: 1.0, height: 1.8, depth: 1.0 }, scene);
    hitbox.position.y = 0.9;
    hitbox.visibility = 0;
    hitbox.isPickable = true;
    hitbox.parent = grupoJornal;

    // ------------------------------------------------------------------
    // 2. ÍCONE DE EXCLAMAÇÃO 3D ("!") FLUTUANTE E ANIMADO
    // ------------------------------------------------------------------
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

    // ------------------------------------------------------------------
    // 3. ESTRUTURA HTML DO JORNAL (MODAL ESTILO IMPRESSO)
    // ------------------------------------------------------------------
    const jornalOverlay = document.createElement("div");
    jornalOverlay.id = "modal-jornal-overlay";
    jornalOverlay.style.position = "fixed";
    jornalOverlay.style.top = "0";
    jornalOverlay.style.left = "0";
    jornalOverlay.style.width = "100vw";
    jornalOverlay.style.height = "100vh";
    jornalOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
    jornalOverlay.style.backdropFilter = "blur(6px)";
    jornalOverlay.style.display = "none";
    jornalOverlay.style.justifyContent = "center";
    jornalOverlay.style.alignItems = "center";
    jornalOverlay.style.zIndex = "9999";

    const jornalPapel = document.createElement("div");
    jornalPapel.style.backgroundColor = "#fcf8f2";
    jornalPapel.style.color = "#1e1e1e";
    jornalPapel.style.border = "3px solid #332d27";
    jornalPapel.style.borderRadius = "4px";
    jornalPapel.style.padding = "30px";
    jornalPapel.style.width = "90%";
    jornalPapel.style.maxWidth = "650px";
    jornalPapel.style.boxShadow = "0 20px 40px rgba(0,0,0,0.9)";
    jornalPapel.style.fontFamily = "'Georgia', 'Times New Roman', serif";

    jornalOverlay.appendChild(jornalPapel);
    document.body.appendChild(jornalOverlay);

    const abrirJornal = () => {
        temJornalNovo = false;
        grupoExclamacao.setEnabled(false);

        const data = getDataAtual();
        const dataFormatada = data.toLocaleDateString('pt-BR');

        let manchete = "";
        let artigoOpiniao = "";
        let painelComunidadeHTML = "";

        // EDIÇÃO 1: NOVO GESTOR NOMEADO
        if (!primeiraEdicaoVista) {
            manchete = "NOVO(A) GESTOR(A) ASSUME O COMANDO DA ESTAÇÃO DE TRATAMENTO DE ÁGUA!";
            artigoOpiniao = "A administração local confirmou hoje a nomeação do novo representante responsável por gerenciar as operações da ETA. A população e os setores da cidade acompanham com grande expectativa o início dos trabalhos, aguardando investimentos em infraestrutura, estabilidade no fornecimento e gestão eficiente do saneamento. Desejamos uma excelente gestão ao novo(a) diretor(a)!";
            
            painelComunidadeHTML = `
                <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #999; padding-bottom: 4px; margin-bottom: 8px;">
                    📌 Nota de Boas-Vindas
                </div>
                <div style="font-size: 12px; line-height: 1.5; color: #333;">
                    "Iniciamos uma nova fase no saneamento. O objetivo é estruturar a captação e garantir o abastecimento contínuo para todos os distritos nos próximos meses."
                </div>
            `;
        } else {
            // EDIÇÕES SUBSEQUENTES: SISTEMA DINÂMICO
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

        jornalPapel.innerHTML = `
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
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">
                        ${climaAtualSemana.icone} ${climaAtualSemana.nome}
                    </div>
                    <div style="font-size: 12px; font-weight: bold; color: #b91c1c; margin-bottom: 4px;">
                        Efeito: ${climaAtualSemana.efeito}
                    </div>
                    <div style="font-size: 11px; color: #555; line-height: 1.3;">
                        ${climaAtualSemana.detalhe}
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

    // ------------------------------------------------------------------
    // 4. ACTION MANAGER & CURSOR HOVER DA CAIXA
    // ------------------------------------------------------------------
    const alvos = [caixa, hitbox];
    alvos.forEach(m => {
        m.isPickable = true;
        m.actionManager = new BABYLON.ActionManager(scene);
        m.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                () => abrirJornal()
            )
        );
    });

    // ------------------------------------------------------------------
    // 5. ANIMAÇÃO DO ÍCONE E ATUALIZAÇÃO SEMANAL
    // ------------------------------------------------------------------
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
        const diasTotais = Math.floor(data.getTime() / (1000 * 60 * 60 * 24));
        const semanaAtual = Math.floor(diasTotais / 7);

        if (ultimoSemanaRegistrada !== -1 && semanaAtual > ultimoSemanaRegistrada) {
            temJornalNovo = true;
            primeiraEdicaoVista = true; // Virou a semana: entra o modo dinâmico normal
            climaAtualSemana = CLIMAS_POSSIVEIS[Math.floor(Math.random() * CLIMAS_POSSIVEIS.length)];
        }
        
        ultimoSemanaRegistrada = semanaAtual;
    });
}