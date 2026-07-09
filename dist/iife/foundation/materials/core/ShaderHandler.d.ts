import { type ShaderityObject } from 'shaderity';
import type { CGAPIResourceHandle } from '../../../types/CommonTypes';
import type { AttributeNames } from '../../../webgl/types/CommonTypes';
import type { ShaderSources } from '../../../webgl/WebGLStrategy';
import type { getShaderPropertyFuncOfGlobalDataRepository, getShaderPropertyFuncOfMaterial } from '../../definitions/ShaderSemantics';
import type { VertexAttributeEnum } from '../../definitions/VertexAttribute';
import type { Primitive } from '../../geometry/Primitive';
import type { Engine } from '../../system/Engine';
import type { AbstractMaterialContent } from './AbstractMaterialContent';
import type { Material } from './Material';
/**
 * Handles shader program creation, caching, and management for the rendering system.
 * Provides utilities for creating shader programs with WebGL and WebGPU backends.
 *
 * @remarks
 * Shader program caching is managed per-Engine instance to prevent cross-contamination
 * between different WebGL contexts. When an Engine is destroyed, its shader cache
 * is automatically cleaned up.
 */
export declare class ShaderHandler {
    /**
     * Creates a shader program or retrieves it from cache if already compiled.
     * This method implements shader program caching to avoid redundant compilation
     * of identical shader combinations. The cache is stored per-Engine instance.
     *
     * @param engine - The engine instance that owns the shader cache
     * @param material - The material that will use this shader program
     * @param primitive - The geometric primitive that defines vertex attributes
     * @param vertexShader - The vertex shader source code
     * @param pixelShader - The fragment/pixel shader source code
     * @param attributeNames - Array of vertex attribute names
     * @param attributeSemantics - Array of vertex attribute semantic meanings
     * @param onError - Optional error callback function
     * @returns A tuple containing the shader program handle and a boolean indicating if it's newly created
     */
    static _createShaderProgramWithCache(engine: Engine, material: Material, primitive: Primitive, vertexShader: string, pixelShader: string, attributeNames: AttributeNames, attributeSemantics: VertexAttributeEnum[], onError?: (message: string) => void): [CGAPIResourceHandle, boolean];
}
/**
 * Creates a shader program using pre-processed shader sources.
 * This function is used when shader sources have already been updated
 * and processed through the shader compilation pipeline.
 *
 * @param engine - The engine instance
 * @param material - The material that will use this shader program
 * @param primitive - The geometric primitive that defines vertex attributes
 * @param materialNode - The material content node containing shader objects
 * @param updatedShaderSources - Pre-processed vertex and fragment shader sources
 * @param onError - Optional error callback function
 * @returns A tuple containing the shader program handle and a boolean indicating if it's newly created
 */
export declare function _createProgramAsSingleOperationByUpdatedSources(engine: Engine, material: Material, primitive: Primitive, materialNode: AbstractMaterialContent, updatedShaderSources: ShaderSources, onError?: (message: string) => void): [CGAPIResourceHandle, boolean];
/**
 * Extracts vertex attribute information from a Shaderity object.
 * This includes both attribute names and their semantic meanings,
 * which are essential for proper vertex buffer binding.
 *
 * @param shaderityObject - The Shaderity object containing shader reflection data
 * @returns An object containing attribute names and their corresponding semantics
 */
export declare function _getAttributeInfo(shaderityObject: ShaderityObject): {
    attributeNames: string[];
    attributeSemantics: VertexAttributeEnum[];
};
/**
 * Generates a formatted string containing vertex attribute binding information.
 * This is primarily used for debugging and shader inspection purposes,
 * providing clear mapping between attribute names and their semantics.
 *
 * @param attributeNames - Array of vertex attribute names
 * @param attributeSemantics - Array of corresponding vertex attribute semantics
 * @returns A formatted string with attribute binding information
 */
export declare function _outputVertexAttributeBindingInfo(attributeNames: string[], attributeSemantics: VertexAttributeEnum[]): string;
/**
 * Creates a complete shader program for WebGL rendering.
 * This function handles the entire shader compilation pipeline including:
 * - Material property extraction and embedding
 * - Shader definition generation
 * - Template filling with runtime values
 * - Final shader compilation and linking
 *
 * @param engine - The engine instance
 * @param material - The material containing shader templates and properties
 * @param componentDataAccessMethodDefinitionsForVertexShader - method definitions for component data access for vertex shader
 * @param componentDataAccessMethodDefinitionsForPixelShader - method definitions for component data access for pixel shader
 * @param propertySetterOfGlobalDataRepository - Function for setting shader properties of global data repository
 * @param propertySetterOfMaterial - Function for setting shader properties of material
 * @param morphedPositionGetter - Function to get the morphed position
 * @param primitive - The geometric primitive that defines vertex attributes
 * @returns A tuple containing the shader program handle and a boolean indicating if it's newly created
 */
export declare function _createProgramAsSingleOperationWebGL(engine: Engine, material: Material, componentDataAccessMethodDefinitionsForVertexShader: string, componentDataAccessMethodDefinitionsForPixelShader: string, propertySetterOfGlobalDataRepository: getShaderPropertyFuncOfGlobalDataRepository, propertySetterOfMaterial: getShaderPropertyFuncOfMaterial, morphedPositionGetter: string, primitive: Primitive): [CGAPIResourceHandle, boolean];
/**
 * Sets up global shader definitions and preprocessor directives for WebGL.
 * This function configures platform-specific shader features including:
 * - WebGL version detection and GLSL ES version selection
 * - UBO (Uniform Buffer Object) support detection
 * - Multi-view rendering for WebXR
 * - Bone data type definitions
 * - Standard derivatives extension support
 *
 * @param materialTypeName - The name of the material type for debugging
 * @param primitive - The geometric primitive for context-specific definitions
 * @returns A string containing all global shader definitions
 */
export declare function _setupGlobalShaderDefinitionWebGL(engine: Engine, materialTypeName: string, _primitive: Primitive): string;
/**
 * Creates a complete shader program for WebGPU rendering.
 * This function handles the WebGPU-specific shader compilation pipeline including:
 * - WGSL shader template processing
 * - Material property embedding
 * - Pragma preprocessing with Shaderity
 * - WebGPU-specific definitions and configurations
 *
 * @param engine - The engine instance
 * @param material - The material containing shader templates and properties
 * @param primitive - The geometric primitive that defines vertex attributes
 * @param componentDataAccessMethodDefinitionsForVertexShader - method definitions for component data access for vertex shader
 * @param componentDataAccessMethodDefinitionsForPixelShader - method definitions for component data access for pixel shader
 * @param propertySetterOfGlobalDataRepository - Function for setting shader properties of global data repository
 * @param propertySetterOfMaterial - Function for setting shader properties of material
 * @param morphedPositionGetter - Function to get the morphed position
 * @returns The handle to the created shader program
 */
export declare function _createProgramAsSingleOperationWebGpu(engine: Engine, material: Material, primitive: Primitive, componentDataAccessMethodDefinitionsForVertexShader: string, componentDataAccessMethodDefinitionsForPixelShader: string, propertySetterOfGlobalDataRepository: getShaderPropertyFuncOfGlobalDataRepository, propertySetterOfMaterial: getShaderPropertyFuncOfMaterial, morphedPositionGetter: string): number;
