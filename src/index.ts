import _EntityRepository from './foundation/core/EntityRepository';
import _Entity from './foundation/core/Entity';
import _ComponentRepository from './foundation/core/ComponentRepository';
import _TransformComponent from './foundation/components/TransformComponent';
import _SceneGraphComponent from './foundation/components/SceneGraphComponent';
import _MeshComponent from './foundation/components/MeshComponent';
import _MeshRendererComponent from './foundation/components/MeshRendererComponent';
import _Primitive from './foundation/geometry/Primitive';
import _System from './foundation/system/System';
import _Scalar from './foundation/math/Scalar';
import _Vector2 from './foundation/math/Vector2';
import _Vector3 from './foundation/math/Vector3';
import _Vector4 from './foundation/math/Vector4';
import _MutableVector2 from './foundation/math/MutableVector2';
import _MutableVector3 from './foundation/math/MutableVector3';
import _MutableVector4 from './foundation/math/MutableVector4';
import _Matrix22 from './foundation/math/Matrix22';
import _Matrix33 from './foundation/math/Matrix33';
import _Matrix44 from './foundation/math/Matrix44';
import _MutableMatrix22 from './foundation/math/MutableMatrix22';
import _MutableMatrix33 from './foundation/math/MutableMatrix33';
import _MutableMatrix44 from './foundation/math/MutableMatrix44';
import _Gltf1Importer from './foundation/importer/Gltf1Importer';
import _Gltf2Importer from './foundation/importer/Gltf2Importer';
import _DrcPointCloudImporter from './foundation/importer/DrcPointCloudImporter';
import _GltfImporter from './foundation/importer/GltfImporter';
import _Gltf2Exporter from './foundation/exporter/Gltf2Exporter';
import _ModelConverter from './foundation/importer/ModelConverter';
import _ModuleManager from './foundation/system/ModuleManager';
import _MemoryManager from './foundation/core/MemoryManager';
import _CameraComponent from './foundation/components/CameraComponent';
import _AnimationComponent, {
  AnimationInfo as _AnimationInfo,
  ChangeAnimationInfoEvent as _ChangeAnimationInfoEvent
} from './foundation/components/AnimationComponent';
import _LightComponent from './foundation/components/LightComponent';
import _CubeTexture from './foundation/textures/CubeTexture';
import _CameraControllerComponent from './foundation/components/CameraControllerComponent';
import {detectFormatByArrayBuffers as _detectFormatByArrayBuffers} from './foundation/importer/FormatDetector';
import {detectFormatByUri as _detectFormatByUri} from './foundation/importer/FormatDetector';
import _Config from './foundation/core/Config';
import _Plane from './foundation/geometry/Plane';
import _Sphere from './foundation/geometry/Sphere';
import _Material from './foundation/materials/core/Material';
import _MaterialHelper from './foundation/helpers/MaterialHelper';
import _RenderPass from './foundation/renderer/RenderPass';
import _FrameBuffer from './foundation/renderer/FrameBuffer';
import _Expression from './foundation/renderer/Expression';
import _RenderTargetTexture from './foundation/textures/RenderTargetTexture';
import _RenderBuffer from './foundation/textures/RenderBuffer';
import _RenderableHelper from './foundation/helpers/RenderableHelper';
import _VideoTexture from './foundation/textures/VideoTexture';
import _AbstractTexture from './foundation/textures/AbstractTexture';
import _Texture from './foundation/textures/Texture';
import _EntityHelper from './foundation/helpers/EntityHelper';
import _MathClassUtil from './foundation/math/MathClassUtil';
import _Mesh from './foundation/geometry/Mesh';
import _Component from './foundation/core/Component';
import _EnvConstantSingleMaterialNode from './foundation/materials/singles/EnvConstantSingleMaterialNode';
import _ShadowMapDecodeClassicSingleMaterialNode from './foundation/materials/singles/ShadowMapDecodeClassicSingleMaterialNode';
import _RnObject from './foundation/core/RnObject';
import _VRMImporter from './foundation/importer/VRMImporter';
import _BlendShapeComponent from './foundation/components/BlendShapeComponent';
import _AnimationAssigner from './foundation/importer/AnimationAssigner';
import {MiscUtil as _MiscUtil} from './foundation/misc/MiscUtil';
import {MathUtil as _MathUtil} from './foundation/math/MathUtil';
import _OrbitCameraController from './foundation/cameras/OrbitCameraController';
import _WalkThroughCameraController from './foundation/cameras/WalkThroughCameraController';
import _ShaderityUtility from './foundation/materials/core/ShaderityUtility';
import _AbstractMaterialNode from './foundation/materials/core/AbstractMaterialNode';
import _ConstantVariableShaderNode from './foundation/materials/nodes/ConstantVariableShaderNode';
import _AddShaderNode from './foundation/materials/nodes/AddShaderNode';
import _DotProductShaderNode from './foundation/materials/nodes/DotProductShaderNode';
import _MultiplyShaderNode from './foundation/materials/nodes/MultiplyShaderNode';
import _OutPositionShaderNode from './foundation/materials/nodes/OutPositionShaderNode';
import _OutColorShaderNode from './foundation/materials/nodes/OutColorShaderNode';
import _ScalarToVector4ShaderNode from './foundation/materials/nodes/ScalarToVector4ShaderNode';
import _Vector3AndScalarToVector4ShaderNode from './foundation/materials/nodes/Vector3AndScalarToVector4ShaderNode';
import _AttributePositionShaderNode from './foundation/materials/nodes/AttributePositionShaderNode';
import _AttributeNormalShaderNode from './foundation/materials/nodes/AttributeNormalShaderNode';
import _WorldMatrixShaderNode from './foundation/materials/nodes/WorldMatrixShaderNode';
import _ViewMatrixShaderNode from './foundation/materials/nodes/ViewMatrixShaderNode';
import _NormalMatrixShaderNode from './foundation/materials/nodes/NormalMatrixShaderNode';
import _AABB from './foundation/math/AABB';
import _ProjectionMatrixShaderNode from './foundation/materials/nodes/ProjectionMatrixShaderNode';
import _VaryingInVariableShaderNode from './foundation/materials/nodes/VaryingInVariableShaderNode';
import _VaryingOutVariableShaderNode from './foundation/materials/nodes/VaryingOutVariableShaderNode';
import _UniformDataShaderNode from './foundation/materials/nodes/UniformDataShaderNode';
import _NormalizeShaderNode from './foundation/materials/nodes/NormalizeShaderNode';
import _IfStatementShaderNode from './foundation/materials/nodes/IfStatementShaderNode';
import _BlockBeginShaderNode from './foundation/materials/nodes/BlockBeginShaderNode';
import _BlockEndShaderNode from './foundation/materials/nodes/BlockEndShaderNode';
import _GreaterShaderNode from './foundation/materials/nodes/GreaterShaderNode';
import _ShaderGraphResolver from './foundation/materials/core/ShaderGraphResolver';
import _Quaternion from './foundation/math/Quaternion';
import _MutableQuaternion from './foundation/math/MutableQuaternion';
import _PbrShadingSingleMaterialNode from './foundation/materials/singles/PbrShadingSingleMaterialNode';
import _Buffer from './foundation/memory/Buffer';
import _CGAPIResourceRepository from './foundation/renderer/CGAPIResourceRepository';
import {
  FileType as _FileType,
  FileTypeEnum as _FileTypeEnum,
} from './foundation/definitions/FileType';
import _WebXRSystem from './xr/WebXRSystem';
import { GetComponentFromEntities as _GetComponentFromEntities } from './foundation/enhanced_js_objects/Array';
import {ArrayAsRn as _ArrayAsRn, enhanceArray as _enhanceArray} from './foundation/enhanced_js_objects/Array';
import _VarianceShadowMapDecodeClassicSingleMaterialNode from './foundation/materials/singles/VarianceShadowMapDecodeClassicSingleMaterialNode';
import _FurnaceTestSingleMaterialNode from './foundation/materials/singles/FurnaceTestSingleMaterialNode';
import _SynthesizeHDRMaterialNode from './foundation/materials/singles/SynthesizeHDRSingleMaterialNode';
import _DetectHighLuminanceSingleMaterialNode from './foundation/materials/singles/DetectHighLuminanceSingleMaterialNode';
import _DepthEncodeSingleMaterialNode from './foundation/materials/singles/DepthEncodeSingleMaterialNode';
import _PbrShadingMaterialNode from './foundation/materials/singles/PbrShadingSingleMaterialNode';
import _MatCapMaterialNode from './foundation/materials/singles/MatCapSingleMaterialNode';
import _GaussianBlurSingleMaterialNode from './foundation/materials/singles/GaussianBlurSingleMaterialNode';
import _GaussianBlurForEncodedDepthSingleMaterialNode from './foundation/materials/singles/GaussianBlurForEncodedDepthSingleMaterialNode';
import _ImageUtil from './foundation/math/ImageUtil';

