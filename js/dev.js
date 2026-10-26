import { 
    setVelocidadeTempo, 
    setHorarioJogo, 
    getVelocidadeAtual, 
    getDataAtual 
} from './tempo.js';
import { setProximoClima, EVENTOS_CLIMATICOS } from './clima.js';

let modoDesenvolvedorAtivo = false;
let cliquesConstruir = 0;
let containerCartesiano = null;
let observerCartesiano = null;
let elementosCartesianos = []; // Cache dos elementos DOM para evitar re-criação a cada frame

// Elementos de Interface
let btnFerramentas = null;
let menuFerramentas = null;
let painelCores = null;
let painelTempo = null;
let painelClima = null;

export function isDevModeActive() {
    return modoDesenvolvedorAtivo;
}

export function registrarCliqueConstruir() {
    if (!modoDesenvolvedorAtivo) {
        cliquesConstruir++;
        if (cliquesConstruir === 10) {
            const btnDev = document.getElementById("btnDesenvolvedor");
            if (btnDev) btnDev.style.display = "block";
        }
    }
}

// ==========================================================
// CONFIGURAÇÃO DO MODO DESENVOLVEDOR
// ==========================================================
export function setupDevButton(scene, groundInterno, tamanhoGrid, getModoConstrucao) {
    if (document.getElementById("btnDesenvolvedor")) return;

    // Botão Principal Dev (Canto Inferior Esquerdo)
    const btnDev = document.createElement("button");
    btnDev.id = "btnDesenvolvedor";
    btnDev.innerText = "Desenvolvedor";
    btnDev.style.cssText = `
        position: absolute; bottom: 20px; left: 20px;
        padding: 10px 15px; background-color: #7c3aed; color: #fff;
        border: none; border-radius: 6px; font-family: Arial, sans-serif;
        font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        display: none; z-index: 100;
    `;
    document.body.appendChild(btnDev);

    criarInterfaceFerramentas(scene);

    btnDev.addEventListener("click", () => {
        modoDesenvolvedorAtivo = !modoDesenvolvedorAtivo;
        if (modoDesenvolvedorAtivo) {
            btnDev.style.background = "#db2777";
            if (btnFerramentas) btnFerramentas.style.display = "flex";

            if (getModoConstrucao()) {
                criarSistemaCartesianoHTML(scene, groundInterno, tamanhoGrid);
            }
        } else {
            btnDev.style.background = "#7c3aed";
            [btnFerramentas, menuFerramentas, painelCores, painelTempo, painelClima].forEach(el => {
                if (el) el.style.display = "none";
            });

            removerSistemaCartesianoHTML(scene);
        }
    });
}

// ==========================================================
// CONSTRUÇÃO E EVENTOS DOS PAINÉIS DE FERRAMENTAS
// ==========================================================
function criarInterfaceFerramentas(scene) {
    // 1. Botão Ferramentas
    btnFerramentas = document.createElement("button");
    btnFerramentas.id = "btnDevFerramentas";
    btnFerramentas.innerHTML = "⚙️ Ferramentas";
    btnFerramentas.style.cssText = `
        position: absolute; bottom: 20px; right: 20px;
        background-color: #0284c7; color: #ffffff; border: 1px solid #38bdf8;
        border-radius: 8px; padding: 10px 16px; font-family: Arial, sans-serif;
        font-size: 14px; font-weight: bold; cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.4); z-index: 100; display: none;
    `;
    document.body.appendChild(btnFerramentas);

    // 2. Submenu de Opções
    menuFerramentas = document.createElement("div");
    menuFerramentas.id = "menuDevFerramentas";
    menuFerramentas.style.cssText = `
        position: absolute; bottom: 65px; right: 20px;
        background-color: rgba(15, 23, 42, 0.95); border: 1px solid #38bdf8;
        border-radius: 8px; padding: 10px; display: none; flex-direction: column;
        gap: 8px; z-index: 100; min-width: 180px;
    `;
    menuFerramentas.innerHTML = `
        <button id="btnOpcaoCores" class="btnDevMenuOption">🎨 Cores do Ambiente</button>
        <button id="btnOpcaoTempo" class="btnDevMenuOption">⏱️ Controle de Tempo</button>
        <button id="btnOpcaoClima" class="btnDevMenuOption">🌤️ Clima da Próx. Semana</button>
    `;
    document.body.appendChild(menuFerramentas);

    // Aplicar estilos aos botões do menu
    menuFerramentas.querySelectorAll(".btnDevMenuOption").forEach(btn => {
        btn.style.cssText = `
            background: #1e293b; color: #fff; border: 1px solid #334155;
            padding: 8px 12px; border-radius: 6px; cursor: pointer;
            font-weight: bold; font-size: 13px; text-align: left; transition: background 0.2s;
        `;
    });

    // 3. Painéis de Conteúdo
    painelCores = criarPainelCoresHTML();
    painelTempo = criarPainelTempoHTML();
    painelClima = criarPainelClimaHTML();

    [painelCores, painelTempo, painelClima].forEach(p => document.body.appendChild(p));

    // 4. Configuração dos Eventos
    setupEventosFerramentas(scene);
}

