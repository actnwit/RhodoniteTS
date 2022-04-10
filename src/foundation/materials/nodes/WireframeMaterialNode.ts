import {CompositionType} from '../../definitions/CompositionType';
import {ComponentType} from '../../definitions/ComponentType';
import { AbstractShaderNode } from '../core/AbstractShaderNode';
import WireframeShaderityObject from '../../../webgl/shaderity_shaders/nodes/Wireframe.glsl';

export class WireframeMaterialNode extends AbstractShaderNode {
  constructor() {
    super('wireframe', WireframeShaderityObject.code);

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
