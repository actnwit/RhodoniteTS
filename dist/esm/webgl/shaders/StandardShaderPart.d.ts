import { type ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import { type VertexAttributeEnum } from '../../foundation/definitions/VertexAttribute';
import { AbstractShaderNode } from '../../foundation/materials/core/AbstractShaderNode';
import type { Socket, SocketDefaultValue } from '../../foundation/materials/core/Socket';
import type { Engine } from '../../foundation/system/Engine';
import type { AttributeNames } from '../types/CommonTypes';
import { CommonShaderPart } from './CommonShaderPart';
/**
 * Base class that provides common shader functionality for both WebGL and WebGPU rendering approaches.
 * This class handles shader code generation, vertex/fragment shader prerequisites, and cross-platform compatibility
 * between WebGL and WebGPU shader languages (GLSL and WGSL).
 */
export declare class StandardShaderPart extends CommonShaderPart {
    /**
     * Generates the main function beginning code for vertex or fragment shaders.
     * Handles differences between WebGL (GLSL) and WebGPU (WGSL) shader languages.
     *
     * @param isVertexStage - True if generating code for vertex shader, false for fragment shader
     * @returns The shader code string for the main function beginning
     */
    getMainBegin(engine: Engine, isVertexStage: boolean): string;
    /**
     * Generates the main function ending code for vertex or fragment shaders.
     * Handles differences between WebGL (GLSL) and WebGPU (WGSL) shader languages.
     *
     * @param engine - The engine instance
     * @param isVertexStage - True if generating code for vertex shader, false for fragment shader
     * @returns The shader code string for the main function ending
     */
    getMainEnd(engine: Engine, isVertexStage: boolean): "\n  return output;\n}\n" | "\n  return rt0;\n}\n" | "\n}\n";
    getMaterialSIDForWebGL(): string;
    /**
     * Generates vertex shader prerequisites including definitions, vertex inputs, and uniform declarations.
     * Creates appropriate code for both WebGL (GLSL) and WebGPU (WGSL) based on the current process approach.
     *
     * @param engine - The engine instance
     * @param shaderNodes - Array of shader nodes used to generate varying variables for WebGPU
     * @returns The complete vertex shader prerequisites code string
     */
    getVertexPrerequisites(engine: Engine, shaderNodes: AbstractShaderNode[]): string;
    /**
     * Creates varying variables declaration string for WebGPU shaders.
     * Analyzes shader node connections to determine which variables need to be passed from vertex to fragment stage.
     *
     * @param shaderNodes - Array of shader nodes to analyze for varying variables
     * @returns WGSL varying variables declaration string
     * @private
     */
    private __makeVaryingVariablesWGSL;
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
    /**
     * Generates varying variable assignment statement for vertex shaders.
     * Creates code to write varying variables that will be passed to fragment shader.
     *
     * @param engine - The engine instance
     * @param inputNode - The shader node that provides the varying variable
     * @param varNames - Array of variable names to assign
     * @param j - Index of the current variable in the varNames array
     * @returns The varying variable assignment statement string for vertex shader
     */
    getAssignmentVaryingStatementInVertexShader(engine: Engine, inputNode: AbstractShaderNode, varNames: string[], j: number): string;
    /**
     * Gets the attribute names used by this shader part.
     * Subclasses should override this to define which vertex attributes are used.
     *
     * @returns Object containing attribute name mappings
     */
    get attributeNames(): AttributeNames;
    /**
     * Gets the vertex attribute semantics used by this shader part.
     * Subclasses should override this to define the semantic meaning of each attribute.
     *
     * @returns Array of vertex attribute enums defining the semantics
     */
    get attributeSemantics(): Array<VertexAttributeEnum>;
    /**
     * Gets the composition types for each vertex attribute used by this shader part.
     * Subclasses should override this to define the data composition (scalar, vec2, vec3, etc.).
     *
     * @returns Array of composition type enums defining the data structure
     */
    get attributeCompositions(): Array<CompositionTypeEnum>;
    /**
     * Gets the vertex shader definitions code.
     * Subclasses should override this to provide shader-specific definitions.
     *
     * @returns Vertex shader definitions code string
     */
    getVertexShaderDefinitions(_engine: Engine): string;
    /**
     * Gets the pixel/fragment shader definitions code.
     * Subclasses should override this to provide shader-specific definitions.
     *
     * @returns Fragment shader definitions code string
     */
    getPixelShaderDefinitions(_engine: Engine): string;
}
