import type { ProcessApproachEnum } from '../../foundation/definitions/ProcessApproach';
import type { CGAPIResourceHandle, Index, IndexOf16Bytes } from '../../types/CommonTypes';
import type { getShaderPropertyFuncOfGlobalDataRepository, ShaderSemanticsName } from '../definitions/ShaderSemantics';
import type { Engine } from '../system/Engine';
/**
 * The repository class that manages global data used throughout the rendering pipeline.
 * This singleton class handles global properties such as camera matrices, lighting data,
 * bone transformations for skeletal animation, and other shared rendering state.
 */
export declare class GlobalDataRepository {
    private __engine;
    private static __instance;
    private __fields;
    private constructor();
    /**
     * Initializes the GlobalDataRepository with all required global properties.
     * Sets up data structures for camera matrices, lighting, skeletal animation,
     * and other rendering parameters based on the specified process approach.
     *
     * @param approach - The processing approach that determines
     *                   how data is organized and accessed in shaders
     */
    initialize(_approach: ProcessApproachEnum): void;
    /**
     * Returns the singleton instance of GlobalDataRepository.
     * Creates a new instance if it doesn't exist yet.
     *
     * @returns The singleton instance of GlobalDataRepository
     */
    static init(engine: Engine): GlobalDataRepository;
    /**
     * Registers a new global property with its semantic information and maximum count.
     * Creates the necessary buffer memory allocation and accessor for the property.
     *
     * @param semanticInfo - The shader semantic information defining the property structure
     * @param maxCount - The maximum number of instances this property can have
     * @private
     */
    private __registerProperty;
    /**
     * Allocates and returns a new instance of the specified global property.
     * Initializes the property with its default value and adds it to the internal tracking.
     *
     * @param shaderSemantic - The name of the shader semantic property to allocate
     * @returns The newly allocated property value object, or undefined if the property doesn't exist
     */
    takeOne(shaderSemantic: ShaderSemanticsName): any;
    /**
     * Sets the value of a specific instance of a global property.
     * Updates the underlying memory buffer with the new value.
     *
     * @param shaderSemantic - The name of the shader semantic property to update
     * @param countIndex - The index of the specific instance to update
     * @param value - The new value to set for this property instance
     */
    setValue(shaderSemantic: ShaderSemanticsName, countIndex: Index, value: any): void;
    /**
     * Retrieves the value of a specific instance of a global property.
     *
     * @param shaderSemantic - The name of the shader semantic property to retrieve
     * @param countIndex - The index of the specific instance to retrieve
     * @returns The value object for the specified property instance, or undefined if not found
     */
    getValue(shaderSemantic: ShaderSemanticsName, countIndex: Index): any;
    /**
     * Sets up uniform locations for all global properties when using uniform mode.
     * This is used internally by the WebGL resource repository for shader program setup.
     *
     * @param shaderProgramUid - The unique identifier of the shader program
     * @internal
     */
    _setUniformLocationsForUniformModeOnly(shaderProgramUid: CGAPIResourceHandle): void;
    /**
     * Sets up uniform locations for properties that need uniform access in data texture mode.
     * Only sets up uniforms for properties marked with needUniformInDataTextureMode flag.
     *
     * @param shaderProgramUid - The unique identifier of the shader program
     * @internal
     */
    _setUniformLocationsForDataTextureModeOnly(shaderProgramUid: CGAPIResourceHandle): void;
    /**
     * Gets the memory location offset of a global property in 16-byte aligned units.
     * This is used for data texture mode to determine where properties are stored in memory.
     *
     * @param propertyName - The name of the property to get the offset for
     * @returns The offset in 16-byte units, or -1 if the property is not found
     */
    getLocationOffsetOfProperty(propertyName: ShaderSemanticsName): IndexOf16Bytes;
    /**
     * Adds global property declarations to vertex and pixel shader code strings.
     * This method is used during shader compilation to inject the necessary uniform
     * declarations for all registered global properties.
     *
     * @param vertexPropertiesStr - The string to append vertex shader property declarations to
     * @param pixelPropertiesStr - The string to append pixel shader property declarations to
     * @param propertySetter - The function used to generate property declaration code
     * @param isWebGL2 - Whether the target is WebGL 2.0 (affects syntax generation)
     * @returns A tuple containing the updated vertex and pixel shader property strings
     * @internal
     */
    _addPropertiesStr(vertexPropertiesStr: string, pixelPropertiesStr: string, propertySetter: getShaderPropertyFuncOfGlobalDataRepository): string[];
}
