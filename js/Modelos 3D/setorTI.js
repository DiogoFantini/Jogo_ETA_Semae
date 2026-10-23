import { registerGameAnimation } from '../tempo.js';
import { isInvestimentoComprado } from '../investimentos.js';
import { abrirModalSetorTI } from '../hud.js';

export function createSetorTI(scene, posXArea = -2.5, posZArea = 6.0) {
    const grupoObra = new BABYLON.TransformNode("grupoCanteiroObrasTI", scene);
    const grupoPredioTec = new BABYLON.TransformNode("grupoPredioTecnologia", scene);

    // ==========================================================
    // A) ESTÁGIO DE OBRAS (ANTES DA COMPRA)
    // ==========================================================
    const matTerraObras = new BABYLON.StandardMaterial("matTerraObrasTI", scene);
    matTerraObras.diffuseColor = BABYLON.Color3.FromHexString("#78350f");

    const matTapume = new BABYLON.StandardMaterial("matTapumeObraTI", scene);
    matTapume.diffuseColor = BABYLON.Color3.FromHexString("#ea580c");

    const matPosteCerca = new BABYLON.StandardMaterial("matPosteCercaTI", scene);
    matPosteCerca.diffuseColor = BABYLON.Color3.FromHexString("#475569");

    const matCimento = new BABYLON.StandardMaterial("matCimentoObraTI", scene);
    matCimento.diffuseColor = BABYLON.Color3.FromHexString("#94a3b8");

    const matTijoloObra = new BABYLON.StandardMaterial("matTijoloObraTI", scene);
    matTijoloObra.diffuseColor = BABYLON.Color3.FromHexString("#b91c1c");

    // Terra do canteiro
    const terrenoObras = BABYLON.MeshBuilder.CreateGround("terrenoObrasTI", { width: 4.0, height: 6.0 }, scene);
    terrenoObras.position = new BABYLON.Vector3(posXArea, 0.026, posZArea);
    terrenoObras.material = matTerraObras;
    terrenoObras.parent = grupoObra;

    const criarPainelCerca = (x, z, largura, profundidade, rotY = 0) => {
        const poste = BABYLON.MeshBuilder.CreateCylinder("mouraoCercaTI", { diameter: 0.12, height: 1.4 }, scene);
        poste.position = new BABYLON.Vector3(x, 0.7, z);
        poste.material = matPosteCerca;
        poste.parent = grupoObra;

        const painel = BABYLON.MeshBuilder.CreateBox("painelTapumeTI", { width: largura, height: 0.9, depth: profundidade }, scene);
        painel.position = new BABYLON.Vector3(x, 0.7, z);
        painel.rotation.y = rotY;
        painel.material = matTapume;
        painel.parent = grupoObra;
    };

    // Cercas periféricas
    for (let px = -3.5; px <= -1.5; px += 2.0) criarPainelCerca(px, 3.0, 1.8, 0.08);
    for (let px = -3.5; px <= -1.5; px += 2.0) criarPainelCerca(px, 9.0, 1.8, 0.08);
    for (let pz = 4.0; pz <= 8.0; pz += 2.0) criarPainelCerca(-4.5, pz, 0.08, 1.8);
    for (let pz = 4.0; pz <= 8.0; pz += 2.0) criarPainelCerca(-0.5, pz, 0.08, 1.8);

    // Tijolos e sacos de cimento
    const pilhaTijolos = BABYLON.MeshBuilder.CreateBox("pilhaTijolosTI", { width: 1.0, height: 0.6, depth: 0.8 }, scene);
    pilhaTijolos.position = new BABYLON.Vector3(-3.0, 0.3, 7.5);
    pilhaTijolos.material = matTijoloObra;
    pilhaTijolos.parent = grupoObra;

    for (let i = 0; i < 3; i++) {
        const saco = BABYLON.MeshBuilder.CreateBox("sacoCimentoTI", { width: 0.5, height: 0.2, depth: 0.3 }, scene);
        saco.position = new BABYLON.Vector3(-3.0, 0.1 + i * 0.2, 5.0);
        saco.rotation.y = 0.2 * i;
        saco.material = matCimento;
        saco.parent = grupoObra;
    }

    // ==========================================================
    // B) ESTÁGIO CONCLUÍDO: PRÉDIO DO SETOR DE TECNOLOGIA
    // ==========================================================
    const matParedeBege = new BABYLON.StandardMaterial("matParedeBegeTec", scene);
    matParedeBege.diffuseColor = BABYLON.Color3.FromHexString("#e8dac4");
    matParedeBege.emissiveColor = BABYLON.Color3.FromHexString("#2e2a24");

    const matTelhadoSede = new BABYLON.StandardMaterial("matTelhadoSedeTec", scene);
    matTelhadoSede.diffuseColor = BABYLON.Color3.FromHexString("#334155");
    matTelhadoSede.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);

    const matMarco = new BABYLON.StandardMaterial("matMarcoTec", scene);
    matMarco.diffuseColor = BABYLON.Color3.FromHexString("#1e293b");

    const matFundoAzul = new BABYLON.StandardMaterial("matFundoAzulTec", scene);
    matFundoAzul.diffuseColor = BABYLON.Color3.FromHexString("#0284c7");

    const matVidroAzulSede = new BABYLON.StandardMaterial("matVidroAzulSedeTec", scene);
    matVidroAzulSede.diffuseColor = BABYLON.Color3.FromHexString("#2563eb");
    matVidroAzulSede.emissiveColor = BABYLON.Color3.FromHexString("#0284c7");
    matVidroAzulSede.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

    const alturaBase = 2.75;
    const corpoPredioTec = BABYLON.MeshBuilder.CreateBox("corpoPredioTec", { width: 3.8, height: alturaBase, depth: 5.8 }, scene);
    corpoPredioTec.position = new BABYLON.Vector3(posXArea, alturaBase / 2, posZArea);
    corpoPredioTec.material = matParedeBege;
    corpoPredioTec.parent = grupoPredioTec;

    const alturaDeclive = 0.5;
    const shapePrisma = [
        new BABYLON.Vector3(-1.9, 0, 0),
        new BABYLON.Vector3(1.9, 0, 0),
        new BABYLON.Vector3(-1.9, alturaDeclive, 0),
        new BABYLON.Vector3(-1.9, 0, 0)
    ];
    const pathPrisma = [
        new BABYLON.Vector3(posXArea, alturaBase, posZArea - 2.9),
        new BABYLON.Vector3(posXArea, alturaBase, posZArea + 2.9)
    ];
    const prismaTeto = BABYLON.MeshBuilder.ExtrudeShape("prismaTetoTec", {
        shape: shapePrisma,
        path: pathPrisma,
        cap: BABYLON.Mesh.CAP_ALL,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE
    }, scene);
    prismaTeto.material = matParedeBege;
    prismaTeto.parent = grupoPredioTec;

    const anguloInclinacao = Math.atan2(alturaDeclive, 3.8);
    const telhadoInclinado = BABYLON.MeshBuilder.CreateBox("telhadoInclinadoTec", { width: 4.2, height: 0.18, depth: 6.2 }, scene);
    telhadoInclinado.position = new BABYLON.Vector3(posXArea, alturaBase + (alturaDeclive / 2) + 0.09, posZArea);
    telhadoInclinado.rotation.z = -anguloInclinacao;
    telhadoInclinado.material = matTelhadoSede;
    telhadoInclinado.parent = grupoPredioTec;

    const xParedeMaior = posXArea + 1.90;
    const zEntrada = posZArea - 0.5;

    const alturaPorta = 1.35;
    const larguraPorta = 0.90;
    const yPorta = alturaPorta / 2;

    const fundoPorta = BABYLON.MeshBuilder.CreatePlane("fundoPortaTec", { width: larguraPorta, height: alturaPorta }, scene);
    fundoPorta.position = new BABYLON.Vector3(xParedeMaior + 0.005, yPorta, zEntrada);
    fundoPorta.rotation.y = -Math.PI / 2;
    fundoPorta.material = matFundoAzul;
    fundoPorta.parent = grupoPredioTec;

    const posteEsq = BABYLON.MeshBuilder.CreateBox("posteEsqTec", { width: 0.08, height: alturaPorta, depth: 0.08 }, scene);
    posteEsq.position = new BABYLON.Vector3(xParedeMaior + 0.02, yPorta, zEntrada - (larguraPorta / 2));
    posteEsq.material = matMarco;
    posteEsq.parent = grupoPredioTec;

    const posteDir = BABYLON.MeshBuilder.CreateBox("posteDirTec", { width: 0.08, height: alturaPorta, depth: 0.08 }, scene);
    posteDir.position = new BABYLON.Vector3(xParedeMaior + 0.02, yPorta, zEntrada + (larguraPorta / 2));
    posteDir.material = matMarco;
    posteDir.parent = grupoPredioTec;

    const vergaTopo = BABYLON.MeshBuilder.CreateBox("vergaTopoTec", { width: 0.08, height: 0.08, depth: larguraPorta + 0.08 }, scene);
    vergaTopo.position = new BABYLON.Vector3(xParedeMaior + 0.02, alturaPorta + 0.04, zEntrada);
    vergaTopo.material = matMarco;
    vergaTopo.parent = grupoPredioTec;

    const portaVidro = BABYLON.MeshBuilder.CreatePlane("portaVidroTec", { width: larguraPorta - 0.02, height: alturaPorta - 0.02 }, scene);
    portaVidro.position = new BABYLON.Vector3(xParedeMaior + 0.015, yPorta, zEntrada);
    portaVidro.rotation.y = -Math.PI / 2;
    portaVidro.material = matVidroAzulSede;
    portaVidro.parent = grupoPredioTec;

    const puxador = BABYLON.MeshBuilder.CreateBox("puxadorPortaTec", { width: 0.04, height: 0.25, depth: 0.03 }, scene);
    puxador.position = new BABYLON.Vector3(xParedeMaior + 0.04, yPorta, zEntrada + 0.28);
    puxador.material = matMarco;
    puxador.parent = grupoPredioTec;

    const yPlaca = alturaPorta + 0.32;

    const molduraPlaca = BABYLON.MeshBuilder.CreateBox("molduraPlacaTec", { width: 0.08, height: 0.40, depth: 1.7 }, scene);
    molduraPlaca.position = new BABYLON.Vector3(xParedeMaior + 0.03, yPlaca, zEntrada);
    molduraPlaca.material = matMarco;
    molduraPlaca.parent = grupoPredioTec;

    const placaTecTex = new BABYLON.DynamicTexture("placaTecTex", { width: 384, height: 96 }, scene, true);
    const ctxTec = placaTecTex.getContext();
    ctxTec.fillStyle = "#0284c7";
    ctxTec.fillRect(0, 0, 384, 96);
    ctxTec.strokeStyle = "#38bdf8";
    ctxTec.lineWidth = 6;
    ctxTec.strokeRect(4, 4, 376, 88);
    ctxTec.fillStyle = "#ffffff";
    ctxTec.font = "bold 22px Arial";
    ctxTec.textAlign = "center";
    ctxTec.textBaseline = "middle";
    ctxTec.fillText("TECNOLOGIA & INOVAÇÃO", 192, 48);
    placaTecTex.update();

    const matPlacaTec = new BABYLON.StandardMaterial("matPlacaTec", scene);
    matPlacaTec.diffuseTexture = placaTecTex;
    matPlacaTec.emissiveColor = new BABYLON.Color3(0.9, 0.9, 0.9);

    const facePlacaTec = BABYLON.MeshBuilder.CreatePlane("facePlacaTec", { width: 1.62, height: 0.34 }, scene);
    facePlacaTec.position = new BABYLON.Vector3(xParedeMaior + 0.071, yPlaca, zEntrada);
    facePlacaTec.rotation.y = -Math.PI / 2;
    facePlacaTec.material = matPlacaTec;
    facePlacaTec.parent = grupoPredioTec;

    const criarJanelaPequena = (x, y, z, rotY = 0) => {
        const fundoJanela = BABYLON.MeshBuilder.CreatePlane("fundoJanelaPequenaTI", { width: 0.65, height: 0.65 }, scene);
        fundoJanela.position = new BABYLON.Vector3(x + (rotY === -Math.PI / 2 ? 0.01 : 0), y, z - (rotY === 0 ? 0.01 : 0));
        fundoJanela.rotation.y = rotY;
        fundoJanela.material = matFundoAzul;
        fundoJanela.parent = grupoPredioTec;

        const moldura = BABYLON.MeshBuilder.CreateBox("molduraJanelaPequenaTI", { width: 0.75, height: 0.75, depth: 0.06 }, scene);
        moldura.position = new BABYLON.Vector3(x + (rotY === -Math.PI / 2 ? 0.02 : 0), y, z - (rotY === 0 ? 0.02 : 0));
        moldura.rotation.y = rotY;
        moldura.material = matMarco;
        moldura.parent = grupoPredioTec;

        const vidro = BABYLON.MeshBuilder.CreatePlane("vidroJanelaPequenaTI", { width: 0.65, height: 0.65 }, scene);
        vidro.position = new BABYLON.Vector3(x + (rotY === -Math.PI / 2 ? 0.055 : 0), y, z - (rotY === 0 ? 0.055 : 0));
        vidro.rotation.y = rotY;
        vidro.material = matVidroAzulSede;
        vidro.parent = grupoPredioTec;
    };

    criarJanelaPequena(xParedeMaior, 1.20, posZArea + 1.8, -Math.PI / 2);
    criarJanelaPequena(xParedeMaior, 1.20, posZArea - 2.0, -Math.PI / 2);
    criarJanelaPequena(posXArea - 0.9, 1.20, posZArea - 2.91, 0);
    criarJanelaPequena(posXArea + 0.9, 1.20, posZArea - 2.91, 0);

    // ==========================================================
    // C) INTERATIVIDADE 3D: HITBOX DE CLIQUE E CURSOR HOVER
    // ==========================================================
    const hitBoxTI = BABYLON.MeshBuilder.CreateBox("hitBoxTI", { width: 4.2, height: 3.5, depth: 6.2 }, scene);
    hitBoxTI.position = new BABYLON.Vector3(posXArea, 1.75, posZArea);
    hitBoxTI.visibility = 0;
    hitBoxTI.parent = grupoPredioTec;

    hitBoxTI.actionManager = new BABYLON.ActionManager(scene);

    hitBoxTI.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
            if (isInvestimentoComprado("tecnologia_inovacao")) {
                abrirModalSetorTI();
            }
        })
    );

    // ATUALIZAÇÃO EM TEMPO REAL CONFORME COMPRA
    registerGameAnimation(scene, () => {
        const comprado = isInvestimentoComprado("tecnologia_inovacao");
        grupoObra.setEnabled(!comprado);
        grupoPredioTec.setEnabled(comprado);
        hitBoxTI.isPickable = comprado; // Apenas ativa detecção do mouse quando comprado
    });
}