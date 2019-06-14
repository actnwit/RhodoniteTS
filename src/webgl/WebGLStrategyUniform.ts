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
import { ShaderSemantics, ShaderSemanticsInfo, ShaderSemanticsEnum } from "../foundation/definitions/ShaderSemantics";
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
import { ShaderVariableUpdateIntervalEnum, ShaderVariableUpdateInterval } from "../foundation/definitions/ShaderVariableUpdateInterval";
import Vector4 from "../foundation/math/Vector4";
import Vector2 from "../foundation/math/Vector2";

type ShaderVariableArguments = {gl: WebGLRenderingContext, shaderProgram: WebGLProgram, primitive: Primitive, shaderProgramUid: WebGLResourceHandle,
  entity: Entity, worldMatrix: RowMajarMatrix44, normalMatrix: Matrix33, renderPass: RenderPass,
  diffuseCube?: CubeTexture, specularCube?: CubeTexture, firstTime:boolean, updateInterval?: ShaderVariableUpdateIntervalEnum};

export default class WebGLStrategyUniform implements WebGLStrategy {
  private static __instance: WebGLStrategyUniform;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private static __vertexHandleOfPrimitiveObjectUids: Map<ObjectUID, VertexHandles> = new Map();
  private __lightComponents?: LightComponent[];
  private __dummyWhiteTextureUid?: CGAPIResourceHandle;
  private __dummyBlackTextureUid?: CGAPIResourceHandle;
  private __dummyBlackCubeTextureUid?: CGAPIResourceHandle;
  // private __shaderSemanticsInfoMap: Map<ShaderSemanticsEnum, ShaderSemanticsInfo> = new Map();
  private static __isOpaqueMode = true;
  private __webglShaderProgram?: WebGLProgram;
  private __lastRenderPassCullFace = false;
  private __pointDistanceAttenuation = new Vector3(0.0, 0.1, 0.01);


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

