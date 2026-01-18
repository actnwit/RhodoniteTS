import { RnObject } from '../../core/RnObject';
import type { Expression } from '../Expression';

export class DeferredRenderPipeline extends RnObject {
  async setup(canvasWidth: number, canvasHeight: number) {
    this.__width = canvasWidth;
    this.__height = canvasHeight;
  }

  public setExpressions(expressions: Expression[]) {
    this.__expressions = expressions;
  }
}
