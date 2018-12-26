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
const singleton:any = Symbol();

export default class WebGLResourceRepository extends CGAPIResourceRepository {
  static __singletonEnforcer:Symbol;
  private __webglContexts: Map<string, WebGLContextWrapper> = new Map();
  private __glw?: WebGLContextWrapper;
  private __resourceCounter: number = 0;
  private __webglResources: Map<WebGLResourceHandle, WebGLObject> = new Map();

  private __extensions: Map<WebGLExtensionEnum, WebGLObject> = new Map();

  private constructor(enforcer: Symbol) {
    super();

    if (enforcer !== WebGLResourceRepository.__singletonEnforcer || !(this instanceof WebGLResourceRepository)) {
      throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
    }
  }

  static getInstance(): WebGLResourceRepository {
    const thisClass = WebGLResourceRepository;
    if (!(thisClass as any)[singleton]) {
      (thisClass as any)[singleton] = new WebGLResourceRepository(thisClass.__singletonEnforcer);
    }
    return (thisClass as any)[singleton];
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
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, accsessor.dataViewOfBufferView, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return resourceHandle;
  }

  createVertexBuffer(accsessor: Accessor) {
    const gl = this.__glw!.getRawContext();;

    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }

    const vbo = gl.createBuffer();
    const resourceHandle = this.getResourceNumber();
    this.__webglResources.set(resourceHandle, vbo!);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, accsessor.dataViewOfBufferView, gl.STATIC_DRAW);
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
    this.__checkShaderCompileStatus(vertexShader);

    gl.compileShader(fragmentShader);
    this.__checkShaderCompileStatus(fragmentShader);

    const shaderProgram = gl.createProgram()!;
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);

    attributeNames.forEach((attributeName, i)=>{
      gl.bindAttribLocation(shaderProgram, attributeSemantics[i].index, attributeName)
    });

    gl.linkProgram(shaderProgram);

    const resourceHandle = this.getResourceNumber();
    this.__webglResources.set(resourceHandle, shaderProgram);


    this.__checkShaderProgramLinkStatus(shaderProgram);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return resourceHandle;
  }

  private __checkShaderCompileStatus(shader: WebGLShader) {
    const gl = this.__glw!.getRawContext();;

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
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

  setVertexDataToShaderProgram(
    {vaoHandle, iboHandle, vboHandles} : {vaoHandle: WebGLResourceHandle, iboHandle?: WebGLResourceHandle, vboHandles: Array<WebGLResourceHandle>},
    shaderProgramHandle: WebGLResourceHandle,
    primitive: Primitive, instanceIDBufferUid: WebGLResourceHandle = 0)
  {
    const gl = this.__glw!.getRawContext();;

    const vao = this.getWebGLResource(vaoHandle);

    this.__glw!.bindVertexArray(vao!);

    if (iboHandle != null) {
      const ibo = this.getWebGLResource(iboHandle);
      if (ibo != null) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      } else {
        throw new Error('Nothing Element Array Buffer!');
      }
    }

    const shaderProgram = this.getWebGLResource(shaderProgramHandle);
    if (shaderProgram == null) {
      throw new Error('Nothing ShaderProgram!');
    }
    vboHandles.forEach((vboHandle, i)=>{
      const vbo = this.getWebGLResource(vboHandle);
      if (vbo != null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      } else {
        throw new Error('Nothing Element Array Buffer at index '+ i);
      }
      gl.enableVertexAttribArray(primitive.attributeSemantics[i].index);
      gl.vertexAttribPointer(
        primitive.attributeSemantics[i].index,
        primitive.attributeCompositionTypes[i].getNumberOfComponents(),
        primitive.attributeComponentTypes[i].index,
        false,
        primitive.attributeAccessors[i].byteStride,
        0
        );
    });

    // for InstanceIDBuffer
    if (instanceIDBufferUid !== 0) {
      const instanceIDBuffer = this.getWebGLResource(instanceIDBufferUid);
      if (instanceIDBuffer != null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceIDBuffer);
      } else {
        throw new Error('Nothing Element Array Buffer at index');
      }
      gl.enableVertexAttribArray(VertexAttribute.Instance.index);
      gl.vertexAttribPointer(
        VertexAttribute.Instance.index,
        CompositionType.Scalar.getNumberOfComponents(),
        ComponentType.Float.index,
        false,
        0,
        0
        );
      this.__glw!.vertexAttribDivisor(VertexAttribute.Instance.index, 1);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.__glw!.bindVertexArray(null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
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

  deleteTexture(textureHandle: WebGLResourceHandle) {
    const texture = this.getWebGLResource(textureHandle);
    const gl = this.__glw!.getRawContext();;
    if (texture != null) {
      gl.deleteTexture(texture!);
      this.__webglResources.delete(textureHandle);
    }
  }
}
