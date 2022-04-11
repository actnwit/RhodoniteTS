import {Accessor} from '../foundation/memory/Accessor';
import {CGAPIResourceRepository} from '../foundation/renderer/CGAPIResourceRepository';
import {Primitive} from '../foundation/geometry/Primitive';
import {
  VertexAttributeEnum,
  VertexAttribute,
} from '../foundation/definitions/VertexAttribute';
import {
  TextureParameterEnum,
  TextureParameter,
} from '../foundation/definitions/TextureParameter';
import {
  PixelFormatEnum,
  PixelFormat,
} from '../foundation/definitions/PixelFormat';
import {ComponentTypeEnum} from '../foundation/definitions/ComponentType';
import {CompositionType} from '../foundation/definitions/CompositionType';
import {ComponentType} from '../foundation/definitions/ComponentType';
import {WebGLContextWrapper} from './WebGLContextWrapper';
import {MathUtil} from '../foundation/math/MathUtil';
import {
  ShaderSemanticsInfo,
  ShaderSemantics,
} from '../foundation/definitions/ShaderSemantics';
import {AbstractTexture} from '../foundation/textures/AbstractTexture';
import {RenderTargetTexture} from '../foundation/textures/RenderTargetTexture';
import {IRenderable} from '../foundation/textures/IRenderable';
import {FrameBuffer} from '../foundation/renderer/FrameBuffer';
import {HdriFormatEnum, HdriFormat} from '../foundation/definitions/HdriFormat';
import {Vector4} from '../foundation/math/Vector4';
import {RenderBufferTarget} from '../foundation/definitions/RenderBufferTarget';
import {RenderPass} from '../foundation/renderer/RenderPass';
import {MiscUtil} from '../foundation/misc/MiscUtil';
import {
  WebGLResourceHandle,
  TypedArray,
  Index,
  Size,
  Count,
  CGAPIResourceHandle,
  Byte,
  ArrayType,
} from '../types/CommonTypes';
import {DataUtil} from '../foundation/misc/DataUtil';
import {RenderBuffer} from '../foundation/textures/RenderBuffer';
import {BasisFile} from '../types/BasisTexture';
import {
  BasisCompressionTypeEnum,
  BasisCompressionType,
} from '../foundation/definitions/BasisCompressionType';
import {WebGLExtension} from './WebGLExtension';
import {RnWebGLProgram, RnWebGLTexture} from './WebGLExtendedTypes';
import {Is} from '../foundation/misc/Is';
import {CompressionTextureTypeEnum} from '../foundation/definitions/CompressionTextureType';
import {Material} from '../foundation/materials/core/Material';
import {System} from '../foundation/system/System';
import getRenderingStrategy from './getRenderingStrategy';
import {Config} from '../foundation/core/Config';
import {GL_TEXTURE_2D} from '../types/WebGLConstants';
import { AttributeNames } from './types';

declare let HDRImage: any;

export type VertexHandles = {
  vaoHandle: CGAPIResourceHandle;
  iboHandle?: CGAPIResourceHandle;
  vboHandles: Array<CGAPIResourceHandle>;
  attributesFlags: Array<boolean>;
  setComplete: boolean;
};

type DirectTextureData =
  | TypedArray
  | HTMLImageElement
  | HTMLVideoElement
  | HTMLCanvasElement;

export type TextureData = {
  level: Count;
  width: Count;
  height: Count;
  buffer: ArrayBufferView;
};

export type WebGLResource =
  | WebGLBuffer
  | WebGLFramebuffer
  | WebGLObject
  | WebGLProgram
  | WebGLRenderbuffer
  | WebGLTexture
  | WebGLTransformFeedback;

