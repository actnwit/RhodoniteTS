import Accessor from "../foundation/memory/Accessor";
import CGAPIResourceRepository from "../foundation/renderer/CGAPIResourceRepository";
import Primitive from "../foundation/geometry/Primitive";
import GLSLShader, {AttributeNames} from "./GLSLShader";
import { VertexAttributeEnum, VertexAttribute } from "../foundation/definitions/VertexAttribute";
import { TextureParameterEnum, TextureParameter } from "../foundation/definitions/TextureParameter";
import { PixelFormatEnum, PixelFormat } from "../foundation/definitions/PixelFormat";
import { ComponentTypeEnum } from "../foundation/definitions/ComponentType";
import { CompositionType } from "../foundation/definitions/CompositionType";
import { ComponentType } from "../foundation/definitions/ComponentType";
import WebGLContextWrapper from "./WebGLContextWrapper";
import { MathUtil } from "../foundation/math/MathUtil"
import Component from "../foundation/core/Component";
import { ShaderSemanticsEnum } from "../foundation/definitions/ShaderSemantics";

export type VertexHandles = {
  vaoHandle: CGAPIResourceHandle,
  iboHandle?: CGAPIResourceHandle,
  vboHandles: Array<CGAPIResourceHandle>,
  setComplete: boolean;
};

export default class WebGLResourceRepository extends CGAPIResourceRepository {
  private static __instance:WebGLResourceRepository;
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

  addWebGLContext(gl: WebGLRenderingContext, width: Size, height: Size, asCurrent: boolean) {
    const glw = new WebGLContextWrapper(gl, width, height);
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

  getWebGLResource(WebGLResourceHandle: WebGLResourceHandle): WebGLObject | undefined {
    return this.__webglResources.get(WebGLResourceHandle)
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

  createVertexDataResources(primitive: Primitive): VertexHandles
   {
    const gl = this.__glw!.getRawContext();

    const vaoHandle = this.createVertexArray();

    let iboHandle;
    if (primitive.hasIndices()) {
      iboHandle = this.createIndexBuffer(primitive.indicesAccessor!);
    }

    const vboHandles:Array<WebGLResourceHandle> = [];
    primitive.attributeAccessors.forEach(accessor=>{
      const vboHandle = this.createVertexBuffer(accessor);
      vboHandles.push(vboHandle);
    });

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return {vaoHandle: vaoHandle, iboHandle: iboHandle, vboHandles: vboHandles, setComplete: false};
  }

  createShaderProgram({vertexShaderStr, fragmentShaderStr, attributeNames, attributeSemantics}:
    {vertexShaderStr:string, fragmentShaderStr?:string, attributeNames: AttributeNames, attributeSemantics: Array<VertexAttributeEnum>}) {

    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;

    gl.shaderSource(vertexShader, vertexShaderStr);

    gl.compileShader(vertexShader);
    this.__checkShaderCompileStatus(vertexShader, vertexShaderStr);

    const shaderProgram = gl.createProgram()!;
    gl.attachShader(shaderProgram, vertexShader);

    let fragmentShader;
    if (fragmentShaderStr != null) {
      fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(fragmentShader, fragmentShaderStr);
      gl.compileShader(fragmentShader);
      this.__checkShaderCompileStatus(fragmentShader, fragmentShaderStr);
      gl.attachShader(shaderProgram, fragmentShader);
    }


    attributeNames.forEach((attributeName, i)=>{
      gl.bindAttribLocation(shaderProgram, attributeSemantics[i].getAttributeSlot(), attributeName)
    });

    gl.linkProgram(shaderProgram);

    const resourceHandle = this.getResourceNumber();
    this.__webglResources.set(resourceHandle, shaderProgram);


    this.__checkShaderProgramLinkStatus(shaderProgram);

    gl.deleteShader(vertexShader);

    if (fragmentShaderStr != null) {
      gl.deleteShader(fragmentShader);
    }

    return resourceHandle;
  }

  private __addLineNumber(shaderString: string) {
    let shaderTextLines = shaderString.split(/\r\n|\r|\n/);
    let shaderTextWithLineNumber = '';
    for (let i=0; i<shaderTextLines.length; i++) {
      let lineIndex = i+1;
      let splitter = ' : ';
      if (lineIndex<10) {
        splitter = '  : ';
      } else if (lineIndex>=100) {
        splitter = ': ';
      }
      shaderTextWithLineNumber += lineIndex + splitter + shaderTextLines[i] + '\n';
    }

    return shaderTextWithLineNumber;
  }

  private __checkShaderCompileStatus(shader: WebGLShader, shaderText: string) {
    const gl = this.__glw!.getRawContext();

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log(this.__addLineNumber(shaderText));
      throw new Error('An error occurred compiling the shaders:' + gl.getShaderInfoLog(shader));
    }
  }

  private __checkShaderProgramLinkStatus(shaderProgram: WebGLProgram) {
    const gl = this.__glw!.getRawContext();

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    }
  }

