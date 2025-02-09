import * as TRHEE from 'three'
import { WorldChunk } from './worldChunk'
import { Player } from './player';

export class World extends TRHEE.Group {

    asyncLoading = true;
    
    drawDistance = 2 ;

    chunkSize = { width: 32, height: 32 }
    params = {
        seed: 0,
        terrain: {
            scale: 30,
            magnitude: 0.1,
            offset: 0.5,
        }
    }

    constructor(seed = 0) {
        super();
        this.seed = seed
    }

    generate() {
        this.disposeChunk()
        for (let x = -this.drawDistance; x <= this.drawDistance; x++) {
            for (let z = -this.drawDistance; z <= this.drawDistance; z++) {
                const chunk = new WorldChunk(this.chunkSize, this.params);
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
        for(const chunk of chunksToAdd){
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
            console.log(`Removed chunk at X: ${chunk.userData.x} Z: ${chunk.userData.z}`)
        }
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     */
    generateChunk(x, z) {
        const chunk = new WorldChunk(this.chunkSize, this.params);
        chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
        chunk.userData = { x, z }

        if(this.asyncLoading){
            requestIdleCallback(chunk.generate.bind(chunk), {timeout: 1000})
        }else{
            chunk.generate();
        }
        this.add(chunk);
        console.log(`Added chunk at X: ${chunk.userData.x} Z: ${chunk.userData.z}`)
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
}