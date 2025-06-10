import { 
    Vector3, 
    MeshBuilder, 
    StandardMaterial, 
    Color3,
    Texture,
    DynamicTexture,
    ActionManager,
    ExecuteCodeAction
} from "@babylonjs/core";

export class CloudManager {
    constructor(scene) {
        this.scene = scene;
        this.clouds = [];
        this.cloudSegments = [];
        this.segmentLength = 20;
        this.gapChance = 0.15;
        this.stormCloudChance = 0;
        this.pickupFreq = 1;
        
        this.createCloudTexture();
        this.generateInitialSegments();
    }

    createCloudTexture() {
        // Création d'une texture procédurale pour les nuages
        const textureSize = 512;
        const texture = new DynamicTexture("cloudTexture", textureSize, this.scene);
        const ctx = texture.getContext();
        
        // Dessin de la texture de nuage
        ctx.fillStyle = "white";
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * textureSize;
            const y = Math.random() * textureSize;
            const radius = Math.random() * 50 + 20;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        texture.update();
        this.cloudTexture = texture;
    }

    generateInitialSegments() {
        for (let i = 0; i < 5; i++) {
            this.generateSegment(i * this.segmentLength);
        }
    }

    generateSegment(zPosition) {
        const segment = {
            clouds: [],
            pickups: [],
            z: zPosition
        };

        // Génération des nuages
        for (let x = -2; x <= 2; x += 2) {
            if (Math.random() > this.gapChance) {
                const isStormCloud = Math.random() < this.stormCloudChance;
                const cloud = this.createCloud(x, 0, zPosition, isStormCloud);
                segment.clouds.push(cloud);
            }
        }

        // Génération des éclats de rêve
        if (Math.random() < this.pickupFreq) {
            const pickup = this.createPickup(
                (Math.random() - 0.5) * 4,
                1,
                zPosition + Math.random() * this.segmentLength
            );
            segment.pickups.push(pickup);
        }

        this.cloudSegments.push(segment);
    }

    createCloud(x, y, z, isStormCloud = false) {
        const cloud = MeshBuilder.CreateBox("cloud", {
            height: 0.5,
            width: 2,
            depth: 2
        }, this.scene);

        const material = new StandardMaterial("cloudMaterial", this.scene);
        material.diffuseColor = isStormCloud ? new Color3(0.5, 0.2, 0.2) : new Color3(0.9, 0.9, 1.0);
        material.alpha = 0.8;
        material.diffuseTexture = this.cloudTexture;
        
        if (isStormCloud) {
            material.emissiveColor = new Color3(0.8, 0.2, 0.2);
        }
        
        cloud.material = material;
        cloud.position = new Vector3(x, y, z);
        cloud.checkCollisions = true;
        
        return cloud;
    }

    createPickup(x, y, z) {
        const pickup = MeshBuilder.CreateBox("pickup", {
            height: 0.3,
            width: 0.3,
            depth: 0.3
        }, this.scene);

        const material = new StandardMaterial("pickupMaterial", this.scene);
        material.diffuseColor = new Color3(1, 0.8, 0.2);
        material.emissiveColor = new Color3(1, 0.8, 0.2);
        pickup.material = material;

        pickup.position = new Vector3(x, y, z);
        pickup.checkCollisions = true;
        
        return pickup;
    }

    setupCollisions(playerMesh, callbacks) {
        // Configuration des collisions pour tous les segments
        this.cloudSegments.forEach(segment => {
            [...segment.clouds, ...segment.pickups].forEach(mesh => {
                mesh.actionManager = new ActionManager(this.scene);
                mesh.actionManager.registerAction(
                    new ExecuteCodeAction(
                        { trigger: ActionManager.OnIntersectionEnterTrigger, parameter: playerMesh },
                        () => callbacks.onCollision(mesh)
                    )
                );
            });
        });
    }

    update(deltaTime, speed) {
        // Mise à jour de la position des segments
        for (let i = this.cloudSegments.length - 1; i >= 0; i--) {
            const segment = this.cloudSegments[i];
            segment.z -= speed * deltaTime;

            // Appliquer la position z du segment à tous les meshes
            segment.clouds.forEach((cloud, idx) => {
                cloud.position.z = segment.z;
            });
            segment.pickups.forEach((pickup, idx) => {
                pickup.position.z = segment.z;
            });

            // Suppression des segments hors écran
            if (segment.z < -this.segmentLength) {
                this.removeSegment(segment);
                this.generateSegment(this.cloudSegments[this.cloudSegments.length - 1].z + this.segmentLength);
            }
        }
    }

    removeSegment(segment) {
        // Suppression des meshes
        segment.clouds.forEach(cloud => cloud.dispose());
        segment.pickups.forEach(pickup => pickup.dispose());
        
        // Suppression du segment
        const index = this.cloudSegments.indexOf(segment);
        if (index > -1) {
            this.cloudSegments.splice(index, 1);
        }
    }

    increaseDifficulty() {
        this.gapChance = Math.min(this.gapChance + 0.03, 0.4);
        this.stormCloudChance = Math.min(this.stormCloudChance + 0.05, 0.25);
        this.pickupFreq = Math.min(this.pickupFreq + 0.5, 5);
    }

    reset() {
        // Nettoyage des segments existants
        this.cloudSegments.forEach(segment => this.removeSegment(segment));
        this.cloudSegments = [];
        
        // Réinitialisation des paramètres
        this.gapChance = 0.15;
        this.stormCloudChance = 0;
        this.pickupFreq = 1;
        
        // Régénération des segments initiaux
        this.generateInitialSegments();
    }
} 