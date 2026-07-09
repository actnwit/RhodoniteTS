import { type ShaderityObject } from 'shaderity';
import { type ComponentTypeEnum } from '../../definitions/ComponentType';
import { type CompositionTypeEnum } from '../../definitions/CompositionType';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import type { VertexAttributeEnum } from '../../definitions/VertexAttribute';
import type { Primitive } from '../../geometry/Primitive';
import type { Engine } from '../../system/Engine';
/**
 * Object containing key-value pairs for template filling arguments.
 */
export type FillArgsObject = {
    [key: string]: string | object;
};
/**
 * Layout definition for vertex attributes including names, semantics, compositions, and components.
 */
export type VertexAttributesLayout = {
    names: string[];
    semantics: VertexAttributeEnum[];
    compositions: CompositionTypeEnum[];
    components: ComponentTypeEnum[];
};
/**
 * Utility class for WebGPU shader processing using the Shaderity library.
 * Provides functionality for template filling, shader reflection, and parameter extraction.
 */
export declare class ShaderityUtilityWebGPU {
    /**
     * Fills template placeholders in a Shaderity shader object with provided arguments.
     * Performs a two-step template filling process: first with user-provided args,
     * then with internal configuration values.
     *
     * @param shaderityObject - The Shaderity shader object to process
     * @param args - Object containing template arguments to fill
     * @returns A new ShaderityObject with templates filled
     */
    static fillTemplate(engine: Engine, shaderityObject: ShaderityObject, primitive: Primitive, args: FillArgsObject): ShaderityObject;
    /**
     * Extracts shader data reflection information from a Shaderity object.
     * Parses the shader code to identify uniform parameters, textures, and samplers,
     * creating ShaderSemanticsInfo objects for each discovered parameter.
     *
     * @param shaderityObject - The Shaderity shader object to analyze
     * @returns Object containing array of shader semantics info and processed shader object
     */
    static getShaderDataReflection(engine: Engine, shaderityObject: ShaderityObject): {
        shaderSemanticsInfoArray: ShaderSemanticsInfo[];
        shaderityObject: ShaderityObject;
    };
    /**
     * Creates a ShaderSemanticsInfo object for texture parameters.
     * Handles texture type detection (2D, Cube) and sets up appropriate initial values.
     *
     * @param type - The WGSL texture type string
     * @param variableName - The variable name of the texture
     * @param binding - The binding index for the texture
     * @param info - Additional parameter information string
     * @param isFragmentShader - Whether this is for a fragment shader
     * @returns A configured ShaderSemanticsInfo object for the texture
     */
    private static __createShaderSemanticInfoForTexture;
    /**
     * Creates a ShaderSemanticsInfo object for uniform parameters.
     * Parses type information and additional parameter settings from the shader code.
     *
     * @param type - The WGSL type string
     * @param variableName - The variable name of the uniform
     * @param info - Additional parameter information string containing metadata
     * @param isFragmentShader - Whether this is for a fragment shader
     * @returns A configured ShaderSemanticsInfo object for the uniform
     */
    private static __createShaderSemanticsInfo;
    /**
     * Sets Rhodoite-specific parameters to a ShaderSemanticsInfo object.
     * Parses the info string to extract settings like soloDatum, isInternalSetting,
     * initialValue, and needUniformInDataTextureMode.
     *
     * @param shaderSemanticsInfo - The ShaderSemanticsInfo object to modify
     * @param info - The parameter information string to parse
     */
    private static __setRhodoniteOriginalParametersTo;
    /**
     * Parses initial value text for texture parameters and creates appropriate texture/sampler objects.
     * Supports both 2D textures and cube textures with configurable color values.
     *
     * @param shaderSemanticsInfo - The ShaderSemanticsInfo object for context
     * @param binding - The binding index for the texture
     * @param initialValueText - The text containing the initial value specification
     * @returns An array containing binding, texture, and sampler objects
     */
    private static __getInitialValueFromTextForTexture;
    /**
     * Parses initial value text for uniform parameters and creates appropriate mathematical objects.
     * Supports scalar values, vectors (2D, 3D, 4D), and matrices (2x2, 3x3, 4x4).
     * Also handles boolean values by converting them to numeric representation.
     *
     * @param shaderSemanticsInfo - The ShaderSemanticsInfo object for type validation
     * @param initialValueText - The text containing the initial value specification
     * @returns A mathematical object representing the initial value
     */
    private static __getInitialValueFromText;
    /**
     * Provides default initial values for different composition types.
     * Creates identity matrices for matrix types, zero vectors for vector types,
     * and appropriate dummy textures for texture types.
     *
     * @param shaderSemanticsInfo - The ShaderSemanticsInfo object to get default value for
     * @returns A default initial value appropriate for the given composition type
     */
    private static __getDefaultInitialValue;
    /**
     * Creates a deep copy of a ShaderityObject.
     * Preserves the code, shaderStage, and isFragmentShader properties.
     *
     * @param obj - The ShaderityObject to copy
     * @returns A new ShaderityObject with copied properties
     */
    private static __copyShaderityObject;
}
