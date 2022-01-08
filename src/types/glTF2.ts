import Entity from '../foundation/core/Entity';
import RnPromise from '../foundation/misc/RnPromise';
import {Array3, Index} from './CommonTypes';
import {ShaderSemanticsEnum} from '../foundation/definitions/ShaderSemantics';
import CameraComponent from '../foundation/components/CameraComponent';
import Material from '../foundation/materials/core/Material';
import Expression from '../foundation/renderer/Expression';
import ILoaderExtension from '../foundation/importer/ILoaderExtension';
import Accessor from '../foundation/memory/Accessor';

export type glTF2 = {
  asset: {
    extras?: {
      rnLoaderOptions?: GltfLoadOption;
      rnEntities?: Entity[];
      rnMaterials?: {[s: string]: Material};
      version?: string;
      fileType?: string;
    };
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
  extensions?: any;
};

export type Gltf2Scene = {
  name?: string;
  scene?: number;
  nodes?: number[];
  extensions: any;
  extras?: any;
};

export type AttributeName =
  | 'POSITION'
  | 'NORMAL'
  | 'TANGENT'
  | 'TEXCOORD_0'
  | 'TEXCOORD_1'
  | 'COLOR_0'
  | 'JOINTS_0'
  | 'WEIGHTS_0';

export type Gltf2Attributes = {[s: string]: number};
export type Gltf2AttributeAccessors = Map<string, Gltf2Accessor>;
export type Gltf2AttributeBlendShapes = Gltf2Attributes[];
export type Gltf2AttributeBlendShapesAccessors = Gltf2AttributeAccessors[];

export type Gltf2Primitive = {
  attributes?: Gltf2Attributes;
  indices?: number;
  material?: number;
  mode?: number;
  targets?: Gltf2AttributeBlendShapes;
  extensions?: any;
  extras?: any;
};

export type Gltf2Mesh = {
  primitives: Gltf2Primitive[];
  weights?: number[];
  name?: string;
  extensions: any;
  extras?: any;
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
  extensions?: any;
  extras?: any;
};

export type Gltf2Skin = {
  inverseBindMatrices?: number;
  bindShapeMatrix?: number[];
  skeleton?: number;
  joints: number[];
  name?: string;
  extensions?: any;
  extras?: any;
};

export type Gltf2TextureInfo = {
  index: number;
  texCoord?: number;
  texture?: Gltf2Texture;
  extensions?: any;
  extras?: any;
};

export type Gltf2OcclusionTextureInfo = {
  index: number;
  texCoord?: number;
  texture?: Gltf2Texture;
  strength?: number;
  extensions?: any;
  extras?: any;
};

export type Gltf2NormalTextureInfo = {
  index: number;
  texCoord?: number;
  texture?: Gltf2Texture;
  scale?: number;
  extensions?: any;
  extras?: any;
};

export type Gltf2PbrMetallicRoughness = {
  baseColorFactor?: number[];
  baseColorTexture?: Gltf2TextureInfo;
  metallicFactor?: number;
  roughnessFactor?: number;
  metallicRoughnessTexture?: Gltf2TextureInfo;
  extensions?: any;
  extras?: any;
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
  extensions?: any;
  extras?: any;
};

export type Gltf2CameraOrthographic = {
  xmag: number;
  ymag: number;
  zfar: number;
  znear: number;
  extensions?: any;
  extras?: any;
};

export type Gltf2CameraPerspective = {
  aspectRatio?: number;
  yfov: number;
  zfar?: number;
  znear: number;
  extensions?: any;
  extras?: any;
};

export type Gltf2Camera = {
  orthographic?: Gltf2CameraOrthographic;
  perspective?: Gltf2CameraPerspective;
  type: string;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type Gltf2Image = {
  uri?: string;
  mimeType?: string;
  bufferView?: number;
  image?: HTMLImageElement;
  basis?: Uint8Array;
  ktx2?: Uint8Array;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type PathType = 'translation' | 'rotation' | 'scale' | 'weights';

export type Gltf2AnimationChannelTarget = {
  node?: number;
  path: PathType;
  extensions?: any;
  extras?: any;
};

export type Gltf2AnimationChannel = {
  sampler: number;
  target: Gltf2AnimationChannelTarget;
  extensions?: any;
  extras?: any;
};

export type Gltf2AnimationSampler = {
  input: number;
  output: number;
  interpolation?: string;
  extensions?: any;
  extras?: any;
};

export type Gltf2Animation = {
  channels: Gltf2AnimationChannel[];
  samplers: Gltf2AnimationSampler[];
  name?: string;
  extensions?: any;
  extras?: any;
};

export type Gltf2Texture = {
  sampler?: number;
  source?: number;
  image?: Gltf2Image;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type Gltf2TextureSampler = {
  magFilter?: number;
  minFilter?: number;
  wrapS?: number;
  wrapT?: number;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type Gltf2SparseValues = {
  bufferView: number;
  byteOffset?: number;
  extensions?: any;
  extras?: any;
};

export type Gltf2SparseIndices = {
  bufferView: number;
  byteOffset?: number;
  componentType: number;
  extensions?: any;
  extras?: any;
};

export type Gltf2Sparse = {
  count: number;
  indices?: Gltf2SparseIndices;
  values?: Gltf2SparseValues;
  extensions?: any;
  extras?: any;
};

export type Gltf2Accessor = {
  bufferView?: number;
  byteOffset?: number;
  byteStride?: number; // for glTF1 only
  componentType: number;
  normalized?: boolean;
  count: number;
  type: string;
  max?: number[];
  min?: number[];
  sparse?: Gltf2Sparse;
  name?: string;
  accessor?: Accessor;
  extensions?: any;
  extras?: {
    attributeName: string;
    toGetAsTypedArray: boolean;
    typedDataArray?: Float32Array;
    componentN?: number;
    componentBytes?: number;
    dataViewMethod?: string;
    weightsArrayLength?: number;
    quaternionIfVec4?: boolean;
  };
};

export type Gltf2Buffer = {
  uri?: string;
  byteLength: number;
  buffer?: Uint8Array; // Uint8Array is needed instead of ArrayBuffer, because it may have non-zero byteoffset for .glb file header
  dataUri?: string;
  bufferPromise?: RnPromise<ArrayBuffer>;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type Gltf2BufferView = {
  buffer?: number;
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
  target: number;
  name?: string;
  extensions?: any;
  extras?: any;
};


export type glTF1 = {
  asset: {
    extras?: {
      rnLoaderOptions?: {[s: string]: any};
      version?: string;
      fileType?: string;
    };
  };
  buffers: any[];
  bufferDic: object;

  scenes: any[];
  sceneDic: object;

  meshes: any[];
  meshDic: object;

  nodesIndices: number[];
  nodes: any[];
  nodeDic: object;

  skins: any[];
  skinDic: object;

  materials: any[];
  materialDic: object;

  cameras: any[];
  cameraDic: object;

  shaders: any[];
  shaderDic: object;

  images: any[];
  imageDic: object;

  animations: Array<{
    channels: any[];
    samplers: any[];
    parameters: {[s: string]: any};
  }>;

  animationDic: {
    [s: string]: {
      channels: any[];
      samplers: any[];
    };
  };

  textures: any[];
  textureDic: object;

  samplers: any[];
  samplerDic: object;

  accessors: any[];
  accessorDic: object;

  bufferViews: any[];
  bufferViewDic: object;

  buffer: any[];
  techniques: any[];
};

export type PointType = 'directional' | 'point' | 'spot';

export type KHR_lights_punctual_Light = {
  color: Array3<number>;
  type: PointType;
  name?: string;
  intensity?: number;
  range: number;
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
  isPreComputeForRayCastPickingEnable?: boolean;
  extendedJson?: string | Object | ArrayBuffer; //   URI string / JSON Object / ArrayBuffer
  isImportVRM?: boolean;
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
};
