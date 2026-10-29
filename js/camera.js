// Controle de estado: a câmera começa desativada até a definição do nome da ETA
let cameraAtiva = false;

export function ativarCamera() {
    cameraAtiva = true;
}

export function setupCamera(scene, canvas) {
    // Pivô móvel como centro focal da câmera
    const cameraTargetNode = new BABYLON.TransformNode("cameraTarget", scene);
    cameraTargetNode.position = new BABYLON.Vector3(5, 0, 0);

    const camera = new BABYLON.ArcRotateCamera(
        "CitiesCamera",
        -Math.PI / 2,      
        Math.PI / 3.2,     
        30,                
        cameraTargetNode.position, 
        scene
    );

    camera.attachControl(canvas, true);
    camera.inputs.remove(camera.inputs.attached.pointers);

    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    // Limites de zoom e inclinação vertical
    camera.lowerRadiusLimit = 8;
    camera.upperRadiusLimit = 65;
    camera.lowerBetaLimit = Math.PI / 12;
    camera.upperBetaLimit = Math.PI / 2.25;

    const moveSpeed = 0.35;

    const keysPressed = {
        w: false,
        a: false,
        s: false,
        d: false,
        ArrowUp: false,
        ArrowLeft: false,
        ArrowDown: false,
        ArrowRight: false
    };

    window.addEventListener("keydown", (e) => {
        if (!cameraAtiva) return;
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (keysPressed.hasOwnProperty(key)) {
            keysPressed[key] = true;
        }
    });

    window.addEventListener("keyup", (e) => {
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (keysPressed.hasOwnProperty(key)) {
            keysPressed[key] = false;
        }
    });

    // ==========================================================
    // ROTAÇÃO DA CÂMERA (BOTÃO DIREITO DO MOUSE)
    // ==========================================================
    let isRotating = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    scene.onPointerObservable.add((pointerInfo) => {
        if (!cameraAtiva) return; // Bloqueia rotação até o nome da ETA ser definido

        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
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

                    camera.alpha -= deltaX * 0.005;
                    camera.beta -= deltaY * 0.005;

                    lastMouseX = scene.pointerX;
                    lastMouseY = scene.pointerY;
                }
                break;
        }
    });

    // ==========================================================
    // MOVIMENTAÇÃO WASD / SETAS
    // ==========================================================
    scene.registerBeforeRender(() => {
        if (!cameraAtiva) return; // Bloqueia movimento até o nome da ETA ser definido

        const moveVector = new BABYLON.Vector3(0, 0, 0);

        if (keysPressed.w || keysPressed.ArrowUp) moveVector.z += 1;
        if (keysPressed.s || keysPressed.ArrowDown) moveVector.z -= 1;
        if (keysPressed.a || keysPressed.ArrowLeft) moveVector.x -= 1;
        if (keysPressed.d || keysPressed.ArrowRight) moveVector.x += 1;

        if (moveVector.lengthSquared() > 0) {
            moveVector.normalize();

            const forward = camera.getForwardRay().direction;
            forward.y = 0; 
            forward.normalize();

            // Correção da orientação do vetor lateral (Right)
            const right = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), forward).normalize();

            const displacement = forward.scale(moveVector.z * moveSpeed).add(right.scale(moveVector.x * moveSpeed));

            cameraTargetNode.position.addInPlace(displacement);
            camera.target.copyFrom(cameraTargetNode.position);
        }
    });

    return camera;
}