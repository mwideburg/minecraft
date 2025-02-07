import * as TRHEE from 'three'
import { PointerLockControls } from 'three/examples/jsm/Addons.js'

export class Player{
    camera = new TRHEE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.1, 200)
    controls = new TRHEE.PointerLockControls(this.camera, document.body)
    constructor(scene){
        this.camera.position.set(32, 16, 32)
        scene.add(this.camera)
    }
}