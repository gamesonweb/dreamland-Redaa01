import { Vector3, Color3, MeshBuilder, StandardMaterial, ParticleSystem, Texture, Color4, Animation } from "@babylonjs/core";

export class GameManager {
    constructor(scene) {
        this.scene = scene;
        this.level = 1;
        this.score = 0;
        this.scoreMultiplier = 1;
        this.highScore = localStorage.getItem('highScore') || 0;
        this.levelThreshold = 300;
        this.baseSpeed = 0.2;
        this.currentSpeed = this.baseSpeed;
        this.speedMultiplier = 1.15;
        this.powerUpChance = 0.40;
        this.activePowerUps = new Map();
        this.magnetRadius = 10;
        this.powerUpEffects = new Map();
        this.collectibles = [];
        this.powerUps = []; // Liste des power-ups actifs dans le jeu
        
        this.combo = 0;
        this.maxCombo = 0;
        this.comboMultiplier = 1;
        this.comboTimeout = null;
        this.comboDuration = 3000;
        this.basePoints = 10;

        // Configuration des power-ups
        this.powerUpConfig = {
            speed: { 
                duration: 7000,
                color: new Color3(1, 0.5, 0),
                emissive: new Color3(1, 0.3, 0),
                effect: (speed) => speed * 1.5
            },
            shield: { 
                duration: 5000,
                color: new Color3(0, 1, 0),
                emissive: new Color3(0, 0.7, 0),
                effect: () => true
            },
            magnet: { 
                duration: 6000,
                color: new Color3(0, 0.5, 1),
                emissive: new Color3(0, 0.3, 1),
                radius: 10
            }
        };
        
        // Préchargement des sons
        this.sounds = {
            powerup: null
        };
        this.loadSounds();
    }

    loadSounds() {
        // Création et préchargement du son power-up
        const powerupSound = new Audio('/sounds/powerup.mp3');
        powerupSound.addEventListener('canplaythrough', () => {
            this.sounds.powerup = powerupSound;
        });
        powerupSound.addEventListener('error', (e) => {
            console.warn("Son power-up non disponible:", e);
        });
    }

    update(deltaTime, player) {
        // Vérification du passage au niveau suivant
        if (this.score >= this.level * this.levelThreshold) {
            this.levelUp();
        }

        // Mise à jour des power-ups actifs
        this.updatePowerUps(deltaTime, player);
    }

    levelUp() {
        this.level++;
        this.currentSpeed *= this.speedMultiplier;
        
        // Augmentation progressive de la difficulté
        this.powerUpChance = Math.min(0.4, 0.15 + (this.level - 1) * 0.03); // Augmentation plus rapide
        
        // Notification au joueur
        this.showLevelUpNotification();
    }