const _VERSION = require('./../VERSION-FILE').default;

// definitions
import {
  ShaderSemantics as _ShaderSemantics,
  ShaderSemanticsEnum as _ShaderSemanticsEnum,
} from './foundation/definitions/ShaderSemantics';
import {LightType as _LightType} from './foundation/definitions/LightType';
import {AlphaMode as _AlphaMode} from './foundation/definitions/AlphaMode';
import {CameraType as _CameraType} from './foundation/definitions/CameraType';
import {ShaderType as _ShaderType} from './foundation/definitions/ShaderType';
import {
  TextureParameter as _TextureParameter,
  TextureParameterEnum as _TextureParameterEnum,
} from './foundation/definitions/TextureParameter';
import {
  BoneDataType as _BoneDataType,
  BoneDataTypeEnum as _BoneDataTypeEnum,
} from './foundation/definitions/BoneDataType';
import {
  PixelFormat as _PixelFormat,
  PixelFormatEnum as _PixelFormatEnum,
} from './foundation/definitions/PixelFormat';
import {
  ProcessApproach as _ProcessApproach,
  ProcessApproachEnum as _ProcessApproachEnum,
} from './foundation/definitions/ProcessApproach';
import {
  PrimitiveMode as _PrimitiveMode,
  PrimitiveModeEnum as _PrimitiveModeEnum,
} from './foundation/definitions/PrimitiveMode';
import {
  VertexAttribute as _VertexAttribute,
  VertexAttributeEnum as _VertexAttributeEnum,
} from './foundation/definitions/VertexAttribute';
import {
  CompositionType as _CompositionType,
  CompositionTypeEnum as _CompositionTypeEnum,
} from './foundation/definitions/CompositionType';
import {
  ComponentType as _ComponentType,
  ComponentTypeEnum as _ComponentTypeEnum,
} from './foundation/definitions/ComponentType';
import {
  CameraControllerType as _CameraControllerType,
  CameraControllerTypeEnum as _CameraControllerTypeEnum,
} from './foundation/definitions/CameraControllerType';
import {
  HdriFormat as _HdriFormat,
  HdriFormatEnum as _HdriFormatEnum,
} from './foundation/definitions/HdriFormat';
import {
  ShadingModel as _ShadingModel,
  ShadingModelEnum as _ShadingModelEnum,
} from './foundation/definitions/ShadingModel';
import {
  AnimationAttribute as _AnimationAttribute,
  AnimationAttributeEnum as _AnimationAttributeEnum,
} from './foundation/definitions/AnimationAttribute';
import {
  AnimationInterpolation as _AnimationInterpolation,
  AnimationInterpolationEnum as _AnimationInterpolationEnum,
} from './foundation/definitions/AnimationInterpolation';
import {GltfLoadOption as _GltfLoadOption} from './types/glTF';
import {
  CompressionTextureType as _CompressionTextureType,
  CompressionTextureTypeEnum as _CompressionTextureTypeEnum,
} from './foundation/definitions/CompressionTextureType';

