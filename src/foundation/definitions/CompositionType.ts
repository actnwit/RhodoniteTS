import type {
  Count,
  IndexOf16Bytes,
  SquareMatrixComponentN,
  VectorAndSquareMatrixComponentN,
  VectorComponentN,
} from '../../types/CommonTypes';
import type { Gltf2AccessorCompositionTypeString } from '../../types/glTF2';
import { EnumClass, type EnumIO, _from, _fromString } from '../misc/EnumIO';
import { Logger } from '../misc/Logger';
import type { ComponentTypeEnum } from './ComponentType';

export interface CompositionTypeEnum extends EnumIO {
  webgpu: string;
  wgsl: string;
  getNumberOfComponents(): Count;
  getGlslStr(componentType: ComponentTypeEnum): string;
  getGlslInitialValue(componentType: ComponentTypeEnum): string;
  toWGSLType(componentType: ComponentTypeEnum): string;
  getWgslInitialValue(componentType: ComponentTypeEnum): string;
  getVec4SizeOfProperty(): IndexOf16Bytes;
}

class CompositionTypeClass<TypeName extends string> extends EnumClass implements CompositionTypeEnum {
  readonly __numberOfComponents: number;
  readonly __glslStr: string;
  readonly __hlslStr: string;
  readonly __webgpuStr: string;
  readonly __wgslStr: string;
  readonly __isArray: boolean;
  readonly __vec4SizeOfProperty: IndexOf16Bytes;
  readonly __dummyStr: TypeName;
  constructor({
    index,
    str,
    glslStr,
    hlslStr,
    wgsl,
    webgpu,
    numberOfComponents,
    vec4SizeOfProperty,
    isArray = false,
  }: {
    index: number;
    str: TypeName;
    glslStr: string;
    hlslStr: string;
    wgsl: string;
    webgpu: string;
    numberOfComponents: number;
    vec4SizeOfProperty: IndexOf16Bytes;
    isArray?: boolean;
  }) {
    super({ index, str });
    this.__numberOfComponents = numberOfComponents;
    this.__glslStr = glslStr;
    this.__hlslStr = hlslStr;
    this.__vec4SizeOfProperty = vec4SizeOfProperty;
    this.__isArray = isArray;
    this.__webgpuStr = webgpu;
    this.__wgslStr = wgsl;
    this.__dummyStr = str;
  }

  get webgpu() {
    return this.__webgpuStr;
  }

  get wgsl() {
    return this.__wgslStr;
  }

  getNumberOfComponents(): Count {
    return this.__numberOfComponents;
  }

  getGlslStr(componentType: ComponentTypeEnum) {
    if (
      componentType.index === 5126 || // FLOAT
      componentType.index === 5127 || // DOUBLE
      this === CompositionType.Texture2D ||
      this === CompositionType.Texture2DShadow ||
      this === CompositionType.Texture2DRect ||
      this === CompositionType.TextureCube ||
      this === CompositionType.Texture2DArray
    ) {
      return this.__glslStr;
    }
    if (
      componentType.index === 5120 || // BYTE
      componentType.index === 5122 || // SHORT
      componentType.index === 5124 // INT
    ) {
      if (this === CompositionType.Scalar || this === CompositionType.ScalarArray) {
        return 'int';
      }
      return `i${this.__glslStr}`;
    }
    if (
      componentType.index === 5121 || // UNSIGNED_BYTE
      componentType.index === 5123 || // UNSIGNED_SHORT
      componentType.index === 5125 // UNSIGNED_INT
    ) {
      if (this === CompositionType.Scalar || this === CompositionType.ScalarArray) {
        return 'uint';
      }
      return `u${this.__glslStr}`;
      // eslint-disable-next-line prettier/prettier
      // eslint-disable-next-line prettier/prettier
    }
    if (componentType.index === 35670) {
      // BOOL
      return 'bool';
    }
    return 'unknown';
  }

