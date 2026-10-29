let templateBomba = null;

function criarTemplateBomba(scene) {
    const pecas = [];

    // Materiais compartilhados
    const matBase = new BABYLON.StandardMaterial("matBombaBase", scene);
    matBase.diffuseColor = new BABYLON.Color3(0.2, 0.25, 0.3);

    const matCorpo = new BABYLON.StandardMaterial("matBombaCorpo", scene);
    matCorpo.diffuseColor = new BABYLON.Color3(0.02, 0.45, 0.65);
    matCorpo.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    const matTubos = new BABYLON.StandardMaterial("matBombaTubos", scene);
    matTubos.diffuseColor = new BABYLON.Color3(0.7, 0.72, 0.75);

    const matDetalhes = new BABYLON.StandardMaterial("matBombaDetalhes", scene);
    matDetalhes.diffuseColor = new BABYLON.Color3(0.95, 0.7, 0.1);

    const matFiltro = new BABYLON.StandardMaterial("matBombaFiltro", scene);
    matFiltro.diffuseColor = new BABYLON.Color3(0.25, 0.28, 0.32);

    // 1. Base metálica
    const base = BABYLON.MeshBuilder.CreateBox("bombaBase", { width: 2.2, height: 0.2, depth: 1.6 }, scene);
    base.position.set(0, 0.1, 0);
    base.material = matBase;
    pecas.push(base);

    // 2. Motor elétrico
    const motor = BABYLON.MeshBuilder.CreateCylinder("bombaMotor", { diameter: 0.9, height: 1.1 }, scene);
    motor.rotation.z = Math.PI / 2;
    motor.position.set(-0.4, 0.65, 0);
    motor.material = matCorpo;
    pecas.push(motor);

    const caixaElectrica = BABYLON.MeshBuilder.CreateBox("bombaCaixaElec", { width: 0.4, height: 0.22, depth: 0.35 }, scene);
    caixaElectrica.position.set(-0.4, 1.15, 0);
    caixaElectrica.material = matBase;
    pecas.push(caixaElectrica);

    // 3. Voluta da bomba
    const carterBomba = BABYLON.MeshBuilder.CreateCylinder("bombaCarter", { diameter: 1.25, height: 0.45 }, scene);
    carterBomba.rotation.z = Math.PI / 2;
    carterBomba.position.set(0.35, 0.7, 0);
    carterBomba.material = matCorpo;
    pecas.push(carterBomba);

    const flangeBomba = BABYLON.MeshBuilder.CreateCylinder("bombaFlange", { diameter: 1.38, height: 0.08 }, scene);
    flangeBomba.rotation.z = Math.PI / 2;
    flangeBomba.position.set(0.35, 0.7, 0);
    flangeBomba.material = matDetalhes;
    pecas.push(flangeBomba);

    // 4. Tubo de recalque
    const tuboRecalque = BABYLON.MeshBuilder.CreateCylinder("tuboRecalque", { diameter: 0.35, height: 0.85 }, scene);
    tuboRecalque.position.set(0.35, 1.25, 0);
    tuboRecalque.material = matTubos;
    pecas.push(tuboRecalque);

    const volanteValvula = BABYLON.MeshBuilder.CreateTorus("volanteValvula", { diameter: 0.45, thickness: 0.08 }, scene);
    volanteValvula.rotation.x = Math.PI / 2;
    volanteValvula.position.set(0.35, 1.68, 0);
    volanteValvula.material = matDetalhes;
    pecas.push(volanteValvula);

    // 5. Tubulação de sucção
    const tuboSuccaoHoriz = BABYLON.MeshBuilder.CreateCylinder("tuboSuccaoHoriz", { diameter: 0.38, height: 1.8 }, scene);
    tuboSuccaoHoriz.rotation.z = Math.PI / 2;
    tuboSuccaoHoriz.position.set(1.25, 0.7, 0);
    tuboSuccaoHoriz.material = matTubos;
    pecas.push(tuboSuccaoHoriz);

    const cotoveloCano = BABYLON.MeshBuilder.CreateSphere("cotoveloCano", { diameter: 0.48 }, scene);
    cotoveloCano.position.set(2.15, 0.7, 0);
    cotoveloCano.material = matTubos;
    pecas.push(cotoveloCano);

    const tuboSuccaoVert = BABYLON.MeshBuilder.CreateCylinder("tuboSuccaoVert", { diameter: 0.38, height: 1.5 }, scene);
    tuboSuccaoVert.position.set(2.15, -0.05, 0);
    tuboSuccaoVert.material = matTubos;
    pecas.push(tuboSuccaoVert);

    const filtroSubmerso = BABYLON.MeshBuilder.CreateCylinder("filtroSubmerso", { diameter: 0.52, height: 0.35 }, scene);
    filtroSubmerso.position.set(2.15, -0.75, 0);
    filtroSubmerso.material = matFiltro;
    pecas.push(filtroSubmerso);

    const anelFiltro = BABYLON.MeshBuilder.CreateTorus("anelFiltro", { diameter: 0.55, thickness: 0.05 }, scene);
    anelFiltro.rotation.x = Math.PI / 2;
    anelFiltro.position.set(2.15, -0.6, 0);
    anelFiltro.material = matDetalhes;
    pecas.push(anelFiltro);

    // Mescla todas as partes em uma única malha otimizada com sub-materiais
    const unida = BABYLON.Mesh.MergeMeshes(pecas, true, true, undefined, false, true);
    unida.name = "templateBomba";
    unida.setEnabled(false);
    return unida;
}

export function createBombaAgua(scene, x, z) {
    if (!templateBomba || templateBomba.isDisposed()) {
        templateBomba = criarTemplateBomba(scene);
    }

    const bombaInstancia = templateBomba.clone("predio");
    bombaInstancia.setEnabled(true);
    bombaInstancia.position.set(x, 0, z);
    bombaInstancia.isPickable = true;
    bombaInstancia.name = "predio";

    return bombaInstancia;
}
