import getRenderingStrategy from './getRenderingStrategy';
import { StandardShaderPart } from './shaders/StandardShaderPart';
import { WebGLContextWrapper } from './WebGLContextWrapper';
import { type VertexHandles as vertexHandles, WebGLResourceRepository } from './WebGLResourceRepository';
import type { WebGLStrategy as webGLStrategy } from './WebGLStrategy';
import { WebGLStrategyWebGL2 } from './WebGLStrategyWebGL2';

const WebGL = Object.freeze({
  getRenderingStrategy,
  StandardShaderPart,
  WebGLContextWrapper,
  WebGLResourceRepository,
  WebGLStrategyWebGL2,
});
export default WebGL;

export type RnWebGL = typeof WebGL;
const globalObj = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this;
(globalObj as unknown as { RnWebGL: RnWebGL }).RnWebGL = WebGL;

export type VertexHandles = vertexHandles;
export type WebGLStrategy = webGLStrategy;
