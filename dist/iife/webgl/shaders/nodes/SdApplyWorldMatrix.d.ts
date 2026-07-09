import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { RaymarchingShaderPart } from '../RaymarchingShaderPart';
/**
 * SdApplyWorldMatrixShader class provides the apply world matrix function for fragment shaders.
 * This class handles applying the world matrix to the position,
 * supporting both WebGL and WebGPU rendering approaches.
 *
 * @extends RaymarchingShaderPart
 */
export declare class SdApplyWorldMatrixShader extends RaymarchingShaderPart {
    private __variableName;
    private __shaderFunctionName;
    /**
     * Private constructor to enforce singleton pattern.
     */
    constructor(shaderFunctionName: string);
    setVariableName(name: any): void;
    /**
     * Gets the vertex shader function definitions.
     * Returns a no-op function since discard is not available in vertex shaders.
     *
     * @returns Shader code string containing a no-op conditionalDiscard function
     */
    getVertexShaderDefinitions(engine: Engine): string;
    /**
     * Gets the vertex shader body code.
     * Currently returns empty string as no additional vertex processing is needed.
     *
     * @returns Empty shader body string
     */
    get vertexShaderBody(): string;
    /**
     * Gets the pixel/fragment shader function definitions for conditional discard.
     * Returns appropriate function definition based on the current process approach (WebGL/WebGPU).
     *
     * @returns Shader code string containing the conditionalDiscard function definition
     */
    getPixelShaderDefinitions(engine: Engine): string;
    /**
     * Gets the pixel/fragment shader body code.
     * Currently returns empty string as no additional fragment processing is needed.
     *
     * @returns Empty shader body string
     */
    getPixelShaderBody(): string;
    /**
     * Gets the attribute names required by this shader part.
     * DiscardShader doesn't require any specific vertex attributes.
     *
     * @returns Empty array of attribute names
     */
    get attributeNames(): AttributeNames;
    /**
     * Gets the vertex attribute semantics required by this shader part.
     * DiscardShader doesn't require any specific vertex attribute semantics.
     *
     * @returns Empty array of vertex attribute enums
     */
    get attributeSemantics(): Array<VertexAttributeEnum>;
    /**
     * Gets the attribute compositions required by this shader part.
     * DiscardShader doesn't require any specific attribute compositions.
     *
     * @returns Empty array of composition type enums
     */
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
