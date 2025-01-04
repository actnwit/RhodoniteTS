import { WebGLResourceRepository } from './WebGLResourceRepository';
import { MemoryManager } from '../foundation/core/MemoryManager';
import { Buffer } from '../foundation/memory/Buffer';
import { PixelFormat } from '../foundation/definitions/PixelFormat';
import { ComponentType } from '../foundation/definitions/ComponentType';
import { TextureParameter } from '../foundation/definitions/TextureParameter';
import { BufferUse } from '../foundation/definitions/BufferUse';
import { ShaderSources, WebGLStrategy } from './WebGLStrategy';
import { MeshComponent } from '../foundation/components/Mesh/MeshComponent';
import { Primitive } from '../foundation/geometry/Primitive';
import { WebGLContextWrapper } from './WebGLContextWrapper';
import { CGAPIResourceRepository } from '../foundation/renderer/CGAPIResourceRepository';
import { ShaderSemantics, ShaderSemanticsName } from '../foundation/definitions/ShaderSemantics';
import { Material } from '../foundation/materials/core/Material';
import { CompositionType } from '../foundation/definitions/CompositionType';
import { Component } from '../foundation/core/Component';
import { SceneGraphComponent } from '../foundation/components/SceneGraph/SceneGraphComponent';
import { Mesh } from '../foundation/geometry/Mesh';
import { MeshRendererComponent } from '../foundation/components/MeshRenderer/MeshRendererComponent';
import { ComponentRepository } from '../foundation/core/ComponentRepository';
import { Config } from '../foundation/core/Config';
import { RenderPass } from '../foundation/renderer/RenderPass';
import { CameraComponent } from '../foundation/components/Camera/CameraComponent';
import {
  WebGLResourceHandle,
  Index,
  CGAPIResourceHandle,
  Count,
  IndexOf16Bytes,
  IndexOf4Bytes,
  PrimitiveUID,
  Byte,
} from '../types/CommonTypes';
import { GlobalDataRepository } from '../foundation/core/GlobalDataRepository';
import { VectorN } from '../foundation/math/VectorN';
import { WellKnownComponentTIDs } from '../foundation/components/WellKnownComponentTIDs';
import { MiscUtil } from '../foundation/misc/MiscUtil';
import WebGLStrategyCommonMethod, { setupShaderProgram } from './WebGLStrategyCommonMethod';
import { ModuleManager } from '../foundation/system/ModuleManager';
import { RnXR } from '../xr/main';
import { Is } from '../foundation/misc/Is';
import { LightComponent } from '../foundation/components/Light/LightComponent';
import { ShaderSemanticsInfo } from '../foundation/definitions/ShaderSemanticsInfo';
import { MaterialRepository } from '../foundation/materials/core/MaterialRepository';
import { isSkipDrawing, updateVBOAndVAO } from '../foundation/renderer/RenderingCommonMethods';
import { CGAPIStrategy } from '../foundation/renderer/CGAPIStrategy';
import { CameraControllerComponent } from '../foundation/components/CameraController/CameraControllerComponent';
import { TransformComponent } from '../foundation/components/Transform/TransformComponent';
import { WebXRSystem } from '../xr';
import { Vector2 } from '../foundation/math/Vector2';
import { AnimationComponent } from '../foundation/components/Animation/AnimationComponent';
import { TextureFormat } from '../foundation/definitions/TextureFormat';
import { Logger } from '../foundation/misc/Logger';
import { RenderingArgWebGL } from './types/CommonTypes';

declare const spector: any;

export class WebGLStrategyDataTexture implements CGAPIStrategy, WebGLStrategy {
  private static __instance: WebGLStrategyDataTexture;
  private __webglResourceRepository: WebGLResourceRepository =
    WebGLResourceRepository.getInstance();
  private __dataTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __dataUBOUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __lastShader: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __lastMaterial?: WeakRef<Material>;
  private __lastMaterialStateVersion = -1;
  private static __shaderProgram: WebGLProgram;
  private __lastRenderPassTickCount = -1;
  private __lightComponents?: LightComponent[];
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private static __currentComponentSIDs?: VectorN;
  public _totalSizeOfGPUShaderDataStorageExceptMorphData = 0;
  private static __isDebugOperationToDataTextureBufferDone = true;
  private static __webxrSystem: WebXRSystem;

  private __lastMaterialsUpdateCount = -1;
  private __lastTransformComponentsUpdateCount = -1;
  private __lastSceneGraphComponentsUpdateCount = -1;
  private __lastCameraControllerComponentsUpdateCount = -1;
  private constructor() {}

  public static dumpDataTextureBuffer() {
    this.__isDebugOperationToDataTextureBufferDone = false;
  }

