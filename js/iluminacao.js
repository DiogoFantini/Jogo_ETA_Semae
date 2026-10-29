import { getDataAtual } from './tempo.js';

export function setupIluminacao(scene) {
    // ==========================================================
    // 1. LUZES PRINCIPAIS
    // ==========================================================
    const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.8;

    const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.intensity = 0.9;

    // ==========================================================
    // 2. MODELOS DO SOL E DA LUA NO CÉU
    // ==========================================================
    const raioOrbita = 110; // Distância do Sol e da Lua no horizonte

    // SOL
    const solMesh = BABYLON.MeshBuilder.CreateSphere("solMesh", { diameter: 8 }, scene);
    const matSol = new BABYLON.StandardMaterial("matSol", scene);
    matSol.emissiveColor = new BABYLON.Color3(1, 0.85, 0.3); // Amarelo Dourado
    matSol.disableLighting = true;
    solMesh.material = matSol;

    // LUA
    const luaMesh = BABYLON.MeshBuilder.CreateSphere("luaMesh", { diameter: 6 }, scene);
    const matLua = new BABYLON.StandardMaterial("matLua", scene);
    matLua.emissiveColor = new BABYLON.Color3(0.8, 0.9, 1.0); // Prata / Azul Luar
    matLua.disableLighting = true;
    luaMesh.material = matLua;

    // ==========================================================
    // 3. TABELA DE CORES DO CÉU (PRÉ-ALOCADA COM ZERO ALLOC NO LOOP)
    // ==========================================================
    const coresCicloDef = [
        { hora: 0,  sky: "#090d16", hemiInt: 0.25, dirInt: 0.25, dirCol: "#a5f3fc" }, // Meia-noite (Luar)
        { hora: 5,  sky: "#090d16", hemiInt: 0.25, dirInt: 0.25, dirCol: "#a5f3fc" }, // Fim da Noite
        { hora: 6,  sky: "#7e22ce", hemiInt: 0.50, dirInt: 0.50, dirCol: "#fde047" }, // Amanhecer (Roxo Alvorada)
        { hora: 7,  sky: "#87cfeb", hemiInt: 0.85, dirInt: 0.90, dirCol: "#fff5ea" }, // Manhã (Azul Céu)
        { hora: 12, sky: "#87cfeb", hemiInt: 0.90, dirInt: 1.00, dirCol: "#ffffff" }, // Meio-dia
        { hora: 17, sky: "#a855f7", hemiInt: 0.70, dirInt: 0.75, dirCol: "#fb923c" }, // Início do Pôr do Sol (Roxo Claro)
        { hora: 18, sky: "#581c87", hemiInt: 0.45, dirInt: 0.45, dirCol: "#f43f5e" }, // Crepúsculo (Roxo Escuro / Rosa)
        { hora: 19, sky: "#090d16", hemiInt: 0.25, dirInt: 0.25, dirCol: "#a5f3fc" }, // Noite
        { hora: 24, sky: "#090d16", hemiInt: 0.25, dirInt: 0.25, dirCol: "#a5f3fc" }  // Fim do Dia
    ];

    // Converte hexadecimais uma única vez no boot
    const coresCiclo = coresCicloDef.map(c => ({
        hora: c.hora,
        sky: BABYLON.Color4.FromHexString(c.sky + "FF"),
        dirCol: BABYLON.Color3.FromHexString(c.dirCol),
        hemiInt: c.hemiInt,
        dirInt: c.dirInt
    }));

    // Objetos reutilizados no loop sem gerar garbage collection
    const skyFinal = new BABYLON.Color4(0.035, 0.05, 0.086, 1);
    const dirColFinal = new BABYLON.Color3(0.65, 0.95, 0.98);

    function atualizarEstadoCeu(horasDecimais) {
        for (let i = 0; i < coresCiclo.length - 1; i++) {
            const atual = coresCiclo[i];
            const proximo = coresCiclo[i + 1];

            if (horasDecimais >= atual.hora && horasDecimais <= proximo.hora) {
                const t = (horasDecimais - atual.hora) / (proximo.hora - atual.hora);

                BABYLON.Color4.LerpToRef(atual.sky, proximo.sky, t, skyFinal);
                BABYLON.Color3.LerpToRef(atual.dirCol, proximo.dirCol, t, dirColFinal);

                scene.clearColor = skyFinal;
                dirLight.color = dirColFinal;
                hemiLight.intensity = BABYLON.Scalar.Lerp(atual.hemiInt, proximo.hemiInt, t);
                dirLight.intensity = BABYLON.Scalar.Lerp(atual.dirInt, proximo.dirInt, t);
                return;
            }
        }
    }

    // ==========================================================
    // 4. LOOP DE ATUALIZAÇÃO DA ÓRBITA DA LUZ
    // ==========================================================
    scene.registerBeforeRender(() => {
        const data = getDataAtual();
        const horasDecimais = data.getHours() + (data.getMinutes() / 60.0);

        // Calcula o ângulo do Sol (06:00 = 0 rad, 12:00 = PI/2, 18:00 = PI)
        const angulo = ((horasDecimais - 6) / 12) * Math.PI;

        // Posição tridimensional do Sol
        const posX = raioOrbita * Math.cos(angulo);
        const posY = raioOrbita * Math.sin(angulo);
        const posZ = 20 * Math.cos(angulo); // Leve inclinação de ângulo solar

        solMesh.position.set(-posX, posY, posZ);

        // A Lua orbita exatamente oposta ao Sol (180 graus de diferença)
        luaMesh.position.set(posX, -posY, -posZ);

        // Atualiza a direção da luz principal reutilizando memória
        if (posY > 0) {
            dirLight.direction.copyFrom(solMesh.position).scaleInPlace(-1).normalize();
        } else {
            dirLight.direction.copyFrom(luaMesh.position).scaleInPlace(-1).normalize();
        }

        // Atualiza cores e intensidades do ambiente sem alocação
        atualizarEstadoCeu(horasDecimais);
    });
}
