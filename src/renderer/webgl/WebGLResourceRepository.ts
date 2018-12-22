import Accessor from "../../memory/Accessor";
import CGAPIResourceRepository from "../CGAPIResourceRepository";
import Primitive from "../../geometry/Primitive";
import GLSLShader, {AttributeNames} from "./GLSLShader";
import { VertexAttributeEnum } from "../../definitions/VertexAttribute";
import { WebGLExtension, WebGLExtensionEnum } from "../../definitions/WebGLExtension";
const singleton:any = Symbol();

export default class WebGLResourceRepository extends CGAPIResourceRepository {
  static __singletonEnforcer:Symbol;
  private __webglContexts: Map<string, WebGLRenderingContext> = new Map();
  private __gl?: WebGLRenderingContext;
  private __resourceCounter: number = 0;
  private __webglResources: Map<WebGLResourceHandle, WebGLObject> = new Map();

  private __extensions: Map<WebGLExtensionEnum, WebGLObject> = new Map();

  private constructor(enforcer: Symbol) {
    super();

    if (enforcer !== WebGLResourceRepository.__singletonEnforcer || !(this instanceof WebGLResourceRepository)) {
      throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
    }
  }

  static getInstance() {
    const thisClass = WebGLResourceRepository;
    if (!(thisClass as any)[singleton]) {
      (thisClass as any)[singleton] = new WebGLResourceRepository(thisClass.__singletonEnforcer);
    }
    return (thisClass as any)[singleton];
  }

  addWebGLContext(webglContext: WebGLRenderingContext, asCurrent: boolean) {
    this.__webglContexts.set('default', webglContext);
    if (asCurrent) {
      this.__gl = webglContext;
    }
  }

  get currentWebGLContext() {
    return this.__gl;
  }

  private getResourceNumber(): WebGLResourceHandle {
    return ++this.__resourceCounter;
  }

  getWebGLResource(WebGLResourceHandle: WebGLResourceHandle): WebGLObject | undefined {
    return this.__webglResources.get(WebGLResourceHandle)
  }

  createIndexBuffer(accsessor: Accessor) {
    const gl = this.__gl;

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

  createVertexBuffer(accsessor: Accessor) {
    const gl = this.__gl;

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

  getExtension(extension: WebGLExtensionEnum) {
    const gl: any = this.__gl;
    if (this.__extensions.has(extension)) {

      const extObj = gl.getExtension(extension.toString());
      if (extObj == null) {
        throw new Error(`The library does not support this environment because the ${extension.toString()} is not available`);
      }
      this.__extensions.set(extension, extObj);
      return extObj;
    }
    return null;
  }

　createVertexArray() {
    const gl = this.__gl;

    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }

    const extVAO = this.getExtension(WebGLExtension.VertexArrayObject);
    const vao = extVAO.createVertexArrayOES();

    const resourceHandle = this.getResourceNumber();
    this.__webglResources.set(resourceHandle, vao);

    return resourceHandle;
  }

  createVertexDataResources(primitive: Primitive): {
    vaoHandle: WebGLResourceHandle, iboHandle?: WebGLResourceHandle, vboHandles: Array<WebGLResourceHandle>
  } {
    const gl = this.__gl!;

    const vaoHandle = this.createVertexArray();

    let iboHandle;
    if (primitive.hasIndices) {
      const iboHandle = this.createIndexBuffer(primitive.indicesAccessor!);
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
    const gl = this.__gl;

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
    const gl = this.__gl!;

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error('An error occurred compiling the shaders:' + gl.getShaderInfoLog(shader));
    }
  }

  private __checkShaderProgramLinkStatus(shaderProgram: WebGLProgram) {
    const gl = this.__gl!;

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      throw new Error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    }
  }

  setVertexDataToShaderProgram(
    {vaoHandle, iboHandle, vboHandles} : {vaoHandle: WebGLResourceHandle, iboHandle?: WebGLResourceHandle, vboHandles: Array<WebGLResourceHandle>},
    shaderProgramHandle: WebGLResourceHandle,
    primitive: Primitive)
  {
    const gl = this.__gl!;

    const vao = this.getWebGLResource(vaoHandle);
    const extVAO = this.getExtension(WebGLExtension.VertexArrayObject);

    extVAO.bindVertexArray(vao);

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
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    extVAO.bindVertexArray(null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }
}