function criarPainelCoresHTML() {
    const p = document.createElement("div");
    p.id = "painelDevCores";
    p.style.cssText = `
        position: absolute; bottom: 65px; right: 20px;
        background-color: rgba(15, 23, 42, 0.98); border: 2px solid #38bdf8;
        border-radius: 10px; padding: 15px; display: none; flex-direction: column;
        gap: 12px; z-index: 101; color: #ffffff; font-family: Arial, sans-serif;
        font-size: 13px; box-shadow: 0 8px 16px rgba(0,0,0,0.6); min-width: 220px;
    `;
    p.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 6px; font-weight: bold; color: #38bdf8;">
            <span>🎨 Editor de Cores</span>
            <button id="btnFecharCores" style="background: none; border: none; color: #f87171; font-size: 16px; cursor: pointer; font-weight: bold;">✕</button>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <label for="colorAsfalto">Chão da ETA:</label>
            <input type="color" id="colorAsfalto" value="#737880" style="cursor: pointer; border: none; background: none; width: 32px; height: 28px;">
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <label for="colorMuro">Muros do Perímetro:</label>
            <input type="color" id="colorMuro" value="#EBEBF2" style="cursor: pointer; border: none; background: none; width: 32px; height: 28px;">
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <label for="colorGrama">Grama Externa:</label>
            <input type="color" id="colorGrama" value="#339933" style="cursor: pointer; border: none; background: none; width: 32px; height: 28px;">
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <label for="colorPortao">Portão Principal:</label>
            <input type="color" id="colorPortao" value="#262B33" style="cursor: pointer; border: none; background: none; width: 32px; height: 28px;">
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <label for="colorCorpoAdmin">Prédio Admin:</label>
            <input type="color" id="colorCorpoAdmin" value="#E6E6ED" style="cursor: pointer; border: none; background: none; width: 32px; height: 28px;">
        </div>
    `;
    return p;
}

function criarPainelTempoHTML() {
    const p = document.createElement("div");
    p.id = "painelDevTempo";
    p.style.cssText = `
        position: absolute; bottom: 65px; right: 20px;
        background-color: rgba(15, 23, 42, 0.98); border: 2px solid #38bdf8;
        border-radius: 10px; padding: 15px; display: none; flex-direction: column;
        gap: 12px; z-index: 101; color: #ffffff; font-family: Arial, sans-serif;
        font-size: 13px; box-shadow: 0 8px 16px rgba(0,0,0,0.6); min-width: 240px;
    `;
    p.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 6px; font-weight: bold; color: #38bdf8;">
            <span>⏱️ Controle de Tempo Dev</span>
            <button id="btnFecharTempo" style="background: none; border: none; color: #f87171; font-size: 16px; cursor: pointer; font-weight: bold;">✕</button>
        </div>
        <div>
            <span style="color: #94a3b8; font-weight: bold;">Velocidade Personalizada:</span>
            <div style="display: flex; gap: 6px; margin-top: 6px;">
                <button class="btnVelDev" data-vel="0.5" style="flex: 1; background: #1e293b; color: #fff; border: 1px solid #334155; border-radius: 4px; padding: 4px; cursor: pointer; font-weight: bold;">0.5x</button>
                <button class="btnVelDev" data-vel="1" style="flex: 1; background: #1e293b; color: #fff; border: 1px solid #334155; border-radius: 4px; padding: 4px; cursor: pointer; font-weight: bold;">1x</button>
                <button class="btnVelDev" data-vel="5" style="flex: 1; background: #1e293b; color: #fff; border: 1px solid #334155; border-radius: 4px; padding: 4px; cursor: pointer; font-weight: bold;">5x</button>
                <button class="btnVelDev" data-vel="10" style="flex: 1; background: #1e293b; color: #fff; border: 1px solid #334155; border-radius: 4px; padding: 4px; cursor: pointer; font-weight: bold;">10x</button>
            </div>
            <div style="display: flex; gap: 6px; margin-top: 6px; align-items: center;">
                <input type="number" id="inputVelLivre" step="0.5" min="0.1" max="100" value="1" style="width: 70px; background: #1e293b; color: #fff; border: 1px solid #334155; border-radius: 4px; padding: 4px 6px; outline: none;">
                <button id="btnAplicarVel" style="flex: 1; background: #0284c7; color: #fff; border: none; border-radius: 4px; padding: 5px; cursor: pointer; font-weight: bold;">Aplicar Vel.</button>
            </div>
        </div>
        <div style="border-top: 1px solid #334155; padding-top: 10px;">
            <span style="color: #94a3b8; font-weight: bold;">Alterar Horário do Jogo:</span>
            <div style="display: flex; gap: 6px; margin-top: 6px; align-items: center;">
                <input type="time" id="inputHorarioDev" value="07:00" style="flex: 1; background: #1e293b; color: #fff; border: 1px solid #334155; border-radius: 4px; padding: 4px 6px; outline: none; font-size: 14px;">
                <button id="btnAplicarHora" style="background: #0284c7; color: #fff; border: none; border-radius: 4px; padding: 6px 10px; cursor: pointer; font-weight: bold;">Definir</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px;">
                <button class="btnPresetHora" data-hora="06:00" style="background: #1e293b; color: #fde047; border: 1px solid #334155; border-radius: 4px; padding: 4px; cursor: pointer; font-weight: bold; font-size: 11px;">🌅 06:00 (Alvorada)</button>
                <button class="btnPresetHora" data-hora="12:00" style="background: #1e293b; color: #fde047; border: 1px solid #334155; border-radius: 4px; padding: 4px; cursor: pointer; font-weight: bold; font-size: 11px;">☀️ 12:00 (Dia)</button>
                <button class="btnPresetHora" data-hora="18:00" style="background: #1e293b; color: #c084fc; border: 1px solid #334155; border-radius: 4px; padding: 4px; cursor: pointer; font-weight: bold; font-size: 11px;">🌆 18:00 (Pôr do Sol)</button>
                <button class="btnPresetHora" data-hora="00:00" style="background: #1e293b; color: #38bdf8; border: 1px solid #334155; border-radius: 4px; padding: 4px; cursor: pointer; font-weight: bold; font-size: 11px;">🌙 00:00 (Noite)</button>
            </div>
        </div>
    `;
    return p;
}

