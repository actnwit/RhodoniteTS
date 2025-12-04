import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { ProcessApproach } from '../../definitions/ProcessApproach';
import { Scalar } from '../../math/Scalar';
import type { Engine } from '../../system/Engine';
import { EngineState } from '../../system/EngineState';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import { Socket } from '../core/Socket';

/**
 * A shader node that processes geometry transformations in the vertex shader pipeline.
 * This node handles world space transformations, normal matrix calculations, and skeletal animation.
 * It provides essential geometry processing functionality for 3D rendering pipelines.
 */
export class ProcessGeometryShaderNode extends AbstractShaderNode {
  /**
   * Creates a new ProcessGeometryShaderNode instance.
   * Initializes input and output sockets for geometry processing operations.
   */
  constructor() {
    super('processGeometry', {
      codeGLSL: '/* shaderity: @{processGeometry} */',
      codeWGSL: '/* shaderity: @{processGeometry} */',
    });

    this.__inputs.push(new Socket('worldMatrix', CompositionType.Mat4, ComponentType.Float));
    this.__inputs.push(new Socket('normalMatrix', CompositionType.Mat3, ComponentType.Float));
    this.__inputs.push(new Socket('viewMatrix', CompositionType.Mat4, ComponentType.Float));
    this.__inputs.push(new Socket('position', CompositionType.Vec4, ComponentType.Float));
    this.__inputs.push(new Socket('normal', CompositionType.Vec3, ComponentType.Float));
    this.__inputs.push(new Socket('joint', CompositionType.Vec4, ComponentType.UnsignedInt));
    this.__inputs.push(new Socket('weight', CompositionType.Vec4, ComponentType.Float));
    this.__inputs.push(new Socket('isBillboard', CompositionType.Scalar, ComponentType.Bool, Scalar.fromCopyNumber(0)));

    this.__outputs.push(new Socket('outNormalMatrix', CompositionType.Mat3, ComponentType.Float));
    this.__outputs.push(new Socket('outPositionInWorld', CompositionType.Vec4, ComponentType.Float));
    this.__outputs.push(new Socket('outNormalInWorld', CompositionType.Vec3, ComponentType.Float));
  }

  /**
   * Gets the input socket for the world transformation matrix.
   * @returns The world matrix input socket
   */
  getSocketInputWorldMatrix() {
    return this.__inputs[0];
  }

  /**
   * Gets the input socket for the normal transformation matrix.
   * @returns The normal matrix input socket
   */
  getSocketInputNormalMatrix() {
    return this.__inputs[1];
  }

  /**
   * Gets the input socket for the view transformation matrix.
   * @returns The view matrix input socket
   */
  getSocketInputViewMatrix() {
    return this.__inputs[2];
  }

  /**
   * Gets the input socket for vertex position data.
   * @returns The position input socket
   */
  getSocketInputPosition() {
    return this.__inputs[3];
  }

  /**
   * Gets the input socket for vertex normal data.
   * @returns The normal input socket
   */
  getSocketInputNormal() {
    return this.__inputs[4];
  }

  /**
   * Gets the input socket for skeletal animation joint indices.
   * @returns The joint input socket
   */
  getSocketInputJoint() {
    return this.__inputs[5];
  }

  /**
   * Gets the input socket for skeletal animation joint weights.
   * @returns The weight input socket
   */
  getSocketInputWeight() {
    return this.__inputs[6];
  }

  /**
   * Gets the input socket for billboard rendering flag.
   * @returns The billboard flag input socket
   */
  getSocketInputIsBillboard() {
    return this.__inputs[7];
  }

  /**
   * Gets the output socket for the processed normal matrix.
   * @returns The normal matrix output socket
   */
  getSocketOutputNormalMatrix() {
    return this.__outputs[0];
  }

  /**
   * Gets the output socket for the transformed position in world space.
   * @returns The world position output socket
   */
  getSocketOutputPositionInWorld() {
    return this.__outputs[1];
  }

  /**
   * Gets the output socket for the transformed normal in world space.
   * @returns The world normal output socket
   */
  getSocketOutputNormalInWorld() {
    return this.__outputs[2];
  }

  /**
   * Generates shader code to call the geometry processing function.
   * Creates appropriate variable declarations and function calls for both GLSL and WGSL.
   *
   * @param engine - The engine instance
   * @param i - The index of the current shader node in the processing chain
   * @param shaderNode - The shader node instance being processed
   * @param functionName - The name of the function to call in the generated shader
   * @param varInputNames - Array of input variable names for each processing step
   * @param varOutputNames - Array of output variable names for each processing step
   * @returns The generated shader code string
   */
  makeCallStatement(
    engine: Engine,
    i: number,
    _shaderNode: AbstractShaderNode,
    functionName: string,
    varInputNames: string[][],
    varOutputNames: string[][]
  ): string {
    let str = '';
    let rowStr = '';
    if (varInputNames[i].length > 0 && varOutputNames[i].length > 0) {
      const dummyOutputVarDefines =
        engine.engineState.currentProcessApproach === ProcessApproach.WebGPU
          ? [
              `var dummyNormalMatrix_${i}: mat3x3<f32>;`,
              `var dummyPositionInWorld_${i}: vec4<f32>;`,
              `var dummyNormalInWorld_${i}: vec3<f32>;`,
            ]
          : [`mat3 dummyNormalMatrix_${i};`, `vec4 dummyPositionInWorld_${i};`, `vec3 dummyNormalInWorld_${i};`];

      const dummyOutputArguments = [`dummyNormalMatrix_${i}`, `dummyPositionInWorld_${i}`, `dummyNormalInWorld_${i}`];

      for (let k = 0; k < varOutputNames[i].length; k++) {
        const outputName = varOutputNames[i][k];
        if (outputName.indexOf('outNormalMatrix') >= 0) {
          dummyOutputVarDefines[0] = '';
          dummyOutputArguments[0] = outputName;
        } else if (outputName.indexOf('outPositionInWorld') >= 0) {
          dummyOutputVarDefines[1] = '';
          dummyOutputArguments[1] = outputName;
        } else if (outputName.indexOf('outNormalInWorld') >= 0) {
          dummyOutputVarDefines[2] = '';
          dummyOutputArguments[2] = outputName;
        }
      }

      if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
        for (let i = 0; i < dummyOutputArguments.length; i++) {
          dummyOutputArguments[i] = `&${dummyOutputArguments[i]}`;
        }
      }

      // Call node functions
      rowStr += dummyOutputVarDefines.join('\n');
      rowStr += `${functionName}(`;
      for (let k = 0; k < varInputNames[i].length; k++) {
        if (k !== 0) {
          rowStr += ', ';
        }
        const inputName = varInputNames[i][k];
        rowStr += inputName;
      }
      rowStr += `, ${dummyOutputArguments.join(', ')}`;
      rowStr += ');\n';
    }

    str += rowStr;

    return str;
  }
}
