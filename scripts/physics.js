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

const contactMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true
});
const contactGeometry = new THREE.SphereGeometry(0.05, 6, 6);

export class Physics {
    gravity = 32;

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
        this.helpers.clear()
        player.velocity.y -= this.gravity * dt
        player.applyInputs(dt)
        player.updateBoundsHelper()
        this.detectCollisions(player, world)
    }

    /**
     * Main function to detect collisions
     * @param {Player} player 
     * @param {World} world 
     */
    detectCollisions(player, world) {
        
        const candidates = this.broadPhase(player, world)
        const collisions = this.narrowPhase(candidates, player)

        if (collisions.length) {
            this.resolveCollisions(collisions, player)
        }
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
   * Narrows down the blocks found in the broad-phase to the set
   * of blocks the player is actually colliding with
   * @param {{ id: number, instanceId: number }[]} candidates 
   * @returns 
   */
    narrowPhase(candidates, player) {
        const collisions = [];

        for (const block of candidates) {
            // Get the point on the block that is closest to the center of the player's bounding cylinder
            const closestPoint = {
                x: Math.max(block.x - 0.5, Math.min(player.position.x, block.x + 0.5)),
                y: Math.max(block.y - 0.5, Math.min(player.position.y - (player.height / 2), block.y + 0.5)),
                z: Math.max(block.z - 0.5, Math.min(player.position.z, block.z + 0.5))
            };

            // Get distance along each axis between closest point and the center
            // of the player's bounding cylinder
            const dx = closestPoint.x - player.position.x;
            const dy = closestPoint.y - (player.position.y - (player.height / 2));
            const dz = closestPoint.z - player.position.z;

            if (this.pointInPlayerBoundingCylinder(closestPoint, player)) {
                // Compute the overlap between the point and the player's bounding
                // cylinder along the y-axis and in the xz-plane
                const overlapY = (player.height / 2) - Math.abs(dy);
                const overlapXZ = player.radius - Math.sqrt(dx * dx + dz * dz);

                // Compute the normal of the collision (pointing away from the contact point)
                // and the overlap between the point and the player's bounding cylinder
                let normal, overlap;
                if (overlapY < overlapXZ) {
                    normal = new THREE.Vector3(0, -Math.sign(dy), 0);
                    overlap = overlapY;
                    player.onGround = true;
                } else {
                    normal = new THREE.Vector3(-dx, 0, -dz).normalize();
                    overlap = overlapXZ;
                }

                collisions.push({
                    block,
                    contactPoint: closestPoint,
                    normal,
                    overlap
                });

                this.addContactPointerHelper(closestPoint);
            }
        }

        console.log(`Narrowphase Collisions: ${collisions.length}`);

        return collisions;
    }

    /**
     * 
     * @param {object} collisions
     * @param {Player} player
     */
    resolveCollisions(collisions, player) {
        collisions.sort((a, b) => {
            return a.overlap < b.overlap
        })

        for (const collision of collisions) {
            let deltaPosition = collision.normal.clone()
            deltaPosition.multiplyScalar(collision.overlap)
            player.position.add(deltaPosition);

            let magnitude = player.worldVelocity.dot(collision.normal)

            let velocityAdjustment = collision.normal.clone().multiplyScalar(magnitude)

            player.applyWorldVelocity(velocityAdjustment.negate())
        }
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
    /**
   * Visualizes the block the player is in contact with
   * @param {{x, y, z}} p 
   */
    addContactPointerHelper(p) {
        const contactMesh = new THREE.Mesh(contactGeometry, contactMaterial);
        contactMesh.position.copy(p);
        this.helpers.add(contactMesh);
    }

    /**
   * Returns true if the point 'p' is inside the player's bounding cylinder
   * @param {{ x: number, y: number, z: number }} p 
   * @param {Player} player 
   * @returns {boolean}
   */
    pointInPlayerBoundingCylinder(p, player) {
        const dx = p.x - player.position.x;
        const dy = p.y - (player.position.y - (player.height / 2));
        const dz = p.z - player.position.z;
        const r_sq = dx * dx + dz * dz;

        // Check if contact point is inside the player's bounding cylinder
        return (Math.abs(dy) < player.height / 2) && (r_sq < player.radius * player.radius);
    }


}