function criarPainelClimaHTML() {
    const p = document.createElement("div");
    p.id = "painelDevClima";
    p.style.cssText = `
        position: absolute; bottom: 65px; right: 20px;
        background-color: rgba(15, 23, 42, 0.98); border: 2px solid #38bdf8;
        border-radius: 10px; padding: 15px; display: none; flex-direction: column;
        gap: 12px; z-index: 101; color: #ffffff; font-family: Arial, sans-serif;
        font-size: 13px; box-shadow: 0 8px 16px rgba(0,0,0,0.6); min-width: 260px;
    `;
    p.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 6px; font-weight: bold; color: #38bdf8;">
            <span>🌤️ Selecionar Clima da Próx. Semana</span>
            <button id="btnFecharClima" style="background: none; border: none; color: #f87171; font-size: 16px; cursor: pointer; font-weight: bold;">✕</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="btnClimaDev" data-clima="normal" style="background: #1e293b; color: #fff; border: 1px solid #334155; border-radius: 6px; padding: 8px; cursor: pointer; font-weight: bold; text-align: left;">🌤️ Normal & Ameno</button>
            <button class="btnClimaDev" data-clima="onda_calor" style="background: #1e293b; color: #fff; border: 1px solid #334155; border-radius: 6px; padding: 8px; cursor: pointer; font-weight: bold; text-align: left;">🔥 Onda de Calor (+25% Demanda)</button>
            <button class="btnClimaDev" data-clima="chuva_forte" style="background: #1e293b; color: #fff; border: 1px solid #334155; border-radius: 6px; padding: 8px; cursor: pointer; font-weight: bold; text-align: left;">🌧️ Chuva Forte (Alta Turbidez)</button>
            <button class="btnClimaDev" data-clima="seca_severa" style="background: #1e293b; color: #fff; border: 1px solid #334155; border-radius: 6px; padding: 8px; cursor: pointer; font-weight: bold; text-align: left;">🌵 Seca Severa (-30% Vazão)</button>
        </div>
        <div id="statusClimaAgendado" style="font-size: 11px; color: #38bdf8; text-align: center; margin-top: 4px; font-style: italic;">
            Clima agendado: Aleatório
        </div>
    `;
    return p;
}

function setupEventosFerramentas(scene) {
    btnFerramentas.addEventListener("click", () => {
        const estaAberto = menuFerramentas.style.display === "flex";
        menuFerramentas.style.display = estaAberto ? "none" : "flex";
        painelCores.style.display = "none";
        painelTempo.style.display = "none";
        painelClima.style.display = "none";
    });

    document.getElementById("btnOpcaoCores").addEventListener("click", () => {
        menuFerramentas.style.display = "none";
        painelCores.style.display = "flex";
        painelTempo.style.display = "none";
        painelClima.style.display = "none";
        sincronizarCoresAtuais(scene);
    });

    document.getElementById("btnOpcaoTempo").addEventListener("click", () => {
        menuFerramentas.style.display = "none";
        painelCores.style.display = "none";
        painelTempo.style.display = "flex";
        painelClima.style.display = "none";
        
        document.getElementById("inputVelLivre").value = getVelocidadeAtual();
        const d = getDataAtual();
        document.getElementById("inputHorarioDev").value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });

    document.getElementById("btnOpcaoClima").addEventListener("click", () => {
        menuFerramentas.style.display = "none";
        painelCores.style.display = "none";
        painelTempo.style.display = "none";
        painelClima.style.display = "flex";
    });

    document.getElementById("btnFecharCores").addEventListener("click", () => { painelCores.style.display = "none"; });
    document.getElementById("btnFecharTempo").addEventListener("click", () => { painelTempo.style.display = "none"; });
    document.getElementById("btnFecharClima").addEventListener("click", () => { painelClima.style.display = "none"; });

    // Eventos de Clima
    const botoesClima = painelClima.querySelectorAll(".btnClimaDev");
    botoesClima.forEach(btn => {
        btn.addEventListener("click", () => {
            const idClima = btn.getAttribute("data-clima");
            setProximoClima(idClima, scene);

            botoesClima.forEach(b => {
                b.style.backgroundColor = "#1e293b";
                b.style.borderColor = "#334155";
            });
            btn.style.backgroundColor = "#0284c7";
            btn.style.borderColor = "#38bdf8";

            const status = document.getElementById("statusClimaAgendado");
            if (status && EVENTOS_CLIMATICOS[idClima]) {
                status.innerText = `Agendado p/ próxima semana: ${EVENTOS_CLIMATICOS[idClima].nome}`;
            }
        });
    });

    // Eventos de Tempo
    painelTempo.querySelectorAll(".btnVelDev").forEach(btn => {
        btn.addEventListener("click", () => {
            const vel = parseFloat(btn.getAttribute("data-vel"));
            setVelocidadeTempo(vel);
            document.getElementById("inputVelLivre").value = vel;
        });
    });

    document.getElementById("btnAplicarVel").addEventListener("click", () => {
        const vel = parseFloat(document.getElementById("inputVelLivre").value);
        if (!isNaN(vel) && vel > 0) setVelocidadeTempo(vel);
    });

    const aplicarHorarioPorExtenso = (strHora) => {
        const [h, m] = strHora.split(":").map(Number);
        if (!isNaN(h) && !isNaN(m)) {
            setHorarioJogo(h, m);
            document.getElementById("inputHorarioDev").value = strHora;
        }
    };

    document.getElementById("btnAplicarHora").addEventListener("click", () => {
        aplicarHorarioPorExtenso(document.getElementById("inputHorarioDev").value);
    });

    painelTempo.querySelectorAll(".btnPresetHora").forEach(btn => {
        btn.addEventListener("click", () => {
            aplicarHorarioPorExtenso(btn.getAttribute("data-hora"));
        });
    });

    // Eventos de Cores
    conectarInputCor(scene, "colorAsfalto", "matAsfalto", "diffuseColor");
    conectarInputCor(scene, "colorMuro", "matMuro", "diffuseColor");
    conectarInputCor(scene, "colorGrama", "matGramaNormal", "diffuseColor");
    conectarInputCor(scene, "colorPortao", "matPortao", "diffuseColor");
    conectarInputCor(scene, "colorCorpoAdmin", "matCorpo", "diffuseColor");
}

function conectarInputCor(scene, elementId, materialName, propertyName) {
    const input = document.getElementById(elementId);
    if (!input) return;

    input.addEventListener("input", (e) => {
        const mat = scene.getMaterialByName(materialName);
        if (mat && mat[propertyName]) {
            mat[propertyName] = BABYLON.Color3.FromHexString(e.target.value);
        }
    });
}

function sincronizarCoresAtuais(scene) {
    const sincronizar = (elementId, materialName) => {
        const mat = scene.getMaterialByName(materialName);
        const input = document.getElementById(elementId);
        if (mat && mat.diffuseColor && input) {
            input.value = mat.diffuseColor.toHexString();
        }
    };

    sincronizar("colorAsfalto", "matAsfalto");
    sincronizar("colorMuro", "matMuro");
    sincronizar("colorGrama", "matGramaNormal");
    sincronizar("colorPortao", "matPortao");
    sincronizar("colorCorpoAdmin", "matCorpo");
}

// ==========================================================
// SISTEMA CARTESIANO DE ALTA PERFORMANCE (HTML A-H / 1-6)
// ==========================================================
export function criarSistemaCartesianoHTML(scene, groundInterno, tamanhoGrid) {
    removerSistemaCartesianoHTML(scene);

    containerCartesiano = document.createElement("div");
    containerCartesiano.id = "sistema-cartesiano-hud";
    containerCartesiano.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 5;
    `;
    document.body.appendChild(containerCartesiano);

    elementosCartesianos = [];
    const letras = ["A", "B", "C", "D", "E", "F", "G", "H"]; 
    const asfaltoPosX = groundInterno.position.x; 
    const asfaltoPosZ = groundInterno.position.z; 

    // 1. Instanciar elementos das Letras (A-H) uma única vez
    letras.forEach((letra, indexX) => {
        const localX = 10.5 - (indexX * tamanhoGrid);
        const posMundo = new BABYLON.Vector3(localX + asfaltoPosX, 0.1, -10.5 + asfaltoPosZ);

        const el = document.createElement("div");
        el.innerText = letra;
        el.style.cssText = `
            position: absolute; transform: translateX(-50%); color: #ef4444;
            font-family: Arial, sans-serif; font-weight: bold; font-size: 18px;
            text-shadow: 1px 1px 2px #000; display: none;
        `;
        containerCartesiano.appendChild(el);
        elementosCartesianos.push({ el, posMundo, offsetX: 0, offsetY: 10 });
    });

    // 2. Instanciar elementos dos Números (1-6) uma única vez
    let numeroAtual = 1;
    for (let localZ = -7.5; localZ <= 7.5; localZ += tamanhoGrid) {
        const posMundo = new BABYLON.Vector3(12.5 + asfaltoPosX, 0.1, localZ + asfaltoPosZ);

        const el = document.createElement("div");
        el.innerText = numeroAtual;
        el.style.cssText = `
            position: absolute; transform: translateY(-50%); color: #ef4444;
            font-family: Arial, sans-serif; font-weight: bold; font-size: 18px;
            text-shadow: 1px 1px 2px #000; display: none;
        `;
        containerCartesiano.appendChild(el);
        elementosCartesianos.push({ el, posMundo, offsetX: 10, offsetY: 0 });
        numeroAtual++;
    }

    // 3. Função de atualização leve executada a cada frame (sem innerHTML = "")
    function atualizarPosicoes() {
        if (!containerCartesiano || !scene.activeCamera) return;

        const engine = scene.getEngine();
        const viewport = scene.activeCamera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
        const transformMatrix = scene.getTransformMatrix();

        elementosCartesianos.forEach(item => {
            const projecao = BABYLON.Vector3.Project(
                item.posMundo,
                BABYLON.Matrix.Identity(),
                transformMatrix,
                viewport
            );

            if (projecao.z >= 0 && projecao.z <= 1) {
                item.el.style.left = `${projecao.x + item.offsetX}px`;
                item.el.style.top = `${projecao.y + item.offsetY}px`;
                item.el.style.display = "block";
            } else {
                item.el.style.display = "none";
            }
        });
    }

    observerCartesiano = atualizarPosicoes;
    scene.registerBeforeRender(observerCartesiano);
}

export function removerSistemaCartesianoHTML(scene) {
    if (observerCartesiano && scene) {
        scene.unregisterBeforeRender(observerCartesiano);
        observerCartesiano = null;
    }
    if (containerCartesiano) {
        containerCartesiano.remove();
        containerCartesiano = null;
    }
    elementosCartesianos = [];
}