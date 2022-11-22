import {Entity} from '../foundation/core/Entity';
import {RnPromise} from '../foundation/misc/RnPromise';
import {Array3, Index} from './CommonTypes';
import {ShaderSemanticsEnum} from '../foundation/definitions/ShaderSemantics';
import {CameraComponent} from '../foundation/components/Camera/CameraComponent';
import {Material} from '../foundation/materials/core/Material';
import {Expression} from '../foundation/renderer/Expression';
import {ILoaderExtension} from '../foundation/importer/ILoaderExtension';
import {Accessor} from '../foundation/memory/Accessor';
import {
  GL_DATA_BYTE,
  GL_DATA_UNSIGNED_BYTE,
  GL_DATA_SHORT,
  GL_DATA_UNSIGNED_SHORT,
  GL_DATA_INT,
  GL_DATA_UNSIGNED_INT,
  GL_DATA_FLOAT,
} from '../types/WebGLConstants';

export interface Gltf2AnyObject {
  [s: string]: any;
}

export type Gltf2 = {
  asset: {
    extras?: {
      rnLoaderOptions?: GltfLoadOption;
      rnEntities?: Entity[];
      rnMaterials?: {[s: string]: Material};
      version?: string;
      fileType?: string;
    };
    generator: string;
    version: string;
  };
  buffers?: Gltf2Buffer[];
  scenes?: Gltf2Scene[];
  scene?: number;
  meshes?: Gltf2Mesh[];
  nodes?: Gltf2Node[];
  skins?: Gltf2Skin[];
  materials?: Gltf2Material[];
  cameras?: Gltf2Camera[];
  images?: Gltf2Image[];
  animations?: Gltf2Animation[];
  textures?: Gltf2Texture[];
  samplers?: Gltf2TextureSampler[];
  accessors?: Gltf2Accessor[];
  bufferViews?: Gltf2BufferView[];
  extensionsUsed?: string[];
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2Scene = {
  name?: string;
  scene?: number;
  nodes?: number[];
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type AttributeName =
  | 'POSITION'
  | 'NORMAL'
  | 'TANGENT'
  | 'TEXCOORD_0'
  | 'TEXCOORD_1'
  | 'TEXCOORD_2'
  | 'COLOR_0'
  | 'JOINTS_0'
  | 'WEIGHTS_0';

export type Gltf2AccessorComponentTypeNumber =
  | typeof GL_DATA_BYTE
  | typeof GL_DATA_UNSIGNED_BYTE
  | typeof GL_DATA_SHORT
  | typeof GL_DATA_UNSIGNED_SHORT
  | typeof GL_DATA_INT
  | typeof GL_DATA_UNSIGNED_INT
  | typeof GL_DATA_FLOAT;

export type Gltf2AnimationAccessorCompositionTypeString =
  | 'SCALAR'
  | 'VEC2'
  | 'VEC3'
  | 'VEC4';

export type Gltf2AccessorCompositionTypeString =
  | 'SCALAR'
  | 'VEC2'
  | 'VEC3'
  | 'VEC4'
  | 'MAT2'
  | 'MAT3'
  | 'MAT4';

export type Gltf2AccessorIndex = number;

export type Gltf2Attributes = {[s: string]: number};
export type Gltf2AttributeAccessors = Map<string, Gltf2Accessor>;
export type Gltf2AttributeBlendShapes = Gltf2Attributes[];
export type Gltf2AttributeBlendShapesAccessors = Gltf2AttributeAccessors[];

export type Gltf2Primitive = {
  attributes: Gltf2Attributes;
  indices?: number;
  material?: number;
  mode?: number;
  targets?: Gltf2AttributeBlendShapes;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2Mesh = {
  primitives: Gltf2Primitive[];
  weights?: number[];
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2Node = {
  camera?: number;
  children?: number[];
  skin?: number;
  matrix?: number[];
  mesh?: number;
  meshNames?: string[];
  rotation?: number[];
  scale?: number[];
  translation?: number[];
  weights?: number[];
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2Skin = {
  inverseBindMatrices?: number;
  bindShapeMatrix?: number[];
  skeleton?: number;
  joints: number[];
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2TextureInfo = {
  index: number;
  texCoord?: number;
  texture?: Gltf2Texture;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2OcclusionTextureInfo = {
  index: number;
  texCoord?: number;
  texture?: Gltf2Texture;
  strength?: number;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2NormalTextureInfo = {
  index: number;
  texCoord?: number;
  texture?: Gltf2Texture;
  scale?: number;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2PbrMetallicRoughness = {
  baseColorFactor?: number[];
  baseColorTexture?: Gltf2TextureInfo;
  metallicFactor?: number;
  roughnessFactor?: number;
  metallicRoughnessTexture?: Gltf2TextureInfo;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2Material = {
  pbrMetallicRoughness?: Gltf2PbrMetallicRoughness;
  normalTexture?: Gltf2NormalTextureInfo;
  occlusionTexture?: Gltf2OcclusionTextureInfo;
  emissiveTexture?: Gltf2TextureInfo;
  emissiveFactor?: number[];
  alphaMode?: string;
  alphaCutoff?: number;
  doubleSided?: boolean;
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2CameraOrthographic = {
  xmag: number;
  ymag: number;
  zfar: number;
  znear: number;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2CameraPerspective = {
  aspectRatio?: number;
  yfov: number;
  zfar?: number;
  znear: number;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2Camera = {
  orthographic?: Gltf2CameraOrthographic;
  perspective?: Gltf2CameraPerspective;
  type: string;
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2Image = {
  uri?: string;
  mimeType?: string;
  bufferView?: number;
  image?: HTMLImageElement;
  basis?: Uint8Array;
  ktx2?: Uint8Array;
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2AnimationPathName =
  | 'translation'
  | 'rotation'
  | 'scale'
  | 'weights'
  | 'effekseer';

export type Gltf2AnimationChannelTarget = {
  node?: number;
  path: Gltf2AnimationPathName;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

type Gltf2AnimationSamplerIndex = number;

export type Gltf2AnimationChannel = {
  sampler: Gltf2AnimationSamplerIndex;
  target: Gltf2AnimationChannelTarget;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2AnimationSamplerInterpolation =
  | 'LINEAR'
  | 'STEP'
  | 'CUBICSPLINE';

export type Gltf2AnimationSampler = {
  input: Gltf2AccessorIndex;
  output: Gltf2AccessorIndex;
  interpolation: Gltf2AnimationSamplerInterpolation;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2Animation = {
  channels: Gltf2AnimationChannel[];
  samplers: Gltf2AnimationSampler[];
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2Texture = {
  sampler?: number;
  source?: number;
  image?: Gltf2Image;
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2TextureSampler = {
  magFilter?: number;
  minFilter?: number;
  wrapS?: number;
  wrapT?: number;
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2SparseValues = {
  bufferView: number;
  byteOffset?: number;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2SparseIndices = {
  bufferView: number;
  byteOffset?: number;
  componentType: number;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2Sparse = {
  count: number;
  indices?: Gltf2SparseIndices;
  values?: Gltf2SparseValues;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export type Gltf2Buffer = {
  uri?: string;
  byteLength: number;
  buffer?: Uint8Array; // Uint8Array is needed instead of ArrayBuffer, because it may have non-zero byteoffset for .glb file header
  dataUri?: string;
  bufferPromise?: RnPromise<ArrayBuffer>;
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
};

export interface Gltf2BufferView {
  buffer?: number;
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
  target?: number;
  name?: string;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
}

export interface Gltf2Accessor {
  bufferView?: number;
  byteOffset?: number;
  byteStride?: number; // for glTF1 only
  componentType: Gltf2AccessorComponentTypeNumber;
  normalized?: boolean;
  count: number;
  type: Gltf2AccessorCompositionTypeString;
  max?: number[];
  min?: number[];
  sparse?: Gltf2Sparse;
  name?: string;
  accessor?: Accessor;
  extensions?: Gltf2AnyObject;
  extras?: Gltf2AnyObject;
}

export type PointType = 'directional' | 'point' | 'spot';

export type KHR_lights_punctual_Light = {
  color: Array3<number>;
  type: PointType;
  name?: string;
  intensity?: number;
  range: number;
  spot?: {
    innerConeAngle?: number;
    outerConeAngle?: number;
  };
};

export type KHR_lights_punctual = {
  lights: KHR_lights_punctual_Light[];
};

export type GltfFileBuffers = {
  [s: string]: ArrayBuffer;
  //        "foo.gltf": content of file as ArrayBuffer,
  //        "foo.bin": content of file as ArrayBuffer,
  //        "boo.png": content of file as ArrayBuffer
};

export type GltfLoadOption = {
  files?: GltfFileBuffers;
  loaderExtensionName?: string;
  loaderExtension?: ILoaderExtension;
  defaultMaterialHelperName?: string;
  defaultMaterialHelperArgumentArray?: any[];
  statesOfElements?: [
    {
      targets: any[]; //["name_foo", "name_boo"],
      states: {
        enable: any[];
        // 3042,  // BLEND
        functions: object; //"blendFuncSeparate": [1, 0, 1, 0],
      };
      isTransparent: boolean;
      opacity: number;
      isTextureImageToLoadPreMultipliedAlpha: boolean;
    }
  ];
  alphaMode?: string;
  ignoreLists?: [];
  autoDetectTextureTransparency?: boolean;
  autoResizeTexture?: boolean;
  tangentCalculationMode?: Index;
  extendedJson?: string | Object | ArrayBuffer; //   URI string / JSON Object / ArrayBuffer
  maxMorphTargetNumber?: number;
  defaultTextures?: {
    basePath: string; // e.g. "./assets/jpg/"
    textureInfos: {
      shaderSemantics: ShaderSemanticsEnum;
      fileName: string;
      image?: Gltf2Image;
      sampler?: any;
    }[];
  };
  cameraComponent?: CameraComponent;
  fileType?: string;
  expression?: Expression; // If specified, GltfImporter set render passes including loaded model to this expression
  transmission?: boolean; // Set to true by the importer if the KHS_material_transmission extension is used.
  __isImportVRM0x?: boolean; // internal use only
};

export const TagGltf2NodeIndex = 'gltf_node_index';

export function isSameGlTF2TextureSampler(
  lhs: Gltf2TextureSampler,
  rhs: Gltf2TextureSampler
) {
  return (
    lhs.magFilter === rhs.magFilter &&
    lhs.minFilter === rhs.minFilter &&
    lhs.wrapS === rhs.wrapS &&
    lhs.wrapT === rhs.wrapT
  );
}
