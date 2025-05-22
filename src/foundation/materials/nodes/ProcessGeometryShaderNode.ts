import { ComponentType } from "../../definitions/ComponentType";
import { CompositionType } from "../../definitions/CompositionType";
import { AbstractShaderNode } from "../core/AbstractShaderNode";
import { Socket } from "../core/Socket";

export class ProcessGeometryNode extends AbstractShaderNode {
  constructor() {
    super('processGeometry', {
      codeGLSL: '/* shaderity: @{processGeometry} */',
      codeWGSL: '/* shaderity: @{processGeometry} */',
    });

    this.__inputs.push(new Socket('worldMatrix', CompositionType.Mat4, ComponentType.Float));
    this.__inputs.push(new Socket('normalMatrix', CompositionType.Mat3, ComponentType.Float));
    this.__inputs.push(new Socket('viewMatrix', CompositionType.Mat4, ComponentType.Float));
    this.__inputs.push(new Socket('position', CompositionType.Vec3, ComponentType.Float));
    this.__inputs.push(new Socket('normal', CompositionType.Vec3, ComponentType.Float));
    this.__inputs.push(new Socket('joint', CompositionType.Vec4, ComponentType.Float));
    this.__inputs.push(new Socket('weight', CompositionType.Vec4, ComponentType.Float));
    this.__inputs.push(new Socket('isBillboard', CompositionType.Scalar, ComponentType.Bool));

    this.__outputs.push(new Socket('outNormalMatrix', CompositionType.Mat3, ComponentType.Float));
    this.__outputs.push(new Socket('outPositionInWorld', CompositionType.Vec4, ComponentType.Float));
    this.__outputs.push(new Socket('outNormalInWorld', CompositionType.Vec3, ComponentType.Float));
  }

  getSocketInputWorldMatrix() {
    return this.__inputs[0];
  }

  getSocketInputNormalMatrix() {
    return this.__inputs[1];
  }

  getSocketInputViewMatrix() {
    return this.__inputs[2];
  }

  getSocketInputPosition() {
    return this.__inputs[3];
  }

  getSocketInputNormal() {
    return this.__inputs[4];
  }

  getSocketInputJoint() {
    return this.__inputs[5];
  }

  getSocketInputWeight() {
    return this.__inputs[6];
  }

  getSocketInputIsBillboard() {
    return this.__inputs[7];
  }

  getSocketOutputNormalMatrix() {
    return this.__outputs[0];
  }

  getSocketOutputPositionInWorld() {
    return this.__outputs[1];
  }

  getSocketOutputNormalInWorld() {
    return this.__outputs[2];
  }

}
