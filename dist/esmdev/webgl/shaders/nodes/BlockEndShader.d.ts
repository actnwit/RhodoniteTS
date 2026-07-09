import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { ShaderSocket } from '../../../foundation/materials/core/AbstractShaderNode';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { StandardShaderPart } from '../StandardShaderPart';
/**
 * A shader component that generates the ending block of a shader function.
 * This class creates GLSL function definitions that pass input values directly to output values,
 * effectively acting as a pass-through block in shader node graphs.
 */
export declare class BlockEndShader extends StandardShaderPart {
    private __functionName;
    private __valueInputs;
    private __valueOutputs;
    /**
     * Creates a new BlockEndShader instance.
     *
     * @param __functionName - The name of the GLSL function to generate
     * @param __valueInputs - Array of input shader sockets that define the function parameters
     * @param __valueOutputs - Array of output shader sockets that define the function return values
     */
    constructor(__functionName: string, __valueInputs: ShaderSocket[], __valueOutputs: ShaderSocket[]);
    /**
     * Generates the vertex shader function definition.
     * Creates a GLSL function that takes input parameters and assigns them directly to output parameters.
     *
     * @returns The GLSL function definition string for vertex shaders
     */
    getVertexShaderDefinitions(_engine: Engine): string;
    /**
     * Generates the pixel shader function definition.
     * Returns the same definition as the vertex shader since the logic is identical.
     *
     * @returns The GLSL function definition string for pixel shaders
     */
    getPixelShaderDefinitions(engine: Engine): string;
    /**
     * Gets the attribute names required by this shader component.
     * This block end shader doesn't require any specific vertex attributes.
     *
     * @returns An empty array as no attributes are needed
     */
    get attributeNames(): AttributeNames;
    /**
     * Gets the vertex attribute semantics required by this shader component.
     * This block end shader doesn't require any specific vertex attribute semantics.
     *
     * @returns An empty array as no attribute semantics are needed
     */
    get attributeSemantics(): Array<VertexAttributeEnum>;
    /**
     * Gets the composition types for vertex attributes required by this shader component.
     * This block end shader doesn't require any specific attribute compositions.
     *
     * @returns An empty array as no attribute compositions are needed
     */
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