export class WebGLResourceRepository extends CGAPIResourceRepository {
  private static __instance: WebGLResourceRepository;
  private __webglContexts: Map<string, WebGLContextWrapper> = new Map();
  private __glw?: WebGLContextWrapper;
  private __resourceCounter: number =
    CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __webglResources: Map<WebGLResourceHandle, WebGLResource> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): WebGLResourceRepository {
    if (!this.__instance) {
      this.__instance = new WebGLResourceRepository();
    }
    return this.__instance;
  }

  addWebGLContext(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    canvas: HTMLCanvasElement,
    asCurrent: boolean,
    isDebug: boolean
  ) {
    const glw = new WebGLContextWrapper(gl, canvas, isDebug);
    this.__webglContexts.set('default', glw);
    if (asCurrent) {
      this.__glw = glw;
    }
  }

  generateWebGLContext(
    canvas: HTMLCanvasElement,
    version: number,
    asCurrent: boolean,
    isDebug: boolean,
    webglOption?: WebGLContextAttributes,
    fallback = true
  ) {
    let gl: WebGL2RenderingContext | WebGLRenderingContext;
    if (version === 2) {
      gl = canvas.getContext('webgl2', webglOption) as WebGL2RenderingContext;
      if (fallback && Is.not.exist(gl)) {
        gl = canvas.getContext('webgl', webglOption) as WebGLRenderingContext;
        console.warn('WebGL2 Not Supported. Fallback to WebGL1.');
        return gl;
      }
    } else {
      gl = canvas.getContext('webgl', webglOption) as WebGLRenderingContext;
    }
    this.addWebGLContext(gl, canvas, asCurrent, isDebug);

    if (MiscUtil.isSafari()) {
      Config.isUboEnabled = false;
    }

    return gl;
  }

  get currentWebGLContextWrapper() {
    return this.__glw;
  }

  private getResourceNumber(): WebGLResourceHandle {
    return ++this.__resourceCounter;
  }

  private __registerResource(obj: WebGLResource) {
    const handle = this.getResourceNumber();
    (obj as any)._resourceUid = handle;
    this.__webglResources.set(handle, obj);
    return handle;
  }

  getWebGLResource(
    WebGLResourceHandle: WebGLResourceHandle
  ): WebGLResource | null {
    const result = this.__webglResources.get(WebGLResourceHandle);
    return result ?? null;
  }

  createIndexBuffer(accessor: Accessor) {
    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    this.__glw!.bindVertexArray(null);
    const ibo = gl.createBuffer();
    const resourceHandle = this.__registerResource(ibo!);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    //    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, accessor.bufferView.buffer.getArrayBuffer(), gl.STATIC_DRAW);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      accessor.getTypedArray(),
      gl.STATIC_DRAW
    );
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return resourceHandle;
  }

  updateIndexBuffer(accessor: Accessor, resourceHandle: number) {
    const glw = this.__glw as WebGLContextWrapper;
    const gl = glw?.getRawContext() as
      | WebGLRenderingContext
      | WebGL2RenderingContext;
    if (Is.not.exist(gl)) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    const ibo = this.__webglResources.get(resourceHandle) as WebGLBuffer;
    if (Is.not.exist(ibo)) {
      throw new Error('Not found VBO.');
    }

    glw.bindVertexArray(null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, accessor.getTypedArray());
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  createVertexBuffer(accessor: Accessor) {
    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    this.__glw!.bindVertexArray(null);
    const vbo = gl.createBuffer();
    const resourceHandle = this.__registerResource(vbo!);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      accessor.bufferView.getUint8Array(),
      gl.STATIC_DRAW
    );
    //    gl.bufferData(gl.ARRAY_BUFFER, accessor.getTypedArray(), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return resourceHandle;
  }

  createVertexBufferFromTypedArray(typedArray: TypedArray) {
    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    this.__glw!.bindVertexArray(null);
    const vbo = gl.createBuffer();
    const resourceHandle = this.__registerResource(vbo!);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, typedArray, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return resourceHandle;
  }

  updateVertexBuffer(accessor: Accessor, resourceHandle: number) {
    const glw = this.__glw as WebGLContextWrapper;
    const gl = glw?.getRawContext() as
      | WebGLRenderingContext
      | WebGL2RenderingContext;
    if (!Is.exist(gl)) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    const vbo = this.__webglResources.get(resourceHandle) as WebGLBuffer;
    if (!Is.exist(vbo)) {
      throw new Error('Not found VBO.');
    }

    glw.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, accessor.bufferView.getUint8Array());
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  createVertexArray() {
    const gl = this.__glw;

    if (gl == null) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    const vao = this.__glw!.createVertexArray();
    if (Is.not.exist(vao)) {
      return undefined;
    }

    const resourceHandle = this.__registerResource(vao);

    return resourceHandle;
  }

  /**
   * bind the Texture2D
   * @param textureSlotIndex
   * @param textureUid
   */
  bindTexture2D(textureSlotIndex: Index, textureUid: CGAPIResourceHandle) {
    const texture = this.getWebGLResource(textureUid) as WebGLTexture;
    this.__glw!.bindTexture2D(textureSlotIndex, texture);
  }

  /**
   * bind the TextureCube
   * @param textureSlotIndex
   * @param textureUid
   */
  bindTextureCube(textureSlotIndex: Index, textureUid: CGAPIResourceHandle) {
    const texture = this.getWebGLResource(textureUid) as WebGLTexture;
    this.__glw!.bindTextureCube(textureSlotIndex, texture);
  }

  /**
   * create a VertexBuffer and IndexBuffer
   * @param primitive
   * @returns
   */
  createVertexBufferAndIndexBuffer(primitive: Primitive): VertexHandles {
    let iboHandle;
    if (primitive.hasIndices()) {
      iboHandle = this.createIndexBuffer(primitive.indicesAccessor!);
    }

    const attributesFlags: boolean[] = [];
    for (let i = 0; i < VertexAttribute.AttributeTypeNumber; i++) {
      attributesFlags[i] = false;
    }
    const vboHandles: Array<WebGLResourceHandle> = [];
    primitive.attributeAccessors.forEach((accessor: Accessor, i: number) => {
      const vboHandle = this.createVertexBuffer(accessor);
      const slotIdx = VertexAttribute.toAttributeSlotFromJoinedString(
        primitive.attributeSemantics[i]
      );
      attributesFlags[slotIdx] = true;
      vboHandles.push(vboHandle);
    });

    return {
      vaoHandle: -1,
      iboHandle: iboHandle,
      vboHandles: vboHandles,
      attributesFlags: attributesFlags,
      setComplete: false,
    };
  }

  /**
   * update the VertexBuffer and IndexBuffer
   * @param primitive
   * @param vertexHandles
   */
  updateVertexBufferAndIndexBuffer(
    primitive: Primitive,
    vertexHandles: VertexHandles
  ) {
    if (vertexHandles.iboHandle) {
      this.updateIndexBuffer(
        primitive.indicesAccessor as Accessor,
        vertexHandles.iboHandle
      );
    }

    const attributeAccessors = primitive.attributeAccessors;
    for (let i = 0; i < attributeAccessors.length; i++) {
      this.updateVertexBuffer(
        attributeAccessors[i],
        vertexHandles.vboHandles[i]
      );
    }
  }

  /**
   * create a shader program
   * @param param0
   * @returns
   */
  createShaderProgram({
    material,
    vertexShaderStr,
    fragmentShaderStr,
    attributeNames,
    attributeSemantics,
  }: {
    material: Material;
    vertexShaderStr: string;
    fragmentShaderStr: string;
    attributeNames: AttributeNames;
    attributeSemantics: Array<VertexAttributeEnum>;
  }) {
    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }
    const isDebugMode = this.__glw!.isDebugMode;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderStr);
    gl.compileShader(vertexShader);
    if (isDebugMode) {
      this.__checkShaderCompileStatus(
        material.materialTypeName,
        vertexShader,
        vertexShaderStr
      );
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderStr);
    gl.compileShader(fragmentShader);
    if (isDebugMode) {
      this.__checkShaderCompileStatus(
        material.materialTypeName,
        fragmentShader,
        fragmentShaderStr
      );
    }

    const shaderProgram = gl.createProgram()! as RnWebGLProgram;
    shaderProgram._gl = gl;
    shaderProgram._materialTypeName = material.materialTypeName;
    shaderProgram._vertexShaderStr = vertexShaderStr;
    shaderProgram._fragmentShaderStr = fragmentShaderStr;
    shaderProgram._shaderSemanticsInfoMap = new Map();
    shaderProgram._material = material;

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);

    attributeNames.forEach((attributeName: string, i: number) => {
      gl.bindAttribLocation(
        shaderProgram,
        attributeSemantics[i].getAttributeSlot(),
        attributeName
      );
    });

    gl.linkProgram(shaderProgram);
    shaderProgram.__SPECTOR_rebuildProgram =
      this.rebuildProgram.bind(shaderProgram);

    if (isDebugMode) {
      this.__checkShaderProgramLinkStatus(
        material.materialTypeName,
        shaderProgram,
        vertexShaderStr,
        fragmentShaderStr
      );
    }

    const resourceHandle = this.__registerResource(shaderProgram);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return resourceHandle;
  }

  private __checkShaderCompileStatus(
    materialTypeName: string,
    shader: WebGLShader,
    shaderText: string
  ) {
    const glw = this.__glw!;
    const gl = glw!.getRawContext();
    if (
      Is.false(gl.getShaderParameter(shader, gl.COMPILE_STATUS)) &&
      Is.false(gl.isContextLost())
    ) {
      console.log('MaterialTypeName: ' + materialTypeName);
      console.log(MiscUtil.addLineNumberToCode(shaderText));
      throw new Error(
        'An error occurred compiling the shaders:' + gl.getShaderInfoLog(shader)
      );
    }
  }

  private __checkShaderProgramLinkStatus(
    materialTypeName: string,
    shaderProgram: WebGLProgram,
    vertexShaderText: string,
    fragmentShaderText: string
  ) {
    const glw = this.__glw!;
    const gl = glw!.getRawContext();

    // If creating the shader program failed, alert
    if (
      Is.false(gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) &&
      Is.false(gl.isContextLost())
    ) {
      console.log('MaterialTypeName: ' + materialTypeName);
      console.log(MiscUtil.addLineNumberToCode('Vertex Shader:'));
      console.log(MiscUtil.addLineNumberToCode(vertexShaderText));
      console.log(MiscUtil.addLineNumberToCode('Fragment Shader:'));
      console.log(MiscUtil.addLineNumberToCode(fragmentShaderText));
      throw new Error(
        'Unable to initialize the shader program: ' +
          gl.getProgramInfoLog(shaderProgram)
      );
    }
  }

  /**
   * setup the uniform locations
   * @param shaderProgramUid
   * @param infoArray
   * @param isUniformOnlyMode
   * @returns
   */
  setupUniformLocations(
    shaderProgramUid: WebGLResourceHandle,
    infoArray: ShaderSemanticsInfo[],
    isUniformOnlyMode: boolean
  ): WebGLProgram {
    const glw = this.__glw!;
    const gl = glw.getRawContext();
    const shaderProgram = this.getWebGLResource(
      shaderProgramUid
    ) as RnWebGLProgram;

    const infoArrayLen = infoArray.length;
    for (let i = 0; i < infoArrayLen; i++) {
      const info = infoArray[i];
      shaderProgram._shaderSemanticsInfoMap.set(info.semantic.str, info);
    }

    for (let i = 0; i < infoArrayLen; i++) {
      const info = infoArray[i];
      const isUniformExist =
        isUniformOnlyMode ||
        info.needUniformInFastest ||
        CompositionType.isTexture(info.compositionType);

      if (isUniformExist) {
        const semanticSingular = info.semantic.str;

        const identifier = semanticSingular;

        let shaderVarName = ShaderSemantics.fullSemanticStr(info);
        if (info.index != null) {
          if (shaderVarName.match(/\[.+?\]/)) {
            shaderVarName = shaderVarName.replace(
              /\[.+?\]/g,
              `[${info.index}]`
            );
          } else {
            shaderVarName += `[${info.index}]`;
          }
        }

        if (info.none_u_prefix !== true) {
          shaderVarName = 'u_' + shaderVarName;
        }

        const location = gl.getUniformLocation(shaderProgram, shaderVarName);
        const _shaderProgram = shaderProgram as any;
        if (info.index != null) {
          if (_shaderProgram[identifier] == null) {
            _shaderProgram[identifier] = [];
          }
          _shaderProgram[identifier][info.index] = location;
        } else {
          _shaderProgram[identifier] = location;
        }
        if (location == null && glw.isDebugMode) {
          console.warn(
            `Rn: Can not get the uniform location: ${shaderVarName}`
          );
        }
      }
    }

    return shaderProgram;
  }

  setupBasicUniformLocations(shaderProgramUid: WebGLResourceHandle) {
    const shaderProgram = this.getWebGLResource(
      shaderProgramUid
    ) as RnWebGLProgram;
    const gl = this.currentWebGLContextWrapper!.getRawContext();
    (shaderProgram as any).dataTexture = gl.getUniformLocation(
      shaderProgram,
      'u_dataTexture'
    );
    (shaderProgram as any).currentComponentSIDs = gl.getUniformLocation(
      shaderProgram,
      'u_currentComponentSIDs'
    );
  }

  /**
   * set an uniform value
   */
  setUniformValue(
    shaderProgram_: WebGLProgram,
    semanticStr: string,
    firstTime: boolean,
    value: any,
    index?: Index
  ) {
    const shaderProgram = shaderProgram_ as RnWebGLProgram;
    const info = shaderProgram._shaderSemanticsInfoMap.get(semanticStr);
    if (Is.not.exist(info)) {
      return false;
    }

    let setAsMatrix = false;
    let componentNumber = 0;
    if (info.compositionType === CompositionType.Mat3) {
      setAsMatrix = true;
      componentNumber = 3;
    } else if (info.compositionType === CompositionType.Mat4) {
      setAsMatrix = true;
      componentNumber = 4;
    } else {
      componentNumber = info.compositionType!.getNumberOfComponents();
    }

    const isCompositionTypeArray =
      info.compositionType === CompositionType.ScalarArray ||
      info.compositionType === CompositionType.Vec4Array ||
      info.compositionType === CompositionType.Vec3Array ||
      info.compositionType === CompositionType.Vec2Array;
    const isCompositionTypeTexture =
      info.compositionType === CompositionType.Texture2D ||
      info.compositionType === CompositionType.TextureCube;
    const key = semanticStr;

    let updated = false;
    if (isCompositionTypeTexture) {
      updated = this.setUniformValueInner(
        shaderProgram_,
        key,
        info,
        setAsMatrix,
        componentNumber,
        false,
        {x: value[0]},
        index
      );
      this.bindTexture(info, value);
    } else if (Is.not.exist(index) && isCompositionTypeArray) {
      if (value._v == null) {
        updated = this.setUniformValueInner(
          shaderProgram_,
          key,
          info,
          setAsMatrix,
          componentNumber,
          true,
          {x: value},
          index
        );
      } else {
        updated = this.setUniformValueInner(
          shaderProgram_,
          key,
          info,
          setAsMatrix,
          componentNumber,
          true,
          {x: value._v},
          index
        );
      }
    } else if (info.compositionType === CompositionType.Scalar) {
      if (value._v == null) {
        updated = this.setUniformValueInner(
          shaderProgram_,
          key,
          info,
          setAsMatrix,
          componentNumber,
          false,
          {x: value},
          index
        );
      } else {
        updated = this.setUniformValueInner(
          shaderProgram_,
          key,
          info,
          setAsMatrix,
          componentNumber,
          true,
          {x: value._v},
          index
        );
      }
    } else {
      // if CompositionType.Vec*|Mat*, then...
      if (value._v == null) {
        updated = this.setUniformValueInner(
          shaderProgram_,
          key,
          info,
          setAsMatrix,
          componentNumber,
          false,
          value,
          index
        );
      } else {
        updated = this.setUniformValueInner(
          shaderProgram_,
          key,
          info,
          setAsMatrix,
          componentNumber,
          true,
          {x: value._v},
          index
        );
      }
    }

    return updated;
  }

  /**
   * bind the texture
   * @param info
   * @param value
   */
  bindTexture(info: ShaderSemanticsInfo, value: any) {
    if (info.compositionType === CompositionType.Texture2D) {
      this.bindTexture2D(
        value[0],
        value[1] instanceof AbstractTexture
          ? value[1].cgApiResourceUid
          : value[1]
      );
    } else if (info.compositionType === CompositionType.TextureCube) {
      this.bindTextureCube(
        value[0],
        value[1] instanceof AbstractTexture
          ? value[1].cgApiResourceUid
          : value[1]
      );
    }
  }

  /**
   * set the uniform value
   * @param shaderProgram
   * @param semanticStr
   * @param info
   * @param isMatrix
   * @param componentNumber
   * @param isVector
   * @param param6
   * @param index
   * @returns
   */
  setUniformValueInner(
    shaderProgram: WebGLProgram,
    semanticStr: string,
    info: ShaderSemanticsInfo,
    isMatrix: boolean,
    componentNumber: number,
    isVector: boolean,
    {
      x,
      y,
      z,
      w,
    }: {
      x: number | ArrayType | boolean;
      y?: number | boolean;
      z?: number | boolean;
      w?: number | boolean;
    },
    index?: Count
  ) {
    const identifier = semanticStr;
    let loc: WebGLUniformLocation;
    if (index != null) {
      loc = (shaderProgram as any)[identifier][index];
    } else {
      loc = (shaderProgram as any)[identifier];
    }
    if (loc == null) {
      return false;
    }
    const uLocation: WebGLUniformLocation = loc;

    const gl = this.__glw!.getRawContext() as any;

    if (isMatrix) {
      if (componentNumber === 4) {
        gl.uniformMatrix4fv(uLocation, false, x);
      } else {
        gl.uniformMatrix3fv(uLocation, false, x);
      }
    } else if (isVector) {
      const componentType =
        info.componentType === ComponentType.Int ||
        info.componentType === ComponentType.Short ||
        info.componentType === ComponentType.Byte;
      if (componentNumber === 1) {
        if (componentType) {
          gl.uniform1iv(uLocation, x);
        } else {
          gl.uniform1fv(uLocation, x);
        }
      } else if (componentNumber === 2) {
        if (componentType) {
          gl.uniform2iv(uLocation, x);
        } else {
          gl.uniform2fv(uLocation, x);
        }
      } else if (componentNumber === 3) {
        if (componentType) {
          gl.uniform3iv(uLocation, x);
        } else {
          gl.uniform3fv(uLocation, x);
        }
      } else if (componentNumber === 4) {
        if (componentType) {
          gl.uniform4iv(uLocation, x);
        } else {
          gl.uniform4fv(uLocation, x);
        }
      }
    } else {
      const componentType =
        info.componentType === ComponentType.Int ||
        info.componentType === ComponentType.Short ||
        info.componentType === ComponentType.Byte;
      if (componentNumber === 1) {
        if (componentType) {
          gl.uniform1i(uLocation, x);
        } else {
          gl.uniform1f(uLocation, x);
        }
      } else if (componentNumber === 2) {
        if (componentType) {
          gl.uniform2i(uLocation, x, y);
        } else {
          gl.uniform2f(uLocation, x, y);
        }
      } else if (componentNumber === 3) {
        if (componentType) {
          gl.uniform3i(uLocation, x, y, z);
        } else {
          gl.uniform3f(uLocation, x, y, z);
        }
      } else if (componentNumber === 4) {
        if (componentType) {
          gl.uniform4i(uLocation, x, y, z, w);
        } else {
          gl.uniform4f(uLocation, x, y, z, w);
        }
      }
    }

    return true;
  }

  /**
   * set the VertexData to the Pipeline
   */
  setVertexDataToPipeline(
    {
      vaoHandle,
      iboHandle,
      vboHandles,
    }: {
      vaoHandle: WebGLResourceHandle;
      iboHandle?: WebGLResourceHandle;
      vboHandles: Array<WebGLResourceHandle>;
    },
    primitive: Primitive,
    instanceIDBufferUid: WebGLResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid
  ) {
    const gl = this.__glw!.getRawContext();

    const vao = this.getWebGLResource(vaoHandle) as WebGLVertexArrayObjectOES;

    // VAO bind
    this.__glw!.bindVertexArray(vao!);

    // IBO bind
    if (iboHandle != null) {
      const ibo = this.getWebGLResource(iboHandle) as WebGLBuffer;
      if (ibo != null) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      } else {
        throw new Error('Nothing Element Array Buffer!');
      }
    }

    // bind vertex attributes to VBO's
    vboHandles.forEach((vboHandle, i) => {
      const vbo = this.getWebGLResource(vboHandle) as WebGLBuffer;
      if (vbo != null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      } else {
        throw new Error('Nothing Element Array Buffer at index ' + i);
      }
      gl.enableVertexAttribArray(
        VertexAttribute.toAttributeSlotFromJoinedString(
          primitive.attributeSemantics[i]
        )
      );
      gl.vertexAttribPointer(
        VertexAttribute.toAttributeSlotFromJoinedString(
          primitive.attributeSemantics[i]
        ),
        primitive.attributeCompositionTypes[i].getNumberOfComponents(),
        primitive.attributeComponentTypes[i].index,
        primitive.attributeAccessors[i].normalized,
        primitive.attributeAccessors[i].byteStride,
        primitive.attributeAccessors[i].byteOffsetInBufferView
      );
    });

    /// for InstanceIDBuffer
    if (
      instanceIDBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid
    ) {
      const instanceIDBuffer = this.getWebGLResource(
        instanceIDBufferUid
      ) as WebGLBuffer;
      if (instanceIDBuffer != null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceIDBuffer);
      } else {
        throw new Error('Nothing Element Array Buffer at index');
      }
      gl.enableVertexAttribArray(VertexAttribute.Instance.getAttributeSlot());
      gl.vertexAttribPointer(
        VertexAttribute.Instance.getAttributeSlot(),
        CompositionType.Scalar.getNumberOfComponents(),
        ComponentType.Float.index,
        false,
        0,
        0
      );
      this.__glw!.vertexAttribDivisor(
        VertexAttribute.Instance.getAttributeSlot(),
        1
      );
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.__glw!.bindVertexArray(null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  /**
   * create a TexStorage2D
   * @param data
   * @param param1
   * @returns
   */
  createTexStorage2D({
    levels,
    internalFormat,
    width,
    height,
  }: {
    levels: Index;
    internalFormat: TextureParameterEnum | PixelFormatEnum;
    width: Size;
    height: Size;
  }): WebGLResourceHandle {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const texture = gl.createTexture();
    this.__glw!.bindTexture2D(0, texture!);
    gl.texStorage2D(GL_TEXTURE_2D, levels, internalFormat.index, width, height);
    const resourceHandle = this.__registerResource(texture!);
    this.__glw!.unbindTexture2D(0);

    return resourceHandle;
  }

  /**
   * create a TexStorage2D
   * @param data
   * @param param1
   * @returns
   */
  createTexStorage2DWithSamplerParameters({
    levels,
    internalFormat,
    width,
    height,
    magFilter,
    minFilter,
    wrapS,
    wrapT,
    anisotropy,
    isPremultipliedAlpha,
  }: {
    levels: Index;
    internalFormat: TextureParameterEnum | PixelFormatEnum;
    width: Size;
    height: Size;
    magFilter: TextureParameterEnum;
    minFilter: TextureParameterEnum;
    wrapS: TextureParameterEnum;
    wrapT: TextureParameterEnum;
    anisotropy: boolean;
    isPremultipliedAlpha?: boolean;
  }): WebGLResourceHandle {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const texture = gl.createTexture();
    this.__glw!.bindTexture2D(0, texture!);
    gl.texStorage2D(GL_TEXTURE_2D, levels, internalFormat.index, width, height);
    const resourceHandle = this.__registerResource(texture!);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter.index);
    if (MathUtil.isPowerOfTwoTexture(width, height)) {
      if (anisotropy) {
        if (this.__glw!.webgl2ExtTFA) {
          gl.texParameteri(
            gl.TEXTURE_2D,
            this.__glw!.webgl2ExtTFA!.TEXTURE_MAX_ANISOTROPY_EXT,
            4
          );
        } else if (this.__glw!.webgl1ExtTFA) {
          gl.texParameteri(
            gl.TEXTURE_2D,
            this.__glw!.webgl1ExtTFA!.TEXTURE_MAX_ANISOTROPY_EXT,
            4
          );
        }
      } else if (this.__glw!.webgl1ExtTFA) {
        gl.texParameteri(
          gl.TEXTURE_2D,
          this.__glw!.webgl1ExtTFA!.TEXTURE_MAX_ANISOTROPY_EXT,
          1
        );
      }
    }
    this.__glw!.unbindTexture2D(0);

    return resourceHandle;
  }

  createTextureSampler({
    magFilter,
    minFilter,
    wrapS,
    wrapT,
    anisotropy,
    isPremultipliedAlpha,
  }: {
    magFilter: TextureParameterEnum;
    minFilter: TextureParameterEnum;
    wrapS: TextureParameterEnum;
    wrapT: TextureParameterEnum;
    anisotropy: boolean;
    isPremultipliedAlpha?: boolean;
  }) {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const sampler = gl.createSampler()!;
    const resourceHandle = this.__registerResource(sampler);
    gl.samplerParameteri(sampler, gl.TEXTURE_MIN_FILTER, minFilter.index);
    gl.samplerParameteri(sampler, gl.TEXTURE_MAG_FILTER, magFilter.index);
    gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_S, wrapS.index);
    gl.samplerParameteri(sampler, gl.TEXTURE_WRAP_T, wrapT.index);
    if (anisotropy) {
      if (this.__glw!.webgl2ExtTFA) {
        gl.samplerParameteri(
          sampler,
          this.__glw!.webgl2ExtTFA!.TEXTURE_MAX_ANISOTROPY_EXT,
          4
        );
      } else if (this.__glw!.webgl1ExtTFA) {
        gl.samplerParameteri(
          sampler,
          this.__glw!.webgl1ExtTFA!.TEXTURE_MAX_ANISOTROPY_EXT,
          4
        );
      }
    }

    return resourceHandle;
  }
  /**
   * create a Texture
   * @param data
   * @param param1
   * @returns
   */
  createTexture(
    data: DirectTextureData,
    {
      level,
      internalFormat,
      width,
      height,
      border,
      format,
      type,
      magFilter,
      minFilter,
      wrapS,
      wrapT,
      generateMipmap,
      anisotropy,
      isPremultipliedAlpha,
    }: {
      level: Index;
      internalFormat: TextureParameterEnum;
      width: Size;
      height: Size;
      border: Size;
      format: PixelFormatEnum;
      type: ComponentTypeEnum;
      magFilter: TextureParameterEnum;
      minFilter: TextureParameterEnum;
      wrapS: TextureParameterEnum;
      wrapT: TextureParameterEnum;
      generateMipmap: boolean;
      anisotropy: boolean;
      isPremultipliedAlpha: boolean;
    }
  ): WebGLResourceHandle {
    const isWebGL2 = this.__glw!.isWebGL2;
    const gl = this.__glw!.getRawContext();

    const texture = gl.createTexture() as RnWebGLTexture;
    const resourceHandle = this.__registerResource(texture);

    this.__glw!.bindTexture2D(0, texture);
    if (isPremultipliedAlpha) {
      // gl.texParameteri(gl.TEXTURE_2D, gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    } else {
      // gl.texParameteri(gl.TEXTURE_2D, gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    }

    if (
      data instanceof HTMLImageElement ||
      data instanceof HTMLCanvasElement ||
      data instanceof HTMLVideoElement
    ) {
      if (isWebGL2) {
        const gl = this.__glw!.getRawContextAsWebGL2();
        // const levels = Math.max(Math.log2(width), Math.log2(height));
        const levels = generateMipmap
          ? Math.max(Math.log2(width), Math.log2(height))
          : 1;
        gl.texStorage2D(
          GL_TEXTURE_2D,
          levels,
          internalFormat.index,
          width,
          height
        );
        gl.texSubImage2D(
          gl.TEXTURE_2D,
          0,
          0,
          0,
          format.index,
          type.index,
          data
        );
      } else {
        gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          TextureParameter.migrateToWebGL1InternalFormat(internalFormat).index,
          format.index,
          type.index,
          data
        );
      }
    } else {
      if (isWebGL2) {
        const gl = this.__glw!.getRawContextAsWebGL2();
        // const levels = Math.max(Math.log2(width), Math.log2(height));
        const levels = generateMipmap
          ? Math.max(Math.log2(width), Math.log2(height))
          : 1;
        gl.texStorage2D(
          GL_TEXTURE_2D,
          levels,
          internalFormat.index,
          width,
          height
        );
        gl.texSubImage2D(
          gl.TEXTURE_2D,
          0,
          0,
          0,
          width,
          height,
          format.index,
          type.index,
          data as any as ArrayBufferView
        );
      } else {
        gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          TextureParameter.migrateToWebGL1InternalFormat(internalFormat).index,
          width,
          height,
          border,
          format.index,
          type.index,
          data
        );
      }
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter.index);
    if (MathUtil.isPowerOfTwoTexture(width, height)) {
      if (anisotropy) {
        if (this.__glw!.webgl2ExtTFA) {
          gl.texParameteri(
            gl.TEXTURE_2D,
            this.__glw!.webgl2ExtTFA!.TEXTURE_MAX_ANISOTROPY_EXT,
            4
          );
        } else if (this.__glw!.webgl1ExtTFA) {
          gl.texParameteri(
            gl.TEXTURE_2D,
            this.__glw!.webgl1ExtTFA!.TEXTURE_MAX_ANISOTROPY_EXT,
            4
          );
        }
      } else if (this.__glw!.webgl1ExtTFA) {
        gl.texParameteri(
          gl.TEXTURE_2D,
          this.__glw!.webgl1ExtTFA!.TEXTURE_MAX_ANISOTROPY_EXT,
          1
        );
      }

      const isGenerateMipmap = generateMipmap && height !== 1 && width !== 1;
      if (isGenerateMipmap) {
        gl.generateMipmap(gl.TEXTURE_2D);
      }
    }
    this.__glw!.unbindTexture2D(0);

    return resourceHandle;
  }

  /**
   * Create and bind compressed texture object
   * @param textureDataArray transcoded texture data for each mipmaps(levels)
   * @param compressionTextureType
   */
  createCompressedTexture(
    textureDataArray: TextureData[],
    compressionTextureType: CompressionTextureTypeEnum,
    {
      magFilter,
      minFilter,
      wrapS,
      wrapT,
      anisotropy,
    }: {
      magFilter: TextureParameterEnum;
      minFilter: TextureParameterEnum;
      wrapS: TextureParameterEnum;
      wrapT: TextureParameterEnum;
      anisotropy: boolean;
    }
  ): WebGLResourceHandle {
    const gl = this.__glw!.getRawContext();

    const texture = gl.createTexture() as RnWebGLTexture;
    const resourceHandle = this.__registerResource(texture);

    this.__glw!.bindTexture2D(0, texture);

    const internalFormat = compressionTextureType.index;

    for (const textureData of textureDataArray) {
      gl.compressedTexImage2D(
        gl.TEXTURE_2D,
        textureData.level,
        internalFormat,
        textureData.width,
        textureData.height,
        0,
        textureData.buffer
      );
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT.index);

    if (minFilter === TextureParameter.LinearMipmapLinear) {
      minFilter = TextureParameter.Linear;
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter.index);

    const width = textureDataArray[0].width;
    const height = textureDataArray[0].height;
    if (MathUtil.isPowerOfTwoTexture(width, height)) {
      if (anisotropy) {
        if (this.__glw!.webgl2ExtTFA) {
          gl.texParameteri(
            gl.TEXTURE_2D,
            this.__glw!.webgl2ExtTFA!.TEXTURE_MAX_ANISOTROPY_EXT,
            4
          );
        } else if (this.__glw!.webgl1ExtTFA) {
          gl.texParameteri(
            gl.TEXTURE_2D,
            this.__glw!.webgl1ExtTFA!.TEXTURE_MAX_ANISOTROPY_EXT,
            4
          );
        }
      } else if (this.__glw!.webgl1ExtTFA) {
        gl.texParameteri(
          gl.TEXTURE_2D,
          this.__glw!.webgl1ExtTFA!.TEXTURE_MAX_ANISOTROPY_EXT,
          1
        );
      }
    }

    this.__glw!.unbindTexture2D(0);

    return resourceHandle;
  }

  /**
   * create CompressedTextureFromBasis
   * @param basisFile
   * @param param1
   * @returns
   */
  createCompressedTextureFromBasis(
    basisFile: BasisFile,
    {
      border,
      format,
      type,
      magFilter,
      minFilter,
      wrapS,
      wrapT,
      anisotropy,
      isPremultipliedAlpha,
    }: {
      border: Size;
      format: PixelFormatEnum;
      type: ComponentTypeEnum;
      magFilter: TextureParameterEnum;
      minFilter: TextureParameterEnum;
      wrapS: TextureParameterEnum;
      wrapT: TextureParameterEnum;
      anisotropy: boolean;
      isPremultipliedAlpha: boolean;
    }
  ): WebGLResourceHandle {
    let basisCompressionType: BasisCompressionTypeEnum;
    let compressionType: Index;

    const gl = this.__glw!.getRawContext();
    const texture = gl.createTexture() as RnWebGLTexture;
    const resourceHandle = this.__registerResource(texture);

    gl.bindTexture(gl.TEXTURE_2D, texture);

    const s3tc = gl.getExtension('WEBGL_compressed_texture_s3tc');
    if (s3tc) {
      basisCompressionType = BasisCompressionType.BC3;
      compressionType = s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT;
    }
    const etc1 = gl.getExtension('WEBGL_compressed_texture_etc1');
    if (etc1) {
      basisCompressionType = BasisCompressionType.ETC1;
      compressionType = etc1.COMPRESSED_RGB_ETC1_WEBGL;
    }
    const atc = gl.getExtension('WEBGL_compressed_texture_atc');
    if (atc) {
      basisCompressionType = BasisCompressionType.ATC_RGBA;
      compressionType = atc.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL;
    }
    const etc2 = gl.getExtension('WEBGL_compressed_texture_etc');
    if (etc2) {
      basisCompressionType = BasisCompressionType.ETC2;
      compressionType = etc2.COMPRESSED_RGBA8_ETC2_EAC;
    }
    const pvrtc =
      gl.getExtension('WEBGL_compressed_texture_pvrtc') ||
      gl.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc');
    if (pvrtc) {
      basisCompressionType = BasisCompressionType.PVRTC1_RGBA;
      compressionType = pvrtc.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
    }
    const astc = gl.getExtension('WEBGL_compressed_texture_astc');
    if (astc) {
      basisCompressionType = BasisCompressionType.ASTC;
      compressionType = astc.COMPRESSED_RGBA_ASTC_4x4_KHR;
    }
    const mipmapDepth = basisFile.getNumLevels(0);

    if (isPremultipliedAlpha) {
      // gl.texParameteri(gl.TEXTURE_2D, gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    } else {
      // gl.texParameteri(gl.TEXTURE_2D, gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    }

    for (let i = 0; i < mipmapDepth; i++) {
      const width = basisFile.getImageWidth(0, i);
      const height = basisFile.getImageHeight(0, i);
      const textureSource = this.decodeBasisImage(
        basisFile,
        basisCompressionType!,
        0,
        i
      );
      gl.compressedTexImage2D(
        gl.TEXTURE_2D,
        i,
        compressionType!,
        width,
        height,
        border,
        textureSource
      );
    }

    if (mipmapDepth === 0) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter.index);
      let minFilter_ = minFilter;
      if (minFilter === TextureParameter.LinearMipmapLinear) {
        minFilter_ = TextureParameter.Linear;
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter_.index);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter.index);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter.index);
      if (anisotropy && this.__glw!.webgl1ExtTFA) {
        gl.texParameteri(
          gl.TEXTURE_2D,
          this.__glw!.webgl1ExtTFA!.TEXTURE_MAX_ANISOTROPY_EXT,
          4
        );
      }
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT.index);

    this.__glw!.unbindTexture2D(0);

    return resourceHandle;
  }

  /**
   * decode the BasisImage
   * @param basisFile
   * @param basisCompressionType
   * @param imageIndex
   * @param levelIndex
   * @returns
   */
  private decodeBasisImage(
    basisFile: BasisFile,
    basisCompressionType: BasisCompressionTypeEnum,
    imageIndex: Index,
    levelIndex: Index
  ) {
    const extractSize = basisFile.getImageTranscodedSizeInBytes(
      imageIndex,
      levelIndex,
      basisCompressionType!.index
    );
    const textureSource = new Uint8Array(extractSize);
    if (
      !basisFile.transcodeImage(
        textureSource,
        imageIndex,
        levelIndex,
        basisCompressionType!.index,
        0,
        0
      )
    ) {
      console.error('failed to transcode the image.');
    }
    return textureSource;
  }

  /**
   * create a FrameBufferObject
   * @returns
   */
  createFrameBufferObject() {
    const gl = this.__glw!.getRawContext();
    const fbo = gl.createFramebuffer();
    const resourceHandle = this.__registerResource(fbo!);

    return resourceHandle;
  }

  /**
   * attach the ColorBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param renderable a ColorBuffer
   */
  attachColorBufferToFrameBufferObject(
    framebuffer: FrameBuffer,
    index: Index,
    renderable: IRenderable
  ) {
    const gl = this.__glw!.getRawContext();
    const fbo = this.getWebGLResource(
      framebuffer.framebufferUID
    )! as WebGLFramebuffer;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    const renderableWebGLResource = this.getWebGLResource(
      renderable.cgApiResourceUid
    )! as WebGLTexture;
    const attachmentId = this.__glw!.colorAttachment(index);
    if (renderable instanceof RenderTargetTexture) {
      (renderable as RenderTargetTexture)._fbo = framebuffer;
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        attachmentId,
        gl.TEXTURE_2D,
        renderableWebGLResource,
        0
      );
    } else {
      // It's must be RenderBuffer
      (renderable as RenderBuffer)._fbo = framebuffer;
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        attachmentId,
        gl.RENDERBUFFER,
        renderableWebGLResource as any as WebGLRenderbuffer
      );
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /**
   * attach the DepthBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param renderable a DepthBuffer
   */
  attachDepthBufferToFrameBufferObject(
    framebuffer: FrameBuffer,
    renderable: IRenderable
  ) {
    this.__attachDepthOrStencilBufferToFrameBufferObject(
      framebuffer,
      renderable,
      36096
    ); // gl.DEPTH_ATTACHMENT
  }

  /**
   * attach the StencilBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param renderable a StencilBuffer
   */
  attachStencilBufferToFrameBufferObject(
    framebuffer: FrameBuffer,
    renderable: IRenderable
  ) {
    this.__attachDepthOrStencilBufferToFrameBufferObject(
      framebuffer,
      renderable,
      36128
    ); // gl.STENCIL_ATTACHMENT
  }

  /**
   * attach the depthStencilBuffer to the FrameBufferObject
   * @param framebuffer a Framebuffer
   * @param renderable a depthStencilBuffer
   */
  attachDepthStencilBufferToFrameBufferObject(
    framebuffer: FrameBuffer,
    renderable: IRenderable
  ) {
    this.__attachDepthOrStencilBufferToFrameBufferObject(
      framebuffer,
      renderable,
      33306
    ); // gl.DEPTH_STENCIL_ATTACHMENT
  }

  private __attachDepthOrStencilBufferToFrameBufferObject(
    framebuffer: FrameBuffer,
    renderable: IRenderable,
    attachmentType: number
  ) {
    const gl = this.__glw!.getRawContext();
    const fbo = this.getWebGLResource(
      framebuffer.framebufferUID
    )! as WebGLFramebuffer;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    const renderableWebGLResource = this.getWebGLResource(
      renderable.cgApiResourceUid
    )! as WebGLTexture;
    if (renderable instanceof RenderTargetTexture) {
      (renderable as RenderTargetTexture)._fbo = framebuffer;
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.DEPTH_STENCIL_ATTACHMENT,
        gl.TEXTURE_2D,
        renderableWebGLResource,
        0
      );
    } else {
      // It's must be RenderBuffer
      (renderable as RenderBuffer)._fbo = framebuffer;
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        attachmentType,
        gl.RENDERBUFFER,
        renderableWebGLResource as any as WebGLRenderbuffer
      );
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /**
   * create Renderbuffer
   */
  createRenderBuffer(
    width: Size,
    height: Size,
    internalFormat: TextureParameterEnum,
    isMSAA: boolean,
    sampleCountMSAA: Count
  ) {
    const gl = this.__glw!.getRawContext();
    const renderBuffer = gl.createRenderbuffer();
    const resourceHandle = this.__registerResource(renderBuffer!);

    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
    if (isMSAA) {
      if (this.__glw!.isWebGL2) {
        (gl as WebGL2RenderingContext).renderbufferStorageMultisample(
          gl.RENDERBUFFER,
          sampleCountMSAA,
          (gl as any)[internalFormat.str],
          width,
          height
        );
      } else {
        console.error('MSAA is unavailable in this webgl context');
      }
    } else {
      gl.renderbufferStorage(
        gl.RENDERBUFFER,
        (gl as any)[internalFormat.str],
        width,
        height
      );
    }
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return resourceHandle;
  }

  /**
   * set drawTargets
   * @param framebuffer
   */
  setDrawTargets(framebuffer?: FrameBuffer) {
    if (framebuffer) {
      this.__glw!.drawBuffers(framebuffer.colorAttachmentsRenderBufferTargets);
    } else {
      this.__glw!.drawBuffers([RenderBufferTarget.Back]);
    }
  }

  /**
   * bind Framebuffer
   * @param framebuffer
   */
  bindFramebuffer(framebuffer?: FrameBuffer) {
    const gl = this.__glw!.getRawContext();
    if (framebuffer) {
      const fboUid = framebuffer.cgApiResourceUid;
      const fbo = this.getWebGLResource(fboUid) as WebGLFramebuffer;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }

  /**
   * unbind Framebuffer
   */
  unbindFramebuffer() {
    const gl = this.__glw!.getRawContext();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /**
   * create a RenderTargetTexture
   * @param param0
   * @returns
   */
  createRenderTargetTexture({
    width,
    height,
    level,
    internalFormat,
    format,
    type,
    magFilter,
    minFilter,
    wrapS,
    wrapT,
  }: {
    width: Size;
    height: Size;
    level: Index;
    internalFormat: TextureParameterEnum;
    format: PixelFormatEnum;
    type: ComponentTypeEnum;
    magFilter: TextureParameterEnum;
    minFilter: TextureParameterEnum;
    wrapS: TextureParameterEnum;
    wrapT: TextureParameterEnum;
  }) {
    const gl = this.__glw!.getRawContextAsWebGL2();

    const texture = gl.createTexture() as RnWebGLTexture;
    const resourceHandle = this.__registerResource(texture);

    this.__glw!.bindTexture2D(0, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT.index);
    if (
      // if WebGL2
      this.__glw!.isWebGL2 &&
      // if DEPTH_COMPONENT
      (internalFormat.index === 6402 ||
        internalFormat.index === 33189 ||
        internalFormat.index === 33190 ||
        internalFormat.index === 33191)
    ) {
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_COMPARE_MODE,
        gl.COMPARE_REF_TO_TEXTURE
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LESS);
    }
    if (this.__glw!.isWebGL2) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat.index,
        width,
        height,
        0,
        format.index,
        ComponentType.UnsignedByte.index,
        null
      );
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        TextureParameter.migrateToWebGL1InternalFormat(internalFormat).index,
        width,
        height,
        0,
        format.index,
        type.index,
        null
      );
    }
    this.__glw!.unbindTexture2D(0);

    return resourceHandle;
  }

  /**
   * create a CubeTexture
   *
   * @param mipLevelCount
   * @param images
   * @param width
   * @param height
   * @returns resource handle
   */
  createCubeTexture(
    mipLevelCount: Count,
    images: Array<{
      posX: DirectTextureData;
      negX: DirectTextureData;
      posY: DirectTextureData;
      negY: DirectTextureData;
      posZ: DirectTextureData;
      negZ: DirectTextureData;
    }>,
    width: Size,
    height: Size
  ) {
    const gl = this.__glw!.getRawContext();

    const texture = gl.createTexture() as RnWebGLTexture;
    const resourceHandle = this.__registerResource(texture);

    this.__glw!.bindTextureCube(0, texture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (
      (images[0].posX as any).hdriFormat === HdriFormat.HDR_LINEAR &&
      this.__glw!.isNotSupportWebGL1Extension(WebGLExtension.TextureFloatLinear)
    ) {
      if (mipLevelCount >= 2) {
        gl.texParameteri(
          gl.TEXTURE_CUBE_MAP,
          gl.TEXTURE_MIN_FILTER,
          gl.NEAREST_MIPMAP_NEAREST
        );
      } else {
        gl.texParameteri(
          gl.TEXTURE_CUBE_MAP,
          gl.TEXTURE_MIN_FILTER,
          gl.NEAREST
        );
      }
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    } else {
      if (mipLevelCount >= 2) {
        gl.texParameteri(
          gl.TEXTURE_CUBE_MAP,
          gl.TEXTURE_MIN_FILTER,
          gl.LINEAR_MIPMAP_LINEAR
        );
      } else {
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      }
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    const loadImageToGPU = (
      image: DirectTextureData,
      cubeMapSide: number,
      i: Index
    ) => {
      if ((image as any).hdriFormat === HdriFormat.HDR_LINEAR) {
        if (this.__glw!.isWebGL2) {
          const gl = this.__glw!.getRawContextAsWebGL2();
          gl.texImage2D(
            cubeMapSide,
            i,
            gl.RGB32F,
            (image as any).width,
            (image as any).height,
            0,
            gl.RGB,
            gl.FLOAT,
            (image as any).dataFloat
          );
        } else {
          gl.texImage2D(
            cubeMapSide,
            i,
            gl.RGB,
            (image as any).width,
            (image as any).height,
            0,
            gl.RGB,
            gl.FLOAT,
            (image as any).dataFloat
          );
        }
      } else if (
        image instanceof HTMLImageElement ||
        image instanceof HTMLCanvasElement
      ) {
        gl.texImage2D(
          cubeMapSide,
          i,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image
        );
      } else {
        gl.texImage2D(
          cubeMapSide,
          i,
          gl.RGBA,
          width / 2 ** i,
          height / 2 ** i,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image as ArrayBufferView
        );
      }
    };

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      loadImageToGPU(image.posX, gl.TEXTURE_CUBE_MAP_POSITIVE_X, i);
      loadImageToGPU(image.negX, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, i);
      loadImageToGPU(image.posY, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, i);
      loadImageToGPU(image.negY, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, i);
      loadImageToGPU(image.posZ, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, i);
      loadImageToGPU(image.negZ, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, i);
    }
    this.__glw!.unbindTextureCube(0);

    return resourceHandle;
  }

  /**
   * Create Cube Texture from image files.
   * @param baseUri the base uri to load images;
   * @param mipLevelCount the number of mip levels (include root level). if no mipmap, the value should be 1;
   * @returns the WebGLResourceHandle for the generated Cube Texture
   */
  async createCubeTextureFromFiles(
    baseUri: string,
    mipLevelCount: Count,
    isNamePosNeg: boolean,
    hdriFormat: HdriFormatEnum
  ) {
    const gl = this.__glw!.getRawContext();

    const imageArgs: Array<{
      posX: DirectTextureData;
      negX: DirectTextureData;
      posY: DirectTextureData;
      negY: DirectTextureData;
      posZ: DirectTextureData;
      negZ: DirectTextureData;
    }> = [];
    let width = 0;
    let height = 0;
    for (let i = 0; i < mipLevelCount; i++) {
      const loadOneLevel = () => {
        return new Promise<HTMLImageElement[]>((resolve, reject) => {
          let loadedCount = 0;
          const images: HTMLImageElement[] = [];
          let extension = '.jpg';
          if (hdriFormat === HdriFormat.HDR_LINEAR) {
            extension = '.hdr';
          } else if (hdriFormat === HdriFormat.RGBE_PNG) {
            extension = '.RGBE.PNG';
          }

          let posX = '_right_';
          let negX = '_left_';
          let posY = '_top_';
          let negY = '_bottom_';
          let posZ = '_front_';
          let negZ = '_back_';
          if (isNamePosNeg) {
            posX = '_posx_';
            negX = '_negx_';
            posY = '_posy_';
            negY = '_negy_';
            posZ = '_posz_';
            negZ = '_negz_';
          }

          const faces = [
            [baseUri + posX + i + extension, gl.TEXTURE_CUBE_MAP_POSITIVE_X],
            [baseUri + negX + i + extension, gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
            [baseUri + posY + i + extension, gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
            [baseUri + negY + i + extension, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
            [baseUri + posZ + i + extension, gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
            [baseUri + negZ + i + extension, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z],
          ];
          for (let j = 0; j < faces.length; j++) {
            const face = faces[j][1];
            let image: any;
            if (
              hdriFormat === HdriFormat.HDR_LINEAR ||
              hdriFormat === HdriFormat.RGB9_E5_PNG
            ) {
              image = new HDRImage();
            } else {
              image = new Image();
            }
            image.hdriFormat = hdriFormat;

            (image as any).side = face;
            (image as any).uri = faces[j][0];
            image.crossOrigin = 'Anonymous';
            image.onload = () => {
              loadedCount++;
              images.push(image);
              if (loadedCount === 6) {
                resolve(images);
              }
            };
            image.onerror = () => {
              reject((image as any).uri);
            };
            image.src = faces[j][0];
          }
        });
      };

      let images: HTMLImageElement[];
      try {
        images = await loadOneLevel();
      } catch (e) {
        // Try again once
        try {
          images = await loadOneLevel();
        } catch (uri) {
          // Give up
          console.error(`failed to load ${uri}`);
        }
      }
      const imageObj: {
        posX?: DirectTextureData;
        negX?: DirectTextureData;
        posY?: DirectTextureData;
        negY?: DirectTextureData;
        posZ?: DirectTextureData;
        negZ?: DirectTextureData;
      } = {};
      for (const image of images!) {
        switch ((image as any).side) {
          case gl.TEXTURE_CUBE_MAP_POSITIVE_X:
            imageObj.posX = image;
            break;
          case gl.TEXTURE_CUBE_MAP_POSITIVE_Y:
            imageObj.posY = image;
            break;
          case gl.TEXTURE_CUBE_MAP_POSITIVE_Z:
            imageObj.posZ = image;
            break;
          case gl.TEXTURE_CUBE_MAP_NEGATIVE_X:
            imageObj.negX = image;
            break;
          case gl.TEXTURE_CUBE_MAP_NEGATIVE_Y:
            imageObj.negY = image;
            break;
          case gl.TEXTURE_CUBE_MAP_NEGATIVE_Z:
            imageObj.negZ = image;
            break;
        }
        if (i === 0) {
          width = image.width;
          height = image.height;
        }
      }
      imageArgs.push(
        imageObj as {
          posX: DirectTextureData;
          negX: DirectTextureData;
          posY: DirectTextureData;
          negY: DirectTextureData;
          posZ: DirectTextureData;
          negZ: DirectTextureData;
        }
      );
    }

    return this.createCubeTexture(mipLevelCount, imageArgs, width, height);
  }

  createCubeTextureFromBasis(
    basisFile: BasisFile,
    {
      magFilter = TextureParameter.Linear,
      minFilter = TextureParameter.LinearMipmapLinear,
      wrapS = TextureParameter.Repeat,
      wrapT = TextureParameter.Repeat,
      border = 0,
    }
  ) {
    const gl = this.__glw!.getRawContext();
    let basisCompressionType: BasisCompressionTypeEnum;
    let compressionType: Index;

    const texture = gl.createTexture() as RnWebGLTexture;
    const resourceHandle = this.__registerResource(texture);

    this.__glw!.bindTextureCube(0, texture);

    const s3tc = gl.getExtension('WEBGL_compressed_texture_s3tc');
    if (s3tc) {
      basisCompressionType = BasisCompressionType.BC3;
      compressionType = s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT;
    }
    const etc1 = gl.getExtension('WEBGL_compressed_texture_etc1');
    if (etc1) {
      basisCompressionType = BasisCompressionType.ETC1;
      compressionType = etc1.COMPRESSED_RGB_ETC1_WEBGL;
    }
    const atc = gl.getExtension('WEBGL_compressed_texture_atc');
    if (atc) {
      basisCompressionType = BasisCompressionType.ATC_RGBA;
      compressionType = atc.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL;
    }
    const etc2 = gl.getExtension('WEBGL_compressed_texture_etc');
    if (etc2) {
      basisCompressionType = BasisCompressionType.ETC2;
      compressionType = etc2.COMPRESSED_RGBA8_ETC2_EAC;
    }
    const pvrtc =
      gl.getExtension('WEBGL_compressed_texture_pvrtc') ||
      gl.getExtension('WEBKIT_WEBGL_compressed_texture_pvrtc');
    if (pvrtc) {
      basisCompressionType = BasisCompressionType.PVRTC1_RGBA;
      compressionType = pvrtc.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
    }
    const astc = gl.getExtension('WEBGL_compressed_texture_astc');
    if (astc) {
      basisCompressionType = BasisCompressionType.ASTC;
      compressionType = astc.COMPRESSED_RGBA_ASTC_4x4_KHR;
    }

    const numImages = basisFile.getNumImages();
    const mipmapDepth = basisFile.getNumLevels(0);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, wrapS.index);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, wrapT.index);
    if (mipmapDepth >= 2) {
      gl.texParameteri(
        gl.TEXTURE_CUBE_MAP,
        gl.TEXTURE_MIN_FILTER,
        minFilter.index
      );
      gl.texParameteri(
        gl.TEXTURE_CUBE_MAP,
        gl.TEXTURE_MAG_FILTER,
        magFilter.index
      );
    } else {
      let minFilter_ = minFilter;
      if (minFilter === TextureParameter.LinearMipmapLinear) {
        minFilter_ = TextureParameter.Linear;
      }
      gl.texParameteri(
        gl.TEXTURE_CUBE_MAP,
        gl.TEXTURE_MIN_FILTER,
        minFilter_.index
      );
      gl.texParameteri(
        gl.TEXTURE_CUBE_MAP,
        gl.TEXTURE_MAG_FILTER,
        magFilter.index
      );
    }

    for (let i = 0; i < mipmapDepth; i++) {
      for (let j = 0; j < numImages; j++) {
        const width = basisFile.getImageWidth(j, i);
        const height = basisFile.getImageHeight(j, i);
        const textureSource = this.decodeBasisImage(
          basisFile,
          basisCompressionType!,
          j,
          i
        );
        gl.compressedTexImage2D(
          gl.TEXTURE_CUBE_MAP_POSITIVE_X + j,
          i,
          compressionType!,
          width,
          height,
          border,
          textureSource
        );
      }
    }

    this.__glw!.unbindTextureCube(0);

    return resourceHandle;
  }

  createDummyBlackCubeTexture() {
    const base64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==';
    const arrayBuffer = this.__createDummyTextureInner(base64);
    const typedArray = new Uint8Array(arrayBuffer);
    return this.createCubeTexture(
      1,
      [
        {
          posX: typedArray,
          negX: typedArray,
          posY: typedArray,
          negY: typedArray,
          posZ: typedArray,
          negZ: typedArray,
        },
      ],
      1,
      1
    );
  }

  createDummyCubeTexture(rgbaStr = 'rgba(0,0,0,1)') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = rgbaStr;
    ctx.fillRect(0, 0, 1, 1);

    return this.createCubeTexture(
      1,
      [
        {
          posX: canvas,
          negX: canvas,
          posY: canvas,
          negY: canvas,
          posZ: canvas,
          negZ: canvas,
        },
      ],
      1,
      1
    );
  }

  setWebGLTextureDirectly(webGLTexture: WebGLTexture) {
    const texture = webGLTexture;
    const resourceHandle = this.__registerResource(texture);

    return resourceHandle;
  }

  async createTextureFromDataUri(
    dataUri: string,
    {
      level,
      internalFormat,
      border,
      format,
      type,
      magFilter,
      minFilter,
      wrapS,
      wrapT,
      generateMipmap,
      anisotropy,
      isPremultipliedAlpha,
    }: {
      level: Index;
      internalFormat: TextureParameterEnum | PixelFormatEnum;
      border: Size;
      format: PixelFormatEnum;
      type: ComponentTypeEnum;
      magFilter: TextureParameterEnum;
      minFilter: TextureParameterEnum;
      wrapS: TextureParameterEnum;
      wrapT: TextureParameterEnum;
      generateMipmap: boolean;
      anisotropy: boolean;
      isPremultipliedAlpha: boolean;
    }
  ): Promise<WebGLResourceHandle> {
    return new Promise<WebGLResourceHandle>(resolve => {
      const img = new Image();
      if (!dataUri.match(/^data:/)) {
        img.crossOrigin = 'Anonymous';
      }
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        const texture = this.createTexture(img, {
          level,
          internalFormat,
          width,
          height,
          border,
          format,
          type,
          magFilter,
          minFilter,
          wrapS,
          wrapT,
          generateMipmap,
          anisotropy,
          isPremultipliedAlpha,
        });

        resolve(texture);
      };

      img.src = dataUri;
    });
  }

  updateLevel0TextureAndGenerateMipmap(
    textureUid: WebGLResourceHandle,
    textureData: DirectTextureData,
    {
      width,
      height,
      format,
      type,
    }: {
      width: Size;
      height: Size;
      format: PixelFormatEnum;
      type: ComponentTypeEnum;
    }
  ) {
    const texture = this.getWebGLResource(textureUid) as WebGLTexture;
    const isWebGL2 = this.__glw!.isWebGL2;

    this.__glw!.bindTexture2D(0, texture);

    if (isWebGL2 || ArrayBuffer.isView(textureData)) {
      const gl = this.__glw!.getRawContextAsWebGL2();
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        width,
        height,
        format.index,
        type.index,
        textureData as any as ArrayBufferView
      );
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      const gl = this.__glw!.getRawContextAsWebGL1();
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        format.index,
        type.index,
        textureData
      );
      gl.generateMipmap(gl.TEXTURE_2D);
    }
    this.__glw!.unbindTexture2D(0);
  }

  updateTexture(
    textureUid: WebGLResourceHandle,
    textureData: DirectTextureData,
    {
      level,
      xoffset,
      yoffset,
      width,
      height,
      format,
      type,
    }: {
      level: Index;
      xoffset: Size;
      yoffset: Size;
      width: Size;
      height: Size;
      format: PixelFormatEnum;
      type: ComponentTypeEnum;
    }
  ) {
    const texture = this.getWebGLResource(textureUid) as WebGLTexture;
    const isWebGL2 = this.__glw!.isWebGL2;

    this.__glw!.bindTexture2D(0, texture);

    if (isWebGL2 || ArrayBuffer.isView(textureData)) {
      const gl = this.__glw!.getRawContextAsWebGL2();
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        level,
        0,
        0,
        width,
        height,
        format.index,
        type.index,
        textureData as any as ArrayBufferView
      );
    } else {
      const gl = this.__glw!.getRawContextAsWebGL1();
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        level,
        0,
        0,
        format.index,
        type.index,
        textureData
      );
    }
    this.__glw!.unbindTexture2D(0);
  }

  deleteFrameBufferObject(frameBufferObjectHandle: WebGLResourceHandle) {
    const fbo = this.getWebGLResource(
      frameBufferObjectHandle
    ) as WebGLFramebuffer;
    const gl = this.__glw!.getRawContext();
    if (fbo != null) {
      gl.deleteFramebuffer(fbo!);
      this.__webglResources.delete(frameBufferObjectHandle);
    }
  }

  deleteRenderBuffer(renderBufferUid: WebGLResourceHandle) {
    const gl = this.__glw!.getRawContext();

    const renderBuffer = this.getWebGLResource(
      renderBufferUid
    )! as WebGLRenderbuffer;
    gl.deleteRenderbuffer(renderBuffer);
    this.__webglResources.delete(renderBufferUid);
  }

  deleteTexture(textureHandle: WebGLResourceHandle) {
    const texture = this.getWebGLResource(textureHandle) as WebGLTexture;
    const gl = this.__glw!.getRawContext();
    if (texture != null) {
      gl.deleteTexture(texture!);
      this.__webglResources.delete(textureHandle);
    }
  }

  createDummyTexture(rgbaStr = 'rgba(255,255,255,1)') {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = rgbaStr;
    ctx.fillRect(0, 0, 1, 1);

    return this.createTexture(canvas, {
      level: 0,
      internalFormat: TextureParameter.RGBA8,
      width: 1,
      height: 1,
      border: 0,
      format: PixelFormat.RGBA,
      type: ComponentType.UnsignedByte,
      magFilter: TextureParameter.Nearest,
      minFilter: TextureParameter.Nearest,
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
      generateMipmap: false,
      anisotropy: false,
      isPremultipliedAlpha: false,
    });
  }

  createDummyBlackTexture() {
    const base64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==';
    return this.__createDummyTextureInner(base64);
  }

  createDummyWhiteTexture() {
    const base64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5/hPwAIAgL/4d1j8wAAAABJRU5ErkJggg==';
    return this.__createDummyTextureInner(base64);
  }

  createDummyNormalTexture() {
    const base64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOsr///HwAGgAL+v1RumAAAAABJRU5ErkJggg==';
    return this.__createDummyTextureInner(base64);
  }

  __createDummyTextureInner(base64: string) {
    const arrayBuffer = DataUtil.base64ToArrayBuffer(base64);
    return this.createTexture(new Uint8Array(arrayBuffer), {
      level: 0,
      internalFormat: TextureParameter.RGBA8,
      width: 1,
      height: 1,
      border: 0,
      format: PixelFormat.RGBA,
      type: ComponentType.UnsignedByte,
      magFilter: TextureParameter.Nearest,
      minFilter: TextureParameter.Nearest,
      wrapS: TextureParameter.ClampToEdge,
      wrapT: TextureParameter.ClampToEdge,
      generateMipmap: false,
      anisotropy: false,
      isPremultipliedAlpha: false,
    });
  }

  createUniformBuffer(bufferView: TypedArray | DataView) {
    const gl = this.__glw!.getRawContextAsWebGL2();

    if (gl == null) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    const ubo = gl.createBuffer();
    const resourceHandle = this.__registerResource(ubo!);

    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bufferData(gl.UNIFORM_BUFFER, bufferView, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    return resourceHandle;
  }

  updateUniformBuffer(
    uboUid: WebGLResourceHandle,
    typedArray: TypedArray,
    offsetByte: Byte,
    byteLength: Byte
  ) {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const ubo = this.getWebGLResource(uboUid) as WebGLBuffer;

    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, typedArray, offsetByte, byteLength);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  }

  bindUniformBlock(
    shaderProgramUid: WebGLResourceHandle,
    blockName: string,
    blockIndex: Index
  ) {
    const gl = this.__glw!.getRawContextAsWebGL2();

    if (gl == null) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    const shaderProgram = this.getWebGLResource(
      shaderProgramUid
    )! as WebGLProgram;

    const block = gl.getUniformBlockIndex(shaderProgram, blockName);
    gl.uniformBlockBinding(shaderProgram, block, blockIndex);
  }

  bindUniformBufferBase(blockIndex: Index, uboUid: WebGLResourceHandle) {
    const gl = this.__glw!.getRawContextAsWebGL2();

    if (gl == null) {
      throw new Error('No WebGLRenderingContext set as Default.');
    }

    const ubo = this.getWebGLResource(uboUid)! as WebGLBuffer;

    gl.bindBufferBase(gl.UNIFORM_BUFFER, blockIndex, ubo);
  }

  deleteUniformBuffer(uboUid: WebGLResourceHandle) {
    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      new Error('No WebGLRenderingContext set as Default.');
    }

    const ubo = this.getWebGLResource(uboUid)! as WebGLBuffer;
    this.__webglResources.delete(uboUid);

    gl.deleteBuffer(ubo);
  }

  setupUniformBufferDataArea(typedArray?: TypedArray) {
    const gl = this.__glw!.getRawContextAsWebGL2();

    if (gl == null) {
      new Error('No WebGLRenderingContext set as Default.');
    }

    const ubo = gl.createBuffer();
    const resourceHandle = this.__registerResource(ubo!);

    const alignedMaxUniformBlockSize =
      this.__glw!.getAlignedMaxUniformBlockSize();
    const array = typedArray
      ? typedArray
      : new Float32Array(alignedMaxUniformBlockSize / 4);
    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bufferData(
      gl.UNIFORM_BUFFER,
      array,
      gl.DYNAMIC_DRAW,
      0,
      alignedMaxUniformBlockSize
    );
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    const maxConventionBlocks = this.__glw!.getMaxConventionUniformBlocks();
    for (let i = 0; i < maxConventionBlocks; i++) {
      gl.bindBufferRange(
        gl.UNIFORM_BUFFER,
        i,
        ubo,
        alignedMaxUniformBlockSize * i,
        alignedMaxUniformBlockSize
      );
    }

    return resourceHandle;
  }

  getGlslDataUBODefinitionString() {
    let text = '';
    const maxConventionblocks = this.__glw!.getMaxConventionUniformBlocks();
    const alignedMaxUniformBlockSize =
      this.__glw!.getAlignedMaxUniformBlockSize();
    for (let i = 0; i < maxConventionblocks; i++) {
      text += `
layout (std140) uniform Vec4Block${i} {
  vec4 vec4Block${i}[${alignedMaxUniformBlockSize / 4 / 4}];
};
`;
    }

    text += `
vec4 fetchVec4FromVec4Block(int vec4Idx) {
  int vec4IdxForEachBlock = vec4Idx % dataUBOVec4Size;
  if (vec4Idx < dataUBOVec4Size) {
    return vec4Block0[vec4IdxForEachBlock];
  }`;
    for (let i = 1; i < maxConventionblocks; i++) {
      text += `
 else if (vec4Idx < dataUBOVec4Size * ${i + 1}) {
    return vec4Block${i}[vec4IdxForEachBlock];
}`;
    }
    text += '}\n';

    return text;
  }

  getGlslDataUBOVec4SizeString() {
    const alignedMaxUniformBlockSize =
      this.__glw!.getAlignedMaxUniformBlockSize();
    return `const int dataUBOVec4Size = ${alignedMaxUniformBlockSize / 4 / 4};`;
  }

  createTransformFeedback() {
    const gl = this.__glw!.getRawContextAsWebGL2();
    const transformFeedback = gl.createTransformFeedback();
    const resourceHandle = this.__registerResource(transformFeedback!);

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);

    return resourceHandle;
  }

  deleteTransformFeedback(transformFeedbackUid: WebGLResourceHandle) {
    const gl = this.__glw!.getRawContextAsWebGL2();

    const transformFeedback = this.getWebGLResource(transformFeedbackUid)!;
    gl.deleteTransformFeedback(transformFeedback as WebGLTransformFeedback);
    this.__webglResources.delete(transformFeedbackUid);
  }

  setViewport(viewport?: Vector4) {
    if (viewport) {
      this.__glw?.setViewportAsVector4(viewport);
    } else {
      this.__glw?.setViewport(0, 0, this.__glw!.width, this.__glw!.height);
    }
  }

  clearFrameBuffer(renderPass: RenderPass) {
    const gl = this.__glw!.getRawContext();
    let bufferBit = 0;
    if (renderPass.toClearColorBuffer) {
      gl.clearColor(
        renderPass.clearColor.x,
        renderPass.clearColor.y,
        renderPass.clearColor.z,
        renderPass.clearColor.w
      );
      bufferBit |= gl.COLOR_BUFFER_BIT;
    }
    if (renderPass.toClearDepthBuffer) {
      gl.clearDepth(renderPass.clearDepth);
      bufferBit |= gl.DEPTH_BUFFER_BIT;
    }
    if (renderPass.toClearStencilBuffer) {
      gl.clearStencil(renderPass.clearStencil);
      bufferBit |= gl.STENCIL_BUFFER_BIT;
    }
    if (bufferBit !== 0) {
      gl.clear(bufferBit);
    }
  }

  deleteVertexDataResources(vertexHandles: VertexHandles) {
    const gl = this.__glw!.getRawContext();

    const iboHandle = vertexHandles.iboHandle;
    if (iboHandle) {
      const ibo = this.getWebGLResource(iboHandle) as WebGLBuffer;
      gl.deleteBuffer(ibo);
    }

    const vboHandles = vertexHandles.vboHandles;
    for (const vboHandle of vboHandles) {
      const vbo = this.getWebGLResource(vboHandle) as WebGLBuffer;
      gl.deleteBuffer(vbo);
    }

    const vaoHandle = vertexHandles.vaoHandle;
    const vao = this.getWebGLResource(vaoHandle) as WebGLVertexArrayObject;
    this.__glw!.deleteVertexArray(vao);
  }

  deleteVertexArray(vaoHandle: WebGLResourceHandle) {
    const vao = this.getWebGLResource(vaoHandle) as WebGLVertexArrayObject;
    this.__glw!.deleteVertexArray(vao);
  }

  deleteVertexBuffer(vboUid: WebGLResourceHandle) {
    const gl = this.__glw!.getRawContext();
    const vbo = this.getWebGLResource(vboUid) as WebGLBuffer;
    gl.deleteBuffer(vbo);
  }

  resizeCanvas(width: Size, height: Size) {
    this.__glw!.width = width;
    this.__glw!.height = height;
    this.__glw!.canvas.width = width;
    this.__glw!.canvas.height = height;
    this.__glw!.setViewportAsVector4(
      Vector4.fromCopyArray([0, 0, width, height])
    );
  }

  getCanvasSize(): [Size, Size] {
    return [this.__glw!.canvas.width, this.__glw!.canvas.height];
  }

  switchDepthTest(flag: boolean) {
    const gl = this.__glw!.getRawContext();
    if (flag) {
      gl.enable(gl.DEPTH_TEST);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
  }

  rebuildProgram(
    this: RnWebGLProgram,
    updatedVertexSourceCode: string, // The new vertex shader source
    updatedFragmentSourceCode: string, // The new fragment shader source
    onCompiled: (program: WebGLProgram) => void, // Callback triggered by your engine when the compilation is successful. It needs to send back the new linked program.
    onError: (message: string) => void
  ): boolean {
    // Callback triggered by your engine in case of error. It needs to send the WebGL error to allow the editor to display the error in the gutter.

    const material = this._material;
    if (Is.not.exist(material)) {
      const warn = 'Material Not found';
      console.warn(warn);
      onError(warn);
      return false;
    }

    const processApproach = System.processApproach;
    const renderingStrategy = getRenderingStrategy(processApproach);

    const modifiedVertexSourceCode = updatedVertexSourceCode.replace(
      /! =/g,
      '!='
    );
    const modifiedPixelSourceCode = updatedFragmentSourceCode.replace(
      /! =/g,
      '!='
    );

    const programUid = renderingStrategy.setupShaderForMaterial(material, {
      vertex: modifiedVertexSourceCode,
      pixel: modifiedPixelSourceCode,
    });
    const webglResourceRepository = WebGLResourceRepository.getInstance();
    const program = webglResourceRepository.getWebGLResource(
      programUid
    ) as RnWebGLProgram;
    onCompiled(program);

    return true;
  }

  getPixelDataFromTexture(
    texUid: WebGLResourceHandle,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const gl = this.__glw!.getRawContext();
    const pixels = new Uint8Array((width - x) * (height - y) * 4);
    const texture = this.getWebGLResource(texUid) as WebGLTexture;
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );
    gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fbo);
    return pixels;
  }
}
