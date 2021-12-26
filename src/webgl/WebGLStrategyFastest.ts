import WebGLResourceRepository from './WebGLResourceRepository';
import MemoryManager from '../foundation/core/MemoryManager';
import Buffer from '../foundation/memory/Buffer';
import {PixelFormat} from '../foundation/definitions/PixelFormat';
import {ComponentType} from '../foundation/definitions/ComponentType';
import {TextureParameter} from '../foundation/definitions/TextureParameter';
import {BufferUse} from '../foundation/definitions/BufferUse';
import WebGLStrategy from './WebGLStrategy';
import MeshComponent from '../foundation/components/MeshComponent';
import Primitive from '../foundation/geometry/Primitive';
import WebGLContextWrapper from './WebGLContextWrapper';
import CGAPIResourceRepository from '../foundation/renderer/CGAPIResourceRepository';
import Matrix44 from '../foundation/math/Matrix44';
import {
  ShaderSemantics,
  ShaderSemanticsInfo,
  ShaderSemanticsClass,
} from '../foundation/definitions/ShaderSemantics';
import Material from '../foundation/materials/core/Material';
import {CompositionType} from '../foundation/definitions/CompositionType';
import Component from '../foundation/core/Component';
import SceneGraphComponent from '../foundation/components/SceneGraphComponent';
import Mesh from '../foundation/geometry/Mesh';
import MeshRendererComponent from '../foundation/components/MeshRendererComponent';
import ComponentRepository from '../foundation/core/ComponentRepository';
import {ShaderType} from '../foundation/definitions/ShaderType';
import LightComponent from '../foundation/components/LightComponent';
import Config from '../foundation/core/Config';
import RenderPass from '../foundation/renderer/RenderPass';
import CameraComponent from '../foundation/components/CameraComponent';
import {
  WebGLResourceHandle,
  Index,
  CGAPIResourceHandle,
  Count,
  IndexOf16Bytes,
  IndexOf4Bytes,
} from '../types/CommonTypes';
import GlobalDataRepository from '../foundation/core/GlobalDataRepository';
import VectorN from '../foundation/math/VectorN';
import {WellKnownComponentTIDs} from '../foundation/components/WellKnownComponentTIDs';
import Entity from '../foundation/core/Entity';
import {MiscUtil} from '../foundation/misc/MiscUtil';
import WebGLStrategyCommonMethod from './WebGLStrategyCommonMethod';
import Matrix33 from '../foundation/math/Matrix33';
import CubeTexture from '../foundation/textures/CubeTexture';
import {ShaderVariableUpdateInterval} from '../foundation/definitions/ShaderVariableUpdateInterval';
import ModuleManager from '../foundation/system/ModuleManager';
import {RnXR} from '../xr/main';
import {Is as is} from '../foundation/misc/Is';
import Scalar from '../foundation/math/Scalar';
import Vector3 from '../foundation/math/Vector3';

export default class WebGLStrategyFastest implements WebGLStrategy {
  private static __instance: WebGLStrategyFastest;
  private __webglResourceRepository: WebGLResourceRepository =
    WebGLResourceRepository.getInstance();
  private __dataTextureUid: CGAPIResourceHandle =
    CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __dataUBOUid: CGAPIResourceHandle =
    CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __lastShader: CGAPIResourceHandle =
    CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __lastMaterial?: Material;
  private static __shaderProgram: WebGLProgram;
  private __lastRenderPassTickCount = -1;
  private __lightComponents?: LightComponent[];
  private static __globalDataRepository = GlobalDataRepository.getInstance();
  private static __currentComponentSIDs?: VectorN;
  public _totalSizeOfGPUShaderDataStorageExceptMorphData = 0;

  private constructor() {}

