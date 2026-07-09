import { type ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import type { IVector } from '../../../foundation/math/IVector';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { StandardShaderPart } from '../StandardShaderPart';
/**
 * A shader part that generates constant variable functions for both vertex and pixel shaders.
 * This class creates GLSL/WGSL functions that output constant values of specified composition and component types.
 *
 * @example
 * ```typescript
 * const constantShader = new ConstantVariableShader(
 *   'getConstantColor',
 *   CompositionType.Vec3,
 *   ComponentType.Float
 * );
 * constantShader.setConstantValue(Vector3.fromCopyArray([1.0, 0.5, 0.0]));
 * ```
 */
export declare class ConstantVariableShader extends StandardShaderPart {
    private __functionName;
    private __compositionType;
    private __componentType;
    private __constantValueStr;
    /**
     * Creates a new ConstantVariableShader instance.
     *
     * @param __functionName - The name of the generated shader function
     * @param __compositionType - The composition type (scalar, vec2, vec3, vec4, etc.) of the constant
     * @param __componentType - The component type (float, int, bool) of the constant
     */
    constructor(__functionName: string, __compositionType: CompositionTypeEnum, __componentType: ComponentTypeEnum);
    /**
     * Sets the constant value that will be output by the generated shader function.
     * The value is converted to the appropriate GLSL/WGSL string representation based on the component type.
     *
     * @param value - The vector value to be used as the constant. The number of components used
     *                depends on the composition type specified in the constructor.
     *
     * @example
     * ```typescript
     * // For a Vec3 float constant
     * shader.setConstantValue(Vector3.fromCopyArray([1.0, 0.5, 0.0]));
     *
     * // For a scalar int constant
     * shader.setConstantValue(Scalar.fromCopyNumber(42));
     *
     * // For a boolean constant
     * shader.setConstantValue(Scalar.fromCopyNumber(1)); // true
     * ```
     */
    setConstantValue(value: IVector): void;
    /**
     * Generates the vertex shader function definition that outputs the constant value.
     * The generated function takes an output parameter and assigns the constant value to it.
     *
     * @returns The GLSL or WGSL function definition string for the vertex shader,
     *          depending on the current process approach (WebGL or WebGPU).
     *
     * @example
     * Generated GLSL:
     * ```glsl
     * void getConstantColor(out vec3 outValue) {
     *   outValue = vec3(1.0, 0.5, 0.0);
     * }
     * ```
     *
     * Generated WGSL:
     * ```wgsl
     * fn getConstantColor(outValue: ptr<function, vec3<f32>>) {
     *   *outValue = vec3<f32>(1.0, 0.5, 0.0);
     * }
     * ```
     */
    getVertexShaderDefinitions(engine: Engine): string;
    /**
     * Generates the pixel shader function definition that outputs the constant value.
     * This is identical to the vertex shader definition as constant values are the same
     * regardless of shader stage.
     *
     * @returns The GLSL or WGSL function definition string for the pixel shader,
     *          depending on the current process approach (WebGL or WebGPU).
     *
     * @example
     * Generated GLSL:
     * ```glsl
     * void getConstantColor(out vec3 outValue) {
     *   outValue = vec3(1.0, 0.5, 0.0);
     * }
     * ```
     *
     * Generated WGSL:
     * ```wgsl
     * fn getConstantColor(outValue: ptr<function, vec3<f32>>) {
     *   *outValue = vec3<f32>(1.0, 0.5, 0.0);
     * }
     * ```
     */
    getPixelShaderDefinitions(engine: Engine): string;
    /**
     * Returns the attribute names required by this shader part.
     * Since this is a constant variable shader that doesn't use any vertex attributes,
     * it returns an empty array.
     *
     * @returns An empty array as no vertex attributes are needed for constant values.
     */
    get attributeNames(): AttributeNames;
    /**
     * Returns the vertex attribute semantics required by this shader part.
     * Since this is a constant variable shader that doesn't use any vertex attributes,
     * it returns an empty array.
     *
     * @returns An empty array as no vertex attribute semantics are needed for constant values.
     */
    get attributeSemantics(): Array<VertexAttributeEnum>;
    /**
     * Returns the attribute compositions required by this shader part.
     * Since this is a constant variable shader that doesn't use any vertex attributes,
     * it returns an empty array.
     *
     * @returns An empty array as no attribute compositions are needed for constant values.
     */
    get attributeCompositions(): Array<CompositionTypeEnum>;
}
