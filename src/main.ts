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
import ImmutableVector4 from './math/ImmutableVector4';
import MutableVector3 from './math/MutableVector3';
import MutableVector4 from './math/MutableVector4';
import ImmutableMatrix33 from './math/ImmutableMatrix33';
import ImmutableMatrix44 from './math/ImmutableMatrix44';
import MutableMatrix44 from './math/MutableMatrix44';
import { ProcessApproach } from './definitions/ProcessApproach';
import Gltf2Importer from './importer/Gltf2Importer';
import ModelConverter from './importer/ModelConverter';

const Rn = Object.freeze({
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
  ImmutableVector4,
  MutableVector3,
  MutableVector4,
  ImmutableMatrix33,
  ImmutableMatrix44,
  MutableMatrix44,
  ProcessApproach,
  Gltf2Importer,
  ModelConverter
});
export default Rn;

declare var window:any;
window['Rn'] = Rn;

export type CompositionTypeEnum = CompositionTypeEnum;
export type ComponentTypeEnum = ComponentTypeEnum;
export type VertexAttributeEnum = VertexAttributeEnum;
export type PrimitiveModeEnum = PrimitiveModeEnum;