  get vertexShaderMethodDefinitions_dataTexture() {
    return `

  mat4 get_worldMatrix(float instanceId)
  {
    int index = ${Component.getLocationOffsetOfMemberOfComponent(
      SceneGraphComponent,
      'worldMatrix'
    )} + 4 * int(instanceId);
    mat4 matrix = fetchMat4(u_dataTexture, index, widthOfDataTexture, heightOfDataTexture);

    return matrix;
  }


  mat3 get_normalMatrix(float instanceId) {
    int index = ${Component.getLocationOffsetOfMemberOfComponent(
      SceneGraphComponent,
      'normalMatrix'
    )} + 3 * int(instanceId);
    mat3 matrix = fetchMat3(u_dataTexture, index, widthOfDataTexture, heightOfDataTexture);
    return matrix;
  }

#ifdef RN_IS_MORPHING
  vec3 get_position(float vertexId, vec3 basePosition) {
    vec3 position = basePosition;
    int scalar_idx = 3 * int(vertexId);
    #ifdef GLSL_ES3
      int posIn4bytes = scalar_idx % 4;
    #else
      int posIn4bytes = int(mod(float(scalar_idx), 4.0));
    #endif
    for (int i=0; i<${Config.maxVertexMorphNumberInShader}; i++) {

      int basePosIn16bytes = u_dataTextureMorphOffsetPosition[i] + (scalar_idx - posIn4bytes)/4;

      vec3 addPos = vec3(0.0);
      if (posIn4bytes == 0) {
        vec4 val = fetchElement(u_dataTexture, basePosIn16bytes, widthOfDataTexture, heightOfDataTexture);
        addPos = val.xyz;
      } else if (posIn4bytes == 1) {
        vec4 val0 = fetchElement(u_dataTexture, basePosIn16bytes, widthOfDataTexture, heightOfDataTexture);
        addPos = vec3(val0.yzw);
      } else if (posIn4bytes == 2) {
        vec4 val0 = fetchElement(u_dataTexture, basePosIn16bytes, widthOfDataTexture, heightOfDataTexture);
        vec4 val1 = fetchElement(u_dataTexture, basePosIn16bytes+1, widthOfDataTexture, heightOfDataTexture);
        addPos = vec3(val0.zw, val1.x);
      } else if (posIn4bytes == 3) {
        vec4 val0 = fetchElement(u_dataTexture, basePosIn16bytes, widthOfDataTexture, heightOfDataTexture);
        vec4 val1 = fetchElement(u_dataTexture, basePosIn16bytes+1, widthOfDataTexture, heightOfDataTexture);
        addPos = vec3(val0.w, val1.xy);
      }

      // int index = u_dataTextureMorphOffsetPosition[i] + 1 * int(vertexId);
      // vec3 addPos = fetchElement(u_dataTexture, index, widthOfDataTexture, heightOfDataTexture).xyz;

      position += addPos * u_morphWeights[i];
      if (i == u_morphTargetNumber-1) {
        break;
      }
    }

    return position;
  }
#endif
  `;
  }

