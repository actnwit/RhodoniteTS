import GLSLShader, { AttributeNames as attributeNames } from "./webgl/shaders/GLSLShader";
import WebGLContextWrapper from './webgl/WebGLContextWrapper';
import WebGLResourceRepository, { VertexHandles as vertexHandles } from './webgl/WebGLResourceRepository';
import webGLStrategy from './webgl/WebGLStrategy';
import WebGLStrategyUniform from './webgl/WebGLStrategyUniform';
import GetVarsShader from './webgl/shaders/GetVarsShader';
declare const WebGL: Readonly<{
    getRenderingStrategy: (processApproach: import("./foundation/definitions/ProcessApproach").ProcessApproachEnum) => webGLStrategy;
    GLSLShader: typeof GLSLShader;
    WebGLContextWrapper: typeof WebGLContextWrapper;
    WebGLResourceRepository: typeof WebGLResourceRepository;
    WebGLStrategyUniform: typeof WebGLStrategyUniform;
    GetVarsShader: typeof GetVarsShader;
}>;
export default WebGL;
export declare type RnWebGL = typeof WebGL;
export declare type AttributeNames = attributeNames;
export declare type VertexHandles = vertexHandles;
export declare type WebGLStrategy = webGLStrategy;
