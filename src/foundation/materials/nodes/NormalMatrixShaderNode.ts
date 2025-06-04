import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import NormalMatrixShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/NormalMatrix.vert';
import NormalMatrixShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/NormalMatrix.vert.wgsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

/**
 * A shader node that provides access to the normal matrix for transforming normal vectors
 * from local space to world space.
 *
 * The normal matrix is derived from the inverse transpose of the upper-left 3x3 portion
 * of the model matrix (world matrix). It ensures that normal vectors remain perpendicular
 * to surfaces after non-uniform scaling transformations. This matrix is essential for
 * proper lighting calculations in 3D rendering.
 *
 * The node operates in the vertex shader stage and supports both WebGL (GLSL) and
 * WebGPU (WGSL) rendering backends.
 *
 * @example
 * ```typescript
 * const normalMatrixNode = new NormalMatrixShaderNode();
 * // Connect to other shader nodes that require normal transformation
 * const normalMatrixOutput = normalMatrixNode.getOutput('outValue');
 * ```
 */
export class NormalMatrixShaderNode extends AbstractShaderNode {
  /**
   * Creates a new NormalMatrixShaderNode instance.
   *
   * Initializes the shader node with vertex stage shader code for both GLSL and WGSL,
   * and sets up a Mat3 float output socket for the normal transformation matrix.
   * The output matrix can be used to transform normal vectors from local space to world space
   * while preserving their geometric properties under non-uniform transformations.
   *
   * The node automatically retrieves the normal matrix from the rendering system's
   * uniform buffer based on the current instance ID.
   */
  constructor() {
    super('normalMatrix', {
      codeGLSL: NormalMatrixShaderityObjectGLSL.code,
      codeWGSL: NormalMatrixShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Mat3,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
