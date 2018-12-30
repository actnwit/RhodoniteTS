import Accessor from "../../memory/Accessor";
import CGAPIResourceRepository from "../CGAPIResourceRepository";
import Primitive from "../../geometry/Primitive";
import GLSLShader, {AttributeNames} from "./GLSLShader";
import { VertexAttributeEnum, VertexAttribute } from "../../definitions/VertexAttribute";
import { WebGLExtension, WebGLExtensionEnum } from "../../definitions/WebGLExtension";
import MemoryManager from "../../core/MemoryManager";
import { TextureParameterEnum } from "../../definitions/TextureParameter";
import { PixelFormatEnum } from "../../definitions/PixelFormat";
import { ComponentTypeEnum } from "../../main";
import Buffer from "../../memory/Buffer";
import { CompositionType } from "../../definitions/CompositionType";
import { ComponentType } from "../../definitions/ComponentType";
import WebGLContextWrapper from "./WebGLContextWrapper";

export type VertexHandles = {
  vaoHandle: CGAPIResourceHandle, iboHandle?: CGAPIResourceHandle, vboHandles: Array<CGAPIResourceHandle>
};

export default class WebGLResourceRepository extends CGAPIResourceRepository {
  private static __instance:WebGLResourceRepository;
  private __webglContexts: Map<string, WebGLContextWrapper> = new Map();
  private __glw?: WebGLContextWrapper;
  private __resourceCounter: number = 0;
  private __webglResources: Map<WebGLResourceHandle, WebGLObject> = new Map();

  private __extensions: Map<WebGLExtensionEnum, WebGLObject> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): WebGLResourceRepository {
    if (!this.__instance) {
      this.__instance = new WebGLResourceRepository();
    }
    return this.__instance;
  }

  addWebGLContext(gl: WebGLRenderingContext, asCurrent: boolean) {
    const glw = new WebGLContextWrapper(gl);
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
    gl.bufferData(gl.ARRAY_BUFFER, accessor.getTypedArray(), gl.STATIC_DRAW);
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

  createVertexDataResources(primitive: Primitive): {
    vaoHandle: WebGLResourceHandle, iboHandle?: WebGLResourceHandle, vboHandles: Array<WebGLResourceHandle>
  } {
    const gl = this.__glw!.getRawContext();

    const vaoHandle = this.createVertexArray();

    let iboHandle;
    if (primitive.hasIndices) {
      iboHandle = this.createIndexBuffer(primitive.indicesAccessor!);
    }

    const vboHandles:Array<WebGLResourceHandle> = [];
    primitive.attributeAccessors.forEach(accessor=>{
      const vboHandle = this.createVertexBuffer(accessor);
      vboHandles.push(vboHandle);
    });

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return {vaoHandle, iboHandle, vboHandles};
  }

  createShaderProgram(vertexShaderStr:string, fragmentShaderStr:string, attributeNames: AttributeNames, attributeSemantics: Array<VertexAttributeEnum>) {
    const gl = this.__glw!.getRawContext();

    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;

    gl.shaderSource(vertexShader, vertexShaderStr);
    gl.shaderSource(fragmentShader, fragmentShaderStr);

    gl.compileShader(vertexShader);
    this.__checkShaderCompileStatus(vertexShader, vertexShaderStr);

    gl.compileShader(fragmentShader);
    this.__checkShaderCompileStatus(fragmentShader, fragmentShaderStr);

    const shaderProgram = gl.createProgram()!;
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);

    attributeNames.forEach((attributeName, i)=>{
      gl.bindAttribLocation(shaderProgram, attributeSemantics[i].getAttributeSlot(), attributeName)
    });

    gl.linkProgram(shaderProgram);

    const resourceHandle = this.getResourceNumber();
    this.__webglResources.set(resourceHandle, shaderProgram);


    this.__checkShaderProgramLinkStatus(shaderProgram);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

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
    const gl = this.__glw!.getRawContext();;

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log(this.__addLineNumber(shaderText));
      throw new Error('An error occurred compiling the shaders:' + gl.getShaderInfoLog(shader));
    }
  }

  private __checkShaderProgramLinkStatus(shaderProgram: WebGLProgram) {
    const gl = this.__glw!.getRawContext();;

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    }
  }

  setVertexDataToPipeline(
    {vaoHandle, iboHandle, vboHandles} : {vaoHandle: WebGLResourceHandle, iboHandle?: WebGLResourceHandle, vboHandles: Array<WebGLResourceHandle>},
    primitive: Primitive, instanceIDBufferUid: WebGLResourceHandle = 0)
  {
    const gl = this.__glw!.getRawContext();;

    const vao = this.getWebGLResource(vaoHandle);

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
        0
        );
    });

    /// for InstanceIDBuffer
    if (instanceIDBufferUid !== 0) {
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

    if (vao == null) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
  }

  createTexture(typedArray: TypedArray, {level, internalFormat, width, height, border, format, type, magFilter, minFilter, wrapS, wrapT}:
    {level:Index, internalFormat:TextureParameterEnum|PixelFormatEnum, width:Size, height:Size, border:Size, format:PixelFormatEnum,
      type:ComponentTypeEnum, magFilter:TextureParameterEnum, minFilter:TextureParameterEnum, wrapS:TextureParameterEnum, wrapT:TextureParameterEnum}) {
    const gl = this.__glw!.getRawContext();;

    const dataTexture = gl.createTexture();

    const resourceHandle = this.getResourceNumber();
    this.__webglResources.set(resourceHandle, dataTexture!);

    gl.bindTexture(gl.TEXTURE_2D, dataTexture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat.index, width, height, border,
                  format.index, type.index, typedArray);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS.index);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT.index);

    return resourceHandle;
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
}
