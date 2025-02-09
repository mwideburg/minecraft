import * as TRHEE from 'three'
import { WorldChunk } from './worldChunk'

export class World extends TRHEE.Group {
    chunkSize = { width: 64, height: 16 }
    params = {
        seed: 0,
        terrain: {
            scale: 20,
            magnitude: 0.5,
            offset: 0.2,
        }
    }

    constructor(seed = 0) {
        super();
        this.seed = seed
    }

    generate() {
        this.disposeChunk()
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                const chunk = new WorldChunk(this.chunkSize, this.params);
                chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
                chunk.generate();
                chunk.userData = { x, z }
                this.add(chunk);
            }
        }
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