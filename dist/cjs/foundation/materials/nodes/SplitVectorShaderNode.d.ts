import { AbstractShaderNode } from '../core/AbstractShaderNode';
export declare class SplitVectorShaderNode extends AbstractShaderNode {
    constructor();
    getShaderFunctionNameDerivative(): string;
    makeCallStatement(i: number, shaderNode: AbstractShaderNode, functionName: string, varInputNames: string[][], varOutputNames: string[][]): string;
}
