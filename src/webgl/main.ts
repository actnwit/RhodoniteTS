import getRenderingStrategy from './getRenderingStrategy';
import GLSLShader, {AttributeNames} from "./shaders/GLSLShader";
import WebGLContextWrapper from './WebGLContextWrapper';
import WebGLResourceRepository, {VertexHandles} from './WebGLResourceRepository';
import WebGLStrategy from './WebGLStrategy';
import WebGLStrategyUniform from './WebGLStrategyUniform';

const WebGL = Object.freeze({
  getRenderingStrategy,
  GLSLShader,
  WebGLContextWrapper,
  WebGLResourceRepository,
  WebGLStrategyUniform
});
export default WebGL;

declare var window: any;
export type RnWebGL = typeof WebGL;
window.RnWebGL = WebGL;

export type AttributeNames = AttributeNames;
export type VertexHandles = VertexHandles;
export type WebGLStrategy = WebGLStrategy;
