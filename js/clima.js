import { registerGameAnimation, getDataAtual } from './tempo.js';
import { exibirPopUpAviso } from './condicoes.js';

// ==========================================================
// CONFIGURAÇÃO DOS EVENTOS CLIMÁTICOS E CHANCES
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
        detalhe: "Semana sem grandes alterações climáticas. Captação e demanda operando no padrão."
    },
    onda_calor: {
        id: "onda_calor",
        nome: "Onda de Calor Repentina",
        icone: "🔥",
        multiplicadorVazaoBombas: 1.0,
        multiplicadorDemanda: 1.25,
        multiplicadorConsumoEnergia: 1.0,
        efeitoTexto: "Demanda de água +25%",
        detalhe: "Temperaturas extremas farão a população consumir mais água. Suas metas de abastecimento subiram em 25%!"
    },
    chuva_forte: {
        id: "chuva_forte",
        nome: "Chuva Forte & Temporal",
        icone: "🌧️",
        multiplicadorVazaoBombas: 1.0,
        multiplicadorDemanda: 1.0,
        multiplicadorConsumoEnergia: 1.50, // +50% de gasto de energia
        efeitoTexto: "Tratamento difícil (Custo e Energia +50%)",
        detalhe: "A turbidez e lama no rio exigem mais produtos químicos e força dos filtros, aumentando os custos de tratamento."
    },
    seca_severa: {
        id: "seca_severa",
        nome: "Seca Severa & Estiagem",
        icone: "🌵",
        multiplicadorVazaoBombas: 0.70, // -30% na captação
        multiplicadorDemanda: 1.0,
        multiplicadorConsumoEnergia: 1.0,
        efeitoTexto: "Captação reduzida em -30%",
        detalhe: "A estiagem prolongada baixou o nível do rio. A vazão de captação das bombas d'água caiu em 30%!"
    }
};

let eventoSorteadoSemana = EVENTOS_CLIMATICOS.normal;
let eventoClimaticoAtual = EVENTOS_CLIMATICOS.normal;

let proximoClimaAgendadoDev = null;
let ultimaSemanaRegistrada = -1;
let ultimaHoraRegistrada = -1;

// Controle de Probabilidade do Evento Geral (+3% por hora)
let eventoAtivoNoMomento = false;
let probabilidadeInicio = 0; 
let probabilidadeFim = 0;    

// Elementos Visuais
let sistemaChuva = null;
let overlaySecaHTML = null;
let grupoOndas3D = null;
let ondas3DMeshes = [];
let animandoCalor3D = false;

export function getEventoClimaticoAtual() {
    return eventoClimaticoAtual;
}

export function getEventoSorteadoSemana() {
    return eventoSorteadoSemana;
}

export function setProximoClima(idClima) {
    if (EVENTOS_CLIMATICOS[idClima]) {
        proximoClimaAgendadoDev = EVENTOS_CLIMATICOS[idClima];
        console.log(`[CLIMA DEV] Clima forçado para a próxima semana: ${proximoClimaAgendadoDev.nome}`);
    }
}

export function setupSistemaClima(scene) {
    criarOverlaySecaHTML();
    criarEfeitosParticulas(scene);
    criarOndasCalor3D(scene);

    registerGameAnimation(scene, (dt) => {
        const data = getDataAtual();
        const diasTotais = Math.floor(data.getTime() / (1000 * 60 * 60 * 24));
        const semanaAtual = Math.floor(diasTotais / 7);
        const horaAtual = data.getHours();

        if (ultimaSemanaRegistrada !== -1 && semanaAtual > ultimaSemanaRegistrada) {
            sortearClimaSemanal();
        }
        ultimaSemanaRegistrada = semanaAtual;

        if (horaAtual !== ultimaHoraRegistrada) {
            ultimaHoraRegistrada = horaAtual;
            processarCicloHoraClima(scene, diasTotais, horaAtual);
        }

        if (animandoCalor3D) {
            atualizarOndasCalor3D(dt);
        }
    });

    aplicarEfeitosVisuaisClima(scene, eventoClimaticoAtual.id);
}

function sortearClimaSemanal() {
    if (proximoClimaAgendadoDev) {
        eventoSorteadoSemana = proximoClimaAgendadoDev;
        proximoClimaAgendadoDev = null;
    } else {
        const sorteio = Math.random() * 100;

        if (sorteio < 60) {
            eventoSorteadoSemana = EVENTOS_CLIMATICOS.normal;
        } else if (sorteio < 75) {
            eventoSorteadoSemana = EVENTOS_CLIMATICOS.chuva_forte;
        } else if (sorteio < 90) {
            eventoSorteadoSemana = EVENTOS_CLIMATICOS.onda_calor;
        } else {
            eventoSorteadoSemana = EVENTOS_CLIMATICOS.seca_severa;
        }
    }

    eventoAtivoNoMomento = false;
    probabilidadeInicio = 0;
    probabilidadeFim = 0;

    console.log(`[CLIMA] Sorteio semanal concluído: ${eventoSorteadoSemana.nome}`);
}

