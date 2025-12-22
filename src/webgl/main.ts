import { WebGLContextWrapper } from './WebGLContextWrapper';
import { WebGLResourceRepository, type VertexHandles as vertexHandles } from './WebGLResourceRepository';
import type { WebGLStrategy as webGLStrategy } from './WebGLStrategy';
import { WebGLStrategyDataTexture } from './WebGLStrategyDataTexture';
import { WebGLStrategyUniform } from './WebGLStrategyUniform';
import getRenderingStrategy from './getRenderingStrategy';
import { StandardShaderPart } from './shaders/StandardShaderPart';

const WebGL = Object.freeze({
  getRenderingStrategy,
  StandardShaderPart,
  WebGLContextWrapper,
  WebGLResourceRepository,
  WebGLStrategyUniform,
  WebGLStrategyDataTexture,
});
export default WebGL;

export type RnWebGL = typeof WebGL;
const globalObj = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
(globalObj as unknown as { RnWebGL: RnWebGL }).RnWebGL = WebGL;

export type VertexHandles = vertexHandles;
export type WebGLStrategy = webGLStrategy;
