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
import { setupSistemaExpansao } from './expandirTerreno.js';

function criarCentroAdministrativo(scene, centroX, centroZ) {
    const centroAdminHitbox = BABYLON.MeshBuilder.CreateBox("centroAdminHitbox", { width: 5.2, height: 2.8, depth: 4.2 }, scene);
    centroAdminHitbox.position = new BABYLON.Vector3(centroX, 1.4, centroZ); 
    centroAdminHitbox.isVisible = false; 
    centroAdminHitbox.physicsImpostor = new BABYLON.PhysicsImpostor(centroAdminHitbox, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 1 }, scene);

    const pecasPredio = [];
    
    const corpoPredio = BABYLON.MeshBuilder.CreateBox("corpoAdmin", { width: 5, height: 2.5, depth: 4 }, scene);
    corpoPredio.position = new BABYLON.Vector3(centroX, 1.25, centroZ); 
    const matCorpo = new BABYLON.StandardMaterial("matCorpo", scene);
    matCorpo.diffuseColor = BABYLON.Color3.FromHexString("#E6E6ED"); 
    corpoPredio.material = matCorpo;
    pecasPredio.push(corpoPredio);

    const telhadoBorda = BABYLON.MeshBuilder.CreateBox("telhado", { width: 5.2, height: 0.2, depth: 4.2 }, scene);
    telhadoBorda.position = new BABYLON.Vector3(centroX, 2.6, centroZ); 
    const matTelhado = new BABYLON.StandardMaterial("matTelhado", scene);
    matTelhado.diffuseColor = BABYLON.Color3.FromHexString("#33404C"); 
    telhadoBorda.material = matTelhado;
    pecasPredio.push(telhadoBorda);

    const portico = BABYLON.MeshBuilder.CreateBox("portico", { width: 2, height: 1.5, depth: 0.2 }, scene);
    portico.position = new BABYLON.Vector3(centroX, 0.75, centroZ - 2.05); 
    const matVidro = new BABYLON.StandardMaterial("matVidro", scene);
    matVidro.diffuseColor = BABYLON.Color3.FromHexString("#4C99E6"); 
    matVidro.specularColor = BABYLON.Color3.FromHexString("#FFFFFF");
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

    return { predioVisual, centroAdminHitbox };
}

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

function criarMurosEPortao(scene) {
    const matMuro = new BABYLON.StandardMaterial("matMuro", scene);
    matMuro.diffuseColor = BABYLON.Color3.FromHexString("#EBEBF2"); 
    matMuro.specularColor = BABYLON.Color3.FromHexString("#0D0D0D");

    const criarMuro = (nome, cX, cZ, largura, profundidade) => {
        const muro = BABYLON.MeshBuilder.CreateBox(nome, { width: largura, height: 2.2, depth: profundidade }, scene);
        muro.position = new BABYLON.Vector3(cX, 1.1, cZ); 
        muro.material = matMuro;
        muro.physicsImpostor = new BABYLON.PhysicsImpostor(muro, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
        return muro;
    };

    // Muros Perimétricos Originais Segmentados (Identificáveis para Remoção)
    criarMuro("muro_orig_norte_leste", 11.25, 10, 12.5, 0.25);
    criarMuro("muro_orig_norte_oeste", -1.25, 10, 12.5, 0.25);
    criarMuro("muro_orig_oeste_norte", -7.5, 5, 0.25, 10.25);
    criarMuro("muro_orig_oeste_sul", -7.5, -5, 0.25, 10.25);

    // Muros do Perímetro Sul
    criarMuro("muro_orig_sul_esq", -2.25, -10, 10.5, 0.25);
    criarMuro("muro_orig_sul_dir", 12.25, -10, 10.5, 0.25);

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

export function createScene(engine, canvas) {
    const scene = new BABYLON.Scene(engine);
    
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());

    setupIluminacao(scene);

    const { predioVisual, centroAdminHitbox } = criarCentroAdministrativo(scene, -2.5, -1.5);

    const camera = setupCamera(scene, canvas);

    const { ground, asfalto } = criarTerrenoEAsfalto(scene);

    criarMurosEPortao(scene);

    setupBuildSystem(scene, asfalto);
    setupHUD(scene);
    iniciarSistemaAgua(scene);
    setupPainelContratos(scene, predioVisual, centroAdminHitbox);
    setupSistemaJornal(scene);
    setupSistemaClima(scene);
    setupSistemaRelatorio(scene);
    createBackground(scene, ground);
    createDecorations(scene);

    setupSistemaExpansao(scene, asfalto);

    return scene;
}