import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { RaymarchingShaderPart } from '../RaymarchingShaderPart';
/**
 * OutDistanceShader class provides the out distance function for fragment shaders.
 * This class handles outputting the distance to the surface,
 * supporting both WebGL and WebGPU rendering approaches.
 *
 * @extends StandardShaderPart
 */
export declare class OutDistanceShader extends RaymarchingShaderPart {
    static __instance: OutDistanceShader;
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
    static getInstance(): OutDistanceShader;
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
    getPixelShaderDefinitions(engine: Engine): "\n      fn outDistance(value: f32) {\n        g_distance = value;\n      }\n      " | "\n      void outDistance(in float value) {\n        g_distance = value;\n      }\n      ";
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
