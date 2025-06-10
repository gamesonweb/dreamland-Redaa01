import { 
    Vector3, 
    MeshBuilder, 
    StandardMaterial, 
    Color3, 
    Color4,
    Animation,
    AnimationGroup,
    HemisphericLight,
    DirectionalLight,
    PointLight,
    SpotLight,
    ShadowGenerator,
    Scene,
    Camera,
    Mesh,
    ParticleSystem,
    Texture
} from "@babylonjs/core";
import {
    AdvancedDynamicTexture,
    Rectangle,
    TextBlock,
    Control,
    Button,
    StackPanel
} from "@babylonjs/gui";
import { GameManager } from "./GameManager";

export class DreamManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.gameManager = new GameManager(scene);
        this.score = 0;
        this.dreamLevel = 100;
        this.isGameOver = false;
        this.isMainMenu = true; // État initial : menu principal
        this.clouds = [];
        this.pickups = [];
        this.powerUps = [];
        this.cloudSpawnInterval = 2000;
        this.lastCloudSpawn = 0;
        this.pickupSpawnInterval = 3000;
        this.lastPickupSpawn = 0;
        this.cloudSpeed = 0.2;
        this.pickupSpeed = 0.2;
        this.spawnDistance = 50;
        this.despawnDistance = -10;
        this.lanes = [-2, 0, 2];
        this.hitEffect = null;
        this.maxCloudsPerSpawn = 2;
        this.activeFlashes = new Set();
        this.combo = 1;
        this.comboTimeLeft = 0;
        this.powerUpSpawnInterval = 5000; // ms entre tentatives de spawn
        this.lastPowerUpSpawn = 0;
        
        this.setupLighting();
        this.setupUI();
        this.createHitEffect();
        this.setupFlashEffect();
        this.showMainMenu(); // Afficher le menu principal au démarrage
    }

    setupUI() {
        console.log("Setting up UI...");
        // Création de l'UI fullscreen
        this.ui = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);
        
        // Configuration spéciale pour l'UI
        this.ui.useInvalidateRectOptimization = false;
        this.ui.renderAtIdealSize = true;
        this.ui.renderScale = 1;
        
        // Capture les événements de clic sur l'UI
        this.ui.idealWidth = window.innerWidth;
        this.ui.idealHeight = window.innerHeight;

        // Ajout de l'écouteur d'événements pour la touche Entrée
        this.scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === 1 && kbInfo.event.key === "Enter") { // 1 = KEYDOWN
                if (this.isMainMenu) {
                    this.startGame();
                }
            }
        });

        // Setup des différentes parties de l'UI
        this.setupGameUI();
        this.setupMainMenuUI();
        this.setupGameOverPanel();

        // Mise à jour de la taille de l'UI quand la fenêtre change de taille
        window.addEventListener('resize', () => {
            this.ui.idealWidth = window.innerWidth;
            this.ui.idealHeight = window.innerHeight;
        });
    }

    setupGameUI() {
        // Container principal en haut
        const topContainer = new StackPanel();
        topContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        topContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        topContainer.top = "20px";
        topContainer.left = "20px";
        topContainer.spacing = 10;
        this.ui.addControl(topContainer);
        this.gameUI = topContainer;
        this.gameUI.isVisible = false;

        // Création du container pour la barre de rêve
        const dreamContainer = new StackPanel();
        dreamContainer.height = "80px";
        dreamContainer.spacing = 5;
        topContainer.addControl(dreamContainer);

        // Label "RÊVE"
        const dreamLabel = new TextBlock();
        dreamLabel.text = "CLOUD SURF";
        dreamLabel.color = "white";
        dreamLabel.fontSize = 16;
        dreamLabel.fontFamily = "Arial";
        dreamLabel.height = "20px";
        dreamContainer.addControl(dreamLabel);

        // Container de la barre de rêve
        const barContainer = new Rectangle();
        barContainer.height = "15px";
        barContainer.width = "200px";
        barContainer.cornerRadius = 7;
        barContainer.thickness = 2;
        barContainer.background = "rgba(0, 0, 0, 0.3)";
        barContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        dreamContainer.addControl(barContainer);

        // Barre de rêve
        this.dreamBar = new Rectangle();
        this.dreamBar.height = "11px";
        this.dreamBar.width = "196px";
        this.dreamBar.left = "2px";
        this.dreamBar.cornerRadius = 5;
        this.dreamBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.dreamBar.background = "linear-gradient(90deg, #4a9eff 0%, #a4d4ff 100%)";
        barContainer.addControl(this.dreamBar);

        // Container score en haut à droite
        const scoreContainer = new StackPanel();
        scoreContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        scoreContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        scoreContainer.top = "20px";
        scoreContainer.right = "20px";
        this.ui.addControl(scoreContainer);

        // Score
        this.scoreText = new TextBlock();
        this.scoreText.text = "0";
        this.scoreText.color = "white";
        this.scoreText.fontSize = 40;
        this.scoreText.fontFamily = "Arial";
        this.scoreText.height = "45px";
        this.scoreText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        scoreContainer.addControl(this.scoreText);

        // Label "SCORE"
        const scoreLabel = new TextBlock();
        scoreLabel.text = "SCORE";
        scoreLabel.color = "white";
        scoreLabel.fontSize = 16;
        scoreLabel.fontFamily = "Arial";
        scoreLabel.height = "20px";
        scoreLabel.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        scoreContainer.addControl(scoreLabel);

        // Container combo au centre haut
        const comboContainer = new StackPanel();
        comboContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        comboContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        comboContainer.top = "60px"; // <-- On baisse le combo pour éviter la superposition
        this.ui.addControl(comboContainer);

        // Texte combo
        this.comboText = new TextBlock();
        this.comboText.text = "";
        this.comboText.color = "#FFD700";
        this.comboText.fontSize = 24;
        this.comboText.fontFamily = "Arial";
        this.comboText.height = "30px";
        this.comboText.outlineWidth = 2;
        this.comboText.outlineColor = "black";
        comboContainer.addControl(this.comboText);

        // Barre de combo
        this.comboBar = new Rectangle();
        this.comboBar.height = "4px";
        this.comboBar.width = "100px";
        this.comboBar.cornerRadius = 2;
        this.comboBar.background = "#FFD700";
        this.comboBar.alpha = 0.8;
        this.comboBar.isVisible = false;
        comboContainer.addControl(this.comboBar);
    }

    setupMainMenuUI() {
        console.log("Setting up main menu UI...");
        // Fond semi-transparent
        this.menuBackground = new Rectangle();
        this.menuBackground.width = 1;
        this.menuBackground.height = 1;
        this.menuBackground.background = "black";
        this.menuBackground.alpha = 0.5;
        this.menuBackground.isPointerBlocker = true;
        this.ui.addControl(this.menuBackground);

        // Panel central du menu
        this.menuPanel = new Rectangle();
        this.menuPanel.width = "500px";
        this.menuPanel.height = "650px";
        this.menuPanel.cornerRadius = 20;
        this.menuPanel.background = "linear-gradient(180deg, #2c3e50 0%, #3498db 100%)";
        this.menuPanel.thickness = 0;
        this.menuPanel.isPointerBlocker = true;
        this.ui.addControl(this.menuPanel);

        const menuStack = new StackPanel();
        menuStack.spacing = 20;
        menuStack.isPointerBlocker = true;
        this.menuPanel.addControl(menuStack);

        // Titre du jeu
        const title = new TextBlock();
        title.text = "CLOUD SURF";
        title.color = "white";
        title.fontSize = 64;
        title.fontFamily = "Arial";
        title.height = "100px";
        title.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        menuStack.addControl(title);

        // Meilleur score
        const highScore = new TextBlock();
        highScore.text = `Meilleur Score: ${Math.floor(this.gameManager.highScore)}`;
        highScore.color = "#FFD700";
        highScore.fontSize = 32;
        highScore.fontFamily = "Arial";
        highScore.height = "50px";
        menuStack.addControl(highScore);

        // Instructions
        const instructions = new TextBlock();
        instructions.text = "← → A/D/Q pour naviguer\nEntrée/JOUER pour rêver\n\n✦ Étoiles : Renforcent le rêve\n☁ Nuages : Drainent la conscience\n\nPouvoirs :\n⚡ Sprint  🛡️ Bulle  🧲 Attraction";
        instructions.color = "white";
        instructions.fontSize = 18;
        instructions.fontFamily = "Arial";
        instructions.height = "200px";
        instructions.textWrapping = true;
        menuStack.addControl(instructions);

        // Bouton Jouer
        const playButton = new Button("playBtn");
        playButton.width = "300px";
        playButton.height = "80px";
        playButton.color = "white";
        playButton.cornerRadius = 20;
        playButton.background = "#27AE60";
        playButton.thickness = 0;
        playButton.fontSize = 32;
        playButton.fontFamily = "Arial";
        playButton.top = "30px";
        playButton.isPointerBlocker = true;
        playButton.hoverCursor = "pointer";

        const playText = new TextBlock();
        playText.text = "JOUER";
        playText.color = "white";
        playText.fontSize = 32;
        playText.fontFamily = "Arial";
        playButton.addControl(playText);

        console.log("Adding click handler to play button...");
        playButton.onPointerClickObservable.add((evt) => {
            console.log("Play button clicked!", evt);
            this.startGame();
        });

        menuStack.addControl(playButton);
        console.log("Main menu UI setup complete");
    }

    setupGameOverPanel() {
        console.log("Setting up game over panel...");
        // Fond semi-transparent
        this.gameOverBackground = new Rectangle();
        this.gameOverBackground.width = 1;
        this.gameOverBackground.height = 1;
        this.gameOverBackground.background = "black";
        this.gameOverBackground.alpha = 0;
        this.gameOverBackground.isVisible = false;
        this.gameOverBackground.isPointerBlocker = true;
        this.ui.addControl(this.gameOverBackground);

        // Panel central
        this.gameOverPanel = new Rectangle();
        this.gameOverPanel.width = "400px";
        this.gameOverPanel.height = "500px";
        this.gameOverPanel.cornerRadius = 20;
        this.gameOverPanel.background = "linear-gradient(180deg, #2c3e50 0%, #3498db 100%)";
        this.gameOverPanel.thickness = 0;
        this.gameOverPanel.isVisible = false;
        this.gameOverPanel.isPointerBlocker = true;
        this.ui.addControl(this.gameOverPanel);

        const gameOverStack = new StackPanel();
        gameOverStack.spacing = 20;
        gameOverStack.isPointerBlocker = true;
        this.gameOverPanel.addControl(gameOverStack);

        // Titre Game Over
        const gameOverTitle = new TextBlock();
        gameOverTitle.text = "GAME OVER";
        gameOverTitle.color = "white";
        gameOverTitle.fontSize = 48;
        gameOverTitle.fontFamily = "Arial";
        gameOverTitle.height = "60px";
        gameOverStack.addControl(gameOverTitle);

        // Score final
        this.finalScoreText = new TextBlock();
        this.finalScoreText.color = "white";
        this.finalScoreText.fontSize = 32;
        this.finalScoreText.fontFamily = "Arial";
        this.finalScoreText.height = "40px";
        gameOverStack.addControl(this.finalScoreText);

        // Meilleur score
        this.highScoreText = new TextBlock();
        this.highScoreText.color = "#FFD700";
        this.highScoreText.fontSize = 24;
        this.highScoreText.fontFamily = "Arial";
        this.highScoreText.height = "30px";
        gameOverStack.addControl(this.highScoreText);

        // Meilleur combo
        this.maxComboText = new TextBlock();
        this.maxComboText.color = "#F1C40F";
        this.maxComboText.fontSize = 24;
        this.maxComboText.fontFamily = "Arial";
        this.maxComboText.height = "30px";
        gameOverStack.addControl(this.maxComboText);

        // Bouton Rejouer
        const replayButton = new Button("replayBtn");
        replayButton.width = "200px";
        replayButton.height = "50px";
        replayButton.color = "white";
        replayButton.cornerRadius = 20;
        replayButton.background = "#27AE60";
        replayButton.thickness = 0;
        replayButton.fontSize = 20;
        replayButton.fontFamily = "Arial";
        replayButton.top = "30px";
        replayButton.isPointerBlocker = true;
        replayButton.hoverCursor = "pointer";

        const replayText = new TextBlock();
        replayText.text = "REJOUER";
        replayText.color = "white";
        replayText.fontSize = 20;
        replayText.fontFamily = "Arial";
        replayButton.addControl(replayText);

        console.log("Adding click handler to replay button...");
        replayButton.onPointerClickObservable.add((evt) => {
            console.log("Replay button clicked!", evt);
            this.startGame();
        });

        gameOverStack.addControl(replayButton);
        console.log("Game over panel setup complete");
    }

    showGameOver() {
        this.isGameOver = true;
        this.gameOverBackground.isVisible = true;
        this.gameOverPanel.isVisible = true;
        this.gameUI.isVisible = false;

        // Mise à jour des scores finaux
        this.finalScoreText.text = `Score: ${Math.floor(this.gameManager.score)}`;
        this.highScoreText.text = `Meilleur Score: ${Math.floor(this.gameManager.highScore)}`;
        this.maxComboText.text = `Meilleur Combo: x${this.gameManager.maxCombo}`;

        // Animation de fade in
        let alpha = 0;
        const fadeIn = setInterval(() => {
            alpha += 0.05;
            if (alpha >= 0.5) {
                clearInterval(fadeIn);
                alpha = 0.5;
            }
            this.gameOverBackground.alpha = alpha;
        }, 50);

        // Retour au menu principal après un délai
        setTimeout(() => {
            this.showMainMenu();
        }, 3000);
    }

    reset() {
        this.isGameOver = false;
        this.dreamLevel = 100;
        // Reset du GameManager aussi
        this.gameManager.reset();
        this.updateUI();

        this.gameOverBackground.isVisible = false;
        this.gameOverPanel.isVisible = false;
        this.gameOverBackground.alpha = 0;
        
        // Nettoyer les objets existants
        this.clouds.forEach(cloud => cloud.dispose());
        this.clouds = [];
        this.pickups.forEach(pickup => {
            if (pickup.light) pickup.light.dispose();
            pickup.dispose();
        });
        this.pickups = [];
        this.powerUps.forEach(powerUp => {
            if (powerUp.light) powerUp.light.dispose();
            powerUp.mesh.dispose();
        });
        this.powerUps = [];
    }

    updateUI() {
        // Mise à jour de la barre de rêve avec animation fluide
        const dreamPercent = Math.max(0, Math.min(1, this.dreamLevel / 100));
        this.dreamBar.width = `${196 * dreamPercent}px`;
        // Change la couleur en fonction du niveau
        if (this.dreamLevel < 30) {
            this.dreamBar.background = "linear-gradient(90deg, #e74c3c 0%, #c0392b 100%)";
        } else if (this.dreamLevel < 60) {
            this.dreamBar.background = "linear-gradient(90deg, #f1c40f 0%, #f39c12 100%)";
        } else {
            this.dreamBar.background = "linear-gradient(90deg, #4a9eff 0%, #a4d4ff 100%)";
        }
        
        // Affichage du score directement depuis le GameManager
        this.scoreText.text = Math.floor(this.gameManager.score).toString();
        
        // Affichage du combo depuis le GameManager
        if (this.gameManager.combo > 1) {
            this.comboText.text = `COMBO x${this.gameManager.combo}`;
            this.comboText.isVisible = true;
            this.comboBar.isVisible = true;
            this.comboBar.width = `${100}px`; // Barre fixe pour l'instant
        } else {
            this.comboText.isVisible = false;
            this.comboBar.isVisible = false;
        }
    }

    // Autres méthodes de la classe...
    collectPickup(pickup) {
        try {
            // Animation du flash
            this.flashEffect.alpha = 0.2;
            setTimeout(() => {
                this.flashEffect.alpha = 0;
            }, 200);

            // Incrémentation du combo et ajout des points
            this.gameManager.incrementCombo();
            // On passe par le GameManager pour ajouter les points
            this.gameManager.addPoints(10); // 10 points de base par pickup
            this.dreamLevel = Math.min(100, this.dreamLevel + 10);

            // Animation de collecte
            const scaleAnim = new Animation(
                "pickupCollect",
                "scaling",
                60,
                Animation.ANIMATIONTYPE_VECTOR3,
                Animation.ANIMATIONLOOPMODE_CONSTANT
            );

            const scaleKeys = [];
            scaleKeys.push({
                frame: 0,
                value: pickup.scaling
            });
            scaleKeys.push({
                frame: 10,
                value: new Vector3(1.5, 1.5, 1.5)
            });
            scaleKeys.push({
                frame: 20,
                value: new Vector3(0, 0, 0)
            });

            scaleAnim.setKeys(scaleKeys);
            pickup.animations.push(scaleAnim);
            this.scene.beginAnimation(pickup, 0, 20, false);

            // Mise à jour de l'UI après collecte
            this.updateUI();
        } catch (error) {
            console.error("Erreur lors de la collecte:", error);
        }
    }

    /**
     * Crée et ajoute un power-up à la scène
     * @param {Vector3} position
     * @param {object} powerUpConfig
     */
    spawnPowerUp(position, powerUpConfig) {
        const mesh = this.createPowerUpMesh(powerUpConfig.color, powerUpConfig.emissive, powerUpConfig.type);
        mesh.position = position.clone();
        // Ajout d'une lumière ponctuelle
        const light = new PointLight("powerUpLight", mesh.position, this.scene);
        light.diffuse = powerUpConfig.color;
        light.intensity = 1.2;
        light.range = 3;
        mesh.light = light;
        // Animation de pulsation de la lumière
        const pulseAnim = new Animation(
            "powerUpPulse",
            "intensity",
            30,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CYCLE
        );
        const pulseKeys = [];
        pulseKeys.push({ frame: 0, value: 0.6 });
        pulseKeys.push({ frame: 15, value: 1.2 });
        pulseKeys.push({ frame: 30, value: 0.6 });
        pulseAnim.setKeys(pulseKeys);
        light.animations.push(pulseAnim);
        this.scene.beginAnimation(light, 0, 30, true);
        // Stocker la configuration et le mesh dans le tableau des power-ups actifs
        this.powerUps.push({
            type: powerUpConfig.type,
            mesh: mesh,
            position: position.clone(),
            light: light,
            duration: powerUpConfig.duration
        });
        // Animation de flottement
        const floatAnim = new Animation(
            "powerUpFloat",
            "position.y",
            30,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CYCLE
        );
        const floatKeys = [];
        floatKeys.push({ frame: 0, value: position.y });
        floatKeys.push({ frame: 15, value: position.y + 0.3 });
        floatKeys.push({ frame: 30, value: position.y });
        floatAnim.setKeys(floatKeys);
        mesh.animations.push(floatAnim);
        this.scene.beginAnimation(mesh, 0, 30, true);
    }

    /**
     * Crée le mesh d'un power-up avec une forme selon le type
     * @param {Color3} color
     * @param {Color3} emissive
     * @param {string} type
     * @returns {Mesh}
     */
    createPowerUpMesh(color, emissive, type) {
        let mesh;
        if (type === 'magnet') {
            // Forme de U pour l'aimant
            const tube = MeshBuilder.CreateTorus("magnetU", {
                diameter: 0.7,
                thickness: 0.18,
                tessellation: 32,
                arc: 0.7
            }, this.scene);
            tube.rotation.z = Math.PI;
            mesh = tube;
        } else if (type === 'speed') {
            // Flèche pour la vitesse
            const shaft = MeshBuilder.CreateCylinder("arrowShaft", {
                diameter: 0.12,
                height: 0.5
            }, this.scene);
            shaft.position.y = 0.1;
            const head = MeshBuilder.CreateCylinder("arrowHead", {
                diameterTop: 0,
                diameterBottom: 0.25,
                height: 0.22
            }, this.scene);
            head.position.y = 0.36;
            mesh = MeshBuilder.CreateBox("arrowRoot", {size: 0.01}, this.scene); // racine invisible
            shaft.parent = mesh;
            head.parent = mesh;
        } else if (type === 'shield') {
            // Bouclier : sphère
            mesh = MeshBuilder.CreateSphere("shieldSphere", {
                diameter: 0.7
            }, this.scene);
        } else {
            // Par défaut : sphère
            mesh = MeshBuilder.CreateSphere("powerUp", {
                diameter: 0.7
            }, this.scene);
        }
        const material = new StandardMaterial("powerUpMaterial", this.scene);
        material.diffuseColor = color;
        material.emissiveColor = emissive;
        material.alpha = 1.0;
        mesh.material = material;
        // Animation de rotation continue
        const rotationAnim = new Animation(
            "powerUpRotation",
            "rotation.y",
            30,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CYCLE
        );
        const rotationKeys = [];
        rotationKeys.push({ frame: 0, value: 0 });
        rotationKeys.push({ frame: 30, value: Math.PI * 2 });
        rotationAnim.setKeys(rotationKeys);
        mesh.animations = [rotationAnim];
        this.scene.beginAnimation(mesh, 0, 30, true);
        return mesh;
    }

    update(player) {
        if (this.isGameOver || this.isMainMenu) return;
        
        const now = Date.now();
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
        
        // Mise à jour du GameManager
        this.gameManager.update(deltaTime, player);
        
        // Score constant basé sur la distance/vitesse
        const distancePoints = deltaTime * this.gameManager.getCurrentSpeed() * 10;
        this.gameManager.addPoints(distancePoints);
        
        // Spawn des nuages et pickups
        if (now - this.lastCloudSpawn > this.cloudSpawnInterval) {
            this.spawnCloud();
            this.lastCloudSpawn = now;
        }
        
        if (now - this.lastPickupSpawn > this.pickupSpawnInterval) {
            this.spawnPickup();
            this.lastPickupSpawn = now;
        }
        
        // Apparition indépendante des power-ups
        if (now - this.lastPowerUpSpawn > this.powerUpSpawnInterval) {
            this.trySpawnPowerUp();
            this.lastPowerUpSpawn = now;
        }
        
        // Animation rotation des pickups
        for (const pickup of this.pickups) {
            pickup.rotation.y += deltaTime * 2;
            // Animation de flottement
            const hover = Math.sin(now * 0.003) * 0.1;
            pickup.position.y = 0.5 + hover;
            // Mise à jour de la lumière du pickup
            if (pickup.light) {
                pickup.light.position = pickup.position;
                pickup.light.intensity = 0.8 + Math.sin(now * 0.003) * 0.2;
            }
        }

        // --- AIMANT : attraction des pickups vers le joueur si actif ---
        if (this.gameManager.hasMagnet()) {
            const magnetRadius = this.gameManager.getMagnetRadius();
            for (const pickup of this.pickups) {
                const dist = Vector3.Distance(pickup.position, player.mesh.position);
                if (dist < magnetRadius) {
                    const dir = player.mesh.position.subtract(pickup.position);
                    dir.normalize();
                    dir.scaleInPlace(this.gameManager.getCurrentSpeed() * 2);
                    pickup.position.addInPlace(dir);
                }
            }
        }
        
        // Mise à jour des nuages et collisions
        this.updateClouds(player, deltaTime);
        
        // Mise à jour des pickups et collisions
        this.updatePickups(player, deltaTime);

        // Mise à jour des powerups et collisions
        this.updatePowerUps(player, deltaTime, now);

        // Mise à jour de la jauge de rêve
        this.dreamLevel = Math.max(0, this.dreamLevel - (deltaTime * 2));
        
        // Mise à jour de l'UI
        this.updateUI();

        if (this.dreamLevel <= 0) {
            this.showGameOver();
        }
    }

    /**
     * Tente de spawner un power-up sur une lane libre
     */
    trySpawnPowerUp() {
        // On ne veut pas plus de 2 power-ups actifs à l'écran
        if (this.powerUps.length >= 2) return;
        // Choisir une lane libre
        const lanes = [...this.lanes];
        // Retirer les lanes déjà occupées par un power-up
        for (const powerUp of this.powerUps) {
            const idx = lanes.indexOf(Math.round(powerUp.mesh.position.x));
            if (idx !== -1) lanes.splice(idx, 1);
        }
        if (lanes.length === 0) return;
        const lane = lanes[Math.floor(Math.random() * lanes.length)];
        // Augmenter la distance entre les spawns pour éviter les collisions avec les nuages
        const position = new Vector3(lane, 0.5, this.spawnDistance + (Math.random() * 15 - 7.5));
        
        if (!this.isPositionOccupied(position)) {
            const powerUpConfig = this.gameManager.getRandomPowerUpConfig(position);
            if (powerUpConfig) {
                console.log("[PowerUp] Spawn réussi"); // Log pour debug
                this.spawnPowerUp(position, powerUpConfig);
            }
        }
    }

    updateClouds(player, deltaTime) {
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cloud = this.clouds[i];
            cloud.position.z -= this.gameManager.getCurrentSpeed();
            
            if (this.checkCollision(cloud, player.mesh)) {
                if (!this.gameManager.hasShield()) {
                    this.dreamLevel -= 20;
                    this.triggerHitEffect(cloud.position);
                }
                this.clouds.splice(i, 1);
                cloud.dispose();
                
                if (this.dreamLevel <= 0) {
                    this.showGameOver();
                }
            }
            else if (cloud.position.z < this.despawnDistance) {
                this.clouds.splice(i, 1);
                cloud.dispose();
            }
        }
    }

    updatePickups(player, deltaTime) {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            pickup.position.z -= this.gameManager.getCurrentSpeed();
            
            if (pickup.light) {
                pickup.light.position = pickup.position;
            }
            
            if (this.checkCollision(pickup, player.mesh)) {
                this.collectPickup(pickup);
                if (pickup.light) {
                    pickup.light.dispose();
                }
                this.pickups.splice(i, 1);
                pickup.dispose();
            }
            else if (pickup.position.z < this.despawnDistance) {
                if (pickup.light) {
                    pickup.light.dispose();
                }
                this.pickups.splice(i, 1);
                pickup.dispose();
            }
        }
    }

    updatePowerUps(player, deltaTime, now) {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.mesh.position.z -= this.gameManager.getCurrentSpeed();
            
            if (powerUp.light) {
                powerUp.light.position = powerUp.mesh.position;
            }
            
            // Animation de pulsation
            const scale = 1 + Math.sin(now * 0.005) * 0.2;
            powerUp.mesh.scaling = new Vector3(scale, scale, scale);
            
            if (this.checkCollision(powerUp.mesh, player.mesh)) {
                this.gameManager.activatePowerUp(powerUp.type);
                this.showPowerUpNotification(powerUp.type); // Affiche la notification
                if (powerUp.light) {
                    powerUp.light.dispose();
                }
                this.powerUps = this.powerUps.filter(p => p !== powerUp);
                powerUp.mesh.dispose();
            }
            else if (powerUp.mesh.position.z < this.despawnDistance) {
                if (powerUp.light) {
                    powerUp.light.dispose();
                }
                this.powerUps = this.powerUps.filter(p => p !== powerUp);
                powerUp.mesh.dispose();
            }
        }
    }

    /**
     * Affiche une notification centrale lors de la collecte d'un power-up
     * @param {string} type
     */
    showPowerUpNotification(type) {
        const notif = new Rectangle();
        notif.width = "300px";
        notif.height = "60px";
        notif.cornerRadius = 15;
        notif.thickness = 0;
        notif.background = "rgba(0,0,0,0.7)";
        notif.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        notif.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        notif.alpha = 1;
        notif.zIndex = 100;

        const text = new TextBlock();
        let label = "POUVOIR !";
        if (type === 'magnet') label = "Aimant activé !";
        else if (type === 'speed') label = "Vitesse ++ !";
        else if (type === 'shield') label = "Bouclier !";
        text.text = label;
        text.color = "#FFD700";
        text.fontSize = 32;
        text.fontFamily = "Arial";
        text.outlineWidth = 2;
        text.outlineColor = "#222";
        notif.addControl(text);

        this.ui.addControl(notif);
        setTimeout(() => {
            notif.alpha = 0.7;
            setTimeout(() => {
                notif.alpha = 0.3;
                setTimeout(() => {
                    this.ui.removeControl(notif);
                }, 200);
            }, 400);
        }, 700);
    }

    triggerHitEffect(position) {
        this.hitEffect.emitter = position;
        this.hitEffect.emitRate = 200;
        
        setTimeout(() => {
            this.hitEffect.emitRate = 0;
        }, 300);

        const flash = new Rectangle("flash");
        flash.width = 1;
        flash.height = 1;
        flash.background = "red";
        flash.alpha = 0.3;
        this.ui.addControl(flash);
        this.activeFlashes.add(flash);

        setTimeout(() => {
            flash.dispose();
            this.activeFlashes.delete(flash);
        }, 200);
    }

    setupLighting() {
        const hemisphericLight = new HemisphericLight("hemisphericLight", new Vector3(0, 1, 0), this.scene);
        hemisphericLight.intensity = 0.5;
        
        const directionalLight = new DirectionalLight("directionalLight", new Vector3(0, -1, 0), this.scene);
        directionalLight.intensity = 0.5;
    }

    createHitEffect() {
        this.hitEffect = new ParticleSystem("hitParticles", 200, this.scene);
        this.hitEffect.particleTexture = new Texture("assets/textures/flare.png", this.scene);
        this.hitEffect.color1 = new Color4(1, 0, 0, 1);
        this.hitEffect.color2 = new Color4(1, 0.5, 0, 1);
        this.hitEffect.colorDead = new Color4(0, 0, 0, 0);
        this.hitEffect.minSize = 1;
        this.hitEffect.maxSize = 3;
        this.hitEffect.minLifeTime = 0.3;
        this.hitEffect.maxLifeTime = 0.8;
        this.hitEffect.emitRate = 0;
        this.hitEffect.blendMode = ParticleSystem.BLENDMODE_ONEONE;
        this.hitEffect.direction1 = new Vector3(-2, 2, -2);
        this.hitEffect.direction2 = new Vector3(2, 2, 2);
        this.hitEffect.minEmitPower = 8;
        this.hitEffect.maxEmitPower = 15;
        this.hitEffect.updateSpeed = 0.01;
        this.hitEffect.start();
    }

    setupFlashEffect() {
        this.flashEffect = new Rectangle("flashEffect");
        this.flashEffect.width = 1;
        this.flashEffect.height = 1;
        this.flashEffect.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this.flashEffect.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.flashEffect.background = "blue";
        this.flashEffect.alpha = 0;
        this.ui.addControl(this.flashEffect);
    }

    showMainMenu() {
        this.isMainMenu = true;
        this.isGameOver = false;
        this.menuBackground.isVisible = true;
        this.menuPanel.isVisible = true;
        this.gameUI.isVisible = false;
        this.gameOverPanel.isVisible = false;
        this.gameOverBackground.isVisible = false;
        this.gameOverBackground.alpha = 0;
        
        // Reset du jeu
        this.reset();
    }

    startGame() {
        this.isMainMenu = false;
        this.isGameOver = false;
        this.menuBackground.isVisible = false;
        this.menuPanel.isVisible = false;
        this.gameUI.isVisible = true;
        this.gameOverPanel.isVisible = false;
        this.gameOverBackground.isVisible = false;
        this.gameOverBackground.alpha = 0;
        
        // Reset complet du jeu
        this.reset();
        this.dreamLevel = 100;
        this.gameManager.reset();
        this.updateUI();
    }

    createCloudMesh() {
        // Création du conteneur principal pour le nuage
        const cloudContainer = new Mesh("cloudContainer", this.scene);
        
        // Création de plusieurs plans avec différentes rotations pour créer du volume
        const createCloudLayer = (name, scale, yOffset, rotation) => {
            const plane = MeshBuilder.CreatePlane(name, {
                width: 2,
                height: 2
            }, this.scene);
            
            const material = new StandardMaterial(`${name}Material`, this.scene);
            material.diffuseTexture = new Texture("assets/textures/cloud.png", this.scene);
            material.diffuseColor = new Color3(1, 1, 1);
            material.alpha = 0.6;
            material.backFaceCulling = false;
            
            plane.material = material;
            plane.scaling = new Vector3(scale.x, scale.y, scale.z);
            plane.position.y = yOffset;
            plane.rotation = rotation;
            
            plane.parent = cloudContainer;
            return plane;
        };

        // Création de plusieurs couches de nuages
        createCloudLayer("cloudBase", new Vector3(1, 1, 1), 0, 
            new Vector3(Math.PI/2, 0, 0));
        
        createCloudLayer("cloudTop", new Vector3(0.8, 0.8, 0.8), 0.2, 
            new Vector3(Math.PI/2, Math.PI/6, 0));
        
        createCloudLayer("cloudLeft", new Vector3(0.7, 0.7, 0.7), 0.1, 
            new Vector3(Math.PI/2, -Math.PI/4, 0));
        
        createCloudLayer("cloudRight", new Vector3(0.9, 0.9, 0.9), 0.15, 
            new Vector3(Math.PI/2, Math.PI/3, 0));

        // Animation de flottement légère
        const floatAnimation = new Animation(
            "cloudFloat",
            "rotation.z",
            30,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CYCLE
        );

        const keys = [];
        keys.push({ frame: 0, value: -0.1 });
        keys.push({ frame: 15, value: 0.1 });
        keys.push({ frame: 30, value: -0.1 });
        
        floatAnimation.setKeys(keys);
        cloudContainer.animations.push(floatAnimation);
        this.scene.beginAnimation(cloudContainer, 0, 30, true);

        return cloudContainer;
    }

    // Modification de la méthode spawnCloud pour utiliser le nouveau mesh
    spawnCloud() {
        const numClouds = Math.random() < 0.3 ? 2 : 1;
        const availableLanes = [...this.lanes];
        
        for (let i = availableLanes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableLanes[i], availableLanes[j]] = [availableLanes[j], availableLanes[i]];
        }
        
        for (let i = 0; i < numClouds; i++) {
            const lane = availableLanes[i];
            const cloud = this.createCloudMesh();
            
            // Position aléatoire avec légère variation
            cloud.position = new Vector3(
                lane + (Math.random() * 0.4 - 0.2),  // Légère variation sur X
                0.5 + (Math.random() * 0.3),         // Variation de hauteur
                this.spawnDistance
            );
            
            // Rotation aléatoire pour plus de variété
            cloud.rotation.y = Math.random() * Math.PI;
            
            // Taille aléatoire
            const scale = 0.8 + Math.random() * 0.4;
            cloud.scaling = new Vector3(scale, scale, scale);
            
            this.clouds.push(cloud);
        }
    }

    spawnPickup() {
        let position;
        let attempts = 0;
        const maxAttempts = 10;
        
        do {
            const lane = this.lanes[Math.floor(Math.random() * this.lanes.length)];
            position = new Vector3(
                lane,
                0.5,
                this.spawnDistance + (Math.random() * 10 - 5)
            );
            attempts++;
        } while (this.isPositionOccupied(position) && attempts < maxAttempts);
        
        if (attempts >= maxAttempts) {
            const lane = this.lanes[Math.floor(Math.random() * this.lanes.length)];
            position = new Vector3(lane, 0.5, this.spawnDistance);
        }
        
        const pickup = MeshBuilder.CreateSphere("pickup", {
            diameter: 0.5
        }, this.scene);
        
        const material = new StandardMaterial("pickupMaterial", this.scene);
        material.diffuseColor = new Color3(0.8, 0.8, 1.0);
        material.emissiveColor = new Color3(0.4, 0.4, 1.0);
        material.alpha = 0.8;
        pickup.material = material;
        
        pickup.position = position;
        
        const light = new PointLight("pickupLight", pickup.position, this.scene);
        light.diffuse = new Color3(0.4, 0.4, 1.0);
        light.intensity = 1.0;
        light.range = 3;
        
        pickup.light = light;
        this.pickups.push(pickup);
    }

    isPositionOccupied(position) {
        // Pour les nuages, on vérifie la position du conteneur parent
        for (const cloud of this.clouds) {
            // On utilise une distance plus petite car les nuages sont plus volumineux maintenant
            if (Vector3.Distance(cloud.position, position) < 1.5) {
                return true;
            }
        }
        
        for (const pickup of this.pickups) {
            if (Vector3.Distance(pickup.position, position) < 2) {
                return true;
            }
        }
        
        for (const powerUp of this.powerUps) {
            if (Vector3.Distance(powerUp.mesh.position, position) < 2) {
                return true;
            }
        }
        
        return false;
    }

    checkCollision(obj1, obj2) {
        if (!obj1 || !obj2) return false;
        const distance = Vector3.Distance(obj1.position, obj2.position);
        return distance < 1;
    }
}