  getGlslInitialValue(componentType: ComponentTypeEnum) {
    if (
      componentType.index === 5126 || // FLOAT
      componentType.index === 5127 // DOUBLE
    ) {
      if (this === CompositionType.Scalar) {
        return '0.0';
      }
      const glslType = this.getGlslStr(componentType);
      if (this.__numberOfComponents === 2) {
        return `${glslType}(0.0, 0.0)`;
      }
      if (this.__numberOfComponents === 3) {
        return `${glslType}(0.0, 0.0, 0.0)`;
      }
      if (this.__numberOfComponents === 4) {
        return `${glslType}(0.0, 0.0, 0.0, 0.0)`;
      }
      if (this.__numberOfComponents === 9) {
        return `${glslType}(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)`;
      }
      if (this.__numberOfComponents === 16) {
        return `${glslType}(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)`;
      }
    } else if (
      componentType.index === 5120 || // BYTE
      componentType.index === 5122 || // SHORT
      componentType.index === 5124 // INT
    ) {
      if (this === CompositionType.Scalar) {
        return '0';
      }
      const glslType = this.getGlslStr(componentType);
      if (this.__numberOfComponents === 2) {
        return `${glslType}(0, 0)`;
      }
      if (this.__numberOfComponents === 3) {
        return `${glslType}(0, 0, 0)`;
      }
      if (this.__numberOfComponents === 4) {
        return `${glslType}(0, 0, 0, 0)`;
      }
      if (this.__numberOfComponents === 9) {
        return `${glslType}(0, 0, 0, 0, 0, 0, 0, 0, 0)`;
      }
      if (this.__numberOfComponents === 16) {
        return `${glslType}(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`;
      }
    } else if (
      componentType.index === 5121 || // UNSIGNED_BYTE
      componentType.index === 5123 || // UNSIGNED_SHORT
      componentType.index === 5125 // UNSIGNED_INT
    ) {
      if (this === CompositionType.Scalar) {
        return '0u';
      }
      const glslType = this.getGlslStr(componentType);
      if (this.__numberOfComponents === 2) {
        return `${glslType}(0u, 0u)`;
      }
      if (this.__numberOfComponents === 3) {
        return `${glslType}(0u, 0u, 0u)`;
      }
      if (this.__numberOfComponents === 4) {
        return `${glslType}(0u, 0u, 0u, 0u)`;
      }
      if (this.__numberOfComponents === 9) {
        return `${glslType}(0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u)`;
      }
      if (this.__numberOfComponents === 16) {
        return `${glslType}(0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u)`;
      }
      // eslint-disable-next-line prettier/prettier
    } else if (componentType.index === 35670) {
      // BOOL
      if (this === CompositionType.Scalar) {
        return 'false';
      }
      if (this.__numberOfComponents === 2) {
        return `${this.__glslStr}(false, false)`;
      }
      if (this.__numberOfComponents === 3) {
        return `${this.__glslStr}(false, false, false)`;
      }
      if (this.__numberOfComponents === 4) {
        return `${this.__glslStr}(false, false, false, false)`;
      }
    }
    return 'unknown';
  }

