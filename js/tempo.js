import { atualizarRelogioHUD } from './hud.js';

// Data inicial oficial do jogo: 01/01/2024 às 07:00:00 (Segunda-Feira)
export const DATA_INICIAL_JOGO = new Date(2024, 0, 1, 7, 0, 0);

let dataAtual = new Date(DATA_INICIAL_JOGO.getTime()); 
let multiplicadorVelocidade = 1; // 1x, 5x, 10x, 150x
let emPausa = false;
let relogioIniciado = false;
let ultimoTimestamp = null;

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

// Retorna quantos dias inteiros se passaram desde a segunda-feira inicial do jogo
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

export function atualizarExibicao() {
    atualizarRelogioHUD(formatarDataHoraRelogio(dataAtual));
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

export function pausarRelogio() { emPausa = true; }
export function despausarRelogio() { emPausa = false; }
export function setVelocidadeTempo(multiplicador) { multiplicadorVelocidade = multiplicador; emPausa = false; }
export function setHorarioJogo(horas, minutos) { dataAtual.setHours(horas, minutos, 0, 0); atualizarExibicao(); }
export function getVelocidadeAtual() { return multiplicadorVelocidade; }
export function getVelocidadeTempo() { return multiplicadorVelocidade; }
export function isPausado() { return emPausa; }
export function isRelogioPausado() { return emPausa; }
export function getDataAtual() { return new Date(dataAtual.getTime()); }

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