    showLevelUpNotification() {
        // Création d'une notification temporaire
        const notification = document.createElement('div');
        notification.style.position = 'absolute';
        notification.style.top = '50%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = 'white';
        notification.style.padding = '20px';
        notification.style.borderRadius = '10px';
        notification.style.fontSize = '24px';
        notification.style.zIndex = '1000';
        notification.textContent = `Niveau ${this.level} !`;
        
        document.body.appendChild(notification);
        
        // Animation de fade out
        setTimeout(() => {
            notification.style.transition = 'opacity 1s';
            notification.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 1000);
        }, 2000);
    }

    addScore(points) {
        const totalPoints = Math.floor(points * this.comboMultiplier);
        this.score += totalPoints;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }
        
        return totalPoints;
    }

    addPoints(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) return;
        this.score += amount * this.comboMultiplier;
        // Sauvegarder le high score si nécessaire
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }
    }

    incrementCombo() {
        try {
            this.combo++;
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }
            
            this.comboMultiplier = 1 + (this.combo * 0.5);
            
            // Réinitialiser le timeout
            if (this.comboTimeout) {
                clearTimeout(this.comboTimeout);
            }
            
            this.comboTimeout = setTimeout(() => {
                this.resetCombo();
            }, this.comboDuration);
        } catch (error) {
            console.error("Erreur lors de l'incrémentation du combo:", error);
            this.resetCombo();
        }
    }

    resetCombo() {
        try {
            this.combo = 0;
            this.comboMultiplier = 1;
            if (this.comboTimeout) {
                clearTimeout(this.comboTimeout);
                this.comboTimeout = null;
            }
        } catch (error) {
            console.error("Erreur lors de la réinitialisation du combo:", error);
        }
    }

    reset() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboMultiplier = 1;
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
            this.comboTimeout = null;
        }
        this.currentSpeed = this.baseSpeed;
        this.level = 1;
    }

    activatePowerUp(type) {
        const powerUp = this.activePowerUps.get(type);
        if (powerUp) {
            clearTimeout(powerUp.timeout);
        }
        
        const config = this.powerUpConfig[type];
        if (!config) return;
        
        // Jouer le son de collecte s'il est disponible
        if (this.sounds.powerup) {
            this.sounds.powerup.currentTime = 0;
            this.sounds.powerup.play().catch(error => {
                console.warn("Erreur lors de la lecture du son power-up:", error);
            });
        }
        
        this.activePowerUps.set(type, {
            startTime: Date.now(),
            timeout: setTimeout(() => {
                this.activePowerUps.delete(type);
            }, config.duration)
        });
    }

    getCurrentSpeed() {
        let speed = this.currentSpeed;
        const speedPowerUp = this.activePowerUps.get('speed');
        if (speedPowerUp) {
            speed = this.powerUpConfig.speed.effect(speed);
        }
        return speed;
    }

    hasShield() {
        return this.activePowerUps.has('shield');
    }

    hasMagnet() {
        return this.activePowerUps.has('magnet');
    }

    getMagnetRadius() {
        return this.hasMagnet() ? this.powerUpConfig.magnet.radius : 0;
    }

    getPowerUpConfig() {
        return this.powerUpConfig;
    }

    updatePowerUps(deltaTime, player) {
        if (!this.powerUps) return; // Protection contre undefined
        
        // Mise à jour des power-ups à collecter
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (!powerUp || !powerUp.mesh) continue; // Protection supplémentaire
            
            powerUp.mesh.position.z -= this.getCurrentSpeed(); // Déplacement vers le joueur
            
            // Animation de rotation
            powerUp.mesh.rotation.y += deltaTime * 2;
            
            // Check collision avec le joueur
            if (player && Vector3.Distance(powerUp.mesh.position, player.mesh.position) < 1) {
                // Activer le power-up
                this.activatePowerUp(powerUp.type, player.mesh);
                
                // Supprimer le power-up
                this.removePowerUp(powerUp);
                continue;
            }
            
            // Suppression si trop loin
            if (powerUp.mesh.position.z < -10) {
                this.removePowerUp(powerUp);
            }
        }

        // Logique d'attraction du power-up magnet
        if (this.hasMagnet() && this.collectibles.length > 0) {
            const playerPosition = this.scene.activeCamera.target;
            for (const collectible of this.collectibles) {
                const distance = Vector3.Distance(collectible.position, playerPosition);
                if (distance <= this.getMagnetRadius()) {
                    const direction = playerPosition.subtract(collectible.position);
                    direction.normalize();
                    direction.scaleInPlace(this.getCurrentSpeed() * 2);
                    collectible.position.addInPlace(direction);
                }
            }
        }
    }

    addCollectible(collectible) {
        this.collectibles.push(collectible);
    }

    removeCollectible(collectible) {
        const index = this.collectibles.indexOf(collectible);
        if (index !== -1) {
            this.collectibles.splice(index, 1);
        }
    }

    /**
     * Retourne la config d'un power-up à spawn (ou null si aucun power-up ne doit apparaître)
     * @param {Vector3} position
     * @returns {object|null} {type, color, emissive, duration, ...}
     */
    getRandomPowerUpConfig(position) {
        if (Math.random() < this.powerUpChance) {
            const powerUpTypes = Object.keys(this.powerUpConfig);
            const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
            const config = this.powerUpConfig[type];
            console.log('[PowerUp] SPAWN', type, position);
            return {
                type,
                ...config
            };
        }
        console.log('[PowerUp] PAS DE SPAWN', position);
        return null;
    }

    // La méthode spawnPowerUp ne fait plus rien (pour compatibilité, on la laisse mais elle ne fait rien)
    spawnPowerUp() {
        return null;
    }

    removePowerUp(powerUp) {
        const index = this.powerUps.indexOf(powerUp);
        if (index !== -1) {
            if (powerUp.mesh.particleSystem) {
                powerUp.mesh.particleSystem.dispose();
            }
            powerUp.mesh.dispose();
            this.powerUps.splice(index, 1);
        }
    }
}