// ============================================================================
// rio.js — Rio animado (água com fluxo, partículas, peixes saltando, ondulações)
//
// Como funciona (resumo):
//  - A água NÃO usa mais deformação de vértices. Era isso que fazia as ondas
//    afundarem abaixo da grama (os "buracos verdes" da imagem). Agora o
//    movimento vem de 2 camadas de textura procedural rolando em velocidades
//    diferentes (efeito de profundidade), o que é leve e nunca fura o chão.
//  - O rio é dividido em 2 trechos para NÃO cobrir a avenida/ponte (z -68..-62).
//  - Partículas: brilhos na superfície, espuma nas margens e respingos.
//  - Peixes 3D com cauda animada saltam em arco, com respingo e ondulação.
// ============================================================================

export function createRio(scene) {
    // ------------------------------------------------------------------
    // CONFIGURAÇÃO (ajuste aqui)
    // ------------------------------------------------------------------
    const CFG = {
        centroX: 25,
        largura: 15,
        // Trechos do rio: deixa um vão sob a ponte (ponte ocupa z -68..-62)
        trechos: [
            { zIni: -75, zFim: -68.1 },
            { zIni: -61.9, zFim: 75 }
        ],
        yMargem: 0.03,      // leito/margem (acima do asfalto 0.02/0.025)
        yAgua: 0.05,        // água principal
        yBrilho: 0.07,      // camada de reflexos
        velocidadeFluxo: 1.2,   // unidades de mundo por segundo
        sentidoFluxo: 1,        // +1 = para +Z | -1 = para -Z (inverta se quiser)
        quantidadePeixes: 4,
        zMinPeixe: -55,
        zMaxPeixe: 60
    };

    const yPeixe = CFG.yBrilho;
    const metadeLargura = CFG.largura / 2;

    // Random determinístico (a textura sai sempre igual)
    let semente = 1337;
    const rnd = () => {
        semente |= 0; semente = (semente + 0x6D2B79F5) | 0;
        let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    // ------------------------------------------------------------------
    // TEXTURAS PROCEDURAIS (tileáveis)
    // ------------------------------------------------------------------
    const criarTextura = (nome, tam, pintar, comAlpha) => {
        const tex = new BABYLON.DynamicTexture(nome, { width: tam, height: tam }, scene, true);
        const ctx = tex.getContext();
        pintar(ctx, tam);
        tex.update();
        tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
        tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        tex.hasAlpha = !!comAlpha;
        return tex;
    };

    // Desenha 3x3 vezes deslocado para a textura emendar sem costura
    const comWrap = (ctx, tam, fn) => {
        for (const dx of [-tam, 0, tam]) {
            for (const dy of [-tam, 0, tam]) {
                ctx.save();
                ctx.translate(dx, dy);
                fn();
                ctx.restore();
            }
        }
    };

    // Base: azul com manchas alongadas claras/escuras (sentido do fluxo = vertical)
    const texAgua = criarTextura("texRioBase", 512, (ctx, tam) => {
        ctx.fillStyle = "#1c93c8";
        ctx.fillRect(0, 0, tam, tam);
        for (let i = 0; i < 90; i++) {
            const x = rnd() * tam, y = rnd() * tam;
            const rx = 14 + rnd() * 30, ry = 40 + rnd() * 110;
            const clara = rnd() > 0.45;
            comWrap(ctx, tam, () => {
                ctx.translate(x, y);
                ctx.scale(rx, ry);
                const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
                g.addColorStop(0, clara ? "rgba(140,230,250,0.22)" : "rgba(8,70,130,0.26)");
                g.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(0, 0, 1, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }, false);

    // Reflexos: filetes brancos ondulados e fininhos
    const texBrilho = criarTextura("texRioBrilho", 512, (ctx, tam) => {
        ctx.clearRect(0, 0, tam, tam);
        ctx.lineCap = "round";
        for (let i = 0; i < 55; i++) {
            const x = rnd() * tam, y = rnd() * tam;
            const comp = 40 + rnd() * 120;
            const desvio = (rnd() - 0.5) * 22;
            const alpha = 0.25 + rnd() * 0.45;
            const larg = 1.2 + rnd() * 2.4;
            comWrap(ctx, tam, () => {
                ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
                ctx.lineWidth = larg;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.quadraticCurveTo(x + desvio, y + comp / 2, x, y + comp);
                ctx.stroke();
            });
        }
    }, true);

    // Pontinho macio (partículas)
    const texPonto = new BABYLON.DynamicTexture("texPontoRio", { width: 64, height: 64 }, scene, false);
    {
        const c = texPonto.getContext();
        const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.45, "rgba(220,245,255,0.7)");
        g.addColorStop(1, "rgba(180,225,255,0)");
        c.fillStyle = g;
        c.fillRect(0, 0, 64, 64);
        texPonto.update();
        texPonto.hasAlpha = true;
    }

    // Anel de ondulação
    const texAnel = new BABYLON.DynamicTexture("texAnelRio", { width: 128, height: 128 }, scene, false);
    {
        const c = texAnel.getContext();
        c.clearRect(0, 0, 128, 128);
        const g = c.createRadialGradient(64, 64, 38, 64, 64, 62);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.55, "rgba(255,255,255,0.9)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        c.fillStyle = g;
        c.fillRect(0, 0, 128, 128);
        texAnel.update();
        texAnel.hasAlpha = true;
    }

    // ------------------------------------------------------------------
    // MATERIAIS
    // ------------------------------------------------------------------
    const matMargem = new BABYLON.StandardMaterial("matRioMargem", scene);
    matMargem.diffuseColor = new BABYLON.Color3(0.42, 0.33, 0.2);
    matMargem.specularColor = new BABYLON.Color3(0, 0, 0);

    const matAgua = new BABYLON.StandardMaterial("matRioAgua", scene);
    matAgua.diffuseTexture = texAgua;
    matAgua.specularColor = new BABYLON.Color3(0.45, 0.55, 0.65);
    matAgua.specularPower = 64;
    matAgua.emissiveColor = new BABYLON.Color3(0.04, 0.16, 0.26);
    matAgua.alpha = 0.92;
    matAgua.backFaceCulling = false;

    const matBrilho = new BABYLON.StandardMaterial("matRioBrilho", scene);
    matBrilho.diffuseTexture = texBrilho;
    matBrilho.useAlphaFromDiffuseTexture = true;
    matBrilho.diffuseColor = new BABYLON.Color3(0, 0, 0);
    matBrilho.emissiveColor = new BABYLON.Color3(0.9, 0.97, 1);
    matBrilho.specularColor = new BABYLON.Color3(0, 0, 0);
    matBrilho.disableLighting = true;
    matBrilho.backFaceCulling = false;
    matBrilho.alpha = 0.6;

    // ------------------------------------------------------------------
    // MALHAS DO RIO (margem + água + reflexos, por trecho)
    // ------------------------------------------------------------------
    const escalarUV = (mesh, escU, escV) => {
        const uv = mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
        for (let i = 0; i < uv.length; i += 2) { uv[i] *= escU; uv[i + 1] *= escV; }
        mesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, uv);
    };

    const TAM_TEXEL = 5; // 1 repetição da textura = 5 unidades de mundo
    const malhasRio = [];

    CFG.trechos.forEach((t, idx) => {
        const comp = t.zFim - t.zIni;
        const zc = (t.zIni + t.zFim) / 2;

        // Margem: um pouco mais larga só no lado direito (o esquerdo encosta no asfalto da ETA)
        const margem = BABYLON.MeshBuilder.CreateGround("rioMargem" + idx,
            { width: CFG.largura + 0.7, height: comp }, scene);
        margem.position.set(CFG.centroX + 0.35, CFG.yMargem, zc);
        margem.material = matMargem;
        margem.isPickable = false;

        const agua = BABYLON.MeshBuilder.CreateGround("rioAgua" + idx,
            { width: CFG.largura, height: comp }, scene);
        agua.position.set(CFG.centroX, CFG.yAgua, zc);
        agua.material = matAgua;
        agua.isPickable = false;
        escalarUV(agua, CFG.largura / TAM_TEXEL, comp / TAM_TEXEL);

        const brilho = BABYLON.MeshBuilder.CreateGround("rioBrilho" + idx,
            { width: CFG.largura, height: comp }, scene);
        brilho.position.set(CFG.centroX, CFG.yBrilho, zc);
        brilho.material = matBrilho;
        brilho.isPickable = false;
        escalarUV(brilho, CFG.largura / (TAM_TEXEL * 1.3), comp / (TAM_TEXEL * 1.3));

        malhasRio.push(margem, agua, brilho);
    });

    // ------------------------------------------------------------------
    // PARTÍCULAS AMBIENTE (brilhos e espuma nas margens)
    // ------------------------------------------------------------------
    const zIniPrincipal = CFG.trechos[1].zIni;
    const zFimPrincipal = CFG.trechos[1].zFim;
    const zCentro = (zIniPrincipal + zFimPrincipal) / 2;
    const zMeio = (zFimPrincipal - zIniPrincipal) / 2;
    const sf = CFG.sentidoFluxo;

    const criarAmbiente = (nome, x, meioX, capacidade, taxa, tamMin, tamMax, c1, c2, additive) => {
        const ps = new BABYLON.ParticleSystem(nome, capacidade, scene);
        ps.particleTexture = texPonto;
        ps.emitter = new BABYLON.Vector3(x, yPeixe + 0.03, zCentro);
        ps.minEmitBox = new BABYLON.Vector3(-meioX, 0, -zMeio);
        ps.maxEmitBox = new BABYLON.Vector3(meioX, 0, zMeio);
        ps.direction1 = new BABYLON.Vector3(-0.05, 0, sf * 0.9);
        ps.direction2 = new BABYLON.Vector3(0.05, 0.02, sf * 1.3);
        ps.minEmitPower = 0.8;
        ps.maxEmitPower = 1.2;
        ps.gravity = BABYLON.Vector3.Zero();
        ps.color1 = c1;
        ps.color2 = c2;
        ps.colorDead = new BABYLON.Color4(1, 1, 1, 0);
        ps.minSize = tamMin;
        ps.maxSize = tamMax;
        ps.minLifeTime = 3;
        ps.maxLifeTime = 6;
        ps.emitRate = taxa;
        ps.updateSpeed = 1 / 60; // 1 unidade de tempo = 1 segundo real
        ps.blendMode = additive ? BABYLON.ParticleSystem.BLENDMODE_ONEONE
                                : BABYLON.ParticleSystem.BLENDMODE_STANDARD;
        ps.start();
        return ps;
    };

    // Brilhos de sol espalhados
    criarAmbiente("rioBrilhos", CFG.centroX, metadeLargura - 0.5, 400, 60, 0.12, 0.3,
        new BABYLON.Color4(0.7, 0.9, 1, 0.5), new BABYLON.Color4(1, 1, 1, 0.35), true);
    // Espuma nas duas margens
    criarAmbiente("rioEspumaE", CFG.centroX - metadeLargura + 0.3, 0.3, 250, 25, 0.18, 0.4,
        new BABYLON.Color4(1, 1, 1, 0.55), new BABYLON.Color4(0.9, 0.97, 1, 0.4), false);
    criarAmbiente("rioEspumaD", CFG.centroX + metadeLargura - 0.3, 0.3, 250, 25, 0.18, 0.4,
        new BABYLON.Color4(1, 1, 1, 0.55), new BABYLON.Color4(0.9, 0.97, 1, 0.4), false);

    // ------------------------------------------------------------------
    // RESPINGOS
    // ------------------------------------------------------------------
    const respingo = new BABYLON.ParticleSystem("rioRespingo", 400, scene);
    respingo.particleTexture = texPonto;
    respingo.emitter = new BABYLON.Vector3(CFG.centroX, yPeixe, 0);
    respingo.minEmitBox = new BABYLON.Vector3(-0.15, 0, -0.15);
    respingo.maxEmitBox = new BABYLON.Vector3(0.15, 0, 0.15);
    respingo.direction1 = new BABYLON.Vector3(-1.2, 3.5, -1.2);
    respingo.direction2 = new BABYLON.Vector3(1.2, 5.5, 1.2);
    respingo.minEmitPower = 1;
    respingo.maxEmitPower = 1.6;
    respingo.gravity = new BABYLON.Vector3(0, -9.81, 0);
    respingo.color1 = new BABYLON.Color4(1, 1, 1, 0.95);
    respingo.color2 = new BABYLON.Color4(0.6, 0.85, 1, 0.8);
    respingo.colorDead = new BABYLON.Color4(0.3, 0.7, 1, 0);
    respingo.minSize = 0.08;
    respingo.maxSize = 0.24;
    respingo.minLifeTime = 0.5;
    respingo.maxLifeTime = 1.0;
    respingo.emitRate = 0;
    respingo.updateSpeed = 1 / 60;
    respingo.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    respingo.start();

    // ------------------------------------------------------------------
    // ONDULAÇÕES (anéis que crescem e somem)
    // ------------------------------------------------------------------
    const matAnel = new BABYLON.StandardMaterial("matRioAnel", scene);
    matAnel.diffuseTexture = texAnel;
    matAnel.useAlphaFromDiffuseTexture = true;
    matAnel.diffuseColor = new BABYLON.Color3(0, 0, 0);
    matAnel.emissiveColor = new BABYLON.Color3(1, 1, 1);
    matAnel.specularColor = new BABYLON.Color3(0, 0, 0);
    matAnel.disableLighting = true;
    matAnel.backFaceCulling = false;

    const aneis = [];
    for (let i = 0; i < 10; i++) {
        const m = BABYLON.MeshBuilder.CreateDisc("anelRio" + i, { radius: 0.5, tessellation: 32 }, scene);
        m.rotation.x = Math.PI / 2;
        m.material = matAnel;
        m.isPickable = false;
        m.setEnabled(false);
        aneis.push({ mesh: m, idade: 0, ativo: false });
    }
    let proxAnel = 0;

    const criarOndulacao = (x, z, tamanhoFinal = 3) => {
        const a = aneis[proxAnel];
        proxAnel = (proxAnel + 1) % aneis.length;
        a.idade = 0;
        a.ativo = true;
        a.tamanhoFinal = tamanhoFinal;
        a.mesh.position.set(x, CFG.yBrilho + 0.01, z);
        a.mesh.scaling.set(0.2, 0.2, 0.2);
        a.mesh.visibility = 0.8;
        a.mesh.setEnabled(true);
    };

    const splash = (pos, quantidade = 28) => {
        respingo.emitter = new BABYLON.Vector3(pos.x, yPeixe, pos.z);
        respingo.manualEmitCount = quantidade;
        criarOndulacao(pos.x, pos.z, 2.6);
        criarOndulacao(pos.x, pos.z, 1.6);
    };

    // ------------------------------------------------------------------
    // PEIXES 3D
    // ------------------------------------------------------------------
    const variantes = [
        { corpo: new BABYLON.Color3(0.95, 0.5, 0.1),  barb: new BABYLON.Color3(0.8, 0.25, 0.05) },
        { corpo: new BABYLON.Color3(0.7, 0.78, 0.86), barb: new BABYLON.Color3(0.45, 0.55, 0.7) },
        { corpo: new BABYLON.Color3(0.9, 0.76, 0.2),  barb: new BABYLON.Color3(0.75, 0.55, 0.1) }
    ];
    const matOlho = new BABYLON.StandardMaterial("matOlhoPeixe", scene);
    matOlho.diffuseColor = new BABYLON.Color3(0.02, 0.02, 0.02);
    matOlho.specularColor = new BABYLON.Color3(1, 1, 1);

    const matsPeixe = variantes.map((v, i) => {
        const corpo = new BABYLON.StandardMaterial("matPeixeCorpo" + i, scene);
        corpo.diffuseColor = v.corpo;
        corpo.specularColor = new BABYLON.Color3(0.7, 0.7, 0.7);
        corpo.specularPower = 48;
        const barb = new BABYLON.StandardMaterial("matPeixeBarb" + i, scene);
        barb.diffuseColor = v.barb;
        barb.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        return { corpo, barb };
    });

    const criarPeixe = (i) => {
        const raiz = new BABYLON.TransformNode("peixeRio" + i, scene);
        const mats = matsPeixe[i % matsPeixe.length];

        const corpo = BABYLON.MeshBuilder.CreateSphere("peixeCorpo" + i, { diameter: 1, segments: 12 }, scene);
        corpo.scaling.set(0.28, 0.34, 0.95);
        corpo.material = mats.corpo;
        corpo.parent = raiz;

        const dorsal = BABYLON.MeshBuilder.CreateSphere("peixeDorsal" + i, { diameter: 1, segments: 8 }, scene);
        dorsal.scaling.set(0.03, 0.2, 0.34);
        dorsal.position.set(0, 0.2, -0.05);
        dorsal.material = mats.barb;
        dorsal.parent = raiz;

        for (const lado of [-1, 1]) {
            const olho = BABYLON.MeshBuilder.CreateSphere("peixeOlho" + i, { diameter: 0.07, segments: 6 }, scene);
            olho.position.set(lado * 0.12, 0.06, 0.34);
            olho.material = matOlho;
            olho.parent = raiz;

            const peitoral = BABYLON.MeshBuilder.CreateSphere("peixePeitoral" + i, { diameter: 1, segments: 6 }, scene);
            peitoral.scaling.set(0.16, 0.025, 0.14);
            peitoral.position.set(lado * 0.15, -0.06, 0.12);
            peitoral.rotation.z = lado * 0.5;
            peitoral.material = mats.barb;
            peitoral.parent = raiz;
        }

        // Cauda em pivô (balança de um lado para o outro)
        const pivoCauda = new BABYLON.TransformNode("peixePivoCauda" + i, scene);
        pivoCauda.parent = raiz;
        pivoCauda.position.z = -0.45;
        const cauda = BABYLON.MeshBuilder.CreateSphere("peixeCauda" + i, { diameter: 1, segments: 8 }, scene);
        cauda.scaling.set(0.04, 0.32, 0.26);
        cauda.position.z = -0.1;
        cauda.material = mats.barb;
        cauda.parent = pivoCauda;

        raiz.setEnabled(false);
        const esc = 0.9 + Math.random() * 0.5;
        raiz.scaling.set(esc, esc, esc);

        return {
            raiz, pivoCauda,
            estado: "espera",
            espera: 1.5 + i * 1.6 + Math.random() * 2,
            t: 0, dur: 1, altura: 1.5, dist: 4,
            ini: new BABYLON.Vector3(), dirX: 0, dirZ: 1, fase: Math.random() * 6
        };
    };

    const peixes = [];
    for (let i = 0; i < CFG.quantidadePeixes; i++) peixes.push(criarPeixe(i));

    const iniciarSalto = (f) => {
        const sentido = Math.random() < 0.5 ? 0 : Math.PI;
        const ang = sentido + (Math.random() - 0.5) * 1.2;
        f.dirX = Math.sin(ang);
        f.dirZ = Math.cos(ang);
        f.dist = 3 + Math.random() * 2.5;
        f.dur = 0.9 + Math.random() * 0.5;
        f.altura = 1.1 + Math.random() * 1.2;

        const x = CFG.centroX + (Math.random() - 0.5) * (CFG.largura - 5);
        const z = CFG.zMinPeixe + Math.random() * (CFG.zMaxPeixe - CFG.zMinPeixe);
        // Evita sair da margem: se o fim passar da borda, inverte a direção lateral
        const xFim = x + f.dirX * f.dist;
        if (Math.abs(xFim - CFG.centroX) > metadeLargura - 1) f.dirX = -f.dirX;

        f.ini.set(x, yPeixe, z);
        f.t = 0;
        f.estado = "salto";
        f.raiz.position.set(x, yPeixe - 0.05, z);
        f.raiz.setEnabled(true);
        splash(f.ini, 24);
    };

    // ------------------------------------------------------------------
    // LOOP DE ANIMAÇÃO ÚNICO
    // ------------------------------------------------------------------
    let tempo = 0;
    let offBase = 0;
    let offBrilho = 0;

    scene.registerBeforeRender(() => {
        const dt = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
        tempo += dt;

        // --- Fluxo da água (rolagem das texturas) ---
        const vel = (CFG.velocidadeFluxo / TAM_TEXEL) * CFG.sentidoFluxo;
        offBase = (offBase + vel * dt) % 1;
        offBrilho = (offBrilho + vel * 1.7 * dt) % 1;
        texAgua.vOffset = offBase;
        texAgua.uOffset = Math.sin(tempo * 0.35) * 0.03;
        texBrilho.vOffset = offBrilho;
        texBrilho.uOffset = -Math.sin(tempo * 0.5) * 0.05;
        // Reflexos pulsando suavemente
        matBrilho.alpha = 0.5 + Math.sin(tempo * 1.3) * 0.12;

        // --- Peixes ---
        for (const f of peixes) {
            if (f.estado === "espera") {
                f.espera -= dt;
                if (f.espera <= 0) iniciarSalto(f);
                continue;
            }

            f.t += dt / f.dur;
            if (f.t >= 1) {
                const fim = f.raiz.position;
                splash(fim, 30);
                f.raiz.setEnabled(false);
                f.estado = "espera";
                f.espera = 3 + Math.random() * 4;
                continue;
            }

            const t = f.t;
            const x = f.ini.x + f.dirX * f.dist * t;
            const z = f.ini.z + f.dirZ * f.dist * t;
            const y = yPeixe - 0.05 + 4 * f.altura * t * (1 - t);
            f.raiz.position.set(x, y, z);

            // Orientação segundo a velocidade
            const velH = f.dist / f.dur;
            const velY = (4 * f.altura * (1 - 2 * t)) / f.dur;
            f.raiz.rotation.y = Math.atan2(f.dirX, f.dirZ);
            f.raiz.rotation.x = -Math.atan2(velY, velH);

            // Cauda batendo
            f.fase += dt * 24;
            f.pivoCauda.rotation.y = Math.sin(f.fase) * 0.55;
        }

        // --- Ondulações ---
        for (const a of aneis) {
            if (!a.ativo) continue;
            a.idade += dt;
            const p = a.idade / 1.3;
            if (p >= 1) {
                a.ativo = false;
                a.mesh.setEnabled(false);
                continue;
            }
            const s = 0.2 + p * a.tamanhoFinal;
            a.mesh.scaling.set(s, s, s);
            a.mesh.visibility = 0.8 * (1 - p);
        }
    });

    return malhasRio[1]; // malha de água do primeiro trecho (compatibilidade)
}