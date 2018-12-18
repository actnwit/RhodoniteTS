import WebGLResourceRepository from './renderer/webgl/WebGLResourceRepository';
import EntityRepository from './core/EntityRepository';
import TransformComponent from './components/TransformComponent';
import SceneGraphComponent from './components/SceneGraphComponent';
import MeshComponent from './components/MeshComponent';
import Primitive from './geometry/Primitive';
import { PrimitiveMode, PrimitiveModeEnum } from './definitions/PrimitiveMode';
import { VertexAttribute, VertexAttributeEnum } from './definitions/VertexAttribute';
import { CompositionType, CompositionTypeEnum } from './definitions/CompositionType';
import { ComponentType, ComponentTypeEnum } from './definitions/ComponentType';


export default Object.freeze({
  EntityRepository,
  TransformComponent,
  SceneGraphComponent,
  MeshComponent,
  Primitive,
  WebGLResourceRepository,
  CompositionType,
  ComponentType,
  VertexAttribute,
  PrimitiveMode,
});

export type CompositionTypeEnum = CompositionTypeEnum;
export type ComponentTypeEnum = ComponentTypeEnum;
export type VertexAttributeEnum = VertexAttributeEnum;
export type PrimitiveModeEnum = PrimitiveModeEnum;
