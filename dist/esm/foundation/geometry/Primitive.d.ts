import { PrimitiveModeEnum } from '../definitions/PrimitiveMode';
import { VertexAttributeSemanticsJoinedString } from '../definitions/VertexAttribute';
import { Accessor } from '../memory/Accessor';
import { RnObject } from '../core/RnObject';
import { ComponentTypeEnum } from '../definitions/ComponentType';
import { CompositionTypeEnum } from '../definitions/CompositionType';
import { AABB } from '../math/AABB';
import { Material } from '../materials/core/Material';
import { VertexHandles } from '../../webgl/WebGLResourceRepository';
import { PrimitiveUID, TypedArray, Count } from '../../types/CommonTypes';
import { IVector3 } from '../math/IVector';
import { IMesh, PrimitiveSortKey, PrimitiveSortKeyOffset, RaycastResultEx1 } from './types/GeometryTypes';
export declare type Attributes = Map<VertexAttributeSemanticsJoinedString, Accessor>;
export interface IAnyPrimitiveDescriptor {
    /** attach a rhodonite material to this plane(the default material is the classicUberMaterial */
    material?: Material;
}
export interface PrimitiveDescriptor extends IAnyPrimitiveDescriptor {
    attributes: TypedArray[];
    attributeSemantics: VertexAttributeSemanticsJoinedString[];
    primitiveMode: PrimitiveModeEnum;
    indices?: TypedArray;
}
export declare class Primitive extends RnObject {
    private __mode;
    private __material;
    _prevMaterial: Material;
    private __attributes;
    private __oIndices;
    private static __primitiveCount;
    private __primitiveUid;
    private static __headerAccessor?;
    private __aabb;
    private __targets;
    private __vertexHandles?;
    private __latestPositionAccessorVersion;
    private __woMesh;
    private static __primitives;
    _sortkey: PrimitiveSortKey;
    _viewDepth: number;
    private __cachePositionAccessor?;
    private static __tmpVec3_0;
    constructor();
    set material(mat: Material);
    get material(): Material;
    setSortKey(offset: PrimitiveSortKeyOffset, value: number): void;
    /**
     * belong to mesh (weak reference)
     * @param mesh
     */
    _belongToMesh(mesh: IMesh): void;
    get mesh(): IMesh | undefined;
    _backupMaterial(): void;
    _restoreMaterial(): void;
    static getPrimitive(primitiveUid: PrimitiveUID): Primitive;
    setData(attributes: Attributes, mode: PrimitiveModeEnum, material?: Material, indicesAccessor?: Accessor): void;
    static get maxPrimitiveCount(): number;
    static get headerAccessor(): Accessor | undefined;
    copyVertexData({ attributes, attributeSemantics, primitiveMode, indices, material, }: PrimitiveDescriptor): void;
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
    get positionAccessorVersion(): number | undefined;
    get AABB(): AABB;
    setVertexAttribute(accessor: Accessor, vertexSemantic: VertexAttributeSemanticsJoinedString): void;
    removeIndices(): void;
    setIndices(accessor: Accessor): void;
    setBlendShapeTargets(targets: Array<Attributes>): void;
    getBlendShapeTargets(): Attributes[];
    get targets(): Array<Attributes>;
    isBlend(): boolean;
    isOpaque(): boolean;
    create3DAPIVertexData(): boolean;
    update3DAPIVertexData(): boolean;
    delete3DAPIVertexData(): boolean;
    get vertexHandles(): VertexHandles | undefined;
    castRay(origVec3: IVector3, dirVec3: IVector3, isFrontFacePickable: boolean, isBackFacePickable: boolean, dotThreshold: number, hasFaceNormal: boolean): RaycastResultEx1;
    private __castRayInnerTomasMoller;
    private __calcNormalFromUV;
}
