import AttributeNormalShaderityObjectGLSL_ from '../../../webgl/shaderity_shaders/nodes/AttributeColor.vert';
import AttributeNormalShaderityObjectWGSL_ from '../../../webgpu/shaderity_shaders/nodes/AttributeColor.vert.wgsl';
import { ComponentType } from '../../definitions/ComponentType';
import { CompositionType } from '../../definitions/CompositionType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';

// Shaders of a backend excluded at build time (see src/backendFlags.d.ts) are dropped by the bundler.
const AttributeNormalShaderityObjectGLSL =
  typeof __RN_WEBGL__ === 'undefined' || __RN_WEBGL__ ? AttributeNormalShaderityObjectGLSL_ : undefined;
const AttributeNormalShaderityObjectWGSL =
  typeof __RN_WEBGPU__ === 'undefined' || __RN_WEBGPU__ ? AttributeNormalShaderityObjectWGSL_ : undefined;

/**
 * A shader node that reads vertex color attributes from the mesh geometry.
 * This node provides access to per-vertex color data in the shader pipeline,
 * allowing for vertex-based coloring effects and material variations.
 *
 * The node outputs a Vec4 color value containing RGBA components that can be
 * used in vertex or fragment shaders for rendering calculations.
 */
export class AttributeColorShaderNode extends AbstractShaderNode {
  /**
   * Creates a new AttributeColorShaderNode instance.
   * Initializes the node with vertex color attribute shader code for both
   * WebGL (GLSL) and WebGPU (WGSL) backends, and configures the output
   * to provide a Vec4 color value.
   */
  constructor() {
    super('attributeColor', {
      codeGLSL: AttributeNormalShaderityObjectGLSL.code,
      codeWGSL: AttributeNormalShaderityObjectWGSL.code,
    });

    this.setShaderStage('Vertex');

    this.__outputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'outValue',
    });
  }
}
