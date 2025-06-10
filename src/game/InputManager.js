export class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.keys = {};
        this.touchStartX = 0;
        this.touchEndX = 0;
        
        this.setupKeyboardInput();
        this.setupTouchInput();
        this.setupDeviceOrientation();
    }

    setupKeyboardInput() {
        // Gestion des touches clavier
        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case 1: // KEYDOWN
                    this.keys[kbInfo.event.key] = true;
                    break;
                case 2: // KEYUP
                    this.keys[kbInfo.event.key] = false;
                    break;
            }
        });
    }

    setupTouchInput() {
        // Gestion des événements tactiles
        this.scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case 1: // POINTERDOWN
                    this.touchStartX = pointerInfo.event.clientX;
                    break;
                case 2: // POINTERUP
                    this.touchEndX = pointerInfo.event.clientX;
                    this.handleSwipe();
                    break;
            }
        });
    }

    setupDeviceOrientation() {
        // Gestion de l'orientation du device
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (event) => {
                if (event.beta) { // Inclinaison latérale
                    const tilt = event.beta;
                    if (tilt > 10) {
                        this.onMoveRight();
                    } else if (tilt < -10) {
                        this.onMoveLeft();
                    }
                }
            });
        }
    }

    handleSwipe() {
        const swipeDistance = this.touchEndX - this.touchStartX;
        const minSwipeDistance = 50;

        if (Math.abs(swipeDistance) > minSwipeDistance) {
            if (swipeDistance > 0) {
                this.onMoveRight();
            } else {
                this.onMoveLeft();
            }
        }
    }

    update() {
        // Mise à jour des contrôles clavier
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['q']) {
            this.onMoveLeft();
            // Réinitialiser l'état de la touche pour éviter les déclenchements multiples
            this.keys['ArrowLeft'] = false;
            this.keys['a'] = false;
            this.keys['q'] = false;
        }
        if (this.keys['ArrowRight'] || this.keys['d']) {
            this.onMoveRight();
            // Réinitialiser l'état de la touche pour éviter les déclenchements multiples
            this.keys['ArrowRight'] = false;
            this.keys['d'] = false;
        }
    }

    onMoveLeft() {
        if (this.onMoveLeftCallback) {
            this.onMoveLeftCallback();
        }
    }

    onMoveRight() {
        if (this.onMoveRightCallback) {
            this.onMoveRightCallback();
        }
    }

    setCallbacks(onMoveLeft, onMoveRight) {
        this.onMoveLeftCallback = onMoveLeft;
        this.onMoveRightCallback = onMoveRight;
    }
} 