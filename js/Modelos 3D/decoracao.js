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
    // 2. VAGAS DIAGONAIS RENTES AO MURO
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

    // --- CARROS 3D RECUADOS ---
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
    // 3. PRAÇA E FONTE D'ÁGUA EM G3
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
    // 5. SETOR DE TECNOLOGIA E INOVAÇÃO (MÓDULO SEPARADO)
    // ==========================================================
    createSetorTI(scene, -2.5, 6.0);

    // ==========================================================
    // 6. DECORAÇÃO NATURAL (DISTRIBUIÇÃO AMPLA SEM COLISÃO)
    // ==========================================================
    let semente = 421015;
    const rng = () => {
        semente |= 0; semente = (semente + 0x6D2B79F5) | 0;
        let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const entre = (a, b) => a + rng() * (b - a);
    const escolher = (arr) => arr[Math.floor(rng() * arr.length)];
    const hex = (h) => BABYLON.Color3.FromHexString(h);

    const matNat = (nome, corHex, spec = 0.05) => {
        const m = new BABYLON.StandardMaterial(nome, scene);
        m.diffuseColor = hex(corHex);
        m.specularColor = new BABYLON.Color3(spec, spec, spec);
        return m;
    };

    const gruposNat = new Map();
    const addGroupNat = (mesh, material) => {
        mesh.material = material;
        if (!gruposNat.has(material)) gruposNat.set(material, []);
        gruposNat.get(material).push(mesh);
        return mesh;
    };

    const matTroncoNat = matNat("decTroncoNat", "#5c3d24");
    const matFolhaViva1 = matNat("decFolhaViva1", "#22c55e", 0.02);
    const matFolhaViva2 = matNat("decFolhaViva2", "#16a34a", 0.02);
    const matFolhaViva3 = matNat("decFolhaViva3", "#4ade80", 0.02);
    const matsFolhas = [matFolhaViva1, matFolhaViva2, matFolhaViva3];

    const matMatinho = matNat("decMatinho", "#15803d");
    matMatinho.backFaceCulling = false;

    const matFlorAmarela = matNat("decFlorAmarela", "#facc15", 0.1);
    const matFlorVermelha = matNat("decFlorVermelha", "#ef4444", 0.1);
    const matFlorBranca = matNat("decFlorBranca", "#f8fafc", 0.1);
    const matFlorRoxa = matNat("decFlorRoxa", "#a855f7", 0.1);
    const matsFlores = [matFlorAmarela, matFlorVermelha, matFlorBranca, matFlorRoxa];

    const matPedra1 = matNat("decPedra1", "#94a3b8", 0.1);
    const matPedra2 = matNat("decPedra2", "#64748b", 0.1);
    const matsPedras = [matPedra1, matPedra2];

    const posicoesArvores = [];

    const criarArvoreNat = (x, z) => {
        const esc = entre(0.85, 1.35);
        const altTronco = entre(1.8, 2.4) * esc;
        const diaTronco = entre(0.3, 0.45) * esc;

        const tronco = BABYLON.MeshBuilder.CreateCylinder("troncoNat", { diameter: diaTronco, height: altTronco, tessellation: 7 }, scene);
        tronco.position.set(x, altTronco / 2, z);
        addGroupNat(tronco, matTroncoNat);

        const folhaMat = escolher(matsFolhas);
        const tamCopa = entre(2.2, 3.2) * esc;

        const copaCentral = BABYLON.MeshBuilder.CreateSphere("copaNat", { diameter: tamCopa, segments: 7 }, scene);
        copaCentral.position.set(x, altTronco + tamCopa * 0.35, z);
        addGroupNat(copaCentral, folhaMat);

        const topoCopa = BABYLON.MeshBuilder.CreateSphere("copaTopoNat", { diameter: tamCopa * 0.75, segments: 6 }, scene);
        topoCopa.position.set(x + entre(-0.3, 0.3), altTronco + tamCopa * 0.75, z + entre(-0.3, 0.3));
        addGroupNat(topoCopa, folhaMat);

        posicoesArvores.push({ x, z });
    };

    const criarPedraNat = (x, z) => {
        const tamX = entre(0.4, 1.2);
        const tamY = entre(0.2, 0.6);
        const tamZ = entre(0.4, 1.0);

        const pedra = BABYLON.MeshBuilder.CreateBox("pedraNat", { width: tamX, height: tamY, depth: tamZ }, scene);
        pedra.position.set(x, tamY / 2, z);
        pedra.rotation.set(entre(0, 0.3), entre(0, Math.PI * 2), entre(0, 0.3));
        addGroupNat(pedra, escolher(matsPedras));
    };

    const criarTufoMatinho = (x, z) => {
        const esc = entre(0.4, 0.8);
        const numLaminas = 3;

        for (let i = 0; i < numLaminas; i++) {
            const lamina = BABYLON.MeshBuilder.CreatePlane("matinhoNat", { width: 0.6 * esc, height: 0.8 * esc }, scene);
            lamina.position.set(x, (0.8 * esc) / 2, z);
            lamina.rotation.y = (Math.PI / numLaminas) * i + entre(-0.2, 0.2);
            addGroupNat(lamina, matMatinho);
        }
    };

    const criarFlorNat = (x, z) => {
        const esc = entre(0.3, 0.6);
        const matFlor = escolher(matsFlores);

        const haste = BABYLON.MeshBuilder.CreateCylinder("hasteNat", { diameter: 0.05 * esc, height: 0.5 * esc }, scene);
        haste.position.set(x, (0.5 * esc) / 2, z);
        addGroupNat(haste, matMatinho);

        const petala = BABYLON.MeshBuilder.CreateSphere("petalaNat", { diameter: 0.3 * esc, segments: 5 }, scene);
        petala.position.set(x, 0.5 * esc, z);
        addGroupNat(petala, matFlor);
    };

    // VALIDAÇÃO DE POSIÇÃO
    const dentroDaZonaPermitida = (x, z) => {
        if (x >= -8.5 && x <= 18.0 && z >= -11.0 && z <= 11.0) return false;
        if (x >= 3.0 && x <= 17.5 && z >= -11.0 && z <= -2.5) return false;
        if (x >= 3.0 && x <= 7.0 && z < -10.0) return false;
        if (x >= 17.5 && x <= 32.5) return false;
        if (z < -22.0) return false;
        if (x < -60.0 || x > 60.0 || z > 65.0) return false;
        return true;
    };

    const distanciaMinimaArvore = (x, z, distMin = 5.0) => {
        return !posicoesArvores.some(p => Math.hypot(p.x - x, p.z - z) < distMin);
    };

    const gerarVegetacaoExterna = () => {
        let tentativasArvore = 0;
        while (posicoesArvores.length < 80 && tentativasArvore < 400) {
            tentativasArvore++;
            const x = entre(-55, 55);
            const z = entre(-20, 60);

            if (dentroDaZonaPermitida(x, z) && distanciaMinimaArvore(x, z, 5.2)) {
                criarArvoreNat(x, z);
            }
        }

        for (let i = 0; i < 90; i++) {
            const x = entre(-55, 55);
            const z = entre(-20, 60);
            if (dentroDaZonaPermitida(x, z)) criarPedraNat(x, z);
        }

        for (let i = 0; i < 200; i++) {
            const x = entre(-55, 55);
            const z = entre(-20, 60);
            if (dentroDaZonaPermitida(x, z)) criarTufoMatinho(x, z);
        }

        for (let i = 0; i < 150; i++) {
            const x = entre(-55, 55);
            const z = entre(-20, 60);
            if (dentroDaZonaPermitida(x, z)) criarFlorNat(x, z);
        }
    };

    gerarVegetacaoExterna();

    gruposNat.forEach((malhas, material) => {
        if (malhas.length === 0) return;
        const unida = malhas.length === 1 ? malhas[0] : BABYLON.Mesh.MergeMeshes(malhas, true, true);
        if (!unida) return;
        unida.material = material;
        unida.isPickable = false;
        unida.name = "decoracaoNat_" + material.name;
    });
}