  static getVertexShaderMethodDefinitions_dataTexture() {
    return `

  mat4 get_worldMatrix(float instanceId)
  {
    int index = ${Component.getLocationOffsetOfMemberOfComponent(
      SceneGraphComponent,
      'worldMatrix'
    )} + 4 * int(instanceId);
    mat4 matrix = fetchMat4(index);

    return matrix;
  }


  mat3 get_normalMatrix(float instanceId) {
    int index = ${Component.getLocationOffsetOfMemberOfComponent(
      SceneGraphComponent,
      'normalMatrix'
    )} * 4 + 9 * int(instanceId);
    mat3 matrix = fetchMat3No16BytesAligned(index);
    return matrix;
  }

  bool get_isVisible(float instanceId) {
    int index = ${Component.getLocationOffsetOfMemberOfComponent(
      SceneGraphComponent,
      'isVisible'
    )} * 4 + int(instanceId);
    float visibility = fetchScalarNo16BytesAligned(index);
    return (visibility > 0.5) ? true : false;
  }

  bool get_isBillboard(float instanceId) {
    int index = ${Component.getLocationOffsetOfMemberOfComponent(
      SceneGraphComponent,
      'isBillboard'
    )} * 4 + int(instanceId);
    float isBillboard = fetchScalarNo16BytesAligned(index);
    return (isBillboard > 0.5) ? true : false;
  }

#ifdef RN_IS_VERTEX_SHADER
  #ifdef RN_IS_MORPHING
  vec3 get_position(float vertexId, vec3 basePosition) {
    vec3 position = basePosition;
    int scalar_idx = 3 * int(vertexId);
    for (int i=0; i<${Config.maxVertexMorphNumberInShader}; i++) {

      int basePosIn4bytes = u_dataTextureMorphOffsetPosition[i] * 4 + scalar_idx;
      vec3 addPos = fetchVec3No16BytesAligned(basePosIn4bytes);

      position += addPos * u_morphWeights[i];
      if (i == u_morphTargetNumber-1) {
        break;
      }
    }

    return position;
  }
  #endif
#endif
`;
  }

  /**
   * setup shader program for the material in this WebGL strategy
   * @param material - a material to setup shader program
   */
  public setupShaderForMaterial(material: Material, primitive: Primitive): CGAPIResourceHandle {
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    const glw = webglResourceRepository.currentWebGLContextWrapper!;

    const [programUid, newOne] = material._createProgramWebGL(
      WebGLStrategyDataTexture.getVertexShaderMethodDefinitions_dataTexture(),
      WebGLStrategyDataTexture.__getShaderProperty,
      primitive,
      glw.isWebGL2
    );

    if (newOne) {
      material._setupBasicUniformsLocations(primitive);

      material._setUniformLocationsOfMaterialNodes(false, primitive);

      material._setupAdditionalUniformLocations(
        WebGLStrategyCommonMethod.getPointSpriteShaderSemanticsInfoArray(),
        false,
        primitive
      );

      WebGLStrategyDataTexture.__globalDataRepository._setUniformLocationsForDataTextureModeOnly(
        material.getShaderProgramUid(primitive)
      );
    }

    return programUid;
  }

  /**
   * re-setup shader program for the material in this WebGL strategy
   * @param material - a material to re-setup shader program
   * @param updatedShaderSources - updated shader sources
   * @param onError - callback function to handle error
   * @returns
   */
  public _reSetupShaderForMaterialBySpector(
    material: Material,
    primitive: Primitive,
    updatedShaderSources: ShaderSources,
    onError: (message: string) => void
  ): CGAPIResourceHandle {
    const [programUid, newOne] = material._createProgramByUpdatedSources(
      updatedShaderSources,
      primitive,
      onError
    );
    if (programUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return programUid;
    }

    if (newOne) {
      material._setupBasicUniformsLocations(primitive);

      material._setUniformLocationsOfMaterialNodes(false, primitive);

      material._setupAdditionalUniformLocations(
        WebGLStrategyCommonMethod.getPointSpriteShaderSemanticsInfoArray(),
        false,
        primitive
      );
    }

    WebGLStrategyDataTexture.__globalDataRepository._setUniformLocationsForDataTextureModeOnly(
      material.getShaderProgramUid(primitive)
    );

    return programUid;
  }

