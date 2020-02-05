import Primitive from "./Primitive";
import { CompositionType } from "../definitions/CompositionType";
import { VertexAttribute, VertexAttributeEnum } from "../definitions/VertexAttribute";
import { PrimitiveMode } from "../definitions/PrimitiveMode";
import { BufferUse } from "../definitions/BufferUse";
import MemoryManager from "../core/MemoryManager";
import { ComponentType, ComponentTypeEnum } from "../definitions/ComponentType";
import Accessor from "../memory/Accessor";
import AccessorBase from "../memory/AccessorBase";
import Material from "../materials/Material";
import Vector3 from "../math/Vector3";
import { Size } from "../../types/CommonTypes";

export default class Sphere extends Primitive {
  constructor() {
    super();
  }

  generate({radius, widthSegments, heightSegments, material}:
    {radius: number, widthSegments: Size, heightSegments: Size, material?: Material})
  {
    var positions = [];
    var texcoords = [];
    var normals = [];

    let shiftValue = 0.00001; // for avoid Singular point
    for (var latNumber = 0; latNumber <= heightSegments; latNumber++) {
      var theta = latNumber * Math.PI / heightSegments + shiftValue;
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);

      for (var longNumber = 0; longNumber <= widthSegments; longNumber++) {
        var phi = longNumber * 2 * Math.PI / widthSegments;
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);

        var x = radius * cosPhi * sinTheta;
        var y = radius * cosTheta;
        var z = radius * sinPhi * sinTheta;
        var position = new Vector3(x, y, z);
        positions.push(x);
        positions.push(y);
        positions.push(z);
        var u = 1 - (longNumber / widthSegments);
        var v = latNumber / heightSegments;
        texcoords.push(u);
        texcoords.push(v);
        const normal = Vector3.normalize(position);
        normals.push(normal.x);
        normals.push(normal.y);
        normals.push(normal.z);
      }
    }

    // first    first+1
    //    +-------+
    //    |     / |
    //    |   /   |
    //    | /     |
    //    +-------+
    // second   second+1
    //
    var indices = [];
    for (var latNumber = 0; latNumber < heightSegments; latNumber++) {
      for (var longNumber = 0; longNumber < widthSegments; longNumber++) {
        var first = (latNumber * (widthSegments + 1)) + longNumber;
        var second = first + widthSegments + 1;

        indices.push(first + 1);
        indices.push(second);
        indices.push(first);

        indices.push(first + 1);
        indices.push(second + 1);
        indices.push(second);
      }
    }

    const attributeCompositionTypes = [CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec2];
    const attributeSemantics = [VertexAttribute.Position, VertexAttribute.Normal, VertexAttribute.Texcoord0];
    const primitiveMode = PrimitiveMode.Triangles;
    const attributes = [new Float32Array(positions), new Float32Array(normals), new Float32Array(texcoords)];
    let sumOfAttributesByteSize = 0;
    attributes.forEach(attribute=>{
      sumOfAttributesByteSize += attribute.byteLength;
    });
    const indexSizeInByte = indices.length * 2;

    const buffer = MemoryManager.getInstance().createBufferOnDemand(indexSizeInByte + sumOfAttributesByteSize, this);

    const indicesBufferView = buffer.takeBufferView({byteLengthToNeed: indexSizeInByte /*byte*/, byteStride: 0, isAoS: false});
    const indicesAccessor = indicesBufferView.takeAccessor({
      compositionType: CompositionType.Scalar,
      componentType: ComponentType.UnsignedShort,
      count: indices.length
    });
    for (let i=0; i<indices.length; i++) {
      indicesAccessor!.setScalar(i, indices![i], {});
    }



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
