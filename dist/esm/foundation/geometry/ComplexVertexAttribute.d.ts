import { VertexAttributeEnum } from '../definitions/VertexAttribute';
import { PrimitiveModeEnum } from '../definitions/PrimitiveMode';
import { Attributes } from './Primitive';
import { IndicesAccessOption } from '../memory/Accessor';
import { Index } from '../../types/CommonTypes';
import { Array1, Array2, Array3, Array4 } from '../../types/CommonTypes';
import { ISemanticVertexAttribute } from './ISemanticVertexAttribute';
export declare class ComplexVertexAttribute implements ISemanticVertexAttribute {
    private __semantic;
    private __components;
    private __offsets;
    constructor(semanticAttribute: VertexAttributeEnum, attributes: Attributes);
    get semantic(): PrimitiveModeEnum;
    getScalarAsArray(i: Index, option: IndicesAccessOption): Array1<number>;
    getVec2AsArray(i: Index, option: IndicesAccessOption): Array2<number>;
    getVec3AsArray(i: Index, option: IndicesAccessOption): Array3<number>;
    getVec4AsArray(i: Index, option: IndicesAccessOption): Array4<number>;
}
