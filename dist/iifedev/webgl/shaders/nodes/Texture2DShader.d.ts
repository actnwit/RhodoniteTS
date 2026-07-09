import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { StandardShaderPart } from '../StandardShaderPart';
export declare class Texture2DShader extends StandardShaderPart {
    private __functionName;
    private __variableName;
    private __sRGB;
    constructor(__functionName: string);
    setVariableName(name: any): void;
    setSrgbFlag(sRGB: boolean): void;
    getVertexShaderDefinitions(engine: Engine): string;
    getPixelShaderDefinitions(engine: Engine): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
