// src/webgl/shaders/nodes/BlockBeginShader.ts
import { StandardShaderPart } from "../StandardShaderPart.js";
var BlockBeginShader = class extends StandardShaderPart {
  /**
   * Creates a new BlockBeginShader instance.
   *
   * @param __functionName - The name of the GLSL function to generate
   * @param __valueInputs - Array of input shader sockets that define function parameters
   * @param __valueOutputs - Array of output shader sockets that define function output parameters
   */
  constructor(__functionName, __valueInputs, __valueOutputs) {
    super();
    this.bF = __functionName;
    this.Ws = __valueInputs;
    this.Xs = __valueOutputs;
  }
  /**
   * Generates the vertex shader function definition.
   * Creates a GLSL function with the specified name, input parameters, and output parameters.
   * The function body assigns input values to corresponding output values.
   *
   * @returns The GLSL function definition string for vertex shader
   */
  getVertexShaderDefinitions(_engine) {
    let funcStr = `void ${this.bF}(
in bool context,
      `;
    for (let i = 0; i < this.Ws.length; i++) {
      const input = this.Ws[i];
      const type = input.compositionType.getGlslStr(input.componentType);
      funcStr += `
        in ${type} value${i},`;
    }
    for (let i = 0; i < this.Xs.length; i++) {
      const output = this.Xs[i];
      const type = output.compositionType.getGlslStr(output.componentType);
      funcStr += `
        out ${type} outValue${i}${i === this.Xs.length - 1 ? "" : ","}`;
    }
    funcStr += ") {\n";
    for (let i = 0; i < this.Xs.length; i++) {
      funcStr += `
      outValue${i} = value${i};
`;
    }
    funcStr += "}";
    return funcStr;
  }
  /**
   * Generates the pixel shader function definition.
   * Returns the same definition as vertex shader since the function structure is identical.
   *
   * @returns The GLSL function definition string for pixel shader
   */
  getPixelShaderDefinitions(engine) {
    return this.getVertexShaderDefinitions(engine);
  }
  /**
   * Gets the attribute names required by this shader part.
   * This shader part doesn't require any specific vertex attributes.
   *
   * @returns An empty array as no attributes are needed
   */
  get attributeNames() {
    return [];
  }
  /**
   * Gets the vertex attribute semantics required by this shader part.
   * This shader part doesn't require any specific vertex attribute semantics.
   *
   * @returns An empty array as no attribute semantics are needed
   */
  get attributeSemantics() {
    return [];
  }
  /**
   * Gets the composition types for vertex attributes required by this shader part.
   * This shader part doesn't require any specific attribute compositions.
   *
   * @returns An empty array as no attribute compositions are needed
   */
  get attributeCompositions() {
    return [];
  }
};
export {
  BlockBeginShader
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL3dlYmdsL3NoYWRlcnMvbm9kZXMvQmxvY2tCZWdpblNoYWRlci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBDb21wb3NpdGlvblR5cGVFbnVtIH0gZnJvbSAnLi4vLi4vLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHR5cGUgeyBWZXJ0ZXhBdHRyaWJ1dGVFbnVtIH0gZnJvbSAnLi4vLi4vLi4vZm91bmRhdGlvbi9kZWZpbml0aW9ucy9WZXJ0ZXhBdHRyaWJ1dGUnO1xuaW1wb3J0IHR5cGUgeyBTaGFkZXJTb2NrZXQgfSBmcm9tICcuLi8uLi8uLi9mb3VuZGF0aW9uL21hdGVyaWFscy9jb3JlL0Fic3RyYWN0U2hhZGVyTm9kZSc7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uLy4uLy4uL2ZvdW5kYXRpb24vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdHlwZSB7IEF0dHJpYnV0ZU5hbWVzIH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgU3RhbmRhcmRTaGFkZXJQYXJ0IH0gZnJvbSAnLi4vU3RhbmRhcmRTaGFkZXJQYXJ0JztcblxuLyoqXG4gKiBBIHNoYWRlciBwYXJ0IHRoYXQgZ2VuZXJhdGVzIHRoZSBiZWdpbm5pbmcgYmxvY2sgb2YgYSBzaGFkZXIgZnVuY3Rpb24uXG4gKiBUaGlzIGNsYXNzIGNyZWF0ZXMgR0xTTCBmdW5jdGlvbiBkZWZpbml0aW9ucyB3aXRoIGlucHV0IGFuZCBvdXRwdXQgcGFyYW1ldGVyc1xuICogYmFzZWQgb24gdGhlIHByb3ZpZGVkIHNoYWRlciBzb2NrZXRzLlxuICovXG5leHBvcnQgY2xhc3MgQmxvY2tCZWdpblNoYWRlciBleHRlbmRzIFN0YW5kYXJkU2hhZGVyUGFydCB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IEJsb2NrQmVnaW5TaGFkZXIgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSBfX2Z1bmN0aW9uTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBHTFNMIGZ1bmN0aW9uIHRvIGdlbmVyYXRlXG4gICAqIEBwYXJhbSBfX3ZhbHVlSW5wdXRzIC0gQXJyYXkgb2YgaW5wdXQgc2hhZGVyIHNvY2tldHMgdGhhdCBkZWZpbmUgZnVuY3Rpb24gcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gX192YWx1ZU91dHB1dHMgLSBBcnJheSBvZiBvdXRwdXQgc2hhZGVyIHNvY2tldHMgdGhhdCBkZWZpbmUgZnVuY3Rpb24gb3V0cHV0IHBhcmFtZXRlcnNcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgX19mdW5jdGlvbk5hbWU6IHN0cmluZyxcbiAgICBwcml2YXRlIF9fdmFsdWVJbnB1dHM6IFNoYWRlclNvY2tldFtdLFxuICAgIHByaXZhdGUgX192YWx1ZU91dHB1dHM6IFNoYWRlclNvY2tldFtdXG4gICkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIHRoZSB2ZXJ0ZXggc2hhZGVyIGZ1bmN0aW9uIGRlZmluaXRpb24uXG4gICAqIENyZWF0ZXMgYSBHTFNMIGZ1bmN0aW9uIHdpdGggdGhlIHNwZWNpZmllZCBuYW1lLCBpbnB1dCBwYXJhbWV0ZXJzLCBhbmQgb3V0cHV0IHBhcmFtZXRlcnMuXG4gICAqIFRoZSBmdW5jdGlvbiBib2R5IGFzc2lnbnMgaW5wdXQgdmFsdWVzIHRvIGNvcnJlc3BvbmRpbmcgb3V0cHV0IHZhbHVlcy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIEdMU0wgZnVuY3Rpb24gZGVmaW5pdGlvbiBzdHJpbmcgZm9yIHZlcnRleCBzaGFkZXJcbiAgICovXG4gIGdldFZlcnRleFNoYWRlckRlZmluaXRpb25zKF9lbmdpbmU6IEVuZ2luZSkge1xuICAgIGxldCBmdW5jU3RyID0gYHZvaWQgJHt0aGlzLl9fZnVuY3Rpb25OYW1lfShcbmluIGJvb2wgY29udGV4dCxcbiAgICAgIGA7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX192YWx1ZUlucHV0cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgaW5wdXQgPSB0aGlzLl9fdmFsdWVJbnB1dHNbaV07XG4gICAgICBjb25zdCB0eXBlID0gaW5wdXQuY29tcG9zaXRpb25UeXBlLmdldEdsc2xTdHIoaW5wdXQuY29tcG9uZW50VHlwZSk7XG4gICAgICBmdW5jU3RyICs9IGBcbiAgICAgICAgaW4gJHt0eXBlfSB2YWx1ZSR7aX0sYDtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX192YWx1ZU91dHB1dHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG91dHB1dCA9IHRoaXMuX192YWx1ZU91dHB1dHNbaV07XG4gICAgICBjb25zdCB0eXBlID0gb3V0cHV0LmNvbXBvc2l0aW9uVHlwZS5nZXRHbHNsU3RyKG91dHB1dC5jb21wb25lbnRUeXBlKTtcbiAgICAgIGZ1bmNTdHIgKz0gYFxuICAgICAgICBvdXQgJHt0eXBlfSBvdXRWYWx1ZSR7aX0ke2kgPT09IHRoaXMuX192YWx1ZU91dHB1dHMubGVuZ3RoIC0gMSA/ICcnIDogJywnfWA7XG4gICAgfVxuXG4gICAgZnVuY1N0ciArPSAnKSB7XFxuJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX192YWx1ZU91dHB1dHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZ1bmNTdHIgKz0gYFxuICAgICAgb3V0VmFsdWUke2l9ID0gdmFsdWUke2l9O1xcbmA7XG4gICAgfVxuICAgIGZ1bmNTdHIgKz0gJ30nO1xuXG4gICAgcmV0dXJuIGZ1bmNTdHI7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIHRoZSBwaXhlbCBzaGFkZXIgZnVuY3Rpb24gZGVmaW5pdGlvbi5cbiAgICogUmV0dXJucyB0aGUgc2FtZSBkZWZpbml0aW9uIGFzIHZlcnRleCBzaGFkZXIgc2luY2UgdGhlIGZ1bmN0aW9uIHN0cnVjdHVyZSBpcyBpZGVudGljYWwuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBHTFNMIGZ1bmN0aW9uIGRlZmluaXRpb24gc3RyaW5nIGZvciBwaXhlbCBzaGFkZXJcbiAgICovXG4gIGdldFBpeGVsU2hhZGVyRGVmaW5pdGlvbnMoZW5naW5lOiBFbmdpbmUpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRWZXJ0ZXhTaGFkZXJEZWZpbml0aW9ucyhlbmdpbmUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGF0dHJpYnV0ZSBuYW1lcyByZXF1aXJlZCBieSB0aGlzIHNoYWRlciBwYXJ0LlxuICAgKiBUaGlzIHNoYWRlciBwYXJ0IGRvZXNuJ3QgcmVxdWlyZSBhbnkgc3BlY2lmaWMgdmVydGV4IGF0dHJpYnV0ZXMuXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IGFycmF5IGFzIG5vIGF0dHJpYnV0ZXMgYXJlIG5lZWRlZFxuICAgKi9cbiAgZ2V0IGF0dHJpYnV0ZU5hbWVzKCk6IEF0dHJpYnV0ZU5hbWVzIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgdmVydGV4IGF0dHJpYnV0ZSBzZW1hbnRpY3MgcmVxdWlyZWQgYnkgdGhpcyBzaGFkZXIgcGFydC5cbiAgICogVGhpcyBzaGFkZXIgcGFydCBkb2Vzbid0IHJlcXVpcmUgYW55IHNwZWNpZmljIHZlcnRleCBhdHRyaWJ1dGUgc2VtYW50aWNzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBbiBlbXB0eSBhcnJheSBhcyBubyBhdHRyaWJ1dGUgc2VtYW50aWNzIGFyZSBuZWVkZWRcbiAgICovXG4gIGdldCBhdHRyaWJ1dGVTZW1hbnRpY3MoKTogQXJyYXk8VmVydGV4QXR0cmlidXRlRW51bT4ge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb3NpdGlvbiB0eXBlcyBmb3IgdmVydGV4IGF0dHJpYnV0ZXMgcmVxdWlyZWQgYnkgdGhpcyBzaGFkZXIgcGFydC5cbiAgICogVGhpcyBzaGFkZXIgcGFydCBkb2Vzbid0IHJlcXVpcmUgYW55IHNwZWNpZmljIGF0dHJpYnV0ZSBjb21wb3NpdGlvbnMuXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IGFycmF5IGFzIG5vIGF0dHJpYnV0ZSBjb21wb3NpdGlvbnMgYXJlIG5lZWRlZFxuICAgKi9cbiAgZ2V0IGF0dHJpYnV0ZUNvbXBvc2l0aW9ucygpOiBBcnJheTxDb21wb3NpdGlvblR5cGVFbnVtPiB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBS0EsU0FBUywwQkFBMEI7QUFPNUIsSUFBTSxtQkFBTixjQUErQixtQkFBbUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUXZELFlBQ1UsZ0JBQ0EsZUFDQSxnQkFDUjtBQUNBLFVBQU07QUFKRSxTQUFBQSxLQUFBO0FBQ0EsU0FBQUMsS0FBQTtBQUNBLFNBQUFDLEtBQUE7QUFBQSxFQUdWO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLDJCQUEyQixTQUFpQjtBQUMxQyxRQUFJLFVBQVUsUUFBUSxLQUFLRixFQUFjO0FBQUE7QUFBQTtBQUl6QyxhQUFTLElBQUksR0FBRyxJQUFJLEtBQUtDLEdBQWMsUUFBUSxLQUFLO0FBQ2xELFlBQU0sUUFBUSxLQUFLQSxHQUFjLENBQUM7QUFDbEMsWUFBTSxPQUFPLE1BQU0sZ0JBQWdCLFdBQVcsTUFBTSxhQUFhO0FBQ2pFLGlCQUFXO0FBQUEsYUFDSixJQUFJLFNBQVMsQ0FBQztBQUFBLElBQ3ZCO0FBRUEsYUFBUyxJQUFJLEdBQUcsSUFBSSxLQUFLQyxHQUFlLFFBQVEsS0FBSztBQUNuRCxZQUFNLFNBQVMsS0FBS0EsR0FBZSxDQUFDO0FBQ3BDLFlBQU0sT0FBTyxPQUFPLGdCQUFnQixXQUFXLE9BQU8sYUFBYTtBQUNuRSxpQkFBVztBQUFBLGNBQ0gsSUFBSSxZQUFZLENBQUMsR0FBRyxNQUFNLEtBQUtBLEdBQWUsU0FBUyxJQUFJLEtBQUssR0FBRztBQUFBLElBQzdFO0FBRUEsZUFBVztBQUNYLGFBQVMsSUFBSSxHQUFHLElBQUksS0FBS0EsR0FBZSxRQUFRLEtBQUs7QUFDbkQsaUJBQVc7QUFBQSxnQkFDRCxDQUFDLFdBQVcsQ0FBQztBQUFBO0FBQUEsSUFDekI7QUFDQSxlQUFXO0FBRVgsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLDBCQUEwQixRQUFnQjtBQUN4QyxXQUFPLEtBQUssMkJBQTJCLE1BQU07QUFBQSxFQUMvQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsSUFBSSxpQkFBaUM7QUFDbkMsV0FBTyxDQUFDO0FBQUEsRUFDVjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsSUFBSSxxQkFBaUQ7QUFDbkQsV0FBTyxDQUFDO0FBQUEsRUFDVjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsSUFBSSx3QkFBb0Q7QUFDdEQsV0FBTyxDQUFDO0FBQUEsRUFDVjtBQUNGOyIsCiAgIm5hbWVzIjogWyJfX2Z1bmN0aW9uTmFtZSIsICJfX3ZhbHVlSW5wdXRzIiwgIl9fdmFsdWVPdXRwdXRzIl0KfQo=
