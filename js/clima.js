import { registerGameAnimation, getDataAtual, getDiasDecorridos } from './tempo.js';
import { exibirPopUpAviso } from './condicoes.js';

// ==========================================================
// CONFIGURAÇÃO DOS EVENTOS CLIMÁTICOS
// ==========================================================
export const EVENTOS_CLIMATICOS = {
    normal: {
        id: "normal",
        nome: "Clima Ameno & Normal",
        icone: "🌤️",
        multiplicadorVazaoBombas: 1.0,
        multiplicadorDemanda: 1.0,
        multiplicadorConsumoEnergia: 1.0,
        efeitoTexto: "Operação estável",
        detalhe: "Semana com temperaturas amenas. A captação do rio e a demanda de água da população permanecem nos níveis normais de operação."
    },
    onda_calor: {
        id: "onda_calor",
        nome: "Onda de Calor Repentina",
        icone: "🔥",
        multiplicadorVazaoBombas: 1.0,
        multiplicadorDemanda: 1.25,
        multiplicadorConsumoEnergia: 1.0,
        efeitoTexto: "Demanda de água +25%",
        detalhe: "Temperaturas extremas atingem a região. O consumo de água pelas residências e comércios subirá em 25% durante o pico de calor!"
    },
    chuva_forte: {
        id: "chuva_forte",
        nome: "Chuva Forte & Temporal",
        icone: "🌧️",
        multiplicadorVazaoBombas: 1.0,
        multiplicadorDemanda: 1.0,
        multiplicadorConsumoEnergia: 1.50,
        efeitoTexto: "+50% no custo de manutenção por hora de chuva",
        detalhe: "Fortes tempestades trazem detritos para a calha do rio. O desgaste nas bombas exige um custo adicional de +50% de manutenção por hora de chuva."
    },
    seca_severa: {
        id: "seca_severa",
        nome: "Seca Severa & Estiagem",
        icone: "🌵",
        multiplicadorVazaoBombas: 0.70,
        multiplicadorDemanda: 1.0,
        multiplicadorConsumoEnergia: 1.0,
        efeitoTexto: "Captação reduzida em -30%",
        detalhe: "A estiagem prolongada reduziu drasticamente o nível do rio Piracicaba. A capacidade de captação das bombas é reduzida em 30%."
    }
};

let eventoClimaticoAtual = EVENTOS_CLIMATICOS.normal;
let climaSorteadoProximaSemana = EVENTOS_CLIMATICOS.normal;
let proximoClimaAgendadoDev = null;

let ultimaSegundaIniciada = -1;
let ultimoDomingoEncerrado = -1;
let ultimaHoraRegistrada = -1;

let eventoAtivoNoMomento = false;
let probabilidadeInicio = 0; 
let probabilidadeFim = 0;    

let sistemaChuva = null;
let overlaySecaHTML = null;
let grupoOndas3D = null;
let ondas3DMeshes = [];
let animandoCalor3D = false;


// ==========================================================
// CONSULTA DE CLIMA (AJUSTADO PARA EVENTOS ATIVOS)
// ==========================================================

// Retorna o efeito do clima APENAS se o evento estiver acontecendo no momento
export function getEventoClimaticoAtual() { 
    return eventoAtivoNoMomento ? eventoClimaticoAtual : EVENTOS_CLIMATICOS.normal; 
}

// Retorna o clima sorteado para a semana (utilizado para previsões no jornal/relatório)
export function getEventoSorteadoSemana() { 
    return eventoClimaticoAtual; 
}

export function setProximoClima(idClima) {
    if (EVENTOS_CLIMATICOS[idClima]) {
        proximoClimaAgendadoDev = EVENTOS_CLIMATICOS[idClima];
    }
}

