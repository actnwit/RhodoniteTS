import type { ShaderNodeJson } from '../../../types/ShaderNodeJson';
import type { CommonShaderPart } from '../../../webgl/shaders/CommonShaderPart';
import type { Engine } from '../../system/Engine';
import { AbstractShaderNode } from './AbstractShaderNode';
/**
 * ShaderGraphResolver is a class that resolves the shader node graph and generates shader code.
 * It provides functionality to convert a graph of shader nodes into complete vertex and fragment shaders.
 */
export declare class ShaderGraphResolver {
    /**
     * Creates a complete vertex shader code from the given vertex and varying nodes.
     * This method performs topological sorting of nodes, generates function definitions,
     * and constructs the main shader body with proper variable declarations and connections.
     *
     * @param engine - The engine instance
     * @param vertexNodes - Array of shader nodes that contribute to vertex processing
     * @param varyingNodes - Array of shader nodes that pass data from vertex to fragment stage
     * @param commonShaderPart - The CommonShaderPart instance for shader code generation
     * @param isFullVersion - Whether to generate a full version with all prerequisites and boilerplate
     * @returns Complete vertex shader code as a string, or undefined if generation fails
     */
    static createVertexShaderCode(engine: Engine, vertexNodes: AbstractShaderNode[], varyingNodes: AbstractShaderNode[], commonShaderPart: CommonShaderPart): string | undefined;
    /**
     * Creates a complete fragment/pixel shader code from the given pixel nodes.
     * This method performs topological sorting, generates function definitions,
     * and constructs the main shader body for fragment processing.
     *
     * @param engine - The engine instance
     * @param pixelNodes - Array of shader nodes that contribute to fragment processing
     * @param commonShaderPart - The CommonShaderPart instance for shader code generation
     * @param isFullVersion - Whether to generate a full version with all prerequisites and boilerplate
     * @returns Complete fragment shader code as a string, or undefined if generation fails
     */
    static createPixelShaderCode(engine: Engine, pixelNodes: AbstractShaderNode[], commonShaderPart: CommonShaderPart): string | undefined;
    /**
     * Validates that all shader nodes have their required input connections properly set.
     * This is a validation step to ensure the shader graph is complete before code generation.
     *
     * @param shaderNodes - Array of shader nodes to validate
     * @returns True if all nodes are valid, false if any node has missing required connections
     * @private
     */
    private static __validateShaderNodes;
    /**
     * Performs topological sorting on shader nodes to determine the correct execution order.
     * Uses Kahn's algorithm (BFS-based) to sort nodes based on their dependencies.
     * This ensures that nodes are processed in the correct order during shader execution.
     *
     * @param shaderNodes - Array of shader nodes to sort
     * @returns Array of shader nodes sorted in topological order
     * @throws Error if the graph contains cycles
     * @private
     */
    private static __sortTopologically;
    /**
     * Generates function definitions for all unique shader nodes.
     * Collects shader function code from each node type and removes duplicates
     * to create the function definition section of the shader.
     *
     * @param engine - The engine instance
     * @param shaderNodes - Array of shader nodes to generate functions for
     * @param shaderType - Type of shader (vertex or fragment) being generated
     * @returns String containing all function definitions
     * @private
     */
    private static __getFunctionDefinition;
    /**
     * Defines varying variables for vertex-to-fragment communication.
     * @private
     */
    private static __defineVaryingVariables;
    /**
     * Collects input and output variable names for shader nodes.
     * @private
     */
    private static __collectVariableNames;
    /**
     * Collects input variables for a specific node.
     * @private
     */
    private static __collectInputsForNode;
    /**
     * Checks if the defaultValue is a struct type (Record<string, ValueTypes>) rather than a primitive ValueTypes.
     * @private
     */
    private static __isStructDefaultValue;
    /**
     * Gets the struct name from the compositionType's glslStr property.
     * If the glslStr starts with 'struct ', extracts and returns the struct name.
     * @private
     */
    private static __getStructName;
    /**
     * Generates a shader initialization string for a struct type default value.
     * @private
     */
    private static __getStructDefaultValueString;
    /**
     * Gets default value for an input socket.
     * If the socket has a defaultValue defined, it will be used.
     * Otherwise, a zero value based on the socket's compositionType and componentType will be generated.
     * @private
     */
    private static __getDefaultInputValue;
    /**
     * Processes an input connection and returns variable name and shader statement.
     * @private
     */
    private static __processInputConnection;
    /**
     * Collects output variables for a specific node.
     * @private
     */
    private static __collectOutputsForNode;
    /**
     * Generates shader code for the nodes.
     * @private
     */
    private static __generateShaderCode;
    /**
     * Handles vertex-to-fragment data passing in vertex stage.
     * @private
     */
    private static __handleVertexToFragmentPassing;
    /**
     * Constructs the main shader body with proper variable declarations, connections, and function calls.
     * This is the core method that generates the actual shader execution logic by:
     * - Declaring varying variables for vertex-to-fragment communication
     * - Collecting input/output variable names for each node
     * - Generating function call statements in topological order
     * - Handling vertex-to-fragment data passing
     *
     * @param engine - The engine instance
     * @param shaderNodes - Array of shader nodes sorted in topological order
     * @param isVertexStage - True for vertex shader generation, false for fragment
     * @param commonShaderPart - The CommonShaderPart instance for shader code generation
     * @param isFullVersion - Whether to include full shader boilerplate
     * @returns Complete shader main function body as a string
     * @throws Error if shader construction fails
     * @private
     */
    private static __constructShaderWithNodes;
    /**
     * Generates complete vertex and fragment shader code from a JSON shader node graph definition.
     * This is the main entry point for converting a serialized shader graph into executable shader code.
     * The method performs the full pipeline: node construction, dependency resolution, stage assignment,
     * and final code generation.
     *
     * @param engine - The engine instance
     * @param json - JSON representation of the shader node graph containing nodes and connections
     * @param commonShaderPart - StandardShaderPart instance to use for shader code generation
     * @returns Object containing both vertex and fragment shader code, texture names used, or undefined if generation fails
     * @example
     * ```typescript
     * const commonShaderPart = new StandardShaderPart();
     * const shaderCode = ShaderGraphResolver.generateShaderCodeFromJson(engine, graphJson, commonShaderPart);
     * if (shaderCode) {
     *   const { vertexShader, pixelShader, textureNames } = shaderCode;
     *   // Use the generated shaders...
     * }
     * ```
     */
    static generateShaderCodeFromJson(engine: Engine, json: ShaderNodeJson, commonShaderPart: CommonShaderPart): {
        vertexShader: string;
        pixelShader: string;
        textureInfos: {
            name: string;
            stage: string;
            defaultTexture: string;
        }[];
    } | undefined;
}
