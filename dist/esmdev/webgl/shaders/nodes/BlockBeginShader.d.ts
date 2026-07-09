import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { ShaderSocket } from '../../../foundation/materials/core/AbstractShaderNode';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { StandardShaderPart } from '../StandardShaderPart';
/**
 * A shader part that generates the beginning block of a shader function.
 * This class creates GLSL function definitions with input and output parameters
 * based on the provided shader sockets.
 */
export declare class BlockBeginShader extends StandardShaderPart {
    private __functionName;
    private __valueInputs;
    private __valueOutputs;
    /**
     * Creates a new BlockBeginShader instance.
     *
     * @param __functionName - The name of the GLSL function to generate
     * @param __valueInputs - Array of input shader sockets that define function parameters
     * @param __valueOutputs - Array of output shader sockets that define function output parameters
     */
    constructor(__functionName: string, __valueInputs: ShaderSocket[], __valueOutputs: ShaderSocket[]);
    /**
     * Generates the vertex shader function definition.
     * Creates a GLSL function with the specified name, input parameters, and output parameters.
     * The function body assigns input values to corresponding output values.
     *
     * @returns The GLSL function definition string for vertex shader
     */
    getVertexShaderDefinitions(_engine: Engine): string;
    /**
     * Generates the pixel shader function definition.
     * Returns the same definition as vertex shader since the function structure is identical.
     *
     * @returns The GLSL function definition string for pixel shader
     */
    getPixelShaderDefinitions(engine: Engine): string;
    /**
     * Gets the attribute names required by this shader part.
     * This shader part doesn't require any specific vertex attributes.
     *
     * @returns An empty array as no attributes are needed
     */
    get attributeNames(): AttributeNames;
    /**
     * Gets the vertex attribute semantics required by this shader part.
     * This shader part doesn't require any specific vertex attribute semantics.
     *
     * @returns An empty array as no attribute semantics are needed
     */
    get attributeSemantics(): Array<VertexAttributeEnum>;
    /**
     * Gets the composition types for vertex attributes required by this shader part.
     * This shader part doesn't require any specific attribute compositions.
     *
     * @returns An empty array as no attribute compositions are needed
     */
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
