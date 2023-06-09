import * as THREE from 'three'

import Camera from './Camera.js'
import DOMElements from '../DOMElements.js'
import Physics from './Physics.js'
import PlayerController from './PlayerController.js'
import Renderer from './Renderer.js'
import Sizes from './utils/Sizes.js'
import World from './World.js'

class Game {
    static has_started = false;
    static has_lost = false;
    static is_paused = false;

    static Lose = () => {
        if (Game.has_lost) return;
        Game.has_lost = true;
        DOMElements.screens.gameOverScreen.classList.remove('hidden');
        document.exitPointerLock();
    }

    static TogglePause = () => {
        Game.is_paused = !Game.is_paused;
    }

    constructor() {
        this.sizes = new Sizes(DOMElements.screens.gameScreen);

        this._InitializeScene();
        this._InitializeCamera();
        this._InitializeRenderer();

        
        this._clock = new THREE.Clock();
        this._physics = new Physics();

        this.InitializePlayerControls();
        
        this._world = new World(this._physics, this._scene, this._player_controller);

        window.addEventListener('resize', () => this.Resize());
        window.requestAnimationFrame(() => this.Update());
    }

    Restart() {
        if (!Game.has_lost) return;
        this._player_controller._kinematic_character_controller.Teleport(this._player_controller.spawn_position);
        this._player_controller._kinematic_character_controller.controller.canJump(false);
        this._camera.instance.rotation.set(0, Math.PI, 0);

        this._world._obstacles.Reset();
        this._world._obstacles.Fill();

        this._world.RemoveAllTriangles();
        this._world.CreateTriangles();

        Game.has_started = false;
        Game.has_lost = false;
        Game.is_paused = false;

        this._clock.start();
    }

    InitializePlayerControls() {
        this._player_controller = new PlayerController(this._camera.instance, this._physics);
        this._scene.add(this._player_controller.player_mesh);
    }

    _InitializeScene() {
        this._scene = new THREE.Scene();
    }

    _InitializeCamera() {
        this._camera = new Camera();
    }

    _InitializeRenderer() {
        this._renderer = new Renderer(this._scene, this._camera.instance);
        this._renderer.InitializePostFX();
    }

    Resize() {
        this.sizes.Resize();
        this._camera.Resize();
        this._renderer.Resize();
    }

    Update() {
        window.requestAnimationFrame(() => this.Update());

        this._renderer.Update();
        
        if (Game.has_lost || Game.is_paused) {
            if (this._clock.running) {
                this._clock.running = false;
            }
            return;
        };
        
        const deltaT = this._clock.getDelta();
        const elapsedT = this._clock.getElapsedTime();

        this._physics.Update(deltaT);

        if (this._player_controller) {
            this._player_controller.Update(deltaT);
            this._world.Update(deltaT, elapsedT, this._player_controller);
        }
        else {
            this._camera.instance.position.z += deltaT * 10.0;
            this._world.Update(deltaT, elapsedT);
        }

    }
}

export default Game;