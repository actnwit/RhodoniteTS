import Primitive from "./Primitive";
import { CompositionType } from "../definitions/CompositionType";
import { VertexAttribute } from "../definitions/VertexAttribute";
import { PrimitiveMode } from "../definitions/PrimitiveMode";
import { BufferUse } from "../definitions/BufferUse";
import MemoryManager from "../core/MemoryManager";
import { ComponentType } from "../definitions/ComponentType";
import Accessor from "../memory/Accessor";
import { ComponentTypeEnum, VertexAttributeEnum } from "../main";
import AccessorBase from "../memory/AccessorBase";
import Material from "../materials/Material";
import { Size } from "../../types/CommonTypes";
import RnObject from "../core/RnObject";

export default class Plane extends Primitive {
  constructor() {
    super();
  }

  generate({width, height, uSpan, vSpan, isUVRepeat = false, material}:
    {width: Size, height: Size, uSpan: Size, vSpan: Size, isUVRepeat: boolean, material?: Material})
  {
    var positions = [];

    for(let i=0; i<=vSpan; i++) {
      for(let j=0; j<=uSpan; j++) {
        positions.push((j/uSpan - 1/2)*width);
        positions.push(0);
        positions.push((i/vSpan - 1/2)*height);
      }
    }

    var indices = [];
    for(let i=0; i<vSpan; i++) {
      let degenerate_left_index = 0;
      let degenerate_right_index = 0;
      for(let j=0; j<=uSpan; j++) {
        indices.push(i*(uSpan+1)+j);
        indices.push((i+1)*(uSpan+1)+j);
        if (j === 0) {
          degenerate_left_index = (i + 1) * (uSpan+1) + j;
        } else if (j === uSpan) {
          degenerate_right_index = (i + 1) * (uSpan+1) + j;
        }
      }
      indices.push(degenerate_right_index);
      indices.push(degenerate_left_index);
    }

    var normals = [];
    for(let i=0; i<=vSpan; i++) {
      for(let j=0; j<=uSpan; j++) {
        normals.push(0);
        normals.push(1);
        normals.push(0);
      }
    }

    var texcoords = [];
    for(let i=0; i<=vSpan; i++) {
      for(let j=0; j<=uSpan; j++) {
        if (isUVRepeat) {
          texcoords.push(j);
          texcoords.push(i);
        } else {
          texcoords.push(j/uSpan);
          texcoords.push(i/vSpan);
        }
      }
    }

    // Check Size
    const attributeCompositionTypes = [CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec2];
    const attributeSemantics = [VertexAttribute.Position, VertexAttribute.Normal, VertexAttribute.Texcoord0];
    const primitiveMode = PrimitiveMode.TriangleStrip;
    const attributes = [new Float32Array(positions), new Float32Array(normals), new Float32Array(texcoords)];
    let sumOfAttributesByteSize = 0;
    attributes.forEach(attribute=>{
      sumOfAttributesByteSize += attribute.byteLength;
    });
    const indexSizeInByte = indices.length * 2;

    // Create Buffer
    const buffer = MemoryManager.getInstance().createBufferOnDemand(indexSizeInByte + sumOfAttributesByteSize, this);


    // Index Buffer
    const indicesBufferView = buffer.takeBufferView({byteLengthToNeed: indexSizeInByte /*byte*/, byteStride: 0, isAoS: false});
    const indicesAccessor = indicesBufferView.takeAccessor({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.UnsignedShort,
      count: indices.length
    });
    for (let i=0; i<indices.length; i++) {
      indicesAccessor!.setScalar(i, indices![i], {});
    }

    // VertexBuffer
    const attributesBufferView = buffer.takeBufferView({byteLengthToNeed: sumOfAttributesByteSize, byteStride: 0, isAoS: false});

    const attributeAccessors: Array<Accessor> = [];
    const attributeComponentTypes: Array<ComponentTypeEnum> = [];

    attributes.forEach((attribute, i)=>{
      attributeComponentTypes[i] = ComponentType.fromTypedArray(attributes[i]);
      const accessor:AccessorBase = attributesBufferView.takeAccessor({
        compositionType: attributeCompositionTypes[i],
        componentType: ComponentType.fromTypedArray(attributes[i]),
        count: attribute.byteLength / attributeCompositionTypes[i].getNumberOfComponents() / attributeComponentTypes[i].getSizeInBytes()
      });
      accessor.copyFromTypedArray(attribute);
      attributeAccessors.push(accessor);
    });

    const attributeMap: Map<VertexAttributeEnum, Accessor> = new Map();
    for (let i=0; i<attributeSemantics.length; i++) {
      attributeMap.set(attributeSemantics[i], attributeAccessors[i]);
    }

    this.setData(
      attributeMap,
      primitiveMode,
      material,
      indicesAccessor
    );
  }


}
