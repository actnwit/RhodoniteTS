import {EnumClass, EnumIO, _from, _fromString} from '../misc/EnumIO';
import {
  Array1,
  Array1to4,
  Array2,
  Array3,
  Array4,
  Count,
  Index,
} from '../../types/CommonTypes';
import {RnException} from '../misc/Result';

type ComponentChar = 'X' | 'Y' | 'Z' | 'W';

// prettier-ignore
export type VertexAttributeTypeName =
  'UNKNOWN' |
  'POSITION'|
  'NORMAL' |
  'TANGENT' |
  'TEXCOORD_0' |
  'TEXCOORD_1' |
  'COLOR_0' |
  'JOINTS_0' |
  'WEIGHTS_0' |
  'INSTANCE' |
  'FACE_NORMAL' |
  'BARY_CENTRIC_COORD';

export type VertexAttributeComponent =
  `${VertexAttributeTypeName}.${ComponentChar}`;

// prettier-ignore
export type VertexAttributeSemantic =
  Array1to4<`${VertexAttributeTypeName}.${ComponentChar}`>;

export type VertexAttributeSemanticArray1 =
  Array1<`${VertexAttributeTypeName}.${ComponentChar}`>;

export type VertexAttributeSemanticArray2 =
  Array2<`${VertexAttributeTypeName}.${ComponentChar}`>;

export type VertexAttributeSemanticArray3 =
  Array3<`${VertexAttributeTypeName}.${ComponentChar}`>;

export type VertexAttributeSemanticArray4 =
  Array4<`${VertexAttributeTypeName}.${ComponentChar}`>;

// prettier-ignore
export type VertexAttributeSemanticsJoinedString =
  `${string}.${ComponentChar}` |
  `${string}.${ComponentChar},${string}.${ComponentChar}` |
  `${string}.${ComponentChar},${string}.${ComponentChar},${string}.${ComponentChar}` |
  `${string}.${ComponentChar},${string}.${ComponentChar},${string}.${ComponentChar},${string}.${ComponentChar}`;

export interface VertexAttributeEnum extends EnumIO {
  getAttributeSlot(): Index;
  shaderStr: string;
  X: VertexAttributeComponent;
  Y: VertexAttributeComponent;
  Z: VertexAttributeComponent;
  W: VertexAttributeComponent;
  XY: Array2<VertexAttributeComponent>;
  XYZ: Array3<VertexAttributeComponent>;
  XYZW: Array4<VertexAttributeComponent>;
  XYjoined: VertexAttributeSemanticsJoinedString;
  XYZjoined: VertexAttributeSemanticsJoinedString;
  XYZWjoined: VertexAttributeSemanticsJoinedString;
}

type VertexAttributeDescriptor = {
  str: VertexAttributeTypeName;
  shaderStr: string;
  attributeSlot: Index;
  gltfComponentN: Count;
};
export class VertexAttributeClass
  extends EnumClass
  implements VertexAttributeEnum
{
  private static __indexCount = -1;
  private __attributeSlot: Index;
  private __shaderStr: string;
  private __gltfComponentN: Count;
  private constructor({
    str,
    shaderStr,
    attributeSlot,
    gltfComponentN,
  }: VertexAttributeDescriptor) {
    super({index: VertexAttributeClass.__indexCount++, str});
    this.__attributeSlot = attributeSlot;
    this.__shaderStr = shaderStr;
    this.__gltfComponentN = gltfComponentN;
  }

  getAttributeSlot(): Index {
    return this.__attributeSlot;
  }

  get shaderStr() {
    return this.__shaderStr;
  }

  get attributeTypeName(): VertexAttributeTypeName {
    return this.str as VertexAttributeTypeName;
  }

  _setShaderStr(str: string) {
    this.__shaderStr = this.__shaderStr + str;
  }

  get X(): VertexAttributeComponent {
    return `${this.attributeTypeName}.X`;
  }
  get Y(): VertexAttributeComponent {
    return `${this.attributeTypeName}.Y`;
  }
  get Z(): VertexAttributeComponent {
    return `${this.attributeTypeName}.Z`;
  }
  get W(): VertexAttributeComponent {
    return `${this.attributeTypeName}.W`;
  }
  get XY(): Array2<VertexAttributeComponent> {
    return [`${this.attributeTypeName}.X`, `${this.attributeTypeName}.Y`];
  }
  get XYZ(): Array3<VertexAttributeComponent> {
    return [
      `${this.attributeTypeName}.X`,
      `${this.attributeTypeName}.Y`,
      `${this.attributeTypeName}.Z`,
    ];
  }
  get XYZW(): Array4<VertexAttributeComponent> {
    return [
      `${this.attributeTypeName}.X`,
      `${this.attributeTypeName}.Y`,
      `${this.attributeTypeName}.Z`,
      `${this.attributeTypeName}.W`,
    ];
  }
  get XYjoined(): VertexAttributeSemanticsJoinedString {
    return `${this.attributeTypeName}.X,${this.attributeTypeName}.Y`;
  }
  get XYZjoined(): VertexAttributeSemanticsJoinedString {
    return `${this.attributeTypeName}.X,${this.attributeTypeName}.Y,${this.attributeTypeName}.Z`;
  }
  get XYZWjoined(): VertexAttributeSemanticsJoinedString {
    return `${this.attributeTypeName}.X,${this.attributeTypeName}.Y,${this.attributeTypeName}.Z,${this.attributeTypeName}.W`;
  }

  getVertexAttributeComponentsAsGltf(): Array1to4<VertexAttributeComponent> {
    if (this.__gltfComponentN === 1) {
      return [this.X];
    } else if (this.__gltfComponentN === 2) {
      return this.XY;
    } else if (this.__gltfComponentN === 3) {
      return this.XYZ;
    } else if (this.__gltfComponentN === 4) {
      return this.XYZW;
    } else {
      throw new RnException({
        message: 'Invalid gltf component number',
        error: this.__gltfComponentN,
      });
    }
  }

  static __createVertexAttributeClass(desc: VertexAttributeDescriptor) {
    return new VertexAttributeClass(desc);
  }
}

