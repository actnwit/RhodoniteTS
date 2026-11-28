// src/foundation/definitions/CompositionType.ts
import { _from, _fromString, EnumClass } from "../misc/EnumIO.js";
import { Logger } from "../misc/Logger.js";
var CompositionTypeClass = class extends EnumClass {
  constructor({
    index,
    str,
    glslStr,
    hlslStr,
    wgsl,
    webgpu,
    numberOfComponents,
    vec4SizeOfProperty,
    isArray: isArray2 = false
  }) {
    super({ index, str });
    this.wj = numberOfComponents;
    this.xj = glslStr;
    this.Bj = hlslStr;
    this.Aj = vec4SizeOfProperty;
    this.Cj = isArray2;
    this.zj = webgpu;
    this.yj = wgsl;
    this.vj = str;
  }
  get webgpu() {
    return this.zj;
  }
  get wgsl() {
    return this.yj;
  }
  getNumberOfComponents() {
    return this.wj;
  }
  getGlslStr(componentType) {
    if (componentType.index === 5126 || // FLOAT
    componentType.index === 5127 || // DOUBLE
    componentType.index === -1 || // UNKNOWN
    this === CompositionType.Texture2D || this === CompositionType.Texture2DShadow || this === CompositionType.Texture2DRect || this === CompositionType.TextureCube || this === CompositionType.Texture2DArray) {
      return this.xj;
    }
    if (componentType.index === 5120 || // BYTE
    componentType.index === 5122 || // SHORT
    componentType.index === 5124) {
      if (this === CompositionType.Scalar || this === CompositionType.ScalarArray) {
        return "int";
      }
      return `i${this.xj}`;
    }
    if (componentType.index === 5121 || // UNSIGNED_BYTE
    componentType.index === 5123 || // UNSIGNED_SHORT
    componentType.index === 5125) {
      if (this === CompositionType.Scalar || this === CompositionType.ScalarArray) {
        return "uint";
      }
      return `u${this.xj}`;
    }
    if (componentType.index === 35670) {
      return "bool";
    }
    return "unknown";
  }
  getGlslInitialValue(componentType) {
    if (componentType.index === 5126 || // FLOAT
    componentType.index === 5127) {
      if (this === CompositionType.Scalar) {
        return "0.0";
      }
      const glslType = this.getGlslStr(componentType);
      if (this.wj === 2) {
        return `${glslType}(0.0, 0.0)`;
      }
      if (this.wj === 3) {
        return `${glslType}(0.0, 0.0, 0.0)`;
      }
      if (this.wj === 4) {
        return `${glslType}(0.0, 0.0, 0.0, 0.0)`;
      }
      if (this.wj === 9) {
        return `${glslType}(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)`;
      }
      if (this.wj === 16) {
        return `${glslType}(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)`;
      }
    } else if (componentType.index === 5120 || // BYTE
    componentType.index === 5122 || // SHORT
    componentType.index === 5124) {
      if (this === CompositionType.Scalar) {
        return "0";
      }
      const glslType = this.getGlslStr(componentType);
      if (this.wj === 2) {
        return `${glslType}(0, 0)`;
      }
      if (this.wj === 3) {
        return `${glslType}(0, 0, 0)`;
      }
      if (this.wj === 4) {
        return `${glslType}(0, 0, 0, 0)`;
      }
      if (this.wj === 9) {
        return `${glslType}(0, 0, 0, 0, 0, 0, 0, 0, 0)`;
      }
      if (this.wj === 16) {
        return `${glslType}(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`;
      }
    } else if (componentType.index === 5121 || // UNSIGNED_BYTE
    componentType.index === 5123 || // UNSIGNED_SHORT
    componentType.index === 5125) {
      if (this === CompositionType.Scalar) {
        return "0u";
      }
      const glslType = this.getGlslStr(componentType);
      if (this.wj === 2) {
        return `${glslType}(0u, 0u)`;
      }
      if (this.wj === 3) {
        return `${glslType}(0u, 0u, 0u)`;
      }
      if (this.wj === 4) {
        return `${glslType}(0u, 0u, 0u, 0u)`;
      }
      if (this.wj === 9) {
        return `${glslType}(0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u)`;
      }
      if (this.wj === 16) {
        return `${glslType}(0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u, 0u)`;
      }
    } else if (componentType.index === 35670) {
      if (this === CompositionType.Scalar) {
        return "false";
      }
      if (this.wj === 2) {
        return `${this.xj}(false, false)`;
      }
      if (this.wj === 3) {
        return `${this.xj}(false, false, false)`;
      }
      if (this.wj === 4) {
        return `${this.xj}(false, false, false, false)`;
      }
    }
    return "unknown";
  }
  getWgslInitialValue(componentType) {
    const type = this.toWGSLType(componentType);
    if (componentType.index === 5126 || // FLOAT
    componentType.index === 5127) {
      if (this === CompositionType.Scalar) {
        return "0.0";
      }
      if (this.wj === 2) {
        return `${type}(0.0, 0.0)`;
      }
      if (this.wj === 3) {
        return `${type}(0.0, 0.0, 0.0)`;
      }
      if (this.wj === 4) {
        return `${type}(0.0, 0.0, 0.0, 0.0)`;
      }
      if (this.wj === 9) {
        return `${type}(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)`;
      }
      if (this.wj === 16) {
        return `${type}(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)`;
      }
    } else if (componentType.index === 5120 || // BYTE
    componentType.index === 5122 || // SHORT
    componentType.index === 5124 || // INT
    componentType.index === 5121 || // UNSIGNED_BYTE
    componentType.index === 5123 || // UNSIGNED_SHORT
    componentType.index === 5125) {
      if (this === CompositionType.Scalar) {
        return "0";
      }
      if (this.wj === 2) {
        return `${type}(0, 0)`;
      }
      if (this.wj === 3) {
        return `${type}(0, 0, 0)`;
      }
      if (this.wj === 4) {
        return `${type}(0, 0, 0, 0)`;
      }
      if (this.wj === 9) {
        return `${type}(0, 0, 0, 0, 0, 0, 0, 0, 0)`;
      }
      if (this.wj === 16) {
        return `${type}(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`;
      }
    } else if (componentType.index === 35670) {
      if (this === CompositionType.Scalar) {
        return "false";
      }
      if (this.wj === 2) {
        return `${type}(false, false)`;
      }
      if (this.wj === 3) {
        return `${type}(false, false, false)`;
      }
      if (this.wj === 4) {
        return `${type}(false, false, false, false)`;
      }
    }
    return "unknown";
  }
  toWGSLType(componentType) {
    let result = this.yj.replace("#", componentType.wgsl);
    if (result.startsWith("struct ")) {
      result = result.replace("struct ", "");
    }
    return result;
  }
  getVec4SizeOfProperty() {
    return this.Aj;
  }
};
var Unknown = new CompositionTypeClass({
  index: -1,
  str: "UNKNOWN",
  glslStr: "unknown",
  hlslStr: "unknown",
  wgsl: "unknown",
  webgpu: "unknown",
  numberOfComponents: 0,
  vec4SizeOfProperty: 0
});
var Scalar = new CompositionTypeClass({
  index: 0,
  str: "SCALAR",
  glslStr: "float",
  hlslStr: "float",
  wgsl: "#",
  webgpu: "",
  numberOfComponents: 1,
  vec4SizeOfProperty: 1
});
var Vec2 = new CompositionTypeClass({
  index: 1,
  str: "VEC2",
  glslStr: "vec2",
  hlslStr: "float2",
  wgsl: "vec2<#>",
  webgpu: "x2",
  numberOfComponents: 2,
  vec4SizeOfProperty: 1
});
var Vec3 = new CompositionTypeClass({
  index: 2,
  str: "VEC3",
  glslStr: "vec3",
  hlslStr: "float3",
  wgsl: "vec3<#>",
  webgpu: "x3",
  numberOfComponents: 3,
  vec4SizeOfProperty: 1
});
var Vec4 = new CompositionTypeClass({
  index: 3,
  str: "VEC4",
  glslStr: "vec4",
  hlslStr: "float4",
  wgsl: "vec4<#>",
  webgpu: "x4",
  numberOfComponents: 4,
  vec4SizeOfProperty: 1
});
var Mat2 = new CompositionTypeClass({
  index: 4,
  str: "MAT2",
  glslStr: "mat2",
  hlslStr: "float2x2",
  wgsl: "mat2x2<#>",
  webgpu: "unknown",
  numberOfComponents: 4,
  vec4SizeOfProperty: 2
});
var Mat3 = new CompositionTypeClass({
  index: 5,
  str: "MAT3",
  glslStr: "mat3",
  hlslStr: "float3x3",
  wgsl: "mat3x3<#>",
  webgpu: "unknown",
  numberOfComponents: 9,
  vec4SizeOfProperty: 3
});
var Mat4 = new CompositionTypeClass({
  index: 6,
  str: "MAT4",
  glslStr: "mat4",
  hlslStr: "float4x4",
  wgsl: "mat4x4<#>",
  webgpu: "unknown",
  numberOfComponents: 16,
  vec4SizeOfProperty: 4
});
var Texture2D = new CompositionTypeClass({
  index: 7,
  str: "TEXTURE_2D",
  glslStr: "sampler2D",
  hlslStr: "Texture2D",
  wgsl: "texture_2d",
  webgpu: "texture_2d",
  numberOfComponents: 1,
  vec4SizeOfProperty: 1
});
var TextureCube = new CompositionTypeClass({
  index: 8,
  str: "TEXTURE_CUBE_MAP",
  glslStr: "samplerCube",
  hlslStr: "TextureCube",
  wgsl: "texture_cube",
  webgpu: "texture_cube",
  numberOfComponents: 1,
  vec4SizeOfProperty: 1
});
var ScalarArray = new CompositionTypeClass({
  index: 9,
  str: "SCALAR_ARRAY",
  glslStr: "float",
  hlslStr: "float",
  wgsl: "#",
  webgpu: "unknown",
  numberOfComponents: 1,
  vec4SizeOfProperty: 1,
  isArray: true
});
var Vec2Array = new CompositionTypeClass({
  index: 10,
  str: "VEC2_ARRAY",
  glslStr: "vec2",
  hlslStr: "float2",
  wgsl: "vec2<#>",
  webgpu: "unknown",
  numberOfComponents: 2,
  vec4SizeOfProperty: 1,
  isArray: true
});
var Vec3Array = new CompositionTypeClass({
  index: 11,
  str: "VEC3_ARRAY",
  glslStr: "vec3",
  hlslStr: "float3",
  wgsl: "vec3<#>",
  webgpu: "unknown",
  numberOfComponents: 3,
  vec4SizeOfProperty: 1,
  isArray: true
});
var Vec4Array = new CompositionTypeClass({
  index: 12,
  str: "VEC4_ARRAY",
  glslStr: "vec4",
  hlslStr: "float4",
  wgsl: "vec4<#>",
  webgpu: "unknown",
  numberOfComponents: 4,
  vec4SizeOfProperty: 1,
  isArray: true
});
var Mat4Array = new CompositionTypeClass({
  index: 13,
  str: "MAT4_ARRAY",
  glslStr: "mat4",
  hlslStr: "float4x4",
  wgsl: "mat4x4<#>",
  webgpu: "unknown",
  numberOfComponents: 16,
  vec4SizeOfProperty: 4,
  isArray: true
});
var Mat3Array = new CompositionTypeClass({
  index: 14,
  str: "MAT3_ARRAY",
  glslStr: "mat3",
  hlslStr: "float3x3",
  wgsl: "mat3x3<#>",
  webgpu: "unknown",
  numberOfComponents: 9,
  vec4SizeOfProperty: 3,
  isArray: true
});
var Mat2Array = new CompositionTypeClass({
  index: 15,
  str: "MAT2_ARRAY",
  glslStr: "mat2",
  hlslStr: "float2x2",
  wgsl: "mat2x2<#>",
  webgpu: "unknown",
  numberOfComponents: 4,
  vec4SizeOfProperty: 2,
  isArray: true
});
var Texture2DShadow = new CompositionTypeClass({
  index: 16,
  str: "TEXTURE_2D_SHADOW",
  glslStr: "highp sampler2DShadow",
  hlslStr: "Texture2D",
  wgsl: "texture_2d",
  webgpu: "texture_2d",
  numberOfComponents: 1,
  vec4SizeOfProperty: 1
});
var Texture2DRect = new CompositionTypeClass({
  index: 17,
  str: "TEXTURE_2D_RECT",
  glslStr: "sampler2DRect",
  hlslStr: "Texture2D",
  wgsl: "texture_2d",
  webgpu: "texture_2d",
  numberOfComponents: 1,
  vec4SizeOfProperty: 1
});
var Texture2DArray = new CompositionTypeClass({
  index: 18,
  str: "TEXTURE_2D_ARRAY",
  glslStr: "sampler2DArray",
  hlslStr: "Texture2DArray",
  wgsl: "texture_2d_array",
  webgpu: "texture_2d_array",
  numberOfComponents: 1,
  vec4SizeOfProperty: 1
});
var Mat4x3Array = new CompositionTypeClass({
  index: 19,
  str: "MAT4x3_ARRAY",
  glslStr: "mat4x3",
  hlslStr: "float4x3",
  wgsl: "mat4x3<#>",
  webgpu: "unknown",
  numberOfComponents: 12,
  vec4SizeOfProperty: 3,
  isArray: true
});
var SpecularProps = new CompositionTypeClass({
  index: 20,
  str: "SPECULAR_PROPS",
  glslStr: "struct SpecularProps",
  hlslStr: "struct SpecularProps",
  wgsl: "struct SpecularProps",
  webgpu: "struct SpecularProps",
  numberOfComponents: -1,
  vec4SizeOfProperty: -1
});
var VolumeProps = new CompositionTypeClass({
  index: 21,
  str: "VOLUME_PROPS",
  glslStr: "struct VolumeProps",
  hlslStr: "struct VolumeProps",
  wgsl: "struct VolumeProps",
  webgpu: "struct VolumeProps",
  numberOfComponents: -1,
  vec4SizeOfProperty: -1
});
var ClearcoatProps = new CompositionTypeClass({
  index: 22,
  str: "CLEARCOAT_PROPS",
  glslStr: "struct ClearcoatProps",
  hlslStr: "struct ClearcoatProps",
  wgsl: "struct ClearcoatProps",
  webgpu: "struct ClearcoatProps",
  numberOfComponents: -1,
  vec4SizeOfProperty: -1
});
var AnisotropyProps = new CompositionTypeClass({
  index: 23,
  str: "ANISOTROPY_PROPS",
  glslStr: "struct AnisotropyProps",
  hlslStr: "struct AnisotropyProps",
  wgsl: "struct AnisotropyProps",
  webgpu: "struct AnisotropyProps",
  numberOfComponents: -1,
  vec4SizeOfProperty: -1
});
var SheenProps = new CompositionTypeClass({
  index: 24,
  str: "SHEEN_PROPS",
  glslStr: "struct SheenProps",
  hlslStr: "struct SheenProps",
  wgsl: "struct SheenProps",
  webgpu: "struct SheenProps",
  numberOfComponents: -1,
  vec4SizeOfProperty: -1
});
var IridescenceProps = new CompositionTypeClass({
  index: 25,
  str: "IRIDESCENCE_PROPS",
  glslStr: "struct IridescenceProps",
  hlslStr: "struct IridescenceProps",
  wgsl: "struct IridescenceProps",
  webgpu: "struct IridescenceProps",
  numberOfComponents: -1,
  vec4SizeOfProperty: -1
});
var DiffuseTransmissionProps = new CompositionTypeClass({
  index: 26,
  str: "DIFFUSE_TRANSMISSION_PROPS",
  glslStr: "struct DiffuseTransmissionProps",
  hlslStr: "struct DiffuseTransmissionProps",
  wgsl: "struct DiffuseTransmissionProps",
  webgpu: "struct DiffuseTransmissionProps",
  numberOfComponents: -1,
  vec4SizeOfProperty: -1
});
var OcclusionProps = new CompositionTypeClass({
  index: 27,
  str: "OCCLUSION_PROPS",
  glslStr: "struct OcclusionProps",
  hlslStr: "struct OcclusionProps",
  wgsl: "struct OcclusionProps",
  webgpu: "struct OcclusionProps",
  numberOfComponents: -1,
  vec4SizeOfProperty: -1
});
var EmissiveProps = new CompositionTypeClass({
  index: 28,
  str: "EMISSIVE_PROPS",
  glslStr: "struct EmissiveProps",
  hlslStr: "struct EmissiveProps",
  wgsl: "struct EmissiveProps",
  webgpu: "struct EmissiveProps",
  numberOfComponents: -1,
  vec4SizeOfProperty: -1
});
var typeList = [
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
  OcclusionProps,
  EmissiveProps
];
function from(index) {
  return _from({ typeList, index });
}
function fromString(str) {
  return _fromString({ typeList, str });
}
function vectorFrom(componentN) {
  let str = "";
  switch (componentN) {
    case 1:
      str = "scalar";
      break;
    case 2:
      str = "vec2";
      break;
    case 3:
      str = "vec3";
      break;
    case 4:
      str = "vec4";
      break;
    default:
      Logger.default.error("not found appropriate Vectors");
  }
  return _fromString({ typeList, str });
}
function fromGlslString(str_) {
  let str = str_;
  switch (str_) {
    case "bool":
      str = "scalar";
      break;
    case "int":
      str = "scalar";
      break;
    case "float":
      str = "scalar";
      break;
    case "ivec2":
      str = "vec2";
      break;
    case "ivec3":
      str = "vec3";
      break;
    case "ivec4":
      str = "vec4";
      break;
    case "uvec2":
      str = "vec2";
      break;
    case "uvec3":
      str = "vec3";
      break;
    case "uvec4":
      str = "vec4";
      break;
    case "sampler2D":
      str = "TEXTURE_2D";
      break;
    case "sampler2DShadow":
      str = "TEXTURE_2D_SHADOW";
      break;
    case "sampler2DRect":
      str = "TEXTURE_2D_RECT";
      break;
    case "samplerCube":
      str = "TEXTURE_CUBE_MAP";
      break;
    case "sampler2DArray":
      str = "TEXTURE_2D_ARRAY";
      break;
  }
  return _fromString({ typeList, str });
}
function fromWgslString(str_) {
  let str = str_;
  switch (str_) {
    case "bool":
      str = "scalar";
      break;
    case "i32":
      str = "scalar";
      break;
    case "u32":
      str = "scalar";
      break;
    case "f32":
      str = "scalar";
      break;
    case "vec2<f32>":
      str = "vec2";
      break;
    case "vec3<f32>":
      str = "vec3";
      break;
    case "vec4<f32>":
      str = "vec4";
      break;
    case "mat2x2<f32>":
      str = "mat2";
      break;
    case "mat3x3<f32>":
      str = "mat3";
      break;
    case "mat4x4<f32>":
      str = "mat4";
      break;
    case "vec2<i32>":
      str = "vec2";
      break;
    case "vec3<i32>":
      str = "vec3";
      break;
    case "vec4<i32>":
      str = "vec4";
      break;
    case "mat2x2<i32>":
      str = "mat2";
      break;
    case "mat3x3<i32>":
      str = "mat3";
      break;
    case "mat4x4<i32>":
      str = "mat4";
      break;
    case "sampler_2d":
      str = "TEXTURE_2D";
      break;
    case "sampler_2d_shadow":
      str = "TEXTURE_2D_SHADOW";
      break;
    case "sampler_cube":
      str = "TEXTURE_CUBE_MAP";
      break;
    case "sampler_2d_array":
      str = "TEXTURE_2D_ARRAY";
      break;
  }
  return _fromString({ typeList, str });
}
function toGltf2AccessorCompositionTypeString(componentN) {
  switch (componentN) {
    case 1:
      return "SCALAR";
    case 2:
      return "VEC2";
    case 3:
      return "VEC3";
    case 4:
      return "VEC4";
    case 9:
      return "MAT3";
    case 16:
      return "MAT4";
    default:
      throw new Error("Invalid componentN");
  }
}
function toGltf2AnimationAccessorCompositionTypeString(componentN) {
  switch (componentN) {
    case 1:
      return "SCALAR";
    case 2:
      return "VEC2";
    case 3:
      return "VEC3";
    case 4:
      return "VEC4";
    default:
      throw new Error("Invalid componentN");
  }
}
function toGltf2SquareMatrixAccessorCompositionTypeString(componentN) {
  switch (componentN) {
    case 4:
      return "VEC4";
    case 9:
      return "MAT3";
    case 16:
      return "MAT4";
    default:
      throw new Error("Invalid componentN");
  }
}
function toGltf2AnimationAccessorCompositionType(componentN) {
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
      throw new Error("Invalid componentN");
  }
}
function isArray(compositionType) {
  if (compositionType === ScalarArray || compositionType === Vec2Array || compositionType === Vec3Array || compositionType === Vec4Array || compositionType === Mat4x3Array || compositionType === Mat4Array || compositionType === Mat3Array || compositionType === Mat2Array) {
    return true;
  }
  return false;
}
function isTexture(compositionType) {
  if (compositionType === Texture2D || compositionType === TextureCube || compositionType === Texture2DShadow || compositionType === Texture2DRect || compositionType === Texture2DArray) {
    return true;
  }
  return false;
}
function isTexture2D(compositionType) {
  if (compositionType === Texture2D) {
    return true;
  }
  return false;
}
function isTextureCube(compositionType) {
  if (compositionType === TextureCube) {
    return true;
  }
  return false;
}
var CompositionType = Object.freeze({
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
  OcclusionProps,
  EmissiveProps,
  from,
  fromString,
  vectorFrom,
  fromGlslString,
  fromWgslString,
  isArray,
  isTexture,
  isTexture2D,
  isTextureCube,
  toGltf2AnimationAccessorCompositionType,
  toGltf2AccessorCompositionTypeString,
  toGltf2AnimationAccessorCompositionTypeString,
  toGltf2SquareMatrixAccessorCompositionTypeString
});
export {
  CompositionType
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvQ29tcG9zaXRpb25UeXBlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7XG4gIENvdW50LFxuICBJbmRleE9mMTZCeXRlcyxcbiAgU3F1YXJlTWF0cml4Q29tcG9uZW50TixcbiAgVmVjdG9yQW5kU3F1YXJlTWF0cml4Q29tcG9uZW50TixcbiAgVmVjdG9yQ29tcG9uZW50Tixcbn0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBHbHRmMkFjY2Vzc29yQ29tcG9zaXRpb25UeXBlU3RyaW5nIH0gZnJvbSAnLi4vLi4vdHlwZXMvZ2xURjInO1xuaW1wb3J0IHsgX2Zyb20sIF9mcm9tU3RyaW5nLCBFbnVtQ2xhc3MsIHR5cGUgRW51bUlPIH0gZnJvbSAnLi4vbWlzYy9FbnVtSU8nO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHR5cGUgeyBDb21wb25lbnRUeXBlRW51bSB9IGZyb20gJy4vQ29tcG9uZW50VHlwZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcG9zaXRpb25UeXBlRW51bSBleHRlbmRzIEVudW1JTyB7XG4gIHdlYmdwdTogc3RyaW5nO1xuICB3Z3NsOiBzdHJpbmc7XG4gIGdldE51bWJlck9mQ29tcG9uZW50cygpOiBDb3VudDtcbiAgZ2V0R2xzbFN0cihjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlRW51bSk6IHN0cmluZztcbiAgZ2V0R2xzbEluaXRpYWxWYWx1ZShjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlRW51bSk6IHN0cmluZztcbiAgdG9XR1NMVHlwZShjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlRW51bSk6IHN0cmluZztcbiAgZ2V0V2dzbEluaXRpYWxWYWx1ZShjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlRW51bSk6IHN0cmluZztcbiAgZ2V0VmVjNFNpemVPZlByb3BlcnR5KCk6IEluZGV4T2YxNkJ5dGVzO1xufVxuXG5jbGFzcyBDb21wb3NpdGlvblR5cGVDbGFzczxUeXBlTmFtZSBleHRlbmRzIHN0cmluZz4gZXh0ZW5kcyBFbnVtQ2xhc3MgaW1wbGVtZW50cyBDb21wb3NpdGlvblR5cGVFbnVtIHtcbiAgcmVhZG9ubHkgX19udW1iZXJPZkNvbXBvbmVudHM6IG51bWJlcjtcbiAgcmVhZG9ubHkgX19nbHNsU3RyOiBzdHJpbmc7XG4gIHJlYWRvbmx5IF9faGxzbFN0cjogc3RyaW5nO1xuICByZWFkb25seSBfX3dlYmdwdVN0cjogc3RyaW5nO1xuICByZWFkb25seSBfX3dnc2xTdHI6IHN0cmluZztcbiAgcmVhZG9ubHkgX19pc0FycmF5OiBib29sZWFuO1xuICByZWFkb25seSBfX3ZlYzRTaXplT2ZQcm9wZXJ0eTogSW5kZXhPZjE2Qnl0ZXM7XG4gIHJlYWRvbmx5IF9fZHVtbXlTdHI6IFR5cGVOYW1lO1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgaW5kZXgsXG4gICAgc3RyLFxuICAgIGdsc2xTdHIsXG4gICAgaGxzbFN0cixcbiAgICB3Z3NsLFxuICAgIHdlYmdwdSxcbiAgICBudW1iZXJPZkNvbXBvbmVudHMsXG4gICAgdmVjNFNpemVPZlByb3BlcnR5LFxuICAgIGlzQXJyYXkgPSBmYWxzZSxcbiAgfToge1xuICAgIGluZGV4OiBudW1iZXI7XG4gICAgc3RyOiBUeXBlTmFtZTtcbiAgICBnbHNsU3RyOiBzdHJpbmc7XG4gICAgaGxzbFN0cjogc3RyaW5nO1xuICAgIHdnc2w6IHN0cmluZztcbiAgICB3ZWJncHU6IHN0cmluZztcbiAgICBudW1iZXJPZkNvbXBvbmVudHM6IG51bWJlcjtcbiAgICB2ZWM0U2l6ZU9mUHJvcGVydHk6IEluZGV4T2YxNkJ5dGVzO1xuICAgIGlzQXJyYXk/OiBib29sZWFuO1xuICB9KSB7XG4gICAgc3VwZXIoeyBpbmRleCwgc3RyIH0pO1xuICAgIHRoaXMuX19udW1iZXJPZkNvbXBvbmVudHMgPSBudW1iZXJPZkNvbXBvbmVudHM7XG4gICAgdGhpcy5fX2dsc2xTdHIgPSBnbHNsU3RyO1xuICAgIHRoaXMuX19obHNsU3RyID0gaGxzbFN0cjtcbiAgICB0aGlzLl9fdmVjNFNpemVPZlByb3BlcnR5ID0gdmVjNFNpemVPZlByb3BlcnR5O1xuICAgIHRoaXMuX19pc0FycmF5ID0gaXNBcnJheTtcbiAgICB0aGlzLl9fd2ViZ3B1U3RyID0gd2ViZ3B1O1xuICAgIHRoaXMuX193Z3NsU3RyID0gd2dzbDtcbiAgICB0aGlzLl9fZHVtbXlTdHIgPSBzdHI7XG4gIH1cblxuICBnZXQgd2ViZ3B1KCkge1xuICAgIHJldHVybiB0aGlzLl9fd2ViZ3B1U3RyO1xuICB9XG5cbiAgZ2V0IHdnc2woKSB7XG4gICAgcmV0dXJuIHRoaXMuX193Z3NsU3RyO1xuICB9XG5cbiAgZ2V0TnVtYmVyT2ZDb21wb25lbnRzKCk6IENvdW50IHtcbiAgICByZXR1cm4gdGhpcy5fX251bWJlck9mQ29tcG9uZW50cztcbiAgfVxuXG4gIGdldEdsc2xTdHIoY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZUVudW0pIHtcbiAgICBpZiAoXG4gICAgICBjb21wb25lbnRUeXBlLmluZGV4ID09PSA1MTI2IHx8IC8vIEZMT0FUXG4gICAgICBjb21wb25lbnRUeXBlLmluZGV4ID09PSA1MTI3IHx8IC8vIERPVUJMRVxuICAgICAgY29tcG9uZW50VHlwZS5pbmRleCA9PT0gLTEgfHwgLy8gVU5LTk9XTlxuICAgICAgdGhpcyA9PT0gQ29tcG9zaXRpb25UeXBlLlRleHR1cmUyRCB8fFxuICAgICAgdGhpcyA9PT0gQ29tcG9zaXRpb25UeXBlLlRleHR1cmUyRFNoYWRvdyB8fFxuICAgICAgdGhpcyA9PT0gQ29tcG9zaXRpb25UeXBlLlRleHR1cmUyRFJlY3QgfHxcbiAgICAgIHRoaXMgPT09IENvbXBvc2l0aW9uVHlwZS5UZXh0dXJlQ3ViZSB8fFxuICAgICAgdGhpcyA9PT0gQ29tcG9zaXRpb25UeXBlLlRleHR1cmUyREFycmF5XG4gICAgKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2dsc2xTdHI7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIGNvbXBvbmVudFR5cGUuaW5kZXggPT09IDUxMjAgfHwgLy8gQllURVxuICAgICAgY29tcG9uZW50VHlwZS5pbmRleCA9PT0gNTEyMiB8fCAvLyBTSE9SVFxuICAgICAgY29tcG9uZW50VHlwZS5pbmRleCA9PT0gNTEyNCAvLyBJTlRcbiAgICApIHtcbiAgICAgIGlmICh0aGlzID09PSBDb21wb3NpdGlvblR5cGUuU2NhbGFyIHx8IHRoaXMgPT09IENvbXBvc2l0aW9uVHlwZS5TY2FsYXJBcnJheSkge1xuICAgICAgICByZXR1cm4gJ2ludCc7XG4gICAgICB9XG4gICAgICByZXR1cm4gYGkke3RoaXMuX19nbHNsU3RyfWA7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIGNvbXBvbmVudFR5cGUuaW5kZXggPT09IDUxMjEgfHwgLy8gVU5TSUdORURfQllURVxuICAgICAgY29tcG9uZW50VHlwZS5pbmRleCA9PT0gNTEyMyB8fCAvLyBVTlNJR05FRF9TSE9SVFxuICAgICAgY29tcG9uZW50VHlwZS5pbmRleCA9PT0gNTEyNSAvLyBVTlNJR05FRF9JTlRcbiAgICApIHtcbiAgICAgIGlmICh0aGlzID09PSBDb21wb3NpdGlvblR5cGUuU2NhbGFyIHx8IHRoaXMgPT09IENvbXBvc2l0aW9uVHlwZS5TY2FsYXJBcnJheSkge1xuICAgICAgICByZXR1cm4gJ3VpbnQnO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGB1JHt0aGlzLl9fZ2xzbFN0cn1gO1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHByZXR0aWVyL3ByZXR0aWVyXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcHJldHRpZXIvcHJldHRpZXJcbiAgICB9XG4gICAgaWYgKGNvbXBvbmVudFR5cGUuaW5kZXggPT09IDM1NjcwKSB7XG4gICAgICAvLyBCT09MXG4gICAgICByZXR1cm4gJ2Jvb2wnO1xuICAgIH1cbiAgICByZXR1cm4gJ3Vua25vd24nO1xuICB9XG5cbiAgZ2V0R2xzbEluaXRpYWxWYWx1ZShjb21wb25lbnRUeXBlOiBDb21wb25lbnRUeXBlRW51bSkge1xuICAgIGlmIChcbiAgICAgIGNvbXBvbmVudFR5cGUuaW5kZXggPT09IDUxMjYgfHwgLy8gRkxPQVRcbiAgICAgIGNvbXBvbmVudFR5cGUuaW5kZXggPT09IDUxMjcgLy8gRE9VQkxFXG4gICAgKSB7XG4gICAgICBpZiAodGhpcyA9PT0gQ29tcG9zaXRpb25UeXBlLlNjYWxhcikge1xuICAgICAgICByZXR1cm4gJzAuMCc7XG4gICAgICB9XG4gICAgICBjb25zdCBnbHNsVHlwZSA9IHRoaXMuZ2V0R2xzbFN0cihjb21wb25lbnRUeXBlKTtcbiAgICAgIGlmICh0aGlzLl9fbnVtYmVyT2ZDb21wb25lbnRzID09PSAyKSB7XG4gICAgICAgIHJldHVybiBgJHtnbHNsVHlwZX0oMC4wLCAwLjApYDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fbnVtYmVyT2ZDb21wb25lbnRzID09PSAzKSB7XG4gICAgICAgIHJldHVybiBgJHtnbHNsVHlwZX0oMC4wLCAwLjAsIDAuMClgO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX19udW1iZXJPZkNvbXBvbmVudHMgPT09IDQpIHtcbiAgICAgICAgcmV0dXJuIGAke2dsc2xUeXBlfSgwLjAsIDAuMCwgMC4wLCAwLjApYDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fbnVtYmVyT2ZDb21wb25lbnRzID09PSA5KSB7XG4gICAgICAgIHJldHVybiBgJHtnbHNsVHlwZX0oMC4wLCAwLjAsIDAuMCwgMC4wLCAwLjAsIDAuMCwgMC4wLCAwLjAsIDAuMClgO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX19udW1iZXJPZkNvbXBvbmVudHMgPT09IDE2KSB7XG4gICAgICAgIHJldHVybiBgJHtnbHNsVHlwZX0oMC4wLCAwLjAsIDAuMCwgMC4wLCAwLjAsIDAuMCwgMC4wLCAwLjAsIDAuMCwgMC4wLCAwLjAsIDAuMCwgMC4wLCAwLjAsIDAuMCwgMC4wKWA7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIGNvbXBvbmVudFR5cGUuaW5kZXggPT09IDUxMjAgfHwgLy8gQllURVxuICAgICAgY29tcG9uZW50VHlwZS5pbmRleCA9PT0gNTEyMiB8fCAvLyBTSE9SVFxuICAgICAgY29tcG9uZW50VHlwZS5pbmRleCA9PT0gNTEyNCAvLyBJTlRcbiAgICApIHtcbiAgICAgIGlmICh0aGlzID09PSBDb21wb3NpdGlvblR5cGUuU2NhbGFyKSB7XG4gICAgICAgIHJldHVybiAnMCc7XG4gICAgICB9XG4gICAgICBjb25zdCBnbHNsVHlwZSA9IHRoaXMuZ2V0R2xzbFN0cihjb21wb25lbnRUeXBlKTtcbiAgICAgIGlmICh0aGlzLl9fbnVtYmVyT2ZDb21wb25lbnRzID09PSAyKSB7XG4gICAgICAgIHJldHVybiBgJHtnbHNsVHlwZX0oMCwgMClgO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX19udW1iZXJPZkNvbXBvbmVudHMgPT09IDMpIHtcbiAgICAgICAgcmV0dXJuIGAke2dsc2xUeXBlfSgwLCAwLCAwKWA7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fX251bWJlck9mQ29tcG9uZW50cyA9PT0gNCkge1xuICAgICAgICByZXR1cm4gYCR7Z2xzbFR5cGV9KDAsIDAsIDAsIDApYDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fbnVtYmVyT2ZDb21wb25lbnRzID09PSA5KSB7XG4gICAgICAgIHJldHVybiBgJHtnbHNsVHlwZX0oMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMClgO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX19udW1iZXJPZkNvbXBvbmVudHMgPT09IDE2KSB7XG4gICAgICAgIHJldHVybiBgJHtnbHNsVHlwZX0oMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMClgO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoXG4gICAgICBjb21wb25lbnRUeXBlLmluZGV4ID09PSA1MTIxIHx8IC8vIFVOU0lHTkVEX0JZVEVcbiAgICAgIGNvbXBvbmVudFR5cGUuaW5kZXggPT09IDUxMjMgfHwgLy8gVU5TSUdORURfU0hPUlRcbiAgICAgIGNvbXBvbmVudFR5cGUuaW5kZXggPT09IDUxMjUgLy8gVU5TSUdORURfSU5UXG4gICAgKSB7XG4gICAgICBpZiAodGhpcyA9PT0gQ29tcG9zaXRpb25UeXBlLlNjYWxhcikge1xuICAgICAgICByZXR1cm4gJzB1JztcbiAgICAgIH1cbiAgICAgIGNvbnN0IGdsc2xUeXBlID0gdGhpcy5nZXRHbHNsU3RyKGNvbXBvbmVudFR5cGUpO1xuICAgICAgaWYgKHRoaXMuX19udW1iZXJPZkNvbXBvbmVudHMgPT09IDIpIHtcbiAgICAgICAgcmV0dXJuIGAke2dsc2xUeXBlfSgwdSwgMHUpYDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fbnVtYmVyT2ZDb21wb25lbnRzID09PSAzKSB7XG4gICAgICAgIHJldHVybiBgJHtnbHNsVHlwZX0oMHUsIDB1LCAwdSlgO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX19udW1iZXJPZkNvbXBvbmVudHMgPT09IDQpIHtcbiAgICAgICAgcmV0dXJuIGAke2dsc2xUeXBlfSgwdSwgMHUsIDB1LCAwdSlgO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX19udW1iZXJPZkNvbXBvbmVudHMgPT09IDkpIHtcbiAgICAgICAgcmV0dXJuIGAke2dsc2xUeXBlfSgwdSwgMHUsIDB1LCAwdSwgMHUsIDB1LCAwdSwgMHUsIDB1KWA7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fX251bWJlck9mQ29tcG9uZW50cyA9PT0gMTYpIHtcbiAgICAgICAgcmV0dXJuIGAke2dsc2xUeXBlfSgwdSwgMHUsIDB1LCAwdSwgMHUsIDB1LCAwdSwgMHUsIDB1LCAwdSwgMHUsIDB1LCAwdSwgMHUsIDB1LCAwdSlgO1xuICAgICAgfVxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHByZXR0aWVyL3ByZXR0aWVyXG4gICAgfSBlbHNlIGlmIChjb21wb25lbnRUeXBlLmluZGV4ID09PSAzNTY3MCkge1xuICAgICAgLy8gQk9PTFxuICAgICAgaWYgKHRoaXMgPT09IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIpIHtcbiAgICAgICAgcmV0dXJuICdmYWxzZSc7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fX251bWJlck9mQ29tcG9uZW50cyA9PT0gMikge1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5fX2dsc2xTdHJ9KGZhbHNlLCBmYWxzZSlgO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX19udW1iZXJPZkNvbXBvbmVudHMgPT09IDMpIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMuX19nbHNsU3RyfShmYWxzZSwgZmFsc2UsIGZhbHNlKWA7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fX251bWJlck9mQ29tcG9uZW50cyA9PT0gNCkge1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5fX2dsc2xTdHJ9KGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlKWA7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAndW5rbm93bic7XG4gIH1cblxuICBnZXRXZ3NsSW5pdGlhbFZhbHVlKGNvbXBvbmVudFR5cGU6IENvbXBvbmVudFR5cGVFbnVtKSB7XG4gICAgY29uc3QgdHlwZSA9IHRoaXMudG9XR1NMVHlwZShjb21wb25lbnRUeXBlKTtcbiAgICBpZiAoXG4gICAgICBjb21wb25lbnRUeXBlLmluZGV4ID09PSA1MTI2IHx8IC8vIEZMT0FUXG4gICAgICBjb21wb25lbnRUeXBlLmluZGV4ID09PSA1MTI3IC8vIERPVUJMRVxuICAgICkge1xuICAgICAgaWYgKHRoaXMgPT09IENvbXBvc2l0aW9uVHlwZS5TY2FsYXIpIHtcbiAgICAgICAgcmV0dXJuICcwLjAnO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX19udW1iZXJPZkNvbXBvbmVudHMgPT09IDIpIHtcbiAgICAgICAgcmV0dXJuIGAke3R5cGV9KDAuMCwgMC4wKWA7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fX251bWJlck9mQ29tcG9uZW50cyA9PT0gMykge1xuICAgICAgICByZXR1cm4gYCR7dHlwZX0oMC4wLCAwLjAsIDAuMClgO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX19udW1iZXJPZkNvbXBvbmVudHMgPT09IDQpIHtcbiAgICAgICAgcmV0dXJuIGAke3R5cGV9KDAuMCwgMC4wLCAwLjAsIDAuMClgO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX19udW1iZXJPZkNvbXBvbmVudHMgPT09IDkpIHtcbiAgICAgICAgcmV0dXJuIGAke3R5cGV9KDAuMCwgMC4wLCAwLjAsIDAuMCwgMC4wLCAwLjAsIDAuMCwgMC4wLCAwLjApYDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fbnVtYmVyT2ZDb21wb25lbnRzID09PSAxNikge1xuICAgICAgICByZXR1cm4gYCR7dHlwZX0oMC4wLCAwLjAsIDAuMCwgMC4wLCAwLjAsIDAuMCwgMC4wLCAwLjAsIDAuMCwgMC4wLCAwLjAsIDAuMCwgMC4wLCAwLjAsIDAuMCwgMC4wKWA7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIGNvbXBvbmVudFR5cGUuaW5kZXggPT09IDUxMjAgfHwgLy8gQllURVxuICAgICAgY29tcG9uZW50VHlwZS5pbmRleCA9PT0gNTEyMiB8fCAvLyBTSE9SVFxuICAgICAgY29tcG9uZW50VHlwZS5pbmRleCA9PT0gNTEyNCB8fCAvLyBJTlRcbiAgICAgIGNvbXBvbmVudFR5cGUuaW5kZXggPT09IDUxMjEgfHwgLy8gVU5TSUdORURfQllURVxuICAgICAgY29tcG9uZW50VHlwZS5pbmRleCA9PT0gNTEyMyB8fCAvLyBVTlNJR05FRF9TSE9SVFxuICAgICAgY29tcG9uZW50VHlwZS5pbmRleCA9PT0gNTEyNSAvLyBVTlNJR05FRF9JTlRcbiAgICApIHtcbiAgICAgIGlmICh0aGlzID09PSBDb21wb3NpdGlvblR5cGUuU2NhbGFyKSB7XG4gICAgICAgIHJldHVybiAnMCc7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fX251bWJlck9mQ29tcG9uZW50cyA9PT0gMikge1xuICAgICAgICByZXR1cm4gYCR7dHlwZX0oMCwgMClgO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX19udW1iZXJPZkNvbXBvbmVudHMgPT09IDMpIHtcbiAgICAgICAgcmV0dXJuIGAke3R5cGV9KDAsIDAsIDApYDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fbnVtYmVyT2ZDb21wb25lbnRzID09PSA0KSB7XG4gICAgICAgIHJldHVybiBgJHt0eXBlfSgwLCAwLCAwLCAwKWA7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fX251bWJlck9mQ29tcG9uZW50cyA9PT0gOSkge1xuICAgICAgICByZXR1cm4gYCR7dHlwZX0oMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgMClgO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX19udW1iZXJPZkNvbXBvbmVudHMgPT09IDE2KSB7XG4gICAgICAgIHJldHVybiBgJHt0eXBlfSgwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwKWA7XG4gICAgICB9XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcHJldHRpZXIvcHJldHRpZXJcbiAgICB9IGVsc2UgaWYgKGNvbXBvbmVudFR5cGUuaW5kZXggPT09IDM1NjcwKSB7XG4gICAgICAvLyBCT09MXG4gICAgICBpZiAodGhpcyA9PT0gQ29tcG9zaXRpb25UeXBlLlNjYWxhcikge1xuICAgICAgICByZXR1cm4gJ2ZhbHNlJztcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fbnVtYmVyT2ZDb21wb25lbnRzID09PSAyKSB7XG4gICAgICAgIHJldHVybiBgJHt0eXBlfShmYWxzZSwgZmFsc2UpYDtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fbnVtYmVyT2ZDb21wb25lbnRzID09PSAzKSB7XG4gICAgICAgIHJldHVybiBgJHt0eXBlfShmYWxzZSwgZmFsc2UsIGZhbHNlKWA7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fX251bWJlck9mQ29tcG9uZW50cyA9PT0gNCkge1xuICAgICAgICByZXR1cm4gYCR7dHlwZX0oZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UpYDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICd1bmtub3duJztcbiAgfVxuXG4gIHRvV0dTTFR5cGUoY29tcG9uZW50VHlwZTogQ29tcG9uZW50VHlwZUVudW0pOiBzdHJpbmcge1xuICAgIGxldCByZXN1bHQgPSB0aGlzLl9fd2dzbFN0ci5yZXBsYWNlKCcjJywgY29tcG9uZW50VHlwZS53Z3NsKTtcbiAgICAvLyBGb3Igc3RydWN0IHR5cGVzLCByZW1vdmUgdGhlICdzdHJ1Y3QgJyBwcmVmaXggZm9yIFdHU0wgdmFyaWFibGUgZGVjbGFyYXRpb25zXG4gICAgaWYgKHJlc3VsdC5zdGFydHNXaXRoKCdzdHJ1Y3QgJykpIHtcbiAgICAgIHJlc3VsdCA9IHJlc3VsdC5yZXBsYWNlKCdzdHJ1Y3QgJywgJycpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZ2V0VmVjNFNpemVPZlByb3BlcnR5KCk6IEluZGV4T2YxNkJ5dGVzIHtcbiAgICByZXR1cm4gdGhpcy5fX3ZlYzRTaXplT2ZQcm9wZXJ0eTtcbiAgfVxufVxuXG5jb25zdCBVbmtub3duID0gbmV3IENvbXBvc2l0aW9uVHlwZUNsYXNzKHtcbiAgaW5kZXg6IC0xLFxuICBzdHI6ICdVTktOT1dOJyxcbiAgZ2xzbFN0cjogJ3Vua25vd24nLFxuICBobHNsU3RyOiAndW5rbm93bicsXG4gIHdnc2w6ICd1bmtub3duJyxcbiAgd2ViZ3B1OiAndW5rbm93bicsXG4gIG51bWJlck9mQ29tcG9uZW50czogMCxcbiAgdmVjNFNpemVPZlByb3BlcnR5OiAwLFxufSk7XG5jb25zdCBTY2FsYXIgPSBuZXcgQ29tcG9zaXRpb25UeXBlQ2xhc3Moe1xuICBpbmRleDogMCxcbiAgc3RyOiAnU0NBTEFSJyxcbiAgZ2xzbFN0cjogJ2Zsb2F0JyxcbiAgaGxzbFN0cjogJ2Zsb2F0JyxcbiAgd2dzbDogJyMnLFxuICB3ZWJncHU6ICcnLFxuICBudW1iZXJPZkNvbXBvbmVudHM6IDEsXG4gIHZlYzRTaXplT2ZQcm9wZXJ0eTogMSxcbn0pO1xuY29uc3QgVmVjMiA9IG5ldyBDb21wb3NpdGlvblR5cGVDbGFzcyh7XG4gIGluZGV4OiAxLFxuICBzdHI6ICdWRUMyJyxcbiAgZ2xzbFN0cjogJ3ZlYzInLFxuICBobHNsU3RyOiAnZmxvYXQyJyxcbiAgd2dzbDogJ3ZlYzI8Iz4nLFxuICB3ZWJncHU6ICd4MicsXG4gIG51bWJlck9mQ29tcG9uZW50czogMixcbiAgdmVjNFNpemVPZlByb3BlcnR5OiAxLFxufSk7XG5jb25zdCBWZWMzID0gbmV3IENvbXBvc2l0aW9uVHlwZUNsYXNzKHtcbiAgaW5kZXg6IDIsXG4gIHN0cjogJ1ZFQzMnLFxuICBnbHNsU3RyOiAndmVjMycsXG4gIGhsc2xTdHI6ICdmbG9hdDMnLFxuICB3Z3NsOiAndmVjMzwjPicsXG4gIHdlYmdwdTogJ3gzJyxcbiAgbnVtYmVyT2ZDb21wb25lbnRzOiAzLFxuICB2ZWM0U2l6ZU9mUHJvcGVydHk6IDEsXG59KTtcbmNvbnN0IFZlYzQgPSBuZXcgQ29tcG9zaXRpb25UeXBlQ2xhc3Moe1xuICBpbmRleDogMyxcbiAgc3RyOiAnVkVDNCcsXG4gIGdsc2xTdHI6ICd2ZWM0JyxcbiAgaGxzbFN0cjogJ2Zsb2F0NCcsXG4gIHdnc2w6ICd2ZWM0PCM+JyxcbiAgd2ViZ3B1OiAneDQnLFxuICBudW1iZXJPZkNvbXBvbmVudHM6IDQsXG4gIHZlYzRTaXplT2ZQcm9wZXJ0eTogMSxcbn0pO1xuY29uc3QgTWF0MiA9IG5ldyBDb21wb3NpdGlvblR5cGVDbGFzcyh7XG4gIGluZGV4OiA0LFxuICBzdHI6ICdNQVQyJyxcbiAgZ2xzbFN0cjogJ21hdDInLFxuICBobHNsU3RyOiAnZmxvYXQyeDInLFxuICB3Z3NsOiAnbWF0MngyPCM+JyxcbiAgd2ViZ3B1OiAndW5rbm93bicsXG4gIG51bWJlck9mQ29tcG9uZW50czogNCxcbiAgdmVjNFNpemVPZlByb3BlcnR5OiAyLFxufSk7XG5jb25zdCBNYXQzID0gbmV3IENvbXBvc2l0aW9uVHlwZUNsYXNzKHtcbiAgaW5kZXg6IDUsXG4gIHN0cjogJ01BVDMnLFxuICBnbHNsU3RyOiAnbWF0MycsXG4gIGhsc2xTdHI6ICdmbG9hdDN4MycsXG4gIHdnc2w6ICdtYXQzeDM8Iz4nLFxuICB3ZWJncHU6ICd1bmtub3duJyxcbiAgbnVtYmVyT2ZDb21wb25lbnRzOiA5LFxuICB2ZWM0U2l6ZU9mUHJvcGVydHk6IDMsXG59KTtcbmNvbnN0IE1hdDQgPSBuZXcgQ29tcG9zaXRpb25UeXBlQ2xhc3Moe1xuICBpbmRleDogNixcbiAgc3RyOiAnTUFUNCcsXG4gIGdsc2xTdHI6ICdtYXQ0JyxcbiAgaGxzbFN0cjogJ2Zsb2F0NHg0JyxcbiAgd2dzbDogJ21hdDR4NDwjPicsXG4gIHdlYmdwdTogJ3Vua25vd24nLFxuICBudW1iZXJPZkNvbXBvbmVudHM6IDE2LFxuICB2ZWM0U2l6ZU9mUHJvcGVydHk6IDQsXG59KTtcbmNvbnN0IFRleHR1cmUyRCA9IG5ldyBDb21wb3NpdGlvblR5cGVDbGFzcyh7XG4gIGluZGV4OiA3LFxuICBzdHI6ICdURVhUVVJFXzJEJyxcbiAgZ2xzbFN0cjogJ3NhbXBsZXIyRCcsXG4gIGhsc2xTdHI6ICdUZXh0dXJlMkQnLFxuICB3Z3NsOiAndGV4dHVyZV8yZCcsXG4gIHdlYmdwdTogJ3RleHR1cmVfMmQnLFxuICBudW1iZXJPZkNvbXBvbmVudHM6IDEsXG4gIHZlYzRTaXplT2ZQcm9wZXJ0eTogMSxcbn0pO1xuY29uc3QgVGV4dHVyZUN1YmUgPSBuZXcgQ29tcG9zaXRpb25UeXBlQ2xhc3Moe1xuICBpbmRleDogOCxcbiAgc3RyOiAnVEVYVFVSRV9DVUJFX01BUCcsXG4gIGdsc2xTdHI6ICdzYW1wbGVyQ3ViZScsXG4gIGhsc2xTdHI6ICdUZXh0dXJlQ3ViZScsXG4gIHdnc2w6ICd0ZXh0dXJlX2N1YmUnLFxuICB3ZWJncHU6ICd0ZXh0dXJlX2N1YmUnLFxuICBudW1iZXJPZkNvbXBvbmVudHM6IDEsXG4gIHZlYzRTaXplT2ZQcm9wZXJ0eTogMSxcbn0pO1xuY29uc3QgU2NhbGFyQXJyYXkgPSBuZXcgQ29tcG9zaXRpb25UeXBlQ2xhc3Moe1xuICBpbmRleDogOSxcbiAgc3RyOiAnU0NBTEFSX0FSUkFZJyxcbiAgZ2xzbFN0cjogJ2Zsb2F0JyxcbiAgaGxzbFN0cjogJ2Zsb2F0JyxcbiAgd2dzbDogJyMnLFxuICB3ZWJncHU6ICd1bmtub3duJyxcbiAgbnVtYmVyT2ZDb21wb25lbnRzOiAxLFxuICB2ZWM0U2l6ZU9mUHJvcGVydHk6IDEsXG4gIGlzQXJyYXk6IHRydWUsXG59KTtcbmNvbnN0IFZlYzJBcnJheSA9IG5ldyBDb21wb3NpdGlvblR5cGVDbGFzcyh7XG4gIGluZGV4OiAxMCxcbiAgc3RyOiAnVkVDMl9BUlJBWScsXG4gIGdsc2xTdHI6ICd2ZWMyJyxcbiAgaGxzbFN0cjogJ2Zsb2F0MicsXG4gIHdnc2w6ICd2ZWMyPCM+JyxcbiAgd2ViZ3B1OiAndW5rbm93bicsXG4gIG51bWJlck9mQ29tcG9uZW50czogMixcbiAgdmVjNFNpemVPZlByb3BlcnR5OiAxLFxuICBpc0FycmF5OiB0cnVlLFxufSk7XG5jb25zdCBWZWMzQXJyYXkgPSBuZXcgQ29tcG9zaXRpb25UeXBlQ2xhc3Moe1xuICBpbmRleDogMTEsXG4gIHN0cjogJ1ZFQzNfQVJSQVknLFxuICBnbHNsU3RyOiAndmVjMycsXG4gIGhsc2xTdHI6ICdmbG9hdDMnLFxuICB3Z3NsOiAndmVjMzwjPicsXG4gIHdlYmdwdTogJ3Vua25vd24nLFxuICBudW1iZXJPZkNvbXBvbmVudHM6IDMsXG4gIHZlYzRTaXplT2ZQcm9wZXJ0eTogMSxcbiAgaXNBcnJheTogdHJ1ZSxcbn0pO1xuY29uc3QgVmVjNEFycmF5ID0gbmV3IENvbXBvc2l0aW9uVHlwZUNsYXNzKHtcbiAgaW5kZXg6IDEyLFxuICBzdHI6ICdWRUM0X0FSUkFZJyxcbiAgZ2xzbFN0cjogJ3ZlYzQnLFxuICBobHNsU3RyOiAnZmxvYXQ0JyxcbiAgd2dzbDogJ3ZlYzQ8Iz4nLFxuICB3ZWJncHU6ICd1bmtub3duJyxcbiAgbnVtYmVyT2ZDb21wb25lbnRzOiA0LFxuICB2ZWM0U2l6ZU9mUHJvcGVydHk6IDEsXG4gIGlzQXJyYXk6IHRydWUsXG59KTtcbmNvbnN0IE1hdDRBcnJheSA9IG5ldyBDb21wb3NpdGlvblR5cGVDbGFzcyh7XG4gIGluZGV4OiAxMyxcbiAgc3RyOiAnTUFUNF9BUlJBWScsXG4gIGdsc2xTdHI6ICdtYXQ0JyxcbiAgaGxzbFN0cjogJ2Zsb2F0NHg0JyxcbiAgd2dzbDogJ21hdDR4NDwjPicsXG4gIHdlYmdwdTogJ3Vua25vd24nLFxuICBudW1iZXJPZkNvbXBvbmVudHM6IDE2LFxuICB2ZWM0U2l6ZU9mUHJvcGVydHk6IDQsXG4gIGlzQXJyYXk6IHRydWUsXG59KTtcbmNvbnN0IE1hdDNBcnJheSA9IG5ldyBDb21wb3NpdGlvblR5cGVDbGFzcyh7XG4gIGluZGV4OiAxNCxcbiAgc3RyOiAnTUFUM19BUlJBWScsXG4gIGdsc2xTdHI6ICdtYXQzJyxcbiAgaGxzbFN0cjogJ2Zsb2F0M3gzJyxcbiAgd2dzbDogJ21hdDN4MzwjPicsXG4gIHdlYmdwdTogJ3Vua25vd24nLFxuICBudW1iZXJPZkNvbXBvbmVudHM6IDksXG4gIHZlYzRTaXplT2ZQcm9wZXJ0eTogMyxcbiAgaXNBcnJheTogdHJ1ZSxcbn0pO1xuY29uc3QgTWF0MkFycmF5ID0gbmV3IENvbXBvc2l0aW9uVHlwZUNsYXNzKHtcbiAgaW5kZXg6IDE1LFxuICBzdHI6ICdNQVQyX0FSUkFZJyxcbiAgZ2xzbFN0cjogJ21hdDInLFxuICBobHNsU3RyOiAnZmxvYXQyeDInLFxuICB3Z3NsOiAnbWF0MngyPCM+JyxcbiAgd2ViZ3B1OiAndW5rbm93bicsXG4gIG51bWJlck9mQ29tcG9uZW50czogNCxcbiAgdmVjNFNpemVPZlByb3BlcnR5OiAyLFxuICBpc0FycmF5OiB0cnVlLFxufSk7XG5jb25zdCBUZXh0dXJlMkRTaGFkb3cgPSBuZXcgQ29tcG9zaXRpb25UeXBlQ2xhc3Moe1xuICBpbmRleDogMTYsXG4gIHN0cjogJ1RFWFRVUkVfMkRfU0hBRE9XJyxcbiAgZ2xzbFN0cjogJ2hpZ2hwIHNhbXBsZXIyRFNoYWRvdycsXG4gIGhsc2xTdHI6ICdUZXh0dXJlMkQnLFxuICB3Z3NsOiAndGV4dHVyZV8yZCcsXG4gIHdlYmdwdTogJ3RleHR1cmVfMmQnLFxuICBudW1iZXJPZkNvbXBvbmVudHM6IDEsXG4gIHZlYzRTaXplT2ZQcm9wZXJ0eTogMSxcbn0pO1xuY29uc3QgVGV4dHVyZTJEUmVjdCA9IG5ldyBDb21wb3NpdGlvblR5cGVDbGFzcyh7XG4gIGluZGV4OiAxNyxcbiAgc3RyOiAnVEVYVFVSRV8yRF9SRUNUJyxcbiAgZ2xzbFN0cjogJ3NhbXBsZXIyRFJlY3QnLFxuICBobHNsU3RyOiAnVGV4dHVyZTJEJyxcbiAgd2dzbDogJ3RleHR1cmVfMmQnLFxuICB3ZWJncHU6ICd0ZXh0dXJlXzJkJyxcbiAgbnVtYmVyT2ZDb21wb25lbnRzOiAxLFxuICB2ZWM0U2l6ZU9mUHJvcGVydHk6IDEsXG59KTtcbmNvbnN0IFRleHR1cmUyREFycmF5ID0gbmV3IENvbXBvc2l0aW9uVHlwZUNsYXNzKHtcbiAgaW5kZXg6IDE4LFxuICBzdHI6ICdURVhUVVJFXzJEX0FSUkFZJyxcbiAgZ2xzbFN0cjogJ3NhbXBsZXIyREFycmF5JyxcbiAgaGxzbFN0cjogJ1RleHR1cmUyREFycmF5JyxcbiAgd2dzbDogJ3RleHR1cmVfMmRfYXJyYXknLFxuICB3ZWJncHU6ICd0ZXh0dXJlXzJkX2FycmF5JyxcbiAgbnVtYmVyT2ZDb21wb25lbnRzOiAxLFxuICB2ZWM0U2l6ZU9mUHJvcGVydHk6IDEsXG59KTtcbmNvbnN0IE1hdDR4M0FycmF5ID0gbmV3IENvbXBvc2l0aW9uVHlwZUNsYXNzKHtcbiAgaW5kZXg6IDE5LFxuICBzdHI6ICdNQVQ0eDNfQVJSQVknLFxuICBnbHNsU3RyOiAnbWF0NHgzJyxcbiAgaGxzbFN0cjogJ2Zsb2F0NHgzJyxcbiAgd2dzbDogJ21hdDR4MzwjPicsXG4gIHdlYmdwdTogJ3Vua25vd24nLFxuICBudW1iZXJPZkNvbXBvbmVudHM6IDEyLFxuICB2ZWM0U2l6ZU9mUHJvcGVydHk6IDMsXG4gIGlzQXJyYXk6IHRydWUsXG59KTtcbmNvbnN0IFNwZWN1bGFyUHJvcHMgPSBuZXcgQ29tcG9zaXRpb25UeXBlQ2xhc3Moe1xuICBpbmRleDogMjAsXG4gIHN0cjogJ1NQRUNVTEFSX1BST1BTJyxcbiAgZ2xzbFN0cjogJ3N0cnVjdCBTcGVjdWxhclByb3BzJyxcbiAgaGxzbFN0cjogJ3N0cnVjdCBTcGVjdWxhclByb3BzJyxcbiAgd2dzbDogJ3N0cnVjdCBTcGVjdWxhclByb3BzJyxcbiAgd2ViZ3B1OiAnc3RydWN0IFNwZWN1bGFyUHJvcHMnLFxuICBudW1iZXJPZkNvbXBvbmVudHM6IC0xLFxuICB2ZWM0U2l6ZU9mUHJvcGVydHk6IC0xLFxufSk7XG5jb25zdCBWb2x1bWVQcm9wcyA9IG5ldyBDb21wb3NpdGlvblR5cGVDbGFzcyh7XG4gIGluZGV4OiAyMSxcbiAgc3RyOiAnVk9MVU1FX1BST1BTJyxcbiAgZ2xzbFN0cjogJ3N0cnVjdCBWb2x1bWVQcm9wcycsXG4gIGhsc2xTdHI6ICdzdHJ1Y3QgVm9sdW1lUHJvcHMnLFxuICB3Z3NsOiAnc3RydWN0IFZvbHVtZVByb3BzJyxcbiAgd2ViZ3B1OiAnc3RydWN0IFZvbHVtZVByb3BzJyxcbiAgbnVtYmVyT2ZDb21wb25lbnRzOiAtMSxcbiAgdmVjNFNpemVPZlByb3BlcnR5OiAtMSxcbn0pO1xuY29uc3QgQ2xlYXJjb2F0UHJvcHMgPSBuZXcgQ29tcG9zaXRpb25UeXBlQ2xhc3Moe1xuICBpbmRleDogMjIsXG4gIHN0cjogJ0NMRUFSQ09BVF9QUk9QUycsXG4gIGdsc2xTdHI6ICdzdHJ1Y3QgQ2xlYXJjb2F0UHJvcHMnLFxuICBobHNsU3RyOiAnc3RydWN0IENsZWFyY29hdFByb3BzJyxcbiAgd2dzbDogJ3N0cnVjdCBDbGVhcmNvYXRQcm9wcycsXG4gIHdlYmdwdTogJ3N0cnVjdCBDbGVhcmNvYXRQcm9wcycsXG4gIG51bWJlck9mQ29tcG9uZW50czogLTEsXG4gIHZlYzRTaXplT2ZQcm9wZXJ0eTogLTEsXG59KTtcbmNvbnN0IEFuaXNvdHJvcHlQcm9wcyA9IG5ldyBDb21wb3NpdGlvblR5cGVDbGFzcyh7XG4gIGluZGV4OiAyMyxcbiAgc3RyOiAnQU5JU09UUk9QWV9QUk9QUycsXG4gIGdsc2xTdHI6ICdzdHJ1Y3QgQW5pc290cm9weVByb3BzJyxcbiAgaGxzbFN0cjogJ3N0cnVjdCBBbmlzb3Ryb3B5UHJvcHMnLFxuICB3Z3NsOiAnc3RydWN0IEFuaXNvdHJvcHlQcm9wcycsXG4gIHdlYmdwdTogJ3N0cnVjdCBBbmlzb3Ryb3B5UHJvcHMnLFxuICBudW1iZXJPZkNvbXBvbmVudHM6IC0xLFxuICB2ZWM0U2l6ZU9mUHJvcGVydHk6IC0xLFxufSk7XG5jb25zdCBTaGVlblByb3BzID0gbmV3IENvbXBvc2l0aW9uVHlwZUNsYXNzKHtcbiAgaW5kZXg6IDI0LFxuICBzdHI6ICdTSEVFTl9QUk9QUycsXG4gIGdsc2xTdHI6ICdzdHJ1Y3QgU2hlZW5Qcm9wcycsXG4gIGhsc2xTdHI6ICdzdHJ1Y3QgU2hlZW5Qcm9wcycsXG4gIHdnc2w6ICdzdHJ1Y3QgU2hlZW5Qcm9wcycsXG4gIHdlYmdwdTogJ3N0cnVjdCBTaGVlblByb3BzJyxcbiAgbnVtYmVyT2ZDb21wb25lbnRzOiAtMSxcbiAgdmVjNFNpemVPZlByb3BlcnR5OiAtMSxcbn0pO1xuY29uc3QgSXJpZGVzY2VuY2VQcm9wcyA9IG5ldyBDb21wb3NpdGlvblR5cGVDbGFzcyh7XG4gIGluZGV4OiAyNSxcbiAgc3RyOiAnSVJJREVTQ0VOQ0VfUFJPUFMnLFxuICBnbHNsU3RyOiAnc3RydWN0IElyaWRlc2NlbmNlUHJvcHMnLFxuICBobHNsU3RyOiAnc3RydWN0IElyaWRlc2NlbmNlUHJvcHMnLFxuICB3Z3NsOiAnc3RydWN0IElyaWRlc2NlbmNlUHJvcHMnLFxuICB3ZWJncHU6ICdzdHJ1Y3QgSXJpZGVzY2VuY2VQcm9wcycsXG4gIG51bWJlck9mQ29tcG9uZW50czogLTEsXG4gIHZlYzRTaXplT2ZQcm9wZXJ0eTogLTEsXG59KTtcbmNvbnN0IERpZmZ1c2VUcmFuc21pc3Npb25Qcm9wcyA9IG5ldyBDb21wb3NpdGlvblR5cGVDbGFzcyh7XG4gIGluZGV4OiAyNixcbiAgc3RyOiAnRElGRlVTRV9UUkFOU01JU1NJT05fUFJPUFMnLFxuICBnbHNsU3RyOiAnc3RydWN0IERpZmZ1c2VUcmFuc21pc3Npb25Qcm9wcycsXG4gIGhsc2xTdHI6ICdzdHJ1Y3QgRGlmZnVzZVRyYW5zbWlzc2lvblByb3BzJyxcbiAgd2dzbDogJ3N0cnVjdCBEaWZmdXNlVHJhbnNtaXNzaW9uUHJvcHMnLFxuICB3ZWJncHU6ICdzdHJ1Y3QgRGlmZnVzZVRyYW5zbWlzc2lvblByb3BzJyxcbiAgbnVtYmVyT2ZDb21wb25lbnRzOiAtMSxcbiAgdmVjNFNpemVPZlByb3BlcnR5OiAtMSxcbn0pO1xuY29uc3QgT2NjbHVzaW9uUHJvcHMgPSBuZXcgQ29tcG9zaXRpb25UeXBlQ2xhc3Moe1xuICBpbmRleDogMjcsXG4gIHN0cjogJ09DQ0xVU0lPTl9QUk9QUycsXG4gIGdsc2xTdHI6ICdzdHJ1Y3QgT2NjbHVzaW9uUHJvcHMnLFxuICBobHNsU3RyOiAnc3RydWN0IE9jY2x1c2lvblByb3BzJyxcbiAgd2dzbDogJ3N0cnVjdCBPY2NsdXNpb25Qcm9wcycsXG4gIHdlYmdwdTogJ3N0cnVjdCBPY2NsdXNpb25Qcm9wcycsXG4gIG51bWJlck9mQ29tcG9uZW50czogLTEsXG4gIHZlYzRTaXplT2ZQcm9wZXJ0eTogLTEsXG59KTtcbmNvbnN0IEVtaXNzaXZlUHJvcHMgPSBuZXcgQ29tcG9zaXRpb25UeXBlQ2xhc3Moe1xuICBpbmRleDogMjgsXG4gIHN0cjogJ0VNSVNTSVZFX1BST1BTJyxcbiAgZ2xzbFN0cjogJ3N0cnVjdCBFbWlzc2l2ZVByb3BzJyxcbiAgaGxzbFN0cjogJ3N0cnVjdCBFbWlzc2l2ZVByb3BzJyxcbiAgd2dzbDogJ3N0cnVjdCBFbWlzc2l2ZVByb3BzJyxcbiAgd2ViZ3B1OiAnc3RydWN0IEVtaXNzaXZlUHJvcHMnLFxuICBudW1iZXJPZkNvbXBvbmVudHM6IC0xLFxuICB2ZWM0U2l6ZU9mUHJvcGVydHk6IC0xLFxufSk7XG5jb25zdCB0eXBlTGlzdCA9IFtcbiAgVW5rbm93bixcbiAgU2NhbGFyLFxuICBWZWMyLFxuICBWZWMzLFxuICBWZWM0LFxuICBNYXQyLFxuICBNYXQzLFxuICBNYXQ0LFxuICBWZWMyQXJyYXksXG4gIFZlYzNBcnJheSxcbiAgVmVjNEFycmF5LFxuICBTY2FsYXJBcnJheSxcbiAgTWF0MkFycmF5LFxuICBNYXQzQXJyYXksXG4gIE1hdDRBcnJheSxcbiAgVGV4dHVyZTJELFxuICBUZXh0dXJlMkRTaGFkb3csXG4gIFRleHR1cmUyRFJlY3QsXG4gIFRleHR1cmVDdWJlLFxuICBNYXQ0eDNBcnJheSxcbiAgU3BlY3VsYXJQcm9wcyxcbiAgVm9sdW1lUHJvcHMsXG4gIENsZWFyY29hdFByb3BzLFxuICBBbmlzb3Ryb3B5UHJvcHMsXG4gIFNoZWVuUHJvcHMsXG4gIElyaWRlc2NlbmNlUHJvcHMsXG4gIERpZmZ1c2VUcmFuc21pc3Npb25Qcm9wcyxcbiAgT2NjbHVzaW9uUHJvcHMsXG4gIEVtaXNzaXZlUHJvcHMsXG5dO1xuXG5leHBvcnQgdHlwZSBWZWN0b3JDb21wb3NpdGlvblR5cGVzID0gdHlwZW9mIFNjYWxhciB8IHR5cGVvZiBWZWMyIHwgdHlwZW9mIFZlYzMgfCB0eXBlb2YgVmVjNDtcblxuZnVuY3Rpb24gZnJvbShpbmRleDogbnVtYmVyKTogQ29tcG9zaXRpb25UeXBlRW51bSB7XG4gIHJldHVybiBfZnJvbSh7IHR5cGVMaXN0LCBpbmRleCB9KSBhcyBDb21wb3NpdGlvblR5cGVFbnVtO1xufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nKHN0cjogc3RyaW5nKTogQ29tcG9zaXRpb25UeXBlRW51bSB7XG4gIHJldHVybiBfZnJvbVN0cmluZyh7IHR5cGVMaXN0LCBzdHIgfSkgYXMgQ29tcG9zaXRpb25UeXBlRW51bTtcbn1cblxuZnVuY3Rpb24gdmVjdG9yRnJvbShjb21wb25lbnROOiBudW1iZXIpOiBDb21wb3NpdGlvblR5cGVFbnVtIHtcbiAgbGV0IHN0ciA9ICcnO1xuICBzd2l0Y2ggKGNvbXBvbmVudE4pIHtcbiAgICBjYXNlIDE6XG4gICAgICBzdHIgPSAnc2NhbGFyJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMjpcbiAgICAgIHN0ciA9ICd2ZWMyJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgMzpcbiAgICAgIHN0ciA9ICd2ZWMzJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgNDpcbiAgICAgIHN0ciA9ICd2ZWM0JztcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignbm90IGZvdW5kIGFwcHJvcHJpYXRlIFZlY3RvcnMnKTtcbiAgfVxuICByZXR1cm4gX2Zyb21TdHJpbmcoeyB0eXBlTGlzdCwgc3RyIH0pIGFzIENvbXBvc2l0aW9uVHlwZUVudW07XG59XG5cbmZ1bmN0aW9uIGZyb21HbHNsU3RyaW5nKHN0cl86IHN0cmluZyk6IENvbXBvc2l0aW9uVHlwZUVudW0ge1xuICBsZXQgc3RyID0gc3RyXztcbiAgc3dpdGNoIChzdHJfKSB7XG4gICAgY2FzZSAnYm9vbCc6XG4gICAgICBzdHIgPSAnc2NhbGFyJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2ludCc6XG4gICAgICBzdHIgPSAnc2NhbGFyJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2Zsb2F0JzpcbiAgICAgIHN0ciA9ICdzY2FsYXInO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnaXZlYzInOlxuICAgICAgc3RyID0gJ3ZlYzInO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnaXZlYzMnOlxuICAgICAgc3RyID0gJ3ZlYzMnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnaXZlYzQnOlxuICAgICAgc3RyID0gJ3ZlYzQnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAndXZlYzInOlxuICAgICAgc3RyID0gJ3ZlYzInO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAndXZlYzMnOlxuICAgICAgc3RyID0gJ3ZlYzMnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAndXZlYzQnOlxuICAgICAgc3RyID0gJ3ZlYzQnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnc2FtcGxlcjJEJzpcbiAgICAgIHN0ciA9ICdURVhUVVJFXzJEJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3NhbXBsZXIyRFNoYWRvdyc6XG4gICAgICBzdHIgPSAnVEVYVFVSRV8yRF9TSEFET1cnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnc2FtcGxlcjJEUmVjdCc6XG4gICAgICBzdHIgPSAnVEVYVFVSRV8yRF9SRUNUJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3NhbXBsZXJDdWJlJzpcbiAgICAgIHN0ciA9ICdURVhUVVJFX0NVQkVfTUFQJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3NhbXBsZXIyREFycmF5JzpcbiAgICAgIHN0ciA9ICdURVhUVVJFXzJEX0FSUkFZJztcbiAgICAgIGJyZWFrO1xuICB9XG4gIHJldHVybiBfZnJvbVN0cmluZyh7IHR5cGVMaXN0LCBzdHIgfSkgYXMgQ29tcG9zaXRpb25UeXBlRW51bTtcbn1cblxuZnVuY3Rpb24gZnJvbVdnc2xTdHJpbmcoc3RyXzogc3RyaW5nKTogQ29tcG9zaXRpb25UeXBlRW51bSB7XG4gIGxldCBzdHIgPSBzdHJfO1xuICBzd2l0Y2ggKHN0cl8pIHtcbiAgICBjYXNlICdib29sJzpcbiAgICAgIHN0ciA9ICdzY2FsYXInO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnaTMyJzpcbiAgICAgIHN0ciA9ICdzY2FsYXInO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAndTMyJzpcbiAgICAgIHN0ciA9ICdzY2FsYXInO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnZjMyJzpcbiAgICAgIHN0ciA9ICdzY2FsYXInO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAndmVjMjxmMzI+JzpcbiAgICAgIHN0ciA9ICd2ZWMyJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3ZlYzM8ZjMyPic6XG4gICAgICBzdHIgPSAndmVjMyc7XG4gICAgICBicmVhaztcbiAgICBjYXNlICd2ZWM0PGYzMj4nOlxuICAgICAgc3RyID0gJ3ZlYzQnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbWF0MngyPGYzMj4nOlxuICAgICAgc3RyID0gJ21hdDInO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbWF0M3gzPGYzMj4nOlxuICAgICAgc3RyID0gJ21hdDMnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbWF0NHg0PGYzMj4nOlxuICAgICAgc3RyID0gJ21hdDQnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAndmVjMjxpMzI+JzpcbiAgICAgIHN0ciA9ICd2ZWMyJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3ZlYzM8aTMyPic6XG4gICAgICBzdHIgPSAndmVjMyc7XG4gICAgICBicmVhaztcbiAgICBjYXNlICd2ZWM0PGkzMj4nOlxuICAgICAgc3RyID0gJ3ZlYzQnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbWF0MngyPGkzMj4nOlxuICAgICAgc3RyID0gJ21hdDInO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbWF0M3gzPGkzMj4nOlxuICAgICAgc3RyID0gJ21hdDMnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbWF0NHg0PGkzMj4nOlxuICAgICAgc3RyID0gJ21hdDQnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnc2FtcGxlcl8yZCc6XG4gICAgICBzdHIgPSAnVEVYVFVSRV8yRCc7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdzYW1wbGVyXzJkX3NoYWRvdyc6XG4gICAgICBzdHIgPSAnVEVYVFVSRV8yRF9TSEFET1cnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnc2FtcGxlcl9jdWJlJzpcbiAgICAgIHN0ciA9ICdURVhUVVJFX0NVQkVfTUFQJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3NhbXBsZXJfMmRfYXJyYXknOlxuICAgICAgc3RyID0gJ1RFWFRVUkVfMkRfQVJSQVknO1xuICAgICAgYnJlYWs7XG4gIH1cbiAgcmV0dXJuIF9mcm9tU3RyaW5nKHsgdHlwZUxpc3QsIHN0ciB9KSBhcyBDb21wb3NpdGlvblR5cGVFbnVtO1xufVxuXG5mdW5jdGlvbiB0b0dsdGYyQWNjZXNzb3JDb21wb3NpdGlvblR5cGVTdHJpbmcoXG4gIGNvbXBvbmVudE46IFZlY3RvckFuZFNxdWFyZU1hdHJpeENvbXBvbmVudE5cbik6IEdsdGYyQWNjZXNzb3JDb21wb3NpdGlvblR5cGVTdHJpbmcge1xuICBzd2l0Y2ggKGNvbXBvbmVudE4pIHtcbiAgICBjYXNlIDE6XG4gICAgICByZXR1cm4gJ1NDQUxBUic7XG4gICAgY2FzZSAyOlxuICAgICAgcmV0dXJuICdWRUMyJztcbiAgICBjYXNlIDM6XG4gICAgICByZXR1cm4gJ1ZFQzMnO1xuICAgIGNhc2UgNDpcbiAgICAgIHJldHVybiAnVkVDNCc7XG4gICAgY2FzZSA5OlxuICAgICAgcmV0dXJuICdNQVQzJztcbiAgICBjYXNlIDE2OlxuICAgICAgcmV0dXJuICdNQVQ0JztcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbXBvbmVudE4nKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0b0dsdGYyQW5pbWF0aW9uQWNjZXNzb3JDb21wb3NpdGlvblR5cGVTdHJpbmcoXG4gIGNvbXBvbmVudE46IFZlY3RvckNvbXBvbmVudE5cbik6IEdsdGYyQWNjZXNzb3JDb21wb3NpdGlvblR5cGVTdHJpbmcge1xuICBzd2l0Y2ggKGNvbXBvbmVudE4pIHtcbiAgICBjYXNlIDE6XG4gICAgICByZXR1cm4gJ1NDQUxBUic7XG4gICAgY2FzZSAyOlxuICAgICAgcmV0dXJuICdWRUMyJztcbiAgICBjYXNlIDM6XG4gICAgICByZXR1cm4gJ1ZFQzMnO1xuICAgIGNhc2UgNDpcbiAgICAgIHJldHVybiAnVkVDNCc7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb21wb25lbnROJyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9HbHRmMlNxdWFyZU1hdHJpeEFjY2Vzc29yQ29tcG9zaXRpb25UeXBlU3RyaW5nKFxuICBjb21wb25lbnROOiBTcXVhcmVNYXRyaXhDb21wb25lbnROXG4pOiBHbHRmMkFjY2Vzc29yQ29tcG9zaXRpb25UeXBlU3RyaW5nIHtcbiAgc3dpdGNoIChjb21wb25lbnROKSB7XG4gICAgY2FzZSA0OlxuICAgICAgcmV0dXJuICdWRUM0JztcbiAgICBjYXNlIDk6XG4gICAgICByZXR1cm4gJ01BVDMnO1xuICAgIGNhc2UgMTY6XG4gICAgICByZXR1cm4gJ01BVDQnO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29tcG9uZW50TicpO1xuICB9XG59XG5cbmV4cG9ydCB0eXBlIEdsdGYyQW5pbWF0aW9uQWNjZXNzb3JDb21wb3NpdGlvblR5cGUgPSB0eXBlb2YgU2NhbGFyIHwgdHlwZW9mIFZlYzIgfCB0eXBlb2YgVmVjMyB8IHR5cGVvZiBWZWM0O1xuXG5leHBvcnQgdHlwZSBHbHRmMkFjY2Vzc29yQ29tcG9zaXRpb25UeXBlID1cbiAgfCB0eXBlb2YgU2NhbGFyXG4gIHwgdHlwZW9mIFZlYzJcbiAgfCB0eXBlb2YgVmVjM1xuICB8IHR5cGVvZiBWZWM0XG4gIHwgdHlwZW9mIE1hdDJcbiAgfCB0eXBlb2YgTWF0M1xuICB8IHR5cGVvZiBNYXQ0O1xuXG5mdW5jdGlvbiB0b0dsdGYyQW5pbWF0aW9uQWNjZXNzb3JDb21wb3NpdGlvblR5cGUoY29tcG9uZW50TjogVmVjdG9yQ29tcG9uZW50Tik6IEdsdGYyQW5pbWF0aW9uQWNjZXNzb3JDb21wb3NpdGlvblR5cGUge1xuICBzd2l0Y2ggKGNvbXBvbmVudE4pIHtcbiAgICBjYXNlIDE6XG4gICAgICByZXR1cm4gU2NhbGFyO1xuICAgIGNhc2UgMjpcbiAgICAgIHJldHVybiBWZWMyO1xuICAgIGNhc2UgMzpcbiAgICAgIHJldHVybiBWZWMzO1xuICAgIGNhc2UgNDpcbiAgICAgIHJldHVybiBWZWM0O1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29tcG9uZW50TicpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQXJyYXkoY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGVFbnVtKSB7XG4gIGlmIChcbiAgICBjb21wb3NpdGlvblR5cGUgPT09IFNjYWxhckFycmF5IHx8XG4gICAgY29tcG9zaXRpb25UeXBlID09PSBWZWMyQXJyYXkgfHxcbiAgICBjb21wb3NpdGlvblR5cGUgPT09IFZlYzNBcnJheSB8fFxuICAgIGNvbXBvc2l0aW9uVHlwZSA9PT0gVmVjNEFycmF5IHx8XG4gICAgY29tcG9zaXRpb25UeXBlID09PSBNYXQ0eDNBcnJheSB8fFxuICAgIGNvbXBvc2l0aW9uVHlwZSA9PT0gTWF0NEFycmF5IHx8XG4gICAgY29tcG9zaXRpb25UeXBlID09PSBNYXQzQXJyYXkgfHxcbiAgICBjb21wb3NpdGlvblR5cGUgPT09IE1hdDJBcnJheVxuICApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzVGV4dHVyZShjb21wb3NpdGlvblR5cGU6IENvbXBvc2l0aW9uVHlwZUVudW0pIHtcbiAgaWYgKFxuICAgIGNvbXBvc2l0aW9uVHlwZSA9PT0gVGV4dHVyZTJEIHx8XG4gICAgY29tcG9zaXRpb25UeXBlID09PSBUZXh0dXJlQ3ViZSB8fFxuICAgIGNvbXBvc2l0aW9uVHlwZSA9PT0gVGV4dHVyZTJEU2hhZG93IHx8XG4gICAgY29tcG9zaXRpb25UeXBlID09PSBUZXh0dXJlMkRSZWN0IHx8XG4gICAgY29tcG9zaXRpb25UeXBlID09PSBUZXh0dXJlMkRBcnJheVxuICApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzVGV4dHVyZTJEKGNvbXBvc2l0aW9uVHlwZTogQ29tcG9zaXRpb25UeXBlRW51bSkge1xuICBpZiAoY29tcG9zaXRpb25UeXBlID09PSBUZXh0dXJlMkQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGlzVGV4dHVyZUN1YmUoY29tcG9zaXRpb25UeXBlOiBDb21wb3NpdGlvblR5cGVFbnVtKSB7XG4gIGlmIChjb21wb3NpdGlvblR5cGUgPT09IFRleHR1cmVDdWJlKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgY29uc3QgQ29tcG9zaXRpb25UeXBlID0gT2JqZWN0LmZyZWV6ZSh7XG4gIFVua25vd24sXG4gIFNjYWxhcixcbiAgVmVjMixcbiAgVmVjMyxcbiAgVmVjNCxcbiAgTWF0MixcbiAgTWF0MyxcbiAgTWF0NCxcbiAgU2NhbGFyQXJyYXksXG4gIFZlYzJBcnJheSxcbiAgVmVjM0FycmF5LFxuICBWZWM0QXJyYXksXG4gIE1hdDJBcnJheSxcbiAgTWF0M0FycmF5LFxuICBNYXQ0QXJyYXksXG4gIFRleHR1cmUyRCxcbiAgVGV4dHVyZTJEU2hhZG93LFxuICBUZXh0dXJlQ3ViZSxcbiAgVGV4dHVyZTJEUmVjdCxcbiAgVGV4dHVyZTJEQXJyYXksXG4gIE1hdDR4M0FycmF5LFxuICBTcGVjdWxhclByb3BzLFxuICBWb2x1bWVQcm9wcyxcbiAgQ2xlYXJjb2F0UHJvcHMsXG4gIEFuaXNvdHJvcHlQcm9wcyxcbiAgU2hlZW5Qcm9wcyxcbiAgSXJpZGVzY2VuY2VQcm9wcyxcbiAgRGlmZnVzZVRyYW5zbWlzc2lvblByb3BzLFxuICBPY2NsdXNpb25Qcm9wcyxcbiAgRW1pc3NpdmVQcm9wcyxcbiAgZnJvbSxcbiAgZnJvbVN0cmluZyxcbiAgdmVjdG9yRnJvbSxcbiAgZnJvbUdsc2xTdHJpbmcsXG4gIGZyb21XZ3NsU3RyaW5nLFxuICBpc0FycmF5LFxuICBpc1RleHR1cmUsXG4gIGlzVGV4dHVyZTJELFxuICBpc1RleHR1cmVDdWJlLFxuICB0b0dsdGYyQW5pbWF0aW9uQWNjZXNzb3JDb21wb3NpdGlvblR5cGUsXG4gIHRvR2x0ZjJBY2Nlc3NvckNvbXBvc2l0aW9uVHlwZVN0cmluZyxcbiAgdG9HbHRmMkFuaW1hdGlvbkFjY2Vzc29yQ29tcG9zaXRpb25UeXBlU3RyaW5nLFxuICB0b0dsdGYyU3F1YXJlTWF0cml4QWNjZXNzb3JDb21wb3NpdGlvblR5cGVTdHJpbmcsXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFRQSxTQUFTLE9BQU8sYUFBYSxpQkFBOEI7QUFDM0QsU0FBUyxjQUFjO0FBY3ZCLElBQU0sdUJBQU4sY0FBNEQsVUFBeUM7QUFBQSxFQVNuRyxZQUFZO0FBQUEsSUFDVjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBLFNBQUFBLFdBQVU7QUFBQSxFQUNaLEdBVUc7QUFDRCxVQUFNLEVBQUUsT0FBTyxJQUFJLENBQUM7QUFDcEIsU0FBS0MsS0FBdUI7QUFDNUIsU0FBS0MsS0FBWTtBQUNqQixTQUFLQyxLQUFZO0FBQ2pCLFNBQUtDLEtBQXVCO0FBQzVCLFNBQUtDLEtBQVlMO0FBQ2pCLFNBQUtNLEtBQWM7QUFDbkIsU0FBS0MsS0FBWTtBQUNqQixTQUFLQyxLQUFhO0FBQUEsRUFDcEI7QUFBQSxFQUVBLElBQUksU0FBUztBQUNYLFdBQU8sS0FBS0Y7QUFBQSxFQUNkO0FBQUEsRUFFQSxJQUFJLE9BQU87QUFDVCxXQUFPLEtBQUtDO0FBQUEsRUFDZDtBQUFBLEVBRUEsd0JBQStCO0FBQzdCLFdBQU8sS0FBS047QUFBQSxFQUNkO0FBQUEsRUFFQSxXQUFXLGVBQWtDO0FBQzNDLFFBQ0UsY0FBYyxVQUFVO0FBQUEsSUFDeEIsY0FBYyxVQUFVO0FBQUEsSUFDeEIsY0FBYyxVQUFVO0FBQUEsSUFDeEIsU0FBUyxnQkFBZ0IsYUFDekIsU0FBUyxnQkFBZ0IsbUJBQ3pCLFNB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O0FBQ0EsU0FBTztBQUNUO0FBRUEsU0FBUyxjQUFjLGlCQUFzQztBQUMzRCxNQUFJLG9CQUFvQixhQUFhO0FBQ25DLFdBQU87QUFBQSxFQUNUO0FBQ0EsU0FBTztBQUNUO0FBRU8sSUFBTSxrQkFBa0IsT0FBTyxPQUFPO0FBQUEsRUFDM0M7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogWyJpc0FycmF5IiwgIl9fbnVtYmVyT2ZDb21wb25lbnRzIiwgIl9fZ2xzbFN0ciIsICJfX2hsc2xTdHIiLCAiX192ZWM0U2l6ZU9mUHJvcGVydHkiLCAiX19pc0FycmF5IiwgIl9fd2ViZ3B1U3RyIiwgIl9fd2dzbFN0ciIsICJfX2R1bW15U3RyIl0KfQo=
