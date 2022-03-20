import {RenderPass} from '../..';
import RnObject from '../core/RnObject';
import {Is} from '../misc/Is';
import RenderTargetTexture from '../textures/RenderTargetTexture';
import Expression from './Expression';

type ColorAttachmentIndex = number;
type InputIndex = number;

type ExpressionInputs = {
  exp: Expression;
  inputRenderPasses: RenderPass[];
};

type GeneratorOfRenderTargetTexturePromise =
  IterableIterator<RenderTargetTexture>;

/**
 * Frame manages expressions and input/output dependencies between them
 */
export default class Frame extends RnObject {
  private __expressions: ExpressionInputs[] = [];
  private __expressionMap: Map<
    Expression,
    [InputIndex, ColorAttachmentIndex, GeneratorOfRenderTargetTexturePromise]
  > = new Map();
  constructor() {
    super();
  }

  /**
   * Add render passes to the end of this expression.
   */
  addExpression(exp: Expression, inputConnections: RenderPass[] = []) {
    this.__expressions.push({
      exp,
      inputRenderPasses: inputConnections,
    });
  }

  getColorAttachmentFromInputOf(
    inputFrom: Expression,
    {
      inputIndex,
      colorAttachmentIndex,
    }: {
      inputIndex: InputIndex;
      colorAttachmentIndex: ColorAttachmentIndex;
    } = {inputIndex: 0, colorAttachmentIndex: 0}
  ): Promise<RenderTargetTexture> {
    const promise = new Promise<RenderTargetTexture>(
      (
        resolve: (
          value: RenderTargetTexture | PromiseLike<RenderTargetTexture>
        ) => void
      ) => {
        function* generatorFunc() {
          const renderTargetTexture = (yield) as unknown as RenderTargetTexture;
          resolve(renderTargetTexture);
          return renderTargetTexture;
        }
        const generator = generatorFunc();

        // register the generator
        this.__expressionMap.set(inputFrom, [
          inputIndex,
          colorAttachmentIndex,
          generator as GeneratorOfRenderTargetTexturePromise,
        ]);
      }
    );
    return promise;
  }

  resolve() {
    for (const [exp, [inputIndex, colorAttachmentIndex, generator]] of this
      .__expressionMap) {
      for (const expData of this.__expressions) {
        if (exp === expData.exp) {
          const framebuffer =
            expData.inputRenderPasses[inputIndex].getFramebuffer();
          if (Is.exist(framebuffer)) {
            const renderTargetTexture =
              framebuffer.getColorAttachedRenderTargetTexture(
                colorAttachmentIndex
              );
            if (Is.exist(renderTargetTexture)) {
              generator.next(renderTargetTexture as any);
              generator.next(renderTargetTexture as any);
            }
          }
        }
      }
    }
  }

  /**
   * Clear render passes of this expression.
   */
  clearRenderPasses() {
    this.__expressions.length = 0;
  }
}
