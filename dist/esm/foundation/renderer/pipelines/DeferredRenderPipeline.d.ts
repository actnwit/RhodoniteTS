import { RnObject } from '../../core/RnObject';
import type { Expression } from '../Expression';
export declare class DeferredRenderPipeline extends RnObject {
    private __width;
    private __height;
    private __expressions;
    setup(canvasWidth: number, canvasHeight: number): Promise<void>;
    setExpressions(expressions: Expression[]): void;
}
