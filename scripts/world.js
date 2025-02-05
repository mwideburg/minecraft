import * as THREE from 'three'
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

const geometry = new THREE.BoxGeometry()
const material = new THREE.MeshLambertMaterial({ color: 0x00d000 })

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
        this.initializeTerrain()    
        this.generateTerrain()
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

    generateTerrain() {
        const simplex = new SimplexNoise();
        for (let x = 0; x < this.size.width; x++) {
            for (let z = 0; z < this.size.width; z++) {
                const value = simplex.noise(
                    x / this.params.terrain.scale,
                    z / this.params.terrain.scale
                );

                const scaledNoise = this.params.terrain.offset + this.params.terrain.magnitude * value

                let height = Math.floor(this.size.height * scaledNoise)
                height = Math.max(0, Math.min(Math.floor(height), this.size.height - 1))

                for(let y = 0; y <= height; y++){
                        this.setBlockId(x, y, z, 1)
                }

            }
        }
    }

    generateMeshes() {
        this.clear()

        const maxCount = this.size.width * this.size.width * this.size.height
        const mesh = new THREE.InstancedMesh(geometry, material, maxCount)
        mesh.count = 0

        const matrix = new THREE.Matrix4()
        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                    const blockId = this.getBlock(x, y, z).id
                    const instanceId = mesh.count
                    if (blockId != 0) {
                        matrix.setPosition(x, y, z)
                        mesh.setMatrixAt(instanceId, matrix)
                        this.setBlockInstanceId(x, y, z, instanceId)
                        mesh.count++
                    }
                }
            }
        }

        this.add(mesh)
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
}