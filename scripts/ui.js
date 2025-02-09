import GUI from "three/examples/jsm/libs/lil-gui.module.min.js"
import { blocks, resources } from "./blocks"

export function createUI(world, player, scene){
    const gui = new GUI()

    const sceneFodler = gui.addFolder('Scene')
    sceneFodler.add(scene.fog, 'near', 10, 50, 1).name('Near')
    sceneFodler.add(scene.fog, 'far', 50, 200, 1).name('far')

    const playerFolder = gui.addFolder('Player')
    playerFolder.add(player, 'maxSpeed', 1, 20).name('Max Speed')
    playerFolder.add(player.cameraHelper, 'visible').name("Helper")
    
    const terrainFolder = gui.addFolder('Terrain')
    terrainFolder.add(world, 'asyncLoading').name('Async Loading')
    terrainFolder.add(world, 'drawDistance', 0, 5, 1).name('Draw Distance')
    terrainFolder.add(world.params, 'seed', 0, 10000).name('Seed')
    terrainFolder.add(world.params.terrain, 'scale', 10, 100).name('Scale')
    terrainFolder.add(world.params.terrain, 'magnitude', 0, 1).name('Magnitude')
    terrainFolder.add(world.params.terrain, 'offset', 0, 1).name('Offset')

    const resourcesFolder = gui.addFolder('Resources')
    resources.forEach((resource) => {
        const resourceFolder = resourcesFolder.addFolder(resource.name)
        resourceFolder.add(resource, 'scarcity', 0, 1).name('Scarcity')

        const scaleFoler = resourceFolder.addFolder('Scale')
        scaleFoler.add(resource.scale, 'x', 10, 100).name('X Scale')
        scaleFoler.add(resource.scale, 'y', 10, 100).name('Y Scale')
        scaleFoler.add(resource.scale, 'z', 10, 100).name('Z Scale')
    })


    gui.onChange(() => {
        world.generate()
    })
}