import GLSLShader, { AttributeNames as attributeNames } from "./shaders/GLSLShader";
import WebGLContextWrapper from './WebGLContextWrapper';
import WebGLResourceRepository, { VertexHandles as vertexHandles } from './WebGLResourceRepository';
import webGLStrategy from './WebGLStrategy';
import WebGLStrategyUniform from './WebGLStrategyUniform';
declare const WebGL: Readonly<{
    getRenderingStrategy: (processApproach: import("../foundation/definitions/ProcessApproach").ProcessApproachEnum) => webGLStrategy;
    GLSLShader: typeof GLSLShader;
    WebGLContextWrapper: typeof WebGLContextWrapper;
    WebGLResourceRepository: typeof WebGLResourceRepository;
    WebGLStrategyUniform: typeof WebGLStrategyUniform;
}>;
export default WebGL;
export declare type RnWebGL = typeof WebGL;
export declare type AttributeNames = attributeNames;
export declare type VertexHandles = vertexHandles;
export declare type WebGLStrategy = webGLStrategy;