  private static __getShaderProperty(
    materialTypeName: string,
    info: ShaderSemanticsInfo,
    isGlobalData: boolean,
    isWebGL2: boolean
  ) {
    const returnType = info.compositionType.getGlslStr(info.componentType);

    let indexStr;

    const isTexture = CompositionType.isTexture(info.compositionType);

    const methodName = info.semantic.replace('.', '_');

    // definition of uniform variable for texture sampler or what must be explicitly uniform variabl)
    let varDef = '';
    const varType = info.compositionType.getGlslStr(info.componentType);
    let varIndexStr = '';
    if (info.arrayLength) {
      varIndexStr = `[${info.arrayLength}]`;
    }
    if (info.needUniformInDataTextureMode || isTexture) {
      varDef = `  uniform ${varType} u_${methodName}${varIndexStr};\n`;
    }

    // inner contents of 'get_' shader function
    const vec4SizeOfProperty: IndexOf16Bytes = info.compositionType.getVec4SizeOfProperty();
    // for non-`index` property (this is general case)
    const scalarSizeOfProperty: IndexOf4Bytes = info.compositionType.getNumberOfComponents();
    const offsetOfProperty: IndexOf16Bytes = WebGLStrategyDataTexture.getOffsetOfPropertyInShader(
      isGlobalData,
      info.semantic,
      materialTypeName
    );

    if (offsetOfProperty === -1) {
      Logger.error('Could not get the location offset of the property.');
    }

    let instanceSize = vec4SizeOfProperty;
    indexStr = `int vec4_idx = ${offsetOfProperty} + ${instanceSize} * instanceId;\n`;
    if (CompositionType.isArray(info.compositionType)) {
      instanceSize = vec4SizeOfProperty * (info.arrayLength ?? 1);
      const paddedAsVec4 = Math.ceil(scalarSizeOfProperty / 4) * 4;
      const instanceSizeInScalar = paddedAsVec4 * (info.arrayLength ?? 1);
      indexStr = `int vec4_idx = ${offsetOfProperty} + ${instanceSize} * instanceId + ${vec4SizeOfProperty} * idxOfArray;\n`;
      indexStr += `int scalar_idx = ${
        // IndexOf4Bytes
        offsetOfProperty * 4 // IndexOf16bytes to IndexOf4Bytes
      } + ${instanceSizeInScalar} * instanceId + ${scalarSizeOfProperty} * idxOfArray;\n`;
    }

    let intStr = '';
    if (
      info.componentType === ComponentType.Int &&
      info.compositionType !== CompositionType.Scalar
    ) {
      intStr = 'i';
    }

    let firstPartOfInnerFunc = '';
    if (!isTexture && !info.needUniformInDataTextureMode) {
      firstPartOfInnerFunc += `
${returnType} get_${methodName}(highp float _instanceId, const int idxOfArray) {
  int instanceId = int(_instanceId);
  ${indexStr}
  `;

      let str = `${varDef}\n${firstPartOfInnerFunc}`;

      switch (info.compositionType) {
        case CompositionType.Vec4:
        case CompositionType.Vec4Array:
          str += '        highp vec4 val = fetchElement(vec4_idx);\n';
          break;
        case CompositionType.Vec3:
          str += '        vec4 col0 = fetchElement(vec4_idx);\n';
          str += `        highp ${intStr}vec3 val = ${intStr}vec3(col0.xyz);`;
          break;
        case CompositionType.Vec3Array:
          str += '        vec3 val = fetchVec3No16BytesAligned(scalar_idx);\n';
          break;
        case CompositionType.Vec2:
          str += '        highp vec4 col0 = fetchElement(vec4_idx);\n';
          str += `        highp ${intStr}vec2 val = ${intStr}vec2(col0.xy);`;
          break;
        case CompositionType.Vec2Array:
          str += '        highp vec2 val = fetchVec2No16BytesAligned(scalar_idx);\n';
          break;
        case CompositionType.Scalar:
          str += '        vec4 col0 = fetchElement(vec4_idx);\n';
          if (info.componentType === ComponentType.Int) {
            str += '        int val = int(col0.x);';
          } else if (info.componentType === ComponentType.Bool) {
            str += '        bool val = bool(col0.x);';
          } else {
            str += '       float val = col0.x;';
          }
          break;
        case CompositionType.ScalarArray:
          str += '        float col0 = fetchScalarNo16BytesAligned(scalar_idx);\n';
          if (info.componentType === ComponentType.Int) {
            str += '        int val = int(col0);';
          } else if (info.componentType === ComponentType.Bool) {
            str += '        bool val = bool(col0);';
          } else {
            str += '       float val = col0;';
          }
          break;
        case CompositionType.Mat4:
          str += '        mat4 val = fetchMat4(vec4_idx);\n';
          break;
        case CompositionType.Mat4Array:
          str += '        mat4 val = fetchMat4(vec4_idx);\n';
          break;
        case CompositionType.Mat3:
          str += '        mat3 val = fetchMat3(vec4_idx);\n';
          break;
        case CompositionType.Mat3Array:
          str += '        mat3 val = fetchMat3No16BytesAligned(scalar_idx);\n';
          break;
        case CompositionType.Mat2:
          str += '        mat2 val = fetchMat2(vec4_idx);\n';
          break;
        case CompositionType.Mat2Array:
          str += '        mat2 val = fetchMat2No16BytesAligned(scalar_idx);\n';
          break;
        case CompositionType.Mat4x3Array:
          str += '        mat4x3 val = fetchMat4x3(vec4_idx);\n';
          break;
        default:
          // Logger.error('unknown composition type', info.compositionType.str, memberName);
          str += '';
      }
      str += `
  return val;
}
`;
      return str;
    } else if (!isTexture && info.needUniformInDataTextureMode) {
      if (!isWebGL2 && info.arrayLength) {
        return `\n${varDef}\n`;
      } else {
        let varIndexStr = '';
        if (info.arrayLength) {
          varIndexStr = '[idxOfArray]';
        }
        const str = `${varDef}
${returnType} get_${methodName}(highp float _instanceId, const int idxOfArray) {
  return u_${methodName}${varIndexStr};
}
`;
        return str;
      }
    } else {
      return varDef;
    }
  }