function processarCicloHoraClima(scene, diasTotais, horaAtual) {
    const diaDaSemana = diasTotais % 7;

    if (diaDaSemana === 6 && horaAtual >= 20) {
        if (eventoAtivoNoMomento) {
            desativarEventoAtivo(scene);
            exibirPopUpAviso(`🌤️ O evento ${eventoSorteadoSemana.nome} encerrou para a virada da semana.`);
        }
        return;
    }

    if (eventoSorteadoSemana.id === "normal") {
        if (eventoAtivoNoMomento) {
            desativarEventoAtivo(scene);
        }
        return;
    }

    // FASE A: EVENTO INATIVO (+3% POR HORA)
    if (!eventoAtivoNoMomento) {
        probabilidadeInicio = Math.min(100, probabilidadeInicio + 3);
        const rollInicio = Math.random() * 100;

        if (rollInicio < probabilidadeInicio) {
            eventoAtivoNoMomento = true;
            probabilidadeFim = 0;
            eventoClimaticoAtual = eventoSorteadoSemana;

            aplicarEfeitosVisuaisClima(scene, eventoClimaticoAtual.id);
            exibirPopUpAviso(`${eventoClimaticoAtual.icone} Atenção: ${eventoClimaticoAtual.nome} começou! (${eventoClimaticoAtual.efeitoTexto})`);
            console.log(`[CLIMA] Evento ${eventoClimaticoAtual.nome} iniciado!`);
        }
    } 
    // FASE B: EVENTO ATIVO (+3% POR HORA PARA TERMINAR)
    else {
        probabilidadeFim = Math.min(100, probabilidadeFim + 3);
        const rollFim = Math.random() * 100;

        if (rollFim < probabilidadeFim) {
            desativarEventoAtivo(scene);
            exibirPopUpAviso(`🌤️ O evento ${eventoSorteadoSemana.nome} passou. Clima normalizado.`);
        }
    }
}

function desativarEventoAtivo(scene) {
    eventoAtivoNoMomento = false;
    eventoClimaticoAtual = EVENTOS_CLIMATICOS.normal;
    probabilidadeInicio = 0;
    aplicarEfeitosVisuaisClima(scene, EVENTOS_CLIMATICOS.normal.id);
}

// ==========================================================
// EFEITOS VISUAIS
// ==========================================================
function criarOverlaySecaHTML() {
    if (document.getElementById("overlay-clima-seca")) return;

    overlaySecaHTML = document.createElement("div");
    overlaySecaHTML.id = "overlay-clima-seca";
    overlaySecaHTML.style.position = "fixed";
    overlaySecaHTML.style.top = "0";
    overlaySecaHTML.style.left = "0";
    overlaySecaHTML.style.width = "100vw";
    overlaySecaHTML.style.height = "100vh";
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

    const qtdOndas = 14;
    for (let i = 0; i < qtdOndas; i++) {
        const passos = 25;
        const comprimento = 10 + Math.random() * 8;
        const amplitude = 0.35 + Math.random() * 0.25;

        const points = [];
        for (let p = 0; p <= passos; p++) {
            const x = (p / passos) * comprimento;
            const y = Math.sin(p * 0.5) * amplitude;
            points.push(new BABYLON.Vector3(x, y, 0));
        }

        const linha = BABYLON.MeshBuilder.CreateLines(`onda3D_${i}`, {
            points: points,
            updatable: true
        }, scene);

        linha.color = BABYLON.Color3.FromHexString("#ef4444");
        linha.alpha = 0.75;
        linha.isPickable = false;
        linha.parent = grupoOndas3D;

        const posX = -20 + Math.random() * 35;
        const posY = 0.6 + Math.random() * 2.8;
        const posZ = -22 + Math.random() * 44;

        linha.position.set(posX, posY, posZ);
        linha.rotation.y = (Math.random() - 0.5) * 0.4;

        ondas3DMeshes.push({
            mesh: linha,
            comprimento: comprimento,
            amplitude: amplitude,
            velocidadeX: 3.5 + Math.random() * 2.5,
            fase: Math.random() * Math.PI * 2,
            passos: passos,
            xMin: -25,
            xMax: 25,
            yBase: posY,
            zBase: posZ
        });
    }

    grupoOndas3D.setEnabled(false);
}

function atualizarOndasCalor3D(dt) {
    ondas3DMeshes.forEach(o => {
        o.mesh.position.x += o.velocidadeX * dt;
        if (o.mesh.position.x > o.xMax) {
            o.mesh.position.x = o.xMin;
            o.mesh.position.z = -22 + Math.random() * 44;
            o.mesh.position.y = 0.6 + Math.random() * 2.8;
        }

        o.fase += dt * 4.0;
        const novosPontos = [];
        for (let p = 0; p <= o.passos; p++) {
            const x = (p / o.passos) * o.comprimento;
            const y = Math.sin(p * 0.5 + o.fase) * o.amplitude;
            novosPontos.push(new BABYLON.Vector3(x, y, 0));
        }

        BABYLON.MeshBuilder.CreateLines(null, {
            points: novosPontos,
            instance: o.mesh
        });
    });
}

function criarEfeitosParticulas(scene) {
    sistemaChuva = new BABYLON.ParticleSystem("chuvaParticulas", 1200, scene);
    
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
    sistemaChuva.emitter = new BABYLON.Vector3(5, 22, 0);
    sistemaChuva.minEmitBox = new BABYLON.Vector3(-35, 0, -35);
    sistemaChuva.maxEmitBox = new BABYLON.Vector3(35, 0, 35);
    
    sistemaChuva.direction1 = new BABYLON.Vector3(-0.5, -28, -0.5);
    sistemaChuva.direction2 = new BABYLON.Vector3(-1.2, -32, -1.2);
    sistemaChuva.minEmitPower = 0.9;
    sistemaChuva.maxEmitPower = 1.3;
    
    sistemaChuva.minSize = 0.15;
    sistemaChuva.maxSize = 0.35;
    sistemaChuva.minScaleY = 5.0;
    sistemaChuva.maxScaleY = 9.0;
    
    sistemaChuva.minLifeTime = 0.7;
    sistemaChuva.maxLifeTime = 1.2;
    sistemaChuva.emitRate = 900;
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