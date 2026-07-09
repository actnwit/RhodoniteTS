import type { Primitive } from '../foundation/geometry/Primitive';
import type { Material } from '../foundation/materials/core/Material';
import { Scalar } from '../foundation/math/Scalar';
import { Vector3 } from '../foundation/math/Vector3';
import type { Vector4 } from '../foundation/math/Vector4';
import type { RenderPass } from '../foundation/renderer/RenderPass';
import type { Engine } from '../foundation/system/Engine';
import type { Index } from '../types/CommonTypes';
import type { WebXRSystem } from '../xr/WebXRSystem';
import type { WebGLStrategy } from './WebGLStrategy';
/**
 * Cleans up WebGL state cache for a specific Engine instance.
 * This should be called when the Engine is destroyed.
 * @param engine - The Engine instance being destroyed
 * @internal Called from Engine.destroy()
 */
export declare function _cleanupWebGLStatesCacheForEngine(engine: Engine): void;
/**
 * Sets WebGL rendering parameters for the given material.
 * This includes culling, blending, alpha-to-coverage, and color write mask settings.
 *
 * @param engine - The engine instance
 * @param material - The material containing rendering parameters to apply
 * @param gl - The WebGL rendering context
 */
declare function setWebGLParameters(engine: Engine, material: Material, gl: WebGLRenderingContext): void;
/**
 * Gets the viewport configuration for the given render pass.
 * If the render pass doesn't specify a viewport, returns the default viewport from the WebGL context.
 *
 * @param engine - The engine instance
 * @param renderPass - The render pass to get viewport for
 * @returns The viewport as a Vector4 containing [x, y, width, height]
 */
declare function getViewport(engine: Engine, renderPass: RenderPass): Vector4;
/**
 * Sets the viewport for VR rendering based on the specified display index.
 * Only applies viewport changes when in WebXR mode.
 *
 * @param engine - The engine instance
 * @param renderPass - The render pass being processed
 * @param displayIdx - The index of the display/eye (0 for left eye, 1 for right eye)
 */
declare function setVRViewport(engine: Engine, _renderPass: RenderPass, displayIdx: Index): void;
/**
 * Determines the number of displays/eyes to render for based on VR mode and configuration.
 * Returns 1 for non-VR mode, multiview VR, or non-main VR passes.
 * Returns 2 for standard stereo VR rendering on main passes.
 *
 * @param isVRMainPass - Whether this is a main VR rendering pass
 * @param webxrSystem - The WebXR system instance
 * @returns 1 or 2 depending on the rendering configuration
 */
declare function getDisplayCount(isVRMainPass: boolean, webxrSystem: WebXRSystem): 1 | 2;
/**
 * Determines if the given render pass is a VR main rendering pass.
 * A VR main pass is one that renders to VR displays when WebXR mode is active.
 *
 * @param renderPass - The render pass to check
 * @returns True if this is a VR main pass, false otherwise
 */
declare function isVrMainPass(engine: Engine, renderPass: RenderPass): boolean;
/**
 * Returns shader semantics information for point sprite rendering.
 * Provides configuration for point size and distance attenuation parameters.
 *
 * @returns Array of shader semantic information objects for point sprites
 */
declare function getPointSpriteShaderSemanticsInfoArray(): ({
    semantic: string;
    compositionType: {
        toString(): string;
        toJSON(): number;
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: import("../types").IndexOf16Bytes;
        readonly __dummyStr: "SCALAR";
        get webgpu(): string;
        get wgsl(): string;
        getNumberOfComponents(): import("../types").Count;
        getGlslStr(componentType: import("../foundation").ComponentTypeEnum): string;
        getGlslInitialValue(componentType: import("../foundation").ComponentTypeEnum): string;
        getWgslInitialValue(componentType: import("../foundation").ComponentTypeEnum): string;
        toWGSLType(componentType: import("../foundation").ComponentTypeEnum): string;
        getVec4SizeOfProperty(): import("../types").IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
    };
    componentType: {
        toString(): string;
        toJSON(): number;
        readonly __webgpu: string;
        readonly __wgsl: string;
        readonly __sizeInBytes: number;
        readonly __dummyStr: "FLOAT";
        get wgsl(): string;
        get webgpu(): string;
        getSizeInBytes(): number;
        isFloatingPoint(): boolean;
        isInteger(): boolean;
        isUnsignedInteger(): boolean;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
    };
    stage: import("../foundation").EnumIO;
    initialValue: Scalar;
    min: number;
    max: number;
    isInternalSetting: boolean;
} | {
    semantic: string;
    compositionType: {
        toString(): string;
        toJSON(): number;
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: import("../types").IndexOf16Bytes;
        readonly __dummyStr: "VEC3";
        get webgpu(): string;
        get wgsl(): string;
        getNumberOfComponents(): import("../types").Count;
        getGlslStr(componentType: import("../foundation").ComponentTypeEnum): string;
        getGlslInitialValue(componentType: import("../foundation").ComponentTypeEnum): string;
        getWgslInitialValue(componentType: import("../foundation").ComponentTypeEnum): string;
        toWGSLType(componentType: import("../foundation").ComponentTypeEnum): string;
        getVec4SizeOfProperty(): import("../types").IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
    };
    componentType: {
        toString(): string;
        toJSON(): number;
        readonly __webgpu: string;
        readonly __wgsl: string;
        readonly __sizeInBytes: number;
        readonly __dummyStr: "FLOAT";
        get wgsl(): string;
        get webgpu(): string;
        getSizeInBytes(): number;
        isFloatingPoint(): boolean;
        isInteger(): boolean;
        isUnsignedInteger(): boolean;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
    };
    stage: import("../foundation").EnumIO;
    initialValue: Vector3;
    min: number;
    max: number;
    isInternalSetting: boolean;
})[];
/**
 * Sets up and compiles shader programs for the given material and primitive.
 * Handles shader compilation errors by backing up and restoring valid materials.
 * If shader compilation fails, attempts to restore from a backup and retry.
 *
 * @param material - The material requiring shader setup
 * @param primitive - The primitive that will use the material
 * @param webglStrategy - The WebGL strategy for shader compilation
 */
export declare function setupShaderProgram(material: Material, primitive: Primitive, webglStrategy: WebGLStrategy): void;
/**
 * Common WebGL strategy methods for rendering operations.
 * Provides utilities for WebGL parameter management, VR rendering support,
 * and shader semantics configuration.
 */
declare const _default: Readonly<{
    setWebGLParameters: typeof setWebGLParameters;
    setVRViewport: typeof setVRViewport;
    getViewport: typeof getViewport;
    getDisplayCount: typeof getDisplayCount;
    isVrMainPass: typeof isVrMainPass;
    getPointSpriteShaderSemanticsInfoArray: typeof getPointSpriteShaderSemanticsInfoArray;
}>;
export default _default;
