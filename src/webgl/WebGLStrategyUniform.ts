import WebGLResourceRepository, { VertexHandles } from "./WebGLResourceRepository";
import GLSLShader from "./shaders/GLSLShader";
import WebGLStrategy from "./WebGLStrategy";
import MeshComponent from "../foundation/components/MeshComponent";
import WebGLContextWrapper from "./WebGLContextWrapper";
import Primitive from "../foundation/geometry/Primitive";
import CGAPIResourceRepository from "../foundation/renderer/CGAPIResourceRepository";
import RowMajarMatrix44 from "../foundation/math/RowMajarMatrix44";
import Matrix44 from "../foundation/math/Matrix44";
import Matrix33 from "../foundation/math/Matrix33";
import SkeletalComponent from "../foundation/components/SkeletalComponent";
import CameraComponent from "../foundation/components/CameraComponent";
import Entity from "../foundation/core/Entity";
import SceneGraphComponent from "../foundation/components/SceneGraphComponent";
import { ShaderSemantics, ShaderSemanticsInfo } from "../foundation/definitions/ShaderSemantics";
import EntityRepository from "../foundation/core/EntityRepository";
import ComponentRepository from "../foundation/core/ComponentRepository";
import LightComponent from "../foundation/components/LightComponent";
import Config from "../foundation/core/Config";
import ModuleManager from "../foundation/system/ModuleManager";
import { PixelFormat } from "../foundation/definitions/PixelFormat";
import { ComponentType } from "../foundation/definitions/ComponentType";
import { TextureParameter } from "../foundation/definitions/TextureParameter";
import CubeTexture from "../foundation/textures/CubeTexture";
import MeshRendererComponent from "../foundation/components/MeshRendererComponent";
import MaterialHelper from "../foundation/helpers/MaterialHelper";
import { CompositionType } from "../foundation/definitions/CompositionType";
import Material from "../foundation/materials/Material";
import MutableMatrix44 from "../foundation/math/MutableMatrix44";
import MutableRowMajarMatrix44 from "../foundation/math/MutableRowMajarMatrix44";
import Vector3 from "../foundation/math/Vector3";
import { HdriFormat } from "../foundation/definitions/HdriFormat";
import RenderPass from "../foundation/renderer/RenderPass";

export default class WebGLStrategyUniform implements WebGLStrategy {
  private static __instance: WebGLStrategyUniform;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private static __vertexHandleOfPrimitiveObjectUids: Map<ObjectUID, VertexHandles> = new Map();
  private __lightComponents?: LightComponent[];
  private __dummyWhiteTextureUid?: CGAPIResourceHandle;
  private __dummyBlackTextureUid?: CGAPIResourceHandle;
  private __dummyBlackCubeTextureUid?: CGAPIResourceHandle;

  private __pbrCookTorranceBrdfLutDataUrlUid?: CGAPIResourceHandle;

  private vertexShaderMethodDefinitions_uniform: string =
    `
  uniform mat4 u_worldMatrix;
  uniform mat4 u_viewMatrix;
  uniform mat4 u_projectionMatrix;
  uniform mat3 u_normalMatrix;

  mat4 getMatrix(float instanceId) {
    return u_worldMatrix;
  }

  mat4 getViewMatrix(float instanceId) {
    return u_viewMatrix;
  }

  mat4 getProjectionMatrix(float instanceId) {
    return u_projectionMatrix;
  }

  mat3 getNormalMatrix(float instanceId) {
    return u_normalMatrix;
  }
  `;