  private static getOffsetOfPropertyInShader(
    isGlobalData: boolean,
    propertyName: ShaderSemanticsName,
    materialTypeName: string
  ) {
    if (isGlobalData) {
      const globalDataRepository = GlobalDataRepository.getInstance();
      const dataBeginPos = globalDataRepository.getLocationOffsetOfProperty(propertyName);
      return dataBeginPos;
    } else {
      const dataBeginPos = MaterialRepository.getLocationOffsetOfMemberOfMaterial(
        materialTypeName,
        propertyName
      );
      return dataBeginPos;
    }
  }

  $load(meshComponent: MeshComponent) {
    const mesh = meshComponent.mesh as Mesh;
    if (mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return false;
    }

    WebGLStrategyDataTexture.__currentComponentSIDs =
      WebGLStrategyDataTexture.__globalDataRepository.getValue('currentComponentSIDs', 0);

    // update VBO and VAO
    if (!mesh.isSetUpDone()) {
      this.deleteDataTexture(); // delete data texture to recreate one on next
      updateVBOAndVAO(mesh);
    }

    return true;
  }

  private __createAndUpdateDataTexture() {
    this.__createAndUpdateDataTextureInner();
  }

  private __createAndUpdateDataTextureForCameraOnly() {
    const globalDataRepository = GlobalDataRepository.getInstance();
    const positionOfBoneMatrixInByte =
      globalDataRepository.getLocationOffsetOfProperty('boneMatrix') * 16; // camera infos are before boneMatrix
    this.__createAndUpdateDataTextureInner(positionOfBoneMatrixInByte);
  }

  private __createAndUpdateDataTextureInner(_copySizeInByte?: Byte) {
    const memoryManager: MemoryManager = MemoryManager.getInstance();

    // the GPU global Storage
    const gpuInstanceDataBuffer: Buffer | undefined = memoryManager.getBuffer(
      BufferUse.GPUInstanceData
    );
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper;
    const uboTotalSize = glw!.getAlignedMaxUniformBlockSize();

    const startOffsetOfDataTextureOnGPUInstanceData = this.__isUboUse() ? uboTotalSize : 0;
    if (gpuInstanceDataBuffer == null) {
      return;
    }
    // const morphBuffer = memoryManager.getBuffer(BufferUse.GPUVertexData);
    // if all the necessary data fits in the UBO, then no data textures will be created.
    // if (
    //   this.__isUboUse() &&
    //   DataUtil.addPaddingBytes(gpuInstanceDataBuffer.takenSizeInByte, 4) +
    //     DataUtil.addPaddingBytes(morphBuffer!.takenSizeInByte, 4) <
    //     uboTotalSize
    // ) {
    //   return;
    // }

    const dataTextureByteSize =
      MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength * 4 * 4;
    if (this.__dataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const copySizeInByte = _copySizeInByte ?? gpuInstanceDataBuffer.takenSizeInByte;
      const bufferSizeForDataTextureInByte =
        copySizeInByte - startOffsetOfDataTextureOnGPUInstanceData;
      const height = Math.min(
        Math.ceil(bufferSizeForDataTextureInByte / MemoryManager.bufferWidthLength / 4 / 4),
        MemoryManager.bufferHeightLength
      );
      const updateByteSize = MemoryManager.bufferWidthLength * height * 4 * 4;
      if (bufferSizeForDataTextureInByte > dataTextureByteSize) {
        Logger.warn('The buffer size exceeds the size of the data texture.');
      }
      const floatDataTextureBuffer = new Float32Array(
        gpuInstanceDataBuffer.getArrayBuffer(),
        startOffsetOfDataTextureOnGPUInstanceData,
        updateByteSize / 4
      );
      this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
        level: 0,
        xoffset: 0,
        yoffset: 0,
        width: MemoryManager.bufferWidthLength,
        height: height,
        format: PixelFormat.RGBA,
        type: ComponentType.Float,
      });

