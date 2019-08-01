import Accessor from "../foundation/memory/Accessor";
import CGAPIResourceRepository from "../foundation/renderer/CGAPIResourceRepository";
import Primitive from "../foundation/geometry/Primitive";
import GLSLShader, { AttributeNames } from "./shaders/GLSLShader";
import { VertexAttributeEnum, VertexAttribute } from "../foundation/definitions/VertexAttribute";
import { TextureParameterEnum, TextureParameter } from "../foundation/definitions/TextureParameter";
import { PixelFormatEnum, PixelFormat } from "../foundation/definitions/PixelFormat";
import { ComponentTypeEnum } from "../foundation/definitions/ComponentType";
import { CompositionType } from "../foundation/definitions/CompositionType";
import { ComponentType } from "../foundation/definitions/ComponentType";
import WebGLContextWrapper from "./WebGLContextWrapper";
import { MathUtil } from "../foundation/math/MathUtil"
import Component from "../foundation/core/Component";
import { ShaderSemanticsEnum, ShaderSemanticsInfo, ShaderSemantics } from "../foundation/definitions/ShaderSemantics";
import AbstractTexture from "../foundation/textures/AbstractTexture";
import RenderTargetTexture from "../foundation/textures/RenderTargetTexture";
import IRenderable from "../foundation/textures/IRenderable";
import FrameBuffer from "../foundation/renderer/FrameBuffer";
import { HdriFormatEnum, HdriFormat } from "../foundation/definitions/HdriFormat";
import Vector4 from "../foundation/math/Vector4";
import { RenderBufferTarget } from "../foundation/definitions/RenderBufferTarget";
import RenderPass from "../foundation/renderer/RenderPass";
import { MiscUtil } from "../foundation/misc/MiscUtil";
import { ShaderVariableUpdateIntervalEnum, ShaderVariableUpdateInterval } from "../foundation/definitions/ShaderVariableUpdateInterval";
import { WebGLResourceHandle, TypedArray, Index, Size, Count, CGAPIResourceHandle } from "../types/CommonTypes";
import DataUtil from "../foundation/misc/DataUtil";
import RenderBuffer from "../foundation/textures/RenderBuffer";


declare var HDRImage: any;

export type VertexHandles = {
  vaoHandle: CGAPIResourceHandle,
  iboHandle?: CGAPIResourceHandle,
  vboHandles: Array<CGAPIResourceHandle>,
  attributesFlags: Array<boolean>,
  setComplete: boolean;
};

type DirectTextureData = TypedArray | HTMLImageElement | HTMLCanvasElement;

