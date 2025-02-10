import * as TRHEE from 'three'
import { WorldChunk } from './worldChunk'
import { Player } from './player';
import { DataStore } from './dataStore';

export class World extends TRHEE.Group {

    asyncLoading = true;

    drawDistance = 2;

    chunkSize = { width: 32, height: 32 }
    params = {
        seed: 0,
        terrain: {
            scale: 30,
            magnitude: 10,
            offset: 4,
            waterOffset: 5,
        },
        trees:{
            trunk:{
                minHeight: 4,
                maxHeight: 7,
            },
            canopy: {
                minRadius: 2,
                maxRadius: 4,
                density: 0.5
            },
            frequency: 0.01,
        },
        clouds: {
            scale: 30,
            density: 0.5
        }
    }

    dataStore = new DataStore()

    constructor(seed = 0) {
        super();
        this.seed = seed
    }

    generate() {
        this.dataStore.clear()
        this.disposeChunk()
        for (let x = -this.drawDistance; x <= this.drawDistance; x++) {
            for (let z = -this.drawDistance; z <= this.drawDistance; z++) {
                const chunk = new WorldChunk(this.chunkSize, this.params, this.dataStore);
                chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
                chunk.generate();
                chunk.userData = { x, z }
                this.add(chunk);
            }
        }
    }

    /**
     * 
     * @param {Player} player 
     */
    update(player) {
        const visibleChunks = this.getVisibleChunks(player);
        const chunksToAdd = this.getChunksToAdd(visibleChunks);
        this.removeUnusedChunks(visibleChunks)
        for (const chunk of chunksToAdd) {
            this.generateChunk(chunk.x, chunk.z)
        }

    }

    /**
     * Return chunks visible to the player
     * @param {Player} player 
     * @returns {{x: number, y:number}[]}
     */
    getVisibleChunks(player) {
        const visibleChunks = []

        const coords = this.worldToChunkCoords(
            player.position.x,
            player.position.y,
            player.position.z
        )

        const chunkX = coords.chunk.x;
        const chunkZ = coords.chunk.z;

        for (let x = chunkX - this.drawDistance; x <= chunkX + this.drawDistance; x++) {
            for (let z = chunkZ - this.drawDistance; z <= chunkZ + this.drawDistance; z++) {
                visibleChunks.push({ x, z })
            }
        }

        return visibleChunks
    }

    /**
     * Returns array of coords for the chunks to be added
     * @param {{x: number, y:number}[]} visibleChunks 
     * @returns {{x: number, y:number}[]}
     */
    getChunksToAdd(visibleChunks) {
        return visibleChunks.filter((chunk) => {
            const chunkExists = this.children
                .map((obj) => obj.userData)
                .find(({ x, z }) => chunk.x === x && chunk.z === z)
            return !chunkExists
        })

    }

