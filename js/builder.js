import { toggleMenuConstrucao, itemSelecionado, setOnItemSelectCallback } from './hud.js';
import { createBombaAgua } from './bomba-agua.js';

export function setupBuildSystem(scene, groundInterno) {
    let modoConstrucao = false;
    let modoDesconstruir = false; 
    const tamanhoGrid = 3; 

    let cliquesConstruir = 0;
    let modoDesenvolvedorAtivo = false;
    let containerCartesiano = null;

    const matAsfaltoNormal = groundInterno.material;

    // ==========================================================
    // MATERIAL DA GRADE DE CONSTRUÇÃO
    // ==========================================================
    const matGridConstrucao = new BABYLON.GridMaterial("matGridConstrucao", scene);
    matGridConstrucao.mainColor = new BABYLON.Color3(0.1, 0.18, 0.28); 
    matGridConstrucao.lineColor = new BABYLON.Color3(0.2, 0.75, 1.0);  
    matGridConstrucao.gridRatio = tamanhoGrid;                                  
    matGridConstrucao.opacity = 0.98; 

    // ==========================================================
    // CURSOR DE DESTAQUE DE CONSTRUÇÃO
    // ==========================================================
    const cursorConstrucao = BABYLON.MeshBuilder.CreateBox("cursor", { width: tamanhoGrid, height: 0.06, depth: tamanhoGrid }, scene);
    cursorConstrucao.position.y = 0.06; 
    cursorConstrucao.isVisible = false; 
    cursorConstrucao.isPickable = false;
    cursorConstrucao.renderingGroupId = 1;

    // ==========================================================
    // MATERIAIS VIBRANTES (SISTEMA DE LUZ DESATIVADO)
    // ==========================================================
    const matCursorValido = new BABYLON.StandardMaterial("matCursorValido", scene);
    matCursorValido.diffuseColor = new BABYLON.Color3(0, 1, 0.2);
    matCursorValido.emissiveColor = new BABYLON.Color3(0, 1, 0.2); 
    matCursorValido.disableLighting = true; 
    matCursorValido.zOffset = -2;
    matCursorValido.alpha = 0.75;

    const matCursorInvalido = new BABYLON.StandardMaterial("matCursorInvalido", scene);
    matCursorInvalido.diffuseColor = new BABYLON.Color3(1, 0.1, 0.1);
    matCursorInvalido.emissiveColor = new BABYLON.Color3(1, 0.1, 0.1); 
    matCursorInvalido.disableLighting = true; 
    matCursorInvalido.zOffset = -2;
    matCursorInvalido.alpha = 0.75;

    const btnConstruir = document.getElementById("btnConstruir");
    const btnDesconstruir = document.getElementById("btnDesconstruir");

    // Alterna o material do chão ao selecionar/desselecionar um item no HUD
    setOnItemSelectCallback((item) => {
        if (item) {
            groundInterno.material = matGridConstrucao;
        } else {
            groundInterno.material = matAsfaltoNormal;
            cursorConstrucao.isVisible = false;
        }
    });

    // ==========================================================
    // SISTEMA CARTESIANO (Eixos para identificação das células)
    // ==========================================================
    function criarSistemaCartesianoHTML() {
        removerSistemaCartesianoHTML();

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

        scene.registerBeforeRender(atualizarPosicoes);
        containerCartesiano._observer = atualizarPosicoes;
    }

    function removerSistemaCartesianoHTML() {
        if (containerCartesiano) {
            containerCartesiano.remove();
            containerCartesiano = null;
        }
    }

    // ==========================================================
    // BOTÃO SECRETO DE DESENVOLVEDOR
    // ==========================================================
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

    btnDev.addEventListener("click", () => {
        modoDesenvolvedorAtivo = !modoDesenvolvedorAtivo;
        if (modoDesenvolvedorAtivo) {
            btnDev.style.background = "#db2777";
            if (modoConstrucao) criarSistemaCartesianoHTML();
        } else {
            btnDev.style.background = "#7c3aed";
            removerSistemaCartesianoHTML();
        }
    });

    if (btnConstruir && btnDesconstruir) {
        btnConstruir.addEventListener("click", () => {
            if (!modoDesenvolvedorAtivo) {
                cliquesConstruir++;
                if (cliquesConstruir === 10) {
                    btnDev.style.display = "block";
                }
            }

            modoConstrucao = !modoConstrucao;
            modoDesconstruir = false;

            toggleMenuConstrucao(modoConstrucao);

            if (modoConstrucao) {
                btnDesconstruir.style.display = "block"; 
                btnConstruir.style.background = "#4CAF50";
                btnDesconstruir.style.background = "rgba(0, 0, 0, 0.7)";

                if (modoDesenvolvedorAtivo) {
                    criarSistemaCartesianoHTML();
                }
            } else {
                cursorConstrucao.isVisible = false;
                groundInterno.material = matAsfaltoNormal; 
                btnDesconstruir.style.display = "none";
                btnConstruir.style.background = "rgba(0, 0, 0, 0.7)";

                removerSistemaCartesianoHTML();
            }
        });

        btnDesconstruir.addEventListener("click", () => {
            if (modoConstrucao) {
                modoDesconstruir = true;
                btnConstruir.style.background = "rgba(0, 0, 0, 0.7)";
                btnDesconstruir.style.background = "#f44336"; 
                toggleMenuConstrucao(false);
                groundInterno.material = matAsfaltoNormal;
            }
        });
    }

    scene.onPointerObservable.add((pointerInfo) => {
        if (!modoConstrucao) return;

        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERMOVE:
                if (!modoDesconstruir) {
                    if (!modoDesenvolvedorAtivo && !itemSelecionado) {
                        cursorConstrucao.isVisible = false;
                        return;
                    }

                    const pickResult = scene.pick(scene.pointerX, scene.pointerY, (mesh) => mesh === groundInterno);

                    if (pickResult.hit) {
                        cursorConstrucao.isVisible = true;
                        
                        const asfaltoPosX = groundInterno.position.x;
                        const asfaltoPosZ = groundInterno.position.z;

                        const localX = pickResult.pickedPoint.x - asfaltoPosX;
                        const localZ = pickResult.pickedPoint.z - asfaltoPosZ;

                        const snapLocalX = Math.floor(localX / tamanhoGrid) * tamanhoGrid + (tamanhoGrid / 2);
                        const snapLocalZ = Math.floor(localZ / tamanhoGrid) * tamanhoGrid + (tamanhoGrid / 2);

                        const posX = snapLocalX + asfaltoPosX;
                        const posZ = snapLocalZ + asfaltoPosZ;
                        
                        cursorConstrucao.position.x = posX;
                        cursorConstrucao.position.z = posZ;

                        const margemPredio = tamanhoGrid / 2; 
                        const dentroDaAreaX = (snapLocalX - margemPredio) >= -12.5 && (snapLocalX + margemPredio) <= 12.5;
                        const dentroDaAreaZ = (snapLocalZ - margemPredio) >= -10 && (snapLocalZ + margemPredio) <= 10;

                        const ehZonaRestritaA1H2 = snapLocalZ <= -4.0;
                        const ehZonaAdminF4H4 = (Math.abs(snapLocalZ - 1.5) < 0.1 && snapLocalX <= -4.0 && snapLocalX >= -11.0);
                        const ehZonaAdmin = (snapLocalZ >= -2.0 && snapLocalZ <= 2.0 && snapLocalX <= -4.0 && snapLocalX >= -11.0);

                        // Restrição da Bomba d'água (Apenas Coluna A / Beirada do Rio)
                        const ehBeiradaRio = (Math.abs(snapLocalX - 10.5) < 0.1); 
                        const restricaoBombaAgua = (itemSelecionado === "bomba_agua" && !ehBeiradaRio);

                        const jaTemPredio = scene.meshes.some(m => m.name === "predio" && Math.abs(m.position.x - posX) < 0.1 && Math.abs(m.position.z - posZ) < 0.1);

                        if (!modoDesenvolvedorAtivo && (!dentroDaAreaX || !dentroDaAreaZ || ehZonaRestritaA1H2 || ehZonaAdminF4H4 || ehZonaAdmin || jaTemPredio || restricaoBombaAgua)) {
                            cursorConstrucao.material = matCursorInvalido;
                        } else {
                            cursorConstrucao.material = matCursorValido;
                        }
                    } else {
                        cursorConstrucao.isVisible = false;
                    }
                } else {
                    const pickPredio = scene.pick(scene.pointerX, scene.pointerY, (mesh) => mesh.name === "predio");
                    
                    if (pickPredio.hit) {
                        cursorConstrucao.isVisible = true;
                        cursorConstrucao.position.x = pickPredio.pickedMesh.position.x;
                        cursorConstrucao.position.z = pickPredio.pickedMesh.position.z;
                        cursorConstrucao.material = matCursorInvalido; 
                    } else {
                        cursorConstrucao.isVisible = false;
                    }
                }
                break;

            case BABYLON.PointerEventTypes.POINTERDOWN:
                if (pointerInfo.event.button === 0) { 
                    if (!modoDesconstruir && cursorConstrucao.isVisible && cursorConstrucao.material === matCursorValido) {
                        if (!modoDesenvolvedorAtivo && !itemSelecionado) return;

                        const posX = cursorConstrucao.position.x;
                        const posZ = cursorConstrucao.position.z;

                        // ==========================================================
                        // CONSTRUÇÃO DA BOMBA D'ÁGUA
                        // ==========================================================
                        if (itemSelecionado === "bomba_agua") {
                            createBombaAgua(scene, posX, posZ);
                        }

                        console.log(`Estrutura construída: ${itemSelecionado} em X: ${posX}, Z: ${posZ}`);
                    } 
                    else if (modoDesconstruir) {
                        const pickPredio = scene.pick(scene.pointerX, scene.pointerY, (mesh) => mesh.name === "predio");
                        if (pickPredio.hit) {
                            // Remove todo o grupo (TransformNode) pai do objeto clicado
                            const meshAlvo = pickPredio.pickedMesh;
                            const noRaiz = meshAlvo.parent || meshAlvo;

                            if (noRaiz.physicsImpostor) {
                                noRaiz.physicsImpostor.dispose();
                            }
                            noRaiz.dispose();
                            cursorConstrucao.isVisible = false;
                        }
                    }
                }
                break;
        }
    });
}