// src/foundation/materials/nodes/MergeVectorShaderNode.ts
import MergeVectorShaderityObjectGLSL_ from "../../../webgl/shaderity_shaders/nodes/MergeVector.glsl.js";
import MergeVectorShaderityObjectWGSL_ from "../../../webgpu/shaderity_shaders/nodes/MergeVector.wgsl.js";
import { ComponentType } from "../../definitions/ComponentType.js";
import { CompositionType } from "../../definitions/CompositionType.js";
import { ProcessApproach } from "../../definitions/ProcessApproach.js";
import { AbstractShaderNode } from "../core/AbstractShaderNode.js";
var MergeVectorShaderityObjectGLSL = typeof __RN_WEBGL__ === "undefined" || __RN_WEBGL__ ? MergeVectorShaderityObjectGLSL_ : void 0;
var MergeVectorShaderityObjectWGSL = typeof __RN_WEBGPU__ === "undefined" || __RN_WEBGPU__ ? MergeVectorShaderityObjectWGSL_ : void 0;
var MergeVectorShaderNode = class extends AbstractShaderNode {
  /**
   * Creates a new MergeVectorShaderNode instance.
   *
   * @param componentType - The component type (Float, Int, or UnsignedInt). Defaults to Float.
   *
   * Initializes the node with predefined inputs for various vector components
   * and outputs for different vector sizes. The node supports multiple input
   * combinations to create flexible vector merging operations.
   */
  constructor(componentType = ComponentType.Float) {
    super("mergeVector", {
      codeGLSL: MergeVectorShaderityObjectGLSL.code,
      codeWGSL: MergeVectorShaderityObjectWGSL.code
    });
    this.__componentType = componentType;
    this.__inputs.push({
      compositionType: CompositionType.Vec3,
      componentType,
      name: "xyz"
    });
    this.__inputs.push({
      compositionType: CompositionType.Vec2,
      componentType,
      name: "xy"
    });
    this.__inputs.push({
      compositionType: CompositionType.Vec2,
      componentType,
      name: "zw"
    });
    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType,
      name: "x"
    });
    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType,
      name: "y"
    });
    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType,
      name: "z"
    });
    this.__inputs.push({
      compositionType: CompositionType.Scalar,
      componentType,
      name: "w"
    });
    this.__outputs.push({
      compositionType: CompositionType.Vec4,
      componentType,
      name: "xyzw"
    });
    this.__outputs.push({
      compositionType: CompositionType.Vec3,
      componentType,
      name: "xyz"
    });
    this.__outputs.push({
      compositionType: CompositionType.Vec2,
      componentType,
      name: "xy"
    });
    this.__outputs.push({
      compositionType: CompositionType.Vec2,
      componentType,
      name: "zw"
    });
  }
  /**
   * Determines the appropriate shader function name based on connected inputs and component type.
   *
   * This method analyzes which input connections are active and returns the
   * corresponding shader function variant. Each combination of inputs requires
   * a different shader function implementation to handle the vector merging logic.
   * For WebGPU, type suffix (I32, U32) is added for non-float types.
   *
   * Supported input combinations:
   * - XYZ + W: Vec3 input with scalar W component
   * - XY + ZW: Two Vec2 inputs for XY and ZW components
   * - XY + Z + W: Vec2 input with individual Z and W scalars
   * - ZW + X + Y: Vec2 input with individual X and Y scalars
   * - X + Y + Z + W: Four individual scalar components
   *
   * @param engine - The engine instance
   * @returns The derivative function name suffix for the shader
   * @throws {Error} When the input connection pattern is not supported
   */
  getShaderFunctionNameDerivative(engine) {
    let typeSuffix = "";
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      if (this.__componentType === ComponentType.Int) {
        typeSuffix = "I32";
      } else if (this.__componentType === ComponentType.UnsignedInt) {
        typeSuffix = "U32";
      }
    }
    if (this.inputConnections[0] != null && this.inputConnections[6] != null) {
      return `${this.__shaderFunctionName}XYZ_W${typeSuffix}`;
    }
    if (this.inputConnections[1] != null && this.inputConnections[2] != null) {
      return `${this.__shaderFunctionName}XY_ZW${typeSuffix}`;
    }
    if (this.inputConnections[1] != null && this.inputConnections[5] != null && this.inputConnections[6] != null) {
      return `${this.__shaderFunctionName}XY_Z_W${typeSuffix}`;
    }
    if (this.inputConnections[2] != null && this.inputConnections[3] != null && this.inputConnections[4] != null) {
      return `${this.__shaderFunctionName}ZW_X_Y${typeSuffix}`;
    }
    if (this.inputConnections[3] != null && this.inputConnections[4] != null && this.inputConnections[5] != null && this.inputConnections[6] != null) {
      return `${this.__shaderFunctionName}X_Y_Z_W${typeSuffix}`;
    }
    throw new Error("Not implemented");
  }
  /**
   * Generates the shader function call statement for the merge vector operation.
   * ShaderGraphResolver already orders varOutputNames to match output socket order and generates
   * dummy variables for unconnected outputs, so we simply use them directly.
   * This node only needs custom handling for selecting the correct input indices based on
   * which inputs are connected.
   *
   * @param engine - The engine instance
   * @param i - The node index in the shader graph
   * @param _shaderNode - The shader node instance (unused in this implementation)
   * @param functionName - The name of the shader function to call
   * @param varInputNames - Array of input variable names for each node
   * @param varOutputNames - Array of output variable names for each node (already ordered by ShaderGraphResolver)
   * @returns The generated shader code string for the function call
   */
  makeCallStatement(engine, i, _shaderNode, functionName, varInputNames, varOutputNames) {
    let str = "";
    if (varInputNames[i].length > 0 && varOutputNames[i].length > 0) {
      let inputIndices;
      if (functionName.includes("XYZ_W")) {
        inputIndices = [0, 6];
      } else if (functionName.includes("XY_ZW")) {
        inputIndices = [1, 2];
      } else if (functionName.includes("XY_Z_W")) {
        inputIndices = [1, 5, 6];
      } else if (functionName.includes("ZW_X_Y")) {
        inputIndices = [2, 3, 4];
      } else if (functionName.includes("X_Y_Z_W")) {
        inputIndices = [3, 4, 5, 6];
      } else {
        inputIndices = [];
      }
      const outputArguments = [...varOutputNames[i]];
      if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
        for (let j = 0; j < outputArguments.length; j++) {
          outputArguments[j] = `&${outputArguments[j]}`;
        }
      }
      str += `${functionName}(`;
      for (let k = 0; k < inputIndices.length; k++) {
        if (k !== 0) {
          str += ", ";
        }
        const inputName = varInputNames[i][inputIndices[k]];
        str += inputName;
      }
      str += `, ${outputArguments.join(", ")}`;
      str += ");\n";
    }
    return str;
  }
};
export {
  MergeVectorShaderNode
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0ZXJpYWxzL25vZGVzL01lcmdlVmVjdG9yU2hhZGVyTm9kZS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IE1lcmdlVmVjdG9yU2hhZGVyaXR5T2JqZWN0R0xTTF8gZnJvbSAnLi4vLi4vLi4vd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvTWVyZ2VWZWN0b3IuZ2xzbCc7XG5pbXBvcnQgTWVyZ2VWZWN0b3JTaGFkZXJpdHlPYmplY3RXR1NMXyBmcm9tICcuLi8uLi8uLi93ZWJncHUvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvTWVyZ2VWZWN0b3Iud2dzbCc7XG5pbXBvcnQgeyBDb21wb25lbnRUeXBlLCB0eXBlIENvbXBvbmVudFR5cGVFbnVtIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvQ29tcG9uZW50VHlwZSc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi8uLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgUHJvY2Vzc0FwcHJvYWNoIH0gZnJvbSAnLi4vLi4vZGVmaW5pdGlvbnMvUHJvY2Vzc0FwcHJvYWNoJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyBBYnN0cmFjdFNoYWRlck5vZGUgfSBmcm9tICcuLi9jb3JlL0Fic3RyYWN0U2hhZGVyTm9kZSc7XG5cbi8vIFNoYWRlcnMgb2YgYSBiYWNrZW5kIGV4Y2x1ZGVkIGF0IGJ1aWxkIHRpbWUgKHNlZSBzcmMvYmFja2VuZEZsYWdzLmQudHMpIGFyZSBkcm9wcGVkIGJ5IHRoZSBidW5kbGVyLlxuY29uc3QgTWVyZ2VWZWN0b3JTaGFkZXJpdHlPYmplY3RHTFNMID1cbiAgdHlwZW9mIF9fUk5fV0VCR0xfXyA9PT0gJ3VuZGVmaW5lZCcgfHwgX19STl9XRUJHTF9fID8gTWVyZ2VWZWN0b3JTaGFkZXJpdHlPYmplY3RHTFNMXyA6IHVuZGVmaW5lZDtcbmNvbnN0IE1lcmdlVmVjdG9yU2hhZGVyaXR5T2JqZWN0V0dTTCA9XG4gIHR5cGVvZiBfX1JOX1dFQkdQVV9fID09PSAndW5kZWZpbmVkJyB8fCBfX1JOX1dFQkdQVV9fID8gTWVyZ2VWZWN0b3JTaGFkZXJpdHlPYmplY3RXR1NMXyA6IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBBIHNoYWRlciBub2RlIHRoYXQgbWVyZ2VzIHZlY3RvciBjb21wb25lbnRzIHRvIGNyZWF0ZSB2YXJpb3VzIHZlY3RvciBvdXRwdXRzLlxuICpcbiAqIFRoaXMgbm9kZSBwcm92aWRlcyB0aGUgY2FwYWJpbGl0eSB0byBjb21iaW5lIGluZGl2aWR1YWwgc2NhbGFyIGNvbXBvbmVudHMgKHgsIHksIHosIHcpXG4gKiBvciBzbWFsbGVyIHZlY3RvcnMgKHh5LCB6dywgeHl6KSBpbnRvIGxhcmdlciB2ZWN0b3Igb3V0cHV0cyAoVmVjMiwgVmVjMywgVmVjNCkuXG4gKiBJdCBzdXBwb3J0cyBtdWx0aXBsZSBpbnB1dCBjb25maWd1cmF0aW9ucyBhbmQgYXV0b21hdGljYWxseSBzZWxlY3RzIHRoZSBhcHByb3ByaWF0ZVxuICogc2hhZGVyIGZ1bmN0aW9uIGJhc2VkIG9uIHdoaWNoIGlucHV0cyBhcmUgY29ubmVjdGVkLlxuICogU3VwcG9ydHMgZmxvYXQsIGludCwgYW5kIHVpbnQgY29tcG9uZW50IHR5cGVzLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCBtZXJnZU5vZGUgPSBuZXcgTWVyZ2VWZWN0b3JTaGFkZXJOb2RlKENvbXBvbmVudFR5cGUuRmxvYXQpO1xuICogLy8gQ29ubmVjdCBzY2FsYXIgaW5wdXRzIHgsIHksIHosIHcgdG8gY3JlYXRlIGEgVmVjNCBvdXRwdXRcbiAqIC8vIE9yIGNvbm5lY3QgVmVjMyB4eXogYW5kIHNjYWxhciB3IHRvIGNyZWF0ZSBhIFZlYzQgb3V0cHV0XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIE1lcmdlVmVjdG9yU2hhZGVyTm9kZSBleHRlbmRzIEFic3RyYWN0U2hhZGVyTm9kZSB7XG4gIHByaXZhdGUgX19jb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlRW51bTtcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNZXJnZVZlY3RvclNoYWRlck5vZGUgaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSBjb21wb25lbnRUeXBlIC0gVGhlIGNvbXBvbmVudCB0eXBlIChGbG9hdCwgSW50LCBvciBVbnNpZ25lZEludCkuIERlZmF1bHRzIHRvIEZsb2F0LlxuICAgKlxuICAgKiBJbml0aWFsaXplcyB0aGUgbm9kZSB3aXRoIHByZWRlZmluZWQgaW5wdXRzIGZvciB2YXJpb3VzIHZlY3RvciBjb21wb25lbnRzXG4gICAqIGFuZCBvdXRwdXRzIGZvciBkaWZmZXJlbnQgdmVjdG9yIHNpemVzLiBUaGUgbm9kZSBzdXBwb3J0cyBtdWx0aXBsZSBpbnB1dFxuICAgKiBjb21iaW5hdGlvbnMgdG8gY3JlYXRlIGZsZXhpYmxlIHZlY3RvciBtZXJnaW5nIG9wZXJhdGlvbnMuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlRW51bSA9IENvbXBvbmVudFR5cGUuRmxvYXQpIHtcbiAgICBzdXBlcignbWVyZ2VWZWN0b3InLCB7XG4gICAgICBjb2RlR0xTTDogTWVyZ2VWZWN0b3JTaGFkZXJpdHlPYmplY3RHTFNMLmNvZGUsXG4gICAgICBjb2RlV0dTTDogTWVyZ2VWZWN0b3JTaGFkZXJpdHlPYmplY3RXR1NMLmNvZGUsXG4gICAgfSk7XG5cbiAgICB0aGlzLl9fY29tcG9uZW50VHlwZSA9IGNvbXBvbmVudFR5cGU7XG5cbiAgICB0aGlzLl9faW5wdXRzLnB1c2goe1xuICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMyxcbiAgICAgIGNvbXBvbmVudFR5cGU6IGNvbXBvbmVudFR5cGUsXG4gICAgICBuYW1lOiAneHl6JyxcbiAgICB9KTtcbiAgICB0aGlzLl9faW5wdXRzLnB1c2goe1xuICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMixcbiAgICAgIGNvbXBvbmVudFR5cGU6IGNvbXBvbmVudFR5cGUsXG4gICAgICBuYW1lOiAneHknLFxuICAgIH0pO1xuICAgIHRoaXMuX19pbnB1dHMucHVzaCh7XG4gICAgICBjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZS5WZWMyLFxuICAgICAgY29tcG9uZW50VHlwZTogY29tcG9uZW50VHlwZSxcbiAgICAgIG5hbWU6ICd6dycsXG4gICAgfSk7XG4gICAgdGhpcy5fX2lucHV0cy5wdXNoKHtcbiAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgIGNvbXBvbmVudFR5cGU6IGNvbXBvbmVudFR5cGUsXG4gICAgICBuYW1lOiAneCcsXG4gICAgfSk7XG4gICAgdGhpcy5fX2lucHV0cy5wdXNoKHtcbiAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgIGNvbXBvbmVudFR5cGU6IGNvbXBvbmVudFR5cGUsXG4gICAgICBuYW1lOiAneScsXG4gICAgfSk7XG4gICAgdGhpcy5fX2lucHV0cy5wdXNoKHtcbiAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgIGNvbXBvbmVudFR5cGU6IGNvbXBvbmVudFR5cGUsXG4gICAgICBuYW1lOiAneicsXG4gICAgfSk7XG4gICAgdGhpcy5fX2lucHV0cy5wdXNoKHtcbiAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlNjYWxhcixcbiAgICAgIGNvbXBvbmVudFR5cGU6IGNvbXBvbmVudFR5cGUsXG4gICAgICBuYW1lOiAndycsXG4gICAgfSk7XG5cbiAgICB0aGlzLl9fb3V0cHV0cy5wdXNoKHtcbiAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzQsXG4gICAgICBjb21wb25lbnRUeXBlOiBjb21wb25lbnRUeXBlLFxuICAgICAgbmFtZTogJ3h5encnLFxuICAgIH0pO1xuICAgIHRoaXMuX19vdXRwdXRzLnB1c2goe1xuICAgICAgY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGUuVmVjMyxcbiAgICAgIGNvbXBvbmVudFR5cGU6IGNvbXBvbmVudFR5cGUsXG4gICAgICBuYW1lOiAneHl6JyxcbiAgICB9KTtcbiAgICB0aGlzLl9fb3V0cHV0cy5wdXNoKHtcbiAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzIsXG4gICAgICBjb21wb25lbnRUeXBlOiBjb21wb25lbnRUeXBlLFxuICAgICAgbmFtZTogJ3h5JyxcbiAgICB9KTtcbiAgICB0aGlzLl9fb3V0cHV0cy5wdXNoKHtcbiAgICAgIGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlLlZlYzIsXG4gICAgICBjb21wb25lbnRUeXBlOiBjb21wb25lbnRUeXBlLFxuICAgICAgbmFtZTogJ3p3JyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHRoZSBhcHByb3ByaWF0ZSBzaGFkZXIgZnVuY3Rpb24gbmFtZSBiYXNlZCBvbiBjb25uZWN0ZWQgaW5wdXRzIGFuZCBjb21wb25lbnQgdHlwZS5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgYW5hbHl6ZXMgd2hpY2ggaW5wdXQgY29ubmVjdGlvbnMgYXJlIGFjdGl2ZSBhbmQgcmV0dXJucyB0aGVcbiAgICogY29ycmVzcG9uZGluZyBzaGFkZXIgZnVuY3Rpb24gdmFyaWFudC4gRWFjaCBjb21iaW5hdGlvbiBvZiBpbnB1dHMgcmVxdWlyZXNcbiAgICogYSBkaWZmZXJlbnQgc2hhZGVyIGZ1bmN0aW9uIGltcGxlbWVudGF0aW9uIHRvIGhhbmRsZSB0aGUgdmVjdG9yIG1lcmdpbmcgbG9naWMuXG4gICAqIEZvciBXZWJHUFUsIHR5cGUgc3VmZml4IChJMzIsIFUzMikgaXMgYWRkZWQgZm9yIG5vbi1mbG9hdCB0eXBlcy5cbiAgICpcbiAgICogU3VwcG9ydGVkIGlucHV0IGNvbWJpbmF0aW9uczpcbiAgICogLSBYWVogKyBXOiBWZWMzIGlucHV0IHdpdGggc2NhbGFyIFcgY29tcG9uZW50XG4gICAqIC0gWFkgKyBaVzogVHdvIFZlYzIgaW5wdXRzIGZvciBYWSBhbmQgWlcgY29tcG9uZW50c1xuICAgKiAtIFhZICsgWiArIFc6IFZlYzIgaW5wdXQgd2l0aCBpbmRpdmlkdWFsIFogYW5kIFcgc2NhbGFyc1xuICAgKiAtIFpXICsgWCArIFk6IFZlYzIgaW5wdXQgd2l0aCBpbmRpdmlkdWFsIFggYW5kIFkgc2NhbGFyc1xuICAgKiAtIFggKyBZICsgWiArIFc6IEZvdXIgaW5kaXZpZHVhbCBzY2FsYXIgY29tcG9uZW50c1xuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcmV0dXJucyBUaGUgZGVyaXZhdGl2ZSBmdW5jdGlvbiBuYW1lIHN1ZmZpeCBmb3IgdGhlIHNoYWRlclxuICAgKiBAdGhyb3dzIHtFcnJvcn0gV2hlbiB0aGUgaW5wdXQgY29ubmVjdGlvbiBwYXR0ZXJuIGlzIG5vdCBzdXBwb3J0ZWRcbiAgICovXG4gIGdldFNoYWRlckZ1bmN0aW9uTmFtZURlcml2YXRpdmUoZW5naW5lOiBFbmdpbmUpIHtcbiAgICBsZXQgdHlwZVN1ZmZpeCA9ICcnO1xuICAgIGlmIChlbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgaWYgKHRoaXMuX19jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLkludCkge1xuICAgICAgICB0eXBlU3VmZml4ID0gJ0kzMic7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuX19jb21wb25lbnRUeXBlID09PSBDb21wb25lbnRUeXBlLlVuc2lnbmVkSW50KSB7XG4gICAgICAgIHR5cGVTdWZmaXggPSAnVTMyJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5pbnB1dENvbm5lY3Rpb25zWzBdICE9IG51bGwgJiYgdGhpcy5pbnB1dENvbm5lY3Rpb25zWzZdICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBgJHt0aGlzLl9fc2hhZGVyRnVuY3Rpb25OYW1lfVhZWl9XJHt0eXBlU3VmZml4fWA7XG4gICAgfVxuICAgIGlmICh0aGlzLmlucHV0Q29ubmVjdGlvbnNbMV0gIT0gbnVsbCAmJiB0aGlzLmlucHV0Q29ubmVjdGlvbnNbMl0gIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGAke3RoaXMuX19zaGFkZXJGdW5jdGlvbk5hbWV9WFlfWlcke3R5cGVTdWZmaXh9YDtcbiAgICB9XG4gICAgaWYgKHRoaXMuaW5wdXRDb25uZWN0aW9uc1sxXSAhPSBudWxsICYmIHRoaXMuaW5wdXRDb25uZWN0aW9uc1s1XSAhPSBudWxsICYmIHRoaXMuaW5wdXRDb25uZWN0aW9uc1s2XSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gYCR7dGhpcy5fX3NoYWRlckZ1bmN0aW9uTmFtZX1YWV9aX1cke3R5cGVTdWZmaXh9YDtcbiAgICB9XG4gICAgaWYgKHRoaXMuaW5wdXRDb25uZWN0aW9uc1syXSAhPSBudWxsICYmIHRoaXMuaW5wdXRDb25uZWN0aW9uc1szXSAhPSBudWxsICYmIHRoaXMuaW5wdXRDb25uZWN0aW9uc1s0XSAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gYCR7dGhpcy5fX3NoYWRlckZ1bmN0aW9uTmFtZX1aV19YX1kke3R5cGVTdWZmaXh9YDtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgdGhpcy5pbnB1dENvbm5lY3Rpb25zWzNdICE9IG51bGwgJiZcbiAgICAgIHRoaXMuaW5wdXRDb25uZWN0aW9uc1s0XSAhPSBudWxsICYmXG4gICAgICB0aGlzLmlucHV0Q29ubmVjdGlvbnNbNV0gIT0gbnVsbCAmJlxuICAgICAgdGhpcy5pbnB1dENvbm5lY3Rpb25zWzZdICE9IG51bGxcbiAgICApIHtcbiAgICAgIHJldHVybiBgJHt0aGlzLl9fc2hhZGVyRnVuY3Rpb25OYW1lfVhfWV9aX1cke3R5cGVTdWZmaXh9YDtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgdGhlIHNoYWRlciBmdW5jdGlvbiBjYWxsIHN0YXRlbWVudCBmb3IgdGhlIG1lcmdlIHZlY3RvciBvcGVyYXRpb24uXG4gICAqIFNoYWRlckdyYXBoUmVzb2x2ZXIgYWxyZWFkeSBvcmRlcnMgdmFyT3V0cHV0TmFtZXMgdG8gbWF0Y2ggb3V0cHV0IHNvY2tldCBvcmRlciBhbmQgZ2VuZXJhdGVzXG4gICAqIGR1bW15IHZhcmlhYmxlcyBmb3IgdW5jb25uZWN0ZWQgb3V0cHV0cywgc28gd2Ugc2ltcGx5IHVzZSB0aGVtIGRpcmVjdGx5LlxuICAgKiBUaGlzIG5vZGUgb25seSBuZWVkcyBjdXN0b20gaGFuZGxpbmcgZm9yIHNlbGVjdGluZyB0aGUgY29ycmVjdCBpbnB1dCBpbmRpY2VzIGJhc2VkIG9uXG4gICAqIHdoaWNoIGlucHV0cyBhcmUgY29ubmVjdGVkLlxuICAgKlxuICAgKiBAcGFyYW0gZW5naW5lIC0gVGhlIGVuZ2luZSBpbnN0YW5jZVxuICAgKiBAcGFyYW0gaSAtIFRoZSBub2RlIGluZGV4IGluIHRoZSBzaGFkZXIgZ3JhcGhcbiAgICogQHBhcmFtIF9zaGFkZXJOb2RlIC0gVGhlIHNoYWRlciBub2RlIGluc3RhbmNlICh1bnVzZWQgaW4gdGhpcyBpbXBsZW1lbnRhdGlvbilcbiAgICogQHBhcmFtIGZ1bmN0aW9uTmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBzaGFkZXIgZnVuY3Rpb24gdG8gY2FsbFxuICAgKiBAcGFyYW0gdmFySW5wdXROYW1lcyAtIEFycmF5IG9mIGlucHV0IHZhcmlhYmxlIG5hbWVzIGZvciBlYWNoIG5vZGVcbiAgICogQHBhcmFtIHZhck91dHB1dE5hbWVzIC0gQXJyYXkgb2Ygb3V0cHV0IHZhcmlhYmxlIG5hbWVzIGZvciBlYWNoIG5vZGUgKGFscmVhZHkgb3JkZXJlZCBieSBTaGFkZXJHcmFwaFJlc29sdmVyKVxuICAgKiBAcmV0dXJucyBUaGUgZ2VuZXJhdGVkIHNoYWRlciBjb2RlIHN0cmluZyBmb3IgdGhlIGZ1bmN0aW9uIGNhbGxcbiAgICovXG4gIG1ha2VDYWxsU3RhdGVtZW50KFxuICAgIGVuZ2luZTogRW5naW5lLFxuICAgIGk6IG51bWJlcixcbiAgICBfc2hhZGVyTm9kZTogQWJzdHJhY3RTaGFkZXJOb2RlLFxuICAgIGZ1bmN0aW9uTmFtZTogc3RyaW5nLFxuICAgIHZhcklucHV0TmFtZXM6IHN0cmluZ1tdW10sXG4gICAgdmFyT3V0cHV0TmFtZXM6IHN0cmluZ1tdW11cbiAgKTogc3RyaW5nIHtcbiAgICBsZXQgc3RyID0gJyc7XG4gICAgaWYgKHZhcklucHV0TmFtZXNbaV0ubGVuZ3RoID4gMCAmJiB2YXJPdXRwdXROYW1lc1tpXS5sZW5ndGggPiAwKSB7XG4gICAgICAvLyBEZXRlcm1pbmUgd2hpY2ggaW5wdXQgaW5kaWNlcyB0byB1c2UgYmFzZWQgb24gZnVuY3Rpb24gbmFtZVxuICAgICAgLy8gSW5wdXQgaW5kaWNlczogMDogeHl6LCAxOiB4eSwgMjogencsIDM6IHgsIDQ6IHksIDU6IHosIDY6IHdcbiAgICAgIGxldCBpbnB1dEluZGljZXM6IG51bWJlcltdO1xuICAgICAgaWYgKGZ1bmN0aW9uTmFtZS5pbmNsdWRlcygnWFlaX1cnKSkge1xuICAgICAgICBpbnB1dEluZGljZXMgPSBbMCwgNl07IC8vIHh5eiwgd1xuICAgICAgfSBlbHNlIGlmIChmdW5jdGlvbk5hbWUuaW5jbHVkZXMoJ1hZX1pXJykpIHtcbiAgICAgICAgaW5wdXRJbmRpY2VzID0gWzEsIDJdOyAvLyB4eSwgendcbiAgICAgIH0gZWxzZSBpZiAoZnVuY3Rpb25OYW1lLmluY2x1ZGVzKCdYWV9aX1cnKSkge1xuICAgICAgICBpbnB1dEluZGljZXMgPSBbMSwgNSwgNl07IC8vIHh5LCB6LCB3XG4gICAgICB9IGVsc2UgaWYgKGZ1bmN0aW9uTmFtZS5pbmNsdWRlcygnWldfWF9ZJykpIHtcbiAgICAgICAgaW5wdXRJbmRpY2VzID0gWzIsIDMsIDRdOyAvLyB6dywgeCwgeVxuICAgICAgfSBlbHNlIGlmIChmdW5jdGlvbk5hbWUuaW5jbHVkZXMoJ1hfWV9aX1cnKSkge1xuICAgICAgICBpbnB1dEluZGljZXMgPSBbMywgNCwgNSwgNl07IC8vIHgsIHksIHosIHdcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlucHV0SW5kaWNlcyA9IFtdO1xuICAgICAgfVxuXG4gICAgICAvLyBVc2UgdmFyT3V0cHV0TmFtZXMgZGlyZWN0bHkgLSBTaGFkZXJHcmFwaFJlc29sdmVyIGFscmVhZHkgb3JkZXJzIHRoZW0gY29ycmVjdGx5XG4gICAgICAvLyBhbmQgZ2VuZXJhdGVzIGR1bW15IHZhcmlhYmxlcyBmb3IgdW5jb25uZWN0ZWQgb3V0cHV0c1xuICAgICAgY29uc3Qgb3V0cHV0QXJndW1lbnRzID0gWy4uLnZhck91dHB1dE5hbWVzW2ldXTtcbiAgICAgIGlmIChlbmdpbmUuZW5naW5lU3RhdGUuY3VycmVudFByb2Nlc3NBcHByb2FjaCA9PT0gUHJvY2Vzc0FwcHJvYWNoLldlYkdQVSkge1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG91dHB1dEFyZ3VtZW50cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIG91dHB1dEFyZ3VtZW50c1tqXSA9IGAmJHtvdXRwdXRBcmd1bWVudHNbal19YDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBDYWxsIG5vZGUgZnVuY3Rpb25zXG4gICAgICBzdHIgKz0gYCR7ZnVuY3Rpb25OYW1lfShgO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBpbnB1dEluZGljZXMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgaWYgKGsgIT09IDApIHtcbiAgICAgICAgICBzdHIgKz0gJywgJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbnB1dE5hbWUgPSB2YXJJbnB1dE5hbWVzW2ldW2lucHV0SW5kaWNlc1trXV07XG4gICAgICAgIHN0ciArPSBpbnB1dE5hbWU7XG4gICAgICB9XG4gICAgICBzdHIgKz0gYCwgJHtvdXRwdXRBcmd1bWVudHMuam9pbignLCAnKX1gO1xuICAgICAgc3RyICs9ICcpO1xcbic7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFBLE9BQU8scUNBQXFDO0FBQzVDLE9BQU8scUNBQXFDO0FBQzVDLFNBQVMscUJBQTZDO0FBQ3RELFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsdUJBQXVCO0FBRWhDLFNBQVMsMEJBQTBCO0FBR25DLElBQU0saUNBQ0osT0FBTyxpQkFBaUIsZUFBZSxlQUFlLGtDQUFrQztBQUMxRixJQUFNLGlDQUNKLE9BQU8sa0JBQWtCLGVBQWUsZ0JBQWdCLGtDQUFrQztBQWtCckYsSUFBTSx3QkFBTixjQUFvQyxtQkFBbUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVk1RCxZQUFZLGdCQUFtQyxjQUFjLE9BQU87QUFDbEUsVUFBTSxlQUFlO0FBQUEsTUFDbkIsVUFBVSwrQkFBK0I7QUFBQSxNQUN6QyxVQUFVLCtCQUErQjtBQUFBLElBQzNDLENBQUM7QUFFRCxTQUFLLGtCQUFrQjtBQUV2QixTQUFLLFNBQVMsS0FBSztBQUFBLE1BQ2pCLGlCQUFpQixnQkFBZ0I7QUFBQSxNQUNqQztBQUFBLE1BQ0EsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUNELFNBQUssU0FBUyxLQUFLO0FBQUEsTUFDakIsaUJBQWlCLGdCQUFnQjtBQUFBLE1BQ2pDO0FBQUEsTUFDQSxNQUFNO0FBQUEsSUFDUixDQUFDO0FBQ0QsU0FBSyxTQUFTLEtBQUs7QUFBQSxNQUNqQixpQkFBaUIsZ0JBQWdCO0FBQUEsTUFDakM7QUFBQSxNQUNBLE1BQU07QUFBQSxJQUNSLENBQUM7QUFDRCxTQUFLLFNBQVMsS0FBSztBQUFBLE1BQ2pCLGlCQUFpQixnQkFBZ0I7QUFBQSxNQUNqQztBQUFBLE1BQ0EsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUNELFNBQUssU0FBUyxLQUFLO0FBQUEsTUFDakIsaUJBQWlCLGdCQUFnQjtBQUFBLE1BQ2pDO0FBQUEsTUFDQSxNQUFNO0FBQUEsSUFDUixDQUFDO0FBQ0QsU0FBSyxTQUFTLEtBQUs7QUFBQSxNQUNqQixpQkFBaUIsZ0JBQWdCO0FBQUEsTUFDakM7QUFBQSxNQUNBLE1BQU07QUFBQSxJQUNSLENBQUM7QUFDRCxTQUFLLFNBQVMsS0FBSztBQUFBLE1BQ2pCLGlCQUFpQixnQkFBZ0I7QUFBQSxNQUNqQztBQUFBLE1BQ0EsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUVELFNBQUssVUFBVSxLQUFLO0FBQUEsTUFDbEIsaUJBQWlCLGdCQUFnQjtBQUFBLE1BQ2pDO0FBQUEsTUFDQSxNQUFNO0FBQUEsSUFDUixDQUFDO0FBQ0QsU0FBSyxVQUFVLEtBQUs7QUFBQSxNQUNsQixpQkFBaUIsZ0JBQWdCO0FBQUEsTUFDakM7QUFBQSxNQUNBLE1BQU07QUFBQSxJQUNSLENBQUM7QUFDRCxTQUFLLFVBQVUsS0FBSztBQUFBLE1BQ2xCLGlCQUFpQixnQkFBZ0I7QUFBQSxNQUNqQztBQUFBLE1BQ0EsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUNELFNBQUssVUFBVSxLQUFLO0FBQUEsTUFDbEIsaUJBQWlCLGdCQUFnQjtBQUFBLE1BQ2pDO0FBQUEsTUFDQSxNQUFNO0FBQUEsSUFDUixDQUFDO0FBQUEsRUFDSDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFxQkEsZ0NBQWdDLFFBQWdCO0FBQzlDLFFBQUksYUFBYTtBQUNqQixRQUFJLE9BQU8sWUFBWSwyQkFBMkIsZ0JBQWdCLFFBQVE7QUFDeEUsVUFBSSxLQUFLLG9CQUFvQixjQUFjLEtBQUs7QUFDOUMscUJBQWE7QUFBQSxNQUNmLFdBQVcsS0FBSyxvQkFBb0IsY0FBYyxhQUFhO0FBQzdELHFCQUFhO0FBQUEsTUFDZjtBQUFBLElBQ0Y7QUFFQSxRQUFJLEtBQUssaUJBQWlCLENBQUMsS0FBSyxRQUFRLEtBQUssaUJBQWlCLENBQUMsS0FBSyxNQUFNO0FBQ3hFLGFBQU8sR0FBRyxLQUFLLG9CQUFvQixRQUFRLFVBQVU7QUFBQSxJQUN2RDtBQUNBLFFBQUksS0FBSyxpQkFBaUIsQ0FBQyxLQUFLLFFBQVEsS0FBSyxpQkFBaUIsQ0FBQyxLQUFLLE1BQU07QUFDeEUsYUFBTyxHQUFHLEtBQUssb0JBQW9CLFFBQVEsVUFBVTtBQUFBLElBQ3ZEO0FBQ0EsUUFBSSxLQUFLLGlCQUFpQixDQUFDLEtBQUssUUFBUSxLQUFLLGlCQUFpQixDQUFDLEtBQUssUUFBUSxLQUFLLGlCQUFpQixDQUFDLEtBQUssTUFBTTtBQUM1RyxhQUFPLEdBQUcsS0FBSyxvQkFBb0IsU0FBUyxVQUFVO0FBQUEsSUFDeEQ7QUFDQSxRQUFJLEtBQUssaUJBQWlCLENBQUMsS0FBSyxRQUFRLEtBQUssaUJBQWlCLENBQUMsS0FBSyxRQUFRLEtBQUssaUJBQWlCLENBQUMsS0FBSyxNQUFNO0FBQzVHLGFBQU8sR0FBRyxLQUFLLG9CQUFvQixTQUFTLFVBQVU7QUFBQSxJQUN4RDtBQUNBLFFBQ0UsS0FBSyxpQkFBaUIsQ0FBQyxLQUFLLFFBQzVCLEtBQUssaUJBQWlCLENBQUMsS0FBSyxRQUM1QixLQUFLLGlCQUFpQixDQUFDLEtBQUssUUFDNUIsS0FBSyxpQkFBaUIsQ0FBQyxLQUFLLE1BQzVCO0FBQ0EsYUFBTyxHQUFHLEtBQUssb0JBQW9CLFVBQVUsVUFBVTtBQUFBLElBQ3pEO0FBQ0EsVUFBTSxJQUFJLE1BQU0saUJBQWlCO0FBQUEsRUFDbkM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWlCQSxrQkFDRSxRQUNBLEdBQ0EsYUFDQSxjQUNBLGVBQ0EsZ0JBQ1E7QUFDUixRQUFJLE1BQU07QUFDVixRQUFJLGNBQWMsQ0FBQyxFQUFFLFNBQVMsS0FBSyxlQUFlLENBQUMsRUFBRSxTQUFTLEdBQUc7QUFHL0QsVUFBSTtBQUNKLFVBQUksYUFBYSxTQUFTLE9BQU8sR0FBRztBQUNsQyx1QkFBZSxDQUFDLEdBQUcsQ0FBQztBQUFBLE1BQ3RCLFdBQVcsYUFBYSxTQUFTLE9BQU8sR0FBRztBQUN6Qyx1QkFBZSxDQUFDLEdBQUcsQ0FBQztBQUFBLE1BQ3RCLFdBQVcsYUFBYSxTQUFTLFFBQVEsR0FBRztBQUMxQyx1QkFBZSxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQUEsTUFDekIsV0FBVyxhQUFhLFNBQVMsUUFBUSxHQUFHO0FBQzFDLHVCQUFlLENBQUMsR0FBRyxHQUFHLENBQUM7QUFBQSxNQUN6QixXQUFXLGFBQWEsU0FBUyxTQUFTLEdBQUc7QUFDM0MsdUJBQWUsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBQUEsTUFDNUIsT0FBTztBQUNMLHVCQUFlLENBQUM7QUFBQSxNQUNsQjtBQUlBLFlBQU0sa0JBQWtCLENBQUMsR0FBRyxlQUFlLENBQUMsQ0FBQztBQUM3QyxVQUFJLE9BQU8sWUFBWSwyQkFBMkIsZ0JBQWdCLFFBQVE7QUFDeEUsaUJBQVMsSUFBSSxHQUFHLElBQUksZ0JBQWdCLFFBQVEsS0FBSztBQUMvQywwQkFBZ0IsQ0FBQyxJQUFJLElBQUksZ0JBQWdCLENBQUMsQ0FBQztBQUFBLFFBQzdDO0FBQUEsTUFDRjtBQUdBLGFBQU8sR0FBRyxZQUFZO0FBQ3RCLGVBQVMsSUFBSSxHQUFHLElBQUksYUFBYSxRQUFRLEtBQUs7QUFDNUMsWUFBSSxNQUFNLEdBQUc7QUFDWCxpQkFBTztBQUFBLFFBQ1Q7QUFDQSxjQUFNLFlBQVksY0FBYyxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDbEQsZUFBTztBQUFBLE1BQ1Q7QUFDQSxhQUFPLEtBQUssZ0JBQWdCLEtBQUssSUFBSSxDQUFDO0FBQ3RDLGFBQU87QUFBQSxJQUNUO0FBRUEsV0FBTztBQUFBLEVBQ1Q7QUFDRjsiLAogICJuYW1lcyI6IFtdCn0K
