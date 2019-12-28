import getRenderingStrategy from './webgl/getRenderingStrategy';
import GLSLShader, { AttributeNames as attributeNames } from "./webgl/shaders/GLSLShader";
import WebGLContextWrapper from './webgl/WebGLContextWrapper';
import WebGLResourceRepository, { VertexHandles as vertexHandles } from './webgl/WebGLResourceRepository';
import webGLStrategy from './webgl/WebGLStrategy';
import WebGLStrategyUniform from './webgl/WebGLStrategyUniform';
import GetVarsShader from './webgl/shaders/nodes/GetVarsShader';

const WebGL = Object.freeze({
  getRenderingStrategy,
  GLSLShader,
  WebGLContextWrapper,
  WebGLResourceRepository,
  WebGLStrategyUniform,
  GetVarsShader
});
export default WebGL;

if (typeof exports !== 'undefined') {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = WebGL;
}

export type RnWebGL = typeof WebGL;
(0, eval)('this').RnWebGL = WebGL;

export type AttributeNames = attributeNames;
export type VertexHandles = vertexHandles;
export type WebGLStrategy = webGLStrategy;
