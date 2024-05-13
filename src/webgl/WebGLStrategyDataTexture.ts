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
import { ShaderSemantics } from '../foundation/definitions/ShaderSemantics';
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

declare const spector: any;

export class WebGLStrategyDataTexture implements CGAPIStrategy, WebGLStrategy {
  private static __instance: WebGLStrategyDataTexture;
  private __webglResourceRepository: WebGLResourceRepository =
    WebGLResourceRepository.getInstance();
  private __dataTextureUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __dataUBOUid: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __lastShader: CGAPIResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __lastMaterial?: Material;
  private static __shaderProgram: WebGLProgram;
  private __lastRenderPassTickCount = -1;
  private __lightComponents?: LightComponent[];
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private static __currentComponentSIDs?: VectorN;
  public _totalSizeOfGPUShaderDataStorageExceptMorphData = 0;
  private static __isDebugOperationToDataTextureBufferDone = true;
  private __latestPrimitivePositionAccessorVersions: number[] = [];
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
  public setupShaderForMaterial(material: Material): CGAPIResourceHandle {
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    const glw = webglResourceRepository.currentWebGLContextWrapper!;

    const programUid = material._createProgramWebGL(
      WebGLStrategyDataTexture.getVertexShaderMethodDefinitions_dataTexture(),
      WebGLStrategyDataTexture.__getShaderProperty,
      glw.isWebGL2
    );

    material._setupBasicUniformsLocations();

    material._setUniformLocationsOfMaterialNodes(false);

    material._setupAdditionalUniformLocations(
      WebGLStrategyCommonMethod.getPointSpriteShaderSemanticsInfoArray(),
      false
    );

    WebGLStrategyDataTexture.__globalDataRepository._setUniformLocationsForDataTextureModeOnly(
      material._shaderProgramUid
    );

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
    updatedShaderSources: ShaderSources,
    onError: (message: string) => void
  ): CGAPIResourceHandle {
    const programUid = material._createProgramByUpdatedSources(updatedShaderSources, onError);
    if (programUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return programUid;
    }

    material._setupBasicUniformsLocations();

    material._setUniformLocationsOfMaterialNodes(false);

    material._setupAdditionalUniformLocations(
      WebGLStrategyCommonMethod.getPointSpriteShaderSemanticsInfoArray(),
      false
    );

    WebGLStrategyDataTexture.__globalDataRepository._setUniformLocationsForDataTextureModeOnly(
      material._shaderProgramUid
    );

    return programUid;
  }

  private static __getShaderProperty(
    materialTypeName: string,
    info: ShaderSemanticsInfo,
    propertyIndex: Index,
    isGlobalData: boolean,
    isWebGL2: boolean
  ) {
    const returnType = info.compositionType.getGlslStr(info.componentType);

    let indexStr;

    const isTexture = CompositionType.isTexture(info.compositionType);

    const methodName = info.semantic.str.replace('.', '_');

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
      propertyIndex,
      materialTypeName
    );

    if (offsetOfProperty === -1) {
      console.error('Could not get the location offset of the property.');
    }

    const instanceSize = vec4SizeOfProperty * (info.arrayLength ?? 1);
    indexStr = `int vec4_idx = ${offsetOfProperty} + ${instanceSize} * instanceId;\n`;
    if (CompositionType.isArray(info.compositionType)) {
      const instanceSizeInScalar = scalarSizeOfProperty * (info.arrayLength ?? 1);
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
          // console.error('unknown composition type', info.compositionType.str, memberName);
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
    propertyIndex: number,
    materialTypeName: string
  ) {
    if (isGlobalData) {
      const globalDataRepository = GlobalDataRepository.getInstance();
      const dataBeginPos = globalDataRepository.getLocationOffsetOfProperty(propertyIndex);
      return dataBeginPos;
    } else {
      const dataBeginPos = MaterialRepository.getLocationOffsetOfMemberOfMaterial(
        materialTypeName,
        propertyIndex
      );
      return dataBeginPos;
    }
  }

