import { RequireOne } from '../../types/TypeGenerators';
import { RnObject } from '../core/RnObject';
import { IVector4 } from '../math/IVector';
import { assertExist } from '../misc/MiscUtil';
import { Is } from '../misc/Is';
import { RenderTargetTexture } from '../textures/RenderTargetTexture';
import { Expression } from './Expression';
import { FrameBuffer } from './FrameBuffer';
import { RenderPass } from './RenderPass';

type ColorAttachmentIndex = number;
type InputRenderPassIndex = number;
type RenderPassIndex = number;

type ExpressionInputs = {
  expression: Expression;
  inputRenderPasses: RenderPass[];
};

type GeneratorOfRenderTargetTexturePromise = IterableIterator<RenderTargetTexture>;

/**
 * Frame manages expressions and their input/output dependencies in the rendering pipeline.
 *
 * The Frame class serves as a container for multiple rendering expressions and handles
 * the complex relationships between render passes, including input dependencies and
 * output framebuffer assignments. It provides mechanisms for querying color attachments
 * from input render passes and resolving dependencies between expressions.
 *
 * @example
 * ```typescript
 * const frame = new Frame();
 * frame.addExpression(myExpression, {
 *   inputRenderPasses: [shadowPass, geometryPass],
 *   outputs: [{
 *     renderPass: { index: 0 },
 *     frameBuffer: myFrameBuffer
 *   }]
 * });
 * frame.resolve();
 * ```
 */
export class Frame extends RnObject {
  private __expressions: ExpressionInputs[] = [];
  private __expressionsCache: Expression[] = [];

  /** Constant identifier for standard framebuffer type */
  public static readonly FrameBuffer = 'FrameBuffer';

  /** Constant identifier for resolve framebuffer type */
  public static readonly ResolveFrameBuffer = 'ResolveFrameBuffer';

  /** Constant identifier for secondary resolve framebuffer type */
  public static readonly ResolveFrameBuffer2 = 'ResolveFrameBuffer2';

  private __expressionQueries: [
    Expression,
    RequireOne<{
      index?: InputRenderPassIndex;
      uniqueName?: string;
      instance?: RenderPass;
    }>,
    ColorAttachmentIndex,
    GeneratorOfRenderTargetTexturePromise,
    'FrameBuffer' | 'ResolveFrameBuffer' | 'ResolveFrameBuffer2',
  ][] = [];

  /**
   * Creates a new Frame instance.
   *
   * Initializes an empty frame ready to accept expressions and manage
   * their rendering dependencies.
   */
  constructor() {
    super();
  }