  getWgslInitialValue(componentType: ComponentTypeEnum) {
    const type = this.toWGSLType(componentType);
    if (
      componentType.index === 5126 || // FLOAT
      componentType.index === 5127 // DOUBLE
    ) {
      if (this === CompositionType.Scalar) {
        return '0.0';
      }
      if (this.__numberOfComponents === 2) {
        return `${type}(0.0, 0.0)`;
      }
      if (this.__numberOfComponents === 3) {
        return `${type}(0.0, 0.0, 0.0)`;
      }
      if (this.__numberOfComponents === 4) {
        return `${type}(0.0, 0.0, 0.0, 0.0)`;
      }
      if (this.__numberOfComponents === 9) {
        return `${type}(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)`;
      }
      if (this.__numberOfComponents === 16) {
        return `${type}(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)`;
      }
    } else if (
      componentType.index === 5120 || // BYTE
      componentType.index === 5122 || // SHORT
      componentType.index === 5124 || // INT
      componentType.index === 5121 || // UNSIGNED_BYTE
      componentType.index === 5123 || // UNSIGNED_SHORT
      componentType.index === 5125 // UNSIGNED_INT
    ) {
      if (this === CompositionType.Scalar) {
        return '0';
      }
      if (this.__numberOfComponents === 2) {
        return `${type}(0, 0)`;
      }
      if (this.__numberOfComponents === 3) {
        return `${type}(0, 0, 0)`;
      }
      if (this.__numberOfComponents === 4) {
        return `${type}(0, 0, 0, 0)`;
      }
      if (this.__numberOfComponents === 9) {
        return `${type}(0, 0, 0, 0, 0, 0, 0, 0, 0)`;
      }
      if (this.__numberOfComponents === 16) {
        return `${type}(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`;
      }
      // eslint-disable-next-line prettier/prettier
    } else if (componentType.index === 35670) {
      // BOOL
      if (this === CompositionType.Scalar) {
        return 'false';
      }
      if (this.__numberOfComponents === 2) {
        return `${type}(false, false)`;
      }
      if (this.__numberOfComponents === 3) {
        return `${type}(false, false, false)`;
      }
      if (this.__numberOfComponents === 4) {
        return `${type}(false, false, false, false)`;
      }
    }
    return 'unknown';
  }

  toWGSLType(componentType: ComponentTypeEnum): string {
    return this.__wgslStr.replace('#', componentType.wgsl);
  }

  getVec4SizeOfProperty(): IndexOf16Bytes {
    return this.__vec4SizeOfProperty;
  }
}

