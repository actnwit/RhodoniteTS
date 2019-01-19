import { PrimitiveModeEnum } from '../definitions/PrimitiveMode';
import { VertexAttributeEnum } from '../definitions/VertexAttribute';
import Accessor from '../memory/Accessor';
import RnObject from '../core/Object';
import { ComponentTypeEnum } from '../definitions/ComponentType';
import { CompositionTypeEnum } from '../definitions/CompositionType';
import Material from '../materials/Material';
export default class Primitive extends RnObject {
    private __mode;
    private __attributes;
    material?: Material;
    private __attributeSemantics;
    private __indices?;
    private static __primitiveCount;
    private __primitiveUid;
    private static __headerAccessor?;
    constructor(attributeAccessors: Array<Accessor>, attributeSemantics: Array<VertexAttributeEnum>, mode: PrimitiveModeEnum, material?: Material, indicesAccessor?: Accessor);
    static readonly maxPrimitiveCount: number;
    static readonly headerAccessor: Accessor | undefined;
    static createPrimitive({ indices, attributeCompositionTypes, attributeSemantics, attributes, material, primitiveMode }: {
        indices?: TypedArray;
        attributeCompositionTypes: Array<CompositionTypeEnum>;
        attributeSemantics: Array<VertexAttributeEnum>;
        attributes: Array<TypedArray>;
        primitiveMode: PrimitiveModeEnum;
        material?: Material;
    }): Primitive;
    readonly indicesAccessor: Accessor | undefined;
    hasIndices(): boolean;
    readonly attributeAccessors: Array<Accessor>;
    readonly attributeSemantics: Array<VertexAttributeEnum>;
    readonly attributeCompositionTypes: Array<CompositionTypeEnum>;
    readonly attributeComponentTypes: Array<ComponentTypeEnum>;
    readonly primitiveMode: PrimitiveModeEnum;
    readonly primitiveUid: PrimitiveUID;
}
