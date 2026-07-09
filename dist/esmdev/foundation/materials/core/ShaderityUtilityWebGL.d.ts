import { type ShaderityObject } from 'shaderity';
import { type ComponentTypeEnum } from '../../definitions/ComponentType';
import { type CompositionTypeEnum } from '../../definitions/CompositionType';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { type VertexAttributeEnum } from '../../definitions/VertexAttribute';
import type { Primitive } from '../../geometry/Primitive';
import type { Engine } from '../../system/Engine';
export type FillArgsObject = {
    [key: string]: string | object;
};
export type VertexAttributesLayout = {
    names: string[];
    semantics: VertexAttributeEnum[];
    compositions: CompositionTypeEnum[];
    components: ComponentTypeEnum[];
};
/**
 * A utility class for processing and managing Shaderity shader objects in WebGL environments.
 *
 * This class provides comprehensive functionality for shader processing including:
 * - Template filling and parameter substitution in shader code
 * - WebGL version compatibility transformations (WebGL 1.0/2.0)
 * - Shader reflection for extracting vertex attribute information
 * - Uniform declaration parsing and semantic information extraction
 * - Initial value parsing and type conversion for shader uniforms
 *
 * The class integrates with the Shaderity library to provide enhanced shader processing
 * capabilities specifically tailored for the Rhodonite rendering engine's WebGL backend.
 * It handles the complex process of analyzing GLSL shader code, extracting metadata
 * from comments, and preparing shader objects for use in the rendering pipeline.
 *
 * All methods are static and the class serves as a namespace for shader utility functions.
 *
 * @example
 * ```typescript
 * // Fill shader template with arguments
 * const filledShader = ShaderityUtilityWebGL.fillTemplate(shaderObject, { color: 'red' });
 *
 * // Transform for WebGL 2.0 compatibility
 * const webgl2Shader = ShaderityUtilityWebGL.transformWebGLVersion(filledShader, true);
 *
 * // Extract vertex attribute information
 * const attributes = ShaderityUtilityWebGL.getAttributeReflection(webgl2Shader);
 * ```
 */
export declare class ShaderityUtilityWebGL {
    /**
     * Fills template placeholders in a shader object with provided arguments and WebGL-specific parameters.
     * This method performs a two-step template filling process: first with user-provided arguments,
     * then with WebGL resource repository specific parameters.
     *
     * @param shaderityObject - The shader object containing template placeholders to be filled
     * @param args - Key-value pairs of template arguments to fill in the shader
     * @returns A new ShaderityObject with all template placeholders replaced
     */
    static fillTemplate(engine: Engine, shaderityObject: ShaderityObject, primitive: Primitive, args: FillArgsObject): ShaderityObject;
    /**
     * Transforms a shader object to target a specific WebGL version (WebGL 1.0 or 2.0).
     * This method converts GLSL code to be compatible with either GLSL ES 1.0 or 3.0
     * depending on the WebGL version being used.
     *
     * @param shaderityObject - The shader object to transform
     * @param isWebGL2 - Whether to target WebGL 2.0 (true) or WebGL 1.0 (false)
     * @returns A new ShaderityObject with version-appropriate GLSL code
     */
    static transformWebGLVersion(shaderityObject: ShaderityObject, isWebGL2: boolean): ShaderityObject;
    /**
     * Extracts vertex attribute information from a shader object using reflection.
     * This method analyzes the shader code to determine vertex attribute names, semantics,
     * compositions, and component types required for proper vertex buffer binding.
     *
     * @param shaderityObject - The shader object to analyze for vertex attributes
     * @returns An object containing arrays of attribute names, semantics, compositions, and components
     */
    static getAttributeReflection(shaderityObject: ShaderityObject): VertexAttributesLayout;
    /**
     * Sets default semantic mappings for vertex attributes in the reflection object.
     * This private method configures predefined attribute name to semantic mappings
     * that are commonly used in the rendering pipeline.
     *
     * @param reflection - The reflection object to configure with semantic mappings
     * @private
     */
    private static __setDefaultAttributeSemanticMap;
    /**
     * Extracts shader uniform data and semantic information from a shader object.
     * This method parses uniform declarations in the shader code, extracts metadata
     * from comments, and creates semantic information objects for each uniform.
     *
     * @param shaderityObject - The shader object to analyze for uniform declarations
     * @returns An object containing an array of shader semantic info and a modified shader object with uniforms removed
     */
    static getShaderDataReflection(engine: Engine, shaderityObject: ShaderityObject): {
        shaderSemanticsInfoArray: ShaderSemanticsInfo[];
        shaderityObject: ShaderityObject;
    };
    /**
     * Creates a deep copy of a ShaderityObject to avoid modifying the original.
     * This utility method ensures that shader transformations don't affect the source object.
     *
     * @param obj - The ShaderityObject to copy
     * @returns A new ShaderityObject with the same properties as the input
     * @private
     */
    private static __copyShaderityObject;
    /**
     * Determines whether a uniform declaration should be ignored based on metadata comments.
     * This method checks for the 'skipProcess=true' directive in shader comments.
     *
     * @param info - The comment string following a uniform declaration
     * @returns True if the uniform should be ignored, false otherwise
     * @private
     */
    private static __ignoreThisUniformDeclaration;
    /**
     * Creates a ShaderSemanticsInfo object from uniform declaration components.
     * This method constructs semantic information including component type, composition type,
     * shader stage, and other metadata for a shader uniform.
     *
     * @param type - The GLSL type string of the uniform (e.g., 'vec3', 'mat4')
     * @param variableName - The name of the uniform variable
     * @param info - The comment string containing metadata about the uniform
     * @param isFragmentShader - Whether this uniform belongs to a fragment shader
     * @returns A complete ShaderSemanticsInfo object for the uniform
     * @private
     */
    private static __createShaderSemanticsInfo;
    /**
     * Parses and sets Rhodonite-specific parameters from shader comment metadata.
     * This method extracts custom parameters like soloDatum, isInternalSetting,
     * initialValue, and needUniformInDataTextureMode from shader comments.
     *
     * @param shaderSemanticsInfo - The semantic info object to populate with parameters
     * @param info - The comment string containing parameter definitions
     * @private
     */
    private static __setRhodoniteOriginalParametersTo;
    /**
     * Parses an initial value from a text string and converts it to the appropriate data type.
     * This method handles various GLSL types including scalars, vectors, matrices, and textures,
     * and creates the corresponding Rhodonite math objects or texture references.
     *
     * @param shaderSemanticsInfo - The semantic info containing type information for validation
     * @param initialValueText - The text representation of the initial value
     * @returns The parsed initial value as the appropriate Rhodonite math type or texture array
     * @private
     */
    private static __getInitialValueFromText;
    /**
     * Provides default initial values for shader uniforms based on their composition type.
     * This method creates zero/identity values for mathematical types and default textures
     * for texture types when no explicit initial value is specified.
     *
     * @param shaderSemanticsInfo - The semantic info containing the composition type
     * @returns The default initial value appropriate for the uniform's type
     * @private
     */
    private static __getDefaultInitialValue;
}