        let args: ShaderSemanticsInfo[] = [
          {semantic: ShaderSemantics.VertexAttributesExistenceArray, compositionType: CompositionType.ScalarArray, componentType: ComponentType.Int, min: 0, max: 1, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
          {semantic: ShaderSemantics.WorldMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
          {semantic: ShaderSemantics.NormalMatrix, compositionType: CompositionType.Mat3, componentType: ComponentType.Float, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
          {semantic: ShaderSemantics.ViewMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
          {semantic: ShaderSemantics.ProjectionMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
          {semantic: ShaderSemantics.ViewPosition, compositionType: CompositionType.Vec3, componentType: ComponentType.Float, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
          {semantic: ShaderSemantics.BoneMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isPlural: true, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
          {semantic: ShaderSemantics.BoneCompressedChank, compositionType: CompositionType.Vec4Array, componentType: ComponentType.Float, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isPlural: true, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
          {semantic: ShaderSemantics.BoneCompressedInfo, compositionType: CompositionType.Vec4, componentType: ComponentType.Float, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
          {semantic: ShaderSemantics.SkinningMode, compositionType: CompositionType.Scalar, componentType: ComponentType.Int, min: 0, max: 1, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
          {semantic: ShaderSemantics.DiffuseEnvTexture, compositionType: CompositionType.TextureCube, componentType: ComponentType.Int, min: 0, max: Number.MAX_SAFE_INTEGER, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
          {semantic: ShaderSemantics.SpecularEnvTexture, compositionType: CompositionType.TextureCube, componentType: ComponentType.Int, min: 0, max: Number.MAX_SAFE_INTEGER, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
          {semantic: ShaderSemantics.IBLParameter, compositionType: CompositionType.Vec4, componentType: ComponentType.Float, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
          {semantic: ShaderSemantics.HDRIFormat, compositionType: CompositionType.Vec2, componentType: ComponentType.Int, min: 0, max: 5, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
          {semantic: ShaderSemantics.BrdfLutTexture, compositionType: CompositionType.Texture2D, componentType: ComponentType.Int, min: 0, max: Number.MAX_SAFE_INTEGER, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
          {semantic: ShaderSemantics.LightNumber, compositionType: CompositionType.Scalar, componentType: ComponentType.Int, min: 0, max: Number.MAX_SAFE_INTEGER, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
        ];

        if (primitive.primitiveMode.index === gl.POINTS) {
          args.push(
            {semantic: ShaderSemantics.PointSize, compositionType: CompositionType.Scalar, componentType: ComponentType.Float, min: 0, max: Number.MAX_VALUE, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
            {semantic: ShaderSemantics.PointDistanceAttenuation, compositionType: CompositionType.Vec3, componentType: ComponentType.Float, min: 0, max: 1, isPlural: false, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime },
          );
        }

        const lights: ShaderSemanticsInfo[] = [];
        for (let i = 0; i < Config.maxLightNumberInShader; i++) {
          lights.push({semantic: ShaderSemantics.LightPosition, compositionType: CompositionType.Vec4, componentType: ComponentType.Float, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isPlural: false, prefix: `lights[${i}].`, index: i, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime});
          lights.push({semantic: ShaderSemantics.LightDirection, compositionType: CompositionType.Vec4, componentType: ComponentType.Float, min: -1, max: 1, isPlural: false, prefix: `lights[${i}].`, index: i, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime});
          lights.push({semantic: ShaderSemantics.LightIntensity, compositionType: CompositionType.Vec4, componentType: ComponentType.Float, min: 0, max: 10, isPlural: false, prefix: `lights[${i}].`, index: i, isSystem: true });
        }

        args = args.concat(lights);

        this.__webglShaderProgram = this.__webglResourceRepository.setupUniformLocations(material._shaderProgramUid, args);

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

  static isOpaqueMode() {
    return WebGLStrategyUniform.__isOpaqueMode;
  }

  static isTransparentMode() {
    return !WebGLStrategyUniform.__isOpaqueMode;
  }

  private __setUniformBySystem({gl, shaderProgram, primitive, shaderProgramUid,
    entity, worldMatrix, normalMatrix, renderPass,
    diffuseCube, specularCube, firstTime}: ShaderVariableArguments) {

    const args: ShaderVariableArguments = {gl, shaderProgram, primitive, shaderProgramUid,
      entity, worldMatrix, normalMatrix, renderPass,
      diffuseCube, specularCube, firstTime};
    // Uniforms from System
    const vertexHandle = WebGLStrategyUniform.__vertexHandleOfPrimitiveObjectUids.get(primitive.primitiveUid)!;
    this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.VertexAttributesExistenceArray.str, firstTime, vertexHandle.attributesFlags);

    /// Matrices
    RowMajarMatrix44.transposeTo(worldMatrix, WebGLStrategyUniform.transposedMatrix44);
    this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.WorldMatrix.str, firstTime, WebGLStrategyUniform.transposedMatrix44);
    this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.NormalMatrix.str, firstTime, normalMatrix);
    const cameraComponent = renderPass.cameraComponent;
    if (cameraComponent) {
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.ViewMatrix.str, firstTime, cameraComponent.viewMatrix);
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.ProjectionMatrix.str, firstTime, cameraComponent.projectionMatrix);

      // ViewPosition
      const cameraPosition = cameraComponent.worldPosition;
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.ViewPosition.str, firstTime, cameraPosition);
    }

    /// Skinning
    const skeletalComponent = entity.getComponent(SkeletalComponent) as SkeletalComponent;
    if (skeletalComponent) {
      const jointMatrices = skeletalComponent.jointMatrices;
      const jointCompressedChanks = skeletalComponent.jointCompressedChanks;
      if (jointMatrices != null) {
        this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.BoneMatrix.str, firstTime, jointMatrices );
      }
      if (jointCompressedChanks != null) {
        this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.BoneCompressedChank.str, firstTime, jointCompressedChanks);
        this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.BoneCompressedInfo.str, firstTime, skeletalComponent.jointCompressedInfo);
      }
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.SkinningMode.str, firstTime, true);
    } else {
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.SkinningMode.str, firstTime, false);
    }

    let updated: boolean;
    // Env map
    updated = this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.DiffuseEnvTexture.str, firstTime, [6, -1]);
    if (updated) {
      gl.activeTexture(gl.TEXTURE6);
      if (diffuseCube && diffuseCube.isTextureReady) {
        const texture = this.__webglResourceRepository.getWebGLResource(diffuseCube.cgApiResourceUid!) as WebGLTexture;
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      } else {
        const texture = this.__webglResourceRepository.getWebGLResource(this.__dummyBlackCubeTextureUid!) as WebGLTexture;
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      }
    }
    updated = this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.SpecularEnvTexture.str, firstTime, [7, -1]);
    if (updated) {
      gl.activeTexture(gl.TEXTURE7);
      if (specularCube && specularCube.isTextureReady) {
        const texture = this.__webglResourceRepository.getWebGLResource(specularCube.cgApiResourceUid!) as WebGLTexture;
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      } else {
        const texture = this.__webglResourceRepository.getWebGLResource(this.__dummyBlackCubeTextureUid!) as WebGLTexture;
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      }
    }

    let mipmapLevelNumber = 1;
    if (specularCube) {
      mipmapLevelNumber = specularCube.mipmapLevelNumber;
    }
    const meshRenderComponent = entity.getComponent(MeshRendererComponent) as MeshRendererComponent;
    this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.IBLParameter.str, firstTime,
      { x: mipmapLevelNumber, y: meshRenderComponent!.diffuseCubeMapContribution,
        z: meshRenderComponent!.specularCubeMapContribution, w: meshRenderComponent!.rotationOfCubeMap },
      );

    let diffuseHdriType = HdriFormat.LDR_SRGB.index;
    let specularHdriType = HdriFormat.LDR_SRGB.index;
    if (meshRenderComponent.diffuseCubeMap) {
      diffuseHdriType = meshRenderComponent.diffuseCubeMap!.hdriFormat.index;
    }
    if (meshRenderComponent.specularCubeMap) {
      specularHdriType = meshRenderComponent.specularCubeMap!.hdriFormat.index;
    }
    this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.HDRIFormat.str, firstTime, { x: diffuseHdriType, y: specularHdriType })

    // BRDF LUT
    updated = this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.BrdfLutTexture.str, firstTime, [5, -1]);
    if (updated) {
      gl.activeTexture(gl.TEXTURE5);
      if (this.__pbrCookTorranceBrdfLutDataUrlUid != null) {
        const texture = this.__webglResourceRepository.getWebGLResource(this.__pbrCookTorranceBrdfLutDataUrlUid!) as WebGLTexture;
        gl.bindTexture(gl.TEXTURE_2D, texture);
      } else {
        const texture = this.__webglResourceRepository.getWebGLResource(this.__dummyWhiteTextureUid!) as WebGLTexture;
        gl.bindTexture(gl.TEXTURE_2D, texture);
      }
    }

    // Point size
    this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.PointSize.str, firstTime, { x: 30.0 });
    this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.PointDistanceAttenuation.str, firstTime, { x: this.__pointDistanceAttenuation.v });

