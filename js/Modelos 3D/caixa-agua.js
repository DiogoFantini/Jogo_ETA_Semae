let templateCaixa = null;

function criarTemplateCaixa(scene) {
    const pecas = [];

    // Materiais compartilhados
    const matBaseConcrete = new BABYLON.StandardMaterial("matCaixaBase", scene);
    matBaseConcrete.diffuseColor = new BABYLON.Color3(0.65, 0.68, 0.72);

    const matTanque = new BABYLON.StandardMaterial("matCaixaTanque", scene);
    matTanque.diffuseColor = new BABYLON.Color3(0.05, 0.52, 0.82);
    matTanque.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);

    const matMetal = new BABYLON.StandardMaterial("matCaixaMetal", scene);
    matMetal.diffuseColor = new BABYLON.Color3(0.75, 0.78, 0.82);

    const matTampa = new BABYLON.StandardMaterial("matCaixaTampa", scene);
    matTampa.diffuseColor = new BABYLON.Color3(0.15, 0.25, 0.38);

    const matDetalheAmarelo = new BABYLON.StandardMaterial("matCaixaAmarelo", scene);
    matDetalheAmarelo.diffuseColor = new BABYLON.Color3(0.95, 0.7, 0.1);

    // 1. Base / Fundação
    const baseFundacao = BABYLON.MeshBuilder.CreateBox("caixaFundacao", { width: 2.4, height: 0.2, depth: 2.4 }, scene);
    baseFundacao.position.set(0, 0.1, 0);
    baseFundacao.material = matBaseConcrete;
    pecas.push(baseFundacao);

    // 2. Coluna central de sustentação
    const pilarCentral = BABYLON.MeshBuilder.CreateCylinder("pilarCentral", { diameter: 0.9, height: 3.8 }, scene);
    pilarCentral.position.set(0, 2.1, 0);
    pilarCentral.material = matBaseConcrete;
    pecas.push(pilarCentral);

    const anelViga1 = BABYLON.MeshBuilder.CreateTorus("anelViga1", { diameter: 1.1, thickness: 0.08 }, scene);
    anelViga1.rotation.x = Math.PI / 2;
    anelViga1.position.set(0, 1.3, 0);
    anelViga1.material = matMetal;
    pecas.push(anelViga1);

    const anelViga2 = BABYLON.MeshBuilder.CreateTorus("anelViga2", { diameter: 1.1, thickness: 0.08 }, scene);
    anelViga2.rotation.x = Math.PI / 2;
    anelViga2.position.set(0, 2.7, 0);
    anelViga2.material = matMetal;
    pecas.push(anelViga2);

    // 3. Reservatório Cilíndrico Principal
    const reservatorio = BABYLON.MeshBuilder.CreateCylinder("reservatorio", { diameter: 2.4, height: 2.2 }, scene);
    reservatorio.position.set(0, 5.0, 0);
    reservatorio.material = matTanque;
    pecas.push(reservatorio);

    const faixaIdentificacao = BABYLON.MeshBuilder.CreateCylinder("faixaIdentificacao", { diameter: 2.42, height: 0.35 }, scene);
    faixaIdentificacao.position.set(0, 5.0, 0);
    faixaIdentificacao.material = matDetalheAmarelo;
    pecas.push(faixaIdentificacao);

    // 4. Tampa Cônica do Topo
    const tampaConica = BABYLON.MeshBuilder.CreateCylinder("tampaConica", { diameterTop: 0.1, diameterBottom: 2.55, height: 0.6 }, scene);
    tampaConica.position.set(0, 6.4, 0);
    tampaConica.material = matTampa;
    pecas.push(tampaConica);

    // 5. Tubulação de Alimentação
    const tuboSubida = BABYLON.MeshBuilder.CreateCylinder("tuboSubida", { diameter: 0.22, height: 4.8 }, scene);
    tuboSubida.position.set(0.65, 2.5, 0);
    tuboSubida.material = matMetal;
    pecas.push(tuboSubida);

    const cotoveloTopo = BABYLON.MeshBuilder.CreateSphere("cotoveloTopo", { diameter: 0.3 }, scene);
    cotoveloTopo.position.set(0.65, 4.9, 0);
    cotoveloTopo.material = matMetal;
    pecas.push(cotoveloTopo);

    // Mescla todas as partes em uma única malha otimizada
    const unida = BABYLON.Mesh.MergeMeshes(pecas, true, true, undefined, false, true);
    unida.name = "templateCaixa";
    unida.setEnabled(false);
    return unida;
}

export function createCaixaAgua(scene, x, z) {
    if (!templateCaixa || templateCaixa.isDisposed()) {
        templateCaixa = criarTemplateCaixa(scene);
    }

    const caixaInstancia = templateCaixa.clone("predio");
    caixaInstancia.setEnabled(true);
    caixaInstancia.position.set(x, 0, z);
    caixaInstancia.isPickable = true;
    caixaInstancia.name = "predio";

    return caixaInstancia;
}
