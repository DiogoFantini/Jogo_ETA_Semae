import { atualizarRelogioHUD } from './hud.js';

let dataAtual = new Date(2026, 9, 15, 7, 0, 0); // Início: 15/10/2026 07:00
let multiplicadorVelocidade = 1; // 1x, 2x, 3x, 5x, etc.
let emPausa = false;
let relogioIniciado = false;
let ultimoTimestamp = null;

// 24 Horas in-game (86.400s) = 10 Minutos reais (600s) a 1x
const FATOR_TEMPO_BASE = 144; 

export function atualizarExibicao() {
    const horas = String(dataAtual.getHours()).padStart(2, '0');
    const minutos = String(dataAtual.getMinutes()).padStart(2, '0');
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const ano = dataAtual.getFullYear();

    const stringFormatada = `${horas}:${minutos} - ${dia}/${mes}/${ano}`;
    atualizarRelogioHUD(stringFormatada);
}

export function iniciarRelogio(scene) {
    if (relogioIniciado) return;
    relogioIniciado = true;

    atualizarExibicao();

    function loopTempo(timestamp) {
        if (ultimoTimestamp !== null) {
            const dt = (timestamp - ultimoTimestamp) / 1000;

            if (!emPausa && multiplicadorVelocidade > 0) {
                const avancoInGameMs = dt * FATOR_TEMPO_BASE * multiplicadorVelocidade * 1000;
                dataAtual = new Date(dataAtual.getTime() + avancoInGameMs);
                atualizarExibicao();
            }
        }
        ultimoTimestamp = timestamp;
        requestAnimationFrame(loopTempo);
    }

    requestAnimationFrame(loopTempo);
}

export function pausarRelogio() {
    emPausa = true;
}

export function despausarRelogio() {
    emPausa = false;
}

export function setVelocidadeTempo(multiplicador) {
    multiplicadorVelocidade = multiplicador;
    emPausa = false;
}

export function setHorarioJogo(horas, minutos) {
    dataAtual.setHours(horas, minutos, 0, 0);
    atualizarExibicao();
}

export function getVelocidadeAtual() {
    return multiplicadorVelocidade;
}

export function isPausado() {
    return emPausa;
}

export function getDataAtual() {
    return dataAtual;
}

// ==========================================================
// REGISTRADOR GLOBAL DE ANIMAÇÕES DO JOGO (SUPORTE A PAUSE)
// ==========================================================

export function getGameDeltaTime(scene) {
    if (emPausa) return 0;
    const realDt = scene.getEngine().getDeltaTime() / 1000;
    return realDt * multiplicadorVelocidade;
}

export function registerGameAnimation(scene, callback) {
    if (!scene) return;
    return scene.registerBeforeRender(() => {
        scene.particlesEnabled = !emPausa;

        if (emPausa) return;

        const dt = (scene.getEngine().getDeltaTime() / 1000) * multiplicadorVelocidade;
        callback(dt, scene);
    });
}