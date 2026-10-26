import { setupCamera } from './camera.js';
import { setupBuildSystem } from './builder.js';
import { createBackground } from './Modelos 3D/background.js';
import { setupHUD } from './hud.js';
import { setupIluminacao } from './iluminacao.js';
import { iniciarSistemaAgua } from './sistema-agua.js';
import { setupPainelContratos } from './contratos.js';
import { setupSistemaJornal } from './jornal.js';
import { setupSistemaClima } from './clima.js';
import { setupSistemaRelatorio } from './relatorio.js';
import { createDecorations } from './Modelos 3D/decoracao.js';

// ==========================================================
// 1. CONSTRUÇÃO DO CENTRO ADMINISTRATIVO (SEDA / ETA)
// ==========================================================
function criarCentroAdministrativo(scene, centroX, centroZ) {
    const centroAdminHitbox = BABYLON.MeshBuilder.CreateBox("centroAdminHitbox", { width: 5.2, height: 2.8, depth: 4.2 }, scene);
    centroAdminHitbox.position = new BABYLON.Vector3(centroX, 1.4, centroZ); 
    centroAdminHitbox.isVisible = false; 
    centroAdminHitbox.physicsImpostor = new BABYLON.PhysicsImpostor(centroAdminHitbox, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 1 }, scene);

    const pecasPredio = [];
    
    // Corpo do Prédio
    const corpoPredio = BABYLON.MeshBuilder.CreateBox("corpoAdmin", { width: 5, height: 2.5, depth: 4 }, scene);
    corpoPredio.position = new BABYLON.Vector3(centroX, 1.25, centroZ); 
    const matCorpo = new BABYLON.StandardMaterial("matCorpo", scene);
    matCorpo.diffuseColor = BABYLON.Color3.FromHexString("#E6E6ED"); 
    corpoPredio.material = matCorpo;
    pecasPredio.push(corpoPredio);

    // Telhado
    const telhadoBorda = BABYLON.MeshBuilder.CreateBox("telhado", { width: 5.2, height: 0.2, depth: 4.2 }, scene);
    telhadoBorda.position = new BABYLON.Vector3(centroX, 2.6, centroZ); 
    const matTelhado = new BABYLON.StandardMaterial("matTelhado", scene);
    matTelhado.diffuseColor = BABYLON.Color3.FromHexString("#33404C"); 
    telhadoBorda.material = matTelhado;
    pecasPredio.push(telhadoBorda);

    // Pórtico de Vidro
    const portico = BABYLON.MeshBuilder.CreateBox("portico", { width: 2, height: 1.5, depth: 0.2 }, scene);
    portico.position = new BABYLON.Vector3(centroX, 0.75, centroZ - 2.05); 
    const matVidro = new BABYLON.StandardMaterial("matVidro", scene);
    matVidro.diffuseColor = BABYLON.Color3.FromHexString("#4C99E6"); 
    matVidro.specularColor = BABYLON.Color3.FromHexString("#FFFFFF");
    portico.material = matVidro;
    pecasPredio.push(portico);

    // Janelas Laterais
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

    return { predioVisual, centroAdminHitbox };
}

// ==========================================================
// 2. TERRENO PRINCIPAL E PÁTIO DE ASFALTO
// ==========================================================
function criarTerrenoEAsfalto(scene) {
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    ground.position.y = 0.01; 
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 1 }, scene);

    const asfalto = BABYLON.MeshBuilder.CreateGround("asfalto", { width: 25, height: 20 }, scene);
    asfalto.position = new BABYLON.Vector3(5, 0.02, 0); 
    const matAsfalto = new BABYLON.StandardMaterial("matAsfalto", scene);
    matAsfalto.diffuseColor = BABYLON.Color3.FromHexString("#737880"); 
    matAsfalto.specularColor = BABYLON.Color3.FromHexString("#1A1A1A"); 
    asfalto.material = matAsfalto;

    return { ground, asfalto };
}

// ==========================================================
// 3. ESTRUTURA PERIMETRAL (MUROS E PORTÃO)
// ==========================================================
function criarMurosEPortao(scene) {
    const matMuro = new BABYLON.StandardMaterial("matMuro", scene);
    matMuro.diffuseColor = BABYLON.Color3.FromHexString("#EBEBF2"); 
    matMuro.specularColor = BABYLON.Color3.FromHexString("#0D0D0D");

    const criarMuro = (cX, cZ, largura, profundidade) => {
        const muro = BABYLON.MeshBuilder.CreateBox("muro", { width: largura, height: 2.2, depth: profundidade }, scene);
        muro.position = new BABYLON.Vector3(cX, 1.1, cZ); 
        muro.material = matMuro;
        muro.physicsImpostor = new BABYLON.PhysicsImpostor(muro, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
    };

    // Muros do Perímetro
    criarMuro(-7.5, 0, 0.25, 20.25); 
    criarMuro(5, 10, 25.25, 0.25);
    criarMuro(-2.25, -10, 10.5, 0.25);
    criarMuro(12.25, -10, 10.5, 0.25);

    // Portão Principal
    const matPortao = new BABYLON.StandardMaterial("matPortao", scene);
    matPortao.diffuseColor = BABYLON.Color3.FromHexString("#262B33");
    matPortao.specularColor = BABYLON.Color3.FromHexString("#808080");

    const portaoEsq = BABYLON.MeshBuilder.CreateBox("portaoEsq", { width: 2, height: 2.2, depth: 0.15 }, scene);
    portaoEsq.position = new BABYLON.Vector3(4, 1.1, -10); 
    portaoEsq.material = matPortao;
    portaoEsq.physicsImpostor = new BABYLON.PhysicsImpostor(portaoEsq, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);

    const portaoDir = BABYLON.MeshBuilder.CreateBox("portaoDir", { width: 2, height: 2.2, depth: 0.15 }, scene);
    portaoDir.position = new BABYLON.Vector3(6, 1.1, -10); 
    portaoDir.material = matPortao;
    portaoDir.physicsImpostor = new BABYLON.PhysicsImpostor(portaoDir, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
}

// ==========================================================
// 4. ORQUESTRADOR DA CENA PRINCIPAL
// ==========================================================
export function createScene(engine, canvas) {
    const scene = new BABYLON.Scene(engine);
    
    // Motor de Física (Cannon.js)
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());

    // 1. Iluminação Dinâmica
    setupIluminacao(scene);

    // 2. Prédio Administrativo
    const { predioVisual, centroAdminHitbox } = criarCentroAdministrativo(scene, -2.5, -1.5);

    // 3. Câmera
    const camera = setupCamera(scene, canvas);

    // 4. Terreno e Asfalto
    const { ground, asfalto } = criarTerrenoEAsfalto(scene);

    // 5. Muros e Portão
    criarMurosEPortao(scene);

    // 6. Sistemas de Gameplay e Interface
    setupBuildSystem(scene, asfalto);
    setupHUD(scene);
    iniciarSistemaAgua(scene);
    setupPainelContratos(scene, predioVisual, centroAdminHitbox);
    setupSistemaJornal(scene);
    setupSistemaClima(scene);
    setupSistemaRelatorio(scene);
    createBackground(scene, ground);
    createDecorations(scene);

    return scene;
}