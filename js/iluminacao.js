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
    // 3. TABELA DE CORES DO CÉU (INTERPOLAÇÃO SUAVE)
    // ==========================================================
    const coresCiclo = [
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

    function obterEstadoCeu(horasDecimais) {
        for (let i = 0; i < coresCiclo.length - 1; i++) {
            const atual = coresCiclo[i];
            const proximo = coresCiclo[i + 1];

            if (horasDecimais >= atual.hora && horasDecimais <= proximo.hora) {
                const t = (horasDecimais - atual.hora) / (proximo.hora - atual.hora);

                const cSkyInit = BABYLON.Color4.FromHexString(atual.sky + "FF");
                const cSkyEnd = BABYLON.Color4.FromHexString(proximo.sky + "FF");
                const skyFinal = BABYLON.Color4.Lerp(cSkyInit, cSkyEnd, t);

                const cDirInit = BABYLON.Color3.FromHexString(atual.dirCol);
                const cDirEnd = BABYLON.Color3.FromHexString(proximo.dirCol);
                const dirColFinal = BABYLON.Color3.Lerp(cDirInit, cDirEnd, t);

                const hemiIntFinal = BABYLON.Scalar.Lerp(atual.hemiInt, proximo.hemiInt, t);
                const dirIntFinal = BABYLON.Scalar.Lerp(atual.dirInt, proximo.dirInt, t);

                return {
                    skyColor: skyFinal,
                    dirColor: dirColFinal,
                    hemiIntensity: hemiIntFinal,
                    dirIntensity: dirIntFinal
                };
            }
        }
        return {
            skyColor: BABYLON.Color4.FromHexString("#090d16FF"),
            dirColor: BABYLON.Color3.FromHexString("#a5f3fc"),
            hemiIntensity: 0.25,
            dirIntensity: 0.25
        };
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

        // Atualiza a direção da luz principal (aponta do Sol/Lua para o centro do mapa)
        if (posY > 0) {
            // Dia: Luz vinda do Sol
            dirLight.direction = solMesh.position.negate().normalize();
        } else {
            // Noite: Luz vinda da Lua
            dirLight.direction = luaMesh.position.negate().normalize();
        }

        // Atualiza cores e intensidades do ambiente
        const estado = obterEstadoCeu(horasDecimais);
        scene.clearColor = estado.skyColor;
        dirLight.color = estado.dirColor;
        dirLight.intensity = estado.dirIntensity;
        hemiLight.intensity = estado.hemiIntensity;
    });
}