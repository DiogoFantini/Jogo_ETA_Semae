// ==========================================================
// variaveis-importantes.js — Central de Configurações Globais
// ==========================================================

// CONFIGURAÇÕES DA BOMBA D'ÁGUA (SEMAE)
export const CONFIG_BOMBA_AGUA = {
    vazaoMinuto: 0.25, // m³ de água puxados por minuto in-game
    vazaoHora: 15,     // m³ por hora in-game (0.25 * 60)
    vazaoDia: 360,     // m³ por dia in-game (15 * 24)
    vazaoTextoCard: "0,25 m³ por min/ 15 m³ por hora / 360 m³ por dia",
    descricao: "Este é o modelo mais simples e barato usado pelo SEMAE. É ideal para começar a sua cidade porque custa pouco para comprar e consertar. O problema é que ela gasta muita energia e pode quebrar fácil se sugar muita areia ou sujeira do rio.",
    energia: "15 kW/h (Alto)"
};

// CONFIGURAÇÕES DA CAIXA D'ÁGUA ELEVADA
export const CONFIG_CAIXA_AGUA = {
    reservaTexto: "Reserva: 50.000 L",
    descricao: "Reservatório elevado industrial para armazenamento e distribuição por gravidade. Mantém a pressão constante na rede e garante o abastecimento de água nos horários de pico.",
    energia: "0 kW/h (Passivo)"
};