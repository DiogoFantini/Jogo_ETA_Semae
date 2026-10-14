import { createRio } from './rio.js';

export function createBackground(scene) {
    // 1. RIO ANIMADO (MÓDULO INDEPENDENTE)
    createRio(scene);

    // 2. RUA DE ACESSO
    const matAsfalto = new BABYLON.StandardMaterial("matAsfaltoBg", scene);
    matAsfalto.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.25);
    matAsfalto.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); 

    const rua = BABYLON.MeshBuilder.CreateGround("rua", { width: 4, height: 65 }, scene);
    rua.position = new BABYLON.Vector3(5, 0.025, -42.5); 
    rua.material = matAsfalto;

    const matAmarelo = new BABYLON.StandardMaterial("matAmarelo", scene);
    matAmarelo.diffuseColor = new BABYLON.Color3(0.95, 0.8, 0.1);

    for (let i = 0; i < 16; i++) {
        const faixa = BABYLON.MeshBuilder.CreateBox("faixa", { width: 0.2, height: 0.01, depth: 2 }, scene);
        faixa.position = new BABYLON.Vector3(5, 0.03, -11 - (i * 4));
        faixa.material = matAmarelo;
    }

    // 3. CALÇADA DA CIDADE (Fundação)
    const calcada = BABYLON.MeshBuilder.CreateGround("calcada", { width: 100, height: 25 }, scene);
    calcada.position = new BABYLON.Vector3(10, 0.015, -65);
    const matCalcada = new BABYLON.StandardMaterial("matCalcada", scene);
    matCalcada.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6); 
    calcada.material = matCalcada;

    // 4. AVENIDA TRANSVERSAL E PONTE
    const ruaTransversal = BABYLON.MeshBuilder.CreateGround("ruaTransversal", { width: 100, height: 6 }, scene);
    ruaTransversal.position = new BABYLON.Vector3(10, 0.025, -65);
    ruaTransversal.material = matAsfalto;

    // Faixas da Avenida Transversal
    for (let i = -10; i < 15; i++) {
        if (i === 1) continue; // Pula o cruzamento
        const faixaT = BABYLON.MeshBuilder.CreateBox("faixaT", { width: 2, height: 0.01, depth: 0.2 }, scene);
        faixaT.position = new BABYLON.Vector3(i * 4, 0.03, -65);
        faixaT.material = matAmarelo;
    }

    // Estrutura da Ponte
    const ponte = BABYLON.MeshBuilder.CreateBox("ponte", { width: 16, height: 0.2, depth: 6 }, scene);
    ponte.position = new BABYLON.Vector3(25, 0.1, -65); 
    ponte.material = matAsfalto;
    ponte.physicsImpostor = new BABYLON.PhysicsImpostor(ponte, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);

    const matMureta = new BABYLON.StandardMaterial("matMureta", scene);
    matMureta.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.82);

    const mureta1 = BABYLON.MeshBuilder.CreateBox("mureta1", { width: 16, height: 0.8, depth: 0.2 }, scene);
    mureta1.position = new BABYLON.Vector3(25, 0.5, -62.1);
    mureta1.material = matMureta;
    mureta1.physicsImpostor = new BABYLON.PhysicsImpostor(mureta1, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);

    const mureta2 = BABYLON.MeshBuilder.CreateBox("mureta2", { width: 16, height: 0.8, depth: 0.2 }, scene);
    mureta2.position = new BABYLON.Vector3(25, 0.5, -67.9);
    mureta2.material = matMureta;
    mureta2.physicsImpostor = new BABYLON.PhysicsImpostor(mureta2, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);

    const pilar1 = BABYLON.MeshBuilder.CreateCylinder("pilar1", { diameter: 1.5, height: 2 }, scene);
    pilar1.position = new BABYLON.Vector3(20, -0.5, -65);
    pilar1.material = matMureta;
    
    const pilar2 = BABYLON.MeshBuilder.CreateCylinder("pilar2", { diameter: 1.5, height: 2 }, scene);
    pilar2.position = new BABYLON.Vector3(30, -0.5, -65);
    pilar2.material = matMureta;

    // 5. CIDADE NO HORIZONTE
    const prediosHorizonte = [];
    
    const matCidade1 = new BABYLON.StandardMaterial("matCidade1", scene);
    matCidade1.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.65);
    const matCidade2 = new BABYLON.StandardMaterial("matCidade2", scene);
    matCidade2.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.45);
    const matCidade3 = new BABYLON.StandardMaterial("matCidade3", scene);
    matCidade3.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.5); 
    matCidade3.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);

    const materiaisCidade = [matCidade1, matCidade2, matCidade3];

    const gerarQuarteirao = (xInicio, xFim, zInicio, zFim) => {
        for (let x = xInicio; x <= xFim; x += 4.5) {
            for (let z = zInicio; z >= zFim; z -= 4.5) {
                if (Math.random() > 0.2) {
                    const altura = Math.random() * 15 + 5; 
                    const largura = Math.random() * 2 + 2; 
                    
                    const predio = BABYLON.MeshBuilder.CreateBox("predioCidade", { width: largura, height: altura, depth: largura }, scene);
                    predio.position = new BABYLON.Vector3(x + (Math.random() - 0.5), (altura / 2) + 0.015, z + (Math.random() - 0.5));
                    
                    const matSorteado = materiaisCidade[Math.floor(Math.random() * materiaisCidade.length)];
                    predio.material = matSorteado;
                    
                    prediosHorizonte.push(predio);
                }
            }
        }
    };

    gerarQuarteirao(-35, 0, -56, -61);   
    gerarQuarteirao(10, 15, -56, -61);   
    gerarQuarteirao(35, 55, -56, -61);   
    gerarQuarteirao(-35, 0, -69, -74);   
    gerarQuarteirao(10, 15, -69, -74);   
    gerarQuarteirao(35, 55, -69, -74);   

    if (prediosHorizonte.length > 0) {
        const malhaCidade = BABYLON.Mesh.MergeMeshes(prediosHorizonte, true, true, undefined, false, true);
        malhaCidade.name = "cidadeNoHorizonte";
    }
}