export default {
  Entity: _Entity,
  EntityRepository: _EntityRepository,
  ComponentRepository: _ComponentRepository,
  TransformComponent: _TransformComponent,
  SceneGraphComponent: _SceneGraphComponent,
  MeshComponent: _MeshComponent,
  MeshRendererComponent: _MeshRendererComponent,
  AABB: _AABB,
  Primitive: _Primitive,
  System: _System,
  Scalar: _Scalar,
  Vector2: _Vector2,
  Vector3: _Vector3,
  Vector4: _Vector4,
  MutableVector2: _MutableVector2,
  MutableVector3: _MutableVector3,
  MutableVector4: _MutableVector4,
  Matrix22: _Matrix22,
  Matrix33: _Matrix33,
  Matrix44: _Matrix44,
  MutableMatrix22: _MutableMatrix22,
  MutableMatrix33: _MutableMatrix33,
  MutableMatrix44: _MutableMatrix44,
  Gltf1Importer: _Gltf1Importer,
  Gltf2Importer: _Gltf2Importer,
  DrcPointCloudImporter: _DrcPointCloudImporter,
  GltfImporter: _GltfImporter,
  ModelConverter: _ModelConverter,
  ModuleManager: _ModuleManager,
  MemoryManager: _MemoryManager,
  CameraComponent: _CameraComponent,
  AnimationComponent: _AnimationComponent,
  LightComponent: _LightComponent,
  CubeTexture: _CubeTexture,
  CameraControllerComponent: _CameraControllerComponent,
  Gltf2Exporter: _Gltf2Exporter,
  detectFormatByArrayBuffers: _detectFormatByArrayBuffers,
  detectFormatByUri: _detectFormatByUri,
  Config: _Config,
  Plane: _Plane,
  Sphere: _Sphere,
  Material: _Material,
  MaterialHelper: _MaterialHelper,
  RenderPass: _RenderPass,
  FrameBuffer: _FrameBuffer,
  Expression: _Expression,
  RenderTargetTexture: _RenderTargetTexture,
  RenderBuffer: _RenderBuffer,
  RenderableHelper: _RenderableHelper,
  AbstractTexture: _AbstractTexture,
  Texture: _Texture,
  VideoTexture: _VideoTexture,
  EntityHelper: _EntityHelper,
  MathClassUtil: _MathClassUtil,
  Mesh: _Mesh,
  Component: _Component,
  EnvConstantSingleMaterialNode: _EnvConstantSingleMaterialNode,
  ShadowMapDecodeClassicSingleMaterialNode: _ShadowMapDecodeClassicSingleMaterialNode,
  RnObject: _RnObject,
  VRMImporter: _VRMImporter,
  BlendShapeComponent: _BlendShapeComponent,
  AnimationAssigner: _AnimationAssigner,
  MiscUtil: _MiscUtil,
  MathUtil: _MathUtil,
  OrbitCameraController: _OrbitCameraController,
  WalkThroughCameraController: _WalkThroughCameraController,
  ShaderityUtility: _ShaderityUtility,
  AbstractMaterialNode: _AbstractMaterialNode,
  ConstantVariableShaderNode: _ConstantVariableShaderNode,
  AddShaderNode: _AddShaderNode,
  DotProductShaderNode: _DotProductShaderNode,
  MultiplyShaderNode: _MultiplyShaderNode,
  OutPositionShaderNode: _OutPositionShaderNode,
  OutColorShaderNode: _OutColorShaderNode,
  ScalarToVector4ShaderNode: _ScalarToVector4ShaderNode,
  Vector3AndScalarToVector4ShaderNode: _Vector3AndScalarToVector4ShaderNode,
  AttributePositionShaderNode: _AttributePositionShaderNode,
  AttributeNormalShaderNode: _AttributeNormalShaderNode,
  WorldMatrixShaderNode: _WorldMatrixShaderNode,
  ViewMatrixShaderNode: _ViewMatrixShaderNode,
  ProjectionMatrixShaderNode: _ProjectionMatrixShaderNode,
  VaryingInVariableShaderNode: _VaryingInVariableShaderNode,
  VaryingOutVariableShaderNode: _VaryingOutVariableShaderNode,
  NormalMatrixShaderNode: _NormalMatrixShaderNode,
  UniformDataShaderNode: _UniformDataShaderNode,
  NormalizeShaderNode: _NormalizeShaderNode,
  IfStatementShaderNode: _IfStatementShaderNode,
  BlockBeginShaderNode: _BlockBeginShaderNode,
  BlockEndShaderNode: _BlockEndShaderNode,
  GreaterShaderNode: _GreaterShaderNode,
  ShaderGraphResolver: _ShaderGraphResolver,
  Quaternion: _Quaternion,
  MutableQuaternion: _MutableQuaternion,
  PbrShadingSingleMaterialNode: _PbrShadingSingleMaterialNode,
  Buffer: _Buffer,
  CGAPIResourceRepository: _CGAPIResourceRepository,
  WebXRSystem: _WebXRSystem,
  VarianceShadowMapDecodeClassicSingleMaterialNode: _VarianceShadowMapDecodeClassicSingleMaterialNode,
  FurnaceTestSingleMaterialNode: _FurnaceTestSingleMaterialNode,
  SynthesizeHDRMaterialNode: _SynthesizeHDRMaterialNode,
  DetectHighLuminanceSingleMaterialNode: _DetectHighLuminanceSingleMaterialNode,
  DepthEncodeSingleMaterialNode: _DepthEncodeSingleMaterialNode,
  PbrShadingMaterialNode: _PbrShadingMaterialNode,
  MatCapMaterialNode: _MatCapMaterialNode,
  GaussianBlurSingleMaterialNode: _GaussianBlurSingleMaterialNode,
  GaussianBlurForEncodedDepthSingleMaterialNode: _GaussianBlurForEncodedDepthSingleMaterialNode,
  ImageUtil: _ImageUtil,
  GetComponentFromEntities: _GetComponentFromEntities,
  enhanceArray: _enhanceArray,
  FileType: _FileType,
  VERSION: _VERSION,

  // Definition Objects
  CompositionType: _CompositionType,
  ShaderType: _ShaderType,
  PixelFormat: _PixelFormat,
  BoneDataType: _BoneDataType,
  CameraControllerType: _CameraControllerType,
  AlphaMode: _AlphaMode,
  ProcessApproach: _ProcessApproach,
  ComponentType: _ComponentType,
  VertexAttribute: _VertexAttribute,
  LightType: _LightType,
  CameraType: _CameraType,
  ShaderSemantics: _ShaderSemantics,
  TextureParameter: _TextureParameter,
  PrimitiveMode: _PrimitiveMode,
  HdriFormat: _HdriFormat,
  ShadingModel: _ShadingModel,
  AnimationAttribute: _AnimationAttribute,
  AnimationInterpolation: _AnimationInterpolation,
  CompressionTextureType: _CompressionTextureType,
};

