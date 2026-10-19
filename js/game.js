import { createScene } from './scene.js';

window.addEventListener('DOMContentLoaded', () => {
    // 1. Criar e exibir a tela de carregamento antes de inicializar a engine/cena
    const loadingOverlay = document.createElement("div");
    loadingOverlay.id = "loading-overlay";
    loadingOverlay.style.position = "fixed";
    loadingOverlay.style.top = "0";
    loadingOverlay.style.left = "0";
    loadingOverlay.style.width = "100vw";
    loadingOverlay.style.height = "100vh";
    loadingOverlay.style.backgroundColor = "#090d16";
    loadingOverlay.style.display = "flex";
    loadingOverlay.style.justifyContent = "center";
    loadingOverlay.style.alignItems = "center";
    loadingOverlay.style.zIndex = "99999";
    loadingOverlay.style.fontFamily = "Arial, sans-serif";
    loadingOverlay.style.color = "#ffffff";
    loadingOverlay.style.transition = "opacity 0.6s ease";

    const loadingBox = document.createElement("div");
    loadingBox.style.backgroundColor = "#0f172a";
    loadingBox.style.border = "2px solid #38bdf8";
    loadingBox.style.borderRadius = "12px";
    loadingBox.style.padding = "40px";
    loadingBox.style.width = "90%";
    loadingBox.style.maxWidth = "450px";
    loadingBox.style.boxShadow = "0 15px 35px rgba(0,0,0,0.8)";
    loadingBox.style.textAlign = "center";

    loadingBox.innerHTML = `
        <h2 style="margin-top: 0; color: #38bdf8; font-size: 22px; line-height: 1.35; margin-bottom: 15px;">
            Construindo sua Estação de Tratamento de Água!
        </h2>
        <p id="loading-status" style="color: #94a3b8; font-size: 14px; margin-bottom: 25px;">
            Carregando recursos e assets do sistema...
        </p>

        <!-- Barra de Progresso -->
        <div style="
            width: 100%;
            background-color: #1e293b;
            border-radius: 8px;
            height: 16px;
            overflow: hidden;
            border: 1px solid #334155;
        ">
            <div id="loading-bar" style="
                width: 0%;
                height: 100%;
                background: linear-gradient(90deg, #0284c7, #38bdf8);
                transition: width 0.15s linear;
            "></div>
        </div>
    `;

    loadingOverlay.appendChild(loadingBox);
    document.body.appendChild(loadingOverlay);

    const progressBar = document.getElementById("loading-bar");
    const statusText = document.getElementById("loading-status");

    // 2. Simulação de progresso fluido de carregamento
    let progress = 0;
    const loadingInterval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 6; // Avança de 6 a 15% por tick
        
        if (progress >= 100) {
            progress = 100;
            clearInterval(loadingInterval);
            statusText.innerText = "Carregamento concluído!";

            // Pequeno delay para o usuário ver 100% antes de iniciar o jogo e sumir a tela
            setTimeout(() => {
                loadingOverlay.style.opacity = "0";
                setTimeout(() => {
                    loadingOverlay.remove();
                }, 600);

                // Inicializa a engine e a cena do jogo após o carregamento
                inicializarJogo();
            }, 400);
        }
        progressBar.style.width = `${progress}%`;
    }, 100);
});

function inicializarJogo() {
    const canvas = document.getElementById("renderCanvas");
    if (!canvas) return;

    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

    // Cria a cena principal
    const scene = createScene(engine, canvas);

    // Roda o loop de renderização padrão da engine
    engine.runRenderLoop(() => {
        scene.render();
    });

    // Responsividade automática da tela
    window.addEventListener("resize", () => {
        engine.resize();
    });
}