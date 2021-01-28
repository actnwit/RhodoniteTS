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
    let p;
    (async () => {
        await Rn.ModuleManager.getInstance().loadModule('webgl');
        await Rn.ModuleManager.getInstance().loadModule('pbr');
        const system = Rn.System.getInstance();
        system.setProcessApproachAndCanvas(Rn.ProcessApproach.UniformWebGL1, document.getElementById('world'));
        // camera
        const entityRepository = Rn.EntityRepository.getInstance();
        const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent, Rn.CameraControllerComponent]);
        const cameraComponent = cameraEntity.getCamera();
        cameraComponent.zNear = 0.1;
        cameraComponent.zFar = 1000.0;
        cameraComponent.setFovyAndChangeFocalLength(30.0);
        cameraComponent.aspect = 1.0;
        // gltf
        const gltfImporter = Rn.GltfImporter.getInstance();
        const expression = await gltfImporter.import('../../../assets/gltf/2.0/AnimatedTriangle/glTF-Embedded/AnimatedTriangle.gltf', {
            cameraComponent: cameraComponent
        });
        // cameraController
        const mainRenderPass = expression.renderPasses[0];
        const mainCameraControllerComponent = cameraEntity.getCameraController();
        const controller = mainCameraControllerComponent.controller;
        controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);
        let count = 0;
        let startTime = Date.now();
        Rn.AnimationComponent.globalTime = 0.05;
        const draw = function () {
            if (p == null && count > 0) {
                p = document.createElement('p');
                p.setAttribute('id', 'rendered');
                p.innerText = 'Rendered.';
                document.body.appendChild(p);
            }
            if (window.isAnimating) {
                const date = new Date();
                const time = (date.getTime() - startTime) / 1000;
                Rn.AnimationComponent.globalTime = time;
                if (time > Rn.AnimationComponent.endInputValue) {
                    startTime = date.getTime();
                }
            }
            system.process([expression]);
            count++;
            requestAnimationFrame(draw);
        };
        draw();
        function setParameterForMeshComponents(meshComponents, shaderSemantic, value) {
            for (let i = 0; i < meshComponents.length; i++) {
                const mesh = meshComponents[i].mesh;
                if (!mesh)
                    continue;
                const primitiveNumber = mesh.getPrimitiveNumber();
                for (let j = 0; j < primitiveNumber; j++) {
                    const primitive = mesh.getPrimitiveAt(j);
                    primitive.material.setParameter(shaderSemantic, value);
                }
            }
        }
    })();
});
//# sourceMappingURL=main.js.map