  $load(meshComponent: MeshComponent) {
    const mesh = meshComponent.mesh as Mesh;
    if (Is.not.exist(mesh)) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    WebGLStrategyDataTexture.__currentComponentSIDs =
      WebGLStrategyDataTexture.__globalDataRepository.getValue(
        ShaderSemantics.CurrentComponentSIDs,
        0
      );

    // update VBO and VAO
    if (!this.__isMeshSetup(mesh)) {
      this.deleteDataTexture(); // delete data texture to recreate one on next
      updateVBOAndVAO(mesh);
      const primitiveNum = mesh.getPrimitiveNumber();

      for (let i = 0; i < primitiveNum; i++) {
        const primitive = mesh.getPrimitiveAt(i);
        this.__latestPrimitivePositionAccessorVersions[primitive.primitiveUid] =
          primitive.positionAccessorVersion!;
      }
    }
  }

  private __isMeshSetup(mesh: Mesh) {
    if (mesh._variationVBOUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      return false;
    }

    const primitiveNum = mesh.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = mesh.getPrimitiveAt(i);
      if (
        Is.not.exist(primitive.vertexHandles) ||
        primitive.positionAccessorVersion !==
          this.__latestPrimitivePositionAccessorVersions[primitive.primitiveUid]
      ) {
        return false;
      }
    }

