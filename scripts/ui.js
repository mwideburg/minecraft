import GUI from "three/examples/jsm/libs/lil-gui.module.min.js"
import { blocks, resources } from "./blocks"

export function createUI(world, player, scene){
    const gui = new GUI()

    const sceneFodler = gui.addFolder('Scene')
    sceneFodler.add(scene.fog, 'near', 10, 50, 1).name('Near')
    sceneFodler.add(scene.fog, 'far', 50, 200, 1).name('Far')

    const playerFolder = gui.addFolder('Player')
    playerFolder.add(player, 'maxSpeed', 1, 20).name('Max Speed')
    playerFolder.add(player.cameraHelper, 'visible').name("Helper")
    
    const terrainFolder = gui.addFolder('Terrain')
    terrainFolder.add(world, 'asyncLoading').name('Async Loading')
    terrainFolder.add(world, 'drawDistance', 0, 5, 1).name('Draw Distance')
    terrainFolder.add(world.params, 'seed', 0, 10000).name('Seed')
    terrainFolder.add(world.params.terrain, 'scale', 10, 100).name('Scale')
    terrainFolder.add(world.params.terrain, 'magnitude', 0, 32, 1).name('Magnitude')
    terrainFolder.add(world.params.terrain, 'offset', 0, 32, 1).name('Offset')
    // Water
    terrainFolder.add(world.params.terrain, 'waterOffset', 0, 20, 1).name('Water Offset')
    
    //Trees
    const treeFolder = terrainFolder.addFolder('Trees')
    treeFolder.add(world.params.trees, 'frequency', 0, 0.1).name('Frequency')
    const trunkFolder = treeFolder.addFolder('Trunk')
    trunkFolder.add(world.params.trees.trunk, 'minHeight', 0, 10, 1).name('MinHeight')
    trunkFolder.add(world.params.trees.trunk, 'maxHeight', 0, 10, 1).name('MaxHeight')
    const canopyFolder = treeFolder.addFolder('Canopy')
    canopyFolder.add(world.params.trees.canopy, 'minRadius', 0, 10, 1).name('MinRadius')
    canopyFolder.add(world.params.trees.canopy, 'maxRadius', 0, 10, 1).name('MaxRadius')
    canopyFolder.add(world.params.trees.canopy, 'density', 0, 1).name('Canopy Density')

    // Clouds
    const cloudsFolder = terrainFolder.addFolder('Clouds')
    cloudsFolder.add(world.params.clouds, 'scale', 0, 100).name('Scale')
    cloudsFolder.add(world.params.clouds, 'density', 0, 1).name('Density')

    

    const resourcesFolder = terrainFolder.addFolder('Resources')
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