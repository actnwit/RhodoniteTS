import ProjectionMatrixShaderityObjectGLSL from '../../../webgl/shaderity_shaders/nodes/ProjectionMatrix.vert';
import ProjectionMatrixShaderityObjectWGSL from '../../../webgpu/shaderity_shaders/nodes/ProjectionMatrix.vert.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

/**
 * A shader node that provides access to the projection matrix in shaders.
 * This node outputs a 4x4 projection matrix that can be used for transforming
 * vertices from view space to clip space in the vertex shader.
 *
 * @extends AbstractShaderNode
 */
export class ProjectionMatrixShaderNode extends AbstractShaderNode {
  /**
   * Creates a new ProjectionMatrixShaderNode instance.
   * Initializes the shader node with projection matrix shader code for both
   * OpenGL (GLSL) and WebGPU (WGSL) backends, and configures the output
   * to provide a 4x4 float matrix.
   */
  constructor() {
    super('projectionMatrix', {
      codeGLSL: ProjectionMatrixShaderityObjectGLSL.code,
      codeWGSL: ProjectionMatrixShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Mat4,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