const Unknown = new CompositionTypeClass({
  index: -1,
  str: 'UNKNOWN',
  glslStr: 'unknown',
  hlslStr: 'unknown',
  wgsl: 'unknown',
  webgpu: 'unknown',
  numberOfComponents: 0,
  vec4SizeOfProperty: 0,
});
const Scalar = new CompositionTypeClass({
  index: 0,
  str: 'SCALAR',
  glslStr: 'float',
  hlslStr: 'float',
  wgsl: '#',
  webgpu: '',
  numberOfComponents: 1,
  vec4SizeOfProperty: 1,
});
const Vec2 = new CompositionTypeClass({
  index: 1,
  str: 'VEC2',
  glslStr: 'vec2',
  hlslStr: 'float2',
  wgsl: 'vec2<#>',
  webgpu: 'x2',
  numberOfComponents: 2,
  vec4SizeOfProperty: 1,
});
const Vec3 = new CompositionTypeClass({
  index: 2,
  str: 'VEC3',
  glslStr: 'vec3',
  hlslStr: 'float3',
  wgsl: 'vec3<#>',
  webgpu: 'x3',
  numberOfComponents: 3,
  vec4SizeOfProperty: 1,
});
const Vec4 = new CompositionTypeClass({
  index: 3,
  str: 'VEC4',
  glslStr: 'vec4',
  hlslStr: 'float4',
  wgsl: 'vec4<#>',
  webgpu: 'x4',
  numberOfComponents: 4,
  vec4SizeOfProperty: 1,
});
const Mat2 = new CompositionTypeClass({
  index: 4,
  str: 'MAT2',
  glslStr: 'mat2',
  hlslStr: 'float2x2',
  wgsl: 'mat2x2<#>',
  webgpu: 'unknown',
  numberOfComponents: 4,
  vec4SizeOfProperty: 2,
});
const Mat3 = new CompositionTypeClass({
  index: 5,
  str: 'MAT3',
  glslStr: 'mat3',
  hlslStr: 'float3x3',
  wgsl: 'mat3x3<#>',
  webgpu: 'unknown',
  numberOfComponents: 9,
  vec4SizeOfProperty: 3,
});
const Mat4 = new CompositionTypeClass({
  index: 6,
  str: 'MAT4',
  glslStr: 'mat4',
  hlslStr: 'float4x4',
  wgsl: 'mat4x4<#>',
  webgpu: 'unknown',
  numberOfComponents: 16,
  vec4SizeOfProperty: 4,
});
const Texture2D = new CompositionTypeClass({
  index: 7,
  str: 'TEXTURE_2D',
  glslStr: 'sampler2D',
  hlslStr: 'Texture2D',
  wgsl: 'texture_2d',
  webgpu: 'texture_2d',
  numberOfComponents: 1,
  vec4SizeOfProperty: 1,
});
const TextureCube = new CompositionTypeClass({
  index: 8,
  str: 'TEXTURE_CUBE_MAP',
  glslStr: 'samplerCube',
  hlslStr: 'TextureCube',
  wgsl: 'texture_cube',
  webgpu: 'texture_cube',
  numberOfComponents: 1,
  vec4SizeOfProperty: 1,
});
const ScalarArray = new CompositionTypeClass({
  index: 9,
  str: 'SCALAR_ARRAY',
  glslStr: 'float',
  hlslStr: 'float',
  wgsl: '#',
  webgpu: 'unknown',
  numberOfComponents: 1,
  vec4SizeOfProperty: 1,
  isArray: true,
});
const Vec2Array = new CompositionTypeClass({
  index: 10,
  str: 'VEC2_ARRAY',
  glslStr: 'vec2',
  hlslStr: 'float2',
  wgsl: 'vec2<#>',
  webgpu: 'unknown',
  numberOfComponents: 2,
  vec4SizeOfProperty: 1,
  isArray: true,
});
const Vec3Array = new CompositionTypeClass({
  index: 11,
  str: 'VEC3_ARRAY',
  glslStr: 'vec3',
  hlslStr: 'float3',
  wgsl: 'vec3<#>',
  webgpu: 'unknown',
  numberOfComponents: 3,
  vec4SizeOfProperty: 1,
  isArray: true,
});
const Vec4Array = new CompositionTypeClass({
  index: 12,
  str: 'VEC4_ARRAY',
  glslStr: 'vec4',
  hlslStr: 'float4',
  wgsl: 'vec4<#>',
  webgpu: 'unknown',
  numberOfComponents: 4,
  vec4SizeOfProperty: 1,
  isArray: true,
});
const Mat4Array = new CompositionTypeClass({
  index: 13,
  str: 'MAT4_ARRAY',
  glslStr: 'mat4',
  hlslStr: 'float4x4',
  wgsl: 'mat4x4<#>',
  webgpu: 'unknown',
  numberOfComponents: 16,
  vec4SizeOfProperty: 4,
  isArray: true,
});
const Mat3Array = new CompositionTypeClass({
  index: 14,
  str: 'MAT3_ARRAY',
  glslStr: 'mat3',
  hlslStr: 'float3x3',
  wgsl: 'mat3x3<#>',
  webgpu: 'unknown',
  numberOfComponents: 9,
  vec4SizeOfProperty: 3,
  isArray: true,
});
const Mat2Array = new CompositionTypeClass({
  index: 15,
  str: 'MAT2_ARRAY',
  glslStr: 'mat2',
  hlslStr: 'float2x2',
  wgsl: 'mat2x2<#>',
  webgpu: 'unknown',
  numberOfComponents: 4,
  vec4SizeOfProperty: 2,
  isArray: true,
});
const Texture2DShadow = new CompositionTypeClass({
  index: 16,
  str: 'TEXTURE_2D_SHADOW',
  glslStr: 'highp sampler2DShadow',
  hlslStr: 'Texture2D',
  wgsl: 'texture_2d',
  webgpu: 'texture_2d',
  numberOfComponents: 1,
  vec4SizeOfProperty: 1,
});
const Texture2DRect = new CompositionTypeClass({
  index: 17,
  str: 'TEXTURE_2D_RECT',
  glslStr: 'sampler2DRect',
  hlslStr: 'Texture2D',
  wgsl: 'texture_2d',
  webgpu: 'texture_2d',
  numberOfComponents: 1,
  vec4SizeOfProperty: 1,
});
const Texture2DArray = new CompositionTypeClass({
  index: 18,
  str: 'TEXTURE_2D_ARRAY',
  glslStr: 'sampler2DArray',
  hlslStr: 'Texture2DArray',
  wgsl: 'texture_2d_array',
  webgpu: 'texture_2d_array',
  numberOfComponents: 1,
  vec4SizeOfProperty: 1,
});
const Mat4x3Array = new CompositionTypeClass({
  index: 19,
  str: 'MAT4x3_ARRAY',
  glslStr: 'mat4x3',
  hlslStr: 'float4x3',
  wgsl: 'mat4x3<#>',
  webgpu: 'unknown',
  numberOfComponents: 12,
  vec4SizeOfProperty: 3,
  isArray: true,
});
const SpecularProps = new CompositionTypeClass({
  index: 20,
  str: 'SPECULAR_PROPS',
  glslStr: 'struct SpecularProps',
  hlslStr: 'struct SpecularProps',
  wgsl: 'struct SpecularProps',
  webgpu: 'struct SpecularProps',
  numberOfComponents: -1,
  vec4SizeOfProperty: -1,
});
const VolumeProps = new CompositionTypeClass({
  index: 21,
  str: 'VOLUME_PROPS',
  glslStr: 'struct VolumeProps',
  hlslStr: 'struct VolumeProps',
  wgsl: 'struct VolumeProps',
  webgpu: 'struct VolumeProps',
  numberOfComponents: -1,
  vec4SizeOfProperty: -1,
});
const ClearcoatProps = new CompositionTypeClass({
  index: 22,
  str: 'CLEARCOAT_PROPS',
  glslStr: 'struct ClearcoatProps',
  hlslStr: 'struct ClearcoatProps',
  wgsl: 'struct ClearcoatProps',
  webgpu: 'struct ClearcoatProps',
  numberOfComponents: -1,
  vec4SizeOfProperty: -1,
});
const AnisotropyProps = new CompositionTypeClass({
  index: 23,
  str: 'ANISOTROPY_PROPS',
  glslStr: 'struct AnisotropyProps',
  hlslStr: 'struct AnisotropyProps',
  wgsl: 'struct AnisotropyProps',
  webgpu: 'struct AnisotropyProps',
  numberOfComponents: -1,
  vec4SizeOfProperty: -1,
});
const SheenProps = new CompositionTypeClass({
  index: 24,
  str: 'SHEEN_PROPS',
  glslStr: 'struct SheenProps',
  hlslStr: 'struct SheenProps',
  wgsl: 'struct SheenProps',
  webgpu: 'struct SheenProps',
  numberOfComponents: -1,
  vec4SizeOfProperty: -1,
});
const IridescenceProps = new CompositionTypeClass({
  index: 25,
  str: 'IRIDESCENCE_PROPS',
  glslStr: 'struct IridescenceProps',
  hlslStr: 'struct IridescenceProps',
  wgsl: 'struct IridescenceProps',
  webgpu: 'struct IridescenceProps',
  numberOfComponents: -1,
  vec4SizeOfProperty: -1,
});
const DiffuseTransmissionProps = new CompositionTypeClass({
  index: 26,
  str: 'DIFFUSE_TRANSMISSION_PROPS',
  glslStr: 'struct DiffuseTransmissionProps',
  hlslStr: 'struct DiffuseTransmissionProps',
  wgsl: 'struct DiffuseTransmissionProps',
  webgpu: 'struct DiffuseTransmissionProps',
  numberOfComponents: -1,
  vec4SizeOfProperty: -1,
});