    return true;
  }

  $prerender(
    meshComponent: MeshComponent,
    meshRendererComponent: MeshRendererComponent,
    instanceIDBufferUid: WebGLResourceHandle
  ): void {
    if (meshRendererComponent._readyForRendering) {
      return;
    }

    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    meshRendererComponent._readyForRendering = true;
  }

  private __createAndUpdateDataTexture() {
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
      const bufferSizeForDataTextureInByte =
        gpuInstanceDataBuffer.takenSizeInByte - startOffsetOfDataTextureOnGPUInstanceData;
      const height = Math.min(
        Math.ceil(bufferSizeForDataTextureInByte / MemoryManager.bufferWidthLength / 4 / 4),
        MemoryManager.bufferHeightLength
      );
      const updateByteSize = MemoryManager.bufferWidthLength * height * 4 * 4;
      if (bufferSizeForDataTextureInByte > dataTextureByteSize) {
        console.warn('The buffer size exceeds the size of the data texture.');
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
          console.warn('The buffer size exceeds the size of the data texture.');
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
          internalFormat: TextureParameter.RGBA32F,
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

  common_$prerender(): void {
    // Setup GPU Storage (Data Texture & UBO)
    this.__createAndUpdateDataTexture();
    this.__createAndUpdateUBO();

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

  attachShaderProgram(material: Material): void {
    const shaderProgramUid = material._shaderProgramUid;

    if (shaderProgramUid !== this.__lastShader) {
      const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      const shaderProgram = this.__webglResourceRepository.getWebGLResource(
        shaderProgramUid
      )! as WebGLProgram;
      gl.useProgram(shaderProgram);
      this.__lastShader = shaderProgramUid;
    }
  }

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
    }

    return this.__instance;
  }

  private __setCurrentComponentSIDsForEachRenderPass(
    renderPass: RenderPass,
    displayIdx: 0 | 1,
    isVRMainPass: boolean
  ) {
    if (isVRMainPass) {
      const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
      const webxrSystem = rnXRModule.WebXRSystem.getInstance();
      let cameraComponentSid = -1;
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
    WebGLStrategyDataTexture.__currentComponentSIDs!._v[0] = material.materialSID;
    gl.uniform1fv(
      (shaderProgram as any).currentComponentSIDs,
      WebGLStrategyDataTexture.__currentComponentSIDs!._v as Float32Array
    );
  }

  common_$render(primitiveUids: Int32Array, renderPass: RenderPass, renderPassTickCount: Count) {
    if (typeof spector !== 'undefined') {
      spector.setMarker('|  |  DataTexture:common_$render#');
    }
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();

    const isVRMainPass = WebGLStrategyCommonMethod.isVrMainPass(renderPass);
    const displayNumber = WebGLStrategyCommonMethod.getDisplayNumber(isVRMainPass);
    for (let displayIdx = 0; displayIdx < displayNumber; displayIdx++) {
      if (isVRMainPass) {
        WebGLStrategyCommonMethod.setVRViewport(renderPass, displayIdx);
      }
      this.__setCurrentComponentSIDsForEachRenderPass(
        renderPass,
        displayIdx as 0 | 1,
        isVRMainPass
      );

      for (let j = 0; j < renderPass.drawCount; j++) {
        renderPass.doPreEachDraw(j);

        // For opaque primitives
        if (renderPass.toRenderOpaquePrimitives) {
          for (let i = 0; i <= renderPass._lastOpaqueIndex; i++) {
            const primitiveUid = primitiveUids[i];
            this.renderInner(primitiveUid, glw, renderPass, isVRMainPass, displayIdx);
          }
        }

        // For translucent primitives
        if (renderPass.toRenderTransparentPrimitives) {
          if (!MeshRendererComponent.isDepthMaskTrueForTransparencies) {
            // disable depth write for transparent primitives
            gl.depthMask(false);
          }

          for (
            let i = renderPass._lastOpaqueIndex + 1;
            i <= renderPass._lastTransparentIndex;
            i++
          ) {
            const primitiveUid = primitiveUids[i];
            this.renderInner(primitiveUid, glw, renderPass, isVRMainPass, displayIdx);
          }
          gl.depthMask(true);
        }
      }
    }

    this.__lastRenderPassTickCount = renderPassTickCount;

    this.__webglResourceRepository.unbindTextureSamplers();

    return false;
  }

  renderInner(
    primitiveUid: PrimitiveUID,
    glw: WebGLContextWrapper,
    renderPass: RenderPass,
    isVRMainPass: boolean,
    displayIdx: Index
  ) {
    const gl = glw.getRawContext();
    const primitive = Primitive.getPrimitive(primitiveUid);
    const mesh = primitive.mesh as Mesh;
    const entity = mesh.meshEntitiesInner[0]; // get base mesh for instancing draw
    // setup shader program
    const material: Material = renderPass.getAppropriateMaterial(primitive);
    setupShaderProgram(material, primitive, this);

    if (isSkipDrawing(material)) {
      return false;
    }

    const meshRendererComponent = entity.getMeshRenderer()!;
    const primitiveIndex = mesh.getPrimitiveIndexInMesh(primitive);
    this.attachVertexDataInner(mesh, primitive, primitiveIndex, glw, mesh._variationVBOUid);

    let firstTime = false;
    const shaderProgramUid = material._shaderProgramUid;
    if (shaderProgramUid !== this.__lastShader) {
      const shaderProgram = this.__webglResourceRepository.getWebGLResource(
        shaderProgramUid
      )! as WebGLProgram;
      gl.useProgram(shaderProgram);

      // Bind DataTexture
      this.bindDataTexture(gl, shaderProgram);

      gl.uniform1i((shaderProgram as any).isMainVr, isVRMainPass ? 1 : 0);

      WebGLStrategyDataTexture.__shaderProgram = shaderProgram;
      firstTime = true;
    }
    if (this.__lastMaterial !== material) {
      firstTime = true;
      this.__lastMaterial = material;
    }

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
      args: {
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
        displayIdx,
      },
    });

    if (primitive.indicesAccessor) {
      glw.drawElementsInstanced(
        primitive.primitiveMode.index,
        primitive.indicesAccessor.elementCount,
        primitive.indicesAccessor.componentType.index,
        0,
        mesh.meshEntitiesInner.length
      );
    } else {
      glw.drawArraysInstanced(
        primitive.primitiveMode.index,
        0,
        primitive.getVertexCountAsVerticesBased(),
        mesh.meshEntitiesInner.length
      );
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
