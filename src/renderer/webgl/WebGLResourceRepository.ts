import Accessor from "../../memory/Accessor";
import CGAPIResourceRepository from "../CGAPIResourceRepository";
import Primitive from "../../geometry/Primitive";
const singleton:any = Symbol();

export default class WebGLResouceRepository extends CGAPIResourceRepository {
  static __singletonEnforcer:Symbol;
  private __webglContexts: Map<string, WebGLRenderingContext> = new Map();
  private __gl?: WebGLRenderingContext;
  private __resourceCounter: number = 0;
  private __webglResources: Map<WebGLResourceUID, WebGLObject> = new Map();

  private __extVAO?: any;

  private constructor(enforcer: Symbol) {
    super();

    if (enforcer !== WebGLResouceRepository.__singletonEnforcer || !(this instanceof WebGLResouceRepository)) {
      throw new Error('This is a Singleton class. get the instance using \'getInstance\' static method.');
    }
  }

  static getInstance() {
    const thisClass = WebGLResouceRepository;
    if (!(thisClass as any)[singleton]) {
      (thisClass as any)[singleton] = new WebGLResouceRepository(thisClass.__singletonEnforcer);
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

    const bindVertexArray = this.__getVAOFunc('bindVertexArray');

    let iboUid;
    if (primitive.hasIndices) {
      const iboUid = this.createIndexBuffer(primitive.indicesAccessor!);
    }

    const vboUids:Array<WebGLResourceUID> = [];
    primitive.attributeAccessors.forEach(accessor=>{
      const vboUid = this.createVertexBuffer(accessor);
      vboUids.push(vboUid);
    });

    bindVertexArray(gl, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return {vaoUid, iboUid, vboUids};
  }

  getWebGLResource(webglResourceUid: WebGLResourceUID): WebGLObject | undefined {
    return this.__webglResources.get(webglResourceUid)
  }
}
