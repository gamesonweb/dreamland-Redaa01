import { Vector3, MeshBuilder, StandardMaterial, Color3, ActionManager, ExecuteCodeAction } from "@babylonjs/core";
import { Player } from "./Player";
import { CloudManager } from "./CloudManager";
import { DreamManager } from "./DreamManager";
import { InputManager } from "./InputManager";

export class Game {
    constructor(scene) {
        this.scene = scene;
        this.score = 0;
        this.speed = 6;
        this.isGameOver = false;
        this.lastDifficultyIncrease = 0;
        this.scoreMultiplier = 1;
        
        // Initialisation des managers
        this.player = new Player(scene);
        this.cloudManager = new CloudManager(scene);
        this.dreamManager = new DreamManager(scene);
        this.inputManager = new InputManager(scene);

        // Configuration du game over
        this.dreamManager.onGameOver = () => this.gameOver();
    }

    init() {
        // Configuration initiale
        this.setupEnvironment();
        this.setupEventListeners();
        this.setupCollisions();
        
        // Lier les callbacks de déplacement
        this.inputManager.setCallbacks(
            () => this.player.moveLeft(),
            () => this.player.moveRight()
        );
        
        // Démarrage de la boucle de jeu
        this.scene.registerBeforeRender(() => this.update());
    }

    setupEnvironment() {
        // Création du sol initial
        const ground = MeshBuilder.CreateGround("ground", {
            width: 20,
            height: 100
        }, this.scene);
        
        const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseColor = new Color3(0.9, 0.9, 1.0);
        ground.material = groundMaterial;
    }

    setupEventListeners() {
        // Gestion des collisions
        this.scene.onPointerDown = (evt) => {
            if (this.isGameOver) {
                this.restart();
                return;
            }
        };
    }

    setupCollisions() {
        // Configuration des collisions pour le joueur
        this.player.mesh.checkCollisions = true;
        
        // Configuration des collisions pour les nuages et les pickups
        this.cloudManager.setupCollisions(this.player.mesh, {
            onCollision: (mesh) => {
                if (mesh.name.startsWith('pickup')) {
                    this.collectPickup(mesh);
                } else if (mesh.name.startsWith('cloud')) {
                    this.handleCloudCollision(mesh);
                }
            }
        });
    }

    collectPickup(pickupMesh) {
        // Augmentation du score et de la jauge de rêve
        this.score += 10 * this.scoreMultiplier;
        this.dreamManager.collectPickup();
        this.dreamManager.dreamLevel = Math.min(100, this.dreamManager.dreamLevel + 10); // Ajout explicite de vie
        this.dreamManager.updateUI(); // Rafraîchit la barre de rêve et le score
        
        // Suppression du pickup
        pickupMesh.dispose();
    }

    handleCloudCollision(cloudMesh) {
        // Vérification si c'est un nuage orageux
        if (cloudMesh.material.emissiveColor) {
            // Perte de points de rêve
            this.dreamManager.dreamValue -= 20;
            this.dreamManager.updateDreamBar();
        }
    }

    update() {
        if (this.isGameOver) return;

        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
        
        // Mise à jour des composants
        this.inputManager.update();
        this.player.update(deltaTime);
        this.cloudManager.update(deltaTime, this.speed);
        this.dreamManager.update(deltaTime);
        
        // Mise à jour du score
        this.score += deltaTime * this.speed * this.scoreMultiplier;
        this.dreamManager.updateScore(Math.floor(this.score));
        
        // Augmentation progressive de la difficulté
        this.lastDifficultyIncrease += deltaTime;
        if (this.lastDifficultyIncrease >= 30) {
            this.increaseDifficulty();
            this.lastDifficultyIncrease = 0;
        }
    }

    increaseDifficulty() {
        this.speed *= 1.1;
        this.scoreMultiplier *= 1.1;
        this.cloudManager.increaseDifficulty();
    }

    gameOver() {
        this.isGameOver = true;
        // TODO: Afficher l'écran de game over
        console.log("Game Over! Score:", Math.floor(this.score));
    }

    restart() {
        this.score = 0;
        this.speed = 6;
        this.scoreMultiplier = 1;
        this.isGameOver = false;
        this.lastDifficultyIncrease = 0;
        
        this.player.reset();
        this.cloudManager.reset();
        this.dreamManager.reset();
    }
}