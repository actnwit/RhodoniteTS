import { CommonShaderPart } from './shaders/CommonShaderPart';
import { WebGLContextWrapper } from './WebGLContextWrapper';
import { VertexHandles as vertexHandles, WebGLResourceRepository } from './WebGLResourceRepository';
import { WebGLStrategy as webGLStrategy } from './WebGLStrategy';
import { WebGLStrategyUniform } from './WebGLStrategyUniform';
import { WebGLStrategyDataTexture } from './WebGLStrategyDataTexture';
declare const WebGL: Readonly<{
    getRenderingStrategy: (processApproach: import("..").ProcessApproachClass) => webGLStrategy;
    CommonShaderPart: typeof CommonShaderPart;
    WebGLContextWrapper: typeof WebGLContextWrapper;
    WebGLResourceRepository: typeof WebGLResourceRepository;
    WebGLStrategyUniform: typeof WebGLStrategyUniform;
    WebGLStrategyDataTexture: typeof WebGLStrategyDataTexture;
}>;
export default WebGL;
export type RnWebGL = typeof WebGL;
export type VertexHandles = vertexHandles;
export type WebGLStrategy = webGLStrategy;
