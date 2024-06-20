import { VertexAttributeEnum } from '../../foundation/definitions/VertexAttribute';
import { WebGLResourceRepository } from '../WebGLResourceRepository';
import { AttributeNames } from '../types/CommonTypes';
import { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import { Socket } from '../../foundation/materials/core/Socket';
import { AbstractShaderNode } from '../../foundation/materials/core/AbstractShaderNode';
export declare abstract class CommonShaderPart {
    static __instance: CommonShaderPart;
    __webglResourceRepository?: WebGLResourceRepository;
    constructor();
    static getMainBegin(isVertexStage: boolean): string;
    static getMainEnd(isVertexStage: boolean): "\n  return output;\n}\n" | "\n  return rt0;\n}\n" | "\n}\n    ";
    static getVertexPrerequisites(shaderNodes: AbstractShaderNode[]): string;
    private static __makeVaryingVariablesWGSL;
    static getPixelPrerequisites(shaderNodes: AbstractShaderNode[]): string;
    static getMainPrerequisites(): any;
    static getAssignmentStatement(varName: string, inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum>): string;
    static getAssignmentVaryingStatementInPixelShader(varName: string, inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum>, inputNode: AbstractShaderNode): string;
    static getAssignmentVaryingStatementInVertexShader(inputNode: AbstractShaderNode, varNames: string[], j: number): string;
    abstract get attributeNames(): AttributeNames;
    abstract get attributeSemantics(): Array<VertexAttributeEnum>;
    abstract get attributeCompositions(): Array<CompositionTypeEnum>;
    abstract get vertexShaderDefinitions(): string;
    abstract get pixelShaderDefinitions(): string;
}
