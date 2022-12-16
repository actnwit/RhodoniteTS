import getRenderingStrategy from './getRenderingStrategy';
import { GLSLShader } from './shaders/GLSLShader';
import { WebGLContextWrapper } from './WebGLContextWrapper';
import { VertexHandles as vertexHandles, WebGLResourceRepository } from './WebGLResourceRepository';
import { WebGLStrategy as webGLStrategy } from './WebGLStrategy';
import { WebGLStrategyUniform } from './WebGLStrategyUniform';
import { WebGLStrategyDataTexture } from './WebGLStrategyDataTexture';

const WebGL = Object.freeze({
  getRenderingStrategy,
  GLSLShader,
  WebGLContextWrapper,
  WebGLResourceRepository,
  WebGLStrategyUniform,
  WebGLStrategyDataTexture,
});
export default WebGL;

export type RnWebGL = typeof WebGL;
(0, eval)('this').RnWebGL = WebGL;

export type VertexHandles = vertexHandles;
export type WebGLStrategy = webGLStrategy;