  setupShaderProgramForMeshComponent(meshComponent: MeshComponent): void {
    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    const primitiveNum = meshComponent.mesh.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent.mesh.getPrimitiveAt(i);
      const material = primitive.material;
      if (material == null || material.isEmptyMaterial()) {
        continue;
      }

      if (material.isShaderProgramReady()) {
        continue;
      }

      const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      const isPointSprite = primitive.primitiveMode.index === gl.POINTS;

      try {
        this.setupShaderForMaterial(material, isPointSprite);
        primitive._backupMaterial();
      } catch (e) {
        console.log(e);
        primitive._restoreMaterial();
        this.setupShaderForMaterial(primitive._prevMaterial, isPointSprite);
      }
    }
  }

  /**
   * setup shader program for the material in this WebGL strategy
   * @param material
   * @param isPointSprite
   */
  public setupShaderForMaterial(material: Material, isPointSprite: boolean) {
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    const glw = webglResourceRepository.currentWebGLContextWrapper!;

    material.createProgram(
      this.vertexShaderMethodDefinitions_dataTexture,
      this.__getShaderProperty,
      glw.isWebGL2
    );

    material.setupBasicUniformsLocations();

    material.setUniformLocationsOfMaterialNodes(
      material._shaderProgramUid,
      false
    );

    material.setupAdditionalUniformLocations(
      WebGLStrategyCommonMethod.getPointSpriteShaderSemanticsInfoArray(
        isPointSprite
      ),
      false
    );
  }

  private static __getScalarSizeOfShaderSemanticsInfo4BytesAligned(
    info: ShaderSemanticsInfo
  ): IndexOf4Bytes {
    let offset = 1;
    switch (info.compositionType) {
      case CompositionType.Mat4:
      case CompositionType.Mat4Array:
        offset = 16;
        break;
      case CompositionType.Mat3:
      case CompositionType.Mat3Array:
        offset = 9;
        break;
      case CompositionType.Mat2:
      case CompositionType.Mat2Array:
        offset = 4;
        break;
      case CompositionType.Scalar:
      case CompositionType.ScalarArray:
        offset = 1;
        break;
      default:
      // console.error('unknown composition type', info.compositionType.str, memberName);
      // return '';
    }
    return offset;
  }

  private __getShaderProperty(
    materialTypeName: string,
    info: ShaderSemanticsInfo,
    propertyIndex: Index,
    isGlobalData: boolean,
    isWebGL2: boolean
  ) {
    const returnType = info.compositionType.getGlslStr(info.componentType);

    const indexArray: IndexOf16Bytes[] = [];
    let maxIndex = 1;
    let indexStr;

    const isTexture =
      info.compositionType === CompositionType.Texture2D ||
      info.compositionType === CompositionType.TextureCube;

    const methodName = info.semantic.str.replace('.', '_');

    // definition of uniform variable for texture sampler or what must be explicitly uniform variabl)
    let varDef = '';
    const varType = info.compositionType.getGlslStr(info.componentType);
    let varIndexStr = '';
    if (info.maxIndex) {
      varIndexStr = `[${info.maxIndex}]`;
    }
    if (info.needUniformInFastest || isTexture) {
      varDef = `  uniform ${varType} u_${methodName}${varIndexStr};\n`;
    }

    // inner contents of 'get_' shader function
    const vec4SizeOfProperty: IndexOf4Bytes =
      info.compositionType.getVec4SizeOfProperty();
    if (propertyIndex < 0) {
      // if the ShaderSemanticsInfo of the property has `index` property
      if (Math.abs(propertyIndex) % ShaderSemanticsClass._scale !== 0) {
        return '';
      }
      const index: IndexOf16Bytes =
        Material.getLocationOffsetOfMemberOfMaterial(
          materialTypeName,
          propertyIndex
        )!;
      if (isWebGL2) {
        indexStr = `
          int vec4_idx = ${index} + ${vec4SizeOfProperty} * instanceId;
          `;
      } else {
        for (let i = 0; i < info.maxIndex!; i++) {
          indexArray.push(index);
        }
        maxIndex = info.maxIndex!;
        let arrayStr = `int indices[${maxIndex}];`;
        indexArray.forEach((idx, i) => {
          arrayStr += `\nindices[${i}] = ${idx};`;
        });
        indexStr = `
          ${arrayStr}
          int vec4_idx = 0;
          for (int i=0; i<${maxIndex}; i++) {
            vec4_idx = indices[i] + ${vec4SizeOfProperty} * instanceId;
            if (i == index) {
              break;
            }
          }`;
      }
    } else {
      // for non-`index` property (this is general case)
      const scalarSizeOfProperty: IndexOf4Bytes =
        WebGLStrategyFastest.__getScalarSizeOfShaderSemanticsInfo4BytesAligned(
          info
        );
      let dataBeginPos: IndexOf16Bytes = -1;
      if (isGlobalData) {
        dataBeginPos =
          WebGLStrategyCommonMethod.getLocationOffsetOfProperty(propertyIndex);
      } else {
        dataBeginPos = WebGLStrategyCommonMethod.getLocationOffsetOfProperty(
          propertyIndex,
          materialTypeName
        );
      }

      if (dataBeginPos === -1) {
        console.error('Could not get the location offset of the property.');
      }

      const instanceSize = vec4SizeOfProperty * (info.maxIndex ?? 1);
      indexStr = `int vec4_idx = ${dataBeginPos} + ${instanceSize} * instanceId;\n`;
      if (CompositionType.isArray(info.compositionType)) {
        const instanceSizeInScalar =
          scalarSizeOfProperty * (info.maxIndex ?? 1);
        indexStr = `int vec4_idx = ${dataBeginPos} + ${instanceSize} * instanceId + ${vec4SizeOfProperty} * idxOfArray;\n`;
        indexStr += `int scalar_idx = ${
          dataBeginPos * 4
        } + ${instanceSizeInScalar} * instanceId + ${scalarSizeOfProperty} * idxOfArray;\n`;
      }
    }

    let intStr = '';
    if (
      info.componentType === ComponentType.Int &&
      info.compositionType !== CompositionType.Scalar
    ) {
      intStr = 'i';
    }

    let firstPartOfInnerFunc = '';
    if (!isTexture) {
      firstPartOfInnerFunc += `
${returnType} get_${methodName}(highp float _instanceId, const int idxOfArray) {
  int instanceId = int(_instanceId);
  ${indexStr}
  `;
    }

    let str = `${varDef}${firstPartOfInnerFunc}`;

    switch (info.compositionType) {
      case CompositionType.Vec4:
      case CompositionType.Vec4Array:
        str +=
          '        highp vec4 val = fetchElement(u_dataTexture, vec4_idx, widthOfDataTexture, heightOfDataTexture);\n';
        break;
      case CompositionType.Vec3:
        str +=
          '        vec4 col0 = fetchElement(u_dataTexture, vec4_idx, widthOfDataTexture, heightOfDataTexture);\n';
        str += `        highp ${intStr}vec3 val = ${intStr}vec3(col0.xyz);`;
        break;
      case CompositionType.Vec3Array:
        str +=
          '        vec3 val = fetchVec3No16BytesAligned(u_dataTexture, scalar_idx, widthOfDataTexture, heightOfDataTexture);\n';
        break;
      case CompositionType.Vec2:
        str +=
          '        highp vec4 col0 = fetchElement(u_dataTexture, vec4_idx, widthOfDataTexture, heightOfDataTexture);\n';
        str += `        highp ${intStr}vec2 val = ${intStr}vec2(col0.xy);`;
        break;
      case CompositionType.Vec2Array:
        str +=
          '        highp vec2 val = fetchVec2No16BytesAligned(u_dataTexture, scalar_idx, widthOfDataTexture, heightOfDataTexture);\n';
        break;
      case CompositionType.Scalar:
        str +=
          '        vec4 col0 = fetchElement(u_dataTexture, vec4_idx, widthOfDataTexture, heightOfDataTexture);\n';
        if (info.componentType === ComponentType.Int) {
          str += '        int val = int(col0.x);';
        } else if (info.componentType === ComponentType.Bool) {
          str += '        bool val = bool(col0.x);';
        } else {
          str += '       float val = col0.x;';
        }
        break;
      case CompositionType.ScalarArray:
        str +=
          '        float col0 = fetchScalarNo16BytesAligned(u_dataTexture, scalar_idx, widthOfDataTexture, heightOfDataTexture);\n';
        if (info.componentType === ComponentType.Int) {
          str += '        int val = int(col0);';
        } else if (info.componentType === ComponentType.Bool) {
          str += '        bool val = bool(col0);';
        } else {
          str += '       float val = col0;';
        }
        break;
      case CompositionType.Mat4:
        str +=
          '        mat4 val = fetchMat4(u_dataTexture, vec4_idx, widthOfDataTexture, heightOfDataTexture);\n';
        break;
      case CompositionType.Mat4Array:
        str +=
          '        mat4 val = fetchMat4(u_dataTexture, vec4_idx, widthOfDataTexture, heightOfDataTexture);\n';
        break;
      case CompositionType.Mat3:
        str +=
          '        mat3 val = fetchMat3(u_dataTexture, vec4_idx, widthOfDataTexture, heightOfDataTexture);\n';
        break;
      case CompositionType.Mat3Array:
        str +=
          '        mat3 val = fetchMat3No16BytesAligned(u_dataTexture, scalar_idx, widthOfDataTexture, heightOfDataTexture);\n';
        break;
      case CompositionType.Mat2:
        str +=
          '        mat2 val = fetchMat2(u_dataTexture, vec4_idx, widthOfDataTexture, heightOfDataTexture);\n';
        break;
      case CompositionType.Mat2Array:
        str +=
          '        mat2 val = fetchMat2No16BytesAligned(u_dataTexture, scalar_idx, widthOfDataTexture, heightOfDataTexture);\n';
        break;
      default:
        // console.error('unknown composition type', info.compositionType.str, memberName);
        str += '';
    }

    if (!isTexture) {
      str += `
      return val;
    }
  `;
    }

    return str;
  }

  $load(meshComponent: MeshComponent) {
    const mesh = meshComponent.mesh as Mesh;
    if (!is.exist(mesh)) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    WebGLStrategyFastest.__currentComponentSIDs =
      WebGLStrategyFastest.__globalDataRepository.getValue(
        ShaderSemantics.CurrentComponentSIDs,
        0
      );

    if (!WebGLStrategyCommonMethod.isMaterialsSetup(meshComponent)) {
      this.setupShaderProgramForMeshComponent(meshComponent);
    }

    if (!WebGLStrategyCommonMethod.isMeshSetup(mesh)) {
      WebGLStrategyCommonMethod.updateVBOAndVAO(mesh);
    }
  }

  $prerender(
    meshComponent: MeshComponent,
    meshRendererComponent: MeshRendererComponent,
    instanceIDBufferUid: WebGLResourceHandle
  ) {
    if (meshRendererComponent._readyForRendering) {
      return;
    }

    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    if (meshComponent.mesh.isInstanceMesh()) {
      meshRendererComponent._readyForRendering = true;
      return;
    }

    meshRendererComponent._readyForRendering = true;
  }

  private __createAndUpdateDataTexture() {
    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const buffer: Buffer | undefined = memoryManager.getBuffer(
      BufferUse.GPUInstanceData
    );
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper;

    const startOffsetOfDataTextureOnGPUInstanceData = this.__isUboUse()
      ? glw!.getAlignedMaxUniformBlockSize()
      : 0;

    if (buffer == null) {
      return;
    }

    const dataTextureByteSize =
      MemoryManager.bufferWidthLength *
      MemoryManager.bufferHeightLength *
      4 *
      4;
    if (
      this.__dataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid
    ) {
      const bufferSizeForDataTextureInByte =
        buffer.takenSizeInByte - startOffsetOfDataTextureOnGPUInstanceData;
      const height = Math.min(
        Math.ceil(
          bufferSizeForDataTextureInByte /
            MemoryManager.bufferWidthLength /
            4 /
            4
        ),
        MemoryManager.bufferHeightLength
      );
      const updateByteSize = MemoryManager.bufferWidthLength * height * 4 * 4;
      if (bufferSizeForDataTextureInByte > dataTextureByteSize) {
        console.warn('The buffer size exceeds the size of the data texture.');
      }
      const floatDataTextureBuffer = new Float32Array(
        buffer.getArrayBuffer(),
        startOffsetOfDataTextureOnGPUInstanceData,
        updateByteSize / 4
      );
      this.__webglResourceRepository.updateTexture(
        this.__dataTextureUid,
        floatDataTextureBuffer,
        {
          level: 0,
          xoffset: 0,
          yoffset: 0,
          width: MemoryManager.bufferWidthLength,
          height: height,
          format: PixelFormat.RGBA,
          type: ComponentType.Float,
        }
      );
    } else {
      const morphBuffer = memoryManager.getBuffer(BufferUse.GPUVertexData);
      let morphBufferTakenSizeInByte = 0;
      let morphBufferArrayBuffer = new ArrayBuffer(0);
      if (morphBuffer != null) {
        morphBufferTakenSizeInByte = morphBuffer.takenSizeInByte;
        morphBufferArrayBuffer = morphBuffer.getArrayBuffer();
      }

      const restSizeOfDataTexture =
        dataTextureByteSize - morphBufferTakenSizeInByte;
      let floatDataTextureBuffer: Float32Array;
      // if (restSizeOfDataTexture > buffer.takenSizeInByte - startOffsetOfDataTextureOnGPUInstanceData) {
      //   let totalSizeOfDataTextureExceptMorphData = dataTextureByteSize - morphBufferTakenSizeInByte;
      //   const threshold = 5000000; // Due to limitation of SAFE_MAX_INTEGER is limited around 16000000 in fp32
      //   if (totalSizeOfDataTextureExceptMorphData / 4 / 4 > threshold) {
      //     totalSizeOfDataTextureExceptMorphData = threshold * 4 * 4;
      //   }

      //   totalSizeOfDataTextureExceptMorphData -= totalSizeOfDataTextureExceptMorphData % 16; // taking account for vec4 unit memory aligne
      //   const extraSpaceTexel = (totalSizeOfDataTextureExceptMorphData / 4 / 4) % MemoryManager.bufferWidthLength;
      //   const totalSizeOfDataTexture = totalSizeOfDataTextureExceptMorphData - extraSpaceTexel * 4 * 4;

      //   const finalArrayBuffer = MiscUtil.concatArrayBuffers(
      //     [buffer.getArrayBuffer(), morphBufferArrayBuffer],
      //     [totalSizeOfDataTexture, morphBufferTakenSizeInByte],
      //     [startOffsetOfDataTextureOnGPUInstanceData, 0],
      //     dataTextureByteSize);
      //   floatDataTextureBuffer = new Float32Array(finalArrayBuffer);
      //   Config.totalSizeOfGPUShaderDataStorageExceptMorphData = totalSizeOfDataTexture;
      // } else {
      {
        const morphBuffer = memoryManager.getBuffer(BufferUse.GPUVertexData);
        let morphBufferTakenSizeInByte = 0;
        if (morphBuffer != null) {
          morphBufferTakenSizeInByte = morphBuffer.takenSizeInByte;
        }

        let morphBufferArrayBuffer = new ArrayBuffer(0);
        if (morphBuffer != null) {
          morphBufferArrayBuffer = morphBuffer.getArrayBuffer();
        }
        const actualSpaceForDataTextureInByte =
          buffer.takenSizeInByte - startOffsetOfDataTextureOnGPUInstanceData;
        const spareSpaceTexel =
          MemoryManager.bufferWidthLength -
          ((actualSpaceForDataTextureInByte / 4 / 4) %
            MemoryManager.bufferWidthLength);
        const spareSpaceBytes = spareSpaceTexel * 4 * 4;
        const finalArrayBuffer = MiscUtil.concatArrayBuffers2({
          finalSize: dataTextureByteSize,
          srcs: [buffer.getArrayBuffer(), morphBufferArrayBuffer],
          srcsCopySize: [
            actualSpaceForDataTextureInByte + spareSpaceBytes,
            morphBufferTakenSizeInByte,
          ],
          srcsOffset: [startOffsetOfDataTextureOnGPUInstanceData, 0],
        });
        // if (finalArrayBuffer.byteLength / MemoryManager.bufferWidthLength / 4 / 4 > MemoryManager.bufferHeightLength) {
        if (
          actualSpaceForDataTextureInByte +
            spareSpaceBytes +
            morphBufferTakenSizeInByte >
          dataTextureByteSize
        ) {
          console.warn('The buffer size exceeds the size of the data texture.');
        }
        floatDataTextureBuffer = new Float32Array(finalArrayBuffer);
        Config.totalSizeOfGPUShaderDataStorageExceptMorphData =
          buffer.takenSizeInByte + spareSpaceBytes;
      }

      // write data
      if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(
          floatDataTextureBuffer!,
          {
            level: 0,
            internalFormat: TextureParameter.RGBA32F,
            width: MemoryManager.bufferWidthLength,
            height: MemoryManager.bufferHeightLength,
            border: 0,
            format: PixelFormat.RGBA,
            type: ComponentType.Float,
            magFilter: TextureParameter.Nearest,
            minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat,
            wrapT: TextureParameter.Repeat,
            generateMipmap: false,
            anisotropy: false,
            isPremultipliedAlpha: true,
          }
        );
      } else {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(
          floatDataTextureBuffer!,
          {
            level: 0,
            internalFormat: PixelFormat.RGBA,
            width: MemoryManager.bufferWidthLength,
            height: MemoryManager.bufferHeightLength,
            border: 0,
            format: PixelFormat.RGBA,
            type: ComponentType.Float,
            magFilter: TextureParameter.Nearest,
            minFilter: TextureParameter.Nearest,
            wrapS: TextureParameter.Repeat,
            wrapT: TextureParameter.Repeat,
            generateMipmap: false,
            anisotropy: false,
            isPremultipliedAlpha: true,
          }
        );
      }
    }
  }

  common_$prerender(): void {
    // Setup GPU Storage (Data Texture & UBO)
    this.__createAndUpdateDataTexture();
    this.__createAndUpdateUBO();

    const componentRepository = ComponentRepository.getInstance();
    this.__lightComponents = componentRepository.getComponentsWithType(
      LightComponent
    ) as LightComponent[];
  }

  private __isUboUse() {
    return (
      this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2 &&
      Config.isUboEnabled
    );
  }

  private __createAndUpdateUBO() {
    if (this.__isUboUse()) {
      const glw = this.__webglResourceRepository.currentWebGLContextWrapper;
      const alignedMaxUniformBlockSize = glw!.getAlignedMaxUniformBlockSize();
      const memoryManager: MemoryManager = MemoryManager.getInstance();
      const buffer: Buffer | undefined = memoryManager.getBuffer(
        BufferUse.GPUInstanceData
      );
      if (
        this.__dataUBOUid === CGAPIResourceRepository.InvalidCGAPIResourceUid
      ) {
        this.__dataUBOUid =
          this.__webglResourceRepository.setupUniformBufferDataArea(
            new Float32Array(buffer!.getArrayBuffer())
          );
      } else {
        this.__webglResourceRepository.updateUniformBuffer(
          this.__dataUBOUid,
          new Float32Array(buffer!.getArrayBuffer()),
          0,
          alignedMaxUniformBlockSize
        );
      }
    }
  }

  attachGPUData(primitive: Primitive): void {
    const material = primitive.material!;
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();
    const dataTexture = this.__webglResourceRepository.getWebGLResource(
      this.__dataTextureUid
    )! as WebGLTexture;
    glw.bindTexture2D(0, dataTexture);
    const shaderProgram = this.__webglResourceRepository.getWebGLResource(
      material._shaderProgramUid
    ) as WebGLProgram;
    const uniform_dataTexture = gl.getUniformLocation(
      shaderProgram,
      'u_dataTexture'
    );
    gl.uniform1i(uniform_dataTexture, 0);
  }

  attachGPUDataInner(gl: WebGLRenderingContext, shaderProgram: WebGLProgram) {
    this.__webglResourceRepository.bindTexture2D(0, this.__dataTextureUid);
    const uniform_dataTexture = gl.getUniformLocation(
      shaderProgram,
      'u_dataTexture'
    );
    gl.uniform1i(uniform_dataTexture, 0);
  }

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
  ) {}

  attachVertexDataInner(
    mesh: Mesh,
    primitive: Primitive,
    primitiveIndex: Index,
    glw: WebGLContextWrapper,
    instanceIDBufferUid: WebGLResourceHandle
  ) {
    const vertexHandles = primitive.vertexHandles!;
    const vao = this.__webglResourceRepository.getWebGLResource(
      mesh.getVaoUids(primitiveIndex)
    ) as WebGLVertexArrayObjectOES;
    const gl = glw.getRawContext();

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
      this.__instance = new WebGLStrategyFastest();
    }

    return this.__instance;
  }

  private __setCurrentComponentSIDsForEachRenderPass(
    renderPass: RenderPass,
    displayIdx: Index,
    isVRMainPass: boolean
  ) {
    if (isVRMainPass) {
      const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
      const webxrSystem = rnXRModule.WebXRSystem.getInstance();
      let cameraComponentSid = -1;
      if (webxrSystem.isWebXRMode) {
        cameraComponentSid = webxrSystem._getCameraComponentSIDAt(displayIdx);
      } else {
        const webvrSystem = rnXRModule.WebVRSystem.getInstance();
        cameraComponentSid = webvrSystem.getCameraComponentSIDAt(displayIdx);
      }
      WebGLStrategyFastest.__currentComponentSIDs!._v[
        WellKnownComponentTIDs.CameraComponentTID
      ] = cameraComponentSid;
    } else {
      let cameraComponent = renderPass.cameraComponent;
      if (cameraComponent == null) {
        cameraComponent = ComponentRepository.getInstance().getComponent(
          CameraComponent,
          CameraComponent.main
        ) as CameraComponent;
      }
      if (cameraComponent) {
        WebGLStrategyFastest.__currentComponentSIDs!._v[
          WellKnownComponentTIDs.CameraComponentTID
        ] = cameraComponent.componentSID;
      } else {
        WebGLStrategyFastest.__currentComponentSIDs!._v[
          WellKnownComponentTIDs.CameraComponentTID
        ] = -1;
      }
    }
  }

  private __setCurrentComponentSIDsForEachEntity(
    gl: WebGLRenderingContext,
    renderPass: RenderPass,
    entity: Entity
  ) {
    const skeletalComponent = entity.getSkeletal();
    if (skeletalComponent) {
      let index = 0;
      if (skeletalComponent.componentSID < Config.maxSkeletonNumber) {
        index = skeletalComponent.componentSID;
      }
      WebGLStrategyFastest.__currentComponentSIDs!._v[
        WellKnownComponentTIDs.SkeletalComponentTID
      ] = index;
    } else {
      WebGLStrategyFastest.__currentComponentSIDs!._v[
        WellKnownComponentTIDs.SkeletalComponentTID
      ] = -1;
    }
  }

  private __setCurrentComponentSIDsForEachPrimitive(
    gl: WebGLRenderingContext,
    renderPass: RenderPass,
    material: Material,
    entity: Entity
  ) {
    WebGLStrategyFastest.__currentComponentSIDs!._v[0] = material.materialSID;
    gl.uniform1fv(
      (WebGLStrategyFastest.__shaderProgram as any).currentComponentSIDs,
      WebGLStrategyFastest.__currentComponentSIDs!._v as Float32Array
    );
  }

  common_$render(
    meshComponentSids: Int32Array,
    meshComponents: MeshComponent[],
    viewMatrix: Matrix44,
    projectionMatrix: Matrix44,
    renderPass: RenderPass,
    renderPassTickCount: Count
  ) {
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();

    const isVRMainPass = WebGLStrategyCommonMethod.isVrMainPass(renderPass);
    const displayNumber =
      WebGLStrategyCommonMethod.getDisplayNumber(isVRMainPass);

    for (let displayIdx = 0; displayIdx < displayNumber; displayIdx++) {
      if (isVRMainPass) {
        WebGLStrategyCommonMethod.setVRViewport(renderPass, displayIdx);
      }
      this.__setCurrentComponentSIDsForEachRenderPass(
        renderPass,
        displayIdx,
        isVRMainPass
      ); // update u_currentComponentSIDs(uniform)

      for (let idx = 0; idx < meshComponentSids.length; idx++) {
        const sid = meshComponentSids[idx];
        if (sid === Component.invalidComponentSID) {
          break;
        }

        const meshComponent = meshComponents[sid];
        if (meshComponent == null) {
          break;
        }
        const mesh = meshComponent.mesh;
        if (!mesh?.isOriginalMesh()) {
          continue;
        }

        WebGLStrategyCommonMethod.startDepthMasking(idx, gl);

        const entity = meshComponent.entity;
        this.__setCurrentComponentSIDsForEachEntity(gl, renderPass, entity);

        const meshRendererComponent = entity.getMeshRenderer();

        const primitiveNum = mesh.getPrimitiveNumber();
        let firstTime = false;

        for (let i = 0; i < primitiveNum; i++) {
          const primitive = mesh.getPrimitiveAt(i);
          const material: Material = renderPass.getAppropriateMaterial(
            primitive,
            primitive.material
          );
          if (WebGLStrategyCommonMethod.isSkipDrawing(material, idx)) {
            continue;
          }

          const shaderProgramUid = material._shaderProgramUid;

          this.attachVertexDataInner(
            mesh,
            primitive,
            i,
            glw,
            mesh._variationVBOUid
          );
          if (shaderProgramUid !== this.__lastShader) {
            const shaderProgram =
              this.__webglResourceRepository.getWebGLResource(
                shaderProgramUid
              )! as WebGLProgram;
            gl.useProgram(shaderProgram);

            gl.uniform1i((shaderProgram as any).dataTexture, 7);

            this.__webglResourceRepository.bindTexture2D(
              7,
              this.__dataTextureUid
            );

            WebGLStrategyFastest.__shaderProgram = shaderProgram;
            firstTime = true;
          }
          if (this.__lastMaterial !== material) {
            firstTime = true;
            this.__lastMaterial = material;
          }

          this.__setCurrentComponentSIDsForEachPrimitive(
            gl,
            renderPass,
            material,
            entity
          );

          WebGLStrategyCommonMethod.setWebGLParameters(material, gl);

          material._setParametersForGPU({
            material: material,
            shaderProgram: WebGLStrategyFastest.__shaderProgram,
            firstTime: firstTime,
            args: {
              glw: glw,
              entity: entity,
              worldMatrix: entity.getSceneGraph().worldMatrixInner,
              normalMatrix: entity.getSceneGraph().normalMatrixInner,
              lightComponents: this.__lightComponents,
              renderPass: renderPass,
              primitive: primitive,
              diffuseCube: meshRendererComponent.diffuseCubeMap,
              specularCube: meshRendererComponent.specularCubeMap,
              setUniform: false,
            },
          });

          if (primitive.indicesAccessor) {
            glw.drawElementsInstanced(
              primitive.primitiveMode.index,
              primitive.indicesAccessor.elementCount,
              primitive.indicesAccessor.componentType.index,
              0,
              mesh.instanceCountIncludeOriginal
            );
          } else {
            glw.drawArraysInstanced(
              primitive.primitiveMode.index,
              0,
              primitive.getVertexCountAsVerticesBased(),
              mesh.instanceCountIncludeOriginal
            );
          }

          this.__lastShader = shaderProgramUid;
        }
      }
    }

    this.__lastRenderPassTickCount = renderPassTickCount;
    return false;
  }

  $render(
    idx: Index,
    meshComponent: MeshComponent,
    worldMatrix: Matrix44,
    normalMatrix: Matrix33,
    entity: Entity,
    renderPass: RenderPass,
    renderPassTickCount: Count,
    diffuseCube?: CubeTexture,
    specularCube?: CubeTexture
  ) {
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();
    WebGLStrategyCommonMethod.endDepthMasking(idx, gl);
  }
}