  setupUniformLocations(shaderProgramUid:WebGLResourceHandle, dataArray: Array<{semantic?: ShaderSemanticsEnum, isPlural?: boolean, prefix? :string, semanticStr?: string, index?: Count}>) {
    const gl = this.__glw!.getRawContext();
    const shaderProgram = this.getWebGLResource(shaderProgramUid) as any;

    for (let data of dataArray) {
      let prefix = '';
      if (data.prefix != null) {
        prefix = data.prefix;
      }
      let semanticSingular: string;
      let semanticPlural: string;
      if (data.semantic) {
        semanticSingular = data.semantic.singularStr;
        semanticPlural = data.semantic.pluralStr;
      } else {
        semanticSingular = data.semanticStr!;
        semanticPlural = data.semanticStr!;
      }

      let identifier = semanticSingular;
      if (data.index != null) {
        identifier += '_' + data.index;
      }

      if (data.isPlural) {
        shaderProgram[identifier] = gl.getUniformLocation(shaderProgram, 'u_'+prefix+semanticPlural);
      } else {
        shaderProgram[identifier] = gl.getUniformLocation(shaderProgram, 'u_'+prefix+semanticSingular);
      }
    }
  }

  setUniformValue(shaderProgramUid:WebGLResourceHandle, uniformSemantic: ShaderSemanticsEnum|string, isMatrix: boolean, componentNumber: number,
    componentType: string, isVector: boolean, {x, y, z, w}: {x: number|TypedArray|Array<number>, y?: number, z?: number, w?: number}, index?: Count) {
    const gl = this.__glw!.getRawContext();
    const shaderProgram = this.getWebGLResource(shaderProgramUid) as any;
    let funcName = 'uniform';
    if (isMatrix) {
      funcName = 'uniformMatrix';
    }
    funcName += componentNumber;
    funcName += componentType;
    if (isVector) {
      funcName += 'v';
    }

    const args = [];
    let identifier = (typeof uniformSemantic === 'string') ? uniformSemantic : uniformSemantic.str;
    if (index != null) {
      identifier += '_' + index;
    }
    args.push(shaderProgram[identifier]);
    if (isMatrix) {
      args.push(false);
    }
    args.push(x);
    if (y != null) {
      args.push(y);
    }
    if (z != null) {
      args.push(z);
    }
    if (w != null) {
      args.push(w);
    }
    gl[funcName].apply(gl, args);
  }

