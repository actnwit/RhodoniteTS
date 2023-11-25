import { VertexAttributeEnum } from '../definitions/VertexAttribute';
import { Accessor } from '../memory/Accessor';
import { Array1, Array2, Array3, Array4, Index } from '../../types/CommonTypes';
import { IndicesAccessOption } from '../memory/Accessor';
import { ISemanticVertexAttribute } from './ISemanticVertexAttribute';
export declare class SimpleVertexAttribute implements ISemanticVertexAttribute {
    private __semantic;
    private __accessor;
    constructor(semanticAttribute: VertexAttributeEnum, accessor: Accessor);
    get semantic(): VertexAttributeEnum;
    getScalarAsArray(i: Index, option: IndicesAccessOption): Array1<number>;
    getVec2AsArray(i: Index, option: IndicesAccessOption): Array2<number>;
    getVec3AsArray(i: Index, option: IndicesAccessOption): Array3<number>;
    getVec4AsArray(i: Index, option: IndicesAccessOption): Array4<number>;
}
