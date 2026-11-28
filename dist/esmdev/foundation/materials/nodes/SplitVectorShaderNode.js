// src/foundation/materials/nodes/SplitVectorShaderNode.ts
import SplitVectorShaderityObjectGLSL_ from "../../../webgl/shaderity_shaders/nodes/SplitVector.glsl.js";
import SplitVectorShaderityObjectWGSL_ from "../../../webgpu/shaderity_shaders/nodes/SplitVector.wgsl.js";
import { ComponentType } from "../../definitions/ComponentType.js";
import { CompositionType } from "../../definitions/CompositionType.js";
import { ProcessApproach } from "../../definitions/ProcessApproach.js";
import { AbstractShaderNode } from "../core/AbstractShaderNode.js";
var SplitVectorShaderityObjectGLSL = typeof __RN_WEBGL__ === "undefined" || __RN_WEBGL__ ? SplitVectorShaderityObjectGLSL_ : void 0;
var SplitVectorShaderityObjectWGSL = typeof __RN_WEBGPU__ === "undefined" || __RN_WEBGPU__ ? SplitVectorShaderityObjectWGSL_ : void 0;
var SplitVectorShaderNode = class extends AbstractShaderNode {
  /**
   * Creates a new SplitVectorShaderNode instance.
   * Sets up input and output connections for vector splitting operations.
   *
   * @param componentType - The component type (Float, Int, or UnsignedInt). Defaults to Float.
   *
   * Inputs:
   * - xyzw: Vec4 input for 4-component vectors
   * - xyz: Vec3 input for 3-component vectors
   * - xy: Vec2 input for 2-component vectors
   *
   * Outputs:
   * - xyz: Vec3 output (first 3 components)
   * - xy: Vec2 output (first 2 components)
   * - zw: Vec2 output (last 2 components of vec4)
   * - x, y, z, w: Individual scalar components
   */
  constructor(componentType = ComponentType.Float) {
    super("splitVector", {
      codeGLSL: SplitVectorShaderityObjectGLSL.code,
      codeWGSL: SplitVectorShaderityObjectWGSL.code
    });
    this.gt = componentType;
    this.Hr.push({
      compositionType: CompositionType.Vec4,
      componentType,
      name: "xyzw"
    });
    this.Hr.push({
      compositionType: CompositionType.Vec3,
      componentType,
      name: "xyz"
    });
    this.Hr.push({
      compositionType: CompositionType.Vec2,
      componentType,
      name: "xy"
    });
    this.Kr.push({
      compositionType: CompositionType.Vec3,
      componentType,
      name: "xyz"
    });
    this.Kr.push({
      compositionType: CompositionType.Vec2,
      componentType,
      name: "xy"
    });
    this.Kr.push({
      compositionType: CompositionType.Vec2,
      componentType,
      name: "zw"
    });
    this.Kr.push({
      compositionType: CompositionType.Scalar,
      componentType,
      name: "x"
    });
    this.Kr.push({
      compositionType: CompositionType.Scalar,
      componentType,
      name: "y"
    });
    this.Kr.push({
      compositionType: CompositionType.Scalar,
      componentType,
      name: "z"
    });
    this.Kr.push({
      compositionType: CompositionType.Scalar,
      componentType,
      name: "w"
    });
  }
  /**
   * Gets the derivative shader function name based on the connected input type and component type.
   * For WebGPU, returns specialized function names (splitVectorXYZW, splitVectorXYZ, splitVectorXY)
   * based on which input is connected, with type suffix (I32, U32) for non-float types.
   * For WebGL, returns the base function name.
   *
   * @returns The appropriate shader function name for the current input connection and process approach
   * @throws {Error} When no valid input connection is found in WebGPU mode
   */
  getShaderFunctionNameDerivative(engine) {
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      let typeSuffix = "";
      if (this.gt === ComponentType.Int) {
        typeSuffix = "I32";
      } else if (this.gt === ComponentType.UnsignedInt) {
        typeSuffix = "U32";
      }
      for (const inputConnection of this.inputConnections) {
        if (inputConnection != null) {
          if (inputConnection.inputNameOfThis === "xyzw") {
            return `${this.Jr}XYZW${typeSuffix}`;
          }
          if (inputConnection.inputNameOfThis === "xyz") {
            return `${this.Jr}XYZ${typeSuffix}`;
          }
          if (inputConnection.inputNameOfThis === "xy") {
            return `${this.Jr}XY${typeSuffix}`;
          }
        }
      }
      throw new Error("Not implemented");
    }
    return this.Jr;
  }
  /**
   * Generates shader code for calling the split vector function with appropriate input and output handling.
   * Creates dummy variables for unused outputs and maps connected outputs to their proper variable names.
   * Handles differences between WebGL/GLSL and WebGPU/WGSL syntax, including reference parameters for WebGPU.
   *
   * @param i - The index of the current shader node call
   * @param shaderNode - The shader node instance (unused in this implementation)
   * @param functionName - The name of the shader function to call
   * @param varInputNames - Array of input variable names for each call
   * @param varOutputNames - Array of output variable names for each call
   * @returns The generated shader code string for the function call
   */
  /**
   * Generates shader code for calling the split vector function.
   * ShaderGraphResolver already orders varOutputNames to match output socket order and generates
   * dummy variables for unconnected outputs, so we simply use them directly.
   * This node only needs custom handling for selecting the correct input (xyzw, xyz, or xy).
   *
   * @param engine - The engine instance
   * @param i - The index of the current shader node call
   * @param _shaderNode - The shader node instance (unused in this implementation)
   * @param functionName - The name of the shader function to call
   * @param varInputNames - Array of input variable names for each call
   * @param varOutputNames - Array of output variable names for each call (already ordered by ShaderGraphResolver)
   * @returns The generated shader code string for the function call
   */
  makeCallStatement(engine, i, _shaderNode, functionName, varInputNames, varOutputNames) {
    let str = "";
    if (varInputNames[i].length > 0 && varOutputNames[i].length > 0) {
      let inputIndex = 0;
      for (let j = 0; j < this.inputConnections.length; j++) {
        if (this.inputConnections[j] != null) {
          inputIndex = j;
          break;
        }
      }
      const outputArguments = [...varOutputNames[i]];
      if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
        for (let j = 0; j < outputArguments.length; j++) {
          outputArguments[j] = `&${outputArguments[j]}`;
        }
      }
      str += `${functionName}(`;
      const inputName = varInputNames[i][inputIndex];
      str += inputName;
      str += `, ${outputArguments.join(", ")}`;
      str += ");\n";
    }
    return str;
  }
};
export {
  SplitVectorShaderNode
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL25vZGVzL1NwbGl0VmVjdG9yU2hhZGVyTm9kZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IFNwbGl0VmVjdG9yU2hhZGVyaXR5T2JqZWN0R0xTTF8gZnJvbSAnLi4vLi4vLi4vd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvU3BsaXRWZWN0b3IuZ2xzbCc7XG5pbXBvcnQgU3BsaXRWZWN0b3JTaGFkZXJpdHlPYmplY3RXR1NMXyBmcm9tICcuLi8uLi8uLi93ZWJncHUvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvU3BsaXRWZWN0b3Iud2dzbCc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlLCB0eXBlIENvbXBvbmVudFR5cGVFbnVtIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQ29tcG9uZW50VHlwZSc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgUHJvY2Vzc0FwcHJvYWNoIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvUHJvY2Vzc0FwcHJvYWNoJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyBBYnN0cmFjdFNoYWRlck5vZGUgfSBmcm9tICcuLi9jb3JlL0Fic3RyYWN0U2hhZGVyTm9kZSc7XG5cbi8vIFNoYWRlcnMgb2YgYSBiYWNrZW5kIGV4Y2x1ZGVkIGF0IGJ1aWxkIHRpbWUgKHNlZSBzcmMvYmFja2VuZEZsYWdzLmQudHMpIGFyZSBkcm9wcGVkIGJ5IHRoZSBidW5kbGVyLlxuY29uc3QgU3BsaXRWZWN0b3JTaGFkZXJpdHlPYmplY3RHTFNMID1cbiAgdHlwZW9mIF9fUk5fV0VCR0xfXyA9PT0gJ3VuZGVmaW5lZCcgfHwgX19STl9XRUJHTF9fID8gU3BsaXRWZWN0b3JTaGFkZXJpdHlPYmplY3RHTFNMXyA6IHVuZGVmaW5lZDtcbmNvbnN0IFNwbGl0VmVjdG9yU2hhZGVyaXR5T2JqZWN0V0dTTCA9XG4gIHR5cGVvZiBfX1JOX1dFQkdQVV9fID09PSAndW5kZWZpbmVkJyB8fCBfX1JOX1dFQkdQVV9fID8gU3BsaXRWZWN0b3JTaGFkZXJpdHlPYmplY3RXR1NMXyA6IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBBIHNoYWRlciBub2RlIHRoYXQgc3BsaXRzIHZlY3RvciBpbnB1dHMgaW50byB0aGVpciBpbmRpdmlkdWFsIGNvbXBvbmVudHMgb3Igc21hbGxlciB2ZWN0b3JzLlxuICogVGhpcyBub2RlIGNhbiB0YWtlIHZlYzQsIHZlYzMsIG9yIHZlYzIgaW5wdXRzIGFuZCBvdXRwdXQgdmFyaW91cyBjb21iaW5hdGlvbnMgb2YgdGhlaXIgY29tcG9uZW50c1xuICogaW5jbHVkaW5nIGluZGl2aWR1YWwgc2NhbGFycyAoeCwgeSwgeiwgdykgYW5kIHNtYWxsZXIgdmVjdG9ycyAoeHksIHp3LCB4eXopLlxuICpcbiAqIFN1cHBvcnRzIGJvdGggV2ViR0wvR0xTTCBhbmQgV2ViR1BVL1dHU0wgc2hhZGVyIGNvbXBpbGF0aW9uLlxuICogU3VwcG9ydHMgZmxvYXQsIGludCwgYW5kIHVpbnQgY29tcG9uZW50IHR5cGVzLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCBzcGxpdE5vZGUgPSBuZXcgU3BsaXRWZWN0b3JTaGFkZXJOb2RlKENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICogLy8gQ29ubmVjdCBhIHZlYzQgaW5wdXQgdG8gZ2V0IHgsIHksIHosIHcgY29tcG9uZW50cyBzZXBhcmF0ZWx5XG4gKiAvLyBPciBjb25uZWN0IHZlYzMgaW5wdXQgdG8gZ2V0IHh5eiwgeHkgY29tcG9uZW50c1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBTcGxpdFZlY3RvclNoYWRlck5vZGUgZXh0ZW5kcyBBYnN0cmFjdFNoYWRlck5vZGUge1xuICBwcml2YXRlIF9fY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZUVudW07XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgU3BsaXRWZWN0b3JTaGFkZXJOb2RlIGluc3RhbmNlLlxuICAgKiBTZXRzIHVwIGlucHV0IGFuZCBvdXRwdXQgY29ubmVjdGlvbnMgZm9yIHZlY3RvciBzcGxpdHRpbmcgb3BlcmF0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIGNvbXBvbmVudFR5cGUgLSBUaGUgY29tcG9uZW50IHR5cGUgKEZsb2F0LCBJbnQsIG9yIFVuc2lnbmVkSW50KS4gRGVmYXVsdHMgdG8gRmxvYXQuXG4gICAqXG4gICAqIElucHV0czpcbiAgICogLSB4eXp3OiBWZWM0IGlucHV0IGZvciA0LWNvbXBvbmVudCB2ZWN0b3JzXG4gICAqIC0geHl6OiBWZWMzIGlucHV0IGZvciAzLWNvbXBvbmVudCB2ZWN0b3JzXG4gICAqIC0geHk6IFZlYzIgaW5wdXQgZm9yIDItY29tcG9uZW50IHZlY3RvcnNcbiAgICpcbiAgICogT3V0cHV0czpcbiAgICogLSB4eXo6IFZlYzMgb3V0cHV0IChmaXJzdCAzIGNvbXBvbmVudHMpXG4gICAqIC0geHk6IFZlYzIgb3V0cHV0IChmaXJzdCAyIGNvbXBvbmVudHMpXG4gICAqIC0genc6IFZlYzIgb3V0cHV0IChsYXN0IDIgY29tcG9uZW50cyBvZiB2ZWM0KVxuICAgKiAtIHgsIHksIHosIHc6IEluZGl2aWR1YWwgc2NhbGFyIGNvbXBvbmVudHNcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGVFbnVtID0gQ29tcG9uZW50VHlwZS5GbG9hdCkge1xuICAgIHN1cGVyKCdzcGxpdFZlY3RvcicsIHtcbiAgICAgIGNvZGVHTFNMOiBTcGxpdFZlY3RvclNoYWRlcml0eU9iamVjdEdMU0wuY29kZSxcbiAgICAgIGNvZGVXR1NMOiBTcGxpdFZlY3RvclNoYWRlcml0eU9iamVjdFdHU0wuY29kZSxcbiAgICB9KTtcblxuICAgIHRoaXMuX19jb21wb25lbnRUeXBlID0gY29tcG9uZW50VHlwZTtcblxuICAgIHRoaXMuX19pbnB1dHMucHVzaCh7XG4gICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWM0LFxuICAgICAgY29tcG9uZW50VHlwZTogY29tcG9uZW50VHlwZSxcbiAgICAgIG5hbWU6ICd4eXp3JyxcbiAgICB9KTtcbiAgICB0aGlzLl9faW5wdXRzLnB1c2goe1xuICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMyxcbiAgICAgIGNvbXBvbmVudFR5cGU6IGNvbXBvbmVudFR5cGUsXG4gICAgICBuYW1lOiAneHl6JyxcbiAgICB9KTtcbiAgICB0aGlzLl9faW5wdXRzLnB1c2goe1xuICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMixcbiAgICAgIGNvbXBvbmVudFR5cGU6IGNvbXBvbmVudFR5cGUsXG4gICAgICBuYW1lOiAneHknLFxuICAgIH0pO1xuXG4gICAgdGhpcy5fX291dHB1dHMucHVzaCh7XG4gICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWMzLFxuICAgICAgY29tcG9uZW50VHlwZTogY29tcG9uZW50VHlwZSxcbiAgICAgIG5hbWU6ICd4eXonLFxuICAgIH0pO1xuICAgIHRoaXMuX19vdXRwdXRzLnB1c2goe1xuICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMixcbiAgICAgIGNvbXBvbmVudFR5cGU6IGNvbXBvbmVudFR5cGUsXG4gICAgICBuYW1lOiAneHknLFxuICAgIH0pO1xuICAgIHRoaXMuX19vdXRwdXRzLnB1c2goe1xuICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMixcbiAgICAgIGNvbXBvbmVudFR5cGU6IGNvbXBvbmVudFR5cGUsXG4gICAgICBuYW1lOiAnencnLFxuICAgIH0pO1xuICAgIHRoaXMuX19vdXRwdXRzLnB1c2goe1xuICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICAgICAgY29tcG9uZW50VHlwZTogY29tcG9uZW50VHlwZSxcbiAgICAgIG5hbWU6ICd4JyxcbiAgICB9KTtcbiAgICB0aGlzLl9fb3V0cHV0cy5wdXNoKHtcbiAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgIGNvbXBvbmVudFR5cGU6IGNvbXBvbmVudFR5cGUsXG4gICAgICBuYW1lOiAneScsXG4gICAgfSk7XG4gICAgdGhpcy5fX291dHB1dHMucHVzaCh7XG4gICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIsXG4gICAgICBjb21wb25lbnRUeXBlOiBjb21wb25lbnRUeXBlLFxuICAgICAgbmFtZTogJ3onLFxuICAgIH0pO1xuICAgIHRoaXMuX19vdXRwdXRzLnB1c2goe1xuICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuU2NhbGFyLFxuICAgICAgY29tcG9uZW50VHlwZTogY29tcG9uZW50VHlwZSxcbiAgICAgIG5hbWU6ICd3JyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkZXJpdmF0aXZlIHNoYWRlciBmdW5jdGlvbiBuYW1lIGJhc2VkIG9uIHRoZSBjb25uZWN0ZWQgaW5wdXQgdHlwZSBhbmQgY29tcG9uZW50IHR5cGUuXG4gICAqIEZvciBXZWJHUFUsIHJldHVybnMgc3BlY2lhbGl6ZWQgZnVuY3Rpb24gbmFtZXMgKHNwbGl0VmVjdG9yWFlaVywgc3BsaXRWZWN0b3JYWVosIHNwbGl0VmVjdG9yWFkpXG4gICAqIGJhc2VkIG9uIHdoaWNoIGlucHV0IGlzIGNvbm5lY3RlZCwgd2l0aCB0eXBlIHN1ZmZpeCAoSTMyLCBVMzIpIGZvciBub24tZmxvYXQgdHlwZXMuXG4gICAqIEZvciBXZWJHTCwgcmV0dXJucyB0aGUgYmFzZSBmdW5jdGlvbiBuYW1lLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYXBwcm9wcmlhdGUgc2hhZGVyIGZ1bmN0aW9uIG5hbWUgZm9yIHRoZSBjdXJyZW50IGlucHV0IGNvbm5lY3Rpb24gYW5kIHByb2Nlc3MgYXBwcm9hY2hcbiAgICogQHRocm93cyB7RXJyb3J9IFdoZW4gbm8gdmFsaWQgaW5wdXQgY29ubmVjdGlvbiBpcyBmb3VuZCBpbiBXZWJHUFUgbW9kZVxuICAgKi9cbiAgZ2V0U2hhZGVyRnVuY3Rpb25OYW1lRGVyaXZhdGl2ZShlbmdpbmU6IEVuZ2luZSkge1xuICAgIGlmIChlbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgbGV0IHR5cGVTdWZmaXggPSAnJztcbiAgICAgIGlmICh0aGlzLl9fY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5JbnQpIHtcbiAgICAgICAgdHlwZVN1ZmZpeCA9ICdJMzInO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLl9fY29tcG9uZW50VHlwZSA9PT0gQ29tcG9uZW50VHlwZS5VbnNpZ25lZEludCkge1xuICAgICAgICB0eXBlU3VmZml4ID0gJ1UzMic7XG4gICAgICB9XG5cbiAgICAgIGZvciAoY29uc3QgaW5wdXRDb25uZWN0aW9uIG9mIHRoaXMuaW5wdXRDb25uZWN0aW9ucykge1xuICAgICAgICBpZiAoaW5wdXRDb25uZWN0aW9uICE9IG51bGwpIHtcbiAgICAgICAgICBpZiAoaW5wdXRDb25uZWN0aW9uLmlucHV0TmFtZU9mVGhpcyA9PT0gJ3h5encnKSB7XG4gICAgICAgICAgICByZXR1cm4gYCR7dGhpcy5fX3NoYWRlckZ1bmN0aW9uTmFtZX1YWVpXJHt0eXBlU3VmZml4fWA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpbnB1dENvbm5lY3Rpb24uaW5wdXROYW1lT2ZUaGlzID09PSAneHl6Jykge1xuICAgICAgICAgICAgcmV0dXJuIGAke3RoaXMuX19zaGFkZXJGdW5jdGlvbk5hbWV9WFlaJHt0eXBlU3VmZml4fWA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpbnB1dENvbm5lY3Rpb24uaW5wdXROYW1lT2ZUaGlzID09PSAneHknKSB7XG4gICAgICAgICAgICByZXR1cm4gYCR7dGhpcy5fX3NoYWRlckZ1bmN0aW9uTmFtZX1YWSR7dHlwZVN1ZmZpeH1gO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQnKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19zaGFkZXJGdW5jdGlvbk5hbWU7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIHNoYWRlciBjb2RlIGZvciBjYWxsaW5nIHRoZSBzcGxpdCB2ZWN0b3IgZnVuY3Rpb24gd2l0aCBhcHByb3ByaWF0ZSBpbnB1dCBhbmQgb3V0cHV0IGhhbmRsaW5nLlxuICAgKiBDcmVhdGVzIGR1bW15IHZhcmlhYmxlcyBmb3IgdW51c2VkIG91dHB1dHMgYW5kIG1hcHMgY29ubmVjdGVkIG91dHB1dHMgdG8gdGhlaXIgcHJvcGVyIHZhcmlhYmxlIG5hbWVzLlxuICAgKiBIYW5kbGVzIGRpZmZlcmVuY2VzIGJldHdlZW4gV2ViR0wvR0xTTCBhbmQgV2ViR1BVL1dHU0wgc3ludGF4LCBpbmNsdWRpbmcgcmVmZXJlbmNlIHBhcmFtZXRlcnMgZm9yIFdlYkdQVS5cbiAgICpcbiAgICogQHBhcmFtIGkgLSBUaGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgc2hhZGVyIG5vZGUgY2FsbFxuICAgKiBAcGFyYW0gc2hhZGVyTm9kZSAtIFRoZSBzaGFkZXIgbm9kZSBpbnN0YW5jZSAodW51c2VkIGluIHRoaXMgaW1wbGVtZW50YXRpb24pXG4gICAqIEBwYXJhbSBmdW5jdGlvbk5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgc2hhZGVyIGZ1bmN0aW9uIHRvIGNhbGxcbiAgICogQHBhcmFtIHZhcklucHV0TmFtZXMgLSBBcnJheSBvZiBpbnB1dCB2YXJpYWJsZSBuYW1lcyBmb3IgZWFjaCBjYWxsXG4gICAqIEBwYXJhbSB2YXJPdXRwdXROYW1lcyAtIEFycmF5IG9mIG91dHB1dCB2YXJpYWJsZSBuYW1lcyBmb3IgZWFjaCBjYWxsXG4gICAqIEByZXR1cm5zIFRoZSBnZW5lcmF0ZWQgc2hhZGVyIGNvZGUgc3RyaW5nIGZvciB0aGUgZnVuY3Rpb24gY2FsbFxuICAgKi9cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBzaGFkZXIgY29kZSBmb3IgY2FsbGluZyB0aGUgc3BsaXQgdmVjdG9yIGZ1bmN0aW9uLlxuICAgKiBTaGFkZXJHcmFwaFJlc29sdmVyIGFscmVhZHkgb3JkZXJzIHZhck91dHB1dE5hbWVzIHRvIG1hdGNoIG91dHB1dCBzb2NrZXQgb3JkZXIgYW5kIGdlbmVyYXRlc1xuICAgKiBkdW1teSB2YXJpYWJsZXMgZm9yIHVuY29ubmVjdGVkIG91dHB1dHMsIHNvIHdlIHNpbXBseSB1c2UgdGhlbSBkaXJlY3RseS5cbiAgICogVGhpcyBub2RlIG9ubHkgbmVlZHMgY3VzdG9tIGhhbmRsaW5nIGZvciBzZWxlY3RpbmcgdGhlIGNvcnJlY3QgaW5wdXQgKHh5encsIHh5eiwgb3IgeHkpLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gaSAtIFRoZSBpbmRleCBvZiB0aGUgY3VycmVudCBzaGFkZXIgbm9kZSBjYWxsXG4gICAqIEBwYXJhbSBfc2hhZGVyTm9kZSAtIFRoZSBzaGFkZXIgbm9kZSBpbnN0YW5jZSAodW51c2VkIGluIHRoaXMgaW1wbGVtZW50YXRpb24pXG4gICAqIEBwYXJhbSBmdW5jdGlvbk5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgc2hhZGVyIGZ1bmN0aW9uIHRvIGNhbGxcbiAgICogQHBhcmFtIHZhcklucHV0TmFtZXMgLSBBcnJheSBvZiBpbnB1dCB2YXJpYWJsZSBuYW1lcyBmb3IgZWFjaCBjYWxsXG4gICAqIEBwYXJhbSB2YXJPdXRwdXROYW1lcyAtIEFycmF5IG9mIG91dHB1dCB2YXJpYWJsZSBuYW1lcyBmb3IgZWFjaCBjYWxsIChhbHJlYWR5IG9yZGVyZWQgYnkgU2hhZGVyR3JhcGhSZXNvbHZlcilcbiAgICogQHJldHVybnMgVGhlIGdlbmVyYXRlZCBzaGFkZXIgY29kZSBzdHJpbmcgZm9yIHRoZSBmdW5jdGlvbiBjYWxsXG4gICAqL1xuICBtYWtlQ2FsbFN0YXRlbWVudChcbiAgICBlbmdpbmU6IEVuZ2luZSxcbiAgICBpOiBudW1iZXIsXG4gICAgX3NoYWRlck5vZGU6IEFic3RyYWN0U2hhZGVyTm9kZSxcbiAgICBmdW5jdGlvbk5hbWU6IHN0cmluZyxcbiAgICB2YXJJbnB1dE5hbWVzOiBzdHJpbmdbXVtdLFxuICAgIHZhck91dHB1dE5hbWVzOiBzdHJpbmdbXVtdXG4gICk6IHN0cmluZyB7XG4gICAgbGV0IHN0ciA9ICcnO1xuICAgIGlmICh2YXJJbnB1dE5hbWVzW2ldLmxlbmd0aCA+IDAgJiYgdmFyT3V0cHV0TmFtZXNbaV0ubGVuZ3RoID4gMCkge1xuICAgICAgLy8gRGV0ZXJtaW5lIHdoaWNoIGlucHV0IGluZGV4IHRvIHVzZSBiYXNlZCBvbiBhY3R1YWwgY29ubmVjdGlvbnNcbiAgICAgIC8vIElucHV0IGluZGljZXM6IDA6IHh5encsIDE6IHh5eiwgMjogeHlcbiAgICAgIGxldCBpbnB1dEluZGV4ID0gMDsgLy8gZGVmYXVsdCB0byB4eXp3XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHRoaXMuaW5wdXRDb25uZWN0aW9ucy5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAodGhpcy5pbnB1dENvbm5lY3Rpb25zW2pdICE9IG51bGwpIHtcbiAgICAgICAgICBpbnB1dEluZGV4ID0gajtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBVc2UgdmFyT3V0cHV0TmFtZXMgZGlyZWN0bHkgLSBTaGFkZXJHcmFwaFJlc29sdmVyIGFscmVhZHkgb3JkZXJzIHRoZW0gY29ycmVjdGx5XG4gICAgICAvLyBhbmQgZ2VuZXJhdGVzIGR1bW15IHZhcmlhYmxlcyBmb3IgdW5jb25uZWN0ZWQgb3V0cHV0c1xuICAgICAgY29uc3Qgb3V0cHV0QXJndW1lbnRzID0gWy4uLnZhck91dHB1dE5hbWVzW2ldXTtcbiAgICAgIGlmIChlbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG91dHB1dEFyZ3VtZW50cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIG91dHB1dEFyZ3VtZW50c1tqXSA9IGAmJHtvdXRwdXRBcmd1bWVudHNbal19YDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBDYWxsIG5vZGUgZnVuY3Rpb25zXG4gICAgICBzdHIgKz0gYCR7ZnVuY3Rpb25OYW1lfShgO1xuICAgICAgY29uc3QgaW5wdXROYW1lID0gdmFySW5wdXROYW1lc1tpXVtpbnB1dEluZGV4XTtcbiAgICAgIHN0ciArPSBpbnB1dE5hbWU7XG4gICAgICBzdHIgKz0gYCwgJHtvdXRwdXRBcmd1bWVudHMuam9pbignLCAnKX1gO1xuICAgICAgc3RyICs9ICcpO1xcbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLE9BQU8scUNBQXFDO0FBQzVDLE9BQU8scUNBQXFDO0FBQzVDLFNBQVMscUJBQTZDO0FBQ3RELFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsdUJBQXVCO0FBRWhDLFNBQVMsMEJBQTBCO0FBR25DLElBQU0saUNBQ0osT0FBTyxpQkFBaUIsZUFBZSxlQUFlLGtDQUFrQztBQUMxRixJQUFNLGlDQUNKLE9BQU8sa0JBQWtCLGVBQWUsZ0JBQWdCLGtDQUFrQztBQWlCckYsSUFBTSx3QkFBTixjQUFvQyxtQkFBbUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFvQjVELFlBQVksZ0JBQW1D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QUMsRUFBRSxTQUFTLEtBQUssZUFBZSxDQUFDLEVBQUUsU0FBUyxHQUFHO0FBRy9ELFVBQUksYUFBYTtBQUNqQixlQUFTLElBQUksR0FBRyxJQUFJLEtBQUssaUJBQWlCLFFBQVEsS0FBSztBQUNyRCxZQUFJLEtBQUssaUJBQWlCLENBQUMsS0FBSyxNQUFNO0FBQ3BDLHVCQUFhO0FBQ2I7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUlBLFlBQU0sa0JBQWtCLENBQUMsR0FBRyxlQUFlLENBQUMsQ0FBQztBQUM3QyxVQUFJLE9BQU8sWUFBWSwyQkFBMkIsZ0JBQWdCLFFBQVE7QUFDeEUsaUJBQVMsSUFBSSxHQUFHLElBQUksZ0JBQWdCLFFBQVEsS0FBSztBQUMvQywwQkFBZ0IsQ0FBQyxJQUFJLElBQUksZ0JBQWdCLENBQUMsQ0FBQztBQUFBLFFBQzdDO0FBQUEsTUFDRjtBQUdBLGFBQU8sR0FBRyxZQUFZO0FBQ3RCLFlBQU0sWUFBWSxjQUFjLENBQUMsRUFBRSxVQUFVO0FBQzdDLGFBQU87QUFDUCxhQUFPLEtBQUssZ0JBQWdCLEtBQUssSUFBSSxDQUFDO0FBQ3RDLGFBQU87QUFBQSxJQUNUO0FBRUEsV0FBTztBQUFBLEVBQ1Q7QUFDRjsiLAogICJuYW1lcyI6IFsiX19jb21wb25lbnRUeXBlIiwgIl9faW5wdXRzIiwgIl9fb3V0cHV0cyIsICJfX3NoYWRlckZ1bmN0aW9uTmFtZSJdCn0K