    /**
     * 
     * @param {{x: number, y:number}[]} visibleChunks 
     */
    removeUnusedChunks(visibleChunks) {
        const chunksToRemove = this.children.filter((obj) => {
            const { x, z } = obj.userData;
            const chunkExists = visibleChunks.find((visibleChunk) => {
                return visibleChunk.x === x && visibleChunk.z === z;
            });

            return !chunkExists;
        })

        for (const chunk of chunksToRemove) {
            chunk.disposeChildren()
            this.remove(chunk);
            // console.log(`Removed chunk at X: ${chunk.userData.x} Z: ${chunk.userData.z}`)
        }
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     */
    generateChunk(x, z) {
        const chunk = new WorldChunk(this.chunkSize, this.params, this.dataStore);
        chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
        chunk.userData = { x, z }

        if (this.asyncLoading) {
            requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 })
        } else {
            chunk.generate();
        }
        this.add(chunk);
        // console.log(`Added chunk at X: ${chunk.userData.x} Z: ${chunk.userData.z}`)
    }

    /**
    * Gets the block data at (x, y, z)
    * @param {number} x 
    * @param {number} y 
    * @param {number} z 
    * @returns {{id: number, instanceId: number} | null}
    */
    getBlock(x, y, z) {
        const coords = this.worldToChunkCoords(x, y, z);
        const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

        if (chunk && chunk.loaded) {
            return chunk.getBlock(coords.block.x, y, coords.block.z);
        } else {
            return null;
        }
    }

    /**
     * Returns the chunk and world coordinates of the block at (x,y,z)\
     *  - `chunk` is the coordinates of the chunk containing the block
     *  - `block` is the world coordinates of the block
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns {{
     *  chunk: { x: number, z: number},
     *  block: { x: number, y: number, z: number}
     * }}
     */
    worldToChunkCoords(x, y, z) {
        const chunkCoords = {
            x: Math.floor(x / this.chunkSize.width),
            z: Math.floor(z / this.chunkSize.width),
        };

        const blockCoords = {
            x: x - this.chunkSize.width * chunkCoords.x,
            y,
            z: z - this.chunkSize.width * chunkCoords.z
        }

        return {
            chunk: chunkCoords,
            block: blockCoords
        };
    }

    /**
     * Returns the WorldChunk object the contains the specified coordinates
     * @param {number} chunkX
     * @param {number} chunkZ
     * @returns {WorldChunk | null}
     */
    getChunk(chunkX, chunkZ) {
        return this.children.find((chunk) => {
            return chunk.userData.x === chunkX &&
                chunk.userData.z === chunkZ;
        });
    }
    disposeChunk() {
        this.traverse((chunk) => {
            if (chunk.diposeInstances) {
                chunk.disposeInstances()
            }
        })
        this.clear();
    }

    /**
     * Reveals block
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
    */
    revealBlock(x, y, z) {
        const coords = this.worldToChunkCoords(x, y, z)
        const chunk = this.getChunk(coords.chunk.x, coords.chunk.z)

        if (chunk) {
            chunk.addBlockInstance(
                coords.block.x,
                coords.block.y,
                coords.block.z
            )
        }
    }

    /**
     * Hide block
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
    */
    hideBlock(x, y, z) {
        const coords = this.worldToChunkCoords(x, y, z)
        const chunk = this.getChunk(coords.chunk.x, coords.chunk.z)

        if (chunk && chunk.isBlockObscured(coords.x, coords.y, coords.z)) {
            chunk.deleteBlockInstance(
                coords.block.x,
                coords.block.y,
                coords.block.z
            )
        }
    }


    /**
     * Add block
     * @param {number} x 
     * @param {number} y 
     * @param {number} z
     * @param {number} blockId 
    */
    addBlock(x, y, z, blockId) {
        const coords = this.worldToChunkCoords(x, y, z)
        const chunk = this.getChunk(coords.chunk.x, coords.chunk.z)

        if (chunk) {
            chunk.addBlock(coords.block.x, coords.block.y, coords.block.z, blockId)
            this.hideBlock(x - 1, y, z)
            this.hideBlock(x + 1, y, z)
            this.hideBlock(x, y + 1, z)
            this.hideBlock(x, y - 1, z)
            this.hideBlock(x, y, z - 1)
            this.hideBlock(x, y, z + 1)
        }
    }

    /**
     * Removes block
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
    */
    removeBlock(x, y, z) {
        const coords = this.worldToChunkCoords(x, y, z)
        const chunk = this.getChunk(coords.chunk.x, coords.chunk.z)

        if (chunk) {
            chunk.removeBlock(coords.block.x, coords.block.y, coords.block.z)
            1
            this.revealBlock(x - 1, y, z)
            this.revealBlock(x + 1, y, z)
            this.revealBlock(x, y + 1, z)
            this.revealBlock(x, y - 1, z)
            this.revealBlock(x, y, z - 1)
            this.revealBlock(x, y, z + 1)
        }
    }
}