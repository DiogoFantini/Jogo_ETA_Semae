import { toggleMenuConstrucao, itemSelecionado, setOnItemSelectCallback } from './hud.js';
import { createBombaAgua } from './Modelos 3D/bomba-agua.js';
import { createCaixaAgua } from './Modelos 3D/caixa-agua.js';
import { 
    isDevModeActive, 
    registrarCliqueConstruir, 
    setupDevButton, 
    criarSistemaCartesianoHTML, 
    removerSistemaCartesianoHTML 
} from './dev.js';
import { 
    podeConstruir, 
    adicionarConstrucao, 
    removerConstrucao, 
    exibirPopUpLimite,
    exibirPopUpSemDinheiro,
    podePagar,
    gastarDinheiro,
    reembolsarDinheiro,
    CUSTOS_ESTRUTURAS
} from './condicoes.js';
import { adicionarEstruturaAgua, removerEstruturaAgua } from './sistema-agua.js';
import { adicionarConsumoEstrutura, removerConsumoEstrutura } from './sistema-energia.js';
import { registrarGastoConstrucao } from './relatorio.js';
import { isPosicaoEmQuadranteComprado } from './expandirTerreno.js';

// Função auxiliar isolada para validar as regras de posicionamento da construção
function validarPosicaoConstrucao(snapLocalX, snapLocalZ, margemPredio, itemSelecionado, scene, groundInterno) {
    const asfaltoPosX = groundInterno.position.x;
    const asfaltoPosZ = groundInterno.position.z;

    const dentroDaAreaBaseX = (snapLocalX - margemPredio) >= -12.5 && (snapLocalX + margemPredio) <= 12.5;
    const dentroDaAreaBaseZ = (snapLocalZ - margemPredio) >= -10 && (snapLocalZ + margemPredio) <= 10;

    const emQuadranteComprado = typeof isPosicaoEmQuadranteComprado === 'function' && isPosicaoEmQuadranteComprado(snapLocalX, snapLocalZ);
    const dentroDaAreaPermitida = (dentroDaAreaBaseX && dentroDaAreaBaseZ) || emQuadranteComprado;

    const ehZonaRestritaA1H2 = snapLocalZ <= -4.0;
    const ehZonaAdminF4H4 = (Math.abs(snapLocalZ - 1.5) < 0.1 && snapLocalX <= -4.0 && snapLocalX >= -11.0);
    const ehZonaAdmin = (snapLocalZ >= -2.0 && snapLocalZ <= 2.0 && snapLocalX <= -4.0 && snapLocalX >= -11.0);
    const ehZonaObrasParalela = (snapLocalX >= -6.0 && snapLocalX <= 1.0 && snapLocalZ >= 3.0 && snapLocalZ <= 9.0);

    const ehBeiradaRio = (Math.abs(snapLocalX - 10.5) < 0.1); 
    const restricaoBombaAgua = (itemSelecionado === "bomba_agua" && !ehBeiradaRio);

    const posX = snapLocalX + asfaltoPosX;
    const posZ = snapLocalZ + asfaltoPosZ;

    // Busca em meshes e TransformNodes para evitar sobreposição
    const todosOsNos = scene.meshes.concat(scene.transformNodes || []);
    const jaTemPredio = todosOsNos.some(m => {
        if (m.name !== "predio") return false;
        const posMundo = m.getAbsolutePosition ? m.getAbsolutePosition() : m.position;
        return Math.abs(posMundo.x - posX) < 1.0 && Math.abs(posMundo.z - posZ) < 1.0;
    });

    if (!dentroDaAreaPermitida || ehZonaRestritaA1H2 || ehZonaAdminF4H4 || ehZonaAdmin || ehZonaObrasParalela || jaTemPredio || restricaoBombaAgua) {
        return false;
    }
    return true;
}

