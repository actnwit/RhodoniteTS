import {RequireOne} from '../../types/TypeGenerators';
import {RnObject} from '../core/RnObject';
import {IVector4} from '../math/IVector';
import { assertExist } from '../misc';
import {Is} from '../misc/Is';
import {RenderTargetTexture} from '../textures/RenderTargetTexture';
import {Expression} from './Expression';
import {FrameBuffer} from './FrameBuffer';
import { RenderPass } from './RenderPass';

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
    [RenderPass, ColorAttachmentIndex, GeneratorOfRenderTargetTexturePromise]
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
    {
      renderPass,
      colorAttachmentIndex,
    }: {
      renderPass: RequireOne<{
        index?: InputRenderPassIndex;
        uniqueName?: string;
        instance?: RenderPass;
      }>;
      colorAttachmentIndex: ColorAttachmentIndex;
    } = {renderPass: {index: 0}, colorAttachmentIndex: 0}
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

        let renderPassObj = renderPass.instance;
        if (Is.exist(renderPass.instance)) {
          renderPassObj = renderPass.instance;
        } else if (Is.exist(renderPass.index)) {
          renderPass = inputFrom.renderPasses[renderPass.index];
        } else if (Is.exist(renderPass.uniqueName)) {
          renderPassObj = RnObject.getRnObjectByName(
            renderPass.uniqueName
          ) as RenderPass;
        }

        assertExist(renderPassObj);

        // register the generator
        this.__expressionMap.set(inputFrom, [
          renderPassObj,
          colorAttachmentIndex,
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
    for (const [exp, [renderPassIndex, colorAttachmentIndex, generator]] of this
      .__expressionMap) {
      for (const expData of this.__expressions) {
        if (exp === expData.expression) {
          const renderPass = expData.inputRenderPasses[renderPassIndex];
          let framebuffer: FrameBuffer | undefined;
          if (renderPass.getResolveFramebuffer()) {
            framebuffer = renderPass.getResolveFramebuffer();
          } else {
            framebuffer = renderPass.getFramebuffer();
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
