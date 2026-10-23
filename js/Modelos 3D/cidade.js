import { getDataAtual, registerGameAnimation } from '../tempo.js';

// ============================================================================
// cidade.js — Tudo que pertence à cidade ao fundo do jogo
//
//  - Ruas, avenida, calçadas, ponte em arco, galeria do rio, postes, carros.
//  - Prédios BAIXOS (a câmera do jogador não enxerga alturas grandes).
//  - Lotes agrupados em "quarteirões compactos" com BECOS estreitos entre eles
//    (piso escuro, lixeiras, caixas), separados por espaços abertos com árvores.
//  - PRAÇA com fonte (lado esquerdo da avenida) e QUADRA ESPORTIVA com
//    alambrado, traves e refletores (entre a 2ª e a 3ª rua).
//  - Noite ligada ao relógio do jogo (tempo.js): janelas, vitrines, letreiros,
//    postes, refletores e faróis acendem ao entardecer.
//
// Uso: createCidade(scene)  (o rio e a natureza ficam em rio.js / natureza.js)
// ============================================================================

export function createCidade(scene) {
    // ------------------------------------------------------------------
    // UTILITÁRIOS
    // ------------------------------------------------------------------
    let semente = 20261015;
    const rng = () => {
        semente |= 0; semente = (semente + 0x6D2B79F5) | 0;
        let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const escolher = (arr) => arr[Math.floor(rng() * arr.length)];
    const entre = (a, b) => a + rng() * (b - a);
    const inteiro = (a, b) => a + Math.floor(rng() * (b - a + 1));
    const clamp01 = (v) => Math.max(0, Math.min(1, v));
    const suave = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
    const V3 = (x, y, z) => new BABYLON.Vector3(x, y, z);
    const hex = (h) => BABYLON.Color3.FromHexString(h);

    const mat = (nome, cor, spec = 0.05) => {
        const m = new BABYLON.StandardMaterial(nome, scene);
        m.diffuseColor = hex(cor);
        m.specularColor = new BABYLON.Color3(spec, spec, spec);
        return m;
    };

    const matEmissivo = (nome, cor) => {
        const m = new BABYLON.StandardMaterial(nome, scene);
        m.diffuseColor = BABYLON.Color3.Black();
        m.emissiveColor = hex(cor);
        m.specularColor = BABYLON.Color3.Black();
        m.disableLighting = true;
        return m;
    };

    // Coletor: acumula malhas por material e mescla tudo no final
    const grupos = new Map();
    const add = (mesh, m) => {
        mesh.material = m;
        if (!grupos.has(m)) grupos.set(m, []);
        grupos.get(m).push(mesh);
        return mesh;
    };
    const caixa = (m, w, h, d, x, y, z, extra = {}) => {
        const b = BABYLON.MeshBuilder.CreateBox("b", { width: w, height: h, depth: d, ...extra }, scene);
        b.position.set(x, y, z);
        return add(b, m);
    };
    const cilindro = (m, dia, h, x, y, z, tess = 12) => {
        const c = BABYLON.MeshBuilder.CreateCylinder("c", { diameter: dia, height: h, tessellation: tess }, scene);
        c.position.set(x, y, z);
        return add(c, m);
    };
    const esfera = (m, dia, x, y, z, seg = 8) => {
        const s = BABYLON.MeshBuilder.CreateSphere("s", { diameter: dia, segments: seg }, scene);
        s.position.set(x, y, z);
        return add(s, m);
    };
    // Plano colado em parede. rotY: 0 = normal para -Z, PI = +Z, -PI/2 = +X, PI/2 = -X
    const plano = (m, w, h, x, y, z, rotY) => {
        const p = BABYLON.MeshBuilder.CreatePlane("p", { width: w, height: h }, scene);
        p.position.set(x, y, z);
        p.rotation.y = rotY;
        return add(p, m);
    };
    // Poça de luz no chão (visível à noite)
    let matPoca = null;
    const poca = (x, y, z, tam) => {
        const p = BABYLON.MeshBuilder.CreatePlane("poca", { size: tam }, scene);
        p.rotation.x = Math.PI / 2;
        p.position.set(x, y, z);
        return add(p, matPoca);
    };

    // Telhado de duas águas com cumeeira ao longo de X (normais explícitas)
    const prisma = (m, comp, vao, altura, x, y, z) => {
        const L = comp / 2, S = vao / 2, h = altura;
        const pos = [], nor = [], idx = [], uvs = [];
        const face = (pts, n) => {
            const base = pos.length / 3;
            pts.forEach(p => { pos.push(...p); nor.push(...n); uvs.push(0, 0); });
            for (let i = 1; i < pts.length - 1; i++) idx.push(base, base + i, base + i + 1);
        };
        const nl = Math.hypot(S, h);
        face([[-L, 0, -S], [L, 0, -S], [L, h, 0], [-L, h, 0]], [0, S / nl, -h / nl]);
        face([[L, 0, S], [-L, 0, S], [-L, h, 0], [L, h, 0]], [0, S / nl, h / nl]);
        face([[-L, 0, S], [-L, 0, -S], [-L, h, 0]], [-1, 0, 0]);
        face([[L, 0, -S], [L, 0, S], [L, h, 0]], [1, 0, 0]);
        face([[-L, 0, -S], [-L, 0, S], [L, 0, S], [L, 0, -S]], [0, -1, 0]);
        const vd = new BABYLON.VertexData();
        vd.positions = pos; vd.normals = nor; vd.indices = idx; vd.uvs = uvs;
        const mesh = new BABYLON.Mesh("telhado", scene);
        vd.applyToMesh(mesh);
        mesh.position.set(x, y, z);
        return add(mesh, m);
    };

    const criarTextura = (nome, w, h, desenhar, wrap = false, mip = true) => {
        const t = new BABYLON.DynamicTexture(nome, { width: w, height: h }, scene, mip);
        desenhar(t.getContext(), w, h);
        t.update();
        t.wrapU = t.wrapV = wrap ? BABYLON.Texture.WRAP_ADDRESSMODE : BABYLON.Texture.CLAMP_ADDRESSMODE;
        return t;
    };

    // ==========================================================
    // 1. RUA DE ACESSO (e prolongamento até o fundo da cidade)
    // ==========================================================
    const matAsfalto = new BABYLON.StandardMaterial("matAsfaltoBg", scene);
    matAsfalto.diffuseColor = new BABYLON.Color3(0.25, 0.25, 0.25);
    matAsfalto.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    const rua = BABYLON.MeshBuilder.CreateGround("rua", { width: 4, height: 65 }, scene);
    rua.position = new BABYLON.Vector3(5, 0.025, -42.5);
    rua.material = matAsfalto;

    const matAmarelo = new BABYLON.StandardMaterial("matAmarelo", scene);
    matAmarelo.diffuseColor = new BABYLON.Color3(0.95, 0.8, 0.1);

    for (let i = 0; i < 16; i++) {
        const faixa = BABYLON.MeshBuilder.CreateBox("faixa", { width: 0.2, height: 0.01, depth: 2 }, scene);
        faixa.position = new BABYLON.Vector3(5, 0.03, -11 - (i * 4));
        faixa.material = matAmarelo;
    }

    // ==========================================================
    // 2. CALÇADAS DA CIDADE
    // ==========================================================
    const matCalcada = new BABYLON.StandardMaterial("matCalcada", scene);
    matCalcada.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6);

    const calcada = BABYLON.MeshBuilder.CreateGround("calcada", { width: 100, height: 25 }, scene);
    calcada.position = new BABYLON.Vector3(10, 0.015, -65);
    calcada.material = matCalcada;

    const calcadaFundo = BABYLON.MeshBuilder.CreateGround("calcadaFundo", { width: 130, height: 56 }, scene);
    calcadaFundo.position = new BABYLON.Vector3(10, 0.015, -105.5); // z -77.5 .. -133.5
    calcadaFundo.material = matCalcada;

    const rua2 = BABYLON.MeshBuilder.CreateGround("rua2", { width: 4, height: 36 }, scene);
    rua2.position = new BABYLON.Vector3(5, 0.025, -93);
    rua2.material = matAsfalto;
    for (let z = -77; z > -110; z -= 4) {
        if (Math.abs(z + 80) < 3.6 || Math.abs(z + 95) < 3.6) continue;
        const f = BABYLON.MeshBuilder.CreateBox("faixaR2", { width: 0.2, height: 0.01, depth: 2 }, scene);
        f.position = new BABYLON.Vector3(5, 0.03, z);
        f.material = matAmarelo;
    }

    // ==========================================================
    // 3. AVENIDA TRANSVERSAL + 2 RUAS PARALELAS AO FUNDO
    // ==========================================================
    [-65, -80, -95].forEach((zc, k) => {
        const r = BABYLON.MeshBuilder.CreateGround(k === 0 ? "ruaTransversal" : "ruaTransversal" + k,
            { width: k === 0 ? 100 : 120, height: 6 }, scene);
        r.position = new BABYLON.Vector3(10, 0.025, zc);
        r.material = matAsfalto;
        for (let i = -12; i < 16; i++) {
            if (k === 0 && i === 1) continue;
            if (k > 0 && Math.abs(i * 4 - 5) < 3.2) continue;
            const faixaT = BABYLON.MeshBuilder.CreateBox("faixaT", { width: 2, height: 0.01, depth: 0.2 }, scene);
            faixaT.position = new BABYLON.Vector3(i * 4, 0.03, zc);
            faixaT.material = matAmarelo;
        }
    });

    // ==========================================================
    // 4. MATERIAIS
    // ==========================================================
    const PISO = 2.4;

    matPoca = new BABYLON.StandardMaterial("cidPoca", scene);
    matPoca.diffuseTexture = criarTextura("texPoca", 128, 128, (ctx) => {
        const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, "rgba(255,255,255,0.9)");
        g.addColorStop(0.5, "rgba(255,255,255,0.3)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    });
    matPoca.diffuseTexture.hasAlpha = true;
    matPoca.useAlphaFromDiffuseTexture = true;
    matPoca.diffuseColor = BABYLON.Color3.Black();
    matPoca.emissiveColor = hex("#ffc870");
    matPoca.specularColor = BABYLON.Color3.Black();
    matPoca.disableLighting = true;
    matPoca.backFaceCulling = false;
    matPoca.alpha = 0;

    const criarFachada = (nome, c) => {
        const luzes = [];
        for (let i = 0; i < 32; i++) luzes.push(rng() < c.luz);
        const area = (col, lin) => c.faixaCorrida
            ? { x: col * 128 + 4, y: lin * 128 + 30, w: 120, h: 62 }
            : { x: col * 128 + 28, y: lin * 128 + 22, w: 72, h: 78 };

        const difusa = criarTextura(nome + "D", 512, 512, (ctx) => {
            ctx.fillStyle = c.parede; ctx.fillRect(0, 0, 512, 512);
            for (let lin = 0; lin < 8; lin++) {
                for (let col = 0; col < 4; col++) {
                    ctx.fillStyle = c.faixa;
                    ctx.fillRect(col * 128, lin * 128 + 112, 128, 16);
                    const a = area(col, lin);
                    ctx.fillStyle = c.moldura;
                    ctx.fillRect(a.x - 3, a.y - 3, a.w + 6, a.h + 6);
                    const g = ctx.createLinearGradient(a.x, a.y, a.x, a.y + a.h);
                    const acesa = luzes[lin * 4 + col];
                    g.addColorStop(0, acesa ? "#ffe09a" : c.vidro[0]);
                    g.addColorStop(1, acesa ? "#ffb750" : c.vidro[1]);
                    ctx.fillStyle = g;
                    ctx.fillRect(a.x, a.y, a.w, a.h);
                    if (!acesa) {
                        ctx.fillStyle = "rgba(255,255,255,0.14)";
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y + a.h);
                        ctx.lineTo(a.x + a.w * 0.5, a.y);
                        ctx.lineTo(a.x + a.w * 0.8, a.y);
                        ctx.lineTo(a.x + a.w * 0.3, a.y + a.h);
                        ctx.fill();
                    }
                    ctx.fillStyle = c.moldura;
                    ctx.fillRect(a.x + a.w / 2 - 1.5, a.y, 3, a.h);
                }
            }
        }, true);

        const emissiva = criarTextura(nome + "E", 512, 512, (ctx) => {
            ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 512, 512);
            ctx.fillStyle = "#ffcf70";
            for (let lin = 0; lin < 8; lin++) {
                for (let col = 0; col < 4; col++) {
                    if (!luzes[lin * 4 + col]) continue;
                    const a = area(col, lin);
                    ctx.fillRect(a.x, a.y, a.w, a.h);
                }
            }
        }, true);

        const m = new BABYLON.StandardMaterial(nome, scene);
        m.diffuseTexture = difusa;
        m.emissiveTexture = emissiva;
        m.emissiveTexture.level = 0.15;
        const s = c.brilho || 0.05;
        m.specularColor = new BABYLON.Color3(s, s, s);
        return m;
    };

    const fachadas = [
        criarFachada("fachConcreto", { parede: "#c9c5bc", faixa: "#9e9a92", moldura: "#e8e6e0", vidro: ["#2b3f55", "#456079"], luz: 0.3 }),
        criarFachada("fachVidro",    { parede: "#5b7894", faixa: "#34495e", moldura: "#2c3e50", vidro: ["#3f7fb5", "#8ccdf0"], luz: 0.15, faixaCorrida: true, brilho: 0.45 }),
        criarFachada("fachTijolo",   { parede: "#a8553d", faixa: "#7d3d2b", moldura: "#f1e6d3", vidro: ["#243447", "#3a5572"], luz: 0.35 }),
        criarFachada("fachBege",     { parede: "#efe8d8", faixa: "#cfc6b0", moldura: "#ffffff", vidro: ["#2f4660", "#527194"], luz: 0.3 }),
        criarFachada("fachEscura",   { parede: "#4b5360", faixa: "#363c46", moldura: "#8892a0", vidro: ["#1d2a3a", "#2f4560"], luz: 0.25, brilho: 0.15 })
    ];
    const fachadasTorre = [0, 1, 1, 3, 4];
    const fachadasMedio = [0, 2, 3, 2];

    const matConcretoEscuro = mat("cidConcretoEsc", "#6d7078");
    const matLaje = mat("cidLaje", "#b9bbc0");
    const matEquip = mat("cidEquip", "#8c9096", 0.2);
    const matMetal = mat("cidMetal", "#9aa2ad", 0.5);
    const matTanque = mat("cidTanque", "#d8d2c4");
    const matVidroEscuro = mat("cidVidroEsc", "#1f3347", 0.6);
    const matMarquise = mat("cidMarquise", "#c0392b");
    const matLuzFixa = matEmissivo("cidLuzFixa", "#e63b2e");
    const matsBeacon = [0, 1, 2].map(i => matEmissivo("cidBeacon" + i, "#ff2a1a"));

    const matLampada = matEmissivo("cidLampada", "#ffe2a0");
    matLampada.emissiveColor = hex("#ffe2a0").scale(0.35);

    // Casas
    const matsParedeCasa = ["#f2e3c6", "#e8b4a0", "#b7d3c0", "#c9d4ea", "#f0d58c", "#d9c1d8"].map((c, i) => mat("cidCasa" + i, c));
    const matsTelhado = ["#9c3d2e", "#7a4a3a", "#5a6270", "#a85a3c"].map((c, i) => mat("cidTelhado" + i, c, 0.1));
    const matPorta = mat("cidPorta", "#5b3a29");
    const matTijolo = mat("cidTijolo", "#a0503a");
    const matGrama = mat("cidGrama", "#4aa84a");
    const matBanco = mat("cidBanco", "#7a5535");

    const texJanelaCasa = (lit) => criarTextura("janCasa" + (lit ? "E" : "D"), 64, 80, (ctx) => {
        ctx.fillStyle = lit ? "#000" : "#f4f1ea"; ctx.fillRect(0, 0, 64, 80);
        const g = ctx.createLinearGradient(0, 8, 0, 72);
        g.addColorStop(0, lit ? "#ffd98a" : "#8fc4ea");
        g.addColorStop(1, lit ? "#ffb750" : "#4f8fc0");
        ctx.fillStyle = g; ctx.fillRect(8, 8, 48, 64);
        if (!lit) {
            ctx.fillStyle = "#f4f1ea";
            ctx.fillRect(30, 8, 4, 64); ctx.fillRect(8, 38, 48, 4);
            ctx.fillStyle = "#6b8f4e";
            ctx.fillRect(0, 0, 6, 80); ctx.fillRect(58, 0, 6, 80);
        }
    });
    const matJanelaCasa = new BABYLON.StandardMaterial("cidJanelaCasa", scene);
    matJanelaCasa.diffuseTexture = texJanelaCasa(false);
    matJanelaCasa.emissiveTexture = texJanelaCasa(true);
    matJanelaCasa.emissiveTexture.level = 0.15;
    matJanelaCasa.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    // Lojas
    const matsParedeLoja = ["#f4e1b8", "#c9e2d4", "#f2b6a5", "#bcd0ee", "#eadf9e"].map((c, i) => mat("cidLoja" + i, c));

    const texVitrine = (lit) => criarTextura("vitrine" + (lit ? "E" : "D"), 256, 128, (ctx) => {
        ctx.fillStyle = lit ? "#000" : "#3a3f48"; ctx.fillRect(0, 0, 256, 128);
        const g = ctx.createLinearGradient(0, 14, 0, 124);
        g.addColorStop(0, lit ? "#ffe3a0" : "#a9d6ef");
        g.addColorStop(1, lit ? "#ffc060" : "#5d9cc6");
        ctx.fillStyle = g; ctx.fillRect(10, 14, 168, 110);
        if (!lit) {
            ctx.fillStyle = "rgba(255,255,255,0.22)";
            ctx.beginPath(); ctx.moveTo(30, 124); ctx.lineTo(80, 14); ctx.lineTo(110, 14); ctx.lineTo(60, 124); ctx.fill();
            ctx.fillStyle = "#3a3f48"; ctx.fillRect(92, 14, 4, 110);
            ctx.fillStyle = "#6b4a32"; ctx.fillRect(190, 14, 56, 114);
            ctx.fillStyle = "#a9d6ef"; ctx.fillRect(198, 24, 40, 56);
            ctx.fillStyle = "#e0c060"; ctx.fillRect(200, 80, 5, 14);
        } else {
            ctx.fillStyle = "#ffd070"; ctx.fillRect(198, 24, 40, 56);
        }
    });
    const matVitrine = new BABYLON.StandardMaterial("cidVitrine", scene);
    matVitrine.diffuseTexture = texVitrine(false);
    matVitrine.emissiveTexture = texVitrine(true);
    matVitrine.emissiveTexture.level = 0.15;
    matVitrine.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);

    const nomesLoja = [
        ["PADARIA", "#b5651d"], ["FARMÁCIA", "#1e8449"], ["MERCADO", "#c0392b"], ["CAFÉ", "#6e3b1f"],
        ["PIZZARIA", "#a93226"], ["LANCHES", "#d68910"], ["FLORES", "#8e44ad"], ["BAZAR", "#2471a3"]
    ];
    const matsLetreiro = nomesLoja.map(([nome, cor], i) => {
        const desenhar = (lit) => criarTextura("letreiro" + i + (lit ? "E" : "D"), 256, 64, (ctx) => {
            ctx.fillStyle = lit ? "#000" : cor; ctx.fillRect(0, 0, 256, 64);
            ctx.strokeStyle = lit ? "#ffffff" : "#ffffffcc"; ctx.lineWidth = 4;
            ctx.strokeRect(5, 5, 246, 54);
            ctx.fillStyle = lit ? "#ffffff" : "#fff6d8";
            ctx.font = "bold 34px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(nome, 128, 34);
        });
        const m = new BABYLON.StandardMaterial("cidLetreiro" + i, scene);
        m.diffuseTexture = desenhar(false);
        m.emissiveTexture = desenhar(true);
        m.emissiveTexture.level = 0.1;
        m.specularColor = BABYLON.Color3.Black();
        return m;
    });

    const matsToldo = [["#c0392b", "#ffffff"], ["#1e8449", "#ffffff"], ["#2471a3", "#ffffff"], ["#d68910", "#ffffff"]].map(([a, b], i) => {
        const m = new BABYLON.StandardMaterial("cidToldo" + i, scene);
        m.diffuseTexture = criarTextura("toldo" + i, 64, 64, (ctx) => {
            for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? b : a; ctx.fillRect(k * 8, 0, 8, 64); }
        }, true);
        m.specularColor = BABYLON.Color3.Black();
        return m;
    });

    // Árvores / postes / ponte
    const matTronco = mat("cidTronco", "#6b4a2f");
    const matsFolha = [mat("cidFolha0", "#2f8f3a"), mat("cidFolha1", "#3fa845")];
    const matPoste = mat("cidPoste", "#4a4f57", 0.3);
    const matConcretoClaro = mat("cidConcretoClaro", "#a9acb1");
    const matAco = mat("cidAco", "#cfd8e3", 0.6);
    const matMureta = mat("matMureta", "#c9cbd0");

    // Becos
    const matBeco = mat("cidBeco", "#55585e");
    const matsLixeira = [mat("cidLixeiraV", "#2e7d4f"), mat("cidLixeiraC", "#5f6670")];
    const matCaixaPapel = mat("cidCaixaPapel", "#b88a5a");

    // Praça
    const matAguaFonte = mat("cidAguaFonte", "#58b6e0", 0.6);
    const matsFlor = ["#f06292", "#ffd54a", "#b388ff", "#ff8a65"].map((c, i) => mat("cidFlor" + i, c));
    const matCanteiro = mat("cidCanteiro", "#5a3d28");

    // Quadra
    const matQuadraBorda = mat("cidQuadraBorda", "#b5543b");
    const matQuadraPiso = mat("cidQuadraPiso", "#2f6fa8", 0.25);
    const matLinha = mat("cidQuadraLinha", "#f4f4f0");
    const matTrave = mat("cidTrave", "#f2f2f2", 0.4);
    const matAlambrado = new BABYLON.StandardMaterial("cidAlambrado", scene);
    matAlambrado.diffuseTexture = criarTextura("texAlambrado", 64, 64, (ctx) => {
        ctx.clearRect(0, 0, 64, 64);
        ctx.strokeStyle = "#8a9099"; ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(64, 64);
        ctx.moveTo(64, 0); ctx.lineTo(0, 64);
        ctx.moveTo(-32, 32); ctx.lineTo(32, 96);
        ctx.moveTo(32, -32); ctx.lineTo(96, 32);
        ctx.moveTo(32, 96); ctx.lineTo(96, 32);
        ctx.moveTo(-32, 32); ctx.lineTo(32, -32);
        ctx.stroke();
    }, true, false);
    matAlambrado.diffuseTexture.hasAlpha = true;
    matAlambrado.useAlphaFromDiffuseTexture = true;
    matAlambrado.transparencyMode = BABYLON.Material.MATERIAL_ALPHATEST;
    matAlambrado.alphaCutOff = 0.35;
    matAlambrado.backFaceCulling = false;
    matAlambrado.specularColor = BABYLON.Color3.Black();
    matAlambrado.emissiveColor = new BABYLON.Color3(0.25, 0.27, 0.3);

    // ==========================================================
    // 5. CONSTRUTORES DE EDIFÍCIOS
    // ==========================================================
    const fachadaBox = (tipo, w, andares, d, x, yBase, z) => {
        const col0 = Math.floor(rng() * 4) / 4;
        const lin0 = Math.floor(rng() * 8) / 8;
        const lado = (larg) => new BABYLON.Vector4(col0, lin0, col0 + larg / 8, lin0 + andares / 8);
        const topo = new BABYLON.Vector4(0, 0, 0.03, 0.03);
        const h = andares * PISO;
        const b = BABYLON.MeshBuilder.CreateBox("fachada", {
            width: w, height: h, depth: d,
            faceUV: [lado(w), lado(w), lado(d), lado(d), topo, topo]
        }, scene);
        b.position.set(x, yBase + h / 2, z);
        return add(b, fachadas[tipo]);
    };

    const equipamentosTopo = (x, y, z, w, d, qtd) => {
        for (let i = 0; i < qtd; i++) {
            caixa(matEquip, 0.9 + rng() * 0.8, 0.6 + rng() * 0.4, 0.8 + rng() * 0.6,
                x + (rng() - 0.5) * (w - 1.8), y + 0.4, z + (rng() - 0.5) * (d - 1.8));
        }
    };

    const criarTorre = (x, z, w, d, andares, tipo, comBeacon) => {
        const y0 = 0.015;
        const alt = andares * PISO;
        fachadaBox(tipo, w, andares, d, x, y0, z);
        caixa(matConcretoEscuro, w + 0.15, 0.5, d + 0.15, x, y0 + 0.25, z);
        let topo = y0 + alt;
        caixa(matLaje, w + 0.3, 0.35, d + 0.3, x, topo + 0.175, z);
        topo += 0.35;

        if (w >= 6 && andares >= 6 && rng() > 0.5) {
            fachadaBox(tipo, w - 2, 1, d - 2, x, topo, z);
            topo += PISO;
            caixa(matLaje, w - 1.7, 0.3, d - 1.7, x, topo + 0.15, z);
            topo += 0.3;
        }

        equipamentosTopo(x, topo, z, w, d, 2 + Math.floor(rng() * 2));

        if (comBeacon) {
            const ax = x + (rng() - 0.5) * (w - 2), az = z + (rng() - 0.5) * (d - 2);
            cilindro(matMetal, 0.12, 3.2, ax, topo + 1.6, az, 6);
            const luz = BABYLON.MeshBuilder.CreateSphere("beaconTopo", { diameter: 0.45, segments: 8 }, scene);
            luz.position.set(ax, topo + 3.3, az);
            luz.material = matsBeacon[Math.floor(rng() * 3)];
            luz.isPickable = false;
            if (alt > 18) {
                for (const sx of [-1, 1]) for (const sz of [-1, 1])
                    esfera(matLuzFixa, 0.25, x + sx * (w / 2 + 0.05), topo + 0.1, z + sz * (d / 2 + 0.05), 6);
            }
        }
    };

    const criarPredioMedio = (x, z, w, d, andares, tipo, f) => {
        const y0 = 0.015;
        fachadaBox(tipo, w, andares, d, x, y0, z);
        caixa(matConcretoEscuro, w + 0.15, 0.5, d + 0.15, x, y0 + 0.25, z);
        let topo = y0 + andares * PISO;
        caixa(matLaje, w + 0.3, 0.35, d + 0.3, x, topo + 0.175, z);
        topo += 0.35;

        const zf = z + f * d / 2;
        caixa(matVidroEscuro, 1.6, 2.1, 0.08, x, y0 + 1.05, zf + f * 0.04);
        caixa(matMarquise, 2.6, 0.14, 1.3, x, y0 + 2.4, zf + f * 0.65);

        const tx = x - w * 0.22;
        cilindro(matTanque, 1.5, 1.6, tx, topo + 1.4, z, 14);
        cilindro(matMetal, 0.1, 0.6, tx - 0.5, topo + 0.3, z - 0.5, 5);
        cilindro(matMetal, 0.1, 0.6, tx + 0.5, topo + 0.3, z + 0.5, 5);
        caixa(matConcretoEscuro, 1.6, 1.1, 1.4, x + w * 0.25, topo + 0.55, z + (rng() - 0.5));
        equipamentosTopo(x, topo, z, w, d, 1);
        if (rng() > 0.65) {
            cilindro(matMetal, 0.1, 3, x + w * 0.3, topo + 1.5, z - 1, 6);
            const luz = BABYLON.MeshBuilder.CreateSphere("beaconMedio", { diameter: 0.35, segments: 6 }, scene);
            luz.position.set(x + w * 0.3, topo + 3.1, z - 1);
            luz.material = matsBeacon[Math.floor(rng() * 3)];
            luz.isPickable = false;
        }
    };

    const criarLoja = (x, z, w, d, f) => {
        const y0 = 0.015;
        const parede = escolher(matsParedeLoja);
        const h1 = 3.4;
        const doisAndares = rng() > 0.6;
        caixa(parede, w, h1, d, x, y0 + h1 / 2, z);
        const zf = z + f * d / 2;
        const rotFrente = f > 0 ? Math.PI : 0;

        let topo = y0 + h1;
        if (doisAndares) {
            const h2 = 2.6;
            caixa(escolher(matsParedeLoja), w, h2, d, x, topo + h2 / 2, z);
            const n = Math.max(2, Math.floor(w / 2.2));
            for (let i = 0; i < n; i++) {
                const wx = x - w / 2 + (i + 0.5) * (w / n);
                plano(matJanelaCasa, 0.95, 1.2, wx, topo + 1.4, zf + f * 0.03, rotFrente);
            }
            plano(matJanelaCasa, 0.95, 1.2, x + w / 2 + 0.03, topo + 1.4, z, -Math.PI / 2);
            plano(matJanelaCasa, 0.95, 1.2, x - w / 2 - 0.03, topo + 1.4, z, Math.PI / 2);
            topo += h2;
        }
        caixa(matLaje, w + 0.2, 0.25, d + 0.2, x, topo + 0.125, z);
        topo += 0.25;
        equipamentosTopo(x, topo, z, w, d, 1);

        plano(matVitrine, w - 0.7, 2.2, x, y0 + 1.25, zf + f * 0.03, rotFrente);
        plano(escolher(matsLetreiro), Math.min(w * 0.75, 4.2), 0.75, x, y0 + 2.95, zf + f * 0.05, rotFrente);
        const toldo = caixa(escolher(matsToldo), w - 0.9, 0.07, 1.1, x - 0.2, y0 + 2.6, zf + f * 0.5);
        toldo.rotation.x = 0.3 * f;
    };

    const criarCasa = (x, z, w, d, f) => {
        const y0 = 0.035;
        const iCor = Math.floor(rng() * matsParedeCasa.length);
        caixa(matGrama, w + 0.4, 0.02, d + 0.5, x, 0.025, z);
        caixa(matsParedeCasa[iCor], w, 2.6, d, x, y0 + 1.3, z);

        prisma(escolher(matsTelhado), w + 0.5, d + 0.6, 1.5 + rng() * 0.6, x, y0 + 2.6, z);
        if (rng() > 0.4) caixa(matTijolo, 0.5, 1.2, 0.5, x + w * 0.25, y0 + 3.6, z - f * 0.3);

        const zf = z + f * d / 2;
        const rotFrente = f > 0 ? Math.PI : 0;
        caixa(matPorta, 0.9, 1.9, 0.1, x, y0 + 0.95, zf + f * 0.04);
        caixa(matConcretoClaro, 1.4, 0.08, 0.7, x, y0 + 0.04, zf + f * 0.4);
        plano(matJanelaCasa, 0.9, 1.1, x - w * 0.3, y0 + 1.5, zf + f * 0.03, rotFrente);
        plano(matJanelaCasa, 0.9, 1.1, x + w * 0.3, y0 + 1.5, zf + f * 0.03, rotFrente);
        plano(matJanelaCasa, 0.9, 1.1, x + w / 2 + 0.03, y0 + 1.5, z, -Math.PI / 2);
        plano(matJanelaCasa, 0.9, 1.1, x - w / 2 - 0.03, y0 + 1.5, z, Math.PI / 2);
    };

    const criarArvore = (x, z) => {
        const esc = 0.8 + rng() * 0.5;
        cilindro(matTronco, 0.3, 1.8 * esc, x, 0.9 * esc, z, 6);
        const folha = escolher(matsFolha);
        esfera(folha, 2.4 * esc, x, 2.5 * esc, z, 7);
        esfera(folha, 1.7 * esc, x + 0.5 * esc, 3.3 * esc, z + 0.2, 6);
    };

    const criarBanco = (x, z) => {
        caixa(matBanco, 1.5, 0.1, 0.45, x, 0.5, z);
        caixa(matBanco, 1.5, 0.5, 0.08, x, 0.8, z - 0.2);
        caixa(matPoste, 0.1, 0.45, 0.4, x - 0.6, 0.28, z);
        caixa(matPoste, 0.1, 0.45, 0.4, x + 0.6, 0.28, z);
    };

    const criarPoste = (x, z, dirZ) => {
        cilindro(matPoste, 0.14, 4, x, 2, z, 6);
        caixa(matPoste, 0.1, 0.1, 1.1, x, 4, z + dirZ * 0.5);
        caixa(matLampada, 0.35, 0.12, 0.5, x, 3.92, z + dirZ * 1.0);
        poca(x, 0.05, z + dirZ * 1.0, 5.5);
    };

    // Beco: piso escuro entre dois lotes colados, com lixeiras e caixas
    const criarBeco = (x0, x1, zFrente, f, prof) => {
        const gap = x1 - x0, cx = (x0 + x1) / 2;
        const cz = zFrente - f * prof / 2;
        caixa(matBeco, gap, 0.012, prof, cx, 0.021, cz);
        const zFundo = zFrente - f * (prof - 0.7);
        if (rng() < 0.65) {
            const lx = cx + (rng() - 0.5) * Math.max(0.1, gap - 0.8);
            cilindro(escolher(matsLixeira), 0.55, 0.9, lx, 0.47, zFundo, 10);
            if (rng() < 0.4) cilindro(escolher(matsLixeira), 0.55, 0.9, lx + 0.6, 0.47, zFundo - f * 0.2, 10);
        }
        if (rng() < 0.45) {
            const bx = cx + (rng() - 0.5) * Math.max(0.1, gap - 0.9);
            const zb = zFrente - f * (prof * entre(0.3, 0.6));
            caixa(matCaixaPapel, 0.7, 0.55, 0.6, bx, 0.3, zb);
            if (rng() < 0.5) caixa(matCaixaPapel, 0.5, 0.4, 0.5, bx + 0.05, 0.78, zb);
        }
    };

    // ==========================================================
    // 6. PRAÇA COM FONTE
    // ==========================================================
    const criarPraca = (cx, cz, w, d) => {
        caixa(matGrama, w, 0.02, d, cx, 0.025, cz);
        caixa(matConcretoClaro, w - 1, 0.025, 1.4, cx, 0.03, cz);
        caixa(matConcretoClaro, 1.4, 0.025, d - 0.6, cx, 0.03, cz);
        cilindro(matConcretoClaro, 5, 0.04, cx, 0.035, cz, 24);

        // Fonte
        cilindro(matConcretoClaro, 2.6, 0.5, cx, 0.27, cz, 20);
        cilindro(matAguaFonte, 2.2, 0.06, cx, 0.53, cz, 20);
        cilindro(matConcretoClaro, 0.5, 0.9, cx, 0.7, cz, 10);
        esfera(matAguaFonte, 0.5, cx, 1.25, cz, 8);

        // Árvores
        [[-9.5, 1.9], [9.5, -1.9], [-9.5, -1.9], [9.5, 1.9], [-5.5, -2.1], [5.5, 2.1]].forEach(([dx, dz]) => {
            criarArvore(cx + dx, cz + dz);
        });

        // Bancos e luminárias
        [[-3.6, 1.1], [3.6, -1.1], [-3.6, -1.1], [3.6, 1.1]].forEach(([dx, dz]) => criarBanco(cx + dx, cz + dz));
        [[-7, 1.4], [7, -1.4]].forEach(([dx, dz]) => {
            cilindro(matPoste, 0.12, 3.2, cx + dx, 1.6, cz + dz, 6);
            caixa(matLampada, 0.4, 0.4, 0.4, cx + dx, 3.3, cz + dz);
            poca(cx + dx, 0.05, cz + dz, 6);
        });

        // Canteiros de flores
        [[-3.2, 2.0], [3.2, -2.0]].forEach(([dx, dz]) => {
            caixa(matCanteiro, 2.2, 0.14, 0.9, cx + dx, 0.1, cz + dz);
            for (let k = 0; k < 10; k++) {
                esfera(escolher(matsFlor), 0.22,
                    cx + dx + (rng() - 0.5) * 2.0, 0.24, cz + dz + (rng() - 0.5) * 0.7, 5);
            }
        });
    };

    // ==========================================================
    // 7. QUADRA ESPORTIVA (alambrado, traves e refletores)
    // ==========================================================
    const rede = (w, h, x, y, z, rotY) => {
        const e = new BABYLON.Vector4(0, 0, 0.01, 0.01);
        const lado = new BABYLON.Vector4(0, 0, w / 0.5, h / 0.5);
        const b = BABYLON.MeshBuilder.CreateBox("rede", {
            width: w, height: h, depth: 0.03, faceUV: [lado, lado, e, e, e, e]
        }, scene);
        b.position.set(x, y, z);
        b.rotation.y = rotY;
        return add(b, matAlambrado);
    };

    const criarQuadra = (cx, cz) => {
        const L = 13, A = 6;
        caixa(matQuadraBorda, 14.4, 0.03, 7.2, cx, 0.03, cz);
        caixa(matQuadraPiso, L, 0.012, A, cx, 0.051, cz);

        const linha = (w, d, x, z) => caixa(matLinha, w, 0.012, d, cx + x, 0.06, cz + z);
        linha(L, 0.1, 0, A / 2 - 0.05);
        linha(L, 0.1, 0, -A / 2 + 0.05);
        linha(0.1, A, L / 2 - 0.05, 0);
        linha(0.1, A, -L / 2 + 0.05, 0);
        linha(0.1, A, 0, 0);
        const circ = BABYLON.MeshBuilder.CreateTorus("circ", { diameter: 2.4, thickness: 0.1, tessellation: 32 }, scene);
        circ.scaling.y = 0.12;
        circ.position.set(cx, 0.062, cz);
        add(circ, matLinha);
        for (const s of [-1, 1]) {
            linha(0.1, 3.4, s * (L / 2 - 3), 0);
            linha(3, 0.1, s * (L / 2 - 1.5), 1.7);
            linha(3, 0.1, s * (L / 2 - 1.5), -1.7);
            caixa(matLinha, 0.2, 0.012, 0.2, cx + s * (L / 2 - 4.2), 0.06, cz);

            // Trave de futsal
            const gx = cx + s * (L / 2);
            for (const gz of [-1.5, 1.5]) cilindro(matTrave, 0.1, 1.1, gx, 0.6, cz + gz, 8);
            const travessao = cilindro(matTrave, 0.1, 3.1, gx, 1.15, cz, 8);
            travessao.rotation.x = Math.PI / 2;
            rede(3.0, 1.1, gx + s * 0.7, 0.6, cz, Math.PI / 2);
        }

        // Alambrado: fundos altos e laterais com mureta
        for (const s of [-1, 1]) rede(7.2, 3.4, cx + s * 7.3, 1.73, cz, Math.PI / 2);
        const lateral = (x0, x1, z) => {
            const comp = x1 - x0, xm = cx + (x0 + x1) / 2;
            caixa(matMureta, comp, 0.9, 0.15, xm, 0.47, z);
            rede(comp, 1.7, xm, 1.78, z, 0);
        };
        lateral(-7.3, 7.3, cz - 3.65);
        lateral(-7.3, -1.2, cz + 3.65);
        lateral(1.2, 7.3, cz + 3.65);
        for (let k = 0; k <= 4; k++) {
            const px = cx - 7.3 + k * 3.65;
            cilindro(matPoste, 0.1, 3.4, px, 1.7, cz - 3.65, 6);
            if (k !== 2) cilindro(matPoste, 0.1, 3.4, px, 1.7, cz + 3.65, 6);
        }
        cilindro(matPoste, 0.1, 3.4, cx - 1.2, 1.7, cz + 3.65, 6);
        cilindro(matPoste, 0.1, 3.4, cx + 1.2, 1.7, cz + 3.65, 6);

        // Refletores
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
            const px = cx + sx * 8, pz = cz + sz * 4.2;
            cilindro(matPoste, 0.16, 6.5, px, 3.25, pz, 6);
            caixa(matLampada, 0.9, 0.14, 0.5, px - sx * 0.4, 6.55, pz - sz * 0.5);
        }
        poca(cx - 3.5, 0.066, cz, 9.5);
        poca(cx + 3.5, 0.066, cz, 9.5);
    };

    // ==========================================================
    // 8. LAYOUT DA CIDADE (compacta, baixa, com becos)
    // ==========================================================
    const XMIN = -38, XMAX = 58;
    const RUA = [2.2, 7.8];
    const RIO = [15.2, 34.8];
    const PRACA = { x: -12.5, w: 25, d: 6.4 };      // lado esquerdo da avenida (fileira próxima)
    const QUADRA = { x: 22.5, z: -87.7 };           // entre a 2ª e a 3ª rua

    const sortearTipo = (pesos) => {
        const nomes = ["torre", "medio", "loja", "casa", "parque"];
        let r = rng() * pesos.reduce((a, b) => a + b, 0);
        for (let i = 0; i < nomes.length; i++) { r -= pesos[i]; if (r <= 0) return nomes[i]; }
        return "casa";
    };

    const dimensoes = (tipo) => {
        if (tipo === "torre") return { w: escolher([4, 6, 6, 8]), d: escolher([4, 6]) };
        if (tipo === "medio") return { w: escolher([6, 8]), d: 5 };
        if (tipo === "loja") return { w: escolher([5, 6, 7]), d: 4.5 };
        if (tipo === "parque") return { w: escolher([8, 10]), d: 5 };
        return { w: escolher([5, 6]), d: 4 };
    };

    const criarParqueLote = (x, z, w, d) => {
        caixa(matGrama, w, 0.02, d, x, 0.025, z);
        caixa(matConcretoClaro, w, 0.025, 1.2, x, 0.03, z);
        const n = Math.max(2, Math.floor(w / 3));
        for (let i = 0; i < n; i++) criarArvore(x - w / 2 + (i + 0.5) * (w / n), z + (i % 2 ? 1 : -1) * d * 0.28);
        criarBanco(x - w * 0.2, z + 0.9);
    };

    // pesos: [torre, médio, loja, casa, parque]
    // juntos: chance do próximo lote ficar colado (beco) em vez de abrir um espaço
    const fileira = (zFrente, f, pesos, op) => {
        let x = XMIN + rng() * 3;
        let anterior = null;
        while (x < XMAX) {
            const tipo = sortearTipo(pesos);
            const { w, d } = dimensoes(tipo);

            let conflito = null;
            for (const [a, b] of op.proibidos) {
                if (x < b && x + w > a) conflito = conflito === null ? b : Math.max(conflito, b);
            }
            if (conflito !== null) { x = conflito + entre(1.5, 2.2); anterior = null; continue; }

            if (anterior && x - anterior.fim < 3.2) {
                criarBeco(anterior.fim, x, zFrente, f, Math.max(anterior.d, d));
            }

            const cx = x + w / 2;
            const cz = zFrente - f * d / 2;
            if (tipo === "torre") criarTorre(cx, cz, w, d, inteiro(op.torre[0], op.torre[1]), escolher(fachadasTorre), true);
            else if (tipo === "medio") criarPredioMedio(cx, cz, w, d, inteiro(op.medio[0], op.medio[1]), escolher(fachadasMedio), f);
            else if (tipo === "loja") criarLoja(cx, cz, w, d, f);
            else if (tipo === "parque") criarParqueLote(cx, cz, w, d);
            else criarCasa(cx, cz, w, d, f);

            anterior = { fim: x + w, d };
            const junto = rng() < op.juntos;
            const gap = junto ? entre(1.6, 2.4) : entre(4.5, 8);
            if (!junto) {
                const gx = x + w + gap / 2;
                criarArvore(gx, zFrente - f * 1.4);
                if (gap > 6) criarArvore(gx + 1.6, zFrente - f * 3.2);
            }
            x += w + gap;
        }
    };

    // Landmarks (reservam espaço nas fileiras)
    criarPraca(PRACA.x, -61.0 + PRACA.d / 2, PRACA.w, PRACA.d);
    criarQuadra(QUADRA.x, QUADRA.z);

    // Camadas de profundidade — alturas baixas (andares)
    fileira(-61.0, -1, [0.06, 0.22, 0.34, 0.30, 0.08],
        { proibidos: [RUA, RIO, [PRACA.x - PRACA.w / 2 - 1, PRACA.x + PRACA.w / 2 + 1]], juntos: 0.8, torre: [3, 5], medio: [2, 3] });
    fileira(-69.0, 1, [0.08, 0.22, 0.32, 0.28, 0.10],
        { proibidos: [RUA, RIO], juntos: 0.82, torre: [4, 6], medio: [2, 4] });
    fileira(-84.0, 1, [0.20, 0.32, 0.18, 0.12, 0.18],
        { proibidos: [RUA, [QUADRA.x - 8.7, QUADRA.x + 8.7]], juntos: 0.78, torre: [5, 7], medio: [3, 4] });
    fileira(-99.0, 1, [0.36, 0.32, 0.06, 0.04, 0.22],
        { proibidos: [RUA], juntos: 0.72, torre: [6, 9], medio: [4, 5] });

    // Skyline distante (poucas torres, ainda baixas)
    {
        let x = XMIN - 6;
        while (x < XMAX + 6) {
            const w = escolher([6, 8]);
            criarTorre(x + w / 2, -112, w, 6, inteiro(8, 12), escolher([1, 4, 0, 1]), true);
            x += w + entre(3, 8);
        }
    }

    // Árvores nas calçadas
    [-61.6, -68.4, -76.4, -83.6, -91.4, -98.6].forEach(zArv => {
        for (let x = XMIN + rng() * 4; x < XMAX; x += 9 + rng() * 5) {
            if (x > RUA[0] - 1.2 && x < RUA[1] + 1.2) continue;
            if (x > RIO[0] - 1.2 && x < RIO[1] + 1.2 && zArv > -70) continue;
            if (zArv === -61.6 && x > PRACA.x - 13 && x < PRACA.x + 13) continue;
            if ((zArv === -83.6 || zArv === -91.4) && x > 12.5 && x < 32.5) continue;
            if (rng() > 0.5) criarArvore(x, zArv);
        }
    });

    // Postes de luz
    [
        { z: -61.6, dir: -1 }, { z: -68.4, dir: 1 },
        { z: -76.4, dir: -1 }, { z: -83.6, dir: 1 },
        { z: -91.4, dir: -1 }, { z: -98.6, dir: 1 }
    ].forEach((p, i) => {
        for (let x = -36 + (i % 2) * 7; x <= 58; x += 14) {
            if (x > 1 && x < 9) continue;
            if (i < 2 && x > 14 && x < 36) continue;
            criarPoste(x, p.z, p.dir);
        }
    });

    // ==========================================================
    // 9. GALERIA: o rio entra em um túnel sob a cidade
    // ==========================================================
    caixa(matConcretoClaro, 19.6, 2.6, 1.4, 25, 1.3, -75.7);
    caixa(matLaje, 20.2, 0.3, 1.8, 25, 2.75, -75.7);
    caixa(matConcretoEscuro, 2.4, 2.2, 1.4, 16.4, 1.1, -75.7);
    caixa(matConcretoEscuro, 2.4, 2.2, 1.4, 33.6, 1.1, -75.7);
    caixa(matVidroEscuro, 14.6, 1.95, 0.02, 25, 1.05, -74.98);

    // ==========================================================
    // 10. PONTE EM ARCO
    // ==========================================================
    const matDeck = mat("pontDeck", "#8a8d92");
    const deckTopo = 0.23;

    const ponte = BABYLON.MeshBuilder.CreateBox("ponte", { width: 16, height: deckTopo, depth: 6 }, scene);
    ponte.position = new BABYLON.Vector3(25, deckTopo / 2, -65);
    ponte.material = matDeck;
    ponte.physicsImpostor = new BABYLON.PhysicsImpostor(ponte, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);

    caixa(matAsfalto, 16, 0.01, 5.2, 25, deckTopo, -65);
    for (const xi of [19, 23, 27, 31]) caixa(matAmarelo, 1.6, 0.012, 0.15, xi, deckTopo + 0.008, -65);
    for (const zc of [-62.2, -67.8]) caixa(matConcretoClaro, 16, 0.12, 0.4, 25, 0.26, zc);

    const anguloRampa = Math.atan(0.2 / 1.3);
    const rampaE = caixa(matAsfalto, 1.32, 0.04, 6, 16.35, 0.11, -65);
    rampaE.rotation.z = anguloRampa;
    const rampaD = caixa(matAsfalto, 1.32, 0.04, 6, 33.65, 0.11, -65);
    rampaD.rotation.z = -anguloRampa;

    for (const zc of [-62.1, -67.9]) {
        const mureta = BABYLON.MeshBuilder.CreateBox("mureta", { width: 16, height: 0.6, depth: 0.2 }, scene);
        mureta.position = new BABYLON.Vector3(25, 0.53, zc);
        mureta.material = matMureta;
        mureta.physicsImpostor = new BABYLON.PhysicsImpostor(mureta, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
    }

    for (const px of [17.35, 32.65]) {
        for (const zc of [-62.1, -67.9]) {
            caixa(matConcretoClaro, 0.7, 1.5, 0.7, px, 0.98, zc);
            caixa(matLaje, 0.85, 0.12, 0.85, px, 1.78, zc);
            esfera(matLampada, 0.45, px, 2.05, zc, 8);
        }
        poca(px, deckTopo + 0.02, -65, 5.5);
    }

    const yArco = (x) => 0.62 + 4.2 * (1 - Math.pow((x - 25) / 7.4, 2));
    for (const zc of [-62.1, -67.9]) {
        const caminho = [];
        for (let i = 0; i <= 28; i++) {
            const x = 17.6 + (i / 28) * 14.8;
            caminho.push(V3(x, yArco(x), zc));
        }
        const tubo = BABYLON.MeshBuilder.CreateTube("arco", { path: caminho, radius: 0.14, tessellation: 8, cap: BABYLON.Mesh.CAP_ALL }, scene);
        add(tubo, matAco);
        for (let hx = 19; hx <= 31.01; hx += 1.5) {
            const alt = yArco(hx) - 0.82;
            cilindro(matAco, 0.06, alt, hx, 0.82 + alt / 2, zc, 5);
        }
    }
    for (const bx of [21.5, 25, 28.5]) caixa(matAco, 0.12, 0.12, 5.8, bx, yArco(bx) - 0.12, -65);

    // ==========================================================
    // 11. CARROS
    // ==========================================================
    const coresCarro = ["#c0392b", "#2471a3", "#f1c40f", "#ecf0f1", "#27ae60", "#34495e", "#e67e22"].map((c, i) => mat("carro" + i, c, 0.5));
    const matVidroCarro = mat("carroVidro", "#1c2a38", 0.8);
    const matPneu = mat("carroPneu", "#111111");
    const matFarol = matEmissivo("carroFarol", "#fff6c8");
    const matLanterna = matEmissivo("carroLanterna", "#d62d20");

    const criarCarro = (corMat) => {
        const partes = [];
        const caixaC = (m, w, h, d, x, y, z) => {
            const b = BABYLON.MeshBuilder.CreateBox("cp", { width: w, height: h, depth: d }, scene);
            b.position.set(x, y, z);
            b.material = m;
            partes.push(b);
        };
        caixaC(corMat, 3.6, 0.55, 1.6, 0, 0.58, 0);
        caixaC(matVidroCarro, 2.0, 0.5, 1.42, -0.2, 1.1, 0);
        caixaC(corMat, 1.9, 0.08, 1.3, -0.2, 1.39, 0);
        caixaC(matFarol, 0.08, 0.16, 0.38, 1.81, 0.62, 0.5);
        caixaC(matFarol, 0.08, 0.16, 0.38, 1.81, 0.62, -0.5);
        caixaC(matLanterna, 0.08, 0.16, 0.38, -1.81, 0.62, 0.5);
        caixaC(matLanterna, 0.08, 0.16, 0.38, -1.81, 0.62, -0.5);
        for (const wx of [-1.1, 1.1]) for (const wz of [-0.82, 0.82]) {
            const r = BABYLON.MeshBuilder.CreateCylinder("rd", { diameter: 0.6, height: 0.25, tessellation: 12 }, scene);
            r.rotation.x = Math.PI / 2;
            r.position.set(wx, 0.3, wz);
            r.material = matPneu;
            partes.push(r);
        }
        const carro = BABYLON.Mesh.MergeMeshes(partes, true, true, undefined, false, true);
        carro.isPickable = false;
        return carro;
    };

    const alturaViaX = (x) => {
        if (x < 15.7 || x > 34.3) return 0.03;
        if (x < 17) return 0.03 + ((x - 15.7) / 1.3) * 0.2;
        if (x <= 33) return deckTopo;
        return deckTopo - ((x - 33) / 1.3) * 0.2;
    };

    const carros = [];
    [
        { z: -63.5, dir: 1, vel: 5.0, qtd: 4 },
        { z: -66.5, dir: -1, vel: 4.2, qtd: 4 }
    ].forEach(fx => {
        const passo = (XMAX - XMIN) / fx.qtd;
        for (let i = 0; i < fx.qtd; i++) {
            const mesh = criarCarro(escolher(coresCarro));
            mesh.rotation.y = fx.dir > 0 ? 0 : Math.PI;
            carros.push({ mesh, x: XMIN + i * passo + rng() * 5, z: fx.z, dir: fx.dir, vel: fx.vel });
        }
    });

    // ==========================================================
    // 12. MESCLA FINAL (poucos draw calls)
    // ==========================================================
    grupos.forEach((malhas, material) => {
        if (malhas.length === 0) return;
        const unida = malhas.length === 1 ? malhas[0] : BABYLON.Mesh.MergeMeshes(malhas, true, true);
        if (!unida) return;
        unida.material = material;
        unida.isPickable = false;
        unida.name = "cidade_" + material.name;
    });

    // ==========================================================
    // 13. ANIMAÇÃO: noite (relógio do jogo), carros e luzes de sinalização
    // ==========================================================
    // Para forçar manualmente: scene.definirNoiteCidade(0..1). null volta ao relógio.
    let noiteManual = null;
    scene.definirNoiteCidade = (v) => { noiteManual = v; };

    const noiteDaHora = (h) => {
        if (h < 5) return 1;
        if (h < 7) return 1 - suave((h - 5) / 2);
        if (h < 17) return 0;
        if (h < 19) return suave((h - 17) / 2);
        return 1;
    };

    const texFachadas = fachadas.map(m => m.emissiveTexture);
    const texOutras = [
        matJanelaCasa.emissiveTexture, matVitrine.emissiveTexture,
        ...matsLetreiro.map(m => m.emissiveTexture)
    ];

    let tempoReal = 0;
    scene.registerBeforeRender(() => {
        const dtReal = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
        tempoReal += dtReal;

        const data = getDataAtual();
        const hora = data.getHours() + data.getMinutes() / 60 + data.getSeconds() / 3600;
        const noite = (noiteManual !== null && noiteManual !== undefined)
            ? clamp01(noiteManual) : noiteDaHora(hora);

        texFachadas.forEach((t, i) => {
            const desloc = i * 0.07;
            t.level = 0.15 + suave((noite - desloc) / (1 - desloc)) * 0.9;
        });
        texOutras.forEach(t => { t.level = 0.12 + noite * 0.95; });

        const k = 0.3 + 0.7 * noite;
        matLampada.emissiveColor.set(1 * k, 0.89 * k, 0.63 * k);
        matPoca.alpha = noite * 0.55;
        const kf = 0.45 + 0.55 * noite;
        matFarol.emissiveColor.set(1 * kf, 0.96 * kf, 0.78 * kf);
        matLanterna.emissiveColor.set(0.84 * (0.5 + 0.5 * noite), 0.18, 0.13);

        matsBeacon.forEach((m, i) => {
            const aceso = ((tempoReal * 0.9 + i / 3) % 1) < 0.2;
            const forca = 0.6 + 0.4 * noite;
            m.emissiveColor.set((aceso ? 1 : 0.22) * forca, aceso ? 0.16 : 0.02, aceso ? 0.1 : 0.02);
        });
    });

    // Carros respeitam pausa e velocidade do jogo
    registerGameAnimation(scene, (dt) => {
        for (const c of carros) {
            c.x += c.vel * c.dir * dt;
            if (c.dir > 0 && c.x > XMAX) c.x = XMIN;
            if (c.dir < 0 && c.x < XMIN) c.x = XMAX;
            c.mesh.position.set(c.x, alturaViaX(c.x), c.z);
        }
    });
}