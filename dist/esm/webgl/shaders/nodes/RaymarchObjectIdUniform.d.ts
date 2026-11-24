import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { RaymarchingShaderPart } from '../RaymarchingShaderPart';
/**
 * Outputs a per-component uniform (the raymarching object id) in the SDF graph.
 * The variable name is the shader semantic added per component, so each merged
 * component reads its own id.
 */
export declare class RaymarchObjectIdUniformShader extends RaymarchingShaderPart {
    private __variableName;
    private __shaderFunctionName;
    constructor(shaderFunctionName: string);
    setVariableName(name: any): void;
    getVertexShaderDefinitions(_engine: Engine): string;
    get vertexShaderBody(): string;
    getPixelShaderDefinitions(engine: Engine): string;
    getPixelShaderBody(): string;
    get attributeNames(): AttributeNames;
    get attributeSemantics(): Array<VertexAttributeEnum>;
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
