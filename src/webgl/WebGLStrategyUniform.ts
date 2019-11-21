import WebGLResourceRepository from "./WebGLResourceRepository";
import WebGLStrategy from "./WebGLStrategy";
import MeshComponent from "../foundation/components/MeshComponent";
import WebGLContextWrapper from "./WebGLContextWrapper";
import Primitive from "../foundation/geometry/Primitive";
import CGAPIResourceRepository from "../foundation/renderer/CGAPIResourceRepository";
import Matrix44 from "../foundation/math/Matrix44";
import Matrix33 from "../foundation/math/Matrix33";
import CameraComponent from "../foundation/components/CameraComponent";
import Entity from "../foundation/core/Entity";
import { ShaderSemantics, ShaderSemanticsInfo } from "../foundation/definitions/ShaderSemantics";
import ComponentRepository from "../foundation/core/ComponentRepository";
import LightComponent from "../foundation/components/LightComponent";
import Config from "../foundation/core/Config";
import { PixelFormat } from "../foundation/definitions/PixelFormat";
import { ComponentType } from "../foundation/definitions/ComponentType";
import { TextureParameter } from "../foundation/definitions/TextureParameter";
import CubeTexture from "../foundation/textures/CubeTexture";
import MeshRendererComponent from "../foundation/components/MeshRendererComponent";
import { CompositionType } from "../foundation/definitions/CompositionType";
import Material from "../foundation/materials/Material";
import RenderPass from "../foundation/renderer/RenderPass";
import { ShaderVariableUpdateIntervalEnum, ShaderVariableUpdateInterval } from "../foundation/definitions/ShaderVariableUpdateInterval";
import Mesh from "../foundation/geometry/Mesh";
import MemoryManager from "../foundation/core/MemoryManager";
import { ShaderType } from "../foundation/definitions/ShaderType";
import { CGAPIResourceHandle, WebGLResourceHandle, Index, Count } from "../types/CommonTypes";
import ClassicShader from "./shaders/ClassicShader";
import { BufferUse } from "../foundation/definitions/BufferUse";
import Buffer from "../foundation/memory/Buffer";
import GlobalDataRepository from "../foundation/core/GlobalDataRepository";
import { MiscUtil } from "../foundation/misc/MiscUtil";
import WebGLStrategyCommonMethod from "./WebGLStrategyCommonMethod";

type ShaderVariableArguments = {
  glw: WebGLContextWrapper, shaderProgram: WebGLProgram, primitive: Primitive, shaderProgramUid: WebGLResourceHandle,
  entity: Entity, worldMatrix: Matrix44, normalMatrix: Matrix33, renderPass: RenderPass,
  diffuseCube?: CubeTexture, specularCube?: CubeTexture, firstTime: boolean, updateInterval?: ShaderVariableUpdateIntervalEnum
};

export default class WebGLStrategyUniform implements WebGLStrategy {
  private static __instance: WebGLStrategyUniform;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  private __dataTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __lastShader: CGAPIResourceHandle = -1;
  private __lastRenderPassTickCount = -1;
  private __lightComponents?: LightComponent[];
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private static __vertexShaderMethodDefinitions_uniform: string;

  private constructor() { }

