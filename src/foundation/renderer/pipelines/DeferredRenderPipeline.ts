import { RnObject } from '../../core/RnObject';
import { Expression } from '../Expression';

export class DeferredRenderPipeline extends RnObject {
  private __width: number = 0;
  private __height: number = 0;
  private __expressions: Expression[] = [];

  constructor() {
    super();
  }

  async setup(canvasWidth: number, canvasHeight: number) {
    this.__width = canvasWidth;
    this.__height = canvasHeight;
  }

  public setExpressions(expressions: Expression[]) {
    this.__expressions = expressions;
  }
}