const typeList = [
  Unknown,
  Scalar,
  Vec2,
  Vec3,
  Vec4,
  Mat2,
  Mat3,
  Mat4,
  Vec2Array,
  Vec3Array,
  Vec4Array,
  ScalarArray,
  Mat2Array,
  Mat3Array,
  Mat4Array,
  Texture2D,
  Texture2DShadow,
  Texture2DRect,
  TextureCube,
  Mat4x3Array,
  SpecularProps,
  VolumeProps,
  ClearcoatProps,
  AnisotropyProps,
  SheenProps,
  IridescenceProps,
  DiffuseTransmissionProps,
];

export type VectorCompositionTypes = typeof Scalar | typeof Vec2 | typeof Vec3 | typeof Vec4;

function from(index: number): CompositionTypeEnum {
  return _from({ typeList, index }) as CompositionTypeEnum;
}

function fromString(str: string): CompositionTypeEnum {
  return _fromString({ typeList, str }) as CompositionTypeEnum;
}

function vectorFrom(componentN: number): CompositionTypeEnum {
  let str = '';
  switch (componentN) {
    case 1:
      str = 'scalar';
      break;
    case 2:
      str = 'vec2';
      break;
    case 3:
      str = 'vec3';
      break;
    case 4:
      str = 'vec4';
      break;
    default:
      Logger.default.error('not found appropriate Vectors');
  }
  return _fromString({ typeList, str }) as CompositionTypeEnum;
}

