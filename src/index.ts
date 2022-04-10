import {EntityRepository as _EntityRepository} from './foundation/core/EntityRepository';
import {Entity as _Entity} from './foundation/core/Entity';
import {ComponentRepository as _ComponentRepository} from './foundation/core/ComponentRepository';
import {TransformComponent as _TransformComponent} from './foundation/components/Transform/TransformComponent';
import {SceneGraphComponent as _SceneGraphComponent} from './foundation/components/SceneGraph/SceneGraphComponent';
import {MeshComponent as _MeshComponent} from './foundation/components/Mesh/MeshComponent';
import {MeshRendererComponent as _MeshRendererComponent} from './foundation/components/MeshRenderer/MeshRendererComponent';
import {Primitive as _Primitive} from './foundation/geometry/Primitive';
import {System as _System} from './foundation/system/System';
import {Is as _Is} from './foundation/misc/Is';
import type {IsType} from './foundation/misc/Is';
import {Scalar as _Scalar} from './foundation/math/Scalar';
import {Vector2 as _Vector2} from './foundation/math/Vector2';
import {Vector3 as _Vector3} from './foundation/math/Vector3';
import {Vector4 as _Vector4} from './foundation/math/Vector4';
import {ColorRgb as _ColorRgb} from './foundation/math/ColorRgb';
import {ColorRgba as _ColorRgba} from './foundation/math/ColorRgba';
import {MutableColorRgb as _MutableColorRgb} from './foundation/math/MutableColorRgb';
import {MutableColorRgba as _MutableColorRgba} from './foundation/math/MutableColorRgba';
import {MutableScalar as _MutableScalar} from './foundation/math/MutableScalar';
import {MutableVector2 as _MutableVector2} from './foundation/math/MutableVector2';
import {MutableVector3 as _MutableVector3} from './foundation/math/MutableVector3';
import {MutableVector4 as _MutableVector4} from './foundation/math/MutableVector4';
import {Matrix22 as _Matrix22} from './foundation/math/Matrix22';
import {Matrix33 as _Matrix33} from './foundation/math/Matrix33';
import {Matrix44 as _Matrix44} from './foundation/math/Matrix44';
import {MutableMatrix22 as _MutableMatrix22} from './foundation/math/MutableMatrix22';
import {MutableMatrix33 as _MutableMatrix33} from './foundation/math/MutableMatrix33';
import {MutableMatrix44 as _MutableMatrix44} from './foundation/math/MutableMatrix44';
import {Gltf1Importer as _Gltf1Importer} from './foundation/importer/Gltf1Importer';
import {Gltf2Importer as _Gltf2Importer} from './foundation/importer/Gltf2Importer';
import {DrcPointCloudImporter as _DrcPointCloudImporter} from './foundation/importer/DrcPointCloudImporter';
import {GltfImporter as _GltfImporter} from './foundation/importer/GltfImporter';
import {Gltf2Exporter as _Gltf2Exporter} from './foundation/exporter/Gltf2Exporter';
import {
  GLTF2_EXPORT_GLTF as _GLTF2_EXPORT_GLTF,
  GLTF2_EXPORT_GLB as _GLTF2_EXPORT_GLB,
  GLTF2_EXPORT_DRACO as _GLTF2_EXPORT_DRACO,
  GLTF2_EXPORT_EMBEDDED as _GLTF2_EXPORT_EMBEDDED,
} from './foundation/exporter/Gltf2Exporter';
import {ModelConverter as _ModelConverter} from './foundation/importer/ModelConverter';
import {ModuleManager as _ModuleManager} from './foundation/system/ModuleManager';
import {MemoryManager as _MemoryManager} from './foundation/core/MemoryManager';
import {CameraComponent as _CameraComponent} from './foundation/components/Camera/CameraComponent';
import {AnimationComponent as _AnimationComponent} from './foundation/components/Animation/AnimationComponent';
import {
  AnimationInfo as _AnimationInfo,
  ChangeAnimationInfoEvent as _ChangeAnimationInfoEvent,
} from './types/AnimationTypes';
import {LightComponent as _LightComponent} from './foundation/components/Light/LightComponent';
import {CubeTexture as _CubeTexture} from './foundation/textures/CubeTexture';
import {CameraControllerComponent as _CameraControllerComponent} from './foundation/components/CameraController/CameraControllerComponent';
import {detectFormatByArrayBuffers as _detectFormatByArrayBuffers} from './foundation/importer/FormatDetector';
import {detectFormatByUri as _detectFormatByUri} from './foundation/importer/FormatDetector';
import {Config as _Config} from './foundation/core/Config';
import {Plane as _Plane} from './foundation/geometry/shapes/Plane';
import {Sphere as _Sphere} from './foundation/geometry/shapes/Sphere';
import {Cube as _Cube} from './foundation/geometry/shapes/Cube';
import {Axis as _Axis} from './foundation/geometry/shapes/Axis';
import {Joint as _Joint} from './foundation/geometry/shapes/Joint';
import {Line as _Line} from './foundation/geometry/shapes/Line';
import {Grid as _Grid} from './foundation/geometry/shapes/Grid';
import type {PlaneDescriptor as _PlaneDescriptor} from './foundation/geometry/shapes/Plane';
import type {SphereDescriptor as _SphereDescriptor} from './foundation/geometry/shapes/Sphere';
import type {CubeDescriptor as _CubeDescriptor} from './foundation/geometry/shapes/Cube';
import type {AxisDescriptor as _AxisDescriptor} from './foundation/geometry/shapes/Axis';
import type {JointDescriptor as _JointDescriptor} from './foundation/geometry/shapes/Joint';
import type {LineDescriptor as _LineDescriptor} from './foundation/geometry/shapes/Line';
import type {GridDescriptor as _GridDescriptor} from './foundation/geometry/shapes/Grid';
import {Material as _Material} from './foundation/materials/core/Material';
import {MaterialHelper as _MaterialHelper} from './foundation/helpers/MaterialHelper';
import {RenderPass as _RenderPass} from './foundation/renderer/RenderPass';
import {Frame as _Frame} from './foundation/renderer/Frame';
import {FrameBuffer as _FrameBuffer} from './foundation/renderer/FrameBuffer';
import {Expression as _Expression} from './foundation/renderer/Expression';
import {RenderTargetTexture as _RenderTargetTexture} from './foundation/textures/RenderTargetTexture';
import {RenderBuffer as _RenderBuffer} from './foundation/textures/RenderBuffer';
import {RenderableHelper as _RenderableHelper} from './foundation/helpers/RenderableHelper';
import {VideoTexture as _VideoTexture} from './foundation/textures/VideoTexture';
import {AbstractTexture as _AbstractTexture} from './foundation/textures/AbstractTexture';
import {Texture as _Texture} from './foundation/textures/Texture';
import {EntityHelper as _EntityHelper} from './foundation/helpers/EntityHelper';
import {MathClassUtil as _MathClassUtil} from './foundation/math/MathClassUtil';
import {Mesh as _Mesh} from './foundation/geometry/Mesh';
import {Component as _Component} from './foundation/core/Component';
import {EnvConstantSingleMaterialNode as _EnvConstantSingleMaterialNode} from './foundation/materials/singles/EnvConstantSingleMaterialNode';
import {ShadowMapDecodeClassicSingleMaterialNode as _ShadowMapDecodeClassicSingleMaterialNode} from './foundation/materials/singles/ShadowMapDecodeClassicSingleMaterialNode';
import {RnObject as _RnObject} from './foundation/core/RnObject';
import {VrmImporter as _VrmImporter} from './foundation/importer/VrmImporter';
import {BlendShapeComponent as _BlendShapeComponent} from './foundation/components/BlendShape/BlendShapeComponent';
import {AnimationAssigner as _AnimationAssigner} from './foundation/importer/AnimationAssigner';
import {MiscUtil as _MiscUtil} from './foundation/misc/MiscUtil';
import {MathUtil as _MathUtil} from './foundation/math/MathUtil';
import {MeshHelper as _MeshHelper} from './foundation/helpers/MeshHelper';
import {OrbitCameraController as _OrbitCameraController} from './foundation/cameras/OrbitCameraController';
import {WalkThroughCameraController as _WalkThroughCameraController} from './foundation/cameras/WalkThroughCameraController';
import {ShaderityUtility as _ShaderityUtility} from './foundation/materials/core/ShaderityUtility';
import {AbstractMaterialNode as _AbstractMaterialNode} from './foundation/materials/core/AbstractMaterialNode';
import {ConstantVariableShaderNode as _ConstantVariableShaderNode} from './foundation/materials/nodes/ConstantVariableShaderNode';
import {AddShaderNode as _AddShaderNode} from './foundation/materials/nodes/AddShaderNode';
import {DotProductShaderNode as _DotProductShaderNode} from './foundation/materials/nodes/DotProductShaderNode';
import {MultiplyShaderNode as _MultiplyShaderNode} from './foundation/materials/nodes/MultiplyShaderNode';
import {OutPositionShaderNode as _OutPositionShaderNode} from './foundation/materials/nodes/OutPositionShaderNode';
import {OutColorShaderNode as _OutColorShaderNode} from './foundation/materials/nodes/OutColorShaderNode';
import {ScalarToVector4ShaderNode as _ScalarToVector4ShaderNode} from './foundation/materials/nodes/ScalarToVector4ShaderNode';
import {Vector3AndScalarToVector4ShaderNode as _Vector3AndScalarToVector4ShaderNode} from './foundation/materials/nodes/Vector3AndScalarToVector4ShaderNode';
import {AttributePositionShaderNode as _AttributePositionShaderNode} from './foundation/materials/nodes/AttributePositionShaderNode';
import {AttributePositionShaderNode as _AttributeNormalShaderNode} from './foundation/materials/nodes/AttributeNormalShaderNode';
import {WorldMatrixShaderNode as _WorldMatrixShaderNode} from './foundation/materials/nodes/WorldMatrixShaderNode';
import {ViewMatrixShaderNode as _ViewMatrixShaderNode} from './foundation/materials/nodes/ViewMatrixShaderNode';
import {NormalMatrixShaderNode as _NormalMatrixShaderNode} from './foundation/materials/nodes/NormalMatrixShaderNode';
import {AABB as _AABB} from './foundation/math/AABB';
import {ProjectionMatrixShaderNode as _ProjectionMatrixShaderNode} from './foundation/materials/nodes/ProjectionMatrixShaderNode';
import {VaryingInVariableShaderNode as _VaryingInVariableShaderNode} from './foundation/materials/nodes/VaryingInVariableShaderNode';
import {VaryingOutVariableShaderNode as _VaryingOutVariableShaderNode} from './foundation/materials/nodes/VaryingOutVariableShaderNode';
import {UniformDataShaderNode as _UniformDataShaderNode} from './foundation/materials/nodes/UniformDataShaderNode';
import {NormalizeShaderNode as _NormalizeShaderNode} from './foundation/materials/nodes/NormalizeShaderNode';
import {IfStatementShaderNode as _IfStatementShaderNode} from './foundation/materials/nodes/IfStatementShaderNode';
import {BlockBeginShaderNode as _BlockBeginShaderNode} from './foundation/materials/nodes/BlockBeginShaderNode';
import {BlockEndShaderNode as _BlockEndShaderNode} from './foundation/materials/nodes/BlockEndShaderNode';
import {GreaterShaderNode as _GreaterShaderNode} from './foundation/materials/nodes/GreaterShaderNode';
import {ShaderGraphResolver as _ShaderGraphResolver} from './foundation/materials/core/ShaderGraphResolver';
import {Quaternion as _Quaternion} from './foundation/math/Quaternion';
import {MutableQuaternion as _MutableQuaternion} from './foundation/math/MutableQuaternion';
import {PbrShadingSingleMaterialNode as _PbrShadingSingleMaterialNode} from './foundation/materials/singles/PbrShadingSingleMaterialNode';
import {Buffer as _Buffer} from './foundation/memory/Buffer';
import {CGAPIResourceRepository as _CGAPIResourceRepository} from './foundation/renderer/CGAPIResourceRepository';
import {
  FileType as _FileType,
  FileTypeEnum as _FileTypeEnum,
} from './foundation/definitions/FileType';
import { WebXRSystem as _WebXRSystem } from './xr/WebXRSystem';
import {Effekseer} from './effekseer/main';
import {GetComponentFromEntities as _GetComponentFromEntities} from './foundation/enhanced_js_objects/Array';
import {
  ArrayAsRn as _ArrayAsRn,
  enhanceArray as _enhanceArray,
} from './foundation/enhanced_js_objects/Array';
import {VarianceShadowMapDecodeClassicSingleMaterialNode as _VarianceShadowMapDecodeClassicSingleMaterialNode} from './foundation/materials/singles/VarianceShadowMapDecodeClassicSingleMaterialNode';
import {FurnaceTestSingleMaterialNode as _FurnaceTestSingleMaterialNode} from './foundation/materials/singles/FurnaceTestSingleMaterialNode';
import {SynthesizeHDRMaterialNode as _SynthesizeHDRMaterialNode} from './foundation/materials/singles/SynthesizeHDRSingleMaterialNode';
import {DetectHighLuminanceSingleMaterialNode as _DetectHighLuminanceSingleMaterialNode} from './foundation/materials/singles/DetectHighLuminanceSingleMaterialNode';
import {DepthEncodeSingleMaterialNode as _DepthEncodeSingleMaterialNode} from './foundation/materials/singles/DepthEncodeSingleMaterialNode';
import {PbrShadingSingleMaterialNode as _PbrShadingMaterialNode} from './foundation/materials/singles/PbrShadingSingleMaterialNode';
import {MatCapSingleMaterialNode as _MatCapMaterialNode} from './foundation/materials/singles/MatCapSingleMaterialNode';
import {GaussianBlurNode as _GaussianBlurSingleMaterialNode} from './foundation/materials/singles/GaussianBlurSingleMaterialNode';
import {GaussianBlurForEncodedDepthNode as _GaussianBlurForEncodedDepthSingleMaterialNode} from './foundation/materials/singles/GaussianBlurForEncodedDepthSingleMaterialNode';
import {ImageUtil as _ImageUtil} from './foundation/math/ImageUtil';

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
import {GltfLoadOption as _GltfLoadOption} from './types/RnM2';
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
  ColorRgb: _ColorRgb,
  ColorRgba: _ColorRgba,
  MutableScalar: _MutableScalar,
  MutableVector2: _MutableVector2,
  MutableVector3: _MutableVector3,
  MutableVector4: _MutableVector4,
  MutableColorRgb: _MutableColorRgb,
  MutableColorRgba: _MutableColorRgba,
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
  _GLTF2_EXPORT_GLB: _GLTF2_EXPORT_GLB,
  _GLTF2_EXPORT_GLTF: _GLTF2_EXPORT_GLTF,
  _GLTF2_EXPORT_DRACO: _GLTF2_EXPORT_DRACO,
  _GLTF2_EXPORT_EMBEDDED: _GLTF2_EXPORT_EMBEDDED,
  detectFormatByArrayBuffers: _detectFormatByArrayBuffers,
  detectFormatByUri: _detectFormatByUri,
  Config: _Config,
  Plane: _Plane,
  Sphere: _Sphere,
  Cube: _Cube,
  Axis: _Axis,
  Joint: _Joint,
  Line: _Line,
  Grid: _Grid,
  Material: _Material,
  MaterialHelper: _MaterialHelper,
  MeshHelper: _MeshHelper,
  RenderPass: _RenderPass,
  Is: _Is as IsType,
  Frame: _Frame,
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
  ShadowMapDecodeClassicSingleMaterialNode:
    _ShadowMapDecodeClassicSingleMaterialNode,
  RnObject: _RnObject,
  VrmImporter: _VrmImporter,
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
  VarianceShadowMapDecodeClassicSingleMaterialNode:
    _VarianceShadowMapDecodeClassicSingleMaterialNode,
  FurnaceTestSingleMaterialNode: _FurnaceTestSingleMaterialNode,
  SynthesizeHDRMaterialNode: _SynthesizeHDRMaterialNode,
  DetectHighLuminanceSingleMaterialNode: _DetectHighLuminanceSingleMaterialNode,
  DepthEncodeSingleMaterialNode: _DepthEncodeSingleMaterialNode,
  PbrShadingMaterialNode: _PbrShadingMaterialNode,
  MatCapMaterialNode: _MatCapMaterialNode,
  GaussianBlurSingleMaterialNode: _GaussianBlurSingleMaterialNode,
  GaussianBlurForEncodedDepthSingleMaterialNode:
    _GaussianBlurForEncodedDepthSingleMaterialNode,
  ImageUtil: _ImageUtil,
  GetComponentFromEntities: _GetComponentFromEntities,
  enhanceArray: _enhanceArray,
  EffekseerComponent: Effekseer.EffekseerComponent,
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
export type MutableScalar = _MutableScalar;
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
export type Cube = _Cube;
export type PlaneDescriptor = _PlaneDescriptor;
export type SphereDescriptor = _SphereDescriptor;
export type CubeDescriptor = _CubeDescriptor;
export type AxisDescriptor = _AxisDescriptor;
export type JointDescriptor = _JointDescriptor;
export type LineDescriptor = _LineDescriptor;
export type GridDescriptor = _GridDescriptor;
export type Material = _Material;
export type MaterialHelper = typeof _MaterialHelper;
export type MeshHelper = typeof _MeshHelper;
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
export type ShadowMapDecodeClassicSingleMaterialNode =
  _ShadowMapDecodeClassicSingleMaterialNode;