const Unknown: VertexAttributeEnum =
  VertexAttributeClass.__createVertexAttributeClass({
    str: 'UNKNOWN',
    shaderStr: 'a_unknown',
    attributeSlot: -1,
    gltfComponentN: 0,
  });
const Position: VertexAttributeEnum =
  VertexAttributeClass.__createVertexAttributeClass({
    str: 'POSITION',
    shaderStr: 'a_position',
    attributeSlot: 0,
    gltfComponentN: 3,
  });
const Normal: VertexAttributeEnum =
  VertexAttributeClass.__createVertexAttributeClass({
    str: 'NORMAL',
    shaderStr: 'a_normal',
    attributeSlot: 1,
    gltfComponentN: 3,
  });
const Tangent: VertexAttributeEnum =
  VertexAttributeClass.__createVertexAttributeClass({
    str: 'TANGENT',
    shaderStr: 'a_tangent',
    attributeSlot: 2,
    gltfComponentN: 3,
  });
const Texcoord0: VertexAttributeEnum =
  VertexAttributeClass.__createVertexAttributeClass({
    str: 'TEXCOORD_0',
    shaderStr: 'a_texcoord_0',
    attributeSlot: 3,
    gltfComponentN: 2,
  });
const Texcoord1: VertexAttributeEnum =
  VertexAttributeClass.__createVertexAttributeClass({
    str: 'TEXCOORD_1',
    shaderStr: 'a_texcoord_1',
    attributeSlot: 4,
    gltfComponentN: 2,
  });
const Color0: VertexAttributeEnum =
  VertexAttributeClass.__createVertexAttributeClass({
    str: 'COLOR_0',
    shaderStr: 'a_color_0',
    attributeSlot: 5,
    gltfComponentN: 4,
  });
const Joints0: VertexAttributeEnum =
  VertexAttributeClass.__createVertexAttributeClass({
    str: 'JOINTS_0',
    shaderStr: 'a_joints_0',
    attributeSlot: 6,
    gltfComponentN: 4,
  });
const Weights0: VertexAttributeEnum =
  VertexAttributeClass.__createVertexAttributeClass({
    str: 'WEIGHTS_0',
    shaderStr: 'a_weights_0',
    attributeSlot: 7,
    gltfComponentN: 4,
  });
const Instance: VertexAttributeEnum =
  VertexAttributeClass.__createVertexAttributeClass({
    str: 'INSTANCE',
    shaderStr: 'a_instance',
    attributeSlot: 8,
    gltfComponentN: 1,
  });
const FaceNormal: VertexAttributeEnum =
  VertexAttributeClass.__createVertexAttributeClass({
    str: 'FACE_NORMAL',
    shaderStr: 'a_faceNormal',
    attributeSlot: 9,
    gltfComponentN: 3,
  });