export default class WebGLResourceRepository extends CGAPIResourceRepository {
  private static __instance: WebGLResourceRepository;
  private __webglContexts: Map<string, WebGLContextWrapper> = new Map();
  private __glw?: WebGLContextWrapper;
  private __resourceCounter: number = CGAPIResourceRepository.InvalidCGAPIResourceUid;
  private __webglResources: Map<WebGLResourceHandle, WebGLObject> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): WebGLResourceRepository {
    if (!this.__instance) {
      this.__instance = new (WebGLResourceRepository)();
    }
    return this.__instance;
  }

  addWebGLContext(gl: WebGLRenderingContext, canvas: HTMLCanvasElement, asCurrent: boolean) {
    const glw = new WebGLContextWrapper(gl, canvas);
    this.__webglContexts.set('default', glw);
    if (asCurrent) {
      this.__glw = glw;
    }
  }

  get currentWebGLContextWrapper() {
    return this.__glw;
  }

  private getResourceNumber(): WebGLResourceHandle {
    return ++this.__resourceCounter;
  }

  getWebGLResource(WebGLResourceHandle: WebGLResourceHandle): WebGLObject | null {
    const result = this.__webglResources.get(WebGLResourceHandle);
    return (result != null) ? result : null;
  }

  createIndexBuffer(accsessor: Accessor) {
    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }

    const ibo = gl.createBuffer();
    const resourceHandle = this.getResourceNumber();
    this.__webglResources.set(resourceHandle, ibo!);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    //    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, accsessor.bufferView.buffer.getArrayBuffer(), gl.STATIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, accsessor.getTypedArray(), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return resourceHandle;
  }

  createVertexBuffer(accessor: Accessor) {
    const gl = this.__glw!.getRawContext();;

    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }

    const vbo = gl.createBuffer();
    const resourceHandle = this.getResourceNumber();
    this.__webglResources.set(resourceHandle, vbo!);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, accessor.bufferView.getUint8Array(), gl.STATIC_DRAW);
    //    gl.bufferData(gl.ARRAY_BUFFER, accessor.getTypedArray(), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return resourceHandle;

  }

  createVertexBufferFromTypedArray(typedArray: TypedArray) {
    const gl = this.__glw!.getRawContext();;

    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }

    const vbo = gl.createBuffer();
    const resourceHandle = this.getResourceNumber();
    this.__webglResources.set(resourceHandle, vbo!);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, typedArray, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return resourceHandle;

  }

  resendVertexBuffer(primitive: Primitive, vboHandles: Array<WebGLResourceHandle>) {
    const gl = this.__glw!.getRawContext();;

    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }

    const vbo = gl.createBuffer();
    const resourceHandle = this.getResourceNumber();
    this.__webglResources.set(resourceHandle, vbo!);

    primitive.attributeAccessors.forEach((accessor, i) => {
      const vbo = this.getWebGLResource(vboHandles[i]);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, accessor.bufferView.getUint8Array(), gl.STATIC_DRAW);
      //    gl.bufferData(gl.ARRAY_BUFFER, accessor.getTypedArray(), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    });
  }

  createVertexArray() {
    const gl = this.__glw;

    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }

    const vao = this.__glw!.createVertexArray();

    const resourceHandle = this.getResourceNumber();
    this.__webglResources.set(resourceHandle, vao);

    return resourceHandle;
  }

  bindTexture2D(textureSlotIndex: Index, textureUid: CGAPIResourceHandle) {
    const texture = this.getWebGLResource(textureUid) as WebGLTexture;
    this.__glw!.bindTexture2D(textureSlotIndex, texture);
  }

  bindTextureCube(textureSlotIndex: Index, textureUid: CGAPIResourceHandle) {
    const texture = this.getWebGLResource(textureUid) as WebGLTexture;
    this.__glw!.bindTextureCube(textureSlotIndex, texture);
  }

  createVertexDataResources(primitive: Primitive): VertexHandles {
    const gl = this.__glw!.getRawContext();

    const vaoHandle = this.createVertexArray();

    let iboHandle;
    if (primitive.hasIndices()) {
      iboHandle = this.createIndexBuffer(primitive.indicesAccessor!);
    }

    const attributesFlags: boolean[] = [];
    for (let i = 0; i < VertexAttribute.AttributeTypeNumber; i++) {
      attributesFlags[i] = false;
    }
    const vboHandles: Array<WebGLResourceHandle> = [];
    primitive.attributeAccessors.forEach((accessor, i) => {
      const vboHandle = this.createVertexBuffer(accessor);
      const slotIdx = primitive.attributeSemantics[i].getAttributeSlot();
      attributesFlags[slotIdx] = true;
      vboHandles.push(vboHandle);
    });

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return { vaoHandle: vaoHandle, iboHandle: iboHandle, vboHandles: vboHandles, attributesFlags: attributesFlags, setComplete: false };
  }

  createVertexBufferAndIndexBuffer(primitive: Primitive): VertexHandles {
    const gl = this.__glw!.getRawContext();

    let iboHandle;
    if (primitive.hasIndices()) {
      iboHandle = this.createIndexBuffer(primitive.indicesAccessor!);
    }

    const attributesFlags: boolean[] = [];
    for (let i = 0; i < VertexAttribute.AttributeTypeNumber; i++) {
      attributesFlags[i] = false;
    }
    const vboHandles: Array<WebGLResourceHandle> = [];
    primitive.attributeAccessors.forEach((accessor, i) => {
      const vboHandle = this.createVertexBuffer(accessor);
      const slotIdx = primitive.attributeSemantics[i].getAttributeSlot();
      attributesFlags[slotIdx] = true;
      vboHandles.push(vboHandle);
    });

    return { vaoHandle: -1, iboHandle: iboHandle, vboHandles: vboHandles, attributesFlags: attributesFlags, setComplete: false };
  }

  createShaderProgram({ materialTypeName, vertexShaderStr, fragmentShaderStr, attributeNames, attributeSemantics }:
    { materialTypeName: string, vertexShaderStr: string, fragmentShaderStr: string, attributeNames: AttributeNames, attributeSemantics: Array<VertexAttributeEnum> }) {

    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderStr);
    gl.compileShader(vertexShader);
    this.__checkShaderCompileStatus(materialTypeName, vertexShader, vertexShaderStr);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderStr);
    gl.compileShader(fragmentShader);
    this.__checkShaderCompileStatus(materialTypeName, fragmentShader, fragmentShaderStr);

    const shaderProgram = gl.createProgram()!;
    shaderProgram._gl = gl;
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);

    attributeNames.forEach((attributeName, i) => {
      gl.bindAttribLocation(shaderProgram, attributeSemantics[i].getAttributeSlot(), attributeName)
    });

    gl.linkProgram(shaderProgram);
    this.__checkShaderProgramLinkStatus(materialTypeName, shaderProgram, vertexShaderStr, fragmentShaderStr);

    const resourceHandle = this.getResourceNumber();
    this.__webglResources.set(resourceHandle, shaderProgram);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return resourceHandle;
  }

  private __addLineNumber(shaderString: string) {
    let shaderTextLines = shaderString.split(/\r\n|\r|\n/);
    let shaderTextWithLineNumber = '';
    for (let i = 0; i < shaderTextLines.length; i++) {
      let lineIndex = i + 1;
      let splitter = ' : ';
      if (lineIndex < 10) {
        splitter = '  : ';
      } else if (lineIndex >= 100) {
        splitter = ': ';
      }
      shaderTextWithLineNumber += lineIndex + splitter + shaderTextLines[i] + '\n';
    }

    return shaderTextWithLineNumber;
  }

  private __checkShaderCompileStatus(materialTypeName: string, shader: WebGLShader, shaderText: string) {
    const gl = this.__glw!.getRawContext();

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log('MaterialTypeName: ' + materialTypeName);
      console.log(this.__addLineNumber(shaderText));
      throw new Error('An error occurred compiling the shaders:' + gl.getShaderInfoLog(shader));
    }
  }

  private __checkShaderProgramLinkStatus(materialTypeName: string, shaderProgram: WebGLProgram, vertexShaderText: string, fragmentShaderText: string) {
    const gl = this.__glw!.getRawContext();

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.log('MaterialTypeName: ' + materialTypeName);
      console.log(this.__addLineNumber('Vertex Shader:'));
      console.log(this.__addLineNumber(vertexShaderText));
      console.log(this.__addLineNumber('Fragment Shader:'));
      console.log(this.__addLineNumber(fragmentShaderText));
      throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    }
  }

  setupUniformLocations(shaderProgramUid: WebGLResourceHandle, dataArray: ShaderSemanticsInfo[]): WebGLProgram {
    const gl = this.__glw!.getRawContext();
    const shaderProgram = this.getWebGLResource(shaderProgramUid) as any;

    const shaderSemanticsInfoMap: Map<string, ShaderSemanticsInfo> = new Map();
    for (let arg of dataArray) {
      shaderSemanticsInfoMap.set(arg.semantic.str, arg);
    }

    for (let data of dataArray) {
      let semanticSingular = data.semantic.str;

      let identifier = semanticSingular;

      let shaderVarName = ShaderSemantics.fullSemanticStr(data);
      if (data.index != null) {
        if (shaderVarName.match(/\[.+?\]/)) {
          shaderVarName = shaderVarName.replace(/\[.+?\]/g, `[${data.index}]`);
        } else {
          shaderVarName += `[${data.index}]`;
        }
      }
      const location = gl.getUniformLocation(shaderProgram, 'u_' + shaderVarName);


      if (data.index != null) {
        if (shaderProgram[identifier] == null) {
          shaderProgram[identifier] = [];
        }
        shaderProgram[identifier][data.index] = location;
      } else {
        shaderProgram[identifier] = location;
      }

    }

    if (shaderProgram._shaderSemanticsInfoMap != null) {
      shaderProgram._shaderSemanticsInfoMap = new Map([...shaderProgram._shaderSemanticsInfoMap, ...shaderSemanticsInfoMap]);
    } else {
      shaderProgram._shaderSemanticsInfoMap = shaderSemanticsInfoMap;
    }

    return shaderProgram;
  }

  private __isUniformValueDirty(isVector: boolean, shaderProgram: WebGLProgram, identifier: string, { x, y, z, w }: { x: number | TypedArray | Array<number> | Array<boolean> | boolean, y?: number | boolean, z?: number | boolean, w?: number | boolean }, delta: number = Number.EPSILON) {
    const valueIdentifier = identifier + '_value';
    const value = (shaderProgram as any)[valueIdentifier];

    if (value == null) {
      return true;
    }

    let result = false;

    if (isVector) {
      const length = (x as any).length;
      if (length > 4) {
        return true;
      }
      for (let i = 0; i < length; i++) {
        if (Math.abs((x as any)[i] - value[i]) >= delta) {
          result = true;
          break;
        }
      }
      (shaderProgram as any)[valueIdentifier] = x;
    } else {
      const compare = () => {
        if (x != null && Math.abs(x as number - value[0]) >= delta) {
          return true;
        }
        if (y != null && Math.abs(y as number - value[1]) >= delta) {
          return true;
        }
        if (z != null && Math.abs(z as number - value[2]) >= delta) {
          return true;
        }
        if (w != null && Math.abs(w as number - value[3]) >= delta) {
          return true;
        }
        return false;
      }
      result = compare();
      (shaderProgram as any)[valueIdentifier] = [x, y, z, w];
    }

    return result;
  }


  setUniformValue(shaderProgram: WebGLProgram, semanticStr: string, firstTime: boolean, value: any, index?: Index) {

    const info = (shaderProgram as any)._shaderSemanticsInfoMap.get(semanticStr);
    if (info == null) {
      return false;
    }

    let updateInterval: ShaderVariableUpdateIntervalEnum;
    if (info) {
      updateInterval = info.updateInteval!;
    } else {
      return false;
    }

    if (!firstTime) {
      if (updateInterval != null && updateInterval === ShaderVariableUpdateInterval.FirstTimeOnly) {
        return false;
      }
      // if (!this.__isUniformValueDirty(isVector, shaderProgram, identifier, {x, y, z, w}, delta)) {
      //   return false;
      // }
    }

    const key = semanticStr;
    let setAsMatrix = false;
    let componentNumber = info.compositionType!.getNumberOfComponents();
    if (info.compositionType === CompositionType.Mat3) {
      setAsMatrix = true;
      componentNumber = 3;
    } else if (info.compositionType === CompositionType.Mat4) {
      setAsMatrix = true;
      componentNumber = 4;
    }

    let updated = false;
    if (info.compositionType === CompositionType.Texture2D || info.compositionType === CompositionType.TextureCube) {
      if (value[0] != null && value[1] != null) {
        updated = this.setUniformValueInner(shaderProgram, key, info, setAsMatrix, componentNumber, false, { x: value[0] }, { firstTime: firstTime }, index);
      }
    } else if (index == null && (info.compositionType === CompositionType.ScalarArray || info.compositionType === CompositionType.Vec4Array || info.compositionType === CompositionType.Vec3Array || info.compositionType === CompositionType.Vec2Array)) {
      if (value.v == null) {
        updated = this.setUniformValueInner(shaderProgram, key, info, setAsMatrix, componentNumber, true, { x: value }, { firstTime: firstTime }, index);
      } else {
        updated = this.setUniformValueInner(shaderProgram, key, info, setAsMatrix, componentNumber, true, { x: value.v }, { firstTime: firstTime }, index);
      }
    } else if (info.compositionType !== CompositionType.Scalar) {
      if (value.v == null) {
        updated = this.setUniformValueInner(shaderProgram, key, info, setAsMatrix, componentNumber, false, value, { firstTime: firstTime }, index);
      } else {
        updated = this.setUniformValueInner(shaderProgram, key, info, setAsMatrix, componentNumber, true, { x: value.v }, { firstTime: firstTime }, index);
      }
    } else {
      // if CompositionType.Scalar, then...
      if (value.v == null) {
        updated = this.setUniformValueInner(shaderProgram, key, info, setAsMatrix, componentNumber, false, { x: value }, { firstTime: firstTime }, index);
      } else {
        updated = this.setUniformValueInner(shaderProgram, key, info, setAsMatrix, componentNumber, true, { x: value.v }, { firstTime: firstTime }, index);
      }
    }

    if (updated && value[0] != null && value[1] != null) {
      if (info.compositionType === CompositionType.Texture2D) {
        this.bindTexture2D(value[0], (value[1] instanceof AbstractTexture) ? value[1].cgApiResourceUid : value[1]);
      } else if (info.compositionType === CompositionType.TextureCube) {
        this.bindTextureCube(value[0], (value[1] instanceof AbstractTexture) ? value[1].cgApiResourceUid : value[1]);
      }
    }

    return updated;
  }

  setUniformValueInner(shaderProgram: WebGLProgram, semanticStr: string, info: ShaderSemanticsInfo, isMatrix: boolean, componentNumber: number,
    isVector: boolean, { x, y, z, w }: { x: number | TypedArray | Array<number> | Array<boolean> | boolean, y?: number | boolean, z?: number | boolean, w?: number | boolean }, { firstTime = true, delta }: { firstTime?: boolean, delta?: number }, index?: Count) {

    let identifier = semanticStr;
    let program;
    if (index != null) {
      program = (shaderProgram as any)[identifier][index];
    } else {
      program = (shaderProgram as any)[identifier];
    }

    const gl = this.__glw!.getRawContext();

    if (isMatrix) {
      if (componentNumber === 4) {
        gl.uniformMatrix4fv(program, false, x);
      } else {
        gl.uniformMatrix3fv(program, false, x);
      }
    } else if (isVector) {
      const componentType = info.componentType === ComponentType.Int || info.componentType === ComponentType.Short || info.componentType === ComponentType.Byte;
      if (componentNumber === 1) {
        if (componentType) {
          gl.uniform1iv(program, x);
        } else {
          gl.uniform1fv(program, x);
        }
      } else if (componentNumber === 2) {
        if (componentType) {
          gl.uniform2iv(program, x);
        } else {
          gl.uniform2fv(program, x);
        }
      } else if (componentNumber === 3) {
        if (componentType) {
          gl.uniform3iv(program, x);
        } else {
          gl.uniform3fv(program, x);
        }
      } else if (componentNumber === 4) {
        if (componentType) {
          gl.uniform4iv(program, x);
        } else {
          gl.uniform4fv(program, x);
        }
      }
    } else {
      const componentType = info.componentType === ComponentType.Int || info.componentType === ComponentType.Short || info.componentType === ComponentType.Byte;
      if (componentNumber === 1) {
        if (componentType) {
          gl.uniform1i(program, x);
        } else {
          gl.uniform1f(program, x);
        }
      } else if (componentNumber === 2) {
        if (componentType) {
          gl.uniform2i(program, x, y);
        } else {
          gl.uniform2f(program, x, y);
        }
      } else if (componentNumber === 3) {
        if (componentType) {
          gl.uniform3i(program, x, y, z);
        } else {
          gl.uniform3f(program, x, y, z);
        }
      } else if (componentNumber === 4) {
        if (componentType) {
          gl.uniform4i(program, x, y, z, w);
        } else {
          gl.uniform4f(program, x, y, z, w);
        }
      }
    }

    return true;
  }

  setVertexDataToPipeline(
    { vaoHandle, iboHandle, vboHandles }: { vaoHandle: WebGLResourceHandle, iboHandle?: WebGLResourceHandle, vboHandles: Array<WebGLResourceHandle> },
    primitive: Primitive, instanceIDBufferUid: WebGLResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid) {
    const gl = this.__glw!.getRawContext();

    const vao = this.getWebGLResource(vaoHandle) as WebGLVertexArrayObjectOES;

    // VAO bind
    this.__glw!.bindVertexArray(vao!);

    // IBO bind
    if (iboHandle != null) {
      const ibo = this.getWebGLResource(iboHandle);
      if (ibo != null) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      } else {
        throw new Error('Nothing Element Array Buffer!');
      }
    }

    // bind vertex attributes to VBO's
    vboHandles.forEach((vboHandle, i) => {
      const vbo = this.getWebGLResource(vboHandle);
      if (vbo != null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      } else {
        throw new Error('Nothing Element Array Buffer at index ' + i);
      }
      gl.enableVertexAttribArray(primitive.attributeSemantics[i].getAttributeSlot());
      gl.vertexAttribPointer(
        primitive.attributeSemantics[i].getAttributeSlot(),
        primitive.attributeCompositionTypes[i].getNumberOfComponents(),
        primitive.attributeComponentTypes[i].index,
        false,
        primitive.attributeAccessors[i].byteStride,
        primitive.attributeAccessors[i].byteOffsetInBufferView
      );
    });

    /// for InstanceIDBuffer
    if (instanceIDBufferUid !== CGAPIResourceRepository.InvalidCGAPIResourceUid) {
      const instanceIDBuffer = this.getWebGLResource(instanceIDBufferUid);
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
      this.__glw!.vertexAttribDivisor(VertexAttribute.Instance.getAttributeSlot(), 1);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.__glw!.bindVertexArray(null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }

  createTexture(data: DirectTextureData, { level, internalFormat, width, height, border, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy }:
    {
      level: Index, internalFormat: TextureParameterEnum | PixelFormatEnum, width: Size, height: Size, border: Size, format: PixelFormatEnum,
      type: ComponentTypeEnum, magFilter: TextureParameterEnum, minFilter: TextureParameterEnum, wrapS: TextureParameterEnum, wrapT: TextureParameterEnum, generateMipmap: boolean, anisotropy: boolean
    }): WebGLResourceHandle {
    const gl = this.__glw!.getRawContext();

    const texture = gl.createTexture();
    const resourceHandle = this.getResourceNumber();
    texture._resourceUid = resourceHandle;
    this.__webglResources.set(resourceHandle, texture!);

    this.__glw!.bindTexture2D(0, texture);
    if (data instanceof HTMLImageElement || data instanceof HTMLCanvasElement) {
      if (this.__glw!.isWebGL2) {
        gl.texImage2D(gl.TEXTURE_2D, level, TextureParameter.RGBA8.index, width, height, border,
          format.index, ComponentType.UnsignedByte.index, data);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat.index, format.index, type.index, data);
      }
    } else {
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat.index, width, height, border,
        format.index, type.index, data);
    }

    const isGenerateMipmap = (width === height && width !== 1 && !(this.__glw!.isWebGL2 && MiscUtil.isMobile()));

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter.index);
    if (isGenerateMipmap) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter.index);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    if (MathUtil.isPowerOfTwoTexture(width, height)) {
      if (anisotropy && this.__glw!.webgl1ExtTFA) {
        gl.texParameteri(gl.TEXTURE_2D, this.__glw!.webgl1ExtTFA!.TEXTURE_MAX_ANISOTROPY_EXT, 4);
      }
      if (isGenerateMipmap) {
        gl.generateMipmap(gl.TEXTURE_2D);
      }
    }
    this.__glw!.unbindTexture2D(0);

    return resourceHandle;
  }

  createAtfTexture(atf: any, { level, internalFormat, width, height, border, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy }:
    {
      level: Index, internalFormat: TextureParameterEnum | PixelFormatEnum, width: Size, height: Size, border: Size, format: PixelFormatEnum,
      type: ComponentTypeEnum, magFilter: TextureParameterEnum, minFilter: TextureParameterEnum, wrapS: TextureParameterEnum, wrapT: TextureParameterEnum, generateMipmap: boolean, anisotropy: boolean
    }): WebGLResourceHandle {
    const gl = this.__glw!.getRawContext();

    const texture = gl.createTexture();
    const resourceHandle = this.getResourceNumber();
    texture._resourceUid = resourceHandle;
    this.__webglResources.set(resourceHandle, texture!);

    this.__glw!.bindTexture2D(0, texture);

    let s3tc = gl.getExtension("WEBGL_compressed_texture_s3tc")
    if (s3tc) {
      gl.compressedTexImage2D(gl.TEXTURE_2D, level, s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT, atf.width, atf.height, border, atf.dataArray)
    }

    let etc1 = gl.getExtension("WEBGL_compressed_texture_etc1")
    if (etc1) {
      gl.compressedTexImage2D(gl.TEXTURE_2D, level, etc1.COMPRESSED_RGB_ETC1_WEBGL, atf.width, atf.height, border, atf.dataArray)
    }

    let pvrtc = gl.getExtension("WEBGL_compressed_texture_pvrtc") || gl.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc")
    if (pvrtc) {
      gl.compressedTexImage2D(gl.TEXTURE_2D, level, pvrtc.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG, atf.width, atf.height, border, atf.dataArray)
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    this.__glw!.unbindTexture2D(0);

    return resourceHandle;
  }

  createFrameBufferObject() {
    const gl = this.__glw!.getRawContext();
    var fbo = gl.createFramebuffer();
    const resourceHandle = this.getResourceNumber();
    this.__webglResources.set(resourceHandle, fbo!);

    return resourceHandle;
  }

  attachColorBufferToFrameBufferObject(framebuffer: FrameBuffer, index: Index, renderable: IRenderable) {
    const gl = this.__glw!.getRawContext();
    const fbo = this.getWebGLResource(framebuffer.framebufferUID)!;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    const renderableWebGLResource = this.getWebGLResource(renderable.cgApiResourceUid)!;
    const attachimentId = this.__glw!.colorAttachiment(index);
    if (renderable instanceof RenderTargetTexture) {
      (renderable as RenderTargetTexture)._fbo = framebuffer;
      gl.framebufferTexture2D(gl.FRAMEBUFFER, attachimentId, gl.TEXTURE_2D, renderableWebGLResource, 0);
    } else {
      // It's must be RenderBuffer
      (renderable as RenderBuffer)._fbo = framebuffer;
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachimentId, gl.RENDERBUFFER, renderableWebGLResource);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  attachDepthBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable) {
    this.__attachDepthOrStencilBufferToFrameBufferObject(framebuffer, renderable, 36096); // gl.DETPH_ATTACHMENT
  }

  attachStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable) {
    this.__attachDepthOrStencilBufferToFrameBufferObject(framebuffer, renderable, 36128); // gl.STENCIL_ATTACHMENT
  }

  attachDepthStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable) {
    this.__attachDepthOrStencilBufferToFrameBufferObject(framebuffer, renderable, 33306); // gl.DEPTH_STENCIL_ATTACHMENT
  }

  private __attachDepthOrStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable, attachmentType: number) {
    const gl = this.__glw!.getRawContext();
    const fbo = this.getWebGLResource(framebuffer.framebufferUID)!;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    const renderableWebGLResource = this.getWebGLResource(renderable.cgApiResourceUid)!;
    if (renderable instanceof RenderTargetTexture) {
      (renderable as RenderTargetTexture)._fbo = framebuffer;
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, renderableWebGLResource, 0);
    } else {
      // It's must be RenderBuffer
      (renderable as RenderBuffer)._fbo = framebuffer;
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachmentType, gl.RENDERBUFFER, renderableWebGLResource);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  }

  createRenderBuffer(width: Size, height: Size, internalFormat: TextureParameterEnum) {
    const gl = this.__glw!.getRawContext();
    var renderBuffer = gl.createRenderbuffer();
    const resourceHandle = this.getResourceNumber();
    this.__webglResources.set(resourceHandle, renderBuffer!);

    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl[internalFormat.str], width, height);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return resourceHandle;
  }

  setDrawTargets(framebuffer?: FrameBuffer) {
    if (framebuffer) {
      this.__glw!.drawBuffers(framebuffer.colorAttachmentsRenderBufferTargets);
    } else {
      this.__glw!.drawBuffers([RenderBufferTarget.Back]);
    }
  }

  bindFramebuffer(framebuffer?: FrameBuffer) {
    const gl = this.__glw!.getRawContext();
    if (framebuffer) {
      const fboUid = framebuffer.cgApiResourceUid;
      const fbo = this.getWebGLResource(fboUid);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }

  unbindFramebuffer() {
    const gl = this.__glw!.getRawContext();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  createRenderTargetTexture(
    { width, height, level, internalFormat, format, type, magFilter, minFilter, wrapS, wrapT }: {
      width: Size,
      height: Size,
      level: Index,
      internalFormat: TextureParameterEnum | PixelFormatEnum,
      format: PixelFormatEnum,
      type: ComponentTypeEnum,
      magFilter: TextureParameterEnum,
      minFilter: TextureParameterEnum,
      wrapS: TextureParameterEnum,
      wrapT: TextureParameterEnum
    }
  ) {
    const gl = this.__glw!.getRawContext();

    const texture = gl.createTexture();
    const resourceHandle = this.getResourceNumber();
    texture._resourceUid = resourceHandle;
    this.__webglResources.set(resourceHandle, texture!);

    this.__glw!.bindTexture2D(0, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT.index);
    if (
      // if WebGL2
      this.__glw!.isWebGL2 &&
      // if DEPTH_COMPONENT
      (internalFormat.index === 6402 || internalFormat.index === 33189 ||
        internalFormat.index === 33190 || internalFormat.index === 33191)
    ) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LESS);
    }
    if (this.__glw!.isWebGL2) {
      gl.texImage2D(gl.TEXTURE_2D, level, TextureParameter.RGBA8.index, width, height, 0,
        format.index, ComponentType.UnsignedByte.index, null);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat.index, width, height, 0, format.index, type.index, null);
    }
    this.__glw!.unbindTexture2D(0);

    return resourceHandle;
  }

  createCubeTexture(mipLevelCount: Count,
    images: Array<{
      posX: DirectTextureData, negX: DirectTextureData, posY: DirectTextureData,
      negY: DirectTextureData, posZ: DirectTextureData, negZ: DirectTextureData
    }>,
    width?: Size, height?: Size) {
    const gl = this.__glw!.getRawContext();

    const texture = gl.createTexture();
    const resourceHandle = this.getResourceNumber();
    texture._resourceUid = resourceHandle;
    this.__webglResources.set(resourceHandle, texture!);

    this.__glw!.bindTextureCube(0, texture);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (mipLevelCount >= 2) {
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    const loadImageToGPU = (image: DirectTextureData, cubemapSide: number, i: Index) => {
      if ((image as any).hdriFormat === HdriFormat.HDR) {
        gl.texImage2D(cubemapSide, i, gl.RGB, (image as any).width, (image as any).height, 0, gl.RGB, gl.FLOAT, (image as any).dataFloat);
      } else
        if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement) {
          gl.texImage2D(cubemapSide, i, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        } else {
          gl.texImage2D(cubemapSide, i, gl.RGBA, width! / (i + 1),
            height! / (i + 1), 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
        }
    }

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
  async createCubeTextureFromFiles(baseUri: string, mipLevelCount: Count, isNamePosNeg: boolean, hdriFormat: HdriFormatEnum) {
    const gl = this.__glw!.getRawContext();

    const imageArgs: Array<{
      posX: DirectTextureData, negX: DirectTextureData, posY: DirectTextureData,
      negY: DirectTextureData, posZ: DirectTextureData, negZ: DirectTextureData
    }> = [];
    let width = 0;
    let height = 0;
    for (let i = 0; i < mipLevelCount; i++) {

      const loadOneLevel = () => {
        return new Promise<HTMLImageElement[]>((resolve, reject) => {
          let loadedCount = 0;
          const images: HTMLImageElement[] = [];
          let extension = '.jpg';
          if (hdriFormat === HdriFormat.HDR) {
            extension = '.hdr';
          } else if (hdriFormat === HdriFormat.RGBE_PNG) {
            extension = '.RGBE.PNG';
          }

          let posx = '_right_';
          let negx = '_left_';
          let posy = '_top_';
          let negy = '_bottom_';
          let posz = '_front_';
          let negz = '_back_';
          if (isNamePosNeg) {
            posx = '_posx_';
            negx = '_negx_';
            posy = '_posy_';
            negy = '_negy_';
            posz = '_posz_';
            negz = '_negz_';
          }

          let faces = [
            [baseUri + posx + i + extension, gl.TEXTURE_CUBE_MAP_POSITIVE_X],
            [baseUri + negx + i + extension, gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
            [baseUri + posy + i + extension, gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
            [baseUri + negy + i + extension, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
            [baseUri + posz + i + extension, gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
            [baseUri + negz + i + extension, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]
          ];
          for (var j = 0; j < faces.length; j++) {
            const face = faces[j][1];
            let image: any;
            if (hdriFormat === HdriFormat.HDR || hdriFormat === HdriFormat.RGB9_E5_PNG) {
              image = new HDRImage();
            } else {
              image = new Image();
            }
            image.hdriFormat = hdriFormat;

            (image as any).side = face;
            (image as any).uri = faces[j][0];
            image.crossOrigin = "Anonymous";
            image.onload = () => {
              loadedCount++;
              images.push(image);
              if (loadedCount === 6) {
                resolve(images);
              }
            }
            image.onerror = () => {
              reject((image as any).uri);
            }
            image.src = faces[j][0];
          }
        });
      }

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
        posX?: DirectTextureData, negX?: DirectTextureData, posY?: DirectTextureData,
        negY?: DirectTextureData, posZ?: DirectTextureData, negZ?: DirectTextureData
      } = {};
      for (let image of images!) {
        switch ((image as any).side) {
          case gl.TEXTURE_CUBE_MAP_POSITIVE_X: imageObj.posX = image; break;
          case gl.TEXTURE_CUBE_MAP_POSITIVE_Y: imageObj.posY = image; break;
          case gl.TEXTURE_CUBE_MAP_POSITIVE_Z: imageObj.posZ = image; break;
          case gl.TEXTURE_CUBE_MAP_NEGATIVE_X: imageObj.negX = image; break;
          case gl.TEXTURE_CUBE_MAP_NEGATIVE_Y: imageObj.negY = image; break;
          case gl.TEXTURE_CUBE_MAP_NEGATIVE_Z: imageObj.negZ = image; break;
        }
        if (i === 0) {
          width = image.width;
          height = image.height;
        }
      }
      imageArgs.push(imageObj as {
        posX: DirectTextureData, negX: DirectTextureData, posY: DirectTextureData,
        negY: DirectTextureData, posZ: DirectTextureData, negZ: DirectTextureData
      });
    }

    return this.createCubeTexture(mipLevelCount, imageArgs, width, height);
  }

  createDummyBlackCubeTexture() {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==';
    const arrayBuffer = this.__createDummyTextureInner(base64);
    const typedArray = new Uint8Array(arrayBuffer);
    return this.createCubeTexture(1, [{ posX: typedArray, negX: typedArray, posY: typedArray, negY: typedArray, posZ: typedArray, negZ: typedArray }], 1, 1);
  }

  createDummyCubeTexture(rgbaStr = 'rgba(0,0,0,1)') {
    var canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = rgbaStr;
    ctx.fillRect(0, 0, 1, 1);

    return this.createCubeTexture(1, [{ posX: canvas, negX: canvas, posY: canvas, negY: canvas, posZ: canvas, negZ: canvas }], 1, 1);
  }

  async createTextureFromDataUri(dataUri: string, { level, internalFormat, border, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy }:
    {
      level: Index, internalFormat: TextureParameterEnum | PixelFormatEnum, border: Size, format: PixelFormatEnum,
      type: ComponentTypeEnum, magFilter: TextureParameterEnum, minFilter: TextureParameterEnum, wrapS: TextureParameterEnum, wrapT: TextureParameterEnum, generateMipmap: boolean, anisotropy: boolean
    }): Promise<WebGLResourceHandle> {
    return new Promise<WebGLResourceHandle>((resolve) => {
      const img = new Image();
      if (!dataUri.match(/^data:/)) {
        img.crossOrigin = 'Anonymous';
      }
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        let texture = this.createTexture(img, { level, internalFormat, width, height, border, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy });

        resolve(texture);
      };

      img.src = dataUri;
    });
  }

  updateTexture(textureUid: WebGLResourceHandle, typedArray: TypedArray, { level, width, height, format, type }:
    { level: Index, width: Size, height: Size, format: PixelFormatEnum, type: ComponentTypeEnum }) {
    const gl = this.__glw!.getRawContext();;
    const texture = this.getWebGLResource(textureUid) as WebGLTexture;

    this.__glw!.bindTexture2D(0, texture);
    gl.texSubImage2D(gl.TEXTURE_2D, level, 0, 0, width, height, format.index, type.index, typedArray);
    this.__glw!.unbindTexture2D(0);

  }

  deleteFrameBufferObject(frameBufferObjectHandle: WebGLResourceHandle) {
    const fbo = this.getWebGLResource(frameBufferObjectHandle);
    const gl = this.__glw!.getRawContext();
    if (fbo != null) {
      gl.deleteFramebuffer(fbo!);
      this.__webglResources.delete(frameBufferObjectHandle);
    }
  }

  deleteRenderBuffer(renderBufferUid: WebGLResourceHandle) {
    const gl = this.__glw!.getRawContext();

    const renderBuffer = this.getWebGLResource(renderBufferUid)!;
    gl.deleteRenderbuffer(renderBuffer)
    this.__webglResources.delete(renderBufferUid);

  }

  deleteTexture(textureHandle: WebGLResourceHandle) {
    const texture = this.getWebGLResource(textureHandle);
    const gl = this.__glw!.getRawContext();
    if (texture != null) {
      gl.deleteTexture(texture!);
      this.__webglResources.delete(textureHandle);
    }
  }

  createDummyTexture(rgbaStr: string = "rgba(255,255,255,1)") {
    var canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = rgbaStr;
    ctx.fillRect(0, 0, 1, 1);

    return this.createTexture(canvas, {
      level: 0, internalFormat: PixelFormat.RGBA, width: 1, height: 1,
      border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
      wrapS: TextureParameter.ClampToEdge, wrapT: TextureParameter.ClampToEdge, generateMipmap: false, anisotropy: false
    });
  }

  createDummyBlackTexture() {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==';
    return this.__createDummyTextureInner(base64);
  }

  createDummyWhiteTexture() {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5/hPwAIAgL/4d1j8wAAAABJRU5ErkJggg==';
    return this.__createDummyTextureInner(base64);
  }

  createDummyNormalTexture() {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOsr///HwAGgAL+v1RumAAAAABJRU5ErkJggg==';
    return this.__createDummyTextureInner(base64);
  }


  __createDummyTextureInner(base64: string) {
    const arrayBuffer = DataUtil.base64ToArrayBuffer(base64);
    return this.createTexture(new Uint8Array(arrayBuffer), {
      level: 0, internalFormat: PixelFormat.RGBA, width: 1, height: 1,
      border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
      wrapS: TextureParameter.ClampToEdge, wrapT: TextureParameter.ClampToEdge, generateMipmap: false, anisotropy: false
    });
  }

  createUniformBuffer(bufferView: TypedArray | DataView) {
    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }

    const ubo = gl.createBuffer();
    const resourceHandle = this.getResourceNumber();
    this.__webglResources.set(resourceHandle, ubo!);

    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bufferData(gl.UNIFORM_BUFFER, bufferView, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    return resourceHandle;
  }

  updateUniformBuffer(uboUid: WebGLResourceHandle, bufferView: TypedArray | DataView) {
    const gl = this.__glw!.getRawContext();
    const ubo = this.getWebGLResource(uboUid);

    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, bufferView, 0);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
  }

  bindUniformBlock(shaderProgramUid: WebGLResourceHandle, blockName: string, blockIndex: Index) {
    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }

    const shaderProgram = this.getWebGLResource(shaderProgramUid)!;

    const block = gl.getUniformBlockIndex(shaderProgram, blockName);
    gl.uniformBlockBinding(shaderProgram, block, blockIndex);

  }

  bindUniformBufferBase(blockIndex: Index, uboUid: WebGLResourceHandle) {
    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }

    const ubo = this.getWebGLResource(uboUid)!;

    gl.bindBufferBase(gl.UNIFORM_BUFFER, blockIndex, ubo);
  }

  deleteUniformBuffer(uboUid: WebGLResourceHandle) {
    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      new Error("No WebGLRenderingContext set as Default.");
    }

    const ubo = this.getWebGLResource(uboUid)!;
    this.__webglResources.delete(uboUid);

    gl.deleteBuffer(ubo);
  }

  createTransformFeedback() {
    const gl = this.__glw!.getRawContext();
    var transformFeedback = gl.createTransformFeedback();
    const resourceHandle = this.getResourceNumber();
    this.__webglResources.set(resourceHandle, transformFeedback!);

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);

    return resourceHandle;
  }

  deleteTransformFeedback(transformFeedbackUid: WebGLResourceHandle) {
    const gl = this.__glw!.getRawContext();

    const transformFeedback = this.getWebGLResource(transformFeedbackUid)!;
    gl.deleteTransformFeedback(transformFeedback);
    this.__webglResources.delete(transformFeedbackUid);
  }

  setViewport(viewport?: Vector4) {
    const gl = this.__glw!.getRawContext();
    if (viewport) {
      gl.viewport(viewport.x, viewport.y, viewport.z, viewport.w);
    } else {
      gl.viewport(0, 0, this.__glw!.width, this.__glw!.height);
    }
  }

  clearFrameBuffer(renderPass: RenderPass) {
    const gl = this.__glw!.getRawContext();
    let bufferBit = 0;
    if (renderPass.toClearColorBuffer) {
      gl.clearColor(renderPass.clearColor.x, renderPass.clearColor.y, renderPass.clearColor.z, renderPass.clearColor.w);
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
      const ibo = this.getWebGLResource(iboHandle);
      gl.deleteBuffer(ibo);
    }

    const vboHandles = vertexHandles.vboHandles;
    for (let vboHandle of vboHandles) {
      const vbo = this.getWebGLResource(vboHandle);
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
    const vbo = this.getWebGLResource(vboUid);
    gl.deleteBuffer(vbo);
  }
}
