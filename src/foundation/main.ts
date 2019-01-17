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
import System from './system/System';
import Vector3 from './math/Vector3';
import Vector4 from './math/Vector4';
import MutableVector3 from './math/MutableVector3';
import MutableVector4 from './math/MutableVector4';
import Matrix33 from './math/Matrix33';
import Matrix44 from './math/Matrix44';
import MutableMatrix44 from './math/MutableMatrix44';
import { ProcessApproach } from './definitions/ProcessApproach';
import Gltf2Importer from './importer/Gltf2Importer';
import ModelConverter from './importer/ModelConverter';
import ModuleManager from './system/ModuleManager';
import MemoryManager from './core/MemoryManager';

const Rn = {
  EntityRepository,
  TransformComponent,
  SceneGraphComponent,
  MeshComponent,
  MeshRendererComponent,
  Primitive,
  CompositionType,
  ComponentType,
  VertexAttribute,
  PrimitiveMode,
  System,
  Vector3,
  Vector4,
  MutableVector3,
  MutableVector4,
  Matrix33,
  Matrix44,
  MutableMatrix44,
  ProcessApproach,
  Gltf2Importer,
  ModelConverter,
  ModuleManager,
  MemoryManager,
};
export default Rn;

declare var window:any;
window['Rn'] = Rn;

export type CompositionTypeEnum = CompositionTypeEnum;
export type ComponentTypeEnum = ComponentTypeEnum;
export type VertexAttributeEnum = VertexAttributeEnum;
export type PrimitiveModeEnum = PrimitiveModeEnum;
