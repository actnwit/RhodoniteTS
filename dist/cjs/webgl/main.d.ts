import { GLSLShader } from './shaders/GLSLShader';
import { WebGLContextWrapper } from './WebGLContextWrapper';
import { VertexHandles as vertexHandles, WebGLResourceRepository } from './WebGLResourceRepository';
import { WebGLStrategy as webGLStrategy } from './WebGLStrategy';
import { WebGLStrategyUniform } from './WebGLStrategyUniform';
import { WebGLStrategyDataTexture } from './WebGLStrategyDataTexture';
declare const WebGL: Readonly<{
    getRenderingStrategy: (processApproach: import("..").ProcessApproachClass) => webGLStrategy;
    GLSLShader: typeof GLSLShader;
    WebGLContextWrapper: typeof WebGLContextWrapper;
    WebGLResourceRepository: typeof WebGLResourceRepository;
    WebGLStrategyUniform: typeof WebGLStrategyUniform;
    WebGLStrategyDataTexture: typeof WebGLStrategyDataTexture;
}>;
export default WebGL;
export declare type RnWebGL = typeof WebGL;
export declare type VertexHandles = vertexHandles;
export declare type WebGLStrategy = webGLStrategy;