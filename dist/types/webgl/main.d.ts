import GLSLShader, { AttributeNames } from "./shaders/GLSLShader";
import WebGLContextWrapper from './WebGLContextWrapper';
import WebGLResourceRepository, { VertexHandles } from './WebGLResourceRepository';
import WebGLStrategy from './WebGLStrategy';
import WebGLStrategyUniform from './WebGLStrategyUniform';
declare const WebGL: Readonly<{
    getRenderingStrategy: (processApproach: import("../foundation/definitions/ProcessApproach").ProcessApproachEnum) => WebGLStrategy;
    GLSLShader: typeof GLSLShader;
    WebGLContextWrapper: typeof WebGLContextWrapper;
    WebGLResourceRepository: typeof WebGLResourceRepository;
    WebGLStrategyUniform: typeof WebGLStrategyUniform;
}>;
export default WebGL;
export declare type RnWebGL = typeof WebGL;
export declare type AttributeNames = AttributeNames;
export declare type VertexHandles = VertexHandles;
export declare type WebGLStrategy = WebGLStrategy;
