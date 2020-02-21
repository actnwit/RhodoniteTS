import getRenderingStrategy from './getRenderingStrategy';
import GLSLShader, { AttributeNames as attributeNames } from "./shaders/GLSLShader";
import WebGLContextWrapper from './WebGLContextWrapper';
import WebGLResourceRepository, { VertexHandles as vertexHandles } from './WebGLResourceRepository';
import webGLStrategy from './WebGLStrategy';
import WebGLStrategyUniform from './WebGLStrategyUniform';

const WebGL = Object.freeze({
  getRenderingStrategy,
  GLSLShader,
  WebGLContextWrapper,
  WebGLResourceRepository,
  WebGLStrategyUniform,
});
export default WebGL;

export type RnWebGL = typeof WebGL;
(0, eval)('this').RnWebGL = WebGL;

export type AttributeNames = attributeNames;
export type VertexHandles = vertexHandles;
export type WebGLStrategy = webGLStrategy;