  private __lastShader: CGAPIResourceHandle = -1;
  private static transposedMatrix44 = new MutableRowMajarMatrix44([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  private constructor() { }

  setupShaderProgram(meshComponent: MeshComponent): void {
    const primitiveNum = meshComponent!.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent!.getPrimitiveAt(i);
      const material = primitive.material;
      if (material) {
        if (material._shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
          return;
        }
        const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
        const gl = glw.getRawContext();

        // Shader Setup
        material.createProgram(this.vertexShaderMethodDefinitions_uniform);

        const args: ShaderSemanticsInfo[] = [
          { semantic: ShaderSemantics.WorldMatrix, isPlural: false, isSystem: true },
          { semantic: ShaderSemantics.ViewMatrix, isPlural: false, isSystem: true },
          { semantic: ShaderSemantics.ProjectionMatrix, isPlural: false, isSystem: true },
          { semantic: ShaderSemantics.NormalMatrix, isPlural: false, isSystem: true },
          { semantic: ShaderSemantics.BoneMatrix, isPlural: true, isSystem: true },
          { semantic: ShaderSemantics.BoneCompressedChank, isPlural: true, isSystem: true },
          { semantic: ShaderSemantics.BoneCompressedInfo, isPlural: false, isSystem: true },
          { semantic: ShaderSemantics.LightNumber, isPlural: false, isSystem: true },
          { semantic: ShaderSemantics.ViewPosition, isPlural: false, isSystem: true },
          { semantic: ShaderSemantics.SkinningMode, compositionType: CompositionType.Scalar, componentType: ComponentType.Int, isPlural: false, isSystem: true },
          { semantic: ShaderSemantics.DiffuseEnvTexture, compositionType: CompositionType.TextureCube, componentType: ComponentType.Int, isPlural: false, isSystem: true },
          { semantic: ShaderSemantics.SpecularEnvTexture, compositionType: CompositionType.TextureCube, componentType: ComponentType.Int, isPlural: false, isSystem: true },
          { semantic: ShaderSemantics.IBLParameter, compositionType: CompositionType.Vec4, componentType: ComponentType.Float, isPlural: false, isSystem: true },
          { semantic: ShaderSemantics.BrdfLutTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, isPlural: false, isSystem: true },
          { semantic: ShaderSemantics.VertexAttributesExistenceArray, compositionType: CompositionType.Scalar, componentType: ComponentType.Int, isPlural: false, isSystem: true },
          { semantic: ShaderSemantics.PointSize, compositionType: CompositionType.Scalar, componentType: ComponentType.Float, isPlural: false, isSystem: true },
          { semantic: ShaderSemantics.HDRIFormat, compositionType: CompositionType.Vec2, componentType: ComponentType.Int, isPlural: false, isSystem: true },
        ];

        if (primitive.primitiveMode.index === gl.POINTS) {
          args.push(
            { semantic: ShaderSemantics.PointSize, compositionType: CompositionType.Scalar, componentType: ComponentType.Float, isPlural: false, isSystem: true, initialValue: 30.0 },
            { semantic: ShaderSemantics.PointDistanceAttenuation, compositionType: CompositionType.Vec3, componentType: ComponentType.Float, isPlural: false, isSystem: true, initialValue: new Vector3(0.0, 0.1, 0.01) },
          );
        }

        const lights: ShaderSemanticsInfo[] = [];
        for (let i = 0; i < Config.maxLightNumberInShader; i++) {
          lights.push({ semantic: ShaderSemantics.LightPosition, isPlural: false, prefix: `lights[${i}].`, index: i, isSystem: true });
          lights.push({ semantic: ShaderSemantics.LightDirection, isPlural: false, prefix: `lights[${i}].`, index: i, isSystem: true });
          lights.push({ semantic: ShaderSemantics.LightIntensity, isPlural: false, prefix: `lights[${i}].`, index: i, isSystem: true });
        }

        this.__webglResourceRepository.setupUniformLocations(material._shaderProgramUid, args.concat(lights));

        material.setUniformLocations(material._shaderProgramUid);
      }
    }
  }

  async $load(meshComponent: MeshComponent) {

    this.setupShaderProgram(meshComponent);

    const primitiveNum = meshComponent!.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent!.getPrimitiveAt(i);
      const vertexHandles = this.__webglResourceRepository.createVertexDataResources(primitive);
      WebGLStrategyUniform.__vertexHandleOfPrimitiveObjectUids.set(primitive.primitiveUid, vertexHandles);
    }

    this.__dummyWhiteTextureUid = this.__webglResourceRepository.createDummyTexture();
    this.__dummyBlackTextureUid = this.__webglResourceRepository.createDummyTexture("rgba(0, 0, 0, 1)");
    this.__dummyBlackCubeTextureUid = this.__webglResourceRepository.createDummyCubeTexture();
    const pbrCookTorranceBrdfLutDataUrl = ModuleManager.getInstance().getModule('pbr').pbrCookTorranceBrdfLutDataUrl;
    this.__pbrCookTorranceBrdfLutDataUrlUid = await this.__webglResourceRepository.createTextureFromDataUri(pbrCookTorranceBrdfLutDataUrl,
      {
        level: 0, internalFormat: PixelFormat.RGBA,
        border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Linear, minFilter: TextureParameter.Linear,
        wrapS: TextureParameter.ClampToEdge, wrapT: TextureParameter.ClampToEdge, generateMipmap: false, anisotropy: false
      }
    );
  }

