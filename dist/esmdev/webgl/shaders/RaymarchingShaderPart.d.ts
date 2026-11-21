import type { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import type { AbstractShaderNode } from '../../foundation/materials/core/AbstractShaderNode';
import type { Socket, SocketDefaultValue } from '../../foundation/materials/core/Socket';
import type { Engine } from '../../foundation/system/Engine';
import { CommonShaderPart } from './CommonShaderPart';
/**
 * RaymarchingShaderPart is a class that provides common shader functionality for both WebGL and WebGPU rendering approaches.
 * This class handles shader code generation, vertex/fragment shader prerequisites, and cross-platform compatibility
 * between WebGL and WebGPU shader languages (GLSL and WGSL).
 */
export declare class RaymarchingShaderPart extends CommonShaderPart {
    /**
     * Generates the main function beginning code for vertex or fragment shaders.
     * Handles differences between WebGL (GLSL) and WebGPU (WGSL) shader languages.
     *
     * @param isVertexStage - True if generating code for vertex shader, false for fragment shader
     * @returns The shader code string for the main function beginning
     */
    getMainBegin(engine: Engine, isVertexStage: boolean): string;
    /**
     * Opens the optional shading section emitted from the graph nodes reachable to
     * an OutShadingColor node. It runs once per hit fragment, after `map()` has
     * been evaluated during the ray march.
     */
    getShadingSectionBegin(engine: Engine): string;
    /** Closes the shading section opened by getShadingSectionBegin. */
    getShadingSectionEnd(_engine: Engine): string;
    /**
     * Generates the main function ending code for vertex or fragment shaders.
     * Handles differences between WebGL (GLSL) and WebGPU (WGSL) shader languages.
     *
     * @param engine - The engine instance
     * @param isVertexStage - True if generating code for vertex shader, false for fragment shader
     * @param shadingSectionBody - Optional body of the shading section (see getShadingSectionBegin)
     * @returns The shader code string for the main function ending
     */
    getMainEnd(engine: Engine, isVertexStage: boolean, shadingSectionBody?: string): string;
    getMaterialSIDForWebGL(): string;
    /**
     * Generates vertex shader prerequisites for Raymarching shader.
     *
     * @param engine - The engine instance
     * @param shaderNodes - Array of shader nodes used to generate varying variables for Raymarching shader
     * @returns The complete vertex shader prerequisites code string for Raymarching shader
     */
    getVertexPrerequisites(engine: Engine, _shaderNodes: AbstractShaderNode[]): string;
    /**
     * Generates fragment/pixel shader prerequisites including definitions and varying variable declarations.
     * Creates appropriate code for both WebGL (GLSL) and WebGPU (WGSL) based on the current process approach.
     *
     * @param engine - The engine instance
     * @param shaderNodes - Array of shader nodes used to generate varying variables for WebGPU
     * @returns The complete fragment shader prerequisites code string
     */
    getPixelPrerequisites(engine: Engine, shaderNodes: AbstractShaderNode[]): string;
    /**
     * Returns the PBR shading function definitions shared with the PBR material
     * plus the raymarching PBR wrapper used by the fragment shader.
     */
    private static __getPbrFunctionsWGSL;
    private static __getPbrFunctionsGLSL;
    /**
     * Generates variable assignment statement with proper type declaration.
     * Creates appropriate syntax for both WebGL (GLSL) and WebGPU (WGSL) based on the current process approach.
     *
     * @param engine - The engine instance
     * @param varName - The name of the variable to declare
     * @param inputSocket - The socket containing type and default value information
     * @returns The variable assignment statement string
     */
    getAssignmentStatement(engine: Engine, varName: string, inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>): string;
    /**
     * Generates varying variable assignment statement for fragment/pixel shaders.
     * Creates code to read varying variables passed from vertex shader with proper type declaration.
     *
     * @param engine - The engine instance
     * @param varName - The name of the variable to declare
     * @param inputSocket - The socket containing type information
     * @param inputNode - The shader node that provides the varying variable
     * @returns The varying variable assignment statement string for fragment shader
     */
    getAssignmentVaryingStatementInPixelShader(engine: Engine, varName: string, inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>, inputNode: AbstractShaderNode, outputNameOfPrev: string): string;
    getVertexShaderDefinitions(_engine: Engine): string;
    getPixelShaderDefinitions(_engine: Engine): string;
}