function fromGlslString(str_: string): CompositionTypeEnum {
  let str = str_;
  switch (str_) {
    case 'bool':
      str = 'scalar';
      break;
    case 'int':
      str = 'scalar';
      break;
    case 'float':
      str = 'scalar';
      break;
    case 'ivec2':
      str = 'vec2';
      break;
    case 'ivec3':
      str = 'vec3';
      break;
    case 'ivec4':
      str = 'vec4';
      break;
    case 'uvec2':
      str = 'vec2';
      break;
    case 'uvec3':
      str = 'vec3';
      break;
    case 'uvec4':
      str = 'vec4';
      break;
    case 'sampler2D':
      str = 'TEXTURE_2D';
      break;
    case 'sampler2DShadow':
      str = 'TEXTURE_2D_SHADOW';
      break;
    case 'sampler2DRect':
      str = 'TEXTURE_2D_RECT';
      break;
    case 'samplerCube':
      str = 'TEXTURE_CUBE_MAP';
      break;
    case 'sampler2DArray':
      str = 'TEXTURE_2D_ARRAY';
      break;
  }
  return _fromString({ typeList, str }) as CompositionTypeEnum;
}

function fromWgslString(str_: string): CompositionTypeEnum {
  let str = str_;
  switch (str_) {
    case 'bool':
      str = 'scalar';
      break;
    case 'i32':
      str = 'scalar';
      break;
    case 'u32':
      str = 'scalar';
      break;
    case 'f32':
      str = 'scalar';
      break;
    case 'vec2<f32>':
      str = 'vec2';
      break;
    case 'vec3<f32>':
      str = 'vec3';
      break;
    case 'vec4<f32>':
      str = 'vec4';
      break;
    case 'mat2x2<f32>':
      str = 'mat2';
      break;
    case 'mat3x3<f32>':
      str = 'mat3';
      break;
    case 'mat4x4<f32>':
      str = 'mat4';
      break;
    case 'vec2<i32>':
      str = 'vec2';
      break;
    case 'vec3<i32>':
      str = 'vec3';
      break;
    case 'vec4<i32>':
      str = 'vec4';
      break;
    case 'mat2x2<i32>':
      str = 'mat2';
      break;
    case 'mat3x3<i32>':
      str = 'mat3';
      break;
    case 'mat4x4<i32>':
      str = 'mat4';
      break;
    case 'sampler_2d':
      str = 'TEXTURE_2D';
      break;
    case 'sampler_2d_shadow':
      str = 'TEXTURE_2D_SHADOW';
      break;
    case 'sampler_cube':
      str = 'TEXTURE_CUBE_MAP';
      break;
    case 'sampler_2d_array':
      str = 'TEXTURE_2D_ARRAY';
      break;
  }
  return _fromString({ typeList, str }) as CompositionTypeEnum;
}

