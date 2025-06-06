import getRenderingStrategy from './getRenderingStrategy';
import { CommonShaderPart } from './shaders/CommonShaderPart';
import { WebGLContextWrapper } from './WebGLContextWrapper';
import { type VertexHandles as vertexHandles, WebGLResourceRepository } from './WebGLResourceRepository';
import type { WebGLStrategy as webGLStrategy } from './WebGLStrategy';
import { WebGLStrategyUniform } from './WebGLStrategyUniform';
import { WebGLStrategyDataTexture } from './WebGLStrategyDataTexture';

const WebGL = Object.freeze({
  getRenderingStrategy,
  CommonShaderPart,
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
