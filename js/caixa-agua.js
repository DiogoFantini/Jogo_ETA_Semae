export function createCaixaAgua(scene, x, z) {
    // Nó raiz para agrupar todas as peças da caixa d'água
    const grupoCaixa = new BABYLON.TransformNode("grupoCaixaAgua", scene);

    // ==========================================================
    // MATERIAIS DA CAIXA D'ÁGUA
    // ==========================================================
    const matBaseConcrete = new BABYLON.StandardMaterial("matCaixaBase", scene);
    matBaseConcrete.diffuseColor = new BABYLON.Color3(0.65, 0.68, 0.72); // Concreto claro

    const matTanque = new BABYLON.StandardMaterial("matCaixaTanque", scene);
    matTanque.diffuseColor = new BABYLON.Color3(0.05, 0.52, 0.82); // Azul água industrial
    matTanque.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);

    const matMetal = new BABYLON.StandardMaterial("matCaixaMetal", scene);
    matMetal.diffuseColor = new BABYLON.Color3(0.75, 0.78, 0.82); // Metal prateado

    const matTampa = new BABYLON.StandardMaterial("matCaixaTampa", scene);
    matTampa.diffuseColor = new BABYLON.Color3(0.15, 0.25, 0.38); // Azul marinho escuro

    const matDetalheAmarelo = new BABYLON.StandardMaterial("matCaixaAmarelo", scene);
    matDetalheAmarelo.diffuseColor = new BABYLON.Color3(0.95, 0.7, 0.1);

    // ==========================================================
    // ESTRUTURA 3D DA CAIXA D'ÁGUA (TORRE ELEVADA)
    // ==========================================================
    // 1. Base / Fundação de concreto no chão
    const baseFundacao = BABYLON.MeshBuilder.CreateBox("caixaFundacao", { width: 2.4, height: 0.2, depth: 2.4 }, scene);
    baseFundacao.position = new BABYLON.Vector3(0, 0.1, 0);
    baseFundacao.material = matBaseConcrete;
    baseFundacao.parent = grupoCaixa;

    // 2. Coluna central de sustentação
    const pilarCentral = BABYLON.MeshBuilder.CreateCylinder("pilarCentral", { diameter: 0.9, height: 3.8 }, scene);
    pilarCentral.position = new BABYLON.Vector3(0, 2.1, 0);
    pilarCentral.material = matBaseConcrete;
    pilarCentral.parent = grupoCaixa;

    // Vigas/anéis de reforço na coluna
    const anelViga1 = BABYLON.MeshBuilder.CreateTorus("anelViga1", { diameter: 1.1, thickness: 0.08 }, scene);
    anelViga1.rotation.x = Math.PI / 2;
    anelViga1.position = new BABYLON.Vector3(0, 1.3, 0);
    anelViga1.material = matMetal;
    anelViga1.parent = grupoCaixa;

    const anelViga2 = BABYLON.MeshBuilder.CreateTorus("anelViga2", { diameter: 1.1, thickness: 0.08 }, scene);
    anelViga2.rotation.x = Math.PI / 2;
    anelViga2.position = new BABYLON.Vector3(0, 2.7, 0);
    anelViga2.material = matMetal;
    anelViga2.parent = grupoCaixa;

    // 3. Reservatório Cilíndrico Principal (Elevado)
    const reservatorio = BABYLON.MeshBuilder.CreateCylinder("reservatorio", { diameter: 2.4, height: 2.2 }, scene);
    reservatorio.position = new BABYLON.Vector3(0, 5.0, 0);
    reservatorio.material = matTanque;
    reservatorio.parent = grupoCaixa;

    // Faixa amarela de identificação no centro do reservatório
    const faixaIdentificacao = BABYLON.MeshBuilder.CreateCylinder("faixaIdentificacao", { diameter: 2.42, height: 0.35 }, scene);
    faixaIdentificacao.position = new BABYLON.Vector3(0, 5.0, 0);
    faixaIdentificacao.material = matDetalheAmarelo;
    faixaIdentificacao.parent = grupoCaixa;

    // 4. Tampa Cônica do Topo
    const tampaConica = BABYLON.MeshBuilder.CreateCylinder("tampaConica", { diameterTop: 0.1, diameterBottom: 2.55, height: 0.6 }, scene);
    tampaConica.position = new BABYLON.Vector3(0, 6.4, 0);
    tampaConica.material = matTampa;
    tampaConica.parent = grupoCaixa;

    // 5. Tubulação de Alimentação/Distribuição (Lateral da coluna)
    const tuboSubida = BABYLON.MeshBuilder.CreateCylinder("tuboSubida", { diameter: 0.22, height: 4.8 }, scene);
    tuboSubida.position = new BABYLON.Vector3(0.65, 2.5, 0);
    tuboSubida.material = matMetal;
    tuboSubida.parent = grupoCaixa;

    const cotoveloTopo = BABYLON.MeshBuilder.CreateSphere("cotoveloTopo", { diameter: 0.3 }, scene);
    cotoveloTopo.position = new BABYLON.Vector3(0.65, 4.9, 0);
    cotoveloTopo.material = matMetal;
    cotoveloTopo.parent = grupoCaixa;

    // ==========================================================
    // POSICIONAMENTO E MARCAÇÃO DE DESCONSTRUÇÃO
    // ==========================================================
    grupoCaixa.position = new BABYLON.Vector3(x, 0, z);

    // Nomeia todas as malhas como 'predio' para que o sistema de desconstrução as identifique e remova
    grupoCaixa.getChildMeshes().forEach(mesh => {
        mesh.name = "predio";
    });

    return grupoCaixa;
}