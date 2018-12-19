import Accessor from "../../memory/Accessor";
import CGAPIResourceRepository from "../CGAPIResourceRepository";
import Primitive from "../../geometry/Primitive";
import GLSLShader, {AttributeNames} from "./GLSLShader";
import { VertexAttributeEnum } from "../../definitions/VertexAttribute";
const singleton:any = Symbol();

export default class WebGLResourceRepository extends CGAPIResourceRepository {
  static __singletonEnforcer:Symbol;
  private __webglContexts: Map<string, WebGLRenderingContext> = new Map();
  private __gl?: WebGLRenderingContext;
  private __resourceCounter: number = 0;
  private __webglResources: Map<WebGLResourceUID, WebGLObject> = new Map();

  private __extVAO?: any;

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

  addWebGLContext(webglContext: WebGLRenderingContext, asDefault: boolean) {
    this.__webglContexts.set('default', webglContext);
    if (asDefault) {
      this.__gl = webglContext;
    }
  }

  private getResourceNumber(): WebGLResourceUID {
    return ++this.__resourceCounter;
  }

  getWebGLResource(webglResourceUid: WebGLResourceUID): WebGLObject | undefined {
    return this.__webglResources.get(webglResourceUid)
  }

  createIndexBuffer(accsessor: Accessor) {
    const gl = this.__gl;

    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }

    const ibo = gl.createBuffer();
    const resourceUid = this.getResourceNumber();
    this.__webglResources.set(resourceUid, ibo!);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, accsessor.getTypedArray(), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return resourceUid;
  }

  createVertexBuffer(accsessor: Accessor) {
    const gl = this.__gl;

    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }

    const vbo = gl.createBuffer();
    const resourceUid = this.getResourceNumber();
    this.__webglResources.set(resourceUid, vbo!);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, accsessor.dataViewOfBufferView, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return resourceUid;

  }

  private __getVAOFunc(functionName: string) {
    const gl: any = this.__gl;
    if (gl[functionName] != null) {
      return gl[functionName];
    }
    if (this.__extVAO == null) {
      this.__extVAO = gl.getExtension('OES_vertex_array_object');

      if (this.__extVAO == null) {
        throw new Error('The library does not support this environment because the OES_vertex_array_object is not available');
      }
    }

    return this.__extVAO[functionName];
  }

　createVertexArray() {
    const gl = this.__gl;

    if (gl == null) {
      throw new Error("No WebGLRenderingContext set as Default.");
    }

    const createVertexArray = this.__getVAOFunc('createVertexArray');
    const vao = createVertexArray();

    const resourceUid = this.getResourceNumber();
    this.__webglResources.set(resourceUid, vao);

    return resourceUid;
  }

  createVertexDataResources(primitive: Primitive) {
    const gl = this.__gl!;

    const vaoUid = this.createVertexArray();

    let iboUid;
    if (primitive.hasIndices) {
      const iboUid = this.createIndexBuffer(primitive.indicesAccessor!);
    }

    const vboUids:Array<WebGLResourceUID> = [];
    primitive.attributeAccessors.forEach(accessor=>{
      const vboUid = this.createVertexBuffer(accessor);
      vboUids.push(vboUid);
    });

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return {vaoUid, iboUid, vboUids};
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

    const resourceUid = this.getResourceNumber();
    this.__webglResources.set(resourceUid, shaderProgram);


    this.__checkShaderProgramLinkStatus(shaderProgram);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return resourceUid;
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
    {vaoUid, iboUid, vboUids} : {vaoUid: WebGLResourceUID, iboUid?: WebGLResourceUID, vboUids: Array<WebGLResourceUID>},
    shaderProgramUid: WebGLResourceUID,
    primitive: Primitive)
  {
    const gl = this.__gl!;

    const vao = this.getWebGLResource(vaoUid);
    const bindVertexArray = this.__getVAOFunc('bindVertexArray');

    bindVertexArray(vao);

    if (iboUid != null) {
      const ibo = this.getWebGLResource(iboUid);
      if (ibo != null) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      } else {
        throw new Error('Nothing Element Array Buffer!');
      }
    }

    const shaderProgram = this.getWebGLResource(shaderProgramUid);
    if (shaderProgram == null) {
      throw new Error('Nothing ShaderProgram!');
    }
    vboUids.forEach((vboUid, i)=>{
      const vbo = this.getWebGLResource(vboUid);
      if (vbo != null) {
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      } else {
        throw new Error('Nothing Element Array Buffer at index '+ i);
      }
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
    bindVertexArray(null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  }
}
