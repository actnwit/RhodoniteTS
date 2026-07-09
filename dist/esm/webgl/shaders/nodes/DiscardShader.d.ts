import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { StandardShaderPart } from '../StandardShaderPart';
/**
 * DiscardShader class provides the conditional discard function for fragment shaders.
 * This class handles discarding fragments based on a boolean condition,
 * supporting both WebGL and WebGPU rendering approaches.
 *
 * @extends StandardShaderPart
 */
export declare class DiscardShader extends StandardShaderPart {
    static __instance: DiscardShader;
    static readonly materialElement: import("../../../foundation").EnumIO;
    /**
     * Private constructor to enforce singleton pattern.
     */
    private constructor();
    /**
     * Gets the singleton instance of DiscardShader.
     * Creates a new instance if one doesn't exist.
     *
     * @returns The singleton DiscardShader instance
     */
    static getInstance(): DiscardShader;
    /**
     * Gets the vertex shader function definitions.
     * Returns a no-op function since discard is not available in vertex shaders.
     *
     * @returns Shader code string containing a no-op conditionalDiscard function
     */
    getVertexShaderDefinitions(engine: Engine): "\n      fn conditionalDiscard(condition: bool) {\n        // discard is not available in vertex shader\n      }\n      " | "\n      void conditionalDiscard(in bool condition) {\n        // discard is not available in vertex shader\n      }\n      ";
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
    getPixelShaderDefinitions(engine: Engine): "\n      fn conditionalDiscard(condition: bool) {\n        if (condition) {\n          discard;\n        }\n      }\n      " | "\n      void conditionalDiscard(in bool condition) {\n        if (condition) {\n          discard;\n        }\n      }\n      ";
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
