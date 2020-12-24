import WebGLResourceRepository from "./WebGLResourceRepository";
import MemoryManager from "../foundation/core/MemoryManager";
import Buffer from "../foundation/memory/Buffer";
import { PixelFormat } from "../foundation/definitions/PixelFormat";
import { ComponentType } from "../foundation/definitions/ComponentType";
import { TextureParameter } from "../foundation/definitions/TextureParameter";
import { BufferUse } from "../foundation/definitions/BufferUse";
import WebGLStrategy from "./WebGLStrategy";
import MeshComponent from "../foundation/components/MeshComponent"
import Primitive from "../foundation/geometry/Primitive";
import WebGLContextWrapper from "./WebGLContextWrapper";
import CGAPIResourceRepository from "../foundation/renderer/CGAPIResourceRepository";
import Matrix44 from "../foundation/math/Matrix44";
import { ShaderSemantics, ShaderSemanticsInfo, ShaderSemanticsClass } from "../foundation/definitions/ShaderSemantics";
import Material from "../foundation/materials/core/Material";
import { CompositionType } from "../foundation/definitions/CompositionType";
import Component from "../foundation/core/Component";
import SceneGraphComponent from "../foundation/components/SceneGraphComponent";
import Mesh from "../foundation/geometry/Mesh";
import MeshRendererComponent from "../foundation/components/MeshRendererComponent";
import ComponentRepository from "../foundation/core/ComponentRepository";
import { ShaderType } from "../foundation/definitions/ShaderType";
import LightComponent from "../foundation/components/LightComponent";
import Config from "../foundation/core/Config";
import RenderPass from "../foundation/renderer/RenderPass";
import CameraComponent from "../foundation/components/CameraComponent";
import { WebGLResourceHandle, Index, CGAPIResourceHandle, Count, IndexOf16Bytes, IndexOf4Bytes } from "../commontypes/CommonTypes";
import GlobalDataRepository from "../foundation/core/GlobalDataRepository";
import VectorN from "../foundation/math/VectorN";
import { WellKnownComponentTIDs } from "../foundation/components/WellKnownComponentTIDs";
import Entity from "../foundation/core/Entity";
import { MiscUtil } from "../foundation/misc/MiscUtil";
import WebGLStrategyCommonMethod from "./WebGLStrategyCommonMethod";
import Matrix33 from "../foundation/math/Matrix33";
import CubeTexture from "../foundation/textures/CubeTexture";
import { ShaderVariableUpdateInterval } from "../foundation/definitions/ShaderVariableUpdateInterval";
import ModuleManager from "../foundation/system/ModuleManager";
import { RnXR } from "../rhodonite-xr";
import Vector4 from "../foundation/math/Vector4";

export default class WebGLStrategyFastest implements WebGLStrategy {
  private static __instance: WebGLStrategyFastest;
  private __webglResourceRepository: WebGLResourceRepository = WebGLResourceRepository.getInstance();
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

  private constructor() { }