  /**
   * Adds a rendering expression to this frame with optional input dependencies and output configurations.
   *
   * This method registers an expression within the frame and establishes its relationships
   * with input render passes and output framebuffers. The expression will be executed
   * in the order it was added to the frame.
   *
   * @param expression - The rendering expression to add to this frame
   * @param options - Configuration object for input dependencies and outputs
   * @param options.inputRenderPasses - Array of render passes that this expression depends on
   * @param options.outputs - Array of output configurations specifying which render passes
   *                         should render to which framebuffers
   *
   * @example
   * ```typescript
   * frame.addExpression(lightingExpression, {
   *   inputRenderPasses: [geometryPass, shadowPass],
   *   outputs: [{
   *     renderPass: { index: 0 },
   *     frameBuffer: screenFrameBuffer
   *   }]
   * });
   * ```
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
          renderPass = RnObject.getRnObjectByName(output.renderPass.uniqueName) as RenderPass;
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
    this.__expressionsCache.push(expression);
  }

  /**
   * Retrieves a color attachment render target texture from an input render pass of the specified expression.
   *
   * This method creates a promise-based query system that allows expressions to access
   * color attachment textures from their input render passes. The actual texture retrieval
   * is deferred until the resolve() method is called, enabling proper dependency resolution.
   *
   * @param inputFrom - The expression from which to retrieve the color attachment
   * @param renderPassArg - Configuration object specifying the render pass and attachment details
   * @param renderPassArg.renderPass - Identifier for the target render pass (by index, name, or instance)
   * @param renderPassArg.colorAttachmentIndex - Index of the color attachment to retrieve (default: 0)
   * @param renderPassArg.framebufferType - Type of framebuffer to query (default: 'FrameBuffer')
   *
   * @returns Promise that resolves to the requested RenderTargetTexture
   *
   * @example
   * ```typescript
   * const colorTexture = await frame.getColorAttachmentFromInputOf(geometryExpression, {
   *   renderPass: { index: 0 },
   *   colorAttachmentIndex: 0,
   *   framebufferType: Frame.FrameBuffer
   * });
   * ```
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
      framebufferType: 'FrameBuffer' | 'ResolveFrameBuffer' | 'ResolveFrameBuffer2';
    } = {
      renderPass: {
        index: 0,
      },
      colorAttachmentIndex: 0,
      framebufferType: Frame.FrameBuffer,
    }
  ): Promise<RenderTargetTexture> {
    const promise = new Promise<RenderTargetTexture>(
      (resolve: (value: RenderTargetTexture | PromiseLike<RenderTargetTexture>) => void) => {
        function* generatorFunc() {
          const renderTargetTexture = (yield) as unknown as RenderTargetTexture;
          resolve(renderTargetTexture);
          return renderTargetTexture;
        }
        const generator = generatorFunc();

        // register the generator
        this.__expressionQueries.push([
          inputFrom,
          renderPassArg.renderPass,
          renderPassArg.colorAttachmentIndex,
          generator as GeneratorOfRenderTargetTexturePromise,
          renderPassArg.framebufferType,
        ]);
      }
    );
    return promise;
  }

  /**
   * Resolves all pending expression queries and establishes texture dependencies.
   *
   * This method processes all queued color attachment queries created by
   * getColorAttachmentFromInputOf() calls. It matches expressions with their
   * corresponding render passes and retrieves the requested color attachment
   * textures, fulfilling the associated promises.
   *
   * This method should be called after all expressions have been added and
   * all color attachment queries have been registered, typically before
   * beginning the actual rendering process.
   *
   * @example
   * ```typescript
   * // Add all expressions and set up queries
   * frame.addExpression(expr1);
   * frame.addExpression(expr2);
   * await frame.getColorAttachmentFromInputOf(expr1, {...});
   *
   * // Resolve all dependencies
   * frame.resolve();
   * ```
   */
  resolve() {
    for (const [exp, renderPassArg, colorAttachmentIndex, generator, frameBufferType] of this.__expressionQueries) {
      for (const expData of this.__expressions) {
        if (exp === expData.expression) {
          let renderPassObj = renderPassArg.instance;
          if (Is.exist(renderPassArg.instance)) {
            renderPassObj = renderPassArg.instance;
          } else if (Is.exist(renderPassArg.index)) {
            renderPassObj = expData.inputRenderPasses[renderPassArg.index];
          } else if (Is.exist(renderPassArg.uniqueName)) {
            renderPassObj = RnObject.getRnObjectByName(renderPassArg.uniqueName) as RenderPass;
          }

          let framebuffer: FrameBuffer | undefined;
          if (frameBufferType === 'ResolveFrameBuffer2') {
            framebuffer = renderPassObj!.getResolveFramebuffer2();
          } else if (frameBufferType === 'ResolveFrameBuffer') {
            framebuffer = renderPassObj!.getResolveFramebuffer();
          } else if (frameBufferType === 'FrameBuffer') {
            framebuffer = renderPassObj!.getFramebuffer();
          }

          if (Is.exist(framebuffer)) {
            const renderTargetTexture = framebuffer.getColorAttachedRenderTargetTexture(colorAttachmentIndex);
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
   * Removes all expressions from this frame and clears associated caches.
   *
   * This method resets the frame to its initial empty state, removing all
   * registered expressions and clearing internal caches. Any pending
   * expression queries will also be implicitly cleared.
   *
   * @example
   * ```typescript
   * frame.clearExpressions();
   * // Frame is now empty and ready for new expressions
   * ```
   */
  clearExpressions() {
    this.__expressions.length = 0;
    this.__expressionsCache.length = 0;
  }

  /**
   * Gets a read-only array of all expressions currently registered in this frame.
   *
   * @returns Array of Expression objects in the order they were added
   *
   * @example
   * ```typescript
   * const allExpressions = frame.expressions;
   * console.log(`Frame contains ${allExpressions.length} expressions`);
   * ```
   */
  get expressions() {
    return this.__expressionsCache;
  }

  /**
   * Sets the viewport for all expressions in this frame.
   *
   * This method propagates the viewport settings to all registered expressions,
   * ensuring consistent rendering dimensions across the entire frame.
   *
   * @param viewport - 4D vector defining the viewport (x, y, width, height)
   *
   * @example
   * ```typescript
   * frame.setViewport(Vector4.fromCopyArray([0, 0, 1920, 1080]));
   * ```
   */
  setViewport(viewport: IVector4) {
    for (const exp of this.__expressions) {
      exp.expression.setViewport(viewport);
    }
  }
}
