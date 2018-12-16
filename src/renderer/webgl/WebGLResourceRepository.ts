import Renderer from "../Renderer";
import Accessor from "../../memory/Accessor";
const singleton:any = Symbol();

export default class WebGLResouceRepository extends Renderer {
  static __singletonEnforcer:Symbol;
  private __webglContexts: Map<string, WebGLRenderingContext> = new Map();
  private __gl?: WebGLRenderingContext;
  private __resourceCounter: number = 0;
  private __webglResources: Map<WebGLResourceUID, WebGLObject> = new Map();

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

    const ibo = gl.createBuffer();
    const resourceUid = this.getResourceNumber();
    this.__webglResources.set(resourceUid, ibo!);

    gl.bindBuffer(gl.ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ARRAY_BUFFER, accsessor.dataViewOfBufferView, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return resourceUid;

  }

  getWebGLResource(webglResourceUid: WebGLResourceUID): WebGLObject | undefined {
    return this.__webglResources.get(webglResourceUid)
  }
}
