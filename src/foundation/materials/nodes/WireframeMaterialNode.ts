import { CompositionType } from '../../definitions/CompositionType';
import { ComponentType } from '../../definitions/ComponentType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import WireframeShaderityObject from '../../../webgl/shaderity_shaders/nodes/Wireframe.glsl';

/**
 * A material node that applies wireframe rendering effects to geometry.
 * This node takes an existing fragment color and a wireframe color as inputs,
 * and outputs a combined color that renders the wireframe effect.
 */
export class WireframeMaterialNode extends AbstractShaderNode {
  /**
   * Creates a new WireframeMaterialNode instance.
   * Sets up the shader node with wireframe GLSL code and defines input/output parameters:
   * - Inputs: existingFragColor (Vec4), wireframeColor (Vec4)
   * - Output: outColor (Vec4)
   */
  constructor() {
    super('wireframe', {
      codeGLSL: WireframeShaderityObject.code,
    });

    // Input
    this.__inputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'existingFragColor',
    });

    this.__inputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'wireframeColor',
    });

    // Output
    this.__outputs.push({
      compositionType: CompositionType.Vec4,
      componentType: ComponentType.Float,
      name: 'outColor',
    });
  }
}
