import type { ComponentTypeEnum } from '../../foundation/definitions/ComponentType';
import type { CompositionTypeEnum } from '../../foundation/definitions/CompositionType';
import type { AbstractShaderNode } from '../../foundation/materials/core/AbstractShaderNode';
import type { Socket, SocketDefaultValue } from '../../foundation/materials/core/Socket';
import type { Engine } from '../../foundation/system/Engine';

/**
 * One per-object shading function generated from the graph nodes of a raymarching
 * component that are reachable to an outShadingColor terminal.
 */
export type ShadingSection = {
  /** The raymarching component index this section is used for. */
  objectId: number;
  /** Unique shader function name of the section. */
  functionName: string;
  /** Generated statements of the section, without the function header/footer. */
  body: string;
};

export abstract class CommonShaderPart {
  abstract getMainBegin(engine: Engine, isVertexStage: boolean): string;
  /**
   * @param shadingSections - Per-object shading sections generated from the graph
   *   nodes reachable to outShadingColor terminals. Shader parts that do not
   *   support such sections ignore it.
   */
  abstract getMainEnd(engine: Engine, isVertexStage: boolean, shadingSections?: readonly ShadingSection[]): string;

  /**
   * True when this part emits the graph nodes reachable to an outShadingColor
   * terminal as separate per-object functions (selected by the recorded object id).
   */
  get hasShadingSection(): boolean {
    return false;
  }

  /** Prefix used for the generated per-object shading function names. */
  getShadingFunctionNamePrefix(): string {
    return 'shade';
  }

  /** Returns the opening code of one per-object shading function. */
  getShadingSectionBegin(_engine: Engine, _functionName: string): string {
    return '';
  }

  /** Returns the closing code of one per-object shading function. */
  getShadingSectionEnd(_engine: Engine): string {
    return '';
  }

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
  abstract getVertexShaderDefinitions(engine: Engine): string;
  abstract getPixelShaderDefinitions(engine: Engine): string;
}
