import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/Addons.js'
import { World } from './world';
import { blocks } from './blocks';

const CENTER_SCREEN = new THREE.Vector2()

export class Player {
    radius = 0.5;
    height = 1.75;
    jumpSpeed = 10;
    onGround = false;

    maxSpeed = 10;
    input = new THREE.Vector3();
    velocity = new THREE.Vector3()

    #worldVelocity = new THREE.Vector3()
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200)
    controls = new PointerLockControls(this.camera, document.body)
    cameraHelper = new THREE.CameraHelper(this.camera)

    raycaster = new THREE.Raycaster(new THREE.Vector3, new THREE.Vector3, 0, 3)
    selectedCoords = null;
    activeBlockId = blocks.grass.id
    /**
     * 
     * @param {THREE.Scene} scene 
     */
    constructor(scene) {
        this.camera.position.set(32, 32, 32)
        scene.add(this.camera)
        scene.add(this.cameraHelper)
        document.addEventListener('keydown', this.onKeyDown.bind(this))
        document.addEventListener('keyup', this.onKeyUp.bind(this))

        this.boundHelper = new THREE.Mesh(
            new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
            new THREE.MeshBasicMaterial({ wireframe: true })
        )
        // scene.add(this.boundHelper)

        const selectionMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.3,
            color: 0xffffaa
        })
        const selectionGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01)
        this.selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial)
        scene.add(this.selectionHelper)
    }

    applyInputs(dt) {
        if (this.controls.isLocked) {
            this.velocity.x = this.input.x
            this.velocity.z = this.input.z
            this.controls.moveRight(this.velocity.x * dt)
            this.controls.moveForward(this.velocity.z * dt)
            this.position.y += this.velocity.y * dt;
            document.getElementById('player-position').innerHTML = this.toString()
        }
    }

    updateBoundsHelper() {
        this.boundHelper.position.copy(this.position)
        this.boundHelper.position.y -= this.height / 2
    }

    /**
     * 
     * @param {World} world 
     */
    update(world){
        this.updateRaycaster(world)
    }

    /**
     * 
     * @param {World} world 
     */
    updateRaycaster(world){
        this.raycaster.setFromCamera(CENTER_SCREEN, this.camera)
        const intersections = this.raycaster.intersectObject(world, true);
        
        if(intersections.length){
            const intersection = intersections[0]

            const chunk = intersection.object.parent
            // Get transformation matrix of intersection
            const blockMatrix = new THREE.Matrix4()
            intersection.object.getMatrixAt(intersection.instanceId, blockMatrix)

            this.selectedCoords = chunk.position.clone()
            this.selectedCoords.applyMatrix4(blockMatrix)
            if(this.activeBlockId > blocks.empty.id){
                this.selectedCoords.add(intersection.normal)
            }
            this.selectionHelper.position.copy(this.selectedCoords) 
            this.selectionHelper.visible = true
        }else{
            this.selectedCoords = null
            this.selectionHelper.visible = false
        }
    }

    /**
     * Event handler for 'keydown' event
     * @type {KeyboardEvent} event 
     */
    onKeyDown(event) {
        if (!this.controls.isLocked) {
            this.controls.lock()
            // console.log("controls locked")
        }

        switch (event.code) {
            case 'Digit0':
            case 'Digit1':
            case 'Digit2':
            case 'Digit3':
            case 'Digit4':
            case 'Digit5':
            case 'Digit6':
            case 'Digit7':
            case 'Digit8':
            case 'Digit9':
                    this.activeBlockId = Number(event.key);
                    console.log(`Switched block id to: ${event.key}`)
                    break;
            case 'KeyW':
                this.input.z = this.maxSpeed
                break;
            case 'KeyA':
                this.input.x = -this.maxSpeed
                break;
            case 'KeyS':
                this.input.z = -this.maxSpeed
                break;
            case 'KeyD':
                this.input.x = this.maxSpeed
                break;
            case 'KeyR':
                this.position.set(32, 16, 32)
                this.velocity.set(0, 0, 0)
                break;
            case 'Space':
                if (this.onGround) {
                    this.velocity.y += this.jumpSpeed
                }

        }
    }

    /**
     * Event handler for 'keyup' event
     * @type {KeyboardEvent} event 
     */
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.input.z = 0
                break;
            case 'KeyA':
                this.input.x = 0
                break;
            case 'KeyS':
                this.input.z = 0
                break;
            case 'KeyD':
                this.input.x = 0
                break;
        }
    }

    toString() {
        let str = ''
        str += `X:${this.position.x.toFixed(3)} `
        str += `Y:${this.position.y.toFixed(3)} `
        str += `Z:${this.position.z.toFixed(3)} `
        return str
    }

    /**
     * 
     * @param {THREE.Vector3} dv 
     */
    applyWorldVelocity(dv) {
        dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0))
        this.velocity.add(dv)
    }

    /**
     * Returns current player position
     * @type {THREE.Vector3} 
     */
    get position() {
        return this.camera.position
    }


    get worldVelocity() {
        this.#worldVelocity.copy(this.velocity)
        this.#worldVelocity.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0))
        return this.#worldVelocity
    }

}