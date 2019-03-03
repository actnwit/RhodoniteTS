import EntityRepository from './core/EntityRepository';
import ComponentRepository from './core/ComponentRepository';
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
import Vector2 from './math/Vector2';
import Vector3 from './math/Vector3';
import Vector4 from './math/Vector4';
import MutableVector3 from './math/MutableVector3';
import MutableVector4 from './math/MutableVector4';
import Matrix33 from './math/Matrix33';
import Matrix44 from './math/Matrix44';
import MutableMatrix44 from './math/MutableMatrix44';
import { ProcessApproach } from './definitions/ProcessApproach';
import Gltf1Importer from './importer/Gltf1Importer';
import Gltf2Importer from './importer/Gltf2Importer';
import ModelConverter from './importer/ModelConverter';
import ModuleManager from './system/ModuleManager';
import MemoryManager from './core/MemoryManager';
import CameraComponent from './components/CameraComponent';
import { CameraType } from './definitions/CameraType';
import RowMajarMatrix44 from './math/RowMajarMatrix44';
import AnimationComponent from './components/AnimationComponent';
import LightComponent from './components/LightComponent';
import { LightType } from './definitions/LightType';
import { AlphaMode } from './definitions/AlphaMode';
import CubeTexture from './textures/CubeTexture';
import PbrMaterial from './materials/PbrMaterial';
import CameraControllerComponent from './components/CameraControllerComponent';

const Rn = {
  EntityRepository,
  ComponentRepository,
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
  Vector2,
  Vector3,
  Vector4,
  MutableVector3,
  MutableVector4,
  Matrix33,
  Matrix44,
  MutableMatrix44,
  ProcessApproach,
  Gltf1Importer,
  Gltf2Importer,
  ModelConverter,
  ModuleManager,
  MemoryManager,
  CameraComponent,
  CameraType,
  RowMajarMatrix44,
  AnimationComponent,
  LightComponent,
  LightType,
  CubeTexture,
  CameraControllerComponent,
  AlphaMode,
  PbrMaterial: PbrMaterial
};
export default Rn;

declare var window:any;
window['Rn'] = Rn;

export type CompositionTypeEnum = CompositionTypeEnum;
export type ComponentTypeEnum = ComponentTypeEnum;
export type VertexAttributeEnum = VertexAttributeEnum;
export type PrimitiveModeEnum = PrimitiveModeEnum;