  setupShaderProgram(meshComponent: MeshComponent): void {
    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    const primitiveNum = meshComponent!.mesh.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent!.mesh.getPrimitiveAt(i);
      const material = primitive.material;
      if (material == null || material.isEmptyMaterial()) {
        return;
      }

      if (material._shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        return;
      }

      const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      const isPointSprite = primitive.primitiveMode.index === gl.POINTS;

      this.setupDefaultShaderSemantics(material, isPointSprite);
    }
  }

  setupDefaultShaderSemantics(material: Material, isPointSprite: boolean) {
    // Shader Setup
    const shaderSemanticsInfos: ShaderSemanticsInfo[] = [
      {
        semantic: ShaderSemantics.VertexAttributesExistenceArray, compositionType: CompositionType.ScalarArray, componentType: ComponentType.Int,
        stage: ShaderType.VertexShader, min: 0, max: 1, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime
      },
      {
        semantic: ShaderSemantics.WorldMatrix, compositionType: CompositionType.Mat4, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime
      },
      {
        semantic: ShaderSemantics.NormalMatrix, compositionType: CompositionType.Mat3, componentType: ComponentType.Float,
        stage: ShaderType.VertexShader, min: -Number.MAX_VALUE, max: Number.MAX_VALUE, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime
      },
    ];

    if (isPointSprite) {
      shaderSemanticsInfos.push(
        {
          semantic: ShaderSemantics.PointSize, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: 0, max: Number.MAX_VALUE, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime
        },
        {
          semantic: ShaderSemantics.PointDistanceAttenuation, compositionType: CompositionType.Vec3, componentType: ComponentType.Float,
          stage: ShaderType.PixelShader, min: 0, max: 1, isSystem: true, updateInteval: ShaderVariableUpdateInterval.EveryTime
        },
      );
    }

    WebGLStrategyUniform.setupMaterial(material, shaderSemanticsInfos);
  }

  static setupMaterial(material: Material, args?: ShaderSemanticsInfo[]) {
    let infoArray: ShaderSemanticsInfo[];
    if (args != null) {
      infoArray = args;
    } else {
      infoArray = material.fieldsInfoArray;
    }

    const _texture = ClassicShader.getInstance().glsl_texture;
    WebGLStrategyUniform.__vertexShaderMethodDefinitions_uniform =
      `
uniform mat4 u_worldMatrix;
uniform mat3 u_normalMatrix;

mat4 get_worldMatrix(float instanceId) {
  return u_worldMatrix;
}

mat3 get_normalMatrix(float instanceId) {
  return u_normalMatrix;
}

#ifdef RN_IS_MORPHING
  vec3 get_position(float vertexId, vec3 basePosition) {
    vec3 position = basePosition;
    for (int i=0; i<${Config.maxVertexMorphNumberInShader}; i++) {
      float index = u_dataTextureMorphOffsetPosition[i] + 1.0 * vertexId;
      float powWidthVal = ${MemoryManager.bufferWidthLength}.0;
      float powHeightVal = ${MemoryManager.bufferHeightLength}.0;
      vec2 arg = vec2(1.0/powWidthVal, 1.0/powHeightVal);
    //  vec2 arg = vec2(1.0/powWidthVal, 1.0/powWidthVal/powHeightVal);
      vec3 addPos = fetchElement(u_dataTexture, index + 0.0, arg).xyz;
      position += addPos * u_morphWeights[i];
      if (i == u_morphTargetNumber-1) {
        break;
      }
    }

    return position;
  }
#endif

  `;

    material.createProgram(WebGLStrategyUniform.__vertexShaderMethodDefinitions_uniform, ShaderSemantics.getShaderProperty);
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    webglResourceRepository.setupUniformLocations(material._shaderProgramUid, infoArray);
    material.setUniformLocations(material._shaderProgramUid);
    WebGLStrategyUniform.__globalDataRepository.setUniformLocations(material._shaderProgramUid);

    const gl = webglResourceRepository.currentWebGLContextWrapper!.getRawContext();
    const shaderProgram = webglResourceRepository.getWebGLResource(material._shaderProgramUid)! as WebGLProgram;
    (shaderProgram as any).dataTexture = gl.getUniformLocation(shaderProgram, 'u_dataTexture');
    (shaderProgram as any).currentComponentSIDs = gl.getUniformLocation(shaderProgram, 'u_currentComponentSIDs');
  }

  async $load(meshComponent: MeshComponent) {
    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    this.setupShaderProgram(meshComponent);

    const primitiveNum = meshComponent!.mesh.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent!.mesh.getPrimitiveAt(i);
      primitive.create3DAPIVertexData();
    }
    meshComponent.mesh.updateVariationVBO();

  }

  $prerender(meshComponent: MeshComponent, meshRendererComponent: MeshRendererComponent, instanceIDBufferUid: WebGLResourceHandle) {
    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    const primitiveNum = meshComponent!.mesh.getPrimitiveNumber();

    if (meshComponent.mesh.weights.length > 0) {
      for (let i = 0; i < primitiveNum; i++) {
        const primitive = meshComponent!.mesh.getPrimitiveAt(i);
        this.__webglResourceRepository.resendVertexBuffer(primitive, primitive.vertexHandles!.vboHandles);
      }
    }

    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent!.mesh.getPrimitiveAt(i);
      this.__webglResourceRepository.setVertexDataToPipeline(
        { vaoHandle: meshComponent.mesh.getVaoUids(i), iboHandle: primitive.vertexHandles!.iboHandle, vboHandles: primitive.vertexHandles!.vboHandles },
        primitive, instanceIDBufferUid);
    }
  }

  common_$prerender(): void {

    const componentRepository = ComponentRepository.getInstance();
    this.__lightComponents = componentRepository.getComponentsWithType(LightComponent) as LightComponent[];

    // Setup Data Texture
    if (this.__dataTextureUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const memoryManager: MemoryManager = MemoryManager.getInstance();
      const buffer: Buffer = memoryManager.getBuffer(BufferUse.GPUVertexData);
      if (buffer.takenSizeInByte / MemoryManager.bufferWidthLength / 4 > MemoryManager.bufferHeightLength) {
        console.warn('The buffer size exceeds the size of the data texture.');
      }
      let paddingArrayBufferSize = 0;
      if ((buffer.takenSizeInByte) / 4 / 4 < MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength) {
        paddingArrayBufferSize = MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength * 4 * 4 - buffer.takenSizeInByte;
      }
      const concatArraybuffer = MiscUtil.concatArrayBuffers([buffer.getArrayBuffer()], [buffer.takenSizeInByte], paddingArrayBufferSize);
      const floatDataTextureBuffer = new Float32Array(concatArraybuffer);

      if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
          level: 0, internalFormat: TextureParameter.RGBA32F, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
          border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
          wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false
        });
      } else {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer, {
          level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
          border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
          wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false
        });
      }
    }
  }

  attachGPUData(primitive: Primitive): void {
  }

  attatchShaderProgram(material: Material): void {
  }

  attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle) {
  }

  attachVertexDataInner(mesh: Mesh, primitive: Primitive, primitiveIndex: Index, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle) {
    const vaoHandles = primitive.vertexHandles!;
    const vao = this.__webglResourceRepository.getWebGLResource(mesh.getVaoUids(primitiveIndex)) as WebGLVertexArrayObjectOES;
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

  common_$render(meshComponentSids: Int32Array, meshComponents: MeshComponent[], viewMatrix: Matrix44, projectionMatrix: Matrix44, renderPass: RenderPass) {
    return false;
  }

  $render(idx: Index, meshComponent: MeshComponent, worldMatrix: Matrix44, normalMatrix: Matrix33, entity: Entity, renderPass: RenderPass, renderPassTickCount: Count, diffuseCube?: CubeTexture, specularCube?: CubeTexture) {
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();

    WebGLStrategyCommonMethod.startDepthMasking(idx, gl, renderPass);

    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    const primitiveNum = meshComponent.mesh.getPrimitiveNumber();

    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent.mesh.getPrimitiveAt(i);

      this.attachVertexDataInner(meshComponent.mesh, primitive, i, glw, CGAPIResourceRepository.InvalidCGAPIResourceUid);

      const material: Material = renderPass.getAppropriateMaterial(primitive, primitive.material!);
      if (material.isEmptyMaterial()) {
        continue;
      }

      const shaderProgram = this.__webglResourceRepository.getWebGLResource(material._shaderProgramUid)! as WebGLProgram;
      const shaderProgramUid = material._shaderProgramUid;

      let firstTime = false;
      if (renderPassTickCount !== this.__lastRenderPassTickCount) {
        firstTime = true;
      }
      if (shaderProgramUid !== this.__lastShader) {
        gl.useProgram(shaderProgram);

        gl.uniform1i((shaderProgram as any).dataTexture, 7);


        this.__lastShader = shaderProgramUid;
        firstTime = true;
      }
      this.__webglResourceRepository.bindTexture2D(7, this.__dataTextureUid);

      // this.__setUniformBySystem({glw, shaderProgram, primitive, shaderProgramUid,
      //   entity, worldMatrix, normalMatrix, renderPass,
      //   diffuseCube, specularCube, firstTime});
      if (firstTime) {
        // this.setCamera(renderPass);
        // WebGLStrategyUniform.__globalDataRepository.setUniformValues(shaderProgram, {
        //   setUniform: true,
        //   glw: glw,
        //   entity: entity,
        //   primitive: primitive,
        //   worldMatrix: worldMatrix,
        //   normalMatrix: normalMatrix,
        //   lightComponents: this.__lightComponents,
        //   renderPass: renderPass,
        //   diffuseCube: diffuseCube,
        //   specularCube: specularCube
        // });
      }
      //from material

      WebGLStrategyCommonMethod.setCullAndBlendSettings(material, renderPass, gl);

      // material.setUniformValues(firstTime, {
      material.setParemetersForGPU({
        material, shaderProgram, firstTime, args: {
          setUniform: true,
          glw: glw,
          entity: entity,
          primitive: primitive,
          worldMatrix: worldMatrix,
          normalMatrix: normalMatrix,
          lightComponents: this.__lightComponents,
          renderPass: renderPass,
          diffuseCube: diffuseCube,
          specularCube: specularCube
        }
      });

      if (primitive.indicesAccessor) {
        gl.drawElements(primitive.primitiveMode.index, primitive.indicesAccessor.elementCount, primitive.indicesAccessor.componentType.index, 0);
      } else {
        gl.drawArrays(primitive.primitiveMode.index, 0, primitive.getVertexCountAsVerticesBased());
      }
      // this.dettachVertexData(glw);

    }

    WebGLStrategyCommonMethod.endDepthMasking(idx, gl, renderPass);
    this.__lastRenderPassTickCount = renderPassTickCount;
  }

  setCamera(renderPass: RenderPass) {
    let cameraComponent = renderPass.cameraComponent;
    if (cameraComponent == null) {
      cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
    }
    if (cameraComponent) {
      cameraComponent.setValuesToGlobalDataRepository();
    }
  }

}