// ==========================================================
// SISTEMA E CICLO DE CLIMA
// ==========================================================
export function setupSistemaClima(scene) {
    criarOverlaySecaHTML();
    criarEfeitosParticulas(scene);
    criarOndasCalor3D(scene);

    registerGameAnimation(scene, (dt) => {
        const data = getDataAtual();
        const diasDecorridos = getDiasDecorridos(data);
        const diaDaSemana = data.getDay(); // 0 = Domingo, 1 = Segunda
        const horaAtual = data.getHours();

        if (horaAtual !== ultimaHoraRegistrada) {
            ultimaHoraRegistrada = horaAtual;

            // 1. INÍCIO DA SEMANA (Segunda-Feira 00:00)
            if (diaDaSemana === 1 && horaAtual === 0 && ultimaSegundaIniciada !== diasDecorridos) {
                ultimaSegundaIniciada = diasDecorridos;
                
                sortearClimaProximaSemana();
                eventoClimaticoAtual = climaSorteadoProximaSemana;
                
                eventoAtivoNoMomento = false;
                probabilidadeInicio = 0;
                probabilidadeFim = 0;

                aplicarEfeitosVisuaisClima(scene, EVENTOS_CLIMATICOS.normal.id);
            }
            
            // 2. ENCERRAMENTO FORÇADO DA SEMANA (Domingo 23:00)
            if (diaDaSemana === 0 && horaAtual === 23 && ultimoDomingoEncerrado !== diasDecorridos) {
                ultimoDomingoEncerrado = diasDecorridos;

                if (eventoAtivoNoMomento) {
                    exibirPopUpAviso(`🌤️ O evento climático da semana se encerrou definitivamente.`);
                    eventoAtivoNoMomento = false;
                    aplicarEfeitosVisuaisClima(scene, EVENTOS_CLIMATICOS.normal.id);
                }
                
                eventoClimaticoAtual = EVENTOS_CLIMATICOS.normal; 
                probabilidadeInicio = 0;
                probabilidadeFim = 0;
            } else {
                // 3. LOOP NORMAL DE PROBABILIDADES POR HORA
                processarCicloHoraClima(scene);
            }
        }

        if (animandoCalor3D) {
            atualizarOndasCalor3D(dt);
        }
    });

    aplicarEfeitosVisuaisClima(scene, EVENTOS_CLIMATICOS.normal.id);
}

function sortearClimaProximaSemana() {
    if (proximoClimaAgendadoDev) {
        climaSorteadoProximaSemana = proximoClimaAgendadoDev;
        proximoClimaAgendadoDev = null;
    } else {
        const sorteio = Math.random() * 100;
        if (sorteio < 60) climaSorteadoProximaSemana = EVENTOS_CLIMATICOS.normal;
        else if (sorteio < 75) climaSorteadoProximaSemana = EVENTOS_CLIMATICOS.chuva_forte;
        else if (sorteio < 90) climaSorteadoProximaSemana = EVENTOS_CLIMATICOS.onda_calor;
        else climaSorteadoProximaSemana = EVENTOS_CLIMATICOS.seca_severa;
    }
}

function processarCicloHoraClima(scene) {
    if (eventoClimaticoAtual.id === "normal") return;

    if (!eventoAtivoNoMomento) {
        probabilidadeInicio += 1;
        
        if (Math.random() * 100 < probabilidadeInicio) {
            eventoAtivoNoMomento = true;
            probabilidadeInicio = 0; 
            probabilidadeFim = 0;
            aplicarEfeitosVisuaisClima(scene, eventoClimaticoAtual.id);
            exibirPopUpAviso(`⚠️ Evento climático iniciado: ${eventoClimaticoAtual.nome}! (${eventoClimaticoAtual.efeitoTexto})`);
        }
    } else {
        if (eventoClimaticoAtual.id === "chuva_forte") {
            window.dispatchEvent(new CustomEvent("DANO_CHUVA"));
        }

        probabilidadeFim += 1;
        
        if (Math.random() * 100 < probabilidadeFim) {
            eventoAtivoNoMomento = false;
            probabilidadeInicio = 0; 
            probabilidadeFim = 0; 
            aplicarEfeitosVisuaisClima(scene, EVENTOS_CLIMATICOS.normal.id);
            exibirPopUpAviso(`🌤️ O evento climático (${eventoClimaticoAtual.nome}) deu uma trégua.`);
        }
    }
}

