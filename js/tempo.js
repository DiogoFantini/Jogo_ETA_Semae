import { atualizarRelogioHUD } from './hud.js';

// Inicializa a data: 15 de Outubro de 2026 às 07:00:00
let dataAtual = new Date(2026, 9, 15, 7, 0, 0); // Mês 9 = Outubro no Date do JavaScript
let intervaloRelogio = null;

// Velocidade do tempo: 1000ms (1 segundo real) = 1 minuto de jogo
const VELOCIDADE_TEMPO_MS = 1000; 

export function iniciarRelogio() {
    if (intervaloRelogio) return;

    atualizarExibicao();

    intervaloRelogio = setInterval(() => {
        // Avança 1 minuto por tick
        dataAtual.setMinutes(dataAtual.getMinutes() + 1);
        atualizarExibicao();
    }, VELOCIDADE_TEMPO_MS);
}

export function pausarRelogio() {
    if (intervaloRelogio) {
        clearInterval(intervaloRelogio);
        intervaloRelogio = null;
    }
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

    // Formatação exata: hh:mm - dd/mm/aaaa
    const stringFormatada = `${horas}:${minutos} - ${dia}/${mes}/${ano}`;
    atualizarRelogioHUD(stringFormatada);
}