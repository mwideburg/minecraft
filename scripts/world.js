import * as THREE from 'three'
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { RNG } from './rng';
import { blocks, resources } from './blocks';
const geometry = new THREE.BoxGeometry()

export class World extends THREE.Group {
    /**
     * 
     * @type {{
     * id: number,
     * instanceId: number
     * }[][][]} size 
     */
    data = [];

    params = {
        seed: 0,
        terrain: {
            scale: 20,
            magnitude: 0.5,
            offset: 0.2,
        }
    }
    constructor(size = { width: 32, height: 16 }) {
        super()
        this.size = size
    }
    generate() {
        const rng = new RNG(this.params.seed)
        this.initializeTerrain()
        this.generateResources(rng)
        this.generateTerrain(rng)
        this.generateMeshes()
    }
    initializeTerrain() {
        this.data = [];
        for (let x = 0; x < this.size.width; x++) {
            const slice = []
            for (let y = 0; y < this.size.height; y++) {
                const row = []
                for (let z = 0; z < this.size.width; z++) {
                    row.push({
                        id: 0,
                        instanceId: null
                    })
                }
                slice.push(row)
            }
            this.data.push(slice)
        }
    }
    generateResources(rng) {
        const simplex = new SimplexNoise(rng);
        resources.forEach((resource) => {
            for (let x = 0; x < this.size.width; x++) {
                for (let y = 0; y < this.size.height; y++) {
                    for (let z = 0; z < this.size.width; z++) {
                        const value = simplex.noise3d(
                            x / resource.scale.x,
                            y / resource.scale.y,
                            z / resource.scale.z);
                        if (value > resource.scarcity) {
                            this.setBlockId(x, y, z, resource.id)
                        }
                    }
                }
            }
        })
    }
    generateTerrain(rng) {
        const simplex = new SimplexNoise(rng);
        for (let x = 0; x < this.size.width; x++) {
            for (let z = 0; z < this.size.width; z++) {
                const value = simplex.noise(
                    x / this.params.terrain.scale,
                    z / this.params.terrain.scale
                );

                const scaledNoise = this.params.terrain.offset + this.params.terrain.magnitude * value

                let height = Math.floor(this.size.height * scaledNoise)
                height = Math.max(0, Math.min(Math.floor(height), this.size.height - 1))

                for (let y = 0; y < this.size.height; y++) {
                    if (y < height && this.getBlock(x, y, z).id === blocks.empty.id) {
                        this.setBlockId(x, y, z, blocks.dirt.id)
                    } else if (y === height) {
                        this.setBlockId(x, y, z, blocks.grass.id)
                    } else if (y > height) {
                        this.setBlockId(x, y, z, blocks.empty.id)
                    }
                }

            }
        }
    }

    generateMeshes() {
        this.clear()

        const maxCount = this.size.width * this.size.width * this.size.height
        const meshes = {}

        Object.values(blocks)
            .filter((blockType) => blockType.id !== blocks.empty.id)
            .forEach((blockType) => {
                const mesh = new THREE.InstancedMesh(
                    geometry,
                    blockType.material,
                    maxCount);
                mesh.name = blockType.name
                mesh.count = 0
                mesh.receiveShadow = true
                mesh.castShadow = true
                meshes[blockType.id] = mesh
            })

        console.log(meshes)
        const matrix = new THREE.Matrix4()
        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                    const blockId = this.getBlock(x, y, z).id

                    if (blockId === blocks.empty.id) continue

                    const mesh = meshes[blockId]
                    const instanceId = mesh.count
                    if (!this.isBlockObscured(x, y, z)) {
                        matrix.setPosition(x, y, z)
                        mesh.setMatrixAt(instanceId, matrix)
                        this.setBlockInstanceId(x, y, z, instanceId)
                        mesh.count++
                    }
                }
            }
        }

        this.add(...Object.values(meshes))
    }

    /**
 * Gets the block data at (x, y, z)
 * @param {number} x 
 * @param {number} y 
 * @param {number} z 
 * @returns {{id: number, instanceId: number}}
 */
    getBlock(x, y, z) {
        if (this.inBounds(x, y, z)) {
            return this.data[x][y][z];
        } else {
            return null;
        }
    }

    /**
 * Sets the block id for the block at (x, y, z)
 * @param {number} x 
 * @param {number} y 
 * @param {number} z 
 * @param {number} id
 */
    setBlockId(x, y, z, id) {
        if (this.inBounds(x, y, z)) {
            this.data[x][y][z].id = id;
        }
    }

    /**
 * Sets the block instance id for the block at (x, y, z)
 * @param {number} x 
 * @param {number} y 
 * @param {number} z 
 * @param {number} instanceId
 */
    setBlockInstanceId(x, y, z, instanceId) {
        if (this.inBounds(x, y, z)) {
            this.data[x][y][z].instanceId = instanceId;
        }
    }

    /**
 * Checks if the (x, y, z) coordinates are within bounds
 * @param {number} x 
 * @param {number} y 
 * @param {number} z 
 * @returns {boolean}
 */
    inBounds(x, y, z) {
        if (x >= 0 && x < this.size.width &&
            y >= 0 && y < this.size.height &&
            z >= 0 && z < this.size.width) {
            return true;
        } else {
            return false;
        }
    }

    /**
 * Checks if the sides of a block is exposed
 * @param {number} x 
 * @param {number} y 
 * @param {number} z 
 * @returns {boolean}
 */
    isBlockObscured(x, y, z) {
        const up = this.getBlock(x, y + 1, z)?.id ?? blocks.empty.id
        const down = this.getBlock(x, y - 1, z)?.id ?? blocks.empty.id
        const left = this.getBlock(x - 1, y, z)?.id ?? blocks.empty.id
        const right = this.getBlock(x + 1, y, z)?.id ?? blocks.empty.id
        const back = this.getBlock(x, y, z - 1)?.id ?? blocks.empty.id
        const forward = this.getBlock(x, y, z + 1)?.id ?? blocks.empty.id

        if (up === blocks.empty.id ||
            down === blocks.empty.id ||
            left === blocks.empty.id ||
            right === blocks.empty.id ||
            forward === blocks.empty.id ||
            back === blocks.empty.id
        ) {
            return false
        }

        return true
    }
}