export function setupCamera(scene, canvas, targetMesh) {
    const camera = new BABYLON.ArcRotateCamera(
        "OrbitalCamera", 
        -Math.PI / 2,      
        Math.PI / 3,       
        25,                
        targetMesh,        
        scene
    );
    
    // Anexa a câmara e remove os controlos nativos de clique (preservando o zoom)
    camera.attachControl(canvas, true);
    camera.inputs.remove(camera.inputs.attached.pointers);

    // Impede o menu de contexto padrão do botão direito
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // Limites profissionais de zoom e rotação vertical
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 50;
    camera.lowerBetaLimit = Math.PI / 6;       
    camera.upperBetaLimit = Math.PI / 2.1;    

    // Lógica Customizada para Rotação Exclusiva com o Botão Direito
    let isRotating = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                // 2 = Botão direito do mouse
                if (pointerInfo.event.button === 2) {
                    isRotating = true;
                    lastMouseX = scene.pointerX;
                    lastMouseY = scene.pointerY;
                }
                break;
                
            case BABYLON.PointerEventTypes.POINTERUP:
                if (pointerInfo.event.button === 2) {
                    isRotating = false;
                }
                break;
                
            case BABYLON.PointerEventTypes.POINTERMOVE:
                if (isRotating) {
                    const deltaX = scene.pointerX - lastMouseX;
                    const deltaY = scene.pointerY - lastMouseY;

                    camera.alpha -= deltaX * 0.01;
                    camera.beta -= deltaY * 0.01;

                    lastMouseX = scene.pointerX;
                    lastMouseY = scene.pointerY;
                }
                break;
        }
    });

    return camera;
}