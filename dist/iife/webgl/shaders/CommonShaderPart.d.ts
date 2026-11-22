import type { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import type { AbstractShaderNode } from '../../foundation/materials/core/AbstractShaderNode';
import type { Socket, SocketDefaultValue } from '../../foundation/materials/core/Socket';
import type { Engine } from '../../foundation/system/Engine';
export declare abstract class CommonShaderPart {
    abstract getMainBegin(engine: Engine, isVertexStage: boolean): string;
    /**
     * @param shadingSectionBody - Body of the optional second section generated
     *   from the graph nodes reachable to an `outShadingColor` terminal. Shader
     *   parts that do not support such a section ignore it.
     */
    abstract getMainEnd(engine: Engine, isVertexStage: boolean, shadingSectionBody?: string): string;
    /**
     * Returns the opening code of an optional second shader section, or undefined
     * when this part does not support one. The resolver emits the nodes reachable
     * to an `outShadingColor` terminal inside this section, separately from the
     * main body.
     */
    getShadingSectionBegin(_engine: Engine): string | undefined;
    /** Returns the closing code of the optional second shader section. */
    getShadingSectionEnd(_engine: Engine): string;
    abstract getVertexPrerequisites(engine: Engine, shaderNodes: AbstractShaderNode[]): string;
    abstract getPixelPrerequisites(engine: Engine, shaderNodes: AbstractShaderNode[]): string;
    abstract getAssignmentStatement(engine: Engine, varName: string, inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>): string;
    abstract getAssignmentVaryingStatementInPixelShader(engine: Engine, varName: string, inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>, inputNode: AbstractShaderNode, outputNameOfPrev: string): string;
    abstract getVertexShaderDefinitions(engine: Engine): string;
    abstract getPixelShaderDefinitions(engine: Engine): string;
}
