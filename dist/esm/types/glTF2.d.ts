import { Entity } from '../foundation/core/Entity';
import { RnPromise } from '../foundation/misc/RnPromise';
import { Array3, Index } from './CommonTypes';
import { ShaderSemanticsEnum } from '../foundation/definitions/ShaderSemantics';
import { CameraComponent } from '../foundation/components/Camera/CameraComponent';
import { Material } from '../foundation/materials/core/Material';
import { Expression } from '../foundation/renderer/Expression';
import { ILoaderExtension } from '../foundation/importer/ILoaderExtension';
import { Accessor } from '../foundation/memory/Accessor';
import { GL_DATA_BYTE, GL_DATA_UNSIGNED_BYTE, GL_DATA_SHORT, GL_DATA_UNSIGNED_SHORT, GL_DATA_INT, GL_DATA_UNSIGNED_INT, GL_DATA_FLOAT } from '../types/WebGLConstants';
export interface Gltf2AnyObject {
    [s: string]: any;
}
export declare type Gltf2 = {
    asset: {
        extras?: {
            rnLoaderOptions?: GltfLoadOption;
            rnEntities?: Entity[];
            rnMaterials?: {
                [s: string]: Material;
            };
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
export declare type Gltf2Scene = {
    name?: string;
    scene?: number;
    nodes?: number[];
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type AttributeName = 'POSITION' | 'NORMAL' | 'TANGENT' | 'TEXCOORD_0' | 'TEXCOORD_1' | 'TEXCOORD_2' | 'COLOR_0' | 'JOINTS_0' | 'WEIGHTS_0';
export declare type Gltf2AccessorComponentTypeNumber = typeof GL_DATA_BYTE | typeof GL_DATA_UNSIGNED_BYTE | typeof GL_DATA_SHORT | typeof GL_DATA_UNSIGNED_SHORT | typeof GL_DATA_INT | typeof GL_DATA_UNSIGNED_INT | typeof GL_DATA_FLOAT;
export declare type Gltf2AnimationAccessorCompositionTypeString = 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4';
export declare type Gltf2AccessorCompositionTypeString = 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT2' | 'MAT3' | 'MAT4';
export declare type Gltf2AccessorIndex = number;
export declare type Gltf2Attributes = {
    [s: string]: number;
};
export declare type Gltf2AttributeAccessors = Map<string, Gltf2Accessor>;
export declare type Gltf2AttributeBlendShapes = Gltf2Attributes[];
export declare type Gltf2AttributeBlendShapesAccessors = Gltf2AttributeAccessors[];
export declare type Gltf2Primitive = {
    attributes: Gltf2Attributes;
    indices?: number;
    material?: number;
    mode?: number;
    targets?: Gltf2AttributeBlendShapes;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2Mesh = {
    primitives: Gltf2Primitive[];
    weights?: number[];
    name?: string;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2Node = {
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
export declare type Gltf2Skin = {
    inverseBindMatrices?: number;
    bindShapeMatrix?: number[];
    skeleton?: number;
    joints: number[];
    name?: string;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2TextureInfo = {
    index: number;
    texCoord?: number;
    texture?: Gltf2Texture;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2OcclusionTextureInfo = {
    index: number;
    texCoord?: number;
    texture?: Gltf2Texture;
    strength?: number;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2NormalTextureInfo = {
    index: number;
    texCoord?: number;
    texture?: Gltf2Texture;
    scale?: number;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2PbrMetallicRoughness = {
    baseColorFactor?: number[];
    baseColorTexture?: Gltf2TextureInfo;
    metallicFactor?: number;
    roughnessFactor?: number;
    metallicRoughnessTexture?: Gltf2TextureInfo;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2Material = {
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
export declare type Gltf2CameraOrthographic = {
    xmag: number;
    ymag: number;
    zfar: number;
    znear: number;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2CameraPerspective = {
    aspectRatio?: number;
    yfov: number;
    zfar?: number;
    znear: number;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2Camera = {
    orthographic?: Gltf2CameraOrthographic;
    perspective?: Gltf2CameraPerspective;
    type: string;
    name?: string;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2Image = {
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
export declare type Gltf2AnimationPathName = 'translation' | 'rotation' | 'scale' | 'weights' | 'effekseer';
export declare type Gltf2AnimationChannelTarget = {
    node?: number;
    path: Gltf2AnimationPathName;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
declare type Gltf2AnimationSamplerIndex = number;
export declare type Gltf2AnimationChannel = {
    sampler: Gltf2AnimationSamplerIndex;
    target: Gltf2AnimationChannelTarget;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2AnimationSamplerInterpolation = 'LINEAR' | 'STEP' | 'CUBICSPLINE';
export declare type Gltf2AnimationSampler = {
    input: Gltf2AccessorIndex;
    output: Gltf2AccessorIndex;
    interpolation: Gltf2AnimationSamplerInterpolation;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2Animation = {
    channels: Gltf2AnimationChannel[];
    samplers: Gltf2AnimationSampler[];
    name?: string;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2Texture = {
    sampler?: number;
    source?: number;
    image?: Gltf2Image;
    name?: string;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2TextureSampler = {
    magFilter?: number;
    minFilter?: number;
    wrapS?: number;
    wrapT?: number;
    name?: string;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2SparseValues = {
    bufferView: number;
    byteOffset?: number;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2SparseIndices = {
    bufferView: number;
    byteOffset?: number;
    componentType: number;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2Sparse = {
    count: number;
    indices?: Gltf2SparseIndices;
    values?: Gltf2SparseValues;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
export declare type Gltf2Buffer = {
    uri?: string;
    byteLength: number;
    buffer?: Uint8Array;
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
    byteStride?: number;
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
export declare type PointType = 'directional' | 'point' | 'spot';
export declare type KHR_lights_punctual_Light = {
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
export declare type KHR_lights_punctual = {
    lights: KHR_lights_punctual_Light[];
};
export declare type GltfFileBuffers = {
    [s: string]: ArrayBuffer;
};
export declare type GltfLoadOption = {
    files?: GltfFileBuffers;
    loaderExtensionName?: string;
    loaderExtension?: ILoaderExtension;
    defaultMaterialHelperName?: string;
    defaultMaterialHelperArgumentArray?: any[];
    statesOfElements?: [
        {
            targets: any[];
            states: {
                enable: any[];
                functions: object;
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
    extendedJson?: string | Object | ArrayBuffer;
    maxMorphTargetNumber?: number;
    defaultTextures?: {
        basePath: string;
        textureInfos: {
            shaderSemantics: ShaderSemanticsEnum;
            fileName: string;
            image?: Gltf2Image;
            sampler?: any;
        }[];
    };
    cameraComponent?: CameraComponent;
    fileType?: string;
    expression?: Expression;
    transmission?: boolean;
    __isImportVRM?: boolean;
};
export declare const TagGltf2NodeIndex = "gltf_node_index";
export declare function isSameGlTF2TextureSampler(lhs: Gltf2TextureSampler, rhs: Gltf2TextureSampler): boolean;
export {};
