import { type ShaderityObject } from 'shaderity';
import type { RenderingArgWebGL } from '../../../webgl/types/CommonTypes';
import type { BlendShapeComponent } from '../../components/BlendShape/BlendShapeComponent';
import type { CameraComponent } from '../../components/Camera/CameraComponent';
import type { LightComponent } from '../../components/Light/LightComponent';
import type { MeshComponent } from '../../components/Mesh/MeshComponent';
import type { SkeletalComponent } from '../../components/Skeletal/SkeletalComponent';
import type { Config } from '../../core/Config';
import { RnObject } from '../../core/RnObject';
import type { ShaderSemanticsInfo } from '../../definitions/ShaderSemanticsInfo';
import { type ShaderTypeEnum } from '../../definitions/ShaderType';
import type { Primitive } from '../../geometry/Primitive';
import type { IMatrix33 } from '../../math/IMatrix';
import type { Matrix44 } from '../../math/Matrix44';
import { MutableVector2 } from '../../math/MutableVector2';
import { MutableVector4 } from '../../math/MutableVector4';
import type { Engine } from '../../system/Engine';
import type { Material } from './Material';
type MaterialNodeUID = number;
/**
 * Abstract base class for material content that provides common functionality for material rendering.
 * This class handles shader semantics, rendering setup, and GPU parameter management for materials.
 */
