import { setupCamera } from './camera.js';
import { setupBuildSystem } from './builder.js';
import { createBackground } from './background.js';
import { createDecorations } from './decoracao.js';
import { setupHUD } from './hud.js';

export function createScene(engine, canvas) {
    const scene = new BABYLON.Scene(engine);
    
    scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.92, 1);
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.8;

    const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.position = new BABYLON.Vector3(20, 40, 20);
    dirLight.intensity = 0.9;

    // ==========================================================
    // 1. CENTRO DE CONTROLE DA ETA (Centralizado em G3)
    // ==========================================================
    const centroX = -2.5;
    const centroZ = -1.5;

    const centroAdminHitbox = BABYLON.MeshBuilder.CreateBox("centroAdminHitbox", { width: 5.2, height: 2.8, depth: 4.2 }, scene);
    centroAdminHitbox.position = new BABYLON.Vector3(centroX, 1.4, centroZ); 
    centroAdminHitbox.isVisible = false; 
    centroAdminHitbox.physicsImpostor = new BABYLON.PhysicsImpostor(centroAdminHitbox, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 1 }, scene);

    const pecasPredio = [];
    
    const corpoPredio = BABYLON.MeshBuilder.CreateBox("corpoAdmin", { width: 5, height: 2.5, depth: 4 }, scene);
    corpoPredio.position = new BABYLON.Vector3(centroX, 1.25, centroZ); 
    const matCorpo = new BABYLON.StandardMaterial("matCorpo", scene);
    matCorpo.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.93); 
    corpoPredio.material = matCorpo;
    pecasPredio.push(corpoPredio);

    const telhadoBorda = BABYLON.MeshBuilder.CreateBox("telhado", { width: 5.2, height: 0.2, depth: 4.2 }, scene);
    telhadoBorda.position = new BABYLON.Vector3(centroX, 2.6, centroZ); 
    const matTelhado = new BABYLON.StandardMaterial("matTelhado", scene);
    matTelhado.diffuseColor = new BABYLON.Color3(0.2, 0.25, 0.3); 
    telhadoBorda.material = matTelhado;
    pecasPredio.push(telhadoBorda);

    const portico = BABYLON.MeshBuilder.CreateBox("portico", { width: 2, height: 1.5, depth: 0.2 }, scene);
    portico.position = new BABYLON.Vector3(centroX, 0.75, centroZ - 2.05); 
    const matVidro = new BABYLON.StandardMaterial("matVidro", scene);
    matVidro.diffuseColor = new BABYLON.Color3(0.3, 0.6, 0.9); 
    matVidro.specularColor = new BABYLON.Color3(1, 1, 1);
    portico.material = matVidro;
    pecasPredio.push(portico);

    const criarJanela = (x, z) => {
        const janela = BABYLON.MeshBuilder.CreateBox("janela", { width: 1.2, height: 1.2, depth: 0.1 }, scene);
        janela.position = new BABYLON.Vector3(x, 1.2, z);
        janela.rotation.y = Math.PI / 2;
        janela.material = matVidro;
        pecasPredio.push(janela);
    };

    criarJanela(centroX - 2.55, centroZ + 1);
    criarJanela(centroX - 2.55, centroZ - 1);
    criarJanela(centroX + 2.55, centroZ + 1);
    criarJanela(centroX + 2.55, centroZ - 1);

    const predioVisual = BABYLON.Mesh.MergeMeshes(pecasPredio, true, true, undefined, false, true);
    predioVisual.name = "centroAdministrativoVisual";

    // ==========================================================
    // 2. CÂMERA
    // ==========================================================
    const camera = setupCamera(scene, canvas, centroAdminHitbox);

    // ==========================================================
    // 3. MAPA PRINCIPAL (Ground e Asfalto Base)
    // ==========================================================
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 150, height: 150 }, scene);
    ground.position.y = 0.01; 
    const matGramaNormal = new BABYLON.StandardMaterial("matGramaNormal", scene);
    matGramaNormal.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.2);
    matGramaNormal.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    ground.material = matGramaNormal;
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 1 }, scene);

    const asfalto = BABYLON.MeshBuilder.CreateGround("asfalto", { width: 25, height: 20 }, scene);
    asfalto.position = new BABYLON.Vector3(5, 0.02, 0); 
    const matAsfalto = new BABYLON.StandardMaterial("matAsfalto", scene);
    matAsfalto.diffuseColor = new BABYLON.Color3(0.45, 0.47, 0.5); 
    matAsfalto.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); 
    asfalto.material = matAsfalto;

    // ==========================================================
    // 4. MURO BRANCO DA ETA E PORTÃO
    // ==========================================================
    const matMuro = new BABYLON.StandardMaterial("matMuro", scene);
    matMuro.diffuseColor = new BABYLON.Color3(0.92, 0.92, 0.95); 
    matMuro.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);

    const criarMuro = (cX, cZ, largura, profundidade) => {
        const muro = BABYLON.MeshBuilder.CreateBox("muro", { width: largura, height: 2.2, depth: profundidade }, scene);
        muro.position = new BABYLON.Vector3(cX, 1.1, cZ); 
        muro.material = matMuro;
        muro.physicsImpostor = new BABYLON.PhysicsImpostor(muro, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
    };

    criarMuro(-7.5, 0, 0.25, 20.25); 
    criarMuro(5, 10, 25.25, 0.25);
    criarMuro(-2.25, -10, 10.5, 0.25);
    criarMuro(12.25, -10, 10.5, 0.25);

    const matPortao = new BABYLON.StandardMaterial("matPortao", scene);
    matPortao.diffuseColor = new BABYLON.Color3(0.15, 0.17, 0.2);
    matPortao.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);

    const portaoEsq = BABYLON.MeshBuilder.CreateBox("portaoEsq", { width: 2, height: 2.2, depth: 0.15 }, scene);
    portaoEsq.position = new BABYLON.Vector3(4, 1.1, -10); 
    portaoEsq.material = matPortao;
    portaoEsq.physicsImpostor = new BABYLON.PhysicsImpostor(portaoEsq, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);

    const portaoDir = BABYLON.MeshBuilder.CreateBox("portaoDir", { width: 2, height: 2.2, depth: 0.15 }, scene);
    portaoDir.position = new BABYLON.Vector3(6, 1.1, -10); 
    portaoDir.material = matPortao;
    portaoDir.physicsImpostor = new BABYLON.PhysicsImpostor(portaoDir, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);

    // ==========================================================
    // 5. MÓDULOS EXTERNOS (BACKGROUND E DECORAÇÃO)
    // ==========================================================
    createBackground(scene);
    createDecorations(scene);

    // ==========================================================
    // 6. SISTEMAS DE GAMEPLAY
    // ==========================================================
    setupBuildSystem(scene, asfalto);
    setupHUD();

    return scene;
}