      // debug
      if (!WebGLStrategyDataTexture.__isDebugOperationToDataTextureBufferDone) {
        MiscUtil.downloadTypedArray('Rhodonite_dataTextureBuffer.bin', floatDataTextureBuffer);
        WebGLStrategyDataTexture.__isDebugOperationToDataTextureBufferDone = true;
      }
    } else {
      const morphBuffer = memoryManager.getBuffer(BufferUse.GPUVertexData);
      let morphBufferTakenSizeInByte = 0;
      let morphBufferArrayBuffer = new ArrayBuffer(0);
      if (Is.exist(morphBuffer)) {
        morphBufferTakenSizeInByte = morphBuffer.takenSizeInByte;
        morphBufferArrayBuffer = morphBuffer.getArrayBuffer();
      }
      let floatDataTextureBuffer: Float32Array;
      {
        const morphBuffer = memoryManager.getBuffer(BufferUse.GPUVertexData);

        // the size of morph buffer.
        let morphBufferTakenSizeInByte = 0;
        if (Is.exist(morphBuffer)) {
          morphBufferTakenSizeInByte = morphBuffer.takenSizeInByte;
        }

        // the arraybuffer of morph buffer.
        let morphBufferArrayBuffer = new ArrayBuffer(0);
        if (Is.exist(morphBuffer)) {
          morphBufferArrayBuffer = morphBuffer.getArrayBuffer();
        }

        // the DataTexture size (GPU global storage size - UBO space size)
        const actualSpaceForDataTextureInByte =
          gpuInstanceDataBuffer.takenSizeInByte - startOffsetOfDataTextureOnGPUInstanceData;

        // spare padding texel for texture alignment (to edge of the width of texture)
        const paddingSpaceTexel =
          MemoryManager.bufferWidthLength -
          ((actualSpaceForDataTextureInByte / 4 / 4) % MemoryManager.bufferWidthLength);
        const paddingSpaceBytes = paddingSpaceTexel * 4 * 4;

        const finalArrayBuffer = MiscUtil.concatArrayBuffers2({
          finalSize: dataTextureByteSize,
          srcs: [gpuInstanceDataBuffer.getArrayBuffer(), morphBufferArrayBuffer],
          srcsCopySize: [
            // final size =
            actualSpaceForDataTextureInByte + paddingSpaceBytes,
            morphBufferTakenSizeInByte,
          ],
          srcsOffset: [startOffsetOfDataTextureOnGPUInstanceData, 0],
        });

        // warning if the used memory exceeds the size of the data texture.
        if (
          actualSpaceForDataTextureInByte + paddingSpaceBytes + morphBufferTakenSizeInByte >
          dataTextureByteSize
        ) {
          Logger.warn('The buffer size exceeds the size of the data texture.');
        }

        floatDataTextureBuffer = new Float32Array(finalArrayBuffer);
        Config.totalSizeOfGPUShaderDataStorageExceptMorphData =
          gpuInstanceDataBuffer.takenSizeInByte + paddingSpaceBytes;
      }

      // write data
      this.__dataTextureUid = this.__webglResourceRepository.createTextureFromTypedArray(
        floatDataTextureBuffer!,
        {
          level: 0,
          internalFormat: TextureFormat.RGBA32F,
          width: MemoryManager.bufferWidthLength,
          height: MemoryManager.bufferHeightLength,
          border: 0,
          format: PixelFormat.RGBA,
          type: ComponentType.Float,
          generateMipmap: false,
        }
      );
    }
  }

  deleteDataTexture(): void {
    if (this.__dataTextureUid != null) {
      this.__webglResourceRepository.deleteTexture(this.__dataTextureUid);
      this.__dataTextureUid = CGAPIResourceRepository.InvalidCGAPIResourceUid;
    }
  }

  prerender(): void {
    if (
      AnimationComponent.isAnimating ||
      TransformComponent.updateCount !== this.__lastTransformComponentsUpdateCount ||
      SceneGraphComponent.updateCount !== this.__lastSceneGraphComponentsUpdateCount ||
      Material.stateVersion !== this.__lastMaterialsUpdateCount
    ) {
      // Setup GPU Storage (Data Texture & UBO)
      this.__createAndUpdateDataTexture();
      this.__createAndUpdateUBO();
      this.__lastTransformComponentsUpdateCount = TransformComponent.updateCount;
      this.__lastSceneGraphComponentsUpdateCount = SceneGraphComponent.updateCount;
      this.__lastMaterialsUpdateCount = Material.stateVersion;
    } else if (
      CameraControllerComponent.updateCount !== this.__lastCameraControllerComponentsUpdateCount
    ) {
      this.__createAndUpdateDataTextureForCameraOnly();
      this.__lastCameraControllerComponentsUpdateCount = CameraControllerComponent.updateCount;
    }

    this.__lightComponents = ComponentRepository.getComponentsWithType(LightComponent) as
      | LightComponent[]
      | undefined;
  }

  private __isUboUse() {
    return (
      this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2 && Config.isUboEnabled
    );
  }

  private __createAndUpdateUBO() {
    if (this.__isUboUse()) {
      const glw = this.__webglResourceRepository.currentWebGLContextWrapper;
      const alignedMaxUniformBlockSize = glw!.getAlignedMaxUniformBlockSize();
      const maxConventionBlocks = glw!.getMaxConventionUniformBlocks();
      const memoryManager: MemoryManager = MemoryManager.getInstance();
      const buffer: Buffer | undefined = memoryManager.getBuffer(BufferUse.GPUInstanceData);
      if (this.__dataUBOUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        this.__dataUBOUid = this.__webglResourceRepository.setupUniformBufferDataArea(
          new Float32Array(buffer!.getArrayBuffer())
        );
      } else {
        const array = new Float32Array(buffer!.getArrayBuffer());
        this.__webglResourceRepository.updateUniformBuffer(
          this.__dataUBOUid,
          array,
          0,
          (alignedMaxUniformBlockSize * maxConventionBlocks) / 4 // (4 bytes unit)
        );
      }
    }
  }

  attachGPUData(primitive: Primitive): void {}

  attachGPUDataInner(gl: WebGLRenderingContext, shaderProgram: WebGLProgram) {}

  attachVertexData(
    i: number,
    primitive: Primitive,
    glw: WebGLContextWrapper,
    instanceIDBufferUid: WebGLResourceHandle
  ): void {}

  attachVertexDataInner(
    mesh: Mesh,
    primitive: Primitive,
    primitiveIndex: Index,
    glw: WebGLContextWrapper,
    instanceIDBufferUid: WebGLResourceHandle
  ): void {
    const vertexHandles = primitive.vertexHandles!;
    const gl = glw.getRawContext();

    // bind
    const vao = this.__webglResourceRepository.getWebGLResource(
      mesh.getVaoUids(primitiveIndex)
    ) as WebGLVertexArrayObjectOES;
    if (vao != null) {
      glw.bindVertexArray(vao);
    } else {
      this.__webglResourceRepository.setVertexDataToPipeline(
        vertexHandles,
        primitive,
        mesh._variationVBOUid
      );
      const ibo = this.__webglResourceRepository.getWebGLResource(
        vertexHandles.iboHandle!
      ) as WebGLBuffer;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    }
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new WebGLStrategyDataTexture();
      const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
      const webxrSystem = rnXRModule.WebXRSystem.getInstance();
      WebGLStrategyDataTexture.__webxrSystem = webxrSystem;
    }

    return this.__instance;
  }

  private __setCurrentComponentSIDsForEachDisplayIdx(
    renderPass: RenderPass,
    displayIdx: 0 | 1,
    isVRMainPass: boolean
  ) {
    if (isVRMainPass) {
      let cameraComponentSid = -1;
      const webxrSystem = WebGLStrategyDataTexture.__webxrSystem;
      if (webxrSystem.isWebXRMode) {
        if (webxrSystem.isMultiView()) {
          cameraComponentSid = webxrSystem._getCameraComponentSIDAt(0);
        } else {
          cameraComponentSid = webxrSystem._getCameraComponentSIDAt(displayIdx);
        }
      }
      WebGLStrategyDataTexture.__currentComponentSIDs!._v[
        WellKnownComponentTIDs.CameraComponentTID
      ] = cameraComponentSid;
    } else {
      // Non-VR Rendering
      let cameraComponent = renderPass.cameraComponent;
      if (cameraComponent == null) {
        // if the renderPass has no cameraComponent, try to get the current cameraComponent
        cameraComponent = ComponentRepository.getComponent(
          CameraComponent,
          CameraComponent.current
        ) as CameraComponent;
      }
      if (cameraComponent) {
        WebGLStrategyDataTexture.__currentComponentSIDs!._v[
          WellKnownComponentTIDs.CameraComponentTID
        ] = cameraComponent.componentSID;
      } else {
        WebGLStrategyDataTexture.__currentComponentSIDs!._v[
          WellKnownComponentTIDs.CameraComponentTID
        ] = -1;
      }
    }
  }

  private __setCurrentComponentSIDsForEachPrimitive(
    gl: WebGLRenderingContext,
    material: Material,
    shaderProgram: WebGLProgram
  ) {
    if (WebGLStrategyDataTexture.__currentComponentSIDs == null) {
      WebGLStrategyDataTexture.__currentComponentSIDs =
        WebGLStrategyDataTexture.__globalDataRepository.getValue('currentComponentSIDs', 0);
    }

    WebGLStrategyDataTexture.__currentComponentSIDs!._v[0] = material.materialSID;
  }

  common_$render(
    primitiveUids: PrimitiveUID[],
    renderPass: RenderPass,
    renderPassTickCount: Count
  ) {
    if (typeof spector !== 'undefined') {
      spector.setMarker('|  |  DataTexture:common_$render#');
    }
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContextAsWebGL2();

    if (renderPass.isBufferLessRenderingMode()) {
      this.__renderWithoutBuffers(gl, renderPass);
      return true;
    }

    let renderedSomething = false;

    // For opaque primitives
    if (renderPass._toRenderOpaquePrimitives) {
      if (!renderPass.depthWriteMask) {
        gl.depthMask(false);
      }
      for (let i = 0; i <= renderPass._lastOpaqueIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.__renderInner(primitiveUid, glw, renderPass);
        renderedSomething ||= rendered;
      }
    }

    if (renderPass._toRenderTranslucentPrimitives) {
      // Draw Translucent primitives
      for (let i = renderPass._lastOpaqueIndex + 1; i <= renderPass._lastTranslucentIndex; i++) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.__renderInner(primitiveUid, glw, renderPass);
        renderedSomething ||= rendered;
      }
    }

    if (renderPass._toRenderBlendWithZWritePrimitives) {
      // Draw Blend primitives with ZWrite
      for (
        let i = renderPass._lastTranslucentIndex + 1;
        i <= renderPass._lastBlendWithZWriteIndex;
        i++
      ) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.__renderInner(primitiveUid, glw, renderPass);
        renderedSomething ||= rendered;
      }
    }

    if (renderPass._toRenderBlendWithoutZWritePrimitives) {
      if (!MeshRendererComponent.isDepthMaskTrueForBlendPrimitives) {
        // disable depth write for blend primitives
        gl.depthMask(false);
      }

      // Draw Blend primitives without ZWrite
      for (
        let i = renderPass._lastBlendWithZWriteIndex + 1;
        i <= renderPass._lastBlendWithoutZWriteIndex;
        i++
      ) {
        const primitiveUid = primitiveUids[i];
        const rendered = this.__renderInner(primitiveUid, glw, renderPass);
        renderedSomething ||= rendered;
      }
    }

    gl.depthMask(true);

    this.__lastRenderPassTickCount = renderPassTickCount;

    // this.__webglResourceRepository.unbindTextureSamplers();

    return renderedSomething;
  }

  private __renderWithoutBuffers(gl: WebGL2RenderingContext, renderPass: RenderPass) {
    // setup shader program
    const material: Material = renderPass.material!;
    const primitive: Primitive = renderPass._dummyPrimitiveForBufferLessRendering;
    setupShaderProgram(material, primitive, this);

    const shaderProgramUid = material.getShaderProgramUid(primitive);
    const shaderProgram = this.__webglResourceRepository.getWebGLResource(
      shaderProgramUid
    )! as WebGLProgram;
    gl.useProgram(shaderProgram);
    this.__lastShader = shaderProgramUid;

    // Bind DataTexture
    this.bindDataTexture(gl, shaderProgram);

    this.__setCurrentComponentSIDsForEachPrimitive(gl, material, shaderProgram);

    gl.uniform1fv(
      (shaderProgram as any).currentComponentSIDs,
      WebGLStrategyDataTexture.__currentComponentSIDs!._v as Float32Array
    );

    const isVRMainPass = WebGLStrategyCommonMethod.isVrMainPass(renderPass);
    if ((shaderProgram as any).vrState != null && isVRMainPass) {
      const vrState = GlobalDataRepository.getInstance().getValue('vrState', 0) as Vector2;
      vrState._v[0] = isVRMainPass ? 1 : 0;
      vrState._v[1] = 0;
      (shaderProgram as any)._gl.uniform2iv((shaderProgram as any).vrState, vrState._v);
    }

    WebGLStrategyCommonMethod.setWebGLParameters(material, gl);

    material._setParametersToGpuWebGLWithOutInternalSetting({
      shaderProgram,
      firstTime: true,
      isUniformMode: false,
    });

    if (renderPass.depthWriteMask) {
      gl.depthMask(true);
    } else {
      gl.depthMask(false);
    }

    this.__webglResourceRepository.setViewport(renderPass.getViewport());

    gl.drawArrays(
      renderPass._primitiveModeForBufferLessRendering.index,
      0,
      renderPass._drawVertexNumberForBufferLessRendering
    );
  }

  private __renderInner(
    primitiveUid: PrimitiveUID,
    glw: WebGLContextWrapper,
    renderPass: RenderPass
  ) {
    const gl = glw.getRawContextAsWebGL2();
    const primitive = Primitive.getPrimitive(primitiveUid);
    if (primitive == null) {
      return false;
    }
    const mesh = primitive.mesh as Mesh;
    const entity = mesh.meshEntitiesInner[0]; // get base mesh for instancing draw
    // setup shader program
    const material: Material = renderPass.getAppropriateMaterial(primitive);
    setupShaderProgram(material, primitive, this);

    const meshRendererComponent = entity.getMeshRenderer()!;
    const primitiveIndex = mesh.getPrimitiveIndexInMesh(primitive);
    this.attachVertexDataInner(mesh, primitive, primitiveIndex, glw, mesh._variationVBOUid);

    let firstTime = false;
    const shaderProgramUid = material.getShaderProgramUid(primitive);
    if (shaderProgramUid !== this.__lastShader || (gl as any).__changedProgram) {
      if (isSkipDrawing(material, primitive)) {
        return false;
      }

      const shaderProgram = this.__webglResourceRepository.getWebGLResource(
        shaderProgramUid
      )! as WebGLProgram;
      gl.useProgram(shaderProgram);
      (gl as any).__changedProgram = false;
      // Bind DataTexture
      this.bindDataTexture(gl, shaderProgram);

      // gl.uniform1i((shaderProgram as any).isMainVr, isVRMainPass ? 1 : 0); // VR MultiView is not supported yet

      WebGLStrategyDataTexture.__shaderProgram = shaderProgram;
      firstTime = true;
    }
    if (this.__lastMaterial?.deref() !== material) {
      firstTime = true;
      this.__lastMaterial = new WeakRef(material);
    }
    if (this.__lastMaterialStateVersion !== material.stateVersion) {
      firstTime = true;
      this.__lastMaterialStateVersion = material.stateVersion;
    }

    const isVRMainPass = WebGLStrategyCommonMethod.isVrMainPass(renderPass);

    const renderingArg: RenderingArgWebGL = {
      glw: glw,
      entity: entity,
      worldMatrix: entity.getSceneGraph()!.matrixInner,
      normalMatrix: entity.getSceneGraph()!.normalMatrixInner,
      isBillboard: entity.getSceneGraph().isBillboard,
      lightComponents: this.__lightComponents!,
      renderPass: renderPass,
      primitive: primitive,
      diffuseCube: meshRendererComponent.diffuseCubeMap,
      specularCube: meshRendererComponent.specularCubeMap!,
      setUniform: false,
      isVr: isVRMainPass,
      displayIdx: -1,
    };

    if (firstTime) {
      this.__setCurrentComponentSIDsForEachPrimitive(
        gl,
        material,
        WebGLStrategyDataTexture.__shaderProgram
      );

      WebGLStrategyCommonMethod.setWebGLParameters(material, gl);

      material._setParametersToGpuWebGL({
        material: material,
        shaderProgram: WebGLStrategyDataTexture.__shaderProgram,
        firstTime: firstTime,
        args: renderingArg,
      });
    }
    material._setParametersToGpuWebGLPerPrimitive({
      material: material,
      shaderProgram: WebGLStrategyDataTexture.__shaderProgram,
      firstTime: firstTime,
      args: renderingArg,
    });

    const displayCount = WebGLStrategyCommonMethod.getDisplayCount(
      isVRMainPass,
      WebGLStrategyDataTexture.__webxrSystem
    );
    for (let displayIdx = 0; displayIdx < displayCount; displayIdx++) {
      if (isVRMainPass) {
        WebGLStrategyCommonMethod.setVRViewport(renderPass, displayIdx);
      }
      this.__setCurrentComponentSIDsForEachDisplayIdx(
        renderPass,
        displayIdx as 0 | 1,
        isVRMainPass
      );

      gl.uniform1fv(
        (WebGLStrategyDataTexture.__shaderProgram as any).currentComponentSIDs,
        WebGLStrategyDataTexture.__currentComponentSIDs!._v as Float32Array
      );

      if (
        (WebGLStrategyDataTexture.__shaderProgram as any).vrState != null &&
        isVRMainPass &&
        displayCount > 1
      ) {
        const vrState = GlobalDataRepository.getInstance().getValue('vrState', 0) as Vector2;
        vrState._v[0] = isVRMainPass ? 1 : 0;
        vrState._v[1] = displayIdx;
        (WebGLStrategyDataTexture.__shaderProgram as any)._gl.uniform2iv(
          (WebGLStrategyDataTexture.__shaderProgram as any).vrState,
          vrState._v
        );
      }

      if (primitive.indicesAccessor) {
        gl.drawElementsInstanced(
          primitive.primitiveMode.index,
          primitive.indicesAccessor.elementCount,
          primitive.indicesAccessor.componentType.index,
          0,
          mesh.meshEntitiesInner.length
        );
      } else {
        gl.drawArraysInstanced(
          primitive.primitiveMode.index,
          0,
          primitive.getVertexCountAsVerticesBased(),
          mesh.meshEntitiesInner.length
        );
      }
    }

    this.__lastShader = shaderProgramUid;

    return true;
  }

  private bindDataTexture(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    shaderProgram: WebGLProgram
  ) {
    gl.uniform1i((shaderProgram as any).dataTexture, 7);
    this.__webglResourceRepository.bindTexture2D(7, this.__dataTextureUid);
    const samplerUid = this.__webglResourceRepository.createOrGetTextureSamplerRepeatNearest();
    this.__webglResourceRepository.bindTextureSampler(7, samplerUid);
  }
  // $render(): void {}
}
