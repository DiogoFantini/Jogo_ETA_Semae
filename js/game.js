import { createScene } from './scene.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

    // Cria a cena principal do projeto sério
    const scene = createScene(engine, canvas);

    // Roda o loop de renderização padrão da engine
    engine.runRenderLoop(() => {
        scene.render();
    });

    // Responsividade automática da tela
    window.addEventListener("resize", () => {
        engine.resize();
    });
});