export type Entity = _Entity;
export type EntityRepository = _EntityRepository;
export type ComponentRepository = _ComponentRepository;
export type TransformComponent = _TransformComponent;
export type SceneGraphComponent = _SceneGraphComponent;
export type MeshComponent = _MeshComponent;
export type MeshRendererComponent = _MeshRendererComponent;
export type AABB = _AABB;
export type Primitive = _Primitive;
export type System = _System;
export type Scalar = _Scalar;
export type Vector2 = _Vector2;
export type Vector3 = _Vector3;
export type Vector4 = _Vector4;
export type MutableVector2 = _MutableVector2;
export type MutableVector3 = _MutableVector3;
export type MutableVector4 = _MutableVector4;
export type Matrix22 = _Matrix22;
export type Matrix33 = _Matrix33;
export type Matrix44 = _Matrix44;
export type MutableMatrix22 = _MutableMatrix22;
export type MutableMatrix33 = _MutableMatrix33;
export type MutableMatrix44 = _MutableMatrix44;
export type Gltf1Importer = _Gltf1Importer;
export type Gltf2Importer = _Gltf2Importer;
export type DrcPointCloudImporter = _DrcPointCloudImporter;
export type GltfImporter = _GltfImporter;
export type ModelConverter = _ModelConverter;
export type ModuleManager = _ModuleManager;
export type MemoryManager = _MemoryManager;
export type CameraComponent = _CameraComponent;
export type CameraType = typeof _CameraType;
export type AnimationComponent = _AnimationComponent;
export type AnimationInfo = _AnimationInfo;
export type ChangeAnimationInfoEvent = _ChangeAnimationInfoEvent;
export type LightComponent = _LightComponent;
export type LightType = typeof _LightType;
export type CubeTexture = _CubeTexture;
export type CameraControllerComponent = _CameraControllerComponent;
export type CameraControllerType = typeof _CameraControllerType;
export type AlphaMode = typeof _AlphaMode;
export type Gltf2Exporter = _Gltf2Exporter;
export type detectFormatByArrayBuffers = typeof _detectFormatByArrayBuffers;
export type detectFormatByUri = typeof _detectFormatByUri;
export type Config = typeof _Config;
export type Plane = _Plane;
export type Sphere = _Sphere;
export type Material = _Material;
export type MaterialHelper = typeof _MaterialHelper;
export type RenderPass = _RenderPass;
export type FrameBuffer = _FrameBuffer;
export type Expression = _Expression;
export type HdriFormat = typeof _HdriFormat;
export type ShaderType = typeof _ShaderType;
export type RenderTargetTexture = _RenderTargetTexture;
export type RenderBuffer = _RenderBuffer;
export type RenderableHelper = typeof _RenderableHelper;
export type AbstractTexture = _AbstractTexture;
export type Texture = _Texture;
export type VideoTexture = _VideoTexture;
export type EntityHelper = typeof _EntityHelper;
export type MathClassUtil = _MathClassUtil;
export type Mesh = _Mesh;
export type MathUtil = typeof _MathUtil;
export type Component = _Component;
export type EnvConstantSingleMaterialNode = _EnvConstantSingleMaterialNode;
export type ShadowMapDecodeClassicSingleMaterialNode = _ShadowMapDecodeClassicSingleMaterialNode;
export type RnObject = _RnObject;
export type VRMImporter = _VRMImporter;
export type BlendShapeComponent = _BlendShapeComponent;
export type AnimationAssigner = _AnimationAssigner;
export type MiscUtil = typeof _MiscUtil;
export type OrbitCameraController = _OrbitCameraController;
export type WalkThroughCameraController = _WalkThroughCameraController;
export type ShaderityUtility = _ShaderityUtility;
export type AbstractMaterialNode = _AbstractMaterialNode;
export type PixelFormatEnum = _PixelFormatEnum;
export type ConstantVariableShaderNode = _ConstantVariableShaderNode;
export type AddShaderNode = _AddShaderNode;
export type DotProductShaderNode = _DotProductShaderNode;
export type MultiplyShaderNode = _MultiplyShaderNode;
export type OutPositionShaderNode = _OutPositionShaderNode;
export type OutColorShaderNode = _OutColorShaderNode;
export type ScalarToVector4ShaderNode = _ScalarToVector4ShaderNode;
export type Vector3AndScalarToVector4ShaderNode = _Vector3AndScalarToVector4ShaderNode;
export type AttributePositionShaderNode = _AttributePositionShaderNode;
export type AttributeNormalShaderNode = _AttributeNormalShaderNode;
export type WorldMatrixShaderNode = _WorldMatrixShaderNode;
export type ViewMatrixShaderNode = _ViewMatrixShaderNode;
export type ProjectionMatrixShaderNode = _ProjectionMatrixShaderNode;
export type VaryingInVariableShaderNode = _VaryingInVariableShaderNode;
export type VaryingOutVariableShaderNode = _VaryingOutVariableShaderNode;
export type NormalMatrixShaderNode = _NormalMatrixShaderNode;
export type UniformDataShaderNode = _UniformDataShaderNode;
export type NormalizeShaderNode = _NormalizeShaderNode;
export type IfStatementShaderNode = _IfStatementShaderNode;
export type BlockBeginShaderNode = _BlockBeginShaderNode;
export type BlockEndShaderNode = _BlockEndShaderNode;
export type GreaterShaderNode = _GreaterShaderNode;
export type ShaderGraphResolver = _ShaderGraphResolver;
export type GltfLoadOption = _GltfLoadOption;
export type PbrShadingSingleMaterialNode = _PbrShadingSingleMaterialNode;
export type Buffer = _Buffer;
export type CGAPIResourceRepository = _CGAPIResourceRepository;
export type WebXRSystem = _WebXRSystem;
export type VarianceShadowMapDecodeClassicSingleMaterialNode = _VarianceShadowMapDecodeClassicSingleMaterialNode;
export type FurnaceTestSingleMaterialNode = _FurnaceTestSingleMaterialNode;
export type SynthesizeHDRMaterialNode = _SynthesizeHDRMaterialNode;
export type DetectHighLuminanceSingleMaterialNode = _DetectHighLuminanceSingleMaterialNode;
export type DepthEncodeSingleMaterialNode = _DepthEncodeSingleMaterialNode;
export type PbrShadingMaterialNode = _PbrShadingMaterialNode;
export type MatCapMaterialNode = _MatCapMaterialNode;
export type GaussianBlurSingleMaterialNode = _GaussianBlurSingleMaterialNode;
export type GaussianBlurForEncodedDepthSingleMaterialNode = _GaussianBlurForEncodedDepthSingleMaterialNode;
export type ImageUtil = typeof _ImageUtil;
export type GetComponentFromEntities = typeof _GetComponentFromEntities;
export type VERSION = typeof _VERSION;
export type ArrayAsRn<T> = _ArrayAsRn<T>;
export type enhanceArray = typeof _enhanceArray;

// Definition Enums
export type CompositionTypeEnum = _CompositionTypeEnum;
export type ComponentTypeEnum = _ComponentTypeEnum;
export type VertexAttributeEnum = _VertexAttributeEnum;
export type PrimitiveModeEnum = _PrimitiveModeEnum;
export type ShaderSemanticsEnum = _ShaderSemanticsEnum;
export type BoneDataTypeEnum = _BoneDataTypeEnum;
export type TextureParameterEnum = _TextureParameterEnum;
export type ProcessApproachEnum = _ProcessApproachEnum;
export type HdriFormatEnum = _HdriFormatEnum;
export type ShadingModelEnum = _ShadingModelEnum;
export type AnimationAttributeEnum = _AnimationAttributeEnum;
export type AnimationInterpolationEnum = _AnimationInterpolationEnum;
export type FileTypeEnum = _FileTypeEnum;
export type CompressionTextureTypeEnum = _CompressionTextureTypeEnum;
