import Entity from '../foundation/core/Entity';
import RnPromise from '../foundation/misc/RnPromise';
import {Array3, Index, TypedArray} from './CommonTypes';
import {ShaderSemanticsEnum} from '../foundation/definitions/ShaderSemantics';
import CameraComponent from '../foundation/components/CameraComponent';
import Material from '../foundation/materials/core/Material';
import Expression from '../foundation/renderer/Expression';
import ILoaderExtension from '../foundation/importer/ILoaderExtension';
import Accessor from '../foundation/memory/Accessor';

export type RnMScene = {
  nodesObjects?: RnMNode[];
  name?: string;
  scene?: number;
  sceneObject?: RnMNode;
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

export type RnMAttribute = {[s: string]: number};
export type RnMAttributeAccessor = {[s: string]: RnMAccessor};
export type RnMAttributeBlendShape = RnMAttribute;
export type RnMAttributeBlendShapeAccessor = RnMAttributeAccessor;

export type RnMPrimitive = {
  attributesObjects?: RnMAttributeAccessor;
  attributes?: RnMAttribute;
  indicesObject?: RnMAccessor;
  indices?: number;
  materialObject?: RnMMaterial;
  material?: number;
  mode?: number;
  targetsObjects?: RnMAttributeBlendShapeAccessor;
  targets?: RnMAttributeBlendShape;
  extensions?: any;
  extras?: any;
};

export type RnMMesh = {
  primitives: RnMPrimitive[];
  weights?: number[];
  name?: string;
  extensions: any;
  extras?: any;
};

export type RnMNode = {
  cameraObject?: RnMCamera;
  camera?: number;
  childrenObjects?: RnMNode[];
  children?: number[];
  skinObject?: RnMSkin;
  skin?: number;
  matrix?: number[];
  meshObject?: RnMMesh;
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

export type RnMSkin = {
  inverseBindMatrices?: number;
  inverseBindMatricesObject?: RnMAccessor;
  bindShapeMatrix?: number[];
  skeleton?: number;
  skeletonObject?: RnMNode;
  joints: number[];
  jointsObjects: RnMNode[];
  name?: string;
  extensions?: any;
  extras?: any;
};

export type RnMTextureInfo = {
  index: number;
  texCoord?: number;
  texture?: RnMTexture;
  extensions?: any;
  extras?: any;
};

export type RnMOcclusionTextureInfo = {
  index: number;
  texCoord?: number;
  texture?: RnMTexture;
  strength?: number;
  extensions?: any;
  extras?: any;
};

export type RnMNormalTextureInfo = {
  index: number;
  texCoord?: number;
  texture?: RnMTexture;
  scale?: number;
  extensions?: any;
  extras?: any;
};

export type RnMPbrMetallicRoughness = {
  baseColorFactor?: number[];
  baseColorTexture?: RnMTextureInfo;
  metallicFactor?: number;
  roughnessFactor?: number;
  metallicRoughnessTexture?: RnMTextureInfo;
  extensions?: any;
  extras?: any;
};

export type RnMMaterial = {
  pbrMetallicRoughness?: RnMPbrMetallicRoughness;
  normalTexture?: RnMNormalTextureInfo;
  occlusionTexture?: RnMOcclusionTextureInfo;
  emissiveTexture?: RnMTextureInfo;
  emissiveFactor?: number[];
  alphaMode?: string;
  alphaCutoff?: number;
  doubleSided?: boolean;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type RnMCameraOrthographic = {
  xmag: number;
  ymag: number;
  zfar: number;
  znear: number;
  extensions?: any;
  extras?: any;
};

export type RnMCameraPerspective = {
  aspectRatio?: number;
  yfov: number;
  zfar?: number;
  znear: number;
  extensions?: any;
  extras?: any;
};

export type RnMCamera = {
  orthographic?: RnMCameraOrthographic;
  perspective?: RnMCameraPerspective;
  type: string;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type RnMImage = {
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

export type RnMAnimationChannelTarget = {
  nodeObject?: RnMNode;
  node?: number;
  path: PathType;
  extensions?: any;
  extras?: any;
};

export type RnMAnimationChannel = {
  samplerObject?: RnMAnimationSampler;
  sampler: number;
  target: RnMAnimationChannelTarget;
  extensions?: any;
  extras?: any;
};

export type RnMAnimationSampler = {
  inputObject?: RnMAccessor;
  input: number;
  outputObject?: RnMAccessor;
  output: number;
  interpolation?: string;
  extensions?: any;
  extras?: any;
};

export type RnMAnimation = {
  channels: RnMAnimationChannel[];
  samplers: RnMAnimationSampler[];
  name?: string;
  extensions?: any;
  extras?: any;
};

export type RnMTexture = {
  samplerObject?: RnMTextureSampler;
  sampler?: number;
  sourceObject?: RnMImage;
  source?: number;
  image?: RnMImage;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type RnMTextureSampler = {
  magFilter?: number;
  minFilter?: number;
  wrapS?: number;
  wrapT?: number;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type RnMSparseValues = {
  bufferView: number;
  bufferViewObject: RnMBufferView;
  byteOffset?: number;
  extensions?: any;
  extras?: any;
};

export type RnMSparseIndices = {
  bufferView: number;
  bufferViewObject: RnMBufferView;
  byteOffset?: number;
  componentType: number;
  extensions?: any;
  extras?: any;
};

export type RnMSparse = {
  count: number;
  indices?: RnMSparseIndices;
  values?: RnMSparseValues;
  extensions?: any;
  extras?: any;
};

export type RnMAccessor = {
  bufferViewObject?: RnMBufferView;
  bufferView?: number;
  byteOffset?: number;
  byteStride?: number; // for glTF1 only
  componentType: number;
  normalized?: boolean;
  count: number;
  type: string;
  max?: number[];
  min?: number[];
  sparse?: RnMSparse;
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

export type RnMBuffer = {
  uri?: string;
  byteLength: number;
  buffer?: Uint8Array; // Uint8Array is needed insted of ArrayBuffer, because it may have non-zero byteoffset for .glb file header
  dataUri?: string;
  bufferPromise?: RnPromise<ArrayBuffer>;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type RnMBufferView = {
  bufferObject?: RnMBuffer;
  buffer?: number;
  byteOffset?: number;
  byteLength: number;
  byteStride?: number;
  target: number;
  name?: string;
  extensions?: any;
  extras?: any;
};

export type RnM = {
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
  buffers: RnMBuffer[];
  scenes: RnMScene[];
  scene: number;
  meshes: RnMMesh[];
  nodes: RnMNode[];
  skins: RnMSkin[];
  materials: RnMMaterial[];
  cameras: RnMCamera[];
  images: RnMImage[];
  animations: RnMAnimation[];
  textures?: RnMTexture[];
  samplers: RnMTextureSampler[];
  accessors: RnMAccessor[];
  bufferViews: RnMBufferView[];
  extensionsUsed?: string[];
  extensions?: any;
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
  bufferDic: Object;

  scenes: any[];
  sceneDic: Object;

  meshes: any[];
  meshDic: Object;

  nodesIndices: number[];
  nodes: any[];
  nodeDic: Object;

  skins: any[];
  skinDic: Object;

  materials: any[];
  materialDic: Object;

  cameras: any[];
  cameraDic: Object;

  shaders: any[];
  shaderDic: Object;

  images: any[];
  imageDic: Object;

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
  textureDic: Object;

  samplers: any[];
  samplerDic: Object;

  accessors: any[];
  accessorDic: Object;

  bufferViews: any[];
  bufferViewDic: Object;

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
        functions: Object; //"blendFuncSeparate": [1, 0, 1, 0],
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
      image?: RnMImage;
      sampler?: any;
    }[];
  };
  cameraComponent?: CameraComponent;
  fileType?: string;
  expression?: Expression; // If specified, GltfImporter set render passes including loaded model to this expression
};
