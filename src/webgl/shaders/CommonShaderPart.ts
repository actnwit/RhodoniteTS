import type { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import type { AbstractShaderNode } from '../../foundation/materials/core/AbstractShaderNode';
import type { Socket, SocketDefaultValue } from '../../foundation/materials/core/Socket';
import type { Engine } from '../../foundation/system/Engine';

export abstract class CommonShaderPart {
  abstract getMainBegin(engine: Engine, isVertexStage: boolean): string;
  abstract getMainEnd(engine: Engine, isVertexStage: boolean): string;
  abstract getMainPrerequisites(): string;
  abstract getVertexPrerequisites(engine: Engine, shaderNodes: AbstractShaderNode[]): string;
  abstract getPixelPrerequisites(engine: Engine, shaderNodes: AbstractShaderNode[]): string;
  abstract getAssignmentStatement(
    engine: Engine,
    varName: string,
    inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>
  ): string;
  abstract getAssignmentVaryingStatementInPixelShader(
    engine: Engine,
    varName: string,
    inputSocket: Socket<string, CompositionTypeEnum, ComponentTypeEnum, SocketDefaultValue>,
    inputNode: AbstractShaderNode,
    outputNameOfPrev: string
  ): string;
}
