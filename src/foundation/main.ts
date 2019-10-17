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
import { CameraControllerType, CameraControllerTypeEnum } from './definitions/CameraControllerType';
import System from './system/System';
import Scalar from './math/Scalar';
import Vector2 from './math/Vector2';
import Vector3 from './math/Vector3';
import Vector4 from './math/Vector4';
import MutableVector2 from './math/MutableVector2';
import MutableVector3 from './math/MutableVector3';
import MutableVector4 from './math/MutableVector4';
import Matrix22 from './math/Matrix22';
import Matrix33 from './math/Matrix33';
import Matrix44 from './math/Matrix44';
import MutableMatrix22 from './math/MutableMatrix22';
import MutableMatrix33 from './math/MutableMatrix33';
import MutableMatrix44 from './math/MutableMatrix44';
import { ProcessApproach } from './definitions/ProcessApproach';
import Gltf1Importer from './importer/Gltf1Importer';
import Gltf2Importer from './importer/Gltf2Importer';
import DrcPointCloudImporter from './importer/DrcPointCloudImporter';
import GltfImporter from './importer/GltfImporter';
import Gltf2Exporter from './exporter/Gltf2Exporter';
import ModelConverter from './importer/ModelConverter';
import ModuleManager from './system/ModuleManager';
import MemoryManager from './core/MemoryManager';
import CameraComponent from './components/CameraComponent';
import { CameraType } from './definitions/CameraType';
import AnimationComponent from './components/AnimationComponent';
import LightComponent from './components/LightComponent';
import { LightType } from './definitions/LightType';
import { AlphaMode } from './definitions/AlphaMode';
import CubeTexture from './textures/CubeTexture';
import CameraControllerComponent from './components/CameraControllerComponent';
import detectFormat from './importer/FormatDetector';
import Config from './core/Config';
import Plane from './geometry/Plane';
import Sphere from './geometry/Sphere';
import Material from './materials/Material';
import MaterialHelper from './helpers/MaterialHelper';
import { ShaderSemantics } from './definitions/ShaderSemantics';
import RenderPass from './renderer/RenderPass';
import FrameBuffer from './renderer/FrameBuffer';
import Expression from './renderer/Expression';
import { HdriFormat } from './definitions/HdriFormat';
import RenderTargetTexture from './textures/RenderTargetTexture';
import RenderBuffer from './textures/RenderBuffer';
import { TextureParameter } from './definitions/TextureParameter';
import RenderableHelper from './helpers/RenderableHelper';
import Texture from './textures/Texture';
import EntityHelper from './helpers/EntityHelper';
import MathClassUtil from './math/MathClassUtil';
import Mesh from './geometry/Mesh';
import { MathUtil } from './math/MathUtil';
import Component from './core/Component';
import EnvConstantSingleMaterialNode from '../foundation/materials/EnvConstantSingleMaterialNode';
import RnObject from '../foundation/core/RnObject';
import VRMImporter from '../foundation/importer/VRMImporter';
import BlendShapeComponent from '../foundation/components/BlendShapeComponent';
import AnimationAssigner from '../foundation/importer/AnimationAssigner';
import { MiscUtil } from '../foundation/misc/MiscUtil';
import OrbitCameraController from './cameras/OrbitCameraController';
import WalkThroughCameraController from './cameras/WalkThroughCameraController';

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
  Scalar,
  Vector2,
  Vector3,
  Vector4,
  MutableVector2,
  MutableVector3,
  MutableVector4,
  Matrix22,
  Matrix33,
  Matrix44,
  MutableMatrix22,
  MutableMatrix33,
  MutableMatrix44,
  ProcessApproach,
  Gltf1Importer,
  Gltf2Importer,
  DrcPointCloudImporter,
  GltfImporter,
  ModelConverter,
  ModuleManager,
  MemoryManager,
  CameraComponent,
  CameraType,
  AnimationComponent,
  LightComponent,
  LightType,
  CubeTexture,
  CameraControllerComponent,
  CameraControllerType,
  AlphaMode,
  Gltf2Exporter,
  detectFormat,
  Config,
  Plane,
  Sphere,
  Material,
  MaterialHelper,
  ShaderSemantics,
  RenderPass,
  FrameBuffer,
  Expression,
  HdriFormat,
  RenderTargetTexture,
  RenderBuffer,
  TextureParameter,
  RenderableHelper,
  Texture,
  EntityHelper,
  MathClassUtil,
  Mesh,
  MathUtil,
  Component,
  EnvConstantSingleMaterialNode,
  RnObject,
  VRMImporter,
  BlendShapeComponent,
  AnimationAssigner,
  MiscUtil,
  OrbitCameraController,
  WalkThroughCameraController
};
export default Rn;
export type RnType = typeof Rn;

declare var window: any;
window.Rn = Rn;

export type CompositionTypeEnum = CompositionTypeEnum;
export type ComponentTypeEnum = ComponentTypeEnum;
export type VertexAttributeEnum = VertexAttributeEnum;
export type PrimitiveModeEnum = PrimitiveModeEnum;
export type CameraControllerTypeEnum = CameraControllerTypeEnum;
