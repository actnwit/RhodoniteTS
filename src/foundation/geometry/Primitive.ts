import { PrimitiveMode, PrimitiveModeEnum} from '../definitions/PrimitiveMode';
import { VertexAttributeEnum, VertexAttribute } from '../definitions/VertexAttribute';
import Accessor from '../memory/Accessor';
import RnObject from '../core/Object';
import BufferView from '../memory/BufferView';
import { ComponentTypeEnum, ComponentType } from '../definitions/ComponentType';
import MemoryManager from '../core/MemoryManager';
import { CompositionType, CompositionTypeEnum } from '../definitions/CompositionType';
import AccessorBase from '../memory/AccessorBase';
import { BufferUse } from '../definitions/BufferUse';
import Material from '../materials/Material';

export default class Primitive extends RnObject {
  private __mode: PrimitiveModeEnum;
  private __attributes: Array<Accessor>;
  public  material?: Material;
  private __attributeSemantics: Array<VertexAttributeEnum>;
  private __indices?: Accessor;
  private static __primitiveCount: Count = 0;
  private __primitiveUid: PrimitiveUID = -1; // start ID from zero
  private static __headerAccessor?: Accessor;

  constructor(
    attributeAccessors: Array<Accessor>,
    attributeSemantics: Array<VertexAttributeEnum>,
    mode: PrimitiveModeEnum,
    material?: Material,
    indicesAccessor?: Accessor,
    )
  {
    super();

    this.__indices = indicesAccessor;
    this.__attributes = attributeAccessors;
    this.__attributeSemantics = attributeSemantics;
    this.material = material;
    this.__mode = mode;

    this.__primitiveUid = Primitive.__primitiveCount++;

    // if (Primitive.__headerAccessor == null) {
    //   // primitive 0
    //   // prim0.indices.byteOffset, prim0.indices.componentSizeInByte, prim0.indices.indicesLength, null
    //   //   prim0.attrb0.byteOffset, prim0.attrib0.byteStride, prim0.attrib0.compopisionN, prim0.attrib0.componentSizeInByte
    //   //   prim0.attrb1.byteOffset, prim0.attrib1.byteStride, prim0.attrib1.compopisionN, prim0.attrib1.componentSizeInByte
    //   //   ...
    //   //   prim0.attrb7.byteOffset, prim0.attrib7.byteStride, prim0.attrib7.compopisionN, prim0.attrib7.componentSizeInByte
    //   // primitive 1
    //   // prim1.indices.byteOffset, prim1.indices.componentSizeInByte, prim0.indices.indicesLength, null
    //   //   prim1.attrb0.byteOffset, prim1.attrib0.byteStride, prim1.attrib0.compopisionN, prim1.attrib0.componentSizeInByte
    //   //   prim1.attrb1.byteOffset, prim1.attrib1.byteStride, prim1.attrib1.compopisionN, prim1.attrib1.componentSizeInByte
    //   //   ...
    //   //   prim1.attrb7.byteOffset, prim1.attrib7.byteStride, prim1.attrib7.compopisionN, prim1.attrib7.componentSizeInByte

    //   const buffer = MemoryManager.getInstance().getBuffer(BufferUse.UBOGeneric);
    //   const bufferView = buffer.takeBufferView({byteLengthToNeed: ((1*4) + (8*4)) * 4/*byte*/ * Primitive.maxPrimitiveCount, byteStride: 64, isAoS:false });
    //   Primitive.__headerAccessor = bufferView.takeAccessor(
    //     {compositionType: CompositionType.Vec4, componentType: ComponentType.Float, count: 9 * Primitive.maxPrimitiveCount})
    // }

    // const attributeNumOfPrimitive = 1/*indices*/ + 8/*vertexAttributes*/;

    // if (this.indicesAccessor != null) {
    //   Primitive.__headerAccessor.setVec4(attributeNumOfPrimitive * this.__primitiveUid + 0 /* 0 means indices */,
    //     this.indicesAccessor.byteOffsetInBuffer, this.indicesAccessor.componentSizeInBytes, this.indicesAccessor.byteLength / this.indicesAccessor.componentSizeInBytes, -1 );
    // } else {
    //   Primitive.__headerAccessor.setVec4(attributeNumOfPrimitive * this.__primitiveUid + 0 /* 0 means indices */, -1, -1, -1, -1 );
    // }

    // this.attributeAccessors.forEach((attributeAccessor, i)=>{
    //   Primitive.__headerAccessor!.setVec4(attributeNumOfPrimitive * this.__primitiveUid + i,
    //     attributeAccessor.byteOffsetInBuffer, attributeAccessor.byteStride, attributeAccessor.numberOfComponents, attributeAccessor.componentSizeInBytes);

    // });

  }
  static get maxPrimitiveCount() {
    return 500;
  }

