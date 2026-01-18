import { RnObject } from '../../core/RnObject';
import type { Expression } from '../Expression';

export class DeferredRenderPipeline extends RnObject {
  private __width = 0;
  private __height = 0;
  private __expressions: Expression[] = [];

  async setup(canvasWidth: number, canvasHeight: number) {
    this.__width = canvasWidth;
    this.__height = canvasHeight;
  }

  public setExpressions(expressions: Expression[]) {
    this.__expressions = expressions;
  }
}
