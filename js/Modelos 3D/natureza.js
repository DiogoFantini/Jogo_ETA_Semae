// ============================================================================
// natureza.js — Ambiente externo à ETA (grama, árvores, flores, juncos, pedras)
//
//  - GRAMA: textura procedural tileável (manchas, lâminas, terra) aplicada ao
//    "ground" criado no scene.js + tufos 3D (thin instances) espalhados por tudo.
//  - ÁRVORES DE 6 FORMATOS: carvalho, pinheiro, palmeira, ipê (amarelo e rosa)
//    além de arbustos (verdes e floridos).
//  - ÁRVORES EM TODA A ÁREA VERDE: amostragem com ruído (bosques e clareiras),
//    espaçamento mínimo entre copas e exclusão só do que não é verde
//    (ETA, rua, rio e cidade). Um anel de mata além do mapa fecha o horizonte.
//  - Flores em canteiros naturais, juncos nas margens do rio e pedras.
//  - Tudo usa thin instances (1 draw call por tipo) e cores de vértice.
//
// Uso: createNatureza(scene)  — chamar depois do "ground" existir (scene.js).
// ============================================================================

export function createNatureza(scene, ground) {
    // ------------------------------------------------------------------
    // UTILITÁRIOS
    // ------------------------------------------------------------------
    let semente = 77031;
    const rng = () => {
        semente |= 0; semente = (semente + 0x6D2B79F5) | 0;
        let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const entre = (a, b) => a + rng() * (b - a);
    const escolher = (arr) => arr[Math.floor(rng() * arr.length)];
    const clamp01 = (v) => Math.max(0, Math.min(1, v));
    const suave = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
    const V3 = (x, y, z) => new BABYLON.Vector3(x, y, z);
    const hex = (h) => BABYLON.Color3.FromHexString(h);

    // Ruído de valor 2D (bosques e clareiras)
    const hash2 = (ix, iz) => {
        let h = (Math.imul(ix, 374761393) + Math.imul(iz, 668265263)) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
    const vnoise = (x, z) => {
        const ix = Math.floor(x), iz = Math.floor(z);
        const fx = x - ix, fz = z - iz;
        const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
        const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
        return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
    };
    const fbm = (x, z) => vnoise(x, z) * 0.6 + vnoise(x * 2.1 + 17, z * 2.1 + 5) * 0.3 + vnoise(x * 4.3, z * 4.3) * 0.1;

    const criarTextura = (nome, w, h, desenhar, wrap = false, mip = true) => {
        const t = new BABYLON.DynamicTexture(nome, { width: w, height: h }, scene, mip);
        desenhar(t.getContext(), w, h);
        t.update();
        t.wrapU = t.wrapV = wrap ? BABYLON.Texture.WRAP_ADDRESSMODE : BABYLON.Texture.CLAMP_ADDRESSMODE;
        return t;
    };

    // Desenha com cópias deslocadas para a textura emendar sem costura
    const comWrap = (t, x, y, margem, fn) => {
        for (const dx of [-t, 0, t]) for (const dy of [-t, 0, t]) {
            const px = x + dx, py = y + dy;
            if (px < -margem || px > t + margem || py < -margem || py > t + margem) continue;
            fn(px, py);
        }
    };

    // ------------------------------------------------------------------
    // ZONAS: onde NÃO é grama (ETA, rua, rio, cidade)
    // ------------------------------------------------------------------
    const RIO = [17.2, 33.6];
    const proibido = (x, z, m = 0) => {
        if (x > -10.5 - m && x < 20 + m && z > -13 - m && z < 13 + m) return true;       // ETA (muros + asfalto)
        if (x > 2.2 - m && x < 7.8 + m && z < -8) return true;                           // rua de acesso
        if (x > RIO[0] - m && x < RIO[1] + m) return true;                               // rio + margens
        if (z < -50 - m && x > -58 && x < 78) return true;                               // cidade
        return false;
    };
    const distAteETA = (x, z) => {
        const dx = Math.max(-10.5 - x, 0, x - 20), dz = Math.max(-13 - z, 0, z - 13);
        return Math.hypot(dx, dz);
    };
    const distBanco = (x) => (x < RIO[0] ? RIO[0] - x : (x > RIO[1] ? x - RIO[1] : 0));

    // ==========================================================
    // 1. GRAMA REALISTA (textura no "ground" + plano externo)
    // ==========================================================
    const LADO_TEXTURA = 16; // unidades de mundo por repetição

    const texGrama = criarTextura("texGramaNatureza", 1024, 1024, (ctx, t) => {
        ctx.fillStyle = "#4e9a3a";
        ctx.fillRect(0, 0, t, t);

        // Manchas grandes (luz/sombra/solo)
        for (let i = 0; i < 80; i++) {
            const x = rng() * t, y = rng() * t, r = 50 + rng() * 150;
            const cor = escolher(["rgba(28,88,30,0.30)", "rgba(150,195,70,0.24)", "rgba(110,160,50,0.22)", "rgba(40,110,40,0.22)", "rgba(170,160,70,0.14)"]);
            comWrap(t, x, y, r, (px, py) => {
                const g = ctx.createRadialGradient(px, py, 0, px, py, r);
                g.addColorStop(0, cor);
                g.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = g;
                ctx.fillRect(px - r, py - r, r * 2, r * 2);
            });
        }

        // Lâminas de grama (traços curtos com ângulos variados)
        const paleta = ["#2f6f2a", "#3f8a32", "#5aa63e", "#78bb4c", "#8fc95a", "#a3b84a", "#2a6226"];
        ctx.lineCap = "round";
        for (let i = 0; i < 6500; i++) {
            const x = rng() * t, y = rng() * t;
            const ang = -Math.PI / 2 + (rng() - 0.5) * 1.6;
            const len = 7 + rng() * 14;
            ctx.strokeStyle = escolher(paleta);
            ctx.globalAlpha = 0.35 + rng() * 0.4;
            ctx.lineWidth = 1 + rng() * 1.6;
            comWrap(t, x, y, 20, (px, py) => {
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.quadraticCurveTo(px + Math.cos(ang) * len * 0.5 + (rng() - 0.5) * 3, py + Math.sin(ang) * len * 0.5,
                    px + Math.cos(ang) * len, py + Math.sin(ang) * len);
                ctx.stroke();
            });
        }
        ctx.globalAlpha = 1;

        // Pontinhos de terra e folhas secas
        for (let i = 0; i < 160; i++) {
            const x = rng() * t, y = rng() * t;
            ctx.fillStyle = escolher(["rgba(130,110,60,0.30)", "rgba(100,85,50,0.25)", "rgba(190,180,90,0.25)"]);
            comWrap(t, x, y, 8, (px, py) => {
                ctx.beginPath();
                ctx.ellipse(px, py, 2 + rng() * 4, 1 + rng() * 2.5, rng() * 3, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }, true);
    texGrama.anisotropicFilteringLevel = 8;
    
    // Garante que o ground tenha um material atribuído antes de aplicar a textura
if (!ground.material) {
        ground.material = new BABYLON.StandardMaterial("matGramaNatureza", scene);
    }

    const matGrama = ground.material;
    matGrama.diffuseTexture = texGrama;
    matGrama.diffuseColor = new BABYLON.Color3(1, 1, 1);
    matGrama.specularColor = BABYLON.Color3.Black();
    texGrama.uScale = 100 / LADO_TEXTURA;
    texGrama.vScale = 100 / LADO_TEXTURA;

    // Plano externo: continua o gramado além do mapa (sem bordas "cortadas")
    {
        const TAM = 200;
        const ext = BABYLON.MeshBuilder.CreateGround("gramaExterna", { width: TAM, height: TAM }, scene);
        ext.position.y = -0.05;
        const uv = ext.getVerticesData(BABYLON.VertexBuffer.UVKind);
        const f = TAM / 150;
        for (let i = 0; i < uv.length; i++) uv[i] *= f;
        ext.setVerticesData(BABYLON.VertexBuffer.UVKind, uv);
        ext.material = matGrama;
        ext.isPickable = false;
    }

    // ==========================================================
    // 2. MATERIAIS E AUXILIARES DE MALHA
    // ==========================================================
    const matVC = new BABYLON.StandardMaterial("matNaturezaVC", scene);
    matVC.diffuseColor = new BABYLON.Color3(1, 1, 1);
    matVC.specularColor = BABYLON.Color3.Black();
    matVC.emissiveColor = new BABYLON.Color3(0.07, 0.09, 0.06);

    // Cor por vértice com gradiente vertical (base mais escura = "oclusão")
    const pintar = (mesh, cor, baixo = 0.7, cima = 1.08) => {
        const pos = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const n = pos.length / 3;
        let min = 1e9, max = -1e9;
        for (let i = 0; i < n; i++) { const y = pos[i * 3 + 1]; if (y < min) min = y; if (y > max) max = y; }
        const span = Math.max(1e-4, max - min);
        const c = hex(cor);
        const arr = new Float32Array(n * 4);
        for (let i = 0; i < n; i++) {
            const s = baixo + (cima - baixo) * ((pos[i * 3 + 1] - min) / span);
            arr[i * 4] = Math.min(1, c.r * s);
            arr[i * 4 + 1] = Math.min(1, c.g * s);
            arr[i * 4 + 2] = Math.min(1, c.b * s);
            arr[i * 4 + 3] = 1;
        }
        mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, arr);
        return mesh;
    };

    const hash3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };

    // Esfera facetada e irregular (copas, arbustos, pedras)
    const blob = (diam, sub, jit, cor, x, y, z, sy = 1, baixo = 0.7, cima = 1.1) => {
        const m = BABYLON.MeshBuilder.CreateIcoSphere("blob", { radius: diam / 2, subdivisions: sub, flat: true }, scene);
        const pos = m.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        for (let i = 0; i < pos.length; i += 3) {
            const f = 1 + (hash3(pos[i], pos[i + 1], pos[i + 2]) - 0.5) * 2 * jit;
            pos[i] *= f; pos[i + 1] *= f; pos[i + 2] *= f;
        }
        m.setVerticesData(BABYLON.VertexBuffer.PositionKind, pos);
        const nor = [];
        BABYLON.VertexData.ComputeNormals(pos, m.getIndices(), nor);
        m.setVerticesData(BABYLON.VertexBuffer.NormalKind, nor);
        m.scaling.y = sy;
        m.position.set(x, y, z);
        return pintar(m, cor, baixo, cima);
    };

    const cil = (o, x, y, z, cor, baixo = 0.75, cima = 1.0) => {
        const m = BABYLON.MeshBuilder.CreateCylinder("cil", o, scene);
        m.position.set(x, y, z);
        return pintar(m, cor, baixo, cima);
    };

    const fundir = (partes, nome) => {
        const m = BABYLON.Mesh.MergeMeshes(partes, true, true);
        m.name = nome;
        m.material = matVC;
        m.isPickable = false;
        return m;
    };

    // Thin instances (matriz + cor) para um conjunto de posições
    const instanciar = (mesh, lista) => {
        if (!lista.length) { mesh.setEnabled(false); return; }
        const buf = new Float32Array(lista.length * 16);
        const cor = new Float32Array(lista.length * 4);
        lista.forEach((it, i) => {
            BABYLON.Matrix.Compose(
                V3(it.sx, it.sy, it.sz),
                BABYLON.Quaternion.FromEulerAngles(it.tilt || 0, it.yaw || 0, 0),
                V3(it.x, it.y, it.z)
            ).copyToArray(buf, i * 16);
            cor[i * 4] = it.c[0]; cor[i * 4 + 1] = it.c[1]; cor[i * 4 + 2] = it.c[2]; cor[i * 4 + 3] = 1;
        });
        mesh.thinInstanceSetBuffer("matrix", buf, 16, true);
        mesh.thinInstanceSetBuffer("color", cor, 4, true);
        mesh.alwaysSelectAsActiveMesh = true;
    };

    const tint = (v = 0.12) => [1 - v + rng() * v * 2, 1 - v + rng() * v * 2, 1 - v * 1.4 + rng() * v * 2];

    // ==========================================================
    // 3. ESPÉCIES DE ÁRVORES
    // ==========================================================
    const criarCarvalho = () => fundir([
        cil({ diameterTop: 0.38, diameterBottom: 0.62, height: 2.4, tessellation: 7 }, 0, 1.2, 0, "#6b4a2f"),
        blob(3.4, 2, 0.12, "#2f8f3a", 0, 3.6, 0, 0.85),
        blob(2.6, 2, 0.14, "#3a9a42", 1.3, 3.1, 0.5, 0.85),
        blob(2.5, 2, 0.14, "#2a8035", -1.2, 3.2, -0.6, 0.85),
        blob(2.2, 2, 0.14, "#43a84a", 0.2, 4.4, -0.2, 0.85),
        blob(2.0, 2, 0.14, "#348c3c", -0.3, 3.0, 1.3, 0.85)
    ], "arvoreCarvalho");

    const criarPinheiro = () => {
        const niveis = [[2.1, 3.0, 1.9], [3.2, 2.5, 1.7], [4.2, 2.0, 1.5], [5.1, 1.4, 1.3], [5.9, 0.8, 1.1]];
        const cores = ["#1f5f35", "#256b3b", "#2b7742", "#2f8247", "#34904f"];
        const partes = [cil({ diameterTop: 0.2, diameterBottom: 0.42, height: 1.7, tessellation: 6 }, 0, 0.85, 0, "#5a3d28")];
        niveis.forEach(([y, d, h], i) => {
            const c = cil({ diameterTop: 0, diameterBottom: d, height: h, tessellation: 8 }, 0, y, 0, cores[i], 0.6, 1.1);
            c.rotation.y = i * 0.7;
            partes.push(c);
        });
        return fundir(partes, "arvorePinheiro");
    };

    const criarPalmeira = () => {
        const partes = [];
        const alturaSeg = 1.05;
        let xAtual = 0;
        for (let i = 0; i < 6; i++) {
            const proximo = 0.12 * (i + 1) * 0.9;
            const tilt = Math.atan((proximo - xAtual) / alturaSeg);
            const seg = cil({ diameterTop: 0.36 - i * 0.025, diameterBottom: 0.42 - i * 0.025, height: 1.15, tessellation: 7 },
                (xAtual + proximo) / 2, 0.55 + i * alturaSeg, 0, i % 2 ? "#7a5a38" : "#8e6d47", 0.85, 1.0);
            seg.rotation.z = -tilt;
            partes.push(seg);
            xAtual = proximo;
        }
        const topoX = xAtual, topoY = 0.55 + 6 * alturaSeg - 0.3;
        for (let i = 0; i < 9; i++) {
            const ang = (i / 9) * Math.PI * 2 + rng() * 0.3;
            const comp = 2.5 + rng() * 0.5, pitch = 0.3 + rng() * 0.35;
            const dx = Math.sin(ang), dz = Math.cos(ang);
            const f = BABYLON.MeshBuilder.CreateSphere("fronde", { diameter: 1, segments: 6 }, scene);
            f.scaling.set(0.4, 0.06, comp);
            f.position.set(topoX + dx * (comp / 2) * Math.cos(pitch), topoY + 0.25 - (comp / 2) * Math.sin(pitch), dz * (comp / 2) * Math.cos(pitch));
            f.rotation.y = ang;
            f.rotation.x = pitch;
            partes.push(pintar(f, escolher(["#3f8f3a", "#4aa044", "#388033"]), 0.8, 1.15));
        }
        for (let i = 0; i < 3; i++) {
            const c = BABYLON.MeshBuilder.CreateSphere("coco", { diameter: 0.3, segments: 5 }, scene);
            c.position.set(topoX + (rng() - 0.5) * 0.5, topoY - 0.1, (rng() - 0.5) * 0.5);
            partes.push(pintar(c, "#5a3d22", 0.8, 1.0));
        }
        return fundir(partes, "arvorePalmeira");
    };

    const criarIpe = (corA, corB, nome) => {
        const ramo = cil({ diameterTop: 0.2, diameterBottom: 0.3, height: 1.4, tessellation: 6 }, 0.4, 2.4, 0, "#5e4630");
        ramo.rotation.z = -0.5;
        return fundir([
            cil({ diameterTop: 0.3, diameterBottom: 0.5, height: 2.0, tessellation: 7 }, 0, 1.0, 0, "#5e4630"),
            ramo,
            blob(2.8, 2, 0.16, corA, 0, 3.4, 0, 0.78),
            blob(2.2, 2, 0.16, corB, 1.2, 3.0, 0.4, 0.78),
            blob(2.0, 2, 0.16, corA, -1.1, 3.1, -0.5, 0.78),
            blob(1.8, 2, 0.16, corB, 0.3, 4.1, 0.3, 0.78),
            blob(1.5, 2, 0.14, "#3a8a3a", 0, 2.6, 0.9, 0.8)
        ], nome);
    };

    const criarArbusto = (florido) => {
        const partes = [
            blob(1.3, 2, 0.16, "#2f7d32", 0, 0.5, 0, 0.8),
            blob(1.0, 2, 0.16, "#3a8c3a", 0.6, 0.4, 0.3, 0.8),
            blob(0.9, 2, 0.16, "#296f2e", -0.5, 0.35, -0.3, 0.8)
        ];
        if (florido) {
            for (let i = 0; i < 9; i++) {
                const ang = rng() * Math.PI * 2, y = 0.3 + rng() * 0.5;
                const p = BABYLON.MeshBuilder.CreateIcoSphere("flor", { radius: 0.09, subdivisions: 1, flat: true }, scene);
                p.position.set(Math.cos(ang) * (0.55 + rng() * 0.2), y, Math.sin(ang) * (0.55 + rng() * 0.2));
                partes.push(pintar(p, escolher(["#f06292", "#ffd54a", "#ff8a65", "#ffffff"]), 1, 1));
            }
        }
        return fundir(partes, florido ? "arbustoFlor" : "arbustoVerde");
    };

    const especies = {
        carvalho:   { mesh: criarCarvalho(),                                   raio: 2.0, lista: [] },
        pinheiro:   { mesh: criarPinheiro(),                                   raio: 1.5, lista: [] },
        palmeira:   { mesh: criarPalmeira(),                                   raio: 1.8, lista: [] },
        ipeAmarelo: { mesh: criarIpe("#f2c200", "#f5d020", "arvoreIpeAmarelo"), raio: 1.8, lista: [] },
        ipeRosa:    { mesh: criarIpe("#e66fa0", "#f08ab8", "arvoreIpeRosa"),    raio: 1.8, lista: [] },
        arbustoV:   { mesh: criarArbusto(false),                               raio: 0.9, lista: [] },
        arbustoF:   { mesh: criarArbusto(true),                                raio: 0.9, lista: [] }
    };

    // ==========================================================
    // 4. DISTRIBUIÇÃO DAS ÁRVORES (por toda a área verde)
    // ==========================================================
    const CEL = 3;
    const grade = new Map();
    const livre = (x, z, r) => {
        const cx = Math.floor(x / CEL), cz = Math.floor(z / CEL);
        for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
            const arr = grade.get((cx + dx) + "," + (cz + dz));
            if (!arr) continue;
            for (const o of arr) if (Math.hypot(o.x - x, o.z - z) < (r + o.r) * 0.78) return false;
        }
        return true;
    };
    const ocupar = (x, z, r) => {
        const k = Math.floor(x / CEL) + "," + Math.floor(z / CEL);
        if (!grade.has(k)) grade.set(k, []);
        grade.get(k).push({ x, z, r });
    };

    const sortear = (pesos) => {
        const total = Object.values(pesos).reduce((a, b) => a + b, 0);
        let r = rng() * total;
        for (const [nome, p] of Object.entries(pesos)) { r -= p; if (r <= 0) return nome; }
        return "carvalho";
    };

    const LIM = 55; // mata externa vai até ±115
    let totalArvores = 0;
    for (let tentativa = 0; tentativa < 16000 && totalArvores < 900; tentativa++) {
        const x = (rng() * 2 - 1) * LIM;
        const z = (rng() * 2 - 1) * LIM;
        const dentro = Math.abs(x) <= 75 && Math.abs(z) <= 75;

        if (proibido(x, z, 1.0)) continue;                    // tronco fora do rio/rua/cidade
        const dETA = distAteETA(x, z);
        if (dETA < 3.5) continue;                             // folga em volta dos muros da ETA

        const n = fbm(x * 0.045 + 10, z * 0.045 - 4);
        const bosque = suave((n - 0.48) / 0.2);                // 0 = campo, 1 = bosque
        let dens = 0.2 + 0.8 * bosque;
        if (dETA < 16) dens *= 0.35 + 0.65 * ((dETA - 3.5) / 12.5);   // área da ETA mais limpa
        if (!dentro) dens = 0.35 + 0.65 * bosque;                      // mata externa mais densa
        if (rng() > dens) continue;

        const db = distBanco(x);
        let pesos;
        if (db > 0 && db < 7 && dentro) {
            pesos = { palmeira: 0.14, carvalho: 0.24, ipeAmarelo: 0.08, ipeRosa: 0.06, pinheiro: 0.06 };
        } else if (bosque > 0.55) {
            pesos = { pinheiro: 0.36, carvalho: 0.36, ipeAmarelo: 0.05, ipeRosa: 0.04, palmeira: 0.04 };
        } else {
            pesos = { carvalho: 0.28, ipeAmarelo: 0.14, ipeRosa: 0.12, palmeira: 0.16, pinheiro: 0.14 };
        }
        const nome = sortear(pesos);
        const esp = especies[nome];
        const escala = (dETA < 16 ? entre(0.7, 1.0) : entre(0.85, 1.4)) * (nome === "palmeira" ? entre(0.9, 1.15) : 1);
        if (!livre(x, z, esp.raio * escala)) continue;

        ocupar(x, z, esp.raio * escala);
        esp.lista.push({
            x, y: 0.01, z,
            sx: escala * entre(0.9, 1.1), sy: escala * entre(0.9, 1.2), sz: escala * entre(0.9, 1.1),
            yaw: rng() * Math.PI * 2,
            tilt: nome === "palmeira" ? (rng() - 0.5) * 0.08 : 0,
            c: tint(nome === "ipeAmarelo" || nome === "ipeRosa" ? 0.06 : 0.12)
        });
        totalArvores++;
    }

    // Arbustos em volta das árvores e soltos pelo campo
    for (let tentativa = 0; tentativa < 2200; tentativa++) {
        const x = (rng() * 2 - 1) * LIM, z = (rng() * 2 - 1) * LIM;
        if (proibido(x, z, 0.6) || distAteETA(x, z) < 2.5) continue;
        const n = fbm(x * 0.06 + 3, z * 0.06 + 9);
        if (rng() > 0.1 + 0.55 * suave((n - 0.35) / 0.3)) continue;
        const florido = rng() < 0.3;
        const esp = florido ? especies.arbustoF : especies.arbustoV;
        const esc = entre(0.7, 1.4);
        if (!livre(x, z, esp.raio * esc * 0.7)) continue;
        ocupar(x, z, esp.raio * esc * 0.7);
        esp.lista.push({ x, y: 0.01, z, sx: esc, sy: esc * entre(0.85, 1.15), sz: esc, yaw: rng() * 6.28, c: tint(0.14) });
    }

    Object.values(especies).forEach(e => instanciar(e.mesh, e.lista));

    // ==========================================================
    // 5. TUFOS DE GRAMA 3D (cobrem todo o gramado)
    // ==========================================================
    const texTufo = criarTextura("texTufo", 128, 128, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < 24; i++) {
            const bx = 8 + rng() * 112, altura = 50 + rng() * 74, largura = 4 + rng() * 6, inclin = (rng() - 0.5) * 40;
            const g = ctx.createLinearGradient(0, h, 0, h - altura);
            g.addColorStop(0, "#2d6a26");
            g.addColorStop(1, escolher(["#9acd5a", "#7cb848", "#b6d46a", "#6fae44"]));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(bx - largura / 2, h);
            ctx.quadraticCurveTo(bx + inclin * 0.3 - largura / 4, h - altura * 0.5, bx + inclin, h - altura);
            ctx.quadraticCurveTo(bx + inclin * 0.3 + largura / 4, h - altura * 0.5, bx + largura / 2, h);
            ctx.fill();
        }
    }, false, false);
    texTufo.hasAlpha = true;

    const matAlfa = (nome, tex, emis) => {
        const m = new BABYLON.StandardMaterial(nome, scene);
        m.diffuseTexture = tex;
        m.useAlphaFromDiffuseTexture = true;
        m.transparencyMode = BABYLON.Material.MATERIAL_ALPHATEST;
        m.alphaCutOff = 0.4;
        m.backFaceCulling = false;
        m.twoSidedLighting = true;
        m.specularColor = BABYLON.Color3.Black();
        m.emissiveColor = emis;
        return m;
    };

    const planosCruzados = (nome, largura, altura, qtd) => {
        const ps = [];
        for (let i = 0; i < qtd; i++) {
            const p = BABYLON.MeshBuilder.CreatePlane(nome + i, { width: largura, height: altura }, scene);
            p.position.y = altura / 2;
            p.rotation.y = (i * Math.PI) / qtd;
            ps.push(p);
        }
        const m = BABYLON.Mesh.MergeMeshes(ps, true, true);
        m.name = nome;
        m.isPickable = false;
        return m;
    };

    const tufoMesh = planosCruzados("tufoGrama", 1, 1, 3);
    tufoMesh.material = matAlfa("matTufo", texTufo, new BABYLON.Color3(0.10, 0.16, 0.07));

    const tufos = [];
    for (let i = 0; i < 2000 && tufos.length < 1125; i++) {
        const x = (rng() * 2 - 1) * 75, z = (rng() * 2 - 1) * 75;
        if (proibido(x, z, 0) || distAteETA(x, z) < 0.3) continue;
        const l = entre(0.7, 1.4), a = entre(0.35, 0.8);
        const verde = 0.85 + rng() * 0.3;
        tufos.push({ x, y: 0.01, z, sx: l, sy: a, sz: l, yaw: rng() * 6.28, c: [verde * (0.9 + rng() * 0.25), verde, verde * 0.85] });
    }
    instanciar(tufoMesh, tufos);

    // ==========================================================
    // 6. FLORES (em canteiros naturais)
    // ==========================================================
    const texFlor = criarTextura("texFlor", 64, 96, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = "#3f8a32"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(32, 96); ctx.quadraticCurveTo(28, 64, 32, 34); ctx.stroke();
        ctx.fillStyle = "#4aa044";
        ctx.beginPath(); ctx.ellipse(22, 70, 10, 4, -0.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(42, 62, 10, 4, 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            ctx.beginPath(); ctx.arc(32 + Math.cos(a) * 11, 26 + Math.sin(a) * 11, 8, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = "#ffcc33";
        ctx.beginPath(); ctx.arc(32, 26, 6, 0, Math.PI * 2); ctx.fill();
    }, false, false);
    texFlor.hasAlpha = true;

    const floresMesh = planosCruzados("flores", 0.5, 0.75, 2);
    floresMesh.material = matAlfa("matFlores", texFlor, new BABYLON.Color3(0.18, 0.18, 0.18));

    const coresFlor = [[1, 1, 1], [1, 0.85, 0.2], [0.95, 0.4, 0.62], [0.72, 0.52, 0.96], [1, 0.52, 0.28]];
    const flores = [];
    for (let c = 0; c < 26; c++) {
        const cx = (rng() * 2 - 1) * 72, cz = (rng() * 2 - 1) * 40;
        if (proibido(cx, cz, 2) || distAteETA(cx, cz) < 3) continue;
        const cor = escolher(coresFlor), raio = entre(2.2, 4.5), qtd = 5 + Math.floor(rng() * 5);
        for (let i = 0; i < qtd; i++) {
            const ang = rng() * 6.28, r = Math.sqrt(rng()) * raio;
            const x = cx + Math.cos(ang) * r, z = cz + Math.sin(ang) * r;
            if (proibido(x, z, 0.3) || distAteETA(x, z) < 1) continue;
            const s = entre(0.8, 1.3);
            flores.push({ x, y: 0.01, z, sx: s, sy: s, sz: s, yaw: rng() * 6.28, c: rng() < 0.2 ? escolher(coresFlor) : cor });
        }
    }
    instanciar(floresMesh, flores);

    // ==========================================================
    // 7. JUNCOS NAS MARGENS DO RIO
    // ==========================================================
    const texJunco = criarTextura("texJunco", 64, 256, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < 7; i++) {
            const bx = 8 + rng() * 48, topo = 20 + rng() * 80, inc = (rng() - 0.5) * 14;
            ctx.strokeStyle = escolher(["#4f8a3a", "#5e9a42", "#437a33"]);
            ctx.lineWidth = 3 + rng() * 2;
            ctx.beginPath(); ctx.moveTo(bx, h); ctx.quadraticCurveTo(bx + inc * 0.4, h * 0.55, bx + inc, topo); ctx.stroke();
            if (rng() > 0.45) {
                ctx.fillStyle = "#6b4426";
                ctx.beginPath(); ctx.ellipse(bx + inc, topo + 12, 4.5, 14, 0, 0, Math.PI * 2); ctx.fill();
            }
        }
    }, false, false);
    texJunco.hasAlpha = true;

    const juncoMesh = planosCruzados("juncos", 0.9, 2.2, 2);
    juncoMesh.material = matAlfa("matJuncos", texJunco, new BABYLON.Color3(0.12, 0.16, 0.08));

    const juncos = [];
    for (let i = 0; i < 1400 && juncos.length < 380; i++) {
        const z = entre(-50, 75);
        const lado = rng() < 0.5 ? 0 : 1;
        if (lado === 0 && z > -13 && z < 13) continue;                 // não invade a ETA
        if (vnoise(z * 0.25 + lado * 7, lado * 3.1) < 0.4) continue;    // formam moitas
        const x = lado === 0 ? entre(16.0, 17.3) : entre(33.5, 34.8);
        const s = entre(0.7, 1.3);
        juncos.push({ x, y: 0.02, z, sx: s, sy: s * entre(0.8, 1.2), sz: s, yaw: rng() * 6.28, c: tint(0.1) });
    }
    instanciar(juncoMesh, juncos);

    // ==========================================================
    // 8. PEDRAS
    // ==========================================================
    const pedraMesh = fundir([blob(1, 1, 0.28, "#8c9096", 0, 0, 0, 0.7, 0.75, 1.1)], "pedras");
    const pedras = [];
    const novaPedra = (x, z, escala) => pedras.push({
        x, y: 0.01 + 0.12 * escala, z,
        sx: escala * entre(0.8, 1.5), sy: escala * entre(0.5, 0.9), sz: escala * entre(0.8, 1.4),
        yaw: rng() * 6.28, c: [0.8 + rng() * 0.3, 0.8 + rng() * 0.3, 0.8 + rng() * 0.28]
    });
    for (let i = 0; i < 3000 && pedras.length < 45; i++) {
        const x = (rng() * 2 - 1) * 74, z = (rng() * 2 - 1) * 74;
        if (proibido(x, z, 0.8) || distAteETA(x, z) < 2.5) continue;
        novaPedra(x, z, entre(0.5, 1.2));
    }
    for (let i = 0; i < 60; i++) {                                 // pedras junto ao rio
        const z = entre(-50, 75);
        const lado = rng() < 0.5 ? 0 : 1;
        if (lado === 0 && z > -13 && z < 13) continue;
        novaPedra(lado === 0 ? entre(15.5, 16.7) : entre(34.0, 35.2), z, entre(0.4, 0.9));
    }
    instanciar(pedraMesh, pedras);

    console.info(`[natureza] árvores: ${totalArvores}, tufos: ${tufos.length}, flores: ${flores.length}, juncos: ${juncos.length}, pedras: ${pedras.length}`);
}