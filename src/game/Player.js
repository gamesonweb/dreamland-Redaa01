import { 
    Vector3, 
    MeshBuilder, 
    StandardMaterial, 
    Color3,
    Color4,
    Animation,
    AnimationGroup,
    ParticleSystem,
    Texture
} from "@babylonjs/core";

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.position = new Vector3(0, 0.5, 0);
        this.lateralSpeed = 10;
        this.currentLane = 0;
        this.lanes = [-2, 0, 2];
        
        this.createMesh();
        this.setupAnimations();
        this.createParticleTrail();
    }

    createMesh() {
        // Création de la planche de surf
        this.mesh = MeshBuilder.CreateBox("player", {
            height: 0.2,
            width: 1,
            depth: 2
        }, this.scene);
        
        const material = new StandardMaterial("playerMaterial", this.scene);
        material.diffuseColor = new Color3(0.8, 0.8, 1.0);
        material.alpha = 0.9;
        this.mesh.material = material;
        
        this.mesh.position = this.position;
    }

    createParticleTrail() {
        // Création du système de particules
        const particleSystem = new ParticleSystem("particles", 2000, this.scene);
        
        // Texture des particules
        particleSystem.particleTexture = new Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMC1jMDYwIDYxLjEzNDc3NywgMjAxMC8wMi8xMi0xNzozMjowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QUM2OEZDQTQ4RTU0MTFFMDlBNkIxREE5RjA5RkY5QzQiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QUM2OEZDQTU4RTU0MTFFMDlBNkIxREE5RjA5RkY5QzQiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpBQzY4RkNBMjhFNTQxMUUwOUE2QjFEQTlGMDlGRjlDNCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpBQzY4RkNBMzhFNTQxMUUwOUE2QjFEQTlGMDlGRjlDNCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Af/+/fz7+vn49/b19PPy8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcC/vr28u7q5uLe2tbSzsrGwr66trKuqqainpqWko6KhoJ+enZybmpmYl5aVlJOSkZCPjo2Mi4qJiIeGhYSDgoGAf359fHt6eXh3dnV0c3JxcG9ubWxramloZ2ZlZGNiYWBfXl1cW1pZWFdWVVRTUlFQT05NTEtKSUhHRkVEQ0JBQD8+PTw7Ojk4NzY1NDMyMTAvLi0sKyopKCcmJSQjIiEgHx4dHBsaGRgXFhUUExIREA8ODQwLCgkIBwYFBAMCAQAAACH5BAAAAAAALAAAAAAIAAgAAAIRhI+py+0Po5y02ouz3rz7D4biSJbmiabqyrbuCwAAOw==", this.scene);
        
        // Position d'émission
        particleSystem.emitter = this.mesh;
        particleSystem.minEmitBox = new Vector3(-0.5, 0, 0);
        particleSystem.maxEmitBox = new Vector3(0.5, 0, 0);
        
        // Couleurs
        particleSystem.color1 = new Color4(0.7, 0.8, 1.0, 1.0);
        particleSystem.color2 = new Color4(0.2, 0.5, 1.0, 1.0);
        particleSystem.colorDead = new Color4(0, 0, 0.2, 0.0);
        
        // Taille
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.5;
        
        // Durée de vie
        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 1.5;
        
        // Taux d'émission
        particleSystem.emitRate = 150;
        
        // Mélange
        particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;
        
        // Direction
        particleSystem.direction1 = new Vector3(-2, 0, 0);
        particleSystem.direction2 = new Vector3(2, 0, 0);
        
        // Angular speed
        particleSystem.minAngularSpeed = 0;
        particleSystem.maxAngularSpeed = Math.PI;
        
        // Vitesse
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 3;
        particleSystem.updateSpeed = 0.01;
        
        // Démarrer le système
        particleSystem.start();
    }

    setupAnimations() {
        // Animation de balancement
        const swayAnimation = new Animation(
            "swayAnimation",
            "rotation.z",
            30,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const keyFrames = [];
        keyFrames.push({
            frame: 0,
            value: -0.1
        });
        keyFrames.push({
            frame: 30,
            value: 0.1
        });
        keyFrames.push({
            frame: 60,
            value: -0.1
        });

        swayAnimation.setKeys(keyFrames);
        this.mesh.animations.push(swayAnimation);
        
        this.scene.beginAnimation(this.mesh, 0, 60, true);
    }

    update(deltaTime) {
        // Mise à jour de la position latérale
        const targetX = this.lanes[this.currentLane];
        const currentX = this.mesh.position.x;
        
        if (Math.abs(targetX - currentX) > 0.1) {
            const direction = targetX > currentX ? 1 : -1;
            this.mesh.position.x += direction * this.lateralSpeed * deltaTime;
        }
    }

    moveLeft() {
        if (this.currentLane > 0) {
            this.currentLane--;
        }
    }

    moveRight() {
        if (this.currentLane < this.lanes.length - 1) {
            this.currentLane++;
        }
    }

    reset() {
        this.currentLane = 1;
        this.mesh.position = new Vector3(0, 0.5, 0);
    }
} 