export function setupBuildSystem(scene, groundInterno) {
    let modoConstrucao = false;
    let modoDesconstruir = false; 
    const tamanhoGrid = 3; 

    const matAsfaltoNormal = groundInterno.material;

    setupDevButton(scene, groundInterno, tamanhoGrid, () => modoConstrucao);

    const matGridConstrucao = new BABYLON.GridMaterial("matGridConstrucao", scene);
    matGridConstrucao.mainColor = new BABYLON.Color3(0.1, 0.18, 0.28); 
    matGridConstrucao.lineColor = new BABYLON.Color3(0.2, 0.75, 1.0);  
    matGridConstrucao.gridRatio = tamanhoGrid;                                  
    matGridConstrucao.opacity = 0.98; 

    const cursorConstrucao = BABYLON.MeshBuilder.CreateBox("cursor", { width: tamanhoGrid, height: 0.06, depth: tamanhoGrid }, scene);
    cursorConstrucao.position.y = 0.06; 
    cursorConstrucao.isVisible = false; 
    cursorConstrucao.isPickable = false;
    cursorConstrucao.renderingGroupId = 1;

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

    setOnItemSelectCallback((item) => {
        if (item) {
            groundInterno.material = matGridConstrucao;
        } else {
            groundInterno.material = matAsfaltoNormal;
            cursorConstrucao.isVisible = false;
        }
    });

    if (btnConstruir && btnDesconstruir) {
        btnConstruir.addEventListener("click", () => {
            registrarCliqueConstruir();

            modoConstrucao = !modoConstrucao;
            modoDesconstruir = false;

            toggleMenuConstrucao(modoConstrucao);

            if (modoConstrucao) {
                btnDesconstruir.style.display = "block"; 
                btnConstruir.style.background = "#4CAF50";
                btnDesconstruir.style.background = "rgba(0, 0, 0, 0.7)";

                if (isDevModeActive()) {
                    criarSistemaCartesianoHTML(scene, groundInterno, tamanhoGrid);
                }
            } else {
                cursorConstrucao.isVisible = false;
                groundInterno.material = matAsfaltoNormal; 
                btnDesconstruir.style.display = "none";
                btnConstruir.style.background = "rgba(0, 0, 0, 0.7)";

                removerSistemaCartesianoHTML(scene);
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
                    if (!isDevModeActive() && !itemSelecionado) {
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
                        const posicaoValida = validarPosicaoConstrucao(snapLocalX, snapLocalZ, margemPredio, itemSelecionado, scene, groundInterno);

                        const limiteAtingido = !podeConstruir();
                        const custoAtual = CUSTOS_ESTRUTURAS[itemSelecionado] || 0;
                        const semDinheiro = !podePagar(custoAtual);

                        if (!isDevModeActive() && (!posicaoValida || limiteAtingido || semDinheiro)) {
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
                        let noRaiz = pickPredio.pickedMesh;
                        while (noRaiz.parent) {
                            noRaiz = noRaiz.parent;
                        }

                        const posMundo = noRaiz.getAbsolutePosition();

                        cursorConstrucao.isVisible = true;
                        cursorConstrucao.position.x = posMundo.x;
                        cursorConstrucao.position.z = posMundo.z;
                        cursorConstrucao.material = matCursorInvalido; 
                    } else {
                        cursorConstrucao.isVisible = false;
                    }
                }
                break;

            case BABYLON.PointerEventTypes.POINTERDOWN:
                if (pointerInfo.event.button === 0) { 
                    if (!modoDesconstruir && cursorConstrucao.isVisible) {
                        const asfaltoPosX = groundInterno.position.x;
                        const asfaltoPosZ = groundInterno.position.z;
                        const localX = cursorConstrucao.position.x - asfaltoPosX;
                        const localZ = cursorConstrucao.position.z - asfaltoPosZ;
                        const margemPredio = tamanhoGrid / 2;

                        const posicaoAindaValida = validarPosicaoConstrucao(localX, localZ, margemPredio, itemSelecionado, scene, groundInterno);

                        if (!isDevModeActive()) {
                            if (!itemSelecionado || !posicaoAindaValida) {
                                cursorConstrucao.material = matCursorInvalido;
                                return;
                            }
                            
                            if (!podeConstruir()) {
                                exibirPopUpLimite();
                                return;
                            }

                            const custo = CUSTOS_ESTRUTURAS[itemSelecionado] || 0;
                            if (!podePagar(custo)) {
                                exibirPopUpSemDinheiro();
                                return;
                            }
                        }

                        if (posicaoAindaValida) {
                            const posX = cursorConstrucao.position.x;
                            const posZ = cursorConstrucao.position.z;
                            const custo = CUSTOS_ESTRUTURAS[itemSelecionado] || 0;

                            let novaEstrutura = null;

                            if (itemSelecionado === "bomba_agua") {
                                novaEstrutura = createBombaAgua(scene, posX, posZ);
                            } else if (itemSelecionado === "caixa_agua") {
                                novaEstrutura = createCaixaAgua(scene, posX, posZ);
                            }

                            if (novaEstrutura) {
                                novaEstrutura.name = "predio"; 
                                novaEstrutura.tipoItem = itemSelecionado;
                            }

                            if (!isDevModeActive()) {
                                gastarDinheiro(custo);
                                registrarGastoConstrucao(custo);
                                adicionarConstrucao();
                            }

                            adicionarEstruturaAgua(itemSelecionado);
                            adicionarConsumoEstrutura(itemSelecionado);

                            cursorConstrucao.material = matCursorInvalido;

                            console.log(`[CONSTRUÇÃO] Estrutura registrada: ${itemSelecionado} em X: ${posX}, Z: ${posZ}`);
                        }
                    } 
                    else if (modoDesconstruir) {
                        const pickPredio = scene.pick(scene.pointerX, scene.pointerY, (mesh) => mesh.name === "predio");
                        if (pickPredio.hit) {
                            let noRaiz = pickPredio.pickedMesh;
                            while (noRaiz.parent) {
                                noRaiz = noRaiz.parent;
                            }

                            const tipoItem = noRaiz.tipoItem;

                            if (noRaiz.physicsImpostor) {
                                noRaiz.physicsImpostor.dispose();
                            }
                            noRaiz.dispose();
                            
                            removerConstrucao();
                            if (tipoItem) {
                                reembolsarDinheiro(tipoItem);
                                removerEstruturaAgua(tipoItem);
                                removerConsumoEstrutura(tipoItem);
                            }

                            cursorConstrucao.isVisible = false;
                        }
                    }
                }
                break;
        }
    });
}