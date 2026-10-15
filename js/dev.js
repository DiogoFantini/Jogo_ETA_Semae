let modoDesenvolvedorAtivo = false;
let cliquesConstruir = 0;
let containerCartesiano = null;
let observerCartesiano = null;

// Elementos de Interface do Dev Tools
let btnFerramentas = null;
let menuFerramentas = null;
let painelCores = null;

export function isDevModeActive() {
    return modoDesenvolvedorAtivo;
}

// Contabiliza os 10 cliques no botão "Construir" para revelar o modo desenvolvedor
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
// CONFIGURAÇÃO DO MODO DESENVOLVEDOR E INTERFACE DE FERRAMENTAS
// ==========================================================
export function setupDevButton(scene, groundInterno, tamanhoGrid, getModoConstrucao) {
    if (document.getElementById("btnDesenvolvedor")) return;

    // 1. Botão Inferior do Modo Desenvolvedor
    const btnDev = document.createElement("button");
    btnDev.id = "btnDesenvolvedor";
    btnDev.innerText = "Desenvolvedor";
    btnDev.style.position = "absolute";
    btnDev.style.bottom = "20px";
    btnDev.style.left = "20px";
    btnDev.style.padding = "10px 15px";
    btnDev.style.backgroundColor = "#7c3aed";
    btnDev.style.color = "#fff";
    btnDev.style.border = "none";
    btnDev.style.borderRadius = "6px";
    btnDev.style.fontFamily = "Arial, sans-serif";
    btnDev.style.fontWeight = "bold";
    btnDev.style.cursor = "pointer";
    btnDev.style.boxShadow = "0 4px 6px rgba(0,0,0,0.3)";
    btnDev.style.display = "none";
    btnDev.style.zIndex = "100";
    document.body.appendChild(btnDev);

    // Cria as interfaces do menu de ferramentas e painel de cores no canto direito
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
            if (btnFerramentas) btnFerramentas.style.display = "none";
            if (menuFerramentas) menuFerramentas.style.display = "none";
            if (painelCores) painelCores.style.display = "none";

            removerSistemaCartesianoHTML(scene);
        }
    });
}

