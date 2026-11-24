// src/foundation/renderer/Frame.ts
import { RnObject } from "../core/RnObject.js";
import { Is } from "../misc/Is.js";
var _Frame = class _Frame extends RnObject {
  constructor() {
    super(...arguments);
    this.__expressions = [];
    this.__expressionsCache = [];
    this.__expressionQueries = [];
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
  addExpression(expression, {
    inputRenderPasses,
    outputs
  } = {
    inputRenderPasses: [],
    outputs: []
  }) {
    if (Is.exist(outputs)) {
      for (const output of outputs) {
        let renderPass = output.renderPass.instance;
        if (Is.exist(output.renderPass.instance)) {
          renderPass = output.renderPass.instance;
        } else if (Is.exist(output.renderPass.index)) {
          renderPass = expression.renderPasses[output.renderPass.index];
        } else if (Is.exist(output.renderPass.uniqueName)) {
          renderPass = RnObject.getRnObjectByName(output.renderPass.uniqueName);
        }
        if (Is.exist(renderPass)) {
          renderPass.setFramebuffer(output.frameBuffer);
        }
      }
    }
    this.__expressions.push({
      expression,
      inputRenderPasses: Is.exist(inputRenderPasses) ? inputRenderPasses : []
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
  getColorAttachmentFromInputOf(inputFrom, renderPassArg = {
    renderPass: {
      index: 0
    },
    colorAttachmentIndex: 0,
    framebufferType: _Frame.FrameBuffer
  }) {
    const promise = new Promise(
      (resolve) => {
        function* generatorFunc() {
          const renderTargetTexture = yield;
          resolve(renderTargetTexture);
          return renderTargetTexture;
        }
        const generator = generatorFunc();
        this.__expressionQueries.push([
          inputFrom,
          renderPassArg.renderPass,
          renderPassArg.colorAttachmentIndex,
          generator,
          renderPassArg.framebufferType
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
            renderPassObj = RnObject.getRnObjectByName(renderPassArg.uniqueName);
          }
          let framebuffer;
          if (frameBufferType === "ResolveFrameBuffer2") {
            framebuffer = renderPassObj.getResolveFramebuffer2();
          } else if (frameBufferType === "ResolveFrameBuffer") {
            framebuffer = renderPassObj.getResolveFramebuffer();
          } else if (frameBufferType === "FrameBuffer") {
            framebuffer = renderPassObj.getFramebuffer();
          }
          if (Is.exist(framebuffer)) {
            const renderTargetTexture = framebuffer.getColorAttachedRenderTargetTexture(colorAttachmentIndex);
            if (Is.exist(renderTargetTexture)) {
              generator.next(renderTargetTexture);
              generator.next(renderTargetTexture);
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
  setViewport(viewport) {
    for (const exp of this.__expressions) {
      exp.expression.setViewport(viewport);
    }
  }
};
/** Constant identifier for standard framebuffer type */
_Frame.FrameBuffer = "FrameBuffer";
/** Constant identifier for resolve framebuffer type */
_Frame.ResolveFrameBuffer = "ResolveFrameBuffer";
/** Constant identifier for secondary resolve framebuffer type */
_Frame.ResolveFrameBuffer2 = "ResolveFrameBuffer2";
var Frame = _Frame;
export {
  Frame
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vcmVuZGVyZXIvRnJhbWUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgUmVxdWlyZU9uZSB9IGZyb20gJy4uLy4uL3R5cGVzL1R5cGVHZW5lcmF0b3JzJztcbmltcG9ydCB7IFJuT2JqZWN0IH0gZnJvbSAnLi4vY29yZS9Sbk9iamVjdCc7XG5pbXBvcnQgdHlwZSB7IElWZWN0b3I0IH0gZnJvbSAnLi4vbWF0aC9JVmVjdG9yJztcbmltcG9ydCB7IElzIH0gZnJvbSAnLi4vbWlzYy9Jcyc7XG5pbXBvcnQgdHlwZSB7IFJlbmRlclRhcmdldFRleHR1cmUgfSBmcm9tICcuLi90ZXh0dXJlcy9SZW5kZXJUYXJnZXRUZXh0dXJlJztcbmltcG9ydCB0eXBlIHsgRXhwcmVzc2lvbiB9IGZyb20gJy4vRXhwcmVzc2lvbic7XG5pbXBvcnQgdHlwZSB7IEZyYW1lQnVmZmVyIH0gZnJvbSAnLi9GcmFtZUJ1ZmZlcic7XG5pbXBvcnQgdHlwZSB7IFJlbmRlclBhc3MgfSBmcm9tICcuL1JlbmRlclBhc3MnO1xuXG50eXBlIENvbG9yQXR0YWNobWVudEluZGV4ID0gbnVtYmVyO1xudHlwZSBJbnB1dFJlbmRlclBhc3NJbmRleCA9IG51bWJlcjtcbnR5cGUgUmVuZGVyUGFzc0luZGV4ID0gbnVtYmVyO1xuXG50eXBlIEV4cHJlc3Npb25JbnB1dHMgPSB7XG4gIGV4cHJlc3Npb246IEV4cHJlc3Npb247XG4gIGlucHV0UmVuZGVyUGFzc2VzOiBSZW5kZXJQYXNzW107XG59O1xuXG50eXBlIEdlbmVyYXRvck9mUmVuZGVyVGFyZ2V0VGV4dHVyZVByb21pc2UgPSBJdGVyYWJsZUl0ZXJhdG9yPFJlbmRlclRhcmdldFRleHR1cmU+O1xuXG4vKipcbiAqIEZyYW1lIG1hbmFnZXMgZXhwcmVzc2lvbnMgYW5kIHRoZWlyIGlucHV0L291dHB1dCBkZXBlbmRlbmNpZXMgaW4gdGhlIHJlbmRlcmluZyBwaXBlbGluZS5cbiAqXG4gKiBUaGUgRnJhbWUgY2xhc3Mgc2VydmVzIGFzIGEgY29udGFpbmVyIGZvciBtdWx0aXBsZSByZW5kZXJpbmcgZXhwcmVzc2lvbnMgYW5kIGhhbmRsZXNcbiAqIHRoZSBjb21wbGV4IHJlbGF0aW9uc2hpcHMgYmV0d2VlbiByZW5kZXIgcGFzc2VzLCBpbmNsdWRpbmcgaW5wdXQgZGVwZW5kZW5jaWVzIGFuZFxuICogb3V0cHV0IGZyYW1lYnVmZmVyIGFzc2lnbm1lbnRzLiBJdCBwcm92aWRlcyBtZWNoYW5pc21zIGZvciBxdWVyeWluZyBjb2xvciBhdHRhY2htZW50c1xuICogZnJvbSBpbnB1dCByZW5kZXIgcGFzc2VzIGFuZCByZXNvbHZpbmcgZGVwZW5kZW5jaWVzIGJldHdlZW4gZXhwcmVzc2lvbnMuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IGZyYW1lID0gbmV3IEZyYW1lKCk7XG4gKiBmcmFtZS5hZGRFeHByZXNzaW9uKG15RXhwcmVzc2lvbiwge1xuICogICBpbnB1dFJlbmRlclBhc3NlczogW3NoYWRvd1Bhc3MsIGdlb21ldHJ5UGFzc10sXG4gKiAgIG91dHB1dHM6IFt7XG4gKiAgICAgcmVuZGVyUGFzczogeyBpbmRleDogMCB9LFxuICogICAgIGZyYW1lQnVmZmVyOiBteUZyYW1lQnVmZmVyXG4gKiAgIH1dXG4gKiB9KTtcbiAqIGZyYW1lLnJlc29sdmUoKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgRnJhbWUgZXh0ZW5kcyBSbk9iamVjdCB7XG4gIHByaXZhdGUgX19leHByZXNzaW9uczogRXhwcmVzc2lvbklucHV0c1tdID0gW107XG4gIHByaXZhdGUgX19leHByZXNzaW9uc0NhY2hlOiBFeHByZXNzaW9uW10gPSBbXTtcblxuICAvKiogQ29uc3RhbnQgaWRlbnRpZmllciBmb3Igc3RhbmRhcmQgZnJhbWVidWZmZXIgdHlwZSAqL1xuICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IEZyYW1lQnVmZmVyID0gJ0ZyYW1lQnVmZmVyJztcblxuICAvKiogQ29uc3RhbnQgaWRlbnRpZmllciBmb3IgcmVzb2x2ZSBmcmFtZWJ1ZmZlciB0eXBlICovXG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgUmVzb2x2ZUZyYW1lQnVmZmVyID0gJ1Jlc29sdmVGcmFtZUJ1ZmZlcic7XG5cbiAgLyoqIENvbnN0YW50IGlkZW50aWZpZXIgZm9yIHNlY29uZGFyeSByZXNvbHZlIGZyYW1lYnVmZmVyIHR5cGUgKi9cbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBSZXNvbHZlRnJhbWVCdWZmZXIyID0gJ1Jlc29sdmVGcmFtZUJ1ZmZlcjInO1xuXG4gIHByaXZhdGUgX19leHByZXNzaW9uUXVlcmllczogW1xuICAgIEV4cHJlc3Npb24sXG4gICAgUmVxdWlyZU9uZTx7XG4gICAgICBpbmRleD86IElucHV0UmVuZGVyUGFzc0luZGV4O1xuICAgICAgdW5pcXVlTmFtZT86IHN0cmluZztcbiAgICAgIGluc3RhbmNlPzogUmVuZGVyUGFzcztcbiAgICB9PixcbiAgICBDb2xvckF0dGFjaG1lbnRJbmRleCxcbiAgICBHZW5lcmF0b3JPZlJlbmRlclRhcmdldFRleHR1cmVQcm9taXNlLFxuICAgICdGcmFtZUJ1ZmZlcicgfCAnUmVzb2x2ZUZyYW1lQnVmZmVyJyB8ICdSZXNvbHZlRnJhbWVCdWZmZXIyJyxcbiAgXVtdID0gW107XG5cbiAgLyoqXG4gICAqIEFkZHMgYSByZW5kZXJpbmcgZXhwcmVzc2lvbiB0byB0aGlzIGZyYW1lIHdpdGggb3B0aW9uYWwgaW5wdXQgZGVwZW5kZW5jaWVzIGFuZCBvdXRwdXQgY29uZmlndXJhdGlvbnMuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIHJlZ2lzdGVycyBhbiBleHByZXNzaW9uIHdpdGhpbiB0aGUgZnJhbWUgYW5kIGVzdGFibGlzaGVzIGl0cyByZWxhdGlvbnNoaXBzXG4gICAqIHdpdGggaW5wdXQgcmVuZGVyIHBhc3NlcyBhbmQgb3V0cHV0IGZyYW1lYnVmZmVycy4gVGhlIGV4cHJlc3Npb24gd2lsbCBiZSBleGVjdXRlZFxuICAgKiBpbiB0aGUgb3JkZXIgaXQgd2FzIGFkZGVkIHRvIHRoZSBmcmFtZS5cbiAgICpcbiAgICogQHBhcmFtIGV4cHJlc3Npb24gLSBUaGUgcmVuZGVyaW5nIGV4cHJlc3Npb24gdG8gYWRkIHRvIHRoaXMgZnJhbWVcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBDb25maWd1cmF0aW9uIG9iamVjdCBmb3IgaW5wdXQgZGVwZW5kZW5jaWVzIGFuZCBvdXRwdXRzXG4gICAqIEBwYXJhbSBvcHRpb25zLmlucHV0UmVuZGVyUGFzc2VzIC0gQXJyYXkgb2YgcmVuZGVyIHBhc3NlcyB0aGF0IHRoaXMgZXhwcmVzc2lvbiBkZXBlbmRzIG9uXG4gICAqIEBwYXJhbSBvcHRpb25zLm91dHB1dHMgLSBBcnJheSBvZiBvdXRwdXQgY29uZmlndXJhdGlvbnMgc3BlY2lmeWluZyB3aGljaCByZW5kZXIgcGFzc2VzXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgIHNob3VsZCByZW5kZXIgdG8gd2hpY2ggZnJhbWVidWZmZXJzXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogZnJhbWUuYWRkRXhwcmVzc2lvbihsaWdodGluZ0V4cHJlc3Npb24sIHtcbiAgICogICBpbnB1dFJlbmRlclBhc3NlczogW2dlb21ldHJ5UGFzcywgc2hhZG93UGFzc10sXG4gICAqICAgb3V0cHV0czogW3tcbiAgICogICAgIHJlbmRlclBhc3M6IHsgaW5kZXg6IDAgfSxcbiAgICogICAgIGZyYW1lQnVmZmVyOiBzY3JlZW5GcmFtZUJ1ZmZlclxuICAgKiAgIH1dXG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICovXG4gIGFkZEV4cHJlc3Npb24oXG4gICAgZXhwcmVzc2lvbjogRXhwcmVzc2lvbixcbiAgICB7XG4gICAgICBpbnB1dFJlbmRlclBhc3NlcyxcbiAgICAgIG91dHB1dHMsXG4gICAgfToge1xuICAgICAgaW5wdXRSZW5kZXJQYXNzZXM/OiBSZW5kZXJQYXNzW107XG4gICAgICBvdXRwdXRzPzoge1xuICAgICAgICByZW5kZXJQYXNzOiBSZXF1aXJlT25lPHtcbiAgICAgICAgICBpbmRleD86IFJlbmRlclBhc3NJbmRleDtcbiAgICAgICAgICB1bmlxdWVOYW1lPzogc3RyaW5nO1xuICAgICAgICAgIGluc3RhbmNlPzogUmVuZGVyUGFzcztcbiAgICAgICAgfT47XG4gICAgICAgIGZyYW1lQnVmZmVyOiBGcmFtZUJ1ZmZlcjtcbiAgICAgIH1bXTtcbiAgICB9ID0ge1xuICAgICAgaW5wdXRSZW5kZXJQYXNzZXM6IFtdLFxuICAgICAgb3V0cHV0czogW10sXG4gICAgfVxuICApIHtcbiAgICBpZiAoSXMuZXhpc3Qob3V0cHV0cykpIHtcbiAgICAgIGZvciAoY29uc3Qgb3V0cHV0IG9mIG91dHB1dHMpIHtcbiAgICAgICAgbGV0IHJlbmRlclBhc3MgPSBvdXRwdXQucmVuZGVyUGFzcy5pbnN0YW5jZTtcbiAgICAgICAgaWYgKElzLmV4aXN0KG91dHB1dC5yZW5kZXJQYXNzLmluc3RhbmNlKSkge1xuICAgICAgICAgIHJlbmRlclBhc3MgPSBvdXRwdXQucmVuZGVyUGFzcy5pbnN0YW5jZTtcbiAgICAgICAgfSBlbHNlIGlmIChJcy5leGlzdChvdXRwdXQucmVuZGVyUGFzcy5pbmRleCkpIHtcbiAgICAgICAgICByZW5kZXJQYXNzID0gZXhwcmVzc2lvbi5yZW5kZXJQYXNzZXNbb3V0cHV0LnJlbmRlclBhc3MuaW5kZXhdO1xuICAgICAgICB9IGVsc2UgaWYgKElzLmV4aXN0KG91dHB1dC5yZW5kZXJQYXNzLnVuaXF1ZU5hbWUpKSB7XG4gICAgICAgICAgcmVuZGVyUGFzcyA9IFJuT2JqZWN0LmdldFJuT2JqZWN0QnlOYW1lKG91dHB1dC5yZW5kZXJQYXNzLnVuaXF1ZU5hbWUpIGFzIFJlbmRlclBhc3M7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKElzLmV4aXN0KHJlbmRlclBhc3MpKSB7XG4gICAgICAgICAgcmVuZGVyUGFzcy5zZXRGcmFtZWJ1ZmZlcihvdXRwdXQuZnJhbWVCdWZmZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX19leHByZXNzaW9ucy5wdXNoKHtcbiAgICAgIGV4cHJlc3Npb24sXG4gICAgICBpbnB1dFJlbmRlclBhc3NlczogSXMuZXhpc3QoaW5wdXRSZW5kZXJQYXNzZXMpID8gaW5wdXRSZW5kZXJQYXNzZXMgOiBbXSxcbiAgICB9KTtcbiAgICB0aGlzLl9fZXhwcmVzc2lvbnNDYWNoZS5wdXNoKGV4cHJlc3Npb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIGNvbG9yIGF0dGFjaG1lbnQgcmVuZGVyIHRhcmdldCB0ZXh0dXJlIGZyb20gYW4gaW5wdXQgcmVuZGVyIHBhc3Mgb2YgdGhlIHNwZWNpZmllZCBleHByZXNzaW9uLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBjcmVhdGVzIGEgcHJvbWlzZS1iYXNlZCBxdWVyeSBzeXN0ZW0gdGhhdCBhbGxvd3MgZXhwcmVzc2lvbnMgdG8gYWNjZXNzXG4gICAqIGNvbG9yIGF0dGFjaG1lbnQgdGV4dHVyZXMgZnJvbSB0aGVpciBpbnB1dCByZW5kZXIgcGFzc2VzLiBUaGUgYWN0dWFsIHRleHR1cmUgcmV0cmlldmFsXG4gICAqIGlzIGRlZmVycmVkIHVudGlsIHRoZSByZXNvbHZlKCkgbWV0aG9kIGlzIGNhbGxlZCwgZW5hYmxpbmcgcHJvcGVyIGRlcGVuZGVuY3kgcmVzb2x1dGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGlucHV0RnJvbSAtIFRoZSBleHByZXNzaW9uIGZyb20gd2hpY2ggdG8gcmV0cmlldmUgdGhlIGNvbG9yIGF0dGFjaG1lbnRcbiAgICogQHBhcmFtIHJlbmRlclBhc3NBcmcgLSBDb25maWd1cmF0aW9uIG9iamVjdCBzcGVjaWZ5aW5nIHRoZSByZW5kZXIgcGFzcyBhbmQgYXR0YWNobWVudCBkZXRhaWxzXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzQXJnLnJlbmRlclBhc3MgLSBJZGVudGlmaWVyIGZvciB0aGUgdGFyZ2V0IHJlbmRlciBwYXNzIChieSBpbmRleCwgbmFtZSwgb3IgaW5zdGFuY2UpXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzQXJnLmNvbG9yQXR0YWNobWVudEluZGV4IC0gSW5kZXggb2YgdGhlIGNvbG9yIGF0dGFjaG1lbnQgdG8gcmV0cmlldmUgKGRlZmF1bHQ6IDApXG4gICAqIEBwYXJhbSByZW5kZXJQYXNzQXJnLmZyYW1lYnVmZmVyVHlwZSAtIFR5cGUgb2YgZnJhbWVidWZmZXIgdG8gcXVlcnkgKGRlZmF1bHQ6ICdGcmFtZUJ1ZmZlcicpXG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2UgdGhhdCByZXNvbHZlcyB0byB0aGUgcmVxdWVzdGVkIFJlbmRlclRhcmdldFRleHR1cmVcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBjb2xvclRleHR1cmUgPSBhd2FpdCBmcmFtZS5nZXRDb2xvckF0dGFjaG1lbnRGcm9tSW5wdXRPZihnZW9tZXRyeUV4cHJlc3Npb24sIHtcbiAgICogICByZW5kZXJQYXNzOiB7IGluZGV4OiAwIH0sXG4gICAqICAgY29sb3JBdHRhY2htZW50SW5kZXg6IDAsXG4gICAqICAgZnJhbWVidWZmZXJUeXBlOiBGcmFtZS5GcmFtZUJ1ZmZlclxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqL1xuICBnZXRDb2xvckF0dGFjaG1lbnRGcm9tSW5wdXRPZihcbiAgICBpbnB1dEZyb206IEV4cHJlc3Npb24sXG4gICAgcmVuZGVyUGFzc0FyZzoge1xuICAgICAgcmVuZGVyUGFzczogUmVxdWlyZU9uZTx7XG4gICAgICAgIGluZGV4PzogSW5wdXRSZW5kZXJQYXNzSW5kZXg7XG4gICAgICAgIHVuaXF1ZU5hbWU/OiBzdHJpbmc7XG4gICAgICAgIGluc3RhbmNlPzogUmVuZGVyUGFzcztcbiAgICAgIH0+O1xuICAgICAgY29sb3JBdHRhY2htZW50SW5kZXg6IENvbG9yQXR0YWNobWVudEluZGV4O1xuICAgICAgZnJhbWVidWZmZXJUeXBlOiAnRnJhbWVCdWZmZXInIHwgJ1Jlc29sdmVGcmFtZUJ1ZmZlcicgfCAnUmVzb2x2ZUZyYW1lQnVmZmVyMic7XG4gICAgfSA9IHtcbiAgICAgIHJlbmRlclBhc3M6IHtcbiAgICAgICAgaW5kZXg6IDAsXG4gICAgICB9LFxuICAgICAgY29sb3JBdHRhY2htZW50SW5kZXg6IDAsXG4gICAgICBmcmFtZWJ1ZmZlclR5cGU6IEZyYW1lLkZyYW1lQnVmZmVyLFxuICAgIH1cbiAgKTogUHJvbWlzZTxSZW5kZXJUYXJnZXRUZXh0dXJlPiB7XG4gICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlPFJlbmRlclRhcmdldFRleHR1cmU+KFxuICAgICAgKHJlc29sdmU6ICh2YWx1ZTogUmVuZGVyVGFyZ2V0VGV4dHVyZSB8IFByb21pc2VMaWtlPFJlbmRlclRhcmdldFRleHR1cmU+KSA9PiB2b2lkKSA9PiB7XG4gICAgICAgIGZ1bmN0aW9uKiBnZW5lcmF0b3JGdW5jKCkge1xuICAgICAgICAgIGNvbnN0IHJlbmRlclRhcmdldFRleHR1cmUgPSAoeWllbGQpIGFzIHVua25vd24gYXMgUmVuZGVyVGFyZ2V0VGV4dHVyZTtcbiAgICAgICAgICByZXNvbHZlKHJlbmRlclRhcmdldFRleHR1cmUpO1xuICAgICAgICAgIHJldHVybiByZW5kZXJUYXJnZXRUZXh0dXJlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGdlbmVyYXRvciA9IGdlbmVyYXRvckZ1bmMoKTtcblxuICAgICAgICAvLyByZWdpc3RlciB0aGUgZ2VuZXJhdG9yXG4gICAgICAgIHRoaXMuX19leHByZXNzaW9uUXVlcmllcy5wdXNoKFtcbiAgICAgICAgICBpbnB1dEZyb20sXG4gICAgICAgICAgcmVuZGVyUGFzc0FyZy5yZW5kZXJQYXNzLFxuICAgICAgICAgIHJlbmRlclBhc3NBcmcuY29sb3JBdHRhY2htZW50SW5kZXgsXG4gICAgICAgICAgZ2VuZXJhdG9yIGFzIEdlbmVyYXRvck9mUmVuZGVyVGFyZ2V0VGV4dHVyZVByb21pc2UsXG4gICAgICAgICAgcmVuZGVyUGFzc0FyZy5mcmFtZWJ1ZmZlclR5cGUsXG4gICAgICAgIF0pO1xuICAgICAgfVxuICAgICk7XG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cblxuICAvKipcbiAgICogUmVzb2x2ZXMgYWxsIHBlbmRpbmcgZXhwcmVzc2lvbiBxdWVyaWVzIGFuZCBlc3RhYmxpc2hlcyB0ZXh0dXJlIGRlcGVuZGVuY2llcy5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgcHJvY2Vzc2VzIGFsbCBxdWV1ZWQgY29sb3IgYXR0YWNobWVudCBxdWVyaWVzIGNyZWF0ZWQgYnlcbiAgICogZ2V0Q29sb3JBdHRhY2htZW50RnJvbUlucHV0T2YoKSBjYWxscy4gSXQgbWF0Y2hlcyBleHByZXNzaW9ucyB3aXRoIHRoZWlyXG4gICAqIGNvcnJlc3BvbmRpbmcgcmVuZGVyIHBhc3NlcyBhbmQgcmV0cmlldmVzIHRoZSByZXF1ZXN0ZWQgY29sb3IgYXR0YWNobWVudFxuICAgKiB0ZXh0dXJlcywgZnVsZmlsbGluZyB0aGUgYXNzb2NpYXRlZCBwcm9taXNlcy5cbiAgICpcbiAgICogVGhpcyBtZXRob2Qgc2hvdWxkIGJlIGNhbGxlZCBhZnRlciBhbGwgZXhwcmVzc2lvbnMgaGF2ZSBiZWVuIGFkZGVkIGFuZFxuICAgKiBhbGwgY29sb3IgYXR0YWNobWVudCBxdWVyaWVzIGhhdmUgYmVlbiByZWdpc3RlcmVkLCB0eXBpY2FsbHkgYmVmb3JlXG4gICAqIGJlZ2lubmluZyB0aGUgYWN0dWFsIHJlbmRlcmluZyBwcm9jZXNzLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIC8vIEFkZCBhbGwgZXhwcmVzc2lvbnMgYW5kIHNldCB1cCBxdWVyaWVzXG4gICAqIGZyYW1lLmFkZEV4cHJlc3Npb24oZXhwcjEpO1xuICAgKiBmcmFtZS5hZGRFeHByZXNzaW9uKGV4cHIyKTtcbiAgICogYXdhaXQgZnJhbWUuZ2V0Q29sb3JBdHRhY2htZW50RnJvbUlucHV0T2YoZXhwcjEsIHsuLi59KTtcbiAgICpcbiAgICogLy8gUmVzb2x2ZSBhbGwgZGVwZW5kZW5jaWVzXG4gICAqIGZyYW1lLnJlc29sdmUoKTtcbiAgICogYGBgXG4gICAqL1xuICByZXNvbHZlKCkge1xuICAgIGZvciAoY29uc3QgW2V4cCwgcmVuZGVyUGFzc0FyZywgY29sb3JBdHRhY2htZW50SW5kZXgsIGdlbmVyYXRvciwgZnJhbWVCdWZmZXJUeXBlXSBvZiB0aGlzLl9fZXhwcmVzc2lvblF1ZXJpZXMpIHtcbiAgICAgIGZvciAoY29uc3QgZXhwRGF0YSBvZiB0aGlzLl9fZXhwcmVzc2lvbnMpIHtcbiAgICAgICAgaWYgKGV4cCA9PT0gZXhwRGF0YS5leHByZXNzaW9uKSB7XG4gICAgICAgICAgbGV0IHJlbmRlclBhc3NPYmogPSByZW5kZXJQYXNzQXJnLmluc3RhbmNlO1xuICAgICAgICAgIGlmIChJcy5leGlzdChyZW5kZXJQYXNzQXJnLmluc3RhbmNlKSkge1xuICAgICAgICAgICAgcmVuZGVyUGFzc09iaiA9IHJlbmRlclBhc3NBcmcuaW5zdGFuY2U7XG4gICAgICAgICAgfSBlbHNlIGlmIChJcy5leGlzdChyZW5kZXJQYXNzQXJnLmluZGV4KSkge1xuICAgICAgICAgICAgcmVuZGVyUGFzc09iaiA9IGV4cERhdGEuaW5wdXRSZW5kZXJQYXNzZXNbcmVuZGVyUGFzc0FyZy5pbmRleF07XG4gICAgICAgICAgfSBlbHNlIGlmIChJcy5leGlzdChyZW5kZXJQYXNzQXJnLnVuaXF1ZU5hbWUpKSB7XG4gICAgICAgICAgICByZW5kZXJQYXNzT2JqID0gUm5PYmplY3QuZ2V0Um5PYmplY3RCeU5hbWUocmVuZGVyUGFzc0FyZy51bmlxdWVOYW1lKSBhcyBSZW5kZXJQYXNzO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCBmcmFtZWJ1ZmZlcjogRnJhbWVCdWZmZXIgfCB1bmRlZmluZWQ7XG4gICAgICAgICAgaWYgKGZyYW1lQnVmZmVyVHlwZSA9PT0gJ1Jlc29sdmVGcmFtZUJ1ZmZlcjInKSB7XG4gICAgICAgICAgICBmcmFtZWJ1ZmZlciA9IHJlbmRlclBhc3NPYmohLmdldFJlc29sdmVGcmFtZWJ1ZmZlcjIoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGZyYW1lQnVmZmVyVHlwZSA9PT0gJ1Jlc29sdmVGcmFtZUJ1ZmZlcicpIHtcbiAgICAgICAgICAgIGZyYW1lYnVmZmVyID0gcmVuZGVyUGFzc09iaiEuZ2V0UmVzb2x2ZUZyYW1lYnVmZmVyKCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChmcmFtZUJ1ZmZlclR5cGUgPT09ICdGcmFtZUJ1ZmZlcicpIHtcbiAgICAgICAgICAgIGZyYW1lYnVmZmVyID0gcmVuZGVyUGFzc09iaiEuZ2V0RnJhbWVidWZmZXIoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoSXMuZXhpc3QoZnJhbWVidWZmZXIpKSB7XG4gICAgICAgICAgICBjb25zdCByZW5kZXJUYXJnZXRUZXh0dXJlID0gZnJhbWVidWZmZXIuZ2V0Q29sb3JBdHRhY2hlZFJlbmRlclRhcmdldFRleHR1cmUoY29sb3JBdHRhY2htZW50SW5kZXgpO1xuICAgICAgICAgICAgaWYgKElzLmV4aXN0KHJlbmRlclRhcmdldFRleHR1cmUpKSB7XG4gICAgICAgICAgICAgIGdlbmVyYXRvci5uZXh0KHJlbmRlclRhcmdldFRleHR1cmUgYXMgYW55KTtcbiAgICAgICAgICAgICAgZ2VuZXJhdG9yLm5leHQocmVuZGVyVGFyZ2V0VGV4dHVyZSBhcyBhbnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGFsbCBleHByZXNzaW9ucyBmcm9tIHRoaXMgZnJhbWUgYW5kIGNsZWFycyBhc3NvY2lhdGVkIGNhY2hlcy5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgcmVzZXRzIHRoZSBmcmFtZSB0byBpdHMgaW5pdGlhbCBlbXB0eSBzdGF0ZSwgcmVtb3ZpbmcgYWxsXG4gICAqIHJlZ2lzdGVyZWQgZXhwcmVzc2lvbnMgYW5kIGNsZWFyaW5nIGludGVybmFsIGNhY2hlcy4gQW55IHBlbmRpbmdcbiAgICogZXhwcmVzc2lvbiBxdWVyaWVzIHdpbGwgYWxzbyBiZSBpbXBsaWNpdGx5IGNsZWFyZWQuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogZnJhbWUuY2xlYXJFeHByZXNzaW9ucygpO1xuICAgKiAvLyBGcmFtZSBpcyBub3cgZW1wdHkgYW5kIHJlYWR5IGZvciBuZXcgZXhwcmVzc2lvbnNcbiAgICogYGBgXG4gICAqL1xuICBjbGVhckV4cHJlc3Npb25zKCkge1xuICAgIHRoaXMuX19leHByZXNzaW9ucy5sZW5ndGggPSAwO1xuICAgIHRoaXMuX19leHByZXNzaW9uc0NhY2hlLmxlbmd0aCA9IDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIHJlYWQtb25seSBhcnJheSBvZiBhbGwgZXhwcmVzc2lvbnMgY3VycmVudGx5IHJlZ2lzdGVyZWQgaW4gdGhpcyBmcmFtZS5cbiAgICpcbiAgICogQHJldHVybnMgQXJyYXkgb2YgRXhwcmVzc2lvbiBvYmplY3RzIGluIHRoZSBvcmRlciB0aGV5IHdlcmUgYWRkZWRcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBhbGxFeHByZXNzaW9ucyA9IGZyYW1lLmV4cHJlc3Npb25zO1xuICAgKiBjb25zb2xlLmxvZyhgRnJhbWUgY29udGFpbnMgJHthbGxFeHByZXNzaW9ucy5sZW5ndGh9IGV4cHJlc3Npb25zYCk7XG4gICAqIGBgYFxuICAgKi9cbiAgZ2V0IGV4cHJlc3Npb25zKCkge1xuICAgIHJldHVybiB0aGlzLl9fZXhwcmVzc2lvbnNDYWNoZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSB2aWV3cG9ydCBmb3IgYWxsIGV4cHJlc3Npb25zIGluIHRoaXMgZnJhbWUuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIHByb3BhZ2F0ZXMgdGhlIHZpZXdwb3J0IHNldHRpbmdzIHRvIGFsbCByZWdpc3RlcmVkIGV4cHJlc3Npb25zLFxuICAgKiBlbnN1cmluZyBjb25zaXN0ZW50IHJlbmRlcmluZyBkaW1lbnNpb25zIGFjcm9zcyB0aGUgZW50aXJlIGZyYW1lLlxuICAgKlxuICAgKiBAcGFyYW0gdmlld3BvcnQgLSA0RCB2ZWN0b3IgZGVmaW5pbmcgdGhlIHZpZXdwb3J0ICh4LCB5LCB3aWR0aCwgaGVpZ2h0KVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGZyYW1lLnNldFZpZXdwb3J0KFZlY3RvcjQuZnJvbUNvcHlBcnJheShbMCwgMCwgMTkyMCwgMTA4MF0pKTtcbiAgICogYGBgXG4gICAqL1xuICBzZXRWaWV3cG9ydCh2aWV3cG9ydDogSVZlY3RvcjQpIHtcbiAgICBmb3IgKGNvbnN0IGV4cCBvZiB0aGlzLl9fZXhwcmVzc2lvbnMpIHtcbiAgICAgIGV4cC5leHByZXNzaW9uLnNldFZpZXdwb3J0KHZpZXdwb3J0KTtcbiAgICB9XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLGdCQUFnQjtBQUV6QixTQUFTLFVBQVU7QUFzQ1osSUFBTSxTQUFOLE1BQU0sZUFBYyxTQUFTO0FBQUEsRUFBN0I7QUFBQTtBQUNMLFNBQVEsZ0JBQW9DLENBQUM7QUFDN0MsU0FBUSxxQkFBbUMsQ0FBQztBQVc1QyxTQUFRLHNCQVVGLENBQUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBMEJQLGNBQ0UsWUFDQTtBQUFBLElBQ0U7QUFBQSxJQUNBO0FBQUEsRUFDRixJQVVJO0FBQUEsSUFDRixtQkFBbUIsQ0FBQztBQUFBLElBQ3BCLFNBQVMsQ0FBQztBQUFBLEVBQ1osR0FDQTtBQUNBLFFBQUksR0FBRyxNQUFNLE9BQU8sR0FBRztBQUNyQixpQkFBVyxVQUFVLFNBQVM7QUFDNUIsWUFBSSxh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
