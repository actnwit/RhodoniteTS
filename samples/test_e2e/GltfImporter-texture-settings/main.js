(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const p = document.createElement('p');
    document.body.appendChild(p);
    (async function () {
        await Rn.ModuleManager.getInstance().loadModule('webgl');
        await Rn.ModuleManager.getInstance().loadModule('pbr');
        const system = Rn.System.getInstance();
        system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));
        // camera
        const entityRepository = Rn.EntityRepository.getInstance();
        const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent]);
        const cameraComponent = cameraEntity.getCamera();
        cameraComponent.zFar = 1000.0;
        cameraComponent.setFovyAndChangeFocalLength(25.0);
        // gltf
        const gltfImporter = Rn.GltfImporter.getInstance();
        const expression = await gltfImporter.import('./../../../assets/gltf/2.0/TextureSettingsTest/glTF-Binary/TextureSettingsTest.glb', {
            cameraComponent: cameraComponent,
            defaultMaterialHelperArgumentArray: [{
                    isLighting: false
                }]
        });
        const cameraControllerComponent = cameraEntity.getCameraController();
        const controller = cameraControllerComponent.controller;
        const rootGroup = expression.renderPasses[0].sceneTopLevelGraphComponents[0].entity;
        controller.setTarget(rootGroup);
        controller.dolly = 0.78;
        draw();
        p.id = 'rendered';
        p.innerText = 'Rendered.';
        function draw() {
            system.process([expression]);
            requestAnimationFrame(draw);
        }
    })();
});
//# sourceMappingURL=main.js.map