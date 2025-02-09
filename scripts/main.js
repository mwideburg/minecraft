import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { createUI } from './ui';
import { Player } from './player';
import { Physics } from './physics';
import { World } from './world';

const stats = new Stats()
document.body.append(stats.dom)

// Renderer Setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

// Camera Setup
const orbitCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
orbitCamera.position.set(45, 45, 45);
orbitCamera.lookAt(0, 0, 0)

// Add Controls
const controls = new OrbitControls(orbitCamera, renderer.domElement)
controls.target.set(16, 0, 16)
controls.update()

// CREATE SCENE
const scene = new THREE.Scene()
scene.fog = new THREE.Fog(0x80a0e0, 32, 64)
const world = new World()
world.generate()
scene.add(world)

const player = new Player(scene)

const physics = new Physics(scene)
const sun = new THREE.DirectionalLight()

function setUpLights() {
   
    sun.position.set(50, 50, 50);
    sun.castShadow = true;
    sun.shadow.camera.left = -100
    sun.shadow.camera.right = 100
    sun.shadow.camera.bottom = -100
    sun.shadow.camera.top = 100
    sun.shadow.camera.near = 0.1
    sun.shadow.camera.far = 200
    sun.shadow.bias = -.0001
    sun.shadow.mapSize = new THREE.Vector2(2048, 2048)
    scene.add(sun)
    scene.add(sun.target)
    const shadowHelper = new THREE.CameraHelper(sun.shadow.camera)
    scene.add(shadowHelper)

    const light3 = new THREE.AmbientLight()
    light3.intensity = 0.1
    scene.add(light3)
}

function onMouseDown(event){
    if(player.controls.isLocked && player.selectedCoords){
        console.log(`Removing block at ${JSON.stringify(player.selectedCoords)}`)
        world.removeBlock(
            player.selectedCoords.x,
            player.selectedCoords.y,
            player.selectedCoords.z
        )
    }
}
document.addEventListener('mousedown', onMouseDown)

// Render Loop
let previousTime = performance.now()
function animate() {
    const currentTime = performance.now();
    const dt = (currentTime - previousTime) / 1000;
    requestAnimationFrame(animate)
    stats.update()

    if(player.controls.isLocked){
        player.update(world)
        physics.update(dt, player, world);
        world.update(player)

        sun.position.copy(player.position)
        sun.position.sub(new THREE.Vector3(-50, -50, -50))
        sun.target.position.copy(player.position)
    }
    renderer.render(scene, player.controls.isLocked ? player.camera : orbitCamera)
    previousTime = currentTime
}

window.addEventListener("resize", () => {
    orbitCamera.aspect = window.innerWidth / window.innerHeight
    orbitCamera.updateProjectionMatrix()
    player.camera.aspect = window.innerWidth / window.innerHeight
    player.camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
})
setUpLights()
createUI(world, player, scene)
animate()


