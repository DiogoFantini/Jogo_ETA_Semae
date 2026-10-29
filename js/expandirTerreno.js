import { formatarDinheiro, gastarDinheiro, exibirPopUpAviso, podePagar } from './condicoes.js';
import { registrarGastoConstrucao } from './relatorio.js';
import { removerNaturezaNaArea } from './Modelos 3D/natureza.js';

// ==========================================================
// CONFIGURAÇÃO DOS QUADRANTES DE EXPANSÃO (DIVISÓRIAS DINÂMICAS)
// ==========================================================
export const QUADRANTES_TERRENO = [
    {
        id: "quadrante_quina_norte_leste",
        nome: "Quina Norte-Leste (Beira Rio Superior)",
        preco: 85000,
        comprado: false,
        xMin: 0, xMax: 12.5,
        zMin: 10, zMax: 22,
        centroX: 6.25, centroZ: 16,
        muroInternoId: "muro_orig_norte_leste",
        vizinhoId: "quadrante_norte_oeste",
        muroDivisoria: {
            id: "muro_divisoria_norte_centro",
            localX: 0, localZ: 16, largura: 0.25, profundidade: 12.25
        },
        murosExternos: [
            { id: "muro_ext_quina_norte", localX: 6.25, localZ: 22, largura: 12.5, profundidade: 0.25 } // Apenas muro Norte (Rio fica aberto)
        ]
    },
    {
        id: "quadrante_norte_oeste",
        nome: "Setor Norte-Oeste (Expansão Superior)",
        preco: 90000,
        comprado: false,
        xMin: -12.5, xMax: 0,
        zMin: 10, zMax: 22,
        centroX: -6.25, centroZ: 16,
        muroInternoId: "muro_orig_norte_oeste",
        vizinhoId: "quadrante_quina_norte_leste",
        muroDivisoria: {
            id: "muro_divisoria_norte_centro",
            localX: 0, localZ: 16, largura: 0.25, profundidade: 12.25
        },
        murosExternos: [
            { id: "muro_ext_norte_oeste_norte", localX: -6.25, localZ: 22, largura: 12.5, profundidade: 0.25 },
            { id: "muro_ext_norte_oeste_oeste", localX: -12.5, localZ: 16, largura: 0.25, profundidade: 12.25 }
        ]
    },
    {
        id: "quadrante_oeste_superior",
        nome: "Setor Oeste-Norte (Pátio Lateral)",
        preco: 100000,
        comprado: false,
        xMin: -25.0, xMax: -12.5,
        zMin: 0, zMax: 10,
        centroX: -18.75, centroZ: 5,
        muroInternoId: "muro_orig_oeste_norte",
        vizinhoId: "quadrante_oeste_inferior",
        muroDivisoria: {
            id: "muro_divisoria_oeste_centro",
            localX: -18.75, localZ: 0, largura: 12.5, profundidade: 0.25
        },
        murosExternos: [
            { id: "muro_ext_oeste_sup_norte", localX: -18.75, localZ: 10, largura: 12.5, profundidade: 0.25 },
            { id: "muro_ext_oeste_sup_oeste", localX: -25.0, localZ: 5, largura: 0.25, profundidade: 10.25 }
        ]
    },
    {
        id: "quadrante_oeste_inferior",
        nome: "Setor Oeste-Sul (Expansão Sede)",
        preco: 110000,
        comprado: false,
        xMin: -25.0, xMax: -12.5,
        zMin: -10, zMax: 0,
        centroX: -18.75, centroZ: -5,
        muroInternoId: "muro_orig_oeste_sul",
        vizinhoId: "quadrante_oeste_superior",
        muroDivisoria: {
            id: "muro_divisoria_oeste_centro",
            localX: -18.75, localZ: 0, largura: 12.5, profundidade: 0.25
        },
        murosExternos: [
            { id: "muro_ext_oeste_inf_sul", localX: -18.75, localZ: -10, largura: 12.5, profundidade: 0.25 },
            { id: "muro_ext_oeste_inf_oeste", localX: -25.0, localZ: -5, largura: 0.25, profundidade: 10.25 }
        ]
    }
];

let sceneRef = null;
let groundRef = null;
let modoExpansaoAtivo = false;
let meshesQuadrantes = [];
let cameraEstadoAnterior = null;
let btnSairExpansao = null;
let pointerObserver = null;

// ==========================================================
// INICIALIZAÇÃO
// ==========================================================
export function setupSistemaExpansao(scene, groundInterno) {
    sceneRef = scene;
    groundRef = groundInterno;
}

export function isPosicaoEmQuadranteComprado(localX, localZ) {
    return QUADRANTES_TERRENO.some(q => 
        q.comprado && 
        localX >= q.xMin && localX <= q.xMax &&
        localZ >= q.zMin && localZ <= q.zMax
    );
}