  $prerender(meshComponent: MeshComponent, instanceIDBufferUid: WebGLResourceHandle) {
    const vertexHandles = [];
    const primitiveNum = meshComponent!.getPrimitiveNumber();

    if (meshComponent.weights.length > 0) {
      for (let i = 0; i < primitiveNum; i++) {
        const primitive = meshComponent!.getPrimitiveAt(i);
        vertexHandles[i] = WebGLStrategyUniform.__vertexHandleOfPrimitiveObjectUids.get(primitive.primitiveUid)!;
        this.__webglResourceRepository.resendVertexBuffer(primitive, vertexHandles[i].vboHandles);
      }
    }

    for (let i = 0; i < primitiveNum; i++) {

      const primitive = meshComponent!.getPrimitiveAt(i);
      vertexHandles[i] = WebGLStrategyUniform.__vertexHandleOfPrimitiveObjectUids.get(primitive.primitiveUid)!;
      if (!vertexHandles[i].setComplete) {

        //continue;
      }
      this.__webglResourceRepository.setVertexDataToPipeline(vertexHandles[i], primitive, instanceIDBufferUid);
      vertexHandles[i].setComplete = true;
    }
  }

  common_$prerender(): void {
    const componentRepository = ComponentRepository.getInstance();
    this.__lightComponents = componentRepository.getComponentsWithType(LightComponent) as LightComponent[];
  };

  attachGPUData(primitive: Primitive): void {
  };

  attatchShaderProgram(material: Material): void {
  }

  attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle) {
    const vertexHandle = WebGLStrategyUniform.__vertexHandleOfPrimitiveObjectUids.get(primitive.primitiveUid)!;
    const vaoHandles = vertexHandle;
    const vao = this.__webglResourceRepository.getWebGLResource(vaoHandles.vaoHandle) as WebGLVertexArrayObjectOES;
    const gl = glw.getRawContext();

    if (vao != null) {
      glw.bindVertexArray(vao);
    }
    else {
      this.__webglResourceRepository.setVertexDataToPipeline(vaoHandles, primitive, instanceIDBufferUid);
      const ibo = this.__webglResourceRepository.getWebGLResource(vaoHandles.iboHandle!);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    }
  }

  dettachVertexData(glw: WebGLContextWrapper) {
    const gl = glw.getRawContext();
    if (glw.bindVertexArray) {
      glw.bindVertexArray(null);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new WebGLStrategyUniform();
    }

    return this.__instance;
  }

  common_$render(primitive: Primitive, viewMatrix: Matrix44, projectionMatrix: Matrix44) {
    return false;
  }

  $render(meshComponent: MeshComponent, worldMatrix: RowMajarMatrix44, normalMatrix: Matrix33, entity: Entity, renderPass: RenderPass, diffuseCube?: CubeTexture, specularCube?: CubeTexture) {
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();

    if (meshComponent.componentSID === MeshRendererComponent.firstOpaqueSid) {
      gl.disable(gl.BLEND);
      gl.depthMask(true);
    }
    if (meshComponent.componentSID == MeshRendererComponent.firstTranparentSid) {
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
      gl.depthMask(false);
    }

    const primitiveNum = meshComponent.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent.getPrimitiveAt(i);
      //this.attatchShaderProgram(primitive.material!);

      this.attachVertexData(i, primitive, glw, CGAPIResourceRepository.InvalidCGAPIResourceUid);

      const material = primitive.material;
      const shaderProgram = this.__webglResourceRepository.getWebGLResource(material!._shaderProgramUid)! as WebGLShader;
      const shaderProgramUid = material!._shaderProgramUid;

      let force = false;
      if (shaderProgramUid !== this.__lastShader) {
        gl.useProgram(shaderProgram);
        this.__lastShader = shaderProgramUid;
        force = true;
      }

      // Uniforms from System
      const vertexHandle = WebGLStrategyUniform.__vertexHandleOfPrimitiveObjectUids.get(primitive.primitiveUid)!;
      this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.VertexAttributesExistenceArray, false, 1, 'i', true, { x: vertexHandle.attributesFlags }, { force: force });

      /// Matrices
      RowMajarMatrix44.transposeTo(worldMatrix, WebGLStrategyUniform.transposedMatrix44);
      this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.WorldMatrix, true, 4, 'f', true, { x: WebGLStrategyUniform.transposedMatrix44.v }, { force: force });
      this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.NormalMatrix, true, 3, 'f', true, { x: normalMatrix.v }, { force: force });
      const cameraComponent = renderPass.cameraComponent;
      if (cameraComponent) {
        this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.ViewMatrix, true, 4, 'f', true, { x: cameraComponent.viewMatrix.v }, { force: force });
        this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.ProjectionMatrix, true, 4, 'f', true, { x: cameraComponent.projectionMatrix.v }, { force: force });

        // ViewPosition
        const cameraPosition = cameraComponent.worldPosition;
        this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.ViewPosition, false, 3, 'f', true, { x: cameraPosition.v }, { force: force });
      }

      // Lights
      this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.LightNumber, false, 1, 'i', false, { x: this.__lightComponents!.length }, { force: force });
      for (let i = 0; i < this.__lightComponents!.length; i++) {
        if (i >= Config.maxLightNumberInShader) {
          break;
        }
        const lightComponent = this.__lightComponents![i];
        const sceneGraphComponent = lightComponent.entity.getSceneGraph();
        const worldLightPosition = sceneGraphComponent.worldPosition;
        const worldLightDirection = lightComponent.direction;
        const worldLightIntensity = lightComponent.intensity;
        this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.LightPosition, false, 4, 'f', false, { x: worldLightPosition.x, y: worldLightPosition.y, z: worldLightPosition.z, w: lightComponent.type.index }, { force: force }, i);
        this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.LightDirection, false, 4, 'f', false, { x: worldLightDirection.x, y: worldLightDirection.y, z: worldLightDirection.z, w: 0 }, { force: force }, i);
        this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.LightIntensity, false, 4, 'f', false, { x: worldLightIntensity.x, y: worldLightIntensity.y, z: worldLightIntensity.z, w: 0 }, { force: force }, i);
      }

      /// Skinning
      const skeletalComponent = entity.getComponent(SkeletalComponent) as SkeletalComponent;
      if (skeletalComponent) {
        const jointMatrices = skeletalComponent.jointMatrices;
        const jointCompressedChanks = skeletalComponent.jointCompressedChanks;
        this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.BoneMatrix, true, 4, 'f', true, { x: jointMatrices! }, { force: force });
        this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.BoneCompressedChank, false, 4, 'f', true, { x: jointCompressedChanks! }, { force: force });
        this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.BoneCompressedInfo, false, 4, 'f', true, { x: skeletalComponent.jointCompressedInfo!.v }, { force: force });
        this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.SkinningMode, false, 1, 'i', false, { x: true }, { force: force });
      } else {
        this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.SkinningMode, false, 1, 'i', false, { x: false }, { force: force });
      }

      let updated: boolean;
      // Env map
      updated = this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.DiffuseEnvTexture, false, 1, 'i', false, { x: 6 }, { force: force });
      if (updated) {
        gl.activeTexture(gl.TEXTURE6);
        if (diffuseCube && diffuseCube.isTextureReady) {
          const texture = this.__webglResourceRepository.getWebGLResource(diffuseCube.cgApiResourceUid!);
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        } else {
          const texture = this.__webglResourceRepository.getWebGLResource(this.__dummyBlackCubeTextureUid!);
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        }
      }
      updated = this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.SpecularEnvTexture, false, 1, 'i', false, { x: 7 }, { force: force });
      if (updated) {
        gl.activeTexture(gl.TEXTURE7);
        if (specularCube && specularCube.isTextureReady) {
          const texture = this.__webglResourceRepository.getWebGLResource(specularCube.cgApiResourceUid!);
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        } else {
          const texture = this.__webglResourceRepository.getWebGLResource(this.__dummyBlackCubeTextureUid!);
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        }
      }
      let mipmapLevelNumber = 1;
      if (specularCube) {
        mipmapLevelNumber = specularCube.mipmapLevelNumber;
      }
      const meshRenderComponent = entity.getComponent(MeshRendererComponent) as MeshRendererComponent;
      this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.IBLParameter, false, 4, 'f', false, { x: mipmapLevelNumber, y: meshRenderComponent!.diffuseCubeMapContribution, z: meshRenderComponent!.specularCubeMapContribution, w: meshRenderComponent!.rotationOfCubeMap }, { force: force })
      let diffuseHdriType = HdriFormat.LDR_SRGB.index;
      let specularHdriType = HdriFormat.LDR_SRGB.index;
      if (meshRenderComponent.diffuseCubeMap) {
        diffuseHdriType = meshRenderComponent.diffuseCubeMap!.hdriFormat.index;
      }
      if (meshRenderComponent.specularCubeMap) {
        specularHdriType = meshRenderComponent.specularCubeMap!.hdriFormat.index;
      }

      this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.HDRIFormat, false, 2, 'i', false, { x: diffuseHdriType, y: specularHdriType }, { force: force })

      // BRDF LUT
      updated = this.__webglResourceRepository.setUniformValue(shaderProgramUid, ShaderSemantics.BrdfLutTexture, false, 1, 'i', false, { x: 5 }, { force: force });
      if (updated) {
        gl.activeTexture(gl.TEXTURE5);
        if (this.__pbrCookTorranceBrdfLutDataUrlUid != null) {
          const texture = this.__webglResourceRepository.getWebGLResource(this.__pbrCookTorranceBrdfLutDataUrlUid!);
          gl.bindTexture(gl.TEXTURE_2D, texture);
        } else {
          const texture = this.__webglResourceRepository.getWebGLResource(this.__dummyWhiteTextureUid!);
          gl.bindTexture(gl.TEXTURE_2D, texture);
        }
      }

      if (material) {
        material.setUniformValues(shaderProgramUid, force);
      }

      if (primitive.indicesAccessor) {
        gl.drawElements(primitive.primitiveMode.index, primitive.indicesAccessor.elementCount, primitive.indicesAccessor.componentType.index, 0);
      } else {
        gl.drawArrays(primitive.primitiveMode.index, 0, primitive.getVertexCountAsVerticesBased());
      }
      this.dettachVertexData(glw);

    }
    //    gl.useProgram(null);
    this.__lastShader = -1;
  }

}

