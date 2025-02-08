import * as THREE from 'three'
import { Player } from './player'
import { World } from './world'
import { blocks } from './blocks'

const collisionMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.2
});
const collisionGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001);

export class Physics {
    constructor(scene) {
        this.helpers = new THREE.Group()
        scene.add(this.helpers)
    }

    /**
     * Moves the physics simulation forward in time
     * @param {number} dt
     * @param {Player} player
     * @param {World} world
     */
    update(dt, player, world) {
        this.detectCollisions(player, world)
    }

    /**
     * Main function to detect collisions
     * @param {Player} player 
     * @param {World} world 
     */
    detectCollisions(player, world) {
        this.helpers.clear()
        const candidates = this.broadPhase(player, world)
        // const collisions = this.narrowPhase(candidates, player)

        // if(collisions.length){
        //     this.resolveCollisions(collisions)
        // }
    }

    /**
     * Possible blocks the player will collide into
     * @param {Player} player 
     * @param {World} world 
     * @returns {[]}
     */
    broadPhase(player, world) {
        const candidates = [];

        // Get the block extents of the player
        const minX = Math.floor(player.position.x - player.radius);
        const maxX = Math.ceil(player.position.x + player.radius);
        const minY = Math.floor(player.position.y - player.height);
        const maxY = Math.ceil(player.position.y);
        const minZ = Math.floor(player.position.z - player.radius);
        const maxZ = Math.ceil(player.position.z + player.radius);

        // Loop through all blocks next to the block the center of the player is in
        // If they aren't empty, then they are a possible collision candidate
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    const blockId = world.getBlock(x, y, z)?.id;
                    if (blockId && blockId !== blocks.empty.id) {
                        const blockPos = { x, y, z }
                        candidates.push(blockPos);
                        this.addCollisionHelper(blockPos);
                    }
                }
            }
        }

        // console.log(`Broadphase Candidates: ${candidates.length}`);

        return candidates;
    }

    /**
     * Narrows down the blocks found in the broad phase
     * @param {*} candidates 
     * @param {World} world
     * @returns 
     */
    narrowPhase(candidates, world) {

    }

    /**
     * 
     * @param {*} collisions 
     */
    resolveCollisions(collisions) {

    }

    /**
   * Visualizes the block the player is colliding with
   * @param {THREE.Object3D} block 
   */
    addCollisionHelper(block) {
        const blockMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
        blockMesh.position.copy(block);
        this.helpers.add(blockMesh);
    }

}