// ==========================================================
// EFEITOS VISUAIS DE CLIMA
// ==========================================================
function criarOverlaySecaHTML() {
    if (document.getElementById("overlay-clima-seca")) return;
    overlaySecaHTML = document.createElement("div");
    overlaySecaHTML.id = "overlay-clima-seca";
    overlaySecaHTML.style.position = "fixed";
    overlaySecaHTML.style.top = "0"; overlaySecaHTML.style.left = "0";
    overlaySecaHTML.style.width = "100vw"; overlaySecaHTML.style.height = "100vh";
    overlaySecaHTML.style.backgroundColor = "rgba(234, 88, 12, 0.16)";
    overlaySecaHTML.style.mixBlendMode = "color-burn";
    overlaySecaHTML.style.pointerEvents = "none";
    overlaySecaHTML.style.zIndex = "5";
    overlaySecaHTML.style.transition = "opacity 1.5s ease-in-out";
    overlaySecaHTML.style.opacity = "0";
    document.body.appendChild(overlaySecaHTML);
}

function criarOndasCalor3D(scene) {
    if (grupoOndas3D) return;
    grupoOndas3D = new BABYLON.TransformNode("grupoOndasCalor3D", scene);

    const qtdOndas = 40;
    for (let i = 0; i < qtdOndas; i++) {
        const passos = 30;
        const comprimento = 14 + Math.random() * 12;
        const amplitude = 0.4 + Math.random() * 0.3;
        const points = [];
        for (let p = 0; p <= passos; p++) {
            points.push(new BABYLON.Vector3((p / passos) * comprimento, Math.sin(p * 0.5) * amplitude, 0));
        }

        const linha = BABYLON.MeshBuilder.CreateLines(`onda3D_${i}`, { points: points, updatable: true }, scene);
        linha.color = BABYLON.Color3.FromHexString("#ef4444");
        linha.alpha = 0.75;
        linha.isPickable = false;
        linha.parent = grupoOndas3D;

        linha.position.set(-110 + Math.random() * 220, 0.5 + Math.random() * 5.5, -110 + Math.random() * 220);
        linha.rotation.y = (Math.random() - 0.5) * 0.5;

        ondas3DMeshes.push({
            mesh: linha, comprimento: comprimento, amplitude: amplitude,
            velocidadeX: 4.0 + Math.random() * 3.0, fase: Math.random() * Math.PI * 2,
            passos: passos, xMin: -110, xMax: 110
        });
    }
    grupoOndas3D.setEnabled(false);
}

function atualizarOndasCalor3D(dt) {
    ondas3DMeshes.forEach(o => {
        o.mesh.position.x += o.velocidadeX * dt;
        if (o.mesh.position.x > o.xMax) {
            o.mesh.position.x = o.xMin;
            o.mesh.position.z = -110 + Math.random() * 220;
            o.mesh.position.y = 0.5 + Math.random() * 5.5;
        }
        o.fase += dt * 4.0;
        const novosPontos = [];
        for (let p = 0; p <= o.passos; p++) {
            novosPontos.push(new BABYLON.Vector3((p / o.passos) * o.comprimento, Math.sin(p * 0.5 + o.fase) * o.amplitude, 0));
        }
        BABYLON.MeshBuilder.CreateLines(null, { points: novosPontos, instance: o.mesh });
    });
}