  get vertexShaderMethodDefinitions_dataTexture() {

    return `

  mat4 get_worldMatrix(float instanceId)
  {
    int index = ${Component.getLocationOffsetOfMemberOfComponent(SceneGraphComponent, 'worldMatrix')} + 4 * int(instanceId);
    mat4 matrix = fetchMat4(u_dataTexture, index, widthOfDataTexture, heightOfDataTexture);

    return matrix;
  }


  mat3 get_normalMatrix(float instanceId) {
    int index = ${Component.getLocationOffsetOfMemberOfComponent(SceneGraphComponent, 'normalMatrix')} + 3 * int(instanceId);
    mat3 matrix = fetchMat3(u_dataTexture, index, widthOfDataTexture, heightOfDataTexture);
    return matrix;
  }

#ifdef RN_IS_MORPHING
  vec3 get_position(float vertexId, vec3 basePosition) {
    vec3 position = basePosition;
    for (int i=0; i<${Config.maxVertexMorphNumberInShader}; i++) {
      int index = u_dataTextureMorphOffsetPosition[i] + 1 * int(vertexId);
      vec3 addPos = fetchElement(u_dataTexture, index, widthOfDataTexture, heightOfDataTexture).xyz;
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

  setupShaderProgram(meshComponent: MeshComponent): void {
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

      if (material._shaderProgramUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        continue;
      }

      const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      const isPointSprite = primitive.primitiveMode.index === gl.POINTS;

      try {
        this.setupDefaultShaderSemantics(material, isPointSprite);
        primitive._backupMaterial();
      } catch (e) {
        console.log(e)
        primitive._restoreMaterial();
        this.setupDefaultShaderSemantics(primitive._prevMaterial, isPointSprite);
      }
    }
  }

  setupDefaultShaderSemantics(material: Material, isPointSprite: boolean) {
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    const glw = webglResourceRepository.currentWebGLContextWrapper!

    material.createProgram(this.vertexShaderMethodDefinitions_dataTexture, this.__getShaderProperty, glw.isWebGL2);

    if (isPointSprite) {
      this.__webglResourceRepository.setupUniformLocations(material._shaderProgramUid,
        [
          {
            semantic: ShaderSemantics.PointSize, compositionType: CompositionType.Scalar, componentType: ComponentType.Float,
            stage: ShaderType.PixelShader, min: 0, max: Number.MAX_VALUE, isSystem: true, updateInterval: ShaderVariableUpdateInterval.EveryTime
          },
          {
            semantic: ShaderSemantics.PointDistanceAttenuation, compositionType: CompositionType.Vec3, componentType: ComponentType.Float,
            stage: ShaderType.PixelShader, min: 0, max: 1, isSystem: true, updateInterval: ShaderVariableUpdateInterval.EveryTime
          },
        ]
      );
    }

    material.setUniformLocations(material._shaderProgramUid);

    const shaderProgram = this.__webglResourceRepository.getWebGLResource(material._shaderProgramUid)! as WebGLProgram;

    const gl = this.__webglResourceRepository.currentWebGLContextWrapper!.getRawContext();
    (shaderProgram as any).dataTexture = gl.getUniformLocation(shaderProgram, 'u_dataTexture');
    (shaderProgram as any).currentComponentSIDs = gl.getUniformLocation(shaderProgram, 'u_currentComponentSIDs');
  }


  private static __getIndexOf16BytesOffsetOfShaderSemanticsInfo(info: ShaderSemanticsInfo): IndexOf16Bytes {
    let offset = 1;
    switch (info.compositionType) {
      case CompositionType.Mat4:
      case CompositionType.Mat4Array:
        offset = 4;
        break;
      case CompositionType.Mat3:
        offset = 3;
        break;
      case CompositionType.Mat2:
        offset = 2;
        break;
      default:
      // console.error('unknown composition type', info.compositionType.str, memberName);
      // return '';
    }
    return offset;
  }

  private static __getIndexOf4BytesOffsetOfShaderSemanticsInfo(info: ShaderSemanticsInfo): IndexOf4Bytes {
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

  private __getShaderProperty(materialTypeName: string, info: ShaderSemanticsInfo, propertyIndex: Index, isGlobalData: boolean, isWebGL2: boolean) {
    const returnType = info.compositionType.getGlslStr(info.componentType);

    const indexArray: IndexOf16Bytes[] = [];
    let maxIndex = 1;
    let indexStr;

    const isTexture = info.compositionType === CompositionType.Texture2D || info.compositionType === CompositionType.TextureCube;

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
    if (propertyIndex < 0) { // if the ShaderSemanticsInfo of the property has `index` property
      if (Math.abs(propertyIndex) % ShaderSemanticsClass._scale !== 0) {
        return '';
      }
      const offset = WebGLStrategyFastest.__getIndexOf16BytesOffsetOfShaderSemanticsInfo(info);
      const index: IndexOf16Bytes = Material.getLocationOffsetOfMemberOfMaterial(materialTypeName, propertyIndex)!;
      if (isWebGL2) {
        indexStr = `
          int vec4_idx = ${index} + ${offset} * instanceId;
          `;
      } else {
        for (let i = 0; i < info.maxIndex!; i++) {
          indexArray.push(index)
        }
        maxIndex = info.maxIndex!;
        let arrayStr = `int indices[${maxIndex}];`
        indexArray.forEach((idx, i) => {
          arrayStr += `\nindices[${i}] = ${idx};`
        });
        indexStr = `
          ${arrayStr}
          int vec4_idx = 0;
          for (int i=0; i<${maxIndex}; i++) {
            vec4_idx = indices[i] + ${offset} * instanceId;
            if (i == index) {
              break;
            }
          }`;
      }
    } else { // fzor non-`index` property (this is general case)
      const typeSize = WebGLStrategyFastest.__getIndexOf16BytesOffsetOfShaderSemanticsInfo(info);
      let dataBeginPos: IndexOf16Bytes = -1;
      if (isGlobalData) {
        const globalDataRepository = GlobalDataRepository.getInstance();
        dataBeginPos = globalDataRepository.getLocationOffsetOfProperty(propertyIndex);
      } else {
        dataBeginPos = Material.getLocationOffsetOfMemberOfMaterial(materialTypeName, propertyIndex);
      }
      if (dataBeginPos === -1) {
        console.error('Could not get the location offset of the property.');
      }

      let instanceSize = typeSize;
      if (CompositionType.isArray(info.compositionType)) {
        if (info.maxIndex != null) {
          instanceSize = typeSize * info.maxIndex;
        }
      }

      if (CompositionType.isArray(info.compositionType)) {
        indexStr = `int vec4_idx = ${dataBeginPos} + ${instanceSize} * instanceId + ${typeSize} * idxOfArray;`;
      } else if (info.compositionType === CompositionType.Mat4 || info.compositionType === CompositionType.Mat3 || info.compositionType === CompositionType.Mat2) {
        indexStr = `int vec4_idx = ${dataBeginPos} + ${instanceSize} * instanceId;`;
      } else {
        indexStr = `int vec4_idx = ${dataBeginPos} + instanceId;`;
      }
    }


    let intStr = '';
    if (info.componentType === ComponentType.Int && info.compositionType !== CompositionType.Scalar) {
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
        str += `        vec4 col0 = fetchElement(u_dataTexture, vec4_idx, widthOfDataTexture, heightOfDataTexture);\n`
        str += `        highp ${intStr}vec4 val = ${intStr}vec4(col0);`; break;
      case CompositionType.Vec3:
      case CompositionType.Vec3Array:
        str += `        vec4 col0 = fetchElement(u_dataTexture, vec4_idx, widthOfDataTexture, heightOfDataTexture);\n`
        str += `        highp ${intStr}vec3 val = ${intStr}vec3(col0.xyz);`; break;
      case CompositionType.Vec2:
      case CompositionType.Vec2Array:
        str += `        vec4 col0 = fetchElement(u_dataTexture, vec4_idx, widthOfDataTexture, heightOfDataTexture);\n`
        str += `        highp ${intStr}vec2 val = ${intStr}vec2(col0.xy);`; break;
      case CompositionType.Scalar:
      case CompositionType.ScalarArray:
        str += `        vec4 col0 = fetchElement(u_dataTexture, vec4_idx, widthOfDataTexture, heightOfDataTexture);\n`
        if (info.componentType === ComponentType.Int) {
          str += `        int val = int(col0.x);`;
        } else if (info.componentType === ComponentType.Bool) {
          str += `        bool val = bool(col0.x);`;
        } else {
          str += `       float val = col0.x;`;
        }
        break;
      case CompositionType.Mat4:
      case CompositionType.Mat4Array:
        str += `        mat4 val = fetchMat4(u_dataTexture, vec4_idx, widthOfDataTexture, heightOfDataTexture);\n`;
        break;
      case CompositionType.Mat3:
        str += `        mat3 val = fetchMat3(u_dataTexture, vec4_idx, widthOfDataTexture, heightOfDataTexture);\n`;
        break;
      default:
        // console.error('unknown composition type', info.compositionType.str, memberName);
        str += '';
    }

    if (!isTexture) {
      str += `
      return val;
    }
  `
    }

    return str;
  }

  $load(meshComponent: MeshComponent) {

    if (meshComponent.mesh == null) {
      MeshComponent.alertNoMeshSet(meshComponent);
      return;
    }

    WebGLStrategyFastest.__currentComponentSIDs = WebGLStrategyFastest.__globalDataRepository.getValue(ShaderSemantics.CurrentComponentSIDs, 0);

    if (!WebGLStrategyCommonMethod.isMaterialsSetup(meshComponent)) {
      this.setupShaderProgram(meshComponent);
    }

    if (!WebGLStrategyCommonMethod.isMeshSetup(meshComponent)) {
      const primitiveNum = meshComponent.mesh.getPrimitiveNumber();
      for (let i = 0; i < primitiveNum; i++) {
        const primitive = meshComponent.mesh.getPrimitiveAt(i);
        primitive.create3DAPIVertexData();
      }
      meshComponent.mesh.updateVariationVBO();
    }
  }

  $prerender(meshComponent: MeshComponent, meshRendererComponent: MeshRendererComponent, instanceIDBufferUid: WebGLResourceHandle) {
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

    const primitiveNum = meshComponent.mesh.getPrimitiveNumber();
    for (let i = 0; i < primitiveNum; i++) {
      const primitive = meshComponent.mesh.getPrimitiveAt(i);
      this.__webglResourceRepository.setVertexDataToPipeline(
        { vaoHandle: meshComponent.mesh.getVaoUids(i), iboHandle: primitive.vertexHandles!.iboHandle, vboHandles: primitive.vertexHandles!.vboHandles },
        primitive, meshComponent.mesh.variationVBOUid);
    }
    meshRendererComponent._readyForRendering = true;
  }



  private __createAndUpdateDataTexture() {
    const memoryManager: MemoryManager = MemoryManager.getInstance();
    const buffer: Buffer | undefined = memoryManager.getBuffer(BufferUse.GPUInstanceData);
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper;


    const startOffsetOfDataTextureOnGPUInstanceData = (glw!.isWebGL2) ? glw!.getAlignedMaxUniformBlockSize() : 0;

    if (buffer == null) {
      return;
    }

    const dataTextureByteSize = MemoryManager.bufferWidthLength * MemoryManager.bufferHeightLength * 4 * 4;
    if (this.__dataTextureUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const bufferSizeForDataTextureInByte = buffer.takenSizeInByte - startOffsetOfDataTextureOnGPUInstanceData;
      const height = Math.min(Math.ceil(bufferSizeForDataTextureInByte / MemoryManager.bufferWidthLength / 4 / 4), MemoryManager.bufferHeightLength);
      const updateByteSize = MemoryManager.bufferWidthLength * height * 4 * 4;
      if (bufferSizeForDataTextureInByte > dataTextureByteSize) {
        console.warn('The buffer size exceeds the size of the data texture.');
      }
      const floatDataTextureBuffer = new Float32Array(buffer.getArrayBuffer(), startOffsetOfDataTextureOnGPUInstanceData, updateByteSize / 4);
      if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
          level: 0, xoffset: 0, yoffset: 0, width: MemoryManager.bufferWidthLength, height: height,
          format: PixelFormat.RGBA, type: ComponentType.Float
        });
      } else {
        this.__webglResourceRepository.updateTexture(this.__dataTextureUid, floatDataTextureBuffer, {
          level: 0, xoffset: 0, yoffset: 0, width: MemoryManager.bufferWidthLength, height: height,
          format: PixelFormat.RGBA, type: ComponentType.Float
        });
      }
    } else {

      const morphBuffer = memoryManager.getBuffer(BufferUse.GPUVertexData);
      let morphBufferTakenSizeInByte = 0;
      let morphBufferArrayBuffer = new ArrayBuffer(0);
      if (morphBuffer != null) {
        morphBufferTakenSizeInByte = morphBuffer.takenSizeInByte;
        morphBufferArrayBuffer = morphBuffer.getArrayBuffer();
      }

      const restSizeOfDataTexture = dataTextureByteSize - morphBufferTakenSizeInByte;
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
        const actualSpaceForDataTextureInByte = buffer.takenSizeInByte - startOffsetOfDataTextureOnGPUInstanceData;
        const spareSpaceTexel = MemoryManager.bufferWidthLength - (actualSpaceForDataTextureInByte / 4 / 4) % MemoryManager.bufferWidthLength;
        const spareSpaceBytes = spareSpaceTexel * 4 * 4;
        const finalArrayBuffer = MiscUtil.concatArrayBuffers(
          [buffer.getArrayBuffer(), morphBufferArrayBuffer],
          [actualSpaceForDataTextureInByte + spareSpaceBytes, morphBufferTakenSizeInByte],
          [startOffsetOfDataTextureOnGPUInstanceData, 0],
          dataTextureByteSize);
        // if (finalArrayBuffer.byteLength / MemoryManager.bufferWidthLength / 4 / 4 > MemoryManager.bufferHeightLength) {
        if (actualSpaceForDataTextureInByte + spareSpaceBytes + morphBufferTakenSizeInByte > dataTextureByteSize) {
          console.warn('The buffer size exceeds the size of the data texture.');
        }
        floatDataTextureBuffer = new Float32Array(finalArrayBuffer);
        Config.totalSizeOfGPUShaderDataStorageExceptMorphData = buffer.takenSizeInByte + spareSpaceBytes;

      }


      // write data
      if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer!, {
          level: 0, internalFormat: TextureParameter.RGBA32F, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
          border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
          wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false, isPremultipliedAlpha: true
        });
      } else {
        this.__dataTextureUid = this.__webglResourceRepository.createTexture(floatDataTextureBuffer!, {
          level: 0, internalFormat: PixelFormat.RGBA, width: MemoryManager.bufferWidthLength, height: MemoryManager.bufferHeightLength,
          border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
          wrapS: TextureParameter.Repeat, wrapT: TextureParameter.Repeat, generateMipmap: false, anisotropy: false, isPremultipliedAlpha: true
        });
      }
    }
  }

  common_$prerender(): void {

    // Setup Data Texture
    this.__createAndUpdateDataTexture();
    this.__createAndUpdateUBO();

    const componentRepository = ComponentRepository.getInstance();
    this.__lightComponents = componentRepository.getComponentsWithType(LightComponent) as LightComponent[];

  }

  private __createAndUpdateUBO() {
    if (this.__webglResourceRepository.currentWebGLContextWrapper!.isWebGL2) {
      const glw = this.__webglResourceRepository.currentWebGLContextWrapper;
      const alignedMaxUniformBlockSize = glw!.getAlignedMaxUniformBlockSize();
      const memoryManager: MemoryManager = MemoryManager.getInstance();
      const buffer: Buffer | undefined = memoryManager.getBuffer(BufferUse.GPUInstanceData);
      if (this.__dataUBOUid === CGAPIResourceRepository.InvalidCGAPIResourceUid) {
        this.__dataUBOUid = this.__webglResourceRepository.setupUniformBufferDataArea(new Float32Array(buffer!.getArrayBuffer()));
      } else {
        this.__webglResourceRepository.updateUniformBuffer(this.__dataUBOUid, new Float32Array(buffer!.getArrayBuffer()), 0, alignedMaxUniformBlockSize);
      }
    }
  }

  attachGPUData(primitive: Primitive): void {
    const material = primitive.material!;
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();
    const dataTexture = this.__webglResourceRepository.getWebGLResource(this.__dataTextureUid)! as WebGLTexture;
    glw.bindTexture2D(0, dataTexture);
    const shaderProgram = this.__webglResourceRepository.getWebGLResource(material._shaderProgramUid);
    var uniform_dataTexture = gl.getUniformLocation(shaderProgram, 'u_dataTexture');
    gl.uniform1i(uniform_dataTexture, 0);
  }

  attachGPUDataInner(gl: WebGLRenderingContext, shaderProgram: WebGLProgram) {
    this.__webglResourceRepository.bindTexture2D(0, this.__dataTextureUid);
    var uniform_dataTexture = gl.getUniformLocation(shaderProgram, 'u_dataTexture');
    gl.uniform1i(uniform_dataTexture, 0);
  }

  attachShaderProgram(material: Material): void {
    const shaderProgramUid = material._shaderProgramUid;

    if (shaderProgramUid !== this.__lastShader) {
      const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
      const gl = glw.getRawContext();
      const shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramUid)! as WebGLProgram;
      gl.useProgram(shaderProgram);
      this.__lastShader = shaderProgramUid;
    }
  }

  attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle) {
  }

  attachVertexDataInner(mesh: Mesh, primitive: Primitive, primitiveIndex: Index, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle) {
    const vertexHandles = primitive.vertexHandles!;
    const vao = this.__webglResourceRepository.getWebGLResource(mesh.getVaoUids(primitiveIndex)) as WebGLVertexArrayObjectOES;
    const gl = glw.getRawContext();

    if (vao != null) {
      glw.bindVertexArray(vao);
    }
    else {
      this.__webglResourceRepository.setVertexDataToPipeline(vertexHandles, primitive, mesh.variationVBOUid);
      const ibo = this.__webglResourceRepository.getWebGLResource(vertexHandles.iboHandle!);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    }
  }

  static getInstance() {
    if (!this.__instance) {
      this.__instance = new (WebGLStrategyFastest)();
    }

    return this.__instance;
  }

  private __getViewport(renderPass: RenderPass) {
    let viewport = renderPass.getViewport() as Vector4;
    if (viewport == null) {
      viewport = this.__webglResourceRepository.currentWebGLContextWrapper!.viewport;
    }
    return viewport!;
  }

  private __setVRViewport(renderPass: RenderPass, displayIdx: Index) {
    const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
    const webvrSystem = rnXRModule.WebVRSystem.getInstance();
    this.__webglResourceRepository.setViewport(webvrSystem.getViewportAt(this.__getViewport(renderPass), displayIdx));
  }

  private __setCurrentComponentSIDsForEachRenderPass(renderPass: RenderPass, displayIdx: Index, isVRMainPass: boolean) {
    if (isVRMainPass) {
      const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
      const webvrSystem = rnXRModule.WebVRSystem.getInstance();
      WebGLStrategyFastest.__currentComponentSIDs!.v[WellKnownComponentTIDs.CameraComponentTID] = webvrSystem.getCameraComponentSIDAt(displayIdx);
    } else {
      let cameraComponent = renderPass.cameraComponent;
      if (cameraComponent == null) {
        cameraComponent = ComponentRepository.getInstance().getComponent(CameraComponent, CameraComponent.main) as CameraComponent;
      }
      if (cameraComponent) {
        WebGLStrategyFastest.__currentComponentSIDs!.v[WellKnownComponentTIDs.CameraComponentTID] = cameraComponent.componentSID;
      } else {
        WebGLStrategyFastest.__currentComponentSIDs!.v[WellKnownComponentTIDs.CameraComponentTID] = -1;
      }
    }
  }

  private __setCurrentComponentSIDsForEachEntity(gl: WebGLRenderingContext, renderPass: RenderPass, entity: Entity) {

    const skeletalComponent = entity.getSkeletal();
    if (skeletalComponent) {
      let index = 0;
      if (skeletalComponent.componentSID < Config.maxSkeletonNumber) {
        index = skeletalComponent.componentSID;
      }
      WebGLStrategyFastest.__currentComponentSIDs!.v[WellKnownComponentTIDs.SkeletalComponentTID] = index;
    } else {
      WebGLStrategyFastest.__currentComponentSIDs!.v[WellKnownComponentTIDs.SkeletalComponentTID] = -1;
    }
  }

  private __setCurrentComponentSIDsForEachPrimitive(gl: WebGLRenderingContext, renderPass: RenderPass, material: Material, entity: Entity) {
    WebGLStrategyFastest.__currentComponentSIDs!.v[0] = material.materialSID;
    gl.uniform1fv((WebGLStrategyFastest.__shaderProgram as any).currentComponentSIDs, WebGLStrategyFastest.__currentComponentSIDs!.v as Float32Array);
  }

  private __getDisplayNumber(isVRMainPass: boolean) {
    if (isVRMainPass) {
      return 2;
    } else {
      return 1;
    }
  }

  common_$render(meshComponentSids: Int32Array, meshComponents: MeshComponent[], viewMatrix: Matrix44, projectionMatrix: Matrix44, renderPass: RenderPass, renderPassTickCount: Count) {
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();

    const rnXRModule = ModuleManager.getInstance().getModule('xr') as RnXR;
    const isVRMainPass = rnXRModule?.WebVRSystem.getInstance().isWebVRMode && renderPass.isMainPass;

    const displayNumber = this.__getDisplayNumber(isVRMainPass);

    for (let displayIdx = 0; displayIdx < displayNumber; displayIdx++) {
      if (isVRMainPass) {
        this.__setVRViewport(renderPass, displayIdx);
      }
      this.__setCurrentComponentSIDsForEachRenderPass(renderPass, displayIdx, isVRMainPass); // update u_currentComponentSIDs(uniform)

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
        if (!(mesh?.isOriginalMesh())) {
          continue;
        }

        WebGLStrategyCommonMethod.startDepthMasking(idx, gl, renderPass);

        const entity = meshComponent.entity;
        this.__setCurrentComponentSIDsForEachEntity(gl, renderPass, entity);

        const meshRendererComponent = entity.getMeshRenderer();

        const primitiveNum = mesh.getPrimitiveNumber();
        let firstTime = false;

        for (let i = 0; i < primitiveNum; i++) {
          const primitive = mesh.getPrimitiveAt(i);
          const material: Material = renderPass.getAppropriateMaterial(primitive, primitive.material);
          if (WebGLStrategyCommonMethod.isSkipDrawing(material, idx)) {
            continue;
          }

          const shaderProgramUid = material._shaderProgramUid;

          this.attachVertexDataInner(mesh, primitive, i, glw, mesh.variationVBOUid);
          if (shaderProgramUid !== this.__lastShader) {
            const shaderProgram = this.__webglResourceRepository.getWebGLResource(shaderProgramUid)! as WebGLProgram;
            gl.useProgram(shaderProgram);

            gl.uniform1i((shaderProgram as any).dataTexture, 7);

            this.__webglResourceRepository.bindTexture2D(7, this.__dataTextureUid);

            WebGLStrategyFastest.__shaderProgram = shaderProgram;
            firstTime = true;
          }
          if (this.__lastMaterial !== material) {
            firstTime = true;
            this.__lastMaterial = material;
          }

          this.__setCurrentComponentSIDsForEachPrimitive(gl, renderPass, material, entity);

          WebGLStrategyCommonMethod.setCullAndBlendSettings(material, renderPass, gl);

          material.setParametersForGPU({
            material: material, shaderProgram: WebGLStrategyFastest.__shaderProgram, firstTime: firstTime,
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
              setUniform: false
            }
          });


          if (primitive.indicesAccessor) {
            glw.drawElementsInstanced(primitive.primitiveMode.index, primitive.indicesAccessor.elementCount, primitive.indicesAccessor.componentType.index, 0, mesh.instanceCountIncludeOriginal);
          } else {
            glw.drawArraysInstanced(primitive.primitiveMode.index, 0, primitive.getVertexCountAsVerticesBased(), mesh.instanceCountIncludeOriginal);
          }

          this.__lastShader = shaderProgramUid;
        }
      }
    }

    this.__lastRenderPassTickCount = renderPassTickCount;
    return false;
  }

  $render(idx: Index, meshComponent: MeshComponent, worldMatrix: Matrix44, normalMatrix: Matrix33, entity: Entity, renderPass: RenderPass, renderPassTickCount: Count, diffuseCube?: CubeTexture, specularCube?: CubeTexture) {
    const glw = this.__webglResourceRepository.currentWebGLContextWrapper!;
    const gl = glw.getRawContext();
    WebGLStrategyCommonMethod.endDepthMasking(idx, gl, renderPass);
  }

}
