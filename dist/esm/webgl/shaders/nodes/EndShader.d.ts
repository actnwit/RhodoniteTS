import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { StandardShaderPart } from '../StandardShaderPart';
/**
 * EndShader class provides the final output functions for both vertex and fragment shaders.
 * This class handles the final position output in vertex shaders and color output in fragment shaders,
 * supporting both WebGL and WebGPU rendering approaches.
 *
 * @extends StandardShaderPart
 */
export declare class EndShader extends StandardShaderPart {
    static __instance: EndShader;
    static readonly materialElement: import("../../../foundation").EnumIO;
    /**
     * Private constructor to enforce singleton pattern.
     */
    private constructor();
    /**
     * Gets the singleton instance of EndShader.
     * Creates a new instance if one doesn't exist.
     *
     * @returns The singleton EndShader instance
     */
    static getInstance(): EndShader;
    /**
     * Gets the vertex shader function definitions for position output.
     * Returns appropriate function definition based on the current process approach (WebGL/WebGPU).
     *
     * @returns Shader code string containing the outPosition function definition
     */
    getVertexShaderDefinitions(engine: Engine): "\n      fn outPosition(inPosition: vec4<f32>) {\n        output.position = inPosition;\n      }\n      " | "\n      void outPosition(in vec4 inPosition) {\n        gl_Position = inPosition;\n      }\n      ";
    /**
     * Gets the vertex shader body code.
     * Currently returns empty string as no additional vertex processing is needed.
     *
     * @returns Empty shader body string
     */
    get vertexShaderBody(): string;
    /**
     * Gets the pixel/fragment shader function definitions for color output and discard.
     * Returns appropriate function definition based on the current process approach (WebGL/WebGPU).
     *
     * @returns Shader code string containing the outColor and conditionalDiscard function definitions
     */
    getPixelShaderDefinitions(engine: Engine): "\n      fn outColor(inColor: vec4<f32>) {\n        rt0 = inColor;\n      }\n      " | "\n      void outColor(in vec4 inColor) {\n        rt0 = inColor;\n      }\n      ";
    /**
     * Gets the pixel/fragment shader body code.
     * Currently returns empty string as no additional fragment processing is needed.
     *
     * @returns Empty shader body string
     */
    getPixelShaderBody(): string;
    /**
     * Gets the attribute names required by this shader part.
     * EndShader doesn't require any specific vertex attributes.
     *
     * @returns Empty array of attribute names
     */
    get attributeNames(): AttributeNames;
    /**
     * Gets the vertex attribute semantics required by this shader part.
     * EndShader doesn't require any specific vertex attribute semantics.
     *
     * @returns Empty array of vertex attribute enums
     */
    get attributeSemantics(): Array<VertexAttributeEnum>;
    /**
     * Gets the attribute compositions required by this shader part.
     * EndShader doesn't require any specific attribute compositions.
     *
     * @returns Empty array of composition type enums
     */
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
