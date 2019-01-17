import { WebGLExtensionEnum } from "./WebGLExtension";
export default class WebGLContextWrapper {
    __gl: WebGLRenderingContext | any;
    __webglVersion: number;
    __webgl1ExtVAO?: WebGLObject | any;
    __webgl1ExtIA?: WebGLObject | any;
    __webgl1ExtTF?: WebGLObject | any;
    __webgl1ExtTHF?: WebGLObject | any;
    __webgl1ExtTFL?: WebGLObject | any;
    __webgl1ExtTHFL?: WebGLObject | any;
    __extensions: Map<WebGLExtensionEnum, WebGLObject>;
    constructor(gl: WebGLRenderingContext);
    getRawContext(): WebGLRenderingContext | any;
    isSupportWebGL1Extension(webGLExtension: WebGLExtensionEnum): boolean;
    readonly isWebGL2: boolean;
    createVertexArray(): any;
    bindVertexArray(vao: WebGLObject | null): void;
    vertexAttribDivisor(index: number, divisor: number): void;
    drawElementsInstanced(primitiveMode: number, indexCount: number, type: number, offset: number, instanceCount: number): void;
    private __getExtension;
}
