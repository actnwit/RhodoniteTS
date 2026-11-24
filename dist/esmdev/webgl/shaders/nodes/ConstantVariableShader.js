// src/webgl/shaders/nodes/ConstantVariableShader.ts
import { ComponentType } from "../../../foundation/definitions/ComponentType.js";
import { ProcessApproach } from "../../../foundation/definitions/ProcessApproach.js";
import { StandardShaderPart } from "../StandardShaderPart.js";
var ConstantVariableShader = class extends StandardShaderPart {
  /**
   * Creates a new ConstantVariableShader instance.
   *
   * @param __functionName - The name of the generated shader function
   * @param __compositionType - The composition type (scalar, vec2, vec3, vec4, etc.) of the constant
   * @param __componentType - The component type (float, int, bool) of the constant
   */
  constructor(__functionName, __compositionType, __componentType) {
    super();
    this.aF = __functionName;
    this.Xs = __compositionType;
    this.Zs = __componentType;
    this.bF = "";
  }
  /**
   * Sets the constant value that will be output by the generated shader function.
   * The value is converted to the appropriate GLSL/WGSL string representation based on the component type.
   *
   * @param value - The vector value to be used as the constant. The number of components used
   *                depends on the composition type specified in the constructor.
   *
   * @example
   * ```typescript
   * // For a Vec3 float constant
   * shader.setConstantValue(Vector3.fromCopyArray([1.0, 0.5, 0.0]));
   *
   * // For a scalar int constant
   * shader.setConstantValue(Scalar.fromCopyNumber(42));
   *
   * // For a boolean constant
   * shader.setConstantValue(Scalar.fromCopyNumber(1)); // true
   * ```
   */
  setConstantValue(value) {
    let constant = "";
    if (this.Zs.isFloatingPoint()) {
      constant = value.glslStrAsFloat;
    } else if (this.Zs.isInteger()) {
      constant = value.glslStrAsInt;
    } else if (this.Zs.isUnsignedInteger()) {
      constant = value.glslStrAsUint;
    } else if (this.Zs === ComponentType.Bool) {
      constant = value.x ? "true" : "false";
    }
    this.bF = constant;
  }
  /**
   * Generates the vertex shader function definition that outputs the constant value.
   * The generated function takes an output parameter and assigns the constant value to it.
   *
   * @returns The GLSL or WGSL function definition string for the vertex shader,
   *          depending on the current process approach (WebGL or WebGPU).
   *
   * @example
   * Generated GLSL:
   * ```glsl
   * void getConstantColor(out vec3 outValue) {
   *   outValue = vec3(1.0, 0.5, 0.0);
   * }
   * ```
   *
   * Generated WGSL:
   * ```wgsl
   * fn getConstantColor(outValue: ptr<function, vec3<f32>>) {
   *   *outValue = vec3<f32>(1.0, 0.5, 0.0);
   * }
   * ```
   */
  getVertexShaderDefinitions(engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
      fn ${this.aF}(
        outValue: ptr<function, ${this.Xs.toWGSLType(this.Zs)}>) {
        *outValue = ${this.bF};
      }
      `;
    }
    return `
      void ${this.aF}(
        out ${this.Xs.getGlslStr(this.Zs)} outValue) {
        outValue = ${this.bF};
      }
      `;
  }
  /**
   * Generates the pixel shader function definition that outputs the constant value.
   * This is identical to the vertex shader definition as constant values are the same
   * regardless of shader stage.
   *
   * @returns The GLSL or WGSL function definition string for the pixel shader,
   *          depending on the current process approach (WebGL or WebGPU).
   *
   * @example
   * Generated GLSL:
   * ```glsl
   * void getConstantColor(out vec3 outValue) {
   *   outValue = vec3(1.0, 0.5, 0.0);
   * }
   * ```
   *
   * Generated WGSL:
   * ```wgsl
   * fn getConstantColor(outValue: ptr<function, vec3<f32>>) {
   *   *outValue = vec3<f32>(1.0, 0.5, 0.0);
   * }
   * ```
   */
  getPixelShaderDefinitions(engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
      fn ${this.aF}(
        outValue: ptr<function, ${this.Xs.toWGSLType(this.Zs)}>) {
        *outValue = ${this.bF};
      }
      `;
    }
    return `
      void ${this.aF}(
        out ${this.Xs.getGlslStr(this.Zs)} outValue) {
        outValue = ${this.bF};
      }
      `;
  }
  /**
   * Returns the attribute names required by this shader part.
   * Since this is a constant variable shader that doesn't use any vertex attributes,
   * it returns an empty array.
   *
   * @returns An empty array as no vertex attributes are needed for constant values.
   */
  get attributeNames() {
    return [];
  }
  /**
   * Returns the vertex attribute semantics required by this shader part.
   * Since this is a constant variable shader that doesn't use any vertex attributes,
   * it returns an empty array.
   *
   * @returns An empty array as no vertex attribute semantics are needed for constant values.
   */
  get attributeSemantics() {
    return [];
  }
  /**
   * Returns the attribute compositions required by this shader part.
   * Since this is a constant variable shader that doesn't use any vertex attributes,
   * it returns an empty array.
   *
   * @returns An empty array as no attribute compositions are needed for constant values.
   */
  get attributeCompositions() {
    return [];
  }
};
export {
  ConstantVariableShader
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL3dlYmdsL3NoYWRlcnMvbm9kZXMvQ29uc3RhbnRWYXJpYWJsZVNoYWRlci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgQ29tcG9uZW50VHlwZSwgdHlwZSBDb21wb25lbnRUeXBlRW51bSB9IGZyb20gJy4uLy4uLy4uL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvQ29tcG9uZW50VHlwZSc7XG5pbXBvcnQgdHlwZSB7IENvbXBvc2l0aW9uVHlwZUVudW0gfSBmcm9tICcuLi8uLi8uLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgeyBQcm9jZXNzQXBwcm9hY2ggfSBmcm9tICcuLi8uLi8uLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1Byb2Nlc3NBcHByb2FjaCc7XG5pbXBvcnQgdHlwZSB7IFZlcnRleEF0dHJpYnV0ZUVudW0gfSBmcm9tICcuLi8uLi8uLi9mb3VuZGF0aW9uL2RlZmluaXRpb25zL1ZlcnRleEF0dHJpYnV0ZSc7XG5pbXBvcnQgdHlwZSB7IElWZWN0b3IgfSBmcm9tICcuLi8uLi8uLi9mb3VuZGF0aW9uL21hdGgvSVZlY3Rvcic7XG5pbXBvcnQgdHlwZSB7IEVuZ2luZSB9IGZyb20gJy4uLy4uLy4uL2ZvdW5kYXRpb24vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgdHlwZSB7IEF0dHJpYnV0ZU5hbWVzIH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgU3RhbmRhcmRTaGFkZXJQYXJ0IH0gZnJvbSAnLi4vU3RhbmRhcmRTaGFkZXJQYXJ0JztcblxuLyoqXG4gKiBBIHNoYWRlciBwYXJ0IHRoYXQgZ2VuZXJhdGVzIGNvbnN0YW50IHZhcmlhYmxlIGZ1bmN0aW9ucyBmb3IgYm90aCB2ZXJ0ZXggYW5kIHBpeGVsIHNoYWRlcnMuXG4gKiBUaGlzIGNsYXNzIGNyZWF0ZXMgR0xTTC9XR1NMIGZ1bmN0aW9ucyB0aGF0IG91dHB1dCBjb25zdGFudCB2YWx1ZXMgb2Ygc3BlY2lmaWVkIGNvbXBvc2l0aW9uIGFuZCBjb21wb25lbnQgdHlwZXMuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGNvbnN0IGNvbnN0YW50U2hhZGVyID0gbmV3IENvbnN0YW50VmFyaWFibGVTaGFkZXIoXG4gKiAgICdnZXRDb25zdGFudENvbG9yJyxcbiAqICAgQ29tcG9zaXRpb25UeXBlLlZlYzMsXG4gKiAgIENvbXBvbmVudFR5cGUuRmxvYXRcbiAqICk7XG4gKiBjb25zdGFudFNoYWRlci5zZXRDb25zdGFudFZhbHVlKFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMS4wLCAwLjUsIDAuMF0pKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgQ29uc3RhbnRWYXJpYWJsZVNoYWRlciBleHRlbmRzIFN0YW5kYXJkU2hhZGVyUGFydCB7XG4gIHByaXZhdGUgX19jb25zdGFudFZhbHVlU3RyID0gJyc7XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgQ29uc3RhbnRWYXJpYWJsZVNoYWRlciBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIF9fZnVuY3Rpb25OYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGdlbmVyYXRlZCBzaGFkZXIgZnVuY3Rpb25cbiAgICogQHBhcmFtIF9fY29tcG9zaXRpb25UeXBlIC0gVGhlIGNvbXBvc2l0aW9uIHR5cGUgKHNjYWxhciwgdmVjMiwgdmVjMywgdmVjNCwgZXRjLikgb2YgdGhlIGNvbnN0YW50XG4gICAqIEBwYXJhbSBfX2NvbXBvbmVudFR5cGUgLSBUaGUgY29tcG9uZW50IHR5cGUgKGZsb2F0LCBpbnQsIGJvb2wpIG9mIHRoZSBjb25zdGFudFxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBfX2Z1bmN0aW9uTmFtZTogc3RyaW5nLFxuICAgIHByaXZhdGUgX19jb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZUVudW0sXG4gICAgcHJpdmF0ZSBfX2NvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGVFbnVtXG4gICkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY29uc3RhbnQgdmFsdWUgdGhhdCB3aWxsIGJlIG91dHB1dCBieSB0aGUgZ2VuZXJhdGVkIHNoYWRlciBmdW5jdGlvbi5cbiAgICogVGhlIHZhbHVlIGlzIGNvbnZlcnRlZCB0byB0aGUgYXBwcm9wcmlhdGUgR0xTTC9XR1NMIHN0cmluZyByZXByZXNlbnRhdGlvbiBiYXNlZCBvbiB0aGUgY29tcG9uZW50IHR5cGUuXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSB2ZWN0b3IgdmFsdWUgdG8gYmUgdXNlZCBhcyB0aGUgY29uc3RhbnQuIFRoZSBudW1iZXIgb2YgY29tcG9uZW50cyB1c2VkXG4gICAqICAgICAgICAgICAgICAgIGRlcGVuZHMgb24gdGhlIGNvbXBvc2l0aW9uIHR5cGUgc3BlY2lmaWVkIGluIHRoZSBjb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiAvLyBGb3IgYSBWZWMzIGZsb2F0IGNvbnN0YW50XG4gICAqIHNoYWRlci5zZXRDb25zdGFudFZhbHVlKFZlY3RvcjMuZnJvbUNvcHlBcnJheShbMS4wLCAwLjUsIDAuMF0pKTtcbiAgICpcbiAgICogLy8gRm9yIGEgc2NhbGFyIGludCBjb25zdGFudFxuICAgKiBzaGFkZXIuc2V0Q29uc3RhbnRWYWx1ZShTY2FsYXIuZnJvbUNvcHlOdW1iZXIoNDIpKTtcbiAgICpcbiAgICogLy8gRm9yIGEgYm9vbGVhbiBjb25zdGFudFxuICAgKiBzaGFkZXIuc2V0Q29uc3RhbnRWYWx1ZShTY2FsYXIuZnJvbUNvcHlOdW1iZXIoMSkpOyAvLyB0cnVlXG4gICAqIGBgYFxuICAgKi9cbiAgc2V0Q29uc3RhbnRWYWx1ZSh2YWx1ZTogSVZlY3Rvcikge1xuICAgIGxldCBjb25zdGFudCA9ICcnO1xuICAgIGlmICh0aGlzLl9fY29tcG9uZW50VHlwZS5pc0Zsb2F0aW5nUG9pbnQoKSkge1xuICAgICAgY29uc3RhbnQgPSB2YWx1ZS5nbHNsU3RyQXNGbG9hdDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX19jb21wb25lbnRUeXBlLmlzSW50ZWdlcigpKSB7XG4gICAgICBjb25zdGFudCA9IHZhbHVlLmdsc2xTdHJBc0ludDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX19jb21wb25lbnRUeXBlLmlzVW5zaWduZWRJbnRlZ2VyKCkpIHtcbiAgICAgIGNvbnN0YW50ID0gdmFsdWUuZ2xzbFN0ckFzVWludDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX19jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkJvb2wpIHtcbiAgICAgIGNvbnN0YW50ID0gdmFsdWUueCA/ICd0cnVlJyA6ICdmYWxzZSc7XG4gICAgfVxuICAgIHRoaXMuX19jb25zdGFudFZhbHVlU3RyID0gY29uc3RhbnQ7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIHRoZSB2ZXJ0ZXggc2hhZGVyIGZ1bmN0aW9uIGRlZmluaXRpb24gdGhhdCBvdXRwdXRzIHRoZSBjb25zdGFudCB2YWx1ZS5cbiAgICogVGhlIGdlbmVyYXRlZCBmdW5jdGlvbiB0YWtlcyBhbiBvdXRwdXQgcGFyYW1ldGVyIGFuZCBhc3NpZ25zIHRoZSBjb25zdGFudCB2YWx1ZSB0byBpdC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIEdMU0wgb3IgV0dTTCBmdW5jdGlvbiBkZWZpbml0aW9uIHN0cmluZyBmb3IgdGhlIHZlcnRleCBzaGFkZXIsXG4gICAqICAgICAgICAgIGRlcGVuZGluZyBvbiB0aGUgY3VycmVudCBwcm9jZXNzIGFwcHJvYWNoIChXZWJHTCBvciBXZWJHUFUpLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBHZW5lcmF0ZWQgR0xTTDpcbiAgICogYGBgZ2xzbFxuICAgKiB2b2lkIGdldENvbnN0YW50Q29sb3Iob3V0IHZlYzMgb3V0VmFsdWUpIHtcbiAgICogICBvdXRWYWx1ZSA9IHZlYzMoMS4wLCAwLjUsIDAuMCk7XG4gICAqIH1cbiAgICogYGBgXG4gICAqXG4gICAqIEdlbmVyYXRlZCBXR1NMOlxuICAgKiBgYGB3Z3NsXG4gICAqIGZuIGdldENvbnN0YW50Q29sb3Iob3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgdmVjMzxmMzI+Pikge1xuICAgKiAgICpvdXRWYWx1ZSA9IHZlYzM8ZjMyPigxLjAsIDAuNSwgMC4wKTtcbiAgICogfVxuICAgKiBgYGBcbiAgICovXG4gIGdldFZlcnRleFNoYWRlckRlZmluaXRpb25zKGVuZ2luZTogRW5naW5lKSB7XG4gICAgaWYgKGVuZ2luZS5lbmdpbmVTdGF0ZS5jdXJyZW50UHJvY2Vzc0FwcHJvYWNoID09PSBQcm9jZXNzQXBwcm9hY2guV2ViR1BVKSB7XG4gICAgICByZXR1cm4gYFxuICAgICAgZm4gJHt0aGlzLl9fZnVuY3Rpb25OYW1lfShcbiAgICAgICAgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgJHt0aGlzLl9fY29tcG9zaXRpb25UeXBlLnRvV0dTTFR5cGUodGhpcy5fX2NvbXBvbmVudFR5cGUpfT4pIHtcbiAgICAgICAgKm91dFZhbHVlID0gJHt0aGlzLl9fY29uc3RhbnRWYWx1ZVN0cn07XG4gICAgICB9XG4gICAgICBgO1xuICAgIH1cbiAgICByZXR1cm4gYFxuICAgICAgdm9pZCAke3RoaXMuX19mdW5jdGlvbk5hbWV9KFxuICAgICAgICBvdXQgJHt0aGlzLl9fY29tcG9zaXRpb25UeXBlLmdldEdsc2xTdHIodGhpcy5fX2NvbXBvbmVudFR5cGUpfSBvdXRWYWx1ZSkge1xuICAgICAgICBvdXRWYWx1ZSA9ICR7dGhpcy5fX2NvbnN0YW50VmFsdWVTdHJ9O1xuICAgICAgfVxuICAgICAgYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgdGhlIHBpeGVsIHNoYWRlciBmdW5jdGlvbiBkZWZpbml0aW9uIHRoYXQgb3V0cHV0cyB0aGUgY29uc3RhbnQgdmFsdWUuXG4gICAqIFRoaXMgaXMgaWRlbnRpY2FsIHRvIHRoZSB2ZXJ0ZXggc2hhZGVyIGRlZmluaXRpb24gYXMgY29uc3RhbnQgdmFsdWVzIGFyZSB0aGUgc2FtZVxuICAgKiByZWdhcmRsZXNzIG9mIHNoYWRlciBzdGFnZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIEdMU0wgb3IgV0dTTCBmdW5jdGlvbiBkZWZpbml0aW9uIHN0cmluZyBmb3IgdGhlIHBpeGVsIHNoYWRlcixcbiAgICogICAgICAgICAgZGVwZW5kaW5nIG9uIHRoZSBjdXJyZW50IHByb2Nlc3MgYXBwcm9hY2ggKFdlYkdMIG9yIFdlYkdQVSkuXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIEdlbmVyYXRlZCBHTFNMOlxuICAgKiBgYGBnbHNsXG4gICAqIHZvaWQgZ2V0Q29uc3RhbnRDb2xvcihvdXQgdmVjMyBvdXRWYWx1ZSkge1xuICAgKiAgIG91dFZhbHVlID0gdmVjMygxLjAsIDAuNSwgMC4wKTtcbiAgICogfVxuICAgKiBgYGBcbiAgICpcbiAgICogR2VuZXJhdGVkIFdHU0w6XG4gICAqIGBgYHdnc2xcbiAgICogZm4gZ2V0Q29uc3RhbnRDb2xvcihvdXRWYWx1ZTogcHRyPGZ1bmN0aW9uLCB2ZWMzPGYzMj4+KSB7XG4gICAqICAgKm91dFZhbHVlID0gdmVjMzxmMzI+KDEuMCwgMC41LCAwLjApO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKi9cbiAgZ2V0UGl4ZWxTaGFkZXJEZWZpbml0aW9ucyhlbmdpbmU6IEVuZ2luZSkge1xuICAgIGlmIChlbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgcmV0dXJuIGBcbiAgICAgIGZuICR7dGhpcy5fX2Z1bmN0aW9uTmFtZX0oXG4gICAgICAgIG91dFZhbHVlOiBwdHI8ZnVuY3Rpb24sICR7dGhpcy5fX2NvbXBvc2l0aW9uVHlwZS50b1dHU0xUeXBlKHRoaXMuX19jb21wb25lbnRUeXBlKX0+KSB7XG4gICAgICAgICpvdXRWYWx1ZSA9ICR7dGhpcy5fX2NvbnN0YW50VmFsdWVTdHJ9O1xuICAgICAgfVxuICAgICAgYDtcbiAgICB9XG4gICAgcmV0dXJuIGBcbiAgICAgIHZvaWQgJHt0aGlzLl9fZnVuY3Rpb25OYW1lfShcbiAgICAgICAgb3V0ICR7dGhpcy5fX2NvbXBvc2l0aW9uVHlwZS5nZXRHbHNsU3RyKHRoaXMuX19jb21wb25lbnRUeXBlKX0gb3V0VmFsdWUpIHtcbiAgICAgICAgb3V0VmFsdWUgPSAke3RoaXMuX19jb25zdGFudFZhbHVlU3RyfTtcbiAgICAgIH1cbiAgICAgIGA7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgYXR0cmlidXRlIG5hbWVzIHJlcXVpcmVkIGJ5IHRoaXMgc2hhZGVyIHBhcnQuXG4gICAqIFNpbmNlIHRoaXMgaXMgYSBjb25zdGFudCB2YXJpYWJsZSBzaGFkZXIgdGhhdCBkb2Vzbid0IHVzZSBhbnkgdmVydGV4IGF0dHJpYnV0ZXMsXG4gICAqIGl0IHJldHVybnMgYW4gZW1wdHkgYXJyYXkuXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IGFycmF5IGFzIG5vIHZlcnRleCBhdHRyaWJ1dGVzIGFyZSBuZWVkZWQgZm9yIGNvbnN0YW50IHZhbHVlcy5cbiAgICovXG4gIGdldCBhdHRyaWJ1dGVOYW1lcygpOiBBdHRyaWJ1dGVOYW1lcyB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHZlcnRleCBhdHRyaWJ1dGUgc2VtYW50aWNzIHJlcXVpcmVkIGJ5IHRoaXMgc2hhZGVyIHBhcnQuXG4gICAqIFNpbmNlIHRoaXMgaXMgYSBjb25zdGFudCB2YXJpYWJsZSBzaGFkZXIgdGhhdCBkb2Vzbid0IHVzZSBhbnkgdmVydGV4IGF0dHJpYnV0ZXMsXG4gICAqIGl0IHJldHVybnMgYW4gZW1wdHkgYXJyYXkuXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IGFycmF5IGFzIG5vIHZlcnRleCBhdHRyaWJ1dGUgc2VtYW50aWNzIGFyZSBuZWVkZWQgZm9yIGNvbnN0YW50IHZhbHVlcy5cbiAgICovXG4gIGdldCBhdHRyaWJ1dGVTZW1hbnRpY3MoKTogQXJyYXk8VmVydGV4QXR0cmlidXRlRW51bT4ge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBhdHRyaWJ1dGUgY29tcG9zaXRpb25zIHJlcXVpcmVkIGJ5IHRoaXMgc2hhZGVyIHBhcnQuXG4gICAqIFNpbmNlIHRoaXMgaXMgYSBjb25zdGFudCB2YXJpYWJsZSBzaGFkZXIgdGhhdCBkb2Vzbid0IHVzZSBhbnkgdmVydGV4IGF0dHJpYnV0ZXMsXG4gICAqIGl0IHJldHVybnMgYW4gZW1wdHkgYXJyYXkuXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IGFycmF5IGFzIG5vIGF0dHJpYnV0ZSBjb21wb3NpdGlvbnMgYXJlIG5lZWRlZCBmb3IgY29uc3RhbnQgdmFsdWVzLlxuICAgKi9cbiAgZ2V0IGF0dHJpYnV0ZUNvbXBvc2l0aW9ucygpOiBBcnJheTxDb21wb3NpdGlvblR5cGVFbnVtPiB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsU0FBUyxxQkFBNkM7QUFFdEQsU0FBUyx1QkFBdUI7QUFLaEMsU0FBUywwQkFBMEI7QUFnQjVCLElBQU0seUJBQU4sY0FBcUMsbUJBQW1CO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVU3RCxZQUNVLGdCQUNBLG1CQUNBLGlCQUNSO0FBQ0EsVUFBTTtBQUpFLFNBQUFBLEtBQUE7QUFDQSxTQUFBQyxLQUFBO0FBQ0EsU0FBQUMsS0FBQTtBQVpWLFNBQVFDLEtBQXFCO0FBQUEsRUFlN0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBcUJBLGlCQUFpQixPQUFnQjtBQUMvQixRQUFJLFdBQVc7QUFDZixRQUFJLEtBQUtELEdBQWdCLGdCQUFnQixHQUFHO0FBQzFDLGlCQUFXLE1BQU07QUFBQSxJQUNuQixXQUFXLEtBQUtBLEdBQWdCLFVBQVUsR0FBRztBQUMzQyxpQkFBVyxNQUFNO0FBQUEsSUFDbkIsV0FBVyxLQUFLQSxHQUFnQixrQkFBa0IsR0FBRztBQUNuRCxpQkFBVyxNQUFNO0FBQUEsSUFDbkIsV0FBVyxLQUFLQSxPQUFvQixjQUFjLE1BQU07QUFDdEQsaUJBQVcsTUFBTSxJQUFJLFNBQVM7QUFBQSxJQUNoQztBQUNBLFNBQUtDLEtBQXFCO0FBQUEsRUFDNUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBd0JBLDJCQUEyQixRQUFnQjtBQUN6QyxRQUFJLE9BQU8sWUFBWSwyQkFBMkIsZ0JBQWdCLFFBQVE7QUFDeEUsYUFBTztBQUFBLFdBQ0YsS0FBS0gsRUFBYztBQUFBLGtDQUNJLEtBQUtDLEdBQWtCLFdBQVcsS0FBS0MsRUFBZSxDQUFDO0FBQUEsc0JBQ25FLEtBQUtDLEVBQWtCO0FBQUE7QUFBQTtBQUFBLElBR3pDO0FBQ0EsV0FBTztBQUFBLGFBQ0UsS0FBS0gsRUFBYztBQUFBLGNBQ2xCLEtBQUtDLEdBQWtCLFdBQVcsS0FBS0MsRUFBZSxDQUFDO0FBQUEscUJBQ2hELEtBQUtDLEVBQWtCO0FBQUE7QUFBQTtBQUFBLEVBRzFDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBeUJBLDBCQUEwQixRQUFnQjtBQUN4QyxRQUFJLE9BQU8sWUFBWSwyQkFBMkIsZ0JBQWdCLFFBQVE7QUFDeEUsYUFBTztBQUFBLFdBQ0YsS0FBS0gsRUFBYztBQUFBLGtDQUNJLEtBQUtDLEdBQWtCLFdBQVcsS0FBS0MsRUFBZSxDQUFDO0FBQUEsc0JBQ25FLEtBQUtDLEVBQWtCO0FBQUE7QUFBQTtBQUFBLElBR3pDO0FBQ0EsV0FBTztBQUFBLGFBQ0UsS0FBS0gsRUFBYztBQUFBLGNBQ2xCLEtBQUtDLEdBQWtCLFdBQVcsS0FBS0MsRUFBZSxDQUFDO0FBQUEscUJBQ2hELEtBQUtDLEVBQWtCO0FBQUE7QUFBQTtBQUFBLEVBRzFDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLElBQUksaUJBQWlDO0FBQ25DLFdBQU8sQ0FBQztBQUFBLEVBQ1Y7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBU0EsSUFBSSxxQkFBaUQ7QUFDbkQsV0FBTyxDQUFDO0FBQUEsRUFDVjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFTQSxJQUFJLHdCQUFvRDtBQUN0RCxXQUFPLENBQUM7QUFBQSxFQUNWO0FBQ0Y7IiwKICAibmFtZXMiOiBbIl9fZnVuY3Rpb25OYW1lIiwgIl9fY29tcG9zaXRpb25UeXBlIiwgIl9fY29tcG9uZW50VHlwZSIsICJfX2NvbnN0YW50VmFsdWVTdHIiXQp9Cg==
