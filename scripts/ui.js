import GUI from "three/examples/jsm/libs/lil-gui.module.min.js"

export function createUI(world){
    const gui = new GUI()

    gui.add(world.size, 'width', 8, 128, 1).name('Width')
    gui.add(world.size, 'height', 8, 128, 1).name('Height')
    
    gui.onChange(() => {
        world.generate()
    })
}