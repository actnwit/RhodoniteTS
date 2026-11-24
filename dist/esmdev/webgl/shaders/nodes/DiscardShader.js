// src/webgl/shaders/nodes/DiscardShader.ts
import { ProcessApproach } from "../../../foundation/definitions/ProcessApproach.js";
import { ShaderNode } from "../../../foundation/definitions/ShaderNode.js";
import { StandardShaderPart } from "../StandardShaderPart.js";
var _DiscardShader = class _DiscardShader extends StandardShaderPart {
  /**
   * Private constructor to enforce singleton pattern.
   */
  constructor() {
    super();
  }
  /**
   * Gets the singleton instance of DiscardShader.
   * Creates a new instance if one doesn't exist.
   *
   * @returns The singleton DiscardShader instance
   */
  static getInstance() {
    if (!this.__instance) {
      this.__instance = new _DiscardShader();
    }
    return this.__instance;
  }
  /**
   * Gets the vertex shader function definitions.
   * Returns a no-op function since discard is not available in vertex shaders.
   *
   * @returns Shader code string containing a no-op conditionalDiscard function
   */
  getVertexShaderDefinitions(engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
      fn conditionalDiscard(condition: bool) {
        // discard is not available in vertex shader
      }
      `;
    }
    return `
      void conditionalDiscard(in bool condition) {
        // discard is not available in vertex shader
      }
      `;
  }
  /**
   * Gets the vertex shader body code.
   * Currently returns empty string as no additional vertex processing is needed.
   *
   * @returns Empty shader body string
   */
  get vertexShaderBody() {
    return "";
  }
  /**
   * Gets the pixel/fragment shader function definitions for conditional discard.
   * Returns appropriate function definition based on the current process approach (WebGL/WebGPU).
   *
   * @returns Shader code string containing the conditionalDiscard function definition
   */
  getPixelShaderDefinitions(engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
      fn conditionalDiscard(condition: bool) {
        if (condition) {
          discard;
        }
      }
      `;
    }
    return `
      void conditionalDiscard(in bool condition) {
        if (condition) {
          discard;
        }
      }
      `;
  }
  /**
   * Gets the pixel/fragment shader body code.
   * Currently returns empty string as no additional fragment processing is needed.
   *
   * @returns Empty shader body string
   */
  getPixelShaderBody() {
    return "";
  }
  /**
   * Gets the attribute names required by this shader part.
   * DiscardShader doesn't require any specific vertex attributes.
   *
   * @returns Empty array of attribute names
   */
  get attributeNames() {
    return [];
  }
  /**
   * Gets the vertex attribute semantics required by this shader part.
   * DiscardShader doesn't require any specific vertex attribute semantics.
   *
   * @returns Empty array of vertex attribute enums
   */
  get attributeSemantics() {
    return [];
  }
  /**
   * Gets the attribute compositions required by this shader part.
   * DiscardShader doesn't require any specific attribute compositions.
   *
   * @returns Empty array of composition type enums
   */
  get attributeCompositions() {
    return [];
  }
};
_DiscardShader.materialElement = ShaderNode.PBRShading;
var DiscardShader = _DiscardShader;
export {
  DiscardShader
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL3dlYmdsL3NoYWRlcnMvbm9kZXMvRGlzY2FyZFNoYWRlci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb21wb3NpdGlvblR5cGVFbnVtIH0gZnJvbSAnLi4vLi4vLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgUHJvY2Vzc0FwcHJvYWNoIH0gZnJvbSAnLi4vLi4vLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9Qcm9jZXNzQXBwcm9hY2gnO1xuaW1wb3J0IHsgU2hhZGVyTm9kZSB9IGZyb20gJy4uLy4uLy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvU2hhZGVyTm9kZSc7XG5pbXBvcnQgdHlwZSB7IFZlcnRleEF0dHJpYnV0ZUVudW0gfSBmcm9tICcuLi8uLi8uLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1ZlcnRleEF0dHJpYnV0ZSc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uLy4uLy4uL2ZvdW5kYXRpb24vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdHlwZSB7IEF0dHJpYnV0ZU5hbWVzIH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgU3RhbmRhcmRTaGFkZXJQYXJ0IH0gZnJvbSAnLi4vU3RhbmRhcmRTaGFkZXJQYXJ0JztcblxuLyoqXG4gKiBEaXNjYXJkU2hhZGVyIGNsYXNzIHByb3ZpZGVzIHRoZSBjb25kaXRpb25hbCBkaXNjYXJkIGZ1bmN0aW9uIGZvciBmcmFnbWVudCBzaGFkZXJzLlxuICogVGhpcyBjbGFzcyBoYW5kbGVzIGRpc2NhcmRpbmcgZnJhZ21lbnRzIGJhc2VkIG9uIGEgYm9vbGVhbiBjb25kaXRpb24sXG4gKiBzdXBwb3J0aW5nIGJvdGggV2ViR0wgYW5kIFdlYkdQVSByZW5kZXJpbmcgYXBwcm9hY2hlcy5cbiAqXG4gKiBAZXh0ZW5kcyBTdGFuZGFyZFNoYWRlclBhcnRcbiAqL1xuZXhwb3J0IGNsYXNzIERpc2NhcmRTaGFkZXIgZXh0ZW5kcyBTdGFuZGFyZFNoYWRlclBhcnQge1xuICBzdGF0aWMgX19pbnN0YW5jZTogRGlzY2FyZFNoYWRlcjtcbiAgcHVibGljIHN0YXRpYyByZWFkb25seSBtYXRlcmlhbEVsZW1lbnQgPSBTaGFkZXJOb2RlLlBCUlNoYWRpbmc7XG5cbiAgLyoqXG4gICAqIFByaXZhdGUgY29uc3RydWN0b3IgdG8gZW5mb3JjZSBzaW5nbGV0b24gcGF0dGVybi5cbiAgICovXG4gIHByaXZhdGUgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzaW5nbGV0b24gaW5zdGFuY2Ugb2YgRGlzY2FyZFNoYWRlci5cbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBpZiBvbmUgZG9lc24ndCBleGlzdC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHNpbmdsZXRvbiBEaXNjYXJkU2hhZGVyIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZ2V0SW5zdGFuY2UoKTogRGlzY2FyZFNoYWRlciB7XG4gICAgaWYgKCF0aGlzLl9faW5zdGFuY2UpIHtcbiAgICAgIHRoaXMuX19pbnN0YW5jZSA9IG5ldyBEaXNjYXJkU2hhZGVyKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9faW5zdGFuY2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmVydGV4IHNoYWRlciBmdW5jdGlvbiBkZWZpbml0aW9ucy5cbiAgICogUmV0dXJucyBhIG5vLW9wIGZ1bmN0aW9uIHNpbmNlIGRpc2NhcmQgaXMgbm90IGF2YWlsYWJsZSBpbiB2ZXJ0ZXggc2hhZGVycy5cbiAgICpcbiAgICogQHJldHVybnMgU2hhZGVyIGNvZGUgc3RyaW5nIGNvbnRhaW5pbmcgYSBuby1vcCBjb25kaXRpb25hbERpc2NhcmQgZnVuY3Rpb25cbiAgICovXG4gIGdldFZlcnRleFNoYWRlckRlZmluaXRpb25zKGVuZ2luZTogRW5naW5lKSB7XG4gICAgaWYgKGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICByZXR1cm4gYFxuICAgICAgZm4gY29uZGl0aW9uYWxEaXNjYXJkKGNvbmRpdGlvbjogYm9vbCkge1xuICAgICAgICAvLyBkaXNjYXJkIGlzIG5vdCBhdmFpbGFibGUgaW4gdmVydGV4IHNoYWRlclxuICAgICAgfVxuICAgICAgYDtcbiAgICB9XG4gICAgcmV0dXJuIGBcbiAgICAgIHZvaWQgY29uZGl0aW9uYWxEaXNjYXJkKGluIGJvb2wgY29uZGl0aW9uKSB7XG4gICAgICAgIC8vIGRpc2NhcmQgaXMgbm90IGF2YWlsYWJsZSBpbiB2ZXJ0ZXggc2hhZGVyXG4gICAgICB9XG4gICAgICBgO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHZlcnRleCBzaGFkZXIgYm9keSBjb2RlLlxuICAgKiBDdXJyZW50bHkgcmV0dXJucyBlbXB0eSBzdHJpbmcgYXMgbm8gYWRkaXRpb25hbCB2ZXJ0ZXggcHJvY2Vzc2luZyBpcyBuZWVkZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIEVtcHR5IHNoYWRlciBib2R5IHN0cmluZ1xuICAgKi9cbiAgZ2V0IHZlcnRleFNoYWRlckJvZHkoKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHBpeGVsL2ZyYWdtZW50IHNoYWRlciBmdW5jdGlvbiBkZWZpbml0aW9ucyBmb3IgY29uZGl0aW9uYWwgZGlzY2FyZC5cbiAgICogUmV0dXJucyBhcHByb3ByaWF0ZSBmdW5jdGlvbiBkZWZpbml0aW9uIGJhc2VkIG9uIHRoZSBjdXJyZW50IHByb2Nlc3MgYXBwcm9hY2ggKFdlYkdML1dlYkdQVSkuXG4gICAqXG4gICAqIEByZXR1cm5zIFNoYWRlciBjb2RlIHN0cmluZyBjb250YWluaW5nIHRoZSBjb25kaXRpb25hbERpc2NhcmQgZnVuY3Rpb24gZGVmaW5pdGlvblxuICAgKi9cbiAgZ2V0UGl4ZWxTaGFkZXJEZWZpbml0aW9ucyhlbmdpbmU6IEVuZ2luZSkge1xuICAgIGlmIChlbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgcmV0dXJuIGBcbiAgICAgIGZuIGNvbmRpdGlvbmFsRGlzY2FyZChjb25kaXRpb246IGJvb2wpIHtcbiAgICAgICAgaWYgKGNvbmRpdGlvbikge1xuICAgICAgICAgIGRpc2NhcmQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGA7XG4gICAgfVxuICAgIHJldHVybiBgXG4gICAgICB2b2lkIGNvbmRpdGlvbmFsRGlzY2FyZChpbiBib29sIGNvbmRpdGlvbikge1xuICAgICAgICBpZiAoY29uZGl0aW9uKSB7XG4gICAgICAgICAgZGlzY2FyZDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBwaXhlbC9mcmFnbWVudCBzaGFkZXIgYm9keSBjb2RlLlxuICAgKiBDdXJyZW50bHkgcmV0dXJucyBlbXB0eSBzdHJpbmcgYXMgbm8gYWRkaXRpb25hbCBmcmFnbWVudCBwcm9jZXNzaW5nIGlzIG5lZWRlZC5cbiAgICpcbiAgICogQHJldHVybnMgRW1wdHkgc2hhZGVyIGJvZHkgc3RyaW5nXG4gICAqL1xuICBnZXRQaXhlbFNoYWRlckJvZHkoKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGF0dHJpYnV0ZSBuYW1lcyByZXF1aXJlZCBieSB0aGlzIHNoYWRlciBwYXJ0LlxuICAgKiBEaXNjYXJkU2hhZGVyIGRvZXNuJ3QgcmVxdWlyZSBhbnkgc3BlY2lmaWMgdmVydGV4IGF0dHJpYnV0ZXMuXG4gICAqXG4gICAqIEByZXR1cm5zIEVtcHR5IGFycmF5IG9mIGF0dHJpYnV0ZSBuYW1lc1xuICAgKi9cbiAgZ2V0IGF0dHJpYnV0ZU5hbWVzKCk6IEF0dHJpYnV0ZU5hbWVzIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmVydGV4IGF0dHJpYnV0ZSBzZW1hbnRpY3MgcmVxdWlyZWQgYnkgdGhpcyBzaGFkZXIgcGFydC5cbiAgICogRGlzY2FyZFNoYWRlciBkb2Vzbid0IHJlcXVpcmUgYW55IHNwZWNpZmljIHZlcnRleCBhdHRyaWJ1dGUgc2VtYW50aWNzLlxuICAgKlxuICAgKiBAcmV0dXJucyBFbXB0eSBhcnJheSBvZiB2ZXJ0ZXggYXR0cmlidXRlIGVudW1zXG4gICAqL1xuICBnZXQgYXR0cmlidXRlU2VtYW50aWNzKCk6IEFycmF5PFZlcnRleEF0dHJpYnV0ZUVudW0+IHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgYXR0cmlidXRlIGNvbXBvc2l0aW9ucyByZXF1aXJlZCBieSB0aGlzIHNoYWRlciBwYXJ0LlxuICAgKiBEaXNjYXJkU2hhZGVyIGRvZXNuJ3QgcmVxdWlyZSBhbnkgc3BlY2lmaWMgYXR0cmlidXRlIGNvbXBvc2l0aW9ucy5cbiAgICpcbiAgICogQHJldHVybnMgRW1wdHkgYXJyYXkgb2YgY29tcG9zaXRpb24gdHlwZSBlbnVtc1xuICAgKi9cbiAgZ2V0IGF0dHJpYnV0ZUNvbXBvc2l0aW9ucygpOiBBcnJheTxDb21wb3NpdGlvblR5cGVFbnVtPiB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxrQkFBa0I7QUFJM0IsU0FBUywwQkFBMEI7QUFTNUIsSUFBTSxpQkFBTixNQUFNLHVCQUFzQixtQkFBbUI7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU81QyxjQUFjO0FBQ3BCLFVBQU07QUFBQSxFQUNSO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxPQUFPLGNBQTZCO0FBQ2xDLFFBQUksQ0FBQyxLQUFLLFlBQVk7QUFDcEIsV0FBSyxhQUFhLElBQUksZUFBYztBQUFBLElBQ3RDO0FBQ0EsV0FBTyxLQUFLO0FBQUEsRUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsMkJBQTJCLFFBQWdCO0FBQ3pDLFFBQUksT0FBTyxZQUFZLDJCQUEyQixnQkFBZ0IsUUFBUTtBQUN4RSxhQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUtUO0FBQ0EsV0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsSUFBSSxtQkFBbUI7QUFDckIsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLDBCQUEwQixRQUFnQjtBQUN4QyxRQUFJLE9BQU8sWUFBWSwyQkFBMkIsZ0JBQWdCLFFBQVE7QUFDeEUsYUFBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBT1Q7QUFDQSxXQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEscUJBQXFCO0FBQ25CLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxJQUFJLGlCQUFpQztBQUNuQyxXQUFPLENBQUM7QUFBQSxFQUNWO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxJQUFJLHFCQUFpRDtBQUNuRCxXQUFPLENBQUM7QUFBQSxFQUNWO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxJQUFJLHdCQUFvRDtBQUN0RCxXQUFPLENBQUM7QUFBQSxFQUNWO0FBQ0Y7QUF2SGEsZUFFWSxrQkFBa0IsV0FBVztBQUYvQyxJQUFNLGdCQUFOOyIsCiAgIm5hbWVzIjogW10KfQo=
