import {RequireOne} from '../../types/TypeGenerators';
import {RnObject} from '../core/RnObject';
import {IVector4} from '../math/IVector';
import {assertExist} from '../misc/MiscUtil';
import {Is} from '../misc/Is';
import {RenderTargetTexture} from '../textures/RenderTargetTexture';
import {Expression} from './Expression';
import {FrameBuffer} from './FrameBuffer';
import {RenderPass} from './RenderPass';

type ColorAttachmentIndex = number;
type InputRenderPassIndex = number;
type RenderPassIndex = number;

type ExpressionInputs = {
  expression: Expression;
  inputRenderPasses: RenderPass[];
};

type GeneratorOfRenderTargetTexturePromise =
  IterableIterator<RenderTargetTexture>;

/**
 * Frame manages expressions and input/output dependencies between them
 */
export class Frame extends RnObject {
  private __expressions: ExpressionInputs[] = [];
  private __expressionMap: Map<
    Expression,
    [
      RequireOne<{
        index?: InputRenderPassIndex;
        uniqueName?: string;
        instance?: RenderPass;
      }>,
      ColorAttachmentIndex,
      GeneratorOfRenderTargetTexturePromise
    ]
  > = new Map();
  constructor() {
    super();
  }

  /**
   * Add render passes to the end of this expression.
   */
  addExpression(
    expression: Expression,
    {
      inputRenderPasses,
      outputs,
    }: {
      inputRenderPasses?: RenderPass[];
      outputs?: {
        renderPass: RequireOne<{
          index?: RenderPassIndex;
          uniqueName?: string;
          instance?: RenderPass;
        }>;
        frameBuffer: FrameBuffer;
      }[];
    } = {
      inputRenderPasses: [],
      outputs: [],
    }
  ) {
    if (Is.exist(outputs)) {
      for (const output of outputs) {
        let renderPass = output.renderPass.instance;
        if (Is.exist(output.renderPass.instance)) {
          renderPass = output.renderPass.instance;
        } else if (Is.exist(output.renderPass.index)) {
          renderPass = expression.renderPasses[output.renderPass.index];
        } else if (Is.exist(output.renderPass.uniqueName)) {
          renderPass = RnObject.getRnObjectByName(
            output.renderPass.uniqueName
          ) as RenderPass;
        }
        if (Is.exist(renderPass)) {
          renderPass.setFramebuffer(output.frameBuffer);
        }
      }
    }
    this.__expressions.push({
      expression,
      inputRenderPasses: Is.exist(inputRenderPasses) ? inputRenderPasses : [],
    });
  }

  /**
   * Get ColorAttachment RenderBuffer from input render pass of the expression
   * @param inputFrom input Expression
   * @param {inputIndex: number, colorAttachmentIndex: number} input RenderPass Index and ColorAttachmen tIndex
   * @returns {Promise<RenderTargetTexture>}
   */
  getColorAttachmentFromInputOf(
    inputFrom: Expression,
    renderPassArg: {
      renderPass: RequireOne<{
        index?: InputRenderPassIndex;
        uniqueName?: string;
        instance?: RenderPass;
      }>;
      colorAttachmentIndex: ColorAttachmentIndex;
    } = {
      renderPass: {
        index: 0,
      },
      colorAttachmentIndex: 0,
    }
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
          renderPassArg.renderPass,
          renderPassArg.colorAttachmentIndex,
          generator as GeneratorOfRenderTargetTexturePromise,
        ]);
      }
    );
    return promise;
  }

  /**
   *
   */
  resolve() {
    for (const [exp, [renderPassArg, colorAttachmentIndex, generator]] of this
      .__expressionMap) {
      for (const expData of this.__expressions) {
        if (exp === expData.expression) {

          let renderPassObj = renderPassArg.instance;
          if (Is.exist(renderPassArg.instance)) {
            renderPassObj = renderPassArg.instance;
          } else if (Is.exist(renderPassArg.index)) {
            renderPassObj = expData.inputRenderPasses[renderPassArg.index];
          } else if (Is.exist(renderPassArg.uniqueName)) {
            renderPassObj = RnObject.getRnObjectByName(
              renderPassArg.uniqueName
            ) as RenderPass;
          }

          let framebuffer: FrameBuffer | undefined;
          if (renderPassObj!.getResolveFramebuffer()) {
            framebuffer = renderPassObj!.getResolveFramebuffer();
          } else {
            framebuffer = renderPassObj!.getFramebuffer();
          }

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
  clearExpressions() {
    this.__expressions.length = 0;
  }

  /**
   * Get expressions
   */
  get expressions() {
    return this.__expressions.map(exp => exp.expression);
  }

  setViewport(viewport: IVector4) {
    for (const exp of this.__expressions) {
      exp.expression.setViewport(viewport);
    }
  }
}