// ==========================================================
// MENU DE FERRAMENTAS & PAINEL DE CORES EM TEMPO REAL
// ==========================================================
function criarInterfaceFerramentas(scene) {
    // 1. Botão "Ferramentas" no Canto Superior Direito
    btnFerramentas = document.createElement("button");
    btnFerramentas.id = "btnDevFerramentas";
    btnFerramentas.innerHTML = "⚙️ Ferramentas";
    btnFerramentas.style.position = "absolute";
    btnFerramentas.style.top = "20px";
    btnFerramentas.style.right = "260px"; // Posicionado ao lado do HUD de estatísticas
    btnFerramentas.style.backgroundColor = "#0284c7";
    btnFerramentas.style.color = "#ffffff";
    btnFerramentas.style.border = "1px solid #38bdf8";
    btnFerramentas.style.borderRadius = "8px";
    btnFerramentas.style.padding = "10px 16px";
    btnFerramentas.style.fontFamily = "Arial, sans-serif";
    btnFerramentas.style.fontSize = "14px";
    btnFerramentas.style.fontWeight = "bold";
    btnFerramentas.style.cursor = "pointer";
    btnFerramentas.style.boxShadow = "0 4px 8px rgba(0,0,0,0.4)";
    btnFerramentas.style.zIndex = "100";
    btnFerramentas.style.display = "none"; // Exibido apenas em Modo Dev
    document.body.appendChild(btnFerramentas);

    // 2. Submenu de Opções
    menuFerramentas = document.createElement("div");
    menuFerramentas.id = "menuDevFerramentas";
    menuFerramentas.style.position = "absolute";
    menuFerramentas.style.top = "65px";
    menuFerramentas.style.right = "260px";
    menuFerramentas.style.backgroundColor = "rgba(15, 23, 42, 0.95)";
    menuFerramentas.style.border = "1px solid #38bdf8";
    menuFerramentas.style.borderRadius = "8px";
    menuFerramentas.style.padding = "10px";
    menuFerramentas.style.display = "none";
    menuFerramentas.style.flexDirection = "column";
    menuFerramentas.style.gap = "8px";
    menuFerramentas.style.zIndex = "100";
    menuFerramentas.style.minWidth = "150px";
    document.body.appendChild(menuFerramentas);

    menuFerramentas.innerHTML = `
        <button id="btnOpcaoCores" style="
            background: #1e293b;
            color: #fff;
            border: 1px solid #334155;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 13px;
            text-align: left;
            transition: background 0.2s;
        ">🎨 Cores do Ambiente</button>
    `;

    // 3. Painel de Edição de Cores
    painelCores = document.createElement("div");
    painelCores.id = "painelDevCores";
    painelCores.style.position = "absolute";
    painelCores.style.top = "65px";
    painelCores.style.right = "260px";
    painelCores.style.backgroundColor = "rgba(15, 23, 42, 0.98)";
    painelCores.style.border = "2px solid #38bdf8";
    painelCores.style.borderRadius = "10px";
    painelCores.style.padding = "15px";
    painelCores.style.display = "none";
    painelCores.style.flexDirection = "column";
    painelCores.style.gap = "12px";
    painelCores.style.zIndex = "101";
    painelCores.style.color = "#ffffff";
    painelCores.style.fontFamily = "Arial, sans-serif";
    painelCores.style.fontSize = "13px";
    painelCores.style.boxShadow = "0 8px 16px rgba(0,0,0,0.6)";
    painelCores.style.minWidth = "210px";
    document.body.appendChild(painelCores);

    painelCores.innerHTML = `
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
            <label for="colorCeu">Céu / Fundo:</label>
            <input type="color" id="colorCeu" value="#87CFEB" style="cursor: pointer; border: none; background: none; width: 32px; height: 28px;">
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

    // Eventos dos Botões
    btnFerramentas.addEventListener("click", () => {
        const estaAberto = menuFerramentas.style.display === "flex";
        menuFerramentas.style.display = estaAberto ? "none" : "flex";
        painelCores.style.display = "none";
    });

    document.getElementById("btnOpcaoCores").addEventListener("click", () => {
        menuFerramentas.style.display = "none";
        painelCores.style.display = "flex";
        sincronizarCoresAtuais(scene);
    });

    document.getElementById("btnFecharCores").addEventListener("click", () => {
        painelCores.style.display = "none";
    });

    // Eventos de Alteração das Cores em Tempo Real
    conectarInputCor(scene, "colorAsfalto", "matAsfalto", "diffuseColor");
    conectarInputCor(scene, "colorMuro", "matMuro", "diffuseColor");
    conectarInputCor(scene, "colorGrama", "matGramaNormal", "diffuseColor");
    conectarInputCor(scene, "colorPortao", "matPortao", "diffuseColor");
    conectarInputCor(scene, "colorCorpoAdmin", "matCorpo", "diffuseColor");

    // Alteração específica para a cor do céu (clearColor da Scene)
    const inputCeu = document.getElementById("colorCeu");
    if (inputCeu) {
        inputCeu.addEventListener("input", (e) => {
            scene.clearColor = BABYLON.Color4.FromHexString(e.target.value + "FF");
        });
    }
}

// Conecta o `<input type="color">` diretamente ao material correspondente do Babylon
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

// Carrega as cores vigentes na cena para os seletores ao abrir o painel
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

    const inputCeu = document.getElementById("colorCeu");
    if (inputCeu && scene.clearColor) {
        inputCeu.value = scene.clearColor.toHexString().substring(0, 7);
    }
}

// ==========================================================
// SISTEMA CARTESIANO (MARCAÇÃO DE CÉLULAS HTML A-H / 1-6)
// ==========================================================
export function criarSistemaCartesianoHTML(scene, groundInterno, tamanhoGrid) {
    removerSistemaCartesianoHTML(scene);

    containerCartesiano = document.createElement("div");
    containerCartesiano.id = "sistema-cartesiano-hud";
    containerCartesiano.style.position = "absolute";
    containerCartesiano.style.top = "0";
    containerCartesiano.style.left = "0";
    containerCartesiano.style.width = "100%";
    containerCartesiano.style.height = "100%";
    containerCartesiano.style.pointerEvents = "none";
    containerCartesiano.style.zIndex = "5";
    document.body.appendChild(containerCartesiano);

    const letras = ["A", "B", "C", "D", "E", "F", "G", "H"]; 
    const asfaltoPosX = groundInterno.position.x; 
    const asfaltoPosZ = groundInterno.position.z; 

    function atualizarPosicoes() {
        if (!containerCartesiano) return;
        containerCartesiano.innerHTML = "";

        letras.forEach((letra, indexX) => {
            const localX = 10.5 - (indexX * tamanhoGrid);
            const posMundo = new BABYLON.Vector3(localX + asfaltoPosX, 0.1, -10.5 + asfaltoPosZ); 
            const projecao = BABYLON.Vector3.Project(
                posMundo,
                BABYLON.Matrix.Identity(),
                scene.getTransformMatrix(),
                scene.activeCamera.viewport.toGlobal(scene.getEngine().getRenderWidth(), scene.getEngine().getRenderHeight())
            );

            if (projecao.z >= 0 && projecao.z <= 1) {
                const el = document.createElement("div");
                el.innerText = letra;
                el.style.position = "absolute";
                el.style.left = `${projecao.x}px`;
                el.style.top = `${projecao.y + 10}px`;
                el.style.transform = "translateX(-50%)";
                el.style.color = "#ef4444"; 
                el.style.fontFamily = "Arial, sans-serif";
                el.style.fontWeight = "bold";
                el.style.fontSize = "18px";
                el.style.textShadow = "1px 1px 2px #000";
                containerCartesiano.appendChild(el);
            }
        });

        let numeroAtual = 1;
        for (let localZ = -7.5; localZ <= 7.5; localZ += tamanhoGrid) {
            const posMundo = new BABYLON.Vector3(12.5 + asfaltoPosX, 0.1, localZ + asfaltoPosZ); 
            const projecao = BABYLON.Vector3.Project(
                posMundo,
                BABYLON.Matrix.Identity(),
                scene.getTransformMatrix(),
                scene.activeCamera.viewport.toGlobal(scene.getEngine().getRenderWidth(), scene.getEngine().getRenderHeight())
            );

            if (projecao.z >= 0 && projecao.z <= 1) {
                const el = document.createElement("div");
                el.innerText = numeroAtual;
                el.style.position = "absolute";
                el.style.left = `${projecao.x + 10}px`;
                el.style.top = `${projecao.y}px`;
                el.style.transform = "translateY(-50%)";
                el.style.color = "#ef4444"; 
                el.style.fontFamily = "Arial, sans-serif";
                el.style.fontWeight = "bold";
                el.style.fontSize = "18px";
                el.style.textShadow = "1px 1px 2px #000";
                containerCartesiano.appendChild(el);
            }
            numeroAtual++;
        }
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
}