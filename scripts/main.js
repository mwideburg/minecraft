import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { World } from './world';
import { createUI } from './ui';

const stats = new Stats()
document.body.append(stats.dom)

// Renderer Setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0)
document.body.appendChild(renderer.domElement)

// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight);
camera.position.set(2, 2, 2);
camera.lookAt(0, 0, 0)

// Add Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(16, 0, 16)
controls.update()

// CREATE SCENE
const scene = new THREE.Scene()
const world = new World()
world.generate()
scene.add(world)

function setUpLights(){
    const light1 = new THREE.DirectionalLight()
    light1.position.set(1, 1, 1)
    scene.add(light1)

    const light2 = new THREE.DirectionalLight()
    light2.position.set(-1, 1, -0.5)
    scene.add(light2)

    const light3 = new THREE.AmbientLight()
    light3.intensity = 0.1
    scene.add(light3)
}

// Render Loop
function animate(){
    requestAnimationFrame(animate)
    stats.update()
    renderer.render(scene, camera)
    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
    })
}

setUpLights()
createUI(world)
animate()