export declare abstract class AbstractMaterialContent extends RnObject {
    protected __semantics: ShaderSemanticsInfo[];
    static materialNodes: AbstractMaterialContent[];
    protected __materialName: string;
    /** The engine instance this material content is associated with */
    protected _engine?: Engine;
    protected __definitions: string;
    protected static __tmp_vector4: MutableVector4;
    protected static __tmp_vector2: MutableVector2;
    private __isMorphing;
    private __isSkinning;
    private __isLighting;
    private static __lightPositions;
    private static __lightDirections;
    private static __lightIntensities;
    private static __lightProperties;
    private static __materialContentCount;
    private __materialContentUid;
    /** Shader caches managed per-Engine. Key is Engine.objectUID */
    private static __vertexShaderityObjectMapPerEngine;
    private static __pixelShaderityObjectMapPerEngine;
    private static __reflectedShaderSemanticsInfoArrayMapPerEngine;
    shaderType: ShaderTypeEnum;
    private __materialSemanticsVariantName;
    private __materialVariationIdentifier;
    /**
     * Gets the vertex shaderity object map for a specific engine.
     * Creates the map if it doesn't exist.
     */
    private static __getVertexShaderityObjectMap;
    /**
     * Gets the pixel shaderity object map for a specific engine.
     * Creates the map if it doesn't exist.
     */
    private static __getPixelShaderityObjectMap;
    /**
     * Gets the reflected shader semantics info map for a specific engine.
     * Creates the map if it doesn't exist.
     */
    private static __getReflectedShaderSemanticsInfoArrayMap;
    /**
     * Constructs a new AbstractMaterialContent instance.
     * @param materialName - The unique name identifier for this material
     * @param options - Configuration options for the material
     * @param options.isMorphing - Whether this material supports morph target animation
     * @param options.isSkinning - Whether this material supports skeletal animation
     * @param options.isLighting - Whether this material supports lighting calculations
     * @param vertexShaderityObject - Optional vertex shader object
     * @param pixelShaderityObject - Optional pixel shader object
     * @param engine - Optional engine instance for proper shader caching
     */
    constructor(materialName: string, { isMorphing, isSkinning, isLighting }?: {
        isLighting?: boolean | undefined;
        isMorphing?: boolean | undefined;
        isSkinning?: boolean | undefined;
    }, vertexShaderityObject?: ShaderityObject, pixelShaderityObject?: ShaderityObject, engine?: Engine);
    /**
     * Sets the vertex shader object for this material.
     * @param vertexShaderityObject - The vertex shader object to set
     * @param engine - Optional engine instance (uses this._engine if not provided)
     */
    protected setVertexShaderityObject(vertexShaderityObject?: ShaderityObject, engine?: Engine): void;
    /**
     * Sets the pixel shader object for this material.
     * @param pixelShaderityObject - The pixel shader object to set
     * @param engine - Optional engine instance (uses this._engine if not provided)
     */
    protected setPixelShaderityObject(pixelShaderityObject?: ShaderityObject, engine?: Engine): void;
    /**
     * Generates a unique variant name for this material based on its shader semantics.
     * This name is used to differentiate materials with different semantic configurations.
     */
    makeMaterialSemanticsVariantName(): void;
    /**
     * Gets the material semantics variant name for this material.
     * This is the full identifier combining material name and variation identifier.
     * @returns The unique variant name string
     */
    getMaterialSemanticsVariantName(): string;
    /**
     * Gets the material variation identifier (without the base material name).
     * This represents only the parameter variation part of the material type.
     * @returns The variation identifier string
     */
    getMaterialVariationIdentifier(): string;
    /**
     * Gets the base material name (e.g., "PbrUber", "ClassicUber").
     * Double trailing underscores are removed for cleaner display.
     * @returns The base material name string
     */
    getBaseMaterialName(): string;
    /**
     * Gets the vertex shader object associated with this material.
     * @returns The vertex shader object or undefined if not set
     */
    get vertexShaderityObject(): ShaderityObject | undefined;
    /**
     * Gets the pixel shader object associated with this material.
     * @returns The pixel shader object or undefined if not set
     */
    get pixelShaderityObject(): ShaderityObject | undefined;
    /**
     * Gets the shader definitions string for this material.
     * @returns The definitions string
     */
    getDefinitions(): string;
    /**
     * Retrieves a material node by its unique identifier.
     * @param materialNodeUid - The unique identifier of the material node
     * @returns The material node instance
     */
    static getMaterialNode(materialNodeUid: MaterialNodeUID): AbstractMaterialContent;
    /**
     * Gets the shader semantics information array for this material.
     * @returns Array of shader semantics information
     */
    get _semanticsInfoArray(): ShaderSemanticsInfo[];
    /**
     * Checks if this material supports skeletal animation.
     * @returns True if skinning is enabled
     */
    get isSkinning(): boolean;
    /**
     * Checks if this material supports morph target animation.
     * @returns True if morphing is enabled
     */
    get isMorphing(): boolean;
    /**
     * Checks if this material supports lighting calculations.
     * @returns True if lighting is enabled
     */
    get isLighting(): boolean;
    /**
     * Sets the shader semantics information array for this material.
     * @param shaderSemanticsInfoArray - Array of shader semantics information to set
     */
    setShaderSemanticsInfoArray(shaderSemanticsInfoArray: ShaderSemanticsInfo[]): void;
    /**
     * Sets up basic rendering information including matrices, camera, and lighting.
     * @param args - WebGL rendering arguments
     * @param shaderProgram - The WebGL shader program
     * @param firstTime - Whether this is the first time setup
     * @param material - The material instance
     * @param CameraComponentClass - The camera component class
     */
    protected setupBasicInfo(engine: Engine, args: RenderingArgWebGL, shaderProgram: WebGLProgram, firstTime: boolean, material: Material, CameraComponentClass: typeof CameraComponent): void;
    /**
     * Sets the world transformation matrix uniform in the shader.
     * @param shaderProgram - The WebGL shader program
     * @param worldMatrix - The world transformation matrix
     */
    protected setWorldMatrix(shaderProgram: WebGLProgram, worldMatrix: Matrix44): void;
    /**
     * Sets the normal transformation matrix uniform in the shader.
     * @param shaderProgram - The WebGL shader program
     * @param normalMatrix - The normal transformation matrix
     */
    protected setNormalMatrix(shaderProgram: WebGLProgram, normalMatrix: IMatrix33): void;
    /**
     * Sets the billboard flag uniform in the shader.
     * @param shaderProgram - The WebGL shader program
     * @param isBillboard - Whether the object should be rendered as a billboard
     */
    protected setIsBillboard(shaderProgram: WebGLProgram, isBillboard: boolean): void;
    /**
     * Sets the visibility flag uniform in the shader.
     * @param shaderProgram - The WebGL shader program
     * @param isVisible - Whether the object should be rendered
     */
    protected setIsVisible(shaderProgram: WebGLProgram, isVisible: boolean): void;
    /**
     * Sets view-related uniforms including view matrix and camera position.
     * @param shaderProgram - The WebGL shader program
     * @param cameraComponent - The camera component
     * @param isVr - Whether rendering in VR mode
     * @param displayIdx - The display index for VR rendering
     */
    setViewInfo(shaderProgram: WebGLProgram, cameraComponent: CameraComponent, isVr: boolean, displayIdx: number): void;
    /**
     * Sets the projection matrix uniform in the shader.
     * @param shaderProgram - The WebGL shader program
     * @param cameraComponent - The camera component
     * @param isVr - Whether rendering in VR mode
     * @param displayIdx - The display index for VR rendering
     */
    setProjection(shaderProgram: WebGLProgram, cameraComponent: CameraComponent, isVr: boolean, displayIdx: number): void;
    /**
     * Sets skeletal animation uniforms in the shader.
     * @param shaderProgram - The WebGL shader program
     * @param setUniform - Whether to set uniform values
     * @param skeletalComponent - The skeletal component containing bone data
     */
    protected setSkinning(config: Config, shaderProgram: WebGLProgram, setUniform: boolean, skeletalComponent?: SkeletalComponent): void;
    /**
     * Sets lighting information uniforms in the shader.
     * @param shaderProgram - The WebGL shader program
     * @param lightComponents - Array of light components
     * @param material - The material instance
     * @param setUniform - Whether to set uniform values
     */
    protected setLightsInfo(config: Config, shaderProgram: WebGLProgram, lightComponents: LightComponent[], _material: Material, setUniform: boolean): void;
    /**
     * Sets morph target animation uniforms in the shader.
     * @param shaderProgram - The WebGL shader program
     * @param meshComponent - The mesh component
     * @param primitive - The primitive containing morph targets
     * @param blendShapeComponent - The blend shape component containing weights
     */
    setMorphInfo(shaderProgram: WebGLProgram, _meshComponent: MeshComponent, primitive: Primitive, _blendShapeComponent?: BlendShapeComponent): void;
    /**
     * Sets internal setting parameters to GPU for WebGL per shader program.
     * This method should be overridden by derived classes to provide specific parameter handling.
     * @param params - Object containing material, shader program, firstTime flag, and rendering arguments
     */
    _setInternalSettingParametersToGpuWebGLPerShaderProgram(_params: {}): void;
    /**
     * Sets internal setting parameters to GPU for WebGL per material.
     * This method should be overridden by derived classes to provide specific parameter handling.
     * @param params - Object containing material, shader program, firstTime flag, and rendering arguments
     */
    _setInternalSettingParametersToGpuWebGLPerMaterial(_params: {}): void;
    /**
     * Sets internal setting parameters to GPU for WebGL per primitive.
     * This method should be overridden by derived classes to provide specific parameter handling.
     * @param params - Object containing material, shader program, firstTime flag, and rendering arguments
     */
    _setInternalSettingParametersToGpuWebGLPerPrimitive(_params: {}): void;
    /**
     * Sets internal setting parameters to GPU for WebGPU.
     * This method should be overridden by derived classes to provide specific parameter handling.
     * @param params - Object containing material and WebGPU rendering arguments
     */
    _setInternalSettingParametersToGpuWebGpu(_params: {}): void;
    /**
     * Gets the shader definition string for this material.
     * This method should be overridden by derived classes to provide specific definitions.
     * @returns Empty string by default
     */
    getDefinition(): string;
    /**
     * Performs shader reflection to extract semantics information from vertex and pixel shaders.
     * @param vertexShader - The vertex shader object for WebGL
     * @param pixelShader - The pixel shader object for WebGL
     * @param vertexShaderWebGpu - The vertex shader object for WebGPU
     * @param pixelShaderWebGpu - The pixel shader object for WebGPU
     * @param definitions - Array of shader definitions
     * @returns Array of shader semantics information
     */
    protected doShaderReflection(engine: Engine, vertexShader: ShaderityObject, pixelShader: ShaderityObject, vertexShaderWebGpu: ShaderityObject, pixelShaderWebGpu: ShaderityObject, definitions: string[]): ShaderSemanticsInfo[];
    /**
     * Cleans up static caches for a specific Engine instance.
     * This should be called when the Engine is destroyed to prevent stale references.
     *
     * @param engine - The Engine instance being destroyed
     * @internal Called from Engine.destroy()
     */
    static _cleanupForEngine(engine: Engine): void;
}
export {};
