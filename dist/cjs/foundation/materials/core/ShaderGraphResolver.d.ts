import { AbstractShaderNode } from './AbstractShaderNode';
/**
 * ShaderGraphResolver is a class that resolves the shader node graph and generates shader code.
 */
export declare class ShaderGraphResolver {
    /**
     * Create a vertex shader code from the given vertex nodes.
     * @param vertexNodes - Vertex nodes
     * @param varyingNodes - Varying nodes
     * @param isFullVersion - Whether to generate a full version of the shader code
     * @returns Vertex shader code
     */
    static createVertexShaderCode(vertexNodes: AbstractShaderNode[], varyingNodes: AbstractShaderNode[], isFullVersion?: boolean): string | undefined;
    /**
     * Create a pixel shader code from the given pixel nodes.
     *
     * @param pixelNodes - Pixel nodes
     * @param isFullVersion - Whether to generate a full version of the shader code
     * @returns Pixel shader code
     */
    static createPixelShaderCode(pixelNodes: AbstractShaderNode[], isFullVersion?: boolean): string | undefined;
    private static __validateShaderNodes;
    /**
     * Sort shader nodes topologically.
     *
     * @param shaderNodes - Shader nodes to sort
     * @returns Sorted shader nodes
     */
    private static __sortTopologically;
    /**
     * Get function definition from shader nodes.
     *
     * @param shaderNodes - Shader nodes
     * @param shaderType - Shader type
     * @returns Function definition as a string
     */
    private static __getFunctionDefinition;
    /**
     * Construct shader code with shader nodes.
     *
     * @param shaderNodes - Shader nodes
     * @param isVertexStage - Whether the shader is a vertex shader
     * @param isFullVersion - Whether to generate a full version of the shader code
     * @returns Shader code
     */
    private static __constructShaderWithNodes;
    /**
     * Generate shader code from JSON.
     *
     * @param json - JSON data of a shader node graph
     * @returns Shader code
     */
    static generateShaderCodeFromJson(json: any): {
        vertexShader: string;
        pixelShader: string;
    } | undefined;
}