  static get headerAccessor() {
    return this.__headerAccessor;
  }

  static createPrimitive(
    {indices, attributeCompositionTypes, attributeSemantics, attributes, material, primitiveMode} :
    {
      indices?: TypedArray,
      attributeCompositionTypes: Array<CompositionTypeEnum>,
      attributeSemantics: Array<VertexAttributeEnum>,
      attributes: Array<TypedArray>,
      primitiveMode: PrimitiveModeEnum,
      material?: Material
    })
  {

    const buffer = MemoryManager.getInstance().getBuffer(BufferUse.GPUVertexData);

    let indicesComponentType;
    let indicesBufferView;
    let indicesAccessor;
    if (indices != null) {
      indicesComponentType = ComponentType.fromTypedArray(indices);
      indicesBufferView = buffer.takeBufferView({byteLengthToNeed: indices.byteLength, byteStride: 0, isAoS: false});
      indicesAccessor = indicesBufferView.takeAccessor({
        compositionType: CompositionType.Scalar,
        componentType: indicesComponentType,
        count: indices.byteLength / indicesComponentType.getSizeInBytes()
      });
      // copy indices
      for (let i=0; i<indices!.byteLength/indicesAccessor!.componentSizeInBytes; i++) {
        indicesAccessor!.setScalar(i, indices![i], {});
      }
    }



    let sumOfAttributesByteSize = 0;
    attributes.forEach(attribute=>{
      sumOfAttributesByteSize += attribute.byteLength;
    });
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

    return new Primitive(
      attributeAccessors,
      attributeSemantics,
      primitiveMode,
      material,
      indicesAccessor,
    );
  }

  get indicesAccessor(): Accessor | undefined {
    return this.__indices;
  }

  getVertexCountAsIndicesBased() {
    if (this.indicesAccessor) {
      return this.indicesAccessor.elementCount;
    } else {
      return this.getVertexCountAsVerticesBased();
    }
  }

  getVertexCountAsVerticesBased() {
    const positionIdx = this.__attributeSemantics.indexOf(VertexAttribute.Position);
    const positionAccessor = this.__attributes[positionIdx];
    return positionAccessor.elementCount;
  }

  getTriangleCountAsIndicesBased() {
    if (this.indicesAccessor) {
      switch (this.__mode) {
        case PrimitiveMode.Triangles:
          return this.indicesAccessor.elementCount / 3;
        case PrimitiveMode.TriangleStrip:
          return this.indicesAccessor.elementCount - 2;
        case PrimitiveMode.TriangleFan:
          return this.indicesAccessor.elementCount - 2;
        default:
          return 0;
      }
    } else {
      return this.getTriangleCountAsVerticesBased();
    }
  }

  getTriangleCountAsVerticesBased() {
    const positionIdx = this.__attributeSemantics.indexOf(VertexAttribute.Position);
    const positionAccessor = this.__attributes[positionIdx];
    switch (this.__mode) {
      case PrimitiveMode.Triangles:
        return positionAccessor.elementCount / 3;
      case PrimitiveMode.TriangleStrip:
        return positionAccessor.elementCount - 2;
      case PrimitiveMode.TriangleFan:
        return positionAccessor.elementCount - 2;
      default:
        return 0;
    }
  }

  hasIndices() {
    return this.__indices != null;
  }

  get attributeAccessors(): Array<Accessor> {
    return this.__attributes.concat();
  }

  get attributeSemantics(): Array<VertexAttributeEnum> {
    return this.__attributeSemantics.concat();
  }

  get attributeCompositionTypes(): Array<CompositionTypeEnum> {
    return this.__attributes.map(attribute=>{return attribute.compositionType});
  }

  get attributeComponentTypes(): Array<ComponentTypeEnum> {
    return this.__attributes.map(attribute=>{return attribute.componentType});
  }

  get primitiveMode(): PrimitiveModeEnum {
    return this.__mode;
  }

  get primitiveUid(): PrimitiveUID {
    return this.__primitiveUid;
  }

}
