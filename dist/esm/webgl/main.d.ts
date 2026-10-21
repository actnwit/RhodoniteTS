import getRenderingStrategy from './getRenderingStrategy';
import { StandardShaderPart } from './shaders/StandardShaderPart';
import { WebGLContextWrapper } from './WebGLContextWrapper';
import { type VertexHandles as vertexHandles, WebGLResourceRepository } from './WebGLResourceRepository';
import type { WebGLStrategy as webGLStrategy } from './WebGLStrategy';
import { WebGLStrategyDataTexture } from './WebGLStrategyDataTexture';
import { WebGLStrategyUniform } from './WebGLStrategyUniform';
declare const WebGL: Readonly<{
    getRenderingStrategy: typeof getRenderingStrategy;
    StandardShaderPart: typeof StandardShaderPart;
    WebGLContextWrapper: typeof WebGLContextWrapper;
    WebGLResourceRepository: typeof WebGLResourceRepository;
    WebGLStrategyUniform: typeof WebGLStrategyUniform;
    WebGLStrategyDataTexture: typeof WebGLStrategyDataTexture;
}>;
export default WebGL;
export type RnWebGL = typeof WebGL;
export type VertexHandles = vertexHandles;
export type WebGLStrategy = webGLStrategy;
