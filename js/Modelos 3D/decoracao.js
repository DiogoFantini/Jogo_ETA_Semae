import { createSetorTI } from './setorTI.js';

export function createDecorations(scene) {
    const centroX = -2.5;
    const centroZ = -1.5;

    // ==========================================================
    // 1. PISO DE ASFALTO UNIFICADO DO ESTACIONAMENTO (A1 ATÉ C2)
    // ==========================================================
    const matAsfaltoEstac = new BABYLON.StandardMaterial("matAsfaltoEstac", scene);
    matAsfaltoEstac.diffuseColor = BABYLON.Color3.FromHexString("#2d3238");
    matAsfaltoEstac.specularColor = new BABYLON.Color3(0.08, 0.08, 0.08);

    const pisoEstacionamento = BABYLON.MeshBuilder.CreateGround("pisoEstacionamentoA1C2", { width: 13.5, height: 7.0 }, scene);
    pisoEstacionamento.position = new BABYLON.Vector3(10.25, 0.022, -6.5);
    pisoEstacionamento.material = matAsfaltoEstac;

    // --- GUIAS / MOLDURA DE CONCRETO (LIMITES DO ESTACIONAMENTO) ---
    const matGuiaConcreto = new BABYLON.StandardMaterial("matGuiaConcreto", scene);
    matGuiaConcreto.diffuseColor = new BABYLON.Color3(0.85, 0.85, 0.88);

    const bordaTopo = BABYLON.MeshBuilder.CreateBox("bordaEstacTopo", { width: 13.5, height: 0.04, depth: 0.15 }, scene);
    bordaTopo.position = new BABYLON.Vector3(10.25, 0.023, -3.0);
    bordaTopo.material = matGuiaConcreto;

    const bordaFundo = BABYLON.MeshBuilder.CreateBox("bordaEstacFundo", { width: 13.5, height: 0.04, depth: 0.15 }, scene);
    bordaFundo.position = new BABYLON.Vector3(10.25, 0.023, -10.0);
    bordaFundo.material = matGuiaConcreto;

    const bordaEsq = BABYLON.MeshBuilder.CreateBox("bordaEstacEsq", { width: 0.15, height: 0.04, depth: 7.0 }, scene);
    bordaEsq.position = new BABYLON.Vector3(3.5, 0.023, -6.5);
    bordaEsq.material = matGuiaConcreto;

    const bordaDir = BABYLON.MeshBuilder.CreateBox("bordaEstacDir", { width: 0.15, height: 0.04, depth: 7.0 }, scene);
    bordaDir.position = new BABYLON.Vector3(17.0, 0.023, -6.5);
    bordaDir.material = matGuiaConcreto;

    // ==========================================================
    // 2. VAGAS DIAGONAIS RENTES AO MURO E CARROS 3D
    // ==========================================================
    const matAmarelo = new BABYLON.StandardMaterial("matAmareloSinalizacao", scene);
    matAmarelo.diffuseColor = new BABYLON.Color3(0.95, 0.8, 0.1);

    const criarLinhaVagaRenteMuro = (x, z) => {
        const linha = BABYLON.MeshBuilder.CreateBox("linhaVagaRenteMuro", { width: 0.12, height: 0.01, depth: 3.0 }, scene);
        linha.position = new BABYLON.Vector3(x, 0.026, z);
        linha.rotation.y = (-35 * Math.PI) / 180;
        linha.material = matAmarelo;
    };

    criarLinhaVagaRenteMuro(9.2, -8.5);
    criarLinhaVagaRenteMuro(11.4, -8.5);
    criarLinhaVagaRenteMuro(13.6, -8.5);
    criarLinhaVagaRenteMuro(15.8, -8.5);

    const criarCarro3D = (x, z, anguloGrad, corHex) => {
        const matCarro = new BABYLON.StandardMaterial("matCarro", scene);
        matCarro.diffuseColor = BABYLON.Color3.FromHexString(corHex);
        matCarro.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);

        const matVidroCarro = new BABYLON.StandardMaterial("matVidroCarro", scene);
        matVidroCarro.diffuseColor = new BABYLON.Color3(0.1, 0.15, 0.2);

        const matPneu = new BABYLON.StandardMaterial("matPneu", scene);
        matPneu.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        const grupoCarro = new BABYLON.TransformNode("carro3D", scene);

        const chassi = BABYLON.MeshBuilder.CreateBox("chassi", { width: 1.1, height: 0.45, depth: 2.0 }, scene);
        chassi.position.y = 0.32;
        chassi.material = matCarro;
        chassi.parent = grupoCarro;

        const cabine = BABYLON.MeshBuilder.CreateBox("cabine", { width: 0.9, height: 0.4, depth: 1.1 }, scene);
        cabine.position = new BABYLON.Vector3(0, 0.68, -0.1);
        cabine.material = matVidroCarro;
        cabine.parent = grupoCarro;

        const posPneus = [
            [-0.55, 0.18, 0.6], [0.55, 0.18, 0.6],
            [-0.55, 0.18, -0.6], [0.55, 0.18, -0.6]
        ];
        posPneus.forEach(([px, py, pz]) => {
            const pneu = BABYLON.MeshBuilder.CreateCylinder("pneu", { diameter: 0.35, height: 0.14 }, scene);
            pneu.position = new BABYLON.Vector3(px, py, pz);
            pneu.rotation.z = Math.PI / 2;
            pneu.material = matPneu;
            pneu.parent = grupoCarro;
        });

        grupoCarro.position = new BABYLON.Vector3(x, 0, z);
        grupoCarro.rotation.y = (anguloGrad * Math.PI) / 180;
    };

    criarCarro3D(10.3, -8.5, -35, "#b91c1c");
    criarCarro3D(12.5, -8.5, -35, "#f59e0b");

    // ==========================================================
    // 3. PRAÇA E FONTE D'ÁGUA EM FRENTE À SEDE
    // ==========================================================
    const matGramaNormal = new BABYLON.StandardMaterial("matGramaPraca", scene);
    matGramaNormal.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.2);
    matGramaNormal.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);

    const pracinha = BABYLON.MeshBuilder.CreateGround("pracinha", { width: 6, height: 4 }, scene);
    pracinha.position = new BABYLON.Vector3(centroX, 0.025, centroZ - 4.5);
    pracinha.material = matGramaNormal;

    const matPedraFonte = new BABYLON.StandardMaterial("matPedraFonte", scene);
    matPedraFonte.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.85);

    const matAgua = new BABYLON.StandardMaterial("matAgua", scene);
    matAgua.diffuseColor = new BABYLON.Color3(0.2, 0.7, 0.9);
    matAgua.alpha = 0.8;

    const fontePosX = centroX;
    const fontePosZ = centroZ - 4.5;

    const baseFonte = BABYLON.MeshBuilder.CreateCylinder("baseFonte", { diameter: 2.6, height: 0.3 }, scene);
    baseFonte.position = new BABYLON.Vector3(fontePosX, 0.175, fontePosZ);
    baseFonte.material = matPedraFonte;

    const aguaFonte = BABYLON.MeshBuilder.CreateCylinder("aguaFonte", { diameter: 2.3, height: 0.35 }, scene);
    aguaFonte.position = new BABYLON.Vector3(fontePosX, 0.175, fontePosZ);
    aguaFonte.material = matAgua;

    const pilarFonte = BABYLON.MeshBuilder.CreateCylinder("pilarFonte", { diameter: 0.5, height: 1.2 }, scene);
    pilarFonte.position = new BABYLON.Vector3(fontePosX, 0.7, fontePosZ);
    pilarFonte.material = matPedraFonte;

    const topoFonte = BABYLON.MeshBuilder.CreateCylinder("topoFonte", { diameter: 1.2, height: 0.15 }, scene);
    topoFonte.position = new BABYLON.Vector3(fontePosX, 1.3, fontePosZ);
    topoFonte.material = matPedraFonte;

    // ==========================================================
    // 4. PLACA IDENTIFICADORA DA ETA
    // ==========================================================
    const matPostePlaca = new BABYLON.StandardMaterial("matPostePlaca", scene);
    matPostePlaca.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.25);

    const poste1 = BABYLON.MeshBuilder.CreateCylinder("postePlaca1", { diameter: 0.08, height: 1.6 }, scene);
    poste1.position = new BABYLON.Vector3(1.7, 0.8, -10.4);
    poste1.material = matPostePlaca;

    const poste2 = BABYLON.MeshBuilder.CreateCylinder("postePlaca2", { diameter: 0.08, height: 1.6 }, scene);
    poste2.position = new BABYLON.Vector3(2.7, 0.8, -10.4);
    poste2.material = matPostePlaca;

    const estruturaPlaca = BABYLON.MeshBuilder.CreateBox("molduraPlaca", { width: 1.5, height: 0.8, depth: 0.08 }, scene);
    estruturaPlaca.position = new BABYLON.Vector3(2.2, 1.4, -10.4);
    estruturaPlaca.material = matPostePlaca;

    const placaTexture = new BABYLON.DynamicTexture("placaTex", { width: 512, height: 256 }, scene, true);
    
    const matPlacaFace = new BABYLON.StandardMaterial("matPlacaFace", scene);
    matPlacaFace.diffuseTexture = placaTexture;
    matPlacaFace.emissiveColor = new BABYLON.Color3(0.9, 0.9, 0.9); 
    matPlacaFace.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    const facePlaca = BABYLON.MeshBuilder.CreatePlane("facePlaca", { width: 1.46, height: 0.76 }, scene);
    facePlaca.position = new BABYLON.Vector3(2.2, 1.4, -10.45); 
    facePlaca.material = matPlacaFace;

    const desenharPlaca = (nome) => {
        const ctx = placaTexture.getContext();
        ctx.fillStyle = "#0f172a"; 
        ctx.fillRect(0, 0, 512, 256);
        
        ctx.strokeStyle = "#38bdf8"; 
        ctx.lineWidth = 12;
        ctx.strokeRect(8, 8, 496, 240);
        
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 26px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("ESTAÇÃO DE TRATAMENTO DE ÁGUA", 256, 55);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 44px Arial";
        ctx.fillText(nome, 256, 145);
        
        placaTexture.update();
    };

    desenharPlaca("ETA Central");
    window.atualizarPlacaETA = desenharPlaca;

    // ==========================================================
    // 5. SETOR DE TECNOLOGIA E INOVAÇÃO
    // ==========================================================
    createSetorTI(scene, -2.5, 6.0);
}