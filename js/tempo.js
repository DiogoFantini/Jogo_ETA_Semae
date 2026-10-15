import { atualizarRelogioHUD } from './hud.js';

let dataAtual = new Date(2026, 9, 15, 7, 0, 0); // Inicio: 15/10/2026 07:00
let multiplicadorVelocidade = 1; // Velocidade padrão 1x
let emPausa = false;
let intervaloRelogio = null;

// ==========================================================
// CÁLCULO DE PROPORÇÃO DE TEMPO
// 24 Horas in-game (86.400.000 ms) = 10 Minutos reais (600.000 ms)
// Fator de escala base (1x): 86.400.000 / 600.000 = 144
// ==========================================================
const FATOR_TEMPO_BASE = 144; 
const INTERVALO_TICK_MS = 100; // Atualiza a cada 100ms para movimentação fluída

export function iniciarRelogio() {
    if (intervaloRelogio) return;

    atualizarExibicao();

    intervaloRelogio = setInterval(() => {
        if (!emPausa && multiplicadorVelocidade > 0) {
            const avancoInGameMs = INTERVALO_TICK_MS * FATOR_TEMPO_BASE * multiplicadorVelocidade;
            dataAtual = new Date(dataAtual.getTime() + avancoInGameMs);
            atualizarExibicao();
        }
    }, INTERVALO_TICK_MS);
}

export function pausarRelogio() {
    emPausa = true;
}

export function despausarRelogio() {
    emPausa = false;
}

export function setVelocidadeTempo(multiplicador) {
    multiplicadorVelocidade = multiplicador;
    emPausa = false; // Despausa automaticamente ao selecionar uma velocidade
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

function atualizarExibicao() {
    const horas = String(dataAtual.getHours()).padStart(2, '0');
    const minutos = String(dataAtual.getMinutes()).padStart(2, '0');
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const ano = dataAtual.getFullYear();

    const stringFormatada = `${horas}:${minutos} - ${dia}/${mes}/${ano}`;
    atualizarRelogioHUD(stringFormatada);
}