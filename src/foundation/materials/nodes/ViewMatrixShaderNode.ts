import ViewMatrixShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/ViewMatrix.vert';
import ViewMatrixShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/ViewMatrix.vert.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

/**
 * A shader node that provides view matrix functionality for transforming world coordinates to camera space.
 * This node outputs a 4x4 matrix that represents the view transformation matrix used in vertex shaders.
 * The view matrix transforms vertices from world space to camera/eye space coordinates.
 */
export class ViewMatrixShaderNode extends AbstractShaderNode {
  /**
   * Creates a new ViewMatrixShaderNode instance.
   * Initializes the shader node with view matrix shader code for both GLSL and WGSL,
   * sets it to operate in the vertex shader stage, and configures the output as a Mat4 float matrix.
   */
  constructor() {
    super('viewMatrix', {
      codeGLSL: ViewMatrixShaderityObjectGLSL.code,
      codeWGSL: ViewMatrixShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