export type RnObject = _RnObject;
export type VrmImporter = _VrmImporter;
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
export type Vector3AndScalarToVector4ShaderNode =
  _Vector3AndScalarToVector4ShaderNode;
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
export type VarianceShadowMapDecodeClassicSingleMaterialNode =
  _VarianceShadowMapDecodeClassicSingleMaterialNode;
export type FurnaceTestSingleMaterialNode = _FurnaceTestSingleMaterialNode;
export type SynthesizeHDRMaterialNode = _SynthesizeHDRMaterialNode;
export type DetectHighLuminanceSingleMaterialNode =
  _DetectHighLuminanceSingleMaterialNode;
export type DepthEncodeSingleMaterialNode = _DepthEncodeSingleMaterialNode;
export type PbrShadingMaterialNode = _PbrShadingMaterialNode;
export type MatCapMaterialNode = _MatCapMaterialNode;
export type GaussianBlurSingleMaterialNode = _GaussianBlurSingleMaterialNode;
export type GaussianBlurForEncodedDepthSingleMaterialNode =
  _GaussianBlurForEncodedDepthSingleMaterialNode;
export type ImageUtil = typeof _ImageUtil;
export type GetComponentFromEntities = typeof _GetComponentFromEntities;
export type VERSION = typeof _VERSION;
export type ArrayAsRn<T> = _ArrayAsRn<T>;
export type enhanceArray = typeof _enhanceArray;
export type EffekseerComponent = typeof Effekseer.EffekseerComponent;

// Definition Enums
export type CompositionTypeEnum = _CompositionTypeEnum;
export type ComponentTypeEnum = _ComponentTypeEnum;
export type CameraControllerTypeEnum = _CameraControllerTypeEnum;
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