export function alternarModoExpansaoTerreno() {
    if (!sceneRef || !groundRef) {
        console.warn("[EXPANSÃO] Sistema não inicializado com scene/ground!");
        return;
    }

    modoExpansaoAtivo = !modoExpansaoAtivo;

    if (modoExpansaoAtivo) {
        animarCameraParaVisaoAerea();
        exibirOverlayQuadrantes();
        exibirBotaoSairModoExpansao();
        ativarEscutaCliques3D();
        exibirPopUpAviso("🚜 Visão Geral de Terrenos: Clique nos quadrantes destacados para expandir a ETA!");
    } else {
        desativarEscutaCliques3D();
        restaurarCamera();
        ocultarOverlayQuadrantes();
        ocultarBotaoSairModoExpansao();
    }
}

// ----------------------------------------------------------
// CONTROLE DE CÂMERA AÉREA
// ----------------------------------------------------------
function animarCameraParaVisaoAerea() {
    const camera = sceneRef.activeCamera;
    if (!camera) return;

    if (!cameraEstadoAnterior) {
        cameraEstadoAnterior = {
            alpha: camera.alpha !== undefined ? camera.alpha : 0,
            beta: camera.beta !== undefined ? camera.beta : Math.PI / 3,
            radius: camera.radius !== undefined ? camera.radius : 30,
            target: camera.target ? camera.target.clone() : new BABYLON.Vector3(0, 0, 0)
        };
    }

    const fps = 60;
    const duracao = 45; 

    const centroMapaX = groundRef.position.x - 3.5;
    const centroMapaZ = groundRef.position.z + 4.0;

    const targetAereo = new BABYLON.Vector3(centroMapaX, 0, centroMapaZ);
    const alphaAereo = -Math.PI / 2; 
    const betaAereo = Math.PI / 4.6;  
    const radiusAereo = 85;          

    if (camera.target) {
        BABYLON.Animation.CreateAndStartAnimation("camTarget", camera, "target", fps, duracao, camera.target.clone(), targetAereo, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    }
    if (camera.alpha !== undefined) {
        BABYLON.Animation.CreateAndStartAnimation("camAlpha", camera, "alpha", fps, duracao, camera.alpha, alphaAereo, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    }
    if (camera.beta !== undefined) {
        BABYLON.Animation.CreateAndStartAnimation("camBeta", camera, "beta", fps, duracao, camera.beta, betaAereo, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    }
    if (camera.radius !== undefined) {
        BABYLON.Animation.CreateAndStartAnimation("camRadius", camera, "radius", fps, duracao, camera.radius, radiusAereo, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    }
}

function restaurarCamera() {
    const camera = sceneRef.activeCamera;
    if (!camera || !cameraEstadoAnterior) return;

    const fps = 60;
    const duracao = 45;

    if (camera.target) {
        BABYLON.Animation.CreateAndStartAnimation("camTarget", camera, "target", fps, duracao, camera.target.clone(), cameraEstadoAnterior.target, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    }
    if (camera.alpha !== undefined) {
        BABYLON.Animation.CreateAndStartAnimation("camAlpha", camera, "alpha", fps, duracao, camera.alpha, cameraEstadoAnterior.alpha, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    }
    if (camera.beta !== undefined) {
        BABYLON.Animation.CreateAndStartAnimation("camBeta", camera, "beta", fps, duracao, camera.beta, cameraEstadoAnterior.beta, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    }
    if (camera.radius !== undefined) {
        BABYLON.Animation.CreateAndStartAnimation("camRadius", camera, "radius", fps, duracao, camera.radius, cameraEstadoAnterior.radius, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    }

    cameraEstadoAnterior = null;
}

// ----------------------------------------------------------
// OVERLAY E CLIQUES
// ----------------------------------------------------------
function exibirOverlayQuadrantes() {
    ocultarOverlayQuadrantes();

    const asfaltoPosX = groundRef.position.x;
    const asfaltoPosZ = groundRef.position.z;

    QUADRANTES_TERRENO.forEach(quad => {
        const largura = quad.xMax - quad.xMin;
        const profundidade = quad.zMax - quad.zMin;

        const plano = BABYLON.MeshBuilder.CreatePlane(`quadrante_plane_${quad.id}`, {
            width: largura,
            height: profundidade,
            sideOrientation: BABYLON.Mesh.DOUBLESIDE
        }, sceneRef);

        plano.rotation.x = Math.PI / 2;
        plano.position.set(
            quad.centroX + asfaltoPosX,
            0.12, 
            quad.centroZ + asfaltoPosZ
        );

        const borda = BABYLON.MeshBuilder.CreateLines(`borda_${quad.id}`, {
            points: [
                new BABYLON.Vector3(-largura/2, 0.14, -profundidade/2),
                new BABYLON.Vector3(largura/2, 0.14, -profundidade/2),
                new BABYLON.Vector3(largura/2, 0.14, profundidade/2),
                new BABYLON.Vector3(-largura/2, 0.14, profundidade/2),
                new BABYLON.Vector3(-largura/2, 0.14, -profundidade/2)
            ]
        }, sceneRef);
        borda.position = plano.position.clone();
        borda.isPickable = false;

        const mat = new BABYLON.StandardMaterial(`mat_quad_${quad.id}`, sceneRef);
        mat.disableLighting = true;

        if (quad.comprado) {
            mat.diffuseColor = new BABYLON.Color3(0.1, 0.8, 0.3);
            mat.emissiveColor = new BABYLON.Color3(0.1, 0.8, 0.3);
            mat.alpha = 0.25;
            borda.color = new BABYLON.Color3(0.2, 1.0, 0.4);
        } else {
            mat.diffuseColor = new BABYLON.Color3(0.0, 0.6, 0.9);
            mat.emissiveColor = new BABYLON.Color3(0.0, 0.6, 0.9);
            mat.alpha = 0.38;
            borda.color = new BABYLON.Color3(0.3, 0.8, 1.0);
        }

        plano.material = mat;
        plano.isPickable = true;
        plano.quadranteData = quad;

        plano.actionManager = new BABYLON.ActionManager(sceneRef);
        
        plano.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
                if (!quad.comprado) {
                    mat.alpha = 0.7;
                    mat.emissiveColor = new BABYLON.Color3(0.2, 0.9, 1.0);
                }
            })
        );

        plano.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
                if (!quad.comprado) {
                    mat.alpha = 0.38;
                    mat.emissiveColor = new BABYLON.Color3(0.0, 0.6, 0.9);
                }
            })
        );

        meshesQuadrantes.push(plano);
        meshesQuadrantes.push(borda);
    });
}

function ocultarOverlayQuadrantes() {
    meshesQuadrantes.forEach(mesh => mesh.dispose());
    meshesQuadrantes = [];
}

function ativarEscutaCliques3D() {
    desativarEscutaCliques3D();

    pointerObserver = sceneRef.onPointerObservable.add((pointerInfo) => {
        if (!modoExpansaoAtivo) return;

        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK || pointerInfo.type === BABYLON.PointerEventTypes.POINTERTAP) {
            const pick = pointerInfo.pickInfo;
            if (pick && pick.hit && pick.pickedMesh && pick.pickedMesh.quadranteData) {
                tentarComprarQuadrante(pick.pickedMesh.quadranteData);
            }
        }
    });
}

function desativarEscutaCliques3D() {
    if (pointerObserver && sceneRef) {
        sceneRef.onPointerObservable.remove(pointerObserver);
        pointerObserver = null;
    }
}

function exibirBotaoSairModoExpansao() {
    if (btnSairExpansao) btnSairExpansao.remove();

    btnSairExpansao = document.createElement("button");
    btnSairExpansao.id = "btnSairExpansao";
    btnSairExpansao.innerHTML = "✖️ Voltar à Visão Operacional";
    btnSairExpansao.style.cssText = `
        position: absolute; bottom: 30px; left: 50%;
        transform: translateX(-50%); padding: 12px 24px;
        background-color: #0284c7; color: #ffffff;
        border: 2px solid #38bdf8; border-radius: 30px;
        font-family: Arial, sans-serif; font-weight: bold; font-size: 15px;
        cursor: pointer; box-shadow: 0 8px 16px rgba(0,0,0,0.6); z-index: 1000;
        pointer-events: auto; transition: all 0.2s ease-in-out;
    `;

    btnSairExpansao.addEventListener("click", (e) => {
        e.stopPropagation();
        alternarModoExpansaoTerreno();
    });

    document.body.appendChild(btnSairExpansao);
}

function ocultarBotaoSairModoExpansao() {
    if (btnSairExpansao) {
        btnSairExpansao.remove();
        btnSairExpansao = null;
    }
}

// ----------------------------------------------------------
// GERENCIAMENTO DINÂMICO DE MUROS E CONCRETO
// ----------------------------------------------------------
function removerMuroPelaId(muroId) {
    if (!sceneRef || !muroId) return;
    const muro = sceneRef.getMeshByName(muroId);
    if (muro) {
        if (muro.physicsImpostor) {
            muro.physicsImpostor.dispose();
        }
        muro.dispose();
    }
}

function criarMuroIndividual(muroInfo) {
    if (!sceneRef || !groundRef) return;
    const asfaltoPosX = groundRef.position.x;
    const asfaltoPosZ = groundRef.position.z;

    const matMuro = new BABYLON.StandardMaterial(`matMuro_${muroInfo.id || 'ext'}`, sceneRef);
    matMuro.diffuseColor = BABYLON.Color3.FromHexString("#EBEBF2");
    matMuro.specularColor = BABYLON.Color3.FromHexString("#0D0D0D");

    const muro = BABYLON.MeshBuilder.CreateBox(muroInfo.id || "muro_ext", {
        width: muroInfo.largura,
        height: 2.2,
        depth: muroInfo.profundidade
    }, sceneRef);

    muro.position.set(
        muroInfo.localX + asfaltoPosX,
        1.1,
        muroInfo.localZ + asfaltoPosZ
    );

    muro.material = matMuro;

    if (sceneRef.getPhysicsEngine && sceneRef.getPhysicsEngine()) {
        muro.physicsImpostor = new BABYLON.PhysicsImpostor(
            muro,
            BABYLON.PhysicsImpostor.BoxImpostor,
            { mass: 0 },
            sceneRef
        );
    }
}

function criarPisoConcretoQuadrante(quad) {
    const asfaltoPosX = groundRef.position.x;
    const asfaltoPosZ = groundRef.position.z;
    const largura = quad.xMax - quad.xMin;
    const profundidade = quad.zMax - quad.zMin;

    const piso = BABYLON.MeshBuilder.CreateGround(`piso_expansao_${quad.id}`, {
        width: largura,
        height: profundidade
    }, sceneRef);

    piso.position.set(
        quad.centroX + asfaltoPosX,
        0.02, 
        quad.centroZ + asfaltoPosZ
    );

    const matAsfalto = new BABYLON.StandardMaterial(`mat_piso_exp_${quad.id}`, sceneRef);
    matAsfalto.diffuseColor = BABYLON.Color3.FromHexString("#737880");
    matAsfalto.specularColor = BABYLON.Color3.FromHexString("#1A1A1A");
    piso.material = matAsfalto;

    if (sceneRef.getPhysicsEngine && sceneRef.getPhysicsEngine()) {
        piso.physicsImpostor = new BABYLON.PhysicsImpostor(
            piso, 
            BABYLON.PhysicsImpostor.BoxImpostor, 
            { mass: 0, friction: 1 }, 
            sceneRef
        );
    }

    piso.name = "pisoExpansao";
    piso.isPickable = true;
    return piso;
}

// ----------------------------------------------------------
// LÓGICA DE COMPRA
// ----------------------------------------------------------
function tentarComprarQuadrante(quad) {
    if (quad.comprado) {
        exibirPopUpAviso(`✅ O ${quad.nome} já pertence à sua ETA!`);
        return;
    }

    if (!podePagar(quad.preco)) {
        exibirPopUpAviso(`❌ Saldo insuficiente! O ${quad.nome} custa ${formatarDinheiro(quad.preco)}.`);
        return;
    }

    if (gastarDinheiro(quad.preco)) {
        quad.comprado = true;
        registrarGastoConstrucao(quad.preco);

        // 1. Apaga o muro divisório original da ETA
        if (quad.muroInternoId) {
            removerMuroPelaId(quad.muroInternoId);
        }

        // 2. Constrói os muros perimétricos externos fixos
        if (quad.murosExternos) {
            quad.murosExternos.forEach(m => criarMuroIndividual(m));
        }

        // 3. Controle dinâmico do muro de divisa com o vizinho (marcação vermelha)
        const vizinho = QUADRANTES_TERRENO.find(q => q.id === quad.vizinhoId);
        if (vizinho && vizinho.comprado) {
            // Se o vizinho já foi comprado, remove a parede divisória existente entre eles
            removerMuroPelaId(quad.muroDivisoria.id);
        } else if (quad.muroDivisoria) {
            // Se o vizinho ainda não pertence ao jogador, constrói a divisória
            criarMuroIndividual(quad.muroDivisoria);
        }

        // 4. Cria o piso de concreto
        criarPisoConcretoQuadrante(quad);

        // 5. Apaga toda a vegetação/pedras da área comprada
        const asfaltoPosX = groundRef.position.x;
        const asfaltoPosZ = groundRef.position.z;
        removerNaturezaNaArea(
            quad.xMin + asfaltoPosX, 
            quad.xMax + asfaltoPosX, 
            quad.zMin + asfaltoPosZ, 
            quad.zMax + asfaltoPosZ
        );

        exibirPopUpAviso(`🎉 ${quad.nome} adquirido com sucesso! Muros ajustados e área liberada.`);
        exibirOverlayQuadrantes();
    }
}