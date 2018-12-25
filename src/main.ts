import WebGLResourceRepository from './renderer/webgl/WebGLResourceRepository';
import EntityRepository from './core/EntityRepository';
import TransformComponent from './components/TransformComponent';
import SceneGraphComponent from './components/SceneGraphComponent';
import MeshComponent from './components/MeshComponent';
import MeshRendererComponent from './components/MeshRendererComponent';
import Primitive from './geometry/Primitive';
import { PrimitiveMode, PrimitiveModeEnum } from './definitions/PrimitiveMode';
import { VertexAttribute, VertexAttributeEnum } from './definitions/VertexAttribute';
import { CompositionType, CompositionTypeEnum } from './definitions/CompositionType';
import { ComponentType, ComponentTypeEnum } from './definitions/ComponentType';
import GLSLShader from './renderer/webgl/GLSLShader';
import System from './system/System';
import Vector3 from './math/Vector3';
import Vector4 from './math/Vector4';
import Matrix33 from './math/Matrix33';
import Matrix44 from './math/Matrix44';


export default Object.freeze({
  EntityRepository,
  TransformComponent,
  SceneGraphComponent,
  MeshComponent,
  MeshRendererComponent,
  Primitive,
  WebGLResourceRepository,
  CompositionType,
  ComponentType,
  VertexAttribute,
  PrimitiveMode,
  GLSLShader,
  System,
  Vector3,
  Vector4,
  Matrix33,
  Matrix44,
});

export type CompositionTypeEnum = CompositionTypeEnum;
export type ComponentTypeEnum = ComponentTypeEnum;
export type VertexAttributeEnum = VertexAttributeEnum;
export type PrimitiveModeEnum = PrimitiveModeEnum;
