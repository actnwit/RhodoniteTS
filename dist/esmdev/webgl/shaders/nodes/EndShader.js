// src/webgl/shaders/nodes/EndShader.ts
import { ProcessApproach } from "../../../foundation/definitions/ProcessApproach.js";
import { ShaderNode } from "../../../foundation/definitions/ShaderNode.js";
import { StandardShaderPart } from "../StandardShaderPart.js";
var _EndShader = class _EndShader extends StandardShaderPart {
  /**
   * Private constructor to enforce singleton pattern.
   */
  constructor() {
    super();
  }
  /**
   * Gets the singleton instance of EndShader.
   * Creates a new instance if one doesn't exist.
   *
   * @returns The singleton EndShader instance
   */
  static getInstance() {
    if (!this.Yi) {
      this.Yi = new _EndShader();
    }
    return this.Yi;
  }
  /**
   * Gets the vertex shader function definitions for position output.
   * Returns appropriate function definition based on the current process approach (WebGL/WebGPU).
   *
   * @returns Shader code string containing the outPosition function definition
   */
  getVertexShaderDefinitions(engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
      fn outPosition(inPosition: vec4<f32>) {
        output.position = inPosition;
      }
      `;
    }
    return `
      void outPosition(in vec4 inPosition) {
        gl_Position = inPosition;
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
    return `

    `;
  }
  /**
   * Gets the pixel/fragment shader function definitions for color output and discard.
   * Returns appropriate function definition based on the current process approach (WebGL/WebGPU).
   *
   * @returns Shader code string containing the outColor and conditionalDiscard function definitions
   */
  getPixelShaderDefinitions(engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
      fn outColor(inColor: vec4<f32>) {
        rt0 = inColor;
      }
      `;
    }
    return `
      void outColor(in vec4 inColor) {
        rt0 = inColor;
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
   * EndShader doesn't require any specific vertex attributes.
   *
   * @returns Empty array of attribute names
   */
  get attributeNames() {
    return [];
  }
  /**
   * Gets the vertex attribute semantics required by this shader part.
   * EndShader doesn't require any specific vertex attribute semantics.
   *
   * @returns Empty array of vertex attribute enums
   */
  get attributeSemantics() {
    return [];
  }
  /**
   * Gets the attribute compositions required by this shader part.
   * EndShader doesn't require any specific attribute compositions.
   *
   * @returns Empty array of composition type enums
   */
  get attributeCompositions() {
    return [];
  }
};
_EndShader.materialElement = ShaderNode.PBRShading;
var EndShader = _EndShader;
export {
  EndShader
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL3dlYmdsL3NoYWRlcnMvbm9kZXMvRW5kU2hhZGVyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IENvbXBvc2l0aW9uVHlwZUVudW0gfSBmcm9tICcuLi8uLi8uLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgeyBQcm9jZXNzQXBwcm9hY2ggfSBmcm9tICcuLi8uLi8uLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgeyBTaGFkZXJOb2RlIH0gZnJvbSAnLi4vLi4vLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9TaGFkZXJOb2RlJztcbmltcG9ydCB0eXBlIHsgVmVydGV4QXR0cmlidXRlRW51bSB9IGZyb20gJy4uLy4uLy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvVmVydGV4QXR0cmlidXRlJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vLi4vZm91bmRhdGlvbi9zeXN0ZW0vRW5naW5lJztcbmltcG9ydCB0eXBlIHsgQXR0cmlidXRlTmFtZXMgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBTdGFuZGFyZFNoYWRlclBhcnQgfSBmcm9tICcuLi9TdGFuZGFyZFNoYWRlclBhcnQnO1xuXG4vKipcbiAqIEVuZFNoYWRlciBjbGFzcyBwcm92aWRlcyB0aGUgZmluYWwgb3V0cHV0IGZ1bmN0aW9ucyBmb3IgYm90aCB2ZXJ0ZXggYW5kIGZyYWdtZW50IHNoYWRlcnMuXG4gKiBUaGlzIGNsYXNzIGhhbmRsZXMgdGhlIGZpbmFsIHBvc2l0aW9uIG91dHB1dCBpbiB2ZXJ0ZXggc2hhZGVycyBhbmQgY29sb3Igb3V0cHV0IGluIGZyYWdtZW50IHNoYWRlcnMsXG4gKiBzdXBwb3J0aW5nIGJvdGggV2ViR0wgYW5kIFdlYkdQVSByZW5kZXJpbmcgYXBwcm9hY2hlcy5cbiAqXG4gKiBAZXh0ZW5kcyBTdGFuZGFyZFNoYWRlclBhcnRcbiAqL1xuZXhwb3J0IGNsYXNzIEVuZFNoYWRlciBleHRlbmRzIFN0YW5kYXJkU2hhZGVyUGFydCB7XG4gIHN0YXRpYyBfX2luc3RhbmNlOiBFbmRTaGFkZXI7XG4gIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgbWF0ZXJpYWxFbGVtZW50ID0gU2hhZGVyTm9kZS5QQlJTaGFkaW5nO1xuXG4gIC8qKlxuICAgKiBQcml2YXRlIGNvbnN0cnVjdG9yIHRvIGVuZm9yY2Ugc2luZ2xldG9uIHBhdHRlcm4uXG4gICAqL1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2luZ2xldG9uIGluc3RhbmNlIG9mIEVuZFNoYWRlci5cbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBpZiBvbmUgZG9lc24ndCBleGlzdC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHNpbmdsZXRvbiBFbmRTaGFkZXIgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBFbmRTaGFkZXIge1xuICAgIGlmICghdGhpcy5fX2luc3RhbmNlKSB7XG4gICAgICB0aGlzLl9faW5zdGFuY2UgPSBuZXcgRW5kU2hhZGVyKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9faW5zdGFuY2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmVydGV4IHNoYWRlciBmdW5jdGlvbiBkZWZpbml0aW9ucyBmb3IgcG9zaXRpb24gb3V0cHV0LlxuICAgKiBSZXR1cm5zIGFwcHJvcHJpYXRlIGZ1bmN0aW9uIGRlZmluaXRpb24gYmFzZWQgb24gdGhlIGN1cnJlbnQgcHJvY2VzcyBhcHByb2FjaCAoV2ViR0wvV2ViR1BVKS5cbiAgICpcbiAgICogQHJldHVybnMgU2hhZGVyIGNvZGUgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIG91dFBvc2l0aW9uIGZ1bmN0aW9uIGRlZmluaXRpb25cbiAgICovXG4gIGdldFZlcnRleFNoYWRlckRlZmluaXRpb25zKGVuZ2luZTogRW5naW5lKSB7XG4gICAgaWYgKGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICByZXR1cm4gYFxuICAgICAgZm4gb3V0UG9zaXRpb24oaW5Qb3NpdGlvbjogdmVjNDxmMzI+KSB7XG4gICAgICAgIG91dHB1dC5wb3NpdGlvbiA9IGluUG9zaXRpb247XG4gICAgICB9XG4gICAgICBgO1xuICAgIH1cbiAgICByZXR1cm4gYFxuICAgICAgdm9pZCBvdXRQb3NpdGlvbihpbiB2ZWM0IGluUG9zaXRpb24pIHtcbiAgICAgICAgZ2xfUG9zaXRpb24gPSBpblBvc2l0aW9uO1xuICAgICAgfVxuICAgICAgYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2ZXJ0ZXggc2hhZGVyIGJvZHkgY29kZS5cbiAgICogQ3VycmVudGx5IHJldHVybnMgZW1wdHkgc3RyaW5nIGFzIG5vIGFkZGl0aW9uYWwgdmVydGV4IHByb2Nlc3NpbmcgaXMgbmVlZGVkLlxuICAgKlxuICAgKiBAcmV0dXJucyBFbXB0eSBzaGFkZXIgYm9keSBzdHJpbmdcbiAgICovXG4gIGdldCB2ZXJ0ZXhTaGFkZXJCb2R5KCkge1xuICAgIHJldHVybiBgXG5cbiAgICBgO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHBpeGVsL2ZyYWdtZW50IHNoYWRlciBmdW5jdGlvbiBkZWZpbml0aW9ucyBmb3IgY29sb3Igb3V0cHV0IGFuZCBkaXNjYXJkLlxuICAgKiBSZXR1cm5zIGFwcHJvcHJpYXRlIGZ1bmN0aW9uIGRlZmluaXRpb24gYmFzZWQgb24gdGhlIGN1cnJlbnQgcHJvY2VzcyBhcHByb2FjaCAoV2ViR0wvV2ViR1BVKS5cbiAgICpcbiAgICogQHJldHVybnMgU2hhZGVyIGNvZGUgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIG91dENvbG9yIGFuZCBjb25kaXRpb25hbERpc2NhcmQgZnVuY3Rpb24gZGVmaW5pdGlvbnNcbiAgICovXG4gIGdldFBpeGVsU2hhZGVyRGVmaW5pdGlvbnMoZW5naW5lOiBFbmdpbmUpIHtcbiAgICBpZiAoZW5naW5lLmVuZ2luZVN0YXRlLmN1cnJlbnRQcm9jZXNzQXBwcm9hY2ggPT09IFByb2Nlc3NBcHByb2FjaC5XZWJHUFUpIHtcbiAgICAgIHJldHVybiBgXG4gICAgICBmbiBvdXRDb2xvcihpbkNvbG9yOiB2ZWM0PGYzMj4pIHtcbiAgICAgICAgcnQwID0gaW5Db2xvcjtcbiAgICAgIH1cbiAgICAgIGA7XG4gICAgfVxuICAgIHJldHVybiBgXG4gICAgICB2b2lkIG91dENvbG9yKGluIHZlYzQgaW5Db2xvcikge1xuICAgICAgICBydDAgPSBpbkNvbG9yO1xuICAgICAgfVxuICAgICAgYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBwaXhlbC9mcmFnbWVudCBzaGFkZXIgYm9keSBjb2RlLlxuICAgKiBDdXJyZW50bHkgcmV0dXJucyBlbXB0eSBzdHJpbmcgYXMgbm8gYWRkaXRpb25hbCBmcmFnbWVudCBwcm9jZXNzaW5nIGlzIG5lZWRlZC5cbiAgICpcbiAgICogQHJldHVybnMgRW1wdHkgc2hhZGVyIGJvZHkgc3RyaW5nXG4gICAqL1xuICBnZXRQaXhlbFNoYWRlckJvZHkoKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGF0dHJpYnV0ZSBuYW1lcyByZXF1aXJlZCBieSB0aGlzIHNoYWRlciBwYXJ0LlxuICAgKiBFbmRTaGFkZXIgZG9lc24ndCByZXF1aXJlIGFueSBzcGVjaWZpYyB2ZXJ0ZXggYXR0cmlidXRlcy5cbiAgICpcbiAgICogQHJldHVybnMgRW1wdHkgYXJyYXkgb2YgYXR0cmlidXRlIG5hbWVzXG4gICAqL1xuICBnZXQgYXR0cmlidXRlTmFtZXMoKTogQXR0cmlidXRlTmFtZXMge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2ZXJ0ZXggYXR0cmlidXRlIHNlbWFudGljcyByZXF1aXJlZCBieSB0aGlzIHNoYWRlciBwYXJ0LlxuICAgKiBFbmRTaGFkZXIgZG9lc24ndCByZXF1aXJlIGFueSBzcGVjaWZpYyB2ZXJ0ZXggYXR0cmlidXRlIHNlbWFudGljcy5cbiAgICpcbiAgICogQHJldHVybnMgRW1wdHkgYXJyYXkgb2YgdmVydGV4IGF0dHJpYnV0ZSBlbnVtc1xuICAgKi9cbiAgZ2V0IGF0dHJpYnV0ZVNlbWFudGljcygpOiBBcnJheTxWZXJ0ZXhBdHRyaWJ1dGVFbnVtPiB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGF0dHJpYnV0ZSBjb21wb3NpdGlvbnMgcmVxdWlyZWQgYnkgdGhpcyBzaGFkZXIgcGFydC5cbiAgICogRW5kU2hhZGVyIGRvZXNuJ3QgcmVxdWlyZSBhbnkgc3BlY2lmaWMgYXR0cmlidXRlIGNvbXBvc2l0aW9ucy5cbiAgICpcbiAgICogQHJldHVybnMgRW1wdHkgYXJyYXkgb2YgY29tcG9zaXRpb24gdHlwZSBlbnVtc1xuICAgKi9cbiAgZ2V0IGF0dHJpYnV0ZUNvbXBvc2l0aW9ucygpOiBBcnJheTxDb21wb3NpdGlvblR5cGVFbnVtPiB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxrQkFBa0I7QUFJM0IsU0FBUywwQkFBMEI7QUFTNUIsSUFBTSxhQUFOLE1BQU0sbUJBQWtCLG1CQUFtQjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT3hDLGNBQWM7QUFDcEIsVUFBTTtBQUFBLEVBQ1I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLE9BQU8sY0FBeUI7QUFDOUIsUUFBSSxDQUFDLEtBQUtBLElBQVk7QUFDcEIsV0FBS0EsS0FBYSxJQUFJLFdBQVU7QUFBQSxJQUNsQztBQUNBLFdBQU8sS0FBS0E7QUFBQSxFQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSwyQkFBMkIsUUFBZ0I7QUFDekMsUUFBSSxPQUFPLFlBQVksMkJBQTJCLGdCQUFnQixRQUFRO0FBQ3hFLGFBQU87QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBS1Q7QUFDQSxXQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxJQUFJLG1CQUFtQjtBQUNyQixXQUFPO0FBQUE7QUFBQTtBQUFBLEVBR1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLDBCQUEwQixRQUFnQjtBQUN4QyxRQUFJLE9BQU8sWUFBWSwyQkFBMkIsZ0JBQWdCLFFBQVE7QUFDeEUsYUFBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFLVDtBQUNBLFdBQU87QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLHFCQUFxQjtBQUNuQixXQUFPO0FBQUEsRUFDVDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsSUFBSSxpQkFBaUM7QUFDbkMsV0FBTyxDQUFDO0FBQUEsRUFDVjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsSUFBSSxxQkFBaUQ7QUFDbkQsV0FBTyxDQUFDO0FBQUEsRUFDVjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsSUFBSSx3QkFBb0Q7QUFDdEQsV0FBTyxDQUFDO0FBQUEsRUFDVjtBQUNGO0FBckhhLFdBRVksa0JBQWtCLFdBQVc7QUFGL0MsSUFBTSxZQUFOOyIsCiAgIm5hbWVzIjogWyJfX2luc3RhbmNlIl0KfQo=
