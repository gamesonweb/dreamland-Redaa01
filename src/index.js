import { 
    Engine, 
    Scene, 
    Vector3, 
    HemisphericLight,
    Color3,
    Color4,
    MeshBuilder,
    StandardMaterial,
    UniversalCamera
} from "@babylonjs/core";
import { Player } from "./game/Player";
import { DreamManager } from "./game/DreamManager";

// Récupération du canvas
const canvas = document.getElementById("renderCanvas");

// Initialisation du moteur
const engine = new Engine(canvas, true);

// Création de la scène
const scene = new Scene(engine);
scene.clearColor = new Color4(0.5, 0.8, 0.9, 1.0);

// Création du joueur
const player = new Player(scene);

// Création de la caméra runner (vue de derrière)
const camera = new UniversalCamera("runnerCamera", new Vector3(player.mesh.position.x, player.mesh.position.y + 5, player.mesh.position.z - 10), scene);
camera.setTarget(player.mesh.position);
camera.attachControl(canvas, false);

// Ajout de lumières
const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
light.intensity = 0.7;

// Création du gestionnaire de rêves
const dreamManager = new DreamManager(scene);

// Gestion des contrôles
window.addEventListener("keydown", (event) => {
    switch(event.key.toLowerCase()) {
        case "arrowleft":
        case "a":
        case "q":
            player.moveLeft();
            break;
        case "arrowright":
        case "d":
            player.moveRight();
            break;
    }
});

// Boucle de rendu
engine.runRenderLoop(() => {
    const deltaTime = engine.getDeltaTime() / 1000;
    player.update(deltaTime);
    dreamManager.update(player);
    // Caméra suit la planche
    camera.position.x = player.mesh.position.x;
    camera.position.z = player.mesh.position.z - 10;
    camera.position.y = player.mesh.position.y + 5;
    camera.setTarget(player.mesh.position);
    scene.render();
});

// Gestion du redimensionnement
window.addEventListener("resize", () => {
    engine.resize();
});