const BaryCentricCoord: VertexAttributeEnum =
  VertexAttributeClass.__createVertexAttributeClass({
    str: 'BARY_CENTRIC_COORD',
    shaderStr: 'a_baryCentricCoord',
    attributeSlot: 10,
    gltfComponentN: 3,
  });

const typeList = [
  Unknown, // -1
  Position, // 0
  Normal,
  Tangent,
  Texcoord0,
  Texcoord1,
  Color0,
  Joints0,
  Weights0,
  Instance,
  FaceNormal,
  BaryCentricCoord,
];

const AttributeTypeNumber = typeList.length - 1;

function isInstanceOfVertexAttributeClass(
  obj: unknown
): obj is VertexAttributeClass {
  return obj instanceof VertexAttributeClass;
}

function getVertexAttributeSemanticJoinedString(
  components: VertexAttributeSemantic
): VertexAttributeSemanticsJoinedString {
  return components.join(',') as VertexAttributeSemanticsJoinedString;
}

function from(index: number): VertexAttributeEnum {
  return _from({typeList, index}) as VertexAttributeEnum;
}

function fromString(str: string): VertexAttributeEnum {
  let newStr = str;
  if (str === 'COLOR') {
    newStr = 'COLOR_0';
  } else if (str === 'TEXCOORD') {
    newStr = 'TEXCOORD_0';
  } else if (str === 'JOINTS') {
    newStr = 'JOINTS_0';
  } else if (str === 'WEIGHTS') {
    newStr = 'WEIGHTS_0';
  }
  return _fromString({typeList, str: newStr}) as VertexAttributeEnum;
}

type Gltf2VertexAttributeEnums =
  | typeof Position
  | typeof Color0
  | typeof Normal
  | typeof Tangent
  | typeof Texcoord0
  | typeof Texcoord1
  | typeof Joints0
  | typeof Weights0;

function toVertexAttributeSemanticJoinedStringAsGltfStyle(
  attribute: Gltf2VertexAttributeEnums
): VertexAttributeSemanticsJoinedString {
  switch (attribute) {
    case Position:
      return attribute.XYZjoined;
    case Color0:
      return attribute.XYZjoined;
    case Normal:
      return attribute.XYZjoined;
    case Tangent:
      return attribute.XYZjoined;
    case Texcoord0:
      return attribute.XYjoined;
    case Texcoord1:
      return attribute.XYjoined;
    case Joints0:
      return attribute.XYZWjoined;
    case Weights0:
      return attribute.XYZWjoined;
    case Instance:
      return attribute.X;
    case FaceNormal:
      return attribute.XYZWjoined;
    case BaryCentricCoord:
      return attribute.XYZWjoined;
    default:
      throw new Error('Invalied glTF VertexAttributeEnum');
  }
}

function toAttributeSlotFromJoinedString(
  str: VertexAttributeSemanticsJoinedString
): Index {
  switch (str) {
    case Position.XYZjoined:
      return Position.getAttributeSlot();
    case Color0.XYZjoined:
      return Color0.getAttributeSlot();
    case Normal.XYZjoined:
      return Normal.getAttributeSlot();
    case Tangent.XYZjoined:
      return Tangent.getAttributeSlot();
    case Texcoord0.XYjoined:
      return Texcoord0.getAttributeSlot();
    case Texcoord1.XYjoined:
      return Texcoord1.getAttributeSlot();
    case Joints0.XYZWjoined:
      return Joints0.getAttributeSlot();
    case Weights0.XYZWjoined:
      return Weights0.getAttributeSlot();
    case Instance.X:
      return Instance.getAttributeSlot();
    case FaceNormal.XYZjoined:
      return FaceNormal.getAttributeSlot();
    case BaryCentricCoord.XYZjoined:
      return BaryCentricCoord.getAttributeSlot();
    default:
      throw new Error('Invalied glTF VertexAttributeEnum');
  }
}

export const VertexAttribute = Object.freeze({
  Unknown,
  Position,
  Normal,
  Tangent,
  Texcoord0,
  Texcoord1,
  Color0,
  Joints0,
  Weights0,
  Instance,
  FaceNormal,
  BaryCentricCoord,
  AttributeTypeNumber,
  isInstanceOfVertexAttributeClass,
  getVertexAttributeSemanticJoinedString,
  toVertexAttributeSemanticJoinedStringAsGltfStyle,
  toAttributeSlotFromJoinedString,
  from,
  fromString,
});
