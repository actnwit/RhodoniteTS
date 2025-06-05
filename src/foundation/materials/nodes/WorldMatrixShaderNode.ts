import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import WorldMatrixShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/WorldMatrix.vert';
import WorldMatrixShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/WorldMatrix.vert.wgsl';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

/**
 * A shader node that provides access to the world transformation matrix.
 * This node outputs a 4x4 matrix representing the object's world space transformation,
 * which transforms vertices from object space to world space coordinates.
 *
 * The world matrix is essential for positioning, rotating, and scaling objects
 * within the 3D world coordinate system.
 */
export class WorldMatrixShaderNode extends AbstractShaderNode {
  /**
   * Creates a new WorldMatrixShaderNode instance.
   *
   * Initializes the shader node with both GLSL and WGSL code for cross-platform compatibility.
   * Sets up the output as a 4x4 float matrix and configures the node for vertex shader stage usage.
   *
   * @remarks
   * This node is specifically designed for vertex shader operations where world transformation
   * is required. The output matrix can be used to transform vertex positions, normals, or
   * other geometric data from object space to world space.
   */
  constructor() {
    super('worldMatrix', {
      codeGLSL: WorldMatrixShaderityObjectGLSL.code,
      codeWGSL: WorldMatrixShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
