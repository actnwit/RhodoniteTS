import { AbstractShaderNode } from '../core';
export declare class MergeVectorShaderNode extends AbstractShaderNode {
    constructor();
    getShaderFunctionNameDerivative(): string;
    makeCallStatement(i: number, shaderNode: AbstractShaderNode, functionName: string, varInputNames: string[][], varOutputNames: string[][]): string;
}