function toGltf2AccessorCompositionTypeString(
  componentN: VectorAndSquareMatrixComponentN
): Gltf2AccessorCompositionTypeString {
  switch (componentN) {
    case 1:
      return 'SCALAR';
    case 2:
      return 'VEC2';
    case 3:
      return 'VEC3';
    case 4:
      return 'VEC4';
    case 9:
      return 'MAT3';
    case 16:
      return 'MAT4';
    default:
      throw new Error('Invalid componentN');
  }
}

function toGltf2AnimationAccessorCompositionTypeString(
  componentN: VectorComponentN
): Gltf2AccessorCompositionTypeString {
  switch (componentN) {
    case 1:
      return 'SCALAR';
    case 2:
      return 'VEC2';
    case 3:
      return 'VEC3';
    case 4:
      return 'VEC4';
    default:
      throw new Error('Invalid componentN');
  }
}

function toGltf2SquareMatrixAccessorCompositionTypeString(
  componentN: SquareMatrixComponentN
): Gltf2AccessorCompositionTypeString {
  switch (componentN) {
    case 4:
      return 'VEC4';
    case 9:
      return 'MAT3';
    case 16:
      return 'MAT4';
    default:
      throw new Error('Invalid componentN');
  }
}

export type Gltf2AnimationAccessorCompositionType = typeof Scalar | typeof Vec2 | typeof Vec3 | typeof Vec4;

export type Gltf2AccessorCompositionType =
  | typeof Scalar
  | typeof Vec2
  | typeof Vec3
  | typeof Vec4
  | typeof Mat2
  | typeof Mat3
  | typeof Mat4;

function toGltf2AnimationAccessorCompositionType(componentN: VectorComponentN): Gltf2AnimationAccessorCompositionType {
  switch (componentN) {
    case 1:
      return Scalar;
    case 2:
      return Vec2;
    case 3:
      return Vec3;
    case 4:
      return Vec4;
    default:
      throw new Error('Invalid componentN');
  }
}

function isArray(compositionType: CompositionTypeEnum) {
  if (
    compositionType === ScalarArray ||
    compositionType === Vec2Array ||
    compositionType === Vec3Array ||
    compositionType === Vec4Array ||
    compositionType === Mat4x3Array ||
    compositionType === Mat4Array ||
    compositionType === Mat3Array ||
    compositionType === Mat2Array
  ) {
    return true;
  }
  return false;
}

function isTexture(compositionType: CompositionTypeEnum) {
  if (
    compositionType === Texture2D ||
    compositionType === TextureCube ||
    compositionType === Texture2DShadow ||
    compositionType === Texture2DRect ||
    compositionType === Texture2DArray
  ) {
    return true;
  }
  return false;
}

export const CompositionType = Object.freeze({
  Unknown,
  Scalar,
  Vec2,
  Vec3,
  Vec4,
  Mat2,
  Mat3,
  Mat4,
  ScalarArray,
  Vec2Array,
  Vec3Array,
  Vec4Array,
  Mat2Array,
  Mat3Array,
  Mat4Array,
  Texture2D,
  Texture2DShadow,
  TextureCube,
  Texture2DRect,
  Texture2DArray,
  Mat4x3Array,
  SpecularProps,
  VolumeProps,
  ClearcoatProps,
  AnisotropyProps,
  SheenProps,
  IridescenceProps,
  DiffuseTransmissionProps,
  from,
  fromString,
  vectorFrom,
  fromGlslString,
  fromWgslString,
  isArray,
  isTexture,
  toGltf2AnimationAccessorCompositionType,
  toGltf2AccessorCompositionTypeString,
  toGltf2AnimationAccessorCompositionTypeString,
  toGltf2SquareMatrixAccessorCompositionTypeString,
});
