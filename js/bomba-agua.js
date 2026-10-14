export function createBombaAgua(scene, x, z) {
    // Nó raiz para agrupar todas as peças da bomba
    const grupoBomba = new BABYLON.TransformNode("grupoBombaAgua", scene);

    // ==========================================================
    // MATERIAIS DA BOMBA D'ÁGUA
    // ==========================================================
    const matBase = new BABYLON.StandardMaterial("matBombaBase", scene);
    matBase.diffuseColor = new BABYLON.Color3(0.2, 0.25, 0.3); // Cinza escuro metalizado

    const matCorpo = new BABYLON.StandardMaterial("matBombaCorpo", scene);
    matCorpo.diffuseColor = new BABYLON.Color3(0.02, 0.45, 0.65); // Azul industrial
    matCorpo.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    const matTubos = new BABYLON.StandardMaterial("matBombaTubos", scene);
    matTubos.diffuseColor = new BABYLON.Color3(0.7, 0.72, 0.75); // Metal prateado

    const matDetalhes = new BABYLON.StandardMaterial("matBombaDetalhes", scene);
    matDetalhes.diffuseColor = new BABYLON.Color3(0.95, 0.7, 0.1); // Amarelo destaque

    const matFiltro = new BABYLON.StandardMaterial("matBombaFiltro", scene);
    matFiltro.diffuseColor = new BABYLON.Color3(0.25, 0.28, 0.32); // Metal escuro para o filtro submerso

    // ==========================================================
    // ESTRUTURA 3D DA BOMBA
    // ==========================================================
    // 1. Base metálica / Pedestal de fixação
    const base = BABYLON.MeshBuilder.CreateBox("bombaBase", { width: 2.2, height: 0.2, depth: 1.6 }, scene);
    base.position = new BABYLON.Vector3(0, 0.1, 0);
    base.material = matBase;
    base.parent = grupoBomba;

    // 2. Motor Elétrico (Cilindro horizontal)
    const motor = BABYLON.MeshBuilder.CreateCylinder("bombaMotor", { diameter: 0.9, height: 1.1 }, scene);
    motor.rotation.z = Math.PI / 2;
    motor.position = new BABYLON.Vector3(-0.4, 0.65, 0);
    motor.material = matCorpo;
    motor.parent = grupoBomba;

    // Caixa de bornes elétrica no topo do motor
    const caixaElectrica = BABYLON.MeshBuilder.CreateBox("bombaCaixaElec", { width: 0.4, height: 0.22, depth: 0.35 }, scene);
    caixaElectrica.position = new BABYLON.Vector3(-0.4, 1.15, 0);
    caixaElectrica.material = matBase;
    caixaElectrica.parent = grupoBomba;

    // 3. Carcaça / Voluta da Bomba (Caracol central)
    const carterBomba = BABYLON.MeshBuilder.CreateCylinder("bombaCarter", { diameter: 1.25, height: 0.45 }, scene);
    carterBomba.rotation.z = Math.PI / 2;
    carterBomba.position = new BABYLON.Vector3(0.35, 0.7, 0);
    carterBomba.material = matCorpo;
    carterBomba.parent = grupoBomba;

    // Flange central com destaque
    const flangeBomba = BABYLON.MeshBuilder.CreateCylinder("bombaFlange", { diameter: 1.38, height: 0.08 }, scene);
    flangeBomba.rotation.z = Math.PI / 2;
    flangeBomba.position = new BABYLON.Vector3(0.35, 0.7, 0);
    flangeBomba.material = matDetalhes;
    flangeBomba.parent = grupoBomba;

    // 4. Tubo de Recalque (Saindo verticalmente para a estação)
    const tuboRecalque = BABYLON.MeshBuilder.CreateCylinder("tuboRecalque", { diameter: 0.35, height: 0.85 }, scene);
    tuboRecalque.position = new BABYLON.Vector3(0.35, 1.25, 0);
    tuboRecalque.material = matTubos;
    tuboRecalque.parent = grupoBomba;

    // Volante manual / Válvula de controle no topo do tubo de recalque
    const volanteValvula = BABYLON.MeshBuilder.CreateTorus("volanteValvula", { diameter: 0.45, thickness: 0.08 }, scene);
    volanteValvula.rotation.x = Math.PI / 2;
    volanteValvula.position = new BABYLON.Vector3(0.35, 1.68, 0);
    volanteValvula.material = matDetalhes;
    volanteValvula.parent = grupoBomba;

    // ==========================================================
    // 5. TUBULAÇÃO DE SUCÇÃO EXTENDIDA MERGULHANDO NO RIO
    // ==========================================================
    // Segmento horizontal estendido saindo da bomba até a margem do rio
    const tuboSuccaoHoriz = BABYLON.MeshBuilder.CreateCylinder("tuboSuccaoHoriz", { diameter: 0.38, height: 1.8 }, scene);
    tuboSuccaoHoriz.rotation.z = Math.PI / 2;
    tuboSuccaoHoriz.position = new BABYLON.Vector3(1.25, 0.7, 0);
    tuboSuccaoHoriz.material = matTubos;
    tuboSuccaoHoriz.parent = grupoBomba;

    // Curva / Cotovelo articulado na beira da água
    const cotoveloCano = BABYLON.MeshBuilder.CreateSphere("cotoveloCano", { diameter: 0.48 }, scene);
    cotoveloCano.position = new BABYLON.Vector3(2.15, 0.7, 0);
    cotoveloCano.material = matTubos;
    cotoveloCano.parent = grupoBomba;

    // Segmento vertical descendo para dentro da água do rio
    const tuboSuccaoVert = BABYLON.MeshBuilder.CreateCylinder("tuboSuccaoVert", { diameter: 0.38, height: 1.5 }, scene);
    tuboSuccaoVert.position = new BABYLON.Vector3(2.15, -0.05, 0);
    tuboSuccaoVert.material = matTubos;
    tuboSuccaoVert.parent = grupoBomba;

    // Ralo / Filtro de sucção submerso (válvula de pé com crivo na ponta)
    const filtroSubmerso = BABYLON.MeshBuilder.CreateCylinder("filtroSubmerso", { diameter: 0.52, height: 0.35 }, scene);
    filtroSubmerso.position = new BABYLON.Vector3(2.15, -0.75, 0);
    filtroSubmerso.material = matFiltro;
    filtroSubmerso.parent = grupoBomba;

    // Anel de travamento do filtro
    const anelFiltro = BABYLON.MeshBuilder.CreateTorus("anelFiltro", { diameter: 0.55, thickness: 0.05 }, scene);
    anelFiltro.rotation.x = Math.PI / 2;
    anelFiltro.position = new BABYLON.Vector3(2.15, -0.6, 0);
    anelFiltro.material = matDetalhes;
    anelFiltro.parent = grupoBomba;

    // ==========================================================
    // POSICIONAMENTO E MARCAÇÃO DE DESCONSTRUÇÃO
    // ==========================================================
    grupoBomba.position = new BABYLON.Vector3(x, 0, z);

    // Nomeia todas as peças como 'predio' para integrar perfeitamente com a ferramenta de remoção
    grupoBomba.getChildMeshes().forEach(mesh => {
        mesh.name = "predio";
    });

    return grupoBomba;
}