function criarEfeitosParticulas(scene) {
    sistemaChuva = new BABYLON.ParticleSystem("chuvaParticulas", 3500, scene);
    const texChuva = new BABYLON.DynamicTexture("texChuvaDrop", { width: 16, height: 64 }, scene, false);
    const ctxC = texChuva.getContext();
    const gradC = ctxC.createLinearGradient(8, 0, 8, 64);
    gradC.addColorStop(0, "rgba(255, 255, 255, 0)");
    gradC.addColorStop(0.8, "rgba(200, 230, 255, 0.8)");
    gradC.addColorStop(1, "rgba(255, 255, 255, 0.95)");
    ctxC.fillStyle = gradC;
    ctxC.fillRect(0, 0, 16, 64);
    texChuva.update();
    texChuva.hasAlpha = true;

    sistemaChuva.particleTexture = texChuva;
    sistemaChuva.emitter = new BABYLON.Vector3(0, 32, 0);
    sistemaChuva.minEmitBox = new BABYLON.Vector3(-120, 0, -120);
    sistemaChuva.maxEmitBox = new BABYLON.Vector3(120, 0, 120);
    sistemaChuva.direction1 = new BABYLON.Vector3(-0.5, -30, -0.5);
    sistemaChuva.direction2 = new BABYLON.Vector3(-1.2, -34, -1.2);
    sistemaChuva.minEmitPower = 0.9;
    sistemaChuva.maxEmitPower = 1.4;
    sistemaChuva.minSize = 0.15;
    sistemaChuva.maxSize = 0.35;
    sistemaChuva.minScaleY = 5.0;
    sistemaChuva.maxScaleY = 9.0;
    sistemaChuva.minLifeTime = 0.8;
    sistemaChuva.maxLifeTime = 1.4;
    sistemaChuva.emitRate = 2400;
    sistemaChuva.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
}

function aplicarEfeitosVisuaisClima(scene, idClima) {
    const luzSol = scene.getLightByName("luzSol") || scene.lights[0];
    const luzHemi = scene.getLightByName("luzHemi") || scene.lights[1];

    if (overlaySecaHTML) overlaySecaHTML.style.opacity = "0";

    if (idClima === "chuva_forte") {
        if (sistemaChuva) sistemaChuva.start();
        animandoCalor3D = false;
        if (grupoOndas3D) grupoOndas3D.setEnabled(false);
        if (luzSol) luzSol.diffuse = BABYLON.Color3.FromHexString("#64748b");
        if (luzHemi) luzHemi.diffuse = BABYLON.Color3.FromHexString("#475569");
        scene.clearColor = new BABYLON.Color4(0.2, 0.23, 0.28, 1.0);
    } 
    else if (idClima === "onda_calor") {
        if (sistemaChuva) sistemaChuva.stop();
        animandoCalor3D = true;
        if (grupoOndas3D) grupoOndas3D.setEnabled(true);
        if (luzSol) luzSol.diffuse = BABYLON.Color3.FromHexString("#fef08a");
        if (luzHemi) luzHemi.diffuse = BABYLON.Color3.FromHexString("#fde047");
        scene.clearColor = new BABYLON.Color4(0.5, 0.6, 0.75, 1.0);
    } 
    else if (idClima === "seca_severa") {
        if (sistemaChuva) sistemaChuva.stop();
        animandoCalor3D = true;
        if (grupoOndas3D) grupoOndas3D.setEnabled(true);
        if (overlaySecaHTML) overlaySecaHTML.style.opacity = "1";
        if (luzSol) luzSol.diffuse = BABYLON.Color3.FromHexString("#fdba74");
        if (luzHemi) luzHemi.diffuse = BABYLON.Color3.FromHexString("#fb923c");
        scene.clearColor = new BABYLON.Color4(0.55, 0.45, 0.35, 1.0);
    } 
    else {
        if (sistemaChuva) sistemaChuva.stop();
        animandoCalor3D = false;
        if (grupoOndas3D) grupoOndas3D.setEnabled(false);
        if (luzSol) luzSol.diffuse = BABYLON.Color3.FromHexString("#ffffff");
        if (luzHemi) luzHemi.diffuse = BABYLON.Color3.FromHexString("#ffffff");
        scene.clearColor = new BABYLON.Color4(0.5, 0.7, 0.9, 1.0);
    }
}