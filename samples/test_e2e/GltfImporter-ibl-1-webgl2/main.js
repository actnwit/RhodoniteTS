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
    (async () => {
        await Rn.ModuleManager.getInstance().loadModule('webgl');
        await Rn.ModuleManager.getInstance().loadModule('pbr');
        const system = Rn.System.getInstance();
        system.setProcessApproachAndCanvas(Rn.ProcessApproach.FastestWebGL2, document.getElementById('world'));
        // expressions
        const expressions = [];
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
        const mainExpression = await gltfImporter.import('../../../assets/gltf/2.0/FlightHelmet/glTF/FlightHelmet.gltf', {
            cameraComponent: cameraComponent
        });
        expressions.push(mainExpression);
        // post effects
        const expressionPostEffect = new Rn.Expression();
        expressions.push(expressionPostEffect);
        // gamma correction (and super sampling)
        const mainRenderPass = mainExpression.renderPasses[0];
        const gammaTargetFramebuffer = Rn.RenderableHelper.createTexturesForRenderTarget(600, 600, 1, {});
        mainRenderPass.setFramebuffer(gammaTargetFramebuffer);
        mainRenderPass.toClearColorBuffer = true;
        mainRenderPass.toClearDepthBuffer = true;
        const gammaRenderPass = createPostEffectRenderPass('createGammaCorrectionMaterial');
        setTextureParameterForMeshComponents(gammaRenderPass.meshComponents, Rn.ShaderSemantics.BaseColorTexture, gammaTargetFramebuffer.getColorAttachedRenderTargetTexture(0));
        expressionPostEffect.addRenderPasses([gammaRenderPass]);
        // cameraController
        const mainCameraControllerComponent = cameraEntity.getCameraController();
        const controller = mainCameraControllerComponent.controller;
        controller.setTarget(mainRenderPass.sceneTopLevelGraphComponents[0].entity);
        controller.dolly = 0.83;
        // lighting
        setIBL('./../../../assets/ibl/papermill');
        let count = 0;
        const draw = function () {
            if (count > 100) {
                p.id = 'rendered';
                p.innerText = 'Rendered.';
            }
            else if (count === 1) {
                p.id = 'started';
                p.innerText = 'Started.';
            }
            system.process(expressions);
            count++;
            requestAnimationFrame(draw);
        };
        draw();
    })();
    function setIBL(baseUri) {
        const specularCubeTexture = new Rn.CubeTexture();
        specularCubeTexture.baseUriToLoad = baseUri + '/specular/specular';
        specularCubeTexture.isNamePosNeg = true;
        specularCubeTexture.hdriFormat = Rn.HdriFormat.RGBE_PNG;
        specularCubeTexture.mipmapLevelNumber = 10;
        const diffuseCubeTexture = new Rn.CubeTexture();
        diffuseCubeTexture.baseUriToLoad = baseUri + '/diffuse/diffuse';
        diffuseCubeTexture.hdriFormat = Rn.HdriFormat.RGBE_PNG;
        diffuseCubeTexture.mipmapLevelNumber = 1;
        diffuseCubeTexture.isNamePosNeg = true;
        const componentRepository = Rn.ComponentRepository.getInstance();
        const meshRendererComponents = componentRepository.getComponentsWithType(Rn.MeshRendererComponent);
        for (let i = 0; i < meshRendererComponents.length; i++) {
            const meshRendererComponent = meshRendererComponents[i];
            meshRendererComponent.specularCubeMap = specularCubeTexture;
            meshRendererComponent.diffuseCubeMap = diffuseCubeTexture;
        }
    }
    function createPostEffectRenderPass(materialHelperFunctionStr, arrayOfHelperFunctionArgument = []) {
        const boardPrimitive = new Rn.Plane();
        boardPrimitive.generate({
            width: 1, height: 1, uSpan: 1, vSpan: 1, isUVRepeat: false,
            material: Rn.MaterialHelper[materialHelperFunctionStr].apply(this, arrayOfHelperFunctionArgument)
        });
        const boardEntity = generateEntity();
        boardEntity.getTransform().rotate = new Rn.Vector3(Math.PI / 2, 0.0, 0.0);
        boardEntity.getTransform().translate = new Rn.Vector3(0.0, 0.0, -0.5);
        const boardMesh = new Rn.Mesh();
        boardMesh.addPrimitive(boardPrimitive);
        const boardMeshComponent = boardEntity.getMesh();
        boardMeshComponent.setMesh(boardMesh);
        const entityRepository = Rn.EntityRepository.getInstance();
        const cameraEntity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.CameraComponent]);
        const cameraComponent = cameraEntity.getCamera();
        cameraComponent.zFarInner = 1.0;
        const renderPass = new Rn.RenderPass();
        renderPass.cameraComponent = cameraComponent;
        renderPass.addEntities([boardEntity]);
        return renderPass;
    }
    function generateEntity() {
        const entityRepository = Rn.EntityRepository.getInstance();
        const entity = entityRepository.createEntity([Rn.TransformComponent, Rn.SceneGraphComponent, Rn.MeshComponent, Rn.MeshRendererComponent]);
        return entity;
    }
    function setTextureParameterForMeshComponents(meshComponents, shaderSemantic, value) {
        for (let i = 0; i < meshComponents.length; i++) {
            const mesh = meshComponents[i].mesh;
            if (!mesh)
                continue;
            const primitiveNumber = mesh.getPrimitiveNumber();
            for (let j = 0; j < primitiveNumber; j++) {
                const primitive = mesh.getPrimitiveAt(j);
                primitive.material.setTextureParameter(shaderSemantic, value);
            }
        }
    }
});
//# sourceMappingURL=main.js.map