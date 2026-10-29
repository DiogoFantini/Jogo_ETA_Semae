import { atualizarRelogioHUD } from './hud.js';

// ==========================================================
// CONSTANTES E ESTADO DO TEMPO DO JOGO
// ==========================================================
export const DATA_INICIAL_JOGO = new Date(2024, 0, 1, 7, 0, 0);

const dataAtual = new Date(DATA_INICIAL_JOGO.getTime()); 
let multiplicadorVelocidade = 1; // 1x, 5x, 10x, 150x
let emPausa = false;
let relogioIniciado = false;

// 24 Horas in-game (86.400s) = 10 Minutos reais (600s) a 1x (144s in-game / seg real)
const FATOR_TEMPO_BASE = 144; 

const DIAS_SEMANA_PT = [
    "Domingo",
    "Segunda-Feira",
    "Terça-Feira",
    "Quarta-Feira",
    "Quinta-Feira",
    "Sexta-Feira",
    "Sábado"
];

let ultimoMinutoExibido = -1;
let textoRelogioCache = "";

// ==========================================================
// FUNÇÕES UTILITÁRIAS DE DATA E FORMATO
// ==========================================================
export function getDiasDecorridos(data) {
    const d = data || dataAtual;
    const diffMs = d.getTime() - DATA_INICIAL_JOGO.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function formatarDataHoraRelogio(d) {
    const horas = String(d.getHours()).padStart(2, '0');
    const minutos = String(d.getMinutes()).padStart(2, '0');
    const diaSemana = DIAS_SEMANA_PT[d.getDay()];
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();

    return `${horas}:${minutos} - ${diaSemana} - ${dia}/${mes}/${ano}`;
}

export function atualizarExibicao(forcar = false) {
    const minutoAtual = dataAtual.getMinutes();
    if (forcar || minutoAtual !== ultimoMinutoExibido) {
        ultimoMinutoExibido = minutoAtual;
        textoRelogioCache = formatarDataHoraRelogio(dataAtual);
        atualizarRelogioHUD(textoRelogioCache);
    }
}

// ==========================================================
// CICLO PRINCIPAL DO RELÓGIO (INTEGRADO AO BABYLON.JS)
// ==========================================================
export function iniciarRelogio(scene) {
    if (relogioIniciado || !scene) return;
    relogioIniciado = true;

    atualizarExibicao(true);

    scene.onBeforeRenderObservable.add(() => {
        scene.particlesEnabled = !emPausa;

        if (!emPausa && multiplicadorVelocidade > 0) {
            // Delta time real limitado a 100ms para evitar saltos se houver queda brutal de FPS
            const realDt = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.1);
            const avancoInGameMs = realDt * FATOR_TEMPO_BASE * multiplicadorVelocidade * 1000;
            
            dataAtual.setTime(dataAtual.getTime() + avancoInGameMs);
            atualizarExibicao(false);
        }
    });
}

// ==========================================================
// CONTROLE DE ESTADO E VELOCIDADE
// ==========================================================
export function pausarRelogio() { emPausa = true; }
export function despausarRelogio() { emPausa = false; }
export function setVelocidadeTempo(multiplicador) { multiplicadorVelocidade = multiplicador; emPausa = false; }
export function setHorarioJogo(horas, minutos) { 
    dataAtual.setHours(horas, minutos, 0, 0); 
    atualizarExibicao(true); 
}
export function getVelocidadeAtual() { return multiplicadorVelocidade; }
export function getVelocidadeTempo() { return multiplicadorVelocidade; }
export function isPausado() { return emPausa; }
export function isRelogioPausado() { return emPausa; }
export function getDataAtual() { return dataAtual; }

export function getGameDeltaTime(scene) {
    if (emPausa || !scene) return 0;
    const realDt = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.1);
    return realDt * multiplicadorVelocidade;
}

export function registerGameAnimation(scene, callback) {
    if (!scene) return;
    return scene.registerBeforeRender(() => {
        if (emPausa) return;
        const dt = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.1) * multiplicadorVelocidade;
        callback(dt, scene);
    });
}
