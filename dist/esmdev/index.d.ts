import { ShaderityObject } from 'shaderity';
import { MotionController } from 'webxr-input-profiles/packages/motion-controllers/src/motionController.js';

interface EnumIO {
    readonly index: number;
    readonly str: string;
    readonly symbol: symbol;
    toString(): string;
    toJSON(): number;
}
declare class EnumClass implements EnumIO {
    readonly index: number;
    readonly symbol: symbol;
    readonly str: string;
    private static __indices;
    private static __strings;
    constructor({ index, str, noCheckStrUnique, }: {
        index: number;
        str: string;
        noCheckStrUnique?: boolean;
    });
    toString(): string;
    toJSON(): number;
}
declare function _from({ typeList, index, }: {
    typeList: Array<EnumIO>;
    index: number;
}): EnumIO | undefined;
declare function _fromString({ typeList, str, }: {
    typeList: Array<EnumIO>;
    str: string;
}): EnumIO | undefined;
declare function _fromStringCaseSensitively({ typeList, str, }: {
    typeList: Array<EnumIO>;
    str: string;
}): EnumIO | undefined;

type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
type FloatTypedArray = Float32Array | Float64Array;
type IntegerTypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array;
type ArrayType = TypedArray | Array<number>;
type TypedArrayConstructor = Int8ArrayConstructor | Uint8ArrayConstructor | Uint8ClampedArrayConstructor | Int16ArrayConstructor | Uint16ArrayConstructor | Int32ArrayConstructor | Uint32ArrayConstructor | Float32ArrayConstructor | Float64ArrayConstructor;
type FloatTypedArrayConstructor = Float32ArrayConstructor | Float64ArrayConstructor;
type Array16<T> = [T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T];
type Array9<T> = [T, T, T, T, T, T, T, T, T];
type primitives = number | string | boolean | null | undefined;
type Array4<T> = [T, T, T, T];
type Array3<T> = [T, T, T];
type Array2<T> = [T, T];
type Array1<T> = [T];
type Array1to4<T> = Array1<T> | Array2<T> | Array3<T> | Array4<T>;
type VectorComponentN = 1 | 2 | 3 | 4;
type VectorAndSquareMatrixComponentN = 1 | 2 | 3 | 4 | 9 | 16;
type SquareMatrixComponentN = 4 | 9 | 16;
type Index = number;
type IndexOf16Bytes = number;
type IndexOf4Bytes = number;
type Offset = number;
type Size = number;
type Count = number;
type Byte$1 = number;
type Second = number;
type MilliSecond = number;
type ObjectUID = Index;
type PrimitiveUID = Index;
type EntityUID = Index;
type ComponentTID = Index;
type ComponentSID = Index;
type MaterialNodeUID$1 = Index;
type MaterialUID = Index;
type MaterialSID = Index;
type MaterialTID = Index;
type TextureUID = Index;
type MeshUID = Index;
type CameraSID = Index;
type RenderPassUID = Index;
type WebGLResourceHandle = number;
type WebGPUResourceHandle = number;
type CGAPIResourceHandle = WebGLResourceHandle;
type RnTags = {
    [s: string]: any;
};
type ColorComponentLetter = 'r' | 'g' | 'b' | 'a';

type ShaderTypeEnum = EnumIO;
declare function from$s(index: number): ShaderTypeEnum;
declare function fromString$k(str: string): ShaderTypeEnum;
declare const ShaderType: Readonly<{
    VertexShader: EnumIO;
    PixelShader: EnumIO;
    VertexAndPixelShader: EnumIO;
    ComputeShader: EnumIO;
    from: typeof from$s;
    fromString: typeof fromString$k;
}>;

type ShaderSemanticsInfo = {
    semantic: ShaderSemanticsName;
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    stage: ShaderTypeEnum;
    min: number;
    max: number;
    initialValue?: any;
    isInternalSetting?: boolean;
    arrayLength?: Count;
    soloDatum?: boolean;
    needUniformInDataTextureMode?: boolean;
    valueStep?: number;
    xName?: string;
    yName?: string;
    zName?: string;
    wName?: string;
};
declare function calcAlignedByteLength(semanticInfo: ShaderSemanticsInfo): number;

type ShaderSemanticsIndex = number;
type ShaderSemanticsName = string;
interface ShaderSemanticsEnum extends EnumIO {
    str: string;
}
declare class ShaderSemanticsClass extends EnumClass implements ShaderSemanticsEnum {
    private static __indexCount;
    static readonly _scale = 10000;
    private static __classes;
    constructor({ str }: {
        index?: number;
        str: string;
    });
    static getShaderSemanticByIndex(index: ShaderSemanticsIndex): ShaderSemanticsClass;
    static isNonArrayShaderSemanticIndex(index: ShaderSemanticsIndex): boolean;
    static isArrayAndZeroIndexShaderSemanticIndex(index: ShaderSemanticsIndex): boolean;
    static isArrayAndNonZeroIndexShaderSemanticIndex(index: ShaderSemanticsIndex): boolean;
    static getIndexCount(): number;
}
declare function from$r(index: ShaderSemanticsIndex): ShaderSemanticsEnum;
declare function fromString$j(str: string): ShaderSemanticsEnum;
declare function fromStringCaseSensitively(str: string): ShaderSemanticsEnum;
type getShaderPropertyFunc = (materialTypeName: string, info: ShaderSemanticsInfo, isGlobalData: boolean, isWebGL2: boolean) => string;
/**
 * @internal
 */
declare function _getPropertyIndex2(shaderSemantic: ShaderSemanticsEnum): number;
declare const ShaderSemantics: Readonly<{
    from: typeof from$r;
    fromString: typeof fromString$j;
    fromStringCaseSensitively: typeof fromStringCaseSensitively;
    WorldMatrix: ShaderSemanticsEnum;
    ViewMatrix: ShaderSemanticsEnum;
    IsBillboard: ShaderSemanticsEnum;
    EnableViewMatrix: ShaderSemanticsEnum;
    ProjectionMatrix: ShaderSemanticsEnum;
    NormalMatrix: ShaderSemanticsEnum;
    BoneMatrix: ShaderSemanticsEnum;
    BaseColorFactor: ShaderSemanticsEnum;
    BaseColorTexture: ShaderSemanticsEnum;
    NormalTexture: ShaderSemanticsEnum;
    MetallicRoughnessTexture: ShaderSemanticsEnum;
    OcclusionTexture: ShaderSemanticsEnum;
    EmissiveFactor: ShaderSemanticsEnum;
    EmissiveTexture: ShaderSemanticsEnum;
    LightNumber: ShaderSemanticsEnum;
    LightPosition: ShaderSemanticsEnum;
    LightDirection: ShaderSemanticsEnum;
    LightIntensity: ShaderSemanticsEnum;
    LightProperty: ShaderSemanticsEnum;
    MetallicRoughnessFactor: ShaderSemanticsEnum;
    BrdfLutTexture: ShaderSemanticsEnum;
    DiffuseEnvTexture: ShaderSemanticsEnum;
    SpecularEnvTexture: ShaderSemanticsEnum;
    SheenEnvTexture: ShaderSemanticsEnum;
    InverseEnvironment: ShaderSemanticsEnum;
    IBLParameter: ShaderSemanticsEnum;
    ViewPosition: ShaderSemanticsEnum;
    Wireframe: ShaderSemanticsEnum;
    DiffuseColorFactor: ShaderSemanticsEnum;
    DiffuseColorTexture: ShaderSemanticsEnum;
    Shininess: ShaderSemanticsEnum;
    ShadingModel: ShaderSemanticsEnum;
    SkinningMode: ShaderSemanticsEnum;
    GeneralTexture: ShaderSemanticsEnum;
    VertexAttributesExistenceArray: ShaderSemanticsEnum;
    BoneQuaternion: ShaderSemanticsEnum;
    BoneTranslateScale: ShaderSemanticsEnum;
    BoneTranslatePackedQuat: ShaderSemanticsEnum;
    BoneScalePackedQuat: ShaderSemanticsEnum;
    BoneCompressedChunk: ShaderSemanticsEnum;
    BoneCompressedInfo: ShaderSemanticsEnum;
    PointSize: ShaderSemanticsEnum;
    ColorEnvTexture: ShaderSemanticsEnum;
    PointDistanceAttenuation: ShaderSemanticsEnum;
    HDRIFormat: ShaderSemanticsEnum;
    ScreenInfo: ShaderSemanticsEnum;
    DepthTexture: ShaderSemanticsEnum;
    LightViewProjectionMatrix: ShaderSemanticsEnum;
    Anisotropy: ShaderSemanticsEnum;
    ClearCoatParameter: ShaderSemanticsEnum;
    SheenColorFactor: ShaderSemanticsEnum;
    SheenColorTexture: ShaderSemanticsEnum;
    SheenRoughnessFactor: ShaderSemanticsEnum;
    SheenRoughnessTexture: ShaderSemanticsEnum;
    SheenLutTexture: ShaderSemanticsEnum;
    SpecularGlossinessFactor: ShaderSemanticsEnum;
    SpecularGlossinessTexture: ShaderSemanticsEnum;
    ClearCoatFactor: ShaderSemanticsEnum;
    ClearCoatTexture: ShaderSemanticsEnum;
    ClearCoatRoughnessFactor: ShaderSemanticsEnum;
    ClearCoatRoughnessTexture: ShaderSemanticsEnum;
    ClearCoatNormalTexture: ShaderSemanticsEnum;
    TransmissionFactor: ShaderSemanticsEnum;
    TransmissionTexture: ShaderSemanticsEnum;
    BackBufferTexture: ShaderSemanticsEnum;
    BackBufferTextureSize: ShaderSemanticsEnum;
    ThicknessFactor: ShaderSemanticsEnum;
    ThicknessTexture: ShaderSemanticsEnum;
    AttenuationDistance: ShaderSemanticsEnum;
    AttenuationColor: ShaderSemanticsEnum;
    getShaderProperty: getShaderPropertyFunc;
    EntityUID: ShaderSemanticsEnum;
    MorphTargetNumber: ShaderSemanticsEnum;
    DataTextureMorphOffsetPosition: ShaderSemanticsEnum;
    MorphWeights: ShaderSemanticsEnum;
    CurrentComponentSIDs: ShaderSemanticsEnum;
    AlphaCutoff: ShaderSemanticsEnum;
    AlphaTexture: ShaderSemanticsEnum;
    MakeOutputSrgb: ShaderSemanticsEnum;
    FramebufferSize: ShaderSemanticsEnum;
    IsOutputHDR: ShaderSemanticsClass;
    BaseColorTextureTransform: ShaderSemanticsClass;
    BaseColorTextureRotation: ShaderSemanticsClass;
    NormalTextureTransform: ShaderSemanticsClass;
    NormalTextureRotation: ShaderSemanticsClass;
    MetallicRoughnessTextureTransform: ShaderSemanticsClass;
    MetallicRoughnessTextureRotation: ShaderSemanticsClass;
    NormalTexcoordIndex: ShaderSemanticsClass;
    BaseColorTexcoordIndex: ShaderSemanticsClass;
    MetallicRoughnessTexcoordIndex: ShaderSemanticsClass;
    OcclusionTexcoordIndex: ShaderSemanticsClass;
    OcclusionTextureTransform: ShaderSemanticsClass;
    OcclusionTextureRotation: ShaderSemanticsClass;
    EmissiveTexcoordIndex: ShaderSemanticsClass;
    EmissiveTextureTransform: ShaderSemanticsClass;
    EmissiveTextureRotation: ShaderSemanticsClass;
    NormalScale: ShaderSemanticsClass;
    OcclusionStrength: ShaderSemanticsClass;
    envRotation: ShaderSemanticsClass;
    EnvHdriFormat: ShaderSemanticsClass;
    VrState: ShaderSemanticsClass;
    EnableLinearToSrgb: ShaderSemanticsClass;
    SpecularFactor: ShaderSemanticsClass;
    SpecularTexture: ShaderSemanticsClass;
    SpecularColorFactor: ShaderSemanticsClass;
    SpecularColorTexture: ShaderSemanticsClass;
    Ior: ShaderSemanticsClass;
    DepthBiasPV: ShaderSemanticsClass;
    ClearCoatTextureTransform: ShaderSemanticsClass;
    ClearCoatTextureRotation: ShaderSemanticsClass;
    ClearCoatRoughnessTextureTransform: ShaderSemanticsClass;
    ClearCoatRoughnessTextureRotation: ShaderSemanticsClass;
    ClearCoatNormalTextureTransform: ShaderSemanticsClass;
    ClearCoatNormalTextureRotation: ShaderSemanticsClass;
    ClearCoatTexcoordIndex: ShaderSemanticsClass;
    ClearCoatRoughnessTexcoordIndex: ShaderSemanticsClass;
    ClearCoatNormalTexcoordIndex: ShaderSemanticsClass;
    IridescenceFactor: ShaderSemanticsClass;
    IridescenceTexture: ShaderSemanticsClass;
    IridescenceIor: ShaderSemanticsClass;
    IridescenceThicknessMinimum: ShaderSemanticsClass;
    IridescenceThicknessMaximum: ShaderSemanticsClass;
    IridescenceThicknessTexture: ShaderSemanticsClass;
    GaussianKernelSize: ShaderSemanticsClass;
    GaussianRatio: ShaderSemanticsClass;
    IsHorizontal: ShaderSemanticsClass;
    AnisotropyStrength: ShaderSemanticsClass;
    AnisotropyRotation: ShaderSemanticsClass;
    AnisotropyTexture: ShaderSemanticsClass;
    EmissiveStrength: ShaderSemanticsClass;
    Time: ShaderSemanticsClass;
    CubeMapFaceId: ShaderSemanticsClass;
    Roughness: ShaderSemanticsClass;
    DistributionType: ShaderSemanticsClass;
}>;

/**
 * A Tag class
 */
type Tag = {
    tag: string;
    value: any;
};
/**
 * The Interface of the RnObject.
 */
interface IRnObject {
    objectUID: ObjectUID;
    uniqueName: string;
    tryToSetUniqueName(name: string, toAddNameIfConflict: boolean): boolean;
    validateTagString(val: string): boolean;
    tryToSetTag(tag: Tag): boolean;
    getTagValue(tagName: string): any;
    matchTag(tagName: string, tagValue: string): boolean;
    matchTagsAsFreeStrings(stringArray: string[]): boolean;
    matchTags(tags: RnTags): boolean;
    _copyFrom(rnObject: RnObject): void;
}
/**
 * The root class of the objects in Rhodonite
 */
declare class RnObject implements IRnObject {
    static readonly InvalidObjectUID = -1;
    static currentMaxObjectCount: number;
    private static __uniqueNames;
    private static __objectsByNameMap;
    private static __objects;
    private readonly __objectUid;
    private __uniqueName;
    _tags: RnTags;
    private __combinedTagString;
    constructor();
    private __updateInfo;
    unregister(): void;
    static searchByTag(tag: string, value: string): WeakRef<RnObject> | undefined;
    /**
     * Gets the objectUID of the object.
     */
    get objectUID(): ObjectUID;
    /**
     * Gets the object by corresponding to the objectUID.
     * @param objectUid The objectUID of the object.
     */
    static getRnObject(objectUid: ObjectUID): RnObject | undefined;
    /**
     * Gets the object by the unique name.
     * @param uniqueName The unique name of the object.
     */
    static getRnObjectByName(uniqueName: string): RnObject | undefined;
    /**
     * Try to set a unique name of the entity.
     * @param name
     * @param toAddNameIfConflict If true, force to add name string to the current unique name string. If false, give up to change name.
     */
    tryToSetUniqueName(name: string, toAddNameIfConflict: boolean): boolean;
    /**
     * Validate the string of tags.
     * @param val The string to be validated
     */
    validateTagString(val: string): boolean;
    /**
     * Tries to set tag (name and value).
     * @param tagName The tag name.
     * @param tagValue Tha value of the tag.
     */
    tryToSetTag(tag: Tag): boolean;
    /**
     * Gets the value of the tag.
     * @param tagName The tag name.
     */
    getTagValue(tagName: string): any;
    /**
     * Gets the tag object.
     * @param tagName The tag name.
     */
    getTag(tagName: string): Tag;
    /**
     * Gets the boolean value whether this object has the tag or not.
     * @param tagName The tag name.
     */
    hasTag(tagName: string): boolean;
    /**
     * Remove the tag.
     * @param tagName The tag name.
     */
    removeTag(tagName: string): void;
    /**
     * Confirms the matching of the tag name and tag value.
     * @param tagName The tag name.
     * @param tagValue The tag value.
     */
    matchTag(tagName: string, tagValue: string): boolean;
    /**
     * Confirm that this object's tags includes given an array of string.
     * @param stringArray an array of string.
     */
    matchTagsAsFreeStrings(stringArray: string[]): boolean;
    /**
     * Confirm that this object's tags includes given set of tags.
     * @param tags The set of tags.
     */
    matchTags(tags: RnTags): boolean;
    /**
     * Get the unique name of the entity.
     */
    get uniqueName(): string;
    /**
     * @internal
     */
    static _reset(): void;
    _copyFrom(rnObject: RnObject): void;
}

interface IMatrix {
    _v: Float32Array;
    readonly className: string;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): Array<number>;
    isDummy(): boolean;
    at(row_i: number, column_i: number): number;
    v(i: number): number;
    determinant(): number;
    readonly isIdentityMatrixClass: boolean;
    isTheSourceSame(arrayBuffer: ArrayBuffer): boolean;
}
interface IMutableMatrix extends IMatrix {
    clone(): IMutableMatrix;
    raw(): TypedArray;
    setAt(row_i: number, column_i: number, value: number): void;
    setComponents(...num: number[]): IMutableMatrix;
    copyComponents(mat: IMatrix): IMutableMatrix;
    zero(): IMutableMatrix;
    identity(): IMutableMatrix;
    _swap(l: Index, r: Index): void;
    transpose(): IMutableMatrix;
    invert(): IMutableMatrix;
    rotate(any: any): IMutableMatrix;
    scale(vec: IVector): IMutableMatrix;
    multiplyScale(vec: IVector): IMutableMatrix;
    multiply(mat: IMatrix): IMutableMatrix;
    multiplyByLeft(mat: IMatrix): IMutableMatrix;
}
interface IMatrix22 extends IMatrix {
    readonly m00: number;
    readonly m01: number;
    readonly m10: number;
    readonly m11: number;
    isEqual(mat: IMatrix22, delta?: number): boolean;
    isStrictEqual(mat: IMatrix22): boolean;
    determinant(): number;
    multiplyVector(vec: IVector2): IVector2;
    multiplyVectorTo(vec: IVector2, outVec: IMutableVector2): IMutableVector2;
    getScale(): IVector2;
    getScaleTo(outVec: IMutableVector2): IMutableVector2;
    clone(): IMatrix22;
}
interface IMutableMatrix22 {
    m00: number;
    m01: number;
    m10: number;
    m11: number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): Array<number>;
    isDummy(): boolean;
    isEqual(mat: IMatrix22, delta?: number): boolean;
    isStrictEqual(mat: IMatrix22): boolean;
    at(row_i: number, column_i: number): number;
    determinant(): number;
    multiplyVector(vec: IVector2): IVector2;
    multiplyVectorTo(vec: IVector2, outVec: IMutableVector2): IMutableVector2;
    getScale(): IVector2;
    getScaleTo(outVec: IMutableVector2): IMutableVector2;
    clone(): IMutableMatrix22;
    raw(): TypedArray;
    setAt(row_i: number, column_i: number, value: number): IMutableMatrix22;
    setComponents(m00: number, m01: number, m10: number, m11: number): IMutableMatrix22;
    copyComponents(mat: IMatrix22 | IMatrix33 | IMatrix44): IMutableMatrix22;
    zero(): IMutableMatrix22;
    identity(): IMutableMatrix22;
    _swap(l: Index, r: Index): void;
    transpose(): IMutableMatrix22;
    invert(): IMutableMatrix22;
    rotate(radian: number): IMutableMatrix22;
    scale(vec: IVector2): IMutableMatrix22;
    multiplyScale(vec: IVector2): IMutableMatrix22;
    multiply(mat: IMatrix22): IMutableMatrix22;
    multiplyByLeft(mat: IMatrix22): IMutableMatrix22;
}
interface IMatrix33 extends IMatrix {
    readonly m00: number;
    readonly m01: number;
    readonly m02: number;
    readonly m10: number;
    readonly m11: number;
    readonly m12: number;
    readonly m20: number;
    readonly m21: number;
    readonly m22: number;
    isEqual(mat: IMatrix33, delta?: number): boolean;
    isStrictEqual(mat: IMatrix33): boolean;
    clone(): IMatrix33;
}
interface IMutableMatrix33 {
    m00: number;
    m01: number;
    m02: number;
    m10: number;
    m11: number;
    m12: number;
    m20: number;
    m21: number;
    m22: number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): Array<number>;
    isDummy(): boolean;
    isEqual(mat: IMatrix33, delta?: number): boolean;
    isStrictEqual(mat: IMatrix33): boolean;
    at(row_i: number, column_i: number): number;
    determinant(): number;
    multiplyVector(vec: IVector3): IVector3;
    multiplyVectorTo(vec: IVector3, outVec: IMutableVector3): IMutableVector3;
    getScale(): IVector3;
    getScaleTo(outVec: IMutableVector3): IMutableVector3;
    clone(): IMutableMatrix33;
    raw(): TypedArray;
    setAt(row_i: number, column_i: number, value: number): IMutableMatrix33;
    setComponents(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): IMutableMatrix33;
    copyComponents(mat: IMatrix33 | IMatrix44): IMutableMatrix33;
    zero(): IMutableMatrix33;
    identity(): IMutableMatrix33;
    _swap(l: Index, r: Index): void;
    transpose(): IMutableMatrix33;
    invert(): IMutableMatrix33;
    rotateX(radian: number): IMutableMatrix33;
    rotateY(radian: number): IMutableMatrix33;
    rotateZ(radian: number): IMutableMatrix33;
    rotateXYZ(x: number, y: number, z: number): IMutableMatrix33;
    rotate(vec3: IVector3): IMutableMatrix33;
    scale(vec: IVector3): IMutableMatrix33;
    multiplyScale(vec: IVector3): IMutableMatrix33;
    multiply(mat: IMatrix33): IMutableMatrix33;
    multiplyByLeft(mat: IMatrix33): IMutableMatrix33;
}
interface IMatrix44 extends IMatrix {
    readonly m00: number;
    readonly m01: number;
    readonly m02: number;
    readonly m03: number;
    readonly m10: number;
    readonly m11: number;
    readonly m12: number;
    readonly m13: number;
    readonly m20: number;
    readonly m21: number;
    readonly m22: number;
    readonly m23: number;
    readonly m30: number;
    readonly m31: number;
    readonly m32: number;
    readonly m33: number;
    readonly translateX: number;
    readonly translateY: number;
    readonly translateZ: number;
    at(row_i: number, column_i: number): number;
    clone(): IMatrix44;
    getRotate(): IMatrix44;
    getTranslate(): IVector3;
    getScale(): IVector3;
    multiplyVector3(vec: IVector3): IVector3;
    multiplyVector(vec: IVector4): IVector4;
}
interface IMutableMatrix44 extends IMatrix {
    m00: number;
    m01: number;
    m02: number;
    m03: number;
    m10: number;
    m11: number;
    m12: number;
    m13: number;
    m20: number;
    m21: number;
    m22: number;
    m23: number;
    m30: number;
    m31: number;
    m32: number;
    m33: number;
    translateX: number;
    translateY: number;
    translateZ: number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): Array<number>;
    isDummy(): boolean;
    isEqual(mat: IMatrix44, delta?: number): boolean;
    isStrictEqual(mat: IMatrix44): boolean;
    at(row_i: number, column_i: number): number;
    determinant(): number;
    multiplyVector(vec: IVector4): IVector4;
    multiplyVectorTo(vec: IVector4, outVec: IMutableVector4): IMutableVector4;
    multiplyVectorToVec3(vec: IVector4, outVec: IMutableVector3): IMutableVector3;
    multiplyVector3(vec: IVector3): IVector3;
    multiplyVector3To(vec: IVector3, outVec: IMutableVector3): IMutableVector3;
    getTranslate(): IVector3;
    getTranslateTo(outVec: IMutableVector3): IMutableVector3;
    getScale(): IVector4;
    getScaleTo(outVec: IMutableVector3): IMutableVector3;
    toEulerAngles(): IVector3;
    toEulerAnglesTo(outVec3: IMutableVector3): IMutableVector3;
    clone(): IMutableMatrix44;
    getRotate(): IMutableMatrix44;
    raw(): TypedArray;
    setAt(row_i: number, column_i: number, value: number): IMutableMatrix44;
    setComponents(m00: number, m01: number, m02: number, m03: number, m10: number, m11: number, m12: number, m13: number, m20: number, m21: number, m22: number, m23: number, m30: number, m31: number, m32: number, m33: number): IMutableMatrix44;
    copyComponents(mat: IMatrix44): IMutableMatrix44;
    zero(): IMutableMatrix44;
    identity(): IMutableMatrix44;
    _swap(l: Index, r: Index): void;
    transpose(): IMutableMatrix44;
    invert(): IMutableMatrix44;
    translate(vec: IVector3): IMutableMatrix44;
    putTranslate(vec: IVector3): IMutableMatrix44;
    addTranslate(vec: IVector3): IMutableMatrix44;
    rotateX(radian: number): IMutableMatrix44;
    rotateY(radian: number): IMutableMatrix44;
    rotateZ(radian: number): IMutableMatrix44;
    rotateXYZ(x: number, y: number, z: number): IMutableMatrix44;
    rotate(vec3: IVector3): IMutableMatrix44;
    scale(vec: IVector3): IMutableMatrix44;
    multiplyScale(vec: IVector3): IMutableMatrix44;
    multiply(mat: IMatrix44): IMutableMatrix44;
    multiplyByLeft(mat: IMatrix44): IMutableMatrix44;
    fromQuaternion(quat: IQuaternion): IMutableMatrix44;
}

interface IQuaternion {
    readonly className: string;
    _v: Float32Array;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): Array<number>;
    isDummy(): boolean;
    isEqual(vec: IQuaternion, delta?: number): boolean;
    isStrictEqual(vec: IQuaternion): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    dot(vec: IQuaternion): number;
    toEulerAnglesTo(out: IMutableVector3): IMutableVector3;
    toEulerAngles(): IVector3;
    clone(): IQuaternion;
    transformVector3(vec: IVector3): IVector3;
    transformVector3To(vec: IVector3, out: IMutableVector3): IVector3;
    transformVector3Inverse(vec: IVector3): IVector3;
}
interface IMutableQuaternion extends IQuaternion {
    readonly className: string;
    x: number;
    y: number;
    z: number;
    w: number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): Array<number>;
    isDummy(): boolean;
    isEqual(vec: IQuaternion, delta?: number): boolean;
    isStrictEqual(vec: IQuaternion): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    dot(vec: IQuaternion): number;
    toEulerAnglesTo(out: IMutableVector3): IMutableVector3;
    clone(): IMutableQuaternion;
    raw(): TypedArray;
    setAt(i: number, value: number): IMutableQuaternion;
    setComponents(x: number, y: number, z: number, w: number): IMutableQuaternion;
    copyComponents(quat: IQuaternion): IMutableQuaternion;
    identity(): IMutableQuaternion;
    normalize(): IMutableQuaternion;
    axisAngle(vec: IVector3, radian: number): IMutableQuaternion;
    fromMatrix(mat: IMatrix44): IMutableQuaternion;
    add(quat: IQuaternion): IMutableQuaternion;
    subtract(quat: IQuaternion): IMutableQuaternion;
    multiply(quat: IQuaternion): IMutableQuaternion;
    multiplyNumber(value: number): IMutableQuaternion;
    divideNumber(value: number): IMutableQuaternion;
    clone(): IMutableQuaternion;
}
interface ILogQuaternion {
    readonly className: string;
    readonly _v: Float32Array;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
}

interface IVector {
    readonly x: number;
    readonly _v: TypedArray;
    readonly className: string;
    readonly bytesPerComponent: number;
    readonly glslStrAsFloat: string;
    readonly glslStrAsInt: string;
    readonly wgslStrAsFloat: string;
    readonly wgslStrAsInt: string;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): Array<number>;
    isDummy(): boolean;
    isEqual(vec: IVector, delta?: number): boolean;
    isStrictEqual(vec: IVector): boolean;
    at(i: number): number;
    v(i: number): number;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector): number;
    dot(vec: IVector): number;
    isTheSourceSame(arrayBuffer: ArrayBuffer): boolean;
}
interface IMutableVector extends IVector {
    _v: TypedArray;
    readonly className: string;
    raw(): TypedArray;
    setAt(i: number, value: number): IMutableVector;
    setComponents(...num: number[]): IMutableVector;
    copyComponents(vec: any): IMutableVector;
    zero(): IMutableVector;
    one(): IMutableVector;
    normalize(): IMutableVector;
    add(vec: any): IMutableVector;
    subtract(vec: any): IMutableVector;
    multiply(value: number): IMutableVector;
    multiplyVector(vec: any): IMutableVector;
    divide(value: number): IMutableVector;
    divideVector(vec: any): IMutableVector;
}
interface IScalar extends IVector {
    _v: TypedArray;
    readonly x: number;
}
interface IMutableScalar extends IMutableVector {
    readonly x: number;
}
interface IVector2 extends IVector {
    readonly className: string;
    readonly x: number;
    readonly y: number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): Array<number>;
    isDummy(): boolean;
    isEqual(vec: IVector2, delta?: number): boolean;
    isStrictEqual(vec: IVector2): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector2): number;
    dot(vec: IVector2): number;
    clone(): IVector2;
}
interface IMutableVector2 extends IMutableVector {
    readonly className: string;
    x: number;
    y: number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): Array<number>;
    isDummy(): boolean;
    isEqual(vec: IVector2, delta?: number): boolean;
    isStrictEqual(vec: IVector2): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector2): number;
    dot(vec: IVector2): number;
    clone(): IMutableVector2;
    raw(): TypedArray;
    setAt(i: number, value: number): IMutableVector2;
    setComponents(x: number, y: number): IMutableVector2;
    copyComponents(vec: IVector2): IMutableVector2;
    zero(): IMutableVector2;
    one(): IMutableVector2;
    normalize(): IMutableVector2;
    add(vec: IVector2): IMutableVector2;
    subtract(vec: IVector2): IMutableVector2;
    multiply(value: number): IMutableVector2;
    multiplyVector(vec: IVector2): IMutableVector2;
    divide(value: number): IMutableVector2;
    divideVector(vec: IVector2): IMutableVector2;
}
interface IVector3 extends IVector {
    readonly className: string;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): Array<number>;
    isDummy(): boolean;
    isEqual(vec: IVector3, delta?: number): boolean;
    isStrictEqual(vec: IVector3): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector3): number;
    dot(vec: IVector3): number;
    clone(): IVector3;
}
interface IMutableVector3 extends IMutableVector {
    readonly className: string;
    x: number;
    y: number;
    z: number;
    readonly w: number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): Array<number>;
    isDummy(): boolean;
    isEqual(vec: IVector3, delta?: number): boolean;
    isStrictEqual(vec: IVector3): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector3): number;
    dot(vec: IVector3): number;
    clone(): IMutableVector3;
    raw(): TypedArray;
    setAt(i: number, value: number): IMutableVector3;
    setComponents(x: number, y: number, z: number): IMutableVector3;
    copyComponents(vec: IVector3): IMutableVector3;
    zero(): IMutableVector3;
    one(): IMutableVector3;
    normalize(): IMutableVector3;
    add(vec: IVector3): IMutableVector3;
    subtract(vec: IVector3): IMutableVector3;
    multiply(value: number): IMutableVector3;
    multiplyVector(vec: IVector3): IMutableVector3;
    divide(value: number): IMutableVector3;
    divideVector(vec: IVector3): IMutableVector3;
    cross(vec: IVector3): IMutableVector3;
    multiplyQuaternion(quat: IQuaternion): IMutableVector3;
}
interface IVector4 extends IVector {
    readonly className: string;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): Array<number>;
    isDummy(): boolean;
    isEqual(vec: IVector4, delta?: number): boolean;
    isStrictEqual(vec: IVector4): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector4): number;
    dot(vec: IVector4): number;
    clone(): IVector4;
}
interface IMutableVector4 extends IMutableVector {
    readonly className: string;
    x: number;
    y: number;
    z: number;
    w: number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): Array<number>;
    isDummy(): boolean;
    isEqual(vec: IVector4, delta?: number): boolean;
    isStrictEqual(vec: IVector4): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector4): number;
    dot(vec: IVector4): number;
    clone(): IMutableVector4;
    raw(): TypedArray;
    setAt(i: number, value: number): IMutableVector4;
    setComponents(x: number, y: number, z: number, w: number): IMutableVector4;
    copyComponents(vec: IVector4): IMutableVector4;
    zero(): IMutableVector4;
    one(): IMutableVector4;
    normalize(): IMutableVector4;
    normalize3(): IMutableVector4;
    add(vec: IVector4): IMutableVector4;
    subtract(vec: IVector4): IMutableVector4;
    multiply(value: number): IMutableVector4;
    multiplyVector(vec: IVector4): IMutableVector4;
    divide(value: number): IMutableVector4;
    divideVector(vec: IVector4): IMutableVector4;
}

interface IRenderable {
    width: Size;
    height: Size;
    _textureResourceUid: CGAPIResourceHandle;
    _textureViewResourceUid: CGAPIResourceHandle;
    _textureViewAsRenderTargetResourceUid: CGAPIResourceHandle;
    resize(width: Size, height: Size): void;
    destroy3DAPIResources(): boolean;
    createCubeTextureViewAsRenderTarget(faceIdx: Index, mipLevel: Index): void;
    fbo?: FrameBuffer;
}

interface RenderBufferTargetEnum extends EnumIO {
    webGLConstantValue(): number;
}
declare function from$q(index: number): RenderBufferTargetEnum;
declare const RenderBufferTarget: Readonly<{
    None: RenderBufferTargetEnum;
    Back: RenderBufferTargetEnum;
    ColorAttachment0: RenderBufferTargetEnum;
    ColorAttachment1: RenderBufferTargetEnum;
    ColorAttachment2: RenderBufferTargetEnum;
    ColorAttachment3: RenderBufferTargetEnum;
    ColorAttachment4: RenderBufferTargetEnum;
    ColorAttachment5: RenderBufferTargetEnum;
    ColorAttachment6: RenderBufferTargetEnum;
    ColorAttachment7: RenderBufferTargetEnum;
    ColorAttachment8: RenderBufferTargetEnum;
    ColorAttachment9: RenderBufferTargetEnum;
    ColorAttachment10: RenderBufferTargetEnum;
    ColorAttachment11: RenderBufferTargetEnum;
    ColorAttachment12: RenderBufferTargetEnum;
    ColorAttachment13: RenderBufferTargetEnum;
    ColorAttachment14: RenderBufferTargetEnum;
    ColorAttachment15: RenderBufferTargetEnum;
    from: typeof from$q;
}>;

type PixelFormatEnum = EnumIO;
declare function getCompositionNumFromPixelFormat(pixelFormat: PixelFormatEnum): number;
declare function from$p(index: number): PixelFormatEnum;
declare const PixelFormat: Readonly<{
    DepthComponent: EnumIO;
    DepthStencil: EnumIO;
    Alpha: EnumIO;
    RG: EnumIO;
    RGB: EnumIO;
    RGBA: EnumIO;
    Luminance: EnumIO;
    LuminanceAlpha: EnumIO;
    from: typeof from$p;
    getCompositionNumFromPixelFormat: typeof getCompositionNumFromPixelFormat;
}>;

/**
 * the Abstract base class of Vector classes
 */
declare abstract class AbstractVector implements IVector {
    _v: TypedArray;
    get x(): number;
    get glslStrAsFloat(): string;
    get glslStrAsInt(): string;
    get wgslStrAsFloat(): string;
    get wgslStrAsInt(): string;
    isEqual(vec: IVector, delta?: number): boolean;
    isStrictEqual(vec: IVector): boolean;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector): number;
    dot(vec: IVector): number;
    at(i: number): number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    v(i: number): number;
    isTheSourceSame(arrayBuffer: ArrayBuffer): boolean;
    get className(): string;
    get bytesPerComponent(): number;
}

/**
 * @internal
 */
declare class Vector3_<T extends FloatTypedArrayConstructor> extends AbstractVector implements IVector, IVector3 {
    constructor(v: TypedArray, { type }: {
        type: T;
    });
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    get glslStrAsFloat(): string;
    get glslStrAsInt(): string;
    get wgslStrAsFloat(): string;
    get wgslStrAsInt(): string;
    static get compositionType(): {
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: IndexOf16Bytes;
        readonly __dummyStr: "VEC3";
        readonly webgpu: string;
        readonly wgsl: string;
        getNumberOfComponents(): Count;
        getGlslStr(componentType: ComponentTypeEnum): string;
        getGlslInitialValue(componentType: ComponentTypeEnum): string;
        getWgslInitialValue(componentType: ComponentTypeEnum): string;
        toWGSLType(componentType: ComponentTypeEnum): string;
        getVec4SizeOfProperty(): IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
        toString(): string;
        toJSON(): number;
    };
    /**
     * to square length(static version)
     */
    static lengthSquared(vec: IVector3): number;
    static lengthBtw(l_vec: IVector3, r_vec: IVector3): number;
    static angleOfVectors(l_vec: IVector3, r_vec: IVector3): number;
    static _zero(type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    static _one(type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    static _dummy(type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * normalize(static version)
     */
    static _normalize(vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * normalize(static version)
     */
    static normalizeTo(vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * add value（static version）
     */
    static _add(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * add value（static version）
     */
    static addTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * subtract(subtract)
     */
    static _subtract(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * subtract(subtract)
     */
    static subtractTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * multiply(static version)
     */
    static _multiply(vec: IVector3, value: number, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * multiplyTo(static version)
     */
    static multiplyTo(vec: IVector3, value: number, out: IMutableVector3): IMutableVector3;
    /**
     * multiply vector(static version)
     */
    static _multiplyVector(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * multiply vector(static version)
     */
    static multiplyVectorTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * multiply matrix4
     */
    static _multiplyMatrix4(vec: IVector3, mat: IMatrix44, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * divide(static version)
     */
    static _divide(vec: IVector3, value: number, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * divide by value(static version)
     */
    static divideTo(vec: IVector3, value: number, out: IMutableVector3): IMutableVector3;
    /**
     * divide vector(static version)
     */
    static _divideVector(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * divide by vector(static version)
     */
    static divideVectorTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * dot product(static version)
     */
    static dot(l_vec: IVector3, r_vec: IVector3): number;
    /**
     * cross product(static version)
     */
    static _cross(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * cross product(static version)
     */
    static crossTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * quaternion * vector3
     */
    static _multiplyQuaternion(quat: IQuaternion, vec: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    /**
     * quaternion * vector3
     */
    static multiplyQuaternionTo(quat: IQuaternion, vec: IVector3, out: IMutableVector3): IMutableVector3;
    /**
     * change to string
     */
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(vec: IVector3, delta?: number): boolean;
    isStrictEqual(vec: IVector3): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector3): number;
    /**
     * dot product
     */
    dot(vec: IVector3): number;
    get className(): string;
    clone(): any;
    get bytesPerComponent(): number;
    static _lerp(lhs: IVector3, rhs: IVector3, ratio: number, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    static _fromCopyArray3(array: Array3<number>, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    static _fromCopy3(x: number, y: number, z: number, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    static _fromCopyArray(array: Array<number>, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    static _fromCopyVector3(vec3: IVector3, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    static _fromCopyVector4(vec4: IVector4, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
    static _fromVector2(vec2: IVector2, type: FloatTypedArrayConstructor): Vector3_<FloatTypedArrayConstructor>;
}
/**
 * Immutable 3D(x,y,z) Vector class with 32bit float components
 */
declare class Vector3 extends Vector3_<Float32ArrayConstructor> {
    constructor(v: TypedArray);
    static fromCopyArray3(array: Array3<number>): Vector3;
    static fromCopy3(x: number, y: number, z: number): Vector3;
    static fromCopy1(val: number): Vector3;
    static fromCopyArray(array: Array<number>): Vector3;
    static fromCopyVector3(vec3: IVector3): Vector3;
    static fromCopyVector4(vec4: IVector4): Vector3;
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector3;
    static fromFloat32Array(float32Array: Float32Array): Vector3;
    static fromCopyFloat32Array(float32Array: Float32Array): Vector3;
    static zero(): Vector3;
    static one(): Vector3;
    static dummy(): Vector3;
    static normalize(vec: IVector3): Vector3;
    static add(l_vec: IVector3, r_vec: IVector3): Vector3;
    static subtract(l_vec: IVector3, r_vec: IVector3): Vector3;
    static multiply(vec: IVector3, value: number): Vector3;
    static multiplyVector(l_vec: IVector3, r_vec: IVector3): Vector3;
    static multiplyMatrix4(vec: IVector3, mat: IMatrix44): Vector3;
    static divide(vec: IVector3, value: number): Vector3;
    static divideVector(l_vec: IVector3, r_vec: IVector3): Vector3;
    static cross(l_vec: IVector3, r_vec: IVector3): Vector3;
    static multiplyQuaternion(quat: IQuaternion, vec: IVector3): Vector3;
    static lerp(lhs: IVector3, rhs: IVector3, ratio: number): Vector3;
}
/**
 * Immutable 3D(x,y,z) Vector class with 64bit float components
 */
declare class Vector3d extends Vector3_<Float64ArrayConstructor> {
    private constructor();
    static fromCopyArray3(array: Array3<number>): Vector3d;
    static fromCopy3(x: number, y: number, z: number): Vector3d;
    static fromCopy1(val: number): Vector3d;
    static fromCopyArray(array: Array<number>): Vector3d;
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector3d;
    static fromFloat64Array(float64Array: Float64Array): Vector3d;
    static zero(): Vector3d;
    static one(): Vector3d;
    static dummy(): Vector3d;
    static normalize(vec: IVector3): Vector3d;
    static add(l_vec: IVector3, r_vec: IVector3): Vector3d;
    static subtract(l_vec: IVector3, r_vec: IVector3): Vector3d;
    static multiply(vec: IVector3, value: number): Vector3d;
    static multiplyVector(l_vec: IVector3, r_vec: IVector3): Vector3d;
    static multiplyMatrix4(vec: IVector3, mat: IMatrix44): Vector3d;
    static divide(vec: IVector3, value: number): Vector3d;
    static divideVector(l_vec: IVector3, r_vec: IVector3): Vector3d;
    static cross(l_vec: IVector3, r_vec: IVector3): Vector3d;
    static multiplyQuaternion(quat: IQuaternion, vec: IVector3): Vector3d;
    static lerp(lhs: IVector3, rhs: IVector3, ratio: number): Vector3d;
}
type Vector3f = Vector3;
declare const ConstVector3_1_1_1: Vector3;
declare const ConstVector3_0_0_0: Vector3;

interface IColorRgb {
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): Array<number>;
    isDummy(): boolean;
    isEqual(vec: IVector3, delta: number): boolean;
    isStrictEqual(vec: IVector3): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector3): number;
    dot(vec: IVector3): number;
    clone(): IColorRgb;
}
interface IMutableColorRgb {
    r: number;
    g: number;
    b: number;
    readonly a: number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): Array<number>;
    isDummy(): boolean;
    isEqual(vec: IVector3, delta: number): boolean;
    isStrictEqual(vec: IVector3): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector3): number;
    dot(vec: IVector3): number;
    clone(): IMutableColorRgb;
    raw(): TypedArray;
    setAt(i: number, value: number): IMutableColorRgb;
    setComponents(x: number, y: number, z: number): IMutableColorRgb;
    copyComponents(vec: IVector3): IMutableColorRgb;
    zero(): IMutableColorRgb;
    one(): IMutableColorRgb;
    normalize(): IMutableColorRgb;
    add(vec: IVector3): IMutableColorRgb;
    subtract(vec: IVector3): IMutableColorRgb;
    multiply(value: number): IMutableColorRgb;
    multiplyVector(vec: IVector3): IMutableColorRgb;
    divide(value: number): IMutableColorRgb;
    divideVector(vec: IVector3): IMutableColorRgb;
    cross(vec: IVector3): IMutableColorRgb;
}
interface IColorRgba {
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;
}
interface IMutableColorRgba {
    r: number;
    g: number;
    b: number;
    a: number;
}

/**
 * A RGB color.
 */
declare class ColorRgb extends Vector3 implements IVector3, IColorRgb {
    constructor(r: Float32Array);
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    get r(): number;
    get g(): number;
    get b(): number;
    get a(): number;
    static zero(): ColorRgb;
    static one(): ColorRgb;
    static dummy(): ColorRgb;
    static normalize(vec: IVector3): ColorRgb;
    static add(l_vec: IVector3, r_vec: IVector3): ColorRgb;
    static subtract(l_vec: IVector3, r_vec: IVector3): ColorRgb;
    static multiply(vec: IVector3, value: number): ColorRgb;
    static multiplyVector(l_vec: IVector3, r_vec: IVector3): ColorRgb;
    static divide(vec: IVector3, value: number): ColorRgb;
    static divideVector(l_vec: IVector3, r_vec: IVector3): ColorRgb;
    static cross(l_vec: IVector3, r_vec: IVector3): ColorRgb;
    clone(): ColorRgb;
}

/**
 *
 * @internal
 */
declare class Vector4_<T extends FloatTypedArrayConstructor> extends AbstractVector implements IVector4 {
    protected constructor(v: FloatTypedArray, { type }: {
        type: T;
    });
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    get glslStrAsFloat(): string;
    get glslStrAsInt(): string;
    get wgslStrAsFloat(): string;
    get wgslStrAsInt(): string;
    static _fromCopyArray4(array: Array4<number>, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    static _fromCopy4(x: number, y: number, z: number, w: number, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    static _fromCopyArray(array: Array<number>, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    static _fromCopyVector4(vec4: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    static _fromCopyVector3(vec3: IVector3, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    static _fromVector2(vec2: IVector2, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    static get compositionType(): {
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: IndexOf16Bytes;
        readonly __dummyStr: "VEC4";
        readonly webgpu: string;
        readonly wgsl: string;
        getNumberOfComponents(): Count;
        getGlslStr(componentType: ComponentTypeEnum): string;
        getGlslInitialValue(componentType: ComponentTypeEnum): string;
        getWgslInitialValue(componentType: ComponentTypeEnum): string;
        toWGSLType(componentType: ComponentTypeEnum): string;
        getVec4SizeOfProperty(): IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
        toString(): string;
        toJSON(): number;
    };
    /**
     * to square length(static version)
     */
    static lengthSquared(vec: IVector4): number;
    static lengthBtw(l_vec: IVector4, r_vec: IVector4): number;
    /**
     * Zero Vector
     */
    static _zero(type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    static _one(type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    static _dummy(type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * normalize(static version)
     */
    static _normalize(vec: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * add value（static version）
     */
    static _add(l_vec: IVector4, r_vec: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * add value（static version）
     */
    static addTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4): IMutableVector4;
    /**
     * subtract(static version)
     */
    static _subtract(l_vec: IVector4, r_vec: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * subtract(static version)
     */
    static subtractTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4): IMutableVector4;
    /**
     * multiply(static version)
     */
    static _multiply(vec: IVector4, value: number, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * multiplyTo(static version)
     */
    static multiplyTo(vec: IVector4, value: number, out: IMutableVector4): IMutableVector4;
    /**
     * multiply vector(static version)
     */
    static _multiplyVector(l_vec: IVector4, r_vec: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * multiply vector(static version)
     */
    static multiplyVectorTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4): IMutableVector4;
    /**
     * divide(static version)
     */
    static _divide(vec: IVector4, value: number, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * divide by value(static version)
     */
    static divideTo(vec: IVector4, value: number, out: IMutableVector4): IMutableVector4;
    /**
     * divide vector(static version)
     */
    static _divideVector(l_vec: IVector4, r_vec: IVector4, type: FloatTypedArrayConstructor): Vector4_<FloatTypedArrayConstructor>;
    /**
     * divide by vector(static version)
     */
    static divideVectorTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4): IMutableVector4;
    /**
     * dot product(static version)
     */
    static dot(l_vec: IVector4, r_vec: IVector4): number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(vec: IVector4, delta?: number): boolean;
    isStrictEqual(vec: IVector4): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector4): number;
    /**
     * dot product
     */
    dot(vec: IVector4): number;
    get className(): string;
    clone(): any;
    get bytesPerComponent(): number;
}
/**
 * Immutable 4D(x,y,z,w) Vector class with 32bit float components
 *
 * @example
 * ```
 * const vec1 = Rn.Vector4.fromCopy4(1, 2, 3, 1);
 * const vec2 = Rn.Vector4.fromCopyArray4([2, 3, 3, 1]);
 * const dotProduct = vec1.dot(vec2);
 * ```
 */
declare class Vector4 extends Vector4_<Float32ArrayConstructor> {
    constructor(x: Float32Array);
    static fromCopyArray(array: Array<number>): Vector4;
    static fromCopyArray4(array: Array4<number>): Vector4;
    static fromCopy4(x: number, y: number, z: number, w: number): Vector4;
    static fromCopyVector3(vec3: IVector3): Vector4;
    static fromCopyVector4(vec4: IVector4): Vector4;
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector4;
    static fromFloat32Array(float32Array: Float32Array): Vector4;
    static fromCopyFloat32Array(float32Array: Float32Array): Vector4;
    static zero(): Vector4;
    static one(): Vector4;
    static dummy(): Vector4;
    static normalize(vec: IVector4): Vector4;
    static add(l_vec: IVector4, r_vec: IVector4): Vector4;
    static subtract(l_vec: IVector4, r_vec: IVector4): Vector4;
    static multiply(vec: IVector4, value: number): Vector4;
    static multiplyVector(l_vec: IVector4, r_vec: IVector4): Vector4;
    static divide(vec: IVector4, value: number): Vector4;
    static divideVector(l_vec: IVector4, r_vec: IVector4): Vector4;
    clone(): Vector4;
}
/**
 * Immutable 4D(x,y,z,w) Vector class with 64bit float components
 */
declare class Vector4d extends Vector4_<Float64ArrayConstructor> {
    private constructor();
    static fromCopyArray4(array: Array4<number>): Vector4d;
    static fromCopy4(x: number, y: number, z: number, w: number): Vector4d;
    static fromCopyArray(array: Array4<number>): Vector4d;
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector4d;
    static fromFloat64Array(float64Array: Float64Array): Vector4d;
    static zero(): Vector4d;
    static one(): Vector4d;
    static dummy(): Vector4d;
    static normalize(vec: IVector4): Vector4d;
    static add(l_vec: IVector4, r_vec: IVector4): Vector4d;
    static subtract(l_vec: IVector4, r_vec: IVector4): Vector4d;
    static multiply(vec: IVector4, value: number): Vector4d;
    static multiplyVector(l_vec: IVector4, r_vec: IVector4): Vector4d;
    static divide(vec: IVector4, value: number): Vector4d;
    static divideVector(l_vec: IVector4, r_vec: IVector4): Vector4d;
    clone(): Vector4d;
}
type Vector4f = Vector4;
declare const ConstVector4_1_1_1_1: Vector4;
declare const ConstVector4_0_0_0_1: Vector4;
declare const ConstVector4_0_0_0_0: Vector4;

/**
 * A RGBA color.
 */
declare class ColorRgba extends Vector4 implements IVector4, IColorRgba {
    constructor(r: Float32Array);
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    get r(): number;
    get g(): number;
    get b(): number;
    get a(): number;
    static zero(): ColorRgba;
    static one(): ColorRgba;
    static dummy(): ColorRgba;
    static normalize(vec: IVector4): ColorRgba;
    static add(l_vec: IVector4, r_vec: IVector4): ColorRgba;
    static subtract(l_vec: IVector4, r_vec: IVector4): ColorRgba;
    static multiply(vec: IVector4, value: number): ColorRgba;
    static multiplyVector(l_vec: IVector4, r_vec: IVector4): ColorRgba;
    static divide(vec: IVector4, value: number): ColorRgba;
    static divideVector(l_vec: IVector4, r_vec: IVector4): ColorRgba;
    clone(): ColorRgba;
    static fromCopyArray(array: Array<number>): ColorRgba;
    static fromCopyArray4(array: Array4<number>): ColorRgba;
    static fromCopy4(x: number, y: number, z: number, w: number): ColorRgba;
    static fromCopyVector4(vec4: IVector4): ColorRgba;
}
declare const ConstRgbaWhite: ColorRgba;
declare const ConstRgbaBlack: ColorRgba;

declare class TextureDataFloat {
    private __data;
    private __channels;
    private __width;
    private __height;
    constructor(width: number, height: number, channels: number);
    resize(width: number, height: number, channels: number): void;
    setPixelAtChannel(x: Index, y: Index, channelIdx: Index, value: number): void;
    get width(): number;
    get height(): number;
    get data(): Float32Array;
    getPixel(x: Index, y: Index, channelIdx: Index): number;
    getPixelAs(x: Index, y: Index, channels: Size, typeClass: typeof ColorRgb | typeof ColorRgba): any;
    getPixelAsArray(x: Index, y: Index): number[];
    initialize(width: number, height: number, channels: number): void;
    static transfer(source: any, length: number): ArrayBuffer;
}

/**
 * @internal
 */
declare class MutableVector3_<T extends FloatTypedArrayConstructor> extends Vector3_<T> implements IMutableVector, IMutableVector3 {
    constructor(v: TypedArray, { type }: {
        type: T;
    });
    set x(x: number);
    get x(): number;
    set y(y: number);
    get y(): number;
    set z(z: number);
    get z(): number;
    get w(): number;
    raw(): TypedArray;
    setAt(i: number, value: number): this;
    setComponents(x: number, y: number, z: number): this;
    copyComponents(vec: IVector3): this;
    zero(): this;
    one(): this;
    /**
     * normalize
     */
    normalize(): this;
    /**
     * add value
     */
    add(vec: IVector3): this;
    /**
     * subtract
     */
    subtract(vec: IVector3): this;
    /**
     * multiply
     */
    multiply(value: number): this;
    /**
     * multiply vector
     */
    multiplyVector(vec: IVector3): this;
    /**
     * divide
     */
    divide(value: number): this;
    /**
     * divide vector
     */
    divideVector(vec: IVector3): this;
    /**
     * cross product
     */
    cross(vec: IVector3): this;
    /**
     * quaternion * vector3
     */
    multiplyQuaternion(quat: IQuaternion): this;
    get bytesPerComponent(): number;
    static _fromCopy3(x: number, y: number, z: number, type: FloatTypedArrayConstructor): MutableVector3_<FloatTypedArrayConstructor>;
}
/**
 * Mutable 3D(x,y,z) Vector class with 32bit float components
 */
declare class MutableVector3 extends MutableVector3_<Float32ArrayConstructor> {
    constructor(v: TypedArray);
    static zero(): MutableVector3;
    static one(): MutableVector3;
    static dummy(): MutableVector3;
    static normalize(vec: IVector3): MutableVector3;
    static add(l_vec: IVector3, r_vec: IVector3): MutableVector3;
    static subtract(l_vec: IVector3, r_vec: IVector3): MutableVector3;
    static multiply(vec: IVector3, value: number): MutableVector3;
    static multiplyVector(l_vec: IVector3, r_vec: IVector3): MutableVector3;
    static divide(vec: IVector3, value: number): MutableVector3;
    static divideVector(l_vec: IVector3, r_vec: IVector3): MutableVector3;
    static cross(l_vec: IVector3, r_vec: IVector3): MutableVector3;
    static multiplyQuaternion(quat: IQuaternion, vec: IVector3): MutableVector3;
    get className(): string;
    static fromCopy3(x: number, y: number, z: number): MutableVector3;
    static fromCopy1(val: number): MutableVector3;
    static fromCopyArray3(array: Array3<number>): MutableVector3;
    static fromCopyArray(array: Array<number>): MutableVector3;
    static fromFloat32Array(float32Array: Float32Array): MutableVector3;
    static fromCopyFloat32Array(float32Array: Float32Array): MutableVector3;
    static fromCopyVector3(vec: IVector3): MutableVector3;
    static fromCopyVector4(vec: IVector4): MutableVector3;
    clone(): MutableVector3;
    static rotateX(vec3: IVector3, radian: number, outVec: MutableVector3): void;
    static rotateY(vec3: IVector3, radian: number, outVec: MutableVector3): void;
    static rotateZ(vec3: IVector3, radian: number, outVec: MutableVector3): void;
}
/**
 * Mutable 3D(x,y,z) Vector class with 64bit float components
 */
declare class MutableVector3d extends MutableVector3_<Float64ArrayConstructor> {
    constructor(x: TypedArray);
    static zero(): MutableVector3d;
    static one(): MutableVector3d;
    static dummy(): MutableVector3d;
    static normalize(vec: IVector3): MutableVector3d;
    static add(l_vec: IVector3, r_vec: IVector3): MutableVector3d;
    static subtract(l_vec: IVector3, r_vec: IVector3): MutableVector3d;
    static multiply(vec: IVector3, value: number): MutableVector3d;
    static multiplyVector(l_vec: IVector3, r_vec: IVector3): MutableVector3d;
    static divide(vec: IVector3, value: number): MutableVector3d;
    static divideVector(l_vec: IVector3, r_vec: IVector3): MutableVector3d;
    static cross(l_vec: IVector3, r_vec: IVector3): MutableVector3d;
    static multiplyQuaternion(quat: IQuaternion, vec: IVector3): MutableVector3d;
    static fromCopy3(x: number, y: number, z: number): MutableVector3d;
    static fromCopy1(val: number): MutableVector3d;
    static fromCopyArray3(array: Array3<number>): MutableVector3d;
    static fromCopyArray(array: Array<number>): MutableVector3d;
    static rotateX(vec3: IVector3, radian: number, outVec: MutableVector3d): void;
    static rotateY(vec3: IVector3, radian: number, outVec: MutableVector3d): void;
    static rotateZ(vec3: IVector3, radian: number, outVec: MutableVector3d): void;
    clone(): MutableVector3d;
}
type MutableVector3f = MutableVector3;

/**
 * @internal
 */
declare class MutableVector4_<T extends FloatTypedArrayConstructor> extends Vector4_<T> implements IMutableVector, IMutableVector4 {
    constructor(x: FloatTypedArray, { type }: {
        type: T;
    });
    set x(x: number);
    get x(): number;
    set y(y: number);
    get y(): number;
    set z(z: number);
    get z(): number;
    set w(w: number);
    get w(): number;
    raw(): TypedArray;
    setAt(i: number, value: number): this;
    setComponents(x: number, y: number, z: number, w: number): this;
    copyComponents(vec: IVector4): this;
    zero(): this;
    one(): this;
    get bytesPerComponent(): number;
    /**
     * normalize
     */
    normalize(): this;
    normalize3(): this;
    /**
     * add value
     */
    add(vec: IVector4): this;
    /**
     * subtract
     */
    subtract(vec: IVector4): this;
    /**
     * multiply
     */
    multiply(value: number): this;
    /**
     * multiply vector
     */
    multiplyVector(vec: IVector4): this;
    /**
     * divide
     */
    divide(value: number): this;
    /**
     * divide vector
     */
    divideVector(vec: IVector4): this;
    get _updateCount(): number;
    private __updateCount;
}
/**
 * Mutable 4D(x,y,z,w) Vector class with 32bit float components
 */
declare class MutableVector4 extends MutableVector4_<Float32ArrayConstructor> {
    constructor(x: Float32Array);
    static fromCopyArray(array: Array<number>): MutableVector4;
    static fromCopyArray4(array: Array4<number>): MutableVector4;
    static fromCopy4(x: number, y: number, z: number, w: number): MutableVector4;
    static zero(): MutableVector4;
    static one(): MutableVector4;
    static dummy(): MutableVector4;
    static normalize(vec: IVector4): MutableVector4;
    static add(l_vec: IVector4, r_vec: IVector4): MutableVector4;
    static subtract(l_vec: IVector4, r_vec: IVector4): MutableVector4;
    static multiply(vec: IVector4, value: number): MutableVector4;
    static multiplyVector(l_vec: IVector4, r_vec: IVector4): MutableVector4;
    static divide(vec: IVector4, value: number): MutableVector4;
    static divideVector(l_vec: IVector4, r_vec: IVector4): MutableVector4;
    get className(): string;
    clone(): any;
}
/**
 * Mutable 4D(x,y,z,w) Vector class with 64bit float components
 */
declare class MutableVector4d extends MutableVector4_<Float64ArrayConstructor> {
    constructor(x: Float64Array);
    static zero(): MutableVector4d;
    static one(): MutableVector4d;
    static dummy(): MutableVector4d;
    static normalize(vec: IVector4): MutableVector4d;
    static add(l_vec: IVector4, r_vec: IVector4): MutableVector4d;
    static subtract(l_vec: IVector4, r_vec: IVector4): MutableVector4d;
    static multiply(vec: IVector4, value: number): MutableVector4d;
    static multiplyVector(l_vec: IVector4, r_vec: IVector4): MutableVector4d;
    static divide(vec: IVector4, value: number): MutableVector4d;
    static divideVector(l_vec: IVector4, r_vec: IVector4): MutableVector4d;
    static fromCopyArray4(array: Array4<number>): MutableVector4d;
    static fromCopyArray(array: Array<number>): MutableVector4d;
    static fromCopy4(x: number, y: number, z: number, w: number): MutableVector4d;
    clone(): MutableVector4d;
}
type MutableVector4f = MutableVector4;

interface AlphaModeEnum extends EnumIO {
    toGltfString(): string;
}
declare function from$o(index: number): AlphaModeEnum | undefined;
declare function fromString$i(str: string): AlphaModeEnum | undefined;
declare function fromGlTFString(str: string): AlphaModeEnum | undefined;
declare const AlphaMode: Readonly<{
    Opaque: AlphaModeEnum;
    Mask: AlphaModeEnum;
    Blend: AlphaModeEnum;
    from: typeof from$o;
    fromString: typeof fromString$i;
    fromGlTFString: typeof fromGlTFString;
}>;

type AnimationAttributeEnum = EnumIO;
declare function from$n(index: number): AnimationAttributeEnum;
declare function fromString$h(str: string): AnimationAttributeEnum;
declare const AnimationAttribute: Readonly<{
    Quaternion: EnumIO;
    Translate: EnumIO;
    Scale: EnumIO;
    Weights: EnumIO;
    Effekseer: EnumIO;
    Vector4: EnumIO;
    Vector3: EnumIO;
    Vector2: EnumIO;
    Scalar: EnumIO;
    VectorN: EnumIO;
    from: typeof from$n;
    fromString: typeof fromString$h;
}>;

interface AnimationInterpolationEnum extends EnumIO {
    GltfString: Gltf2AnimationSamplerInterpolation;
}
declare function from$m(index: number): AnimationInterpolationEnum;
declare function fromString$g(str: string): AnimationInterpolationEnum;
declare const AnimationInterpolation: Readonly<{
    Linear: AnimationInterpolationEnum;
    Step: AnimationInterpolationEnum;
    CubicSpline: AnimationInterpolationEnum;
    from: typeof from$m;
    fromString: typeof fromString$g;
}>;

type BasisCompressionTypeEnum = EnumIO;
declare function from$l(index: number): BasisCompressionTypeEnum;
declare function fromString$f(str: string): BasisCompressionTypeEnum;
declare const BasisCompressionType: Readonly<{
    ETC1: EnumIO;
    ETC2: EnumIO;
    BC1: EnumIO;
    BC3: EnumIO;
    BC4: EnumIO;
    BC5: EnumIO;
    BC7_M5: EnumIO;
    BC7_M6_OPAQUE: EnumIO;
    PVRTC1_RGB: EnumIO;
    PVRTC1_RGBA: EnumIO;
    ASTC: EnumIO;
    ATC_RGB: EnumIO;
    ATC_RGBA: EnumIO;
    RGBA32: EnumIO;
    RGB565: EnumIO;
    BGR565: EnumIO;
    RGBA4444: EnumIO;
    from: typeof from$l;
    fromString: typeof fromString$f;
}>;

type BoneDataTypeEnum = EnumIO;
declare function from$k(index: number): BoneDataTypeEnum;
declare function fromString$e(str: string): BoneDataTypeEnum;
declare const BoneDataType: Readonly<{
    Mat43x1: EnumIO;
    Vec4x2: EnumIO;
    Vec4x2Old: EnumIO;
    Vec4x1: EnumIO;
    from: typeof from$k;
    fromString: typeof fromString$e;
}>;

type BufferUseEnum = EnumIO;
declare function from$j(index: number): BufferUseEnum;
declare function fromString$d(str: string): BufferUseEnum;
declare const BufferUse: Readonly<{
    GPUInstanceData: EnumIO;
    GPUVertexData: EnumIO;
    UBOGeneric: EnumIO;
    CPUGeneric: EnumIO;
    from: typeof from$j;
    fromString: typeof fromString$d;
}>;

type CameraControllerTypeEnum = EnumIO;
declare function from$i(index: number): CameraControllerTypeEnum;
declare function fromString$c(str: string): CameraControllerTypeEnum;
declare const CameraControllerType: Readonly<{
    Orbit: EnumIO;
    WalkThrough: EnumIO;
    from: typeof from$i;
    fromString: typeof fromString$c;
}>;

type CameraTypeEnum = EnumIO;
declare function from$h(index: number): CameraTypeEnum;
declare function fromString$b(str: string): CameraTypeEnum;
declare const CameraType: Readonly<{
    Perspective: EnumIO;
    Orthographic: EnumIO;
    Frustum: EnumIO;
    from: typeof from$h;
    fromString: typeof fromString$b;
}>;

type BlockInfo = {
    byteSize: number;
    width: number;
    height: number;
};
interface CompressionTextureTypeEnum extends EnumIO {
    webgpu?: string;
    blockInfo?: BlockInfo;
}
declare function from$g(index: number): CompressionTextureTypeEnum;
declare function fromString$a(str: string): CompressionTextureTypeEnum;
declare const CompressionTextureType: Readonly<{
    ASTC_RGBA_4x4: CompressionTextureTypeEnum;
    ASTC_RGBA_5x4: CompressionTextureTypeEnum;
    ASTC_RGBA_5x5: CompressionTextureTypeEnum;
    ASTC_RGBA_6x5: CompressionTextureTypeEnum;
    ASTC_RGBA_6x6: CompressionTextureTypeEnum;
    ASTC_RGBA_8x5: CompressionTextureTypeEnum;
    ASTC_RGBA_8x6: CompressionTextureTypeEnum;
    ASTC_RGBA_8x8: CompressionTextureTypeEnum;
    ASTC_RGBA_10x5: CompressionTextureTypeEnum;
    ASTC_RGBA_10x6: CompressionTextureTypeEnum;
    ASTC_RGBA_10x8: CompressionTextureTypeEnum;
    ASTC_RGBA_10x10: CompressionTextureTypeEnum;
    ASTC_RGBA_12x10: CompressionTextureTypeEnum;
    ASTC_RGBA_12x12: CompressionTextureTypeEnum;
    ASTC_SRGB_4x4: CompressionTextureTypeEnum;
    ASTC_SRGB_5x4: CompressionTextureTypeEnum;
    ASTC_SRGB_5x5: CompressionTextureTypeEnum;
    ASTC_SRGB_6x5: CompressionTextureTypeEnum;
    ASTC_SRGB_6x6: CompressionTextureTypeEnum;
    ASTC_SRGB_8x5: CompressionTextureTypeEnum;
    ASTC_SRGB_8x6: CompressionTextureTypeEnum;
    ASTC_SRGB_8x8: CompressionTextureTypeEnum;
    ASTC_SRGB_10x5: CompressionTextureTypeEnum;
    ASTC_SRGB_10x6: CompressionTextureTypeEnum;
    ASTC_SRGB_10x8: CompressionTextureTypeEnum;
    ASTC_SRGB_10x10: CompressionTextureTypeEnum;
    ASTC_SRGB_12x10: CompressionTextureTypeEnum;
    ASTC_SRGB_12x12: CompressionTextureTypeEnum;
    S3TC_RGB_DXT1: CompressionTextureTypeEnum;
    S3TC_RGBA_DXT1: CompressionTextureTypeEnum;
    S3TC_RGBA_DXT3: CompressionTextureTypeEnum;
    S3TC_RGBA_DXT5: CompressionTextureTypeEnum;
    BPTC_RGBA: CompressionTextureTypeEnum;
    PVRTC_RGBA_4BPPV1: CompressionTextureTypeEnum;
    PVRTC_RGB_4BPPV1: CompressionTextureTypeEnum;
    ETC2_RGBA8_EAC: CompressionTextureTypeEnum;
    ETC2_RGB8: CompressionTextureTypeEnum;
    ETC1_RGB: CompressionTextureTypeEnum;
    RGBA8_EXT: CompressionTextureTypeEnum;
    from: typeof from$g;
    fromString: typeof fromString$a;
}>;

type FileTypeEnum = EnumIO;
declare function from$f(index: number): FileTypeEnum;
declare function fromString$9(str: string): FileTypeEnum;
declare function isGltfOrGlb(file: FileTypeEnum): boolean;
declare const FileType: Readonly<{
    Unknown: EnumIO;
    Gltf: EnumIO;
    GltfBinary: EnumIO;
    VRM: EnumIO;
    Draco: EnumIO;
    EffekseerEffect: EnumIO;
    from: typeof from$f;
    fromString: typeof fromString$9;
    isGltfOrGlb: typeof isGltfOrGlb;
}>;

type HdriFormatEnum = EnumIO;
declare function from$e(index: number): HdriFormatEnum;
declare function fromString$8(str: string): HdriFormatEnum;
declare const HdriFormat: Readonly<{
    LDR_SRGB: EnumIO;
    LDR_LINEAR: EnumIO;
    HDR_LINEAR: EnumIO;
    RGBE_PNG: EnumIO;
    RGB9_E5_PNG: EnumIO;
    OpenEXR: EnumIO;
    from: typeof from$e;
    fromString: typeof fromString$8;
}>;

type LightTypeEnum = EnumIO;
declare function from$d(index: number): LightTypeEnum;
declare function fromString$7(str: string): LightTypeEnum;
declare const LightType: Readonly<{
    Point: EnumIO;
    Directional: EnumIO;
    Spot: EnumIO;
    Ambient: EnumIO;
    from: typeof from$d;
    fromString: typeof fromString$7;
}>;

interface PrimitiveModeEnum extends EnumIO {
    getWebGPUTypeStr(): string;
}
declare function from$c(index: number): PrimitiveModeEnum | undefined;
declare const PrimitiveMode: Readonly<{
    Unknown: PrimitiveModeEnum;
    Points: PrimitiveModeEnum;
    Lines: PrimitiveModeEnum;
    LineLoop: PrimitiveModeEnum;
    LineStrip: PrimitiveModeEnum;
    Triangles: PrimitiveModeEnum;
    TriangleStrip: PrimitiveModeEnum;
    TriangleFan: PrimitiveModeEnum;
    from: typeof from$c;
}>;

declare class ProcessApproachClass extends EnumClass implements EnumIO {
    constructor({ index, str }: {
        index: number;
        str: string;
    });
    get webGLVersion(): 0 | 2;
}
type ProcessApproachEnum = ProcessApproachClass;
declare const ProcessApproach: Readonly<{
    isDataTextureApproach: (processApproach: ProcessApproachEnum) => boolean;
    isUniformApproach: (processApproach: ProcessApproachEnum) => boolean;
    isWebGpuApproach: (processApproach: ProcessApproachEnum) => boolean;
    None: ProcessApproachClass;
    Uniform: ProcessApproachClass;
    DataTexture: ProcessApproachClass;
    WebGPU: ProcessApproachClass;
    isWebGL2Approach: (processApproach: ProcessApproachEnum) => boolean;
}>;

interface ProcessStageEnum extends EnumIO {
    methodName: string;
}
declare function from$b(index: number): ProcessStageEnum;
declare const ProcessStage: Readonly<{
    Unknown: ProcessStageEnum;
    Create: ProcessStageEnum;
    Load: ProcessStageEnum;
    Mount: ProcessStageEnum;
    Logic: ProcessStageEnum;
    PreRender: ProcessStageEnum;
    Render: ProcessStageEnum;
    Unmount: ProcessStageEnum;
    Discard: ProcessStageEnum;
    from: typeof from$b;
}>;

type ShaderNodeEnum = EnumIO;
declare function from$a(index: number): ShaderNodeEnum;
declare function fromString$6(str: string): ShaderNodeEnum;
declare const ShaderNode: Readonly<{
    ClassicShading: EnumIO;
    PBRShading: EnumIO;
    from: typeof from$a;
    fromString: typeof fromString$6;
}>;

type ShaderVariableTypeEnum = EnumIO;
declare function from$9(index: number): ShaderVariableTypeEnum;
declare function fromString$5(str: string): ShaderVariableTypeEnum;
declare const ShaderVariableType: Readonly<{
    Varying: EnumIO;
    ReadOnlyData: EnumIO;
    from: typeof from$9;
    fromString: typeof fromString$5;
}>;

type ShadingModelEnum = EnumIO;
declare function from$8(index: number): ShadingModelEnum;
declare const ShadingModel: Readonly<{
    Unknown: EnumIO;
    Constant: EnumIO;
    Lambert: EnumIO;
    BlinnPhong: EnumIO;
    Phong: EnumIO;
    from: typeof from$8;
}>;

type ShadowMapEnum = EnumIO;
declare function from$7(index: number): ShadowMapEnum | undefined;
declare function fromString$4(str: string): ShadowMapEnum;
declare const ShadowMapType: Readonly<{
    Standard: EnumIO;
    Variance: EnumIO;
    from: typeof from$7;
    fromString: typeof fromString$4;
}>;

interface TextureFormatEnum extends EnumIO {
    webgpu: string;
}
declare function getPixelFormatFromTextureFormat(textureFormat: TextureFormatEnum): PixelFormatEnum;
declare function getPixelFormatAndComponentTypeFromTextureFormat(internalFormat: TextureFormatEnum): {
    format: EnumIO;
    type: ComponentTypeEnum;
};
declare function from$6(index: number): TextureFormatEnum;
declare const TextureFormat$1: Readonly<{
    RGB8: TextureFormatEnum;
    RGBA8: TextureFormatEnum;
    RGB10_A2: TextureFormatEnum;
    RG16F: TextureFormatEnum;
    RG32F: TextureFormatEnum;
    RGB16F: TextureFormatEnum;
    RGB32F: TextureFormatEnum;
    RGBA16F: TextureFormatEnum;
    RGBA32F: TextureFormatEnum;
    R11F_G11F_B10F: TextureFormatEnum;
    Depth16: TextureFormatEnum;
    Depth24: TextureFormatEnum;
    Depth32F: TextureFormatEnum;
    Depth24Stencil8: TextureFormatEnum;
    Depth32FStencil8: TextureFormatEnum;
    getPixelFormatFromTextureFormat: typeof getPixelFormatFromTextureFormat;
    getPixelFormatAndComponentTypeFromTextureFormat: typeof getPixelFormatAndComponentTypeFromTextureFormat;
    from: typeof from$6;
}>;

interface TextureParameterEnum extends EnumIO {
    webgpu: string;
}
declare function from$5(index: number): TextureParameterEnum;
declare const TextureParameter: Readonly<{
    Nearest: TextureParameterEnum;
    Linear: TextureParameterEnum;
    NearestMipmapNearest: TextureParameterEnum;
    LinearMipmapNearest: TextureParameterEnum;
    NearestMipmapLinear: TextureParameterEnum;
    LinearMipmapLinear: TextureParameterEnum;
    TextureMagFilter: TextureParameterEnum;
    TextureMinFilter: TextureParameterEnum;
    TextureWrapS: TextureParameterEnum;
    TextureWrapT: TextureParameterEnum;
    Texture2D: TextureParameterEnum;
    Texture: TextureParameterEnum;
    Texture0: TextureParameterEnum;
    Texture1: TextureParameterEnum;
    ActiveTexture: TextureParameterEnum;
    Repeat: TextureParameterEnum;
    ClampToEdge: TextureParameterEnum;
    MirroredRepeat: TextureParameterEnum;
    from: typeof from$5;
}>;

type ComponentChar = 'X' | 'Y' | 'Z' | 'W';
type VertexAttributeTypeName = 'UNKNOWN' | 'POSITION' | 'NORMAL' | 'TANGENT' | 'TEXCOORD_0' | 'TEXCOORD_1' | 'TEXCOORD_2' | 'COLOR_0' | 'JOINTS_0' | 'WEIGHTS_0' | 'INSTANCE' | 'FACE_NORMAL' | 'BARY_CENTRIC_COORD';
type VertexAttributeComponent = `${VertexAttributeTypeName}.${ComponentChar}`;
type VertexAttributeSemanticsJoinedString = `${string}.${ComponentChar}` | `${string}.${ComponentChar},${string}.${ComponentChar}` | `${string}.${ComponentChar},${string}.${ComponentChar},${string}.${ComponentChar}` | `${string}.${ComponentChar},${string}.${ComponentChar},${string}.${ComponentChar},${string}.${ComponentChar}`;
interface VertexAttributeEnum extends EnumIO {
    getAttributeSlot(): Index;
    shaderStr: string;
    X: VertexAttributeComponent;
    Y: VertexAttributeComponent;
    Z: VertexAttributeComponent;
    W: VertexAttributeComponent;
    XY: VertexAttributeSemanticsJoinedString;
    XYZ: VertexAttributeSemanticsJoinedString;
    XYZW: VertexAttributeSemanticsJoinedString;
}
type VertexAttributeDescriptor = {
    str: VertexAttributeTypeName;
    shaderStr: string;
    attributeSlot: Index;
    gltfComponentN: Count;
};
declare class VertexAttributeClass extends EnumClass implements VertexAttributeEnum {
    private static __indexCount;
    private __attributeSlot;
    private __shaderStr;
    private __gltfComponentN;
    private constructor();
    getAttributeSlot(): Index;
    get shaderStr(): string;
    get attributeTypeName(): VertexAttributeTypeName;
    _setShaderStr(str: string): void;
    get X(): VertexAttributeComponent;
    get Y(): VertexAttributeComponent;
    get Z(): VertexAttributeComponent;
    get W(): VertexAttributeComponent;
    get XY(): VertexAttributeSemanticsJoinedString;
    get XYZ(): VertexAttributeSemanticsJoinedString;
    get XYZW(): VertexAttributeSemanticsJoinedString;
    getVertexAttributeComponentsAsGltf(): VertexAttributeSemanticsJoinedString;
    static __createVertexAttributeClass(desc: VertexAttributeDescriptor): VertexAttributeClass;
}
declare const Position: VertexAttributeEnum;
declare const Normal: VertexAttributeEnum;
declare const Tangent: VertexAttributeEnum;
declare const Texcoord0: VertexAttributeEnum;
declare const Texcoord1: VertexAttributeEnum;
declare const Color0: VertexAttributeEnum;
declare const Joints0: VertexAttributeEnum;
declare const Weights0: VertexAttributeEnum;
declare function isInstanceOfVertexAttributeClass(obj: unknown): obj is VertexAttributeClass;
declare function from$4(index: number): VertexAttributeEnum;
declare function fromString$3(str: string): VertexAttributeEnum;
type Gltf2VertexAttributeEnums = typeof Position | typeof Color0 | typeof Normal | typeof Tangent | typeof Texcoord0 | typeof Texcoord1 | typeof Joints0 | typeof Weights0;
declare function toVertexAttributeSemanticJoinedStringAsGltfStyle(attribute: Gltf2VertexAttributeEnums): VertexAttributeSemanticsJoinedString;
declare function toAttributeSlotFromJoinedString(str: VertexAttributeSemanticsJoinedString): Index;
declare function toVectorComponentN(joinedString: VertexAttributeSemanticsJoinedString): VectorComponentN;
declare const VertexAttribute: Readonly<{
    Unknown: VertexAttributeEnum;
    Position: VertexAttributeEnum;
    Normal: VertexAttributeEnum;
    Tangent: VertexAttributeEnum;
    Texcoord0: VertexAttributeEnum;
    Texcoord1: VertexAttributeEnum;
    Color0: VertexAttributeEnum;
    Joints0: VertexAttributeEnum;
    Weights0: VertexAttributeEnum;
    Instance: VertexAttributeEnum;
    FaceNormal: VertexAttributeEnum;
    BaryCentricCoord: VertexAttributeEnum;
    AttributeTypeNumber: number;
    isInstanceOfVertexAttributeClass: typeof isInstanceOfVertexAttributeClass;
    toVertexAttributeSemanticJoinedStringAsGltfStyle: typeof toVertexAttributeSemanticJoinedStringAsGltfStyle;
    toAttributeSlotFromJoinedString: typeof toAttributeSlotFromJoinedString;
    toVectorComponentN: typeof toVectorComponentN;
    from: typeof from$4;
    fromString: typeof fromString$3;
}>;

type VisibilityEnum = EnumIO;
declare function from$3(index: number): VisibilityEnum;
declare function fromString$2(str: string): VisibilityEnum;
declare const Visibility: Readonly<{
    Visible: EnumIO;
    Invisible: EnumIO;
    Neutral: EnumIO;
    from: typeof from$3;
    fromString: typeof fromString$2;
}>;

type ToneMappingTypeEnum = EnumIO;
declare function from$2(index: number): ToneMappingTypeEnum;
declare const ToneMappingType: Readonly<{
    None: EnumIO;
    KhronosPbrNeutral: EnumIO;
    Reinhard: EnumIO;
    GT_ToneMap: EnumIO;
    ACES_Narkowicz: EnumIO;
    ACES_Hill: EnumIO;
    ACES_Hill_Exposure_Boost: EnumIO;
    from: typeof from$2;
}>;

type SamplerDescriptor = {
    minFilter: TextureParameterEnum;
    magFilter: TextureParameterEnum;
    wrapS: TextureParameterEnum;
    wrapT: TextureParameterEnum;
    wrapR?: TextureParameterEnum;
    anisotropy?: boolean;
    shadowCompareMode?: boolean;
};
declare class Sampler {
    private __minFilter;
    private __magFilter;
    private __wrapS;
    private __wrapT;
    private __wrapR;
    private __anisotropy;
    private __shadowCompareMode;
    private __samplerResourceUid;
    constructor(desc: SamplerDescriptor);
    create(): void;
    get created(): boolean;
    get minFilter(): TextureParameterEnum;
    get magFilter(): TextureParameterEnum;
    get wrapS(): TextureParameterEnum;
    get wrapT(): TextureParameterEnum;
    get wrapR(): TextureParameterEnum;
    get _samplerResourceUid(): CGAPIResourceHandle;
}

declare abstract class AbstractTexture extends RnObject {
    protected __width: Size;
    protected __height: Size;
    protected __level: Index;
    protected __mipLevelCount: Index;
    protected __internalFormat: TextureFormatEnum;
    protected __format: PixelFormatEnum;
    protected __type: ComponentTypeEnum;
    protected __hasTransparentPixels: boolean;
    private static readonly InvalidTextureUid;
    private static __textureUidCount;
    private __textureUid;
    protected __img?: HTMLImageElement;
    protected __isTextureReady: boolean;
    protected __startedToLoad: boolean;
    protected __htmlImageElement?: HTMLImageElement;
    protected __htmlCanvasElement?: HTMLCanvasElement;
    protected __canvasContext?: CanvasRenderingContext2D;
    protected __uri?: string;
    protected __name: string;
    _textureResourceUid: CGAPIResourceHandle;
    _samplerResourceUid: CGAPIResourceHandle;
    _textureViewResourceUid: CGAPIResourceHandle;
    _textureViewAsRenderTargetResourceUid: CGAPIResourceHandle;
    _recommendedTextureSampler?: Sampler;
    constructor();
    get textureUID(): number;
    get width(): Size;
    getWidthAtMipLevel(mipLevel: Index): number;
    getHeightAtMipLevel(mipLevel: Index): number;
    set width(val: Size);
    get height(): Size;
    set height(val: Size);
    get isTextureReady(): boolean;
    get startedToLoad(): boolean;
    get htmlImageElement(): HTMLImageElement | undefined;
    get htmlCanvasElement(): HTMLCanvasElement;
    get uri(): string | undefined;
    set name(name: string);
    get name(): string;
    getImageData(x: Index, y: Index, width: Size, height: Size): ImageData;
    getPixelAs(x: Index, y: Index, typeClass: typeof ColorRgb | typeof ColorRgba | typeof Vector3 | typeof MutableVector3 | typeof Vector4 | typeof MutableVector4): any;
    /**
     * get the pixel data at (x,y) in the Texture as Uint8Clamped Array
     * @param x x position in the texture
     * @param y y position in the texture
     * @returns a pixel data as Uint8Clamped Array
     */
    getPixelAsArray(x: Index, y: Index): Uint8ClampedArray;
    setPixel(x: Index, y: Index, value: ColorRgb | ColorRgba | Vector3 | MutableVector3 | Vector4 | MutableVector4): void;
    setPixelAtChannel(x: Index, y: Index, channelIdx: Index, value: number): void;
    get isTransparent(): boolean;
    createInternalCanvasContext(): void;
    getTextureDataFloat(channels: Size): TextureDataFloat;
}

declare class RenderTargetTexture extends AbstractTexture implements IRenderable {
    private __fbo?;
    constructor();
    create({ width, height, mipLevelCount, format: internalFormat, }: {
        width: Size;
        height: Size;
        mipLevelCount?: number;
        format: TextureFormatEnum;
    }): void;
    set _fbo(fbo: FrameBuffer);
    get fbo(): FrameBuffer | undefined;
    private __createRenderTargetTexture;
    resize(width: Size, height: Size): void;
    destroy3DAPIResources(): boolean;
    getTexturePixelData(): Promise<Uint8Array>;
    downloadTexturePixelData(): Promise<void>;
    /**
     * Origin is left bottom
     *
     * @param x horizontal pixel position (0 is left)
     * @param y vertical pixel position (0 is bottom)
     * @param argByteArray Pixel Data as Uint8Array
     * @returns Pixel Value in Vector4
     */
    getPixelValueAt(x: Index, y: Index, argByteArray?: Uint8Array): Promise<Vector4>;
    generateMipmaps(): void;
    createCubeTextureViewAsRenderTarget(faceIdx: Index, mipLevel: Index): void;
}

declare class FrameBuffer extends RnObject {
    private __colorAttachments;
    private __depthAttachment?;
    private __stencilAttachment?;
    private __depthStencilAttachment?;
    cgApiResourceUid: CGAPIResourceHandle;
    width: Size;
    height: Size;
    private __colorAttachmentMap;
    constructor();
    get colorAttachmentsRenderBufferTargets(): RenderBufferTargetEnum[];
    get colorAttachments(): IRenderable[];
    get depthAttachment(): IRenderable | undefined;
    get stencilAttachment(): IRenderable | undefined;
    get depthStencilAttachment(): IRenderable | undefined;
    getColorAttachedRenderTargetTexture(index: Index): RenderTargetTexture | undefined;
    getDepthAttachedRenderTargetTexture(): RenderTargetTexture | undefined;
    create(width: Size, height: Size): number;
    get framebufferUID(): number;
    setColorAttachmentAt(index: Index, renderable: IRenderable): boolean;
    setColorAttachmentLayerAt(index: Index, renderable: IRenderable, layerIndex: Index, mipLevel: Index): boolean;
    setColorAttachmentCubeAt(attachmentIndex: Index, faceIndex: Index, mipLevel: Index, renderable: IRenderable): boolean;
    setDepthAttachment(renderable: IRenderable): boolean;
    setStencilAttachment(renderable: IRenderable): boolean;
    setDepthStencilAttachment(renderable: IRenderable): boolean;
    resize(width: Size, height: Size): void;
    destroy3DAPIResources(): void;
    whichColorAttachment(renderable: IRenderable): number;
}

type RequireOne<T, K extends keyof T = keyof T> = K extends keyof T ? PartialRequire<T, K> : never;
type PartialRequire<O, K extends keyof O> = {
    [P in K]-?: O[P];
} & O;
type MixinBase = new (...args: any[]) => any;
type GetProps<TBase> = TBase extends new (props: infer P) => any ? P : never;
type GetInstance<TBase> = TBase extends new (...args: any[]) => infer I ? I : never;
type MergeCtor<A, B> = new (props: GetProps<A> & GetProps<B>) => GetInstance<A> & GetInstance<B>;

declare abstract class AbstractQuaternion implements IQuaternion {
    get className(): string;
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(vec: IQuaternion, delta?: number): boolean;
    isStrictEqual(vec: IQuaternion): boolean;
    toEulerAnglesTo(out: IMutableVector3): IMutableVector3;
    toEulerAngles(): IVector3;
    transformVector3(vec: IVector3): IVector3;
    transformVector3To(vec: IVector3, out: IMutableVector3): IVector3;
    transformVector3Inverse(vec: IVector3): IVector3;
    /**
     * dot product
     */
    dot(quat: IQuaternion): number;
    clone(): IQuaternion;
    _v: Float32Array;
}

declare class Quaternion extends AbstractQuaternion implements IQuaternion {
    private static __tmp_upVec;
    private static __tmp_vec3_0;
    private static __tmp_vec3_1;
    private static __tmp_vec3_2;
    private static __tmp_vec3_3;
    private static __tmp_vec3_4;
    private static __tmp_vec3_5;
    constructor(x: Float32Array);
    get className(): string;
    static get compositionType(): {
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: IndexOf16Bytes;
        readonly __dummyStr: "VEC4";
        readonly webgpu: string;
        readonly wgsl: string;
        getNumberOfComponents(): Count;
        getGlslStr(componentType: ComponentTypeEnum): string;
        getGlslInitialValue(componentType: ComponentTypeEnum): string;
        getWgslInitialValue(componentType: ComponentTypeEnum): string;
        toWGSLType(componentType: ComponentTypeEnum): string;
        getVec4SizeOfProperty(): IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
        toString(): string;
        toJSON(): number;
    };
    static identity(): Quaternion;
    static dummy(): Quaternion;
    static invert(quat: IQuaternion): IQuaternion;
    static invertTo(quat: IQuaternion, out: IMutableQuaternion): IQuaternion;
    /**
     * Compute spherical linear interpolation
     */
    static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): IQuaternion;
    /**
     *  Compute the spherical linear interpolation and output it as the fourth argument
     */
    static qlerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion): IMutableQuaternion;
    static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): Quaternion;
    static lerpTo(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number, out: IMutableQuaternion): IMutableQuaternion;
    static axisAngle(vec: IVector3, radian: number): Quaternion;
    static fromMatrix(mat: IMatrix44): Quaternion;
    static fromMatrixTo(mat: IMatrix44, out: IMutableQuaternion): IMutableQuaternion;
    static lookFromTo(fromDirection: IVector3, toDirection: IVector3): IQuaternion;
    static lookForward(forward: IVector3): IQuaternion;
    static lookForwardAccordingToThisUp(forward: IVector3, up: IVector3): IQuaternion;
    static fromPosition(vec: IVector3): Quaternion;
    static add(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion;
    static addTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    static subtract(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion;
    static subtractTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    static multiply(l_quat: IQuaternion, r_quat: IQuaternion): Quaternion;
    static multiplyTo(l_quat: IQuaternion, r_quat: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    static multiplyNumber(quat: IQuaternion, value: number): Quaternion;
    static multiplyNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion): IMutableQuaternion;
    static divideNumber(quat: IQuaternion, value: number): Quaternion;
    static divideNumberTo(quat: IQuaternion, value: number, out: IMutableQuaternion): IMutableQuaternion;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(quat: IQuaternion, delta?: number): boolean;
    isStrictEqual(quat: IQuaternion): boolean;
    toEulerAnglesTo(out: IMutableVector3): IMutableVector3;
    toEulerAngles(): Vector3;
    /**
     * divide(static version)
     */
    private static _divide;
    /**
     * divide(static version)
     */
    private static _divideTo;
    /**
     * normalize(static version)
     */
    static normalize(vec: IQuaternion): Quaternion;
    /**
     * normalize(static version)
     */
    static normalizeTo(vec: IQuaternion, out: IMutableQuaternion): IMutableQuaternion;
    fromToRotation(from: IVector3, to: IVector3): Quaternion;
    static fromToRotation(from: IVector3, to: IVector3): Quaternion;
    static fromToRotationTo(from: IVector3, to: IVector3, out: IMutableQuaternion): IMutableQuaternion;
    transformVector3(v: IVector3): Vector3;
    transformVector3To(v: IVector3, out: IMutableVector3): IMutableVector3;
    transformVector3Inverse(v: IVector3): IVector3;
    clone(): IQuaternion;
    static fromFloat32Array(array: Float32Array): Quaternion;
    static fromCopyArray4(array: Array4<number>): Quaternion;
    static fromCopyArray(array: Array<number>): Quaternion;
    static fromCopy4(x: number, y: number, z: number, w: number): Quaternion;
    static fromCopyQuaternion(quat: IQuaternion): Quaternion;
    static fromCopyVector4(vec: IVector4): Quaternion;
    static fromCopyLogQuaternion(x: ILogQuaternion): Quaternion;
    static fromAxisAngle(axis: IVector3, rad: number): Quaternion;
    static fromAxisAngleTo(axis: IVector3, rad: number, out: IMutableQuaternion): IMutableQuaternion;
    static getQuaternionAngle(q: IQuaternion): number;
    static clampRotation(quat: IQuaternion, thetaMax: number): IQuaternion;
}

declare class Bloom {
    private __mapReducedFramebuffer;
    private __mapDetectHighLuminanceFramebuffer;
    private __mapSynthesizeFramebuffer;
    constructor();
    /**
     * create a bloom expression
     *
     * @param textureToBloom - the texture to bloom
     * @param parameters - the parameters for the bloom
     * @returns the bloom expression and the bloomed render target
     */
    createBloomExpression({ textureToBloom, parameters: { luminanceCriterion, gaussianBlurLevelHighLuminance, gaussianKernelSize, gaussianVariance, synthesizeCoefficient, }, }: {
        textureToBloom: AbstractTexture;
        parameters: {
            luminanceCriterion?: number;
            gaussianBlurLevelHighLuminance?: number;
            gaussianKernelSize?: number;
            gaussianVariance?: number;
            synthesizeCoefficient?: [number, number, number, number, number, number];
        };
    }): {
        bloomExpression: Expression;
        bloomedRenderTarget: RenderTargetTexture;
    };
    private __createRenderPassDetectHighLuminance;
    private __createRenderPassesBlurredHighLuminance;
    private __createRenderPassGaussianBlur;
    private __createRenderPassSynthesizeImage;
    destroy3DAPIResources(): void;
}

declare class GaussianBlur {
    private __mapReducedFramebuffer;
    private __mapSynthesizeFramebuffer;
    constructor();
    createGaussianBlurExpression({ textureToBlur, parameters: { blurPassLevel, gaussianKernelSize, gaussianVariance, synthesizeCoefficient, isReduceBuffer, textureFormat, outputFrameBuffer, outputFrameBufferLayerIndex, }, }: {
        textureToBlur: AbstractTexture;
        parameters: {
            blurPassLevel?: number;
            gaussianKernelSize?: number;
            gaussianVariance?: number;
            synthesizeCoefficient?: [number, number, number, number, number, number];
            isReduceBuffer?: boolean;
            textureFormat?: TextureFormatEnum;
            outputFrameBuffer?: FrameBuffer;
            outputFrameBufferLayerIndex?: number;
        };
    }): {
        blurExpression: Expression;
        blurredRenderTarget: RenderTargetTexture;
        renderPassesBlurred: RenderPass[];
    };
    private __createBlurPasses;
    private __createRenderPassSynthesizeImage;
    private __createRenderPassGaussianBlur;
    destroy3DAPIResources(): void;
}

declare const FloatArray$1: Float32ArrayConstructor;
type FloatArray$1 = Float32Array;
declare class MutableMatrix44 extends Matrix44 implements IMutableMatrix, IMutableMatrix44 {
    constructor(m: FloatArray$1);
    set m00(val: number);
    get m00(): number;
    set m10(val: number);
    get m10(): number;
    set m20(val: number);
    get m20(): number;
    set m30(val: number);
    get m30(): number;
    set m01(val: number);
    get m01(): number;
    set m11(val: number);
    get m11(): number;
    set m21(val: number);
    get m21(): number;
    set m31(val: number);
    get m31(): number;
    set m02(val: number);
    get m02(): number;
    set m12(val: number);
    get m12(): number;
    set m22(val: number);
    get m22(): number;
    set m32(val: number);
    get m32(): number;
    set m03(val: number);
    get m03(): number;
    set m13(val: number);
    get m13(): number;
    set m23(val: number);
    get m23(): number;
    set m33(val: number);
    get m33(): number;
    get translateX(): number;
    set translateX(val: number);
    get translateY(): number;
    set translateY(val: number);
    get translateZ(): number;
    set translateZ(val: number);
    get className(): string;
    /**
     * zero matrix(static version)
     */
    static zero(): MutableMatrix44;
    /**
     * Create identity matrix
     */
    static identity(): MutableMatrix44;
    static dummy(): MutableMatrix44;
    /**
     * Create transpose matrix
     */
    static transpose(mat: Matrix44): Matrix44;
    /**
     * Create invert matrix
     */
    static invert(mat: Matrix44): MutableMatrix44;
    /**
     * Create translation Matrix
     */
    static translate(vec: Vector3): MutableMatrix44;
    /**
     * Create X oriented Rotation Matrix
     */
    static rotateX(radian: number): MutableMatrix44;
    /**
     * Create Y oriented Rotation Matrix
     */
    static rotateY(radian: number): MutableMatrix44;
    /**
     * Create Z oriented Rotation Matrix
     */
    static rotateZ(radian: number): MutableMatrix44;
    static rotateXYZ(x: number, y: number, z: number): MutableMatrix44;
    static rotate(vec: Vector3): MutableMatrix44;
    /**
     * Create Scale Matrix
     */
    static scale(vec: Vector3): MutableMatrix44;
    /**
     * multiply matrixes
     */
    static multiply(l_mat: Matrix44, r_mat: Matrix44): MutableMatrix44;
    clone(): MutableMatrix44;
    getRotate(): MutableMatrix44;
    getTranslate(): MutableVector3;
    getTranslateTo(outVec: MutableVector3): MutableVector3;
    getScale(): MutableVector3;
    raw(): Float32Array;
    setAt(row_i: number, column_i: number, value: number): this;
    setComponents(m00: number, m01: number, m02: number, m03: number, m10: number, m11: number, m12: number, m13: number, m20: number, m21: number, m22: number, m23: number, m30: number, m31: number, m32: number, m33: number): this;
    copyComponents(mat: IMatrix44): this;
    /**
     * zero matrix
     */
    zero(): this;
    /**
     * to the identity matrix
     */
    identity(): this;
    _swap(l: Index, r: Index): void;
    /**
     * transpose
     */
    transpose(): this;
    invert(): this;
    translate(vec: Vector3): this;
    putTranslate(vec: Vector3): this;
    addTranslate(vec: Vector3): this;
    /**
     * Create X oriented Rotation Matrix
     */
    rotateX(radian: number): this;
    /**
     * Create Y oriented Rotation Matrix
     */
    rotateY(radian: number): this;
    /**
     * Create Z oriented Rotation Matrix
     */
    rotateZ(radian: number): this;
    rotateXYZ(x: number, y: number, z: number): this;
    rotate(vec: Vector3): this;
    scale(vec: Vector3): this;
    multiplyScale(vec: Vector3): this;
    /**
     * multiply the input matrix from right side
     */
    multiply(mat: Matrix44): this;
    multiplyByLeft(mat: Matrix44): this;
    fromQuaternion(quat: IQuaternion): this;
    /**
     * Set values as Row Major
     * Note that WebGL matrix keeps the values in column major.
     * If you write 16 values in 4x4 style (4 values in each row),
     *   It will becomes an intuitive handling.
     * @returns
     */
    static fromCopy16RowMajor(m00: number, m01: number, m02: number, m03: number, m10: number, m11: number, m12: number, m13: number, m20: number, m21: number, m22: number, m23: number, m30: number, m31: number, m32: number, m33: number): MutableMatrix44;
    /**
     * Set values as Column Major
     * Note that WebGL matrix keeps the values in column major.
     * @returns
     */
    static fromCopy16ColumnMajor(m00: number, m10: number, m20: number, m30: number, m01: number, m11: number, m21: number, m31: number, m02: number, m12: number, m22: number, m32: number, m03: number, m13: number, m23: number, m33: number): MutableMatrix44;
    static fromCopyMatrix44(mat: IMatrix44): MutableMatrix44;
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix44;
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix44;
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): MutableMatrix44;
    static fromCopyMatrix33(mat: IMatrix33): MutableMatrix44;
    static fromCopyArray16ColumnMajor(array: Array16<number>): MutableMatrix44;
    static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix44;
    static fromCopyArray16RowMajor(array: Array16<number>): MutableMatrix44;
    static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix44;
    static fromCopyQuaternion(q: Quaternion): MutableMatrix44;
}

declare class _BasisFile {
    constructor(x: Uint8Array);
    close(): void;
    getHasAlpha(): number;
    getNumImages(): number;
    getNumLevels(imageIndex: number): number;
    getImageWidth(imageIndex: number, levelIndex: number): number;
    getImageHeight(imageIndex: number, levelIndex: number): number;
    getImageTranscodedSizeInBytes(imageIndex: number, levelImdex: number, format: number): number;
    startTranscoding(): number;
    transcodeImage(dst: Uint8Array, imageIndex: number, levelIndex: number, format: number, unused: number, getAlphaForOpaqueFormats: number): number;
    delete(): void;
}
type BasisFile = _BasisFile;
type BasisTranscoder = {
    BasisFile: new (x: Uint8Array) => BasisFile;
    initializeBasis: () => void;
};
declare function _BASIS(): {
    then: (callback: (basisTranscoder: BasisTranscoder) => void) => void;
};
type BASIS = typeof _BASIS;

type TextureFormat = {
    value: number;
};
type _TextureFormat = {
    ETC1S: TextureFormat;
    UASTC4x4: TextureFormat;
};
type TranscodeTarget = {
    value: number;
};
type _TranscodeTarget = {
    ETC1_RGB: TranscodeTarget;
    BC1_RGB: TranscodeTarget;
    BC4_R: TranscodeTarget;
    BC5_RG: TranscodeTarget;
    BC3_RGBA: TranscodeTarget;
    PVRTC1_4_RGB: TranscodeTarget;
    PVRTC1_4_RGBA: TranscodeTarget;
    BC7_RGBA: TranscodeTarget;
    BC7_M6_RGB: TranscodeTarget;
    BC7_M5_RGBA: TranscodeTarget;
    ETC2_RGBA: TranscodeTarget;
    ASTC_4x4_RGBA: TranscodeTarget;
    RGBA32: TranscodeTarget;
    RGB565: TranscodeTarget;
    BGR565: TranscodeTarget;
    RGBA4444: TranscodeTarget;
    PVRTC2_4_RGB: TranscodeTarget;
    PVRTC2_4_RGBA: TranscodeTarget;
    EAC_R11: TranscodeTarget;
    EAC_RG11: TranscodeTarget;
};
declare class ImageInfo {
    constructor(textureFormat: TextureFormat, levelWidth: number, levelHeight: number, level: number);
    numBlocksX: number;
    numBlocksY: number;
    flags: number;
    rgbByteOffset: number;
    rgbByteLength: number;
    alphaByteOffset: number;
    alphaByteLength: number;
}
type _ImageInfo = new (textureFormat: TextureFormat, levelWidth: number, levelHeight: number, level: number) => ImageInfo;
type TranscodedImage = {
    transcodedImage: {
        get_typed_memory_view: () => Uint8Array;
        delete: () => void;
    };
};
declare class UastcImageTranscoder {
    transcodeImage: (transcodeTarget: TranscodeTarget, faceBuffer: Uint8Array, imageInfo: ImageInfo, decodeFlags: 0, hasAlpha: boolean, isVideo: boolean) => TranscodedImage | undefined;
}
declare class BasisLzEtc1sImageTranscoder {
    transcodeImage: (transcodeTarget: TranscodeTarget, faceBuffer: Uint8Array, imageInfo: ImageInfo, decodeFlags: 0, isVideo: boolean) => TranscodedImage | undefined;
    decodePalettes: (numEndpoints: number, endpoints: Uint8Array, numSelectors: number, selectors: Uint8Array) => void;
    decodeTables: (tables: Uint8Array) => void;
}
type MscTranscoderModule = {
    initTranscoders: () => void;
    TextureFormat: _TextureFormat;
    TranscodeTarget: _TranscodeTarget;
    ImageInfo: _ImageInfo;
    UastcImageTranscoder: new () => UastcImageTranscoder;
    BasisLzEtc1sImageTranscoder: new () => BasisLzEtc1sImageTranscoder;
};
type MSC_TRANSCODER = () => Promise<MscTranscoderModule>;

declare function fromTensorToCompositionType(vec: any): {
    readonly __numberOfComponents: number;
    readonly __glslStr: string;
    readonly __hlslStr: string;
    readonly __webgpuStr: string;
    readonly __wgslStr: string;
    readonly __isArray: boolean;
    readonly __vec4SizeOfProperty: IndexOf16Bytes;
    readonly __dummyStr: "UNKNOWN";
    readonly webgpu: string;
    readonly wgsl: string;
    getNumberOfComponents(): Count;
    getGlslStr(componentType: ComponentTypeEnum): string;
    getGlslInitialValue(componentType: ComponentTypeEnum): string;
    getWgslInitialValue(componentType: ComponentTypeEnum): string;
    toWGSLType(componentType: ComponentTypeEnum): string;
    getVec4SizeOfProperty(): IndexOf16Bytes;
    readonly index: number;
    readonly symbol: symbol;
    readonly str: string;
    toString(): string;
    toJSON(): number;
} | {
    readonly __numberOfComponents: number;
    readonly __glslStr: string;
    readonly __hlslStr: string;
    readonly __webgpuStr: string;
    readonly __wgslStr: string;
    readonly __isArray: boolean;
    readonly __vec4SizeOfProperty: IndexOf16Bytes;
    readonly __dummyStr: "SCALAR";
    readonly webgpu: string;
    readonly wgsl: string;
    getNumberOfComponents(): Count;
    getGlslStr(componentType: ComponentTypeEnum): string;
    getGlslInitialValue(componentType: ComponentTypeEnum): string;
    getWgslInitialValue(componentType: ComponentTypeEnum): string;
    toWGSLType(componentType: ComponentTypeEnum): string;
    getVec4SizeOfProperty(): IndexOf16Bytes;
    readonly index: number;
    readonly symbol: symbol;
    readonly str: string;
    toString(): string;
    toJSON(): number;
} | {
    readonly __numberOfComponents: number;
    readonly __glslStr: string;
    readonly __hlslStr: string;
    readonly __webgpuStr: string;
    readonly __wgslStr: string;
    readonly __isArray: boolean;
    readonly __vec4SizeOfProperty: IndexOf16Bytes;
    readonly __dummyStr: "VEC2";
    readonly webgpu: string;
    readonly wgsl: string;
    getNumberOfComponents(): Count;
    getGlslStr(componentType: ComponentTypeEnum): string;
    getGlslInitialValue(componentType: ComponentTypeEnum): string;
    getWgslInitialValue(componentType: ComponentTypeEnum): string;
    toWGSLType(componentType: ComponentTypeEnum): string;
    getVec4SizeOfProperty(): IndexOf16Bytes;
    readonly index: number;
    readonly symbol: symbol;
    readonly str: string;
    toString(): string;
    toJSON(): number;
} | {
    readonly __numberOfComponents: number;
    readonly __glslStr: string;
    readonly __hlslStr: string;
    readonly __webgpuStr: string;
    readonly __wgslStr: string;
    readonly __isArray: boolean;
    readonly __vec4SizeOfProperty: IndexOf16Bytes;
    readonly __dummyStr: "VEC3";
    readonly webgpu: string;
    readonly wgsl: string;
    getNumberOfComponents(): Count;
    getGlslStr(componentType: ComponentTypeEnum): string;
    getGlslInitialValue(componentType: ComponentTypeEnum): string;
    getWgslInitialValue(componentType: ComponentTypeEnum): string;
    toWGSLType(componentType: ComponentTypeEnum): string;
    getVec4SizeOfProperty(): IndexOf16Bytes;
    readonly index: number;
    readonly symbol: symbol;
    readonly str: string;
    toString(): string;
    toJSON(): number;
} | {
    readonly __numberOfComponents: number;
    readonly __glslStr: string;
    readonly __hlslStr: string;
    readonly __webgpuStr: string;
    readonly __wgslStr: string;
    readonly __isArray: boolean;
    readonly __vec4SizeOfProperty: IndexOf16Bytes;
    readonly __dummyStr: "VEC4";
    readonly webgpu: string;
    readonly wgsl: string;
    getNumberOfComponents(): Count;
    getGlslStr(componentType: ComponentTypeEnum): string;
    getGlslInitialValue(componentType: ComponentTypeEnum): string;
    getWgslInitialValue(componentType: ComponentTypeEnum): string;
    toWGSLType(componentType: ComponentTypeEnum): string;
    getVec4SizeOfProperty(): IndexOf16Bytes;
    readonly index: number;
    readonly symbol: symbol;
    readonly str: string;
    toString(): string;
    toJSON(): number;
} | {
    readonly __numberOfComponents: number;
    readonly __glslStr: string;
    readonly __hlslStr: string;
    readonly __webgpuStr: string;
    readonly __wgslStr: string;
    readonly __isArray: boolean;
    readonly __vec4SizeOfProperty: IndexOf16Bytes;
    readonly __dummyStr: "MAT2";
    readonly webgpu: string;
    readonly wgsl: string;
    getNumberOfComponents(): Count;
    getGlslStr(componentType: ComponentTypeEnum): string;
    getGlslInitialValue(componentType: ComponentTypeEnum): string;
    getWgslInitialValue(componentType: ComponentTypeEnum): string;
    toWGSLType(componentType: ComponentTypeEnum): string;
    getVec4SizeOfProperty(): IndexOf16Bytes;
    readonly index: number;
    readonly symbol: symbol;
    readonly str: string;
    toString(): string;
    toJSON(): number;
} | {
    readonly __numberOfComponents: number;
    readonly __glslStr: string;
    readonly __hlslStr: string;
    readonly __webgpuStr: string;
    readonly __wgslStr: string;
    readonly __isArray: boolean;
    readonly __vec4SizeOfProperty: IndexOf16Bytes;
    readonly __dummyStr: "MAT3";
    readonly webgpu: string;
    readonly wgsl: string;
    getNumberOfComponents(): Count;
    getGlslStr(componentType: ComponentTypeEnum): string;
    getGlslInitialValue(componentType: ComponentTypeEnum): string;
    getWgslInitialValue(componentType: ComponentTypeEnum): string;
    toWGSLType(componentType: ComponentTypeEnum): string;
    getVec4SizeOfProperty(): IndexOf16Bytes;
    readonly index: number;
    readonly symbol: symbol;
    readonly str: string;
    toString(): string;
    toJSON(): number;
} | {
    readonly __numberOfComponents: number;
    readonly __glslStr: string;
    readonly __hlslStr: string;
    readonly __webgpuStr: string;
    readonly __wgslStr: string;
    readonly __isArray: boolean;
    readonly __vec4SizeOfProperty: IndexOf16Bytes;
    readonly __dummyStr: "MAT4";
    readonly webgpu: string;
    readonly wgsl: string;
    getNumberOfComponents(): Count;
    getGlslStr(componentType: ComponentTypeEnum): string;
    getGlslInitialValue(componentType: ComponentTypeEnum): string;
    getWgslInitialValue(componentType: ComponentTypeEnum): string;
    toWGSLType(componentType: ComponentTypeEnum): string;
    getVec4SizeOfProperty(): IndexOf16Bytes;
    readonly index: number;
    readonly symbol: symbol;
    readonly str: string;
    toString(): string;
    toJSON(): number;
};

type PromiseFn<T> = (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void;
type OnFinallyFn = (() => void) | null | undefined;
type RnPromiseCallbackObj = {
    promiseAllNum: number;
    resolvedNum: number;
    rejectedNum: number;
    pendingNum: number;
    processedPromises: any[];
};
type RnPromiseCallback = (obj: RnPromiseCallbackObj) => void;
declare class RnPromise<T> extends Promise<T> {
    private __promise;
    private __callback?;
    name: string;
    private __callbackObj;
    constructor(promise: Promise<T>);
    constructor(fn: PromiseFn<T>);
    static resolve<T>(): Promise<T>;
    static resolve<T>(arg: T | PromiseLike<T>): Promise<T>;
    static all(promises: any[], callback?: RnPromiseCallback): RnPromise<any[]>;
    static race(args: any[]): RnPromise<any>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): RnPromise<TResult1 | TResult2>;
    catch(onRejected?: any): RnPromise<T>;
    finally(onFinally?: OnFinallyFn): Promise<T>;
    static reject(e: Error): RnPromise<never>;
}

/**
 * @internal
 */
declare class Vector2_<T extends FloatTypedArrayConstructor> extends AbstractVector {
    constructor(v: TypedArray, { type }: {
        type: T;
    });
    get x(): number;
    get y(): number;
    get glslStrAsFloat(): string;
    get glslStrAsInt(): string;
    get wgslStrAsFloat(): string;
    get wgslStrAsInt(): string;
    static get compositionType(): {
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: IndexOf16Bytes;
        readonly __dummyStr: "VEC2";
        readonly webgpu: string;
        readonly wgsl: string;
        getNumberOfComponents(): Count;
        getGlslStr(componentType: ComponentTypeEnum): string;
        getGlslInitialValue(componentType: ComponentTypeEnum): string;
        getWgslInitialValue(componentType: ComponentTypeEnum): string;
        toWGSLType(componentType: ComponentTypeEnum): string;
        getVec4SizeOfProperty(): IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
        toString(): string;
        toJSON(): number;
    };
    /**
     * to square length(static version)
     */
    static lengthSquared(vec: IVector2): number;
    static lengthBtw(l_vec: IVector2, r_vec: IVector2): number;
    static angleOfVectors(l_vec: IVector2, r_vec: IVector2): number;
    static _zero(type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    static _one(type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    static _dummy(type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * normalize(static version)
     */
    static _normalize(vec: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * add value（static version）
     */
    static _add(l_vec: IVector2, r_vec: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * add value（static version）
     */
    static addTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2): IMutableVector2;
    /**
     * subtract value(static version)
     */
    static _subtract(l_vec: IVector2, r_vec: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * subtract value(static version)
     */
    static subtractTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2): IMutableVector2;
    /**
     * multiply value(static version)
     */
    static _multiply(vec: IVector2, value: number, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * multiply value(static version)
     */
    static multiplyTo(vec: IVector2, value: number, out: IMutableVector2): IMutableVector2;
    /**
     * multiply vector(static version)
     */
    static _multiplyVector(l_vec: IVector2, r_vec: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * multiply vector(static version)
     */
    static multiplyVectorTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2): IMutableVector2;
    /**
     * divide by value(static version)
     */
    static _divide(vec: IVector2, value: number, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * divide by value(static version)
     */
    static divideTo(vec: IVector2, value: number, out: IMutableVector2): IMutableVector2;
    /**
     * divide by vector(static version)
     */
    static _divideVector(l_vec: IVector2, r_vec: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    /**
     * divide by vector(static version)
     */
    static divideVectorTo(l_vec: IVector2, r_vec: IVector2, out: IMutableVector2): IMutableVector2;
    /**
     * dot product(static version)
     */
    static dot(l_vec: IVector2, r_vec: IVector2): number;
    /**
     * change to string
     */
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(vec: IVector2, delta?: number): boolean;
    isStrictEqual(vec: IVector2): boolean;
    at(i: number): number;
    length(): number;
    lengthSquared(): number;
    lengthTo(vec: IVector2): number;
    /**
     * dot product
     */
    dot(vec: IVector2): number;
    clone(): any;
    static _fromCopyArray2(array: Array2<number>, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    static _fromCopy2(x: number, y: number, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    static _fromCopyArray(array: Array<number>, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    static _fromVector2(vec2: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    static _fromCopyVector2(vec2: IVector2, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    static _fromCopyVector3(vec3: IVector3, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    static _fromCopyVector4(vec4: IVector4, type: FloatTypedArrayConstructor): Vector2_<FloatTypedArrayConstructor>;
    get bytesPerComponent(): number;
}
/**
 * Immutable 2D(x,y) Vector class with 32bit float components
 */
declare class Vector2 extends Vector2_<Float32ArrayConstructor> implements IVector, IVector2 {
    constructor(x: TypedArray);
    static fromCopyArray2(array: Array2<number>): Vector2;
    static fromCopy2(x: number, y: number): Vector2;
    static fromCopyArray(array: Array<number>): Vector2;
    static fromCopyVector2(vec2: IVector2): Vector2;
    static fromCopyVector4(vec4: IVector4): Vector2;
    static zero(): Vector2;
    static one(): Vector2;
    static dummy(): Vector2;
    static normalize(vec: IVector2): Vector2;
    static add(l_vec: IVector2, r_vec: IVector2): Vector2;
    static subtract(l_vec: IVector2, r_vec: IVector2): Vector2;
    static multiply(vec: IVector2, value: number): Vector2;
    static multiplyVector(l_vec: IVector2, r_vec: IVector2): Vector2;
    static divide(vec: IVector2, value: number): Vector2;
    static divideVector(l_vec: IVector2, r_vec: IVector2): Vector2;
    get className(): string;
    clone(): Vector2;
}
/**
 * Immutable 2D(x,y) Vector class with 64bit float components
 */
declare class Vector2d extends Vector2_<Float64ArrayConstructor> {
    constructor(x: TypedArray);
    static fromCopyArray2(array: Array2<number>): Vector2d;
    static fromCopy2(x: number, y: number): Vector2d;
    static fromCopyArray(array: Array<number>): Vector2d;
    static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector2d;
    static fromFloat64Array(float64Array: Float64Array): Vector2d;
    static zero(): Vector2d;
    static one(): Vector2d;
    static dummy(): Vector2d;
    static normalize(vec: IVector2): Vector2d;
    static add(l_vec: IVector2, r_vec: IVector2): Vector2d;
    static subtract(l_vec: IVector2, r_vec: IVector2): Vector2d;
    static multiply(vec: IVector2, value: number): Vector2d;
    static multiplyVector(l_vec: IVector2, r_vec: IVector2): Vector2d;
    static divide(vec: IVector2, value: number): Vector2d;
    static divideVector(l_vec: IVector2, r_vec: IVector2): Vector2d;
    clone(): Vector2d;
}
type Vector2f = Vector2;
declare const ConstVector2_1_1: Vector2;
declare const ConstVector2_0_0: Vector2;

/**
 * @internal
 */
declare class MutableVector2_<T extends FloatTypedArrayConstructor> extends Vector2_<T> {
    constructor(x: TypedArray, { type }: {
        type: T;
    });
    set x(x: number);
    get x(): number;
    set y(y: number);
    get y(): number;
    get z(): number;
    get w(): number;
    raw(): TypedArray;
    setAt(i: number, value: number): this;
    setComponents(x: number, y: number): this;
    copyComponents(vec: IVector2): this;
    zero(): this;
    one(): this;
    normalize(): this;
    /**
     * add value
     */
    add(vec: IVector2): this;
    /**
     * subtract
     */
    subtract(vec: IVector2): this;
    /**
     * multiply
     */
    multiply(value: number): this;
    /**
     * multiply vector
     */
    multiplyVector(vec: IVector2): this;
    /**
     * divide
     */
    divide(value: number): this;
    /**
     * divide vector
     */
    divideVector(vec: IVector2): this;
    get bytesPerComponent(): number;
}
/**
 * Mutable 2D(x,y) Vector class with 32bit float components
 */
declare class MutableVector2 extends MutableVector2_<Float32ArrayConstructor> implements IMutableVector, IMutableVector2 {
    constructor(x: TypedArray);
    static fromCopyArray2(array: Array2<number>): MutableVector2;
    static fromCopyArray(array: Array<number>): MutableVector2;
    static fromFloat32Array(float32Array: Float32Array): MutableVector2;
    static fromCopyFloat32Array(float32Array: Float32Array): MutableVector2;
    static zero(): MutableVector2;
    static one(): MutableVector2;
    static dummy(): MutableVector2;
    static normalize(vec: IVector2): MutableVector2;
    static add(l_vec: IVector2, r_vec: IVector2): MutableVector2;
    static subtract(l_vec: IVector2, r_vec: IVector2): MutableVector2;
    static multiply(vec: IVector2, value: number): MutableVector2;
    static multiplyVector(l_vec: IVector2, r_vec: IVector2): MutableVector2;
    static divide(vec: IVector2, value: number): MutableVector2;
    static divideVector(l_vec: IVector2, r_vec: IVector2): MutableVector2;
    get className(): string;
    clone(): MutableVector2;
}
/**
 * Mutable 2D(x,y) Vector class with 64bit float components
 */
declare class MutableVector2d extends MutableVector2_<Float64ArrayConstructor> {
    constructor(x: TypedArray);
    static fromCopyArray(array: Array2<number>): MutableVector2d;
    static zero(): MutableVector2d;
    static one(): MutableVector2d;
    static dummy(): MutableVector2d;
    static normalize(vec: IVector2): MutableVector2d;
    static add(l_vec: IVector2, r_vec: IVector2): MutableVector2d;
    static subtract(l_vec: IVector2, r_vec: IVector2): MutableVector2d;
    static multiply(vec: IVector2, value: number): MutableVector2d;
    static multiplyVector(l_vec: IVector2, r_vec: IVector2): MutableVector2d;
    static divide(vec: IVector2, value: number): MutableVector2d;
    static divideVector(l_vec: IVector2, r_vec: IVector2): MutableVector2d;
    clone(): MutableVector2d;
}
type MutableVector2f = MutableVector2;

declare class MutableMatrix33 extends Matrix33 implements IMutableMatrix, IMutableMatrix33 {
    constructor(m: Float32Array);
    set m00(val: number);
    get m00(): number;
    set m10(val: number);
    get m10(): number;
    set m20(val: number);
    get m20(): number;
    set m01(val: number);
    get m01(): number;
    set m11(val: number);
    get m11(): number;
    set m21(val: number);
    get m21(): number;
    set m02(val: number);
    get m02(): number;
    set m12(val: number);
    get m12(): number;
    set m22(val: number);
    get m22(): number;
    get className(): string;
    /**
     * zero matrix(static version)
     */
    static zero(): MutableMatrix33;
    /**
     * Create identity matrix
     */
    static identity(): MutableMatrix33;
    static dummy(): MutableMatrix33;
    /**
     * Create transpose matrix
     */
    static transpose(mat: IMatrix33): MutableMatrix33;
    /**
     * Create invert matrix
     */
    static invert(mat: IMatrix33): MutableMatrix33;
    /**
     * Create X oriented Rotation Matrix
     */
    static rotateX(radian: number): MutableMatrix33;
    /**
     * Create Y oriented Rotation Matrix
     */
    static rotateY(radian: number): MutableMatrix33;
    /**
     * Create Z oriented Rotation Matrix
     */
    static rotateZ(radian: number): MutableMatrix33;
    static rotateXYZ(x: number, y: number, z: number): MutableMatrix33;
    static rotate(vec: IVector3): MutableMatrix33;
    /**
     * Create Scale Matrix
     */
    static scale(vec: IVector3): MutableMatrix33;
    /**
     * multiply matrixes
     */
    static multiply(l_mat: IMatrix33, r_mat: IMatrix33): MutableMatrix33;
    clone(): MutableMatrix33;
    raw(): Float32Array;
    setAt(row_i: number, column_i: number, value: number): this;
    setComponents(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): MutableMatrix33;
    copyComponents(mat: IMatrix33 | IMatrix44): this;
    /**
     * zero matrix
     */
    zero(): MutableMatrix33;
    identity(): MutableMatrix33;
    _swap(l: Index, r: Index): void;
    /**
     * transpose
     */
    transpose(): this;
    invert(): MutableMatrix33;
    /**
     * Create X oriented Rotation Matrix
     */
    rotateX(radian: number): MutableMatrix33;
    /**
     * Create Y oriented Rotation Matrix
     */
    rotateY(radian: number): MutableMatrix33;
    /**
     * Create Z oriented Rotation Matrix
     */
    rotateZ(radian: number): MutableMatrix33;
    rotateXYZ(x: number, y: number, z: number): MutableMatrix33;
    rotate(vec: Vector3): MutableMatrix33;
    scale(vec: Vector3): MutableMatrix33;
    multiplyScale(vec: Vector3): this;
    /**
     * multiply the input matrix from right side
     */
    multiply(mat: Matrix33): MutableMatrix33;
    multiplyByLeft(mat: Matrix33): MutableMatrix33;
    /**
     * Set values as Row Major
     * Note that WebGL matrix keeps the values in column major.
     * If you write 9 values in 3x3 style (3 values in each row),
     *   It will becomes an intuitive handling.
     * @returns
     */
    static fromCopy9RowMajor(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): MutableMatrix33;
    /**
     * Set values as Column Major
     * Note that WebGL matrix keeps the values in column major.
     * @returns
     */
    static fromCopy9ColumnMajor(m00: number, m10: number, m20: number, m01: number, m11: number, m21: number, m02: number, m12: number, m22: number): MutableMatrix33;
    static fromCopyMatrix44(mat: Matrix44): MutableMatrix33;
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix33;
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix33;
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): MutableMatrix33;
    static fromCopyMatrix33(mat: IMatrix33): MutableMatrix33;
    static fromCopyArray9ColumnMajor(array: Array9<number>): MutableMatrix33;
    static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix33;
    static fromCopyArray9RowMajor(array: Array9<number>): MutableMatrix33;
    static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix33;
    static fromCopyQuaternion(q: IQuaternion): MutableMatrix33;
}

/**
 * the Abstract base class of Matrix classes
 */
declare abstract class AbstractMatrix implements IMatrix {
    _v: Float32Array;
    at(row_i: number, column_i: number): number;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    v(i: number): number;
    determinant(): number;
    get className(): string;
    get isIdentityMatrixClass(): boolean;
    isTheSourceSame(arrayBuffer: ArrayBuffer): boolean;
}

declare class Matrix33 extends AbstractMatrix implements IMatrix, IMatrix33 {
    constructor(m: Float32Array);
    get m00(): number;
    get m10(): number;
    get m20(): number;
    get m01(): number;
    get m11(): number;
    get m21(): number;
    get m02(): number;
    get m12(): number;
    get m22(): number;
    get className(): string;
    get glslStrAsFloat(): string;
    get glslStrAsInt(): string;
    get wgslStrAsFloat(): string;
    get wgslStrAsInt(): string;
    static get compositionType(): {
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: IndexOf16Bytes;
        readonly __dummyStr: "MAT3";
        readonly webgpu: string;
        readonly wgsl: string;
        getNumberOfComponents(): Count;
        getGlslStr(componentType: ComponentTypeEnum): string;
        getGlslInitialValue(componentType: ComponentTypeEnum): string;
        getWgslInitialValue(componentType: ComponentTypeEnum): string;
        toWGSLType(componentType: ComponentTypeEnum): string;
        getVec4SizeOfProperty(): IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
        toString(): string;
        toJSON(): number;
    };
    /**
     * zero matrix(static version)
     */
    static zero(): Matrix33;
    /**
     * Create identity matrix
     */
    static identity(): IMatrix33;
    static dummy(): Matrix33;
    /**
     * Create transpose matrix
     */
    static transpose(mat: IMatrix33): IMatrix33;
    /**
     * Create invert matrix
     */
    static invert(mat: IMatrix33): IMatrix33 | Matrix33;
    static invertTo(mat: IMatrix33, outMat: MutableMatrix33): MutableMatrix33;
    /**
     * Create X oriented Rotation Matrix
     */
    static rotateX(radian: number): Matrix33;
    /**
     * Create Y oriented Rotation Matrix
     */
    static rotateY(radian: number): Matrix33;
    /**
     * Create Z oriented Rotation Matrix
     */
    static rotateZ(radian: number): Matrix33;
    static rotateXYZ(x: number, y: number, z: number): Matrix33;
    static rotate(vec: Vector3): Matrix33;
    /**
     * Create Scale Matrix
     */
    static scale(vec: IVector3): Matrix33;
    /**
     * multiply matrixes
     */
    static multiply(l_mat: IMatrix33, r_mat: IMatrix33): IMatrix33;
    /**
     * multiply matrixes
     */
    static multiplyTo(l_mat: IMatrix33, r_mat: IMatrix33, outMat: MutableMatrix33): MutableMatrix33;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(mat: IMatrix33, delta?: number): boolean;
    isStrictEqual(mat: Matrix33): boolean;
    at(row_i: number, column_i: number): number;
    v(i: number): number;
    determinant(): number;
    multiplyVector(vec: IVector3): any;
    multiplyVectorTo(vec: IVector3, outVec: IMutableVector3): IMutableVector3;
    getScale(): Vector3;
    getScaleTo(outVec: MutableVector3): MutableVector3;
    clone(): any;
    /**
     * Set values as Row Major
     * Note that WebGL matrix keeps the values in column major.
     * If you write 9 values in 3x3 style (3 values in each row),
     *   It will becomes an intuitive handling.
     * @returns
     */
    static fromCopy9RowMajor(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): Matrix33;
    /**
     * Set values as Column Major
     * Note that WebGL matrix keeps the values in column major.
     * @returns
     */
    static fromCopy9ColumnMajor(m00: number, m10: number, m20: number, m01: number, m11: number, m21: number, m02: number, m12: number, m22: number): Matrix33;
    static fromCopyMatrix44(mat: Matrix44): Matrix33;
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix33;
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix33;
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): Matrix33;
    static fromCopyMatrix33(mat: IMatrix33): Matrix33;
    static fromCopyArray9ColumnMajor(array: Array9<number>): Matrix33;
    static fromCopyArrayColumnMajor(array: Array<number>): Matrix33;
    static fromCopyArray9RowMajor(array: Array9<number>): Matrix33;
    static fromCopyArrayRowMajor(array: Array<number>): Matrix33;
    static fromCopyQuaternion(q: Quaternion): Matrix33;
}

/**
 * A 3D axis-aligned bounding box.
 */
declare class AABB {
    private __min;
    private __max;
    private __centerPoint;
    private __lengthCenterToCorner;
    private __isCenterPointDirty;
    private __isLengthCenterToCornerDirty;
    private static __tmpVector3;
    private __isVanilla;
    constructor();
    /**
     * Clone this AABB.
     * @returns a cloned AABB.
     */
    clone(): AABB;
    /**
     * Copy inner components from another AABB.
     * @param aabb
     * @returns this
     */
    copyComponents(aabb: AABB): this;
    /**
     * initialize this AABB.
     */
    initialize(): void;
    set minPoint(val: Vector3);
    get minPoint(): Vector3;
    set maxPoint(val: Vector3);
    get maxPoint(): Vector3;
    /**
     * return whether this AABB is vanilla (not initialized) or not.
     * @returns true if this AABB is vanilla.
     */
    isVanilla(): boolean;
    /**
     * add a position for updating AABB.
     * @param positionVector
     * @returns given positionVector.
     */
    addPosition(positionVector: Vector3): Vector3;
    /**
     * add a position for updating AABB.
     * @param array a position array.
     * @param index index of the position array to adding.
     * @returns given array.
     */
    addPositionWithArray(array: number[], index: Index): number[];
    /**
     * merge with another AABB.
     * @param aabb another AABB to merge
     * @returns merge succeeded or not.
     */
    mergeAABB(aabb: AABB): boolean;
    /**
     * the center of this AABB.
     */
    get centerPoint(): MutableVector3;
    /**
     * the length from center to corner of this AABB.
     */
    get lengthCenterToCorner(): number;
    /**
     * the length from min x to max x of this AABB.
     */
    get sizeX(): number;
    /**
     * the length from min y to max y of this AABB.
     */
    get sizeY(): number;
    /**
     * the length from min z to max z of this AABB.
     */
    get sizeZ(): number;
    /**
     * multiply this AABB with a given matrix.
     * @param matrix a matrix to convert aabb.
     * @param aabb given AABB to convert.
     * @param outAabb converted AABB by given matrix.
     * @returns converted AABB.
     */
    static multiplyMatrixTo(matrix: Matrix44, aabb: AABB, outAabb: AABB): AABB;
    /**
     * toString method.
     */
    toString(): string;
    /**
     * toString method (the numbers are Approximate)
     */
    toStringApproximately(): string;
}

/**
 * The Component that represents a light.
 *
 * @remarks
 * the light looks towards the local -Z axis in right hand coordinate system.
 */
declare class LightComponent extends Component {
    type: EnumIO;
    private __color;
    private __intensity;
    private readonly __initialDirection;
    private __direction;
    innerConeAngle: number;
    outerConeAngle: number;
    range: number;
    enable: boolean;
    shadowAreaSizeForDirectionalLight: number;
    castShadow: boolean;
    private static __globalDataRepository;
    private static __tmp_vec4;
    private static __lightPositions;
    private static __lightDirections;
    private static __lightIntensities;
    private static __lightProperties;
    private static __lightNumber;
    private __lightGizmo?;
    private __updateCount;
    private __lastUpdateCount;
    private __lastTransformUpdateCount;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    get updateCount(): number;
    get direction(): Vector3;
    set intensity(value: number);
    get intensity(): number;
    set color(value: Vector3);
    get color(): Vector3;
    get _up(): Vector3;
    set isLightGizmoVisible(flg: boolean);
    get isLightGizmoVisible(): boolean;
    $load(): void;
    private __updateGizmo;
    static common_$logic(): void;
    $logic(): void;
    _destroy(): void;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): ILightEntity;
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}

declare class CubeTexture extends AbstractTexture implements Disposable {
    mipmapLevelNumber: number;
    hdriFormat: EnumIO;
    private static managedRegistry;
    constructor();
    private __setTextureResourceUid;
    loadTextureImages({ baseUrl, mipmapLevelNumber, isNamePosNeg, hdriFormat, }: {
        baseUrl: string;
        mipmapLevelNumber: number;
        isNamePosNeg: boolean;
        hdriFormat: HdriFormatEnum;
    }): Promise<void>;
    loadTextureImagesFromBasis(uint8Array: Uint8Array, { magFilter, minFilter, wrapS, wrapT, }?: {
        magFilter?: TextureParameterEnum | undefined;
        minFilter?: TextureParameterEnum | undefined;
        wrapS?: TextureParameterEnum | undefined;
        wrapT?: TextureParameterEnum | undefined;
    }): void;
    load1x1Texture(rgbaStr?: string): void;
    /**
     * Generate cubemap texture object from typed array of cubemap images
     * @param typedArrays Array of typed array object for cubemap textures. The nth element is the nth mipmap reduction level(level 0 is the base image level).
     * @param width Texture width of the base image level texture
     * @param height Texture height of the base image level texture
     */
    generateTextureFromTypedArrays(typedArrayImages: Array<{
        posX: TypedArray;
        negX: TypedArray;
        posY: TypedArray;
        negY: TypedArray;
        posZ: TypedArray;
        negZ: TypedArray;
    }>, baseLevelWidth: Size, baseLevelHeight: Size): void;
    importWebGLTextureDirectly(webGLTexture: WebGLTexture, width?: number, height?: number): void;
    private static __deleteInternalTexture;
    destroy3DAPIResources(): void;
    [Symbol.dispose](): void;
    destroy(): void;
    static loadFromUrl({ baseUrl, mipmapLevelNumber, isNamePosNeg, hdriFormat, }: {
        baseUrl: string;
        mipmapLevelNumber: number;
        isNamePosNeg: boolean;
        hdriFormat: HdriFormatEnum;
    }): Promise<CubeTexture>;
}

type WebGLExtensionEnum = EnumIO;
declare const WebGLExtension: Readonly<{
    VertexArrayObject: EnumIO;
    TextureFloat: EnumIO;
    TextureHalfFloat: EnumIO;
    TextureFloatLinear: EnumIO;
    TextureHalfFloatLinear: EnumIO;
    InstancedArrays: EnumIO;
    TextureFilterAnisotropic: EnumIO;
    ElementIndexUint: EnumIO;
    ShaderTextureLod: EnumIO;
    ShaderDerivatives: EnumIO;
    DrawBuffers: EnumIO;
    BlendMinmax: EnumIO;
    ColorBufferFloatWebGL1: EnumIO;
    CompressedTextureAstc: EnumIO;
    CompressedTextureS3tc: EnumIO;
    CompressedTexturePvrtc: EnumIO;
    CompressedTextureAtc: EnumIO;
    CompressedTextureEtc: EnumIO;
    CompressedTextureEtc1: EnumIO;
    CompressedTextureBptc: EnumIO;
    ColorBufferFloatWebGL2: EnumIO;
    ColorBufferHalfFloatWebGL2: EnumIO;
    OculusMultiview: EnumIO;
    OvrMultiview2: EnumIO;
    GMAN_WEBGL_MEMORY: EnumIO;
    ClipControl: EnumIO;
}>;

interface WEBGL_compressed_texture_etc {
    readonly COMPRESSED_RGBA8_ETC2_EAC: number;
}
interface WEBGL_compressed_texture_bptc {
    readonly COMPRESSED_RGBA_BPTC_UNORM_EXT: number;
}
interface WEBGL_multiview {
    framebufferTextureMultiviewOVR(target: number, attachment: number, texture: WebGLTexture, level: number, baseViewIndex: number, numViews: number): void;
    framebufferTextureMultisampleMultiviewOVR(target: number, attachment: number, texture: WebGLTexture, level: number, samples: number, baseViewIndex: number, numViews: number): void;
    is_multisample: boolean;
}
declare class WebGLContextWrapper {
    #private;
    __gl: WebGL2RenderingContext;
    __webglVersion: number;
    width: Size;
    height: Size;
    readonly canvas: HTMLCanvasElement;
    readonly webgl1ExtVAO?: OES_vertex_array_object;
    readonly webgl1ExtIA?: ANGLE_instanced_arrays;
    readonly webgl1ExtTF?: OES_texture_float;
    readonly webgl1ExtTHF?: OES_texture_half_float;
    readonly webgl1ExtTFL?: OES_texture_float_linear;
    readonly webgl1ExtTHFL?: OES_texture_half_float_linear;
    readonly webgl1ExtTFA?: EXT_texture_filter_anisotropic;
    readonly webgl1ExtEIUI?: OES_element_index_uint;
    readonly webgl1ExtSTL?: EXT_shader_texture_lod;
    readonly webgl1ExtDRV?: OES_standard_derivatives;
    readonly webgl1ExtDB?: WEBGL_draw_buffers;
    readonly webgl1ExtBM?: EXT_blend_minmax;
    readonly webgl1ExtCBF?: WEBGL_color_buffer_float;
    readonly webgl1ExtCTAstc?: WEBGL_compressed_texture_astc;
    readonly webgl1ExtCTS3tc?: WEBGL_compressed_texture_s3tc;
    readonly webgl1ExtCTPvrtc?: WEBKIT_WEBGL_compressed_texture_pvrtc;
    readonly webgl1ExtCTAtc?: WEBGL_compressed_texture_atc;
    readonly webgl1ExtCTEtc?: WEBGL_compressed_texture_etc;
    readonly webgl1ExtCTEtc1?: WEBGL_compressed_texture_etc1;
    readonly webgl1ExtCTBptc?: WEBGL_compressed_texture_bptc;
    readonly webgl2ExtTFL?: OES_texture_float_linear;
    readonly webgl2ExtTHFL?: OES_texture_half_float_linear;
    readonly webgl2ExtTFA?: EXT_texture_filter_anisotropic;
    readonly webgl2ExtCBF?: EXT_color_buffer_float;
    readonly webgl2ExtCBHF?: EXT_color_buffer_half_float;
    readonly webgl2ExtCTAstc?: WEBGL_compressed_texture_astc;
    readonly webgl2ExtCTS3tc?: WEBGL_compressed_texture_s3tc;
    readonly webgl2ExtCTPvrtc?: WEBKIT_WEBGL_compressed_texture_pvrtc;
    readonly webgl2ExtCTAtc?: WEBGL_compressed_texture_atc;
    readonly webgl2ExtCTEtc?: WEBGL_compressed_texture_etc;
    readonly webgl2ExtCTEtc1?: WEBGL_compressed_texture_etc1;
    readonly webgl2ExtCTBptc?: WEBGL_compressed_texture_bptc;
    readonly webgl2ExtMLTVIEW?: WEBGL_multiview;
    readonly webgl2ExtClipCtrl?: any;
    readonly webgl2ExtGmanWM?: any;
    private __activeTextureBackup;
    private __activeTextures2D;
    private __activeTextures2DArray;
    private __activeTexturesCube;
    private __boundTextures;
    private __boundSamplers;
    private __viewport_left;
    private __viewport_top;
    private __viewport_width;
    private __viewport_height;
    private __default_viewport_left;
    private __default_viewport_top;
    private __default_viewport_width;
    private __default_viewport_height;
    private __maxVertexUniformVectors;
    private __maxFragmentUniformVectors;
    private readonly __is_multiview;
    _isWebXRMode: boolean;
    __extensions: Map<WebGLExtensionEnum, WebGLObject>;
    constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement);
    getRawContext(): WebGLRenderingContext | WebGL2RenderingContext;
    getRawContextAsWebGL1(): WebGLRenderingContext;
    getRawContextAsWebGL2(): WebGL2RenderingContext;
    get viewport(): Vector4;
    get defaultViewport(): Vector4;
    isSupportWebGL1Extension(webGLExtension: WebGLExtensionEnum): boolean;
    isNotSupportWebGL1Extension(webGLExtension: WebGLExtensionEnum): boolean;
    getIsWebGL2(gl: WebGLRenderingContext | WebGL2RenderingContext): gl is WebGL2RenderingContext;
    get isWebGL2(): boolean;
    createVertexArray(): WebGLVertexArrayObject | null;
    deleteVertexArray(vertexArray: WebGLVertexArrayObject | WebGLVertexArrayObjectOES): void;
    bindVertexArray(vao: WebGLVertexArrayObjectOES | null): void;
    vertexAttribDivisor(index: number, divisor: number): void;
    drawElementsInstanced(primitiveMode: number, indexCount: number, type: number, offset: number, instanceCount: number): void;
    drawArraysInstanced(primitiveMode: number, first: number, count: number, instanceCount: number): void;
    colorAttachment(index: Index): number;
    drawBuffers(buffers: RenderBufferTargetEnum[]): void;
    private __activeTexture;
    bindTexture2D(activeTextureIndex: Index, texture: WebGLTexture): void;
    bindTexture2DArray(activeTextureIndex: Index, texture: WebGLTexture): void;
    bindTextureSampler(activeTextureIndex: Index, sampler: WebGLSampler): void;
    bindTextureCube(activeTextureIndex: Index, texture: WebGLTexture): void;
    unbindTexture2D(activeTextureIndex: Index): void;
    unbindTexture2DArray(activeTextureIndex: Index): void;
    unbindTextureCube(activeTextureIndex: Index): void;
    unbindTextures(): void;
    private __getExtension;
    private __getCompressedTextureExtension;
    setViewport(left: number, top: number, width: number, height: number): void;
    setViewportAsVector4(viewport: Vector4): void;
    private __getUniformBufferInfo;
    private __getMaxUniformVectors;
    getMaxConventionUniformBlocks(): number;
    getAlignedMaxUniformBlockSize(): number;
    getMaxVertexUniformVectors(): number;
    getMaxFragmentUniformVectors(): number;
    getWebGLMemoryInfo(): any;
    isMultiview(): boolean;
}

type RenderingArgWebGL = {
    glw: WebGLContextWrapper;
    entity: IMeshEntity;
    primitive: Primitive;
    worldMatrix: Matrix44;
    normalMatrix: IMatrix33;
    isBillboard: boolean;
    lightComponents: LightComponent[];
    renderPass: RenderPass;
    diffuseCube?: CubeTexture | RenderTargetTextureCube;
    specularCube?: CubeTexture | RenderTargetTextureCube;
    sheenCube?: CubeTexture | RenderTargetTextureCube;
    isVr: boolean;
    displayIdx: Index;
    setUniform: boolean;
};
type RenderingArgWebGpu = {
    cameraComponentSid: Index;
    entity: IMeshEntity;
    specularCube?: CubeTexture | RenderTargetTextureCube;
};
type AttributeNames = Array<string>;

declare class WebGpuDeviceWrapper {
    private __canvas;
    private __gpuAdapter;
    private __gpuDevice;
    private __context;
    constructor(canvas: HTMLCanvasElement, gpuAdapter: GPUAdapter, gpuDevice: GPUDevice);
    get canvas(): HTMLCanvasElement;
    get gpuAdapter(): GPUAdapter;
    get gpuDevice(): GPUDevice;
    get context(): GPUCanvasContext;
}

declare class RenderTargetTextureCube extends AbstractTexture implements IRenderable {
    private __fbo?;
    hdriFormat: EnumIO;
    _textureViewAsRenderTargetResourceUid: number;
    constructor();
    create({ width, height, mipLevelCount, format: internalFormat, }: {
        width: number;
        height: number;
        mipLevelCount?: number;
        format: TextureFormatEnum;
    }): void;
    private __createRenderTargetTexture;
    generateMipmaps(): void;
    resize(width: Size, height: Size): void;
    destroy3DAPIResources(): boolean;
    createCubeTextureViewAsRenderTarget(faceIdx: Index, mipLevel: Index): void;
    set _fbo(fbo: FrameBuffer);
    get fbo(): FrameBuffer | undefined;
    get mipmapLevelNumber(): number;
    setIsTextureReady(): void;
}

type WebGpuResource = GPUTexture | GPUBuffer | GPUSampler | GPUTextureView | GPUBufferBinding | GPURenderPipeline | GPUComputePipeline | GPUBindGroupLayout | GPUBindGroup | GPUShaderModule | GPUCommandEncoder | GPUComputePassEncoder | GPURenderPassEncoder | GPUComputePipeline | GPURenderPipeline | GPUQuerySet | object;
type DRAW_PARAMETERS_IDENTIFIER = string;
declare class WebGpuResourceRepository extends CGAPIResourceRepository implements ICGAPIResourceRepository {
    private static __instance;
    private __webGpuResources;
    private __resourceCounter;
    private __webGpuDeviceWrapper?;
    private __storageBuffer?;
    private __storageBlendShapeBuffer?;
    private __bindGroupStorageBuffer?;
    private __bindGroupLayoutStorageBuffer?;
    private __webGpuRenderPipelineMap;
    private __materialStateVersionMap;
    private __bindGroupTextureMap;
    private __bindGroupLayoutTextureMap;
    private __bindGroupSamplerMap;
    private __bindGroupLayoutSamplerMap;
    private __bindGroupsUniformDrawParameters;
    private __bindGroupLayoutUniformDrawParameters?;
    private __uniformDrawParametersBuffers;
    private __commandEncoder?;
    private __renderBundles;
    private __renderBundleEncoder?;
    private __systemDepthTexture?;
    private __systemDepthTextureView?;
    private __uniformMorphOffsetsBuffer?;
    private __uniformMorphWeightsBuffer?;
    private __renderPassEncoder?;
    private __generateMipmapsShaderModule?;
    private __generateMipmapsPipeline?;
    private __generateMipmapsFormat?;
    private __generateMipmapsSampler?;
    private __generateMipmapsBindGroupLayout?;
    private __contextCurrentTextureView?;
    private __lastMaterialsUpdateCount;
    private __lastCurrentCameraComponentSid;
    private __lastEntityRepositoryUpdateCount;
    private __lastPrimitivesMaterialVariantUpdateCount;
    private __lastMeshRendererComponentsUpdateCount;
    private __srcTextureViewsForGeneratingMipmaps;
    private __dstTextureViewsForGeneratingMipmaps;
    private __bindGroupsForGeneratingMipmaps;
    private static __drawParametersUint32Array;
    private constructor();
    clearCache(): void;
    addWebGpuDeviceWrapper(webGpuDeviceWrapper: WebGpuDeviceWrapper): void;
    getWebGpuDeviceWrapper(): WebGpuDeviceWrapper;
    static getInstance(): WebGpuResourceRepository;
    private getResourceNumber;
    private __registerResource;
    getCanvasSize(): [Size, Size];
    /**
     * create a WebGPU Texture
     * @param imageData - an ImageBitmapData
     * @param paramObject - a parameter object
     * @returns
     */
    createTextureFromImageBitmapData(imageData: ImageBitmapData, { level, internalFormat, width, height, border, format, type, generateMipmap, }: {
        level: Index;
        internalFormat: TextureParameterEnum;
        width: Size;
        height: Size;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): Promise<WebGPUResourceHandle>;
    createTextureFromDataUri(dataUri: string, { level, internalFormat, border, format, type, generateMipmap, }: {
        level: Index;
        internalFormat: TextureParameterEnum;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): Promise<WebGPUResourceHandle>;
    generateMipmaps2d(textureHandle: WebGPUResourceHandle, width: number, height: number): void;
    generateMipmapsCube(textureHandle: WebGPUResourceHandle, width: number, height: number): void;
    getTexturePixelData(textureHandle: WebGPUResourceHandle, width: number, height: number, frameBufferUid: WebGPUResourceHandle, colorAttachmentIndex: number): Promise<Uint8Array>;
    /**
     * create a WebGPU Texture Mipmaps (including CubeMap support)
     *
     * @remarks
     * Adapted from: https://toji.dev/webgpu-best-practices/img-textures#generating-mipmaps
     * @param texture - a texture
     * @param textureDescriptor - a texture descriptor
     */
    generateMipmaps(texture: GPUTexture, textureDescriptor: GPUTextureDescriptor): void;
    createTextureSampler({ magFilter, minFilter, wrapS, wrapT, wrapR, anisotropy, isPremultipliedAlpha, shadowCompareMode, }: {
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        wrapR: TextureParameterEnum;
        anisotropy: boolean;
        isPremultipliedAlpha?: boolean;
        shadowCompareMode: boolean;
    }): WebGPUResourceHandle;
    /**
     * create a WebGPU Vertex Buffer
     * @param accessor - an accessor
     * @returns
     */
    createVertexBuffer(accessor: Accessor): WebGPUResourceHandle;
    /**
     * create a WebGPU Vertex Buffer
     * @param typedArray - a typed array
     * @returns a WebGPUResourceHandle
     */
    createVertexBufferFromTypedArray(typedArray: TypedArray): WebGPUResourceHandle;
    /**
     * create a WebGPU Index Buffer
     * @param accessor - an accessor
     * @returns a WebGPUResourceHandle
     */
    createIndexBuffer(accessor: Accessor): WebGPUResourceHandle;
    updateVertexBuffer(accessor: Accessor, resourceHandle: WebGPUResourceHandle): void;
    updateIndexBuffer(accessor: Accessor, resourceHandle: WebGPUResourceHandle): void;
    deleteVertexBuffer(resourceHandle: WebGPUResourceHandle): void;
    /**
     * create a VertexBuffer and IndexBuffer
     * @param primitive
     * @returns
     */
    createVertexBufferAndIndexBuffer(primitive: Primitive): VertexHandles;
    /**
     * update the VertexBuffer and IndexBuffer
     * @param primitive
     * @param vertexHandles
     */
    updateVertexBufferAndIndexBuffer(primitive: Primitive, vertexHandles: VertexHandles): void;
    deleteVertexDataResources(vertexHandles: VertexHandles): void;
    /**
     * set the VertexData to the Pipeline
     */
    setVertexDataToPipeline({ vaoHandle, iboHandle, vboHandles, }: {
        vaoHandle: WebGPUResourceHandle;
        iboHandle?: WebGPUResourceHandle;
        vboHandles: Array<WebGPUResourceHandle>;
    }, primitive: Primitive, instanceIDBufferUid?: WebGPUResourceHandle): void;
    private __checkShaderCompileStatus;
    /**
     * create a shader program
     * @param param0
     * @returns
     */
    createShaderProgram({ material, primitive, vertexShaderStr, fragmentShaderStr, attributeNames, attributeSemantics, onError, }: {
        material: Material;
        primitive: Primitive;
        vertexShaderStr: string;
        fragmentShaderStr: string;
        attributeNames: AttributeNames;
        attributeSemantics: VertexAttributeEnum[];
        onError?: (message: string) => void;
    }): number;
    clearFrameBuffer(renderPass: RenderPass): void;
    draw(primitive: Primitive, material: Material, renderPass: RenderPass, cameraId: number, zWrite: boolean): void;
    private createRenderBundleEncoder;
    private createRenderPassEncoder;
    private __toClearRenderBundles;
    executeRenderBundle(renderPass: RenderPass): boolean;
    finishRenderBundleEncoder(renderPass: RenderPass): void;
    getOrCreateRenderPipeline(renderPipelineId: string, bindGroupId: string, primitive: Primitive, material: Material, renderPass: RenderPass, zWrite: boolean, diffuseCubeMap?: CubeTexture | RenderTargetTextureCube, specularCubeMap?: CubeTexture | RenderTargetTextureCube, sheenCubeMap?: CubeTexture | RenderTargetTextureCube): [GPURenderPipeline, boolean];
    flush(): void;
    setColorWriteMask(material: Material): GPUColorWriteFlags;
    /**
     * Create Cube Texture from image files.
     * @param baseUri the base uri to load images;
     * @param mipLevelCount the number of mip levels (include root level). if no mipmap, the value should be 1;
     * @returns the WebGLResourceHandle for the generated Cube Texture
     */
    createCubeTextureFromFiles(baseUri: string, mipLevelCount: Count, isNamePosNeg: boolean, hdriFormat: HdriFormatEnum): Promise<[number, Sampler]>;
    /**
     * create a CubeTexture
     *
     * @param mipLevelCount
     * @param images
     * @param width
     * @param height
     * @returns resource handle
     */
    createCubeTexture(mipLevelCount: Count, images: Array<{
        posX: DirectTextureData;
        negX: DirectTextureData;
        posY: DirectTextureData;
        negY: DirectTextureData;
        posZ: DirectTextureData;
        negZ: DirectTextureData;
    }>, width: Size, height: Size): [number, Sampler];
    /**
     * create a TextureArray
     * @param width
     * @param height
     * @param arrayLength
     * @param mipLevelCount
     * @param internalFormat
     * @param format
     * @param type
     * @returns texture handle
     */
    createTextureArray(width: Size, height: Size, arrayLength: Size, mipLevelCount: Size, internalFormat: TextureFormatEnum, format: PixelFormatEnum, type: ComponentTypeEnum, imageData: TypedArray): WebGPUResourceHandle;
    createStorageBuffer(inputArray: Float32Array): number;
    updateStorageBuffer(storageBufferHandle: WebGPUResourceHandle, inputArray: Float32Array, updateComponentSize: Count): void;
    updateStorageBufferPartially(storageBufferHandle: WebGPUResourceHandle, inputArray: Float32Array, offsetOfStorageBufferInByte: Count, offsetOfInputArrayInElement: Count, updateComponentSize: Count): void;
    createStorageBlendShapeBuffer(inputArray: Float32Array): number;
    updateStorageBlendShapeBuffer(storageBufferHandle: WebGPUResourceHandle, inputArray: Float32Array, updateComponentSize: Count): void;
    createBindGroupLayoutForDrawParameters(): void;
    updateUniformBufferForDrawParameters(identifier: DRAW_PARAMETERS_IDENTIFIER, materialSid: Index, cameraSID: Index, currentPrimitiveIdx: Index, morphTargetNumber: Count): void;
    createUniformMorphOffsetsBuffer(): number;
    updateUniformMorphOffsetsBuffer(inputArray: Uint32Array, elementNum: Count): void;
    createUniformMorphWeightsBuffer(): number;
    updateUniformMorphWeightsBuffer(inputArray: Float32Array, elementNum: Count): void;
    private __createBindGroup;
    /**
     * create a Texture
     * @param imageData
     * @param param1
     * @returns
     */
    createTextureFromHTMLImageElement(imageData: HTMLImageElement, { level, internalFormat, width, height, border, format, type, generateMipmap, }: {
        level: Index;
        internalFormat: TextureParameterEnum;
        width: Size;
        height: Size;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): Promise<WebGPUResourceHandle>;
    /**
     * create CompressedTextureFromBasis
     * @param basisFile
     * @param param1
     * @returns
     */
    createCompressedTextureFromBasis(basisFile: BasisFile, { border, format, type, }: {
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
    }): WebGPUResourceHandle;
    /**
     * decode the BasisImage
     * @param basisFile
     * @param basisCompressionType
     * @param imageIndex
     * @param levelIndex
     * @returns
     */
    private decodeBasisImage;
    /**
     * Create and bind compressed texture object
     * @param textureDataArray transcoded texture data for each mipmaps(levels)
     * @param compressionTextureType
     */
    createCompressedTexture(textureDataArray: TextureData[], compressionTextureType: CompressionTextureTypeEnum): Promise<WebGPUResourceHandle>;
    /**
     * allocate a Texture
     * @param format - the format of the texture
     * @param width - the width of the texture
     * @param height - the height of the texture
     * @param mipmapCount - the number of mipmap levels
     * @returns the handle of the texture
     */
    allocateTexture({ format, width, height, mipLevelCount, }: {
        format: TextureFormatEnum;
        width: Size;
        height: Size;
        mipLevelCount: Count;
    }): WebGPUResourceHandle;
    /**
     * Load an image to a specific mip level of a texture
     * @param mipLevel - the mip level to load the image to
     * @param textureUid - the handle of the texture
     * @param format - the format of the image
     * @param type - the type of the data
     * @param xOffset - the x offset of copy region
     * @param yOffset - the y offset of copy region
     * @param width - the width of the image
     * @param height - the height of the image
     * @param data - the typedarray data of the image
     */
    loadImageToMipLevelOfTexture2D({ mipLevel, textureUid, format, type, xOffset, yOffset, width, height, rowSizeByPixel, data, }: {
        mipLevel: Index;
        textureUid: WebGLResourceHandle;
        format: TextureFormatEnum;
        type: ComponentTypeEnum;
        xOffset: number;
        yOffset: number;
        width: number;
        height: number;
        rowSizeByPixel: number;
        data: TypedArray;
    }): Promise<void>;
    private __createTextureInner;
    /**
     * create a RenderTargetTexture
     * @param param0
     * @returns
     */
    createRenderTargetTexture({ width, height, mipLevelCount, format, }: {
        width: Size;
        height: Size;
        mipLevelCount: Count;
        format: TextureParameterEnum;
    }): WebGPUResourceHandle;
    /**
     * create a RenderTargetTextureArray
     * @param param0
     * @returns
     */
    createRenderTargetTextureArray({ width, height, level, internalFormat, format, type, arrayLength, }: {
        width: Size;
        height: Size;
        level: Index;
        internalFormat: TextureParameterEnum;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        arrayLength: Count;
    }): WebGPUResourceHandle;
    /**
     * create a RenderTargetTextureCube
     * @param param0
     * @returns
     */
    createRenderTargetTextureCube({ width, height, mipLevelCount, format, }: {
        width: Size;
        height: Size;
        mipLevelCount: Count;
        format: TextureParameterEnum;
    }): WebGPUResourceHandle;
    /**
     * create Renderbuffer
     */
    createRenderBuffer(width: Size, height: Size, internalFormat: TextureParameterEnum, isMSAA: boolean, sampleCountMSAA: Count): WebGPUResourceHandle;
    /**
     * delete a RenderBuffer
     * @param renderBufferUid
     */
    deleteRenderBuffer(renderBufferUid: WebGPUResourceHandle): void;
    /**
     * copy Texture Data
     * @param fromTexture
     * @param toTexture
     */
    copyTextureData(fromTexture: WebGPUResourceHandle, toTexture: WebGPUResourceHandle): void;
    isMippmappedTexture(textureHandle: WebGPUResourceHandle): boolean;
    duplicateTextureAsMipmapped(fromTexture: WebGPUResourceHandle): [WebGPUResourceHandle, WebGPUResourceHandle];
    /**
     * attach the DepthBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a DepthBuffer
     */
    attachDepthBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    /**
     * attach the StencilBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a StencilBuffer
     */
    attachStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    /**
     * attach the depthStencilBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a depthStencilBuffer
     */
    attachDepthStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    /**
     * create a FrameBufferObject
     * @returns
     */
    createFrameBufferObject(): number;
    /**
     * delete a FrameBufferObject
     * @param frameBufferObjectHandle
     */
    deleteFrameBufferObject(frameBufferObjectHandle: WebGPUResourceHandle): void;
    /**
     * attach the ColorBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param attachmentIndex a attachment index
     * @param renderable a ColorBuffer
     */
    attachColorBufferToFrameBufferObject(framebuffer: FrameBuffer, attachmentIndex: Index, renderable: IRenderable): void;
    /**
     * attach the ColorBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param attachmentIndex a attachment index
     * @param renderable a ColorBuffer
     * @param layerIndex a layer index
     * @param mipLevel a mip level
     */
    attachColorBufferLayerToFrameBufferObject(framebuffer: FrameBuffer, attachmentIndex: Index, renderable: IRenderable, layerIndex: Index, mipLevel: Index): void;
    /**
     * attach the ColorBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param attachmentIndex a attachment index
     * @param faceIndex a face index
     * @param mipLevel a mip level
     * @param renderable a ColorBuffer
     */
    attachColorBufferCubeToFrameBufferObject(framebuffer: FrameBuffer, attachmentIndex: Index, faceIndex: Index, mipLevel: Index, renderable: IRenderable): void;
    createTextureView2d(textureHandle: WebGPUResourceHandle): WebGPUResourceHandle;
    createTextureViewAsRenderTarget(textureHandle: WebGPUResourceHandle): WebGPUResourceHandle;
    createTextureViewCube(textureHandle: WebGPUResourceHandle): WebGPUResourceHandle;
    createTextureView2dArray(textureHandle: WebGPUResourceHandle, arrayLayerCount: Count): WebGPUResourceHandle;
    createTextureView2dArrayAsRenderTarget(textureHandle: WebGPUResourceHandle, arrayIdx: Index, mipLevel: Index): WebGPUResourceHandle;
    createCubeTextureViewAsRenderTarget(textureHandle: WebGPUResourceHandle, faceIdx: Index, mipLevel: Index): WebGPUResourceHandle;
    deleteTexture(textureHandle: WebGLResourceHandle): void;
    recreateSystemDepthTexture(): void;
    resizeCanvas(width: Size, height: Size): void;
    setViewport(viewport?: Vector4): void;
    isSupportMultiViewVRRendering(): boolean;
}

type DirectTextureData = TypedArray | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap;
type ImageBitmapData = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap;
declare abstract class CGAPIResourceRepository {
    static readonly InvalidCGAPIResourceUid = -1;
    static getCgApiResourceRepository(): ICGAPIResourceRepository;
    static getWebGLResourceRepository(): WebGLResourceRepository;
    static getWebGpuResourceRepository(): WebGpuResourceRepository;
}
interface ICGAPIResourceRepository {
    /**
     * Get a Canvas Size
     */
    getCanvasSize(): [Size, Size];
    resizeCanvas(width: Size, height: Size): void;
    clearFrameBuffer(renderPass: RenderPass): void;
    /**
     * create a Texture
     * @param imageData
     * @param param1
     * @returns
     */
    createTextureFromImageBitmapData(imageData: ImageBitmapData, { level, internalFormat, width, height, border, format, type, generateMipmap, }: {
        level: Index;
        internalFormat: TextureParameterEnum;
        width: Size;
        height: Size;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): Promise<CGAPIResourceHandle>;
    /**
     * create CompressedTextureFromBasis
     * @param basisFile
     * @param param1
     * @returns
     */
    createCompressedTextureFromBasis(basisFile: BasisFile, { border, format, type, }: {
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
    }): CGAPIResourceHandle;
    /**
     * Create and bind compressed texture object
     * @param textureDataArray transcoded texture data for each mipmaps(levels)
     * @param compressionTextureType
     */
    createCompressedTexture(textureDataArray: TextureData[], compressionTextureType: CompressionTextureTypeEnum): Promise<CGAPIResourceHandle>;
    /**
     * create a Vertex Buffer
     * @param accessor
     * @returns a CGAPIResourceHandle
     */
    createVertexBuffer(accessor: Accessor): CGAPIResourceHandle;
    /**
     * create a Vertex Buffer
     * @param typedArray - a typed array
     * @returns a CGAPIResourceHandle
     */
    createVertexBufferFromTypedArray(typedArray: TypedArray): CGAPIResourceHandle;
    /**
     * create a Index Buffer
     * @param accessor - an accessor
     * @returns a CGAPIResourceHandle
     */
    createIndexBuffer(accessor: Accessor): CGAPIResourceHandle;
    /**
     * create a Vertex Buffer and Index Buffer
     * @param primitive
     */
    createVertexBufferAndIndexBuffer(primitive: Primitive): VertexHandles;
    /**
     * update a Vertex Buffer
     */
    updateVertexBuffer(accessor: Accessor, resourceHandle: CGAPIResourceHandle): void;
    /**
     * update a Index Buffer
     */
    updateIndexBuffer(accessor: Accessor, resourceHandle: CGAPIResourceHandle): void;
    /**
     * update the VertexBuffer and IndexBuffer
     * @param primitive
     * @param vertexHandles
     */
    updateVertexBufferAndIndexBuffer(primitive: Primitive, vertexHandles: VertexHandles): void;
    /**
     * delete the Vertex Data resources
     * @param vertexHandles
     */
    deleteVertexDataResources(vertexHandles: VertexHandles): void;
    /**
     * delete a Vertex Buffer
     * @param resourceHandle - a CGAPIResourceHandle
     */
    deleteVertexBuffer(resourceHandle: CGAPIResourceHandle): void;
    /**
     * set the VertexData to the Pipeline
     */
    setVertexDataToPipeline({ vaoHandle, iboHandle, vboHandles, }: {
        vaoHandle: CGAPIResourceHandle;
        iboHandle?: CGAPIResourceHandle;
        vboHandles: Array<CGAPIResourceHandle>;
    }, primitive: Primitive, instanceIDBufferUid: CGAPIResourceHandle): void;
    /**
     * Create a shader program
     * @return a shader program handle
     */
    createShaderProgram({ material, primitive, vertexShaderStr, fragmentShaderStr, attributeNames, attributeSemantics, onError, }: {
        material: Material;
        primitive: Primitive;
        vertexShaderStr: string;
        fragmentShaderStr: string;
        attributeNames: AttributeNames;
        attributeSemantics: VertexAttributeEnum[];
        onError?: (message: string) => void;
    }): CGAPIResourceHandle;
    createCubeTextureFromFiles(baseUri: string, mipLevelCount: Count, isNamePosNeg: boolean, hdriFormat: HdriFormatEnum): Promise<[number, Sampler]>;
    /**
     * allocate a Texture
     * @param format - the format of the texture
     * @param width - the width of the texture
     * @param height - the height of the texture
     * @param mipmapCount - the number of mipmap levels
     * @returns the handle of the texture
     */
    allocateTexture({ format, width, height, mipLevelCount, }: {
        format: TextureFormatEnum;
        width: Size;
        height: Size;
        mipLevelCount: Count;
    }): CGAPIResourceHandle;
    /**
     * Load an image to a specific mip level of a texture
     * @param mipLevel - the mip level to load the image to
     * @param textureUid - the handle of the texture
     * @param format - the format of the image
     * @param type - the type of the data
     * @param xOffset - the x offset of copy region
     * @param yOffset - the y offset of copy region
     * @param width - the width of the image
     * @param height - the height of the image
     * @param data - the typedarray data of the image
     */
    loadImageToMipLevelOfTexture2D({ mipLevel, textureUid, format, type, xOffset, yOffset, width, height, rowSizeByPixel, data, }: {
        mipLevel: Index;
        textureUid: CGAPIResourceHandle;
        format: TextureFormatEnum;
        type: ComponentTypeEnum;
        xOffset: number;
        yOffset: number;
        width: number;
        height: number;
        rowSizeByPixel: number;
        data: TypedArray;
    }): void;
    /**
     * create a Cube Texture
     */
    createCubeTexture(mipLevelCount: Count, images: Array<{
        posX: DirectTextureData;
        negX: DirectTextureData;
        posY: DirectTextureData;
        negY: DirectTextureData;
        posZ: DirectTextureData;
        negZ: DirectTextureData;
    }>, width: Size, height: Size): [number, Sampler];
    createTextureSampler({ magFilter, minFilter, wrapS, wrapT, wrapR, anisotropy, isPremultipliedAlpha, shadowCompareMode, }: {
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        wrapR: TextureParameterEnum;
        anisotropy: boolean;
        isPremultipliedAlpha?: boolean;
        shadowCompareMode: boolean;
    }): CGAPIResourceHandle;
    /**
     * create a Texture
     * @param imageData
     * @param param1
     * @returns
     */
    createTextureFromHTMLImageElement(imageData: HTMLImageElement, { level, internalFormat, width, height, border, format, type, generateMipmap, }: {
        level: Index;
        internalFormat: TextureParameterEnum;
        width: Size;
        height: Size;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): Promise<CGAPIResourceHandle>;
    createTextureFromDataUri(dataUri: string, { level, internalFormat, border, format, type, generateMipmap, }: {
        level: Index;
        internalFormat: TextureParameterEnum;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): Promise<CGAPIResourceHandle>;
    /**
     * create a RenderTargetTexture
     * @param param0
     * @returns
     */
    createRenderTargetTexture({ width, height, mipLevelCount, format, }: {
        width: Size;
        height: Size;
        mipLevelCount: Count;
        format: TextureParameterEnum;
    }): CGAPIResourceHandle;
    /**
     * create a RenderTargetTextureArray
     * @param param0
     * @returns
     */
    createRenderTargetTextureArray({ width, height, level, internalFormat, format, type, arrayLength, }: {
        width: Size;
        height: Size;
        level: Index;
        internalFormat: TextureParameterEnum;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        arrayLength: Count;
    }): CGAPIResourceHandle;
    /**
     * create a RenderTargetTextureCube
     * @param param0
     * @returns
     */
    createRenderTargetTextureCube({ width, height, mipLevelCount, format, }: {
        width: Size;
        height: Size;
        mipLevelCount: Size;
        format: TextureParameterEnum;
    }): CGAPIResourceHandle;
    /**
     * create a TextureArray
     * @param width
     * @param height
     * @param arrayLength
     * @param mipLevelCount
     * @param internalFormat
     * @param format
     * @param type
     * @returns texture handle
     */
    createTextureArray(width: Size, height: Size, arrayLength: Size, mipLevelCount: Size, internalFormat: TextureFormatEnum, format: PixelFormatEnum, type: ComponentTypeEnum, imageData: TypedArray): CGAPIResourceHandle;
    /**
     * delete a Texture
     * @param textureHandle
     */
    deleteTexture(textureHandle: CGAPIResourceHandle): void;
    /**
     * generate Mipmaps
     */
    generateMipmaps2d(textureHandle: CGAPIResourceHandle, width: number, height: number): void;
    /**
     * generate Mipmaps
     */
    generateMipmapsCube(textureHandle: CGAPIResourceHandle, width: number, height: number): void;
    getTexturePixelData(textureHandle: CGAPIResourceHandle, width: number, height: number, frameBufferUid: CGAPIResourceHandle, colorAttachmentIndex: number): Promise<Uint8Array>;
    /**
     * create a FrameBufferObject
     * @returns
     */
    createFrameBufferObject(): CGAPIResourceHandle;
    /**
     * attach the ColorBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param attachmentIndex a attachment index
     * @param renderable a ColorBuffer
     */
    attachColorBufferToFrameBufferObject(framebuffer: FrameBuffer, attachmentIndex: Index, renderable: IRenderable): void;
    /**
     * attach the ColorBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param attachmentIndex a attachment index
     * @param renderable a ColorBuffer
     * @param layerIndex a layer index
     * @param mipLevel a mip level
     */
    attachColorBufferLayerToFrameBufferObject(framebuffer: FrameBuffer, attachmentIndex: Index, renderable: IRenderable, layerIndex: Index, mipLevel: Index): void;
    /**
     * attach the ColorBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param attachmentIndex a attachment index
     * @param faceIndex a face index
     * @param mipLevel a mip level
     * @param renderable a ColorBuffer
     */
    attachColorBufferCubeToFrameBufferObject(framebuffer: FrameBuffer, attachmentIndex: Index, faceIndex: Index, mipLevel: Index, renderable: IRenderable): void;
    /**
     * create a Renderbuffer
     */
    createRenderBuffer(width: Size, height: Size, internalFormat: TextureParameterEnum, isMSAA: boolean, sampleCountMSAA: Count): CGAPIResourceHandle;
    /**
     * delete a RenderBuffer
     * @param renderBufferUid
     */
    deleteRenderBuffer(renderBufferUid: CGAPIResourceHandle): void;
    /**
     * attach the DepthBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a DepthBuffer
     */
    attachDepthBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    /**
     * attach the StencilBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a StencilBuffer
     */
    attachStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    /**
     * attach the depthStencilBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a depthStencilBuffer
     */
    attachDepthStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    /**
     * delete a FrameBufferObject
     * @param frameBufferObjectHandle
     */
    deleteFrameBufferObject(frameBufferObjectHandle: CGAPIResourceHandle): void;
    isSupportMultiViewVRRendering(): boolean;
    setViewport(viewport?: Vector4): void;
}

interface RnWebGLProgram extends WebGLProgram {
    _gl: WebGLRenderingContext | WebGL2RenderingContext;
    _materialTypeName: string;
    _vertexShaderStr: string;
    _fragmentShaderStr: string;
    _shaderSemanticsInfoMap: Map<ShaderSemanticsName, ShaderSemanticsInfo>;
    __SPECTOR_rebuildProgram: unknown;
    _material: WeakRef<Material>;
    _primitive: WeakRef<Primitive>;
}
interface RnWebGLTexture extends WebGLTexture {
    _resourceUid: number;
}

type VertexHandles = {
    vaoHandle: CGAPIResourceHandle;
    iboHandle?: CGAPIResourceHandle;
    vboHandles: Array<CGAPIResourceHandle>;
    attributesFlags: Array<boolean>;
    setComplete: boolean;
};
type TextureData = {
    level: Count;
    width: Count;
    height: Count;
    buffer: ArrayBufferView;
};
type WebGLResource = WebGLBuffer | WebGLFramebuffer | WebGLObject | WebGLProgram | WebGLRenderbuffer | WebGLTexture | WebGLTransformFeedback;
declare class WebGLResourceRepository extends CGAPIResourceRepository implements ICGAPIResourceRepository {
    private static __instance;
    private __webglContexts;
    private __glw?;
    private __resourceCounter;
    private __webglResources;
    private __samplerClampToEdgeLinearUid;
    private __samplerClampToEdgeNearestUid;
    private __samplerRepeatNearestUid;
    private __samplerRepeatLinearUid;
    private __samplerShadowUid;
    private __samplerRepeatTriLinearUid;
    private __samplerRepeatAnisotropyLinearUid;
    private constructor();
    static getInstance(): WebGLResourceRepository;
    addWebGLContext(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, asCurrent: boolean): void;
    generateWebGLContext(canvas: HTMLCanvasElement, asCurrent: boolean, webglOption?: WebGLContextAttributes): WebGL2RenderingContext;
    get currentWebGLContextWrapper(): WebGLContextWrapper | undefined;
    private getResourceNumber;
    private __registerResource;
    getWebGLResource(WebGLResourceHandle: WebGLResourceHandle): WebGLResource | null;
    createIndexBuffer(accessor: Accessor): number;
    updateIndexBuffer(accessor: Accessor, resourceHandle: number): void;
    createVertexBuffer(accessor: Accessor): number;
    createVertexBufferFromTypedArray(typedArray: TypedArray): number;
    updateVertexBuffer(accessor: Accessor, resourceHandle: number): void;
    createVertexArray(): number | undefined;
    /**
     * bind the Texture2D
     * @param textureSlotIndex
     * @param textureUid
     */
    bindTexture2D(textureSlotIndex: Index, textureUid: CGAPIResourceHandle): void;
    /**
     * bind the Sampler
     * @param textureSlotIndex
     * @param samplerUid
     */
    bindTextureSampler(textureSlotIndex: Index, samplerUid: CGAPIResourceHandle): void;
    /**
     * bind the TextureCube
     * @param textureSlotIndex
     * @param textureUid
     */
    bindTextureCube(textureSlotIndex: Index, textureUid: CGAPIResourceHandle): void;
    /**
     * bind the Texture2DArray
     * @param textureSlotIndex
     * @param textureUid
     */
    bindTexture2DArray(textureSlotIndex: Index, textureUid: CGAPIResourceHandle): void;
    /**
     * create a VertexBuffer and IndexBuffer
     * @param primitive
     * @returns
     */
    createVertexBufferAndIndexBuffer(primitive: Primitive): VertexHandles;
    /**
     * update the VertexBuffer and IndexBuffer
     * @param primitive
     * @param vertexHandles
     */
    updateVertexBufferAndIndexBuffer(primitive: Primitive, vertexHandles: VertexHandles): void;
    /**
     * create a shader program
     * @returns a object which has shader modules
     */
    createShaderProgram({ material, primitive, vertexShaderStr, fragmentShaderStr, attributeNames, attributeSemantics, onError, }: {
        material: Material;
        primitive: Primitive;
        vertexShaderStr: string;
        fragmentShaderStr: string;
        attributeNames: AttributeNames;
        attributeSemantics: VertexAttributeEnum[];
        onError?: (message: string) => void;
    }): WebGPUResourceHandle;
    private __checkShaderCompileStatus;
    private __checkShaderProgramLinkStatus;
    /**
     * setup the uniform locations
     * @param shaderProgramUid
     * @param infoArray
     * @param isUniformOnlyMode
     * @returns
     */
    setupUniformLocations(shaderProgramUid: WebGLResourceHandle, infoArray: ShaderSemanticsInfo[], isUniformOnlyMode: boolean): WebGLProgram;
    setupBasicUniformLocations(shaderProgramUid: WebGLResourceHandle): void;
    setUniform1iForTexture(shaderProgram_: WebGLProgram, semanticStr: string, value: any): void;
    /**
     * set an uniform value
     */
    setUniformValue(shaderProgram_: WebGLProgram, semanticStr: string, firstTime: boolean, value: any): boolean;
    /**
     * bind the texture
     * @param info
     * @param value
     */
    bindTexture(info: ShaderSemanticsInfo, value: [number, AbstractTexture, Sampler]): void;
    /**
     * set the uniform value
     * @param shaderProgram
     * @param semanticStr
     * @param info
     * @param isMatrix
     * @param componentNumber
     * @param isVector
     * @param param6
     * @param index
     * @returns
     */
    setUniformValueInner(shaderProgram: WebGLProgram, semanticStr: string, info: ShaderSemanticsInfo, isMatrix: boolean, componentNumber: number, isVector: boolean, { x, y, z, w, }: {
        x: number | ArrayType | boolean;
        y?: number | boolean;
        z?: number | boolean;
        w?: number | boolean;
    }): boolean;
    /**
     * set the VertexData to the Pipeline
     */
    setVertexDataToPipeline({ vaoHandle, iboHandle, vboHandles, }: {
        vaoHandle: WebGLResourceHandle;
        iboHandle?: WebGLResourceHandle;
        vboHandles: Array<WebGLResourceHandle>;
    }, primitive: Primitive, instanceIDBufferUid?: WebGLResourceHandle): void;
    /**
     * create a TexStorage2D
     * @param data
     * @param param1
     * @returns
     */
    createTexStorage2D({ levels, internalFormat, width, height, }: {
        levels: Index;
        internalFormat: TextureParameterEnum | PixelFormatEnum;
        width: Size;
        height: Size;
    }): WebGLResourceHandle;
    createTextureSampler({ magFilter, minFilter, wrapS, wrapT, wrapR, anisotropy, isPremultipliedAlpha, shadowCompareMode, }: {
        magFilter: TextureParameterEnum;
        minFilter: TextureParameterEnum;
        wrapS: TextureParameterEnum;
        wrapT: TextureParameterEnum;
        wrapR: TextureParameterEnum;
        anisotropy: boolean;
        isPremultipliedAlpha?: boolean;
        shadowCompareMode: boolean;
    }): number;
    createOrGetTextureSamplerClampToEdgeLinear(): number;
    createOrGetTextureSamplerClampToEdgeNearest(): number;
    createOrGetTextureSamplerRepeatNearest(): number;
    createOrGetTextureSamplerRepeatLinear(): number;
    createOrGetTextureSamplerRepeatTriLinear(): number;
    createOrGetTextureSamplerShadow(): number;
    createOrGetTextureSamplerRepeatAnisotropyLinear(): number;
    /**
     * create a Texture
     * @param imageData
     * @param param1
     * @returns
     */
    createTextureFromImageBitmapData(imageData: ImageBitmapData, { level, internalFormat, width, height, border, format, type, generateMipmap, }: {
        level: Index;
        internalFormat: TextureFormatEnum;
        width: Size;
        height: Size;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): Promise<WebGLResourceHandle>;
    private __createTextureInner;
    /**
     * create a Texture
     * @param imageData
     * @param param1
     * @returns
     */
    createTextureFromHTMLImageElement(imageData: HTMLImageElement, { level, internalFormat, width, height, border, format, type, generateMipmap, }: {
        level: Index;
        internalFormat: TextureParameterEnum;
        width: Size;
        height: Size;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): Promise<WebGLResourceHandle>;
    /**
     * create a TextureArray
     * @param width
     * @param height
     * @param arrayLength
     * @param mipLevelCount
     * @param internalFormat
     * @param format
     * @param type
     * @returns texture handle
     */
    createTextureArray(width: Size, height: Size, arrayLength: Size, mipLevelCount: Size, internalFormat: TextureFormatEnum, format: PixelFormatEnum, type: ComponentTypeEnum, imageData: TypedArray): CGAPIResourceHandle;
    /**
     * allocate a Texture
     * @param format - the internal format of the texture
     * @param width - the width of the texture
     * @param height - the height of the texture
     * @param mipmapCount - the number of mipmap levels
     * @returns the handle of the texture
     */
    allocateTexture({ format, width, height, mipLevelCount, }: {
        format: TextureFormatEnum;
        width: Size;
        height: Size;
        mipLevelCount: Count;
    }): WebGLResourceHandle;
    /**
     * Load an image to a specific mip level of a texture
     * @param mipLevel - the mip level to load the image to
     * @param textureUid - the handle of the texture
     * @param format - the format of the image
     * @param type - the type of the data
     * @param xOffset - the x offset of copy region
     * @param yOffset - the y offset of copy region
     * @param width - the width of the image
     * @param height - the height of the image
     * @param data - the typedarray data of the image
     */
    loadImageToMipLevelOfTexture2D({ mipLevel, textureUid, format, type, xOffset, yOffset, width, height, rowSizeByPixel, data, }: {
        mipLevel: Index;
        textureUid: WebGLResourceHandle;
        format: TextureFormatEnum;
        type: ComponentTypeEnum;
        xOffset: number;
        yOffset: number;
        width: number;
        height: number;
        rowSizeByPixel: number;
        data: TypedArray;
    }): void;
    /**
     * create a Texture from TypedArray
     * @param imageData
     * @param param1
     * @returns
     */
    createTextureFromTypedArray(imageData: TypedArray, { level, internalFormat, width, height, border, format, type, generateMipmap, }: {
        level: Index;
        internalFormat: TextureFormatEnum;
        width: Size;
        height: Size;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): WebGLResourceHandle;
    /**
     * Create and bind compressed texture object
     * @param textureDataArray transcoded texture data for each mipmaps(levels)
     * @param compressionTextureType
     */
    createCompressedTexture(textureDataArray: TextureData[], compressionTextureType: CompressionTextureTypeEnum): Promise<WebGLResourceHandle>;
    /**
     * create CompressedTextureFromBasis
     * @param basisFile
     * @param param1
     * @returns
     */
    createCompressedTextureFromBasis(basisFile: BasisFile, { border, format, type, }: {
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
    }): WebGLResourceHandle;
    /**
     * decode the BasisImage
     * @param basisFile
     * @param basisCompressionType
     * @param imageIndex
     * @param levelIndex
     * @returns
     */
    private decodeBasisImage;
    /**
     * create a FrameBufferObject
     * @returns
     */
    createFrameBufferObject(): number;
    /**
     * attach the ColorBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param attachmentIndex a attachment index
     * @param renderable a ColorBuffer
     */
    attachColorBufferToFrameBufferObject(framebuffer: FrameBuffer, attachmentIndex: Index, renderable: IRenderable): void;
    /**
     * attach the ColorBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a ColorBuffer
     */
    attachColorBufferLayerToFrameBufferObject(framebuffer: FrameBuffer, attachmentIndex: Index, renderable: IRenderable, layerIndex: Index, mipLevel: Index): void;
    /**
     * attach the ColorBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param attachmentIndex a attachment index
     * @param faceIndex a face index
     * @param mipLevel a mip level
     * @param renderable a ColorBuffer
     */
    attachColorBufferCubeToFrameBufferObject(framebuffer: FrameBuffer, attachmentIndex: Index, faceIndex: Index, mipLevel: Index, renderable: IRenderable): void;
    /**
     * attach the DepthBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a DepthBuffer
     */
    attachDepthBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    /**
     * attach the StencilBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a StencilBuffer
     */
    attachStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    /**
     * attach the depthStencilBuffer to the FrameBufferObject
     * @param framebuffer a Framebuffer
     * @param renderable a depthStencilBuffer
     */
    attachDepthStencilBufferToFrameBufferObject(framebuffer: FrameBuffer, renderable: IRenderable): void;
    private __attachDepthOrStencilBufferToFrameBufferObject;
    /**
     * create Renderbuffer
     */
    createRenderBuffer(width: Size, height: Size, internalFormat: TextureParameterEnum, isMSAA: boolean, sampleCountMSAA: Count): number;
    /**
     * set drawTargets
     * @param framebuffer
     */
    setDrawTargets(renderPass: RenderPass): void;
    /**
     * bind Framebuffer
     * @param framebuffer
     */
    bindFramebuffer(framebuffer?: FrameBuffer): void;
    /**
     * unbind Framebuffer
     */
    unbindFramebuffer(): void;
    /**
     * create a RenderTargetTexture
     * @param param0
     * @returns
     */
    createRenderTargetTexture({ width, height, mipLevelCount, format, }: {
        width: Size;
        height: Size;
        mipLevelCount: Count;
        format: TextureParameterEnum;
    }): number;
    /**
     * create a RenderTargetTextureArray
     * @param param0
     * @returns
     */
    createRenderTargetTextureArray({ width, height, level, internalFormat, format, type, arrayLength, }: {
        width: Size;
        height: Size;
        level: Index;
        internalFormat: TextureParameterEnum;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        arrayLength: Count;
    }): WebGLResourceHandle;
    /**
     * create a RenderTargetTextureCube
     * @param param0
     * @returns
     */
    createRenderTargetTextureCube({ width, height, mipLevelCount, format, }: {
        width: Size;
        height: Size;
        mipLevelCount: Size;
        format: TextureParameterEnum;
    }): number;
    /**
     * create a CubeTexture
     *
     * @param mipLevelCount
     * @param images
     * @param width
     * @param height
     * @returns resource handle
     */
    createCubeTexture(mipLevelCount: Count, images: Array<{
        posX: DirectTextureData;
        negX: DirectTextureData;
        posY: DirectTextureData;
        negY: DirectTextureData;
        posZ: DirectTextureData;
        negZ: DirectTextureData;
    }>, width: Size, height: Size): [number, Sampler];
    /**
     * Create Cube Texture from image files.
     * @param baseUri the base uri to load images;
     * @param mipLevelCount the number of mip levels (include root level). if no mipmap, the value should be 1;
     * @returns the WebGLResourceHandle for the generated Cube Texture
     */
    createCubeTextureFromFiles(baseUri: string, mipLevelCount: Count, isNamePosNeg: boolean, hdriFormat: HdriFormatEnum): Promise<[number, Sampler]>;
    createCubeTextureFromBasis(basisFile: BasisFile, { magFilter, minFilter, wrapS, wrapT, border, }: {
        magFilter?: TextureParameterEnum | undefined;
        minFilter?: TextureParameterEnum | undefined;
        wrapS?: TextureParameterEnum | undefined;
        wrapT?: TextureParameterEnum | undefined;
        border?: number | undefined;
    }): number;
    createDummyBlackCubeTexture(): [number, Sampler];
    createDummyCubeTexture(rgbaStr?: string): [number, Sampler];
    setWebGLTextureDirectly(webGLTexture: WebGLTexture): number;
    createTextureFromDataUri(dataUri: string, { level, internalFormat, border, format, type, generateMipmap, }: {
        level: Index;
        internalFormat: TextureParameterEnum;
        border: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        generateMipmap: boolean;
    }): Promise<WebGLResourceHandle>;
    updateLevel0TextureAndGenerateMipmap(textureUid: WebGLResourceHandle, textureData: DirectTextureData, { width, height, format, type, }: {
        width: Size;
        height: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
    }): void;
    updateTexture(textureUid: WebGLResourceHandle, textureData: DirectTextureData, { level, xoffset, yoffset, width, height, format, type, }: {
        level: Index;
        xoffset: Size;
        yoffset: Size;
        width: Size;
        height: Size;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
    }): void;
    deleteFrameBufferObject(frameBufferObjectHandle: WebGLResourceHandle): void;
    deleteRenderBuffer(renderBufferUid: WebGLResourceHandle): void;
    deleteTexture(textureHandle: WebGLResourceHandle): void;
    createDummyTexture(rgbaStr?: string): Promise<number>;
    createDummyBlackTexture(): number;
    createDummyWhiteTexture(): number;
    createDummyNormalTexture(): number;
    __createDummyTextureInner(base64: string): number;
    generateMipmaps2d(textureHandle: WebGLResourceHandle, width: number, height: number): void;
    generateMipmapsCube(textureHandle: WebGLResourceHandle, width: number, height: number): void;
    getTexturePixelData(textureHandle: WebGLResourceHandle, width: number, height: number, frameBufferUid: WebGLResourceHandle, colorAttachmentIndex: number): Promise<Uint8Array>;
    createUniformBuffer(bufferView: TypedArray | DataView): number;
    updateUniformBuffer(uboUid: WebGLResourceHandle, typedArray: TypedArray, offsetByte: Byte$1, arrayLength: Byte$1): void;
    bindUniformBlock(shaderProgramUid: WebGLResourceHandle, blockName: string, blockIndex: Index): void;
    bindUniformBufferBase(blockIndex: Index, uboUid: WebGLResourceHandle): void;
    deleteUniformBuffer(uboUid: WebGLResourceHandle): void;
    setupUniformBufferDataArea(typedArray?: TypedArray): number;
    getGlslRenderTargetBeginString(renderTargetNumber: number): string;
    getGlslDataUBODefinitionString(): string;
    getGlslDataUBOVec4SizeString(): string;
    createMultiviewFramebuffer(width: number, height: number, samples: number): [WebGLResourceHandle, WebGLResourceHandle];
    createTransformFeedback(): number;
    deleteTransformFeedback(transformFeedbackUid: WebGLResourceHandle): void;
    setViewport(viewport?: Vector4): void;
    clearFrameBuffer(renderPass: RenderPass): void;
    deleteVertexDataResources(vertexHandles: VertexHandles): void;
    deleteVertexArray(vaoHandle: WebGLResourceHandle): void;
    deleteVertexBuffer(vboUid: WebGLResourceHandle): void;
    resizeCanvas(width: Size, height: Size): void;
    getCanvasSize(): [Size, Size];
    switchDepthTest(flag: boolean): void;
    rebuildProgramBySpector(this: RnWebGLProgram, updatedVertexSourceCode: string, // The new vertex shader source
    updatedFragmentSourceCode: string, // The new fragment shader source
    onCompiled: (program: WebGLProgram) => void, // Callback triggered by your engine when the compilation is successful. It needs to send back the new linked program.
    onError: (message: string) => void): boolean;
    getPixelDataFromTexture(texUid: WebGLResourceHandle, x: number, y: number, width: number, height: number): Uint8Array;
    setWebGLStateToDefault(): void;
    unbindTextureSamplers(): void;
    isSupportMultiViewVRRendering(): boolean;
    blitToTexture2dFromTexture2dArray(srcTextureUid: WebGLResourceHandle, dstFboUid: WebGLResourceHandle, dstWidth: number, dstHeight: number): void;
    blitToTexture2dFromTexture2dArrayFake(srcTextureUid: WebGLResourceHandle, dstFboUid: WebGLResourceHandle, dstWidth: number, dstHeight: number): void;
    blitToTexture2dFromTexture2dArray2(srcTextureUid: WebGLResourceHandle, dstTextureUid: WebGLResourceHandle, dstWidth: number, dstHeight: number): void;
}

interface RaycastResult {
    result: boolean;
    data?: {
        t: number;
        u: number;
        v: number;
    };
}
interface RaycastResultEx1 {
    result: boolean;
    data?: {
        t: number;
        u: number;
        v: number;
        position: IVector3;
    };
}
interface RaycastResultEx2 {
    result: boolean;
    data?: {
        t: number;
        u: number;
        v: number;
        position: IVector3;
        selectedMeshComponent: MeshComponent;
    };
}
/**
 * See: http://realtimecollisiondetection.net/blog/?p=86
 *
 * Bit Field
 * --- 0
 *  3 bits: Primitive Type (0: POINTS, 1: LINES, 2: LINE_LOOP, 3: LINE_STRIP, 4: TRIANGLES, 5: TRIANGLE_STRIP, 6: TRIANGLE_FAN)
 * 10 bits: Material TID
 *  2 bits: Translucency type (0: Opaque, 1: Translucent, 2: Blend with ZWrite, 3: Blend without ZWrite
 *  3 bits: Viewport layer
 *  3 bits: Viewport
 *  2 bits: Fullscreen layer
 * --- 31
 *
 * Depth Field
 * 32 bits: Depth
 */
type PrimitiveSortKey = number;
declare const PrimitiveSortKey_BitLength_TranslucencyType = 2;
declare const PrimitiveSortKey_BitLength_Material = 10;
declare const PrimitiveSortKey_BitLength_PrimitiveType = 3;
declare const PrimitiveSortKey_BitOffset_PrimitiveType = 0;
declare const PrimitiveSortKey_BitOffset_Material = 3;
declare const PrimitiveSortKey_BitOffset_TranslucencyType: number;
declare const PrimitiveSortKey_BitOffset_ViewportLayer: number;
type PrimitiveSortKeyLength = typeof PrimitiveSortKey_BitLength_Material | typeof PrimitiveSortKey_BitLength_TranslucencyType | typeof PrimitiveSortKey_BitLength_PrimitiveType;
type PrimitiveSortKeyOffset = typeof PrimitiveSortKey_BitOffset_Material | typeof PrimitiveSortKey_BitOffset_TranslucencyType | typeof PrimitiveSortKey_BitOffset_ViewportLayer;
declare const PrimitiveSortKey_BitLength_Depth = 32;
interface IMesh {
    meshUID: MeshUID;
}
declare function isBlend(primitive: Primitive): boolean;
declare function isBlendWithZWrite(primitive: Primitive): boolean;
declare function isBlendWithoutZWrite(primitive: Primitive): boolean;
declare function isTranslucent(primitive: Primitive): boolean;
declare function isOpaque(primitive: Primitive): boolean;

/**
 * MeshComponent is a component that manages a mesh.
 *
 */
declare class MeshComponent extends Component {
    private __viewDepth;
    private __mesh?;
    isPickable: boolean;
    private static __tmpVector3_0;
    private static __tmpVector3_1;
    private static __tmpVector3_2;
    private static __returnVector3;
    private static __tmpMatrix44_0;
    private static __latestPrimitivePositionAccessorVersion;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    setMesh(mesh: Mesh): void;
    unsetMesh(): boolean;
    get mesh(): Mesh | undefined;
    calcViewDepth(cameraComponent: CameraComponent): number;
    get viewDepth(): number;
    static alertNoMeshSet(meshComponent: MeshComponent): void;
    castRay(srcPointInWorld: Vector3, directionInWorld: Vector3, dotThreshold?: number): RaycastResultEx1;
    castRayFromScreenInLocal(x: number, y: number, camera: CameraComponent, viewport: Vector4, dotThreshold?: number): RaycastResultEx1;
    castRayFromScreenInWorld(x: number, y: number, camera: CameraComponent, viewport: Vector4, dotThreshold?: number): RaycastResultEx1;
    $load(): void;
    private __update3DAPIVertexData;
    calcBaryCentricCoord(): void;
    $logic(): void;
    _shallowCopyFrom(component_: Component): void;
    _destroy(): void;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): IMeshEntity;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}

/**
 * The Mesh class.
 * This mesh object has primitives (geometries) or a reference of 'original mesh'.
 * If the latter, this mesh object is an 'instanced mesh', which has no primitives.
 * Instanced meshes refer original mesh's primitives when drawing.
 */
declare class Mesh implements IMesh {
    private readonly __meshUID;
    static readonly invalidateMeshUID = -1;
    static __mesh_uid_count: number;
    private __primitives;
    private __opaquePrimitives;
    private __translucentPrimitives;
    private __blendWithZWritePrimitives;
    private __blendWithoutZWritePrimitives;
    private __morphPrimitives;
    private __localAABB;
    private __vaoUids;
    private __variationVBOUid;
    private __latestPrimitivePositionAccessorVersionForAABB;
    private __latestPrimitivePositionAccessorVersionForSetUpDone;
    private __belongToEntities;
    /**
     * Specification of when calculate the tangent of a vertex to apply Normal texture (for pbr/MToon shader)
     * 0: Not calculate tangent (not apply normal texture)
     * 1: (default) Use original tangent in a vertex, if a vertex has tangent attribute. If a vertex does not have it, calculate a tangent in a shader.
     * 2: Use original tangent in a vertex, if a vertex has tangent attribute. If a vertex does not have it, precalculate a tangent in the javascript.
     * 3: Calculate all tangent in a shader.
     * 4: Precalculate all tangent in the javascript
     */
    tangentCalculationMode: Index;
    private __hasFaceNormal;
    private static __tmpVec3_0;
    private static __tmpVec3_1;
    private static __tmpVec3_2;
    private static __tmpVec3_3;
    private static __tmpVec3_4;
    private static __tmpVec3_5;
    private static __tmpVec3_6;
    private static __tmpVec3_7;
    private static __tmpVec3_8;
    private static __tmpVec3_9;
    private static __tmpVec3_10;
    private static __tmpVec3_11;
    private static __tmpReturnVec3_0;
    private static __tmpReturnVec3_1;
    private static __tmpReturnVec3_2;
    private __primitivePositionUpdateCount;
    /**
     * Constructor
     */
    constructor();
    getVaoUids(index: Index): CGAPIResourceHandle;
    getVaoUidsByPrimitiveUid(primitiveUid: Index): CGAPIResourceHandle;
    get meshEntitiesInner(): IMeshEntity[];
    _belongToMeshComponent(meshComponent: MeshComponent): void;
    /**
     * Adds primitive.
     * @param primitive The primitive object.
     */
    addPrimitive(primitive: Primitive): void;
    private __setPrimitives;
    isExistOpaque(): boolean;
    isExistTranslucent(): boolean;
    isExistBlendWithZWrite(): boolean;
    isExistBlendWithoutZWrite(): boolean;
    getPrimitiveAt(i: number): Primitive;
    getPrimitiveNumber(): number;
    /**
     * @internal
     * @returns true: updated, false: not changed (not dirty)
     */
    updateVariationVBO(): boolean;
    /**
     * @internal
     * @returns true: updated, false: not changed (not dirty)
     */
    deleteVariationVBO(): boolean;
    updateVAO(): void;
    deleteVAO(): void;
    castRay(srcPointInLocal: IVector3, directionInLocal: IVector3, dotThreshold?: number): RaycastResultEx1;
    get primitives(): Primitive[];
    get meshUID(): number;
    /**
     * @internal
     */
    get _variationVBOUid(): CGAPIResourceHandle;
    _onPrimitivePositionUpdated(): void;
    get primitivePositionUpdateCount(): number;
    /**
     * Gets AABB in local space.
     */
    get AABB(): AABB;
    private __calcMorphPrimitives;
    /**
     * @internal
     */
    _calcTangents(): void;
    /**
     * @internal
     */
    private __calcTangentFor3Vertices;
    private __calcTangentPerVertex;
    private __usePreCalculatedTangent;
    /**
     * @internal
     */
    _calcBaryCentricCoord(): void;
    /**
     * @internal
     */
    _calcFaceNormalsIfNonNormal(): void;
    private __calcFaceNormalFor3Vertices;
    getPrimitiveIndexInMesh(primitive: Primitive): number;
    /**
     * Apply a material variant to the mesh
     * @param variantName a variant name
     */
    applyMaterialVariant(variantName: string): void;
    getCurrentVariantName(): string;
    getVariantNames(): string[];
    isSetUpDone(): boolean;
    /**
     * @internal
     */
    _updateVBOAndVAO(): void;
    delete3DAPIVertexData(): void;
}

type Attributes = Map<VertexAttributeSemanticsJoinedString, Accessor>;
interface IAnyPrimitiveDescriptor {
    /** attach a rhodonite material to this plane(the default material is the classicUberMaterial */
    material?: Material;
}
interface PrimitiveDescriptor extends IAnyPrimitiveDescriptor {
    attributes: TypedArray[];
    attributeSemantics: VertexAttributeSemanticsJoinedString[];
    primitiveMode: PrimitiveModeEnum;
    indices?: TypedArray;
}
declare class Primitive extends RnObject {
    private __mode;
    private static __defaultMaterial?;
    private __material;
    private __materialVariants;
    private __currentVariantName;
    _prevMaterial: WeakRef<Material>;
    private __attributes;
    private __oIndices;
    private static __primitiveCount;
    private __primitiveUid;
    private __aabb;
    private __targets;
    private __vertexHandles?;
    private __mesh?;
    private static __primitives;
    _sortkey: PrimitiveSortKey;
    _viewDepth: number;
    private static __primitiveUidIdxHasMorph;
    private static __idxPrimitiveUidHasMorph;
    private static __primitiveCountHasMorph;
    private static __tmpVec3_0;
    private __latestPositionAccessorVersion;
    private __positionAccessorVersion;
    private static __variantUpdateCount;
    private __fingerPrint;
    constructor();
    /**
     * Calculates a fingerprint string for the primitive based on its properties
     * including mode, indices, targets, and attributes.
     */
    calcFingerPrint(): void;
    /**
     * Gets the fingerprint string of the primitive
     * @returns The fingerprint string
     */
    _getFingerPrint(): string;
    /**
     * Gets the index of a primitive with morph targets by its UID
     * @param primitiveUid The UID of the primitive
     * @returns The index if found, otherwise undefined
     */
    static getPrimitiveIdxHasMorph(primitiveUid: PrimitiveUID): Index | undefined;
    /**
     * Gets a primitive with morph targets by its index
     * @param primitiveIdx The index of the primitive
     * @returns The primitive if found, otherwise undefined
     */
    static getPrimitiveHasMorph(primitiveIdx: Index): Primitive | undefined;
    /**
     * Gets the bit size of indices ('uint16' or 'uint32')
     * @returns The index bit size
     * @throws Error if index accessor is null or has unknown type
     */
    getIndexBitSize(): 'uint16' | 'uint32';
    /**
     * Gets the vertex handles associated with this primitive.
     * @returns The vertex handles if they exist, otherwise undefined.
     */
    get _vertexHandles(): VertexHandles | undefined;
    /**
     * Gets the current count of material variant updates.
     * @returns The number of material variant updates.
     */
    static get variantUpdateCount(): number;
    /**
     * Sets a material variant for this primitive.
     * @param variantName The name of the variant.
     * @param material The material to associate with the variant.
     */
    setMaterialVariant(variantName: string, material: Material): void;
    /**
     * Applies a material variant by its name.
     * @param variantName The name of the variant to apply.
     */
    applyMaterialVariant(variantName: string): void;
    /**
     * Gets the name of the currently applied material variant.
     * @returns The name of the current variant, or an empty string if none is applied.
     */
    getCurrentVariantName(): string;
    /**
     * Gets all variant names associated with this primitive.
     * @returns An array of variant names.
     */
    getVariantNames(): string[];
    /**
     * Gets the material for a specific variant.
     * @param variantName The name of the variant.
     * @returns The material associated with the variant, or undefined if not found.
     */
    getVariantMaterial(variantName: string): Material | undefined;
    /**
     * Sets the material for this primitive and updates the sort key.
     * @param mat The material to set.
     */
    set material(mat: Material);
    /**
     * Gets the current material of this primitive.
     * @returns The material.
     */
    get material(): Material;
    /**
     * Updates the sort key by setting a specific bit range.
     * @param offset The bit offset to start writing.
     * @param length The number of bits to write.
     * @param value The value to write.
     */
    setSortKey(offset: PrimitiveSortKeyOffset, length: PrimitiveSortKeyLength, value: number): void;
    /**
     * Associates this primitive with a mesh.
     * @param mesh The mesh to associate with.
     */
    _belongToMesh(mesh: Mesh): void;
    /**
     * Gets the mesh associated with this primitive.
     * @returns The mesh if it exists, otherwise undefined.
     */
    get mesh(): IMesh | undefined;
    /**
     * Backs up the current material of this primitive.
     */
    _backupMaterial(): void;
    /**
     * Restores the previously backed-up material.
     */
    _restoreMaterial(): void;
    /**
     * Gets the primitive by its UID.
     * @param primitiveUid The UID of the primitive.
     * @returns The primitive if found, otherwise undefined.
     */
    static getPrimitive(primitiveUid: PrimitiveUID): Primitive | undefined;
    /**
     * Gets the total count of primitives.
     * @returns The number of primitives.
     */
    static getPrimitiveCount(): number;
    /**
     * Notifies the primitive that an accessor has been updated.
     * @param accessorVersion The version of the updated accessor.
     */
    onAccessorUpdated(accessorVersion: number): void;
    /**
     * Sets the data for this primitive, including attributes, mode, material, and indices.
     * @param attributes The vertex attributes.
     * @param mode The primitive mode.
     * @param material The material to use (optional).
     * @param indicesAccessor The indices accessor (optional).
     */
    setData(attributes: Attributes, mode: PrimitiveModeEnum, material?: Material, indicesAccessor?: Accessor): void;
    /**
     * Copies vertex data from a descriptor to this primitive.
     * @param desc The descriptor containing vertex data.
     */
    copyVertexData({ attributes, attributeSemantics, primitiveMode, indices, material, }: PrimitiveDescriptor): void;
    /**
     * Creates a new primitive from a descriptor
     * @param desc The primitive descriptor
     * @returns The created primitive
     */
    static createPrimitive(desc: PrimitiveDescriptor): Primitive;
    get indicesAccessor(): Accessor | undefined;
    getVertexCountAsIndicesBased(): number;
    getVertexCountAsVerticesBased(): Count;
    getTriangleCountAsIndicesBased(): Count;
    getTriangleCountAsVerticesBased(): Count;
    hasIndices(): boolean;
    get attributeAccessors(): Array<Accessor>;
    getAttribute(semantic: VertexAttributeSemanticsJoinedString): Accessor | undefined;
    get attributeSemantics(): Array<VertexAttributeSemanticsJoinedString>;
    get attributeEntries(): IterableIterator<[VertexAttributeSemanticsJoinedString, Accessor]>;
    get attributeCompositionTypes(): Array<CompositionTypeEnum>;
    get attributeComponentTypes(): Array<ComponentTypeEnum>;
    get primitiveMode(): PrimitiveModeEnum;
    get primitiveUid(): PrimitiveUID;
    get positionAccessorVersion(): number;
    get AABB(): AABB;
    setVertexAttribute(accessor: Accessor, vertexSemantic: VertexAttributeSemanticsJoinedString): void;
    removeIndices(): void;
    setIndices(accessor: Accessor): void;
    setBlendShapeTargets(targets: Array<Attributes>): void;
    getBlendShapeTargets(): Attributes[];
    get targets(): Array<Attributes>;
    /**
     * Checks if the primitive is using blend mode
     * @returns True if using blend mode, false otherwise
     */
    isBlend(): boolean;
    isOpaque(): boolean;
    create3DAPIVertexData(): boolean;
    update3DAPIVertexData(): boolean;
    delete3DAPIVertexData(): boolean;
    get vertexHandles(): VertexHandles | undefined;
    convertToUnindexedGeometry(): void;
    castRay(origVec3: IVector3, dirVec3: IVector3, isFrontFacePickable: boolean, isBackFacePickable: boolean, dotThreshold: number, hasFaceNormal: boolean): RaycastResultEx1;
    private __castRayInnerTomasMoller;
    /**
     * Calculates the normal vector from UV coordinates
     * @param pos0IndexBase Index of first position
     * @param pos1IndexBase Index of second position
     * @param pos2IndexBase Index of third position
     * @param u U coordinate
     * @param v V coordinate
     * @returns The calculated normal vector
     */
    private __calcNormalFromUV;
}

type IndicesAccessOption = {
    indicesAccessor?: Accessor;
    endian?: boolean;
};
declare class Accessor {
    private __bufferView;
    private __byteOffsetInRawArrayBufferOfBuffer;
    private __compositionType;
    private __componentType;
    private __count;
    private __raw;
    private __dataView?;
    private __typedArray;
    private __takenCount;
    private __byteStride;
    private __typedArrayClass?;
    private __dataViewGetter;
    private __dataViewSetter;
    private __max;
    private __min;
    private __arrayLength;
    private __normalized;
    private __isMinMixDirty;
    private static __tmpVector4_0;
    private static __tmpVector3_0;
    private static __tmpVector2_0;
    private __version;
    _primitive?: WeakRef<Primitive>;
    constructor({ bufferView, byteOffsetInBufferView, compositionType, componentType, byteStride, count, raw, max, min, arrayLength, normalized, }: {
        bufferView: BufferView;
        byteOffsetInBufferView: Byte$1;
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        byteStride: Byte$1;
        count: Count;
        raw: ArrayBuffer;
        max?: number[];
        min?: number[];
        arrayLength: Size;
        normalized: boolean;
    });
    private __copyBufferDataToTypedArray;
    private __onUpdated;
    getTypedArrayClass(componentType: ComponentTypeEnum): TypedArrayConstructor | undefined;
    getDataViewGetter(componentType: ComponentTypeEnum): string | undefined;
    getDataViewSetter(componentType: ComponentTypeEnum): string | undefined;
    takeOne(): TypedArray;
    _takeExistedOne(idx: number): TypedArray;
    get takenCount(): Count;
    get numberOfComponents(): number;
    get componentSizeInBytes(): number;
    get elementSizeInBytes(): number;
    /**
     * get element count
     * element may be scalar, vec2, vec3, vec4, ...
     */
    get elementCount(): Count;
    get byteLength(): Byte$1;
    get componentType(): ComponentTypeEnum;
    get compositionType(): CompositionTypeEnum;
    /**
     *
     * @returns
     */
    getTypedArray(): TypedArray;
    setTypedArray(typedArray: TypedArray): void;
    getUint8Array(): Uint8Array;
    get isAoS(): boolean;
    get isSoA(): boolean;
    get byteStride(): number;
    getScalar(i: Index, { indicesAccessor, endian }: IndicesAccessOption): number;
    getScalarAt(i: Index, compositionOffset: Index, { indicesAccessor, endian }: IndicesAccessOption): number;
    getVec2AsArray(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Array2<number>;
    getVec3AsArray(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Array3<number>;
    getVec4AsArray(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Array4<number>;
    getMat3AsArray(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Array<number>;
    getMat4AsArray(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Array<number>;
    getVec2(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Vector2;
    getVec3(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Vector3;
    getVec4(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Vector4;
    getMat3(i: Index, { indicesAccessor, endian }: IndicesAccessOption): Matrix33;
    getMat4(i: Index, { indicesAccessor, endian }: IndicesAccessOption): MutableMatrix44;
    getVec2To(i: Index, out: MutableVector2, { indicesAccessor, endian }: IndicesAccessOption): Vector2;
    getVec3To(i: Index, out: MutableVector3, { indicesAccessor, endian }: IndicesAccessOption): Vector3;
    getVec4To(i: Index, out: MutableVector4, { indicesAccessor, endian }: IndicesAccessOption): Vector4;
    getMat3To(i: Index, out: MutableMatrix33, { indicesAccessor, endian }: {
        indicesAccessor?: Accessor | undefined;
        endian?: boolean;
    }): Matrix33;
    getMat4To(i: Index, out: MutableMatrix44, { indicesAccessor, endian }: IndicesAccessOption): MutableMatrix44;
    setScalar(i: Index, value: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    setVec2(i: Index, x: number, y: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    setVec3(i: Index, x: number, y: number, z: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    setVec4(i: Index, x: number, y: number, z: number, w: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    setMat3(i: Index, v0: number, v1: number, v2: number, v3: number, v4: number, v5: number, v6: number, v7: number, v8: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    setMat4(i: Index, v0: number, v1: number, v2: number, v3: number, v4: number, v5: number, v6: number, v7: number, v8: number, v9: number, v10: number, v11: number, v12: number, v13: number, v14: number, v15: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    setVec2AsVector(i: Index, vec: Vector2, { indicesAccessor, endian }: IndicesAccessOption): void;
    setVec3AsVector(i: Index, vec: Vector3, { indicesAccessor, endian }: IndicesAccessOption): void;
    setVec4AsVector(i: Index, vec: Vector4, { indicesAccessor, endian }: IndicesAccessOption): void;
    setMat4AsMatrix44(i: Index, mat: Matrix44, { indicesAccessor, endian }: IndicesAccessOption): void;
    copyFromTypedArray(typedArray: TypedArray): void;
    setScalarAt(i: Index, compositionOffset: Index, value: number, { indicesAccessor, endian }: IndicesAccessOption): void;
    setElementFromSameCompositionAccessor(i: Index, accessor: Accessor, secondIdx?: Index): void;
    copyBuffer(accessor: Accessor): void;
    setElementFromAccessor(i: Index, accessor: Accessor, secondIdx?: Index): void;
    addElementFromSameCompositionAccessor(i: Index, accessor: Accessor, coeff: number, secondIdx?: Index): void;
    get arrayBufferOfBufferView(): ArrayBuffer;
    get dataViewOfBufferView(): DataView;
    get byteOffsetInBufferView(): Byte$1;
    get byteOffsetInBuffer(): Byte$1;
    get byteOffsetInRawArrayBufferOfBuffer(): number;
    get bufferView(): BufferView;
    setMinMax(min: number[], max: number[]): void;
    get min(): number[];
    get max(): number[];
    get normalized(): boolean;
    private __calcMinMax;
    get isMinMaxDirty(): boolean;
    get version(): number;
    get actualByteStride(): number;
    isSame(rnAccessor: Accessor): boolean;
}

type RnM2 = {
    extensionsUsed: string[];
    extensionsRequired: string[];
    accessors: RnM2Accessor[];
    animations: RnM2Animation[];
    asset: RnM2Asset;
    buffers: RnM2Buffer[];
    bufferViews: RnM2BufferView[];
    cameras: RnM2Camera[];
    images: RnM2Image[];
    materials: RnM2Material[];
    meshes: RnM2Mesh[];
    nodes: RnM2Node[];
    samplers: RnM2TextureSampler[];
    scene: number;
    scenes: RnM2Scene[];
    skins: RnM2Skin[];
    textures: RnM2Texture[];
    extensions: Gltf2AnyObject;
    extras: {
        rnEntities: ISceneGraphEntity[];
        rnEntitiesByNames: Map<string, ISceneGraphEntity>;
        [key: string]: any;
    };
};
interface RnM2Scene extends Gltf2Scene {
    nodesObjects?: RnM2Node[];
    sceneObject?: RnM2Node;
}
type RnM2AttributesObject = {
    [s: string]: RnM2Accessor;
};
type RnM2Attributes = {
    [s: string]: number;
};
type RnM2AttributeAccessors = {
    [s: string]: RnM2Accessor;
};
type RnM2AttributeBlendShapes = RnM2Attributes[];
type RnM2AttributeBlendShapesAccessors = RnM2AttributeAccessors[];
type RnM2MaterialVariant = {
    materialObject: RnM2Material;
    material: number;
    variants: string[];
};
interface RnM2Primitive extends Gltf2Primitive {
    attributesObjects?: RnM2AttributeAccessors;
    attributesNames?: {
        [s: string]: string;
    };
    indicesObject?: RnM2Accessor;
    materialObject?: RnM2Material;
    materialVariants?: RnM2MaterialVariant[];
    materialName?: string;
    targetsObjects?: RnM2AttributeBlendShapesAccessors;
    targets?: RnM2AttributeBlendShapes;
}
interface RnM2Mesh extends Gltf2Mesh {
    primitives: RnM2Primitive[];
}
interface RnM2Node extends Gltf2Node {
    cameraObject?: RnM2Camera;
    childrenObjects?: RnM2Node[];
    parent?: number;
    parentObject?: RnM2Node;
    skinObject?: RnM2Skin;
    skinName?: string;
    meshObject?: RnM2Mesh;
    meshNames?: string[];
}
interface RnM2Skin extends Gltf2Skin {
    inverseBindMatricesObject?: RnM2Accessor;
    skeletonObject?: RnM2Node;
    jointsObjects: RnM2Node[];
}
interface RnM2TextureInfo extends Gltf2TextureInfo {
    texture?: RnM2Texture;
}
interface RnM2OcclusionTextureInfo extends Gltf2OcclusionTextureInfo {
    texture?: RnM2Texture;
}
interface RnM2NormalTextureInfo extends Gltf2NormalTextureInfo {
    texture?: RnM2Texture;
}
interface RnM2PbrMetallicRoughness extends Gltf2PbrMetallicRoughness {
    baseColorTexture?: RnM2TextureInfo;
    metallicRoughnessTexture?: RnM2TextureInfo;
}
interface RnM2Material extends Gltf2Material {
    pbrMetallicRoughness?: RnM2PbrMetallicRoughness;
    normalTexture?: RnM2NormalTextureInfo;
    occlusionTexture?: RnM2OcclusionTextureInfo;
    emissiveTexture?: RnM2TextureInfo;
}
interface RnM2CameraOrthographic extends Gltf2CameraOrthographic {
}
interface RnM2CameraPerspective extends Gltf2CameraPerspective {
}
interface RnM2Camera extends Gltf2Camera {
}
interface RnM2Image extends Gltf2Image {
}
interface RnM2AnimationChannelTarget extends Gltf2AnimationChannelTarget {
    nodeObject?: RnM2Node;
}
interface RnM2AnimationChannel extends Gltf2AnimationChannel {
    target: RnM2AnimationChannelTarget;
    samplerObject?: RnM2AnimationSampler;
}
interface RnM2AnimationSampler extends Gltf2AnimationSampler {
    inputObject?: RnM2Accessor;
    outputObject?: RnM2Accessor;
}
interface RnM2Animation extends Gltf2Animation {
    channels: RnM2AnimationChannel[];
    samplers: RnM2AnimationSampler[];
    parameters: {
        [s: string]: any;
    };
}
interface RnM2Texture extends Gltf2Texture {
    samplerObject?: RnM2TextureSampler;
    sourceObject?: RnM2Image;
}
interface RnM2TextureSampler extends Gltf2TextureSampler {
}
interface RnM2SparseValues extends Gltf2SparseValues {
    bufferViewObject: RnM2BufferView;
}
interface RnM2SparseIndices extends Gltf2SparseIndices {
    bufferViewObject: RnM2BufferView;
}
interface RnM2Sparse extends Gltf2Sparse {
    indices?: RnM2SparseIndices;
    values?: RnM2SparseValues;
}
interface RnM2Accessor extends Gltf2Accessor {
    bufferViewObject?: RnM2BufferView;
    bufferViewName?: string;
    sparse?: RnM2Sparse;
    accessor?: Accessor;
    extras?: {
        typedDataArray?: Float32Array;
        componentN?: number;
        componentBytes?: number;
        dataViewMethod?: string;
        weightsArrayLength?: number;
        quaternionIfVec4?: boolean;
    };
}
interface RnM2Buffer extends Gltf2Buffer {
    bufferPromise?: RnPromise<ArrayBuffer>;
}
interface RnM2BufferView extends Gltf2BufferView {
    bufferObject?: RnM2Buffer;
    bufferName?: string;
    rnAccessor?: Accessor;
}
interface RnM2Asset extends Gltf2Asset {
    extras?: {
        rnLoaderOptions?: GltfLoadOption;
        rnEntities?: ISceneGraphEntity[];
        rnMaterials?: {
            [s: string]: Material;
        };
        version?: string;
        fileType?: string;
    };
}
type RnM2ExtensionEffekseer = {
    effects: RnM2ExtensionsEffekseerEffect[];
};
type RnM2ExtensionsEffekseerEffect = {
    node: number;
    name?: string;
    uri?: string;
    bufferView?: number;
    timelines?: RnM2ExtensionsEffekseerTimeline[];
};
type RnM2ExtensionsEffekseerTimeline = {
    name?: string;
    values: RnM2ExtensionsEffekseerTimelineItem[];
};
type RnM2ExtensionsEffekseerTimelineItem = {
    input: number;
    event: 'play' | 'stop' | 'pause';
};

type Vrm0xHumanBone = {
    bone: string;
    node: number;
    name?: string;
    useDefaultValues: boolean;
};
type Vrm0xLookAt = {
    curve: number[];
    xRange: number;
    yRange: number;
};
type Vrm0xBlendShapeBind = {
    mesh: number;
    index: number;
    weight: number;
};
type Vrm0xBlendShapeGroup = {
    name: string;
    presetName: string;
    isBinary: boolean;
    binds: Vrm0xBlendShapeBind[];
    materialValues: [];
};
type Vrm0xBoneGroup = {
    comment: string;
    stiffiness: number;
    gravityPower: number;
    gravityDir: {
        x: number;
        y: number;
        z: number;
    };
    dragForce: number;
    center: number;
    hitRadius: number;
    bones: number[];
    colliderGroups: number[];
};
type Vrm0xCollider = {
    offset: {
        x: number;
        y: number;
        z: number;
    };
    radius: number;
};
type Vrm0xColliderGroup = {
    node: number;
    colliders: Vrm0xCollider[];
};
type Vrm0xMaterialProperty = {
    name: string;
    renderQueue: number;
    shader: string;
    floatProperties: {
        _Cutoff: number;
        _BumpScale: number;
        _ReceiveShadowRate: number;
        _ShadingGradeRate: number;
        _ShadeShift: number;
        _ShadeToony: number;
        _LightColorAttenuation: number;
        _IndirectLightIntensity: number;
        _RimLightingMix: number;
        _RimFresnelPower: number;
        _RimLift: number;
        _OutlineWidth: number;
        _OutlineScaledMaxDistance: number;
        _OutlineLightingMix: number;
        _UvAnimScrollX: number;
        _UvAnimScrollY: number;
        _UvAnimRotation: number;
        _DebugMode: number;
        _BlendMode: number;
        _OutlineWidthMode: number;
        _OutlineColorMode: number;
        _CullMode: number;
        _OutlineCullMode: number;
        _SrcBlend: number;
        _DstBlend: number;
        _ZWrite: number;
    };
    vectorProperties: {
        _Color: Array4<number>;
        _ShadeColor: Array3<number>;
        _MainTex: Array4<number>;
        _ShadeTexture: Array4<number>;
        _BumpMap: Array4<number>;
        _ReceiveShadowTexture: Array4<number>;
        _ShadingGradeTexture: Array4<number>;
        _SphereAdd: Array4<number>;
        _EmissionColor: Array3<number>;
        _EmissionMap: Array4<number>;
        _OutlineWidthTexture: Array4<number>;
        _OutlineColor: Array4<number>;
        _RimColor: Array3<number>;
    };
    textureProperties: {
        _MainTex: number;
        _ShadeTexture: number;
        _BumpMap: number;
        _SphereAdd: number;
        _EmissionMap: number;
        _OutlineWidthTexture: number;
        _ReceiveShadowTexture: number;
        _RimTexture: number;
        _ShadingGradeTexture: number;
        _UvAnimMaskTexture: number;
    };
};
interface VRM0x_Extension {
    exporterVersion: string;
    meta: {
        version: string;
        author: string;
        contactInformation: string;
        reference: string;
        title: string;
        texture: 30;
        allowedUserName: string;
        violentUsageName: string;
        sexualUsageName: string;
        commercialUsageName: string;
        otherPermissionUrl: string;
        licenseName: string;
        otherLicenseUrl: string;
    };
    humanoid: {
        humanBones: Vrm0xHumanBone[];
        armStretch: number;
        legStretch: number;
        upperArmTwist: number;
        lowerArmTwist: number;
        upperLegTwist: number;
        lowerLegTwist: number;
        feetSpacing: number;
        hasTranslationDoF: false;
    };
    firstPerson: {
        firstPersonBone: number;
        firstPersonBoneOffset: {
            x: number;
            y: number;
            z: number;
        };
        meshAnnotations: [];
        lookAtTypeName: string;
        lookAtHorizontalInner: Vrm0xLookAt;
        lookAtHorizontalOuter: Vrm0xLookAt;
        lookAtVerticalDown: Vrm0xLookAt;
        lookAtVerticalUP: Vrm0xLookAt;
    };
    blendShapeMaster: {
        blendShapeGroups: Vrm0xBlendShapeGroup[];
    };
    secondaryAnimation: {
        boneGroups: Vrm0xBoneGroup[];
        colliderGroups: Vrm0xColliderGroup[];
    };
    materialProperties: Vrm0xMaterialProperty[];
}
interface Vrm0x extends RnM2 {
    extensions: {
        VRM: VRM0x_Extension;
    };
}

/**
 * Passed to clear to clear the current depth buffer.
 * @constant {number}
 */
declare const GL_DEPTH_BUFFER_BIT = 256;
/**
 * Passed to clear to clear the current stencil buffer.
 * @constant {number}
 */
declare const GL_STENCIL_BUFFER_BIT = 1024;
/**
 * Passed to clear to clear the current color buffer.
 * @constant {number}
 */
declare const GL_COLOR_BUFFER_BIT = 16384;
/**
 * Passed to drawElements or drawArrays to draw single points.
 * @constant {number}
 */
declare const GL_POINTS = 0;
/**
 * Passed to drawElements or drawArrays to draw lines. Each vertex connects to the one after it.
 * @constant {number}
 */
declare const GL_LINES = 1;
/**
 * Passed to drawElements or drawArrays to draw lines. Each set of two vertices is treated as a separate line segment.
 * @constant {number}
 */
declare const GL_LINE_LOOP = 2;
/**
 * Passed to drawElements or drawArrays to draw a connected group of line segments from the first vertex to the last.
 * @constant {number}
 */
declare const GL_LINE_STRIP = 3;
/**
 * Passed to drawElements or drawArrays to draw triangles. Each set of three vertices creates a separate triangle.
 * @constant {number}
 */
declare const GL_TRIANGLES = 4;
/**
 * Passed to drawElements or drawArrays to draw a connected group of triangles.
 * @constant {number}
 */
declare const GL_TRIANGLE_STRIP = 5;
/**
 * Passed to drawElements or drawArrays to draw a connected group of triangles. Each vertex connects to the previous and the first vertex in the fan.
 * @constant {number}
 */
declare const GL_TRIANGLE_FAN = 6;
/**
 * Passed to blendFunc or blendFuncSeparate to turn off a component.
 * @constant {number}
 */
declare const GL_ZERO = 0;
/**
 * Passed to blendFunc or blendFuncSeparate to turn on a component.
 * @constant {number}
 */
declare const GL_ONE = 1;
/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by the source elements color.
 * @constant {number}
 */
declare const GL_SRC_COLOR = 768;
/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the source elements color.
 * @constant {number}
 */
declare const GL_ONE_MINUS_SRC_COLOR = 769;
/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by the source's alpha.
 * @constant {number}
 */
declare const GL_SRC_ALPHA = 770;
/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the source's alpha.
 * @constant {number}
 */
declare const GL_ONE_MINUS_SRC_ALPHA = 771;
/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by the destination's alpha.
 * @constant {number}
 */
declare const GL_DST_ALPHA = 772;
/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the destination's alpha.
 * @constant {number}
 */
declare const GL_ONE_MINUS_DST_ALPHA = 773;
/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by the destination's color.
 * @constant {number}
 */
declare const GL_DST_COLOR = 774;
/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the destination's color.
 * @constant {number}
 */
declare const GL_ONE_MINUS_DST_COLOR = 775;
/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by the minimum of source's alpha or one minus the destination's alpha.
 * @constant {number}
 */
declare const GL_SRC_ALPHA_SATURATE = 776;
/**
 * Passed to blendFunc or blendFuncSeparate to specify a constant color blend function.
 * @constant {number}
 */
declare const GL_CONSTANT_COLOR = 32769;
/**
 * Passed to blendFunc or blendFuncSeparate to specify one minus a constant color blend function.
 * @constant {number}
 */
declare const GL_ONE_MINUS_CONSTANT_COLOR = 32770;
/**
 * Passed to blendFunc or blendFuncSeparate to specify a constant alpha blend function.
 * @constant {number}
 */
declare const GL_CONSTANT_ALPHA = 32771;
/**
 * Passed to blendFunc or blendFuncSeparate to specify one minus a constant alpha blend function.
 * @constant {number}
 */
declare const GL_ONE_MINUS_CONSTANT_ALPHA = 32772;
/**
 * Passed to blendEquation or blendEquationSeparate to set an addition blend function.
 * @constant {number}
 */
declare const GL_FUNC_ADD = 32774;
/**
 * Passed to blendEquation or blendEquationSeparate to specify a subtraction blend function (source - destination).
 * @constant {number}
 */
declare const GL_FUNC_SUBSTRACT = 32778;
/**
 * Passed to blendEquation or blendEquationSeparate to specify a reverse subtraction blend function (destination - source).
 * @constant {number}
 */
declare const GL_FUNC_REVERSE_SUBTRACT = 32779;
/**
 * Passed to getParameter to get the current RGB blend function.
 * @constant {number}
 */
declare const GL_BLEND_EQUATION = 32777;
/**
 * Passed to getParameter to get the current RGB blend function. Same as BLEND_EQUATION.
 * @constant {number}
 */
declare const GL_BLEND_EQUATION_RGB = 32777;
/**
 * Passed to getParameter to get the current alpha blend function. Same as BLEND_EQUATION.
 * @constant {number}
 */
declare const GL_BLEND_EQUATION_ALPHA = 34877;
/**
 * Passed to getParameter to get the current destination RGB blend function.
 * @constant {number}
 */
declare const GL_BLEND_DST_RGB = 32968;
/**
 * Passed to getParameter to get the current source RGB blend function.
 * @constant {number}
 */
declare const GL_BLEND_SRC_RGB = 32969;
/**
 * Passed to getParameter to get the current destination alpha blend function.
 * @constant {number}
 */
declare const GL_BLEND_DST_ALPHA = 32970;
/**
 * Passed to getParameter to get the current source alpha blend function.
 * @constant {number}
 */
declare const GL_BLEND_SRC_ALPHA = 32971;
/**
 * Passed to getParameter to return a the current blend color.
 * @constant {number}
 */
declare const GL_BLEND_COLOR = 32773;
/**
 * Passed to getParameter to get the array buffer binding.
 * @constant {number}
 */
declare const GL_ARRAY_BUFFER_BINDING = 34964;
/**
 * Passed to getParameter to get the current element array buffer.
 * @constant {number}
 */
declare const GL_ELEMENT_ARRAY_BUFFER_BINDING = 34965;
/**
 * Passed to getParameter to get the current lineWidth (set by the lineWidth method).
 * @constant {number}
 */
declare const GL_LINE_WIDTH = 2849;
/**
 * Passed to getParameter to get the current size of a point drawn with gl.POINTS.
 * @constant {number}
 */
declare const GL_ALIASED_POINT_SIZE_RANGE = 33901;
/**
 * Passed to getParameter to get the range of available widths for a line. Returns a length-2 array with the lo value at 0, and hight at 1.
 * @constant {number}
 */
declare const GL_ALIASED_LINE_WIDTH_RANGE = 33902;
/**
 * Passed to getParameter to get the current value of cullFace. Should return FRONT, BACK, or FRONT_AND_BACK.
 * @constant {number}
 */
declare const GL_CULL_FACE_MODE = 2885;
/**
 * Passed to getParameter to determine the current value of frontFace. Should return CW or CCW.
 * @constant {number}
 */
declare const GL_FRONT_FACE = 2886;
/**
 * Passed to getParameter to return a length-2 array of floats giving the current depth range.
 * @constant {number}
 */
declare const GL_DEPTH_RANGE = 2928;
/**
 * Passed to getParameter to determine if the depth write mask is enabled.
 * @constant {number}
 */
declare const GL_DEPTH_WRITEMASK = 2930;
/**
 * Passed to getParameter to determine the current depth clear value.
 * @constant {number}
 */
declare const GL_DEPTH_CLEAR_VALUE = 2931;
/**
 * Passed to getParameter to get the current depth function. Returns NEVER, ALWAYS, LESS, EQUAL, LEQUAL, GREATER, GEQUAL, or NOTEQUAL.
 * @constant {number}
 */
declare const GL_DEPTH_FUNC = 2932;
/**
 * Passed to getParameter to get the value the stencil will be cleared to.
 * @constant {number}
 */
declare const GL_STENCIL_CLEAR_VALUE = 2961;
/**
 * Passed to getParameter to get the current stencil function. Returns NEVER, ALWAYS, LESS, EQUAL, LEQUAL, GREATER, GEQUAL, or NOTEQUAL.
 * @constant {number}
 */
declare const GL_STENCIL_FUNC = 2962;
/**
 * Passed to getParameter to get the current stencil fail function. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP.
 * @constant {number}
 */
declare const GL_STENCIL_FAIL = 2964;
/**
 * Passed to getParameter to get the current stencil fail function should the depth buffer test fail. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP.
 * @constant {number}
 */
declare const GL_STENCIL_PASS_DEPTH_FAIL = 2965;
/**
 * Passed to getParameter to get the current stencil fail function should the depth buffer test pass. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP.
 * @constant {number}
 */
declare const GL_STENCIL_PASS_DEPTH_PASS = 2966;
/**
 * Passed to getParameter to get the reference value used for stencil tests.
 * @constant {number}
 */
declare const GL_STENCIL_REF = 2967;
/**
 * @constant {number}
 */
declare const GL_STENCIL_VALUE_MASK = 2963;
/**
 * @constant {number}
 */
declare const GL_STENCIL_WRITEMASK = 2968;
/**
 * @constant {number}
 */
declare const GL_STENCIL_BACK_FUNC = 34816;
/**
 * @constant {number}
 */
declare const GL_STENCIL_BACK_FAIL = 34817;
/**
 * @constant {number}
 */
declare const GL_STENCIL_BACK_PASS_DEPTH_FAIL = 34818;
/**
 * @constant {number}
 */
declare const GL_STENCIL_BACK_PASS_DEPTH_PASS = 34819;
/**
 * @constant {number}
 */
declare const GL_STENCIL_BACK_REF = 36003;
/**
 * @constant {number}
 */
declare const GL_STENCIL_BACK_VALUE_MASK = 36004;
/**
 * @constant {number}
 */
declare const GL_STENCIL_BACK_WRITEMASK = 36005;
/**
 * Returns an Int32Array with four elements for the current viewport dimensions.
 * @constant {number}
 */
declare const GL_VIEWPORT = 2978;
/**
 * Returns an Int32Array with four elements for the current scissor box dimensions.
 * @constant {number}
 */
declare const GL_SCISSOR_BOX = 3088;
/**
 * @constant {number}
 */
declare const GL_COLOR_CLEAR_VALUE = 3106;
/**
 * @constant {number}
 */
declare const GL_COLOR_WRITEMASK = 3107;
/**
 * @constant {number}
 */
declare const GL_UNPACK_ALIGNMENT = 3317;
/**
 * @constant {number}
 */
declare const GL_PACK_ALIGNMENT = 3333;
/**
 * @constant {number}
 */
declare const GL_MAX_TEXTURE_SIZE = 3379;
/**
 * @constant {number}
 */
declare const GL_MAX_VIEWPORT_DIMS = 3386;
/**
 * @constant {number}
 */
declare const GL_SUBPIXEL_BITS = 3408;
/**
 * @constant {number}
 */
declare const GL_RED_BITS = 3410;
/**
 * @constant {number}
 */
declare const GL_GREEN_BITS = 3411;
/**
 * @constant {number}
 */
declare const GL_BLUE_BITS = 3412;
/**
 * @constant {number}
 */
declare const GL_ALPHA_BITS = 3413;
/**
 * @constant {number}
 */
declare const GL_DEPTH_BITS = 3414;
/**
 * @constant {number}
 */
declare const GL_STENCIL_BITS = 3415;
/**
 * @constant {number}
 */
declare const GL_POLYGON_OFFSET_UNITS = 10752;
/**
 * @constant {number}
 */
declare const GL_POLYGON_OFFSET_FACTOR = 32824;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_BINDING_2D = 32873;
/**
 * @constant {number}
 */
declare const GL_SAMPLE_BUFFERS = 32936;
/**
 * @constant {number}
 */
declare const GL_SAMPLES = 32937;
/**
 * @constant {number}
 */
declare const GL_SAMPLE_COVERAGE_VALUE = 32938;
/**
 * @constant {number}
 */
declare const GL_SAMPLE_COVERAGE_INVERT = 32939;
/**
 * @constant {number}
 */
declare const GL_COMPRESSED_TEXTURE_FORMATS = 34467;
/**
 * @constant {number}
 */
declare const GL_VENDOR = 7936;
/**
 * @constant {number}
 */
declare const GL_RENDERER = 7937;
/**
 * @constant {number}
 */
declare const GL_VERSION = 7938;
/**
 * @constant {number}
 */
declare const GL_IMPLEMENTATION_COLOR_READ_TYPE = 35738;
/**
 * @constant {number}
 */
declare const GL_IMPLEMENTATION_COLOR_READ_FORMAT = 35739;
/**
 * @constant {number}
 */
declare const GL_BROWSER_DEFAULT_WEBGL = 37444;
/**
 * Passed to bufferData as a hint about whether the contents of the buffer are likely to be used often and not change often.
 * @constant {number}
 */
declare const GL_STATIC_DRAW = 35044;
/**
 * Passed to bufferData as a hint about whether the contents of the buffer are likely to not be used often.
 * @constant {number}
 */
declare const GL_STREAM_DRAW = 35040;
/**
 * Passed to bufferData as a hint about whether the contents of the buffer are likely to be used often and change often.
 * @constant {number}
 */
declare const GL_DYNAMIC_DRAW = 35048;
/**
 * Passed to bindBuffer or bufferData to specify the type of buffer being used.
 * @constant {number}
 */
declare const GL_ARRAY_BUFFER = 34962;
/**
 * Passed to bindBuffer or bufferData to specify the type of buffer being used.
 * @constant {number}
 */
declare const GL_ELEMENT_ARRAY_BUFFER = 34963;
/**
 * Passed to getBufferParameter to get a buffer's size.
 * @constant {number}
 */
declare const GL_BUFFER_SIZE = 34660;
/**
 * Passed to getBufferParameter to get the hint for the buffer passed in when it was created.
 * @constant {number}
 */
declare const GL_BUFFER_USAGE = 34661;
/**
 * Passed to getVertexAttrib to read back the current vertex attribute.
 * @constant {number}
 */
declare const GL_CURRENT_VERTEX_ATTRIB = 34342;
/**
 * @constant {number}
 */
declare const GL_VERTEX_ATTRIB_ARRAY_ENABLED = 34338;
/**
 * @constant {number}
 */
declare const GL_VERTEX_ATTRIB_ARRAY_SIZE = 34339;
/**
 * @constant {number}
 */
declare const GL_VERTEX_ATTRIB_ARRAY_STRIDE = 34340;
/**
 * @constant {number}
 */
declare const GL_VERTEX_ATTRIB_ARRAY_TYPE = 34341;
/**
 * @constant {number}
 */
declare const GL_VERTEX_ATTRIB_ARRAY_NORMALIZED = 34922;
/**
 * @constant {number}
 */
declare const GL_VERTEX_ATTRIB_ARRAY_POINTER = 34373;
/**
 * @constant {number}
 */
declare const GL_VERTEX_ATTRIB_ARRAY_BUFFER_BINDING = 34975;
/**
 * Passed to enable/disable to turn on/off culling. Can also be used with getParameter to find the current culling method.
 * @constant {number}
 */
declare const GL_CULL_FACE = 2884;
/**
 * Passed to cullFace to specify that only front faces should be culled.
 * @constant {number}
 */
declare const GL_FRONT = 1028;
/**
 * Passed to cullFace to specify that only back faces should be culled.
 * @constant {number}
 */
declare const GL_BACK = 1029;
/**
 * Passed to cullFace to specify that front and back faces should be culled.
 * @constant {number}
 */
declare const GL_FRONT_AND_BACK = 1032;
/**
 * Passed to enable/disable to turn on/off blending. Can also be used with getParameter to find the current blending method.
 * @constant {number}
 */
declare const GL_BLEND = 3042;
/**
 * Passed to enable/disable to turn on/off the depth test. Can also be used with getParameter to query the depth test.
 * @constant {number}
 */
declare const GL_DEPTH_TEST = 2929;
/**
 * Passed to enable/disable to turn on/off dithering. Can also be used with getParameter to find the current dithering method.
 * @constant {number}
 */
declare const GL_DITHER = 3024;
/**
 * Passed to enable/disable to turn on/off the polygon offset. Useful for rendering hidden-line images, decals, and or solids with highlighted edges. Can also be used with getParameter to query the scissor test.
 * @constant {number}
 */
declare const GL_POLYGON_OFFSET_FILL = 32823;
/**
 * Passed to enable/disable to turn on/off the alpha to coverage. Used in multi-sampling alpha channels.
 * @constant {number}
 */
declare const GL_SAMPLE_ALPHA_TO_COVERAGE = 32926;
/**
 * Passed to enable/disable to turn on/off the sample coverage. Used in multi-sampling.
 * @constant {number}
 */
declare const GL_SAMPLE_COVERAGE = 32928;
/**
 * Passed to enable/disable to turn on/off the scissor test. Can also be used with getParameter to query the scissor test.
 * @constant {number}
 */
declare const GL_SCISSOR_TEST = 3089;
/**
 * Passed to enable/disable to turn on/off the stencil test. Can also be used with getParameter to query the stencil test.
 * @constant {number}
 */
declare const GL_STENCIL_TEST = 2960;
/**
 * Returned from getError.
 * @constant {number}
 */
declare const GL_NO_ERROR = 0;
/**
 * Returned from getError.
 * @constant {number}
 */
declare const GL_INVALID_ENUM = 1280;
/**
 * Returned from getError.
 * @constant {number}
 */
declare const GL_INVALID_VALUE = 1281;
/**
 * Returned from getError.
 * @constant {number}
 */
declare const GL_INVALID_OPERATION = 1282;
/**
 * Returned from getError.
 * @constant {number}
 */
declare const GL_OUT_OF_MEMORY = 1285;
/**
 * Returned from getError.
 * @constant {number}
 */
declare const GL_CONTEXT_LOST_WEBGL = 37442;
/**
 * Passed to frontFace to specify the front face of a polygon is drawn in the clockwise direction,
 * @constant {number}
 */
declare const GL_CW = 2304;
/**
 * Passed to frontFace to specify the front face of a polygon is drawn in the counter clockwise direction.
 * @constant {number}
 */
declare const GL_CCW = 2305;
/**
 * There is no preference for this behavior.
 * @constant {number}
 */
declare const GL_DONT_CARE = 4352;
/**
 * The most efficient behavior should be used.
 * @constant {number}
 */
declare const GL_FASTEST = 4353;
/**
 * The most correct or the highest quality option should be used.
 * @constant {number}
 */
declare const GL_NICEST = 4354;
/**
 * Hint for the quality of filtering when generating mipmap images with WebGLRenderingContext.generateMipmap().
 * @constant {number}
 */
declare const GL_GENERATE_MIPMAP_HINT = 33170;
/**
 * @constant {number}
 */
declare const GL_DATA_BYTE = 5120;
/**
 * @constant {number}
 */
declare const GL_DATA_UNSIGNED_BYTE = 5121;
/**
 * @constant {number}
 */
declare const GL_DATA_SHORT = 5122;
/**
 * @constant {number}
 */
declare const GL_DATA_UNSIGNED_SHORT = 5123;
/**
 * @constant {number}
 */
declare const GL_DATA_INT = 5124;
/**
 * @constant {number}
 */
declare const GL_DATA_UNSIGNED_INT = 5125;
/**
 * @constant {number}
 */
declare const GL_DATA_FLOAT = 5126;
/**
 * @constant {number}
 */
declare const GL_DEPTH_COMPONENT = 6402;
/**
 * @constant {number}
 */
declare const GL_ALPHA = 6406;
/**
 * @constant {number}
 */
declare const GL_RGB = 6407;
/**
 * @constant {number}
 */
declare const GL_RGBA = 6408;
/**
 * @constant {number}
 */
declare const GL_LUMINANCE = 6409;
/**
 * @constant {number}
 */
declare const GL_LUMINANCE_ALPHA = 6410;
/**
 * @constant {number}
 */
declare const GL_PIXEL_UNSIGNED_BYTE = 5121;
/**
 * @constant {number}
 */
declare const GL_PIXEL_UNSIGNED_SHORT_4_4_4_4 = 32819;
/**
 * @constant {number}
 */
declare const GL_PIXEL_UNSIGNED_SHORT_5_5_5_1 = 32820;
/**
 * @constant {number}
 */
declare const GL_PIXEL_UNSIGNED_SHORT_5_6_5 = 33635;
/**
 * Passed to createShader to define a fragment shader.
 * @constant {number}
 */
declare const GL_FRAGMENT_SHADER = 35632;
/**
 * Passed to createShader to define a vertex shader.
 * @constant {number}
 */
declare const GL_VERTEX_SHADER = 35633;
/**
 * Passed to getShaderParamter to get the status of the compilation. Returns false if the shader was not compiled. You can then query getShaderInfoLog to find the exact error.
 * @constant {number}
 */
declare const GL_COMPILE_STATUS = 35713;
/**
 * Passed to getShaderParamter to determine if a shader was deleted via deleteShader. Returns true if it was, false otherwise.
 * @constant {number}
 */
declare const GL_DELETE_STATUS = 35712;
/**
 * Passed to getProgramParameter after calling linkProgram to determine if a program was linked correctly. Returns false if there were errors. Use getProgramInfoLog to find the exact error.
 * @constant {number}
 */
declare const GL_LINK_STATUS = 35714;
/**
 * Passed to getProgramParameter after calling validateProgram to determine if it is valid. Returns false if errors were found.
 * @constant {number}
 */
declare const GL_VALIDATE_STATUS = 35715;
/**
 * Passed to getProgramParameter after calling attachShader to determine if the shader was attached correctly. Returns false if errors occurred.
 * @constant {number}
 */
declare const GL_ATTACHED_SHADERS = 35717;
/**
 * Passed to getProgramParameter to get the number of attributes active in a program.
 * @constant {number}
 */
declare const GL_ACTIVE_ATTRIBUTES = 35721;
/**
 * Passed to getProgramParamter to get the number of uniforms active in a program.
 * @constant {number}
 */
declare const GL_ACTIVE_UNIFORMS = 35718;
/**
 * The maximum number of entries possible in the vertex attribute list.
 * @constant {number}
 */
declare const GL_MAX_VERTEX_ATTRIBS = 34921;
/**
 * @constant {number}
 */
declare const GL_MAX_VERTEX_UNIFORM_VECTORS = 36347;
/**
 * @constant {number}
 */
declare const GL_MAX_VARYING_VECTORS = 36348;
/**
 * @constant {number}
 */
declare const GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS = 35661;
/**
 * @constant {number}
 */
declare const GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS = 35660;
/**
 * Implementation dependent number of maximum texture units. At least 8.
 * @constant {number}
 */
declare const GL_MAX_TEXTURE_IMAGE_UNITS = 34930;
/**
 * @constant {number}
 */
declare const GL_MAX_FRAGMENT_UNIFORM_VECTORS = 36349;
/**
 * @constant {number}
 */
declare const GL_SHADER_TYPE = 35663;
/**
 * @constant {number}
 */
declare const GL_SHADING_LANGUAGE_VERSION = 35724;
/**
 * @constant {number}
 */
declare const GL_CURRENT_PROGRAM = 35725;
/**
 * Passed to depthFunction or stencilFunction to specify depth or stencil tests will never pass. i.e. Nothing will be drawn.
 * @constant {number}
 */
declare const GL_NEVER = 512;
/**
 * Passed to depthFunction or stencilFunction to specify depth or stencil tests will always pass. i.e. Pixels will be drawn in the order they are drawn.
 * @constant {number}
 */
declare const GL_ALWAYS = 519;
/**
 * Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than the stored value.
 * @constant {number}
 */
declare const GL_LESS = 513;
/**
 * Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is equals to the stored value.
 * @constant {number}
 */
declare const GL_EQUAL = 514;
/**
 *  Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than or equal to the stored value.
 * @constant {number}
 */
declare const GL_LEQUAL = 515;
/**
 * Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than the stored value.
 * @constant {number}
 */
declare const GL_GREATER = 516;
/**
 * Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than or equal to the stored value.
 * @constant {number}
 */
declare const GL_GEQUAL = 518;
/**
 * Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is not equal to the stored value.
 * @constant {number}
 */
declare const GL_NOTEQUAL = 517;
/**
 * @constant {number}
 */
declare const GL_KEEP = 7680;
/**
 * @constant {number}
 */
declare const GL_REPLACE = 7681;
/**
 * @constant {number}
 */
declare const GL_INCR = 7682;
/**
 * @constant {number}
 */
declare const GL_DECR = 7683;
/**
 * @constant {number}
 */
declare const GL_INVERT = 5386;
/**
 * @constant {number}
 */
declare const GL_INCR_WRAP = 34055;
/**
 * @constant {number}
 */
declare const GL_DECR_WRAP = 34056;
/**
 * @constant {number}
 */
declare const GL_NEAREST = 9728;
/**
 * @constant {number}
 */
declare const GL_LINEAR = 9729;
/**
 * @constant {number}
 */
declare const GL_NEAREST_MIPMAP_NEAREST = 9984;
/**
 * @constant {number}
 */
declare const GL_LINEAR_MIPMAP_NEAREST = 9985;
/**
 * @constant {number}
 */
declare const GL_NEAREST_MIPMAP_LINEAR = 9986;
/**
 * @constant {number}
 */
declare const GL_LINEAR_MIPMAP_LINEAR = 9987;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_MAG_FILTER = 10240;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_MIN_FILTER = 10241;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_WRAP_S = 10242;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_WRAP_T = 10243;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_2D = 3553;
/**
 * @constant {number}
 */
declare const GL_TEXTURE = 5890;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_CUBE_MAP = 34067;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_BINDING_CUBE_MAP = 34068;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_CUBE_MAP_POSITIVE_X = 34069;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_CUBE_MAP_NEGATIVE_X = 34070;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_CUBE_MAP_POSITIVE_Y = 34071;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_CUBE_MAP_NEGATIVE_Y = 34072;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_CUBE_MAP_POSITIVE_Z = 34073;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_CUBE_MAP_NEGATIVE_Z = 34074;
/**
 * @constant {number}
 */
declare const GL_MAX_CUBE_MAP_TEXTURE_SIZE = 34076;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE0 = 33984;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE1 = 33985;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE2 = 33986;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE3 = 33987;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE4 = 33988;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE5 = 33989;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE6 = 33990;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE7 = 33991;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE8 = 33992;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE9 = 33993;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE10 = 33994;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE11 = 33995;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE12 = 33996;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE13 = 33997;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE14 = 33998;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE15 = 33999;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE16 = 34000;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE17 = 34001;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE18 = 34002;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE19 = 34003;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE20 = 34004;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE21 = 34005;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE22 = 34006;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE23 = 34007;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE24 = 34008;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE25 = 34009;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE26 = 34010;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE27 = 34011;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE28 = 34012;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE29 = 34013;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE30 = 34014;
/**
 * A texture unit.
 * @constant {number}
 */
declare const GL_TEXTURE31 = 34015;
/**
 * The current active texture unit.
 * @constant {number}
 */
declare const GL_ACTIVE_TEXTURE = 34016;
/**
 * @constant {number}
 */
declare const GL_REPEAT = 10497;
/**
 * @constant {number}
 */
declare const GL_CLAMP_TO_EDGE = 33071;
/**
 * @constant {number}
 */
declare const GL_MIRRORED_REPEAT = 33648;
/**
 * @constant {number}
 */
declare const GL_FLOAT_VEC2 = 35664;
/**
 * @constant {number}
 */
declare const GL_FLOAT_VEC3 = 35665;
/**
 * @constant {number}
 */
declare const GL_FLOAT_VEC4 = 35666;
/**
 * @constant {number}
 */
declare const GL_INT_VEC2 = 35667;
/**
 * @constant {number}
 */
declare const GL_INT_VEC3 = 35668;
/**
 * @constant {number}
 */
declare const GL_INT_VEC4 = 35669;
/**
 * @constant {number}
 */
declare const GL_BOOL = 35670;
/**
 * @constant {number}
 */
declare const GL_BOOL_VEC2 = 35671;
/**
 * @constant {number}
 */
declare const GL_BOOL_VEC3 = 35672;
/**
 * @constant {number}
 */
declare const GL_BOOL_VEC4 = 35673;
/**
 * @constant {number}
 */
declare const GL_FLOAT_MAT2 = 35674;
/**
 * @constant {number}
 */
declare const GL_FLOAT_MAT3 = 35675;
/**
 * @constant {number}
 */
declare const GL_FLOAT_MAT4 = 35676;
/**
 * @constant {number}
 */
declare const GL_SAMPLER_2D = 35678;
/**
 * @constant {number}
 */
declare const GL_SAMPLER_CUBE = 35680;
/**
 * @constant {number}
 */
declare const GL_LOW_FLOAT = 36336;
/**
 * @constant {number}
 */
declare const GL_MEDIUM_FLOAT = 36337;
/**
 * @constant {number}
 */
declare const GL_HIGH_FLOAT = 36338;
/**
 * @constant {number}
 */
declare const GL_LOW_INT = 36339;
/**
 * @constant {number}
 */
declare const GL_MEDIUM_INT = 36340;
/**
 * @constant {number}
 */
declare const GL_HIGH_INT = 36341;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER = 36160;
/**
 * @constant {number}
 */
declare const GL_RENDERBUFFER = 36161;
/**
 * @constant {number}
 */
declare const GL_RGBA4 = 32854;
/**
 * @constant {number}
 */
declare const GL_RGB5_A1 = 32855;
/**
 * @constant {number}
 */
declare const GL_RGB565 = 36194;
/**
 * @constant {number}
 */
declare const GL_DEPTH_COMPONENT16 = 33189;
/**
 * @constant {number}
 */
declare const GL_STENCIL_INDEX = 6401;
/**
 * @constant {number}
 */
declare const GL_STENCIL_INDEX8 = 36168;
/**
 * @constant {number}
 */
declare const GL_DEPTH_STENCIL = 34041;
/**
 * @constant {number}
 */
declare const GL_RENDERBUFFER_WIDTH = 36162;
/**
 * @constant {number}
 */
declare const GL_RENDERBUFFER_HEIGHT = 36163;
/**
 * @constant {number}
 */
declare const GL_RENDERBUFFER_INTERNAL_FORMAT = 36164;
/**
 * @constant {number}
 */
declare const GL_RENDERBUFFER_RED_SIZE = 36176;
/**
 * @constant {number}
 */
declare const GL_RENDERBUFFER_GREEN_SIZE = 36177;
/**
 * @constant {number}
 */
declare const GL_RENDERBUFFER_BLUE_SIZE = 36178;
/**
 * @constant {number}
 */
declare const GL_RENDERBUFFER_ALPHA_SIZE = 36179;
/**
 * @constant {number}
 */
declare const GL_RENDERBUFFER_DEPTH_SIZE = 36180;
/**
 * @constant {number}
 */
declare const GL_RENDERBUFFER_STENCIL_SIZE = 36181;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE = 36048;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_ATTACHMENT_OBJECT_NAME = 36049;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL = 36050;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE = 36051;
/**
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT0 = 36064;
/**
 * @constant {number}
 */
declare const GL_DEPTH_ATTACHMENT = 36096;
/**
 * @constant {number}
 */
declare const GL_STENCIL_ATTACHMENT = 36128;
/**
 * @constant {number}
 */
declare const GL_DEPTH_STENCIL_ATTACHMENT = 33306;
/**
 * @constant {number}
 */
declare const GL_NONE = 0;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_COMPLETE = 36053;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 36054;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 36055;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 36057;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_UNSUPPORTED = 36061;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_BINDING = 36006;
/**
 * @constant {number}
 */
declare const GL_RENDERBUFFER_BINDING = 36007;
/**
 * @constant {number}
 */
declare const GL_MAX_RENDERBUFFER_SIZE = 34024;
/**
 * @constant {number}
 */
declare const GL_INVALID_FRAMEBUFFER_OPERATION = 1286;
/**
 * @constant {number}
 */
declare const GL_UNPACK_FLIP_Y_WEBGL = 37440;
/**
 * @constant {number}
 */
declare const GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL = 37441;
/**
 * @constant {number}
 */
declare const GL_UNPACK_COLORSPACE_CONVERSION_WEBGL = 37443;
/**
 * @constant {number}
 */
declare const GL_READ_BUFFER = 3074;
/**
 * @constant {number}
 */
declare const GL_UNPACK_ROW_LENGTH = 3314;
/**
 * @constant {number}
 */
declare const GL_UNPACK_SKIP_ROWS = 3315;
/**
 * @constant {number}
 */
declare const GL_UNPACK_SKIP_PIXELS = 3316;
/**
 * @constant {number}
 */
declare const GL_PACK_ROW_LENGTH = 3330;
/**
 * @constant {number}
 */
declare const GL_PACK_SKIP_ROWS = 3331;
/**
 * @constant {number}
 */
declare const GL_PACK_SKIP_PIXELS = 3332;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_BINDING_3D = 32874;
/**
 * @constant {number}
 */
declare const GL_UNPACK_SKIP_IMAGES = 32877;
/**
 * @constant {number}
 */
declare const GL_UNPACK_IMAGE_HEIGHT = 32878;
/**
 * @constant {number}
 */
declare const GL_MAX_3D_TEXTURE_SIZE = 32883;
/**
 * @constant {number}
 */
declare const GL_MAX_ELEMENTS_VERTICES = 33000;
/**
 * @constant {number}
 */
declare const GL_MAX_ELEMENTS_INDICES = 33001;
/**
 * @constant {number}
 */
declare const GL_MAX_TEXTURE_LOD_BIAS = 34045;
/**
 * @constant {number}
 */
declare const GL_MAX_FRAGMENT_UNIFORM_COMPONENTS = 35657;
/**
 * @constant {number}
 */
declare const GL_MAX_VERTEX_UNIFORM_COMPONENTS = 35658;
/**
 * @constant {number}
 */
declare const GL_MAX_ARRAY_TEXTURE_LAYERS = 35071;
/**
 * @constant {number}
 */
declare const GL_MIN_PROGRAM_TEXEL_OFFSET = 35076;
/**
 * @constant {number}
 */
declare const GL_MAX_PROGRAM_TEXEL_OFFSET = 35077;
/**
 * @constant {number}
 */
declare const GL_MAX_VARYING_COMPONENTS = 35659;
/**
 * @constant {number}
 */
declare const GL_FRAGMENT_SHADER_DERIVATIVE_HINT = 35723;
/**
 * @constant {number}
 */
declare const GL_RASTERIZER_DISCARD = 35977;
/**
 * @constant {number}
 */
declare const GL_VERTEX_ARRAY_BINDING = 34229;
/**
 * @constant {number}
 */
declare const GL_MAX_VERTEX_OUTPUT_COMPONENTS = 37154;
/**
 * @constant {number}
 */
declare const GL_MAX_FRAGMENT_INPUT_COMPONENTS = 37157;
/**
 * @constant {number}
 */
declare const GL_MAX_SERVER_WAIT_TIMEOUT = 37137;
/**
 * @constant {number}
 */
declare const GL_MAX_ELEMENT_INDEX = 36203;
/**
 * @constant {number}
 */
declare const GL_RED = 6403;
/**
 * @constant {number}
 */
declare const GL_RGB8 = 32849;
/**
 * @constant {number}
 */
declare const GL_RGBA8 = 32856;
/**
 * @constant {number}
 */
declare const GL_RGB10_A2 = 32857;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_3D = 32879;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_WRAP_R = 32882;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_MIN_LOD = 33082;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_MAX_LOD = 33083;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_BASE_LEVEL = 33084;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_MAX_LEVEL = 33085;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_COMPARE_MODE = 34892;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_COMPARE_FUNC = 34893;
/**
 * @constant {number}
 */
declare const GL_SRGB = 35904;
/**
 * @constant {number}
 */
declare const GL_SRGB8 = 35905;
/**
 * @constant {number}
 */
declare const GL_SRGB8_ALPHA8 = 35907;
/**
 * @constant {number}
 */
declare const GL_COMPARE_REF_TO_TEXTURE = 34894;
/**
 * @constant {number}
 */
declare const GL_RGBA32F = 34836;
/**
 * @constant {number}
 */
declare const GL_RGB32F = 34837;
/**
 * @constant {number}
 */
declare const GL_RGBA16F = 34842;
/**
 * @constant {number}
 */
declare const GL_RGB16F = 34843;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_2D_ARRAY = 35866;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_BINDING_2D_ARRAY = 35869;
/**
 * @constant {number}
 */
declare const GL_R11F_G11F_B10F = 35898;
/**
 * @constant {number}
 */
declare const GL_RGB9_E5 = 35901;
/**
 * @constant {number}
 */
declare const GL_RGBA32UI = 36208;
/**
 * @constant {number}
 */
declare const GL_RGB32UI = 36209;
/**
 * @constant {number}
 */
declare const GL_RGBA16UI = 36214;
/**
 * @constant {number}
 */
declare const GL_RGB16UI = 36215;
/**
 * @constant {number}
 */
declare const GL_RGBA8UI = 36220;
/**
 * @constant {number}
 */
declare const GL_RGB8UI = 36221;
/**
 * @constant {number}
 */
declare const GL_RGBA32I = 36226;
/**
 * @constant {number}
 */
declare const GL_RGB32I = 36227;
/**
 * @constant {number}
 */
declare const GL_RGBA16I = 36232;
/**
 * @constant {number}
 */
declare const GL_RGB16I = 36233;
/**
 * @constant {number}
 */
declare const GL_RGBA8I = 36238;
/**
 * @constant {number}
 */
declare const GL_RGB8I = 36239;
/**
 * @constant {number}
 */
declare const GL_RED_INTEGER = 36244;
/**
 * @constant {number}
 */
declare const GL_RGB_INTEGER = 36248;
/**
 * @constant {number}
 */
declare const GL_RGBA_INTEGER = 36249;
/**
 * @constant {number}
 */
declare const GL_R8 = 33321;
/**
 * @constant {number}
 */
declare const GL_RG8 = 33323;
/**
 * @constant {number}
 */
declare const GL_R16F = 33325;
/**
 * @constant {number}
 */
declare const GL_R32F = 33326;
/**
 * @constant {number}
 */
declare const GL_RG16F = 33327;
/**
 * @constant {number}
 */
declare const GL_RG32F = 33328;
/**
 * @constant {number}
 */
declare const GL_R8I = 33329;
/**
 * @constant {number}
 */
declare const GL_R8UI = 33330;
/**
 * @constant {number}
 */
declare const GL_R16I = 33331;
/**
 * @constant {number}
 */
declare const GL_R16UI = 33332;
/**
 * @constant {number}
 */
declare const GL_R32I = 33333;
/**
 * @constant {number}
 */
declare const GL_R32UI = 33334;
/**
 * @constant {number}
 */
declare const GL_RG8I = 33335;
/**
 * @constant {number}
 */
declare const GL_RG8UI = 33336;
/**
 * @constant {number}
 */
declare const GL_RG16I = 33337;
/**
 * @constant {number}
 */
declare const GL_RG16UI = 33338;
/**
 * @constant {number}
 */
declare const GL_RG32I = 33339;
/**
 * @constant {number}
 */
declare const GL_RG32UI = 33340;
/**
 * @constant {number}
 */
declare const GL_R8_SNORM = 36756;
/**
 * @constant {number}
 */
declare const GL_RG8_SNORM = 36757;
/**
 * @constant {number}
 */
declare const GL_RGB8_SNORM = 36758;
/**
 * @constant {number}
 */
declare const GL_RGBA8_SNORM = 36759;
/**
 * @constant {number}
 */
declare const GL_RGB10_A2UI = 36975;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_IMMUTABLE_FORMAT = 37167;
/**
 * @constant {number}
 */
declare const GL_TEXTURE_IMMUTABLE_LEVELS = 33503;
/**
 * @constant {number}
 */
declare const GL_UNSIGNED_INT_2_10_10_10_REV = 33640;
/**
 * @constant {number}
 */
declare const GL_UNSIGNED_INT_10F_11F_11F_REV = 35899;
/**
 * @constant {number}
 */
declare const GL_UNSIGNED_INT_5_9_9_9_REV = 35902;
/**
 * @constant {number}
 */
declare const GL_FLOAT_32_UNSIGNED_INT_24_8_REV = 36269;
/**
 * @constant {number}
 */
declare const GL_UNSIGNED_INT_24_8 = 34042;
/**
 * @constant {number}
 */
declare const GL_HALF_FLOAT = 5131;
/**
 * @constant {number}
 */
declare const GL_RG = 33319;
/**
 * @constant {number}
 */
declare const GL_RG_INTEGER = 33320;
/**
 * @constant {number}
 */
declare const GL_INT_2_10_10_10_REV = 36255;
/**
 * @constant {number}
 */
declare const GL_CURRENT_QUERY = 34917;
/**
 * @constant {number}
 */
declare const GL_QUERY_RESULT = 34918;
/**
 * @constant {number}
 */
declare const GL_QUERY_RESULT_AVAILABLE = 34919;
/**
 * @constant {number}
 */
declare const GL_ANY_SAMPLES_PASSED = 35887;
/**
 * @constant {number}
 */
declare const GL_ANY_SAMPLES_PASSED_CONSERVATIVE = 36202;
/**
 * @constant {number}
 */
declare const GL_MAX_DRAW_BUFFERS = 34852;
/**
 * @constant {number}
 */
declare const GL_DRAW_BUFFER0 = 34853;
/**
 * @constant {number}
 */
declare const GL_DRAW_BUFFER1 = 34854;
/**
 * @constant {number}
 */
declare const GL_DRAW_BUFFER2 = 34855;
/**
 * @constant {number}
 */
declare const GL_DRAW_BUFFER3 = 34856;
/**
 * @constant {number}
 */
declare const GL_DRAW_BUFFER4 = 34857;
/**
 * @constant {number}
 */
declare const GL_DRAW_BUFFER5 = 34858;
/**
 * @constant {number}
 */
declare const GL_DRAW_BUFFER6 = 34859;
/**
 * @constant {number}
 */
declare const GL_DRAW_BUFFER7 = 34860;
/**
 * @constant {number}
 */
declare const GL_DRAW_BUFFER8 = 34861;
/**
 * @constant {number}
 */
declare const GL_DRAW_BUFFER9 = 34862;
/**
 * @constant {number}
 */
declare const GL_DRAW_BUFFER10 = 34863;
/**
 * @constant {number}
 */
declare const GL_DRAW_BUFFER11 = 34864;
/**
 * @constant {number}
 */
declare const GL_DRAW_BUFFER12 = 34865;
/**
 * @constant {number}
 */
declare const GL_DRAW_BUFFER13 = 34866;
/**
 * @constant {number}
 */
declare const GL_DRAW_BUFFER14 = 34867;
/**
 * @constant {number}
 */
declare const GL_DRAW_BUFFER15 = 34868;
/**
 * @constant {number}
 */
declare const GL_MAX_COLOR_ATTACHMENTS = 36063;
/**
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT1 = 36065;
/**
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT2 = 36066;
/**
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT3 = 36067;
/**
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT4 = 36068;
/**
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT5 = 36069;
/**
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT6 = 36070;
/**
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT7 = 36071;
/**
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT8 = 36072;
/**
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT9 = 36073;
/**
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT10 = 36074;
/**
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT11 = 36075;
/**
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT12 = 36076;
/**
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT13 = 36077;
/**
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT14 = 36078;
/**
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT15 = 36079;
/**
 * @constant {number}
 */
declare const GL_SAMPLER_3D = 35679;
/**
 * @constant {number}
 */
declare const GL_SAMPLER_2D_SHADOW = 35682;
/**
 * @constant {number}
 */
declare const GL_SAMPLER_2D_ARRAY = 36289;
/**
 * @constant {number}
 */
declare const GL_SAMPLER_2D_ARRAY_SHADOW = 36292;
/**
 * @constant {number}
 */
declare const GL_SAMPLER_CUBE_SHADOW = 36293;
/**
 * @constant {number}
 */
declare const GL_INT_SAMPLER_2D = 36298;
/**
 * @constant {number}
 */
declare const GL_INT_SAMPLER_3D = 36299;
/**
 * @constant {number}
 */
declare const GL_INT_SAMPLER_CUBE = 36300;
/**
 * @constant {number}
 */
declare const GL_INT_SAMPLER_2D_ARRAY = 36303;
/**
 * @constant {number}
 */
declare const GL_UNSIGNED_INT_SAMPLER_2D = 36306;
/**
 * @constant {number}
 */
declare const GL_UNSIGNED_INT_SAMPLER_3D = 36307;
/**
 * @constant {number}
 */
declare const GL_UNSIGNED_INT_SAMPLER_CUBE = 36308;
/**
 * @constant {number}
 */
declare const GL_UNSIGNED_INT_SAMPLER_2D_ARRAY = 36311;
/**
 * @constant {number}
 */
declare const GL_MAX_SAMPLES = 36183;
/**
 * @constant {number}
 */
declare const GL_SAMPLER_BINDING = 35097;
/**
 * @constant {number}
 */
declare const GL_PIXEL_PACK_BUFFER = 35051;
/**
 * @constant {number}
 */
declare const GL_PIXEL_UNPACK_BUFFER = 35052;
/**
 * @constant {number}
 */
declare const GL_PIXEL_PACK_BUFFER_BINDING = 35053;
/**
 * @constant {number}
 */
declare const GL_PIXEL_UNPACK_BUFFER_BINDING = 35055;
/**
 * @constant {number}
 */
declare const GL_COPY_READ_BUFFER = 36662;
/**
 * @constant {number}
 */
declare const GL_COPY_WRITE_BUFFER = 36663;
/**
 * @constant {number}
 */
declare const GL_COPY_READ_BUFFER_BINDING = 36662;
/**
 * @constant {number}
 */
declare const GL_COPY_WRITE_BUFFER_BINDING = 36663;
/**
 * @constant {number}
 */
declare const GL_FLOAT_MAT2X3 = 35685;
/**
 * @constant {number}
 */
declare const GL_FLOAT_MAT2X4 = 35686;
/**
 * @constant {number}
 */
declare const GL_FLOAT_MAT3X2 = 35687;
/**
 * @constant {number}
 */
declare const GL_FLOAT_MAT3X4 = 35688;
/**
 * @constant {number}
 */
declare const GL_FLOAT_MAT4X2 = 35689;
/**
 * @constant {number}
 */
declare const GL_FLOAT_MAT4X3 = 35690;
/**
 * @constant {number}
 */
declare const GL_UNSIGNED_INT_VEC2 = 36294;
/**
 * @constant {number}
 */
declare const GL_UNSIGNED_INT_VEC3 = 36295;
/**
 * @constant {number}
 */
declare const GL_UNSIGNED_INT_VEC4 = 36296;
/**
 * @constant {number}
 */
declare const GL_UNSIGNED_NORMALIZED = 35863;
/**
 * @constant {number}
 */
declare const GL_SIGNED_NORMALIZED = 36764;
/**
 * @constant {number}
 */
declare const GL_VERTEX_ATTRIB_ARRAY_INTEGER = 35069;
/**
 * @constant {number}
 */
declare const GL_VERTEX_ATTRIB_ARRAY_DIVISOR = 35070;
/**
 * @constant {number}
 */
declare const GL_TRANSFORM_FEEDBACK_BUFFER_MODE = 35967;
/**
 * @constant {number}
 */
declare const GL_MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS = 35968;
/**
 * @constant {number}
 */
declare const GL_TRANSFORM_FEEDBACK_VARYINGS = 35971;
/**
 * @constant {number}
 */
declare const GL_TRANSFORM_FEEDBACK_BUFFER_START = 35972;
/**
 * @constant {number}
 */
declare const GL_TRANSFORM_FEEDBACK_BUFFER_SIZE = 35973;
/**
 * @constant {number}
 */
declare const GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN = 35976;
/**
 * @constant {number}
 */
declare const GL_MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS = 35978;
/**
 * @constant {number}
 */
declare const GL_MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS = 35979;
/**
 * @constant {number}
 */
declare const GL_INTERLEAVED_ATTRIBS = 35980;
/**
 * @constant {number}
 */
declare const GL_SEPARATE_ATTRIBS = 35981;
/**
 * @constant {number}
 */
declare const GL_TRANSFORM_FEEDBACK_BUFFER = 35982;
/**
 * @constant {number}
 */
declare const GL_TRANSFORM_FEEDBACK_BUFFER_BINDING = 35983;
/**
 * @constant {number}
 */
declare const GL_TRANSFORM_FEEDBACK = 36386;
/**
 * @constant {number}
 */
declare const GL_TRANSFORM_FEEDBACK_PAUSED = 36387;
/**
 * @constant {number}
 */
declare const GL_TRANSFORM_FEEDBACK_ACTIVE = 36388;
/**
 * @constant {number}
 */
declare const GL_TRANSFORM_FEEDBACK_BINDING = 36389;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING = 33296;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE = 33297;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_ATTACHMENT_RED_SIZE = 33298;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_ATTACHMENT_GREEN_SIZE = 33299;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_ATTACHMENT_BLUE_SIZE = 33300;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE = 33301;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE = 33302;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE = 33303;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_DEFAULT = 33304;
/**
 * @constant {number}
 */
declare const GL_DEPTH24_STENCIL8 = 35056;
/**
 * @constant {number}
 */
declare const GL_DRAW_FRAMEBUFFER_BINDING = 36006;
/**
 * @constant {number}
 */
declare const GL_READ_FRAMEBUFFER = 36008;
/**
 * @constant {number}
 */
declare const GL_DRAW_FRAMEBUFFER = 36009;
/**
 * @constant {number}
 */
declare const GL_READ_FRAMEBUFFER_BINDING = 36010;
/**
 * @constant {number}
 */
declare const GL_RENDERBUFFER_SAMPLES = 36011;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER = 36052;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_INCOMPLETE_MULTISAMPLE = 36182;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_BUFFER = 35345;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_BUFFER_BINDING = 35368;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_BUFFER_START = 35369;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_BUFFER_SIZE = 35370;
/**
 * @constant {number}
 */
declare const GL_MAX_VERTEX_UNIFORM_BLOCKS = 35371;
/**
 * @constant {number}
 */
declare const GL_MAX_FRAGMENT_UNIFORM_BLOCKS = 35373;
/**
 * @constant {number}
 */
declare const GL_MAX_COMBINED_UNIFORM_BLOCKS = 35374;
/**
 * @constant {number}
 */
declare const GL_MAX_UNIFORM_BUFFER_BINDINGS = 35375;
/**
 * @constant {number}
 */
declare const GL_MAX_UNIFORM_BLOCK_SIZE = 35376;
/**
 * @constant {number}
 */
declare const GL_MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS = 35377;
/**
 * @constant {number}
 */
declare const GL_MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS = 35379;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT = 35380;
/**
 * @constant {number}
 */
declare const GL_ACTIVE_UNIFORM_BLOCKS = 35382;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_TYPE = 35383;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_SIZE = 35384;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_BLOCK_INDEX = 35386;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_OFFSET = 35387;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_ARRAY_STRIDE = 35388;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_MATRIX_STRIDE = 35389;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_IS_ROW_MAJOR = 35390;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_BLOCK_BINDING = 35391;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_BLOCK_DATA_SIZE = 35392;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_BLOCK_ACTIVE_UNIFORMS = 35394;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES = 35395;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER = 35396;
/**
 * @constant {number}
 */
declare const GL_UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER = 35398;
/**
 * @constant {number}
 */
declare const GL_OBJECT_TYPE = 37138;
/**
 * @constant {number}
 */
declare const GL_SYNC_CONDITION = 37139;
/**
 * @constant {number}
 */
declare const GL_SYNC_STATUS = 37140;
/**
 * @constant {number}
 */
declare const GL_SYNC_FLAGS = 37141;
/**
 * @constant {number}
 */
declare const GL_SYNC_FENCE = 37142;
/**
 * @constant {number}
 */
declare const GL_SYNC_GPU_COMMANDS_COMPLETE = 37143;
/**
 * @constant {number}
 */
declare const GL_UNSIGNALED = 37144;
/**
 * @constant {number}
 */
declare const GL_SIGNALED = 37145;
/**
 * @constant {number}
 */
declare const GL_ALREADY_SIGNALED = 37146;
/**
 * @constant {number}
 */
declare const GL_TIMEOUT_EXPIRED = 37147;
/**
 * @constant {number}
 */
declare const GL_CONDITION_SATISFIED = 37148;
/**
 * @constant {number}
 */
declare const GL_WAIT_FAILED = 37149;
/**
 * @constant {number}
 */
declare const GL_SYNC_FLUSH_COMMANDS_BIT = 1;
/**
 * @constant {number}
 */
declare const GL_COLOR = 6144;
/**
 * @constant {number}
 */
declare const GL_DEPTH = 6145;
/**
 * @constant {number}
 */
declare const GL_STENCIL = 6146;
/**
 * @constant {number}
 */
declare const GL_MIN = 32775;
/**
 * @constant {number}
 */
declare const GL_MAX = 32776;
/**
 * @constant {number}
 */
declare const GL_DEPTH_COMPONENT24 = 33190;
/**
 * @constant {number}
 */
declare const GL_STREAM_READ = 35041;
/**
 * @constant {number}
 */
declare const GL_STREAM_COPY = 35042;
/**
 * @constant {number}
 */
declare const GL_STATIC_READ = 35045;
/**
 * @constant {number}
 */
declare const GL_STATIC_COPY = 35046;
/**
 * @constant {number}
 */
declare const GL_DYNAMIC_READ = 35049;
/**
 * @constant {number}
 */
declare const GL_DYNAMIC_COPY = 35050;
/**
 * @constant {number}
 */
declare const GL_DEPTH_COMPONENT32F = 36012;
/**
 * @constant {number}
 */
declare const GL_DEPTH32F_STENCIL8 = 36013;
/**
 * @constant {number}
 */
declare const GL_INVALID_INDEX = 4294967295;
/**
 * @constant {number}
 */
declare const GL_TIMEOUT_IGNORED = -1;
/**
 * @constant {number}
 */
declare const GL_MAX_CLIENT_WAIT_TIMEOUT_WEBGL = 37447;
/**
 * Describes the frequency divisor used for instanced rendering.
 * @constant {number}
 */
declare const GL_VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE = 35070;
/**
 * Passed to getParameter to get the vendor string of the graphics driver.
 * @constant {number}
 */
declare const GL_UNMASKED_VENDOR_WEBGL = 37445;
/**
 * Passed to getParameter to get the renderer string of the graphics driver.
 * @constant {number}
 */
declare const GL_UNMASKED_RENDERER_WEBGL = 37446;
/**
 * Returns the maximum available anisotropy.
 * @constant {number}
 */
declare const GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT = 34047;
/**
 * Passed to texParameter to set the desired maximum anisotropy for a texture.
 * @constant {number}
 */
declare const GL_TEXTURE_MAX_ANISOTROPY_EXT = 34046;
/**
 * A DXT1-compressed image in an RGB image format.
 * @constant {number}
 */
declare const GL_COMPRESSED_RGB_S3TC_DXT1_EXT = 33776;
/**
 * A DXT1-compressed image in an RGB image format with a simple on/off alpha value.
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_S3TC_DXT1_EXT = 33777;
/**
 * A DXT3-compressed image in an RGBA image format. Compared to a 32-bit RGBA texture, it offers 4:1 compression.
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_S3TC_DXT3_EXT = 33778;
/**
 * A DXT5-compressed image in an RGBA image format. It also provides a 4:1 compression, but differs to the DXT3 compression in how the alpha compression is done.
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_S3TC_DXT5_EXT = 33779;
/**
 * A DXT1-compressed image in an sRGB image format.
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB_S3TC_DXT1_EXT = 35916;
/**
 * A DXT1-compressed image in an sRGB image format with a simple on/off alpha value.
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT = 35917;
/**
 * A DXT3-compressed image in an sRGBA image format.
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT = 35918;
/**
 * A DXT5-compressed image in an sRGBA image format.
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT = 35919;
/**
 * One-channel (red) unsigned format compression.
 * @constant {number}
 */
declare const GL_COMPRESSED_R11_EAC = 37488;
/**
 * One-channel (red) signed format compression.
 * @constant {number}
 */
declare const GL_COMPRESSED_SIGNED_R11_EAC = 37489;
/**
 * Two-channel (red and green) unsigned format compression.
 * @constant {number}
 */
declare const GL_COMPRESSED_RG11_EAC = 37490;
/**
 * Two-channel (red and green) signed format compression.
 * @constant {number}
 */
declare const GL_COMPRESSED_SIGNED_RG11_EAC = 37491;
/**
 * Compresses RBG8 data with no alpha channel.
 * @constant {number}
 */
declare const GL_COMPRESSED_RGB8_ETC2 = 37492;
/**
 * Compresses RGBA8 data. The RGB part is encoded the same as RGB_ETC2, but the alpha part is encoded separately.
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA8_ETC2_EAC = 37493;
/**
 * Compresses sRBG8 data with no alpha channel.
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB8_ETC2 = 37494;
/**
 * Compresses sRGBA8 data. The sRGB part is encoded the same as SRGB_ETC2, but the alpha part is encoded separately.
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB8_ALPHA8_ETC2_EAC = 37495;
/**
 * Similar to RGB8_ETC, but with ability to punch through the alpha channel, which means to make it completely opaque or transparent.
 * @constant {number}
 */
declare const GL_COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 37496;
/**
 * Similar to SRGB8_ETC, but with ability to punch through the alpha channel, which means to make it completely opaque or transparent.
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 37497;
/**
 * RGB compression in 4-bit mode. One block for each 4×4 pixels.
 * @constant {number}
 */
declare const GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 35840;
/**
 * RGBA compression in 4-bit mode. One block for each 4×4 pixels.
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 35842;
/**
 * RGB compression in 2-bit mode. One block for each 8×4 pixels.
 * @constant {number}
 */
declare const GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG = 35841;
/**
 * RGBA compression in 2-bit mode. One block for each 8×4 pixels.
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 35843;
/**
 * Compresses 24-bit RGB data with no alpha channel.
 * @constant {number}
 */
declare const GL_COMPRESSED_RGB_ETC1_WEBGL = 36196;
/**
 * Compresses RGB textures with no alpha channel.
 * @constant {number}
 */
declare const GL_COMPRESSED_RGB_ATC_WEBGL = 35986;
/**
 * Compresses RGBA textures using explicit alpha encoding (useful when alpha transitions are sharp).
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL = 35986;
/**
 * Compresses RGBA textures using interpolated alpha encoding (useful when alpha transitions are gradient).
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL = 34798;
/**
 * Compresses RGBA textures using ASTC compression in a blocksize of 4x4
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_ASTC_4X4_KHR = 37808;
/**
 * Compresses RGBA textures using ASTC compression in a blocksize of 5x4
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_ASTC_5X4_KHR = 37809;
/**
 * Compresses RGBA textures using ASTC compression in a blocksize of 5x5
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_ASTC_5X5_KHR = 37810;
/**
 * Compresses RGBA textures using ASTC compression in a blocksize of 6x5
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_ASTC_6X5_KHR = 37811;
/**
 * Compresses RGBA textures using ASTC compression in a blocksize of 6x6
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_ASTC_6X6_KHR = 37812;
/**
 * Compresses RGBA textures using ASTC compression in a blocksize of 8x5
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_ASTC_8X5_KHR = 37813;
/**
 * Compresses RGBA textures using ASTC compression in a blocksize of 8x6
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_ASTC_8X6_KHR = 37814;
/**
 * Compresses RGBA textures using ASTC compression in a blocksize of 8x8
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_ASTC_8X8_KHR = 37815;
/**
 * Compresses RGBA textures using ASTC compression in a blocksize of 10x5
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_ASTC_10X5_KHR = 37816;
/**
 * Compresses RGBA textures using ASTC compression in a blocksize of 10x6
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_ASTC_10X6_KHR = 37817;
/**
 * Compresses RGBA textures using ASTC compression in a blocksize of 10x8
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_ASTC_10X8_KHR = 37818;
/**
 * Compresses RGBA textures using ASTC compression in a blocksize of 10x10
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_ASTC_10X10_KHR = 37819;
/**
 * Compresses RGBA textures using ASTC compression in a blocksize of 12x10
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_ASTC_12X10_KHR = 37820;
/**
 * Compresses RGBA textures using ASTC compression in a blocksize of 12x12
 * @constant {number}
 */
declare const GL_COMPRESSED_RGBA_ASTC_12X12_KHR = 37821;
/**
 * Compresses SRGB8 textures using ASTC compression in a blocksize of 4x4
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB8_ALPHA8_ASTC_4X4_KHR = 37840;
/**
 * Compresses SRGB8 textures using ASTC compression in a blocksize of 5x4
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5X4_KHR = 37841;
/**
 * Compresses SRGB8 textures using ASTC compression in a blocksize of 5x5
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5X5_KHR = 37842;
/**
 * Compresses SRGB8 textures using ASTC compression in a blocksize of 6x5
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6X5_KHR = 37843;
/**
 * Compresses SRGB8 textures using ASTC compression in a blocksize of 6x6
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6X6_KHR = 37844;
/**
 * Compresses SRGB8 textures using ASTC compression in a blocksize of 8x5
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8X5_KHR = 37845;
/**
 * Compresses SRGB8 textures using ASTC compression in a blocksize of 8x6
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8X6_KHR = 37846;
/**
 * Compresses SRGB8 textures using ASTC compression in a blocksize of 8x8
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8X8_KHR = 37847;
/**
 * Compresses SRGB8 textures using ASTC compression in a blocksize of 10x5
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X5_KHR = 37848;
/**
 * Compresses SRGB8 textures using ASTC compression in a blocksize of 10x6
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X6_KHR = 37849;
/**
 * Compresses SRGB8 textures using ASTC compression in a blocksize of 10x8
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X8_KHR = 37850;
/**
 * Compresses SRGB8 textures using ASTC compression in a blocksize of 10x10
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X10_KHR = 37851;
/**
 * Compresses SRGB8 textures using ASTC compression in a blocksize of 12x10
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12X10_KHR = 37852;
/**
 * Compresses SRGB8 textures using ASTC compression in a blocksize of 12x12
 * @constant {number}
 */
declare const GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12X12_KHR = 37853;
/**
 * Unsigned integer type for 24-bit depth texture data.
 * @constant {number}
 */
declare const GL_UNSIGNED_INT_24_8_WEBGL = 34042;
/**
 * Half floating-point type (16-bit).
 * @constant {number}
 */
declare const GL_HALF_FLOAT_OES = 36193;
/**
 * RGBA 32-bit floating-point color-renderable format.
 * @constant {number}
 */
declare const GL_RGBA32F_EXT = 34836;
/**
 * RGB 32-bit floating-point color-renderable format.
 * @constant {number}
 */
declare const GL_RGB32F_EXT = 34837;
/**
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT = 33297;
/**
 * @constant {number}
 */
declare const GL_UNSIGNED_NORMALIZED_EXT = 35863;
/**
 * Produces the minimum color components of the source and destination colors.
 * @constant {number}
 */
declare const GL_MIN_EXT = 32775;
/**
 * Produces the maximum color components of the source and destination colors.
 * @constant {number}
 */
declare const GL_MAX_EXT = 32776;
/**
 * Unsized sRGB format that leaves the precision up to the driver.
 * @constant {number}
 */
declare const GL_SRGB_EXT = 35904;
/**
 * Unsized sRGB format with unsized alpha component.
 * @constant {number}
 */
declare const GL_SRGB_ALPHA_EXT = 35906;
/**
 * Sized (8-bit) sRGB and alpha formats.
 * @constant {number}
 */
declare const GL_SRGB8_ALPHA8_EXT = 35907;
/**
 * Returns the framebuffer color encoding.
 * @constant {number}
 */
declare const GL_FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT = 33296;
/**
 * Indicates the accuracy of the derivative calculation for the GLSL built-in functions: dFdx, dFdy, and fwidth.
 * @constant {number}
 */
declare const GL_FRAGMENT_SHADER_DERIVATIVE_HINT_OES = 35723;
/**
 * Framebuffer color attachment point.
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT0_WEBGL = 36064;
/**
 * Framebuffer color attachment point.
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT1_WEBGL = 36065;
/**
 * Framebuffer color attachment point.
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT2_WEBGL = 36066;
/**
 * Framebuffer color attachment point.
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT3_WEBGL = 36067;
/**
 * Framebuffer color attachment point.
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT4_WEBGL = 36068;
/**
 * Framebuffer color attachment point.
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT5_WEBGL = 36069;
/**
 * Framebuffer color attachment point.
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT6_WEBGL = 36070;
/**
 * Framebuffer color attachment point.
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT7_WEBGL = 36071;
/**
 * Framebuffer color attachment point.
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT8_WEBGL = 36072;
/**
 * Framebuffer color attachment point.
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT9_WEBGL = 36073;
/**
 * Framebuffer color attachment point.
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT10_WEBGL = 36074;
/**
 * Framebuffer color attachment point.
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT11_WEBGL = 36075;
/**
 * Framebuffer color attachment point.
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT12_WEBGL = 36076;
/**
 * Framebuffer color attachment point.
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT13_WEBGL = 36077;
/**
 * Framebuffer color attachment point.
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT14_WEBGL = 36078;
/**
 * Framebuffer color attachment point.
 * @constant {number}
 */
declare const GL_COLOR_ATTACHMENT15_WEBGL = 36079;
/**
 * Draw buffer.
 * @constant {number}
 */
declare const GL_DRAW_BUFFER0_WEBGL = 34853;
/**
 * Draw buffer.
 * @constant {number}
 */
declare const GL_DRAW_BUFFER1_WEBGL = 34854;
/**
 * Draw buffer.
 * @constant {number}
 */
declare const GL_DRAW_BUFFER2_WEBGL = 34855;
/**
 * Draw buffer.
 * @constant {number}
 */
declare const GL_DRAW_BUFFER3_WEBGL = 34856;
/**
 * Draw buffer.
 * @constant {number}
 */
declare const GL_DRAW_BUFFER4_WEBGL = 34857;
/**
 * Draw buffer.
 * @constant {number}
 */
declare const GL_DRAW_BUFFER5_WEBGL = 34858;
/**
 * Draw buffer.
 * @constant {number}
 */
declare const GL_DRAW_BUFFER6_WEBGL = 34859;
/**
 * Draw buffer.
 * @constant {number}
 */
declare const GL_DRAW_BUFFER7_WEBGL = 34860;
/**
 * Draw buffer.
 * @constant {number}
 */
declare const GL_DRAW_BUFFER8_WEBGL = 34861;
/**
 * Draw buffer.
 * @constant {number}
 */
declare const GL_DRAW_BUFFER9_WEBGL = 34862;
/**
 * Draw buffer.
 * @constant {number}
 */
declare const GL_DRAW_BUFFER10_WEBGL = 34863;
/**
 * Draw buffer.
 * @constant {number}
 */
declare const GL_DRAW_BUFFER11_WEBGL = 34864;
/**
 * Draw buffer.
 * @constant {number}
 */
declare const GL_DRAW_BUFFER12_WEBGL = 34865;
/**
 * Draw buffer.
 * @constant {number}
 */
declare const GL_DRAW_BUFFER13_WEBGL = 34866;
/**
 * Draw buffer.
 * @constant {number}
 */
declare const GL_DRAW_BUFFER14_WEBGL = 34867;
/**
 * Draw buffer.
 * @constant {number}
 */
declare const GL_DRAW_BUFFER15_WEBGL = 34868;
/**
 * Maximum number of framebuffer color attachment points.
 * @constant {number}
 */
declare const GL_MAX_COLOR_ATTACHMENTS_WEBGL = 36063;
/**
 * Maximum number of draw buffers.
 * @constant {number}
 */
declare const GL_MAX_DRAW_BUFFERS_WEBGL = 34852;
/**
 * The bound vertex array object (VAO).
 * @constant {number}
 */
declare const GL_VERTEX_ARRAY_BINDING_OES = 34229;
/**
 * The number of bits used to hold the query result for the given target.
 * @constant {number}
 */
declare const GL_QUERY_COUNTER_BITS_EXT = 34916;
/**
 * The currently active query.
 * @constant {number}
 */
declare const GL_CURRENT_QUERY_EXT = 34917;
/**
 * The query result.
 * @constant {number}
 */
declare const GL_QUERY_RESULT_EXT = 34918;
/**
 * A Boolean indicating whether or not a query result is available.
 * @constant {number}
 */
declare const GL_QUERY_RESULT_AVAILABLE_EXT = 34919;
/**
 * Elapsed time (in nanoseconds).
 * @constant {number}
 */
declare const GL_TIME_ELAPSED_EXT = 35007;
/**
 * The current time.
 * @constant {number}
 */
declare const GL_TIMESTAMP_EXT = 36392;
/**
 * A Boolean indicating whether or not the GPU performed any disjoint operation.
 * @constant {number}
 */
declare const GL_GPU_DISJOINT_EXT = 36795;

type Gltf1AnyObject = {
    [s: string]: any;
};
type glTF1 = {
    asset: {
        extras?: {
            rnLoaderOptions?: any;
            version?: string;
            fileType?: string;
        };
    };
    buffers: any[];
    bufferDic: Gltf1AnyObject;
    scenes: any[];
    sceneDic: Gltf1AnyObject;
    meshes: any[];
    meshDic: Gltf1AnyObject;
    nodesIndices: number[];
    nodes: any[];
    nodeDic: Gltf1AnyObject;
    skins: any[];
    skinDic: Gltf1AnyObject;
    materials: any[];
    materialDic: Gltf1AnyObject;
    cameras: any[];
    cameraDic: Gltf1AnyObject;
    shaders: any[];
    shaderDic: Gltf1AnyObject;
    images: any[];
    imageDic: Gltf1AnyObject;
    animations: Array<{
        channels: any[];
        samplers: any[];
        parameters: Gltf1AnyObject;
    }>;
    animationDic: {
        [s: string]: {
            channels: any[];
            samplers: any[];
        };
    };
    textures: any[];
    textureDic: Gltf1AnyObject;
    samplers: any[];
    samplerDic: Gltf1AnyObject;
    accessors: any[];
    accessorDic: Gltf1AnyObject;
    bufferViews: any[];
    bufferViewDic: Gltf1AnyObject;
    buffer: any[];
    techniques: any[];
};

interface Gltf2BufferViewEx extends Gltf2BufferView {
    buffer: number;
    byteOffset: number;
    extras: {
        uint8Array?: Uint8Array;
    };
}
interface Gltf2AccessorEx extends Gltf2Accessor {
    extras: {
        uint8Array?: Uint8Array;
    };
}
interface Gltf2MaterialEx extends Gltf2Material {
    pbrMetallicRoughness: Gltf2PbrMetallicRoughnessEx;
}
interface Gltf2ImageEx extends Gltf2Image {
    rnTextureUID?: Index;
}
interface Gltf2PbrMetallicRoughnessEx extends Gltf2PbrMetallicRoughness {
    diffuseColorTexture?: Gltf2TextureInfo;
}
interface Gltf2Ex extends Gltf2 {
    asset: {
        version: string;
        generator: string;
    };
    buffers: Gltf2Buffer[];
    bufferViews: Gltf2BufferViewEx[];
    accessors: Gltf2AccessorEx[];
    meshes: Gltf2Mesh[];
    materials: Gltf2Material[];
    animations: Gltf2Animation[];
    textures: Gltf2Texture[];
    images: Gltf2ImageEx[];
    skins: Gltf2Skin[];
    cameras: Gltf2Camera[];
    samplers: Gltf2TextureSampler[];
    extensionsUsed: string[];
    extras: {
        rnSkins: ISkeletalEntity[];
        bufferViewByteLengthAccumulatedArray: Byte$1[];
    };
}

type HumanBoneNames = 'hips' | 'spine' | 'chest' | 'neck' | 'head' | 'leftUpperLeg' | 'leftLowerLeg' | 'leftFoot' | 'leftToes' | 'rightUpperLeg' | 'rightLowerLeg' | 'rightFoot' | 'rightToes' | 'leftShoulder' | 'leftUpperArm' | 'leftLowerArm' | 'leftHand' | 'rightShoulder' | 'rightUpperArm' | 'rightLowerArm' | 'rightHand';
type NodeId = number;
type ExpressionPreset = 'happy' | 'angry' | 'sad' | 'relaxed' | 'surprised' | 'aa' | 'ih' | 'ou' | 'ee' | 'oh' | 'blink' | 'blinkLeft' | 'blinkRight' | 'neutral';
interface VRMC_vrm_animation {
    specVersion: string;
    humanoid?: {
        humanBones: Record<HumanBoneNames, {
            node: number;
        }>;
    };
    expressions?: {
        preset?: Record<ExpressionPreset, {
            node: number;
        }>;
        custom?: Record<string, {
            node: number;
        }>;
    };
    lookAt?: {
        node: number;
        offsetFromHeadBone?: [number, number, number];
    };
}
interface RnM2_VRMC_vrm_animation extends VRMC_vrm_animation {
    humanoidBoneNameMap?: Map<NodeId, HumanBoneNames>;
}

interface RnM2Vrma extends RnM2 {
    extensions: {
        VRMC_vrm_animation: RnM2_VRMC_vrm_animation;
    };
}

interface ShaderNodeJson {
    nodes: ShaderNodeJsonNode[];
    connections: ShaderNodeJsonConnection[];
}
interface ShaderNodeJsonNode {
    id: string;
    name: string;
    inputs: Record<string, ShaderNodeJsonNodeInput>;
    outputs: Record<string, ShaderNodeJsonNodeOutput>;
    position: {
        x: number;
        y: number;
    };
    controls: Record<string, any>;
}
interface ShaderNodeJsonNodeOutput {
    id: string;
    label: string;
    socket: {
        name: string;
    };
}
interface ShaderNodeJsonNodeInput {
    type: string;
    value: any;
    socket: {
        name: string;
    };
}
interface ShaderNodeJsonConnection {
    id: string;
    from: {
        id: string;
        portName: string;
    };
    to: {
        id: string;
        portName: string;
    };
}

interface KHR_interactivity_Type {
    signature: 'bool' | 'custom' | 'float' | 'float2' | 'float3' | 'float4' | 'float2x2' | 'float3x3' | 'float4x4' | 'int';
}
interface KHR_interactivity_Variable {
}
interface KHR_interactivity_Event {
}
interface KHR_interactivity_Declaration {
    op: string;
    extension?: string;
    inputValueSockets?: object;
    outputValueSockets?: object;
}
interface KHR_interactivity_Flow {
    node: number;
    socket: 'in';
}
interface KHR_interactivity_Value {
    type: number;
    value: number[];
}
type KHR_interactivity_value_type = 'animation' | 'speed' | 'startTIme' | 'endTime';
interface KHR_interactivity_Configuration {
    node: number;
    socket: 'in';
}
interface KHR_interactivity_Configuration {
    nodeIndex: {
        value: number[];
    };
    stopPropagation: {
        value: boolean;
    };
}
interface KHR_interactivity_Node {
    declaration: number;
    configuration: KHR_interactivity_Configuration;
    values: Record<KHR_interactivity_value_type, KHR_interactivity_Value>;
    flows: Record<string, KHR_interactivity_Flow>;
}
interface KHR_interactivity_Graph {
    types: KHR_interactivity_Type[];
    variables: KHR_interactivity_Variable[];
    events: KHR_interactivity_Event[];
    declarations: KHR_interactivity_Declaration[];
    nodes: KHR_interactivity_Node[];
}
interface KHR_interactivity {
    graphs: KHR_interactivity_Graph[];
    graph: number;
}

declare class IdentityMatrix44 extends AbstractMatrix implements IMatrix, IMatrix44 {
    static readonly __v: Float32Array;
    constructor();
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(mat: IMatrix44, delta?: number): boolean;
    isStrictEqual(mat: IMatrix): boolean;
    at(row_i: number, column_i: number): number;
    v(i: number): number;
    determinant(): number;
    multiplyVector(vec: IVector4): IVector4;
    multiplyVector3(vec: IVector3): IVector3;
    multiplyVectorTo(vec: IVector, outVec: IMutableVector): IMutableVector;
    getScale(): IVector3;
    getScaleTo(outVec: IMutableVector): IMutableVector;
    clone(): IMatrix44;
    getRotate(): IMatrix44;
    getTranslate(): IVector3;
    get m00(): number;
    get m10(): number;
    get m20(): number;
    get m30(): number;
    get m01(): number;
    get m11(): number;
    get m21(): number;
    get m31(): number;
    get m02(): number;
    get m12(): number;
    get m22(): number;
    get m32(): number;
    get m03(): number;
    get m13(): number;
    get m23(): number;
    get m33(): number;
    get translateX(): number;
    get translateY(): number;
    get translateZ(): number;
    get className(): string;
    static get compositionType(): {
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: IndexOf16Bytes;
        readonly __dummyStr: "MAT4";
        readonly webgpu: string;
        readonly wgsl: string;
        getNumberOfComponents(): Count;
        getGlslStr(componentType: ComponentTypeEnum): string;
        getGlslInitialValue(componentType: ComponentTypeEnum): string;
        getWgslInitialValue(componentType: ComponentTypeEnum): string;
        toWGSLType(componentType: ComponentTypeEnum): string;
        getVec4SizeOfProperty(): IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
        toString(): string;
        toJSON(): number;
    };
    get isIdentityMatrixClass(): boolean;
}

declare const FloatArray: Float32ArrayConstructor;
type FloatArray = Float32Array;
declare class Matrix44 extends AbstractMatrix implements IMatrix, IMatrix44 {
    constructor(m: FloatArray);
    get m00(): number;
    get m10(): number;
    get m20(): number;
    get m30(): number;
    get m01(): number;
    get m11(): number;
    get m21(): number;
    get m31(): number;
    get m02(): number;
    get m12(): number;
    get m22(): number;
    get m32(): number;
    get m03(): number;
    get m13(): number;
    get m23(): number;
    get m33(): number;
    get translateX(): number;
    get translateY(): number;
    get translateZ(): number;
    static get compositionType(): {
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: IndexOf16Bytes;
        readonly __dummyStr: "MAT4";
        readonly webgpu: string;
        readonly wgsl: string;
        getNumberOfComponents(): Count;
        getGlslStr(componentType: ComponentTypeEnum): string;
        getGlslInitialValue(componentType: ComponentTypeEnum): string;
        getWgslInitialValue(componentType: ComponentTypeEnum): string;
        toWGSLType(componentType: ComponentTypeEnum): string;
        getVec4SizeOfProperty(): IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
        toString(): string;
        toJSON(): number;
    };
    get glslStrAsFloat(): string;
    get glslStrAsInt(): string;
    get wgslStrAsFloat(): string;
    get wgslStrAsInt(): string;
    /**
     * zero matrix(static version)
     */
    static zero(): Matrix44;
    /**
     * Create identity matrix
     */
    static identity(): IdentityMatrix44;
    static dummy(): Matrix44;
    /**
     * Create transpose matrix
     */
    static transpose(mat: IMatrix44): IMatrix44 | Matrix44;
    /**
     * Create invert matrix
     */
    static invert(mat: IMatrix44): IMatrix44;
    static invertTo(mat: IMatrix44, outMat: MutableMatrix44): MutableMatrix44;
    /**
     * Create translation Matrix
     */
    static translate(vec: Vector3): Matrix44;
    /**
     * Create X oriented Rotation Matrix
     */
    static rotateX(radian: number): Matrix44;
    /**
     * Create Y oriented Rotation Matrix
     */
    static rotateY(radian: number): Matrix44;
    /**
     * Create Z oriented Rotation Matrix
     */
    static rotateZ(radian: number): Matrix44;
    static rotateXYZ(x: number, y: number, z: number): Matrix44;
    static rotate(vec: IVector3): Matrix44;
    /**
     * Create Scale Matrix
     */
    static scale(vec: IVector3): Matrix44;
    /**
     * multiply matrixes
     */
    static multiply(l_mat: IMatrix44, r_mat: IMatrix44): IMatrix44;
    /**
     * multiply matrixes
     */
    static multiplyTo(l_mat: IMatrix44, r_mat: IMatrix44, outMat: MutableMatrix44): MutableMatrix44;
    static multiplyTypedArrayTo(l_mat: IMatrix44, r_array: ArrayType, outMat: MutableMatrix44, offsetAsComposition: number): MutableMatrix44;
    static fromQuaternionTo(quat: IQuaternion, outMat: MutableMatrix44): MutableMatrix44;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(mat: IMatrix44, delta?: number): boolean;
    isStrictEqual(mat: IMatrix44): boolean;
    at(row_i: number, column_i: number): number;
    determinant(): number;
    multiplyVector(vec: IVector4): IVector4;
    multiplyVectorTo(vec: IVector4, outVec: MutableVector4): MutableVector4;
    multiplyVectorToVec3(vec: IVector4, outVec: MutableVector3): MutableVector3;
    multiplyVector3(vec: IVector3): IVector3;
    multiplyVector3To(vec: IVector3, outVec: MutableVector3): MutableVector3;
    getTranslate(): Vector3;
    /**
     * get translate vector from this matrix
     */
    getTranslateTo(outVec: MutableVector3): MutableVector3;
    getScale(): Vector3;
    /**
     * get scale vector from this matrix
     */
    getScaleTo(outVec: MutableVector3): MutableVector3;
    /**
     * @return Euler Angles Rotation (x, y, z)
     */
    toEulerAngles(): Vector3;
    toEulerAnglesTo(outVec3: MutableVector3): MutableVector3;
    clone(): Matrix44;
    getRotate(): Matrix44;
    /**
     * Set values as Row Major
     * Note that WebGL matrix keeps the values in column major.
     * If you write 16 values in 4x4 style (4 values in each row),
     *   It will becomes an intuitive handling.
     * @returns
     */
    static fromCopy16RowMajor(m00: number, m01: number, m02: number, m03: number, m10: number, m11: number, m12: number, m13: number, m20: number, m21: number, m22: number, m23: number, m30: number, m31: number, m32: number, m33: number): Matrix44;
    /**
     * Set values as Column Major
     * Note that WebGL matrix keeps the values in column major.
     * @returns
     */
    static fromCopy16ColumnMajor(m00: number, m10: number, m20: number, m30: number, m01: number, m11: number, m21: number, m31: number, m02: number, m12: number, m22: number, m32: number, m03: number, m13: number, m23: number, m33: number): Matrix44;
    static fromCopyMatrix44(mat: Matrix44): Matrix44;
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix44;
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix44;
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): Matrix44;
    static fromCopyMatrix33(mat: IMatrix33): Matrix44;
    static fromCopyArray16ColumnMajor(array: Array16<number>): Matrix44;
    static fromCopyArrayColumnMajor(array: Array<number>): Matrix44;
    static fromCopyArray16RowMajor(array: Array16<number>): Matrix44;
    static fromCopyArrayRowMajor(array: Array<number>): Matrix44;
    static fromCopyQuaternion(q: IQuaternion): Matrix44;
}

/**
 * SkeletalComponent is a component that manages the skeletal animation of an entity.
 *
 */
declare class SkeletalComponent extends Component {
    _jointIndices: Index[];
    private __joints;
    private __inverseBindMatricesAccessor?;
    _bindShapeMatrix?: Matrix44;
    private __jointMatrices?;
    topOfJointsHierarchy?: SceneGraphComponent;
    isSkinning: boolean;
    private __qArray;
    private __tsArray;
    private __tqArray;
    private __sqArray;
    private __qtsArray;
    private __qtsInfo;
    private __matArray;
    private __worldMatrix;
    private __isWorldMatrixVanilla;
    _isCulled: boolean;
    private static __globalDataRepository;
    private static __tookGlobalDataNum;
    private static __tmpVec3_0;
    private static __tmp_mat4;
    private static __tmp_q;
    private static __identityMat;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    setInverseBindMatricesAccessor(inverseBindMatricesAccessor: Accessor): void;
    setJoints(joints: SceneGraphComponent[]): void;
    getJoints(): SceneGraphComponent[];
    get rootJointWorldMatrixInner(): MutableMatrix44 | undefined;
    get jointMatrices(): number[] | undefined;
    get jointQuaternionArray(): Float32Array;
    get jointTranslateScaleArray(): Float32Array;
    get jointTranslatePackedQuat(): Float32Array;
    get jointScalePackedQuat(): Float32Array;
    get jointMatricesArray(): Float32Array;
    get jointCompressedChunk(): Float32Array;
    get jointCompressedInfo(): MutableVector4;
    get worldMatrix(): MutableMatrix44;
    get worldMatrixInner(): MutableMatrix44;
    get isWorldMatrixUpdated(): boolean;
    $logic(): void;
    private __copyToMatArray;
    getInverseBindMatricesAccessor(): Accessor | undefined;
    _shallowCopyFrom(component_: Component): void;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): ISkeletalEntity;
    _destroy(): void;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
    _getInverseBindMatrices(sg: SceneGraphComponent): IMatrix44;
}

type MaterialNodeUID = number;
declare abstract class AbstractMaterialContent extends RnObject {
    protected __semantics: ShaderSemanticsInfo[];
    static materialNodes: AbstractMaterialContent[];
    protected __materialName: string;
    protected static __gl?: WebGLRenderingContext;
    protected __definitions: string;
    protected static __tmp_vector4: MutableVector4;
    protected static __tmp_vector2: MutableVector2;
    private __isMorphing;
    private __isSkinning;
    private __isLighting;
    private static __lightPositions;
    private static __lightDirections;
    private static __lightIntensities;
    private static __lightProperties;
    private static __materialContentCount;
    private __materialContentUid;
    private static __vertexShaderityObjectMap;
    private static __pixelShaderityObjectMap;
    private static __reflectedShaderSemanticsInfoArrayMap;
    shaderType: ShaderTypeEnum;
    private __materialSemanticsVariantName;
    constructor(materialName: string, { isMorphing, isSkinning, isLighting }?: {
        isMorphing?: boolean | undefined;
        isSkinning?: boolean | undefined;
        isLighting?: boolean | undefined;
    }, vertexShaderityObject?: ShaderityObject, pixelShaderityObject?: ShaderityObject);
    protected setVertexShaderityObject(vertexShaderityObject?: ShaderityObject): void;
    protected setPixelShaderityObject(pixelShaderityObject?: ShaderityObject): void;
    makeMaterialSemanticsVariantName(): void;
    getMaterialSemanticsVariantName(): string;
    get vertexShaderityObject(): ShaderityObject | undefined;
    get pixelShaderityObject(): ShaderityObject | undefined;
    getDefinitions(): string;
    static getMaterialNode(materialNodeUid: MaterialNodeUID): AbstractMaterialContent;
    get _semanticsInfoArray(): ShaderSemanticsInfo[];
    get isSkinning(): boolean;
    get isMorphing(): boolean;
    get isLighting(): boolean;
    setShaderSemanticsInfoArray(shaderSemanticsInfoArray: ShaderSemanticsInfo[]): void;
    protected setupBasicInfo(args: RenderingArgWebGL, shaderProgram: WebGLProgram, firstTime: boolean, material: Material, CameraComponentClass: typeof CameraComponent): void;
    protected setWorldMatrix(shaderProgram: WebGLProgram, worldMatrix: Matrix44): void;
    protected setNormalMatrix(shaderProgram: WebGLProgram, normalMatrix: IMatrix33): void;
    protected setIsBillboard(shaderProgram: WebGLProgram, isBillboard: boolean): void;
    protected setViewInfo(shaderProgram: WebGLProgram, cameraComponent: CameraComponent, isVr: boolean, displayIdx: number): void;
    protected setProjection(shaderProgram: WebGLProgram, cameraComponent: CameraComponent, isVr: boolean, displayIdx: number): void;
    protected setSkinning(shaderProgram: WebGLProgram, setUniform: boolean, skeletalComponent?: SkeletalComponent): void;
    protected setLightsInfo(shaderProgram: WebGLProgram, lightComponents: LightComponent[], material: Material, setUniform: boolean): void;
    setMorphInfo(shaderProgram: WebGLProgram, meshComponent: MeshComponent, primitive: Primitive, blendShapeComponent?: BlendShapeComponent): void;
    _setInternalSettingParametersToGpuWebGLPerShaderProgram({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    _setInternalSettingParametersToGpuWebGLPerMaterial({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    _setInternalSettingParametersToGpuWebGLPerPrimitive({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    _setInternalSettingParametersToGpuWebGpu({ material, args, }: {
        material: Material;
        args: RenderingArgWebGpu;
    }): void;
    getDefinition(): string;
    protected doShaderReflection(vertexShader: ShaderityObject, pixelShader: ShaderityObject, vertexShaderWebGpu: ShaderityObject, pixelShaderWebGpu: ShaderityObject, definitions: string[]): ShaderSemanticsInfo[];
}

type ShaderSources = {
    vertex: string;
    pixel: string;
};
interface WebGLStrategy {
    attachGPUData(primitive: Primitive): void;
    attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    setupShaderForMaterial(material: Material, primitive: Primitive): CGAPIResourceHandle;
    _reSetupShaderForMaterialBySpector(material: Material, primitive: Primitive, updatedShaderSources: ShaderSources, onError: (message: string) => void): CGAPIResourceHandle;
}

type MaterialTypeName = string;
type ShaderVariable = {
    value: any;
    info: ShaderSemanticsInfo;
};

interface BlendEnum extends EnumIO {
    webgpu: string;
}

interface IAnimatedValue {
    setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    getFirstActiveAnimationTrackName(): AnimationTrackName;
    getSecondActiveAnimationTrackName(): AnimationTrackName | undefined;
    getMinStartInputTime(trackName: AnimationTrackName): number;
    getMaxEndInputTime(trackName: AnimationTrackName): number;
    setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler): void;
    blendingRatio: number;
    isLoop: boolean;
    setTime(time: number): void;
    useGlobalTime(): void;
    update(): void;
    getAllTrackNames(): AnimationTrackName[];
    getAnimationSampler(trackName: AnimationTrackName): AnimationSampler;
    deleteAnimationSampler(trackName: AnimationTrackName): void;
    setFloat32Array(array: Float32Array): void;
    getNumberArray(): number[];
}

/**
 * The material class.
 * This class has one or more material nodes.
 */
declare class Material extends RnObject {
    __materialTypeName: MaterialTypeName;
    _materialContent: AbstractMaterialContent;
    _allFieldVariables: Map<ShaderSemanticsName, ShaderVariable>;
    _autoFieldVariablesOnly: Map<ShaderSemanticsName, ShaderVariable>;
    _autoTextureFieldVariablesOnly: Map<ShaderSemanticsName, ShaderVariable>;
    _autoUniformFieldVariablesOnly: Map<ShaderSemanticsName, ShaderVariable>;
    _allFieldsInfo: Map<ShaderSemanticsName, ShaderSemanticsInfo>;
    private __belongPrimitives;
    private _shaderProgramUidMap;
    __materialUid: MaterialUID;
    private __materialTid;
    __materialSid: MaterialSID;
    private __alphaMode;
    zWriteWhenBlend: boolean;
    colorWriteMask: boolean[];
    isTranslucent: boolean;
    cullFace: boolean;
    cullFrontFaceCCW: boolean;
    cullFaceBack: boolean;
    private __alphaToCoverage;
    private __blendEquationMode;
    private __blendEquationModeAlpha;
    private __blendFuncSrcFactor;
    private __blendFuncDstFactor;
    private __blendFuncAlphaSrcFactor;
    private __blendFuncAlphaDstFactor;
    private __stateVersion;
    private static __stateVersion;
    private __fingerPrint;
    private __shaderDefines;
    private static __webglResourceRepository?;
    private static __defaultSampler;
    static _soloDatumFields: Map<MaterialTypeName, Map<ShaderSemanticsName, ShaderVariable>>;
    constructor(materialTid: Index, materialUid: MaterialUID, materialSid: MaterialSID, materialTypeName: string, materialNode: AbstractMaterialContent);
    addShaderDefine(define: string): void;
    removeShaderDefine(define: string): void;
    getShaderDefines(): Set<string>;
    isShaderDefine(define: string): boolean;
    calcFingerPrint(): void;
    _getFingerPrint(): string;
    static get stateVersion(): number;
    _isAnimatedValue(value: any): value is IAnimatedValue;
    setParameter(shaderSemanticName: ShaderSemanticsName, value: any): void;
    setTextureParameter(shaderSemantic: ShaderSemanticsName, texture: AbstractTexture, sampler?: Sampler): void;
    getTextureParameter(shaderSemantic: ShaderSemanticsName): any;
    setTextureParameterAsPromise(shaderSemantic: ShaderSemanticsName, promise: Promise<AbstractTexture>): void;
    getParameter(shaderSemantic: ShaderSemanticsName): any;
    /**
     * return whether the shader program ready or not
     * @returns is shader program ready or not
     */
    isShaderProgramReady(primitive: Primitive): boolean;
    /**
     * @internal
     * called from WebGLStrategyDataTexture and WebGLStrategyUniform only
     * @param isUniformOnlyMode
     */
    _setUniformLocationsOfMaterialNodes(isUniformOnlyMode: boolean, primitive: Primitive): void;
    getShaderProgramUid(primitive: Primitive): CGAPIResourceHandle;
    /**
     * @internal
     * called from Primitive class only
     * @param primitive
     */
    _addBelongPrimitive(primitive: Primitive): void;
    getBelongPrimitives(): Map<number, Primitive>;
    /**
     * @internal
     * called from WebGLStrategyDataTexture and WebGLStrategyUniform
     * @param vertexShaderMethodDefinitions_uniform
     * @param propertySetter
     * @param isWebGL2
     * @returns
     */
    _createProgramWebGL(vertexShaderMethodDefinitions_uniform: string, propertySetter: getShaderPropertyFunc, primitive: Primitive, isWebGL2: boolean): [CGAPIResourceHandle, boolean];
    _createProgramWebGpu(primitive: Primitive, vertexShaderMethodDefinitions: string, propertySetter: getShaderPropertyFunc): void;
    /**
     * create program by updated shader source code
     * @internal
     * called from WebGLStrategyDataTexture and WebGLStrategyUniform
     *
     * @param updatedShaderSources - updated shader source code
     * @param onError
     * @returns
     */
    _createProgramByUpdatedSources(updatedShaderSources: ShaderSources, primitive: Primitive, onError?: (message: string) => void): [CGAPIResourceHandle, boolean];
    /**
     * @internal
     * called WebGLStrategyDataTexture and WebGLStrategyUniform only
     */
    _setupBasicUniformsLocations(primitive: Primitive): void;
    /**
     * @internal
     * called WebGLStrategyDataTexture and WebGLStrategyUniform only
     */
    _setupAdditionalUniformLocations(shaderSemantics: ShaderSemanticsInfo[], isUniformOnlyMode: boolean, primitive: Primitive): void;
    _setInternalSettingParametersToGpuWebGpu({ material, args, }: {
        material: Material;
        args: RenderingArgWebGpu;
    }): void;
    /**
     * @internal
     * called from WebGLStrategyDataTexture and WebGLStrategyUniform only
     */
    _setParametersToGpuWebGL({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    _setParametersToGpuWebGLPerShaderProgram({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    _setParametersToGpuWebGLPerPrimitive({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    _setParametersToGpuWebGLWithOutInternalSetting({ shaderProgram, firstTime, isUniformMode, }: {
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        isUniformMode: boolean;
    }): void;
    /**
     * @internal
     * @param propertySetter
     */
    _getProperties(propertySetter: getShaderPropertyFunc, isWebGL2: boolean): {
        vertexPropertiesStr: string;
        pixelPropertiesStr: string;
    };
    private __setAutoParametersToGpuWebGL;
    private __setSoloDatumParametersToGpuWebGL;
    /**
     * Change the blendEquations
     * This method works only if this alphaMode is the blend
     * @param blendEquationMode the argument of gl.blendEquation of the first argument of gl.blendEquationSeparate such as gl.FUNC_ADD
     * @param blendEquationModeAlpha the second argument of gl.blendEquationSeparate
     */
    setBlendEquationMode(blendEquationMode: BlendEnum, blendEquationModeAlpha?: BlendEnum): void;
    private __treatForMinMax;
    /**
     * Change the blendFuncSeparateFactors
     * This method works only if this alphaMode is the blend
     */
    setBlendFuncSeparateFactor(blendFuncSrcFactor: BlendEnum, blendFuncDstFactor: BlendEnum, blendFuncAlphaSrcFactor: BlendEnum, blendFuncAlphaDstFactor: BlendEnum): void;
    /**
     * Change the blendFuncFactors
     * This method works only if this alphaMode is the blend
     */
    setBlendFuncFactor(blendFuncSrcFactor: BlendEnum, blendFuncDstFactor: BlendEnum): void;
    isBlend(): boolean;
    /**
     *
     * @returns return true if (alphaMode is Opaque or Mask) and translucent
     */
    isTranslucentOpaque(): boolean;
    isBlendOrTranslucent(): boolean;
    isOpaque(): boolean;
    isMask(): boolean;
    /**
     * NOTE: To apply the alphaToCoverage, the output alpha value must not be fixed to constant value.
     * However, some shaders in the Rhodonite fixes the output alpha value to 1 by setAlphaIfNotInAlphaBlendMode.
     * So we need to improve the shader to use the alphaToCoverage.
     * @param alphaToCoverage apply alphaToCoverage to this material or not
     */
    set alphaToCoverage(alphaToCoverage: boolean);
    get alphaToCoverage(): boolean;
    /**
     * Gets materialTID.
     */
    get materialTID(): MaterialTID;
    get fieldsInfoArray(): ShaderSemanticsInfo[];
    get blendEquationMode(): BlendEnum;
    get blendEquationModeAlpha(): BlendEnum;
    get blendFuncSrcFactor(): BlendEnum;
    get blendFuncDstFactor(): BlendEnum;
    get blendFuncAlphaSrcFactor(): BlendEnum;
    get blendFuncAlphaDstFactor(): BlendEnum;
    get alphaMode(): AlphaModeEnum;
    set alphaMode(mode: AlphaModeEnum);
    get materialUID(): MaterialUID;
    get materialSID(): MaterialSID;
    get isSkinning(): boolean;
    get isMorphing(): boolean;
    get isLighting(): boolean;
    get materialTypeName(): string;
    get stateVersion(): number;
    makeShadersInvalidate(): void;
}

interface LoadImageToMipLevelDescriptor {
    mipLevel: Index;
    xOffset: Offset;
    yOffset: Offset;
    width: Size;
    height: Size;
    data: TypedArray;
    rowSizeByPixel: Size;
    type: ComponentTypeEnum;
}
declare class Texture extends AbstractTexture implements Disposable {
    autoDetectTransparency: boolean;
    private static __loadedBasisFunc;
    private static __basisLoadPromise?;
    private static __BasisFile?;
    private __optionsToLoadLazy?;
    private static managedRegistry;
    constructor();
    private __setTextureResourceUid;
    generateTextureFromBasis(uint8Array: Uint8Array, options: {
        level?: Count;
        internalFormat?: TextureParameterEnum;
        format?: PixelFormatEnum;
        type?: ComponentTypeEnum;
        generateMipmap?: boolean;
    }): Promise<void>;
    private __setBasisTexture;
    generateTextureFromKTX2(uint8Array: Uint8Array): Promise<void>;
    generateTextureFromImage(image: HTMLImageElement, { level, internalFormat, format, type, generateMipmap, }?: {
        level?: number | undefined;
        internalFormat?: TextureFormatEnum | undefined;
        format?: EnumIO | undefined;
        type?: {
            readonly __webgpu: string;
            readonly __wgsl: string;
            readonly __sizeInBytes: number;
            readonly __dummyStr: "UNSIGNED_BYTE";
            readonly wgsl: string;
            readonly webgpu: string;
            getSizeInBytes(): number;
            isFloatingPoint(): boolean;
            isInteger(): boolean;
            isUnsignedInteger(): boolean;
            readonly index: number;
            readonly symbol: symbol;
            readonly str: string;
            toString(): string;
            toJSON(): number;
        } | undefined;
        generateMipmap?: boolean | undefined;
    }): Promise<void>;
    generateTextureFromUrl(imageUri: string, { level, internalFormat, format, type, generateMipmap, }?: {
        level?: number | undefined;
        internalFormat?: TextureFormatEnum | undefined;
        format?: EnumIO | undefined;
        type?: {
            readonly __webgpu: string;
            readonly __wgsl: string;
            readonly __sizeInBytes: number;
            readonly __dummyStr: "UNSIGNED_BYTE";
            readonly wgsl: string;
            readonly webgpu: string;
            getSizeInBytes(): number;
            isFloatingPoint(): boolean;
            isInteger(): boolean;
            isUnsignedInteger(): boolean;
            readonly index: number;
            readonly symbol: symbol;
            readonly str: string;
            toString(): string;
            toJSON(): number;
        } | undefined;
        generateMipmap?: boolean | undefined;
    }): Promise<void>;
    generate1x1TextureFrom(rgbaStr?: string): Promise<void>;
    generateSheenLutTextureFromDataUri(): Promise<void>;
    allocate(desc: {
        mipLevelCount?: Count;
        width: number;
        height: number;
        format: TextureFormatEnum;
    }): void;
    loadImageToMipLevel(desc: LoadImageToMipLevelDescriptor): Promise<void>;
    generateCompressedTextureFromTypedArray(typedArray: TypedArray, width: number, height: number, compressionTextureType: CompressionTextureTypeEnum): Promise<void>;
    generateCompressedTextureWithMipmapFromTypedArray(textureDataArray: TextureData[], compressionTextureType: CompressionTextureTypeEnum): Promise<void>;
    /**
     * Generate mipmaps for the texture.
     */
    generateMipmaps(): void;
    importWebGLTextureDirectly(webGLTexture: WebGLTexture, width?: number, height?: number): void;
    destroy3DAPIResources(): boolean;
    private static __deleteInternalTexture;
    [Symbol.dispose](): void;
    destroy(): void;
    static loadFromUrl(uri: string, { level, internalFormat, format, type, generateMipmap, }?: {
        level?: number | undefined;
        internalFormat?: TextureFormatEnum | undefined;
        format?: EnumIO | undefined;
        type?: {
            readonly __webgpu: string;
            readonly __wgsl: string;
            readonly __sizeInBytes: number;
            readonly __dummyStr: "UNSIGNED_BYTE";
            readonly wgsl: string;
            readonly webgpu: string;
            getSizeInBytes(): number;
            isFloatingPoint(): boolean;
            isInteger(): boolean;
            isUnsignedInteger(): boolean;
            readonly index: number;
            readonly symbol: symbol;
            readonly str: string;
            toString(): string;
            toJSON(): number;
        } | undefined;
        generateMipmap?: boolean | undefined;
    }): Promise<Texture>;
}

/**
 * MeshRendererComponent is a component that manages the rendering of a mesh.
 *
 */
declare class MeshRendererComponent extends Component {
    private __diffuseCubeMap?;
    private __specularCubeMap?;
    private __sheenCubeMap?;
    private __diffuseCubeMapContribution;
    private __specularCubeMapContribution;
    private __rotationOfCubeMap;
    private static __cgApiRenderingStrategy?;
    static isDepthMaskTrueForBlendPrimitives: boolean;
    static __shaderProgramHandleOfPrimitiveObjectUids: Map<ObjectUID, CGAPIResourceHandle>;
    private __updateCount;
    private static __updateCount;
    static _isFrustumCullingEnabled: boolean;
    private __fingerPrint;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    get diffuseCubeMap(): RenderTargetTextureCube | CubeTexture | undefined;
    get specularCubeMap(): RenderTargetTextureCube | CubeTexture | undefined;
    get sheenCubeMap(): RenderTargetTextureCube | CubeTexture | undefined;
    get updateCount(): number;
    static get updateCount(): number;
    get diffuseCubeMapContribution(): number;
    set diffuseCubeMapContribution(contribution: number);
    get specularCubeMapContribution(): number;
    set specularCubeMapContribution(contribution: number);
    get rotationOfCubeMap(): number;
    set rotationOfCubeMap(rotation: number);
    calcFingerPrint(): void;
    getFingerPrint(): string;
    setIBLCubeMap(diffuseCubeTexture: CubeTexture | RenderTargetTextureCube, specularCubeTexture: CubeTexture | RenderTargetTextureCube, sheenCubeTexture?: CubeTexture | RenderTargetTextureCube): void;
    static common_$load({ processApproach }: {
        processApproach: ProcessApproachEnum;
    }): void;
    $load(): void;
    static sort_$render(renderPass: RenderPass): ComponentSID[];
    private static __cullingWithViewFrustum;
    static common_$prerender(): void;
    static common_$render({ renderPass, processStage, renderPassTickCount, primitiveUids, }: {
        renderPass: RenderPass;
        processStage: ProcessStageEnum;
        renderPassTickCount: Count;
        primitiveUids: PrimitiveUID[];
    }): boolean;
    $render({ i, renderPass, renderPassTickCount, }: {
        i: Index;
        renderPass: RenderPass;
        renderPassTickCount: Count;
    }): void;
    _shallowCopyFrom(component_: Component): void;
    _destroy(): void;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}

interface IMeshRendererEntityMethods {
    getMeshRenderer(): MeshRendererComponent;
}

type Vrm1_Materials_MToon = {
    specVersion: string;
    transparentWithZWrite: boolean;
    renderQueueOffsetNumber: number;
    shadeColorFactor: [number, number, number];
    shadeMultiplyTexture: {
        index: number;
        texCoord?: number;
        scale?: number;
        texture?: RnM2Texture;
    };
    shadingShiftFactor: number;
    shadingShiftTexture: {
        index: number;
        texCoord?: number;
        scale?: number;
        texture?: RnM2Texture;
    };
    shadingToonyFactor: number;
    giEqualizationFactor: number;
    matcapFactor: [number, number, number];
    matcapTexture: {
        index: number;
        texCoord?: number;
        scale?: number;
        texture?: RnM2Texture;
    };
    parametricRimColorFactor: [number, number, number];
    parametricRimFresnelPowerFactor: number;
    parametricRimLiftFactor: number;
    rimMultiplyTexture: {
        index: number;
        texCoord?: number;
        scale?: number;
        texture?: RnM2Texture;
    };
    rimLightingMixFactor: number;
    outlineColorFactor: [number, number, number];
    outlineLightingMixFactor: number;
    outlineWidthFactor: number;
    outlineWidthMode: 'none' | 'worldCoordinates' | 'screenCoordinates';
    outlineWidthMultiplyTexture: {
        index: number;
        texture?: RnM2Texture;
    };
    uvAnimationMaskTexture: {
        index: number;
        texCoord?: number;
        texture?: RnM2Texture;
    };
    uvAnimationRotationSpeedFactor: number;
    uvAnimationScrollXSpeedFactor: number;
    uvAnimationScrollYSpeedFactor: number;
};
interface Vrm1_Material extends RnM2Material {
    extensions: {
        VRMC_materials_mtoon: Vrm1_Materials_MToon;
    };
}

declare function createMaterial(materialContent: AbstractMaterialContent, maxInstancesNumber?: Count): Material;
declare function recreateMaterial(materialContent: AbstractMaterialContent, maxInstancesNumber?: Count): Material;
declare function createPbrUberMaterial({ additionalName, isMorphing, isSkinning, isLighting, isOcclusion, isEmissive, isClearCoat, isTransmission, isVolume, isSheen, isSpecular, isIridescence, isAnisotropy, isDispersion, isEmissiveStrength, isDiffuseTransmission, isShadow, useTangentAttribute, useNormalTexture, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isMorphing?: boolean | undefined;
    isSkinning?: boolean | undefined;
    isLighting?: boolean | undefined;
    isOcclusion?: boolean | undefined;
    isEmissive?: boolean | undefined;
    isClearCoat?: boolean | undefined;
    isTransmission?: boolean | undefined;
    isVolume?: boolean | undefined;
    isSheen?: boolean | undefined;
    isSpecular?: boolean | undefined;
    isIridescence?: boolean | undefined;
    isAnisotropy?: boolean | undefined;
    isDispersion?: boolean | undefined;
    isEmissiveStrength?: boolean | undefined;
    isDiffuseTransmission?: boolean | undefined;
    isShadow?: boolean | undefined;
    useTangentAttribute?: boolean | undefined;
    useNormalTexture?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createClassicUberMaterial({ additionalName, isSkinning, isLighting, isMorphing, isShadow, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isSkinning?: boolean | undefined;
    isLighting?: boolean | undefined;
    isMorphing?: boolean | undefined;
    isShadow?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createParaboloidDepthMomentEncodeMaterial({ additionalName, isSkinning, isMorphing, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isSkinning?: boolean | undefined;
    isMorphing?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createDepthMomentEncodeMaterial({ additionalName, isSkinning, isMorphing, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isSkinning?: boolean | undefined;
    isMorphing?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createFlatMaterial({ additionalName, isSkinning, isMorphing, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isSkinning?: boolean | undefined;
    isMorphing?: boolean | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createEnvConstantMaterial({ additionalName, maxInstancesNumber, makeOutputSrgb, }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
    makeOutputSrgb?: boolean | undefined;
}): Material;
declare function createFXAA3QualityMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createFurnaceTestMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createDepthEncodeMaterial({ additionalName, isSkinning, depthPow, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    isSkinning?: boolean | undefined;
    depthPow?: number | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createShadowMapDecodeClassicSingleMaterial({ additionalName, isMorphing, isSkinning, isLighting, isDebugging, colorAttachmentsNumber, maxInstancesNumber, }: {
    additionalName?: string | undefined;
    isMorphing?: boolean | undefined;
    isSkinning?: boolean | undefined;
    isLighting?: boolean | undefined;
    isDebugging?: boolean | undefined;
    colorAttachmentsNumber?: number | undefined;
    maxInstancesNumber?: number | undefined;
} | undefined, depthEncodeRenderPass: RenderPass): Material;
declare function createGaussianBlurForEncodedDepthMaterial({ additionalName, maxInstancesNumber, }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createVarianceShadowMapDecodeClassicSingleMaterial({ additionalName, isMorphing, isSkinning, isDebugging, isLighting, colorAttachmentsNumberDepth, colorAttachmentsNumberSquareDepth, depthCameraComponent, maxInstancesNumber, }: {
    additionalName?: string;
    isMorphing?: boolean;
    isSkinning?: boolean;
    isDebugging?: boolean;
    isLighting?: boolean;
    colorAttachmentsNumberDepth?: Count;
    colorAttachmentsNumberSquareDepth?: Count;
    depthCameraComponent?: CameraComponent;
    maxInstancesNumber?: Count;
}, encodedDepthRenderPasses: RenderPass[]): Material;
declare function createDetectHighLuminanceMaterial({ additionalName, maxInstancesNumber }: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
} | undefined, textureToDetectHighLuminance: AbstractTexture): Material;
declare function createGaussianBlurMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createSynthesizeHDRMaterial({ additionalName, maxInstancesNumber, }: {
    additionalName?: string;
    maxInstancesNumber?: Count;
}, synthesizeTextures: AbstractTexture[]): Material;
declare function createColorGradingUsingLUTsMaterial({ additionalName, colorAttachmentsNumber, uri, texture, maxInstancesNumber, }: {
    additionalName?: string;
    colorAttachmentsNumber?: Count;
    uri?: string;
    texture?: Texture;
    maxInstancesNumber?: Count;
}, targetRenderPass: RenderPass): Material;
declare function createGammaCorrectionMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createToneMappingMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createSummedAreaTableMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createPanoramaToCubeMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createPrefilterIBLMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createMatCapMaterial({ additionalName, isSkinning, uri, texture, sampler, maxInstancesNumber, }: {
    additionalName?: string;
    isSkinning?: boolean;
    uri?: string;
    texture?: Texture;
    sampler?: Sampler;
    maxInstancesNumber?: Count;
}): Material;
declare function createEntityUIDOutputMaterial({ additionalName, maxInstancesNumber }?: {
    additionalName?: string | undefined;
    maxInstancesNumber?: number | undefined;
}): Material;
declare function createMToon0xMaterial({ additionalName, isMorphing, isSkinning, isLighting, useTangentAttribute, isOutline, materialProperties, textures, samplers, debugMode, maxInstancesNumber, makeOutputSrgb, }: {
    additionalName?: string;
    isMorphing?: boolean;
    isSkinning?: boolean;
    isLighting?: boolean;
    useTangentAttribute?: boolean;
    isOutline?: boolean;
    materialProperties?: Vrm0xMaterialProperty;
    textures?: any[];
    samplers?: Sampler[];
    debugMode?: any;
    maxInstancesNumber?: Count;
    makeOutputSrgb?: boolean;
}): Material;
declare function createMToon1Material({ additionalName, isMorphing, isSkinning, isLighting, useTangentAttribute, isOutline, materialJson, textures, samplers, debugMode, maxInstancesNumber, makeOutputSrgb, }: {
    additionalName?: string;
    isMorphing?: boolean;
    isSkinning?: boolean;
    isLighting?: boolean;
    useTangentAttribute?: boolean;
    isOutline?: boolean;
    materialJson: Vrm1_Material;
    textures?: any[];
    samplers?: Sampler[];
    debugMode?: any;
    maxInstancesNumber?: Count;
    makeOutputSrgb?: boolean;
}): Material;
declare function reuseOrRecreateCustomMaterial(currentMaterial: Material, vertexShaderStr: string, pixelShaderStr: string, { maxInstancesNumber, isSkinning, isLighting, isMorphing, }?: {
    maxInstancesNumber?: number | undefined;
    isSkinning?: boolean | undefined;
    isLighting?: boolean | undefined;
    isMorphing?: boolean | undefined;
}): Material;
declare function changeMaterial(entity: IMeshRendererEntityMethods, primitive: Primitive, material: Material): void;
declare const MaterialHelper: Readonly<{
    createMaterial: typeof createMaterial;
    recreateMaterial: typeof recreateMaterial;
    reuseOrRecreateCustomMaterial: typeof reuseOrRecreateCustomMaterial;
    createClassicUberMaterial: typeof createClassicUberMaterial;
    createDepthMomentEncodeMaterial: typeof createDepthMomentEncodeMaterial;
    createParaboloidDepthMomentEncodeMaterial: typeof createParaboloidDepthMomentEncodeMaterial;
    createFlatMaterial: typeof createFlatMaterial;
    createPbrUberMaterial: typeof createPbrUberMaterial;
    createEnvConstantMaterial: typeof createEnvConstantMaterial;
    createFXAA3QualityMaterial: typeof createFXAA3QualityMaterial;
    createDepthEncodeMaterial: typeof createDepthEncodeMaterial;
    createShadowMapDecodeClassicSingleMaterial: typeof createShadowMapDecodeClassicSingleMaterial;
    createGammaCorrectionMaterial: typeof createGammaCorrectionMaterial;
    createToneMappingMaterial: typeof createToneMappingMaterial;
    createPanoramaToCubeMaterial: typeof createPanoramaToCubeMaterial;
    createPrefilterIBLMaterial: typeof createPrefilterIBLMaterial;
    createSummedAreaTableMaterial: typeof createSummedAreaTableMaterial;
    createVarianceShadowMapDecodeClassicSingleMaterial: typeof createVarianceShadowMapDecodeClassicSingleMaterial;
    createEntityUIDOutputMaterial: typeof createEntityUIDOutputMaterial;
    createMToon0xMaterial: typeof createMToon0xMaterial;
    createMToon1Material: typeof createMToon1Material;
    createFurnaceTestMaterial: typeof createFurnaceTestMaterial;
    createGaussianBlurForEncodedDepthMaterial: typeof createGaussianBlurForEncodedDepthMaterial;
    createDetectHighLuminanceMaterial: typeof createDetectHighLuminanceMaterial;
    createGaussianBlurMaterial: typeof createGaussianBlurMaterial;
    createSynthesizeHDRMaterial: typeof createSynthesizeHDRMaterial;
    createColorGradingUsingLUTsMaterial: typeof createColorGradingUsingLUTsMaterial;
    createMatCapMaterial: typeof createMatCapMaterial;
    changeMaterial: typeof changeMaterial;
}>;

declare abstract class IShape extends Primitive {
    abstract generate(desc: IAnyPrimitiveDescriptor): void;
}

interface PlaneDescriptor extends IAnyPrimitiveDescriptor {
    /** the length of U(X)-axis direction */
    width?: Size;
    /** the length of V(Y)-axis direction */
    height?: Size;
    /** number of spans in U(X)-axis direction */
    uSpan?: Size;
    /** number of spans in V(Y)-axis direction */
    vSpan?: Size;
    /** draw uSpan times vSpan number of textures */
    isUVRepeat?: boolean;
    /** draw textures by flipping on the V(Y)-axis */
    flipTextureCoordinateY?: boolean;
}
/**
 * Plane class
 *
 */
declare class Plane extends IShape {
    /**
     * Generates a plane object
     * @param _desc a descriptor object of a Plane
     */
    generate(_desc: PlaneDescriptor): void;
}

interface AxisDescriptor extends IAnyPrimitiveDescriptor {
    /** the length of axis */
    length?: Size;
}
/**
 * the Axis class
 */
declare class Axis extends IShape {
    /**
     * Generates a axis object
     * @param _desc a descriptor object of a Axis
     */
    generate(_desc: AxisDescriptor): void;
}

interface LineDescriptor extends IAnyPrimitiveDescriptor {
    /** the start position */
    startPos?: IVector3;
    /** the end position */
    endPos?: IVector3;
    /** whether it has the terminal mark */
    hasTerminalMark?: boolean;
}
/**
 * the Line class
 */
declare class Line extends IShape {
    /**
     * Generates a line object
     * @param _desc a descriptor object of a Line
     */
    generate(_desc: LineDescriptor): void;
}

interface GridDescriptor extends IAnyPrimitiveDescriptor {
    /** the desc.length of axis */
    length?: Size;
    /** the division of grid */
    division?: Size;
    /** the XZ axis */
    isXZ?: boolean;
    /** the XY axis */
    isXY?: boolean;
    /** the YZ axis */
    isYZ?: boolean;
}
/**
 * the Grid class
 */
declare class Grid extends IShape {
    /**
     * Generates a grid object
     * @param _desc a descriptor object of a Grid
     */
    generate(_desc: GridDescriptor): void;
}

type PhysicsShapeTypeEnum = EnumIO;

declare const get1: unique symbol;
declare const get1_offset: unique symbol;
declare const get1_offsetAsComposition: unique symbol;
declare const get2: unique symbol;
declare const get2_offset: unique symbol;
declare const get2_offsetAsComposition: unique symbol;
declare const get3: unique symbol;
declare const get3_offset: unique symbol;
declare const get3_offsetAsComposition: unique symbol;
declare const get4: unique symbol;
declare const get4_offset: unique symbol;
declare const get4_offsetAsComposition: unique symbol;
declare const getN_offset: unique symbol;
declare const getN_offsetAsComposition: unique symbol;
declare const add2: unique symbol;
declare const add2_offset: unique symbol;
declare const add3: unique symbol;
declare const add3_offset: unique symbol;
declare const add4: unique symbol;
declare const mulArray3WithScalar_offset: unique symbol;
declare const mulArray4WithScalar_offset: unique symbol;
declare const mulArrayNWithScalar_offset: unique symbol;
declare const mulThatAndThisToOutAsMat44_offsetAsComposition: unique symbol;
declare const add4_offset: unique symbol;
declare const qlerp_offsetAsComposition: unique symbol;
declare const scalar_lerp_offsetAsComposition: unique symbol;
declare const array2_lerp_offsetAsComposition: unique symbol;
declare const array3_lerp_offsetAsComposition: unique symbol;
declare const array4_lerp_offsetAsComposition: unique symbol;
declare const arrayN_lerp_offsetAsComposition: unique symbol;
declare const normalizeArray4: unique symbol;
declare global {
    interface Extension {
        [get1](this: ArrayType): Array1<number>;
        [get1_offset](this: ArrayType, offset: number): Array1<number>;
        [get1_offsetAsComposition](this: ArrayType, offsetAsComposition: number): Array1<number>;
        [get2](this: ArrayType): Array2<number>;
        [get2_offset](this: ArrayType, offset: number): Array2<number>;
        [get2_offsetAsComposition](this: ArrayType, offsetAsComposition: number): Array2<number>;
        [get3](this: ArrayType): Array3<number>;
        [get3_offset](this: ArrayType, offset: number): Array3<number>;
        [get3_offsetAsComposition](this: ArrayType, offsetAsComposition: number): Array3<number>;
        [get4](this: ArrayType): Array4<number>;
        [get4_offset](this: ArrayType, offset: number): Array4<number>;
        [get4_offsetAsComposition](this: ArrayType, offsetAsComposition: number): Array4<number>;
        [getN_offset](this: ArrayType, offset: number, componentN: number): Array<number>;
        [getN_offsetAsComposition](this: ArrayType, offsetAsComposition: number, componentN: number): Array<number>;
        [add2](this: ArrayType, array: ArrayType): ArrayType;
        [add2_offset](this: ArrayType, array: ArrayType, selfOffset: number, argOffset: number): ArrayType;
        [add3](this: ArrayType, array: ArrayType): ArrayType;
        [add3_offset](this: ArrayType, array: ArrayType, selfOffset: number, argOffset: number): ArrayType;
        [add4](this: ArrayType, array: ArrayType): ArrayType;
        [add4_offset](this: ArrayType, array: ArrayType, selfOffset: number, argOffset: number): ArrayType;
        [mulArray3WithScalar_offset](this: ArrayType, offset: number, value: number): Array4<number>;
        [mulArray4WithScalar_offset](this: ArrayType, offset: number, value: number): Array4<number>;
        [mulArrayNWithScalar_offset](this: ArrayType, offset: number, componentN: number, value: number): Array4<number>;
        [mulThatAndThisToOutAsMat44_offsetAsComposition](this: ArrayType, thisOffsetAsComposition: number, that: ArrayType, thatOffsetAsComposition: number, out: ArrayType): ArrayType;
        [qlerp_offsetAsComposition](this: ArrayType, array: ArrayType, ratio: number, selfOffsetAsComposition: number, argOffsetAsComposition: number): Array4<number>;
        [scalar_lerp_offsetAsComposition](this: ArrayType, array: ArrayType, ratio: number, selfOffset: number, argOffset: number): number;
        [array2_lerp_offsetAsComposition](this: ArrayType, array: ArrayType, ratio: number, selfOffsetAsComposition: number, argOffsetAsComposition: number): Array2<number>;
        [array3_lerp_offsetAsComposition](this: ArrayType, array: ArrayType, ratio: number, selfOffsetAsComposition: number, argOffsetAsComposition: number): Array3<number>;
        [array4_lerp_offsetAsComposition](this: ArrayType, array: ArrayType, ratio: number, selfOffsetAsComposition: number, argOffsetAsComposition: number): Array4<number>;
        [arrayN_lerp_offsetAsComposition](this: ArrayType, array: ArrayType, componentN: number, ratio: number, selfOffsetAsComposition: number, argOffsetAsComposition: number): Array<number>;
        [normalizeArray4](this: Array4<number>): Array4<number>;
    }
    interface Array<T> extends Extension {
    }
    interface ReadonlyArray<T> extends Extension {
    }
    interface Float32Array extends Extension {
    }
}

interface IArrayBufferBasedMathNumber {
    isTheSourceSame(arrayBuffer: ArrayBuffer): boolean;
}

declare abstract class AbstractArrayBufferBaseMathNumber implements IArrayBufferBasedMathNumber {
    _v: TypedArray;
    isTheSourceSame(arrayBuffer: ArrayBuffer): boolean;
}

declare class IdentityMatrix33 extends AbstractMatrix implements IMatrix, IMatrix33 {
    static readonly __v: Float32Array;
    constructor();
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(mat: IMatrix33, delta?: number): boolean;
    isStrictEqual(mat: IMatrix33): boolean;
    at(row_i: number, column_i: number): number;
    determinant(): number;
    multiplyVector(vec: IVector): IVector;
    multiplyVectorTo(vec: IVector, outVec: IMutableVector): IMutableVector;
    getScale(): IVector;
    getScaleTo(outVec: IMutableVector): IMutableVector;
    clone(): IMatrix33;
    getRotate(): IMatrix33;
    get m00(): number;
    get m10(): number;
    get m20(): number;
    get m30(): number;
    get m01(): number;
    get m11(): number;
    get m21(): number;
    get m31(): number;
    get m02(): number;
    get m12(): number;
    get m22(): number;
    get m32(): number;
    get m03(): number;
    get m13(): number;
    get m23(): number;
    get m33(): number;
    get className(): string;
    static get compositionType(): {
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: IndexOf16Bytes;
        readonly __dummyStr: "MAT3";
        readonly webgpu: string;
        readonly wgsl: string;
        getNumberOfComponents(): Count;
        getGlslStr(componentType: ComponentTypeEnum): string;
        getGlslInitialValue(componentType: ComponentTypeEnum): string;
        getWgslInitialValue(componentType: ComponentTypeEnum): string;
        toWGSLType(componentType: ComponentTypeEnum): string;
        getVec4SizeOfProperty(): IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
        toString(): string;
        toJSON(): number;
    };
    get isIdentityMatrixClass(): boolean;
}

declare class LogQuaternion implements ILogQuaternion {
    _v: Float32Array;
    constructor(x: Float32Array);
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    static fromFloat32Array(array: Float32Array): LogQuaternion;
    static fromCopyArray3(array: Array3<number>): Quaternion;
    static fromCopyArray(array: Array<number>): Quaternion;
    static fromCopy3(x: number, y: number, z: number): Quaternion;
    static fromCopyLogQuaternion(quat: ILogQuaternion): Quaternion;
    static fromCopyVector4(vec: IVector3): Quaternion;
    static fromCopyQuaternion(x: IQuaternion): LogQuaternion;
    get className(): string;
}

declare class MathClassUtil {
    private static __tmpVector4_0;
    private static __tmpVector4_1;
    constructor();
    static arrayToVector(element: Array<number>): Vector3 | Vector4 | Vector2;
    static arrayToVectorOrMatrix(element: Array<number>): Vector3 | Vector4 | Matrix44 | Matrix33 | Vector2;
    static getImmutableValueClass(compositionType: CompositionTypeEnum): Function | undefined;
    static getMutableValueClass(compositionType: CompositionTypeEnum): Function | undefined;
    static cloneOfMathObjects(element: any): any;
    static isAcceptableArrayForQuaternion(element: Array<number>): boolean;
    static arrayToQuaternion(element: Array<number>): Quaternion;
    static makeSubArray(array: Array<any>, componentN: number): any;
    static vectorToArray(element: Vector2 | Vector3 | Vector4 | Quaternion): number[];
    /**
     * discriminate which Vector instance
     * @param element any Vector instance
     * @return number of Vector instance
     */
    static componentNumberOfVector(element: Vector2 | Vector3 | Vector4 | Quaternion | Array<any>): number;
    static packNormalizedVec4ToVec2(x: number, y: number, z: number, w: number, criteria: number): number[];
    static unProjectTo(windowPosX: number, windowPosY: number, windowPosZ: number, inversePVMat44: Matrix44, viewportVec4: Vector4, out: MutableVector3): IMutableVector3;
    static add(lhs: any, rhs: any): any;
    static subtract(lhs: any, rhs: any): number | number[] | Vector3 | Vector4 | Quaternion | Vector2 | undefined;
    static multiplyNumber(lhs: any, rhs: number): number | number[] | Vector3 | Vector4 | Quaternion | Vector2 | undefined;
    static divideNumber(lhs: any, rhs: number): number | number[] | Vector3 | Vector4 | Quaternion | Vector2 | undefined;
    static initWithScalar(objForDetectType: any, val: number): number | number[] | Vector3 | Vector4 | Quaternion | Vector2 | undefined;
    static initWithFloat32Array(val: any, floatArray: Float32Array): any;
    static _setForce(objForDetectType: any, val: any): boolean;
}

declare function radianToDegree(rad: number): number;
declare function degreeToRadian(deg: number): number;
/**
 * check whether or not this texture size is power of two.
 *
 * @param x texture size.
 * @returns check whether or not the size x is power of two.
 */
declare function isPowerOfTwo(x: number): boolean;
declare function isPowerOfTwoTexture(width: Size, height: Size): boolean;
declare function packNormalizedVec4ToVec2(x: number, y: number, z: number, w: number, criteria: number): number[];
declare function gaussianCdf(x: number, mu: number, sigma: number): number;
declare function invGaussianCdf(U: number, mu: number, sigma: number): number;
declare function computeEigenValuesAndVectors(A: MutableMatrix33, Q: MutableMatrix33, w: MutableVector3): -1 | 0;
declare function convertToStringAsGLSLFloat(value: number): string;
declare function nearZeroToZero(value: number): number;
declare function financial(val: number | string): string;
declare function roundAsFloat(value: number): number;
declare function lerp(a: number, b: number, t: number): number;
/**
 * This function calculates the ratio of a discrete Gaussian distribution.
 * The sampling points are one away from each other. The sum of the ratios is 1.
 * @kernelSize number of sampling points
 * @variance variance of the Gaussian distribution
 * @mean mean of the Gaussian distribution
 * e.g. kernelSize = 2 (mean=0) => the sampling points are -0.5 and 0.5
 * e.g. kernelSize = 3 (mean=1) => the sampling points are 0.0, 1.0 and 2.0
 * @effectiveDigit effectiveDigit of values in return array
 * @returns array of the Gaussian distribution where the sum of the elements is 1
 */
declare function computeGaussianDistributionRatioWhoseSumIsOne({ kernelSize, variance, mean, effectiveDigit, }: {
    kernelSize: Count;
    variance: number;
    mean?: number;
    effectiveDigit?: Count;
}): number[];
declare const MathUtil: Readonly<{
    radianToDegree: typeof radianToDegree;
    degreeToRadian: typeof degreeToRadian;
    toHalfFloat: () => ((val: number) => number);
    isPowerOfTwo: typeof isPowerOfTwo;
    isPowerOfTwoTexture: typeof isPowerOfTwoTexture;
    packNormalizedVec4ToVec2: typeof packNormalizedVec4ToVec2;
    convertToStringAsGLSLFloat: typeof convertToStringAsGLSLFloat;
    nearZeroToZero: typeof nearZeroToZero;
    gaussianCdf: typeof gaussianCdf;
    invGaussianCdf: typeof invGaussianCdf;
    computeEigenValuesAndVectors: typeof computeEigenValuesAndVectors;
    computeGaussianDistributionRatioWhoseSumIsOne: typeof computeGaussianDistributionRatioWhoseSumIsOne;
    roundAsFloat: typeof roundAsFloat;
    financial: typeof financial;
    lerp: typeof lerp;
}>;

declare class MutableMatrix22 extends Matrix22 implements IMutableMatrix, IMutableMatrix22 {
    constructor(m: Float32Array);
    set m00(val: number);
    get m00(): number;
    set m10(val: number);
    get m10(): number;
    set m01(val: number);
    get m01(): number;
    set m11(val: number);
    get m11(): number;
    get className(): string;
    /**
     * Create zero matrix
     */
    static zero(): MutableMatrix22;
    /**
     * Create identity matrix
     */
    static identity(): MutableMatrix22;
    static dummy(): MutableMatrix22;
    /**
     * Create transpose matrix
     */
    static transpose(mat: Matrix22): MutableMatrix22;
    /**
     * Create invert matrix
     */
    static invert(mat: Matrix22): MutableMatrix22;
    /**
     * Create Rotation Matrix
     */
    static rotate(radian: number): MutableMatrix22;
    /**
     * Create Scale Matrix
     */
    static scale(vec: Vector2): MutableMatrix22;
    /**
     * multiply matrixes
     */
    static multiply(l_mat: Matrix22, r_mat: Matrix22): MutableMatrix22;
    clone(): MutableMatrix22;
    raw(): Float32Array;
    setAt(row_i: number, column_i: number, value: number): this;
    setComponents(m00: number, m01: number, m10: number, m11: number): MutableMatrix22;
    copyComponents(mat: Matrix22 | Matrix33 | Matrix44): this;
    /**
     * zero matrix
     */
    zero(): MutableMatrix22;
    identity(): MutableMatrix22;
    _swap(l: Index, r: Index): void;
    /**
     * transpose
     */
    transpose(): this;
    invert(): MutableMatrix22;
    /**
     * Create Rotation Matrix
     */
    rotate(radian: number): MutableMatrix22;
    scale(vec: Vector2): MutableMatrix22;
    multiplyScale(vec: Vector2): this;
    /**
     * multiply the input matrix from right side
     */
    multiply(mat: Matrix22): MutableMatrix22;
    multiplyByLeft(mat: Matrix22): MutableMatrix22;
    /**
     * Set values as Row Major
     * Note that WebGL matrix keeps the values in column major.
     * If you write 4 values in 2x2 style (2 values in each row),
     *   It will becomes an intuitive handling.
     * @returns
     */
    static fromCopy4RowMajor(m00: number, m01: number, m10: number, m11: number): MutableMatrix22;
    /**
     * Set values as Column Major
     * Note that WebGL matrix keeps the values in column major.
     * @returns
     */
    static fromCopy4ColumnMajor(m00: number, m10: number, m01: number, m11: number): MutableMatrix22;
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix22;
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix22;
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): MutableMatrix22;
    static fromCopyMatrix22(mat: IMatrix22): MutableMatrix22;
    static fromCopyArray9ColumnMajor(array: Array4<number>): MutableMatrix22;
    static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix22;
    static fromCopyArray9RowMajor(array: Array4<number>): MutableMatrix22;
    static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix22;
}

declare class Matrix22 extends AbstractMatrix implements IMatrix22 {
    constructor(m: Float32Array);
    get m00(): number;
    get m10(): number;
    get m01(): number;
    get m11(): number;
    get className(): string;
    static get compositionType(): {
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: IndexOf16Bytes;
        readonly __dummyStr: "MAT2";
        readonly webgpu: string;
        readonly wgsl: string;
        getNumberOfComponents(): Count;
        getGlslStr(componentType: ComponentTypeEnum): string;
        getGlslInitialValue(componentType: ComponentTypeEnum): string;
        getWgslInitialValue(componentType: ComponentTypeEnum): string;
        toWGSLType(componentType: ComponentTypeEnum): string;
        getVec4SizeOfProperty(): IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
        toString(): string;
        toJSON(): number;
    };
    /**
     * Create zero matrix
     */
    static zero(): Matrix22;
    /**
     * Create identity matrix
     */
    static identity(): Matrix22;
    static dummy(): Matrix22;
    /**
     * Create transpose matrix
     */
    static transpose(mat: Matrix22): Matrix22;
    /**
     * Create invert matrix
     */
    static invert(mat: Matrix22): Matrix22;
    static invertTo(mat: Matrix22, outMat: MutableMatrix22): MutableMatrix22;
    /**
     * Create Rotation Matrix
     */
    static rotate(radian: number): Matrix22;
    /**
     * Create Scale Matrix
     */
    static scale(vec: Vector2): Matrix22;
    /**
     * multiply matrixes
     */
    static multiply(l_mat: Matrix22, r_mat: Matrix22): Matrix22;
    /**
     * multiply matrixes
     */
    static multiplyTo(l_mat: Matrix33, r_mat: Matrix33, outMat: MutableMatrix22): MutableMatrix22;
    toString(): string;
    toStringApproximately(): string;
    flattenAsArray(): number[];
    isDummy(): boolean;
    isEqual(mat: Matrix22, delta?: number): boolean;
    isStrictEqual(mat: Matrix22): boolean;
    at(row_i: number, column_i: number): number;
    determinant(): number;
    multiplyVector(vec: Vector2): Vector2;
    multiplyVectorTo(vec: Vector2, outVec: MutableVector2): MutableVector2;
    getScale(): Vector2;
    getScaleTo(outVec: MutableVector2): MutableVector2;
    clone(): any;
    /**
     * Set values as Row Major
     * Note that WebGL matrix keeps the values in column major.
     * If you write 4 values in 2x2 style (2 values in each row),
     *   It will becomes an intuitive handling.
     * @returns
     */
    static fromCopy4RowMajor(m00: number, m01: number, m10: number, m11: number): Matrix22;
    /**
     * Set values as Column Major
     * Note that WebGL matrix keeps the values in column major.
     * @returns
     */
    static fromCopy4ColumnMajor(m00: number, m10: number, m01: number, m11: number): Matrix22;
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix22;
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix22;
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): Matrix22;
    static fromCopyMatrix22(mat: IMatrix22): Matrix22;
    static fromCopyArray9ColumnMajor(array: Array4<number>): Matrix22;
    static fromCopyArrayColumnMajor(array: Array<number>): Matrix22;
    static fromCopyArray9RowMajor(array: Array4<number>): Matrix22;
    static fromCopyArrayRowMajor(array: Array<number>): Matrix22;
}

declare class MutableColorRgb extends MutableVector3 implements IMutableVector3, IMutableColorRgb {
    constructor(r: Float32Array);
    get x(): number;
    set x(val: number);
    get y(): number;
    set y(val: number);
    get z(): number;
    set z(val: number);
    get w(): number;
    get r(): number;
    set r(val: number);
    get g(): number;
    set g(val: number);
    get b(): number;
    set b(val: number);
    get a(): number;
    static zero(): MutableColorRgb;
    static one(): MutableColorRgb;
    static dummy(): MutableColorRgb;
    static normalize(vec: IVector3): MutableColorRgb;
    static add(l_vec: IVector3, r_vec: IVector3): MutableColorRgb;
    static subtract(l_vec: IVector3, r_vec: IVector3): MutableColorRgb;
    static multiply(vec: IVector3, value: number): MutableColorRgb;
    static multiplyVector(l_vec: IVector3, r_vec: IVector3): MutableColorRgb;
    static divide(vec: IVector3, value: number): MutableColorRgb;
    static divideVector(l_vec: IVector3, r_vec: IVector3): MutableColorRgb;
    static cross(l_vec: IVector3, r_vec: IVector3): MutableColorRgb;
    clone(): MutableColorRgb;
}

declare class MutableColorRgba extends MutableVector4 implements IMutableVector4, IMutableColorRgba {
    constructor(r: Float32Array);
    get x(): number;
    set x(val: number);
    get y(): number;
    set y(val: number);
    get z(): number;
    set z(val: number);
    get w(): number;
    set w(val: number);
    get r(): number;
    set r(val: number);
    get g(): number;
    set g(val: number);
    get b(): number;
    set b(val: number);
    get a(): number;
    set a(val: number);
    static zero(): MutableColorRgba;
    static one(): MutableColorRgba;
    static dummy(): MutableColorRgba;
    static normalize(vec: IVector4): MutableColorRgba;
    static add(l_vec: IVector4, r_vec: IVector4): MutableColorRgba;
    static subtract(l_vec: IVector4, r_vec: IVector4): MutableColorRgba;
    static multiply(vec: IVector4, value: number): MutableColorRgba;
    static multiplyVector(l_vec: IVector4, r_vec: IVector4): MutableColorRgba;
    static divide(vec: IVector4, value: number): MutableColorRgba;
    static divideVector(l_vec: IVector4, r_vec: IVector4): MutableColorRgba;
    clone(): MutableColorRgba;
}

declare class MutableQuaternion extends Quaternion implements IMutableQuaternion {
    constructor(x: Float32Array);
    set x(x: number);
    get x(): number;
    set y(y: number);
    get y(): number;
    set z(z: number);
    get z(): number;
    set w(w: number);
    get w(): number;
    get className(): string;
    static identity(): MutableQuaternion;
    static dummy(): MutableQuaternion;
    static invert(quat: IQuaternion): MutableQuaternion;
    static qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): MutableQuaternion;
    static lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): MutableQuaternion;
    static axisAngle(vec: IVector3, radian: number): MutableQuaternion;
    static fromMatrix(mat: IMatrix44): MutableQuaternion;
    static fromPosition(vec: IVector3): MutableQuaternion;
    static add(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaternion;
    static subtract(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaternion;
    static multiply(l_quat: IQuaternion, r_quat: IQuaternion): MutableQuaternion;
    static multiplyNumber(quat: IQuaternion, value: number): MutableQuaternion;
    static divideNumber(quat: IQuaternion, value: number): MutableQuaternion;
    raw(): Float32Array;
    setAt(i: number, value: number): this;
    setComponents(x: number, y: number, z: number, w: number): this;
    copyComponents(quat: IQuaternion): this;
    identity(): this;
    normalize(): this;
    invert(): this;
    qlerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): this;
    lerp(l_quat: IQuaternion, r_quat: IQuaternion, ratio: number): this;
    axisAngle(vec: IVector3, radian: number): this;
    fromMatrix(mat: IMatrix44): this;
    fromPosition(vec: IVector3): this;
    add(quat: IQuaternion): this;
    subtract(quat: IQuaternion): this;
    multiply(quat: IQuaternion): this;
    multiplyNumber(value: number): this;
    divideNumber(value: number): this;
    clone(): IMutableQuaternion;
    static fromFloat32Array(array: Float32Array): MutableQuaternion;
    static fromCopyArray4(array: Array4<number>): MutableQuaternion;
    static fromCopyArray(array: Array<number>): MutableQuaternion;
    static fromCopy4(x: number, y: number, z: number, w: number): MutableQuaternion;
    static fromCopyQuaternion(quat: IQuaternion): MutableQuaternion;
    static fromCopyVector4(vec: IVector4): MutableQuaternion;
    static fromCopyLogQuaternion(x: ILogQuaternion): MutableQuaternion;
}

/**
 * @internal
 */
declare class Scalar_<T extends TypedArrayConstructor> extends AbstractVector {
    constructor(v: TypedArray, { type }: {
        type: T;
    });
    getValue(): number;
    getValueInArray(): number[];
    get x(): number;
    get raw(): TypedArray;
    isStrictEqual(scalar: Scalar_<T>): boolean;
    isEqual(scalar: Scalar_<T>, delta?: number): boolean;
    get glslStrAsFloat(): string;
    get glslStrAsInt(): string;
    get wgslStrAsFloat(): string;
    get wgslStrAsInt(): string;
    static _fromCopyNumber(value: number, type: FloatTypedArrayConstructor): Scalar_<FloatTypedArrayConstructor>;
    static _dummy(type: FloatTypedArrayConstructor): Scalar_<FloatTypedArrayConstructor>;
    static get compositionType(): {
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: IndexOf16Bytes;
        readonly __dummyStr: "SCALAR";
        readonly webgpu: string;
        readonly wgsl: string;
        getNumberOfComponents(): Count;
        getGlslStr(componentType: ComponentTypeEnum): string;
        getGlslInitialValue(componentType: ComponentTypeEnum): string;
        getWgslInitialValue(componentType: ComponentTypeEnum): string;
        toWGSLType(componentType: ComponentTypeEnum): string;
        getVec4SizeOfProperty(): IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
        toString(): string;
        toJSON(): number;
    };
    get bytesPerComponent(): number;
}
/**
 * Immutable Scalar class with 32bit float components
 */
declare class Scalar$1 extends Scalar_<Float32ArrayConstructor> implements IScalar {
    constructor(x: TypedArray);
    static fromCopyNumber(value: number): Scalar$1;
    static zero(): Scalar$1;
    static one(): Scalar$1;
    static dummy(): Scalar$1;
    get className(): string;
    /**
     * change to string
     */
    toString(): string;
    clone(): Scalar$1;
}
/**
 * Immutable Scalar class with 64bit float components
 */
declare class Scalard extends Scalar_<Float64ArrayConstructor> {
    constructor(x: TypedArray);
    static fromCopyNumber(value: number): Scalard;
    static zero(): Scalard;
    static one(): Scalard;
    static dummy(): Scalard;
    clone(): Scalard;
}
type Scalarf = Scalar$1;

/**
 * @internal
 */
declare class MutableScalar_<T extends TypedArrayConstructor> extends Scalar_<T> {
    constructor(x: TypedArray, { type }: {
        type: T;
    });
    copyComponents(vec: Scalar_<T>): void;
    get x(): number;
    set x(x: number);
    get y(): number;
    get z(): number;
    get w(): number;
    /**
     * change to string
     */
    toString(): string;
    setValue(value: number): this;
    static get compositionType(): {
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: IndexOf16Bytes;
        readonly __dummyStr: "SCALAR";
        readonly webgpu: string;
        readonly wgsl: string;
        getNumberOfComponents(): Count;
        getGlslStr(componentType: ComponentTypeEnum): string;
        getGlslInitialValue(componentType: ComponentTypeEnum): string;
        getWgslInitialValue(componentType: ComponentTypeEnum): string;
        toWGSLType(componentType: ComponentTypeEnum): string;
        getVec4SizeOfProperty(): IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
        toString(): string;
        toJSON(): number;
    };
    get bytesPerComponent(): number;
}
/**
 * Mutable Scalar class with 32bit float components
 */
declare class MutableScalar extends MutableScalar_<Float32ArrayConstructor> {
    constructor(x: TypedArray);
    clone(): MutableScalar;
    static one(): MutableScalar;
    static dummy(): MutableScalar;
    static zero(): MutableScalar;
    get className(): string;
}
/**
 * Mutable Scalar class with 64bit float components
 */
declare class MutableScalard extends MutableScalar_<Float64ArrayConstructor> {
    constructor(x: TypedArray);
    clone(): MutableScalard;
    static one(): MutableScalard;
    static dummy(): MutableScalard;
    static zero(): MutableScalard;
}
type MutableScalarf = MutableScalar;

declare class Transform3D {
    private __position;
    private __scale;
    private __rotation;
    private __updateCount;
    private static __tmpMatrix44_0;
    private static __tmpVector3_0;
    private static __tmpVector3_1;
    private static __tmpVector3_2;
    private static __tmpQuaternion_0;
    constructor();
    constructor(Transform3D: Transform3D);
    isEqual(rhs: Transform3D, delta?: number): boolean;
    clone(): Transform3D;
    set position(vec: IVector3);
    setPositionAsArray3(array: Array3<number>): void;
    /**
     * return a copy of a local position vector
     */
    get position(): MutableVector3;
    /**
     * return a local position vector
     */
    get positionInner(): MutableVector3;
    set eulerAngles(vec: IVector3);
    /**
     * return a copy of a local rotation (XYZ euler) vector
     */
    get eulerAngles(): IVector3;
    /**
     * return a local rotation (XYZ euler) vector
     */
    get eulerAnglesInner(): Vector3;
    set scale(vec: IVector3);
    setScaleAsArray3(array: Array3<number>): void;
    /**
     * return a copy of a local scale vector
     */
    get scale(): IVector3;
    /**
     * return a local scale vector
     */
    get scaleInner(): MutableVector3;
    set rotation(quat: IQuaternion);
    setRotationAsArray4(array: Array4<number>): void;
    /**
     * return a copy of a local quaternion vector
     */
    get rotation(): IQuaternion;
    /**
     * return a local quaternion vector
     */
    get rotationInner(): Quaternion;
    __updateTransform(): void;
    set matrix(mat: IMatrix44);
    /**
     * return a copy of local transform matrix
     */
    get matrix(): IMatrix44;
    /**
     * return a local transform matrix
     */
    get matrixInner(): MutableMatrix44;
    getMatrixInnerTo(mat: MutableMatrix44): void;
    get updateCount(): number;
    set rotateMatrix44(rotateMatrix: IMatrix44);
    get rotateMatrix44(): IMatrix44;
    setPropertiesFromJson(arg: JSON): void;
    setRotationFromNewUpAndFront(UpVec: IVector3, FrontVec: IVector3): void;
    headToDirection(fromVec: Vector3, toVec: Vector3): void;
    /**
     * Set multiple transform information at once. By using this method,
     * we reduce the cost of automatically updating other transform components inside this class.
     * This method may be useful for animation processing and so on.
     *
     * The transform components of these arguments must not be mutually discrepant.
     * for example. The transform components of matrix argument (translate, rotate/quaternion, scale)
     * must be equal to translate, rotate, scale, quaternion arguments.
     * And both rotate and quaternion arguments must be same rotation.
     * If there is an argument passed with null or undefined, it is interpreted as unchanged.
     *
     * @param {*} translate
     * @param {*} scale
     * @param {*} rotation
     */
    setTransform(translate: MutableVector3, scale: MutableVector3, rotation: MutableQuaternion): void;
}

declare class VectorN {
    _v: TypedArray;
    constructor(typedArray: TypedArray);
    clone(): VectorN;
}

declare class AnimatedScalar extends Scalar$1 implements IScalar, IAnimatedValue {
    private __animationSamplers;
    private __firstActiveAnimationTrackName;
    private __firstActiveAnimationSampler;
    private __secondActiveAnimationTrackName?;
    private __secondActiveAnimationSampler?;
    private __blendingRatio;
    private __time?;
    private __lastTime;
    isLoop: boolean;
    constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName);
    getNumberArray(): number[];
    setFloat32Array(array: Float32Array): void;
    setTime(time: number): void;
    useGlobalTime(): void;
    set blendingRatio(value: number);
    get blendingRatio(): number;
    get x(): number;
    update(): void;
    setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    getFirstActiveAnimationTrackName(): string;
    getSecondActiveAnimationTrackName(): string | undefined;
    getMinStartInputTime(trackName: AnimationTrackName): number;
    getMaxEndInputTime(trackName: AnimationTrackName): number;
    getAllTrackNames(): string[];
    getAnimationSampler(trackName: AnimationTrackName): AnimationSampler;
    deleteAnimationSampler(trackName: AnimationTrackName): void;
    setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler): void;
}

declare class AnimatedVector2 extends Vector2 implements IVector2, IAnimatedValue {
    private __animationSamplers;
    private __firstActiveAnimationTrackName;
    private __firstActiveAnimationSampler;
    private __secondActiveAnimationTrackName?;
    private __secondActiveAnimationSampler?;
    private __blendingRatio;
    private __time?;
    private __lastTime;
    isLoop: boolean;
    constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName);
    getNumberArray(): number[];
    setFloat32Array(array: Float32Array): void;
    setTime(time: number): void;
    useGlobalTime(): void;
    set blendingRatio(value: number);
    get blendingRatio(): number;
    get x(): number;
    get y(): number;
    get z(): number;
    update(): void;
    setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    getFirstActiveAnimationTrackName(): string;
    getSecondActiveAnimationTrackName(): string | undefined;
    getMinStartInputTime(trackName: AnimationTrackName): number;
    getMaxEndInputTime(trackName: AnimationTrackName): number;
    getAllTrackNames(): string[];
    getAnimationSampler(trackName: AnimationTrackName): AnimationSampler;
    deleteAnimationSampler(trackName: AnimationTrackName): void;
    setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler): void;
}

declare class AnimatedVector3 extends Vector3 implements IVector3, IAnimatedValue {
    private __animationSamplers;
    private __firstActiveAnimationTrackName;
    private __firstActiveAnimationSampler;
    private __secondActiveAnimationTrackName?;
    private __secondActiveAnimationSampler?;
    private __blendingRatio;
    private __time?;
    private __lastTime;
    isLoop: boolean;
    constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName);
    getNumberArray(): number[];
    setFloat32Array(array: Float32Array): void;
    setTime(time: number): void;
    useGlobalTime(): void;
    set blendingRatio(value: number);
    get blendingRatio(): number;
    get x(): number;
    get y(): number;
    get z(): number;
    update(): void;
    setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    getFirstActiveAnimationTrackName(): string;
    getSecondActiveAnimationTrackName(): string | undefined;
    getMinStartInputTime(trackName: AnimationTrackName): number;
    getMaxEndInputTime(trackName: AnimationTrackName): number;
    getAllTrackNames(): string[];
    getAnimationSampler(trackName: AnimationTrackName): AnimationSampler;
    deleteAnimationSampler(trackName: AnimationTrackName): void;
    setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler): void;
}

declare class AnimatedVector4 extends Vector4 implements IVector4, IAnimatedValue {
    private __animationSamplers;
    private __firstActiveAnimationTrackName;
    private __firstActiveAnimationSampler;
    private __secondActiveAnimationTrackName?;
    private __secondActiveAnimationSampler?;
    private __blendingRatio;
    private __time?;
    private __lastTime;
    isLoop: boolean;
    constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName);
    getNumberArray(): number[];
    setFloat32Array(array: Float32Array): void;
    setTime(time: number): void;
    useGlobalTime(): void;
    set blendingRatio(value: number);
    get blendingRatio(): number;
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    update(): void;
    setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    getFirstActiveAnimationTrackName(): string;
    getSecondActiveAnimationTrackName(): string | undefined;
    getMinStartInputTime(trackName: AnimationTrackName): number;
    getMaxEndInputTime(trackName: AnimationTrackName): number;
    getAllTrackNames(): string[];
    getAnimationSampler(trackName: AnimationTrackName): AnimationSampler;
    deleteAnimationSampler(trackName: AnimationTrackName): void;
    setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler): void;
}

declare class AnimatedVectorN extends VectorN implements IAnimatedValue {
    private __animationSamplers;
    private __firstActiveAnimationTrackName;
    private __firstActiveAnimationSampler;
    private __secondActiveAnimationTrackName?;
    private __secondActiveAnimationSampler?;
    private __blendingRatio;
    private __time?;
    private __lastTime;
    isLoop: boolean;
    constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName);
    getNumberArray(): number[];
    setFloat32Array(array: Float32Array): void;
    setTime(time: number): void;
    useGlobalTime(): void;
    set blendingRatio(value: number);
    get blendingRatio(): number;
    update(): void;
    setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    getFirstActiveAnimationTrackName(): string;
    getSecondActiveAnimationTrackName(): string | undefined;
    getMinStartInputTime(trackName: AnimationTrackName): number;
    getMaxEndInputTime(trackName: AnimationTrackName): number;
    getAllTrackNames(): string[];
    getAnimationSampler(trackName: AnimationTrackName): AnimationSampler;
    deleteAnimationSampler(trackName: AnimationTrackName): void;
    setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler): void;
}

declare class AnimatedQuaternion extends Quaternion implements IQuaternion, IAnimatedValue {
    private __animationSamplers;
    private __firstActiveAnimationTrackName;
    private __firstActiveAnimationSampler;
    private __secondActiveAnimationTrackName?;
    private __secondActiveAnimationSampler?;
    private __blendingRatio;
    private __time?;
    private __lastTime;
    isLoop: boolean;
    constructor(animationSamplers: AnimationSamplers, activeAnimationTrackName: AnimationTrackName);
    getNumberArray(): number[];
    setFloat32Array(array: Float32Array): void;
    setTime(time: number): void;
    useGlobalTime(): void;
    set blendingRatio(value: number);
    get blendingRatio(): number;
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    update(): void;
    setFirstActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    setSecondActiveAnimationTrackName(animationTrackName: AnimationTrackName): void;
    getFirstActiveAnimationTrackName(): string;
    getSecondActiveAnimationTrackName(): string | undefined;
    getMinStartInputTime(trackName: AnimationTrackName): number;
    getMaxEndInputTime(trackName: AnimationTrackName): number;
    getAllTrackNames(): string[];
    getAnimationSampler(trackName: AnimationTrackName): AnimationSampler;
    deleteAnimationSampler(trackName: AnimationTrackName): void;
    setAnimationSampler(animationTrackName: AnimationTrackName, animationSampler: AnimationSampler): void;
}

type PhysicsPropertyInner = {
    type: PhysicsShapeTypeEnum;
    size: IVector3;
    position: IVector3;
    rotation: IVector3;
    move: boolean;
    density: number;
    friction: number;
    restitution: number;
};
type PhysicsProperty = {
    use: boolean;
    move: boolean;
    density: number;
    friction: number;
    restitution: number;
};

interface CubeDescriptor extends IAnyPrimitiveDescriptor {
    /** three width (width, height, depth) in (x, y, z) */
    widthVector?: IVector3;
    /** color */
    color?: IColorRgba;
    physics?: PhysicsProperty;
}
/**
 * The Cube Primitive class
 */
declare class Cube extends IShape {
    /**
     * Generates a cube object
     * @param _desc a descriptor object of a Cube
     */
    generate(_desc: CubeDescriptor): void;
}

/**
 * The argument descriptor for Plane primitives
 */
interface SphereDescriptor extends IAnyPrimitiveDescriptor {
    /** radius */
    radius?: number;
    /** the number of segments for width direction */
    widthSegments?: Count;
    /** the number of segments for height direction */
    heightSegments?: Count;
    inverseNormal?: boolean;
    physics?: PhysicsProperty;
}
/**
 * Sphere class
 */
declare class Sphere extends IShape {
    constructor();
    generate(_desc: SphereDescriptor): void;
}

type JointDescriptor = IAnyPrimitiveDescriptor;
/**
 * the Joint class
 */
declare class Joint extends IShape {
    private __worldPositionOfThisJoint;
    private __worldPositionOfParentJoint;
    private __width;
    /**
     * Generates a joint object
     */
    generate(desc: JointDescriptor): void;
}

declare function createShape(primitive: IShape): IMeshEntity;
declare const MeshHelper: Readonly<{
    createPlane: (desc?: PlaneDescriptor & {
        direction?: "xz" | "xy" | "yz";
    }) => IMeshEntity;
    createLine: (desc?: LineDescriptor) => IMeshEntity;
    createGrid: (desc?: GridDescriptor) => IMeshEntity;
    createCube: (desc?: CubeDescriptor) => IMeshEntity;
    createCubes: (numberToCreate: number, desc?: CubeDescriptor) => IMeshEntity[];
    createSphere: (desc?: SphereDescriptor) => IMeshEntity;
    createSpheres: (numberToCreate: number, desc?: SphereDescriptor) => IMeshEntity[];
    createJoint: (desc?: JointDescriptor) => IMeshEntity;
    createAxis: (desc?: AxisDescriptor) => IMeshEntity;
    createShape: typeof createShape;
}>;

declare class RenderBuffer extends RnObject implements IRenderable {
    width: number;
    height: number;
    private __internalFormat;
    _textureResourceUid: CGAPIResourceHandle;
    _textureViewResourceUid: CGAPIResourceHandle;
    _textureViewAsRenderTargetResourceUid: CGAPIResourceHandle;
    private __fbo?;
    private __isMSAA;
    private __sampleCountMSAA;
    constructor();
    set _fbo(fbo: FrameBuffer);
    get fbo(): FrameBuffer | undefined;
    get sampleCount(): number;
    create(width: Size, height: Size, internalFormat: TextureParameterEnum, { isMSAA, sampleCountMSAA }?: {
        isMSAA?: boolean | undefined;
        sampleCountMSAA?: number | undefined;
    }): void;
    createCubeTextureViewAsRenderTarget(faceIdx: Index, mipLevel: Index): void;
    resize(width: Size, height: Size): void;
    destroy3DAPIResources(): boolean;
}

declare class RenderTargetTexture2DArray extends AbstractTexture implements IRenderable {
    private __fbo?;
    private __arrayLength;
    constructor();
    create({ width, height, level, internalFormat, format, type, arrayLength, }: {
        width: Size;
        height: Size;
        level: number;
        internalFormat: TextureFormatEnum;
        format: PixelFormatEnum;
        type: ComponentTypeEnum;
        arrayLength: number;
    }): void;
    set _fbo(fbo: FrameBuffer);
    get fbo(): FrameBuffer | undefined;
    get arrayLength(): number;
    private __createRenderTargetTextureArray;
    changeRenderTargetLayerWebGPU(layerIndex: Index): void;
    resize(width: Size, height: Size): void;
    destroy3DAPIResources(): boolean;
    getTexturePixelData(): Promise<Uint8Array>;
    downloadTexturePixelData(): Promise<void>;
    /**
     * Origin is left bottom
     *
     * @param x horizontal pixel position (0 is left)
     * @param y vertical pixel position (0 is bottom)
     * @param argByteArray Pixel Data as Uint8Array
     * @returns Pixel Value in Vector4
     */
    getPixelValueAt(x: Index, y: Index, argByteArray?: Uint8Array): Promise<Vector4>;
    generateMipmaps(): void;
    blitToTexture2dFromTexture2dArray(targetTexture2D: RenderTargetTexture2DArray): void;
    blitToTexture2dFromTexture2dArrayFake(targetTexture2D: RenderTargetTexture2DArray): void;
    blitToTexture2dFromTexture2dArray2(targetTexture2D: RenderTargetTexture2DArray): void;
    createCubeTextureViewAsRenderTarget(faceIdx: Index, mipLevel: Index): void;
}

type VideoTextureArguments = {
    level: number;
    internalFormat: PixelFormatEnum;
    format: PixelFormatEnum;
    type: ComponentTypeEnum;
    magFilter: TextureParameterEnum;
    minFilter: TextureParameterEnum;
    wrapS: TextureParameterEnum;
    wrapT: TextureParameterEnum;
    generateMipmap: boolean;
    anisotropy: boolean;
    isPremultipliedAlpha?: boolean;
    mutedAutoPlay: boolean;
    playButtonDomElement?: HTMLElement;
};
declare class VideoTexture extends AbstractTexture {
    #private;
    private __imageData?;
    autoResize: boolean;
    autoDetectTransparency: boolean;
    private static __loadedBasisFunc;
    private static __basisLoadPromise?;
    constructor();
    private __getResizedCanvas;
    generateTextureFromVideo(video: HTMLVideoElement, { level, internalFormat, format, type, generateMipmap, mutedAutoPlay, }?: {
        level?: number | undefined;
        internalFormat?: TextureFormatEnum | undefined;
        format?: EnumIO | undefined;
        type?: {
            readonly __webgpu: string;
            readonly __wgsl: string;
            readonly __sizeInBytes: number;
            readonly __dummyStr: "UNSIGNED_BYTE";
            readonly wgsl: string;
            readonly webgpu: string;
            getSizeInBytes(): number;
            isFloatingPoint(): boolean;
            isInteger(): boolean;
            isUnsignedInteger(): boolean;
            readonly index: number;
            readonly symbol: symbol;
            readonly str: string;
            toString(): string;
            toJSON(): number;
        } | undefined;
        generateMipmap?: boolean | undefined;
        mutedAutoPlay?: boolean | undefined;
    }): Promise<void>;
    generateTextureFromUri(videoUri: string, { level, internalFormat, format, type, generateMipmap, mutedAutoPlay, playButtonDomElement, }?: {
        level?: number | undefined;
        internalFormat?: TextureFormatEnum | undefined;
        format?: EnumIO | undefined;
        type?: {
            readonly __webgpu: string;
            readonly __wgsl: string;
            readonly __sizeInBytes: number;
            readonly __dummyStr: "UNSIGNED_BYTE";
            readonly wgsl: string;
            readonly webgpu: string;
            getSizeInBytes(): number;
            isFloatingPoint(): boolean;
            isInteger(): boolean;
            isUnsignedInteger(): boolean;
            readonly index: number;
            readonly symbol: symbol;
            readonly str: string;
            toString(): string;
            toJSON(): number;
        } | undefined;
        generateMipmap?: boolean | undefined;
        mutedAutoPlay?: boolean | undefined;
        playButtonDomElement?: undefined;
    }): Promise<void>;
    updateTexture(): void;
    getCurrentFramePixelData(): (number | Uint8Array | undefined)[];
    set playbackRate(value: number);
    get playbackRate(): number;
    play(): void;
    pause(): void;
}

interface TextureParameters {
    level: number;
    format: TextureParameterEnum;
}
interface FrameBufferDescriptor {
    width: number;
    height: number;
    textureNum: number;
    textureFormats: TextureFormatEnum[];
    mipLevelCount?: number;
    createDepthBuffer: boolean;
    depthTextureFormat?: TextureFormatEnum;
}
declare function createFrameBuffer(desc: FrameBufferDescriptor): FrameBuffer;
interface FrameBufferMSAADescriptor {
    width: number;
    height: number;
    colorBufferNum: number;
    colorFormats: TextureFormatEnum[];
    sampleCountMSAA: number;
    depthBufferFormat: TextureFormatEnum;
}
declare function createFrameBufferMSAA(desc: FrameBufferMSAADescriptor): FrameBuffer;
interface FrameBufferTextureArrayDescriptor {
    width: number;
    height: number;
    arrayLength: number;
    level: number;
    internalFormat: TextureFormatEnum;
    format: PixelFormatEnum;
    type: ComponentTypeEnum;
}
declare function createFrameBufferTextureArray(desc: FrameBufferTextureArrayDescriptor): [FrameBuffer, RenderTargetTexture2DArray];
interface FrameBufferTextureArrayForMultiViewDescriptor {
    width: number;
    height: number;
    arrayLength: number;
    level: number;
    internalFormat: TextureFormatEnum;
    format: PixelFormatEnum;
    type: ComponentTypeEnum;
}
declare function createFrameBufferTextureArrayForMultiView(desc: FrameBufferTextureArrayForMultiViewDescriptor): FrameBuffer;
interface FrameBufferCubeMapDescriptor {
    width: number;
    height: number;
    textureFormat: TextureFormatEnum;
    mipLevelCount?: number;
}
declare function createFrameBufferCubeMap(desc: FrameBufferCubeMapDescriptor): [FrameBuffer, RenderTargetTextureCube];
declare function createDepthBuffer(width: number, height: number, { level, internalFormat }: {
    level?: number | undefined;
    internalFormat?: TextureFormatEnum | undefined;
}): FrameBuffer;
declare const RenderableHelper: Readonly<{
    createFrameBuffer: typeof createFrameBuffer;
    createFrameBufferMSAA: typeof createFrameBufferMSAA;
    createFrameBufferTextureArray: typeof createFrameBufferTextureArray;
    createFrameBufferTextureArrayForMultiView: typeof createFrameBufferTextureArrayForMultiView;
    createFrameBufferCubeMap: typeof createFrameBufferCubeMap;
    createDepthBuffer: typeof createDepthBuffer;
}>;

/**
 * Creates a RenderPass for Screen rendering.
 *
 * @param material
 * @returns
 */
declare function createScreenDrawRenderPass(material: Material): RenderPass;
/**
 * Creates a RenderPass for Screen rendering.
 *
 * @param material
 * @returns
 */
declare function createScreenDrawRenderPassWithBaseColorTexture(material: Material, texture: AbstractTexture, sampler?: Sampler): RenderPass;
declare const RenderPassHelper: Readonly<{
    createScreenDrawRenderPass: typeof createScreenDrawRenderPass;
    createScreenDrawRenderPassWithBaseColorTexture: typeof createScreenDrawRenderPassWithBaseColorTexture;
}>;

interface ICameraEntityMethods {
    getCamera(): CameraComponent;
}

interface ILightEntityMethods {
    getLight(): LightComponent;
}

declare class ShadowMap {
    private __shadowMomentFramebuffer;
    private __shadowMomentMaterial;
    constructor();
    getRenderPasses(entities: ISceneGraphEntity[], lightEntity: ISceneGraphEntity & ILightEntityMethods & ICameraEntityMethods): RenderPass[];
    getShadowMomentFramebuffer(): FrameBuffer;
}

declare class PointShadowMap {
    private __shadowMomentFramebuffer;
    private __shadowMomentFrontMaterials;
    private __shadowMomentBackMaterials;
    constructor();
    getRenderPasses(entities: ISceneGraphEntity[], lightEntity: ISceneGraphEntity & ILightEntityMethods): RenderPass[];
    getShadowMomentFramebuffer(): FrameBuffer;
}

declare class ShadowSystem {
    private __shadowMap;
    private __pointShadowMap;
    private __gaussianBlur;
    private __shadowMapArrayFramebuffer;
    private __pointShadowMapArrayFramebuffer;
    private __lightTypes;
    private __lightEnables;
    private __lightCastShadows;
    constructor(shadowMapSize: number);
    getExpressions(entities: ISceneGraphEntity[]): Expression[];
    private __setBlurredShadowMap;
    private __setParaboloidBlurredShadowMap;
    private __setDepthTextureIndexList;
    setDepthBiasPV(entities: ISceneGraphEntity[]): void;
    isLightChanged(): boolean;
}

/**
 * Asset loader configuration interface
 */
interface AssetLoaderConfig {
    /** Limit on the number of concurrent loads */
    maxConcurrentLoads?: number;
    /** Timeout duration (in milliseconds). Set to 0 or negative value to disable timeout */
    timeout?: number;
}
/**
 * Helper type to infer the result object type from the promise object type
 */
type AwaitedObject<T> = {
    [K in keyof T]: T[K] extends Promise<infer U> ? U : T[K];
};
/**
 * Type-safe asset loader class
 *
 * @example
 * ```typescript
 * // Default configuration with 60 second timeout
 * const assetLoader = new AssetLoader();
 *
 * // Configuration with custom settings
 * const customLoader = new AssetLoader({
 *   maxConcurrentLoads: 5,
 *   timeout: 30000 // 30 seconds
 * });
 *
 * // Disable timeout (wait indefinitely)
 * const noTimeoutLoader = new AssetLoader({
 *   timeout: 0 // or any negative value
 * });
 *
 * // Load promises in object format
 * const assets = await assetLoader.load({
 *   environment: Rn.CubeTexture.fromUrl({
 *     baseUrl: '/path/to/environment',
 *     mipmapLevelNumber: 1,
 *     isNamePosNeg: true,
 *     hdriFormat: Rn.HdriFormat.HDR_LINEAR,
 *   }),
 *   specular: Rn.CubeTexture.fromUrl({
 *     baseUrl: '/path/to/specular',
 *     mipmapLevelNumber: 10,
 *     isNamePosNeg: true,
 *     hdriFormat: Rn.HdriFormat.RGBE_PNG,
 *   }),
 *   diffuse: Rn.CubeTexture.fromUrl({
 *     baseUrl: '/path/to/diffuse',
 *     mipmapLevelNumber: 1,
 *     isNamePosNeg: true,
 *     hdriFormat: Rn.HdriFormat.RGBE_PNG,
 *   })
 * });
 *
 * console.log(assets.environment); // CubeTexture
 * console.log(assets.specular); // CubeTexture
 * console.log(assets.diffuse); // CubeTexture
 * ```
 */
declare class AssetLoader {
    private config;
    private loadingQueue;
    private activeLoads;
    constructor(config?: AssetLoaderConfig);
    /**
     * Load promises in object format
     */
    load<T extends Record<string, Promise<any>>>(promiseObject: T): Promise<AwaitedObject<T>>;
    /**
     * Load a single promise
     */
    loadSingle<T>(promise: Promise<T>): Promise<T>;
    /**
     * Load a single promise with multiple retry factories
     */
    loadWithRetrySingle<T>(promiseFactories: Array<() => Promise<T>>): Promise<T>;
    /**
     * Load multiple promises in bulk (array format)
     */
    loadArray<T>(promises: Promise<T>[]): Promise<T[]>;
    /**
     * Load multiple promises in bulk (tuple of different types)
     */
    loadArray<T extends readonly unknown[]>(promises: readonly [...{
        [K in keyof T]: Promise<T[K]>;
    }]): Promise<T>;
    /**
     * Load with retry factories in array format
     */
    loadWithRetryArray<T>(promiseFactories: Array<Array<() => Promise<T>>>): Promise<T[]>;
    /**
     * Load with retry factories in object format
     */
    loadWithRetry<T extends Record<string, Promise<any>>>(promiseFactories: {
        [K in keyof T]: Array<() => T[K]>;
    }): Promise<AwaitedObject<T>>;
    /**
     * Load a single promise with multiple retry factories
     */
    private loadSingleWithMultipleRetries;
    /**
     * Process the loading queue
     */
    private processQueue;
    /**
     * Execute the actual loading process
     */
    private executeLoad;
    /**
     * Get the current loading status
     */
    getLoadingStatus(): {
        active: number;
        queued: number;
    };
    /**
     * Wait until all loads are complete
     */
    waitForAllLoads(): Promise<void>;
}
/**
 * Default asset loader instance
 */
declare const defaultAssetLoader: AssetLoader;

/**
 * TransformComponent is a component that manages the transform of an entity.
 *
 */
declare class TransformComponent extends Component {
    private __rest;
    private __pose;
    private __updateCountAtLastLogic;
    private static __updateCount;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    static get renderedPropertyCount(): null;
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    get restOrPose(): Transform3D;
    static get updateCount(): number;
    _backupTransformAsRest(): void;
    _restoreTransformFromRest(): void;
    get localTransform(): Transform3D;
    set localTransform(transform: Transform3D);
    get localTransformRest(): Transform3D;
    set localTransformRest(transform: Transform3D);
    set localPosition(vec: IVector3);
    set localPositionWithoutPhysics(vec: IVector3);
    setLocalPositionAsArray3(array: Array3<number>): void;
    /**
     * return a copy of a local translate vector
     */
    get localPosition(): IVector3;
    /**
     * return a local translate vector
     */
    get localPositionInner(): MutableVector3;
    /**
     * set a local translate vector as Rest
     */
    set localPositionRest(vec: IVector3);
    /**
     * return a copy of a local translate vector
     */
    get localPositionRest(): IVector3;
    /**
     * return a local translate vector
     */
    get localPositionRestInner(): MutableVector3;
    set localEulerAngles(vec: IVector3);
    set localEulerAnglesWithoutPhysics(vec: IVector3);
    /**
     * return a copy of a local rotation (XYZ euler) vector
     */
    get localEulerAngles(): IVector3;
    /**
     * return a local rotation (XYZ euler) vector
     */
    get localEulerAnglesInner(): Vector3;
    /**
     * set a local rotation (XYZ euler) vector as Rest
     */
    set localEulerAnglesRest(vec: IVector3);
    /**
     * return a copy of a local rotation (XYZ euler) vector
     */
    get localEulerAnglesRest(): IVector3;
    /**
     * return a local rotation (XYZ euler) vector
     */
    get localEulerAnglesRestInner(): Vector3;
    set localScale(vec: IVector3);
    set localScaleWithoutPhysics(vec: IVector3);
    setLocalScaleAsArray3(array: Array3<number>): void;
    /**
     * return a copy of a local scale vector
     */
    get localScale(): IVector3;
    /**
     * return a local scale vector
     */
    get localScaleInner(): MutableVector3;
    /**
     * set a local scale vector as Rest
     */
    set localScaleRest(vec: IVector3);
    /**
     * return a copy of a local scale vector
     */
    get localScaleRest(): IVector3;
    /**
     * return a local scale vector
     */
    get localScaleRestInner(): MutableVector3;
    set localRotation(quat: IQuaternion);
    set localRotationWithoutPhysics(quat: IQuaternion);
    setLocalRotationAsArray4(array: Array4<number>): void;
    /**
     * return a copy of a local quaternion vector
     */
    get localRotation(): IQuaternion;
    /**
     * return a local quaternion vector
     */
    get localRotationInner(): Quaternion;
    /**
     * set a local quaternion vector as Rest
     */
    set localRotationRest(quat: IQuaternion);
    /**
     * return a copy of a local quaternion vector
     */
    get localRotationRest(): IQuaternion;
    /**
     * return a local quaternion vector
     */
    get localRotationRestInner(): Quaternion;
    set localMatrix(mat: IMatrix44);
    /**
     * return a copy of local transform matrix
     */
    get localMatrix(): IMatrix44;
    /**
     * return a local transform matrix
     */
    get localMatrixInner(): MutableMatrix44;
    getLocalMatrixInnerTo(mat: MutableMatrix44): void;
    /**
     * set a local transform matrix as Rest
     */
    set localMatrixRest(mat: IMatrix44);
    /**
     * return a copy of local transform matrix
     */
    get localMatrixRest(): IMatrix44;
    /**
     * return a local transform matrix
     */
    get localMatrixRestInner(): MutableMatrix44;
    $load(): void;
    $logic(): void;
    _shallowCopyFrom(component_: Component): void;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): ITransformEntity;
    _destroy(): void;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}

interface ITransformEntityMethods {
    getTransform(): TransformComponent;
    localPosition: IVector3;
    localScale: IVector3;
    localEulerAngles: IVector3;
    localRotation: IQuaternion;
    localMatrix: IMatrix44;
    localPositionInner: IVector3;
    localScaleInner: IVector3;
    localEulerAnglesInner: IVector3;
    localRotationInner: IQuaternion;
    localMatrixInner: IMatrix44;
    localPositionRest: IVector3;
    localScaleRest: IVector3;
    localEulerAnglesRest: IVector3;
    localRotationRest: IQuaternion;
    localMatrixRest: IMatrix44;
    localPositionRestInner: IVector3;
    localScaleRestInner: IVector3;
    localEulerAnglesRestInner: IVector3;
    localRotationRestInner: IQuaternion;
    localMatrixRestInner: IMatrix44;
}

interface ISceneGraphEntityMethods {
    getSceneGraph(): SceneGraphComponent;
    parent?: SceneGraphComponent;
    matrix: IMatrix44;
    matrixInner: IMatrix44;
    position: IVector3;
    positionRest: IVector3;
    scale: IVector3;
    eulerAngles: IVector3;
    rotation: IQuaternion;
    rotationRest: IQuaternion;
    addChild(sg: SceneGraphComponent): void;
    children: SceneGraphComponent[];
    removeChild(sg: SceneGraphComponent): void;
}

interface IMeshEntityMethods {
    getMesh(): MeshComponent;
}

interface ICameraController {
    logic(cameraComponent: CameraComponent): void;
    registerEventListeners(eventTargetDom: any): void;
    unregisterEventListeners(): void;
    setTarget(targetEntity: ISceneGraphEntity): void;
    setTargets(targetEntities: ISceneGraphEntity[]): void;
    getTargets(): ISceneGraphEntity[];
    updateCount: number;
}

/**
 * The Component that controls camera posture.
 */
declare class CameraControllerComponent extends Component {
    private __cameraController;
    private static __updateCount;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    set type(type: CameraControllerTypeEnum);
    get type(): CameraControllerTypeEnum;
    get controller(): ICameraController;
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    $load(): void;
    $logic(): void;
    _updateCount(count: number): void;
    static get updateCount(): number;
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}

interface ICameraControllerEntityMethods {
    getCameraController(): CameraControllerComponent;
}

interface IAnimationEntityMethods {
    getAnimation(): AnimationComponent;
}

interface ISkeletalEntityMethods {
    getSkeletal(): SkeletalComponent;
}

interface PhysicsStrategy {
    update(): void;
}

/**
 * PhysicsComponent is a component that manages the physics of an entity.
 *
 */
declare class PhysicsComponent extends Component {
    private __strategy?;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    setStrategy(strategy: PhysicsStrategy): void;
    get strategy(): PhysicsStrategy | undefined;
    static common_$logic(): void;
    $logic(): void;
    _destroy(): void;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}

interface IPhysicsEntityMethods {
    getPhysics(): PhysicsComponent;
}

interface IBlendShapeEntityMethods {
    getBlendShape(): BlendShapeComponent;
}

/**
 * IVrmConstraint is an interface for VRM constraints.
 */
interface IVrmConstraint {
    update(): void;
}

/**
 * ConstraintComponent is a component that manages constraints.
 *
 */
declare class ConstraintComponent extends Component {
    private __vrmConstraint?;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): IConstraintEntity;
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    $logic(): void;
    setConstraint(constraint: IVrmConstraint): void;
    _destroy(): void;
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}

interface IConstraintEntityMethods {
    getConstraint(): ConstraintComponent;
}

/**
 * AnimationStateComponent is a component that manages the state of an animation.
 *
 */
declare class AnimationStateComponent extends Component {
    private __activeAnimationTrack;
    private __interpolationStartTime;
    private __blendingDuration;
    private __isBlending;
    private __blendingRatio;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    get isBlending(): boolean;
    get blendingRatio(): number;
    $logic(): void;
    setFirstActiveAnimationTrack(trackName: AnimationTrackName): void;
    forceTransitionTo(trackName: AnimationTrackName, duration: number): void;
    setActiveAnimationTrack(animationTrackName: AnimationTrackName): void;
    setSecondActiveAnimationTrack(animationTrackName: AnimationTrackName): void;
    setUseGlobalTime(flg: boolean): void;
    setIsLoop(flg: boolean): void;
    setTime(time: number): void;
    setAnimationBlendingRatio(ratio: number): void;
    _destroy(): void;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): IAnimationStateEntity;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}

interface IAnimationStateEntityMethods {
    getAnimationState(): AnimationStateComponent;
}

type ITransformEntity = IEntity & ITransformEntityMethods;
type ISceneGraphEntity = ITransformEntity & ISceneGraphEntityMethods;
type IMeshEntity = ISceneGraphEntity & IMeshEntityMethods & IMeshRendererEntityMethods;
type ICameraEntity = ISceneGraphEntity & ICameraEntityMethods;
type ICameraControllerEntity = ICameraEntity & ICameraControllerEntityMethods;
type ISkeletalEntity = ISceneGraphEntity & ISkeletalEntityMethods;
type ILightEntity = ISceneGraphEntity & ILightEntityMethods;
type IPhysicsEntity = ISceneGraphEntity & IPhysicsEntityMethods;
type IBlendShapeEntity = IMeshEntity & IBlendShapeEntityMethods;
type IConstraintEntity = ISceneGraphEntity & IConstraintEntityMethods;
interface IAnimationEntity extends ISceneGraphEntity, IAnimationEntityMethods {
}
interface IAnimationStateEntity extends ISceneGraphEntity, IAnimationStateEntityMethods {
}
declare function createLightWithCameraEntity(): ILightEntity & ICameraEntityMethods;

/**
 * animation path name
 * type of animation.channel.target.path in glTF2
 * See: https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#_animation_channels
 */
type AnimationPathName = 'undefined' | 'translate' | 'quaternion' | 'scale' | 'weights' | `material/${string}` | 'light_color' | 'light_intensity' | 'light_range' | 'light_spot_innerConeAngle' | 'light_spot_outerConeAngle' | 'camera_znear' | 'camera_zfar' | 'camera_fovy' | 'camera_xmag' | 'camera_ymag' | 'effekseer';
type AnimationTrackName = string;
interface AnimationInfo {
    name: AnimationTrackName;
    minStartInputTime: Second;
    maxEndInputTime: Second;
}
/**
 * Similar to [Animation](https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-animation)
 */
type AnimationTrack = Map<AnimationPathName, AnimationChannel>;
type AnimationSamplers = Map<AnimationTrackName, AnimationSampler>;
/**
 * Similar to [Animation.Channel](https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-animation-channel)
 */
interface AnimationChannel {
    animatedValue: IAnimatedValue;
    target: AnimationChannelTarget;
}
/**
 * Similar to [Animation.Channel.Target](https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-animation-channel-target)
 */
interface AnimationChannelTarget {
    pathName: AnimationPathName;
    entity: ISceneGraphEntity;
}
/**
 * Similar to [Animation.Sampler](https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#reference-animation-sampler)
 */
interface AnimationSampler {
    input: Float32Array;
    output: Float32Array;
    outputComponentN: VectorComponentN;
    interpolationMethod: AnimationInterpolationEnum;
}
interface ChangeAnimationInfoEvent {
    infoMap: Map<AnimationTrackName, AnimationInfo>;
}
type AnimationComponentEventType = symbol;

type EventType = string | symbol;
type EventSubscriberIndex = number;
type CalledSubscriberNumber = number;
type EventHandler = (event: unknown) => void;
interface IEventPubSub {
    subscribe(type: EventType, handler: EventHandler): EventSubscriberIndex;
    unsubscribe(type: EventType, index: EventSubscriberIndex): void;
    unsubscribeAll(type: EventType, handler: EventHandler): void;
    publishAsync(type: EventType, event?: any): CalledSubscriberNumber;
    publishSync(type: EventType, event?: any): CalledSubscriberNumber;
}
declare class EventPubSub implements IEventPubSub {
    private __subscriberMap;
    subscribe(type: EventType, handler: EventHandler): EventSubscriberIndex;
    unsubscribe(type: EventType, index: EventSubscriberIndex): void;
    unsubscribeAll(type: EventType): void;
    publishAsync(type: EventType, event?: any): CalledSubscriberNumber;
    publishSync(type: EventType, event?: any): CalledSubscriberNumber;
}

interface IAnimationRetarget {
    retargetQuaternion(dstEntity: ISceneGraphEntity): IQuaternion;
    retargetTranslate(dstEntity: ISceneGraphEntity): IVector3;
    retargetScale(dstEntity: ISceneGraphEntity): IVector3;
    getEntity(): ISceneGraphEntity;
}

declare class GlobalRetarget implements IAnimationRetarget {
    private __srcEntity;
    constructor(srcEntity: ISceneGraphEntity);
    getEntity(): ISceneGraphEntity;
    getSrcPGRestQ(srcEntity: ISceneGraphEntity): IQuaternion;
    getDstPGRestQ(dstEntity: ISceneGraphEntity): IQuaternion;
    retargetQuaternion(dstEntity: ISceneGraphEntity): IQuaternion;
    retargetTranslate(dstEntity: ISceneGraphEntity): IVector3;
    retargetScale(dstEntity: ISceneGraphEntity): IVector3;
}

declare class GlobalRetargetReverse implements IAnimationRetarget {
    private __srcEntity;
    static readonly __rev: Quaternion;
    constructor(srcEntity: ISceneGraphEntity);
    getEntity(): ISceneGraphEntity;
    getSrcPGRestQ(srcEntity: ISceneGraphEntity): IQuaternion;
    getDstPGRestQ(dstEntity: ISceneGraphEntity): IQuaternion;
    retargetQuaternion(dstEntity: ISceneGraphEntity): IQuaternion;
    retargetTranslate(dstEntity: ISceneGraphEntity): IVector3;
    retargetScale(dstEntity: ISceneGraphEntity): IVector3;
}

declare class AbsoluteAnimation implements IAnimationRetarget {
    private __srcEntity;
    constructor(srcEntity: ISceneGraphEntity);
    getEntity(): ISceneGraphEntity;
    retargetQuaternion(dstEntity: ISceneGraphEntity): IQuaternion;
    retargetTranslate(dstEntity: ISceneGraphEntity): IVector3;
    retargetScale(dstEntity: ISceneGraphEntity): IVector3;
}

declare function createSkeletalEntity(): ISkeletalEntity;

/**
 * A component that manages animation.
 */
declare class AnimationComponent extends Component {
    private __animationBlendingRatio;
    private __animationTrack;
    static __animationGlobalInfo: Map<AnimationTrackName, AnimationInfo>;
    private __isEffekseerState;
    private __isAnimating;
    static isAnimating: boolean;
    isLoop: boolean;
    useGlobalTime: boolean;
    static globalTime: number;
    time: number;
    static readonly Event: {
        ChangeAnimationInfo: symbol;
        PlayEnd: symbol;
    };
    private static __tmpQuat;
    private static __tmpPos;
    private static __tmpScale;
    private static __pubsub;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    $load(): void;
    $logic(): void;
    set animationBlendingRatio(value: number);
    get animationBlendingRatio(): number;
    private __applyAnimation;
    static subscribe(type: AnimationComponentEventType, handler: EventHandler): void;
    setIsAnimating(flg: boolean): void;
    static setActiveAnimationForAll(animationTrackName: AnimationTrackName): void;
    setActiveAnimationTrack(animationTrackName: AnimationTrackName): void;
    setSecondActiveAnimationTrack(animationTrackName: AnimationTrackName): void;
    getActiveAnimationTrack(): string;
    hasAnimation(trackName: AnimationTrackName, pathName: AnimationPathName): boolean;
    /**
     * set an animation channel to AnimationSet
     * @param pathName - the name of animation path
     * @param animatedValue - the animated value
     */
    setAnimation(pathName: AnimationPathName, animatedValueArg: IAnimatedValue): void;
    getAnimation(pathName: AnimationPathName): IAnimatedValue | undefined;
    getStartInputValueOfAnimation(animationTrackName: string): number;
    getEndInputValueOfAnimation(animationTrackName: string): number;
    /**
     * get the Array of Animation Track Name
     * @returns Array of Animation Track Name
     */
    static getAnimationList(): AnimationTrackName[];
    /**
     * get the AnimationInfo of the Component
     * @returns the map of
     */
    static getAnimationInfo(): Map<AnimationTrackName, AnimationInfo>;
    /**
     * get animation track names of this component
     * @returns an array of animation track name
     */
    getAnimationTrackNames(): AnimationTrackName[];
    /**
     * get the animation channels of the animation track
     * @returns the channel maps of the animation track
     */
    getAnimationChannelsOfTrack(): AnimationTrack;
    get isAnimating(): boolean;
    static get startInputValue(): number;
    static get endInputValue(): number;
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): IAnimationEntity;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
    addKeyFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frameToInsert: Index, fps: number): boolean;
    addKeyFrameWithValue(trackName: AnimationTrackName, pathName: AnimationPathName, frameToInsert: Index, output: Array<number>, fps: number): boolean;
    deleteKeysAtFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frameToDelete: Index, fps: number): boolean;
    hasKeyFramesAtFrame(trackName: AnimationTrackName, pathName: AnimationPathName, frame: Index, fps: number): boolean;
    static setIsAnimating(flag: boolean): void;
    _shallowCopyFrom(component_: Component): void;
    _setRetarget(retarget: IAnimationRetarget, postfixToTrackName?: string): string[];
    resetAnimationTracks(): void;
    resetAnimationTrack(trackName: string): void;
    resetAnimationTrackByPostfix(postfix: string): void;
    _destroy(): void;
}

declare class EffekseerComponent extends Component {
    static readonly ANIMATION_EVENT_PLAY = 0;
    static readonly ANIMATION_EVENT_PAUSE = 1;
    static readonly ANIMATION_EVENT_END = 2;
    static Unzip?: any;
    uri?: string;
    arrayBuffer?: ArrayBuffer;
    type: string;
    playJustAfterLoaded: boolean;
    isLoop: boolean;
    isPause: boolean;
    static wasmModuleUri: undefined;
    randomSeed: number;
    isImageLoadWithCredential: boolean;
    private __effect?;
    private __context?;
    private __handle?;
    private __speed;
    private __timer?;
    private __isInitialized;
    private static __tmp_identityMatrix_0;
    private static __tmp_identityMatrix_1;
    private isLoadEffect;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    cancelLoop(): void;
    isPlay(): boolean;
    play(): boolean;
    continue(): void;
    pause(): void;
    stop(): void;
    set playSpeed(val: number);
    get playSpeed(): number;
    setTime(targetSec: Second): boolean;
    set translate(vec: IVector3);
    get translate(): IVector3;
    set rotate(vec: IVector3);
    get rotate(): IVector3;
    set scale(vec: IVector3);
    get scale(): IVector3;
    private __createEffekseerContext;
    $load(): void;
    $logic(): void;
    _destroy(): void;
    $render(): void;
    static sort_$render(renderPass: RenderPass): ComponentSID[];
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}
interface IEffekseerEntityMethods {
    getEffekseer(): EffekseerComponent;
}

type VrmExpressionName = string;
type VrmExpressionMorphBind = {
    entityIdx: Index;
    blendShapeIdx: Index;
    weight: number;
};
type VrmExpression = {
    name: VrmExpressionName;
    isBinary: boolean;
    binds: VrmExpressionMorphBind[];
};
/**
 * VrmComponent is a component that manages the VRM model.
 *
 */
declare class VrmComponent extends Component {
    private __expressions;
    private __weights;
    private __blendShapeComponent?;
    _version: string;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    setVrmExpressions(expressions: VrmExpression[]): void;
    setExpressionWeight(expressionName: VrmExpressionName, weight: number): void;
    getExpressionWeight(expressionName: VrmExpressionName): number | undefined;
    getExpressionNames(): string[];
    _shallowCopyFrom(component: Component): void;
    _destroy(): void;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}

interface IVrmEntityMethods {
    getVrm(): VrmComponent;
}

type ComponentMixinFunction = <EntityBaseClass extends MixinBase>(baseClass: EntityBaseClass, components: (typeof Component)[]) => {
    entityClass: MixinBase;
    components: (typeof Component)[];
};
type AllWellKnownComponentMethodsTypes = IAnimationStateEntityMethods | IAnimationEntityMethods | ITransformEntityMethods | ISceneGraphEntityMethods | IMeshEntityMethods | IMeshRendererEntityMethods | ILightEntityMethods | ICameraEntityMethods | ICameraControllerEntityMethods | ISkeletalEntityMethods | IBlendShapeEntityMethods | IPhysicsEntityMethods | IEffekseerEntityMethods | IVrmEntityMethods;
type IsThisAnimationState<T extends typeof Component, Possibles extends AllWellKnownComponentMethodsTypes> = T extends typeof AnimationStateComponent ? IAnimationStateEntityMethods : Exclude<Possibles, IAnimationStateEntityMethods>;
type IsThisAnimation<T extends typeof Component, Possibles extends AllWellKnownComponentMethodsTypes> = T extends typeof AnimationComponent ? IAnimationEntityMethods : Exclude<Possibles, IAnimationEntityMethods>;
type IsThisTransform<T extends typeof Component, Possibles extends AllWellKnownComponentMethodsTypes> = T extends typeof TransformComponent ? ITransformEntityMethods : Exclude<Possibles, ITransformEntityMethods>;
type IsThisSceneGraph<T extends typeof Component, Possibles extends AllWellKnownComponentMethodsTypes> = T extends typeof SceneGraphComponent ? ISceneGraphEntityMethods : Exclude<Possibles, ISceneGraphEntityMethods>;
type IsThisMesh<T extends typeof Component, Possibles extends AllWellKnownComponentMethodsTypes> = T extends typeof MeshComponent ? IMeshEntityMethods : Exclude<Possibles, IMeshEntityMethods>;
type IsThisMeshRenderer<T extends typeof Component, Possibles extends AllWellKnownComponentMethodsTypes> = T extends typeof MeshRendererComponent ? IMeshRendererEntityMethods : Exclude<Possibles, IMeshRendererEntityMethods>;
type IsThisCameraController<T extends typeof Component, Possibles extends AllWellKnownComponentMethodsTypes> = T extends typeof CameraControllerComponent ? ICameraControllerEntityMethods : Exclude<Possibles, ICameraControllerEntityMethods>;
type IsThisCamera<T extends typeof Component, Possibles extends AllWellKnownComponentMethodsTypes> = T extends typeof CameraComponent ? ICameraEntityMethods : Exclude<Possibles, ICameraEntityMethods>;
type IsThisLight<T extends typeof Component, Possibles extends AllWellKnownComponentMethodsTypes> = T extends typeof LightComponent ? ILightEntityMethods : Exclude<Possibles, ILightEntityMethods>;
type IsThisSkeletal<T extends typeof Component, Possibles extends AllWellKnownComponentMethodsTypes> = T extends typeof SkeletalComponent ? ISkeletalEntityMethods : Exclude<Possibles, ISkeletalEntityMethods>;
type IsThisBlendShape<T extends typeof Component, Possibles extends AllWellKnownComponentMethodsTypes> = T extends typeof BlendShapeComponent ? IBlendShapeEntityMethods : Exclude<Possibles, IBlendShapeEntityMethods>;
type IsThisPhysics<T extends typeof Component, Possibles extends AllWellKnownComponentMethodsTypes> = T extends typeof PhysicsComponent ? IPhysicsEntityMethods : Exclude<Possibles, IPhysicsEntityMethods>;
type IsThisEffekseer<T extends typeof Component, Possibles extends AllWellKnownComponentMethodsTypes> = T extends typeof EffekseerComponent ? IEffekseerEntityMethods : Exclude<Possibles, IEffekseerEntityMethods>;
type IsThisVrm<T extends typeof Component, Possibles extends AllWellKnownComponentMethodsTypes> = T extends typeof VrmComponent ? IVrmEntityMethods : Exclude<Possibles, IVrmEntityMethods>;
type IsThisConstraint<T extends typeof Component, Possibles extends AllWellKnownComponentMethodsTypes> = T extends typeof ConstraintComponent ? IConstraintEntityMethods : Exclude<Possibles, IConstraintEntityMethods>;
type ComponentToComponentMethods<T extends typeof Component> = IsThisConstraint<T, IsThisVrm<T, IsThisEffekseer<T, IsThisPhysics<T, IsThisBlendShape<T, IsThisSkeletal<T, IsThisLight<T, IsThisCamera<T, IsThisCameraController<T, IsThisMeshRenderer<T, IsThisMesh<T, IsThisSceneGraph<T, IsThisTransform<T, IsThisAnimation<T, IsThisAnimationState<T, AllWellKnownComponentMethodsTypes>>>>>>>>>>>>>>>;

/**
 * The Component that manages the blend shape.
 */
declare class BlendShapeComponent extends Component {
    private __weights;
    private __targetNames;
    private static __updateCount;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityComponent: EntityRepository, isReUse: boolean);
    static get updateCount(): number;
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    set weights(weights: number[]);
    get weights(): number[];
    set targetNames(names: string[]);
    get targetNames(): string[];
    setWeightByIndex(index: Index, weight: number): void;
    $logic(): void;
    _destroy(): void;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}

declare const Effekseer: Readonly<{
    EffekseerComponent: typeof EffekseerComponent;
    createEffekseerEntity: () => IEntity & ITransformEntityMethods & ISceneGraphEntityMethods & IEffekseerEntityMethods;
}>;

/**
 * The Interface for an Entity.
 */
interface IEntity extends IRnObject {
    entityUID: EntityUID;
    _isAlive: boolean;
    _myLatestCopyEntityUID: EntityUID;
    getComponent(componentType: typeof Component): Component | undefined;
    getComponentByComponentTID(componentTID: ComponentTID): Component | undefined;
    _setComponent(componentType: typeof Component, com: Component): void;
    hasComponent(componentType: typeof Component): boolean;
    _removeComponent(componentTID: ComponentTID): void;
    tryToGetBlendShape(): BlendShapeComponent | undefined;
    tryToGetCamera(): CameraComponent | undefined;
    tryToGetCameraController(): CameraControllerComponent | undefined;
    tryToGetLight(): LightComponent | undefined;
    tryToGetMesh(): MeshComponent | undefined;
    tryToGetMeshRenderer(): MeshRendererComponent | undefined;
    tryToGetPhysics(): PhysicsComponent | undefined;
    tryToGetSceneGraph(): SceneGraphComponent | undefined;
    tryToGetSkeletal(): SkeletalComponent | undefined;
    tryToGetTransform(): TransformComponent | undefined;
    tryToGetAnimation(): AnimationComponent | undefined;
    tryToGetAnimationState(): AnimationStateComponent | undefined;
    tryToGetVrm(): VrmComponent | undefined;
    tryToGetConstraint(): ConstraintComponent | undefined;
    tryToGetEffekseer(): EffekseerComponent | undefined;
    _destroy(): void;
}
/**
 * The class that represents an entity.
 *
 * @remarks
 * The Rhodonite Entity Class which are an entities that exists in space.
 * Entities can acquire various functions by having components on themselves.
 */
declare class Entity extends RnObject implements IEntity {
    /** The Unique ID of Entity */
    private readonly ___entity_uid;
    /** The Map of components. All components must be managed in this map */
    protected __components: Map<ComponentTID, Component>;
    /** Invalid Entity UID constant value */
    static readonly invalidEntityUID = -1;
    _myLatestCopyEntityUID: number;
    /** No use yet */
    _isAlive: boolean;
    /**
     * The constructor of the Entity class.
     *
     * @remarks
     * When creating an Entity, use the createEntity method of the EntityRepository class
     * instead of directly calling this constructor.
     *
     * @param entityUID - The unique ID of the entity
     * @param isAlive - Whether this entity alive or not
     * @param entityComponent - The instance of EntityComponent (Dependency Injection)
     */
    constructor(entityUID: EntityUID, isAlive: boolean, components?: Map<ComponentTID, Component>);
    /**
     * Get Unique ID of the entity.
     */
    get entityUID(): number;
    /**
     * Sets a component to this entity.
     * @param component The component to set.
     *
     * @internal
     */
    _setComponent(componentType: typeof Component, component: Component): void;
    /**
     * return whether this entity has the component or not
     * @param componentType - The component to check
     * @returns
     */
    hasComponent(componentType: typeof Component): boolean;
    /**
     * Get the component of the specified type that the entity has
     * @param componentType
     */
    getComponent(componentType: typeof Component): Component | undefined;
    /**
     * Gets the component corresponding to the ComponentTID.
     * @param componentTID - The ComponentTID to get the component.
     */
    getComponentByComponentTID(componentTID: ComponentTID): Component | undefined;
    /**
     * @param componentTID
     *
     * @internal
     */
    _removeComponent(componentTID: ComponentTID): void;
    /**
     * try to get an Animation Component if the entity has it.
     * @returns AnimationComponent | undefined
     */
    tryToGetAnimation(): AnimationComponent | undefined;
    tryToGetAnimationState(): AnimationStateComponent | undefined;
    tryToGetBlendShape(): BlendShapeComponent | undefined;
    tryToGetCamera(): CameraComponent | undefined;
    tryToGetCameraController(): CameraControllerComponent | undefined;
    tryToGetLight(): LightComponent | undefined;
    tryToGetMesh(): MeshComponent | undefined;
    tryToGetMeshRenderer(): MeshRendererComponent | undefined;
    tryToGetPhysics(): PhysicsComponent | undefined;
    tryToGetSceneGraph(): SceneGraphComponent | undefined;
    tryToGetSkeletal(): SkeletalComponent | undefined;
    tryToGetTransform(): TransformComponent | undefined;
    tryToGetVrm(): VrmComponent | undefined;
    tryToGetConstraint(): ConstraintComponent | undefined;
    tryToGetEffekseer(): EffekseerComponent | undefined;
    /**
     * Mark the entity as destroyed
     */
    _destroy(): void;
}

/**
 * The class that generates and manages entities.
 */
declare class EntityRepository {
    private static __entity_uid_count;
    private static __entities;
    static _components: Array<Map<ComponentTID, Component>>;
    private static __updateCount;
    private constructor();
    /**
     * Creates an entity
     */
    static createEntity(): IEntity;
    /**
     * Deletes an entity.
     * @param entityUid - the entityUID of the entity to delete.
     */
    static deleteEntity(entityUid: EntityUID): void;
    /**
     * Deletes an entity and all its child entities.
     * @param entityUid - the entityUID of the entity to delete.
     */
    static deleteEntityRecursively(entityUid: EntityUID): void;
    /**
     * Shallow copies an entity.
     * @param entity - the entity to shallow copy.
     * @returns the shallow copied entity.
     */
    static shallowCopyEntity(entity: IEntity): IEntity;
    /**
     * Sets the joints to SkeletalComponent of entities.
     * @param entity - the entity to set the joints of.
     */
    private static __setJoints;
    /**
     * This is an internal function that shallow copies an entity.
     * @param entity - the entity to shallow copy.
     * @returns the shallow copied entity.
     */
    static _shallowCopyEntityInner(entity: IEntity): IEntity;
    /**
     * This is an internal function that handles the tag data of an entity.
     * @param newEntity - the entity to handle the tag data of.
     */
    private static __handleTagData;
    /**
     * Try to add a component to the entity by componentTID.
     * @param componentTID - the componentTID
     * @param entity - the entity
     * @returns the entity added a component
     */
    static tryToAddComponentToEntityByTID(componentTID: ComponentTID, entity: IEntity): IEntity;
    /**
     * Add a Component to the entity
     * @param componentClass - a ComponentClass to add
     * @param entity - the entity
     * @returns the entity added a component
     */
    static addComponentToEntity<ComponentType extends typeof Component, EntityType extends IEntity>(componentClass: ComponentType, entity: EntityType): EntityType & ComponentToComponentMethods<ComponentType>;
    /**
     * Remove components from the entity.
     * Note: the returned entity's type will be IEntity (most basic type).
     *       You have to cast it to appropriate type later.
     * @param componentClass The class object of the component to remove.
     * @param entityUid The entityUID of the entity.
     */
    static removeComponentFromEntity(componentClass: typeof Component, entity: IEntity): IEntity;
    /**
     * Gets the entity corresponding to the entityUID.
     * @param entityUid The entityUID of the entity.
     */
    static getEntity(entityUid: EntityUID): IEntity;
    /**
     * Gets the entity corresponding to the entityUID.
     * @param entityUid The entityUID of the entity.
     */
    getEntity(entityUid: EntityUID): IEntity;
    /**
     * Gets the specified component from the entity.
     * @param entityUid The entity to get the component from.
     * @param componentType The class object of the component to get.
     */
    static getComponentOfEntity(entityUid: EntityUID, componentType: typeof Component): Component | null;
    /**
     * Search entities by the given tags.
     * @param tags The tags to search
     */
    static searchByTags(tags: RnTags): IEntity[];
    /**
     * Gets entity by the unique name.
     * @param uniqueName The unique name of the entity.
     */
    static getEntityByUniqueName(uniqueName: string): IEntity | undefined;
    /**
     * Gets all entities.
     * @internal
     */
    static _getEntities(): IEntity[];
    /**
     * Gets the number of all entities.
     */
    static getEntitiesNumber(): number;
    static get updateCount(): number;
}
declare function applyMixins(derivedCtor: IEntity, baseCtor: any): void;
declare function createEntity(): IEntity;

/**
 * SceneGraphComponent is a component that represents a node in the scene graph.
 *
 */
declare class SceneGraphComponent extends Component {
    private __parent?;
    private __children;
    private __gizmoChildren;
    private _worldMatrix;
    private _worldMatrixRest;
    private _normalMatrix;
    private __isWorldMatrixUpToDate;
    private __isWorldMatrixRestUpToDate;
    private __isNormalMatrixUpToDate;
    private __worldMergedAABBWithSkeletal;
    private __worldMergedAABB;
    private __isWorldAABBDirty;
    private _isVisible;
    private _isBillboard;
    private __aabbGizmo?;
    private __locatorGizmo?;
    private __translationGizmo?;
    private __scaleGizmo?;
    private __transformGizmoSpace;
    private __latestPrimitivePositionAccessorVersion;
    toMakeWorldMatrixTheSameAsLocalMatrix: boolean;
    isRootJoint: boolean;
    jointIndex: number;
    _isCulled: boolean;
    private static readonly __originVector3;
    private static returnVector3;
    private static __sceneGraphs;
    private static isJointAABBShouldBeCalculated;
    private static invertedMatrix44;
    private static __tmp_mat4;
    private static __tmp_mat4_2;
    private static __tmp_mat4_3;
    private static __tmp_quat_0;
    private static __tmp_quat_1;
    private static __updateCount;
    private static __tmpAABB;
    private __lastTransformComponentsUpdateCount;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    set isVisible(flg: boolean);
    get isVisible(): boolean;
    static get updateCount(): number;
    setVisibilityRecursively(flag: boolean): void;
    set isBillboard(flg: boolean);
    get isBillboard(): boolean;
    setIsBillboardRecursively(flg: boolean): void;
    set isAABBGizmoVisible(flg: boolean);
    get isAABBGizmoVisible(): boolean;
    set isLocatorGizmoVisible(flg: boolean);
    get isLocatorGizmoVisible(): boolean;
    set isTranslationGizmoVisible(flg: boolean);
    get isTranslationGizmoVisible(): boolean;
    set isScaleGizmoVisible(flg: boolean);
    get isScaleGizmoVisible(): boolean;
    static getTopLevelComponents(): SceneGraphComponent[];
    isJoint(): boolean;
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    setWorldMatrixRestDirty(): void;
    setWorldMatrixRestDirtyRecursively(): void;
    setWorldMatrixDirty(): void;
    setWorldMatrixDirtyRecursively(): void;
    setWorldAABBDirtyParentRecursively(): void;
    /**
     * add a SceneGraph component as a child of this
     * @param sg a SceneGraph component
     */
    addChild(sg: SceneGraphComponent): void;
    /**
     * remove the child SceneGraph component from this
     * @param sg a SceneGraph component
     */
    removeChild(sg: SceneGraphComponent): void;
    /**
     * add a SceneGraph component as a child of this (But Gizmo only)
     * @param sg a SceneGraph component of Gizmo
     */
    _addGizmoChild(sg: SceneGraphComponent): void;
    get isTopLevel(): boolean;
    get children(): SceneGraphComponent[];
    get parent(): SceneGraphComponent | undefined;
    get matrixInner(): MutableMatrix44;
    get matrix(): MutableMatrix44;
    get matrixRestInner(): MutableMatrix44;
    get matrixRest(): MutableMatrix44;
    get normalMatrixInner(): MutableMatrix33;
    get entityWorldWithSkeletalMatrix(): MutableMatrix44;
    get entityWorldMatrixWithSkeletalInner(): MutableMatrix44;
    get normalMatrix(): MutableMatrix33;
    isWorldMatrixUpToDateRecursively(): boolean;
    private __calcWorldMatrixRecursively;
    private __calcWorldMatrixRestRecursively;
    getQuaternionRecursively(): IQuaternion;
    get worldPosition(): Vector3;
    getWorldPositionOf(localPosition: Vector3): IVector3;
    getWorldPositionOfTo(localPosition: Vector3, out: MutableVector3): MutableVector3;
    getLocalPositionOf(worldPosition: Vector3): Vector3;
    getLocalPositionOfTo(worldPosition: Vector3, out: MutableVector3): Vector3;
    getWorldAABB(): AABB;
    calcWorldMergedAABB(): AABB;
    get worldMergedAABB(): AABB;
    getWorldAABBWithSkeletal(): AABB;
    calcWorldMergedAABBWithSkeletal(): AABB;
    get worldMergedAABBWithSkeletal(): AABB;
    /**
     * castRay Methods
     *
     * @param srcPointInWorld a source position in world space
     * @param directionInWorld a direction vector in world space
     * @param dotThreshold threshold of the intersected triangle and the ray
     * @param ignoreMeshComponents mesh components to ignore
     * @returns information of intersection in world space
     */
    castRay(srcPointInWorld: Vector3, directionInWorld: Vector3, dotThreshold?: number, ignoreMeshComponents?: MeshComponent[]): RaycastResultEx2;
    /**
     * castRayFromScreen Methods
     *
     * @param x x position of screen
     * @param y y position of screen
     * @param camera a camera component
     * @param viewport a viewport vector4
     * @param dotThreshold threshold of the intersected triangle and the ray
     * @param ignoreMeshComponents mesh components to ignore
     * @returns information of intersection in world space
     */
    castRayFromScreen(x: number, y: number, camera: CameraComponent, viewport: Vector4, dotThreshold?: number, ignoreMeshComponents?: MeshComponent[]): RaycastResultEx2;
    $load(): void;
    $logic(): void;
    private __updateGizmos;
    setPositionWithoutPhysics(vec: IVector3): void;
    set position(vec: IVector3);
    setPositionToPhysics(vec: IVector3): void;
    get position(): MutableVector3;
    getPositionTo(outVec: MutableVector3): MutableVector3;
    get positionRest(): MutableVector3;
    getPositionRestTo(outVec: MutableVector3): MutableVector3;
    set eulerAngles(vec: IVector3);
    setEulerAnglesToPhysics(vec: IVector3): void;
    get eulerAngles(): Vector3;
    setRotationWithoutPhysics(quat: IQuaternion): void;
    set rotation(quat: IQuaternion);
    setRotationToPhysics(quat: IQuaternion): void;
    get rotation(): Quaternion;
    getRotationTo(outQuat: MutableQuaternion): MutableQuaternion;
    get rotationRest(): Quaternion;
    getRotationRest(endFn: (sg: SceneGraphComponent) => boolean): Quaternion;
    set scale(vec: IVector3);
    setScaleToPhysics(vec: IVector3): void;
    get scale(): MutableVector3;
    private __copyChild;
    _shallowCopyFrom(component_: Component): void;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): ISceneGraphEntity;
    setTransformGizmoSpace(space: 'local' | 'world'): void;
    _destroy(): void;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBase;
}

/**
 * A render pass is a collection of the resources which is used in rendering process.
 */
declare class RenderPass extends RnObject {
    private readonly __renderPassUID;
    private __entities;
    private __sceneGraphDirectlyAdded;
    private __topLevelSceneGraphComponents;
    private __meshComponents;
    private __optimizedMeshComponents;
    private __frameBuffer?;
    private __resolveFrameBuffer?;
    private __resolveFrameBuffer2?;
    private __viewport?;
    private __material?;
    private __primitiveMaterial;
    toClearColorBuffer: boolean;
    toClearDepthBuffer: boolean;
    toClearStencilBuffer: boolean;
    isDepthTest: boolean;
    /**
     * depth write mask for primitives drawing
     * false does not prevent depth clear.
     */
    depthWriteMask: boolean;
    clearColor: Vector4;
    clearDepth: number;
    clearStencil: number;
    cameraComponent?: CameraComponent;
    _drawVertexNumberForBufferLessRendering: number;
    _primitiveModeForBufferLessRendering: PrimitiveModeEnum;
    _dummyPrimitiveForBufferLessRendering: Primitive;
    isVrRendering: boolean;
    isOutputForVr: boolean;
    _lastOpaqueIndex: number;
    _lastTranslucentIndex: number;
    _lastBlendWithZWriteIndex: number;
    _lastBlendWithoutZWriteIndex: number;
    _lastPrimitiveUids: number[];
    _lastTransformComponentsUpdateCount: number;
    _lastCameraControllerComponentsUpdateCount: number;
    _lastSceneGraphComponentsUpdateCount: number;
    _renderedSomethingBefore: boolean;
    _isChangedSortRenderResult: boolean;
    /** Whether or not to draw opaque primitives contained in this render pass. */
    _toRenderOpaquePrimitives: boolean;
    /** Whether or not to draw translucent primitives contained in this render pass. */
    _toRenderTranslucentPrimitives: boolean;
    /** Whether or not to draw blend with ZWrite primitives contained in this render pass. */
    _toRenderBlendWithZWritePrimitives: boolean;
    /** Whether or not to draw blend without ZWrite primitives contained in this render pass. */
    _toRenderBlendWithoutZWritePrimitives: boolean;
    toRenderEffekseerEffects: boolean;
    __renderTargetColorAttachments?: RenderBufferTargetEnum[];
    private __preEachRenderFunc?;
    private __postEachRenderFunc?;
    private static __tmp_Vector4_0;
    static __mesh_uid_count: number;
    constructor();
    setToRenderOpaquePrimitives(toRender: boolean): void;
    setToRenderBlendWithoutZWritePrimitives(toRender: boolean): void;
    setToRenderBlendWithZWritePrimitives(toRender: boolean): void;
    setToRenderTranslucentPrimitives(toRender: boolean): void;
    isBufferLessRenderingMode(): boolean;
    /**
     * @brief Set this render pass to buffer-less rendering mode.
     * When this function is called, buffer-less rendering is performed only once with the specified number of vertices.
     * This is useful for e.g. full-screen drawing.
     * In this case, even if Entities are registered using the addEntities method, they will be ignored and will not be rendered.
     * @param primitiveMode The primitive mode to be used in buffer-less rendering.
     * @param drawVertexNumberWithoutEntities The number of vertices to be rendered in buffer-less rendering.
     * @param material The material to be used in buffer-less rendering.
     */
    setBufferLessRendering(primitiveMode: PrimitiveModeEnum, drawVertexNumberWithoutEntities: number, material: Material): void;
    /**
     * @brief Set this render pass to buffer-less rendering mode.
     * When this function is called, buffer-less rendering is performed only once with the specified number of vertices.
     * This is useful for e.g. full-screen drawing.
     * In this case, even if Entities are registered using the addEntities method, they will be ignored and will not be rendered.
     * @param material The material to be used in buffer-less rendering.
     */
    setBufferLessFullScreenRendering(material: Material): void;
    clone(): RenderPass;
    setPreRenderFunction(func: () => void): void;
    setPostRenderFunction(func: () => void): void;
    doPreRender(): void;
    doPostRender(): void;
    /**
     * Add entities to draw.
     * @param entities An array of entities.
     */
    addEntities(entities: ISceneGraphEntity[]): void;
    private __calcMeshComponents;
    /**
     * Gets the list of entities on this render pass.
     * @return An array of entities
     */
    get entities(): ISceneGraphEntity[];
    /**
     * Clear entities on this render pass.
     */
    clearEntities(): void;
    private __collectTopLevelSceneGraphComponents;
    private __collectMeshComponents;
    /**
     * Get all the MeshComponents list of the entities on this render pass.
     * @return An array of MeshComponents
     */
    get meshComponents(): MeshComponent[];
    /**
     * Get MeshComponents list to render
     * @return An array of MeshComponents
     */
    get _optimizedMeshComponents(): MeshComponent[];
    /**
     * Get all the highest level SceneGraphComponents list of the entities on this render pass.
     * @return An array of SceneGraphComponents
     */
    get sceneTopLevelGraphComponents(): SceneGraphComponent[];
    /**
     * Sets the target framebuffer of this render pass.
     * If two or more render pass share a framebuffer, Rhodonite renders entities to the same framebuffer in those render passes.
     * @param framebuffer A framebuffer
     */
    setFramebuffer(framebuffer?: FrameBuffer): void;
    setRenderTargetColorAttachments(indeces?: RenderBufferTargetEnum[]): void;
    getRenderTargetColorAttachments(): RenderBufferTargetEnum[] | undefined;
    /**
     * Gets the framebuffer if this render pass has the target framebuffer.
     * @return A framebuffer
     */
    getFramebuffer(): FrameBuffer | undefined;
    /**
     * Remove the existing framebuffer
     */
    removeFramebuffer(): void;
    /**
     * Sets the viewport of this render pass.
     * @param vec A Vector4 (Origin of coordinatesX, origin of coordinatesY, width, height).
     */
    setViewport(vec: IVector4): void;
    /**
     * Gets the viewport if this render pass has the viewport.
     * @return A Vector4 (Origin of coordinatesX, origin of coordinatesY, width, height).
     */
    getViewport(): MutableVector4 | undefined;
    setResolveFramebuffer(framebuffer?: FrameBuffer): void;
    getResolveFramebuffer(): FrameBuffer | undefined;
    setResolveFramebuffer2(framebuffer?: FrameBuffer): void;
    getResolveFramebuffer2(): FrameBuffer | undefined;
    _copyFramebufferToResolveFramebuffersWebGL(): void;
    private __copyFramebufferToResolveFramebufferInner;
    _copyResolve1ToResolve2WebGpu(): void;
    /**
     * Sets a material for the primitive on this render pass.
     * If Rhodonite draw the primitive using this render pass, Rhodonite uses this material instead of the material on the primitive.
     * @param material A material attaching to the primitive
     * @param primitive A target primitive
     */
    setMaterialForPrimitive(material: Material, primitive: Primitive): void;
    /**
     * Sets a material for all the primitive on this render pass.
     * For all the primitive, Rhodonite uses this material instead of the material on the primitive.
     * Where if this render pass has a map between primitive and material by setMaterialForPrimitive, Rhodonite uses the material mapped by primitive.
     * @param material A material attaching to the primitive
     */
    setMaterial(material: Material): void;
    get material(): Material | undefined;
    _getMaterialOf(primitive: Primitive): Material | undefined;
    private __hasMaterialOf;
    getAppropriateMaterial(primitive: Primitive): Material;
    get renderPassUID(): number;
}

/**
 * Expression specifies the order of render passes on rendering process.
 */
declare class Expression extends RnObject {
    private __renderPasses;
    constructor();
    clone(): Expression;
    /**
     * Add render passes to the end of this expression.
     */
    addRenderPasses(renderPasses: RenderPass[]): void;
    /**
     * Clear render passes of this expression.
     */
    clearRenderPasses(): void;
    /**
     * Gets the list of render passes of this expression.
     */
    get renderPasses(): RenderPass[];
    setViewport(viewport: IVector4): void;
}

interface ILoaderExtension {
    generateMaterial?(materialJson: RnM2Material): Material;
    isNeededToUseThisMaterial?(gltfJson: RnM2): boolean;
    setTextures?(gltfJson: RnM2, materialJson: RnM2Material): void;
    setupMaterial?(gltfJson: RnM2, materialJson: RnM2Material, material: Material): void;
    setUVTransformToTexture?(material: Material, samplerJson: RnM2TextureSampler): void;
    loadExtensionInfoAndSetToRootGroup?(rootGroup: ISceneGraphEntity, json: RnM2): void;
}

interface Gltf2AnyObject {
    [s: string]: any;
}
type Gltf2 = {
    asset: Gltf2Asset;
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
interface Gltf2Asset {
    copyright?: string;
    generator?: string;
    version: string;
    minVersion?: string;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
}
type Gltf2Scene = {
    name?: string;
    scene?: number;
    nodes?: number[];
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type AttributeName = 'POSITION' | 'NORMAL' | 'TANGENT' | 'TEXCOORD_0' | 'TEXCOORD_1' | 'TEXCOORD_2' | 'COLOR_0' | 'JOINTS_0' | 'WEIGHTS_0';
type Gltf2AccessorComponentTypeNumber = typeof GL_DATA_BYTE | typeof GL_DATA_UNSIGNED_BYTE | typeof GL_DATA_SHORT | typeof GL_DATA_UNSIGNED_SHORT | typeof GL_DATA_INT | typeof GL_DATA_UNSIGNED_INT | typeof GL_DATA_FLOAT;
type Gltf2AnimationAccessorCompositionTypeString = 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4';
type Gltf2AccessorCompositionTypeString = 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT2' | 'MAT3' | 'MAT4';
type Gltf2AccessorIndex = number;
type Gltf2Attributes = {
    [s: string]: number;
};
type Gltf2AttributeAccessors = Map<string, Gltf2Accessor>;
type Gltf2AttributeBlendShapes = Gltf2Attributes[];
type Gltf2AttributeBlendShapesAccessors = Gltf2AttributeAccessors[];
type Gltf2Primitive = {
    attributes: Gltf2Attributes;
    indices?: number;
    material?: number;
    mode?: number;
    targets?: Gltf2AttributeBlendShapes;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2Mesh = {
    primitives: Gltf2Primitive[];
    weights?: number[];
    name?: string;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2Node = {
    camera?: number;
    children?: number[];
    skin?: number;
    matrix?: number[];
    mesh?: number;
    rotation?: number[];
    scale?: number[];
    translation?: number[];
    weights?: number[];
    name?: string;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2Skin = {
    inverseBindMatrices?: number;
    bindShapeMatrix?: number[];
    skeleton?: number;
    joints: number[];
    name?: string;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2TextureInfo = {
    index: number;
    texCoord?: number;
    texture?: Gltf2Texture;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2OcclusionTextureInfo = {
    index: number;
    texCoord?: number;
    texture?: Gltf2Texture;
    strength?: number;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2NormalTextureInfo = {
    index: number;
    texCoord?: number;
    texture?: Gltf2Texture;
    scale?: number;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2PbrMetallicRoughness = {
    baseColorFactor?: Array4<number>;
    baseColorTexture?: Gltf2TextureInfo;
    metallicFactor?: number;
    roughnessFactor?: number;
    metallicRoughnessTexture?: Gltf2TextureInfo;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2Material = {
    pbrMetallicRoughness?: Gltf2PbrMetallicRoughness;
    normalTexture?: Gltf2NormalTextureInfo;
    occlusionTexture?: Gltf2OcclusionTextureInfo;
    emissiveTexture?: Gltf2TextureInfo;
    emissiveFactor?: Array3<number>;
    alphaMode?: string;
    alphaCutoff?: number;
    doubleSided?: boolean;
    name?: string;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2CameraOrthographic = {
    xmag: number;
    ymag: number;
    zfar: number;
    znear: number;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2CameraPerspective = {
    aspectRatio?: number;
    yfov: number;
    zfar?: number;
    znear: number;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2Camera = {
    orthographic?: Gltf2CameraOrthographic;
    perspective?: Gltf2CameraPerspective;
    type: string;
    name?: string;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2Image = {
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
type Gltf2AnimationPathName = 'translation' | 'rotation' | 'scale' | 'weights' | 'pointer' | 'effekseer';
type Gltf2AnimationChannelTarget = {
    node?: number;
    path: Gltf2AnimationPathName;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2AnimationSamplerIndex = number;
type Gltf2AnimationChannel = {
    sampler: Gltf2AnimationSamplerIndex;
    target: Gltf2AnimationChannelTarget;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2AnimationSamplerInterpolation = 'LINEAR' | 'STEP' | 'CUBICSPLINE';
type Gltf2AnimationSampler = {
    input: Gltf2AccessorIndex;
    output: Gltf2AccessorIndex;
    interpolation: Gltf2AnimationSamplerInterpolation;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2Animation = {
    channels: Gltf2AnimationChannel[];
    samplers: Gltf2AnimationSampler[];
    name?: string;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2Texture = {
    sampler?: number;
    source?: number;
    name?: string;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2TextureSampler = {
    magFilter?: number;
    minFilter?: number;
    wrapS?: number;
    wrapT?: number;
    name?: string;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2SparseValues = {
    bufferView: number;
    byteOffset?: number;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2SparseIndices = {
    bufferView: number;
    byteOffset?: number;
    componentType: number;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2Sparse = {
    count: number;
    indices?: Gltf2SparseIndices;
    values?: Gltf2SparseValues;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
type Gltf2Buffer = {
    uri?: string;
    byteLength: number;
    buffer?: Uint8Array;
    dataUri?: string;
    name?: string;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
};
interface Gltf2BufferView {
    buffer?: number;
    byteOffset?: number;
    byteLength: number;
    byteStride?: number;
    target?: number;
    name?: string;
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
}
interface Gltf2Accessor {
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
    extensions?: Gltf2AnyObject;
    extras?: Gltf2AnyObject;
}
type PointType = 'directional' | 'point' | 'spot';
type KHR_lights_punctual_Light = {
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
type KHR_lights_punctual = {
    lights: KHR_lights_punctual_Light[];
};
type GltfFileBuffers = {
    [s: string]: ArrayBuffer;
};
type GltfLoadOption = {
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
    shadow?: boolean;
    __isImportVRM0x?: boolean;
    __importedType?: 'gltf2' | 'glb2' | 'vrm0x' | 'vrm1' | 'draco' | 'undefined';
};
declare const TagGltf2NodeIndex = "gltf_node_index";
declare function isSameGlTF2TextureSampler(lhs: Gltf2TextureSampler, rhs: Gltf2TextureSampler): boolean;

interface ComponentTypeEnum extends EnumIO {
    wgsl: string;
    webgpu: string;
    getSizeInBytes(): number;
    isFloatingPoint(): boolean;
    isInteger(): boolean;
}
declare class ComponentTypeClass<TypeName extends string> extends EnumClass implements ComponentTypeEnum {
    readonly __webgpu: string;
    readonly __wgsl: string;
    readonly __sizeInBytes: number;
    readonly __dummyStr: TypeName;
    constructor({ index, str, sizeInBytes, wgsl, webgpu, }: {
        index: number;
        str: TypeName;
        sizeInBytes: number;
        wgsl: string;
        webgpu: string;
    });
    get wgsl(): string;
    get webgpu(): string;
    getSizeInBytes(): number;
    isFloatingPoint(): boolean;
    isInteger(): boolean;
    isUnsignedInteger(): boolean;
}
declare const Byte: ComponentTypeClass<"BYTE">;
declare const UnsignedByte: ComponentTypeClass<"UNSIGNED_BYTE">;
declare const Short: ComponentTypeClass<"SHORT">;
declare const UnsignedShort: ComponentTypeClass<"UNSIGNED_SHORT">;
declare const Int: ComponentTypeClass<"INT">;
declare const UnsignedInt: ComponentTypeClass<"UNSIGNED_INT">;
declare const Float: ComponentTypeClass<"FLOAT">;
declare function from$1(index: number): ComponentTypeEnum;
declare function fromString$1(str: string): ComponentTypeEnum;
declare function fromTypedArray(typedArray: TypedArray): ComponentTypeEnum;
declare function toTypedArray(componentType: ComponentTypeEnum): TypedArrayConstructor | undefined;
declare function fromWgslString$1(str_: string): ComponentTypeEnum;
declare function fromGlslString$1(str_: string): ComponentTypeEnum;
type Gltf2AccessorComponentType = typeof Byte | typeof UnsignedByte | typeof Short | typeof UnsignedShort | typeof Int | typeof UnsignedInt | typeof Float;
declare function toGltf2AccessorComponentType(componentTypeForGltf2: ComponentTypeEnum): Gltf2AccessorComponentTypeNumber;
declare const ComponentType: Readonly<{
    Unknown: ComponentTypeClass<"UNKNOWN">;
    Byte: ComponentTypeClass<"BYTE">;
    UnsignedByte: ComponentTypeClass<"UNSIGNED_BYTE">;
    Short: ComponentTypeClass<"SHORT">;
    UnsignedShort: ComponentTypeClass<"UNSIGNED_SHORT">;
    Int: ComponentTypeClass<"INT">;
    UnsignedInt: ComponentTypeClass<"UNSIGNED_INT">;
    Float: ComponentTypeClass<"FLOAT">;
    Double: ComponentTypeClass<"DOUBLE">;
    Bool: ComponentTypeClass<"BOOL">;
    HalfFloat: ComponentTypeClass<"HALF_FLOAT">;
    from: typeof from$1;
    fromTypedArray: typeof fromTypedArray;
    toTypedArray: typeof toTypedArray;
    toGltf2AccessorComponentType: typeof toGltf2AccessorComponentType;
    fromString: typeof fromString$1;
    fromGlslString: typeof fromGlslString$1;
    fromWgslString: typeof fromWgslString$1;
}>;

interface CompositionTypeEnum extends EnumIO {
    webgpu: string;
    wgsl: string;
    getNumberOfComponents(): Count;
    getGlslStr(componentType: ComponentTypeEnum): string;
    getGlslInitialValue(componentType: ComponentTypeEnum): string;
    toWGSLType(componentType: ComponentTypeEnum): string;
    getWgslInitialValue(componentType: ComponentTypeEnum): string;
    getVec4SizeOfProperty(): IndexOf16Bytes;
}
declare class CompositionTypeClass<TypeName extends string> extends EnumClass implements CompositionTypeEnum {
    readonly __numberOfComponents: number;
    readonly __glslStr: string;
    readonly __hlslStr: string;
    readonly __webgpuStr: string;
    readonly __wgslStr: string;
    readonly __isArray: boolean;
    readonly __vec4SizeOfProperty: IndexOf16Bytes;
    readonly __dummyStr: TypeName;
    constructor({ index, str, glslStr, hlslStr, wgsl, webgpu, numberOfComponents, vec4SizeOfProperty, isArray, }: {
        index: number;
        str: TypeName;
        glslStr: string;
        hlslStr: string;
        wgsl: string;
        webgpu: string;
        numberOfComponents: number;
        vec4SizeOfProperty: IndexOf16Bytes;
        isArray?: boolean;
    });
    get webgpu(): string;
    get wgsl(): string;
    getNumberOfComponents(): Count;
    getGlslStr(componentType: ComponentTypeEnum): string;
    getGlslInitialValue(componentType: ComponentTypeEnum): string;
    getWgslInitialValue(componentType: ComponentTypeEnum): string;
    toWGSLType(componentType: ComponentTypeEnum): string;
    getVec4SizeOfProperty(): IndexOf16Bytes;
}
declare const Scalar: CompositionTypeClass<"SCALAR">;
declare const Vec2: CompositionTypeClass<"VEC2">;
declare const Vec3: CompositionTypeClass<"VEC3">;
declare const Vec4: CompositionTypeClass<"VEC4">;
declare const Mat2: CompositionTypeClass<"MAT2">;
declare const Mat3: CompositionTypeClass<"MAT3">;
declare const Mat4: CompositionTypeClass<"MAT4">;
type VectorCompositionTypes = typeof Scalar | typeof Vec2 | typeof Vec3 | typeof Vec4;
declare function from(index: number): CompositionTypeEnum;
declare function fromString(str: string): CompositionTypeEnum;
declare function vectorFrom(componentN: number): CompositionTypeEnum;
declare function fromGlslString(str_: string): CompositionTypeEnum;
declare function fromWgslString(str_: string): CompositionTypeEnum;
declare function toGltf2AccessorCompositionTypeString(componentN: VectorAndSquareMatrixComponentN): Gltf2AccessorCompositionTypeString;
declare function toGltf2AnimationAccessorCompositionTypeString(componentN: VectorComponentN): Gltf2AccessorCompositionTypeString;
declare function toGltf2SquareMatrixAccessorCompositionTypeString(componentN: SquareMatrixComponentN): Gltf2AccessorCompositionTypeString;
type Gltf2AnimationAccessorCompositionType = typeof Scalar | typeof Vec2 | typeof Vec3 | typeof Vec4;
type Gltf2AccessorCompositionType = typeof Scalar | typeof Vec2 | typeof Vec3 | typeof Vec4 | typeof Mat2 | typeof Mat3 | typeof Mat4;
declare function toGltf2AnimationAccessorCompositionType(componentN: VectorComponentN): Gltf2AnimationAccessorCompositionType;
declare function isArray(compositionType: CompositionTypeEnum): boolean;
declare function isTexture(compositionType: CompositionTypeEnum): boolean;
declare const CompositionType: Readonly<{
    Unknown: CompositionTypeClass<"UNKNOWN">;
    Scalar: CompositionTypeClass<"SCALAR">;
    Vec2: CompositionTypeClass<"VEC2">;
    Vec3: CompositionTypeClass<"VEC3">;
    Vec4: CompositionTypeClass<"VEC4">;
    Mat2: CompositionTypeClass<"MAT2">;
    Mat3: CompositionTypeClass<"MAT3">;
    Mat4: CompositionTypeClass<"MAT4">;
    ScalarArray: CompositionTypeClass<"SCALAR_ARRAY">;
    Vec2Array: CompositionTypeClass<"VEC2_ARRAY">;
    Vec3Array: CompositionTypeClass<"VEC3_ARRAY">;
    Vec4Array: CompositionTypeClass<"VEC4_ARRAY">;
    Mat2Array: CompositionTypeClass<"MAT2_ARRAY">;
    Mat3Array: CompositionTypeClass<"MAT3_ARRAY">;
    Mat4Array: CompositionTypeClass<"MAT4_ARRAY">;
    Texture2D: CompositionTypeClass<"TEXTURE_2D">;
    Texture2DShadow: CompositionTypeClass<"TEXTURE_2D_SHADOW">;
    TextureCube: CompositionTypeClass<"TEXTURE_CUBE_MAP">;
    Texture2DRect: CompositionTypeClass<"TEXTURE_2D_RECT">;
    Texture2DArray: CompositionTypeClass<"TEXTURE_2D_ARRAY">;
    Mat4x3Array: CompositionTypeClass<"MAT4x3_ARRAY">;
    from: typeof from;
    fromString: typeof fromString;
    vectorFrom: typeof vectorFrom;
    fromGlslString: typeof fromGlslString;
    fromWgslString: typeof fromWgslString;
    isArray: typeof isArray;
    isTexture: typeof isTexture;
    toGltf2AnimationAccessorCompositionType: typeof toGltf2AnimationAccessorCompositionType;
    toGltf2AccessorCompositionTypeString: typeof toGltf2AccessorCompositionTypeString;
    toGltf2AnimationAccessorCompositionTypeString: typeof toGltf2AnimationAccessorCompositionTypeString;
    toGltf2SquareMatrixAccessorCompositionTypeString: typeof toGltf2SquareMatrixAccessorCompositionTypeString;
}>;

declare class Cache<T> {
    private __symbolWeakMap;
    constructor();
    register(value: T): void;
}

/**
 * This is from : https://github.com/threepointone/glamor/blob/667b480d31b3721a905021b26e1290ce92ca2879/docs/weakmaps.md#so-what-does-a-cache-built-with-a-weakmap-look-like
 * Thank you!
 */

type ObjectFnType = (arg: object) => unknown;
/**
 * Return the caching wrapper function
 * @param fn the target function for caching result
 * @returns
 */
declare const objectCachify: (fn: ObjectFnType) => ObjectFnType;
/**
 * Return the caching wrapper function
 * @param fn the target function for caching result
 * @returns
 */
declare const primitiveCachify1: <P extends primitives>(fn: (arg: P) => unknown) => ((arg: P) => unknown);

declare class SymbolWeakMap<V> {
    private __weakMap;
    constructor();
    /**
     * set key and value
     * @param symbol the key for access
     * @param value the value as a cache item
     * @returns true: succeed to set value, false: not set (already exists)
     */
    set(symbol: Symbol, value: V): boolean;
    /**
     * return the boolean value whether it have the key or not
     * @param symbol the key for access
     * @returns Whether it have the key or not.
     */
    has(symbol: Symbol): boolean;
    /**
     * return the number of this cache items
     * @returns the number of this cache items
     */
    /**
     * return the value in the cache by the key
     * @param symbol the key for access
     * @returns the value in the cache by the key
     */
    get(symbol: Symbol): V | undefined;
    /**
     * delete the value
     * @param symbol the key for access
     * @returns the flag of the deletion was succeed or not
     */
    delete(symbol: Symbol): boolean;
}

declare class RnException<ErrObj> extends Error {
    private err;
    static readonly _prefix = "\nRhodonite Exception";
    constructor(err: RnError<ErrObj>);
    getRnError(): RnError<ErrObj>;
}

interface RnError<ErrObj> {
    message: string;
    error: ErrObj;
}
/**
 * An interface to handle results in a unified manner,
 * regardless of whether they are successful or not.
 */
interface IResult<T, ErrObj> {
    andThen<U>(f: (value: T) => Result<U, ErrObj>): Result<U, ErrObj>;
    orElse<U>(f: () => Result<U, ErrObj>): Result<U, ErrObj>;
    /**
     * pattern matching
     * @param obj an object containing two pattern matching functions, Ok and Err.
     * @returns the result of the pattern matching function as a Result object.
     */
    match<R, ErrObj2>({ Ok, Err, }: {
        Ok: (value: T) => R;
        Err: (value: RnError<ErrObj>) => RnError<ErrObj2>;
    }): Result<R, ErrObj2>;
    /**
     * get the inner value.
     * If the result is Err, The callback function compensates the error with an alternative valid value.
     * So you can get the inner value whether the result is Ok or Err.
     * @param catchFn
     * @returns the inner value
     */
    unwrapWithCompensation(catchFn: (err: RnError<ErrObj>) => T): T;
    /**
     * get the inner value anyway.
     * If the result is Err, this method throws an exception.
     * @returns the inner value
     */
    unwrapForce(): T;
    /**
     * get the boolean value whether the result is Ok or not.
     * Do not use this method directly. Use isOk() function bellow instead.
     * @private
     * @returns whether the result is Ok or not
     */
    isOk(): this is Ok<T, ErrObj>;
    /**
     * get the boolean value whether the result is Err or not.
     * Do not use this method directly. Use isErr() function bellow instead.
     * @private
     * @returns whether the result is Err or not
     */
    isErr(): this is Err<T, ErrObj>;
    /**
     * get the name of class. i.e. 'Ok' or 'Err'
     */
    name(): string;
}
declare abstract class CResult<T, ErrObj> {
    protected val?: (T | RnError<ErrObj>) | undefined;
    constructor(val?: (T | RnError<ErrObj>) | undefined);
    match<R, ErrObj2>(obj: {
        Ok: (value: T) => R;
        Err: (value: RnError<ErrObj>) => RnError<ErrObj2>;
    }): Result<R, ErrObj2>;
    name(): string;
}
/**
 * a class indicating that the result is Ok (Succeeded).
 */
declare class Ok<T, ErrObj> extends CResult<T, ErrObj> implements IResult<T, ErrObj> {
    constructor(val?: T);
    andThen<U>(f: (value: T) => Result<U, ErrObj>): Result<U, ErrObj>;
    orElse<U>(f: () => Result<U, ErrObj>): Result<U, ErrObj>;
    /**
     * This method is essentially same to the Ok::and_then() in Rust language
     * @param f
     */
    unwrapWithCompensation(catchFn: (err: RnError<ErrObj>) => T): T;
    unwrapForce(): T;
    true(): this is Ok<T, ErrObj>;
    isOk(): this is Ok<T, ErrObj>;
    isErr(): this is Err<T, ErrObj>;
    /**
     * get the inner value safely.
     * @returns the inner value
     */
    get(): T;
}
/**
 * a class indicating that the result is Error (Failed).
 */
declare class Err<T, ErrObj> extends CResult<T, ErrObj> implements IResult<T, ErrObj> {
    _rnException: RnException<ErrObj>;
    constructor(val: RnError<ErrObj>);
    andThen<U>(f: (value: T) => Result<U, ErrObj>): Result<U, ErrObj>;
    orElse<U>(f: () => Result<U, ErrObj>): Result<U, ErrObj>;
    unwrapWithCompensation(catchFn: (err: RnError<ErrObj>) => T): T;
    unwrapForce(): never;
    false(): false;
    isOk(): this is Ok<T, ErrObj>;
    isErr(): this is Err<T, ErrObj>;
    /**
     * get the RnError object.
     * @returns the RnError object
     */
    getRnError(): RnError<ErrObj>;
    toString(): string;
}
type Result<T, ErrObj> = Ok<T, ErrObj> | Err<T, ErrObj>;
declare function assertIsOk(result: IResult<any, any>): asserts result is Ok<any, any>;
declare function assertIsErr(result: IResult<any, any>): asserts result is Err<any, any>;

declare class DataUtil {
    static crc32table: string[];
    static isNode(): boolean;
    static btoa(str: string): string;
    static atob(str: string): string;
    static dataUriToArrayBuffer(dataUri: string): ArrayBuffer;
    static arrayBufferToString(arrayBuffer: ArrayBuffer): string;
    static uint8ArrayToString(uint8Array: Uint8Array): string;
    static stringToBase64(str: string): string;
    static base64ToArrayBuffer(base64: string): ArrayBufferLike;
    static UInt8ArrayToDataURL(uint8array: Uint8Array, width: number, height: number): string;
    static loadResourceAsync(resourceUri: string, isBinary: boolean, resolveCallback: Function, rejectCallback: Function): Promise<any>;
    static toCRC32(str: string): number;
    static accessBinaryAsImage(bufferViewIndex: number, json: any, buffer: ArrayBuffer | Uint8Array, mimeType: string): string;
    static createBlobImageUriFromUint8Array(uint8Array: Uint8Array, mimeType: string): string;
    static takeBufferViewAsUint8Array(json: RnM2, bufferViewIndex: number, buffer: ArrayBuffer | Uint8Array): Uint8Array;
    static accessArrayBufferAsImage(arrayBuffer: ArrayBuffer | Uint8Array, imageType: string): string;
    static uint8ArrayToStringInner(uint8: Uint8Array): string;
    static getImageType(imageType: string): string;
    static getMimeTypeFromExtension(extension: string): string;
    static getExtension(fileName: string): string;
    static createUint8ArrayFromBufferViewInfo(json: RnM2 | glTF1, bufferViewIndex: number, buffer: ArrayBuffer | Uint8Array): Uint8Array;
    static createImageFromUri(uri: string, mimeType: string): RnPromise<HTMLImageElement>;
    static createDefaultGltfOptions(): GltfLoadOption;
    static fetchArrayBuffer(uri: string): Promise<Result<ArrayBuffer, unknown>>;
    static getResizedCanvas(image: HTMLImageElement, maxSize: Size): [HTMLCanvasElement, Size, Size];
    static detectTransparentPixelExistence(image: HTMLImageElement | HTMLCanvasElement | ImageData, threshold?: number): boolean;
    /**
     * get a value nearest power of two.
     *
     * @param x texture size.
     * @returns a value nearest power of two.
     */
    static getNearestPowerOfTwo(x: number): number;
    static calcPaddingBytes(originalByteLength: Byte$1, byteAlign: Byte$1): number;
    static addPaddingBytes(originalByteLength: Byte$1, byteAlign: Byte$1): number;
    static normalizedInt8ArrayToFloat32Array(from: Int8Array | number[]): Float32Array;
    static normalizedUint8ArrayToFloat32Array(from: Uint8Array | number[]): Float32Array;
    static normalizedInt16ArrayToFloat32Array(from: Int16Array | number[]): Float32Array;
    static normalizedUint16ArrayToFloat32Array(from: Uint16Array | number[]): Float32Array;
    /**
     * get a copy of the src arraybuffer
     * @param param0 copy description
     * @returns copied memory as ArrayBuffer
     */
    static getCopy({ src, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        srcByteOffset: Byte$1;
        copyByteLength: Byte$1;
        distByteOffset: Byte$1;
    }): ArrayBuffer;
    /**
     * get a copy of the src arraybuffer
     * @param param0 copy description
     * @returns copied memory as ArrayBuffer
     */
    static getCopyAs4Bytes({ src, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        srcByteOffset: Byte$1;
        copyByteLength: Byte$1;
        distByteOffset: Byte$1;
    }): ArrayBuffer;
    /**
     * get a copy of the src arraybuffer
     * @param param0 copy description
     * @returns copied memory as ArrayBuffer
     */
    static copyArrayBuffer({ src, dist, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        dist: ArrayBuffer;
        srcByteOffset: Byte$1;
        copyByteLength: Byte$1;
        distByteOffset: Byte$1;
    }): ArrayBuffer;
    /**
     * get a copy of the src arraybuffer
     * @param param0 copy description
     * @returns copied memory as ArrayBuffer
     */
    static copyArrayBufferWithPadding({ src, dist, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        dist: ArrayBuffer;
        srcByteOffset: Byte$1;
        copyByteLength: Byte$1;
        distByteOffset: Byte$1;
    }): ArrayBuffer;
    /**
     * get a copy of the src arraybuffer
     * @param param0 copy description
     * @returns copied memory as ArrayBuffer
     */
    static copyArrayBufferAs4Bytes({ src, dist, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        dist: ArrayBuffer;
        srcByteOffset: Byte$1;
        copyByteLength: Byte$1;
        distByteOffset: Byte$1;
    }): ArrayBuffer;
    /**
     * get a copy of the src arraybuffer with padding to be 4bytes aligined
     * @param param0 copy description
     * @returns copied memory as ArrayBuffer
     */
    static copyArrayBufferAs4BytesWithPadding({ src, dist, srcByteOffset, copyByteLength, distByteOffset, }: {
        src: ArrayBuffer;
        dist: ArrayBuffer;
        srcByteOffset: Byte$1;
        copyByteLength: Byte$1;
        distByteOffset: Byte$1;
    }): ArrayBuffer;
    static stringToBuffer(src: string): ArrayBuffer;
}

type SeamlessTextureData = {
    input: TextureDataFloat;
    Tinput: TextureDataFloat;
    Tinv: TextureDataFloat;
    colorSpaceVector1: MutableVector3;
    colorSpaceVector2: MutableVector3;
    colorSpaceVector3: MutableVector3;
    colorSpaceOrigin: MutableVector3;
    lutWidth: Size;
};
declare function precomputations(input: TextureDataFloat, // input: example image
LUT_WIDTH?: Size): SeamlessTextureData;
declare function convertHTMLImageElementToCanvas(image: HTMLImageElement, width: number, height: number): HTMLCanvasElement;
declare function combineImages(data: {
    r_image?: HTMLCanvasElement;
    g_image?: HTMLCanvasElement;
    b_image?: HTMLCanvasElement;
    a_image?: HTMLCanvasElement;
    width: number;
    height: number;
}): HTMLCanvasElement;
declare const ImageUtil: Readonly<{
    precomputations: typeof precomputations;
}>;

declare const IsObj: {
    defined(val: unknown, ...args: unknown[]): val is Exclude<Object, undefined>;
    undefined(val: unknown, ...args: unknown[]): val is undefined;
    null(val: unknown, ...args: unknown[]): val is null;
    exist(val?: unknown, ...args: unknown[]): val is Object;
    function(val: unknown, ...args: unknown[]): val is Function;
    true(val: unknown, ...args: unknown[]): boolean;
    truly(val: unknown, ...args: unknown[]): boolean;
    false(val: unknown, ...args: unknown[]): boolean;
    falsy(val: unknown, ...args: unknown[]): boolean;
    stringContaining(thisStr: string, queryStr: string): boolean;
};
declare const NotObj: {
    defined(val: unknown, ...args: unknown[]): val is undefined;
    undefined(val: unknown, ...args: unknown[]): val is Object;
    null(val: unknown, ...args: unknown[]): val is Object;
    exist(val?: unknown, ...args: unknown[]): val is undefined | null;
    function(val: unknown, ...args: unknown[]): val is Exclude<unknown, Function>;
    true(val: unknown, ...args: unknown[]): boolean;
    truly(val: unknown, ...args: unknown[]): boolean;
    false(val: unknown, ...args: unknown[]): boolean;
    falsy(val: unknown, ...args: unknown[]): boolean;
};
type IsImplType = typeof IsObj;
interface IsType extends IsImplType {
    not: typeof NotObj;
    all: typeof IsObj;
    any: typeof IsObj;
}
declare const Is: IsType;

declare const valueWithDefault: <T>({ value, defaultValue }: {
    value?: T;
    defaultValue: T;
}) => T;
declare const ifExistsThen: <T>(callback: (value: T) => void, value?: T) => value is T;
declare const ifExistsThenWithReturn: <T>(callback: (value: T) => T, value?: T) => T | undefined;
declare const ifDefinedThen: <T>(callback: (value: T) => void, value?: T) => value is T;
declare const ifDefinedThenWithReturn: <T>(callback: (value: T) => T, value?: T) => T | undefined;
declare const ifUndefinedThen: <T>(callback: () => void, value?: T) => value is T;
declare const ifUndefinedThenWithReturn: <T>(callback: () => T, value?: T) => T;
declare const ifNotExistsThen: <T>(callback: () => void, value?: T) => void;
declare const ifNotExistsThenWithReturn: <T>(callback: () => T, value?: T) => T;
declare const defaultValue: <T>(defaultValue: T, value?: T) => T;
declare const valueWithCompensation: <T>({ value, compensation, }: {
    value?: T;
    compensation: () => T;
}) => T;
declare const nullishToEmptyArray: <T>(value?: T[] | null) => T[];
declare const nullishToEmptyMap: <M, N>(value?: Map<M, N> | null) => Map<M, N>;
interface CompareResult {
    result: boolean;
    greater: number;
    less: number;
}
declare const greaterThan: (it: number, than: number) => CompareResult;
declare const lessThan: (it: number, than: number) => CompareResult;
declare const addLineNumberToCode: (shaderString: string) => string;
declare function assertExist<T>(val: T): asserts val is NonNullable<T>;
declare function deepCopyUsingJsonStringify(obj: {
    [k: string]: any;
}): {
    [k: string]: any;
};
declare function downloadArrayBuffer(fileNameToDownload: string, arrayBuffer: ArrayBuffer): void;
declare function downloadTypedArray(fileNameToDownload: string, typedArray: TypedArray): void;
declare const MiscUtil: Readonly<{
    isMobileVr: () => boolean;
    isMobile: () => boolean;
    isIOS: () => boolean;
    isSafari: () => boolean;
    preventDefaultForDesktopOnly: (e: Event) => void;
    isObject: (o: any) => boolean;
    fillTemplate: (templateString: string, templateVars: string) => string;
    isNode: () => boolean;
    concatArrayBuffers: (segments: ArrayBuffer[], sizes: Byte$1[], offsets: Byte$1[], finalSize?: Byte$1) => ArrayBufferLike;
    concatArrayBuffers2: ({ finalSize, srcs, srcsOffset, srcsCopySize, }: {
        finalSize: Byte$1;
        srcs: ArrayBuffer[];
        srcsOffset: Byte$1[];
        srcsCopySize: Byte$1[];
    }) => ArrayBuffer;
    addLineNumberToCode: (shaderString: string) => string;
    downloadArrayBuffer: typeof downloadArrayBuffer;
    downloadTypedArray: typeof downloadTypedArray;
}>;

interface IOption<T> {
    andThen<U>(f: (value: NonNullable<T>) => Option<NonNullable<U>>): Option<NonNullable<U>>;
    orElse<U>(f: () => Option<NonNullable<U>>): Option<NonNullable<U>>;
    match<U>(obj: {
        Some: (value: NonNullable<T>) => NonNullable<U> | U;
        None: () => NonNullable<U> | U;
    }): NonNullable<U> | U;
    unwrapOrDefault(altValue: NonNullable<T>): NonNullable<T>;
    unwrapOrElse(f: () => NonNullable<T>): NonNullable<T>;
    unwrapOrUndefined(): NonNullable<T> | undefined;
    unwrapForce(): NonNullable<T>;
    has(): this is Some<NonNullable<T>>;
    doesNotHave(): this is None;
}
/**
 * a class indicating that the included value exists.
 */
declare class Some<T> implements IOption<T> {
    private value;
    constructor(value: NonNullable<T>);
    /**
     * This method is essentially same to the Some::and_then() in Rust language
     * @param f
     */
    andThen<U>(f: (value: NonNullable<T>) => Option<NonNullable<U>>): Option<NonNullable<U>>;
    orElse<U>(f: () => Option<NonNullable<U>>): Option<NonNullable<U>>;
    match<U>(obj: {
        Some: (value: NonNullable<T>) => NonNullable<U> | U;
        None: () => NonNullable<U> | U;
    }): NonNullable<U> | U;
    /**
     * @param altValue
     * @returns
     */
    unwrapOrDefault(altValue: NonNullable<T>): NonNullable<T>;
    /**
     * @param altValue
     * @returns
     */
    unwrapOrElse(f: () => NonNullable<T>): NonNullable<T>;
    /**
     * @param altValue
     * @returns
     */
    unwrapForce(): NonNullable<T>;
    unwrapOrUndefined(): NonNullable<T> | undefined;
    get(): NonNullable<T>;
    has(): this is Some<NonNullable<T>>;
    doesNotHave(): this is None;
}
/**
 * a class indicating no existence.
 */
declare class None implements IOption<never> {
    andThen<U>(f: (value: never) => Option<NonNullable<U>>): Option<NonNullable<U>>;
    orElse<U>(f: () => Option<NonNullable<U>>): Option<NonNullable<U>>;
    match<U>(obj: {
        Some: (value: NonNullable<never>) => NonNullable<U> | U;
        None: () => NonNullable<U> | U;
    }): NonNullable<U> | U;
    unwrapOrDefault<T>(value: NonNullable<T>): NonNullable<T>;
    unwrapOrElse<T>(f: () => NonNullable<T>): NonNullable<T>;
    unwrapForce(): never;
    unwrapOrUndefined(): never;
    has(): this is Some<never>;
    doesNotHave(): this is None;
}
type Option<T> = Some<T> | None;
declare function assertHas(value: Option<any>): asserts value is Some<any>;
declare function assertDoesNotHave(value: Option<any>): asserts value is None;

declare class Time {
    private static __currentProcessBeginTime;
    private static __lastProcessBeginTime;
    private static __lastProcessEndTime;
    private static __lastTickTimeInterval;
    private static __systemStartTime;
    private static __intervalProcessBegin;
    /**
     * @internal
     */
    static _processBegin(): void;
    /**
     * @internal
     */
    static _processEnd(): void;
    static get timeAtProcessBeginMilliseconds(): number;
    static get timeAtProcessEndMilliseconds(): number;
    static get timeFromSystemStart(): number;
    static get lastTickTimeInterval(): number;
    static get intervalProcessBegin(): number;
    static get lastTimeTimeIntervalInMilliseconds(): number;
}

interface IWeakOption<B extends object, T> {
    unwrapOrDefault(base: B, altValue: T): T;
    unwrapOrElse(base: B, f: (...vals: any) => T): T;
    unwrapForce(base: B): T;
    unwrapOrUndefined(base: B): T | undefined;
    has(base: B): boolean;
}
declare class WeakOption<B extends object, T> implements IWeakOption<B, T> {
    private __weakMap;
    set(base: B, val: T): void;
    /**
     * @param altValue
     * @returns
     */
    unwrapOrDefault(base: B, altValue: T): T;
    /**
     * @param altValue
     * @returns
     */
    unwrapOrElse(base: B, f: (...vals: any) => T): T;
    /**
     * @returns
     */
    unwrapForce(base: B): T;
    unwrapOrUndefined(base: B): T | undefined;
    has(base: B): boolean;
}
/**
 * a class indicating that the included value exists.
 */
declare class WeakSome<B extends object, T> implements IWeakOption<B, T> {
    private __weakMap;
    constructor(base: B, value: T);
    /**
     * @param altValue
     * @returns
     */
    unwrapOrDefault(base: B, altValue: T): T;
    /**
     * @param altValue
     * @returns
     */
    unwrapOrElse(base: B, f: (value: T) => T): T;
    /**
     * @param altValue
     * @returns
     */
    unwrapForce(base: B): T;
    get(base: B): T;
    unwrapOrUndefined(base: B): T | undefined;
    has(base: B): true;
}
/**
 * a class indicating no existence.
 */
declare class WeakNone<B extends object> implements IWeakOption<B, never> {
    then(): WeakNone<B>;
    unwrapOrDefault<T>(base: B, value: T): T;
    unwrapOrElse(base: B, f: (...vals: any) => never): never;
    unwrapForce(base: B): never;
    unwrapOrUndefined(base: B): never;
    has(): false;
}

declare enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3,
    Assert = 4
}
declare class Logger {
    private static __messages;
    static logLevel: LogLevel;
    static isRichLog: boolean;
    static isAccumulateLog: boolean;
    private static __common;
    private static __clearAccumulatedLog;
    private static __formatLogs;
    private static __getLogLevelText;
    static error(message: string): string | undefined;
    static warn(message: string): string | undefined;
    static info(message: string): string | undefined;
    static debug(message: string): string | undefined;
    static assert(condition: boolean, message: string): string | undefined;
    static getAccumulatedLog(): string[];
}

declare class BufferView {
    private __buffer;
    private __byteOffsetInRawArrayBufferOfBuffer;
    private __byteOffsetInBuffer;
    private __byteLength;
    private __defaultByteStride;
    private __takenByte;
    private __takenAccessorCount;
    private __raw;
    private __accessors;
    constructor({ buffer, byteOffsetInBuffer, defaultByteStride, byteLength, raw, }: {
        buffer: Buffer;
        byteOffsetInBuffer: Byte$1;
        defaultByteStride: Byte$1;
        byteLength: Byte$1;
        raw: ArrayBuffer;
    });
    get defaultByteStride(): number;
    get byteLength(): number;
    /**
     * byteOffset in Buffer (includes byteOffset of Buffer in it's inner arraybuffer)
     */
    get byteOffsetInBuffer(): Byte$1;
    /**
     * byteOffset in Buffer (includes byteOffset of Buffer in it's inner arraybuffer)
     */
    get byteOffsetInRawArrayBufferOfBuffer(): number;
    get buffer(): Buffer;
    get isSoA(): boolean;
    get isAoS(): boolean;
    /**
     * get memory buffer as Uint8Array of this BufferView memory area data
     */
    getUint8Array(): Uint8Array;
    takeAccessor({ compositionType, componentType, count, byteStride, max, min, arrayLength, normalized, }: {
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        count: Count;
        byteStride?: Byte$1;
        max?: number[];
        min?: number[];
        arrayLength?: Size;
        normalized?: boolean;
    }): Result<Accessor, undefined>;
    takeAccessorWithByteOffset({ compositionType, componentType, count, byteOffsetInBufferView, byteStride, max, min, normalized, }: {
        compositionType: CompositionTypeEnum;
        componentType: ComponentTypeEnum;
        count: Count;
        byteOffsetInBufferView: Byte$1;
        byteStride?: Byte$1;
        max?: number[];
        min?: number[];
        normalized?: boolean;
    }): Result<Accessor, undefined>;
    private __takeAccessorInner;
    private __takeAccessorInnerWithByteOffset;
    isSame(rnBufferView: BufferView): boolean;
}

declare class Buffer {
    private __byteLength;
    private __byteOffset;
    private __takenBytesIndex;
    private __byteAlign;
    private __raw;
    private __name;
    private __bufferViews;
    constructor({ byteLength, buffer, name, byteAlign, }: {
        byteLength: Byte$1;
        buffer: ArrayBuffer;
        name: string;
        byteAlign: Byte$1;
    });
    set name(str: string);
    get name(): string;
    getArrayBuffer(): ArrayBuffer;
    private __padding;
    takeBufferView({ byteLengthToNeed, byteStride, }: {
        byteLengthToNeed: Byte$1;
        byteStride: Byte$1;
    }): Result<BufferView, {
        'Buffer.byteLength': Byte$1;
        'Buffer.takenSizeInByte': Byte$1;
    }>;
    takeBufferViewWithByteOffset({ byteLengthToNeed, byteStride, byteOffset, }: {
        byteLengthToNeed: Byte$1;
        byteStride: Byte$1;
        byteOffset: Byte$1;
    }): Result<BufferView, undefined>;
    _addTakenByteIndex(value: Byte$1): void;
    get byteLength(): number;
    get takenSizeInByte(): number;
    get byteOffsetInRawArrayBuffer(): number;
    getTypedArray(offset4bytesUnit: number, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, length?: number): TypedArray;
    isSame(buffer: Buffer): boolean;
}

/**
 * MemoryManager is a class that manages the memory of the library.
 */
declare class MemoryManager {
    private static __instance;
    private __buffers;
    private __buffersOnDemand;
    private __memorySizeRatios;
    private constructor();
    static createInstanceIfNotCreated({ cpuGeneric, gpuInstanceData, gpuVertexData, }: {
        cpuGeneric: number;
        gpuInstanceData: number;
        gpuVertexData: number;
    }): MemoryManager;
    private __makeMultipleOf4byteSize;
    static getInstance(): MemoryManager;
    getMemorySize(): number;
    private __createBuffer;
    getBuffer(bufferUse: BufferUseEnum): Buffer | undefined;
    createOrGetBuffer(bufferUse: BufferUseEnum): Buffer;
    createBufferOnDemand(size: Byte$1, object: RnObject, byteAlign: Byte$1): Buffer;
    getBufferOnDemand(object: RnObject): Buffer | undefined;
    static get bufferWidthLength(): Size;
    static get bufferHeightLength(): Size;
    printMemoryUsage(): void;
    dumpBuffer(bufferUse: BufferUseEnum): Buffer | undefined;
}

/**
 * Component is a functional unit that can be added to an Entity instance.
 */
declare class Component extends RnObject {
    private _component_sid;
    _isAlive: boolean;
    protected __currentProcessStage: ProcessStageEnum;
    private static __bufferViews;
    private static __accessors;
    private static __byteLengthSumOfMembers;
    private static __memberInfo;
    private static __members;
    private __byteOffsetOfThisComponent;
    /** the entity unique Id which this component belongs to  */
    protected __entityUid: EntityUID;
    /** the instance of MemoryManager */
    protected __memoryManager: MemoryManager;
    /** the instance of EntityRepository */
    protected __entityRepository: EntityRepository;
    /** the MaxComponent Number of entities */
    private __maxComponentNumber;
    static readonly _processStages: Array<ProcessStageEnum>;
    /**
     * The constructor of the Component class.
     * When creating an Component, use the createComponent method of the ComponentRepository class
     * instead of directly calling this constructor.
     * @param entityUid Unique ID of the corresponding entity
     * @param componentSid Scoped ID of the Component
     * @param entityRepository The instance of the EntityRepository class (Dependency Injection)
     */
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    /**
     * Move to the other stages of process
     * @param processStage stage of component's process
     */
    moveStageTo(processStage: ProcessStageEnum): void;
    /**
     * @internal
     * set the Max number of components
     * this method is called by the ***Component classes only
     */
    _setMaxNumberOfComponent(value: number): void;
    /**
     * Get the max number of components
     */
    get maxNumberOfComponent(): number;
    /**
     * Get the Type ID of the Component
     */
    static get componentTID(): number;
    /**
     * Get the Type ID of the Component
     */
    get componentTID(): number;
    /**
     * Get the Scoped ID of the Component
     */
    get componentSID(): number;
    /**
     * Get the unique ID of the entity corresponding to the component.
     */
    get entityUID(): number;
    /**
     * Get the current process stage of the component.
     */
    get currentProcessStage(): ProcessStageEnum;
    /**
     * Get true or false whether the specified ProcessStage exists in Component.
     * @returns true or false
     */
    static doesTheProcessStageMethodExist(componentType: typeof Component, processStage: ProcessStageEnum): boolean;
    /**
     * Get true or false whether the specified ProcessStage exists in Component.
     */
    isExistProcessStageMethod(processStage: ProcessStageEnum): boolean;
    /**
     * Process the components
     * @param param0 params
     */
    static process(componentType: typeof Component, processStage: ProcessStageEnum): void;
    static updateComponentsForRenderStage(componentClass: typeof Component, processStage: ProcessStageEnum, renderPass: RenderPass): any;
    /**
     * get byte length of sum of member fields in the component class
     */
    static getByteLengthSumOfMembers(bufferUse: BufferUseEnum, componentClass: Function): number;
    /**
     * register a dependency for the other components.
     * Note: This method is not used yet
     */
    registerDependency(component: Component, isMust: boolean): void;
    /**
     * take one memory area for the specified member for all same type of the component instances.
     */
    takeOne(memberName: string, dataClassType: any, initValues: number[], isReUse: boolean, componentSid: ComponentSID): any;
    /**
     * get the taken accessor for the member field.
     */
    static getAccessor(memberName: string, componentClass: Function): Accessor;
    /**
     * take one accessor for the member field.
     */
    static takeAccessor(bufferUse: BufferUseEnum, memberName: string, componentClass: Function, compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, count: Count): Result<Accessor, undefined>;
    static getByteOffsetOfThisComponentTypeInBuffer(bufferUse: BufferUseEnum, componentClass: Function): Byte$1;
    static getByteOffsetOfFirstOfThisMemberInBuffer(memberName: string, componentClass: Function): Byte$1;
    static getByteOffsetOfFirstOfThisMemberInBufferView(memberName: string, componentClass: Function): Byte$1;
    /**
     * Register a member field of component class for memory allocation.
     * @param bufferUse purpose type of buffer use
     * @param memberName the name of member field
     * @param dataClassType a class of data
     * @param componentType a type of number
     * @param initValues a initial value
     */
    registerMember(bufferUse: BufferUseEnum, memberName: string, dataClassType: unknown, componentType: ComponentTypeEnum, initValues: number[]): void;
    /**
     * Allocate memory of self member fields
     * @param count a number of entities to need allocate
     */
    submitToAllocation(count: Count, isReUse: boolean): void;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): IEntity;
    /**
     * get the bytes Information of the member
     * @param component a instance of the component
     * @param memberName the member of component in string
     * @returns bytes information
     */
    static getDataByteInfoInner(component: Component, memberName: string): {
        byteLength: number;
        byteOffsetInBuffer: number;
        byteOffsetInThisComponent: any;
        locationOffsetInBuffer: number;
        locationOffsetInThisComponent: any;
        thisComponentByteOffsetInBuffer: number;
        thisComponentLocationOffsetInBuffer: number;
        componentNumber: number;
    };
    /**
     * get the bytes Information of the member
     * @param memberName the member of component in string
     * @returns bytes information
     */
    getDataByteInfo(memberName: string): {
        byteLength: number;
        byteOffsetInBuffer: number;
        byteOffsetInThisComponent: any;
        locationOffsetInBuffer: number;
        locationOffsetInThisComponent: any;
        thisComponentByteOffsetInBuffer: number;
        thisComponentLocationOffsetInBuffer: number;
        componentNumber: number;
    };
    /**
     * get the bytes Information of the member (static version) by ComponentSID
     * @param componentType the Component type
     * @param componentSID the ComponentSID of the component
     * @param memberName the member of component in string
     * @returns bytes information
     */
    static getDataByteInfoByComponentSID(componentType: typeof Component, componentSID: ComponentSID, memberName: string): {
        byteLength: number;
        byteOffsetInBuffer: number;
        byteOffsetInThisComponent: any;
        locationOffsetInBuffer: number;
        locationOffsetInThisComponent: any;
        thisComponentByteOffsetInBuffer: number;
        thisComponentLocationOffsetInBuffer: number;
        componentNumber: number;
    } | undefined;
    /**
     * get the bytes Information of the member (static version) by EntityUID
     * @param componentType the component type
     * @param entityUID the EntityUID
     * @param memberName the member of component in string
     * @returns bytes information
     */
    /**
     * get the Pixel Location Offset in the Buffer of the Member
     * @param componentType the component type (e.g. TransformComponent )
     * @param memberName the member name in string
     * @returns the pixel offsets
     */
    static getLocationOffsetOfMemberOfComponent(componentType: typeof Component, memberName: string): number;
    /**
     * @virtual
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBase extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBase, _componentClass: SomeComponentClass): EntityBase & ComponentToComponentMethods<SomeComponentClass>;
    /**
     * Get the CompositionType of the member
     * @param memberName - the member name
     * @param componentClass - the component class
     * @returns CompositionType or undefined
     */
    static getCompositionTypeOfMember(memberName: string, componentClass: Function): CompositionTypeEnum | undefined;
    /**
     * Get the ComponentType of the member
     * @param memberName - the member name
     * @param componentClass - the component class
     * @returns ComponentType or undefined
     */
    static getComponentTypeOfMember(memberName: string, componentClass: Function): ComponentTypeEnum | undefined;
    /**
     * @internal
     * Mark the component as destroyed
     */
    _destroy(): void;
    _shallowCopyFrom(component: Component): void;
}

/**
 * The view frustum class.
 */
declare class Frustum {
    top: MutableVector4;
    bottom: MutableVector4;
    right: MutableVector4;
    left: MutableVector4;
    zNear: MutableVector4;
    zFar: MutableVector4;
    private __updated;
    private __vp;
    private __invProjMat;
    private __invViewMat;
    private __tmp_vec4_0;
    private __tmp_vec4_1;
    private __tmp_vec4_array;
    private __hCorners;
    corners: Vector4[];
    constructor();
    /**
     * Updates this view frustum data from the view and projection matrices.
     * @param viewMatrix The view matrix.
     * @param projectionMatrix The projection matrix.
     */
    update(viewMatrix: Matrix44, projectionMatrix: Matrix44): void;
    /**
     * false if fully outside, true if inside or intersects
     *
     * original idea is from https://iquilezles.org/articles/frustumcorrect/
     */
    culling(meshComponent: MeshComponent): boolean;
    getPlane(i: Index): MutableVector4;
}

/**
 * The Component that represents a camera.
 *
 * @remarks
 * The camera is defined such that the local +X axis is to the right,
 * the “lens” looks towards the local -Z axis,
 * and the top of the camera is aligned with the local +Y axis.
 */
declare class CameraComponent extends Component {
    private static readonly _eye;
    private _eyeInner;
    private _direction;
    private _directionInner;
    private _up;
    private _upInner;
    private _filmWidth;
    private _filmHeight;
    private _focalLength;
    private primitiveMode;
    private _corner;
    private _cornerInner;
    private _parameters;
    private _parametersInner;
    private __type;
    private _projectionMatrix;
    private __isProjectionMatrixUpToDate;
    private _viewMatrix;
    private __isViewMatrixUpToDate;
    private static __current;
    private static returnVector3;
    private static __globalDataRepository;
    private static __tmpVector3_0;
    private static __tmpVector3_1;
    private static __tmpVector3_2;
    private static __tmpMatrix44_0;
    private static __tmpMatrix44_1;
    private static __biasMatrixWebGL;
    private static __biasMatrixWebGPU;
    _xrLeft: boolean;
    _xrRight: boolean;
    isSyncToLight: boolean;
    private __frustum;
    private __updateCount;
    private __lastUpdateCount;
    private __lastTransformComponentsUpdateCount;
    private __lastLightComponentsUpdateCount;
    private __lastCameraControllerComponentsUpdateCount;
    constructor(entityUid: EntityUID, componentSid: ComponentSID, entityRepository: EntityRepository, isReUse: boolean);
    static set current(componentSID: ComponentSID);
    static get current(): ComponentSID;
    get updateCount(): number;
    static get currentCameraUpdateCount(): number;
    set type(type: CameraTypeEnum);
    get type(): CameraTypeEnum;
    get eye(): Vector3;
    set eye(noUseVec: Vector3);
    get eyeInner(): Vector3;
    /**
     * @internal
     */
    set eyeInner(vec: Vector3);
    set upInner(vec: Vector3);
    set up(vec: Vector3);
    get up(): Vector3;
    get upInner(): Vector3;
    set direction(vec: Vector3);
    set directionInner(vec: Vector3);
    get direction(): Vector3;
    get directionInner(): Vector3;
    set corner(vec: Vector4);
    get corner(): Vector4;
    set left(value: number);
    set leftInner(value: number);
    get left(): number;
    set right(value: number);
    set rightInner(value: number);
    get right(): number;
    set top(value: number);
    set topInner(value: number);
    get top(): number;
    set bottom(value: number);
    set bottomInner(value: number);
    get bottom(): number;
    set cornerInner(vec: Vector4);
    get cornerInner(): Vector4;
    set parametersInner(vec: Vector4);
    get parametersInner(): Vector4;
    get parameters(): Vector4;
    set zNear(val: number);
    set zNearInner(val: number);
    get zNearInner(): number;
    get zNear(): number;
    set focalLength(val: number);
    get focalLength(): number;
    set focalLengthInner(val: number);
    get focalLengthInner(): number;
    set zFar(val: number);
    set zFarInner(val: number);
    get zFarInner(): number;
    get zFar(): number;
    setFovyAndChangeFilmSize(degree: number): void;
    setFovyAndChangeFocalLength(degree: number): void;
    get fovy(): number;
    set fovyInner(val: number);
    set aspect(val: number);
    set aspectInner(val: number);
    get aspectInner(): number;
    get aspect(): number;
    set xMag(val: number);
    get xMag(): number;
    set yMag(val: number);
    get yMag(): number;
    static get componentTID(): ComponentTID;
    get componentTID(): ComponentTID;
    calcProjectionMatrix(): MutableMatrix44;
    calcViewMatrix(): MutableMatrix44;
    get viewMatrix(): Matrix44;
    set viewMatrix(viewMatrix: Matrix44);
    get projectionMatrix(): Matrix44;
    set projectionMatrix(projectionMatrix: Matrix44);
    get viewProjectionMatrix(): MutableMatrix44;
    get biasViewProjectionMatrix(): MutableMatrix44;
    setValuesToGlobalDataRepositoryOnlyMatrices(): void;
    setValuesToGlobalDataRepository(): void;
    get worldPosition(): MutableVector3;
    updateFrustum(): void;
    get frustum(): Frustum;
    $load(): void;
    $logic(): void;
    static getCurrentCameraEntity(): ICameraEntity;
    /**
     * get the entity which has this component.
     * @returns the entity which has this component
     */
    get entity(): ICameraEntity;
    /**
     * @override
     * Add this component to the entity
     * @param base the target entity
     * @param _componentClass the component class to add
     */
    addThisComponentToEntity<EntityBaseClass extends IEntity, SomeComponentClass extends typeof Component>(base: EntityBaseClass, _componentClass: SomeComponentClass): ComponentToComponentMethods<SomeComponentClass> & EntityBaseClass;
}

/**
 * AbstractCameraController is an abstract class that defines the interface for camera controllers.
 *
 * @internal
 */
declare abstract class AbstractCameraController {
    zNearMax: number;
    zFarScalingFactor: number;
    autoCalculateZNearAndZFar: boolean;
    protected abstract __targetEntities: ISceneGraphEntity[];
    constructor();
    protected _calcZNearInner(camera: CameraComponent, eyePosition: Vector3, eyeDirection: Vector3): void;
    protected _calcZFarInner(camera: CameraComponent): void;
    abstract setTarget(targetEntity: ISceneGraphEntity): void;
    abstract setTargets(targetEntities: ISceneGraphEntity[]): void;
    abstract getTargets(): ISceneGraphEntity[];
}

/**
 * OrbitCameraController is a camera controller that allows the user to orbit around a target.
 *
 */
declare class OrbitCameraController extends AbstractCameraController implements ICameraController {
    dollyScale: number;
    scaleOfLengthCenterToCamera: number;
    moveSpeed: number;
    followTargetAABB: boolean;
    autoUpdate: boolean;
    private __updated;
    private __updateCount;
    private __fixedLengthOfCenterToEye;
    private __isMouseDown;
    private __lastMouseDownTimeStamp;
    private __lastMouseUpTimeStamp;
    private __originalY;
    private __originalX;
    private __buttonNumber;
    private __mouse_translate_y;
    private __mouse_translate_x;
    private __efficiency;
    private __lengthOfCenterToEye;
    private __fovyBias;
    private __scaleOfTranslation;
    private __mouseTranslateVec;
    private __newEyeVec;
    private __newCenterVec;
    private __newUpVec;
    private __newTangentVec;
    private __isSymmetryMode;
    private __rot_bgn_x;
    private __rot_bgn_y;
    private __rot_x;
    private __rot_y;
    private __dolly;
    private __eyeVec;
    private __centerVec;
    private __upVec;
    protected __targetEntities: ISceneGraphEntity[];
    private __scaleOfZNearAndZFar;
    private __doPreventDefault;
    private __isPressingShift;
    private __isPressingCtrl;
    private __pinchInOutControl;
    private __pinchInOutOriginalDistance?;
    private __maximum_y?;
    private __minimum_y?;
    private __resetDollyTouchTime;
    private __initialTargetAABB?;
    aabbWithSkeletal: boolean;
    useInitialTargetAABBForLength: boolean;
    private __mouseDownFunc;
    private __mouseUpFunc;
    private __mouseMoveFunc;
    private __touchDownFunc;
    private __touchUpFunc;
    private __touchMoveFunc;
    private __pinchInOutFunc;
    private __pinchInOutEndFunc;
    private __mouseWheelFunc;
    private __mouseDblClickFunc;
    private __contextMenuFunc;
    private __pressShiftFunc;
    private __releaseShiftFunc;
    private __pressCtrlFunc;
    private __releaseCtrlFunc;
    private __resetDollyAndPositionFunc;
    private static readonly __tmp_up;
    private static __tmpVec3_0;
    private static __tmpVec3_1;
    private static __tmpVec3_2;
    private static __tmp_rotateM_X;
    private static __tmp_rotateM_Y;
    private static __tmp_rotateM;
    private static __tmp_rotateM_Reset;
    private static __tmp_rotateM_Revert;
    private static __tmpMat44_0;
    private __cameraControllerComponent;
    constructor(cameraControllerComponent: CameraControllerComponent);
    get updateCount(): number;
    private _updateCount;
    resetDollyAndTranslation(): void;
    setTarget(targetEntity: ISceneGraphEntity): void;
    setTargets(targetEntities: ISceneGraphEntity[]): void;
    getTargets(): ISceneGraphEntity[];
    set doPreventDefault(flag: boolean);
    get doPreventDefault(): boolean;
    __mouseDown(e: MouseEvent): void;
    __mouseMove(e: MouseEvent): void;
    __mouseUp(e: MouseEvent): void;
    __touchDown(e: TouchEvent): void;
    __touchMove(e: TouchEvent): void;
    __touchUp(e: TouchEvent): void;
    set rotX(value: number);
    get rotX(): number;
    set rotY(value: number);
    get rotY(): number;
    set maximumY(maximum_y: number);
    set minimumY(minimum_y: number);
    __rotateControl(originalX: Size, originalY: Size, currentX: Size, currentY: Size): void;
    __zoomControl(originalValue: Size, currentValue: Size): void;
    __parallelTranslateControl(originalX: Size, originalY: Size, currentX: Size, currentY: Size): void;
    __getTouchesDistance(e: TouchEvent): number;
    __pinchInOut(e: TouchEvent): void;
    __pinchInOutEnd(e: TouchEvent): void;
    private __tryToPreventDefault;
    __mouseWheel(evt: WheelEvent): void;
    __contextMenu(evt: Event): void;
    set dolly(value: number);
    get dolly(): number;
    __mouseDblClick(evt: MouseEvent): void;
    __resetDollyAndPosition(e: TouchEvent): void;
    __pressShift(e: KeyboardEvent): void;
    __releaseShift(e: KeyboardEvent): void;
    __pressCtrl(e: KeyboardEvent): void;
    __releaseCtrl(e: KeyboardEvent): void;
    registerEventListeners(): void;
    unregisterEventListeners(): void;
    __getFovyFromCamera(camera: CameraComponent): number;
    logic(cameraComponent: CameraComponent): void;
    private __getTargetAABB;
    /**
     * update center, eye and up vectors of OrbitCameraController
     * @internal
     */
    __updateTargeting(camera: CameraComponent): void;
    /**
     * calculate up, eye, center and tangent vector with controller influence
     * @internal
     */
    __calculateInfluenceOfController(): void;
    __updateCameraComponent(camera: CameraComponent): void;
    set scaleOfZNearAndZFar(value: number);
    get scaleOfZNearAndZFar(): number;
    get isMouseDown(): boolean;
    get lastMouseDownTimeStamp(): number;
    get lastMouseUpTimeStamp(): number;
}

/**
 * WalkThroughCameraController is a camera controller that allows the user to walk through a scene.
 *
 */
declare class WalkThroughCameraController extends AbstractCameraController implements ICameraController {
    private __updateCount;
    private _horizontalSpeed;
    private _verticalSpeed;
    private _turnSpeed;
    private _mouseWheelSpeedScale;
    private _inverseVerticalRotating;
    private _inverseHorizontalRotating;
    private _onKeydown;
    private _isKeyDown;
    private _isMouseDrag;
    private _lastKeyCode;
    private _onKeyup;
    private _currentDir;
    private _currentPos;
    private _currentCenter;
    private _currentHorizontalDir;
    private _newDir;
    private _isMouseDown;
    private _clickedMouseXOnCanvas;
    private _clickedMouseYOnCanvas;
    private _draggedMouseXOnCanvas;
    private _draggedMouseYOnCanvas;
    private _deltaMouseXOnCanvas;
    private _deltaMouseYOnCanvas;
    private _mouseXAdjustScale;
    private _mouseYAdjustScale;
    private _deltaY;
    private _deltaX;
    private _mouseUpBind;
    private _mouseDownBind;
    private _mouseMoveBind;
    private _mouseWheelBind;
    private _eventTargetDom?;
    private __doPreventDefault;
    private _needInitialize;
    protected __targetEntities: ISceneGraphEntity[];
    private static __tmpInvMat;
    private static __tmpRotateMat;
    private static __tmp_Vec3_0;
    private static __tmp_Vec3_1;
    aabbWithSkeletal: boolean;
    private __cameraControllerComponent;
    constructor(cameraControllerComponent: CameraControllerComponent, options?: {
        eventTargetDom: Document;
        verticalSpeed: number;
        horizontalSpeed: number;
        turnSpeed: number;
        mouseWheelSpeedScale: number;
        inverseVerticalRotating: boolean;
        inverseHorizontalRotating: boolean;
    });
    private _updateCount;
    get updateCount(): number;
    registerEventListeners(eventTargetDom?: Document): void;
    unregisterEventListeners(): void;
    private __tryToPreventDefault;
    _mouseWheel(e: WheelEvent): void;
    _mouseDown(evt: MouseEvent): boolean;
    _mouseMove(evt: MouseEvent): void;
    _mouseUp(evt: MouseEvent): void;
    tryReset(): void;
    reset(): void;
    logic(cameraComponent: CameraComponent): void;
    private __updateCameraComponent;
    getDirection(): MutableVector3 | null;
    set horizontalSpeed(value: number);
    get horizontalSpeed(): number;
    set verticalSpeed(value: number);
    get verticalSpeed(): number;
    set mouseWheelSpeed(value: number);
    get mouseWheelSpeed(): number;
    setTarget(targetEntity: ISceneGraphEntity): void;
    private __getTargetAABB;
    setTargets(targetEntities: ISceneGraphEntity[]): void;
    getTargets(): ISceneGraphEntity[];
    get allInfo(): any;
    set allInfo(arg: any);
}

declare const defaultAnimationTrackName = "Default";

declare function createCameraEntity(): ICameraEntity;

declare function createCameraControllerEntity(): ICameraControllerEntity;

declare function createLightEntity(): ILightEntity;

declare function createMeshEntity(): IMeshEntity;

declare function createPhysicsEntity(): IPhysicsEntity;

declare function createGroupEntity(): ISceneGraphEntity;

/**
 * Collects children and itself from specified sceneGraphComponent.
 * @param sceneGraphComponent collects children and itself from the sceneGraphComponent
 * @param isJointMode collects joints only
 */
declare function flattenHierarchy(sceneGraphComponent: SceneGraphComponent, isJointMode: boolean): SceneGraphComponent[];

declare function createTransformEntity(): ITransformEntity;

declare const WellKnownComponentTIDs: Readonly<{
    AnimationStateComponentTID: 1;
    AnimationComponentTID: 2;
    TransformComponentTID: 3;
    SceneGraphComponentTID: 4;
    MeshComponentTID: 5;
    MeshRendererComponentTID: 6;
    LightComponentTID: 7;
    CameraControllerComponentTID: 8;
    CameraComponentTID: 9;
    SkeletalComponentTID: 10;
    BlendShapeComponentTID: 11;
    PhysicsComponentTID: 12;
    EffekseerComponentTID: 13;
    VrmComponentTID: 14;
    ConstraintComponentTID: 15;
    maxWellKnownTidNumber: 15;
}>;

/**
 * The class that generates and manages all kinds of components.
 */
declare class ComponentRepository {
    private static __component_sid_count_map;
    private static __components;
    static __componentClasses: Map<ComponentTID, typeof Component>;
    private static __componentTIDs;
    private static __renderingComponentTIDs;
    static readonly invalidComponentSID = -1;
    constructor();
    /**
     * Registers the class object of the component.
     * @param componentClass A class object of the component.
     */
    static registerComponentClass(componentClass: typeof Component): void;
    /**
     * deregister the component.
     * @param componentTID A componentTID
     */
    static deregisterComponentClass(componentTID: ComponentTID): void;
    /**
     * Gets the class object of the component corresponding to specified ComponentTID.
     * @param componentTid The componentTID to get the class object.
     */
    static getComponentClass(componentTid: ComponentTID): typeof Component | undefined;
    /**
     * Creates an instance of the component for the entity.
     * @param componentTid The componentTID to create the instance.
     * @param entityUid The entityUID of the entity.
     * @param entityRepository the reference of the entityRepository.
     */
    static createComponent(componentTid: ComponentTID, entityUid: EntityUID, entityRepository: EntityRepository): Component;
    static deleteComponent(component: Component): void;
    /**
     * Get the instance of the component corresponding to the component class and componentSID.
     * @param componentClass The class object to get the component.
     * @param componentSid The componentSID to get the component.
     */
    static getComponent(componentClass: typeof Component, componentSid: ComponentSID): Component | undefined;
    /**
     * Get the instance of the component corresponding to the componentTID and componentSID.
     * @param componentTid The componentTID to get the component.
     * @param componentSid The componentSID to get the component.
     */
    static getComponentFromComponentTID(componentTid: ComponentTID, componentSid: ComponentSID): Component | undefined;
    /**
     * @internal
     * Gets an array of components corresponding to the class object of the component.
     * @param componentClass The class object of the component.
     */
    static _getComponents(componentClass: typeof Component): Array<Component> | undefined;
    /**
     * @internal
     * Gets an array of components corresponding to the class object of the component (dead components included).
     * @param componentClass The class object of the component.
     */
    static _getComponentsIncludingDead(componentClass: typeof Component): Array<Component> | undefined;
    static getMemoryBeginIndex(componentTid: ComponentTID): number;
    /**
     * Gets an array of components corresponding to the class object of the component.
     * @param componentType The class object of the component.
     */
    static getComponentsWithType(componentType: typeof Component): Array<Component>;
    private static __updateComponentTIDs;
    /**
     * Gets all componentTIDs.
     */
    static getComponentTIDs(): Array<ComponentTID>;
    /**
     * Gets all rendering componentTIDs.
     */
    static getRenderingComponentTIDs(): Array<ComponentTID>;
}

/**
 * Config.ts is a configuration file that contains the configuration for the library.
 */
/**
 * Config is a configuration object that contains the configuration for the library.
 */
declare const Config: {
    /**　The maximum number of entities that Rhodonite can handle　*/
    maxEntityNumber: number;
    /**　The maximum number of lights that Rhodonite can handle */
    maxLightNumber: number;
    /**　The maximum number of morph targets that Rhodonite can handle */
    maxMorphTargetNumber: number;
    /**　The maximum number of morph primitives that Rhodonite can handle in WebGPU */
    maxMorphPrimitiveNumberInWebGPU: number;
    /**
     * Number of instances of each material type to be placed consecutively in memory.
     * This is on the memory layout, and the number of material instances that can be generated is not limited by this setting.
     * If this limit is exceeded, the material type is internally treated as a separate material type.
     */
    maxMaterialInstanceForEachType: number;
    /**　The data type of the bone */
    boneDataType: EnumIO;
    /**　The maximum number of skeletons that Rhodonite can handle */
    maxSkeletonNumber: number;
    /**　The maximum number of cameras that Rhodonite can handle */
    maxCameraNumber: number;
    /**　The maximum number of bones of each skeleton that Rhodonite can handle */
    maxSkeletalBoneNumber: number;
    /**　The maximum number of bones of each skeleton that Rhodonite can handle for Uniform Mode */
    maxSkeletalBoneNumberForUniformMode: number;
    /**　The width of the data texture */
    dataTextureWidth: number;
    /**　The height of the data texture */
    dataTextureHeight: number;
    /**　Whether the UBO is enabled */
    isUboEnabled: boolean;
    /**　The event target DOM for mouse operation */
    eventTargetDom: HTMLElement | undefined;
    /**　Whether to cache the WebGPU render bundles */
    cacheWebGpuRenderBundles: boolean;
    /**　Whether to output the CG API debug console */
    cgApiDebugConsoleOutput: boolean;
    /**　Whether to enable multi-view extension for WebVR */
    multiViewForWebVR: boolean;
    /**　The scale of the physics time interval */
    physicsTimeIntervalScale: number;
    /**　Whether the device is a mobile device */
    isMobile: boolean;
};

type GlobalPropertyStruct = {
    shaderSemanticsInfo: ShaderSemanticsInfo;
    values: any[];
    maxCount: Count;
    accessor: Accessor;
};
/**
 * The class which manages global data.
 */
declare class GlobalDataRepository {
    private static __instance;
    private __fields;
    private constructor();
    /**
     * Initialize the GlobalDataRepository
     * @param approach - ProcessApproachEnum for initialization
     */
    initialize(approach: ProcessApproachEnum): void;
    static getInstance(): GlobalDataRepository;
    private __registerProperty;
    takeOne(shaderSemantic: ShaderSemanticsName): any;
    setValue(shaderSemantic: ShaderSemanticsName, countIndex: Index, value: any): void;
    getValue(shaderSemantic: ShaderSemanticsName, countIndex: Index): any;
    getGlobalPropertyStruct(propertyName: ShaderSemanticsName): GlobalPropertyStruct | undefined;
    getGlobalProperties(): GlobalPropertyStruct[];
    _setUniformLocationsForUniformModeOnly(shaderProgramUid: CGAPIResourceHandle): void;
    _setUniformLocationsForDataTextureModeOnly(shaderProgramUid: CGAPIResourceHandle): void;
    setUniformValues(shaderProgram: WebGLProgram): void;
    getLocationOffsetOfProperty(propertyName: ShaderSemanticsName): IndexOf16Bytes;
    getCurrentDataNumberOfTheProperty(propertyName: ShaderSemanticsName): number;
    _addPropertiesStr(vertexPropertiesStr: string, pixelPropertiesStr: string, propertySetter: getShaderPropertyFunc, isWebGL2: boolean): string[];
}

declare const GetComponentFromEntities: unique symbol;
declare function getComponentFromEntities<T extends typeof Component>(this: EnhancedArrayMethods, ComponentClass: T): InstanceType<T>[];
interface ArrayAsRn<T> {
    Rn: EnhancedArrayMethods & IEnhancedArrayMethods;
}
interface IEnhancedArrayMethods {
    getComponentFromEntities: typeof getComponentFromEntities;
}
declare class EnhancedArrayMethods {
    __raw: unknown[];
    constructor(__raw: unknown[]);
}
declare const enhanceArray: () => void;

declare const GLTF2_EXPORT_GLTF = "glTF";
declare const GLTF2_EXPORT_GLB = "glTF-Binary";
declare const GLTF2_EXPORT_DRACO = "glTF-Draco";
declare const GLTF2_EXPORT_EMBEDDED = "glTF-Embedded";
declare const GLTF2_EXPORT_NO_DOWNLOAD = "No-Download";
type Gltf2ExportType = typeof GLTF2_EXPORT_GLTF | typeof GLTF2_EXPORT_GLB | typeof GLTF2_EXPORT_DRACO | typeof GLTF2_EXPORT_EMBEDDED | typeof GLTF2_EXPORT_NO_DOWNLOAD;
interface Gltf2ExporterArguments {
    entities?: ISceneGraphEntity[];
    type: Gltf2ExportType;
    excludeTags?: Tag[];
}
/**
 * The glTF2 format Exporter class.
 */
declare class Gltf2Exporter {
    private constructor();
    /**
     * Exports scene data in the rhodonite system in glTF2 format.
     * @param filename the target output path
     * @param option a option config
     */
    static export(filename: string, option?: Gltf2ExporterArguments): Promise<ArrayBuffer>;
    private static __deleteEmptyArrays;
    /**
     * collect target entities. This exporter includes their descendants for the output.
     * @param option an option config
     * @returns target entities
     */
    private static __collectEntities;
    /**
     * create the base of glTF2 JSON
     * @param filename target output path
     * @returns the json and fileName in a object
     */
    private static __createJsonBase;
    /**
     * create Gltf2BufferViews and Gltf2Accessors for the output glTF2 JSON
     * @param json
     * @param entities
     */
    static __createBufferViewsAndAccessors(json: Gltf2Ex, entities: ISceneGraphEntity[]): void;
    /**
     * create Gltf2Nodes for the output glTF2 JSON
     * @param json a glTF2 JSON
     * @param entities target entities
     * @param indicesOfGltfMeshes the indices of Gltf2Meshes
     */
    static __createNodes(json: Gltf2Ex, entities: ISceneGraphEntity[], topLevelEntities: ISceneGraphEntity[]): void;
    /**
     * create Gltf2Materials and set them to Gltf2Primitives for the output glTF2 JSON
     * @param json a glTF2 JSON
     * @param entities all target entities
     */
    static __createMaterials(json: Gltf2Ex, entities: IMeshEntity[], option: Gltf2ExporterArguments): Promise<any[]>;
    /**
     * create the arraybuffer of the glTF2 .bin file and write all accessors data to the arraybuffer
     * @param json a glTF2 JSON
     * @returns A arraybuffer
     */
    private static __createBinary;
    /**
     * download the glTF2 files
     * @param json a glTF2 JSON
     * @param filename target output path
     * @param arraybuffer an ArrayBuffer of the .bin file
     */
    static __downloadGlb(json: Gltf2, filename: string, arraybuffer: ArrayBuffer): void;
    exportGlbAsArrayBuffer(): void;
    /**
     * download the glTF2 files
     * @param json a glTF2 JSON
     * @param filename target output path
     * @param arraybuffer an ArrayBuffer of the .bin file
     */
    static __downloadGltf(json: Gltf2, filename: string, arraybuffer: ArrayBuffer): void;
}

declare function createEffekseer(json: Gltf2Ex, entities: ISceneGraphEntity[]): void;

interface ISemanticVertexAttribute {
    semantic: VertexAttributeEnum;
    getScalarAsArray: (i: Index, option: IndicesAccessOption) => Array1<number>;
    getVec2AsArray: (i: Index, option: IndicesAccessOption) => Array2<number>;
    getVec3AsArray: (i: Index, option: IndicesAccessOption) => Array3<number>;
    getVec4AsArray: (i: Index, option: IndicesAccessOption) => Array4<number>;
}

declare class ComplexVertexAttribute implements ISemanticVertexAttribute {
    private __semantic;
    private __components;
    private __offsets;
    constructor(semanticAttribute: VertexAttributeEnum, attributes: Attributes);
    get semantic(): VertexAttributeEnum;
    getScalarAsArray(i: Index, option: IndicesAccessOption): Array1<number>;
    getVec2AsArray(i: Index, option: IndicesAccessOption): Array2<number>;
    getVec3AsArray(i: Index, option: IndicesAccessOption): Array3<number>;
    getVec4AsArray(i: Index, option: IndicesAccessOption): Array4<number>;
}

declare class SimpleVertexAttribute implements ISemanticVertexAttribute {
    private __semantic;
    private __accessor;
    constructor(semanticAttribute: VertexAttributeEnum, accessor: Accessor);
    get semantic(): VertexAttributeEnum;
    getScalarAsArray(i: Index, option: IndicesAccessOption): Array1<number>;
    getVec2AsArray(i: Index, option: IndicesAccessOption): Array2<number>;
    getVec3AsArray(i: Index, option: IndicesAccessOption): Array3<number>;
    getVec4AsArray(i: Index, option: IndicesAccessOption): Array4<number>;
}

/**
 * Abstract Gizmo class
 */
declare abstract class Gizmo extends RnObject {
    /**
     * The top entity of this gizmo group.
     * A programmer who implements a gizmo class has to make this entity
     * a child of the target entity's scene graph component
     * that the gizmo will belong to manually.
     */
    protected __topEntity?: IMeshEntity | ISceneGraphEntity;
    /** the target entity which this gizmo belong to */
    protected __target: ISceneGraphEntity;
    protected __isVisible: boolean;
    /**
     * Constructor
     * @param entity the object which this gizmo belong to
     */
    constructor(target: ISceneGraphEntity);
    set isVisible(flg: boolean);
    get isVisible(): boolean;
    protected __setVisible(flg: boolean): void;
    abstract isSetup: boolean;
    /**
     * @internal
     * setup entities of Gizmo if not done yet
     */
    abstract _setup(): void;
    /**
     * @internal
     * update the transform and etc of the gizmo
     */
    abstract _update(): void;
    abstract _destroy(): void;
    protected __toSkipSetup(): boolean;
    protected setGizmoTag(): void;
}

/**
 * AABB Gizmo class
 */
declare class AABBGizmo extends Gizmo {
    private static __mesh?;
    /**
     * Constructor
     * @param target the object which this gizmo belong to
     */
    constructor(target: ISceneGraphEntity);
    get isSetup(): boolean;
    /**
     * @internal
     * setup entities of Gizmo if not done yet
     */
    _setup(): void;
    /**
     * generate the primitive of the gizmo
     * @returns a primitive of the gizmo
     */
    private static generatePrimitive;
    /**
     * @internal
     * update the transform and etc of the gizmo
     */
    _update(): void;
    _destroy(): void;
}

/**
 * Locator Gizmo class
 */
declare class LocatorGizmo extends Gizmo {
    private static __mesh;
    private static __length;
    /**
     * Constructor
     * @param target the object which this gizmo belong to
     */
    constructor(target: IMeshEntity);
    get isSetup(): boolean;
    set length(val: number);
    get length(): number;
    /**
     * @internal
     * setup entities of Gizmo if not done yet
     */
    _setup(): void;
    /**
     * @internal
     * update the transform and etc of the gizmo
     */
    _update(): void;
    private static __generatePrimitive;
    _destroy(): void;
}

declare class LightGizmo extends Gizmo {
    private static __mesh;
    private static __length;
    /**
     * Constructor
     * @param target the object which this gizmo belong to
     */
    constructor(target: ISceneGraphEntity);
    get isSetup(): boolean;
    /**
     * @internal
     * setup entities of Gizmo if not done yet
     */
    _setup(): void;
    /**
     * @internal
     * update the transform and etc of the gizmo
     */
    _update(): void;
    _destroy(): void;
    private static __generatePrimitive;
}

/**
 * Translation Gizmo class
 */
declare class ScaleGizmo extends Gizmo {
    private static __groupEntity;
    private static __xCubeEntity;
    private static __yCubeEntity;
    private static __zCubeEntity;
    private static __xCubeMesh;
    private static __yCubeMesh;
    private static __zCubeMesh;
    private static __xCubePrimitive;
    private static __yCubePrimitive;
    private static __zCubePrimitive;
    private static __xEdgeCubeEntity;
    private static __yEdgeCubeEntity;
    private static __zEdgeCubeEntity;
    private static __xEdgeCubeMesh;
    private static __yEdgeCubeMesh;
    private static __zEdgeCubeMesh;
    private static __xEdgeCubePrimitive;
    private static __yEdgeCubePrimitive;
    private static __zEdgeCubePrimitive;
    private static __xCubeMaterial;
    private static __yCubeMaterial;
    private static __zCubeMaterial;
    private static __xyPlaneEntity;
    private static __yzPlaneEntity;
    private static __zxPlaneEntity;
    private static __xyPlaneMesh;
    private static __yzPlaneMesh;
    private static __zxPlaneMesh;
    private static __xyPlanePrimitive;
    private static __yzPlanePrimitive;
    private static __zxPlanePrimitive;
    private static __xyPlaneMaterial;
    private static __yzPlaneMaterial;
    private static __zxPlaneMaterial;
    private static __originalX;
    private static __originalY;
    private __pickStatedPoint;
    private __deltaPoint;
    private __targetScaleBackup;
    private __isPointerDown;
    private static __activeAxis;
    private static __space;
    private static __latestTargetEntity?;
    private static __length;
    private __onPointerDownFunc;
    private __onPointerMoveFunc;
    private __onPointerUpFunc;
    /**
     * Constructor
     * @param target the object which this gizmo belong to
     */
    constructor(target: IMeshEntity);
    get isSetup(): boolean;
    set length(val: number);
    get length(): number;
    set isVisible(flg: boolean);
    setSpace(space: 'local' | 'world'): void;
    get isVisible(): boolean;
    /**
     * @internal
     * setup entities of Gizmo if not done yet
     */
    _setup(): void;
    private zxPlane;
    private yzPlane;
    private xyPlane;
    private zMesh;
    private yMesh;
    private xMesh;
    private xEdgeMesh;
    private yEdgeMesh;
    private zEdgeMesh;
    /**
     * @internal
     * update the transform and etc of the gizmo
     */
    _update(): void;
    private static __generatePrimitive;
    private __onPointerDown;
    private __onPointerMove;
    private __onPointerUp;
    private static castRay2;
    private static castRay;
    _destroy(): void;
}

/**
 * Translation Gizmo class
 */
declare class TranslationGizmo extends Gizmo {
    private static __groupEntity;
    private static __xCubeEntity;
    private static __yCubeEntity;
    private static __zCubeEntity;
    private static __xCubeMesh;
    private static __yCubeMesh;
    private static __zCubeMesh;
    private static __xCubePrimitive;
    private static __yCubePrimitive;
    private static __zCubePrimitive;
    private static __xCubeMaterial;
    private static __yCubeMaterial;
    private static __zCubeMaterial;
    private static __xyPlaneEntity;
    private static __yzPlaneEntity;
    private static __zxPlaneEntity;
    private static __xyPlaneMesh;
    private static __yzPlaneMesh;
    private static __zxPlaneMesh;
    private static __xyPlanePrimitive;
    private static __yzPlanePrimitive;
    private static __zxPlanePrimitive;
    private static __xyPlaneMaterial;
    private static __yzPlaneMaterial;
    private static __zxPlaneMaterial;
    private static __originalX;
    private static __originalY;
    private __pickStatedPoint;
    private __deltaPoint;
    private __targetPointBackup;
    private __isPointerDown;
    private static __activeAxis;
    private static __space;
    private __latestTargetEntity?;
    private __onPointerDownFunc;
    private __onPointerMoveFunc;
    private __onPointerUpFunc;
    private static __length;
    /**
     * Constructor
     * @param target the object which this gizmo belong to
     */
    constructor(target: IMeshEntity);
    get isSetup(): boolean;
    set length(val: number);
    get length(): number;
    set isVisible(flg: boolean);
    setSpace(space: 'local' | 'world'): void;
    get isVisible(): boolean;
    /**
     * @internal
     * setup entities of Gizmo if not done yet
     */
    _setup(): void;
    /**
     * @internal
     * update the transform and etc of the gizmo
     */
    _update(): void;
    private static __generatePrimitive;
    private __onPointerDown;
    private __onPointerMove;
    private __onPointerUp;
    private static castRay2;
    private static castRay;
    _destroy(): void;
}

type Vrm1HumanBone = {
    node: number;
};
type Vrm1_MeshAnnotation = {
    node: number;
    type: 'thirdPersonOnly' | 'firstPersonOnly' | 'both' | 'auto';
};
type Vrm1MorphTargetBind = {
    index: number;
    node: number;
    weight: number;
};
type Vrm1MaterialColorBind = {
    material: number;
    type: string;
    targetValue: [number, number, number, number];
};
type Vrm1TextureTransformBind = {
    material: number;
    scale: [number, number];
    offset: [number, number];
};
type Vrm1OverrideType = 'none' | 'block' | 'blend';
interface VRMC {
    specVersion: string;
    humanoid: {
        humanBones: Vrm1HumanBone[];
        armStretch: number;
        legStretch: number;
        upperArmTwist: number;
        lowerArmTwist: number;
        upperLegTwist: number;
        lowerLegTwist: number;
        feetSpacing: number;
        hasTranslationDoF: false;
    };
    meta: {
        version: string;
        author: string;
        contactInformation: string;
        reference: string;
        title: string;
        texture: 30;
        allowedUserName: string;
        violentUsageName: string;
        sexualUsageName: string;
        commercialUsageName: string;
        otherPermissionUrl: string;
        licenseName: string;
        otherLicenseUrl: string;
    };
    firstPerson: {
        meshAnnotations: Vrm1_MeshAnnotation[];
    };
    expressions: {
        preset: {
            [key: string]: {
                isBinary: boolean;
                morphTargetBinds: Vrm1MorphTargetBind[];
                materialColorBinds: Vrm1MaterialColorBind[];
                textureTransformBinds: Vrm1TextureTransformBind[];
                overrideBlink: Vrm1OverrideType;
                overrideLookAt: Vrm1OverrideType;
                overrideMouth: Vrm1OverrideType;
            };
        };
    };
    lookAt: {
        type: 'bone' | 'expression';
        offsetFromHeadBone: [number, number, number];
        rangeMapHorizontalInner: {
            inputMaxValue: number;
            outputScale: number;
        };
        rangeMapHorizontalOuter: {
            inputMaxValue: number;
            outputScale: number;
        };
        rangeMapVerticalDown: {
            inputMaxValue: number;
            outputScale: number;
        };
        rangeMapVerticalUp: {
            inputMaxValue: number;
            outputScale: number;
        };
    };
}

interface VRMC_node_constraint {
    node: RnM2Node;
    constraint: {
        roll?: {
            source: number;
            rollAxis: string;
            weight?: number;
        };
        aim?: {
            source: number;
            aimAxis: string;
            weight?: number;
        };
        rotation?: {
            source: number;
            weight?: number;
        };
    };
}

type Vrm1SpringBone_Collider = {
    node: number;
    shape: {
        sphere?: {
            offset: [number, number, number];
            radius: number;
        };
        capsule?: {
            offset: [number, number, number];
            radius: number;
            tail: [number, number, number];
        };
    };
};
type Vrm1SpringBone_ColliderGroup = {
    name: string;
    colliders: number[];
};
type Vrm1SpringBone_Spring = {
    colliderGroups: number[];
    joints: Vrm1SpringBone_Joint[];
    name: string;
    center: number;
};
type Vrm1SpringBone_Joint = {
    node: number;
    hitRadius: number;
    stiffness: number;
    gravityPower: number;
    gravityDir: [number, number, number];
    dragForce: number;
};
interface VRMC_springBone {
    specVersions: string;
    colliderGroups: Vrm1SpringBone_ColliderGroup[];
    colliders: Vrm1SpringBone_Collider[];
    springs: Vrm1SpringBone_Spring[];
}

interface Vrm1 extends RnM2 {
    materials: Vrm1_Material[];
    extensions: {
        VRMC_vrm: VRMC;
        VRMC_springBone?: VRMC_springBone;
        VRMC_node_constraint?: VRMC_node_constraint;
    };
}

interface VRM extends RnM2 {
    materials: Vrm1_Material[];
    extensions: {
        VRM?: VRM0x_Extension;
        VRMC_vrm?: VRMC;
        VRMC_springBone?: VRMC_springBone;
        VRMC_node_constraint?: VRMC_node_constraint;
    };
}

type RetargetMode = 'none' | 'global' | 'absolute';
declare class AnimationAssigner {
    private static __instance;
    /**
     * Assign Animation Function
     *
     * @param rootEntity - The root entity of the model which you want to assign animation.
     * @param gltfModel - The glTF model that has animation data.
     * @param vrmModel - The corresponding VRM model to the glTF model.
     * @param isSameSkeleton
     * @param retargetMode - Retarget mode. 'none' | 'global' | 'global2' | 'absolute'
     * @param srcRootEntityForRetarget
     * @returns
     */
    assignAnimation(rootEntity: ISceneGraphEntity, gltfModel: RnM2, vrmModel: VRM | Vrm1 | Vrm0x, isSameSkeleton: boolean, retargetMode: RetargetMode): ISceneGraphEntity;
    assignAnimationWithVrma(rootEntity: ISceneGraphEntity, vrmaModel: RnM2Vrma, postfixToTrackName?: string): string[];
    private constructor();
    private __resetAnimationAndPose;
    /**
     * The static method to get singleton instance of this class.
     * @return The singleton instance of ModelConverter class
     */
    static getInstance(): AnimationAssigner;
    private __getCorrespondingEntity;
    private __getCorrespondingEntityWithVrma;
    private __isHips;
    private __setupAnimationForSameSkeleton;
}

/**
 * The draco Importer class.
 */
declare class DrcPointCloudImporter {
    private static __instance;
    private constructor();
    /**
     * Import draco file of point cloud type
     * WEIGHTS_0 and JOINTS_0 attribute and all the mesh type and is not support yet.
     * @param uri - uri of drc file
     * @param options - options for loading process
     * @returns a glTF2 based JSON pre-processed
     */
    importPointCloud(uri: string, options?: GltfLoadOption): Promise<Result<RnM2, Err<ArrayBuffer, unknown>>>;
    /**
     * Import the specified array buffer of draco file where the type must be point cloud.
     * WEIGHTS_0 and JOINTS_0 attribute and all the mesh type and is not support yet.
     * @param uri - uri of drc file
     * @param arrayBuffer - fetched array buffer of drc file
     * @param options - options for loading process
     * @returns a glTF2 based JSON pre-processed
     */
    importArrayBuffer(uri: string, arrayBuffer: ArrayBuffer, options?: GltfLoadOption): Promise<void | RnM2>;
    private __loadFromArrayBuffer;
    _getOptions(defaultOptions: any, json: RnM2, options: any): GltfLoadOption;
    _loadAsBinaryJson(dataView: DataView, isLittleEndian: boolean, arrayBuffer: ArrayBuffer, options: GltfLoadOption, defaultOptions: GltfLoadOption, basePath: string): Promise<any>;
    _loadAsTextJson(gltfJson: RnM2, options: GltfLoadOption, defaultOptions: GltfLoadOption, basePath: string): Promise<RnM2>;
    _loadInner(uint8array: Uint8Array | undefined, basePath: string, gltfJson: RnM2, options: GltfLoadOption): Promise<(void | (void | ArrayBuffer)[])[]>;
    _loadJsonContent(gltfJson: RnM2, options: GltfLoadOption): void;
    _loadDependenciesOfScenes(gltfJson: RnM2): void;
    _loadDependenciesOfNodes(gltfJson: RnM2): void;
    _loadDependenciesOfMeshes(gltfJson: RnM2): void;
    private _checkRnGltfLoaderOptionsExist;
    _loadDependenciesOfMaterials(gltfJson: RnM2): void;
    _loadDependenciesOfTextures(gltfJson: RnM2): void;
    _loadDependenciesOfJoints(gltfJson: RnM2): void;
    _loadDependenciesOfAnimations(gltfJson: RnM2): void;
    _loadDependenciesOfAccessors(gltfJson: RnM2): void;
    _loadDependenciesOfBufferViews(gltfJson: RnM2): void;
    _mergeExtendedJson(gltfJson: RnM2, extendedData: any): void;
    _loadResources(uint8Array: Uint8Array, basePath: string, gltfJson: RnM2, options: GltfLoadOption, resources: {
        shaders: any[];
        buffers: any[];
        images: any[];
    }): Promise<void | (void | ArrayBuffer)[]>;
    static getInstance(): DrcPointCloudImporter;
    private __decodeDraco;
    private __decodeBuffer;
    private __decodedBufferToJSON;
    private __setBuffersToJSON;
    private __convertBufferToURI;
    private __setAccessorsAndBufferViewsToJSON;
    private __setMeshesToJSON;
    /**
     * Import Draco file of point cloud type.
     * WEIGHTS_0 and JOINTS_0 attribute and all the mesh type and is not support yet.
     * @param uri - uri of glTF file
     * @returns a primitive of Rhodonite object
     */
    importPointCloudToPrimitive(uri: string): Promise<Primitive>;
    private __decodeDracoToPrimitive;
    private __getGeometryFromDracoBuffer;
    private __getPositions;
    private __getColors;
    private __getNormals;
    private __getTextureCoords;
}

declare function detectFormatByArrayBuffers(files: {
    [s: string]: ArrayBuffer;
}): FileTypeEnum;
declare function detectFormatByUri(uri: string): string;

/**
 * The glTF2 Importer class.
 */
declare class Gltf2Importer {
    private constructor();
    /**
     * Import glTF2 file
     * @param url - url of glTF file
     * @param options - options for loading process
     * @returns a glTF2 based JSON pre-processed
     */
    static importFromUrl(url: string, options?: GltfLoadOption): Promise<RnM2>;
    static importFromArrayBuffers(files: GltfFileBuffers, options?: GltfLoadOption): Promise<RnM2>;
    /**
     * Import glTF2 array buffer.
     * @param arrayBuffer .gltf/.glb file in ArrayBuffer
     * @param otherFiles other resource files data in ArrayBuffers
     * @param options options for loading process (Optional)
     * @param uri .gltf file's uri (Optional)
     * @returns a glTF2 based JSON pre-processed
     */
    static _importGltfOrGlbFromArrayBuffers(arrayBuffer: ArrayBuffer, otherFiles: GltfFileBuffers, options?: GltfLoadOption, uri?: string): Promise<Result<RnM2, undefined>>;
    static _getOptions(defaultOptions: GltfLoadOption, json: RnM2, options: GltfLoadOption): GltfLoadOption;
    static _importGlb(arrayBuffer: ArrayBuffer, files: GltfFileBuffers, options: GltfLoadOption): Promise<RnM2>;
    static _importGltf(gltfJson: RnM2, fileArrayBuffers: GltfFileBuffers, options: GltfLoadOption, uri?: string, callback?: RnPromiseCallback): Promise<RnM2>;
    static _loadInner(gltfJson: RnM2, files: GltfFileBuffers, options: GltfLoadOption, uint8arrayOfGlb?: Uint8Array, basePath?: string, callback?: RnPromiseCallback): RnPromise<any[]>;
    static _loadJsonContent(gltfJson: RnM2): void;
    static _loadDependenciesOfScenes(gltfJson: RnM2): void;
    static _loadDependenciesOfNodes(gltfJson: RnM2): void;
    static _loadDependenciesOfMeshes(gltfJson: RnM2): void;
    private static _checkRnGltfLoaderOptionsExist;
    static _loadDependenciesOfMaterials(gltfJson: RnM2): void;
    static _loadDependenciesOfTextures(gltfJson: RnM2): void;
    static _loadDependenciesOfJoints(gltfJson: RnM2): void;
    static _loadDependenciesOfAnimations(gltfJson: RnM2): void;
    static _loadDependenciesOfAccessors(gltfJson: RnM2): void;
    static _loadDependenciesOfBufferViews(gltfJson: RnM2): void;
    static _mergeExtendedJson(gltfJson: RnM2, extendedData: ArrayBuffer | string | object): void;
    static _loadResources(uint8ArrayOfGlb: Uint8Array, gltfJson: RnM2, files: GltfFileBuffers, options: GltfLoadOption, basePath?: string, callback?: RnPromiseCallback): RnPromise<any[]>;
    private static __containsFileName;
    private static __getFullPathOfFileName;
    private static __loadImageUri;
}

/**
 * Importer class which can import GLTF and VRM.
 */
declare class GltfImporter {
    private constructor();
    /**
     * Import GLTF or VRM file.
     * @param url url of glTF file
     * @param options options for loading process where the files property is ignored
     * @returns gltf expression where:
     *            renderPasses[0]: model entities
     *            renderPasses[1]: model outlines
     */
    static importFromUrl(url: string, options?: GltfLoadOption, callback?: RnPromiseCallback): Promise<Expression>;
    /**
     * Import GLTF or VRM from ArrayBuffers.
     * @param files ArrayBuffers of glTF/VRM files
     * @param options options for loading process where if you use files option, key name of files must be uri of the value array buffer
     * @returns gltf expression where:
     *            renderPasses[0]: model entities
     *            renderPasses[1]: model outlines
     */
    static importFromArrayBuffers(files: GltfFileBuffers, options?: GltfLoadOption, callback?: RnPromiseCallback): Promise<Expression>;
    private static __initOptions;
    private static __setRenderPassesToExpression;
    private static __isValidExtension;
    private static __isGlb;
    private static __getGlbVersion;
    private static __getGltfVersion;
    private static __detectTheModelFileTypeAndImport;
    private static __getFileTypeFromFilePromise;
}

/**
 * A converter class from glTF2 model to Rhodonite Native data
 */
declare class ModelConverter {
    private constructor();
    private static __generateGroupEntity;
    private static addTags;
    private static __generateMeshEntity;
    private static __generateCameraEntity;
    private static __generateLightEntity;
    private static __setupMaterials;
    private static __setupTextures;
    private static __createSamplers;
    static convertToRhodoniteObjectSimple(gltfModel: RnM2): ISceneGraphEntity;
    static convertToRhodoniteObject(gltfModel: RnM2): Promise<ISceneGraphEntity>;
    private static __createRnBuffer;
    static _setupTransform(gltfModel: RnM2, groups: ISceneGraphEntity[]): void;
    static _setupHierarchy(gltfModel: RnM2, rnEntities: ISceneGraphEntity[]): void;
    /**
     * @internal
     */
    static _setupAnimation(gltfModel: RnM2, rnEntities: ISceneGraphEntity[], rnBuffers: Buffer[], rootGroup: ISceneGraphEntity, rnMaterials: Material[]): void;
    private static __setPointerAnimation;
    private static __setPointerAnimationCameras;
    private static __setPointerAnimationLights;
    private static __setPointerAnimationNodes;
    private static __setPointerAnimationMaterials;
    private static __setNormalAnimation;
    static _setupSkeleton(gltfModel: RnM2, rnEntities: ISceneGraphEntity[], rnBuffers: Buffer[]): void;
    private static __setupObjects;
    private static __isMorphing;
    private static __setupLight;
    private static __setupCamera;
    private static __setupMesh;
    static setSparseAccessor(accessor: RnM2Accessor, rnAccessor: Accessor): void;
    private static __setVRM1Material;
    private static setMToonTextures;
    private static __setVRM0xMaterial;
    private static __generateAppropriateMaterial;
    private static __isLighting;
    private static __useTangentAttribute;
    private static __useNormalTexture;
    private static __makeOutputSrgb;
    private static __setupMaterial;
    private static setParametersToMaterial;
    static _createSampler(sampler: RnM2TextureSampler): Sampler;
    static _createTexture(image: RnM2Image, gltfModel: RnM2, { autoDetectTransparency }?: {
        autoDetectTransparency?: boolean | undefined;
    }): Promise<Texture>;
    private static __needResizeToPowerOfTwoOnWebGl1;
    private static __sizeIsPowerOfTwo;
    private static __needParameterInitialization;
    private static _checkRnGltfLoaderOptionsExist;
    private static __rewrapWithTypedArray;
    static _checkBytesPerComponent(accessor: RnM2Accessor | RnM2SparseIndices): number;
    static _checkComponentNumber(accessor: RnM2Accessor): number;
    static _checkDataViewMethod(accessor: RnM2Accessor | RnM2SparseIndices): string;
    static _isSystemLittleEndian(): boolean;
    static _readBinaryFromAccessorAndSetItToAccessorExtras(accessor: RnM2Accessor, rnBuffers?: Buffer[]): Float32Array;
    /**
     * normalize values of TypedArray to Float32Array
     * See: the last part of 3.11.Animation at https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#animations
     * @param dataViewMethod
     * @param numberArray
     * @returns
     */
    private static __normalizeTypedArrayToFloat32Array;
    private static __addOffsetToIndices;
    /**
     * Take a Rn.Accessor from the Rn.Buffer
     *  from the information of the Gltf2Buffer, Gltf2BufferView, and Gltf2Accessor.
     * @param accessor
     * @param rnBuffer
     * @returns
     */
    private static __getRnAccessor;
    /**
     * Take a Rn.BufferView and a Rn.Accessor from the Rn.Buffer
     *  from the information of the Gltf2Buffer, Gltf2BufferView, and Gltf2Accessor.
     * @param accessor
     * @param rnBuffer
     * @returns
     */
    private static __getRnBufferViewAndRnAccessor;
    private static __copyRnAccessorAndBufferView;
    private static __takeRnBufferViewAndRnAccessorForDraco;
    private static __getRnBufferView;
    private static __getGeometryFromDracoBuffer;
    static __getIndicesFromDraco(draco: any, decoder: any, dracoGeometry: any, triangleStripDrawMode: boolean): Uint32Array | undefined;
    private static __decodeDraco;
    static _setupTextureTransform(textureJson: RnM2TextureInfo, rnMaterial: Material, textureTransformScaleShaderSemantic: ShaderSemanticsName, textureTransformOffsetShaderSemantic: ShaderSemanticsName, textureTransformRotationShaderSemantic: ShaderSemanticsName): void;
    private static __createBufferForDecompressedData;
}

declare class RhodoniteImportExtension {
    private static __instance;
    static importBillboard(gltfJson: RnM2, groups: ISceneGraphEntity[]): void;
    static importEffect(gltfJson: RnM2, rootGroup: ISceneGraphEntity): void;
}

/**
 * The VRM Importer class.
 * This class will be integrated into GltfImporter.
 */
declare class Vrm0xImporter {
    private constructor();
    /**
     * Import VRM file.
     */
    static importFromUrl(url: string, options?: GltfLoadOption): Promise<Result<ISceneGraphEntity[], Err<RnM2, undefined>>>;
    /**
     * For VRM file only
     * Generate JSON.
     */
    static importJsonOfVRM(uri: string, options?: GltfLoadOption): Promise<Vrm0x>;
    static __importVRM0x(gltfModel: RnM2, renderPasses: RenderPass[]): Promise<void>;
    static _readBlendShapeGroup(gltfModel: Vrm0x, rootEntity: ISceneGraphEntity): void;
    static _readVRMHumanoidInfo(gltfModel: Vrm0x, rootEntity?: ISceneGraphEntity): void;
    static _readSpringBone(gltfModel: Vrm0x): void;
    private static __addSpringBoneRecursively;
    private static __addPhysicsComponent;
    static _createTextures(gltfModel: RnM2): Promise<Texture[]>;
    static _createSamplers(gltfModel: RnM2): Sampler[];
    static _existOutlineMaterial(extensionsVRM: any): boolean;
    static _initializeMaterialProperties(gltfModel: RnM2, texturesLength: number): void;
    private static __initializeMToonMaterialProperties;
    private static __initializeForUndefinedProperty;
    static _getOptions(options?: GltfLoadOption): GltfLoadOption;
}

declare class VrmImporter {
    private constructor();
    static __importVRM(gltfModel: RnM2, renderPasses: RenderPass[]): Promise<void>;
    static _readConstraints(gltfModel: Vrm1): void;
    static _readExpressions(gltfModel: Vrm1, rootEntity: ISceneGraphEntity): void;
    static _readVRMHumanoidInfo(gltfModel: Vrm1, rootEntity?: ISceneGraphEntity): void;
    static _readSpringBone(gltfModel: Vrm1): void;
    private static __addSpringBoneRecursively;
    private static __addPhysicsComponent;
    static _createTextures(gltfModel: RnM2): Promise<Texture[]>;
    static _createSamplers(gltfModel: RnM2): Sampler[];
    private static __initializeMToonMaterialProperties;
    static _getOptions(options?: GltfLoadOption): GltfLoadOption;
    /**
     * For VRM file only
     * Generate JSON.
     */
    static importJsonOfVRM(uri: string, options?: GltfLoadOption): Promise<Vrm1>;
}

declare class VrmaImporter {
    static importFromUrl(url: string): Promise<RnM2Vrma>;
    static importFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<RnM2Vrma>;
    static readHumanoid(rnm: RnM2Vrma): void;
}

type SocketDefaultValue = Vector4 | Vector3 | Vector2 | Scalar$1 | Matrix44 | Matrix33;
declare class Socket<Name extends string, N extends CompositionTypeEnum, T extends ComponentTypeEnum, V extends SocketDefaultValue> {
    readonly name: Name;
    readonly compositionType: N;
    readonly componentType: T;
    readonly defaultValue?: V | undefined;
    constructor(name: Name, compositionType: N, componentType: T, defaultValue?: V | undefined);
}

declare abstract class CommonShaderPart {
    static __instance: CommonShaderPart;
    __webglResourceRepository?: WebGLResourceRepository;
    constructor();
    static getMainBegin(isVertexStage: boolean): string;
    static getMainEnd(isVertexStage: boolean): "\n  return output;\n}\n" | "\n  return rt0;\n}\n" | "\n}\n    ";
    static getVertexPrerequisites(shaderNodes: AbstractShaderNode[]): string;
    private static __makeVaryingVariablesWGSL;
    static getPixelPrerequisites(shaderNodes: AbstractShaderNode[]): string;
    static getMainPrerequisites(): string;
    static getAssignmentStatement(varName: string, inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>): string;
    static getAssignmentVaryingStatementInPixelShader(varName: string, inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>, inputNode: AbstractShaderNode): string;
    static getAssignmentVaryingStatementInVertexShader(inputNode: AbstractShaderNode, varNames: string[], j: number): string;
    abstract get attributeNames(): AttributeNames;
    abstract get attributeSemantics(): Array<VertexAttributeEnum>;
    abstract get attributeCompositions(): Array<CompositionTypeEnum>;
    abstract get vertexShaderDefinitions(): string;
    abstract get pixelShaderDefinitions(): string;
}

type ShaderAttributeOrSemanticsOrString = string | VertexAttributeEnum | ShaderSemanticsEnum;
type ShaderSocket = {
    compositionType: CompositionTypeEnum;
    componentType: ComponentTypeEnum;
    name: ShaderAttributeOrSemanticsOrString;
    isClosed?: boolean;
};
type ShaderNodeUID = number;
type ShaderNodeInputConnectionType = {
    shaderNodeUid: number;
    outputNameOfPrev: string;
    inputNameOfThis: string;
};
type ShaderStage = 'Neutral' | 'Vertex' | 'Fragment';
/**
 * AbstractShaderNode is a abstract class that represents a shader node.
 */
declare abstract class AbstractShaderNode extends RnObject {
    static _shaderNodes: AbstractShaderNode[];
    protected __shaderFunctionName: string;
    protected __inputs: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>[];
    protected __outputs: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>[];
    protected __inputConnections: ShaderNodeInputConnectionType[];
    private static __invalidShaderNodeCount;
    protected __shaderNodeUid: ShaderNodeUID;
    private __codeGLSL?;
    private __codeWGSL?;
    protected __commonPart?: CommonShaderPart;
    private _shaderStage;
    constructor(shaderNodeName: string, shader: {
        codeGLSL?: string;
        codeWGSL?: string;
        commonPart?: CommonShaderPart;
    });
    setShaderStage(stage: ShaderStage): void;
    getShaderStage(): ShaderStage;
    static getShaderNodeByUid(uid: ShaderNodeUID): AbstractShaderNode;
    /**
     * Add a node connection to this node as an input.
     * @param inputShaderNode - a shader node to connect to this node.
     * @param outputSocketOfInput- the output socket of the inputShaderNode.
     * @param inputSocketOfThis - the input socket of this node.
     */
    addInputConnection<N extends CompositionTypeEnum, T extends ComponentTypeEnum>(inputShaderNode: AbstractShaderNode, outputSocketOfInput: Socket<string, N, T, SocketDefaultValue>, inputSocketOfThis: Socket<string, N, T, SocketDefaultValue>): void;
    get shaderFunctionName(): string;
    getShaderFunctionNameDerivative(): string;
    getShaderCode(shaderStage: ShaderTypeEnum): string;
    get shaderNodeUid(): ShaderNodeUID;
    getInput(name: string): Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue> | undefined;
    getInputs(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>[];
    getOutput(name: string): Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue> | undefined;
    getOutputs(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>[];
    get inputConnections(): ShaderNodeInputConnectionType[];
    makeCallStatement(i: number, shaderNode: AbstractShaderNode, functionName: string, varInputNames: string[][], varOutputNames: string[][]): string;
}

declare class MaterialRepository {
    private static __materialMap;
    private static __instances;
    private static __materialTids;
    private static __materialInstanceCountOfType;
    private static __materialNodes;
    private static __maxInstances;
    private static __bufferViews;
    private static __accessors;
    private static __materialTidCount;
    private static __materialUidCount;
    /**
     * Registers the material type.
     * @param materialTypeName The type name of the material.
     * @param materialNodes The material nodes to register.
     * @param maxInstancesNumber The maximum number to create the material instances.
     */
    static registerMaterial(materialTypeName: string, materialNode: AbstractMaterialContent, maxInstanceNumber?: number): boolean;
    static forceRegisterMaterial(materialTypeName: string, materialNode: AbstractMaterialContent, maxInstanceNumber?: number): boolean;
    static isRegisteredMaterialType(materialTypeName: string): boolean;
    static getMaterialByMaterialUid(materialUid: MaterialSID): Material | undefined;
    static getAllMaterials(): WeakRef<Material>[];
    /**
     * Creates an instance of this Material class.
     * @param materialTypeName The material type to create.
     * @param materialNodes_ The material nodes to add to the created material.
     */
    static createMaterial(materialTypeName: string, materialNode: AbstractMaterialContent): Material;
    static isFullOrOverOfThisMaterialType(materialTypeName: string): boolean;
    static isMaterialCompatible(currentMaterial: Material, newMaterialNode: AbstractMaterialContent): boolean;
    /**
     * Initialize Material Method
     */
    private static __initializeMaterial;
    static getLocationOffsetOfMemberOfMaterial(materialTypeName: string, propertyName: ShaderSemanticsName): IndexOf16Bytes;
    private static __registerInner;
    private static __allocateBufferView;
    static _makeShaderInvalidateToAllMaterials(): void;
}

/**
 * ShaderGraphResolver is a class that resolves the shader node graph and generates shader code.
 */
declare class ShaderGraphResolver {
    /**
     * Create a vertex shader code from the given vertex nodes.
     * @param vertexNodes - Vertex nodes
     * @param varyingNodes - Varying nodes
     * @param isFullVersion - Whether to generate a full version of the shader code
     * @returns Vertex shader code
     */
    static createVertexShaderCode(vertexNodes: AbstractShaderNode[], varyingNodes: AbstractShaderNode[], isFullVersion?: boolean): string | undefined;
    /**
     * Create a pixel shader code from the given pixel nodes.
     *
     * @param pixelNodes - Pixel nodes
     * @param isFullVersion - Whether to generate a full version of the shader code
     * @returns Pixel shader code
     */
    static createPixelShaderCode(pixelNodes: AbstractShaderNode[], isFullVersion?: boolean): string | undefined;
    private static __validateShaderNodes;
    /**
     * Sort shader nodes topologically.
     *
     * @param shaderNodes - Shader nodes to sort
     * @returns Sorted shader nodes
     */
    private static __sortTopologically;
    /**
     * Get function definition from shader nodes.
     *
     * @param shaderNodes - Shader nodes
     * @param shaderType - Shader type
     * @returns Function definition as a string
     */
    private static __getFunctionDefinition;
    /**
     * Construct shader code with shader nodes.
     *
     * @param shaderNodes - Shader nodes (sorted topologically)
     * @param isVertexStage - Whether the shader is a vertex shader
     * @param isFullVersion - Whether to generate a full version of the shader code
     * @returns Shader code
     */
    private static __constructShaderWithNodes;
    /**
     * Generate shader code from JSON.
     *
     * @param json - JSON data of a shader node graph
     * @returns Shader code
     */
    static generateShaderCodeFromJson(json: ShaderNodeJson): {
        vertexShader: string;
        pixelShader: string;
    } | undefined;
}

type FillArgsObject = {
    [key: string]: string | object;
};
type VertexAttributesLayout = {
    names: string[];
    semantics: VertexAttributeEnum[];
    compositions: CompositionTypeEnum[];
    components: ComponentTypeEnum[];
};
declare class ShaderityUtilityWebGL {
    static fillTemplate(shaderityObject: ShaderityObject, args: FillArgsObject): ShaderityObject;
    static transformWebGLVersion(shaderityObject: ShaderityObject, isWebGL2: boolean): ShaderityObject;
    static getAttributeReflection(shaderityObject: ShaderityObject): VertexAttributesLayout;
    private static __setDefaultAttributeSemanticMap;
    static getShaderDataReflection(shaderityObject: ShaderityObject): {
        shaderSemanticsInfoArray: ShaderSemanticsInfo[];
        shaderityObject: ShaderityObject;
    };
    private static __copyShaderityObject;
    private static __ignoreThisUniformDeclaration;
    private static __createShaderSemanticsInfo;
    private static __setRhodoniteOriginalParametersTo;
    private static __getInitialValueFromText;
    private static __getDefaultInitialValue;
}

declare class TextureArray extends AbstractTexture implements Disposable {
    private static managedRegistry;
    constructor();
    private __setTextureResourceUid;
    private static __deleteInternalTexture;
    load1x1Texture(rgbaStr?: string): void;
    destroy3DAPIResources(): void;
    [Symbol.dispose](): void;
    destroy(): void;
}

declare const dummyWhiteTexture: Texture;
declare const dummyBlueTexture: Texture;
declare const dummyBlackTexture: Texture;
declare const dummyBlackCubeTexture: CubeTexture;
declare const dummyZeroTexture: Texture;
declare const sheenLutTexture: Texture;
declare const dummySRGBGrayTexture: Texture;
declare const dummyAnisotropyTexture: Texture;
declare const dummyDepthMomentTextureArray: TextureArray;
declare function initDefaultTextures(): Promise<void>;
declare const DefaultTextures: {
    dummyWhiteTexture: Texture;
    dummyBlueTexture: Texture;
    dummyBlackTexture: Texture;
    dummyBlackCubeTexture: CubeTexture;
    dummyZeroTexture: Texture;
    sheenLutTexture: Texture;
    dummySRGBGrayTexture: Texture;
    dummyAnisotropyTexture: Texture;
    dummyDepthMomentTextureArray: TextureArray;
};

declare class AddShaderNode extends AbstractShaderNode {
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    getDefaultValue(compositionType: CompositionTypeEnum): Vector3 | Vector4 | Vector2 | Scalar$1;
    getSocketInputLhs(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>;
    getSocketInputRhs(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>;
    getSocketOutput(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>;
    getShaderFunctionNameDerivative(): string;
}

declare class AttributeColorShaderNode extends AbstractShaderNode {
    constructor();
}

declare class AttributeNormalShaderNode extends AbstractShaderNode {
    constructor();
}

declare class AttributePositionShaderNode extends AbstractShaderNode {
    constructor();
    getSocketOutput(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>;
}

declare class AttributeTexcoordShaderNode extends AbstractShaderNode {
    constructor();
}

declare class BlockBeginShaderNode extends AbstractShaderNode {
    private __valueInputs;
    private __valueOutputs;
    constructor();
    addInputAndOutput(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum): void;
}

declare class BlockEndShaderNode extends AbstractShaderNode {
    constructor();
    addInputAndOutput(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum): void;
}

declare abstract class ConstantVariableShaderNode<N extends CompositionTypeEnum, T extends ComponentTypeEnum> extends AbstractShaderNode {
    constructor(nodeName: string, compositionType: N, componentType: T);
    setDefaultInputValue(value: IVector): void;
    getSocketOutput(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>;
}

declare class ConstantScalarVariableShaderNode<T extends ComponentTypeEnum> extends ConstantVariableShaderNode<typeof CompositionType.Scalar, T> {
    constructor(componentType: T);
    setDefaultInputValue(value: IScalar): void;
}

declare class ConstantVector2VariableShaderNode<T extends ComponentTypeEnum> extends ConstantVariableShaderNode<typeof CompositionType.Vec2, T> {
    constructor(componentType: T);
    setDefaultInputValue(value: IVector2): void;
}

declare class ConstantVector3VariableShaderNode<T extends ComponentTypeEnum> extends ConstantVariableShaderNode<typeof CompositionType.Vec3, T> {
    constructor(componentType: T);
    setDefaultInputValue(value: IVector3): void;
}

declare class ConstantVector4VariableShaderNode<T extends ComponentTypeEnum> extends ConstantVariableShaderNode<typeof CompositionType.Vec4, T> {
    constructor(componentType: T);
    setDefaultInputValue(value: IVector4): void;
}

declare class DotProductShaderNode extends AbstractShaderNode {
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    getShaderFunctionNameDerivative(): string;
}

declare class GreaterShaderNode extends AbstractShaderNode {
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
}

declare class IfStatementShaderNode extends AbstractShaderNode {
    constructor();
}

declare class MultiplyShaderNode extends AbstractShaderNode {
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    getShaderFunctionNameDerivative(): string;
}

declare class NormalMatrixShaderNode extends AbstractShaderNode {
    constructor();
}

declare class NormalizeShaderNode extends AbstractShaderNode {
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    getShaderFunctionNameDerivative(): string;
}

declare class OutColorShaderNode extends AbstractShaderNode {
    constructor();
    getSocketInput(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>;
}

declare class OutPositionShaderNode extends AbstractShaderNode {
    constructor();
    getSocketInput(): Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>;
}

declare class ProjectionMatrixShaderNode extends AbstractShaderNode {
    constructor();
}

declare class UniformDataShaderNode extends AbstractShaderNode {
    constructor(compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum);
    setDefaultInputValue(inputName: string, value: any): void;
    setUniformDataName(value: any): void;
}

declare class ViewMatrixShaderNode extends AbstractShaderNode {
    constructor();
}

declare class WireframeMaterialNode extends AbstractShaderNode {
    constructor();
}

declare class WorldMatrixShaderNode extends AbstractShaderNode {
    constructor();
}

declare class SplitVectorShaderNode extends AbstractShaderNode {
    constructor();
    getShaderFunctionNameDerivative(): string;
    makeCallStatement(i: number, shaderNode: AbstractShaderNode, functionName: string, varInputNames: string[][], varOutputNames: string[][]): string;
}

declare class MergeVectorShaderNode extends AbstractShaderNode {
    constructor();
    getShaderFunctionNameDerivative(): string;
    makeCallStatement(i: number, shaderNode: AbstractShaderNode, functionName: string, varInputNames: string[][], varOutputNames: string[][]): string;
}

declare class ColorGradingUsingLUTsMaterialContent extends AbstractMaterialContent {
    static lookupTableTexture: ShaderSemanticsClass;
    constructor(materialName: string, targetRenderPass: RenderPass, colorAttachmentsNumber: Count, uri?: string, texture?: AbstractTexture);
    _setInternalSettingParametersToGpuWebGLPerMaterial({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
}

declare class CustomMaterialContent extends AbstractMaterialContent {
    private static __globalDataRepository;
    private static __diffuseIblCubeMapSampler;
    private static __specularIblCubeMapSampler;
    constructor({ name, isMorphing, isSkinning, isLighting, vertexShader, pixelShader, additionalShaderSemanticInfo, vertexShaderWebGpu, pixelShaderWebGpu, definitions, }: {
        name: string;
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
        vertexShader?: ShaderityObject;
        pixelShader?: ShaderityObject;
        additionalShaderSemanticInfo: ShaderSemanticsInfo[];
        vertexShaderWebGpu?: ShaderityObject;
        pixelShaderWebGpu?: ShaderityObject;
        definitions?: string[];
    });
    _setInternalSettingParametersToGpuWebGpu({ material, args, }: {
        material: Material;
        args: RenderingArgWebGpu;
    }): void;
    _setInternalSettingParametersToGpuWebGLPerMaterial({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    _setInternalSettingParametersToGpuWebGLPerShaderProgram({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    _setInternalSettingParametersToGpuWebGLPerPrimitive({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    private static __setupHdriParameters;
}

declare class DepthEncodeMaterialContent extends AbstractMaterialContent {
    static zNearInner: ShaderSemanticsClass;
    static zFarInner: ShaderSemanticsClass;
    static isPointLight: ShaderSemanticsClass;
    static depthPow: ShaderSemanticsClass;
    private __lastZNear;
    private __lastZFar;
    constructor(materialName: string, depthPow: number, { isSkinning }: {
        isSkinning: boolean;
    });
    _setInternalSettingParametersToGpuWebGLPerMaterial({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
}

declare class DetectHighLuminanceMaterialContent extends AbstractMaterialContent {
    static LuminanceCriterion: ShaderSemanticsEnum;
    constructor(materialName: string, textureToDetectHighLuminance: AbstractTexture);
    _setInternalSettingParametersToGpuWebGLPerMaterial({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
}

declare class EntityUIDOutputMaterialContent extends AbstractMaterialContent {
    constructor(materialName: string);
    _setInternalSettingParametersToGpuWebGLPerMaterial({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
}

declare class FurnaceTestMaterialContent extends AbstractMaterialContent {
    static mode: ShaderSemanticsClass;
    static debugView: ShaderSemanticsClass;
    static g_type: ShaderSemanticsClass;
    static disable_fresnel: ShaderSemanticsClass;
    static f0: ShaderSemanticsClass;
    constructor(materialName: string);
    _setInternalSettingParametersToGpuWebGLPerMaterial({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
}

declare class MToon0xMaterialContent extends AbstractMaterialContent {
    private static __diffuseIblCubeMapSampler;
    private static __specularIblCubeMapSampler;
    static readonly _Cutoff: ShaderSemanticsClass;
    static readonly _Color: ShaderSemanticsClass;
    static readonly _ShadeColor: ShaderSemanticsClass;
    static readonly _litColorTexture: ShaderSemanticsClass;
    static readonly _shadeColorTexture: ShaderSemanticsClass;
    static readonly _BumpScale: ShaderSemanticsClass;
    static readonly _normalTexture: ShaderSemanticsClass;
    static readonly _ReceiveShadowRate: ShaderSemanticsClass;
    static readonly _receiveShadowTexture: ShaderSemanticsClass;
    static readonly _ShadingGradeRate: ShaderSemanticsClass;
    static readonly _shadingGradeTexture: ShaderSemanticsClass;
    static readonly _ShadeShift: ShaderSemanticsClass;
    static readonly _ShadeToony: ShaderSemanticsClass;
    static readonly _LightColorAttenuation: ShaderSemanticsClass;
    static readonly _AmbientColor: ShaderSemanticsClass;
    static readonly _IndirectLightIntensity: ShaderSemanticsClass;
    static readonly _rimTexture: ShaderSemanticsClass;
    static readonly _RimColor: ShaderSemanticsClass;
    static readonly _RimLightingMix: ShaderSemanticsClass;
    static readonly _RimFresnelPower: ShaderSemanticsClass;
    static readonly _RimLift: ShaderSemanticsClass;
    static readonly _matCapTexture: ShaderSemanticsClass;
    static readonly _EmissionColor: ShaderSemanticsClass;
    static readonly _emissionTexture: ShaderSemanticsClass;
    static readonly _OutlineWidthTexture: ShaderSemanticsClass;
    static readonly _OutlineWidth: ShaderSemanticsClass;
    static readonly _OutlineScaledMaxDistance: ShaderSemanticsClass;
    static readonly _OutlineColor: ShaderSemanticsClass;
    static readonly _OutlineLightingMix: ShaderSemanticsClass;
    static readonly Aspect: ShaderSemanticsClass;
    static readonly CameraUp: ShaderSemanticsClass;
    static usableBlendEquationModeAlpha?: number;
    private __OutlineWidthModeIsScreen;
    private __floatProperties;
    private __vectorProperties;
    private __textureProperties;
    constructor(isOutline: boolean, materialProperties: Vrm0xMaterialProperty | undefined, textures: any, samplers: Sampler[], isMorphing: boolean, isSkinning: boolean, isLighting: boolean, useTangentAttribute: boolean, debugMode: Count | undefined, makeOutputSrgb: boolean, materialName: string, definitions: string[]);
    private __setDummyTextures;
    setMaterialParameters(material: Material, isOutline: boolean): void;
    private static __initializeUsableBlendEquationModeAlpha;
    _setInternalSettingParametersToGpuWebGpu({ material, args, }: {
        material: Material;
        args: RenderingArgWebGpu;
    }): void;
    _setInternalSettingParametersToGpuWebGLPerShaderProgram({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    _setInternalSettingParametersToGpuWebGLPerMaterial({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    static unityBlendEnumCorrespondence(enumNumber: number): number;
    private static __setupHdriParameters;
}

declare class MToon1MaterialContent extends AbstractMaterialContent {
    private static __diffuseIblCubeMapSampler;
    private static __specularIblCubeMapSampler;
    constructor(materialName: string, isMorphing: boolean, isSkinning: boolean, isLighting: boolean, isOutline: boolean, definitions: string[]);
    setMaterialParameters(material: Material, isOutline: boolean, materialJson: Vrm1_Material): void;
    _setInternalSettingParametersToGpuWebGpu({ material, args, }: {
        material: Material;
        args: RenderingArgWebGpu;
    }): void;
    _setInternalSettingParametersToGpuWebGLPerShaderProgram({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    _setInternalSettingParametersToGpuWebGLPerMaterial({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    private static __setupHdriParameters;
}

declare class MatCapMaterialContent extends AbstractMaterialContent {
    static MatCapTexture: ShaderSemanticsClass;
    constructor(materialName: string, isSkinning: boolean, uri?: string, texture?: AbstractTexture, sampler?: Sampler);
    _setInternalSettingParametersToGpuWebGLPerMaterial({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
}

declare class ShadowMapDecodeClassicMaterialContent extends AbstractMaterialContent {
    static ShadowColorFactor: ShaderSemanticsEnum;
    static ShadowAlpha: ShaderSemanticsEnum;
    static NonShadowAlpha: ShaderSemanticsEnum;
    static AllowableDepthError: ShaderSemanticsEnum;
    static zNearInner: ShaderSemanticsClass;
    static zFarInner: ShaderSemanticsClass;
    static DebugColorFactor: ShaderSemanticsEnum;
    static DepthTexture: ShaderSemanticsEnum;
    static IsPointLight: ShaderSemanticsClass;
    private static __lastZNear;
    private static __lastZFar;
    private __encodedDepthRenderPass;
    /**
     * The constructor of the ShadowMapDecodeClassicMaterialContent
     * @param isMorphing True if the morphing is to be applied
     * @param isSkinning True if the skeleton is to be applied
     * @param isLighting True if the lighting is to be applied. When isLighting is false, the Shader draws the original color of the material, except for the shadow area.
     * @param isDebugging True if the shader displays the DebugColorFactor color in areas outside of the depth map.
     * @param colorAttachmentsNumber The index of colorAttachment in a framebuffer. The colorAttachment must have depth information drawn by the DepthEncodeMaterialContent.
     * @param encodedDepthRenderPass The render pass where the depth information from the DepthEncodeMaterialContent is drawn to the frame buffer
     */
    constructor(materialName: string, { isMorphing, isSkinning, isLighting, isDebugging, colorAttachmentsNumber, }: {
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
        isDebugging: boolean;
        colorAttachmentsNumber: Count;
    }, encodedDepthRenderPass: RenderPass);
    _setInternalSettingParametersToGpuWebGLPerMaterial({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
}

declare class SynthesizeHdrMaterialContent extends AbstractMaterialContent {
    static SynthesizeCoefficient: ShaderSemanticsClass;
    static TargetRegionTexture: ShaderSemanticsClass;
    static SynthesizeTexture0: ShaderSemanticsClass;
    static SynthesizeTexture1: ShaderSemanticsClass;
    static SynthesizeTexture2: ShaderSemanticsClass;
    static SynthesizeTexture3: ShaderSemanticsClass;
    static SynthesizeTexture4: ShaderSemanticsClass;
    static SynthesizeTexture5: ShaderSemanticsClass;
    private textureNumber;
    /**
     * This material node uses for the glare effect and so on.
     *
     * If the targetRegionTexture is not specified, the shader synthesizes all the
     * synthesizeTextures with all the pixels weighted by the synthesizeCoefficient.
     *
     * If the targetRegionTexture is specified, the shader synthesizes all the
     * synthesizeTextures with weights only for the non-white pixels of
     * targetRegionTexture (where the color is not (1.0, 1.0, 1.0, 1.0)). On the other
     * hand, in the white area, the output value is the product of the value of each
     * pixel in synthesizeTextures[0] and synthesizeCoefficient[0].
     *
     * @synthesizeTextures Textures to be synthesized. The shader supports up to six texture syntheses.
     * @targetRegionTexture Texture to specify the area where the texture will be synthesized
     */
    constructor(materialName: string, synthesizeTextures: AbstractTexture[]);
    _setInternalSettingParametersToGpuWebGLPerMaterial({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    get synthesizeTextureNumber(): number;
}

declare class VarianceShadowMapDecodeClassicMaterialContent extends AbstractMaterialContent {
    static IsPointLight: ShaderSemanticsClass;
    static DepthTexture: ShaderSemanticsClass;
    static SquareDepthTexture: ShaderSemanticsClass;
    static DepthAdjustment: ShaderSemanticsClass;
    static TextureDepthAdjustment: ShaderSemanticsClass;
    static MinimumVariance: ShaderSemanticsClass;
    static LightBleedingParameter: ShaderSemanticsClass;
    static ShadowColor: ShaderSemanticsClass;
    static AllowableDepthError: ShaderSemanticsClass;
    static zNearInner: ShaderSemanticsClass;
    static zFarInner: ShaderSemanticsClass;
    static DebugColorFactor: ShaderSemanticsEnum;
    private static __lastZNear;
    private static __lastZFar;
    private __depthCameraComponent?;
    /**
     * The constructor of the VarianceShadowMapDecodeClassicMaterialContent
     * @param isMorphing True if the morphing is to be applied
     * @param isSkinning True if the skeleton is to be applied
     * @param isLighting True if the lighting is to be applied. When isLighting is false, the Shader draws the original color of the material, except for the shadow area.
     * @param isDebugging True if the shader displays the DebugColorFactor color in areas outside of the depth map.
     *
     *
     *
     *
     * @param colorAttachmentsNumber The index of colorAttachment in a framebuffer. The colorAttachment must have depth information drawn by the DepthEncodeMaterialContent.
     * @param encodedDepthRenderPass The render pass where the depth information from the DepthEncodeMaterialContent is drawn to the frame buffer
     */
    constructor(materialName: string, { isMorphing, isSkinning, isLighting, isDebugging, colorAttachmentsNumberDepth, colorAttachmentsNumberSquareDepth, depthCameraComponent, }: {
        isMorphing: boolean;
        isSkinning: boolean;
        isLighting: boolean;
        isDebugging: boolean;
        colorAttachmentsNumberDepth: Count;
        colorAttachmentsNumberSquareDepth: Count;
        depthCameraComponent?: CameraComponent;
    }, encodedDepthRenderPasses: RenderPass[]);
    _setInternalSettingParametersToGpuWebGLPerMaterial({ material, shaderProgram, firstTime, args, }: {
        material: Material;
        shaderProgram: WebGLProgram;
        firstTime: boolean;
        args: RenderingArgWebGL;
    }): void;
    set depthCameraComponent(depthCameraComponent: CameraComponent);
}

type PhysicsWorldProperty = {
    gravity: IVector3;
    random: boolean;
};

declare class OimoPhysicsStrategy implements PhysicsStrategy {
    static __worldProperty: PhysicsWorldProperty;
    static __world: any;
    private __body;
    private __entity?;
    private __property;
    private __localScale;
    constructor();
    setShape(prop: PhysicsPropertyInner, entity: ISceneGraphEntity): void;
    update(): void;
    setPosition(worldPosition: IVector3): void;
    setEulerAngle(eulerAngles: IVector3): void;
    setScale(scale: IVector3): void;
    static update(): void;
}

declare class CapsuleCollider {
    position: Vector3;
    radius: number;
    tail: Vector3;
    baseSceneGraph?: SceneGraphComponent;
    collision(bonePosition: Vector3, boneRadius: number): {
        direction: Vector3;
        distance: number;
    };
}

declare class SphereCollider {
    position: Vector3;
    radius: number;
    baseSceneGraph?: SceneGraphComponent;
    private static __tmp_vec3_0;
    private static __tmp_vec3_1;
    private static __tmp_vec3_2;
    collision(bonePosition: Vector3, boneRadius: number): {
        direction: IMutableVector3;
        distance: number;
    };
}

declare class VRMColliderGroup {
    sphereColliders: SphereCollider[];
    capsuleColliders: CapsuleCollider[];
}

declare class VRMSpringBone extends RnObject {
    stiffnessForce: number;
    gravityPower: number;
    gravityDir: Vector3;
    dragForce: number;
    hitRadius: number;
    node: ISceneGraphEntity;
    currentTail: Vector3;
    prevTail: Vector3;
    boneAxis: Vector3;
    boneLength: number;
    initialLocalChildPosition: Vector3;
    initialized: boolean;
    private static __tmp_vec3_0;
    private static __tmp_vec3_1;
    private static __tmp_vec3_2_zero;
    constructor(node: ISceneGraphEntity);
    setup(center?: SceneGraphComponent): void;
    _getMatrixCenterToWorld(center?: SceneGraphComponent): IMatrix44;
    _getMatrixWorldToCenter(center?: SceneGraphComponent): IMatrix44;
    _calcWorldSpaceBoneLength(): void;
}

declare class VRMSpring extends RnObject {
    rootBone: SceneGraphComponent;
    bones: VRMSpringBone[];
    colliderGroups: VRMColliderGroup[];
    center: SceneGraphComponent | undefined;
    constructor(rootBone: SceneGraphComponent);
}

declare class VRMSpringBonePhysicsStrategy implements PhysicsStrategy {
    private static __tmp_process_vec3_0;
    private static __tmp_process_vec3_1;
    private static __tmp_process_vec3_2;
    private static __tmp_process_vec3_3;
    private static __tmp_process_vec3_4;
    private static __tmp_process_vec3_5;
    private static __tmp_process_vec3_6;
    private static __tmp_process_vec3_7;
    private static __tmp_process_vec3_8;
    private static __tmp_process_vec3_9;
    private static __tmp_process_quat_0;
    private static __tmp_normalizeBoneLength_vec3_0;
    private static __tmp_normalizeBoneLength_vec3_1;
    private static __tmp_normalizeBoneLength_vec3_2;
    private static __tmp_normalizeBoneLength_vec3_3;
    private static __tmp_normalizeBoneLength_vec3_4;
    private static __tmp_normalizeBoneLength_vec3_5;
    private static __tmp_applyRotation_vec3_0;
    private static __tmp_applyRotation_vec3_1;
    private static __tmp_applyRotation_vec3_2;
    private static __tmp_applyRotation_vec3_3;
    private static __tmp_applyRotation_quat_0;
    private static __tmp_applyRotation_quat_1;
    private static __tmp_applyRotation_quat_2;
    private static __tmp_applyRotation_quat_3;
    private static __tmp_applyRotation_quat_4;
    private static __tmp_getParentRotation_quat_0;
    private static __tmp_getParentRotation_quat_1_identity;
    private static __tmp_collision_vec3_0;
    private static __tmp_collision_vec3_1;
    private static __tmp_collision_vec3_2;
    private static __tmp_collision_vec3_3;
    private __spring;
    constructor();
    getParentRotation(head: SceneGraphComponent): MutableQuaternion;
    update(): void;
    updateInner(bones: VRMSpringBone[], spring: VRMSpring): void;
    process(collisionGroups: VRMColliderGroup[], bone: VRMSpringBone, center?: SceneGraphComponent): void;
    normalizeBoneLength(nextTail: Vector3, bone: VRMSpringBone): IMutableVector3;
    applyRotation(nextTail: Vector3, bone: VRMSpringBone): IMutableQuaternion;
    collision(collisionGroups: VRMColliderGroup[], nextTail: Vector3, boneHitRadius: number, bone: VRMSpringBone): Vector3;
    setSpring(sgs: VRMSpring): void;
}

type ColorAttachmentIndex = number;
type InputRenderPassIndex = number;
type RenderPassIndex = number;
/**
 * Frame manages expressions and input/output dependencies between them
 */
declare class Frame extends RnObject {
    private __expressions;
    private __expressionsCache;
    static readonly FrameBuffer = "FrameBuffer";
    static readonly ResolveFrameBuffer = "ResolveFrameBuffer";
    static readonly ResolveFrameBuffer2 = "ResolveFrameBuffer2";
    private __expressionQueries;
    constructor();
    /**
     * Add render passes to the end of this expression.
     */
    addExpression(expression: Expression, { inputRenderPasses, outputs, }?: {
        inputRenderPasses?: RenderPass[];
        outputs?: {
            renderPass: RequireOne<{
                index?: RenderPassIndex;
                uniqueName?: string;
                instance?: RenderPass;
            }>;
            frameBuffer: FrameBuffer;
        }[];
    }): void;
    /**
     * Get ColorAttachment RenderBuffer from input render pass of the expression
     * @param inputFrom input Expression
     * @param {inputIndex: number, colorAttachmentIndex: number} input RenderPass Index and ColorAttachmen tIndex
     * @returns {Promise<RenderTargetTexture>}
     */
    getColorAttachmentFromInputOf(inputFrom: Expression, renderPassArg?: {
        renderPass: RequireOne<{
            index?: InputRenderPassIndex;
            uniqueName?: string;
            instance?: RenderPass;
        }>;
        colorAttachmentIndex: ColorAttachmentIndex;
        framebufferType: 'FrameBuffer' | 'ResolveFrameBuffer' | 'ResolveFrameBuffer2';
    }): Promise<RenderTargetTexture>;
    /**
     *
     */
    resolve(): void;
    /**
     * Clear render passes of this expression.
     */
    clearExpressions(): void;
    /**
     * Get expressions
     */
    get expressions(): Expression[];
    setViewport(viewport: IVector4): void;
}

/**
 * ForwardRenderPipeline is a one of render pipelines
 *
 * @remarks
 * A render pipeline is a class of complex multi-pass setups already built in,
 * which allows users to easily benefit from advanced expressions such as refraction and MSAA.
 * (like the URP (Universal Render Pipeline) in the Unity engine).
 *
 * @example
 * ```
 * const expressions = ...;
 * const matrix = ...;
 * // Create a render pipeline
 * const forwardRenderPipeline = new Rn.ForwardRenderPipeline();
 * // Set up the render pipeline
 * forwardRenderPipeline.setup(1024, 1024, {isShadow: true});
 * // Set expressions before calling other setter methods
 * forwardRenderPipeline.setExpressions(expressions);
 * // Set IBLs
 * const diffuseCubeTexture = new Rn.CubeTexture();
 * diffuseCubeTexture.baseUriToLoad = './../../../assets/ibl/papermill/diffuse/diffuse';
 * diffuseCubeTexture.isNamePosNeg = true;
 * diffuseCubeTexture.hdriFormat = Rn.HdriFormat.RGBE_PNG;
 * diffuseCubeTexture.mipmapLevelNumber = 1;
 * const specularCubeTexture = new Rn.CubeTexture();
 * specularCubeTexture.baseUriToLoad = './../../../assets/ibl/papermill/specular/specular';
 * specularCubeTexture.isNamePosNeg = true;
 * specularCubeTexture.hdriFormat = Rn.HdriFormat.RGBE_PNG;
 * specularCubeTexture.mipmapLevelNumber = 10;
 * forwardRenderPipeline.setIBLTextures(diffuseCubeTexture, specularCubeTexture);
 * // Set BiasViewProjectionMatrix for Shadow
 * forwardRenderPipeline.setBiasViewProjectionMatrixForShadow(matrix);
 * // Start Render Loop
 * forwardRenderPipeline.startRenderLoop((frame) => {
 *   Rn.System.process(frame);
 * });
 * ```
 */
declare class ForwardRenderPipeline extends RnObject {
    private __width;
    private __height;
    private __isShadow;
    private __isBloom;
    private __isSimple;
    private __shadowMapSize;
    private __oFrame;
    private __oFrameBufferMultiView;
    private __oFrameBufferMultiViewBlit;
    private __oFrameBufferMultiViewBlitBackBuffer;
    private __oFrameBufferMsaa;
    private __oFrameBufferResolve;
    private __oFrameBufferResolveForReference;
    private __oInitialExpression;
    /** main expressions */
    private __expressions;
    private __oGenerateMipmapsExpression;
    private __oMultiViewBlitBackBufferExpression;
    private __oMultiViewBlitExpression;
    private __oBloomExpression;
    private __oToneMappingExpression;
    private __oToneMappingMaterial;
    private __transparentOnlyExpressions;
    private __oWebXRSystem;
    private __oDrawFunc;
    private __oDiffuseCubeTexture;
    private __oSpecularCubeTexture;
    private __oSheenCubeTexture;
    private __oSamplerForBackBuffer;
    private __toneMappingType;
    private __bloomHelper;
    private __oShadowSystem;
    private __shadowExpressions;
    constructor();
    private __destroyResources;
    /**
     * Initializes the pipeline.
     * @param canvasWidth - The width of the canvas.
     * @param canvasHeight - The height of the canvas.
     */
    setup(canvasWidth: number, canvasHeight: number, { isShadow, isBloom, shadowMapSize, isSimple }?: {
        isShadow?: boolean | undefined;
        isBloom?: boolean | undefined;
        shadowMapSize?: number | undefined;
        isSimple?: boolean | undefined;
    }): Promise<Err<unknown, undefined> | Ok<unknown, unknown>>;
    private __getMainFrameBufferBackBuffer;
    private __getMainFrameBufferResolve;
    private __getMainFrameBuffer;
    /**
     * set Expressions for drawing
     * @param expressions - expressions to draw
     * @param options - option parameters
     */
    setExpressions(expressions: Expression[], options?: {
        isTransmission: boolean;
    }): void;
    /**
     * Start rendering loop
     * @param func - function to be called when the frame is rendered
     * @returns RnResult
     */
    startRenderLoop(func: (frame: Frame) => void): Err<unknown, undefined> | Ok<unknown, unknown>;
    /**
     * draw with the given function in startRenderLoop method
     */
    draw(): void;
    /**
     * Resize screen
     * @param width - width of the screen
     * @param height - height of the screen
     * @returns RnResult
     */
    resize(width: Size, height: Size): Err<unknown, undefined> | Ok<unknown, unknown>;
    /**
     * set IBL cube textures
     * @param diffuse - diffuse IBL Cube Texture
     * @param specular - specular IBL Cube Texture
     */
    setIBLTextures(diffuse: CubeTexture, specular: CubeTexture, sheen?: CubeTexture): void;
    /**
     * getter of initial expression
     */
    getInitialExpression(): Expression | undefined;
    /**
     * getter of ToneMapping expression
     */
    getToneMappingExpression(): Expression | undefined;
    /**
     * set diffuse IBL contribution
     * @param value - 0.0 ~ 1.0 or greater
     */
    setDiffuseIBLContribution(value: number): void;
    /**
     * set specular IBL contribution
     * @param value - 0.0 ~ 1.0 or greater
     */
    setSpecularIBLContribution(value: number): void;
    /**
     * set the rotation of IBL
     * @param radian - rotation in radian
     */
    setIBLRotation(radian: number): void;
    private __setExpressionsInner;
    private __setTransparentExpressionsForTransmission;
    private __setupInitialExpression;
    private __createRenderTargets;
    private __setupGenerateMipmapsExpression;
    private __setupMultiViewBlitBackBufferExpression;
    private __setupMultiViewBlitExpression;
    private __setupToneMappingExpression;
    private __setupDepthMomentFramebuffer;
    private __setIblInner;
    private __setIblInnerForTransparentOnly;
    setToneMappingType(type: ToneMappingTypeEnum): void;
    /**
     * setUp Frame
     *
     * @remarks
     * This method adds expressions to the frame.
     */
    private __setExpressions;
}

declare function isSkipDrawing(material: Material, primitive: Primitive): boolean;

declare const EVENT_MOUSE_DOWN = "mousedown";
declare const EVENT_MOUSE_MOVE = "mousemove";
declare const EVENT_MOUSE_UP = "mouseup";
declare const EVENT_MOUSE_WHEEL = "wheel";
declare const EVENT_MOUSE_ENTER = "mouseenter";
declare const EVENT_MOUSE_LEAVE = "mouseleave";
declare const EVENT_MOUSE_OVER = "mouseover";
declare const EVENT_CLICK = "click";
declare const EVENT_KEY_DOWN = "keydown";
declare const EVENT_KEY_UP = "keyup";
declare const EVENT_KEY_PRESS = "keypress";
declare const EVENT_POINTER_DOWN = "pointerdown";
declare const EVENT_MSPOINTER_DOWN = "MSPointerDown";
declare const EVENT_POINTER_MOVE = "pointermove";
declare const EVENT_MSPOINTER_MOVE = "MSPointerMove";
declare const EVENT_POINTER_UP = "pointerup";
declare const EVENT_MSPOINTER_UP = "MSPointerUp";
declare const EVENT_POINTER_CANCEL = "pointercancel";
declare const EVENT_POINTER_ENTER = "pointerenter";
declare const EVENT_POINTER_LEAVE = "pointerleave";
declare const EVENT_POINTER_OVER = "pointerover";
declare const EVENT_POINTER_OUT = "pointerout";
declare const EVENT_RESIZE = "resize";
declare const EVENT_ORIENTATION_CHANGE = "orientationchange";
declare const EVENT_TOUCH_TAP = "tap";
declare const EVENT_TOUCH_DOUBLE_TAP = "doubletap";
declare const EVENT_TOUCH_LONG_TAP = "longtap";
declare const EVENT_TOUCH_HOLD = "hold";
declare const EVENT_TOUCH_DRAG = "drag";
declare const EVENT_TOUCH_SWIPE = "swipe";
declare const EVENT_TOUCH_PINCH = "pinch";
declare const EVENT_TOUCH_START = "touchstart";
declare const EVENT_TOUCH_MOVE = "touchmove";
declare const EVENT_TOUCH_END = "touchend";
declare const EVENT_TOUCH_CANCEL = "touchcancel";
declare const EVENT_TOUCH_ENTER = "touchenter";
declare const EVENT_TOUCH_LEAVE = "touchleave";
declare const EVENT_TOUCH_OVER = "touchover";
declare const EVENT_TOUCH_OUT = "touchout";
declare global {
    interface Navigator {
        readonly pointerEnabled: boolean;
        readonly msPointerEnabled: boolean;
    }
}
declare function getEvent(type: 'start' | 'move' | 'end' | 'click'): string;
type ClassInstance = any;
interface InputHandlerInfo {
    eventName: string;
    handler: (event: any) => void;
    options: AddEventListenerOptions;
    classInstance: ClassInstance;
    eventTargetDom: EventTarget;
}
declare const INPUT_HANDLING_STATE_NONE = "None";
declare const INPUT_HANDLING_STATE_CAMERA_CONTROLLER = "CameraController";
declare const INPUT_HANDLING_STATE_GIZMO_TRANSLATION = "GizmoTranslation";
declare const INPUT_HANDLING_STATE_GIZMO_SCALE = "GizmoScale";
type InputHandlingState = typeof INPUT_HANDLING_STATE_NONE | typeof INPUT_HANDLING_STATE_CAMERA_CONTROLLER | typeof INPUT_HANDLING_STATE_GIZMO_TRANSLATION | typeof INPUT_HANDLING_STATE_GIZMO_SCALE;
declare class InputManager {
    private static __inputHandlingStateMap;
    /**
     * This active information is set externally and does not change state internally.
     * Using this externally set active information, this class will add and remove event listeners as appropriate.
     * As a result, event handling for the entire Rhodonite works properly.
     */
    private static __activeMap;
    private static __currentState;
    static register(inputHandlingState: InputHandlingState, events: InputHandlerInfo[]): void;
    static unregister(inputHandlingState: InputHandlingState): void;
    static setActive(inputHandlingState: InputHandlingState, active: boolean): void;
    static __addEventListeners(inputHandlingState: InputHandlingState): void;
    static __removeEventListeners(inputHandlingState: InputHandlingState): void;
    static __processEventListeners(): void;
    static enableCameraController(): void;
    static disableCameraController(): void;
    static getCurrentState(): string;
}

declare class ModuleManager {
    private static __instance;
    private __modules;
    private constructor();
    loadModule(moduleName: string, options?: {
        wasm?: string;
    }): Promise<any>;
    getModule(moduleName: string): any;
    static getInstance(): ModuleManager;
}

/**
 * WebXRSystem class manages WebXR session and rendering
 */
declare class WebXRSystem {
    private static __instance;
    private __xrSession?;
    private __xrReferenceSpace?;
    private __webglLayer?;
    private __glw?;
    private __xrViewerPose?;
    private __isWebXRMode;
    private __spaceType;
    private __requestedToEnterWebXR;
    private __isReadyForWebXR;
    private __defaultPositionInLocalSpaceMode;
    private __canvasWidthForVR;
    private __canvasHeightForVR;
    private __viewerEntity;
    private __leftCameraEntity;
    private __rightCameraEntity;
    private __basePath?;
    private __controllerEntities;
    private __xrInputSources;
    private __viewerTranslate;
    private __viewerAzimuthAngle;
    private __viewerOrientation;
    private __viewerScale;
    private __multiviewFramebufferHandle;
    private __multiviewColorTextureHandle;
    private __webglStereoUtil?;
    private constructor();
    /**
     * Ready for WebXR
     *
     * @param requestButtonDom
     * @returns true: prepared properly, false: failed to prepare
     */
    readyForWebXR(requestButtonDom: HTMLElement, basePath: string): Promise<never[]>;
    /**
     * Enter to WebXR (VR mode)
     * @param initialUserPosition the initial user position in world space
     * @param callbackOnXrSessionEnd the callback function for XrSession ending
     * @returns boolean value about succeeded or not
     */
    enterWebXR({ initialUserPosition, callbackOnXrSessionStart, callbackOnXrSessionEnd, profilePriorities, }: {
        initialUserPosition?: Vector3;
        callbackOnXrSessionStart: () => void;
        callbackOnXrSessionEnd: () => void;
        profilePriorities: string[];
    }): Promise<IEntity[] | undefined>;
    /**
     * Disable WebXR (Close the XrSession)
     */
    exitWebXR(): Promise<void>;
    getCanvasWidthForVr(): number;
    getCanvasHeightForVr(): number;
    getControllerEntities(): ISceneGraphEntity[];
    get leftViewMatrix(): Matrix44;
    get rightViewMatrix(): Matrix44;
    get leftProjectionMatrix(): MutableMatrix44;
    get rightProjectionMatrix(): MutableMatrix44;
    get framebuffer(): WebGLFramebuffer | undefined;
    isMultiView(): boolean;
    get requestedToEnterWebXR(): boolean;
    get xrSession(): XRSession | undefined;
    get requestedToEnterWebVR(): boolean;
    get isWebXRMode(): boolean;
    private __setWebXRMode;
    get isReadyForWebXR(): boolean;
    static getInstance(): WebXRSystem;
    /**
     * Getter of the view matrix of right eye
     * @param index (0: left, 1: right)
     * @internal
     * @returns The view matrix vector of right eye
     */
    _getViewMatrixAt(index: Index): Matrix44;
    /**
     * Getter of the project matrix of right eye
     * @param index (0: left, 1: right)
     * @internal
     * @returns The project matrix of right eye
     */
    _getProjectMatrixAt(index: Index): MutableMatrix44;
    /**
     * Getter of the viewport vector
     * @param index (0: left, 1: right)
     * @internal
     * @returns the viewport vector
     */
    _getViewportAt(index: Index): Vector4;
    /**
     * Getter of the viewport vector of left eye
     * @internal
     * @returns The viewport vector of left eye
     */
    _getLeftViewport(): Vector4;
    /**
     * Getter of the viewport vector of right eye
     * @internal
     * @returns The viewport vector of right eye
     */
    _getRightViewport(): Vector4;
    _setValuesToGlobalDataRepository(): void;
    /**
     * Getter of the position of the VR camera in world space
     * @internal
     * @param displayIdx (0: left, 1: right)
     * @returns The position of the VR camera in world space
     */
    _getCameraWorldPositionAt(displayIdx: Index): Vector3;
    /**
     * Getter of the CameraComponent SID of left/right eye
     * @internal
     * @param index (0: left, 1: right)
     * @returns the SID of the CameraComponent of left/right eye
     */
    _getCameraComponentSIDAt(index: Index): number;
    /**
     * Getter of the CameraComponent of left/right eye
     * @internal
     * @param index (0: left, 1: right)
     * @returns the CameraComponent of left/right eye
     */
    _getCameraComponentAt(index: Index): CameraComponent;
    /**
     * Pre process for rendering
     * @internal
     * @param xrFrame XRFrame object
     */
    _preRender(time: number, xrFrame: XRFrame): void;
    resetViewerTransform(): void;
    /**
     * Post process for rendering
     * @internal
     */
    _postRender(): void;
    private __onInputSourcesChange;
    private __setCameraInfoFromXRViews;
    private __setupWebGLLayer;
    private __updateView;
    private __updateInputSources;
}

declare function setupShaderProgram(material: Material, primitive: Primitive, webglStrategy: WebGLStrategy): void;

interface CGAPIStrategy {
    $load(meshComponent: MeshComponent): boolean;
    prerender(): void;
    common_$render(primitiveUids: PrimitiveUID[], renderPass: RenderPass, renderPassTickCount: Count): boolean;
}

declare class WebGLStrategyDataTexture implements CGAPIStrategy, WebGLStrategy {
    private static __instance;
    private __webglResourceRepository;
    private __dataTextureUid;
    private __dataUBOUid;
    private __lastShader;
    private __lastMaterial?;
    private __lastMaterialStateVersion;
    private static __shaderProgram;
    private __lastRenderPassTickCount;
    private __lightComponents?;
    private static __globalDataRepository;
    private static __currentComponentSIDs?;
    _totalSizeOfGPUShaderDataStorageExceptMorphData: number;
    private static __isDebugOperationToDataTextureBufferDone;
    private static __webxrSystem;
    private __lastMaterialsUpdateCount;
    private __lastTransformComponentsUpdateCount;
    private __lastSceneGraphComponentsUpdateCount;
    private __lastCameraComponentsUpdateCount;
    private __lastCameraControllerComponentsUpdateCount;
    private constructor();
    static dumpDataTextureBuffer(): void;
    static getVertexShaderMethodDefinitions_dataTexture(): string;
    /**
     * setup shader program for the material in this WebGL strategy
     * @param material - a material to setup shader program
     */
    setupShaderForMaterial(material: Material, primitive: Primitive): CGAPIResourceHandle;
    /**
     * re-setup shader program for the material in this WebGL strategy
     * @param material - a material to re-setup shader program
     * @param updatedShaderSources - updated shader sources
     * @param onError - callback function to handle error
     * @returns
     */
    _reSetupShaderForMaterialBySpector(material: Material, primitive: Primitive, updatedShaderSources: ShaderSources, onError: (message: string) => void): CGAPIResourceHandle;
    private static __getShaderProperty;
    private static getOffsetOfPropertyInShader;
    $load(meshComponent: MeshComponent): boolean;
    private __createAndUpdateDataTexture;
    private __createAndUpdateDataTextureForCameraOnly;
    private __createAndUpdateDataTextureInner;
    deleteDataTexture(): void;
    prerender(): void;
    private __isUboUse;
    private __createAndUpdateUBO;
    attachGPUData(primitive: Primitive): void;
    attachGPUDataInner(gl: WebGLRenderingContext, shaderProgram: WebGLProgram): void;
    attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    attachVertexDataInner(mesh: Mesh, primitive: Primitive, primitiveIndex: Index, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    static getInstance(): WebGLStrategyDataTexture;
    private __setCurrentComponentSIDsForEachDisplayIdx;
    private __setCurrentComponentSIDsForEachPrimitive;
    common_$render(primitiveUids: PrimitiveUID[], renderPass: RenderPass, renderPassTickCount: Count): boolean;
    private __renderWithoutBuffers;
    private __renderInner;
    private bindDataTexture;
}

declare class WebGLStrategyUniform implements CGAPIStrategy, WebGLStrategy {
    private static __instance;
    private __webglResourceRepository;
    private __dataTextureUid;
    private __lastShader;
    private __lastMaterial?;
    private __lastRenderPassTickCount;
    private __lightComponents?;
    private static __globalDataRepository;
    private static __webxrSystem;
    private static readonly componentMatrices;
    private constructor();
    private static __vertexShaderMethodDefinitions_uniform;
    /**
     * setup shader program for the material in this WebGL strategy
     * @param material - a material to setup shader program
     */
    setupShaderForMaterial(material: Material, primitive: Primitive): CGAPIResourceHandle;
    /**
     * re-setup shader program for the material in this WebGL strategy
     * @param material - a material to re-setup shader program
     * @param updatedShaderSources - updated shader sources
     * @param onError - callback function to handle error
     * @returns
     */
    _reSetupShaderForMaterialBySpector(material: Material, primitive: Primitive, updatedShaderSources: ShaderSources, onError: (message: string) => void): CGAPIResourceHandle;
    $load(meshComponent: MeshComponent): boolean;
    prerender(): void;
    attachGPUData(primitive: Primitive): void;
    attachVertexData(i: number, primitive: Primitive, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    attachVertexDataInner(mesh: Mesh, primitive: Primitive, primitiveUid: Index, glw: WebGLContextWrapper, instanceIDBufferUid: WebGLResourceHandle): void;
    dettachVertexData(glw: WebGLContextWrapper): void;
    static getInstance(): WebGLStrategyUniform;
    common_$render(primitiveUids: PrimitiveUID[], renderPass: RenderPass, renderPassTickCount: Count): boolean;
    private __renderWithoutBuffers;
    renderInner(primitiveUid: PrimitiveUID, glw: WebGLContextWrapper, renderPass: RenderPass, renderPassTickCount: Count): boolean;
    private bindDataTexture;
}

declare class BlockBeginShader extends CommonShaderPart {
    private __functionName;
    private __valueInputs;
    private __valueOutputs;
    constructor(__functionName: string, __valueInputs: ShaderSocket[], __valueOutputs: ShaderSocket[]);
    get vertexShaderDefinitions(): string;
    get pixelShaderDefinitions(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}

declare class BlockEndShader extends CommonShaderPart {
    private __functionName;
    private __valueInputs;
    private __valueOutputs;
    constructor(__functionName: string, __valueInputs: ShaderSocket[], __valueOutputs: ShaderSocket[]);
    get vertexShaderDefinitions(): string;
    get pixelShaderDefinitions(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}

declare class ClassicShadingShader extends CommonShaderPart {
    static __instance: ClassicShadingShader;
    static readonly materialElement: EnumIO;
    private constructor();
    static getInstance(): ClassicShadingShader;
    get vertexShaderDefinitions(): string;
    get pixelShaderDefinitions(): string;
    vertexShaderBody: string;
    get pixelShaderBody(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}

declare class ConstantVariableShader extends CommonShaderPart {
    private __functionName;
    private __compositionType;
    private __componentType;
    private __constantValueStr;
    constructor(__functionName: string, __compositionType: CompositionTypeEnum, __componentType: ComponentTypeEnum);
    setConstantValue(value: IVector): void;
    get vertexShaderDefinitions(): string;
    get pixelShaderDefinitions(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}

declare class EndShader extends CommonShaderPart {
    static __instance: EndShader;
    static readonly materialElement: EnumIO;
    private constructor();
    static getInstance(): EndShader;
    get vertexShaderDefinitions(): "\n      fn outPosition(inPosition: vec4<f32>) {\n        output.position = inPosition;\n      }\n      " | "\n      void outPosition(in vec4 inPosition) {\n        gl_Position = inPosition;\n      }\n      ";
    get vertexShaderBody(): string;
    get pixelShaderDefinitions(): "\n      fn outColor(inColor: vec4<f32>) {\n        rt0 = inColor;\n      }\n      " | "\n      void outColor(in vec4 inColor) {\n        rt0 = inColor;\n      }\n      ";
    getPixelShaderBody(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}

declare class IfStatementShader extends CommonShaderPart {
    constructor();
    get vertexShaderDefinitions(): string;
    get pixelShaderDefinitions(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}

declare class TextureFetchShader extends CommonShaderPart {
    static __instance: TextureFetchShader;
    private __materialNodeUid;
    constructor();
    set materialNodeUid(materialNodeUid: MaterialNodeUID$1);
    vertexShaderBody: string;
    getPixelShaderBody(): string;
    get vertexShaderDefinitions(): string;
    get pixelShaderDefinitions(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}

declare class UniformDataShader extends CommonShaderPart {
    private __functionName;
    private __compositionType;
    private __componentType;
    private __variableName;
    private __valueStr;
    constructor(__functionName: string, __compositionType: CompositionTypeEnum, __componentType: ComponentTypeEnum);
    setVariableName(name: any): void;
    setDefaultValue(value: any): void;
    get vertexShaderDefinitions(): string;
    get pixelShaderDefinitions(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}

declare class VaryingVariableShader extends CommonShaderPart {
    private __functionName;
    private __compositionType;
    private __componentType;
    private __variableName;
    constructor(__functionName: string, __compositionType: CompositionTypeEnum, __componentType: ComponentTypeEnum);
    setVariableName(name: any): void;
    get vertexShaderDefinitions(): string;
    get pixelShaderDefinitions(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}

declare class KTX2TextureLoader {
    private static __instance;
    private static __mscTranscoderModule;
    private static __zstdDecoder;
    private __mscTranscoderPromise;
    constructor();
    static getInstance(): KTX2TextureLoader;
    transcode(uint8Array: Uint8Array): Promise<{
        width: number;
        height: number;
        compressionTextureType: CompressionTextureTypeEnum;
        mipmapData: TextureData[];
        needGammaCorrection: boolean;
    }>;
    private __loadMSCTranscoder;
    private __getDeviceDependentParametersWebGL;
    private __getDeviceDependentParametersWebGPU;
    private __parse;
    private __transcodeData;
    private __hasAlpha;
}

/**
 * The argument type for System.init() method.
 */
interface SystemInitDescription {
    approach: ProcessApproachEnum;
    canvas: HTMLCanvasElement;
    memoryUsageOrder?: {
        cpuGeneric: number;
        gpuInstanceData: number;
        gpuVertexData: number;
    };
    webglOption?: WebGLContextAttributes;
    notToDisplayRnInfoAtInit?: boolean;
}
/**
 * The system class is the entry point of the Rhodonite library.
 *
 * @example
 * ```
 * await Rn.System.init({
 *   approach: Rn.ProcessApproach.DataTexture,
 *   canvas: document.getElementById('world') as HTMLCanvasElement,
 * });
 *
 * ... (create something) ...
 *
 * Rn.System.startRenderLoop((time, _myArg1, _myArg2) => {
 *   Rn.System.process([expression]);
 * }, myArg1, myArg2);
 * ```
 */
declare class System {
    private static __expressionForProcessAuto?;
    private static __renderPassForProcessAuto?;
    private static __processApproach;
    private static __cgApiResourceRepository;
    private static __renderPassTickCount;
    private static __animationFrameId;
    private static __renderLoopFunc?;
    private static __args;
    private static __rnXRModule?;
    private static __lastCameraComponentsUpdateCount;
    private static __lastCameraControllerComponentsUpdateCount;
    private static __lastTransformComponentsUpdateCount;
    private static __lastPrimitiveCount;
    private constructor();
    /**
     * Starts a render loop.
     *
     * @example
     * ```
     * Rn.System.startRenderLoop((time, _myArg1, _myArg2) => {
     *   Rn.System.process([expression]);
     * }, myArg1, myArg2);
     * ```
     *
     * @param renderLoopFunc - function to be called in each frame
     * @param args - arguments you want to be passed to renderLoopFunc
     */
    static startRenderLoop(renderLoopFunc: (time: number, ...args: any[]) => void, ...args: any[]): void;
    private static __getAnimationFrameObject;
    /**
     * Stops a existing render loop.
     */
    static stopRenderLoop(): void;
    /**
     * Restart a render loop.
     */
    static restartRenderLoop(): void;
    /**
     * A Simple version of process method
     *
     * @remarks
     * No need to create expressions and renderPasses and to register entities, etc...
     * It's suitable for simple use cases like sample apps.
     *
     * @param clearColor - color to clear the canvas
     */
    static processAuto(clearColor?: Vector4): void;
    /**
     * A process method to render a scene
     *
     * @remarks
     * You need to call this method for rendering.
     *
     * @param frame/expression - a frame/expression object
     */
    static process(frame: Frame): void;
    static process(expressions: Expression[]): void;
    static get processTime(): number;
    static get timeAtProcessBegin(): number;
    static get timeAtProcessEnd(): number;
    private static createCamera;
    private static setViewportForNormalRendering;
    private static bindFramebufferWebGL;
    private static __displayRnInfo;
    /**
     * Initialize the Rhodonite system.
     *
     * @remarks
     * Don't forget `await` to use this method.
     *
     * @example
     * ```
     * await Rn.System.init({
     *   approach: Rn.ProcessApproach.DataTexture,
     *   canvas: document.getElementById('world') as HTMLCanvasElement,
     * });
     * ```
     *
     * @param desc
     * @returns
     */
    static init(desc: SystemInitDescription): Promise<void>;
    static get processApproach(): ProcessApproachClass;
    static resizeCanvas(width: number, height: number): void;
    static getCanvasSize(): [number, number];
    static getCurrentWebGLContextWrapper(): WebGLContextWrapper | undefined;
}

declare const SystemState: {
    currentProcessApproach: ProcessApproachClass;
    viewportAspectRatio: number;
    webgpuRenderBundleMode: boolean;
    totalSizeOfGPUShaderDataStorageExceptMorphData: number;
};

declare class WebGpuStrategyBasic implements CGAPIStrategy {
    private static __instance;
    private __storageBufferUid;
    private __storageBlendShapeBufferUid;
    private __uniformMorphOffsetsTypedArray?;
    private __uniformMorphWeightsTypedArray?;
    private __lastMaterialsUpdateCount;
    private __lastTransformComponentsUpdateCount;
    private __lastSceneGraphComponentsUpdateCount;
    private __lastCameraComponentsUpdateCount;
    private __lastCameraControllerComponentsUpdateCount;
    private __lastBlendShapeComponentsUpdateCountForWeights;
    private __lastBlendShapeComponentsUpdateCountForBlendData;
    private constructor();
    static getInstance(): WebGpuStrategyBasic;
    static getVertexShaderMethodDefinitions_storageBuffer(): string;
    private static __getShaderProperty;
    private static getOffsetOfPropertyInShader;
    $load(meshComponent: MeshComponent): boolean;
    common_$load(): void;
    private __setupShaderProgramForMeshComponent;
    private _setupShaderProgram;
    /**
     * setup shader program for the material in this WebGL strategy
     * @param material - a material to setup shader program
     */
    setupShaderForMaterial(material: Material, primitive: Primitive, vertexShaderMethodDefinitions: string, propertySetter: getShaderPropertyFunc): void;
    renderWithRenderBundle(renderPass: RenderPass): boolean;
    prerender(): void;
    common_$render(primitiveUids: PrimitiveUID[], renderPass: RenderPass, renderPassTickCount: number): boolean;
    private __renderWithoutBuffers;
    renderInner(primitiveUid: PrimitiveUID, renderPass: RenderPass, zWrite: boolean): boolean;
    private __createAndUpdateStorageBuffer;
    private __createAndUpdateStorageBufferForCameraOnly;
    private __createOrUpdateStorageBlendShapeBuffer;
    private __updateUniformMorph;
    private __getAppropriateCameraComponentSID;
}

type WebXRSystemViewerData = {
    viewerTranslate: IMutableVector3;
    viewerScale: MutableVector3;
    viewerOrientation: IMutableQuaternion;
    viewerAzimuthAngle: MutableScalar;
};
declare function createMotionController(xrInputSource: XRInputSource, basePath: string, profilePriorities: string[]): Promise<ISceneGraphEntity>;
declare function updateGamePad(timestamp: number, xrFrame: XRFrame, viewerData: WebXRSystemViewerData): void;
declare function updateMotionControllerModel(entity: IEntity, motionController: MotionController): void;
declare function getMotionController(xrInputSource: XRInputSource): MotionController | undefined;

declare function getWebXRSystem(): WebXRSystem;

declare class WebARSystem {
    private static __instance;
    private __oGlw;
    private __isReadyForWebAR;
    private __oArSession;
    private __oWebglLayer;
    private __spaceType;
    private __isWebARMode;
    private __requestedToEnterWebAR;
    private __oArViewerPose;
    private __oArReferenceSpace;
    private __defaultPositionInLocalSpaceMode;
    private __canvasWidthForAR;
    private __canvasHeightForAR;
    private _cameraEntity;
    private __viewerTranslate;
    private __viewerAzimuthAngle;
    private __viewerOrientation;
    private __viewerScale;
    constructor();
    static getInstance(): WebARSystem;
    /**
     * Ready for WebAR
     *
     * @param requestButtonDom
     * @returns true: prepared properly, false: failed to prepare
     */
    readyForWebAR(requestButtonDom: HTMLElement): Promise<never[]>;
    /**
     * Enter to WebXR (AR mode)
     * @param initialUserPosition the initial user position in world space
     * @param callbackOnXrSessionEnd the callback function for XrSession ending
     * @returns boolean value about succeeded or not
     */
    enterWebAR({ initialUserPosition, callbackOnXrSessionStart, callbackOnXrSessionEnd, }: {
        initialUserPosition?: Vector3;
        callbackOnXrSessionStart: () => void;
        callbackOnXrSessionEnd: () => void;
    }): Promise<void>;
    private __setupWebGLLayer;
    /**
     * Disable WebXR (Close the XrSession)
     */
    exitWebAR(): Promise<void>;
    getCanvasWidthForVr(): number;
    getCanvasHeightForVr(): number;
    get viewMatrix(): Matrix44;
    private __updateView;
    private __setCameraInfoFromXRViews;
    get projectionMatrix(): MutableMatrix44;
    /**
     * Pre process for rendering
     * @internal
     * @param xrFrame XRFrame object
     */
    _preRender(time: number, xrFrame: XRFrame): void;
    /**
     * Post process for rendering
     * @internal
     */
    _postRender(): void;
    get isWebARMode(): boolean;
    get isReadyForWebAR(): boolean;
    get requestedToEnterWebAR(): boolean;
    get arSession(): XRSession | undefined;
    get framebuffer(): WebGLFramebuffer | undefined;
}

declare const XR: Readonly<{
    WebXRSystem: typeof WebXRSystem;
    WebARSystem: typeof WebARSystem;
}>;

type RnXR = typeof XR;

declare const VERSION: any;

type Rn_AABB = AABB;
declare const Rn_AABB: typeof AABB;
type Rn_AABBGizmo = AABBGizmo;
declare const Rn_AABBGizmo: typeof AABBGizmo;
type Rn_AbsoluteAnimation = AbsoluteAnimation;
declare const Rn_AbsoluteAnimation: typeof AbsoluteAnimation;
type Rn_AbstractArrayBufferBaseMathNumber = AbstractArrayBufferBaseMathNumber;
declare const Rn_AbstractArrayBufferBaseMathNumber: typeof AbstractArrayBufferBaseMathNumber;
type Rn_AbstractCameraController = AbstractCameraController;
declare const Rn_AbstractCameraController: typeof AbstractCameraController;
type Rn_AbstractMaterialContent = AbstractMaterialContent;
declare const Rn_AbstractMaterialContent: typeof AbstractMaterialContent;
type Rn_AbstractMatrix = AbstractMatrix;
declare const Rn_AbstractMatrix: typeof AbstractMatrix;
type Rn_AbstractQuaternion = AbstractQuaternion;
declare const Rn_AbstractQuaternion: typeof AbstractQuaternion;
type Rn_AbstractShaderNode = AbstractShaderNode;
declare const Rn_AbstractShaderNode: typeof AbstractShaderNode;
type Rn_AbstractTexture = AbstractTexture;
declare const Rn_AbstractTexture: typeof AbstractTexture;
type Rn_AbstractVector = AbstractVector;
declare const Rn_AbstractVector: typeof AbstractVector;
type Rn_Accessor = Accessor;
declare const Rn_Accessor: typeof Accessor;
type Rn_AddShaderNode = AddShaderNode;
declare const Rn_AddShaderNode: typeof AddShaderNode;
declare const Rn_AlphaMode: typeof AlphaMode;
type Rn_AlphaModeEnum = AlphaModeEnum;
type Rn_AnimatedQuaternion = AnimatedQuaternion;
declare const Rn_AnimatedQuaternion: typeof AnimatedQuaternion;
type Rn_AnimatedScalar = AnimatedScalar;
declare const Rn_AnimatedScalar: typeof AnimatedScalar;
type Rn_AnimatedVector2 = AnimatedVector2;
declare const Rn_AnimatedVector2: typeof AnimatedVector2;
type Rn_AnimatedVector3 = AnimatedVector3;
declare const Rn_AnimatedVector3: typeof AnimatedVector3;
type Rn_AnimatedVector4 = AnimatedVector4;
declare const Rn_AnimatedVector4: typeof AnimatedVector4;
type Rn_AnimatedVectorN = AnimatedVectorN;
declare const Rn_AnimatedVectorN: typeof AnimatedVectorN;
type Rn_AnimationAssigner = AnimationAssigner;
declare const Rn_AnimationAssigner: typeof AnimationAssigner;
declare const Rn_AnimationAttribute: typeof AnimationAttribute;
type Rn_AnimationAttributeEnum = AnimationAttributeEnum;
type Rn_AnimationChannel = AnimationChannel;
type Rn_AnimationChannelTarget = AnimationChannelTarget;
type Rn_AnimationComponent = AnimationComponent;
declare const Rn_AnimationComponent: typeof AnimationComponent;
type Rn_AnimationComponentEventType = AnimationComponentEventType;
type Rn_AnimationInfo = AnimationInfo;
declare const Rn_AnimationInterpolation: typeof AnimationInterpolation;
type Rn_AnimationInterpolationEnum = AnimationInterpolationEnum;
type Rn_AnimationPathName = AnimationPathName;
type Rn_AnimationSampler = AnimationSampler;
type Rn_AnimationSamplers = AnimationSamplers;
type Rn_AnimationTrack = AnimationTrack;
type Rn_AnimationTrackName = AnimationTrackName;
type Rn_Array1<T> = Array1<T>;
type Rn_Array16<T> = Array16<T>;
type Rn_Array1to4<T> = Array1to4<T>;
type Rn_Array2<T> = Array2<T>;
type Rn_Array3<T> = Array3<T>;
type Rn_Array4<T> = Array4<T>;
type Rn_Array9<T> = Array9<T>;
type Rn_ArrayAsRn<T> = ArrayAsRn<T>;
type Rn_ArrayType = ArrayType;
type Rn_AssetLoader = AssetLoader;
declare const Rn_AssetLoader: typeof AssetLoader;
type Rn_AssetLoaderConfig = AssetLoaderConfig;
type Rn_AttributeColorShaderNode = AttributeColorShaderNode;
declare const Rn_AttributeColorShaderNode: typeof AttributeColorShaderNode;
type Rn_AttributeName = AttributeName;
type Rn_AttributeNames = AttributeNames;
type Rn_AttributeNormalShaderNode = AttributeNormalShaderNode;
declare const Rn_AttributeNormalShaderNode: typeof AttributeNormalShaderNode;
type Rn_AttributePositionShaderNode = AttributePositionShaderNode;
declare const Rn_AttributePositionShaderNode: typeof AttributePositionShaderNode;
type Rn_AttributeTexcoordShaderNode = AttributeTexcoordShaderNode;
declare const Rn_AttributeTexcoordShaderNode: typeof AttributeTexcoordShaderNode;
type Rn_Attributes = Attributes;
type Rn_Axis = Axis;
declare const Rn_Axis: typeof Axis;
type Rn_AxisDescriptor = AxisDescriptor;
type Rn_BASIS = BASIS;
declare const Rn_BasisCompressionType: typeof BasisCompressionType;
type Rn_BasisCompressionTypeEnum = BasisCompressionTypeEnum;
type Rn_BasisFile = BasisFile;
type Rn_BasisLzEtc1sImageTranscoder = BasisLzEtc1sImageTranscoder;
declare const Rn_BasisLzEtc1sImageTranscoder: typeof BasisLzEtc1sImageTranscoder;
type Rn_BasisTranscoder = BasisTranscoder;
type Rn_BlendShapeComponent = BlendShapeComponent;
declare const Rn_BlendShapeComponent: typeof BlendShapeComponent;
type Rn_BlockBeginShader = BlockBeginShader;
declare const Rn_BlockBeginShader: typeof BlockBeginShader;
type Rn_BlockBeginShaderNode = BlockBeginShaderNode;
declare const Rn_BlockBeginShaderNode: typeof BlockBeginShaderNode;
type Rn_BlockEndShader = BlockEndShader;
declare const Rn_BlockEndShader: typeof BlockEndShader;
type Rn_BlockEndShaderNode = BlockEndShaderNode;
declare const Rn_BlockEndShaderNode: typeof BlockEndShaderNode;
type Rn_Bloom = Bloom;
declare const Rn_Bloom: typeof Bloom;
declare const Rn_BoneDataType: typeof BoneDataType;
type Rn_BoneDataTypeEnum = BoneDataTypeEnum;
type Rn_Buffer = Buffer;
declare const Rn_Buffer: typeof Buffer;
declare const Rn_BufferUse: typeof BufferUse;
type Rn_BufferUseEnum = BufferUseEnum;
type Rn_BufferView = BufferView;
declare const Rn_BufferView: typeof BufferView;
type Rn_CGAPIResourceHandle = CGAPIResourceHandle;
type Rn_CGAPIResourceRepository = CGAPIResourceRepository;
declare const Rn_CGAPIResourceRepository: typeof CGAPIResourceRepository;
type Rn_Cache<T> = Cache<T>;
declare const Rn_Cache: typeof Cache;
type Rn_CalledSubscriberNumber = CalledSubscriberNumber;
type Rn_CameraComponent = CameraComponent;
declare const Rn_CameraComponent: typeof CameraComponent;
type Rn_CameraControllerComponent = CameraControllerComponent;
declare const Rn_CameraControllerComponent: typeof CameraControllerComponent;
declare const Rn_CameraControllerType: typeof CameraControllerType;
type Rn_CameraControllerTypeEnum = CameraControllerTypeEnum;
type Rn_CameraSID = CameraSID;
declare const Rn_CameraType: typeof CameraType;
type Rn_CameraTypeEnum = CameraTypeEnum;
type Rn_CapsuleCollider = CapsuleCollider;
declare const Rn_CapsuleCollider: typeof CapsuleCollider;
type Rn_ChangeAnimationInfoEvent = ChangeAnimationInfoEvent;
type Rn_ClassicShadingShader = ClassicShadingShader;
declare const Rn_ClassicShadingShader: typeof ClassicShadingShader;
type Rn_ColorComponentLetter = ColorComponentLetter;
type Rn_ColorGradingUsingLUTsMaterialContent = ColorGradingUsingLUTsMaterialContent;
declare const Rn_ColorGradingUsingLUTsMaterialContent: typeof ColorGradingUsingLUTsMaterialContent;
type Rn_ColorRgb = ColorRgb;
declare const Rn_ColorRgb: typeof ColorRgb;
type Rn_ColorRgba = ColorRgba;
declare const Rn_ColorRgba: typeof ColorRgba;
type Rn_CommonShaderPart = CommonShaderPart;
declare const Rn_CommonShaderPart: typeof CommonShaderPart;
type Rn_ComplexVertexAttribute = ComplexVertexAttribute;
declare const Rn_ComplexVertexAttribute: typeof ComplexVertexAttribute;
type Rn_Component = Component;
declare const Rn_Component: typeof Component;
type Rn_ComponentMixinFunction = ComponentMixinFunction;
type Rn_ComponentRepository = ComponentRepository;
declare const Rn_ComponentRepository: typeof ComponentRepository;
type Rn_ComponentSID = ComponentSID;
type Rn_ComponentTID = ComponentTID;
type Rn_ComponentToComponentMethods<T extends typeof Component> = ComponentToComponentMethods<T>;
declare const Rn_ComponentType: typeof ComponentType;
type Rn_ComponentTypeEnum = ComponentTypeEnum;
declare const Rn_CompositionType: typeof CompositionType;
type Rn_CompositionTypeEnum = CompositionTypeEnum;
declare const Rn_CompressionTextureType: typeof CompressionTextureType;
type Rn_CompressionTextureTypeEnum = CompressionTextureTypeEnum;
declare const Rn_Config: typeof Config;
declare const Rn_ConstRgbaBlack: typeof ConstRgbaBlack;
declare const Rn_ConstRgbaWhite: typeof ConstRgbaWhite;
declare const Rn_ConstVector2_0_0: typeof ConstVector2_0_0;
declare const Rn_ConstVector2_1_1: typeof ConstVector2_1_1;
declare const Rn_ConstVector3_0_0_0: typeof ConstVector3_0_0_0;
declare const Rn_ConstVector3_1_1_1: typeof ConstVector3_1_1_1;
declare const Rn_ConstVector4_0_0_0_0: typeof ConstVector4_0_0_0_0;
declare const Rn_ConstVector4_0_0_0_1: typeof ConstVector4_0_0_0_1;
declare const Rn_ConstVector4_1_1_1_1: typeof ConstVector4_1_1_1_1;
type Rn_ConstantScalarVariableShaderNode<T extends ComponentTypeEnum> = ConstantScalarVariableShaderNode<T>;
declare const Rn_ConstantScalarVariableShaderNode: typeof ConstantScalarVariableShaderNode;
type Rn_ConstantVariableShader = ConstantVariableShader;
declare const Rn_ConstantVariableShader: typeof ConstantVariableShader;
type Rn_ConstantVector2VariableShaderNode<T extends ComponentTypeEnum> = ConstantVector2VariableShaderNode<T>;
declare const Rn_ConstantVector2VariableShaderNode: typeof ConstantVector2VariableShaderNode;
type Rn_ConstantVector3VariableShaderNode<T extends ComponentTypeEnum> = ConstantVector3VariableShaderNode<T>;
declare const Rn_ConstantVector3VariableShaderNode: typeof ConstantVector3VariableShaderNode;
type Rn_ConstantVector4VariableShaderNode<T extends ComponentTypeEnum> = ConstantVector4VariableShaderNode<T>;
declare const Rn_ConstantVector4VariableShaderNode: typeof ConstantVector4VariableShaderNode;
type Rn_Count = Count;
type Rn_Cube = Cube;
declare const Rn_Cube: typeof Cube;
type Rn_CubeDescriptor = CubeDescriptor;
type Rn_CubeTexture = CubeTexture;
declare const Rn_CubeTexture: typeof CubeTexture;
type Rn_CustomMaterialContent = CustomMaterialContent;
declare const Rn_CustomMaterialContent: typeof CustomMaterialContent;
type Rn_DataUtil = DataUtil;
declare const Rn_DataUtil: typeof DataUtil;
declare const Rn_DefaultTextures: typeof DefaultTextures;
type Rn_DepthEncodeMaterialContent = DepthEncodeMaterialContent;
declare const Rn_DepthEncodeMaterialContent: typeof DepthEncodeMaterialContent;
type Rn_DetectHighLuminanceMaterialContent = DetectHighLuminanceMaterialContent;
declare const Rn_DetectHighLuminanceMaterialContent: typeof DetectHighLuminanceMaterialContent;
type Rn_DirectTextureData = DirectTextureData;
type Rn_DotProductShaderNode = DotProductShaderNode;
declare const Rn_DotProductShaderNode: typeof DotProductShaderNode;
type Rn_DrcPointCloudImporter = DrcPointCloudImporter;
declare const Rn_DrcPointCloudImporter: typeof DrcPointCloudImporter;
declare const Rn_EVENT_CLICK: typeof EVENT_CLICK;
declare const Rn_EVENT_KEY_DOWN: typeof EVENT_KEY_DOWN;
declare const Rn_EVENT_KEY_PRESS: typeof EVENT_KEY_PRESS;
declare const Rn_EVENT_KEY_UP: typeof EVENT_KEY_UP;
declare const Rn_EVENT_MOUSE_DOWN: typeof EVENT_MOUSE_DOWN;
declare const Rn_EVENT_MOUSE_ENTER: typeof EVENT_MOUSE_ENTER;
declare const Rn_EVENT_MOUSE_LEAVE: typeof EVENT_MOUSE_LEAVE;
declare const Rn_EVENT_MOUSE_MOVE: typeof EVENT_MOUSE_MOVE;
declare const Rn_EVENT_MOUSE_OVER: typeof EVENT_MOUSE_OVER;
declare const Rn_EVENT_MOUSE_UP: typeof EVENT_MOUSE_UP;
declare const Rn_EVENT_MOUSE_WHEEL: typeof EVENT_MOUSE_WHEEL;
declare const Rn_EVENT_MSPOINTER_DOWN: typeof EVENT_MSPOINTER_DOWN;
declare const Rn_EVENT_MSPOINTER_MOVE: typeof EVENT_MSPOINTER_MOVE;
declare const Rn_EVENT_MSPOINTER_UP: typeof EVENT_MSPOINTER_UP;
declare const Rn_EVENT_ORIENTATION_CHANGE: typeof EVENT_ORIENTATION_CHANGE;
declare const Rn_EVENT_POINTER_CANCEL: typeof EVENT_POINTER_CANCEL;
declare const Rn_EVENT_POINTER_DOWN: typeof EVENT_POINTER_DOWN;
declare const Rn_EVENT_POINTER_ENTER: typeof EVENT_POINTER_ENTER;
declare const Rn_EVENT_POINTER_LEAVE: typeof EVENT_POINTER_LEAVE;
declare const Rn_EVENT_POINTER_MOVE: typeof EVENT_POINTER_MOVE;
declare const Rn_EVENT_POINTER_OUT: typeof EVENT_POINTER_OUT;
declare const Rn_EVENT_POINTER_OVER: typeof EVENT_POINTER_OVER;
declare const Rn_EVENT_POINTER_UP: typeof EVENT_POINTER_UP;
declare const Rn_EVENT_RESIZE: typeof EVENT_RESIZE;
declare const Rn_EVENT_TOUCH_CANCEL: typeof EVENT_TOUCH_CANCEL;
declare const Rn_EVENT_TOUCH_DOUBLE_TAP: typeof EVENT_TOUCH_DOUBLE_TAP;
declare const Rn_EVENT_TOUCH_DRAG: typeof EVENT_TOUCH_DRAG;
declare const Rn_EVENT_TOUCH_END: typeof EVENT_TOUCH_END;
declare const Rn_EVENT_TOUCH_ENTER: typeof EVENT_TOUCH_ENTER;
declare const Rn_EVENT_TOUCH_HOLD: typeof EVENT_TOUCH_HOLD;
declare const Rn_EVENT_TOUCH_LEAVE: typeof EVENT_TOUCH_LEAVE;
declare const Rn_EVENT_TOUCH_LONG_TAP: typeof EVENT_TOUCH_LONG_TAP;
declare const Rn_EVENT_TOUCH_MOVE: typeof EVENT_TOUCH_MOVE;
declare const Rn_EVENT_TOUCH_OUT: typeof EVENT_TOUCH_OUT;
declare const Rn_EVENT_TOUCH_OVER: typeof EVENT_TOUCH_OVER;
declare const Rn_EVENT_TOUCH_PINCH: typeof EVENT_TOUCH_PINCH;
declare const Rn_EVENT_TOUCH_START: typeof EVENT_TOUCH_START;
declare const Rn_EVENT_TOUCH_SWIPE: typeof EVENT_TOUCH_SWIPE;
declare const Rn_EVENT_TOUCH_TAP: typeof EVENT_TOUCH_TAP;
declare const Rn_Effekseer: typeof Effekseer;
type Rn_EffekseerComponent = EffekseerComponent;
declare const Rn_EffekseerComponent: typeof EffekseerComponent;
type Rn_EndShader = EndShader;
declare const Rn_EndShader: typeof EndShader;
type Rn_Entity = Entity;
declare const Rn_Entity: typeof Entity;
type Rn_EntityRepository = EntityRepository;
declare const Rn_EntityRepository: typeof EntityRepository;
type Rn_EntityUID = EntityUID;
type Rn_EntityUIDOutputMaterialContent = EntityUIDOutputMaterialContent;
declare const Rn_EntityUIDOutputMaterialContent: typeof EntityUIDOutputMaterialContent;
type Rn_EnumClass = EnumClass;
declare const Rn_EnumClass: typeof EnumClass;
type Rn_EnumIO = EnumIO;
type Rn_Err<T, ErrObj> = Err<T, ErrObj>;
declare const Rn_Err: typeof Err;
type Rn_EventHandler = EventHandler;
type Rn_EventPubSub = EventPubSub;
declare const Rn_EventPubSub: typeof EventPubSub;
type Rn_EventSubscriberIndex = EventSubscriberIndex;
type Rn_EventType = EventType;
type Rn_Expression = Expression;
declare const Rn_Expression: typeof Expression;
declare const Rn_FileType: typeof FileType;
type Rn_FileTypeEnum = FileTypeEnum;
type Rn_FillArgsObject = FillArgsObject;
type Rn_FloatTypedArray = FloatTypedArray;
type Rn_FloatTypedArrayConstructor = FloatTypedArrayConstructor;
type Rn_ForwardRenderPipeline = ForwardRenderPipeline;
declare const Rn_ForwardRenderPipeline: typeof ForwardRenderPipeline;
type Rn_Frame = Frame;
declare const Rn_Frame: typeof Frame;
type Rn_FrameBuffer = FrameBuffer;
declare const Rn_FrameBuffer: typeof FrameBuffer;
type Rn_FrameBufferCubeMapDescriptor = FrameBufferCubeMapDescriptor;
type Rn_FrameBufferDescriptor = FrameBufferDescriptor;
type Rn_FrameBufferMSAADescriptor = FrameBufferMSAADescriptor;
type Rn_FrameBufferTextureArrayDescriptor = FrameBufferTextureArrayDescriptor;
type Rn_FrameBufferTextureArrayForMultiViewDescriptor = FrameBufferTextureArrayForMultiViewDescriptor;
type Rn_Frustum = Frustum;
declare const Rn_Frustum: typeof Frustum;
type Rn_FurnaceTestMaterialContent = FurnaceTestMaterialContent;
declare const Rn_FurnaceTestMaterialContent: typeof FurnaceTestMaterialContent;
declare const Rn_GLTF2_EXPORT_DRACO: typeof GLTF2_EXPORT_DRACO;
declare const Rn_GLTF2_EXPORT_EMBEDDED: typeof GLTF2_EXPORT_EMBEDDED;
declare const Rn_GLTF2_EXPORT_GLB: typeof GLTF2_EXPORT_GLB;
declare const Rn_GLTF2_EXPORT_GLTF: typeof GLTF2_EXPORT_GLTF;
declare const Rn_GLTF2_EXPORT_NO_DOWNLOAD: typeof GLTF2_EXPORT_NO_DOWNLOAD;
declare const Rn_GL_ACTIVE_ATTRIBUTES: typeof GL_ACTIVE_ATTRIBUTES;
declare const Rn_GL_ACTIVE_TEXTURE: typeof GL_ACTIVE_TEXTURE;
declare const Rn_GL_ACTIVE_UNIFORMS: typeof GL_ACTIVE_UNIFORMS;
declare const Rn_GL_ACTIVE_UNIFORM_BLOCKS: typeof GL_ACTIVE_UNIFORM_BLOCKS;
declare const Rn_GL_ALIASED_LINE_WIDTH_RANGE: typeof GL_ALIASED_LINE_WIDTH_RANGE;
declare const Rn_GL_ALIASED_POINT_SIZE_RANGE: typeof GL_ALIASED_POINT_SIZE_RANGE;
declare const Rn_GL_ALPHA: typeof GL_ALPHA;
declare const Rn_GL_ALPHA_BITS: typeof GL_ALPHA_BITS;
declare const Rn_GL_ALREADY_SIGNALED: typeof GL_ALREADY_SIGNALED;
declare const Rn_GL_ALWAYS: typeof GL_ALWAYS;
declare const Rn_GL_ANY_SAMPLES_PASSED: typeof GL_ANY_SAMPLES_PASSED;
declare const Rn_GL_ANY_SAMPLES_PASSED_CONSERVATIVE: typeof GL_ANY_SAMPLES_PASSED_CONSERVATIVE;
declare const Rn_GL_ARRAY_BUFFER: typeof GL_ARRAY_BUFFER;
declare const Rn_GL_ARRAY_BUFFER_BINDING: typeof GL_ARRAY_BUFFER_BINDING;
declare const Rn_GL_ATTACHED_SHADERS: typeof GL_ATTACHED_SHADERS;
declare const Rn_GL_BACK: typeof GL_BACK;
declare const Rn_GL_BLEND: typeof GL_BLEND;
declare const Rn_GL_BLEND_COLOR: typeof GL_BLEND_COLOR;
declare const Rn_GL_BLEND_DST_ALPHA: typeof GL_BLEND_DST_ALPHA;
declare const Rn_GL_BLEND_DST_RGB: typeof GL_BLEND_DST_RGB;
declare const Rn_GL_BLEND_EQUATION: typeof GL_BLEND_EQUATION;
declare const Rn_GL_BLEND_EQUATION_ALPHA: typeof GL_BLEND_EQUATION_ALPHA;
declare const Rn_GL_BLEND_EQUATION_RGB: typeof GL_BLEND_EQUATION_RGB;
declare const Rn_GL_BLEND_SRC_ALPHA: typeof GL_BLEND_SRC_ALPHA;
declare const Rn_GL_BLEND_SRC_RGB: typeof GL_BLEND_SRC_RGB;
declare const Rn_GL_BLUE_BITS: typeof GL_BLUE_BITS;
declare const Rn_GL_BOOL: typeof GL_BOOL;
declare const Rn_GL_BOOL_VEC2: typeof GL_BOOL_VEC2;
declare const Rn_GL_BOOL_VEC3: typeof GL_BOOL_VEC3;
declare const Rn_GL_BOOL_VEC4: typeof GL_BOOL_VEC4;
declare const Rn_GL_BROWSER_DEFAULT_WEBGL: typeof GL_BROWSER_DEFAULT_WEBGL;
declare const Rn_GL_BUFFER_SIZE: typeof GL_BUFFER_SIZE;
declare const Rn_GL_BUFFER_USAGE: typeof GL_BUFFER_USAGE;
declare const Rn_GL_CCW: typeof GL_CCW;
declare const Rn_GL_CLAMP_TO_EDGE: typeof GL_CLAMP_TO_EDGE;
declare const Rn_GL_COLOR: typeof GL_COLOR;
declare const Rn_GL_COLOR_ATTACHMENT0: typeof GL_COLOR_ATTACHMENT0;
declare const Rn_GL_COLOR_ATTACHMENT0_WEBGL: typeof GL_COLOR_ATTACHMENT0_WEBGL;
declare const Rn_GL_COLOR_ATTACHMENT1: typeof GL_COLOR_ATTACHMENT1;
declare const Rn_GL_COLOR_ATTACHMENT10: typeof GL_COLOR_ATTACHMENT10;
declare const Rn_GL_COLOR_ATTACHMENT10_WEBGL: typeof GL_COLOR_ATTACHMENT10_WEBGL;
declare const Rn_GL_COLOR_ATTACHMENT11: typeof GL_COLOR_ATTACHMENT11;
declare const Rn_GL_COLOR_ATTACHMENT11_WEBGL: typeof GL_COLOR_ATTACHMENT11_WEBGL;
declare const Rn_GL_COLOR_ATTACHMENT12: typeof GL_COLOR_ATTACHMENT12;
declare const Rn_GL_COLOR_ATTACHMENT12_WEBGL: typeof GL_COLOR_ATTACHMENT12_WEBGL;
declare const Rn_GL_COLOR_ATTACHMENT13: typeof GL_COLOR_ATTACHMENT13;
declare const Rn_GL_COLOR_ATTACHMENT13_WEBGL: typeof GL_COLOR_ATTACHMENT13_WEBGL;
declare const Rn_GL_COLOR_ATTACHMENT14: typeof GL_COLOR_ATTACHMENT14;
declare const Rn_GL_COLOR_ATTACHMENT14_WEBGL: typeof GL_COLOR_ATTACHMENT14_WEBGL;
declare const Rn_GL_COLOR_ATTACHMENT15: typeof GL_COLOR_ATTACHMENT15;
declare const Rn_GL_COLOR_ATTACHMENT15_WEBGL: typeof GL_COLOR_ATTACHMENT15_WEBGL;
declare const Rn_GL_COLOR_ATTACHMENT1_WEBGL: typeof GL_COLOR_ATTACHMENT1_WEBGL;
declare const Rn_GL_COLOR_ATTACHMENT2: typeof GL_COLOR_ATTACHMENT2;
declare const Rn_GL_COLOR_ATTACHMENT2_WEBGL: typeof GL_COLOR_ATTACHMENT2_WEBGL;
declare const Rn_GL_COLOR_ATTACHMENT3: typeof GL_COLOR_ATTACHMENT3;
declare const Rn_GL_COLOR_ATTACHMENT3_WEBGL: typeof GL_COLOR_ATTACHMENT3_WEBGL;
declare const Rn_GL_COLOR_ATTACHMENT4: typeof GL_COLOR_ATTACHMENT4;
declare const Rn_GL_COLOR_ATTACHMENT4_WEBGL: typeof GL_COLOR_ATTACHMENT4_WEBGL;
declare const Rn_GL_COLOR_ATTACHMENT5: typeof GL_COLOR_ATTACHMENT5;
declare const Rn_GL_COLOR_ATTACHMENT5_WEBGL: typeof GL_COLOR_ATTACHMENT5_WEBGL;
declare const Rn_GL_COLOR_ATTACHMENT6: typeof GL_COLOR_ATTACHMENT6;
declare const Rn_GL_COLOR_ATTACHMENT6_WEBGL: typeof GL_COLOR_ATTACHMENT6_WEBGL;
declare const Rn_GL_COLOR_ATTACHMENT7: typeof GL_COLOR_ATTACHMENT7;
declare const Rn_GL_COLOR_ATTACHMENT7_WEBGL: typeof GL_COLOR_ATTACHMENT7_WEBGL;
declare const Rn_GL_COLOR_ATTACHMENT8: typeof GL_COLOR_ATTACHMENT8;
declare const Rn_GL_COLOR_ATTACHMENT8_WEBGL: typeof GL_COLOR_ATTACHMENT8_WEBGL;
declare const Rn_GL_COLOR_ATTACHMENT9: typeof GL_COLOR_ATTACHMENT9;
declare const Rn_GL_COLOR_ATTACHMENT9_WEBGL: typeof GL_COLOR_ATTACHMENT9_WEBGL;
declare const Rn_GL_COLOR_BUFFER_BIT: typeof GL_COLOR_BUFFER_BIT;
declare const Rn_GL_COLOR_CLEAR_VALUE: typeof GL_COLOR_CLEAR_VALUE;
declare const Rn_GL_COLOR_WRITEMASK: typeof GL_COLOR_WRITEMASK;
declare const Rn_GL_COMPARE_REF_TO_TEXTURE: typeof GL_COMPARE_REF_TO_TEXTURE;
declare const Rn_GL_COMPILE_STATUS: typeof GL_COMPILE_STATUS;
declare const Rn_GL_COMPRESSED_R11_EAC: typeof GL_COMPRESSED_R11_EAC;
declare const Rn_GL_COMPRESSED_RG11_EAC: typeof GL_COMPRESSED_RG11_EAC;
declare const Rn_GL_COMPRESSED_RGB8_ETC2: typeof GL_COMPRESSED_RGB8_ETC2;
declare const Rn_GL_COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2: typeof GL_COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2;
declare const Rn_GL_COMPRESSED_RGBA8_ETC2_EAC: typeof GL_COMPRESSED_RGBA8_ETC2_EAC;
declare const Rn_GL_COMPRESSED_RGBA_ASTC_10X10_KHR: typeof GL_COMPRESSED_RGBA_ASTC_10X10_KHR;
declare const Rn_GL_COMPRESSED_RGBA_ASTC_10X5_KHR: typeof GL_COMPRESSED_RGBA_ASTC_10X5_KHR;
declare const Rn_GL_COMPRESSED_RGBA_ASTC_10X6_KHR: typeof GL_COMPRESSED_RGBA_ASTC_10X6_KHR;
declare const Rn_GL_COMPRESSED_RGBA_ASTC_10X8_KHR: typeof GL_COMPRESSED_RGBA_ASTC_10X8_KHR;
declare const Rn_GL_COMPRESSED_RGBA_ASTC_12X10_KHR: typeof GL_COMPRESSED_RGBA_ASTC_12X10_KHR;
declare const Rn_GL_COMPRESSED_RGBA_ASTC_12X12_KHR: typeof GL_COMPRESSED_RGBA_ASTC_12X12_KHR;
declare const Rn_GL_COMPRESSED_RGBA_ASTC_4X4_KHR: typeof GL_COMPRESSED_RGBA_ASTC_4X4_KHR;
declare const Rn_GL_COMPRESSED_RGBA_ASTC_5X4_KHR: typeof GL_COMPRESSED_RGBA_ASTC_5X4_KHR;
declare const Rn_GL_COMPRESSED_RGBA_ASTC_5X5_KHR: typeof GL_COMPRESSED_RGBA_ASTC_5X5_KHR;
declare const Rn_GL_COMPRESSED_RGBA_ASTC_6X5_KHR: typeof GL_COMPRESSED_RGBA_ASTC_6X5_KHR;
declare const Rn_GL_COMPRESSED_RGBA_ASTC_6X6_KHR: typeof GL_COMPRESSED_RGBA_ASTC_6X6_KHR;
declare const Rn_GL_COMPRESSED_RGBA_ASTC_8X5_KHR: typeof GL_COMPRESSED_RGBA_ASTC_8X5_KHR;
declare const Rn_GL_COMPRESSED_RGBA_ASTC_8X6_KHR: typeof GL_COMPRESSED_RGBA_ASTC_8X6_KHR;
declare const Rn_GL_COMPRESSED_RGBA_ASTC_8X8_KHR: typeof GL_COMPRESSED_RGBA_ASTC_8X8_KHR;
declare const Rn_GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL: typeof GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL;
declare const Rn_GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL: typeof GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL;
declare const Rn_GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG: typeof GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG;
declare const Rn_GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG: typeof GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
declare const Rn_GL_COMPRESSED_RGBA_S3TC_DXT1_EXT: typeof GL_COMPRESSED_RGBA_S3TC_DXT1_EXT;
declare const Rn_GL_COMPRESSED_RGBA_S3TC_DXT3_EXT: typeof GL_COMPRESSED_RGBA_S3TC_DXT3_EXT;
declare const Rn_GL_COMPRESSED_RGBA_S3TC_DXT5_EXT: typeof GL_COMPRESSED_RGBA_S3TC_DXT5_EXT;
declare const Rn_GL_COMPRESSED_RGB_ATC_WEBGL: typeof GL_COMPRESSED_RGB_ATC_WEBGL;
declare const Rn_GL_COMPRESSED_RGB_ETC1_WEBGL: typeof GL_COMPRESSED_RGB_ETC1_WEBGL;
declare const Rn_GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG: typeof GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG;
declare const Rn_GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG: typeof GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
declare const Rn_GL_COMPRESSED_RGB_S3TC_DXT1_EXT: typeof GL_COMPRESSED_RGB_S3TC_DXT1_EXT;
declare const Rn_GL_COMPRESSED_SIGNED_R11_EAC: typeof GL_COMPRESSED_SIGNED_R11_EAC;
declare const Rn_GL_COMPRESSED_SIGNED_RG11_EAC: typeof GL_COMPRESSED_SIGNED_RG11_EAC;
declare const Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X10_KHR: typeof GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X10_KHR;
declare const Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X5_KHR: typeof GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X5_KHR;
declare const Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X6_KHR: typeof GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X6_KHR;
declare const Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X8_KHR: typeof GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X8_KHR;
declare const Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12X10_KHR: typeof GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12X10_KHR;
declare const Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12X12_KHR: typeof GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12X12_KHR;
declare const Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_4X4_KHR: typeof GL_COMPRESSED_SRGB8_ALPHA8_ASTC_4X4_KHR;
declare const Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5X4_KHR: typeof GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5X4_KHR;
declare const Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5X5_KHR: typeof GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5X5_KHR;
declare const Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6X5_KHR: typeof GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6X5_KHR;
declare const Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6X6_KHR: typeof GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6X6_KHR;
declare const Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8X5_KHR: typeof GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8X5_KHR;
declare const Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8X6_KHR: typeof GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8X6_KHR;
declare const Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8X8_KHR: typeof GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8X8_KHR;
declare const Rn_GL_COMPRESSED_SRGB8_ALPHA8_ETC2_EAC: typeof GL_COMPRESSED_SRGB8_ALPHA8_ETC2_EAC;
declare const Rn_GL_COMPRESSED_SRGB8_ETC2: typeof GL_COMPRESSED_SRGB8_ETC2;
declare const Rn_GL_COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2: typeof GL_COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2;
declare const Rn_GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT: typeof GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;
declare const Rn_GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT: typeof GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;
declare const Rn_GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT: typeof GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT;
declare const Rn_GL_COMPRESSED_SRGB_S3TC_DXT1_EXT: typeof GL_COMPRESSED_SRGB_S3TC_DXT1_EXT;
declare const Rn_GL_COMPRESSED_TEXTURE_FORMATS: typeof GL_COMPRESSED_TEXTURE_FORMATS;
declare const Rn_GL_CONDITION_SATISFIED: typeof GL_CONDITION_SATISFIED;
declare const Rn_GL_CONSTANT_ALPHA: typeof GL_CONSTANT_ALPHA;
declare const Rn_GL_CONSTANT_COLOR: typeof GL_CONSTANT_COLOR;
declare const Rn_GL_CONTEXT_LOST_WEBGL: typeof GL_CONTEXT_LOST_WEBGL;
declare const Rn_GL_COPY_READ_BUFFER: typeof GL_COPY_READ_BUFFER;
declare const Rn_GL_COPY_READ_BUFFER_BINDING: typeof GL_COPY_READ_BUFFER_BINDING;
declare const Rn_GL_COPY_WRITE_BUFFER: typeof GL_COPY_WRITE_BUFFER;
declare const Rn_GL_COPY_WRITE_BUFFER_BINDING: typeof GL_COPY_WRITE_BUFFER_BINDING;
declare const Rn_GL_CULL_FACE: typeof GL_CULL_FACE;
declare const Rn_GL_CULL_FACE_MODE: typeof GL_CULL_FACE_MODE;
declare const Rn_GL_CURRENT_PROGRAM: typeof GL_CURRENT_PROGRAM;
declare const Rn_GL_CURRENT_QUERY: typeof GL_CURRENT_QUERY;
declare const Rn_GL_CURRENT_QUERY_EXT: typeof GL_CURRENT_QUERY_EXT;
declare const Rn_GL_CURRENT_VERTEX_ATTRIB: typeof GL_CURRENT_VERTEX_ATTRIB;
declare const Rn_GL_CW: typeof GL_CW;
declare const Rn_GL_DATA_BYTE: typeof GL_DATA_BYTE;
declare const Rn_GL_DATA_FLOAT: typeof GL_DATA_FLOAT;
declare const Rn_GL_DATA_INT: typeof GL_DATA_INT;
declare const Rn_GL_DATA_SHORT: typeof GL_DATA_SHORT;
declare const Rn_GL_DATA_UNSIGNED_BYTE: typeof GL_DATA_UNSIGNED_BYTE;
declare const Rn_GL_DATA_UNSIGNED_INT: typeof GL_DATA_UNSIGNED_INT;
declare const Rn_GL_DATA_UNSIGNED_SHORT: typeof GL_DATA_UNSIGNED_SHORT;
declare const Rn_GL_DECR: typeof GL_DECR;
declare const Rn_GL_DECR_WRAP: typeof GL_DECR_WRAP;
declare const Rn_GL_DELETE_STATUS: typeof GL_DELETE_STATUS;
declare const Rn_GL_DEPTH: typeof GL_DEPTH;
declare const Rn_GL_DEPTH24_STENCIL8: typeof GL_DEPTH24_STENCIL8;
declare const Rn_GL_DEPTH32F_STENCIL8: typeof GL_DEPTH32F_STENCIL8;
declare const Rn_GL_DEPTH_ATTACHMENT: typeof GL_DEPTH_ATTACHMENT;
declare const Rn_GL_DEPTH_BITS: typeof GL_DEPTH_BITS;
declare const Rn_GL_DEPTH_BUFFER_BIT: typeof GL_DEPTH_BUFFER_BIT;
declare const Rn_GL_DEPTH_CLEAR_VALUE: typeof GL_DEPTH_CLEAR_VALUE;
declare const Rn_GL_DEPTH_COMPONENT: typeof GL_DEPTH_COMPONENT;
declare const Rn_GL_DEPTH_COMPONENT16: typeof GL_DEPTH_COMPONENT16;
declare const Rn_GL_DEPTH_COMPONENT24: typeof GL_DEPTH_COMPONENT24;
declare const Rn_GL_DEPTH_COMPONENT32F: typeof GL_DEPTH_COMPONENT32F;
declare const Rn_GL_DEPTH_FUNC: typeof GL_DEPTH_FUNC;
declare const Rn_GL_DEPTH_RANGE: typeof GL_DEPTH_RANGE;
declare const Rn_GL_DEPTH_STENCIL: typeof GL_DEPTH_STENCIL;
declare const Rn_GL_DEPTH_STENCIL_ATTACHMENT: typeof GL_DEPTH_STENCIL_ATTACHMENT;
declare const Rn_GL_DEPTH_TEST: typeof GL_DEPTH_TEST;
declare const Rn_GL_DEPTH_WRITEMASK: typeof GL_DEPTH_WRITEMASK;
declare const Rn_GL_DITHER: typeof GL_DITHER;
declare const Rn_GL_DONT_CARE: typeof GL_DONT_CARE;
declare const Rn_GL_DRAW_BUFFER0: typeof GL_DRAW_BUFFER0;
declare const Rn_GL_DRAW_BUFFER0_WEBGL: typeof GL_DRAW_BUFFER0_WEBGL;
declare const Rn_GL_DRAW_BUFFER1: typeof GL_DRAW_BUFFER1;
declare const Rn_GL_DRAW_BUFFER10: typeof GL_DRAW_BUFFER10;
declare const Rn_GL_DRAW_BUFFER10_WEBGL: typeof GL_DRAW_BUFFER10_WEBGL;
declare const Rn_GL_DRAW_BUFFER11: typeof GL_DRAW_BUFFER11;
declare const Rn_GL_DRAW_BUFFER11_WEBGL: typeof GL_DRAW_BUFFER11_WEBGL;
declare const Rn_GL_DRAW_BUFFER12: typeof GL_DRAW_BUFFER12;
declare const Rn_GL_DRAW_BUFFER12_WEBGL: typeof GL_DRAW_BUFFER12_WEBGL;
declare const Rn_GL_DRAW_BUFFER13: typeof GL_DRAW_BUFFER13;
declare const Rn_GL_DRAW_BUFFER13_WEBGL: typeof GL_DRAW_BUFFER13_WEBGL;
declare const Rn_GL_DRAW_BUFFER14: typeof GL_DRAW_BUFFER14;
declare const Rn_GL_DRAW_BUFFER14_WEBGL: typeof GL_DRAW_BUFFER14_WEBGL;
declare const Rn_GL_DRAW_BUFFER15: typeof GL_DRAW_BUFFER15;
declare const Rn_GL_DRAW_BUFFER15_WEBGL: typeof GL_DRAW_BUFFER15_WEBGL;
declare const Rn_GL_DRAW_BUFFER1_WEBGL: typeof GL_DRAW_BUFFER1_WEBGL;
declare const Rn_GL_DRAW_BUFFER2: typeof GL_DRAW_BUFFER2;
declare const Rn_GL_DRAW_BUFFER2_WEBGL: typeof GL_DRAW_BUFFER2_WEBGL;
declare const Rn_GL_DRAW_BUFFER3: typeof GL_DRAW_BUFFER3;
declare const Rn_GL_DRAW_BUFFER3_WEBGL: typeof GL_DRAW_BUFFER3_WEBGL;
declare const Rn_GL_DRAW_BUFFER4: typeof GL_DRAW_BUFFER4;
declare const Rn_GL_DRAW_BUFFER4_WEBGL: typeof GL_DRAW_BUFFER4_WEBGL;
declare const Rn_GL_DRAW_BUFFER5: typeof GL_DRAW_BUFFER5;
declare const Rn_GL_DRAW_BUFFER5_WEBGL: typeof GL_DRAW_BUFFER5_WEBGL;
declare const Rn_GL_DRAW_BUFFER6: typeof GL_DRAW_BUFFER6;
declare const Rn_GL_DRAW_BUFFER6_WEBGL: typeof GL_DRAW_BUFFER6_WEBGL;
declare const Rn_GL_DRAW_BUFFER7: typeof GL_DRAW_BUFFER7;
declare const Rn_GL_DRAW_BUFFER7_WEBGL: typeof GL_DRAW_BUFFER7_WEBGL;
declare const Rn_GL_DRAW_BUFFER8: typeof GL_DRAW_BUFFER8;
declare const Rn_GL_DRAW_BUFFER8_WEBGL: typeof GL_DRAW_BUFFER8_WEBGL;
declare const Rn_GL_DRAW_BUFFER9: typeof GL_DRAW_BUFFER9;
declare const Rn_GL_DRAW_BUFFER9_WEBGL: typeof GL_DRAW_BUFFER9_WEBGL;
declare const Rn_GL_DRAW_FRAMEBUFFER: typeof GL_DRAW_FRAMEBUFFER;
declare const Rn_GL_DRAW_FRAMEBUFFER_BINDING: typeof GL_DRAW_FRAMEBUFFER_BINDING;
declare const Rn_GL_DST_ALPHA: typeof GL_DST_ALPHA;
declare const Rn_GL_DST_COLOR: typeof GL_DST_COLOR;
declare const Rn_GL_DYNAMIC_COPY: typeof GL_DYNAMIC_COPY;
declare const Rn_GL_DYNAMIC_DRAW: typeof GL_DYNAMIC_DRAW;
declare const Rn_GL_DYNAMIC_READ: typeof GL_DYNAMIC_READ;
declare const Rn_GL_ELEMENT_ARRAY_BUFFER: typeof GL_ELEMENT_ARRAY_BUFFER;
declare const Rn_GL_ELEMENT_ARRAY_BUFFER_BINDING: typeof GL_ELEMENT_ARRAY_BUFFER_BINDING;
declare const Rn_GL_EQUAL: typeof GL_EQUAL;
declare const Rn_GL_FASTEST: typeof GL_FASTEST;
declare const Rn_GL_FLOAT_32_UNSIGNED_INT_24_8_REV: typeof GL_FLOAT_32_UNSIGNED_INT_24_8_REV;
declare const Rn_GL_FLOAT_MAT2: typeof GL_FLOAT_MAT2;
declare const Rn_GL_FLOAT_MAT2X3: typeof GL_FLOAT_MAT2X3;
declare const Rn_GL_FLOAT_MAT2X4: typeof GL_FLOAT_MAT2X4;
declare const Rn_GL_FLOAT_MAT3: typeof GL_FLOAT_MAT3;
declare const Rn_GL_FLOAT_MAT3X2: typeof GL_FLOAT_MAT3X2;
declare const Rn_GL_FLOAT_MAT3X4: typeof GL_FLOAT_MAT3X4;
declare const Rn_GL_FLOAT_MAT4: typeof GL_FLOAT_MAT4;
declare const Rn_GL_FLOAT_MAT4X2: typeof GL_FLOAT_MAT4X2;
declare const Rn_GL_FLOAT_MAT4X3: typeof GL_FLOAT_MAT4X3;
declare const Rn_GL_FLOAT_VEC2: typeof GL_FLOAT_VEC2;
declare const Rn_GL_FLOAT_VEC3: typeof GL_FLOAT_VEC3;
declare const Rn_GL_FLOAT_VEC4: typeof GL_FLOAT_VEC4;
declare const Rn_GL_FRAGMENT_SHADER: typeof GL_FRAGMENT_SHADER;
declare const Rn_GL_FRAGMENT_SHADER_DERIVATIVE_HINT: typeof GL_FRAGMENT_SHADER_DERIVATIVE_HINT;
declare const Rn_GL_FRAGMENT_SHADER_DERIVATIVE_HINT_OES: typeof GL_FRAGMENT_SHADER_DERIVATIVE_HINT_OES;
declare const Rn_GL_FRAMEBUFFER: typeof GL_FRAMEBUFFER;
declare const Rn_GL_FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE: typeof GL_FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE;
declare const Rn_GL_FRAMEBUFFER_ATTACHMENT_BLUE_SIZE: typeof GL_FRAMEBUFFER_ATTACHMENT_BLUE_SIZE;
declare const Rn_GL_FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING: typeof GL_FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING;
declare const Rn_GL_FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT: typeof GL_FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT;
declare const Rn_GL_FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE: typeof GL_FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE;
declare const Rn_GL_FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT: typeof GL_FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT;
declare const Rn_GL_FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE: typeof GL_FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE;
declare const Rn_GL_FRAMEBUFFER_ATTACHMENT_GREEN_SIZE: typeof GL_FRAMEBUFFER_ATTACHMENT_GREEN_SIZE;
declare const Rn_GL_FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: typeof GL_FRAMEBUFFER_ATTACHMENT_OBJECT_NAME;
declare const Rn_GL_FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE: typeof GL_FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE;
declare const Rn_GL_FRAMEBUFFER_ATTACHMENT_RED_SIZE: typeof GL_FRAMEBUFFER_ATTACHMENT_RED_SIZE;
declare const Rn_GL_FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE: typeof GL_FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE;
declare const Rn_GL_FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE: typeof GL_FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE;
declare const Rn_GL_FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER: typeof GL_FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER;
declare const Rn_GL_FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL: typeof GL_FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL;
declare const Rn_GL_FRAMEBUFFER_BINDING: typeof GL_FRAMEBUFFER_BINDING;
declare const Rn_GL_FRAMEBUFFER_COMPLETE: typeof GL_FRAMEBUFFER_COMPLETE;
declare const Rn_GL_FRAMEBUFFER_DEFAULT: typeof GL_FRAMEBUFFER_DEFAULT;
declare const Rn_GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT: typeof GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT;
declare const Rn_GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS: typeof GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS;
declare const Rn_GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: typeof GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT;
declare const Rn_GL_FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: typeof GL_FRAMEBUFFER_INCOMPLETE_MULTISAMPLE;
declare const Rn_GL_FRAMEBUFFER_UNSUPPORTED: typeof GL_FRAMEBUFFER_UNSUPPORTED;
declare const Rn_GL_FRONT: typeof GL_FRONT;
declare const Rn_GL_FRONT_AND_BACK: typeof GL_FRONT_AND_BACK;
declare const Rn_GL_FRONT_FACE: typeof GL_FRONT_FACE;
declare const Rn_GL_FUNC_ADD: typeof GL_FUNC_ADD;
declare const Rn_GL_FUNC_REVERSE_SUBTRACT: typeof GL_FUNC_REVERSE_SUBTRACT;
declare const Rn_GL_FUNC_SUBSTRACT: typeof GL_FUNC_SUBSTRACT;
declare const Rn_GL_GENERATE_MIPMAP_HINT: typeof GL_GENERATE_MIPMAP_HINT;
declare const Rn_GL_GEQUAL: typeof GL_GEQUAL;
declare const Rn_GL_GPU_DISJOINT_EXT: typeof GL_GPU_DISJOINT_EXT;
declare const Rn_GL_GREATER: typeof GL_GREATER;
declare const Rn_GL_GREEN_BITS: typeof GL_GREEN_BITS;
declare const Rn_GL_HALF_FLOAT: typeof GL_HALF_FLOAT;
declare const Rn_GL_HALF_FLOAT_OES: typeof GL_HALF_FLOAT_OES;
declare const Rn_GL_HIGH_FLOAT: typeof GL_HIGH_FLOAT;
declare const Rn_GL_HIGH_INT: typeof GL_HIGH_INT;
declare const Rn_GL_IMPLEMENTATION_COLOR_READ_FORMAT: typeof GL_IMPLEMENTATION_COLOR_READ_FORMAT;
declare const Rn_GL_IMPLEMENTATION_COLOR_READ_TYPE: typeof GL_IMPLEMENTATION_COLOR_READ_TYPE;
declare const Rn_GL_INCR: typeof GL_INCR;
declare const Rn_GL_INCR_WRAP: typeof GL_INCR_WRAP;
declare const Rn_GL_INTERLEAVED_ATTRIBS: typeof GL_INTERLEAVED_ATTRIBS;
declare const Rn_GL_INT_2_10_10_10_REV: typeof GL_INT_2_10_10_10_REV;
declare const Rn_GL_INT_SAMPLER_2D: typeof GL_INT_SAMPLER_2D;
declare const Rn_GL_INT_SAMPLER_2D_ARRAY: typeof GL_INT_SAMPLER_2D_ARRAY;
declare const Rn_GL_INT_SAMPLER_3D: typeof GL_INT_SAMPLER_3D;
declare const Rn_GL_INT_SAMPLER_CUBE: typeof GL_INT_SAMPLER_CUBE;
declare const Rn_GL_INT_VEC2: typeof GL_INT_VEC2;
declare const Rn_GL_INT_VEC3: typeof GL_INT_VEC3;
declare const Rn_GL_INT_VEC4: typeof GL_INT_VEC4;
declare const Rn_GL_INVALID_ENUM: typeof GL_INVALID_ENUM;
declare const Rn_GL_INVALID_FRAMEBUFFER_OPERATION: typeof GL_INVALID_FRAMEBUFFER_OPERATION;
declare const Rn_GL_INVALID_INDEX: typeof GL_INVALID_INDEX;
declare const Rn_GL_INVALID_OPERATION: typeof GL_INVALID_OPERATION;
declare const Rn_GL_INVALID_VALUE: typeof GL_INVALID_VALUE;
declare const Rn_GL_INVERT: typeof GL_INVERT;
declare const Rn_GL_KEEP: typeof GL_KEEP;
declare const Rn_GL_LEQUAL: typeof GL_LEQUAL;
declare const Rn_GL_LESS: typeof GL_LESS;
declare const Rn_GL_LINEAR: typeof GL_LINEAR;
declare const Rn_GL_LINEAR_MIPMAP_LINEAR: typeof GL_LINEAR_MIPMAP_LINEAR;
declare const Rn_GL_LINEAR_MIPMAP_NEAREST: typeof GL_LINEAR_MIPMAP_NEAREST;
declare const Rn_GL_LINES: typeof GL_LINES;
declare const Rn_GL_LINE_LOOP: typeof GL_LINE_LOOP;
declare const Rn_GL_LINE_STRIP: typeof GL_LINE_STRIP;
declare const Rn_GL_LINE_WIDTH: typeof GL_LINE_WIDTH;
declare const Rn_GL_LINK_STATUS: typeof GL_LINK_STATUS;
declare const Rn_GL_LOW_FLOAT: typeof GL_LOW_FLOAT;
declare const Rn_GL_LOW_INT: typeof GL_LOW_INT;
declare const Rn_GL_LUMINANCE: typeof GL_LUMINANCE;
declare const Rn_GL_LUMINANCE_ALPHA: typeof GL_LUMINANCE_ALPHA;
declare const Rn_GL_MAX: typeof GL_MAX;
declare const Rn_GL_MAX_3D_TEXTURE_SIZE: typeof GL_MAX_3D_TEXTURE_SIZE;
declare const Rn_GL_MAX_ARRAY_TEXTURE_LAYERS: typeof GL_MAX_ARRAY_TEXTURE_LAYERS;
declare const Rn_GL_MAX_CLIENT_WAIT_TIMEOUT_WEBGL: typeof GL_MAX_CLIENT_WAIT_TIMEOUT_WEBGL;
declare const Rn_GL_MAX_COLOR_ATTACHMENTS: typeof GL_MAX_COLOR_ATTACHMENTS;
declare const Rn_GL_MAX_COLOR_ATTACHMENTS_WEBGL: typeof GL_MAX_COLOR_ATTACHMENTS_WEBGL;
declare const Rn_GL_MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: typeof GL_MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS;
declare const Rn_GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS: typeof GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS;
declare const Rn_GL_MAX_COMBINED_UNIFORM_BLOCKS: typeof GL_MAX_COMBINED_UNIFORM_BLOCKS;
declare const Rn_GL_MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: typeof GL_MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS;
declare const Rn_GL_MAX_CUBE_MAP_TEXTURE_SIZE: typeof GL_MAX_CUBE_MAP_TEXTURE_SIZE;
declare const Rn_GL_MAX_DRAW_BUFFERS: typeof GL_MAX_DRAW_BUFFERS;
declare const Rn_GL_MAX_DRAW_BUFFERS_WEBGL: typeof GL_MAX_DRAW_BUFFERS_WEBGL;
declare const Rn_GL_MAX_ELEMENTS_INDICES: typeof GL_MAX_ELEMENTS_INDICES;
declare const Rn_GL_MAX_ELEMENTS_VERTICES: typeof GL_MAX_ELEMENTS_VERTICES;
declare const Rn_GL_MAX_ELEMENT_INDEX: typeof GL_MAX_ELEMENT_INDEX;
declare const Rn_GL_MAX_EXT: typeof GL_MAX_EXT;
declare const Rn_GL_MAX_FRAGMENT_INPUT_COMPONENTS: typeof GL_MAX_FRAGMENT_INPUT_COMPONENTS;
declare const Rn_GL_MAX_FRAGMENT_UNIFORM_BLOCKS: typeof GL_MAX_FRAGMENT_UNIFORM_BLOCKS;
declare const Rn_GL_MAX_FRAGMENT_UNIFORM_COMPONENTS: typeof GL_MAX_FRAGMENT_UNIFORM_COMPONENTS;
declare const Rn_GL_MAX_FRAGMENT_UNIFORM_VECTORS: typeof GL_MAX_FRAGMENT_UNIFORM_VECTORS;
declare const Rn_GL_MAX_PROGRAM_TEXEL_OFFSET: typeof GL_MAX_PROGRAM_TEXEL_OFFSET;
declare const Rn_GL_MAX_RENDERBUFFER_SIZE: typeof GL_MAX_RENDERBUFFER_SIZE;
declare const Rn_GL_MAX_SAMPLES: typeof GL_MAX_SAMPLES;
declare const Rn_GL_MAX_SERVER_WAIT_TIMEOUT: typeof GL_MAX_SERVER_WAIT_TIMEOUT;
declare const Rn_GL_MAX_TEXTURE_IMAGE_UNITS: typeof GL_MAX_TEXTURE_IMAGE_UNITS;
declare const Rn_GL_MAX_TEXTURE_LOD_BIAS: typeof GL_MAX_TEXTURE_LOD_BIAS;
declare const Rn_GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT: typeof GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT;
declare const Rn_GL_MAX_TEXTURE_SIZE: typeof GL_MAX_TEXTURE_SIZE;
declare const Rn_GL_MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS: typeof GL_MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS;
declare const Rn_GL_MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS: typeof GL_MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS;
declare const Rn_GL_MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS: typeof GL_MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS;
declare const Rn_GL_MAX_UNIFORM_BLOCK_SIZE: typeof GL_MAX_UNIFORM_BLOCK_SIZE;
declare const Rn_GL_MAX_UNIFORM_BUFFER_BINDINGS: typeof GL_MAX_UNIFORM_BUFFER_BINDINGS;
declare const Rn_GL_MAX_VARYING_COMPONENTS: typeof GL_MAX_VARYING_COMPONENTS;
declare const Rn_GL_MAX_VARYING_VECTORS: typeof GL_MAX_VARYING_VECTORS;
declare const Rn_GL_MAX_VERTEX_ATTRIBS: typeof GL_MAX_VERTEX_ATTRIBS;
declare const Rn_GL_MAX_VERTEX_OUTPUT_COMPONENTS: typeof GL_MAX_VERTEX_OUTPUT_COMPONENTS;
declare const Rn_GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS: typeof GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS;
declare const Rn_GL_MAX_VERTEX_UNIFORM_BLOCKS: typeof GL_MAX_VERTEX_UNIFORM_BLOCKS;
declare const Rn_GL_MAX_VERTEX_UNIFORM_COMPONENTS: typeof GL_MAX_VERTEX_UNIFORM_COMPONENTS;
declare const Rn_GL_MAX_VERTEX_UNIFORM_VECTORS: typeof GL_MAX_VERTEX_UNIFORM_VECTORS;
declare const Rn_GL_MAX_VIEWPORT_DIMS: typeof GL_MAX_VIEWPORT_DIMS;
declare const Rn_GL_MEDIUM_FLOAT: typeof GL_MEDIUM_FLOAT;
declare const Rn_GL_MEDIUM_INT: typeof GL_MEDIUM_INT;
declare const Rn_GL_MIN: typeof GL_MIN;
declare const Rn_GL_MIN_EXT: typeof GL_MIN_EXT;
declare const Rn_GL_MIN_PROGRAM_TEXEL_OFFSET: typeof GL_MIN_PROGRAM_TEXEL_OFFSET;
declare const Rn_GL_MIRRORED_REPEAT: typeof GL_MIRRORED_REPEAT;
declare const Rn_GL_NEAREST: typeof GL_NEAREST;
declare const Rn_GL_NEAREST_MIPMAP_LINEAR: typeof GL_NEAREST_MIPMAP_LINEAR;
declare const Rn_GL_NEAREST_MIPMAP_NEAREST: typeof GL_NEAREST_MIPMAP_NEAREST;
declare const Rn_GL_NEVER: typeof GL_NEVER;
declare const Rn_GL_NICEST: typeof GL_NICEST;
declare const Rn_GL_NONE: typeof GL_NONE;
declare const Rn_GL_NOTEQUAL: typeof GL_NOTEQUAL;
declare const Rn_GL_NO_ERROR: typeof GL_NO_ERROR;
declare const Rn_GL_OBJECT_TYPE: typeof GL_OBJECT_TYPE;
declare const Rn_GL_ONE: typeof GL_ONE;
declare const Rn_GL_ONE_MINUS_CONSTANT_ALPHA: typeof GL_ONE_MINUS_CONSTANT_ALPHA;
declare const Rn_GL_ONE_MINUS_CONSTANT_COLOR: typeof GL_ONE_MINUS_CONSTANT_COLOR;
declare const Rn_GL_ONE_MINUS_DST_ALPHA: typeof GL_ONE_MINUS_DST_ALPHA;
declare const Rn_GL_ONE_MINUS_DST_COLOR: typeof GL_ONE_MINUS_DST_COLOR;
declare const Rn_GL_ONE_MINUS_SRC_ALPHA: typeof GL_ONE_MINUS_SRC_ALPHA;
declare const Rn_GL_ONE_MINUS_SRC_COLOR: typeof GL_ONE_MINUS_SRC_COLOR;
declare const Rn_GL_OUT_OF_MEMORY: typeof GL_OUT_OF_MEMORY;
declare const Rn_GL_PACK_ALIGNMENT: typeof GL_PACK_ALIGNMENT;
declare const Rn_GL_PACK_ROW_LENGTH: typeof GL_PACK_ROW_LENGTH;
declare const Rn_GL_PACK_SKIP_PIXELS: typeof GL_PACK_SKIP_PIXELS;
declare const Rn_GL_PACK_SKIP_ROWS: typeof GL_PACK_SKIP_ROWS;
declare const Rn_GL_PIXEL_PACK_BUFFER: typeof GL_PIXEL_PACK_BUFFER;
declare const Rn_GL_PIXEL_PACK_BUFFER_BINDING: typeof GL_PIXEL_PACK_BUFFER_BINDING;
declare const Rn_GL_PIXEL_UNPACK_BUFFER: typeof GL_PIXEL_UNPACK_BUFFER;
declare const Rn_GL_PIXEL_UNPACK_BUFFER_BINDING: typeof GL_PIXEL_UNPACK_BUFFER_BINDING;
declare const Rn_GL_PIXEL_UNSIGNED_BYTE: typeof GL_PIXEL_UNSIGNED_BYTE;
declare const Rn_GL_PIXEL_UNSIGNED_SHORT_4_4_4_4: typeof GL_PIXEL_UNSIGNED_SHORT_4_4_4_4;
declare const Rn_GL_PIXEL_UNSIGNED_SHORT_5_5_5_1: typeof GL_PIXEL_UNSIGNED_SHORT_5_5_5_1;
declare const Rn_GL_PIXEL_UNSIGNED_SHORT_5_6_5: typeof GL_PIXEL_UNSIGNED_SHORT_5_6_5;
declare const Rn_GL_POINTS: typeof GL_POINTS;
declare const Rn_GL_POLYGON_OFFSET_FACTOR: typeof GL_POLYGON_OFFSET_FACTOR;
declare const Rn_GL_POLYGON_OFFSET_FILL: typeof GL_POLYGON_OFFSET_FILL;
declare const Rn_GL_POLYGON_OFFSET_UNITS: typeof GL_POLYGON_OFFSET_UNITS;
declare const Rn_GL_QUERY_COUNTER_BITS_EXT: typeof GL_QUERY_COUNTER_BITS_EXT;
declare const Rn_GL_QUERY_RESULT: typeof GL_QUERY_RESULT;
declare const Rn_GL_QUERY_RESULT_AVAILABLE: typeof GL_QUERY_RESULT_AVAILABLE;
declare const Rn_GL_QUERY_RESULT_AVAILABLE_EXT: typeof GL_QUERY_RESULT_AVAILABLE_EXT;
declare const Rn_GL_QUERY_RESULT_EXT: typeof GL_QUERY_RESULT_EXT;
declare const Rn_GL_R11F_G11F_B10F: typeof GL_R11F_G11F_B10F;
declare const Rn_GL_R16F: typeof GL_R16F;
declare const Rn_GL_R16I: typeof GL_R16I;
declare const Rn_GL_R16UI: typeof GL_R16UI;
declare const Rn_GL_R32F: typeof GL_R32F;
declare const Rn_GL_R32I: typeof GL_R32I;
declare const Rn_GL_R32UI: typeof GL_R32UI;
declare const Rn_GL_R8: typeof GL_R8;
declare const Rn_GL_R8I: typeof GL_R8I;
declare const Rn_GL_R8UI: typeof GL_R8UI;
declare const Rn_GL_R8_SNORM: typeof GL_R8_SNORM;
declare const Rn_GL_RASTERIZER_DISCARD: typeof GL_RASTERIZER_DISCARD;
declare const Rn_GL_READ_BUFFER: typeof GL_READ_BUFFER;
declare const Rn_GL_READ_FRAMEBUFFER: typeof GL_READ_FRAMEBUFFER;
declare const Rn_GL_READ_FRAMEBUFFER_BINDING: typeof GL_READ_FRAMEBUFFER_BINDING;
declare const Rn_GL_RED: typeof GL_RED;
declare const Rn_GL_RED_BITS: typeof GL_RED_BITS;
declare const Rn_GL_RED_INTEGER: typeof GL_RED_INTEGER;
declare const Rn_GL_RENDERBUFFER: typeof GL_RENDERBUFFER;
declare const Rn_GL_RENDERBUFFER_ALPHA_SIZE: typeof GL_RENDERBUFFER_ALPHA_SIZE;
declare const Rn_GL_RENDERBUFFER_BINDING: typeof GL_RENDERBUFFER_BINDING;
declare const Rn_GL_RENDERBUFFER_BLUE_SIZE: typeof GL_RENDERBUFFER_BLUE_SIZE;
declare const Rn_GL_RENDERBUFFER_DEPTH_SIZE: typeof GL_RENDERBUFFER_DEPTH_SIZE;
declare const Rn_GL_RENDERBUFFER_GREEN_SIZE: typeof GL_RENDERBUFFER_GREEN_SIZE;
declare const Rn_GL_RENDERBUFFER_HEIGHT: typeof GL_RENDERBUFFER_HEIGHT;
declare const Rn_GL_RENDERBUFFER_INTERNAL_FORMAT: typeof GL_RENDERBUFFER_INTERNAL_FORMAT;
declare const Rn_GL_RENDERBUFFER_RED_SIZE: typeof GL_RENDERBUFFER_RED_SIZE;
declare const Rn_GL_RENDERBUFFER_SAMPLES: typeof GL_RENDERBUFFER_SAMPLES;
declare const Rn_GL_RENDERBUFFER_STENCIL_SIZE: typeof GL_RENDERBUFFER_STENCIL_SIZE;
declare const Rn_GL_RENDERBUFFER_WIDTH: typeof GL_RENDERBUFFER_WIDTH;
declare const Rn_GL_RENDERER: typeof GL_RENDERER;
declare const Rn_GL_REPEAT: typeof GL_REPEAT;
declare const Rn_GL_REPLACE: typeof GL_REPLACE;
declare const Rn_GL_RG: typeof GL_RG;
declare const Rn_GL_RG16F: typeof GL_RG16F;
declare const Rn_GL_RG16I: typeof GL_RG16I;
declare const Rn_GL_RG16UI: typeof GL_RG16UI;
declare const Rn_GL_RG32F: typeof GL_RG32F;
declare const Rn_GL_RG32I: typeof GL_RG32I;
declare const Rn_GL_RG32UI: typeof GL_RG32UI;
declare const Rn_GL_RG8: typeof GL_RG8;
declare const Rn_GL_RG8I: typeof GL_RG8I;
declare const Rn_GL_RG8UI: typeof GL_RG8UI;
declare const Rn_GL_RG8_SNORM: typeof GL_RG8_SNORM;
declare const Rn_GL_RGB: typeof GL_RGB;
declare const Rn_GL_RGB10_A2: typeof GL_RGB10_A2;
declare const Rn_GL_RGB10_A2UI: typeof GL_RGB10_A2UI;
declare const Rn_GL_RGB16F: typeof GL_RGB16F;
declare const Rn_GL_RGB16I: typeof GL_RGB16I;
declare const Rn_GL_RGB16UI: typeof GL_RGB16UI;
declare const Rn_GL_RGB32F: typeof GL_RGB32F;
declare const Rn_GL_RGB32F_EXT: typeof GL_RGB32F_EXT;
declare const Rn_GL_RGB32I: typeof GL_RGB32I;
declare const Rn_GL_RGB32UI: typeof GL_RGB32UI;
declare const Rn_GL_RGB565: typeof GL_RGB565;
declare const Rn_GL_RGB5_A1: typeof GL_RGB5_A1;
declare const Rn_GL_RGB8: typeof GL_RGB8;
declare const Rn_GL_RGB8I: typeof GL_RGB8I;
declare const Rn_GL_RGB8UI: typeof GL_RGB8UI;
declare const Rn_GL_RGB8_SNORM: typeof GL_RGB8_SNORM;
declare const Rn_GL_RGB9_E5: typeof GL_RGB9_E5;
declare const Rn_GL_RGBA: typeof GL_RGBA;
declare const Rn_GL_RGBA16F: typeof GL_RGBA16F;
declare const Rn_GL_RGBA16I: typeof GL_RGBA16I;
declare const Rn_GL_RGBA16UI: typeof GL_RGBA16UI;
declare const Rn_GL_RGBA32F: typeof GL_RGBA32F;
declare const Rn_GL_RGBA32F_EXT: typeof GL_RGBA32F_EXT;
declare const Rn_GL_RGBA32I: typeof GL_RGBA32I;
declare const Rn_GL_RGBA32UI: typeof GL_RGBA32UI;
declare const Rn_GL_RGBA4: typeof GL_RGBA4;
declare const Rn_GL_RGBA8: typeof GL_RGBA8;
declare const Rn_GL_RGBA8I: typeof GL_RGBA8I;
declare const Rn_GL_RGBA8UI: typeof GL_RGBA8UI;
declare const Rn_GL_RGBA8_SNORM: typeof GL_RGBA8_SNORM;
declare const Rn_GL_RGBA_INTEGER: typeof GL_RGBA_INTEGER;
declare const Rn_GL_RGB_INTEGER: typeof GL_RGB_INTEGER;
declare const Rn_GL_RG_INTEGER: typeof GL_RG_INTEGER;
declare const Rn_GL_SAMPLER_2D: typeof GL_SAMPLER_2D;
declare const Rn_GL_SAMPLER_2D_ARRAY: typeof GL_SAMPLER_2D_ARRAY;
declare const Rn_GL_SAMPLER_2D_ARRAY_SHADOW: typeof GL_SAMPLER_2D_ARRAY_SHADOW;
declare const Rn_GL_SAMPLER_2D_SHADOW: typeof GL_SAMPLER_2D_SHADOW;
declare const Rn_GL_SAMPLER_3D: typeof GL_SAMPLER_3D;
declare const Rn_GL_SAMPLER_BINDING: typeof GL_SAMPLER_BINDING;
declare const Rn_GL_SAMPLER_CUBE: typeof GL_SAMPLER_CUBE;
declare const Rn_GL_SAMPLER_CUBE_SHADOW: typeof GL_SAMPLER_CUBE_SHADOW;
declare const Rn_GL_SAMPLES: typeof GL_SAMPLES;
declare const Rn_GL_SAMPLE_ALPHA_TO_COVERAGE: typeof GL_SAMPLE_ALPHA_TO_COVERAGE;
declare const Rn_GL_SAMPLE_BUFFERS: typeof GL_SAMPLE_BUFFERS;
declare const Rn_GL_SAMPLE_COVERAGE: typeof GL_SAMPLE_COVERAGE;
declare const Rn_GL_SAMPLE_COVERAGE_INVERT: typeof GL_SAMPLE_COVERAGE_INVERT;
declare const Rn_GL_SAMPLE_COVERAGE_VALUE: typeof GL_SAMPLE_COVERAGE_VALUE;
declare const Rn_GL_SCISSOR_BOX: typeof GL_SCISSOR_BOX;
declare const Rn_GL_SCISSOR_TEST: typeof GL_SCISSOR_TEST;
declare const Rn_GL_SEPARATE_ATTRIBS: typeof GL_SEPARATE_ATTRIBS;
declare const Rn_GL_SHADER_TYPE: typeof GL_SHADER_TYPE;
declare const Rn_GL_SHADING_LANGUAGE_VERSION: typeof GL_SHADING_LANGUAGE_VERSION;
declare const Rn_GL_SIGNALED: typeof GL_SIGNALED;
declare const Rn_GL_SIGNED_NORMALIZED: typeof GL_SIGNED_NORMALIZED;
declare const Rn_GL_SRC_ALPHA: typeof GL_SRC_ALPHA;
declare const Rn_GL_SRC_ALPHA_SATURATE: typeof GL_SRC_ALPHA_SATURATE;
declare const Rn_GL_SRC_COLOR: typeof GL_SRC_COLOR;
declare const Rn_GL_SRGB: typeof GL_SRGB;
declare const Rn_GL_SRGB8: typeof GL_SRGB8;
declare const Rn_GL_SRGB8_ALPHA8: typeof GL_SRGB8_ALPHA8;
declare const Rn_GL_SRGB8_ALPHA8_EXT: typeof GL_SRGB8_ALPHA8_EXT;
declare const Rn_GL_SRGB_ALPHA_EXT: typeof GL_SRGB_ALPHA_EXT;
declare const Rn_GL_SRGB_EXT: typeof GL_SRGB_EXT;
declare const Rn_GL_STATIC_COPY: typeof GL_STATIC_COPY;
declare const Rn_GL_STATIC_DRAW: typeof GL_STATIC_DRAW;
declare const Rn_GL_STATIC_READ: typeof GL_STATIC_READ;
declare const Rn_GL_STENCIL: typeof GL_STENCIL;
declare const Rn_GL_STENCIL_ATTACHMENT: typeof GL_STENCIL_ATTACHMENT;
declare const Rn_GL_STENCIL_BACK_FAIL: typeof GL_STENCIL_BACK_FAIL;
declare const Rn_GL_STENCIL_BACK_FUNC: typeof GL_STENCIL_BACK_FUNC;
declare const Rn_GL_STENCIL_BACK_PASS_DEPTH_FAIL: typeof GL_STENCIL_BACK_PASS_DEPTH_FAIL;
declare const Rn_GL_STENCIL_BACK_PASS_DEPTH_PASS: typeof GL_STENCIL_BACK_PASS_DEPTH_PASS;
declare const Rn_GL_STENCIL_BACK_REF: typeof GL_STENCIL_BACK_REF;
declare const Rn_GL_STENCIL_BACK_VALUE_MASK: typeof GL_STENCIL_BACK_VALUE_MASK;
declare const Rn_GL_STENCIL_BACK_WRITEMASK: typeof GL_STENCIL_BACK_WRITEMASK;
declare const Rn_GL_STENCIL_BITS: typeof GL_STENCIL_BITS;
declare const Rn_GL_STENCIL_BUFFER_BIT: typeof GL_STENCIL_BUFFER_BIT;
declare const Rn_GL_STENCIL_CLEAR_VALUE: typeof GL_STENCIL_CLEAR_VALUE;
declare const Rn_GL_STENCIL_FAIL: typeof GL_STENCIL_FAIL;
declare const Rn_GL_STENCIL_FUNC: typeof GL_STENCIL_FUNC;
declare const Rn_GL_STENCIL_INDEX: typeof GL_STENCIL_INDEX;
declare const Rn_GL_STENCIL_INDEX8: typeof GL_STENCIL_INDEX8;
declare const Rn_GL_STENCIL_PASS_DEPTH_FAIL: typeof GL_STENCIL_PASS_DEPTH_FAIL;
declare const Rn_GL_STENCIL_PASS_DEPTH_PASS: typeof GL_STENCIL_PASS_DEPTH_PASS;
declare const Rn_GL_STENCIL_REF: typeof GL_STENCIL_REF;
declare const Rn_GL_STENCIL_TEST: typeof GL_STENCIL_TEST;
declare const Rn_GL_STENCIL_VALUE_MASK: typeof GL_STENCIL_VALUE_MASK;
declare const Rn_GL_STENCIL_WRITEMASK: typeof GL_STENCIL_WRITEMASK;
declare const Rn_GL_STREAM_COPY: typeof GL_STREAM_COPY;
declare const Rn_GL_STREAM_DRAW: typeof GL_STREAM_DRAW;
declare const Rn_GL_STREAM_READ: typeof GL_STREAM_READ;
declare const Rn_GL_SUBPIXEL_BITS: typeof GL_SUBPIXEL_BITS;
declare const Rn_GL_SYNC_CONDITION: typeof GL_SYNC_CONDITION;
declare const Rn_GL_SYNC_FENCE: typeof GL_SYNC_FENCE;
declare const Rn_GL_SYNC_FLAGS: typeof GL_SYNC_FLAGS;
declare const Rn_GL_SYNC_FLUSH_COMMANDS_BIT: typeof GL_SYNC_FLUSH_COMMANDS_BIT;
declare const Rn_GL_SYNC_GPU_COMMANDS_COMPLETE: typeof GL_SYNC_GPU_COMMANDS_COMPLETE;
declare const Rn_GL_SYNC_STATUS: typeof GL_SYNC_STATUS;
declare const Rn_GL_TEXTURE: typeof GL_TEXTURE;
declare const Rn_GL_TEXTURE0: typeof GL_TEXTURE0;
declare const Rn_GL_TEXTURE1: typeof GL_TEXTURE1;
declare const Rn_GL_TEXTURE10: typeof GL_TEXTURE10;
declare const Rn_GL_TEXTURE11: typeof GL_TEXTURE11;
declare const Rn_GL_TEXTURE12: typeof GL_TEXTURE12;
declare const Rn_GL_TEXTURE13: typeof GL_TEXTURE13;
declare const Rn_GL_TEXTURE14: typeof GL_TEXTURE14;
declare const Rn_GL_TEXTURE15: typeof GL_TEXTURE15;
declare const Rn_GL_TEXTURE16: typeof GL_TEXTURE16;
declare const Rn_GL_TEXTURE17: typeof GL_TEXTURE17;
declare const Rn_GL_TEXTURE18: typeof GL_TEXTURE18;
declare const Rn_GL_TEXTURE19: typeof GL_TEXTURE19;
declare const Rn_GL_TEXTURE2: typeof GL_TEXTURE2;
declare const Rn_GL_TEXTURE20: typeof GL_TEXTURE20;
declare const Rn_GL_TEXTURE21: typeof GL_TEXTURE21;
declare const Rn_GL_TEXTURE22: typeof GL_TEXTURE22;
declare const Rn_GL_TEXTURE23: typeof GL_TEXTURE23;
declare const Rn_GL_TEXTURE24: typeof GL_TEXTURE24;
declare const Rn_GL_TEXTURE25: typeof GL_TEXTURE25;
declare const Rn_GL_TEXTURE26: typeof GL_TEXTURE26;
declare const Rn_GL_TEXTURE27: typeof GL_TEXTURE27;
declare const Rn_GL_TEXTURE28: typeof GL_TEXTURE28;
declare const Rn_GL_TEXTURE29: typeof GL_TEXTURE29;
declare const Rn_GL_TEXTURE3: typeof GL_TEXTURE3;
declare const Rn_GL_TEXTURE30: typeof GL_TEXTURE30;
declare const Rn_GL_TEXTURE31: typeof GL_TEXTURE31;
declare const Rn_GL_TEXTURE4: typeof GL_TEXTURE4;
declare const Rn_GL_TEXTURE5: typeof GL_TEXTURE5;
declare const Rn_GL_TEXTURE6: typeof GL_TEXTURE6;
declare const Rn_GL_TEXTURE7: typeof GL_TEXTURE7;
declare const Rn_GL_TEXTURE8: typeof GL_TEXTURE8;
declare const Rn_GL_TEXTURE9: typeof GL_TEXTURE9;
declare const Rn_GL_TEXTURE_2D: typeof GL_TEXTURE_2D;
declare const Rn_GL_TEXTURE_2D_ARRAY: typeof GL_TEXTURE_2D_ARRAY;
declare const Rn_GL_TEXTURE_3D: typeof GL_TEXTURE_3D;
declare const Rn_GL_TEXTURE_BASE_LEVEL: typeof GL_TEXTURE_BASE_LEVEL;
declare const Rn_GL_TEXTURE_BINDING_2D: typeof GL_TEXTURE_BINDING_2D;
declare const Rn_GL_TEXTURE_BINDING_2D_ARRAY: typeof GL_TEXTURE_BINDING_2D_ARRAY;
declare const Rn_GL_TEXTURE_BINDING_3D: typeof GL_TEXTURE_BINDING_3D;
declare const Rn_GL_TEXTURE_BINDING_CUBE_MAP: typeof GL_TEXTURE_BINDING_CUBE_MAP;
declare const Rn_GL_TEXTURE_COMPARE_FUNC: typeof GL_TEXTURE_COMPARE_FUNC;
declare const Rn_GL_TEXTURE_COMPARE_MODE: typeof GL_TEXTURE_COMPARE_MODE;
declare const Rn_GL_TEXTURE_CUBE_MAP: typeof GL_TEXTURE_CUBE_MAP;
declare const Rn_GL_TEXTURE_CUBE_MAP_NEGATIVE_X: typeof GL_TEXTURE_CUBE_MAP_NEGATIVE_X;
declare const Rn_GL_TEXTURE_CUBE_MAP_NEGATIVE_Y: typeof GL_TEXTURE_CUBE_MAP_NEGATIVE_Y;
declare const Rn_GL_TEXTURE_CUBE_MAP_NEGATIVE_Z: typeof GL_TEXTURE_CUBE_MAP_NEGATIVE_Z;
declare const Rn_GL_TEXTURE_CUBE_MAP_POSITIVE_X: typeof GL_TEXTURE_CUBE_MAP_POSITIVE_X;
declare const Rn_GL_TEXTURE_CUBE_MAP_POSITIVE_Y: typeof GL_TEXTURE_CUBE_MAP_POSITIVE_Y;
declare const Rn_GL_TEXTURE_CUBE_MAP_POSITIVE_Z: typeof GL_TEXTURE_CUBE_MAP_POSITIVE_Z;
declare const Rn_GL_TEXTURE_IMMUTABLE_FORMAT: typeof GL_TEXTURE_IMMUTABLE_FORMAT;
declare const Rn_GL_TEXTURE_IMMUTABLE_LEVELS: typeof GL_TEXTURE_IMMUTABLE_LEVELS;
declare const Rn_GL_TEXTURE_MAG_FILTER: typeof GL_TEXTURE_MAG_FILTER;
declare const Rn_GL_TEXTURE_MAX_ANISOTROPY_EXT: typeof GL_TEXTURE_MAX_ANISOTROPY_EXT;
declare const Rn_GL_TEXTURE_MAX_LEVEL: typeof GL_TEXTURE_MAX_LEVEL;
declare const Rn_GL_TEXTURE_MAX_LOD: typeof GL_TEXTURE_MAX_LOD;
declare const Rn_GL_TEXTURE_MIN_FILTER: typeof GL_TEXTURE_MIN_FILTER;
declare const Rn_GL_TEXTURE_MIN_LOD: typeof GL_TEXTURE_MIN_LOD;
declare const Rn_GL_TEXTURE_WRAP_R: typeof GL_TEXTURE_WRAP_R;
declare const Rn_GL_TEXTURE_WRAP_S: typeof GL_TEXTURE_WRAP_S;
declare const Rn_GL_TEXTURE_WRAP_T: typeof GL_TEXTURE_WRAP_T;
declare const Rn_GL_TIMEOUT_EXPIRED: typeof GL_TIMEOUT_EXPIRED;
declare const Rn_GL_TIMEOUT_IGNORED: typeof GL_TIMEOUT_IGNORED;
declare const Rn_GL_TIMESTAMP_EXT: typeof GL_TIMESTAMP_EXT;
declare const Rn_GL_TIME_ELAPSED_EXT: typeof GL_TIME_ELAPSED_EXT;
declare const Rn_GL_TRANSFORM_FEEDBACK: typeof GL_TRANSFORM_FEEDBACK;
declare const Rn_GL_TRANSFORM_FEEDBACK_ACTIVE: typeof GL_TRANSFORM_FEEDBACK_ACTIVE;
declare const Rn_GL_TRANSFORM_FEEDBACK_BINDING: typeof GL_TRANSFORM_FEEDBACK_BINDING;
declare const Rn_GL_TRANSFORM_FEEDBACK_BUFFER: typeof GL_TRANSFORM_FEEDBACK_BUFFER;
declare const Rn_GL_TRANSFORM_FEEDBACK_BUFFER_BINDING: typeof GL_TRANSFORM_FEEDBACK_BUFFER_BINDING;
declare const Rn_GL_TRANSFORM_FEEDBACK_BUFFER_MODE: typeof GL_TRANSFORM_FEEDBACK_BUFFER_MODE;
declare const Rn_GL_TRANSFORM_FEEDBACK_BUFFER_SIZE: typeof GL_TRANSFORM_FEEDBACK_BUFFER_SIZE;
declare const Rn_GL_TRANSFORM_FEEDBACK_BUFFER_START: typeof GL_TRANSFORM_FEEDBACK_BUFFER_START;
declare const Rn_GL_TRANSFORM_FEEDBACK_PAUSED: typeof GL_TRANSFORM_FEEDBACK_PAUSED;
declare const Rn_GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN: typeof GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN;
declare const Rn_GL_TRANSFORM_FEEDBACK_VARYINGS: typeof GL_TRANSFORM_FEEDBACK_VARYINGS;
declare const Rn_GL_TRIANGLES: typeof GL_TRIANGLES;
declare const Rn_GL_TRIANGLE_FAN: typeof GL_TRIANGLE_FAN;
declare const Rn_GL_TRIANGLE_STRIP: typeof GL_TRIANGLE_STRIP;
declare const Rn_GL_UNIFORM_ARRAY_STRIDE: typeof GL_UNIFORM_ARRAY_STRIDE;
declare const Rn_GL_UNIFORM_BLOCK_ACTIVE_UNIFORMS: typeof GL_UNIFORM_BLOCK_ACTIVE_UNIFORMS;
declare const Rn_GL_UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES: typeof GL_UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES;
declare const Rn_GL_UNIFORM_BLOCK_BINDING: typeof GL_UNIFORM_BLOCK_BINDING;
declare const Rn_GL_UNIFORM_BLOCK_DATA_SIZE: typeof GL_UNIFORM_BLOCK_DATA_SIZE;
declare const Rn_GL_UNIFORM_BLOCK_INDEX: typeof GL_UNIFORM_BLOCK_INDEX;
declare const Rn_GL_UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER: typeof GL_UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER;
declare const Rn_GL_UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER: typeof GL_UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER;
declare const Rn_GL_UNIFORM_BUFFER: typeof GL_UNIFORM_BUFFER;
declare const Rn_GL_UNIFORM_BUFFER_BINDING: typeof GL_UNIFORM_BUFFER_BINDING;
declare const Rn_GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT: typeof GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT;
declare const Rn_GL_UNIFORM_BUFFER_SIZE: typeof GL_UNIFORM_BUFFER_SIZE;
declare const Rn_GL_UNIFORM_BUFFER_START: typeof GL_UNIFORM_BUFFER_START;
declare const Rn_GL_UNIFORM_IS_ROW_MAJOR: typeof GL_UNIFORM_IS_ROW_MAJOR;
declare const Rn_GL_UNIFORM_MATRIX_STRIDE: typeof GL_UNIFORM_MATRIX_STRIDE;
declare const Rn_GL_UNIFORM_OFFSET: typeof GL_UNIFORM_OFFSET;
declare const Rn_GL_UNIFORM_SIZE: typeof GL_UNIFORM_SIZE;
declare const Rn_GL_UNIFORM_TYPE: typeof GL_UNIFORM_TYPE;
declare const Rn_GL_UNMASKED_RENDERER_WEBGL: typeof GL_UNMASKED_RENDERER_WEBGL;
declare const Rn_GL_UNMASKED_VENDOR_WEBGL: typeof GL_UNMASKED_VENDOR_WEBGL;
declare const Rn_GL_UNPACK_ALIGNMENT: typeof GL_UNPACK_ALIGNMENT;
declare const Rn_GL_UNPACK_COLORSPACE_CONVERSION_WEBGL: typeof GL_UNPACK_COLORSPACE_CONVERSION_WEBGL;
declare const Rn_GL_UNPACK_FLIP_Y_WEBGL: typeof GL_UNPACK_FLIP_Y_WEBGL;
declare const Rn_GL_UNPACK_IMAGE_HEIGHT: typeof GL_UNPACK_IMAGE_HEIGHT;
declare const Rn_GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL: typeof GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL;
declare const Rn_GL_UNPACK_ROW_LENGTH: typeof GL_UNPACK_ROW_LENGTH;
declare const Rn_GL_UNPACK_SKIP_IMAGES: typeof GL_UNPACK_SKIP_IMAGES;
declare const Rn_GL_UNPACK_SKIP_PIXELS: typeof GL_UNPACK_SKIP_PIXELS;
declare const Rn_GL_UNPACK_SKIP_ROWS: typeof GL_UNPACK_SKIP_ROWS;
declare const Rn_GL_UNSIGNALED: typeof GL_UNSIGNALED;
declare const Rn_GL_UNSIGNED_INT_10F_11F_11F_REV: typeof GL_UNSIGNED_INT_10F_11F_11F_REV;
declare const Rn_GL_UNSIGNED_INT_24_8: typeof GL_UNSIGNED_INT_24_8;
declare const Rn_GL_UNSIGNED_INT_24_8_WEBGL: typeof GL_UNSIGNED_INT_24_8_WEBGL;
declare const Rn_GL_UNSIGNED_INT_2_10_10_10_REV: typeof GL_UNSIGNED_INT_2_10_10_10_REV;
declare const Rn_GL_UNSIGNED_INT_5_9_9_9_REV: typeof GL_UNSIGNED_INT_5_9_9_9_REV;
declare const Rn_GL_UNSIGNED_INT_SAMPLER_2D: typeof GL_UNSIGNED_INT_SAMPLER_2D;
declare const Rn_GL_UNSIGNED_INT_SAMPLER_2D_ARRAY: typeof GL_UNSIGNED_INT_SAMPLER_2D_ARRAY;
declare const Rn_GL_UNSIGNED_INT_SAMPLER_3D: typeof GL_UNSIGNED_INT_SAMPLER_3D;
declare const Rn_GL_UNSIGNED_INT_SAMPLER_CUBE: typeof GL_UNSIGNED_INT_SAMPLER_CUBE;
declare const Rn_GL_UNSIGNED_INT_VEC2: typeof GL_UNSIGNED_INT_VEC2;
declare const Rn_GL_UNSIGNED_INT_VEC3: typeof GL_UNSIGNED_INT_VEC3;
declare const Rn_GL_UNSIGNED_INT_VEC4: typeof GL_UNSIGNED_INT_VEC4;
declare const Rn_GL_UNSIGNED_NORMALIZED: typeof GL_UNSIGNED_NORMALIZED;
declare const Rn_GL_UNSIGNED_NORMALIZED_EXT: typeof GL_UNSIGNED_NORMALIZED_EXT;
declare const Rn_GL_VALIDATE_STATUS: typeof GL_VALIDATE_STATUS;
declare const Rn_GL_VENDOR: typeof GL_VENDOR;
declare const Rn_GL_VERSION: typeof GL_VERSION;
declare const Rn_GL_VERTEX_ARRAY_BINDING: typeof GL_VERTEX_ARRAY_BINDING;
declare const Rn_GL_VERTEX_ARRAY_BINDING_OES: typeof GL_VERTEX_ARRAY_BINDING_OES;
declare const Rn_GL_VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: typeof GL_VERTEX_ATTRIB_ARRAY_BUFFER_BINDING;
declare const Rn_GL_VERTEX_ATTRIB_ARRAY_DIVISOR: typeof GL_VERTEX_ATTRIB_ARRAY_DIVISOR;
declare const Rn_GL_VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE: typeof GL_VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE;
declare const Rn_GL_VERTEX_ATTRIB_ARRAY_ENABLED: typeof GL_VERTEX_ATTRIB_ARRAY_ENABLED;
declare const Rn_GL_VERTEX_ATTRIB_ARRAY_INTEGER: typeof GL_VERTEX_ATTRIB_ARRAY_INTEGER;
declare const Rn_GL_VERTEX_ATTRIB_ARRAY_NORMALIZED: typeof GL_VERTEX_ATTRIB_ARRAY_NORMALIZED;
declare const Rn_GL_VERTEX_ATTRIB_ARRAY_POINTER: typeof GL_VERTEX_ATTRIB_ARRAY_POINTER;
declare const Rn_GL_VERTEX_ATTRIB_ARRAY_SIZE: typeof GL_VERTEX_ATTRIB_ARRAY_SIZE;
declare const Rn_GL_VERTEX_ATTRIB_ARRAY_STRIDE: typeof GL_VERTEX_ATTRIB_ARRAY_STRIDE;
declare const Rn_GL_VERTEX_ATTRIB_ARRAY_TYPE: typeof GL_VERTEX_ATTRIB_ARRAY_TYPE;
declare const Rn_GL_VERTEX_SHADER: typeof GL_VERTEX_SHADER;
declare const Rn_GL_VIEWPORT: typeof GL_VIEWPORT;
declare const Rn_GL_WAIT_FAILED: typeof GL_WAIT_FAILED;
declare const Rn_GL_ZERO: typeof GL_ZERO;
type Rn_GaussianBlur = GaussianBlur;
declare const Rn_GaussianBlur: typeof GaussianBlur;
declare const Rn_GetComponentFromEntities: typeof GetComponentFromEntities;
type Rn_GetInstance<TBase> = GetInstance<TBase>;
type Rn_GetProps<TBase> = GetProps<TBase>;
type Rn_Gizmo = Gizmo;
declare const Rn_Gizmo: typeof Gizmo;
type Rn_GlobalDataRepository = GlobalDataRepository;
declare const Rn_GlobalDataRepository: typeof GlobalDataRepository;
type Rn_GlobalRetarget = GlobalRetarget;
declare const Rn_GlobalRetarget: typeof GlobalRetarget;
type Rn_GlobalRetargetReverse = GlobalRetargetReverse;
declare const Rn_GlobalRetargetReverse: typeof GlobalRetargetReverse;
type Rn_Gltf1AnyObject = Gltf1AnyObject;
type Rn_Gltf2 = Gltf2;
type Rn_Gltf2Accessor = Gltf2Accessor;
type Rn_Gltf2AccessorComponentType = Gltf2AccessorComponentType;
type Rn_Gltf2AccessorComponentTypeNumber = Gltf2AccessorComponentTypeNumber;
type Rn_Gltf2AccessorCompositionType = Gltf2AccessorCompositionType;
type Rn_Gltf2AccessorCompositionTypeString = Gltf2AccessorCompositionTypeString;
type Rn_Gltf2AccessorEx = Gltf2AccessorEx;
type Rn_Gltf2AccessorIndex = Gltf2AccessorIndex;
type Rn_Gltf2Animation = Gltf2Animation;
type Rn_Gltf2AnimationAccessorCompositionType = Gltf2AnimationAccessorCompositionType;
type Rn_Gltf2AnimationAccessorCompositionTypeString = Gltf2AnimationAccessorCompositionTypeString;
type Rn_Gltf2AnimationChannel = Gltf2AnimationChannel;
type Rn_Gltf2AnimationChannelTarget = Gltf2AnimationChannelTarget;
type Rn_Gltf2AnimationPathName = Gltf2AnimationPathName;
type Rn_Gltf2AnimationSampler = Gltf2AnimationSampler;
type Rn_Gltf2AnimationSamplerInterpolation = Gltf2AnimationSamplerInterpolation;
type Rn_Gltf2AnyObject = Gltf2AnyObject;
type Rn_Gltf2Asset = Gltf2Asset;
type Rn_Gltf2AttributeAccessors = Gltf2AttributeAccessors;
type Rn_Gltf2AttributeBlendShapes = Gltf2AttributeBlendShapes;
type Rn_Gltf2AttributeBlendShapesAccessors = Gltf2AttributeBlendShapesAccessors;
type Rn_Gltf2Attributes = Gltf2Attributes;
type Rn_Gltf2Buffer = Gltf2Buffer;
type Rn_Gltf2BufferView = Gltf2BufferView;
type Rn_Gltf2BufferViewEx = Gltf2BufferViewEx;
type Rn_Gltf2Camera = Gltf2Camera;
type Rn_Gltf2CameraOrthographic = Gltf2CameraOrthographic;
type Rn_Gltf2CameraPerspective = Gltf2CameraPerspective;
type Rn_Gltf2Ex = Gltf2Ex;
type Rn_Gltf2ExportType = Gltf2ExportType;
type Rn_Gltf2Exporter = Gltf2Exporter;
declare const Rn_Gltf2Exporter: typeof Gltf2Exporter;
type Rn_Gltf2ExporterArguments = Gltf2ExporterArguments;
type Rn_Gltf2Image = Gltf2Image;
type Rn_Gltf2ImageEx = Gltf2ImageEx;
type Rn_Gltf2Importer = Gltf2Importer;
declare const Rn_Gltf2Importer: typeof Gltf2Importer;
type Rn_Gltf2Material = Gltf2Material;
type Rn_Gltf2MaterialEx = Gltf2MaterialEx;
type Rn_Gltf2Mesh = Gltf2Mesh;
type Rn_Gltf2Node = Gltf2Node;
type Rn_Gltf2NormalTextureInfo = Gltf2NormalTextureInfo;
type Rn_Gltf2OcclusionTextureInfo = Gltf2OcclusionTextureInfo;
type Rn_Gltf2PbrMetallicRoughness = Gltf2PbrMetallicRoughness;
type Rn_Gltf2PbrMetallicRoughnessEx = Gltf2PbrMetallicRoughnessEx;
type Rn_Gltf2Primitive = Gltf2Primitive;
type Rn_Gltf2Scene = Gltf2Scene;
type Rn_Gltf2Skin = Gltf2Skin;
type Rn_Gltf2Sparse = Gltf2Sparse;
type Rn_Gltf2SparseIndices = Gltf2SparseIndices;
type Rn_Gltf2SparseValues = Gltf2SparseValues;
type Rn_Gltf2Texture = Gltf2Texture;
type Rn_Gltf2TextureInfo = Gltf2TextureInfo;
type Rn_Gltf2TextureSampler = Gltf2TextureSampler;
type Rn_GltfFileBuffers = GltfFileBuffers;
type Rn_GltfImporter = GltfImporter;
declare const Rn_GltfImporter: typeof GltfImporter;
type Rn_GltfLoadOption = GltfLoadOption;
type Rn_GreaterShaderNode = GreaterShaderNode;
declare const Rn_GreaterShaderNode: typeof GreaterShaderNode;
type Rn_Grid = Grid;
declare const Rn_Grid: typeof Grid;
type Rn_GridDescriptor = GridDescriptor;
declare const Rn_HdriFormat: typeof HdriFormat;
type Rn_HdriFormatEnum = HdriFormatEnum;
type Rn_IAnimationEntity = IAnimationEntity;
type Rn_IAnimationEntityMethods = IAnimationEntityMethods;
type Rn_IAnimationRetarget = IAnimationRetarget;
type Rn_IAnimationStateEntity = IAnimationStateEntity;
type Rn_IAnyPrimitiveDescriptor = IAnyPrimitiveDescriptor;
type Rn_IArrayBufferBasedMathNumber = IArrayBufferBasedMathNumber;
type Rn_IBlendShapeEntity = IBlendShapeEntity;
type Rn_IBlendShapeEntityMethods = IBlendShapeEntityMethods;
type Rn_ICGAPIResourceRepository = ICGAPIResourceRepository;
type Rn_ICameraController = ICameraController;
type Rn_ICameraControllerEntity = ICameraControllerEntity;
type Rn_ICameraControllerEntityMethods = ICameraControllerEntityMethods;
type Rn_ICameraEntity = ICameraEntity;
type Rn_ICameraEntityMethods = ICameraEntityMethods;
type Rn_IColorRgb = IColorRgb;
type Rn_IColorRgba = IColorRgba;
type Rn_IConstraintEntity = IConstraintEntity;
type Rn_IEffekseerEntityMethods = IEffekseerEntityMethods;
type Rn_IEnhancedArrayMethods = IEnhancedArrayMethods;
type Rn_IEntity = IEntity;
type Rn_IEventPubSub = IEventPubSub;
type Rn_ILightEntity = ILightEntity;
type Rn_ILightEntityMethods = ILightEntityMethods;
type Rn_ILoaderExtension = ILoaderExtension;
type Rn_ILogQuaternion = ILogQuaternion;
type Rn_IMatrix = IMatrix;
type Rn_IMatrix22 = IMatrix22;
type Rn_IMatrix33 = IMatrix33;
type Rn_IMatrix44 = IMatrix44;
type Rn_IMesh = IMesh;
type Rn_IMeshEntity = IMeshEntity;
type Rn_IMeshEntityMethods = IMeshEntityMethods;
type Rn_IMeshRendererEntityMethods = IMeshRendererEntityMethods;
type Rn_IMutableColorRgb = IMutableColorRgb;
type Rn_IMutableColorRgba = IMutableColorRgba;
type Rn_IMutableMatrix = IMutableMatrix;
type Rn_IMutableMatrix22 = IMutableMatrix22;
type Rn_IMutableMatrix33 = IMutableMatrix33;
type Rn_IMutableMatrix44 = IMutableMatrix44;
type Rn_IMutableQuaternion = IMutableQuaternion;
type Rn_IMutableScalar = IMutableScalar;
type Rn_IMutableVector = IMutableVector;
type Rn_IMutableVector2 = IMutableVector2;
type Rn_IMutableVector3 = IMutableVector3;
type Rn_IMutableVector4 = IMutableVector4;
declare const Rn_INPUT_HANDLING_STATE_CAMERA_CONTROLLER: typeof INPUT_HANDLING_STATE_CAMERA_CONTROLLER;
declare const Rn_INPUT_HANDLING_STATE_GIZMO_SCALE: typeof INPUT_HANDLING_STATE_GIZMO_SCALE;
declare const Rn_INPUT_HANDLING_STATE_GIZMO_TRANSLATION: typeof INPUT_HANDLING_STATE_GIZMO_TRANSLATION;
declare const Rn_INPUT_HANDLING_STATE_NONE: typeof INPUT_HANDLING_STATE_NONE;
type Rn_IPhysicsEntity = IPhysicsEntity;
type Rn_IPhysicsEntityMethods = IPhysicsEntityMethods;
type Rn_IQuaternion = IQuaternion;
type Rn_IRenderable = IRenderable;
type Rn_IRnObject = IRnObject;
type Rn_IScalar = IScalar;
type Rn_ISceneGraphEntity = ISceneGraphEntity;
type Rn_ISceneGraphEntityMethods = ISceneGraphEntityMethods;
type Rn_ISemanticVertexAttribute = ISemanticVertexAttribute;
type Rn_IShape = IShape;
declare const Rn_IShape: typeof IShape;
type Rn_ISkeletalEntity = ISkeletalEntity;
type Rn_ISkeletalEntityMethods = ISkeletalEntityMethods;
type Rn_ITransformEntity = ITransformEntity;
type Rn_ITransformEntityMethods = ITransformEntityMethods;
type Rn_IVector = IVector;
type Rn_IVector2 = IVector2;
type Rn_IVector3 = IVector3;
type Rn_IVector4 = IVector4;
type Rn_IVrmEntityMethods = IVrmEntityMethods;
type Rn_IWeakOption<B extends object, T> = IWeakOption<B, T>;
type Rn_IdentityMatrix33 = IdentityMatrix33;
declare const Rn_IdentityMatrix33: typeof IdentityMatrix33;
type Rn_IdentityMatrix44 = IdentityMatrix44;
declare const Rn_IdentityMatrix44: typeof IdentityMatrix44;
type Rn_IfStatementShader = IfStatementShader;
declare const Rn_IfStatementShader: typeof IfStatementShader;
type Rn_IfStatementShaderNode = IfStatementShaderNode;
declare const Rn_IfStatementShaderNode: typeof IfStatementShaderNode;
type Rn_ImageBitmapData = ImageBitmapData;
type Rn_ImageInfo = ImageInfo;
declare const Rn_ImageInfo: typeof ImageInfo;
declare const Rn_ImageUtil: typeof ImageUtil;
type Rn_Index = Index;
type Rn_IndexOf16Bytes = IndexOf16Bytes;
type Rn_IndexOf4Bytes = IndexOf4Bytes;
type Rn_IndicesAccessOption = IndicesAccessOption;
type Rn_InputHandlerInfo = InputHandlerInfo;
type Rn_InputHandlingState = InputHandlingState;
type Rn_InputManager = InputManager;
declare const Rn_InputManager: typeof InputManager;
type Rn_IntegerTypedArray = IntegerTypedArray;
declare const Rn_Is: typeof Is;
declare const Rn_IsObj: typeof IsObj;
type Rn_IsType = IsType;
type Rn_Joint = Joint;
declare const Rn_Joint: typeof Joint;
type Rn_JointDescriptor = JointDescriptor;
type Rn_KHR_interactivity = KHR_interactivity;
type Rn_KHR_interactivity_Configuration = KHR_interactivity_Configuration;
type Rn_KHR_interactivity_Declaration = KHR_interactivity_Declaration;
type Rn_KHR_interactivity_Event = KHR_interactivity_Event;
type Rn_KHR_interactivity_Flow = KHR_interactivity_Flow;
type Rn_KHR_interactivity_Graph = KHR_interactivity_Graph;
type Rn_KHR_interactivity_Node = KHR_interactivity_Node;
type Rn_KHR_interactivity_Type = KHR_interactivity_Type;
type Rn_KHR_interactivity_Value = KHR_interactivity_Value;
type Rn_KHR_interactivity_Variable = KHR_interactivity_Variable;
type Rn_KHR_interactivity_value_type = KHR_interactivity_value_type;
type Rn_KHR_lights_punctual = KHR_lights_punctual;
type Rn_KHR_lights_punctual_Light = KHR_lights_punctual_Light;
type Rn_KTX2TextureLoader = KTX2TextureLoader;
declare const Rn_KTX2TextureLoader: typeof KTX2TextureLoader;
type Rn_LightComponent = LightComponent;
declare const Rn_LightComponent: typeof LightComponent;
type Rn_LightGizmo = LightGizmo;
declare const Rn_LightGizmo: typeof LightGizmo;
declare const Rn_LightType: typeof LightType;
type Rn_LightTypeEnum = LightTypeEnum;
type Rn_Line = Line;
declare const Rn_Line: typeof Line;
type Rn_LineDescriptor = LineDescriptor;
type Rn_LoadImageToMipLevelDescriptor = LoadImageToMipLevelDescriptor;
type Rn_LocatorGizmo = LocatorGizmo;
declare const Rn_LocatorGizmo: typeof LocatorGizmo;
type Rn_LogLevel = LogLevel;
declare const Rn_LogLevel: typeof LogLevel;
type Rn_LogQuaternion = LogQuaternion;
declare const Rn_LogQuaternion: typeof LogQuaternion;
type Rn_Logger = Logger;
declare const Rn_Logger: typeof Logger;
type Rn_MSC_TRANSCODER = MSC_TRANSCODER;
type Rn_MToon0xMaterialContent = MToon0xMaterialContent;
declare const Rn_MToon0xMaterialContent: typeof MToon0xMaterialContent;
type Rn_MToon1MaterialContent = MToon1MaterialContent;
declare const Rn_MToon1MaterialContent: typeof MToon1MaterialContent;
type Rn_MatCapMaterialContent = MatCapMaterialContent;
declare const Rn_MatCapMaterialContent: typeof MatCapMaterialContent;
type Rn_Material = Material;
declare const Rn_Material: typeof Material;
declare const Rn_MaterialHelper: typeof MaterialHelper;
type Rn_MaterialRepository = MaterialRepository;
declare const Rn_MaterialRepository: typeof MaterialRepository;
type Rn_MaterialSID = MaterialSID;
type Rn_MaterialTID = MaterialTID;
type Rn_MaterialTypeName = MaterialTypeName;
type Rn_MaterialUID = MaterialUID;
type Rn_MathClassUtil = MathClassUtil;
declare const Rn_MathClassUtil: typeof MathClassUtil;
declare const Rn_MathUtil: typeof MathUtil;
type Rn_Matrix22 = Matrix22;
declare const Rn_Matrix22: typeof Matrix22;
type Rn_Matrix33 = Matrix33;
declare const Rn_Matrix33: typeof Matrix33;
type Rn_Matrix44 = Matrix44;
declare const Rn_Matrix44: typeof Matrix44;
type Rn_MemoryManager = MemoryManager;
declare const Rn_MemoryManager: typeof MemoryManager;
type Rn_MergeCtor<A, B> = MergeCtor<A, B>;
type Rn_MergeVectorShaderNode = MergeVectorShaderNode;
declare const Rn_MergeVectorShaderNode: typeof MergeVectorShaderNode;
type Rn_Mesh = Mesh;
declare const Rn_Mesh: typeof Mesh;
type Rn_MeshComponent = MeshComponent;
declare const Rn_MeshComponent: typeof MeshComponent;
declare const Rn_MeshHelper: typeof MeshHelper;
type Rn_MeshRendererComponent = MeshRendererComponent;
declare const Rn_MeshRendererComponent: typeof MeshRendererComponent;
type Rn_MeshUID = MeshUID;
type Rn_MilliSecond = MilliSecond;
declare const Rn_MiscUtil: typeof MiscUtil;
type Rn_MixinBase = MixinBase;
type Rn_ModelConverter = ModelConverter;
declare const Rn_ModelConverter: typeof ModelConverter;
type Rn_ModuleManager = ModuleManager;
declare const Rn_ModuleManager: typeof ModuleManager;
type Rn_MscTranscoderModule = MscTranscoderModule;
type Rn_MultiplyShaderNode = MultiplyShaderNode;
declare const Rn_MultiplyShaderNode: typeof MultiplyShaderNode;
type Rn_MutableColorRgb = MutableColorRgb;
declare const Rn_MutableColorRgb: typeof MutableColorRgb;
type Rn_MutableColorRgba = MutableColorRgba;
declare const Rn_MutableColorRgba: typeof MutableColorRgba;
type Rn_MutableMatrix22 = MutableMatrix22;
declare const Rn_MutableMatrix22: typeof MutableMatrix22;
type Rn_MutableMatrix33 = MutableMatrix33;
declare const Rn_MutableMatrix33: typeof MutableMatrix33;
type Rn_MutableMatrix44 = MutableMatrix44;
declare const Rn_MutableMatrix44: typeof MutableMatrix44;
type Rn_MutableQuaternion = MutableQuaternion;
declare const Rn_MutableQuaternion: typeof MutableQuaternion;
type Rn_MutableScalar = MutableScalar;
declare const Rn_MutableScalar: typeof MutableScalar;
type Rn_MutableScalar_<T extends TypedArrayConstructor> = MutableScalar_<T>;
declare const Rn_MutableScalar_: typeof MutableScalar_;
type Rn_MutableScalard = MutableScalard;
declare const Rn_MutableScalard: typeof MutableScalard;
type Rn_MutableScalarf = MutableScalarf;
type Rn_MutableVector2 = MutableVector2;
declare const Rn_MutableVector2: typeof MutableVector2;
type Rn_MutableVector2_<T extends FloatTypedArrayConstructor> = MutableVector2_<T>;
declare const Rn_MutableVector2_: typeof MutableVector2_;
type Rn_MutableVector2d = MutableVector2d;
declare const Rn_MutableVector2d: typeof MutableVector2d;
type Rn_MutableVector2f = MutableVector2f;
type Rn_MutableVector3 = MutableVector3;
declare const Rn_MutableVector3: typeof MutableVector3;
type Rn_MutableVector3_<T extends FloatTypedArrayConstructor> = MutableVector3_<T>;
declare const Rn_MutableVector3_: typeof MutableVector3_;
type Rn_MutableVector3d = MutableVector3d;
declare const Rn_MutableVector3d: typeof MutableVector3d;
type Rn_MutableVector3f = MutableVector3f;
type Rn_MutableVector4 = MutableVector4;
declare const Rn_MutableVector4: typeof MutableVector4;
type Rn_MutableVector4_<T extends FloatTypedArrayConstructor> = MutableVector4_<T>;
declare const Rn_MutableVector4_: typeof MutableVector4_;
type Rn_MutableVector4d = MutableVector4d;
declare const Rn_MutableVector4d: typeof MutableVector4d;
type Rn_MutableVector4f = MutableVector4f;
type Rn_None = None;
declare const Rn_None: typeof None;
type Rn_NormalMatrixShaderNode = NormalMatrixShaderNode;
declare const Rn_NormalMatrixShaderNode: typeof NormalMatrixShaderNode;
type Rn_NormalizeShaderNode = NormalizeShaderNode;
declare const Rn_NormalizeShaderNode: typeof NormalizeShaderNode;
type Rn_ObjectUID = ObjectUID;
type Rn_Offset = Offset;
type Rn_OimoPhysicsStrategy = OimoPhysicsStrategy;
declare const Rn_OimoPhysicsStrategy: typeof OimoPhysicsStrategy;
type Rn_Ok<T, ErrObj> = Ok<T, ErrObj>;
declare const Rn_Ok: typeof Ok;
type Rn_Option<T> = Option<T>;
type Rn_OrbitCameraController = OrbitCameraController;
declare const Rn_OrbitCameraController: typeof OrbitCameraController;
type Rn_OutColorShaderNode = OutColorShaderNode;
declare const Rn_OutColorShaderNode: typeof OutColorShaderNode;
type Rn_OutPositionShaderNode = OutPositionShaderNode;
declare const Rn_OutPositionShaderNode: typeof OutPositionShaderNode;
type Rn_PartialRequire<O, K extends keyof O> = PartialRequire<O, K>;
type Rn_PhysicsComponent = PhysicsComponent;
declare const Rn_PhysicsComponent: typeof PhysicsComponent;
type Rn_PhysicsProperty = PhysicsProperty;
type Rn_PhysicsPropertyInner = PhysicsPropertyInner;
type Rn_PhysicsStrategy = PhysicsStrategy;
type Rn_PhysicsWorldProperty = PhysicsWorldProperty;
declare const Rn_PixelFormat: typeof PixelFormat;
type Rn_PixelFormatEnum = PixelFormatEnum;
type Rn_Plane = Plane;
declare const Rn_Plane: typeof Plane;
type Rn_PlaneDescriptor = PlaneDescriptor;
type Rn_PointShadowMap = PointShadowMap;
declare const Rn_PointShadowMap: typeof PointShadowMap;
type Rn_PointType = PointType;
type Rn_Primitive = Primitive;
declare const Rn_Primitive: typeof Primitive;
type Rn_PrimitiveDescriptor = PrimitiveDescriptor;
declare const Rn_PrimitiveMode: typeof PrimitiveMode;
type Rn_PrimitiveModeEnum = PrimitiveModeEnum;
type Rn_PrimitiveSortKey = PrimitiveSortKey;
type Rn_PrimitiveSortKeyLength = PrimitiveSortKeyLength;
type Rn_PrimitiveSortKeyOffset = PrimitiveSortKeyOffset;
declare const Rn_PrimitiveSortKey_BitLength_Depth: typeof PrimitiveSortKey_BitLength_Depth;
declare const Rn_PrimitiveSortKey_BitLength_Material: typeof PrimitiveSortKey_BitLength_Material;
declare const Rn_PrimitiveSortKey_BitLength_PrimitiveType: typeof PrimitiveSortKey_BitLength_PrimitiveType;
declare const Rn_PrimitiveSortKey_BitLength_TranslucencyType: typeof PrimitiveSortKey_BitLength_TranslucencyType;
declare const Rn_PrimitiveSortKey_BitOffset_Material: typeof PrimitiveSortKey_BitOffset_Material;
declare const Rn_PrimitiveSortKey_BitOffset_PrimitiveType: typeof PrimitiveSortKey_BitOffset_PrimitiveType;
declare const Rn_PrimitiveSortKey_BitOffset_TranslucencyType: typeof PrimitiveSortKey_BitOffset_TranslucencyType;
declare const Rn_PrimitiveSortKey_BitOffset_ViewportLayer: typeof PrimitiveSortKey_BitOffset_ViewportLayer;
type Rn_PrimitiveUID = PrimitiveUID;
declare const Rn_ProcessApproach: typeof ProcessApproach;
type Rn_ProcessApproachClass = ProcessApproachClass;
declare const Rn_ProcessApproachClass: typeof ProcessApproachClass;
type Rn_ProcessApproachEnum = ProcessApproachEnum;
declare const Rn_ProcessStage: typeof ProcessStage;
type Rn_ProcessStageEnum = ProcessStageEnum;
type Rn_ProjectionMatrixShaderNode = ProjectionMatrixShaderNode;
declare const Rn_ProjectionMatrixShaderNode: typeof ProjectionMatrixShaderNode;
type Rn_Quaternion = Quaternion;
declare const Rn_Quaternion: typeof Quaternion;
type Rn_RaycastResult = RaycastResult;
type Rn_RaycastResultEx1 = RaycastResultEx1;
type Rn_RaycastResultEx2 = RaycastResultEx2;
type Rn_RenderBuffer = RenderBuffer;
declare const Rn_RenderBuffer: typeof RenderBuffer;
declare const Rn_RenderBufferTarget: typeof RenderBufferTarget;
type Rn_RenderBufferTargetEnum = RenderBufferTargetEnum;
type Rn_RenderPass = RenderPass;
declare const Rn_RenderPass: typeof RenderPass;
declare const Rn_RenderPassHelper: typeof RenderPassHelper;
type Rn_RenderPassUID = RenderPassUID;
type Rn_RenderTargetTexture = RenderTargetTexture;
declare const Rn_RenderTargetTexture: typeof RenderTargetTexture;
type Rn_RenderTargetTexture2DArray = RenderTargetTexture2DArray;
declare const Rn_RenderTargetTexture2DArray: typeof RenderTargetTexture2DArray;
type Rn_RenderTargetTextureCube = RenderTargetTextureCube;
declare const Rn_RenderTargetTextureCube: typeof RenderTargetTextureCube;
declare const Rn_RenderableHelper: typeof RenderableHelper;
type Rn_RenderingArgWebGL = RenderingArgWebGL;
type Rn_RenderingArgWebGpu = RenderingArgWebGpu;
type Rn_RequireOne<T, K extends keyof T = keyof T> = RequireOne<T, K>;
type Rn_Result<T, ErrObj> = Result<T, ErrObj>;
type Rn_RhodoniteImportExtension = RhodoniteImportExtension;
declare const Rn_RhodoniteImportExtension: typeof RhodoniteImportExtension;
type Rn_RnError<ErrObj> = RnError<ErrObj>;
type Rn_RnException<ErrObj> = RnException<ErrObj>;
declare const Rn_RnException: typeof RnException;
type Rn_RnM2 = RnM2;
type Rn_RnM2Accessor = RnM2Accessor;
type Rn_RnM2Animation = RnM2Animation;
type Rn_RnM2AnimationChannel = RnM2AnimationChannel;
type Rn_RnM2AnimationChannelTarget = RnM2AnimationChannelTarget;
type Rn_RnM2AnimationSampler = RnM2AnimationSampler;
type Rn_RnM2Asset = RnM2Asset;
type Rn_RnM2AttributeAccessors = RnM2AttributeAccessors;
type Rn_RnM2AttributeBlendShapes = RnM2AttributeBlendShapes;
type Rn_RnM2AttributeBlendShapesAccessors = RnM2AttributeBlendShapesAccessors;
type Rn_RnM2Attributes = RnM2Attributes;
type Rn_RnM2AttributesObject = RnM2AttributesObject;
type Rn_RnM2Buffer = RnM2Buffer;
type Rn_RnM2BufferView = RnM2BufferView;
type Rn_RnM2Camera = RnM2Camera;
type Rn_RnM2CameraOrthographic = RnM2CameraOrthographic;
type Rn_RnM2CameraPerspective = RnM2CameraPerspective;
type Rn_RnM2ExtensionEffekseer = RnM2ExtensionEffekseer;
type Rn_RnM2ExtensionsEffekseerEffect = RnM2ExtensionsEffekseerEffect;
type Rn_RnM2ExtensionsEffekseerTimeline = RnM2ExtensionsEffekseerTimeline;
type Rn_RnM2ExtensionsEffekseerTimelineItem = RnM2ExtensionsEffekseerTimelineItem;
type Rn_RnM2Image = RnM2Image;
type Rn_RnM2Material = RnM2Material;
type Rn_RnM2MaterialVariant = RnM2MaterialVariant;
type Rn_RnM2Mesh = RnM2Mesh;
type Rn_RnM2Node = RnM2Node;
type Rn_RnM2NormalTextureInfo = RnM2NormalTextureInfo;
type Rn_RnM2OcclusionTextureInfo = RnM2OcclusionTextureInfo;
type Rn_RnM2PbrMetallicRoughness = RnM2PbrMetallicRoughness;
type Rn_RnM2Primitive = RnM2Primitive;
type Rn_RnM2Scene = RnM2Scene;
type Rn_RnM2Skin = RnM2Skin;
type Rn_RnM2Sparse = RnM2Sparse;
type Rn_RnM2SparseIndices = RnM2SparseIndices;
type Rn_RnM2SparseValues = RnM2SparseValues;
type Rn_RnM2Texture = RnM2Texture;
type Rn_RnM2TextureInfo = RnM2TextureInfo;
type Rn_RnM2TextureSampler = RnM2TextureSampler;
type Rn_RnM2Vrma = RnM2Vrma;
type Rn_RnObject = RnObject;
declare const Rn_RnObject: typeof RnObject;
type Rn_RnPromise<T> = RnPromise<T>;
declare const Rn_RnPromise: typeof RnPromise;
type Rn_RnPromiseCallback = RnPromiseCallback;
type Rn_RnPromiseCallbackObj = RnPromiseCallbackObj;
type Rn_RnTags = RnTags;
type Rn_RnWebGLProgram = RnWebGLProgram;
type Rn_RnWebGLTexture = RnWebGLTexture;
type Rn_RnXR = RnXR;
type Rn_Sampler = Sampler;
declare const Rn_Sampler: typeof Sampler;
type Rn_SamplerDescriptor = SamplerDescriptor;
type Rn_Scalar_<T extends TypedArrayConstructor> = Scalar_<T>;
declare const Rn_Scalar_: typeof Scalar_;
type Rn_Scalard = Scalard;
declare const Rn_Scalard: typeof Scalard;
type Rn_Scalarf = Scalarf;
type Rn_ScaleGizmo = ScaleGizmo;
declare const Rn_ScaleGizmo: typeof ScaleGizmo;
type Rn_SceneGraphComponent = SceneGraphComponent;
declare const Rn_SceneGraphComponent: typeof SceneGraphComponent;
type Rn_Second = Second;
type Rn_ShaderAttributeOrSemanticsOrString = ShaderAttributeOrSemanticsOrString;
type Rn_ShaderGraphResolver = ShaderGraphResolver;
declare const Rn_ShaderGraphResolver: typeof ShaderGraphResolver;
declare const Rn_ShaderNode: typeof ShaderNode;
type Rn_ShaderNodeEnum = ShaderNodeEnum;
type Rn_ShaderNodeJson = ShaderNodeJson;
type Rn_ShaderNodeJsonConnection = ShaderNodeJsonConnection;
type Rn_ShaderNodeJsonNode = ShaderNodeJsonNode;
type Rn_ShaderNodeJsonNodeInput = ShaderNodeJsonNodeInput;
type Rn_ShaderNodeJsonNodeOutput = ShaderNodeJsonNodeOutput;
type Rn_ShaderNodeUID = ShaderNodeUID;
declare const Rn_ShaderSemantics: typeof ShaderSemantics;
type Rn_ShaderSemanticsClass = ShaderSemanticsClass;
declare const Rn_ShaderSemanticsClass: typeof ShaderSemanticsClass;
type Rn_ShaderSemanticsEnum = ShaderSemanticsEnum;
type Rn_ShaderSemanticsIndex = ShaderSemanticsIndex;
type Rn_ShaderSemanticsInfo = ShaderSemanticsInfo;
type Rn_ShaderSemanticsName = ShaderSemanticsName;
type Rn_ShaderSocket = ShaderSocket;
type Rn_ShaderSources = ShaderSources;
declare const Rn_ShaderType: typeof ShaderType;
type Rn_ShaderTypeEnum = ShaderTypeEnum;
type Rn_ShaderVariable = ShaderVariable;
declare const Rn_ShaderVariableType: typeof ShaderVariableType;
type Rn_ShaderVariableTypeEnum = ShaderVariableTypeEnum;
type Rn_ShaderityUtilityWebGL = ShaderityUtilityWebGL;
declare const Rn_ShaderityUtilityWebGL: typeof ShaderityUtilityWebGL;
declare const Rn_ShadingModel: typeof ShadingModel;
type Rn_ShadingModelEnum = ShadingModelEnum;
type Rn_ShadowMap = ShadowMap;
declare const Rn_ShadowMap: typeof ShadowMap;
type Rn_ShadowMapDecodeClassicMaterialContent = ShadowMapDecodeClassicMaterialContent;
declare const Rn_ShadowMapDecodeClassicMaterialContent: typeof ShadowMapDecodeClassicMaterialContent;
type Rn_ShadowMapEnum = ShadowMapEnum;
declare const Rn_ShadowMapType: typeof ShadowMapType;
type Rn_ShadowSystem = ShadowSystem;
declare const Rn_ShadowSystem: typeof ShadowSystem;
type Rn_SimpleVertexAttribute = SimpleVertexAttribute;
declare const Rn_SimpleVertexAttribute: typeof SimpleVertexAttribute;
type Rn_Size = Size;
type Rn_SkeletalComponent = SkeletalComponent;
declare const Rn_SkeletalComponent: typeof SkeletalComponent;
type Rn_Some<T> = Some<T>;
declare const Rn_Some: typeof Some;
type Rn_Sphere = Sphere;
declare const Rn_Sphere: typeof Sphere;
type Rn_SphereCollider = SphereCollider;
declare const Rn_SphereCollider: typeof SphereCollider;
type Rn_SphereDescriptor = SphereDescriptor;
type Rn_SplitVectorShaderNode = SplitVectorShaderNode;
declare const Rn_SplitVectorShaderNode: typeof SplitVectorShaderNode;
type Rn_SquareMatrixComponentN = SquareMatrixComponentN;
type Rn_SymbolWeakMap<V> = SymbolWeakMap<V>;
declare const Rn_SymbolWeakMap: typeof SymbolWeakMap;
type Rn_SynthesizeHdrMaterialContent = SynthesizeHdrMaterialContent;
declare const Rn_SynthesizeHdrMaterialContent: typeof SynthesizeHdrMaterialContent;
type Rn_System = System;
declare const Rn_System: typeof System;
declare const Rn_SystemState: typeof SystemState;
type Rn_Tag = Tag;
declare const Rn_TagGltf2NodeIndex: typeof TagGltf2NodeIndex;
type Rn_Texture = Texture;
declare const Rn_Texture: typeof Texture;
type Rn_TextureData = TextureData;
type Rn_TextureDataFloat = TextureDataFloat;
declare const Rn_TextureDataFloat: typeof TextureDataFloat;
type Rn_TextureFetchShader = TextureFetchShader;
declare const Rn_TextureFetchShader: typeof TextureFetchShader;
type Rn_TextureFormatEnum = TextureFormatEnum;
declare const Rn_TextureParameter: typeof TextureParameter;
type Rn_TextureParameterEnum = TextureParameterEnum;
type Rn_TextureParameters = TextureParameters;
type Rn_TextureUID = TextureUID;
type Rn_Time = Time;
declare const Rn_Time: typeof Time;
declare const Rn_ToneMappingType: typeof ToneMappingType;
type Rn_ToneMappingTypeEnum = ToneMappingTypeEnum;
type Rn_TranscodeTarget = TranscodeTarget;
type Rn_TranscodedImage = TranscodedImage;
type Rn_Transform3D = Transform3D;
declare const Rn_Transform3D: typeof Transform3D;
type Rn_TransformComponent = TransformComponent;
declare const Rn_TransformComponent: typeof TransformComponent;
type Rn_TranslationGizmo = TranslationGizmo;
declare const Rn_TranslationGizmo: typeof TranslationGizmo;
type Rn_TypedArray = TypedArray;
type Rn_TypedArrayConstructor = TypedArrayConstructor;
type Rn_UastcImageTranscoder = UastcImageTranscoder;
declare const Rn_UastcImageTranscoder: typeof UastcImageTranscoder;
type Rn_UniformDataShader = UniformDataShader;
declare const Rn_UniformDataShader: typeof UniformDataShader;
type Rn_UniformDataShaderNode = UniformDataShaderNode;
declare const Rn_UniformDataShaderNode: typeof UniformDataShaderNode;
declare const Rn_VERSION: typeof VERSION;
type Rn_VRM0x_Extension = VRM0x_Extension;
type Rn_VRMColliderGroup = VRMColliderGroup;
declare const Rn_VRMColliderGroup: typeof VRMColliderGroup;
type Rn_VRMSpring = VRMSpring;
declare const Rn_VRMSpring: typeof VRMSpring;
type Rn_VRMSpringBone = VRMSpringBone;
declare const Rn_VRMSpringBone: typeof VRMSpringBone;
type Rn_VRMSpringBonePhysicsStrategy = VRMSpringBonePhysicsStrategy;
declare const Rn_VRMSpringBonePhysicsStrategy: typeof VRMSpringBonePhysicsStrategy;
type Rn_VarianceShadowMapDecodeClassicMaterialContent = VarianceShadowMapDecodeClassicMaterialContent;
declare const Rn_VarianceShadowMapDecodeClassicMaterialContent: typeof VarianceShadowMapDecodeClassicMaterialContent;
type Rn_VaryingVariableShader = VaryingVariableShader;
declare const Rn_VaryingVariableShader: typeof VaryingVariableShader;
type Rn_Vector2 = Vector2;
declare const Rn_Vector2: typeof Vector2;
type Rn_Vector2_<T extends FloatTypedArrayConstructor> = Vector2_<T>;
declare const Rn_Vector2_: typeof Vector2_;
type Rn_Vector2d = Vector2d;
declare const Rn_Vector2d: typeof Vector2d;
type Rn_Vector2f = Vector2f;
type Rn_Vector3 = Vector3;
declare const Rn_Vector3: typeof Vector3;
type Rn_Vector3_<T extends FloatTypedArrayConstructor> = Vector3_<T>;
declare const Rn_Vector3_: typeof Vector3_;
type Rn_Vector3d = Vector3d;
declare const Rn_Vector3d: typeof Vector3d;
type Rn_Vector3f = Vector3f;
type Rn_Vector4 = Vector4;
declare const Rn_Vector4: typeof Vector4;
type Rn_Vector4_<T extends FloatTypedArrayConstructor> = Vector4_<T>;
declare const Rn_Vector4_: typeof Vector4_;
type Rn_Vector4d = Vector4d;
declare const Rn_Vector4d: typeof Vector4d;
type Rn_Vector4f = Vector4f;
type Rn_VectorAndSquareMatrixComponentN = VectorAndSquareMatrixComponentN;
type Rn_VectorComponentN = VectorComponentN;
type Rn_VectorCompositionTypes = VectorCompositionTypes;
type Rn_VectorN = VectorN;
declare const Rn_VectorN: typeof VectorN;
declare const Rn_VertexAttribute: typeof VertexAttribute;
type Rn_VertexAttributeClass = VertexAttributeClass;
declare const Rn_VertexAttributeClass: typeof VertexAttributeClass;
type Rn_VertexAttributeComponent = VertexAttributeComponent;
type Rn_VertexAttributeEnum = VertexAttributeEnum;
type Rn_VertexAttributeSemanticsJoinedString = VertexAttributeSemanticsJoinedString;
type Rn_VertexAttributeTypeName = VertexAttributeTypeName;
type Rn_VertexAttributesLayout = VertexAttributesLayout;
type Rn_VertexHandles = VertexHandles;
type Rn_VideoTexture = VideoTexture;
declare const Rn_VideoTexture: typeof VideoTexture;
type Rn_VideoTextureArguments = VideoTextureArguments;
type Rn_ViewMatrixShaderNode = ViewMatrixShaderNode;
declare const Rn_ViewMatrixShaderNode: typeof ViewMatrixShaderNode;
declare const Rn_Visibility: typeof Visibility;
type Rn_VisibilityEnum = VisibilityEnum;
type Rn_Vrm0x = Vrm0x;
type Rn_Vrm0xBlendShapeBind = Vrm0xBlendShapeBind;
type Rn_Vrm0xBlendShapeGroup = Vrm0xBlendShapeGroup;
type Rn_Vrm0xBoneGroup = Vrm0xBoneGroup;
type Rn_Vrm0xCollider = Vrm0xCollider;
type Rn_Vrm0xColliderGroup = Vrm0xColliderGroup;
type Rn_Vrm0xHumanBone = Vrm0xHumanBone;
type Rn_Vrm0xImporter = Vrm0xImporter;
declare const Rn_Vrm0xImporter: typeof Vrm0xImporter;
type Rn_Vrm0xLookAt = Vrm0xLookAt;
type Rn_Vrm0xMaterialProperty = Vrm0xMaterialProperty;
type Rn_VrmComponent = VrmComponent;
declare const Rn_VrmComponent: typeof VrmComponent;
type Rn_VrmExpression = VrmExpression;
type Rn_VrmExpressionMorphBind = VrmExpressionMorphBind;
type Rn_VrmExpressionName = VrmExpressionName;
type Rn_VrmImporter = VrmImporter;
declare const Rn_VrmImporter: typeof VrmImporter;
type Rn_VrmaImporter = VrmaImporter;
declare const Rn_VrmaImporter: typeof VrmaImporter;
type Rn_WalkThroughCameraController = WalkThroughCameraController;
declare const Rn_WalkThroughCameraController: typeof WalkThroughCameraController;
type Rn_WeakNone<B extends object> = WeakNone<B>;
declare const Rn_WeakNone: typeof WeakNone;
type Rn_WeakOption<B extends object, T> = WeakOption<B, T>;
declare const Rn_WeakOption: typeof WeakOption;
type Rn_WeakSome<B extends object, T> = WeakSome<B, T>;
declare const Rn_WeakSome: typeof WeakSome;
type Rn_WebGLContextWrapper = WebGLContextWrapper;
declare const Rn_WebGLContextWrapper: typeof WebGLContextWrapper;
declare const Rn_WebGLExtension: typeof WebGLExtension;
type Rn_WebGLExtensionEnum = WebGLExtensionEnum;
type Rn_WebGLResource = WebGLResource;
type Rn_WebGLResourceHandle = WebGLResourceHandle;
type Rn_WebGLResourceRepository = WebGLResourceRepository;
declare const Rn_WebGLResourceRepository: typeof WebGLResourceRepository;
type Rn_WebGLStrategy = WebGLStrategy;
type Rn_WebGLStrategyDataTexture = WebGLStrategyDataTexture;
declare const Rn_WebGLStrategyDataTexture: typeof WebGLStrategyDataTexture;
type Rn_WebGLStrategyUniform = WebGLStrategyUniform;
declare const Rn_WebGLStrategyUniform: typeof WebGLStrategyUniform;
type Rn_WebGPUResourceHandle = WebGPUResourceHandle;
type Rn_WebGpuDeviceWrapper = WebGpuDeviceWrapper;
declare const Rn_WebGpuDeviceWrapper: typeof WebGpuDeviceWrapper;
type Rn_WebGpuResource = WebGpuResource;
type Rn_WebGpuResourceRepository = WebGpuResourceRepository;
declare const Rn_WebGpuResourceRepository: typeof WebGpuResourceRepository;
type Rn_WebGpuStrategyBasic = WebGpuStrategyBasic;
declare const Rn_WebGpuStrategyBasic: typeof WebGpuStrategyBasic;
type Rn_WebXRSystem = WebXRSystem;
declare const Rn_WebXRSystem: typeof WebXRSystem;
declare const Rn_WellKnownComponentTIDs: typeof WellKnownComponentTIDs;
type Rn_WireframeMaterialNode = WireframeMaterialNode;
declare const Rn_WireframeMaterialNode: typeof WireframeMaterialNode;
type Rn_WorldMatrixShaderNode = WorldMatrixShaderNode;
declare const Rn_WorldMatrixShaderNode: typeof WorldMatrixShaderNode;
declare const Rn__from: typeof _from;
declare const Rn__fromString: typeof _fromString;
declare const Rn__fromStringCaseSensitively: typeof _fromStringCaseSensitively;
declare const Rn__getPropertyIndex2: typeof _getPropertyIndex2;
declare const Rn_add2: typeof add2;
declare const Rn_add2_offset: typeof add2_offset;
declare const Rn_add3: typeof add3;
declare const Rn_add3_offset: typeof add3_offset;
declare const Rn_add4: typeof add4;
declare const Rn_add4_offset: typeof add4_offset;
declare const Rn_addLineNumberToCode: typeof addLineNumberToCode;
declare const Rn_applyMixins: typeof applyMixins;
declare const Rn_array2_lerp_offsetAsComposition: typeof array2_lerp_offsetAsComposition;
declare const Rn_array3_lerp_offsetAsComposition: typeof array3_lerp_offsetAsComposition;
declare const Rn_array4_lerp_offsetAsComposition: typeof array4_lerp_offsetAsComposition;
declare const Rn_arrayN_lerp_offsetAsComposition: typeof arrayN_lerp_offsetAsComposition;
declare const Rn_assertDoesNotHave: typeof assertDoesNotHave;
declare const Rn_assertExist: typeof assertExist;
declare const Rn_assertHas: typeof assertHas;
declare const Rn_assertIsErr: typeof assertIsErr;
declare const Rn_assertIsOk: typeof assertIsOk;
declare const Rn_calcAlignedByteLength: typeof calcAlignedByteLength;
declare const Rn_combineImages: typeof combineImages;
declare const Rn_convertHTMLImageElementToCanvas: typeof convertHTMLImageElementToCanvas;
declare const Rn_createCameraControllerEntity: typeof createCameraControllerEntity;
declare const Rn_createCameraEntity: typeof createCameraEntity;
declare const Rn_createEffekseer: typeof createEffekseer;
declare const Rn_createEntity: typeof createEntity;
declare const Rn_createGroupEntity: typeof createGroupEntity;
declare const Rn_createLightEntity: typeof createLightEntity;
declare const Rn_createLightWithCameraEntity: typeof createLightWithCameraEntity;
declare const Rn_createMeshEntity: typeof createMeshEntity;
declare const Rn_createMotionController: typeof createMotionController;
declare const Rn_createPhysicsEntity: typeof createPhysicsEntity;
declare const Rn_createSkeletalEntity: typeof createSkeletalEntity;
declare const Rn_createTransformEntity: typeof createTransformEntity;
declare const Rn_deepCopyUsingJsonStringify: typeof deepCopyUsingJsonStringify;
declare const Rn_defaultAnimationTrackName: typeof defaultAnimationTrackName;
declare const Rn_defaultAssetLoader: typeof defaultAssetLoader;
declare const Rn_defaultValue: typeof defaultValue;
declare const Rn_detectFormatByArrayBuffers: typeof detectFormatByArrayBuffers;
declare const Rn_detectFormatByUri: typeof detectFormatByUri;
declare const Rn_downloadArrayBuffer: typeof downloadArrayBuffer;
declare const Rn_downloadTypedArray: typeof downloadTypedArray;
declare const Rn_dummyAnisotropyTexture: typeof dummyAnisotropyTexture;
declare const Rn_dummyBlackCubeTexture: typeof dummyBlackCubeTexture;
declare const Rn_dummyBlackTexture: typeof dummyBlackTexture;
declare const Rn_dummyBlueTexture: typeof dummyBlueTexture;
declare const Rn_dummyDepthMomentTextureArray: typeof dummyDepthMomentTextureArray;
declare const Rn_dummySRGBGrayTexture: typeof dummySRGBGrayTexture;
declare const Rn_dummyWhiteTexture: typeof dummyWhiteTexture;
declare const Rn_dummyZeroTexture: typeof dummyZeroTexture;
declare const Rn_enhanceArray: typeof enhanceArray;
declare const Rn_flattenHierarchy: typeof flattenHierarchy;
declare const Rn_fromTensorToCompositionType: typeof fromTensorToCompositionType;
declare const Rn_get1: typeof get1;
declare const Rn_get1_offset: typeof get1_offset;
declare const Rn_get1_offsetAsComposition: typeof get1_offsetAsComposition;
declare const Rn_get2: typeof get2;
declare const Rn_get2_offset: typeof get2_offset;
declare const Rn_get2_offsetAsComposition: typeof get2_offsetAsComposition;
declare const Rn_get3: typeof get3;
declare const Rn_get3_offset: typeof get3_offset;
declare const Rn_get3_offsetAsComposition: typeof get3_offsetAsComposition;
declare const Rn_get4: typeof get4;
declare const Rn_get4_offset: typeof get4_offset;
declare const Rn_get4_offsetAsComposition: typeof get4_offsetAsComposition;
declare const Rn_getEvent: typeof getEvent;
declare const Rn_getMotionController: typeof getMotionController;
declare const Rn_getN_offset: typeof getN_offset;
declare const Rn_getN_offsetAsComposition: typeof getN_offsetAsComposition;
type Rn_getShaderPropertyFunc = getShaderPropertyFunc;
declare const Rn_getWebXRSystem: typeof getWebXRSystem;
type Rn_glTF1 = glTF1;
declare const Rn_greaterThan: typeof greaterThan;
declare const Rn_ifDefinedThen: typeof ifDefinedThen;
declare const Rn_ifDefinedThenWithReturn: typeof ifDefinedThenWithReturn;
declare const Rn_ifExistsThen: typeof ifExistsThen;
declare const Rn_ifExistsThenWithReturn: typeof ifExistsThenWithReturn;
declare const Rn_ifNotExistsThen: typeof ifNotExistsThen;
declare const Rn_ifNotExistsThenWithReturn: typeof ifNotExistsThenWithReturn;
declare const Rn_ifUndefinedThen: typeof ifUndefinedThen;
declare const Rn_ifUndefinedThenWithReturn: typeof ifUndefinedThenWithReturn;
declare const Rn_initDefaultTextures: typeof initDefaultTextures;
declare const Rn_isBlend: typeof isBlend;
declare const Rn_isBlendWithZWrite: typeof isBlendWithZWrite;
declare const Rn_isBlendWithoutZWrite: typeof isBlendWithoutZWrite;
declare const Rn_isOpaque: typeof isOpaque;
declare const Rn_isSameGlTF2TextureSampler: typeof isSameGlTF2TextureSampler;
declare const Rn_isSkipDrawing: typeof isSkipDrawing;
declare const Rn_isTranslucent: typeof isTranslucent;
declare const Rn_lessThan: typeof lessThan;
declare const Rn_mulArray3WithScalar_offset: typeof mulArray3WithScalar_offset;
declare const Rn_mulArray4WithScalar_offset: typeof mulArray4WithScalar_offset;
declare const Rn_mulArrayNWithScalar_offset: typeof mulArrayNWithScalar_offset;
declare const Rn_mulThatAndThisToOutAsMat44_offsetAsComposition: typeof mulThatAndThisToOutAsMat44_offsetAsComposition;
declare const Rn_normalizeArray4: typeof normalizeArray4;
declare const Rn_nullishToEmptyArray: typeof nullishToEmptyArray;
declare const Rn_nullishToEmptyMap: typeof nullishToEmptyMap;
declare const Rn_objectCachify: typeof objectCachify;
declare const Rn_primitiveCachify1: typeof primitiveCachify1;
type Rn_primitives = primitives;
declare const Rn_qlerp_offsetAsComposition: typeof qlerp_offsetAsComposition;
declare const Rn_scalar_lerp_offsetAsComposition: typeof scalar_lerp_offsetAsComposition;
declare const Rn_setupShaderProgram: typeof setupShaderProgram;
declare const Rn_sheenLutTexture: typeof sheenLutTexture;
declare const Rn_updateGamePad: typeof updateGamePad;
declare const Rn_updateMotionControllerModel: typeof updateMotionControllerModel;
declare const Rn_valueWithCompensation: typeof valueWithCompensation;
declare const Rn_valueWithDefault: typeof valueWithDefault;
declare namespace Rn {
  export { Rn_AABB as AABB, Rn_AABBGizmo as AABBGizmo, Rn_AbsoluteAnimation as AbsoluteAnimation, Rn_AbstractArrayBufferBaseMathNumber as AbstractArrayBufferBaseMathNumber, Rn_AbstractCameraController as AbstractCameraController, Rn_AbstractMaterialContent as AbstractMaterialContent, Rn_AbstractMatrix as AbstractMatrix, Rn_AbstractQuaternion as AbstractQuaternion, Rn_AbstractShaderNode as AbstractShaderNode, Rn_AbstractTexture as AbstractTexture, Rn_AbstractVector as AbstractVector, Rn_Accessor as Accessor, Rn_AddShaderNode as AddShaderNode, Rn_AlphaMode as AlphaMode, type Rn_AlphaModeEnum as AlphaModeEnum, Rn_AnimatedQuaternion as AnimatedQuaternion, Rn_AnimatedScalar as AnimatedScalar, Rn_AnimatedVector2 as AnimatedVector2, Rn_AnimatedVector3 as AnimatedVector3, Rn_AnimatedVector4 as AnimatedVector4, Rn_AnimatedVectorN as AnimatedVectorN, Rn_AnimationAssigner as AnimationAssigner, Rn_AnimationAttribute as AnimationAttribute, type Rn_AnimationAttributeEnum as AnimationAttributeEnum, type Rn_AnimationChannel as AnimationChannel, type Rn_AnimationChannelTarget as AnimationChannelTarget, Rn_AnimationComponent as AnimationComponent, type Rn_AnimationComponentEventType as AnimationComponentEventType, type Rn_AnimationInfo as AnimationInfo, Rn_AnimationInterpolation as AnimationInterpolation, type Rn_AnimationInterpolationEnum as AnimationInterpolationEnum, type Rn_AnimationPathName as AnimationPathName, type Rn_AnimationSampler as AnimationSampler, type Rn_AnimationSamplers as AnimationSamplers, type Rn_AnimationTrack as AnimationTrack, type Rn_AnimationTrackName as AnimationTrackName, type Rn_Array1 as Array1, type Rn_Array16 as Array16, type Rn_Array1to4 as Array1to4, type Rn_Array2 as Array2, type Rn_Array3 as Array3, type Rn_Array4 as Array4, type Rn_Array9 as Array9, type Rn_ArrayAsRn as ArrayAsRn, type Rn_ArrayType as ArrayType, Rn_AssetLoader as AssetLoader, type Rn_AssetLoaderConfig as AssetLoaderConfig, Rn_AttributeColorShaderNode as AttributeColorShaderNode, type Rn_AttributeName as AttributeName, type Rn_AttributeNames as AttributeNames, Rn_AttributeNormalShaderNode as AttributeNormalShaderNode, Rn_AttributePositionShaderNode as AttributePositionShaderNode, Rn_AttributeTexcoordShaderNode as AttributeTexcoordShaderNode, type Rn_Attributes as Attributes, Rn_Axis as Axis, type Rn_AxisDescriptor as AxisDescriptor, type Rn_BASIS as BASIS, Rn_BasisCompressionType as BasisCompressionType, type Rn_BasisCompressionTypeEnum as BasisCompressionTypeEnum, type Rn_BasisFile as BasisFile, Rn_BasisLzEtc1sImageTranscoder as BasisLzEtc1sImageTranscoder, type Rn_BasisTranscoder as BasisTranscoder, Rn_BlendShapeComponent as BlendShapeComponent, Rn_BlockBeginShader as BlockBeginShader, Rn_BlockBeginShaderNode as BlockBeginShaderNode, Rn_BlockEndShader as BlockEndShader, Rn_BlockEndShaderNode as BlockEndShaderNode, Rn_Bloom as Bloom, Rn_BoneDataType as BoneDataType, type Rn_BoneDataTypeEnum as BoneDataTypeEnum, Rn_Buffer as Buffer, Rn_BufferUse as BufferUse, type Rn_BufferUseEnum as BufferUseEnum, Rn_BufferView as BufferView, type Byte$1 as Byte, type Rn_CGAPIResourceHandle as CGAPIResourceHandle, Rn_CGAPIResourceRepository as CGAPIResourceRepository, Rn_Cache as Cache, type Rn_CalledSubscriberNumber as CalledSubscriberNumber, Rn_CameraComponent as CameraComponent, Rn_CameraControllerComponent as CameraControllerComponent, Rn_CameraControllerType as CameraControllerType, type Rn_CameraControllerTypeEnum as CameraControllerTypeEnum, type Rn_CameraSID as CameraSID, Rn_CameraType as CameraType, type Rn_CameraTypeEnum as CameraTypeEnum, Rn_CapsuleCollider as CapsuleCollider, type Rn_ChangeAnimationInfoEvent as ChangeAnimationInfoEvent, Rn_ClassicShadingShader as ClassicShadingShader, type Rn_ColorComponentLetter as ColorComponentLetter, Rn_ColorGradingUsingLUTsMaterialContent as ColorGradingUsingLUTsMaterialContent, Rn_ColorRgb as ColorRgb, Rn_ColorRgba as ColorRgba, Rn_CommonShaderPart as CommonShaderPart, Rn_ComplexVertexAttribute as ComplexVertexAttribute, Rn_Component as Component, type Rn_ComponentMixinFunction as ComponentMixinFunction, Rn_ComponentRepository as ComponentRepository, type Rn_ComponentSID as ComponentSID, type Rn_ComponentTID as ComponentTID, type Rn_ComponentToComponentMethods as ComponentToComponentMethods, Rn_ComponentType as ComponentType, type Rn_ComponentTypeEnum as ComponentTypeEnum, Rn_CompositionType as CompositionType, type Rn_CompositionTypeEnum as CompositionTypeEnum, Rn_CompressionTextureType as CompressionTextureType, type Rn_CompressionTextureTypeEnum as CompressionTextureTypeEnum, Rn_Config as Config, Rn_ConstRgbaBlack as ConstRgbaBlack, Rn_ConstRgbaWhite as ConstRgbaWhite, Rn_ConstVector2_0_0 as ConstVector2_0_0, Rn_ConstVector2_1_1 as ConstVector2_1_1, Rn_ConstVector3_0_0_0 as ConstVector3_0_0_0, Rn_ConstVector3_1_1_1 as ConstVector3_1_1_1, Rn_ConstVector4_0_0_0_0 as ConstVector4_0_0_0_0, Rn_ConstVector4_0_0_0_1 as ConstVector4_0_0_0_1, Rn_ConstVector4_1_1_1_1 as ConstVector4_1_1_1_1, Rn_ConstantScalarVariableShaderNode as ConstantScalarVariableShaderNode, Rn_ConstantVariableShader as ConstantVariableShader, Rn_ConstantVector2VariableShaderNode as ConstantVector2VariableShaderNode, Rn_ConstantVector3VariableShaderNode as ConstantVector3VariableShaderNode, Rn_ConstantVector4VariableShaderNode as ConstantVector4VariableShaderNode, type Rn_Count as Count, Rn_Cube as Cube, type Rn_CubeDescriptor as CubeDescriptor, Rn_CubeTexture as CubeTexture, Rn_CustomMaterialContent as CustomMaterialContent, Rn_DataUtil as DataUtil, Rn_DefaultTextures as DefaultTextures, Rn_DepthEncodeMaterialContent as DepthEncodeMaterialContent, Rn_DetectHighLuminanceMaterialContent as DetectHighLuminanceMaterialContent, type Rn_DirectTextureData as DirectTextureData, Rn_DotProductShaderNode as DotProductShaderNode, Rn_DrcPointCloudImporter as DrcPointCloudImporter, Rn_EVENT_CLICK as EVENT_CLICK, Rn_EVENT_KEY_DOWN as EVENT_KEY_DOWN, Rn_EVENT_KEY_PRESS as EVENT_KEY_PRESS, Rn_EVENT_KEY_UP as EVENT_KEY_UP, Rn_EVENT_MOUSE_DOWN as EVENT_MOUSE_DOWN, Rn_EVENT_MOUSE_ENTER as EVENT_MOUSE_ENTER, Rn_EVENT_MOUSE_LEAVE as EVENT_MOUSE_LEAVE, Rn_EVENT_MOUSE_MOVE as EVENT_MOUSE_MOVE, Rn_EVENT_MOUSE_OVER as EVENT_MOUSE_OVER, Rn_EVENT_MOUSE_UP as EVENT_MOUSE_UP, Rn_EVENT_MOUSE_WHEEL as EVENT_MOUSE_WHEEL, Rn_EVENT_MSPOINTER_DOWN as EVENT_MSPOINTER_DOWN, Rn_EVENT_MSPOINTER_MOVE as EVENT_MSPOINTER_MOVE, Rn_EVENT_MSPOINTER_UP as EVENT_MSPOINTER_UP, Rn_EVENT_ORIENTATION_CHANGE as EVENT_ORIENTATION_CHANGE, Rn_EVENT_POINTER_CANCEL as EVENT_POINTER_CANCEL, Rn_EVENT_POINTER_DOWN as EVENT_POINTER_DOWN, Rn_EVENT_POINTER_ENTER as EVENT_POINTER_ENTER, Rn_EVENT_POINTER_LEAVE as EVENT_POINTER_LEAVE, Rn_EVENT_POINTER_MOVE as EVENT_POINTER_MOVE, Rn_EVENT_POINTER_OUT as EVENT_POINTER_OUT, Rn_EVENT_POINTER_OVER as EVENT_POINTER_OVER, Rn_EVENT_POINTER_UP as EVENT_POINTER_UP, Rn_EVENT_RESIZE as EVENT_RESIZE, Rn_EVENT_TOUCH_CANCEL as EVENT_TOUCH_CANCEL, Rn_EVENT_TOUCH_DOUBLE_TAP as EVENT_TOUCH_DOUBLE_TAP, Rn_EVENT_TOUCH_DRAG as EVENT_TOUCH_DRAG, Rn_EVENT_TOUCH_END as EVENT_TOUCH_END, Rn_EVENT_TOUCH_ENTER as EVENT_TOUCH_ENTER, Rn_EVENT_TOUCH_HOLD as EVENT_TOUCH_HOLD, Rn_EVENT_TOUCH_LEAVE as EVENT_TOUCH_LEAVE, Rn_EVENT_TOUCH_LONG_TAP as EVENT_TOUCH_LONG_TAP, Rn_EVENT_TOUCH_MOVE as EVENT_TOUCH_MOVE, Rn_EVENT_TOUCH_OUT as EVENT_TOUCH_OUT, Rn_EVENT_TOUCH_OVER as EVENT_TOUCH_OVER, Rn_EVENT_TOUCH_PINCH as EVENT_TOUCH_PINCH, Rn_EVENT_TOUCH_START as EVENT_TOUCH_START, Rn_EVENT_TOUCH_SWIPE as EVENT_TOUCH_SWIPE, Rn_EVENT_TOUCH_TAP as EVENT_TOUCH_TAP, Rn_Effekseer as Effekseer, Rn_EffekseerComponent as EffekseerComponent, Rn_EndShader as EndShader, Rn_Entity as Entity, Rn_EntityRepository as EntityRepository, type Rn_EntityUID as EntityUID, Rn_EntityUIDOutputMaterialContent as EntityUIDOutputMaterialContent, Rn_EnumClass as EnumClass, type Rn_EnumIO as EnumIO, Rn_Err as Err, type Rn_EventHandler as EventHandler, Rn_EventPubSub as EventPubSub, type Rn_EventSubscriberIndex as EventSubscriberIndex, type Rn_EventType as EventType, Rn_Expression as Expression, Rn_FileType as FileType, type Rn_FileTypeEnum as FileTypeEnum, type Rn_FillArgsObject as FillArgsObject, type Rn_FloatTypedArray as FloatTypedArray, type Rn_FloatTypedArrayConstructor as FloatTypedArrayConstructor, Rn_ForwardRenderPipeline as ForwardRenderPipeline, Rn_Frame as Frame, Rn_FrameBuffer as FrameBuffer, type Rn_FrameBufferCubeMapDescriptor as FrameBufferCubeMapDescriptor, type Rn_FrameBufferDescriptor as FrameBufferDescriptor, type Rn_FrameBufferMSAADescriptor as FrameBufferMSAADescriptor, type Rn_FrameBufferTextureArrayDescriptor as FrameBufferTextureArrayDescriptor, type Rn_FrameBufferTextureArrayForMultiViewDescriptor as FrameBufferTextureArrayForMultiViewDescriptor, Rn_Frustum as Frustum, Rn_FurnaceTestMaterialContent as FurnaceTestMaterialContent, Rn_GLTF2_EXPORT_DRACO as GLTF2_EXPORT_DRACO, Rn_GLTF2_EXPORT_EMBEDDED as GLTF2_EXPORT_EMBEDDED, Rn_GLTF2_EXPORT_GLB as GLTF2_EXPORT_GLB, Rn_GLTF2_EXPORT_GLTF as GLTF2_EXPORT_GLTF, Rn_GLTF2_EXPORT_NO_DOWNLOAD as GLTF2_EXPORT_NO_DOWNLOAD, Rn_GL_ACTIVE_ATTRIBUTES as GL_ACTIVE_ATTRIBUTES, Rn_GL_ACTIVE_TEXTURE as GL_ACTIVE_TEXTURE, Rn_GL_ACTIVE_UNIFORMS as GL_ACTIVE_UNIFORMS, Rn_GL_ACTIVE_UNIFORM_BLOCKS as GL_ACTIVE_UNIFORM_BLOCKS, Rn_GL_ALIASED_LINE_WIDTH_RANGE as GL_ALIASED_LINE_WIDTH_RANGE, Rn_GL_ALIASED_POINT_SIZE_RANGE as GL_ALIASED_POINT_SIZE_RANGE, Rn_GL_ALPHA as GL_ALPHA, Rn_GL_ALPHA_BITS as GL_ALPHA_BITS, Rn_GL_ALREADY_SIGNALED as GL_ALREADY_SIGNALED, Rn_GL_ALWAYS as GL_ALWAYS, Rn_GL_ANY_SAMPLES_PASSED as GL_ANY_SAMPLES_PASSED, Rn_GL_ANY_SAMPLES_PASSED_CONSERVATIVE as GL_ANY_SAMPLES_PASSED_CONSERVATIVE, Rn_GL_ARRAY_BUFFER as GL_ARRAY_BUFFER, Rn_GL_ARRAY_BUFFER_BINDING as GL_ARRAY_BUFFER_BINDING, Rn_GL_ATTACHED_SHADERS as GL_ATTACHED_SHADERS, Rn_GL_BACK as GL_BACK, Rn_GL_BLEND as GL_BLEND, Rn_GL_BLEND_COLOR as GL_BLEND_COLOR, Rn_GL_BLEND_DST_ALPHA as GL_BLEND_DST_ALPHA, Rn_GL_BLEND_DST_RGB as GL_BLEND_DST_RGB, Rn_GL_BLEND_EQUATION as GL_BLEND_EQUATION, Rn_GL_BLEND_EQUATION_ALPHA as GL_BLEND_EQUATION_ALPHA, Rn_GL_BLEND_EQUATION_RGB as GL_BLEND_EQUATION_RGB, Rn_GL_BLEND_SRC_ALPHA as GL_BLEND_SRC_ALPHA, Rn_GL_BLEND_SRC_RGB as GL_BLEND_SRC_RGB, Rn_GL_BLUE_BITS as GL_BLUE_BITS, Rn_GL_BOOL as GL_BOOL, Rn_GL_BOOL_VEC2 as GL_BOOL_VEC2, Rn_GL_BOOL_VEC3 as GL_BOOL_VEC3, Rn_GL_BOOL_VEC4 as GL_BOOL_VEC4, Rn_GL_BROWSER_DEFAULT_WEBGL as GL_BROWSER_DEFAULT_WEBGL, Rn_GL_BUFFER_SIZE as GL_BUFFER_SIZE, Rn_GL_BUFFER_USAGE as GL_BUFFER_USAGE, Rn_GL_CCW as GL_CCW, Rn_GL_CLAMP_TO_EDGE as GL_CLAMP_TO_EDGE, Rn_GL_COLOR as GL_COLOR, Rn_GL_COLOR_ATTACHMENT0 as GL_COLOR_ATTACHMENT0, Rn_GL_COLOR_ATTACHMENT0_WEBGL as GL_COLOR_ATTACHMENT0_WEBGL, Rn_GL_COLOR_ATTACHMENT1 as GL_COLOR_ATTACHMENT1, Rn_GL_COLOR_ATTACHMENT10 as GL_COLOR_ATTACHMENT10, Rn_GL_COLOR_ATTACHMENT10_WEBGL as GL_COLOR_ATTACHMENT10_WEBGL, Rn_GL_COLOR_ATTACHMENT11 as GL_COLOR_ATTACHMENT11, Rn_GL_COLOR_ATTACHMENT11_WEBGL as GL_COLOR_ATTACHMENT11_WEBGL, Rn_GL_COLOR_ATTACHMENT12 as GL_COLOR_ATTACHMENT12, Rn_GL_COLOR_ATTACHMENT12_WEBGL as GL_COLOR_ATTACHMENT12_WEBGL, Rn_GL_COLOR_ATTACHMENT13 as GL_COLOR_ATTACHMENT13, Rn_GL_COLOR_ATTACHMENT13_WEBGL as GL_COLOR_ATTACHMENT13_WEBGL, Rn_GL_COLOR_ATTACHMENT14 as GL_COLOR_ATTACHMENT14, Rn_GL_COLOR_ATTACHMENT14_WEBGL as GL_COLOR_ATTACHMENT14_WEBGL, Rn_GL_COLOR_ATTACHMENT15 as GL_COLOR_ATTACHMENT15, Rn_GL_COLOR_ATTACHMENT15_WEBGL as GL_COLOR_ATTACHMENT15_WEBGL, Rn_GL_COLOR_ATTACHMENT1_WEBGL as GL_COLOR_ATTACHMENT1_WEBGL, Rn_GL_COLOR_ATTACHMENT2 as GL_COLOR_ATTACHMENT2, Rn_GL_COLOR_ATTACHMENT2_WEBGL as GL_COLOR_ATTACHMENT2_WEBGL, Rn_GL_COLOR_ATTACHMENT3 as GL_COLOR_ATTACHMENT3, Rn_GL_COLOR_ATTACHMENT3_WEBGL as GL_COLOR_ATTACHMENT3_WEBGL, Rn_GL_COLOR_ATTACHMENT4 as GL_COLOR_ATTACHMENT4, Rn_GL_COLOR_ATTACHMENT4_WEBGL as GL_COLOR_ATTACHMENT4_WEBGL, Rn_GL_COLOR_ATTACHMENT5 as GL_COLOR_ATTACHMENT5, Rn_GL_COLOR_ATTACHMENT5_WEBGL as GL_COLOR_ATTACHMENT5_WEBGL, Rn_GL_COLOR_ATTACHMENT6 as GL_COLOR_ATTACHMENT6, Rn_GL_COLOR_ATTACHMENT6_WEBGL as GL_COLOR_ATTACHMENT6_WEBGL, Rn_GL_COLOR_ATTACHMENT7 as GL_COLOR_ATTACHMENT7, Rn_GL_COLOR_ATTACHMENT7_WEBGL as GL_COLOR_ATTACHMENT7_WEBGL, Rn_GL_COLOR_ATTACHMENT8 as GL_COLOR_ATTACHMENT8, Rn_GL_COLOR_ATTACHMENT8_WEBGL as GL_COLOR_ATTACHMENT8_WEBGL, Rn_GL_COLOR_ATTACHMENT9 as GL_COLOR_ATTACHMENT9, Rn_GL_COLOR_ATTACHMENT9_WEBGL as GL_COLOR_ATTACHMENT9_WEBGL, Rn_GL_COLOR_BUFFER_BIT as GL_COLOR_BUFFER_BIT, Rn_GL_COLOR_CLEAR_VALUE as GL_COLOR_CLEAR_VALUE, Rn_GL_COLOR_WRITEMASK as GL_COLOR_WRITEMASK, Rn_GL_COMPARE_REF_TO_TEXTURE as GL_COMPARE_REF_TO_TEXTURE, Rn_GL_COMPILE_STATUS as GL_COMPILE_STATUS, Rn_GL_COMPRESSED_R11_EAC as GL_COMPRESSED_R11_EAC, Rn_GL_COMPRESSED_RG11_EAC as GL_COMPRESSED_RG11_EAC, Rn_GL_COMPRESSED_RGB8_ETC2 as GL_COMPRESSED_RGB8_ETC2, Rn_GL_COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 as GL_COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2, Rn_GL_COMPRESSED_RGBA8_ETC2_EAC as GL_COMPRESSED_RGBA8_ETC2_EAC, Rn_GL_COMPRESSED_RGBA_ASTC_10X10_KHR as GL_COMPRESSED_RGBA_ASTC_10X10_KHR, Rn_GL_COMPRESSED_RGBA_ASTC_10X5_KHR as GL_COMPRESSED_RGBA_ASTC_10X5_KHR, Rn_GL_COMPRESSED_RGBA_ASTC_10X6_KHR as GL_COMPRESSED_RGBA_ASTC_10X6_KHR, Rn_GL_COMPRESSED_RGBA_ASTC_10X8_KHR as GL_COMPRESSED_RGBA_ASTC_10X8_KHR, Rn_GL_COMPRESSED_RGBA_ASTC_12X10_KHR as GL_COMPRESSED_RGBA_ASTC_12X10_KHR, Rn_GL_COMPRESSED_RGBA_ASTC_12X12_KHR as GL_COMPRESSED_RGBA_ASTC_12X12_KHR, Rn_GL_COMPRESSED_RGBA_ASTC_4X4_KHR as GL_COMPRESSED_RGBA_ASTC_4X4_KHR, Rn_GL_COMPRESSED_RGBA_ASTC_5X4_KHR as GL_COMPRESSED_RGBA_ASTC_5X4_KHR, Rn_GL_COMPRESSED_RGBA_ASTC_5X5_KHR as GL_COMPRESSED_RGBA_ASTC_5X5_KHR, Rn_GL_COMPRESSED_RGBA_ASTC_6X5_KHR as GL_COMPRESSED_RGBA_ASTC_6X5_KHR, Rn_GL_COMPRESSED_RGBA_ASTC_6X6_KHR as GL_COMPRESSED_RGBA_ASTC_6X6_KHR, Rn_GL_COMPRESSED_RGBA_ASTC_8X5_KHR as GL_COMPRESSED_RGBA_ASTC_8X5_KHR, Rn_GL_COMPRESSED_RGBA_ASTC_8X6_KHR as GL_COMPRESSED_RGBA_ASTC_8X6_KHR, Rn_GL_COMPRESSED_RGBA_ASTC_8X8_KHR as GL_COMPRESSED_RGBA_ASTC_8X8_KHR, Rn_GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL as GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL, Rn_GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL as GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL, Rn_GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG as GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG, Rn_GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG as GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG, Rn_GL_COMPRESSED_RGBA_S3TC_DXT1_EXT as GL_COMPRESSED_RGBA_S3TC_DXT1_EXT, Rn_GL_COMPRESSED_RGBA_S3TC_DXT3_EXT as GL_COMPRESSED_RGBA_S3TC_DXT3_EXT, Rn_GL_COMPRESSED_RGBA_S3TC_DXT5_EXT as GL_COMPRESSED_RGBA_S3TC_DXT5_EXT, Rn_GL_COMPRESSED_RGB_ATC_WEBGL as GL_COMPRESSED_RGB_ATC_WEBGL, Rn_GL_COMPRESSED_RGB_ETC1_WEBGL as GL_COMPRESSED_RGB_ETC1_WEBGL, Rn_GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG as GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG, Rn_GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG as GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG, Rn_GL_COMPRESSED_RGB_S3TC_DXT1_EXT as GL_COMPRESSED_RGB_S3TC_DXT1_EXT, Rn_GL_COMPRESSED_SIGNED_R11_EAC as GL_COMPRESSED_SIGNED_R11_EAC, Rn_GL_COMPRESSED_SIGNED_RG11_EAC as GL_COMPRESSED_SIGNED_RG11_EAC, Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X10_KHR as GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X10_KHR, Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X5_KHR as GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X5_KHR, Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X6_KHR as GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X6_KHR, Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X8_KHR as GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10X8_KHR, Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12X10_KHR as GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12X10_KHR, Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12X12_KHR as GL_COMPRESSED_SRGB8_ALPHA8_ASTC_12X12_KHR, Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_4X4_KHR as GL_COMPRESSED_SRGB8_ALPHA8_ASTC_4X4_KHR, Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5X4_KHR as GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5X4_KHR, Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5X5_KHR as GL_COMPRESSED_SRGB8_ALPHA8_ASTC_5X5_KHR, Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6X5_KHR as GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6X5_KHR, Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6X6_KHR as GL_COMPRESSED_SRGB8_ALPHA8_ASTC_6X6_KHR, Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8X5_KHR as GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8X5_KHR, Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8X6_KHR as GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8X6_KHR, Rn_GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8X8_KHR as GL_COMPRESSED_SRGB8_ALPHA8_ASTC_8X8_KHR, Rn_GL_COMPRESSED_SRGB8_ALPHA8_ETC2_EAC as GL_COMPRESSED_SRGB8_ALPHA8_ETC2_EAC, Rn_GL_COMPRESSED_SRGB8_ETC2 as GL_COMPRESSED_SRGB8_ETC2, Rn_GL_COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 as GL_COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2, Rn_GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT as GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT, Rn_GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT as GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT, Rn_GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT as GL_COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT, Rn_GL_COMPRESSED_SRGB_S3TC_DXT1_EXT as GL_COMPRESSED_SRGB_S3TC_DXT1_EXT, Rn_GL_COMPRESSED_TEXTURE_FORMATS as GL_COMPRESSED_TEXTURE_FORMATS, Rn_GL_CONDITION_SATISFIED as GL_CONDITION_SATISFIED, Rn_GL_CONSTANT_ALPHA as GL_CONSTANT_ALPHA, Rn_GL_CONSTANT_COLOR as GL_CONSTANT_COLOR, Rn_GL_CONTEXT_LOST_WEBGL as GL_CONTEXT_LOST_WEBGL, Rn_GL_COPY_READ_BUFFER as GL_COPY_READ_BUFFER, Rn_GL_COPY_READ_BUFFER_BINDING as GL_COPY_READ_BUFFER_BINDING, Rn_GL_COPY_WRITE_BUFFER as GL_COPY_WRITE_BUFFER, Rn_GL_COPY_WRITE_BUFFER_BINDING as GL_COPY_WRITE_BUFFER_BINDING, Rn_GL_CULL_FACE as GL_CULL_FACE, Rn_GL_CULL_FACE_MODE as GL_CULL_FACE_MODE, Rn_GL_CURRENT_PROGRAM as GL_CURRENT_PROGRAM, Rn_GL_CURRENT_QUERY as GL_CURRENT_QUERY, Rn_GL_CURRENT_QUERY_EXT as GL_CURRENT_QUERY_EXT, Rn_GL_CURRENT_VERTEX_ATTRIB as GL_CURRENT_VERTEX_ATTRIB, Rn_GL_CW as GL_CW, Rn_GL_DATA_BYTE as GL_DATA_BYTE, Rn_GL_DATA_FLOAT as GL_DATA_FLOAT, Rn_GL_DATA_INT as GL_DATA_INT, Rn_GL_DATA_SHORT as GL_DATA_SHORT, Rn_GL_DATA_UNSIGNED_BYTE as GL_DATA_UNSIGNED_BYTE, Rn_GL_DATA_UNSIGNED_INT as GL_DATA_UNSIGNED_INT, Rn_GL_DATA_UNSIGNED_SHORT as GL_DATA_UNSIGNED_SHORT, Rn_GL_DECR as GL_DECR, Rn_GL_DECR_WRAP as GL_DECR_WRAP, Rn_GL_DELETE_STATUS as GL_DELETE_STATUS, Rn_GL_DEPTH as GL_DEPTH, Rn_GL_DEPTH24_STENCIL8 as GL_DEPTH24_STENCIL8, Rn_GL_DEPTH32F_STENCIL8 as GL_DEPTH32F_STENCIL8, Rn_GL_DEPTH_ATTACHMENT as GL_DEPTH_ATTACHMENT, Rn_GL_DEPTH_BITS as GL_DEPTH_BITS, Rn_GL_DEPTH_BUFFER_BIT as GL_DEPTH_BUFFER_BIT, Rn_GL_DEPTH_CLEAR_VALUE as GL_DEPTH_CLEAR_VALUE, Rn_GL_DEPTH_COMPONENT as GL_DEPTH_COMPONENT, Rn_GL_DEPTH_COMPONENT16 as GL_DEPTH_COMPONENT16, Rn_GL_DEPTH_COMPONENT24 as GL_DEPTH_COMPONENT24, Rn_GL_DEPTH_COMPONENT32F as GL_DEPTH_COMPONENT32F, Rn_GL_DEPTH_FUNC as GL_DEPTH_FUNC, Rn_GL_DEPTH_RANGE as GL_DEPTH_RANGE, Rn_GL_DEPTH_STENCIL as GL_DEPTH_STENCIL, Rn_GL_DEPTH_STENCIL_ATTACHMENT as GL_DEPTH_STENCIL_ATTACHMENT, Rn_GL_DEPTH_TEST as GL_DEPTH_TEST, Rn_GL_DEPTH_WRITEMASK as GL_DEPTH_WRITEMASK, Rn_GL_DITHER as GL_DITHER, Rn_GL_DONT_CARE as GL_DONT_CARE, Rn_GL_DRAW_BUFFER0 as GL_DRAW_BUFFER0, Rn_GL_DRAW_BUFFER0_WEBGL as GL_DRAW_BUFFER0_WEBGL, Rn_GL_DRAW_BUFFER1 as GL_DRAW_BUFFER1, Rn_GL_DRAW_BUFFER10 as GL_DRAW_BUFFER10, Rn_GL_DRAW_BUFFER10_WEBGL as GL_DRAW_BUFFER10_WEBGL, Rn_GL_DRAW_BUFFER11 as GL_DRAW_BUFFER11, Rn_GL_DRAW_BUFFER11_WEBGL as GL_DRAW_BUFFER11_WEBGL, Rn_GL_DRAW_BUFFER12 as GL_DRAW_BUFFER12, Rn_GL_DRAW_BUFFER12_WEBGL as GL_DRAW_BUFFER12_WEBGL, Rn_GL_DRAW_BUFFER13 as GL_DRAW_BUFFER13, Rn_GL_DRAW_BUFFER13_WEBGL as GL_DRAW_BUFFER13_WEBGL, Rn_GL_DRAW_BUFFER14 as GL_DRAW_BUFFER14, Rn_GL_DRAW_BUFFER14_WEBGL as GL_DRAW_BUFFER14_WEBGL, Rn_GL_DRAW_BUFFER15 as GL_DRAW_BUFFER15, Rn_GL_DRAW_BUFFER15_WEBGL as GL_DRAW_BUFFER15_WEBGL, Rn_GL_DRAW_BUFFER1_WEBGL as GL_DRAW_BUFFER1_WEBGL, Rn_GL_DRAW_BUFFER2 as GL_DRAW_BUFFER2, Rn_GL_DRAW_BUFFER2_WEBGL as GL_DRAW_BUFFER2_WEBGL, Rn_GL_DRAW_BUFFER3 as GL_DRAW_BUFFER3, Rn_GL_DRAW_BUFFER3_WEBGL as GL_DRAW_BUFFER3_WEBGL, Rn_GL_DRAW_BUFFER4 as GL_DRAW_BUFFER4, Rn_GL_DRAW_BUFFER4_WEBGL as GL_DRAW_BUFFER4_WEBGL, Rn_GL_DRAW_BUFFER5 as GL_DRAW_BUFFER5, Rn_GL_DRAW_BUFFER5_WEBGL as GL_DRAW_BUFFER5_WEBGL, Rn_GL_DRAW_BUFFER6 as GL_DRAW_BUFFER6, Rn_GL_DRAW_BUFFER6_WEBGL as GL_DRAW_BUFFER6_WEBGL, Rn_GL_DRAW_BUFFER7 as GL_DRAW_BUFFER7, Rn_GL_DRAW_BUFFER7_WEBGL as GL_DRAW_BUFFER7_WEBGL, Rn_GL_DRAW_BUFFER8 as GL_DRAW_BUFFER8, Rn_GL_DRAW_BUFFER8_WEBGL as GL_DRAW_BUFFER8_WEBGL, Rn_GL_DRAW_BUFFER9 as GL_DRAW_BUFFER9, Rn_GL_DRAW_BUFFER9_WEBGL as GL_DRAW_BUFFER9_WEBGL, Rn_GL_DRAW_FRAMEBUFFER as GL_DRAW_FRAMEBUFFER, Rn_GL_DRAW_FRAMEBUFFER_BINDING as GL_DRAW_FRAMEBUFFER_BINDING, Rn_GL_DST_ALPHA as GL_DST_ALPHA, Rn_GL_DST_COLOR as GL_DST_COLOR, Rn_GL_DYNAMIC_COPY as GL_DYNAMIC_COPY, Rn_GL_DYNAMIC_DRAW as GL_DYNAMIC_DRAW, Rn_GL_DYNAMIC_READ as GL_DYNAMIC_READ, Rn_GL_ELEMENT_ARRAY_BUFFER as GL_ELEMENT_ARRAY_BUFFER, Rn_GL_ELEMENT_ARRAY_BUFFER_BINDING as GL_ELEMENT_ARRAY_BUFFER_BINDING, Rn_GL_EQUAL as GL_EQUAL, Rn_GL_FASTEST as GL_FASTEST, Rn_GL_FLOAT_32_UNSIGNED_INT_24_8_REV as GL_FLOAT_32_UNSIGNED_INT_24_8_REV, Rn_GL_FLOAT_MAT2 as GL_FLOAT_MAT2, Rn_GL_FLOAT_MAT2X3 as GL_FLOAT_MAT2X3, Rn_GL_FLOAT_MAT2X4 as GL_FLOAT_MAT2X4, Rn_GL_FLOAT_MAT3 as GL_FLOAT_MAT3, Rn_GL_FLOAT_MAT3X2 as GL_FLOAT_MAT3X2, Rn_GL_FLOAT_MAT3X4 as GL_FLOAT_MAT3X4, Rn_GL_FLOAT_MAT4 as GL_FLOAT_MAT4, Rn_GL_FLOAT_MAT4X2 as GL_FLOAT_MAT4X2, Rn_GL_FLOAT_MAT4X3 as GL_FLOAT_MAT4X3, Rn_GL_FLOAT_VEC2 as GL_FLOAT_VEC2, Rn_GL_FLOAT_VEC3 as GL_FLOAT_VEC3, Rn_GL_FLOAT_VEC4 as GL_FLOAT_VEC4, Rn_GL_FRAGMENT_SHADER as GL_FRAGMENT_SHADER, Rn_GL_FRAGMENT_SHADER_DERIVATIVE_HINT as GL_FRAGMENT_SHADER_DERIVATIVE_HINT, Rn_GL_FRAGMENT_SHADER_DERIVATIVE_HINT_OES as GL_FRAGMENT_SHADER_DERIVATIVE_HINT_OES, Rn_GL_FRAMEBUFFER as GL_FRAMEBUFFER, Rn_GL_FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE as GL_FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE, Rn_GL_FRAMEBUFFER_ATTACHMENT_BLUE_SIZE as GL_FRAMEBUFFER_ATTACHMENT_BLUE_SIZE, Rn_GL_FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING as GL_FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING, Rn_GL_FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT as GL_FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT, Rn_GL_FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE as GL_FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE, Rn_GL_FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT as GL_FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT, Rn_GL_FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE as GL_FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE, Rn_GL_FRAMEBUFFER_ATTACHMENT_GREEN_SIZE as GL_FRAMEBUFFER_ATTACHMENT_GREEN_SIZE, Rn_GL_FRAMEBUFFER_ATTACHMENT_OBJECT_NAME as GL_FRAMEBUFFER_ATTACHMENT_OBJECT_NAME, Rn_GL_FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE as GL_FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE, Rn_GL_FRAMEBUFFER_ATTACHMENT_RED_SIZE as GL_FRAMEBUFFER_ATTACHMENT_RED_SIZE, Rn_GL_FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE as GL_FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE, Rn_GL_FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE as GL_FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE, Rn_GL_FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER as GL_FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER, Rn_GL_FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL as GL_FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL, Rn_GL_FRAMEBUFFER_BINDING as GL_FRAMEBUFFER_BINDING, Rn_GL_FRAMEBUFFER_COMPLETE as GL_FRAMEBUFFER_COMPLETE, Rn_GL_FRAMEBUFFER_DEFAULT as GL_FRAMEBUFFER_DEFAULT, Rn_GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT as GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT, Rn_GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS as GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS, Rn_GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT as GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT, Rn_GL_FRAMEBUFFER_INCOMPLETE_MULTISAMPLE as GL_FRAMEBUFFER_INCOMPLETE_MULTISAMPLE, Rn_GL_FRAMEBUFFER_UNSUPPORTED as GL_FRAMEBUFFER_UNSUPPORTED, Rn_GL_FRONT as GL_FRONT, Rn_GL_FRONT_AND_BACK as GL_FRONT_AND_BACK, Rn_GL_FRONT_FACE as GL_FRONT_FACE, Rn_GL_FUNC_ADD as GL_FUNC_ADD, Rn_GL_FUNC_REVERSE_SUBTRACT as GL_FUNC_REVERSE_SUBTRACT, Rn_GL_FUNC_SUBSTRACT as GL_FUNC_SUBSTRACT, Rn_GL_GENERATE_MIPMAP_HINT as GL_GENERATE_MIPMAP_HINT, Rn_GL_GEQUAL as GL_GEQUAL, Rn_GL_GPU_DISJOINT_EXT as GL_GPU_DISJOINT_EXT, Rn_GL_GREATER as GL_GREATER, Rn_GL_GREEN_BITS as GL_GREEN_BITS, Rn_GL_HALF_FLOAT as GL_HALF_FLOAT, Rn_GL_HALF_FLOAT_OES as GL_HALF_FLOAT_OES, Rn_GL_HIGH_FLOAT as GL_HIGH_FLOAT, Rn_GL_HIGH_INT as GL_HIGH_INT, Rn_GL_IMPLEMENTATION_COLOR_READ_FORMAT as GL_IMPLEMENTATION_COLOR_READ_FORMAT, Rn_GL_IMPLEMENTATION_COLOR_READ_TYPE as GL_IMPLEMENTATION_COLOR_READ_TYPE, Rn_GL_INCR as GL_INCR, Rn_GL_INCR_WRAP as GL_INCR_WRAP, Rn_GL_INTERLEAVED_ATTRIBS as GL_INTERLEAVED_ATTRIBS, Rn_GL_INT_2_10_10_10_REV as GL_INT_2_10_10_10_REV, Rn_GL_INT_SAMPLER_2D as GL_INT_SAMPLER_2D, Rn_GL_INT_SAMPLER_2D_ARRAY as GL_INT_SAMPLER_2D_ARRAY, Rn_GL_INT_SAMPLER_3D as GL_INT_SAMPLER_3D, Rn_GL_INT_SAMPLER_CUBE as GL_INT_SAMPLER_CUBE, Rn_GL_INT_VEC2 as GL_INT_VEC2, Rn_GL_INT_VEC3 as GL_INT_VEC3, Rn_GL_INT_VEC4 as GL_INT_VEC4, Rn_GL_INVALID_ENUM as GL_INVALID_ENUM, Rn_GL_INVALID_FRAMEBUFFER_OPERATION as GL_INVALID_FRAMEBUFFER_OPERATION, Rn_GL_INVALID_INDEX as GL_INVALID_INDEX, Rn_GL_INVALID_OPERATION as GL_INVALID_OPERATION, Rn_GL_INVALID_VALUE as GL_INVALID_VALUE, Rn_GL_INVERT as GL_INVERT, Rn_GL_KEEP as GL_KEEP, Rn_GL_LEQUAL as GL_LEQUAL, Rn_GL_LESS as GL_LESS, Rn_GL_LINEAR as GL_LINEAR, Rn_GL_LINEAR_MIPMAP_LINEAR as GL_LINEAR_MIPMAP_LINEAR, Rn_GL_LINEAR_MIPMAP_NEAREST as GL_LINEAR_MIPMAP_NEAREST, Rn_GL_LINES as GL_LINES, Rn_GL_LINE_LOOP as GL_LINE_LOOP, Rn_GL_LINE_STRIP as GL_LINE_STRIP, Rn_GL_LINE_WIDTH as GL_LINE_WIDTH, Rn_GL_LINK_STATUS as GL_LINK_STATUS, Rn_GL_LOW_FLOAT as GL_LOW_FLOAT, Rn_GL_LOW_INT as GL_LOW_INT, Rn_GL_LUMINANCE as GL_LUMINANCE, Rn_GL_LUMINANCE_ALPHA as GL_LUMINANCE_ALPHA, Rn_GL_MAX as GL_MAX, Rn_GL_MAX_3D_TEXTURE_SIZE as GL_MAX_3D_TEXTURE_SIZE, Rn_GL_MAX_ARRAY_TEXTURE_LAYERS as GL_MAX_ARRAY_TEXTURE_LAYERS, Rn_GL_MAX_CLIENT_WAIT_TIMEOUT_WEBGL as GL_MAX_CLIENT_WAIT_TIMEOUT_WEBGL, Rn_GL_MAX_COLOR_ATTACHMENTS as GL_MAX_COLOR_ATTACHMENTS, Rn_GL_MAX_COLOR_ATTACHMENTS_WEBGL as GL_MAX_COLOR_ATTACHMENTS_WEBGL, Rn_GL_MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS as GL_MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS, Rn_GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS as GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS, Rn_GL_MAX_COMBINED_UNIFORM_BLOCKS as GL_MAX_COMBINED_UNIFORM_BLOCKS, Rn_GL_MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS as GL_MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS, Rn_GL_MAX_CUBE_MAP_TEXTURE_SIZE as GL_MAX_CUBE_MAP_TEXTURE_SIZE, Rn_GL_MAX_DRAW_BUFFERS as GL_MAX_DRAW_BUFFERS, Rn_GL_MAX_DRAW_BUFFERS_WEBGL as GL_MAX_DRAW_BUFFERS_WEBGL, Rn_GL_MAX_ELEMENTS_INDICES as GL_MAX_ELEMENTS_INDICES, Rn_GL_MAX_ELEMENTS_VERTICES as GL_MAX_ELEMENTS_VERTICES, Rn_GL_MAX_ELEMENT_INDEX as GL_MAX_ELEMENT_INDEX, Rn_GL_MAX_EXT as GL_MAX_EXT, Rn_GL_MAX_FRAGMENT_INPUT_COMPONENTS as GL_MAX_FRAGMENT_INPUT_COMPONENTS, Rn_GL_MAX_FRAGMENT_UNIFORM_BLOCKS as GL_MAX_FRAGMENT_UNIFORM_BLOCKS, Rn_GL_MAX_FRAGMENT_UNIFORM_COMPONENTS as GL_MAX_FRAGMENT_UNIFORM_COMPONENTS, Rn_GL_MAX_FRAGMENT_UNIFORM_VECTORS as GL_MAX_FRAGMENT_UNIFORM_VECTORS, Rn_GL_MAX_PROGRAM_TEXEL_OFFSET as GL_MAX_PROGRAM_TEXEL_OFFSET, Rn_GL_MAX_RENDERBUFFER_SIZE as GL_MAX_RENDERBUFFER_SIZE, Rn_GL_MAX_SAMPLES as GL_MAX_SAMPLES, Rn_GL_MAX_SERVER_WAIT_TIMEOUT as GL_MAX_SERVER_WAIT_TIMEOUT, Rn_GL_MAX_TEXTURE_IMAGE_UNITS as GL_MAX_TEXTURE_IMAGE_UNITS, Rn_GL_MAX_TEXTURE_LOD_BIAS as GL_MAX_TEXTURE_LOD_BIAS, Rn_GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT as GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT, Rn_GL_MAX_TEXTURE_SIZE as GL_MAX_TEXTURE_SIZE, Rn_GL_MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS as GL_MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS, Rn_GL_MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS as GL_MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS, Rn_GL_MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS as GL_MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS, Rn_GL_MAX_UNIFORM_BLOCK_SIZE as GL_MAX_UNIFORM_BLOCK_SIZE, Rn_GL_MAX_UNIFORM_BUFFER_BINDINGS as GL_MAX_UNIFORM_BUFFER_BINDINGS, Rn_GL_MAX_VARYING_COMPONENTS as GL_MAX_VARYING_COMPONENTS, Rn_GL_MAX_VARYING_VECTORS as GL_MAX_VARYING_VECTORS, Rn_GL_MAX_VERTEX_ATTRIBS as GL_MAX_VERTEX_ATTRIBS, Rn_GL_MAX_VERTEX_OUTPUT_COMPONENTS as GL_MAX_VERTEX_OUTPUT_COMPONENTS, Rn_GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS as GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS, Rn_GL_MAX_VERTEX_UNIFORM_BLOCKS as GL_MAX_VERTEX_UNIFORM_BLOCKS, Rn_GL_MAX_VERTEX_UNIFORM_COMPONENTS as GL_MAX_VERTEX_UNIFORM_COMPONENTS, Rn_GL_MAX_VERTEX_UNIFORM_VECTORS as GL_MAX_VERTEX_UNIFORM_VECTORS, Rn_GL_MAX_VIEWPORT_DIMS as GL_MAX_VIEWPORT_DIMS, Rn_GL_MEDIUM_FLOAT as GL_MEDIUM_FLOAT, Rn_GL_MEDIUM_INT as GL_MEDIUM_INT, Rn_GL_MIN as GL_MIN, Rn_GL_MIN_EXT as GL_MIN_EXT, Rn_GL_MIN_PROGRAM_TEXEL_OFFSET as GL_MIN_PROGRAM_TEXEL_OFFSET, Rn_GL_MIRRORED_REPEAT as GL_MIRRORED_REPEAT, Rn_GL_NEAREST as GL_NEAREST, Rn_GL_NEAREST_MIPMAP_LINEAR as GL_NEAREST_MIPMAP_LINEAR, Rn_GL_NEAREST_MIPMAP_NEAREST as GL_NEAREST_MIPMAP_NEAREST, Rn_GL_NEVER as GL_NEVER, Rn_GL_NICEST as GL_NICEST, Rn_GL_NONE as GL_NONE, Rn_GL_NOTEQUAL as GL_NOTEQUAL, Rn_GL_NO_ERROR as GL_NO_ERROR, Rn_GL_OBJECT_TYPE as GL_OBJECT_TYPE, Rn_GL_ONE as GL_ONE, Rn_GL_ONE_MINUS_CONSTANT_ALPHA as GL_ONE_MINUS_CONSTANT_ALPHA, Rn_GL_ONE_MINUS_CONSTANT_COLOR as GL_ONE_MINUS_CONSTANT_COLOR, Rn_GL_ONE_MINUS_DST_ALPHA as GL_ONE_MINUS_DST_ALPHA, Rn_GL_ONE_MINUS_DST_COLOR as GL_ONE_MINUS_DST_COLOR, Rn_GL_ONE_MINUS_SRC_ALPHA as GL_ONE_MINUS_SRC_ALPHA, Rn_GL_ONE_MINUS_SRC_COLOR as GL_ONE_MINUS_SRC_COLOR, Rn_GL_OUT_OF_MEMORY as GL_OUT_OF_MEMORY, Rn_GL_PACK_ALIGNMENT as GL_PACK_ALIGNMENT, Rn_GL_PACK_ROW_LENGTH as GL_PACK_ROW_LENGTH, Rn_GL_PACK_SKIP_PIXELS as GL_PACK_SKIP_PIXELS, Rn_GL_PACK_SKIP_ROWS as GL_PACK_SKIP_ROWS, Rn_GL_PIXEL_PACK_BUFFER as GL_PIXEL_PACK_BUFFER, Rn_GL_PIXEL_PACK_BUFFER_BINDING as GL_PIXEL_PACK_BUFFER_BINDING, Rn_GL_PIXEL_UNPACK_BUFFER as GL_PIXEL_UNPACK_BUFFER, Rn_GL_PIXEL_UNPACK_BUFFER_BINDING as GL_PIXEL_UNPACK_BUFFER_BINDING, Rn_GL_PIXEL_UNSIGNED_BYTE as GL_PIXEL_UNSIGNED_BYTE, Rn_GL_PIXEL_UNSIGNED_SHORT_4_4_4_4 as GL_PIXEL_UNSIGNED_SHORT_4_4_4_4, Rn_GL_PIXEL_UNSIGNED_SHORT_5_5_5_1 as GL_PIXEL_UNSIGNED_SHORT_5_5_5_1, Rn_GL_PIXEL_UNSIGNED_SHORT_5_6_5 as GL_PIXEL_UNSIGNED_SHORT_5_6_5, Rn_GL_POINTS as GL_POINTS, Rn_GL_POLYGON_OFFSET_FACTOR as GL_POLYGON_OFFSET_FACTOR, Rn_GL_POLYGON_OFFSET_FILL as GL_POLYGON_OFFSET_FILL, Rn_GL_POLYGON_OFFSET_UNITS as GL_POLYGON_OFFSET_UNITS, Rn_GL_QUERY_COUNTER_BITS_EXT as GL_QUERY_COUNTER_BITS_EXT, Rn_GL_QUERY_RESULT as GL_QUERY_RESULT, Rn_GL_QUERY_RESULT_AVAILABLE as GL_QUERY_RESULT_AVAILABLE, Rn_GL_QUERY_RESULT_AVAILABLE_EXT as GL_QUERY_RESULT_AVAILABLE_EXT, Rn_GL_QUERY_RESULT_EXT as GL_QUERY_RESULT_EXT, Rn_GL_R11F_G11F_B10F as GL_R11F_G11F_B10F, Rn_GL_R16F as GL_R16F, Rn_GL_R16I as GL_R16I, Rn_GL_R16UI as GL_R16UI, Rn_GL_R32F as GL_R32F, Rn_GL_R32I as GL_R32I, Rn_GL_R32UI as GL_R32UI, Rn_GL_R8 as GL_R8, Rn_GL_R8I as GL_R8I, Rn_GL_R8UI as GL_R8UI, Rn_GL_R8_SNORM as GL_R8_SNORM, Rn_GL_RASTERIZER_DISCARD as GL_RASTERIZER_DISCARD, Rn_GL_READ_BUFFER as GL_READ_BUFFER, Rn_GL_READ_FRAMEBUFFER as GL_READ_FRAMEBUFFER, Rn_GL_READ_FRAMEBUFFER_BINDING as GL_READ_FRAMEBUFFER_BINDING, Rn_GL_RED as GL_RED, Rn_GL_RED_BITS as GL_RED_BITS, Rn_GL_RED_INTEGER as GL_RED_INTEGER, Rn_GL_RENDERBUFFER as GL_RENDERBUFFER, Rn_GL_RENDERBUFFER_ALPHA_SIZE as GL_RENDERBUFFER_ALPHA_SIZE, Rn_GL_RENDERBUFFER_BINDING as GL_RENDERBUFFER_BINDING, Rn_GL_RENDERBUFFER_BLUE_SIZE as GL_RENDERBUFFER_BLUE_SIZE, Rn_GL_RENDERBUFFER_DEPTH_SIZE as GL_RENDERBUFFER_DEPTH_SIZE, Rn_GL_RENDERBUFFER_GREEN_SIZE as GL_RENDERBUFFER_GREEN_SIZE, Rn_GL_RENDERBUFFER_HEIGHT as GL_RENDERBUFFER_HEIGHT, Rn_GL_RENDERBUFFER_INTERNAL_FORMAT as GL_RENDERBUFFER_INTERNAL_FORMAT, Rn_GL_RENDERBUFFER_RED_SIZE as GL_RENDERBUFFER_RED_SIZE, Rn_GL_RENDERBUFFER_SAMPLES as GL_RENDERBUFFER_SAMPLES, Rn_GL_RENDERBUFFER_STENCIL_SIZE as GL_RENDERBUFFER_STENCIL_SIZE, Rn_GL_RENDERBUFFER_WIDTH as GL_RENDERBUFFER_WIDTH, Rn_GL_RENDERER as GL_RENDERER, Rn_GL_REPEAT as GL_REPEAT, Rn_GL_REPLACE as GL_REPLACE, Rn_GL_RG as GL_RG, Rn_GL_RG16F as GL_RG16F, Rn_GL_RG16I as GL_RG16I, Rn_GL_RG16UI as GL_RG16UI, Rn_GL_RG32F as GL_RG32F, Rn_GL_RG32I as GL_RG32I, Rn_GL_RG32UI as GL_RG32UI, Rn_GL_RG8 as GL_RG8, Rn_GL_RG8I as GL_RG8I, Rn_GL_RG8UI as GL_RG8UI, Rn_GL_RG8_SNORM as GL_RG8_SNORM, Rn_GL_RGB as GL_RGB, Rn_GL_RGB10_A2 as GL_RGB10_A2, Rn_GL_RGB10_A2UI as GL_RGB10_A2UI, Rn_GL_RGB16F as GL_RGB16F, Rn_GL_RGB16I as GL_RGB16I, Rn_GL_RGB16UI as GL_RGB16UI, Rn_GL_RGB32F as GL_RGB32F, Rn_GL_RGB32F_EXT as GL_RGB32F_EXT, Rn_GL_RGB32I as GL_RGB32I, Rn_GL_RGB32UI as GL_RGB32UI, Rn_GL_RGB565 as GL_RGB565, Rn_GL_RGB5_A1 as GL_RGB5_A1, Rn_GL_RGB8 as GL_RGB8, Rn_GL_RGB8I as GL_RGB8I, Rn_GL_RGB8UI as GL_RGB8UI, Rn_GL_RGB8_SNORM as GL_RGB8_SNORM, Rn_GL_RGB9_E5 as GL_RGB9_E5, Rn_GL_RGBA as GL_RGBA, Rn_GL_RGBA16F as GL_RGBA16F, Rn_GL_RGBA16I as GL_RGBA16I, Rn_GL_RGBA16UI as GL_RGBA16UI, Rn_GL_RGBA32F as GL_RGBA32F, Rn_GL_RGBA32F_EXT as GL_RGBA32F_EXT, Rn_GL_RGBA32I as GL_RGBA32I, Rn_GL_RGBA32UI as GL_RGBA32UI, Rn_GL_RGBA4 as GL_RGBA4, Rn_GL_RGBA8 as GL_RGBA8, Rn_GL_RGBA8I as GL_RGBA8I, Rn_GL_RGBA8UI as GL_RGBA8UI, Rn_GL_RGBA8_SNORM as GL_RGBA8_SNORM, Rn_GL_RGBA_INTEGER as GL_RGBA_INTEGER, Rn_GL_RGB_INTEGER as GL_RGB_INTEGER, Rn_GL_RG_INTEGER as GL_RG_INTEGER, Rn_GL_SAMPLER_2D as GL_SAMPLER_2D, Rn_GL_SAMPLER_2D_ARRAY as GL_SAMPLER_2D_ARRAY, Rn_GL_SAMPLER_2D_ARRAY_SHADOW as GL_SAMPLER_2D_ARRAY_SHADOW, Rn_GL_SAMPLER_2D_SHADOW as GL_SAMPLER_2D_SHADOW, Rn_GL_SAMPLER_3D as GL_SAMPLER_3D, Rn_GL_SAMPLER_BINDING as GL_SAMPLER_BINDING, Rn_GL_SAMPLER_CUBE as GL_SAMPLER_CUBE, Rn_GL_SAMPLER_CUBE_SHADOW as GL_SAMPLER_CUBE_SHADOW, Rn_GL_SAMPLES as GL_SAMPLES, Rn_GL_SAMPLE_ALPHA_TO_COVERAGE as GL_SAMPLE_ALPHA_TO_COVERAGE, Rn_GL_SAMPLE_BUFFERS as GL_SAMPLE_BUFFERS, Rn_GL_SAMPLE_COVERAGE as GL_SAMPLE_COVERAGE, Rn_GL_SAMPLE_COVERAGE_INVERT as GL_SAMPLE_COVERAGE_INVERT, Rn_GL_SAMPLE_COVERAGE_VALUE as GL_SAMPLE_COVERAGE_VALUE, Rn_GL_SCISSOR_BOX as GL_SCISSOR_BOX, Rn_GL_SCISSOR_TEST as GL_SCISSOR_TEST, Rn_GL_SEPARATE_ATTRIBS as GL_SEPARATE_ATTRIBS, Rn_GL_SHADER_TYPE as GL_SHADER_TYPE, Rn_GL_SHADING_LANGUAGE_VERSION as GL_SHADING_LANGUAGE_VERSION, Rn_GL_SIGNALED as GL_SIGNALED, Rn_GL_SIGNED_NORMALIZED as GL_SIGNED_NORMALIZED, Rn_GL_SRC_ALPHA as GL_SRC_ALPHA, Rn_GL_SRC_ALPHA_SATURATE as GL_SRC_ALPHA_SATURATE, Rn_GL_SRC_COLOR as GL_SRC_COLOR, Rn_GL_SRGB as GL_SRGB, Rn_GL_SRGB8 as GL_SRGB8, Rn_GL_SRGB8_ALPHA8 as GL_SRGB8_ALPHA8, Rn_GL_SRGB8_ALPHA8_EXT as GL_SRGB8_ALPHA8_EXT, Rn_GL_SRGB_ALPHA_EXT as GL_SRGB_ALPHA_EXT, Rn_GL_SRGB_EXT as GL_SRGB_EXT, Rn_GL_STATIC_COPY as GL_STATIC_COPY, Rn_GL_STATIC_DRAW as GL_STATIC_DRAW, Rn_GL_STATIC_READ as GL_STATIC_READ, Rn_GL_STENCIL as GL_STENCIL, Rn_GL_STENCIL_ATTACHMENT as GL_STENCIL_ATTACHMENT, Rn_GL_STENCIL_BACK_FAIL as GL_STENCIL_BACK_FAIL, Rn_GL_STENCIL_BACK_FUNC as GL_STENCIL_BACK_FUNC, Rn_GL_STENCIL_BACK_PASS_DEPTH_FAIL as GL_STENCIL_BACK_PASS_DEPTH_FAIL, Rn_GL_STENCIL_BACK_PASS_DEPTH_PASS as GL_STENCIL_BACK_PASS_DEPTH_PASS, Rn_GL_STENCIL_BACK_REF as GL_STENCIL_BACK_REF, Rn_GL_STENCIL_BACK_VALUE_MASK as GL_STENCIL_BACK_VALUE_MASK, Rn_GL_STENCIL_BACK_WRITEMASK as GL_STENCIL_BACK_WRITEMASK, Rn_GL_STENCIL_BITS as GL_STENCIL_BITS, Rn_GL_STENCIL_BUFFER_BIT as GL_STENCIL_BUFFER_BIT, Rn_GL_STENCIL_CLEAR_VALUE as GL_STENCIL_CLEAR_VALUE, Rn_GL_STENCIL_FAIL as GL_STENCIL_FAIL, Rn_GL_STENCIL_FUNC as GL_STENCIL_FUNC, Rn_GL_STENCIL_INDEX as GL_STENCIL_INDEX, Rn_GL_STENCIL_INDEX8 as GL_STENCIL_INDEX8, Rn_GL_STENCIL_PASS_DEPTH_FAIL as GL_STENCIL_PASS_DEPTH_FAIL, Rn_GL_STENCIL_PASS_DEPTH_PASS as GL_STENCIL_PASS_DEPTH_PASS, Rn_GL_STENCIL_REF as GL_STENCIL_REF, Rn_GL_STENCIL_TEST as GL_STENCIL_TEST, Rn_GL_STENCIL_VALUE_MASK as GL_STENCIL_VALUE_MASK, Rn_GL_STENCIL_WRITEMASK as GL_STENCIL_WRITEMASK, Rn_GL_STREAM_COPY as GL_STREAM_COPY, Rn_GL_STREAM_DRAW as GL_STREAM_DRAW, Rn_GL_STREAM_READ as GL_STREAM_READ, Rn_GL_SUBPIXEL_BITS as GL_SUBPIXEL_BITS, Rn_GL_SYNC_CONDITION as GL_SYNC_CONDITION, Rn_GL_SYNC_FENCE as GL_SYNC_FENCE, Rn_GL_SYNC_FLAGS as GL_SYNC_FLAGS, Rn_GL_SYNC_FLUSH_COMMANDS_BIT as GL_SYNC_FLUSH_COMMANDS_BIT, Rn_GL_SYNC_GPU_COMMANDS_COMPLETE as GL_SYNC_GPU_COMMANDS_COMPLETE, Rn_GL_SYNC_STATUS as GL_SYNC_STATUS, Rn_GL_TEXTURE as GL_TEXTURE, Rn_GL_TEXTURE0 as GL_TEXTURE0, Rn_GL_TEXTURE1 as GL_TEXTURE1, Rn_GL_TEXTURE10 as GL_TEXTURE10, Rn_GL_TEXTURE11 as GL_TEXTURE11, Rn_GL_TEXTURE12 as GL_TEXTURE12, Rn_GL_TEXTURE13 as GL_TEXTURE13, Rn_GL_TEXTURE14 as GL_TEXTURE14, Rn_GL_TEXTURE15 as GL_TEXTURE15, Rn_GL_TEXTURE16 as GL_TEXTURE16, Rn_GL_TEXTURE17 as GL_TEXTURE17, Rn_GL_TEXTURE18 as GL_TEXTURE18, Rn_GL_TEXTURE19 as GL_TEXTURE19, Rn_GL_TEXTURE2 as GL_TEXTURE2, Rn_GL_TEXTURE20 as GL_TEXTURE20, Rn_GL_TEXTURE21 as GL_TEXTURE21, Rn_GL_TEXTURE22 as GL_TEXTURE22, Rn_GL_TEXTURE23 as GL_TEXTURE23, Rn_GL_TEXTURE24 as GL_TEXTURE24, Rn_GL_TEXTURE25 as GL_TEXTURE25, Rn_GL_TEXTURE26 as GL_TEXTURE26, Rn_GL_TEXTURE27 as GL_TEXTURE27, Rn_GL_TEXTURE28 as GL_TEXTURE28, Rn_GL_TEXTURE29 as GL_TEXTURE29, Rn_GL_TEXTURE3 as GL_TEXTURE3, Rn_GL_TEXTURE30 as GL_TEXTURE30, Rn_GL_TEXTURE31 as GL_TEXTURE31, Rn_GL_TEXTURE4 as GL_TEXTURE4, Rn_GL_TEXTURE5 as GL_TEXTURE5, Rn_GL_TEXTURE6 as GL_TEXTURE6, Rn_GL_TEXTURE7 as GL_TEXTURE7, Rn_GL_TEXTURE8 as GL_TEXTURE8, Rn_GL_TEXTURE9 as GL_TEXTURE9, Rn_GL_TEXTURE_2D as GL_TEXTURE_2D, Rn_GL_TEXTURE_2D_ARRAY as GL_TEXTURE_2D_ARRAY, Rn_GL_TEXTURE_3D as GL_TEXTURE_3D, Rn_GL_TEXTURE_BASE_LEVEL as GL_TEXTURE_BASE_LEVEL, Rn_GL_TEXTURE_BINDING_2D as GL_TEXTURE_BINDING_2D, Rn_GL_TEXTURE_BINDING_2D_ARRAY as GL_TEXTURE_BINDING_2D_ARRAY, Rn_GL_TEXTURE_BINDING_3D as GL_TEXTURE_BINDING_3D, Rn_GL_TEXTURE_BINDING_CUBE_MAP as GL_TEXTURE_BINDING_CUBE_MAP, Rn_GL_TEXTURE_COMPARE_FUNC as GL_TEXTURE_COMPARE_FUNC, Rn_GL_TEXTURE_COMPARE_MODE as GL_TEXTURE_COMPARE_MODE, Rn_GL_TEXTURE_CUBE_MAP as GL_TEXTURE_CUBE_MAP, Rn_GL_TEXTURE_CUBE_MAP_NEGATIVE_X as GL_TEXTURE_CUBE_MAP_NEGATIVE_X, Rn_GL_TEXTURE_CUBE_MAP_NEGATIVE_Y as GL_TEXTURE_CUBE_MAP_NEGATIVE_Y, Rn_GL_TEXTURE_CUBE_MAP_NEGATIVE_Z as GL_TEXTURE_CUBE_MAP_NEGATIVE_Z, Rn_GL_TEXTURE_CUBE_MAP_POSITIVE_X as GL_TEXTURE_CUBE_MAP_POSITIVE_X, Rn_GL_TEXTURE_CUBE_MAP_POSITIVE_Y as GL_TEXTURE_CUBE_MAP_POSITIVE_Y, Rn_GL_TEXTURE_CUBE_MAP_POSITIVE_Z as GL_TEXTURE_CUBE_MAP_POSITIVE_Z, Rn_GL_TEXTURE_IMMUTABLE_FORMAT as GL_TEXTURE_IMMUTABLE_FORMAT, Rn_GL_TEXTURE_IMMUTABLE_LEVELS as GL_TEXTURE_IMMUTABLE_LEVELS, Rn_GL_TEXTURE_MAG_FILTER as GL_TEXTURE_MAG_FILTER, Rn_GL_TEXTURE_MAX_ANISOTROPY_EXT as GL_TEXTURE_MAX_ANISOTROPY_EXT, Rn_GL_TEXTURE_MAX_LEVEL as GL_TEXTURE_MAX_LEVEL, Rn_GL_TEXTURE_MAX_LOD as GL_TEXTURE_MAX_LOD, Rn_GL_TEXTURE_MIN_FILTER as GL_TEXTURE_MIN_FILTER, Rn_GL_TEXTURE_MIN_LOD as GL_TEXTURE_MIN_LOD, Rn_GL_TEXTURE_WRAP_R as GL_TEXTURE_WRAP_R, Rn_GL_TEXTURE_WRAP_S as GL_TEXTURE_WRAP_S, Rn_GL_TEXTURE_WRAP_T as GL_TEXTURE_WRAP_T, Rn_GL_TIMEOUT_EXPIRED as GL_TIMEOUT_EXPIRED, Rn_GL_TIMEOUT_IGNORED as GL_TIMEOUT_IGNORED, Rn_GL_TIMESTAMP_EXT as GL_TIMESTAMP_EXT, Rn_GL_TIME_ELAPSED_EXT as GL_TIME_ELAPSED_EXT, Rn_GL_TRANSFORM_FEEDBACK as GL_TRANSFORM_FEEDBACK, Rn_GL_TRANSFORM_FEEDBACK_ACTIVE as GL_TRANSFORM_FEEDBACK_ACTIVE, Rn_GL_TRANSFORM_FEEDBACK_BINDING as GL_TRANSFORM_FEEDBACK_BINDING, Rn_GL_TRANSFORM_FEEDBACK_BUFFER as GL_TRANSFORM_FEEDBACK_BUFFER, Rn_GL_TRANSFORM_FEEDBACK_BUFFER_BINDING as GL_TRANSFORM_FEEDBACK_BUFFER_BINDING, Rn_GL_TRANSFORM_FEEDBACK_BUFFER_MODE as GL_TRANSFORM_FEEDBACK_BUFFER_MODE, Rn_GL_TRANSFORM_FEEDBACK_BUFFER_SIZE as GL_TRANSFORM_FEEDBACK_BUFFER_SIZE, Rn_GL_TRANSFORM_FEEDBACK_BUFFER_START as GL_TRANSFORM_FEEDBACK_BUFFER_START, Rn_GL_TRANSFORM_FEEDBACK_PAUSED as GL_TRANSFORM_FEEDBACK_PAUSED, Rn_GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN as GL_TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN, Rn_GL_TRANSFORM_FEEDBACK_VARYINGS as GL_TRANSFORM_FEEDBACK_VARYINGS, Rn_GL_TRIANGLES as GL_TRIANGLES, Rn_GL_TRIANGLE_FAN as GL_TRIANGLE_FAN, Rn_GL_TRIANGLE_STRIP as GL_TRIANGLE_STRIP, Rn_GL_UNIFORM_ARRAY_STRIDE as GL_UNIFORM_ARRAY_STRIDE, Rn_GL_UNIFORM_BLOCK_ACTIVE_UNIFORMS as GL_UNIFORM_BLOCK_ACTIVE_UNIFORMS, Rn_GL_UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES as GL_UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES, Rn_GL_UNIFORM_BLOCK_BINDING as GL_UNIFORM_BLOCK_BINDING, Rn_GL_UNIFORM_BLOCK_DATA_SIZE as GL_UNIFORM_BLOCK_DATA_SIZE, Rn_GL_UNIFORM_BLOCK_INDEX as GL_UNIFORM_BLOCK_INDEX, Rn_GL_UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER as GL_UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER, Rn_GL_UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER as GL_UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER, Rn_GL_UNIFORM_BUFFER as GL_UNIFORM_BUFFER, Rn_GL_UNIFORM_BUFFER_BINDING as GL_UNIFORM_BUFFER_BINDING, Rn_GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT as GL_UNIFORM_BUFFER_OFFSET_ALIGNMENT, Rn_GL_UNIFORM_BUFFER_SIZE as GL_UNIFORM_BUFFER_SIZE, Rn_GL_UNIFORM_BUFFER_START as GL_UNIFORM_BUFFER_START, Rn_GL_UNIFORM_IS_ROW_MAJOR as GL_UNIFORM_IS_ROW_MAJOR, Rn_GL_UNIFORM_MATRIX_STRIDE as GL_UNIFORM_MATRIX_STRIDE, Rn_GL_UNIFORM_OFFSET as GL_UNIFORM_OFFSET, Rn_GL_UNIFORM_SIZE as GL_UNIFORM_SIZE, Rn_GL_UNIFORM_TYPE as GL_UNIFORM_TYPE, Rn_GL_UNMASKED_RENDERER_WEBGL as GL_UNMASKED_RENDERER_WEBGL, Rn_GL_UNMASKED_VENDOR_WEBGL as GL_UNMASKED_VENDOR_WEBGL, Rn_GL_UNPACK_ALIGNMENT as GL_UNPACK_ALIGNMENT, Rn_GL_UNPACK_COLORSPACE_CONVERSION_WEBGL as GL_UNPACK_COLORSPACE_CONVERSION_WEBGL, Rn_GL_UNPACK_FLIP_Y_WEBGL as GL_UNPACK_FLIP_Y_WEBGL, Rn_GL_UNPACK_IMAGE_HEIGHT as GL_UNPACK_IMAGE_HEIGHT, Rn_GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL as GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL, Rn_GL_UNPACK_ROW_LENGTH as GL_UNPACK_ROW_LENGTH, Rn_GL_UNPACK_SKIP_IMAGES as GL_UNPACK_SKIP_IMAGES, Rn_GL_UNPACK_SKIP_PIXELS as GL_UNPACK_SKIP_PIXELS, Rn_GL_UNPACK_SKIP_ROWS as GL_UNPACK_SKIP_ROWS, Rn_GL_UNSIGNALED as GL_UNSIGNALED, Rn_GL_UNSIGNED_INT_10F_11F_11F_REV as GL_UNSIGNED_INT_10F_11F_11F_REV, Rn_GL_UNSIGNED_INT_24_8 as GL_UNSIGNED_INT_24_8, Rn_GL_UNSIGNED_INT_24_8_WEBGL as GL_UNSIGNED_INT_24_8_WEBGL, Rn_GL_UNSIGNED_INT_2_10_10_10_REV as GL_UNSIGNED_INT_2_10_10_10_REV, Rn_GL_UNSIGNED_INT_5_9_9_9_REV as GL_UNSIGNED_INT_5_9_9_9_REV, Rn_GL_UNSIGNED_INT_SAMPLER_2D as GL_UNSIGNED_INT_SAMPLER_2D, Rn_GL_UNSIGNED_INT_SAMPLER_2D_ARRAY as GL_UNSIGNED_INT_SAMPLER_2D_ARRAY, Rn_GL_UNSIGNED_INT_SAMPLER_3D as GL_UNSIGNED_INT_SAMPLER_3D, Rn_GL_UNSIGNED_INT_SAMPLER_CUBE as GL_UNSIGNED_INT_SAMPLER_CUBE, Rn_GL_UNSIGNED_INT_VEC2 as GL_UNSIGNED_INT_VEC2, Rn_GL_UNSIGNED_INT_VEC3 as GL_UNSIGNED_INT_VEC3, Rn_GL_UNSIGNED_INT_VEC4 as GL_UNSIGNED_INT_VEC4, Rn_GL_UNSIGNED_NORMALIZED as GL_UNSIGNED_NORMALIZED, Rn_GL_UNSIGNED_NORMALIZED_EXT as GL_UNSIGNED_NORMALIZED_EXT, Rn_GL_VALIDATE_STATUS as GL_VALIDATE_STATUS, Rn_GL_VENDOR as GL_VENDOR, Rn_GL_VERSION as GL_VERSION, Rn_GL_VERTEX_ARRAY_BINDING as GL_VERTEX_ARRAY_BINDING, Rn_GL_VERTEX_ARRAY_BINDING_OES as GL_VERTEX_ARRAY_BINDING_OES, Rn_GL_VERTEX_ATTRIB_ARRAY_BUFFER_BINDING as GL_VERTEX_ATTRIB_ARRAY_BUFFER_BINDING, Rn_GL_VERTEX_ATTRIB_ARRAY_DIVISOR as GL_VERTEX_ATTRIB_ARRAY_DIVISOR, Rn_GL_VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE as GL_VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE, Rn_GL_VERTEX_ATTRIB_ARRAY_ENABLED as GL_VERTEX_ATTRIB_ARRAY_ENABLED, Rn_GL_VERTEX_ATTRIB_ARRAY_INTEGER as GL_VERTEX_ATTRIB_ARRAY_INTEGER, Rn_GL_VERTEX_ATTRIB_ARRAY_NORMALIZED as GL_VERTEX_ATTRIB_ARRAY_NORMALIZED, Rn_GL_VERTEX_ATTRIB_ARRAY_POINTER as GL_VERTEX_ATTRIB_ARRAY_POINTER, Rn_GL_VERTEX_ATTRIB_ARRAY_SIZE as GL_VERTEX_ATTRIB_ARRAY_SIZE, Rn_GL_VERTEX_ATTRIB_ARRAY_STRIDE as GL_VERTEX_ATTRIB_ARRAY_STRIDE, Rn_GL_VERTEX_ATTRIB_ARRAY_TYPE as GL_VERTEX_ATTRIB_ARRAY_TYPE, Rn_GL_VERTEX_SHADER as GL_VERTEX_SHADER, Rn_GL_VIEWPORT as GL_VIEWPORT, Rn_GL_WAIT_FAILED as GL_WAIT_FAILED, Rn_GL_ZERO as GL_ZERO, Rn_GaussianBlur as GaussianBlur, Rn_GetComponentFromEntities as GetComponentFromEntities, type Rn_GetInstance as GetInstance, type Rn_GetProps as GetProps, Rn_Gizmo as Gizmo, Rn_GlobalDataRepository as GlobalDataRepository, Rn_GlobalRetarget as GlobalRetarget, Rn_GlobalRetargetReverse as GlobalRetargetReverse, type Rn_Gltf1AnyObject as Gltf1AnyObject, type Rn_Gltf2 as Gltf2, type Rn_Gltf2Accessor as Gltf2Accessor, type Rn_Gltf2AccessorComponentType as Gltf2AccessorComponentType, type Rn_Gltf2AccessorComponentTypeNumber as Gltf2AccessorComponentTypeNumber, type Rn_Gltf2AccessorCompositionType as Gltf2AccessorCompositionType, type Rn_Gltf2AccessorCompositionTypeString as Gltf2AccessorCompositionTypeString, type Rn_Gltf2AccessorEx as Gltf2AccessorEx, type Rn_Gltf2AccessorIndex as Gltf2AccessorIndex, type Rn_Gltf2Animation as Gltf2Animation, type Rn_Gltf2AnimationAccessorCompositionType as Gltf2AnimationAccessorCompositionType, type Rn_Gltf2AnimationAccessorCompositionTypeString as Gltf2AnimationAccessorCompositionTypeString, type Rn_Gltf2AnimationChannel as Gltf2AnimationChannel, type Rn_Gltf2AnimationChannelTarget as Gltf2AnimationChannelTarget, type Rn_Gltf2AnimationPathName as Gltf2AnimationPathName, type Rn_Gltf2AnimationSampler as Gltf2AnimationSampler, type Rn_Gltf2AnimationSamplerInterpolation as Gltf2AnimationSamplerInterpolation, type Rn_Gltf2AnyObject as Gltf2AnyObject, type Rn_Gltf2Asset as Gltf2Asset, type Rn_Gltf2AttributeAccessors as Gltf2AttributeAccessors, type Rn_Gltf2AttributeBlendShapes as Gltf2AttributeBlendShapes, type Rn_Gltf2AttributeBlendShapesAccessors as Gltf2AttributeBlendShapesAccessors, type Rn_Gltf2Attributes as Gltf2Attributes, type Rn_Gltf2Buffer as Gltf2Buffer, type Rn_Gltf2BufferView as Gltf2BufferView, type Rn_Gltf2BufferViewEx as Gltf2BufferViewEx, type Rn_Gltf2Camera as Gltf2Camera, type Rn_Gltf2CameraOrthographic as Gltf2CameraOrthographic, type Rn_Gltf2CameraPerspective as Gltf2CameraPerspective, type Rn_Gltf2Ex as Gltf2Ex, type Rn_Gltf2ExportType as Gltf2ExportType, Rn_Gltf2Exporter as Gltf2Exporter, type Rn_Gltf2ExporterArguments as Gltf2ExporterArguments, type Rn_Gltf2Image as Gltf2Image, type Rn_Gltf2ImageEx as Gltf2ImageEx, Rn_Gltf2Importer as Gltf2Importer, type Rn_Gltf2Material as Gltf2Material, type Rn_Gltf2MaterialEx as Gltf2MaterialEx, type Rn_Gltf2Mesh as Gltf2Mesh, type Rn_Gltf2Node as Gltf2Node, type Rn_Gltf2NormalTextureInfo as Gltf2NormalTextureInfo, type Rn_Gltf2OcclusionTextureInfo as Gltf2OcclusionTextureInfo, type Rn_Gltf2PbrMetallicRoughness as Gltf2PbrMetallicRoughness, type Rn_Gltf2PbrMetallicRoughnessEx as Gltf2PbrMetallicRoughnessEx, type Rn_Gltf2Primitive as Gltf2Primitive, type Rn_Gltf2Scene as Gltf2Scene, type Rn_Gltf2Skin as Gltf2Skin, type Rn_Gltf2Sparse as Gltf2Sparse, type Rn_Gltf2SparseIndices as Gltf2SparseIndices, type Rn_Gltf2SparseValues as Gltf2SparseValues, type Rn_Gltf2Texture as Gltf2Texture, type Rn_Gltf2TextureInfo as Gltf2TextureInfo, type Rn_Gltf2TextureSampler as Gltf2TextureSampler, type Rn_GltfFileBuffers as GltfFileBuffers, Rn_GltfImporter as GltfImporter, type Rn_GltfLoadOption as GltfLoadOption, Rn_GreaterShaderNode as GreaterShaderNode, Rn_Grid as Grid, type Rn_GridDescriptor as GridDescriptor, Rn_HdriFormat as HdriFormat, type Rn_HdriFormatEnum as HdriFormatEnum, type Rn_IAnimationEntity as IAnimationEntity, type Rn_IAnimationEntityMethods as IAnimationEntityMethods, type Rn_IAnimationRetarget as IAnimationRetarget, type Rn_IAnimationStateEntity as IAnimationStateEntity, type Rn_IAnyPrimitiveDescriptor as IAnyPrimitiveDescriptor, type Rn_IArrayBufferBasedMathNumber as IArrayBufferBasedMathNumber, type Rn_IBlendShapeEntity as IBlendShapeEntity, type Rn_IBlendShapeEntityMethods as IBlendShapeEntityMethods, type Rn_ICGAPIResourceRepository as ICGAPIResourceRepository, type Rn_ICameraController as ICameraController, type Rn_ICameraControllerEntity as ICameraControllerEntity, type Rn_ICameraControllerEntityMethods as ICameraControllerEntityMethods, type Rn_ICameraEntity as ICameraEntity, type Rn_ICameraEntityMethods as ICameraEntityMethods, type Rn_IColorRgb as IColorRgb, type Rn_IColorRgba as IColorRgba, type Rn_IConstraintEntity as IConstraintEntity, type Rn_IEffekseerEntityMethods as IEffekseerEntityMethods, type Rn_IEnhancedArrayMethods as IEnhancedArrayMethods, type Rn_IEntity as IEntity, type Rn_IEventPubSub as IEventPubSub, type Rn_ILightEntity as ILightEntity, type Rn_ILightEntityMethods as ILightEntityMethods, type Rn_ILoaderExtension as ILoaderExtension, type Rn_ILogQuaternion as ILogQuaternion, type Rn_IMatrix as IMatrix, type Rn_IMatrix22 as IMatrix22, type Rn_IMatrix33 as IMatrix33, type Rn_IMatrix44 as IMatrix44, type Rn_IMesh as IMesh, type Rn_IMeshEntity as IMeshEntity, type Rn_IMeshEntityMethods as IMeshEntityMethods, type Rn_IMeshRendererEntityMethods as IMeshRendererEntityMethods, type Rn_IMutableColorRgb as IMutableColorRgb, type Rn_IMutableColorRgba as IMutableColorRgba, type Rn_IMutableMatrix as IMutableMatrix, type Rn_IMutableMatrix22 as IMutableMatrix22, type Rn_IMutableMatrix33 as IMutableMatrix33, type Rn_IMutableMatrix44 as IMutableMatrix44, type Rn_IMutableQuaternion as IMutableQuaternion, type Rn_IMutableScalar as IMutableScalar, type Rn_IMutableVector as IMutableVector, type Rn_IMutableVector2 as IMutableVector2, type Rn_IMutableVector3 as IMutableVector3, type Rn_IMutableVector4 as IMutableVector4, Rn_INPUT_HANDLING_STATE_CAMERA_CONTROLLER as INPUT_HANDLING_STATE_CAMERA_CONTROLLER, Rn_INPUT_HANDLING_STATE_GIZMO_SCALE as INPUT_HANDLING_STATE_GIZMO_SCALE, Rn_INPUT_HANDLING_STATE_GIZMO_TRANSLATION as INPUT_HANDLING_STATE_GIZMO_TRANSLATION, Rn_INPUT_HANDLING_STATE_NONE as INPUT_HANDLING_STATE_NONE, type Rn_IPhysicsEntity as IPhysicsEntity, type Rn_IPhysicsEntityMethods as IPhysicsEntityMethods, type Rn_IQuaternion as IQuaternion, type Rn_IRenderable as IRenderable, type Rn_IRnObject as IRnObject, type Rn_IScalar as IScalar, type Rn_ISceneGraphEntity as ISceneGraphEntity, type Rn_ISceneGraphEntityMethods as ISceneGraphEntityMethods, type Rn_ISemanticVertexAttribute as ISemanticVertexAttribute, Rn_IShape as IShape, type Rn_ISkeletalEntity as ISkeletalEntity, type Rn_ISkeletalEntityMethods as ISkeletalEntityMethods, type Rn_ITransformEntity as ITransformEntity, type Rn_ITransformEntityMethods as ITransformEntityMethods, type Rn_IVector as IVector, type Rn_IVector2 as IVector2, type Rn_IVector3 as IVector3, type Rn_IVector4 as IVector4, type Rn_IVrmEntityMethods as IVrmEntityMethods, type Rn_IWeakOption as IWeakOption, Rn_IdentityMatrix33 as IdentityMatrix33, Rn_IdentityMatrix44 as IdentityMatrix44, Rn_IfStatementShader as IfStatementShader, Rn_IfStatementShaderNode as IfStatementShaderNode, type Rn_ImageBitmapData as ImageBitmapData, Rn_ImageInfo as ImageInfo, Rn_ImageUtil as ImageUtil, type Rn_Index as Index, type Rn_IndexOf16Bytes as IndexOf16Bytes, type Rn_IndexOf4Bytes as IndexOf4Bytes, type Rn_IndicesAccessOption as IndicesAccessOption, type Rn_InputHandlerInfo as InputHandlerInfo, type Rn_InputHandlingState as InputHandlingState, Rn_InputManager as InputManager, type Rn_IntegerTypedArray as IntegerTypedArray, Rn_Is as Is, Rn_IsObj as IsObj, type Rn_IsType as IsType, Rn_Joint as Joint, type Rn_JointDescriptor as JointDescriptor, type Rn_KHR_interactivity as KHR_interactivity, type Rn_KHR_interactivity_Configuration as KHR_interactivity_Configuration, type Rn_KHR_interactivity_Declaration as KHR_interactivity_Declaration, type Rn_KHR_interactivity_Event as KHR_interactivity_Event, type Rn_KHR_interactivity_Flow as KHR_interactivity_Flow, type Rn_KHR_interactivity_Graph as KHR_interactivity_Graph, type Rn_KHR_interactivity_Node as KHR_interactivity_Node, type Rn_KHR_interactivity_Type as KHR_interactivity_Type, type Rn_KHR_interactivity_Value as KHR_interactivity_Value, type Rn_KHR_interactivity_Variable as KHR_interactivity_Variable, type Rn_KHR_interactivity_value_type as KHR_interactivity_value_type, type Rn_KHR_lights_punctual as KHR_lights_punctual, type Rn_KHR_lights_punctual_Light as KHR_lights_punctual_Light, Rn_KTX2TextureLoader as KTX2TextureLoader, Rn_LightComponent as LightComponent, Rn_LightGizmo as LightGizmo, Rn_LightType as LightType, type Rn_LightTypeEnum as LightTypeEnum, Rn_Line as Line, type Rn_LineDescriptor as LineDescriptor, type Rn_LoadImageToMipLevelDescriptor as LoadImageToMipLevelDescriptor, Rn_LocatorGizmo as LocatorGizmo, Rn_LogLevel as LogLevel, Rn_LogQuaternion as LogQuaternion, Rn_Logger as Logger, type Rn_MSC_TRANSCODER as MSC_TRANSCODER, Rn_MToon0xMaterialContent as MToon0xMaterialContent, Rn_MToon1MaterialContent as MToon1MaterialContent, Rn_MatCapMaterialContent as MatCapMaterialContent, Rn_Material as Material, Rn_MaterialHelper as MaterialHelper, type MaterialNodeUID$1 as MaterialNodeUID, Rn_MaterialRepository as MaterialRepository, type Rn_MaterialSID as MaterialSID, type Rn_MaterialTID as MaterialTID, type Rn_MaterialTypeName as MaterialTypeName, type Rn_MaterialUID as MaterialUID, Rn_MathClassUtil as MathClassUtil, Rn_MathUtil as MathUtil, Rn_Matrix22 as Matrix22, Rn_Matrix33 as Matrix33, Rn_Matrix44 as Matrix44, Rn_MemoryManager as MemoryManager, type Rn_MergeCtor as MergeCtor, Rn_MergeVectorShaderNode as MergeVectorShaderNode, Rn_Mesh as Mesh, Rn_MeshComponent as MeshComponent, Rn_MeshHelper as MeshHelper, Rn_MeshRendererComponent as MeshRendererComponent, type Rn_MeshUID as MeshUID, type Rn_MilliSecond as MilliSecond, Rn_MiscUtil as MiscUtil, type Rn_MixinBase as MixinBase, Rn_ModelConverter as ModelConverter, Rn_ModuleManager as ModuleManager, type Rn_MscTranscoderModule as MscTranscoderModule, Rn_MultiplyShaderNode as MultiplyShaderNode, Rn_MutableColorRgb as MutableColorRgb, Rn_MutableColorRgba as MutableColorRgba, Rn_MutableMatrix22 as MutableMatrix22, Rn_MutableMatrix33 as MutableMatrix33, Rn_MutableMatrix44 as MutableMatrix44, Rn_MutableQuaternion as MutableQuaternion, Rn_MutableScalar as MutableScalar, Rn_MutableScalar_ as MutableScalar_, Rn_MutableScalard as MutableScalard, type Rn_MutableScalarf as MutableScalarf, Rn_MutableVector2 as MutableVector2, Rn_MutableVector2_ as MutableVector2_, Rn_MutableVector2d as MutableVector2d, type Rn_MutableVector2f as MutableVector2f, Rn_MutableVector3 as MutableVector3, Rn_MutableVector3_ as MutableVector3_, Rn_MutableVector3d as MutableVector3d, type Rn_MutableVector3f as MutableVector3f, Rn_MutableVector4 as MutableVector4, Rn_MutableVector4_ as MutableVector4_, Rn_MutableVector4d as MutableVector4d, type Rn_MutableVector4f as MutableVector4f, Rn_None as None, Rn_NormalMatrixShaderNode as NormalMatrixShaderNode, Rn_NormalizeShaderNode as NormalizeShaderNode, type Rn_ObjectUID as ObjectUID, type Rn_Offset as Offset, Rn_OimoPhysicsStrategy as OimoPhysicsStrategy, Rn_Ok as Ok, type Rn_Option as Option, Rn_OrbitCameraController as OrbitCameraController, Rn_OutColorShaderNode as OutColorShaderNode, Rn_OutPositionShaderNode as OutPositionShaderNode, type Rn_PartialRequire as PartialRequire, Rn_PhysicsComponent as PhysicsComponent, type Rn_PhysicsProperty as PhysicsProperty, type Rn_PhysicsPropertyInner as PhysicsPropertyInner, type Rn_PhysicsStrategy as PhysicsStrategy, type Rn_PhysicsWorldProperty as PhysicsWorldProperty, Rn_PixelFormat as PixelFormat, type Rn_PixelFormatEnum as PixelFormatEnum, Rn_Plane as Plane, type Rn_PlaneDescriptor as PlaneDescriptor, Rn_PointShadowMap as PointShadowMap, type Rn_PointType as PointType, Rn_Primitive as Primitive, type Rn_PrimitiveDescriptor as PrimitiveDescriptor, Rn_PrimitiveMode as PrimitiveMode, type Rn_PrimitiveModeEnum as PrimitiveModeEnum, type Rn_PrimitiveSortKey as PrimitiveSortKey, type Rn_PrimitiveSortKeyLength as PrimitiveSortKeyLength, type Rn_PrimitiveSortKeyOffset as PrimitiveSortKeyOffset, Rn_PrimitiveSortKey_BitLength_Depth as PrimitiveSortKey_BitLength_Depth, Rn_PrimitiveSortKey_BitLength_Material as PrimitiveSortKey_BitLength_Material, Rn_PrimitiveSortKey_BitLength_PrimitiveType as PrimitiveSortKey_BitLength_PrimitiveType, Rn_PrimitiveSortKey_BitLength_TranslucencyType as PrimitiveSortKey_BitLength_TranslucencyType, Rn_PrimitiveSortKey_BitOffset_Material as PrimitiveSortKey_BitOffset_Material, Rn_PrimitiveSortKey_BitOffset_PrimitiveType as PrimitiveSortKey_BitOffset_PrimitiveType, Rn_PrimitiveSortKey_BitOffset_TranslucencyType as PrimitiveSortKey_BitOffset_TranslucencyType, Rn_PrimitiveSortKey_BitOffset_ViewportLayer as PrimitiveSortKey_BitOffset_ViewportLayer, type Rn_PrimitiveUID as PrimitiveUID, Rn_ProcessApproach as ProcessApproach, Rn_ProcessApproachClass as ProcessApproachClass, type Rn_ProcessApproachEnum as ProcessApproachEnum, Rn_ProcessStage as ProcessStage, type Rn_ProcessStageEnum as ProcessStageEnum, Rn_ProjectionMatrixShaderNode as ProjectionMatrixShaderNode, Rn_Quaternion as Quaternion, type Rn_RaycastResult as RaycastResult, type Rn_RaycastResultEx1 as RaycastResultEx1, type Rn_RaycastResultEx2 as RaycastResultEx2, Rn_RenderBuffer as RenderBuffer, Rn_RenderBufferTarget as RenderBufferTarget, type Rn_RenderBufferTargetEnum as RenderBufferTargetEnum, Rn_RenderPass as RenderPass, Rn_RenderPassHelper as RenderPassHelper, type Rn_RenderPassUID as RenderPassUID, Rn_RenderTargetTexture as RenderTargetTexture, Rn_RenderTargetTexture2DArray as RenderTargetTexture2DArray, Rn_RenderTargetTextureCube as RenderTargetTextureCube, Rn_RenderableHelper as RenderableHelper, type Rn_RenderingArgWebGL as RenderingArgWebGL, type Rn_RenderingArgWebGpu as RenderingArgWebGpu, type Rn_RequireOne as RequireOne, type Rn_Result as Result, Rn_RhodoniteImportExtension as RhodoniteImportExtension, type Rn_RnError as RnError, Rn_RnException as RnException, type Rn_RnM2 as RnM2, type Rn_RnM2Accessor as RnM2Accessor, type Rn_RnM2Animation as RnM2Animation, type Rn_RnM2AnimationChannel as RnM2AnimationChannel, type Rn_RnM2AnimationChannelTarget as RnM2AnimationChannelTarget, type Rn_RnM2AnimationSampler as RnM2AnimationSampler, type Rn_RnM2Asset as RnM2Asset, type Rn_RnM2AttributeAccessors as RnM2AttributeAccessors, type Rn_RnM2AttributeBlendShapes as RnM2AttributeBlendShapes, type Rn_RnM2AttributeBlendShapesAccessors as RnM2AttributeBlendShapesAccessors, type Rn_RnM2Attributes as RnM2Attributes, type Rn_RnM2AttributesObject as RnM2AttributesObject, type Rn_RnM2Buffer as RnM2Buffer, type Rn_RnM2BufferView as RnM2BufferView, type Rn_RnM2Camera as RnM2Camera, type Rn_RnM2CameraOrthographic as RnM2CameraOrthographic, type Rn_RnM2CameraPerspective as RnM2CameraPerspective, type Rn_RnM2ExtensionEffekseer as RnM2ExtensionEffekseer, type Rn_RnM2ExtensionsEffekseerEffect as RnM2ExtensionsEffekseerEffect, type Rn_RnM2ExtensionsEffekseerTimeline as RnM2ExtensionsEffekseerTimeline, type Rn_RnM2ExtensionsEffekseerTimelineItem as RnM2ExtensionsEffekseerTimelineItem, type Rn_RnM2Image as RnM2Image, type Rn_RnM2Material as RnM2Material, type Rn_RnM2MaterialVariant as RnM2MaterialVariant, type Rn_RnM2Mesh as RnM2Mesh, type Rn_RnM2Node as RnM2Node, type Rn_RnM2NormalTextureInfo as RnM2NormalTextureInfo, type Rn_RnM2OcclusionTextureInfo as RnM2OcclusionTextureInfo, type Rn_RnM2PbrMetallicRoughness as RnM2PbrMetallicRoughness, type Rn_RnM2Primitive as RnM2Primitive, type Rn_RnM2Scene as RnM2Scene, type Rn_RnM2Skin as RnM2Skin, type Rn_RnM2Sparse as RnM2Sparse, type Rn_RnM2SparseIndices as RnM2SparseIndices, type Rn_RnM2SparseValues as RnM2SparseValues, type Rn_RnM2Texture as RnM2Texture, type Rn_RnM2TextureInfo as RnM2TextureInfo, type Rn_RnM2TextureSampler as RnM2TextureSampler, type Rn_RnM2Vrma as RnM2Vrma, Rn_RnObject as RnObject, Rn_RnPromise as RnPromise, type Rn_RnPromiseCallback as RnPromiseCallback, type Rn_RnPromiseCallbackObj as RnPromiseCallbackObj, type Rn_RnTags as RnTags, type Rn_RnWebGLProgram as RnWebGLProgram, type Rn_RnWebGLTexture as RnWebGLTexture, type Rn_RnXR as RnXR, Rn_Sampler as Sampler, type Rn_SamplerDescriptor as SamplerDescriptor, Scalar$1 as Scalar, Rn_Scalar_ as Scalar_, Rn_Scalard as Scalard, type Rn_Scalarf as Scalarf, Rn_ScaleGizmo as ScaleGizmo, Rn_SceneGraphComponent as SceneGraphComponent, type Rn_Second as Second, type Rn_ShaderAttributeOrSemanticsOrString as ShaderAttributeOrSemanticsOrString, Rn_ShaderGraphResolver as ShaderGraphResolver, Rn_ShaderNode as ShaderNode, type Rn_ShaderNodeEnum as ShaderNodeEnum, type Rn_ShaderNodeJson as ShaderNodeJson, type Rn_ShaderNodeJsonConnection as ShaderNodeJsonConnection, type Rn_ShaderNodeJsonNode as ShaderNodeJsonNode, type Rn_ShaderNodeJsonNodeInput as ShaderNodeJsonNodeInput, type Rn_ShaderNodeJsonNodeOutput as ShaderNodeJsonNodeOutput, type Rn_ShaderNodeUID as ShaderNodeUID, Rn_ShaderSemantics as ShaderSemantics, Rn_ShaderSemanticsClass as ShaderSemanticsClass, type Rn_ShaderSemanticsEnum as ShaderSemanticsEnum, type Rn_ShaderSemanticsIndex as ShaderSemanticsIndex, type Rn_ShaderSemanticsInfo as ShaderSemanticsInfo, type Rn_ShaderSemanticsName as ShaderSemanticsName, type Rn_ShaderSocket as ShaderSocket, type Rn_ShaderSources as ShaderSources, Rn_ShaderType as ShaderType, type Rn_ShaderTypeEnum as ShaderTypeEnum, type Rn_ShaderVariable as ShaderVariable, Rn_ShaderVariableType as ShaderVariableType, type Rn_ShaderVariableTypeEnum as ShaderVariableTypeEnum, Rn_ShaderityUtilityWebGL as ShaderityUtilityWebGL, Rn_ShadingModel as ShadingModel, type Rn_ShadingModelEnum as ShadingModelEnum, Rn_ShadowMap as ShadowMap, Rn_ShadowMapDecodeClassicMaterialContent as ShadowMapDecodeClassicMaterialContent, type Rn_ShadowMapEnum as ShadowMapEnum, Rn_ShadowMapType as ShadowMapType, Rn_ShadowSystem as ShadowSystem, Rn_SimpleVertexAttribute as SimpleVertexAttribute, type Rn_Size as Size, Rn_SkeletalComponent as SkeletalComponent, Rn_Some as Some, Rn_Sphere as Sphere, Rn_SphereCollider as SphereCollider, type Rn_SphereDescriptor as SphereDescriptor, Rn_SplitVectorShaderNode as SplitVectorShaderNode, type Rn_SquareMatrixComponentN as SquareMatrixComponentN, Rn_SymbolWeakMap as SymbolWeakMap, Rn_SynthesizeHdrMaterialContent as SynthesizeHdrMaterialContent, Rn_System as System, Rn_SystemState as SystemState, type Rn_Tag as Tag, Rn_TagGltf2NodeIndex as TagGltf2NodeIndex, Rn_Texture as Texture, type Rn_TextureData as TextureData, Rn_TextureDataFloat as TextureDataFloat, Rn_TextureFetchShader as TextureFetchShader, TextureFormat$1 as TextureFormat, type Rn_TextureFormatEnum as TextureFormatEnum, Rn_TextureParameter as TextureParameter, type Rn_TextureParameterEnum as TextureParameterEnum, type Rn_TextureParameters as TextureParameters, type Rn_TextureUID as TextureUID, Rn_Time as Time, Rn_ToneMappingType as ToneMappingType, type Rn_ToneMappingTypeEnum as ToneMappingTypeEnum, type Rn_TranscodeTarget as TranscodeTarget, type Rn_TranscodedImage as TranscodedImage, Rn_Transform3D as Transform3D, Rn_TransformComponent as TransformComponent, Rn_TranslationGizmo as TranslationGizmo, type Rn_TypedArray as TypedArray, type Rn_TypedArrayConstructor as TypedArrayConstructor, Rn_UastcImageTranscoder as UastcImageTranscoder, Rn_UniformDataShader as UniformDataShader, Rn_UniformDataShaderNode as UniformDataShaderNode, Rn_VERSION as VERSION, type Rn_VRM0x_Extension as VRM0x_Extension, Rn_VRMColliderGroup as VRMColliderGroup, Rn_VRMSpring as VRMSpring, Rn_VRMSpringBone as VRMSpringBone, Rn_VRMSpringBonePhysicsStrategy as VRMSpringBonePhysicsStrategy, Rn_VarianceShadowMapDecodeClassicMaterialContent as VarianceShadowMapDecodeClassicMaterialContent, Rn_VaryingVariableShader as VaryingVariableShader, Rn_Vector2 as Vector2, Rn_Vector2_ as Vector2_, Rn_Vector2d as Vector2d, type Rn_Vector2f as Vector2f, Rn_Vector3 as Vector3, Rn_Vector3_ as Vector3_, Rn_Vector3d as Vector3d, type Rn_Vector3f as Vector3f, Rn_Vector4 as Vector4, Rn_Vector4_ as Vector4_, Rn_Vector4d as Vector4d, type Rn_Vector4f as Vector4f, type Rn_VectorAndSquareMatrixComponentN as VectorAndSquareMatrixComponentN, type Rn_VectorComponentN as VectorComponentN, type Rn_VectorCompositionTypes as VectorCompositionTypes, Rn_VectorN as VectorN, Rn_VertexAttribute as VertexAttribute, Rn_VertexAttributeClass as VertexAttributeClass, type Rn_VertexAttributeComponent as VertexAttributeComponent, type Rn_VertexAttributeEnum as VertexAttributeEnum, type Rn_VertexAttributeSemanticsJoinedString as VertexAttributeSemanticsJoinedString, type Rn_VertexAttributeTypeName as VertexAttributeTypeName, type Rn_VertexAttributesLayout as VertexAttributesLayout, type Rn_VertexHandles as VertexHandles, Rn_VideoTexture as VideoTexture, type Rn_VideoTextureArguments as VideoTextureArguments, Rn_ViewMatrixShaderNode as ViewMatrixShaderNode, Rn_Visibility as Visibility, type Rn_VisibilityEnum as VisibilityEnum, type Rn_Vrm0x as Vrm0x, type Rn_Vrm0xBlendShapeBind as Vrm0xBlendShapeBind, type Rn_Vrm0xBlendShapeGroup as Vrm0xBlendShapeGroup, type Rn_Vrm0xBoneGroup as Vrm0xBoneGroup, type Rn_Vrm0xCollider as Vrm0xCollider, type Rn_Vrm0xColliderGroup as Vrm0xColliderGroup, type Rn_Vrm0xHumanBone as Vrm0xHumanBone, Rn_Vrm0xImporter as Vrm0xImporter, type Rn_Vrm0xLookAt as Vrm0xLookAt, type Rn_Vrm0xMaterialProperty as Vrm0xMaterialProperty, Rn_VrmComponent as VrmComponent, type Rn_VrmExpression as VrmExpression, type Rn_VrmExpressionMorphBind as VrmExpressionMorphBind, type Rn_VrmExpressionName as VrmExpressionName, Rn_VrmImporter as VrmImporter, Rn_VrmaImporter as VrmaImporter, Rn_WalkThroughCameraController as WalkThroughCameraController, Rn_WeakNone as WeakNone, Rn_WeakOption as WeakOption, Rn_WeakSome as WeakSome, Rn_WebGLContextWrapper as WebGLContextWrapper, Rn_WebGLExtension as WebGLExtension, type Rn_WebGLExtensionEnum as WebGLExtensionEnum, type Rn_WebGLResource as WebGLResource, type Rn_WebGLResourceHandle as WebGLResourceHandle, Rn_WebGLResourceRepository as WebGLResourceRepository, type Rn_WebGLStrategy as WebGLStrategy, Rn_WebGLStrategyDataTexture as WebGLStrategyDataTexture, Rn_WebGLStrategyUniform as WebGLStrategyUniform, type Rn_WebGPUResourceHandle as WebGPUResourceHandle, Rn_WebGpuDeviceWrapper as WebGpuDeviceWrapper, type Rn_WebGpuResource as WebGpuResource, Rn_WebGpuResourceRepository as WebGpuResourceRepository, Rn_WebGpuStrategyBasic as WebGpuStrategyBasic, Rn_WebXRSystem as WebXRSystem, Rn_WellKnownComponentTIDs as WellKnownComponentTIDs, Rn_WireframeMaterialNode as WireframeMaterialNode, Rn_WorldMatrixShaderNode as WorldMatrixShaderNode, Rn__from as _from, Rn__fromString as _fromString, Rn__fromStringCaseSensitively as _fromStringCaseSensitively, Rn__getPropertyIndex2 as _getPropertyIndex2, Rn_add2 as add2, Rn_add2_offset as add2_offset, Rn_add3 as add3, Rn_add3_offset as add3_offset, Rn_add4 as add4, Rn_add4_offset as add4_offset, Rn_addLineNumberToCode as addLineNumberToCode, Rn_applyMixins as applyMixins, Rn_array2_lerp_offsetAsComposition as array2_lerp_offsetAsComposition, Rn_array3_lerp_offsetAsComposition as array3_lerp_offsetAsComposition, Rn_array4_lerp_offsetAsComposition as array4_lerp_offsetAsComposition, Rn_arrayN_lerp_offsetAsComposition as arrayN_lerp_offsetAsComposition, Rn_assertDoesNotHave as assertDoesNotHave, Rn_assertExist as assertExist, Rn_assertHas as assertHas, Rn_assertIsErr as assertIsErr, Rn_assertIsOk as assertIsOk, Rn_calcAlignedByteLength as calcAlignedByteLength, Rn_combineImages as combineImages, Rn_convertHTMLImageElementToCanvas as convertHTMLImageElementToCanvas, Rn_createCameraControllerEntity as createCameraControllerEntity, Rn_createCameraEntity as createCameraEntity, Rn_createEffekseer as createEffekseer, Rn_createEntity as createEntity, Rn_createGroupEntity as createGroupEntity, Rn_createLightEntity as createLightEntity, Rn_createLightWithCameraEntity as createLightWithCameraEntity, Rn_createMeshEntity as createMeshEntity, Rn_createMotionController as createMotionController, Rn_createPhysicsEntity as createPhysicsEntity, Rn_createSkeletalEntity as createSkeletalEntity, Rn_createTransformEntity as createTransformEntity, Rn_deepCopyUsingJsonStringify as deepCopyUsingJsonStringify, Rn_defaultAnimationTrackName as defaultAnimationTrackName, Rn_defaultAssetLoader as defaultAssetLoader, Rn_defaultValue as defaultValue, Rn_detectFormatByArrayBuffers as detectFormatByArrayBuffers, Rn_detectFormatByUri as detectFormatByUri, Rn_downloadArrayBuffer as downloadArrayBuffer, Rn_downloadTypedArray as downloadTypedArray, Rn_dummyAnisotropyTexture as dummyAnisotropyTexture, Rn_dummyBlackCubeTexture as dummyBlackCubeTexture, Rn_dummyBlackTexture as dummyBlackTexture, Rn_dummyBlueTexture as dummyBlueTexture, Rn_dummyDepthMomentTextureArray as dummyDepthMomentTextureArray, Rn_dummySRGBGrayTexture as dummySRGBGrayTexture, Rn_dummyWhiteTexture as dummyWhiteTexture, Rn_dummyZeroTexture as dummyZeroTexture, Rn_enhanceArray as enhanceArray, Rn_flattenHierarchy as flattenHierarchy, Rn_fromTensorToCompositionType as fromTensorToCompositionType, Rn_get1 as get1, Rn_get1_offset as get1_offset, Rn_get1_offsetAsComposition as get1_offsetAsComposition, Rn_get2 as get2, Rn_get2_offset as get2_offset, Rn_get2_offsetAsComposition as get2_offsetAsComposition, Rn_get3 as get3, Rn_get3_offset as get3_offset, Rn_get3_offsetAsComposition as get3_offsetAsComposition, Rn_get4 as get4, Rn_get4_offset as get4_offset, Rn_get4_offsetAsComposition as get4_offsetAsComposition, Rn_getEvent as getEvent, Rn_getMotionController as getMotionController, Rn_getN_offset as getN_offset, Rn_getN_offsetAsComposition as getN_offsetAsComposition, type Rn_getShaderPropertyFunc as getShaderPropertyFunc, Rn_getWebXRSystem as getWebXRSystem, type Rn_glTF1 as glTF1, Rn_greaterThan as greaterThan, Rn_ifDefinedThen as ifDefinedThen, Rn_ifDefinedThenWithReturn as ifDefinedThenWithReturn, Rn_ifExistsThen as ifExistsThen, Rn_ifExistsThenWithReturn as ifExistsThenWithReturn, Rn_ifNotExistsThen as ifNotExistsThen, Rn_ifNotExistsThenWithReturn as ifNotExistsThenWithReturn, Rn_ifUndefinedThen as ifUndefinedThen, Rn_ifUndefinedThenWithReturn as ifUndefinedThenWithReturn, Rn_initDefaultTextures as initDefaultTextures, Rn_isBlend as isBlend, Rn_isBlendWithZWrite as isBlendWithZWrite, Rn_isBlendWithoutZWrite as isBlendWithoutZWrite, Rn_isOpaque as isOpaque, Rn_isSameGlTF2TextureSampler as isSameGlTF2TextureSampler, Rn_isSkipDrawing as isSkipDrawing, Rn_isTranslucent as isTranslucent, Rn_lessThan as lessThan, Rn_mulArray3WithScalar_offset as mulArray3WithScalar_offset, Rn_mulArray4WithScalar_offset as mulArray4WithScalar_offset, Rn_mulArrayNWithScalar_offset as mulArrayNWithScalar_offset, Rn_mulThatAndThisToOutAsMat44_offsetAsComposition as mulThatAndThisToOutAsMat44_offsetAsComposition, Rn_normalizeArray4 as normalizeArray4, Rn_nullishToEmptyArray as nullishToEmptyArray, Rn_nullishToEmptyMap as nullishToEmptyMap, Rn_objectCachify as objectCachify, Rn_primitiveCachify1 as primitiveCachify1, type Rn_primitives as primitives, Rn_qlerp_offsetAsComposition as qlerp_offsetAsComposition, Rn_scalar_lerp_offsetAsComposition as scalar_lerp_offsetAsComposition, Rn_setupShaderProgram as setupShaderProgram, Rn_sheenLutTexture as sheenLutTexture, Rn_updateGamePad as updateGamePad, Rn_updateMotionControllerModel as updateMotionControllerModel, Rn_valueWithCompensation as valueWithCompensation, Rn_valueWithDefault as valueWithDefault };
}

export { Rn as default };