    // Lights
    this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.LightNumber.str, firstTime, this.__lightComponents!.length);
    for (let i = 0; i < this.__lightComponents!.length; i++) {
      if (i >= Config.maxLightNumberInShader) {
        break;
      }
      const lightComponent = this.__lightComponents![i];
      const sceneGraphComponent = lightComponent.entity.getSceneGraph();
      const worldLightPosition = sceneGraphComponent.worldPosition;
      const worldLightDirection = lightComponent.direction;
      const worldLightIntensity = lightComponent.intensity;
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.LightPosition.str, firstTime, { x: worldLightPosition.x, y: worldLightPosition.y, z: worldLightPosition.z, w: lightComponent.type.index }, i);
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.LightDirection.str, firstTime, { x: worldLightDirection.x, y: worldLightDirection.y, z: worldLightDirection.z, w: 0 }, i);
      this.__webglResourceRepository.setUniformValue(shaderProgram, ShaderSemantics.LightIntensity.str, firstTime, { x: worldLightIntensity.x, y: worldLightIntensity.y, z: worldLightIntensity.z, w: 0 }, i);
    }
  }

  $render(idx:Index, meshComponent: MeshComponent, worldMatrix: RowMajarMatrix44, normalMatrix: Matrix33, entity: Entity, renderPass: RenderPass, diffuseCube?: CubeTexture, specularCube?: CubeTexture) {
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();

    this.setWebGLStates(idx, gl, renderPass);

    const primitiveNum = meshComponent.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent.getPrimitiveAt(i);
      if (WebGLStrategyUniform.isOpaqueMode() && primitive.isBlend()) {
        continue;
      }
      if (WebGLStrategyUniform.isTransparentMode() && primitive.isOpaque()) {
        continue;
      }
      //this.attatchShaderProgram(primitive.material!);

      this.attachVertexData(i, primitive, glw, CGAPIResourceRepository.InvalidCGAPIResourceUid);

      const material = primitive.material;

      const shaderProgram = this.__webglResourceRepository.getWebGLResource(material!._shaderProgramUid)! as WebGLProgram;
      const shaderProgramUid = material!._shaderProgramUid;

      let firstTime = false;
      if (shaderProgramUid !== this.__lastShader) {
        gl.useProgram(shaderProgram);
        this.__lastShader = shaderProgramUid;
        firstTime = true;
      }

      this.__setUniformBySystem({gl, shaderProgram, primitive, shaderProgramUid,
        entity, worldMatrix, normalMatrix, renderPass,
        diffuseCube, specularCube, firstTime});

      //from material
      if (material) {
        material.setUniformValues(firstTime);
      }

      if (primitive.indicesAccessor) {
        gl.drawElements(primitive.primitiveMode.index, primitive.indicesAccessor.elementCount, primitive.indicesAccessor.componentType.index, 0);
      } else {
        gl.drawArrays(primitive.primitiveMode.index, 0, primitive.getVertexCountAsVerticesBased());
      }
      this.dettachVertexData(glw);

    }
    //    gl.useProgram(null);
    // this.__lastShader = -1;
  }


  private setWebGLStates(idx: number, gl: any, renderPass: RenderPass) {
    if (idx === 0) {
      gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      WebGLStrategyUniform.__isOpaqueMode = true;
    }
    if (idx === MeshRendererComponent.firstTranparentIndex) {
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
      gl.depthMask(false);
      WebGLStrategyUniform.__isOpaqueMode = false;
    }
    if (renderPass.cullface !== this.__lastRenderPassCullFace) {
      if (renderPass.cullface) {
        gl.enable(gl.CULL_FACE);
      }
      else {
        gl.disable(gl.CULL_FACE);
      }
      this.__lastRenderPassCullFace = renderPass.cullface;
    }
  }
}

