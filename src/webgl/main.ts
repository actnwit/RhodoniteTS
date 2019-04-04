import getRenderingStrategy from './getRenderingStrategy';
import GLSLShader, {AttributeNames} from "./shaders/GLSLShader";
import WebGLContextWrapper from './WebGLContextWrapper';
import WebGLResourceRepository, {VertexHandles} from './WebGLResourceRepository';
import WebGLStrategy from './WebGLStrategy';
import WebGLStrategyDataTexture from './WebGLStrategyDataTexture';
import WebGLStrategyTransformFeedback from './WebGLStrategyTransformFeedback';
import WebGLStrategyUBO from './WebGLStrategyUBO';
import WebGLStrategyUniform from './WebGLStrategyUniform';

const WebGL = Object.freeze({
  getRenderingStrategy,
  GLSLShader,
  WebGLContextWrapper,
  WebGLResourceRepository,
  WebGLStrategyDataTexture,
  WebGLStrategyTransformFeedback,
  WebGLStrategyUBO,
  WebGLStrategyUniform
});
export default WebGL;

export type AttributeNames = AttributeNames;
export type VertexHandles = VertexHandles;
export type WebGLStrategy = WebGLStrategy;