  setVertexDataToPipeline(
    {vaoHandle, iboHandle, vboHandles} : {vaoHandle: WebGLResourceHandle, iboHandle?: WebGLResourceHandle, vboHandles: Array<WebGLResourceHandle>},
    primitive: Primitive, instanceIDBufferUid: WebGLResourceHandle = CGAPIResourceRepository.InvalidCGAPIResourceUid)
  {
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
    vboHandles.forEach((vboHandle, i)=>{
      const vbo = this.getWebGLResource(vboHandle);
      if (vbo != null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      } else {
        throw new Error('Nothing Element Array Buffer at index '+ i);
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

  createTexture(data: TypedArray|HTMLImageElement|HTMLCanvasElement, {level, internalFormat, width, height, border, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy}:
    {level:Index, internalFormat:TextureParameterEnum|PixelFormatEnum, width:Size, height:Size, border:Size, format:PixelFormatEnum,
      type:ComponentTypeEnum, magFilter:TextureParameterEnum, minFilter:TextureParameterEnum, wrapS:TextureParameterEnum, wrapT:TextureParameterEnum, generateMipmap: boolean, anisotropy: boolean}): WebGLResourceHandle {
    const gl = this.__glw!.getRawContext();;

    const dataTexture = gl.createTexture();

    const resourceHandle = this.getResourceNumber();
    this.__webglResources.set(resourceHandle, dataTexture!);

    gl.bindTexture(gl.TEXTURE_2D, dataTexture);
    if (data instanceof HTMLImageElement || data instanceof HTMLCanvasElement) {
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat.index,
        format.index, type.index, data);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat.index, width, height, border,
                  format.index, type.index, data);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter.index);
    if (MathUtil.isPowerOfTwoTexture(width, height)) {
      if (anisotropy && this.__glw!.webgl1ExtTFA) {
        gl.texParameteri(gl.TEXTURE_2D, this.__glw!.webgl1ExtTFA!.TEXTURE_MAX_ANISOTROPY_EXT, 4);
      }
      if (generateMipmap) {
        gl.generateMipmap(gl.TEXTURE_2D);
      }
    }
    return resourceHandle;
  }

  async createTextureFromDataUri(dataUri: string, {level, internalFormat, border, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy}:
    {level:Index, internalFormat:TextureParameterEnum|PixelFormatEnum, border:Size, format:PixelFormatEnum,
      type:ComponentTypeEnum, magFilter:TextureParameterEnum, minFilter:TextureParameterEnum, wrapS:TextureParameterEnum, wrapT:TextureParameterEnum, generateMipmap: boolean, anisotropy: boolean}): Promise<WebGLResourceHandle> {
    return new Promise<WebGLResourceHandle>((resolve)=> {
      const img = new Image();
      if (!dataUri.match(/^data:/)) {
        img.crossOrigin = 'Anonymous';
      }
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        let texture = this.createTexture(img, {level, internalFormat, width, height, border, format, type, magFilter, minFilter, wrapS, wrapT, generateMipmap, anisotropy});

        resolve(texture);
      };

      img.src = dataUri;
    });
  }

  updateTexture(textureUid: WebGLResourceHandle, typedArray: TypedArray, {level, width, height, format, type}:
    {level:Index, width:Size, height:Size, format:PixelFormatEnum, type:ComponentTypeEnum}) {
    const gl = this.__glw!.getRawContext();;
    const texture = this.getWebGLResource(textureUid);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texSubImage2D(gl.TEXTURE_2D, level, 0, 0, width, height, format.index, type.index, typedArray);

  }

  deleteTexture(textureHandle: WebGLResourceHandle) {
    const texture = this.getWebGLResource(textureHandle);
    const gl = this.__glw!.getRawContext();
    if (texture != null) {
      gl.deleteTexture(texture!);
      this.__webglResources.delete(textureHandle);
    }
  }

  createDummyTexture() {
    var canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.fillRect( 0, 0, 1, 1 );

    return this.createTexture(canvas, {
      level: 0, internalFormat: PixelFormat.RGBA, width: 1, height: 1,
        border: 0, format: PixelFormat.RGBA, type: ComponentType.Float, magFilter: TextureParameter.Nearest, minFilter: TextureParameter.Nearest,
        wrapS: TextureParameter.ClampToEdge, wrapT: TextureParameter.ClampToEdge, generateMipmap: false, anisotropy: false});
  }

  createUniformBuffer(bufferView: TypedArray| DataView) {
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
    void gl.bufferSubData(gl.UNIFORM_BUFFER, 0, bufferView, 0);
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

  }
}
