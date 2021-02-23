import {CompositionTypeEnum} from '../../foundation/definitions/CompositionType';
import {ProcessApproach} from '../../foundation/definitions/ProcessApproach';
import {ShaderAttributeOrSemanticsOrString} from '../../foundation/materials/core/AbstractMaterialNode';
import {ShaderSemanticsClass} from '../../foundation/definitions/ShaderSemantics';
import {
  VertexAttributeEnum,
  VertexAttributeClass,
} from '../../foundation/definitions/VertexAttribute';
import WebGLResourceRepository from '../WebGLResourceRepository';
import {WellKnownComponentTIDs} from '../../foundation/components/WellKnownComponentTIDs';
import SystemState from '../../foundation/system/SystemState';
import MemoryManager from '../../foundation/core/MemoryManager';

export type AttributeNames = Array<string>;

export default abstract class GLSLShader {
  static __instance: GLSLShader;
  __webglResourceRepository?: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  constructor() {}

  get glsl_rt0() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'layout(location = 0) out vec4 rt0;\n';
    } else {
      return 'vec4 rt0;\n';
    }
  }

  get glsl_fragColor() {
    const repo = this.__webglResourceRepository!;
    if (
      repo.currentWebGLContextWrapper != null &&
      repo.currentWebGLContextWrapper!.isWebGL2
    ) {
      return '';
    } else {
      return 'gl_FragColor = rt0;\n';
    }
  }

  get glsl_vertex_in() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'in';
    } else {
      return 'attribute';
    }
  }

  get glsl_fragment_in() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'in';
    } else {
      return 'varying';
    }
  }

  get glsl_vertex_out() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'out';
    } else {
      return 'varying';
    }
  }

  get glsl_vertex_centroid_out() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'centroid out';
    } else {
      return 'varying';
    }
  }

  get glsl_texture() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'texture';
    } else {
      return 'texture2D';
    }
  }

  get glsl_textureCube() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'texture';
    } else {
      return 'textureCube';
    }
  }

  get glsl_textureProj() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'textureProj';
    } else {
      return 'texture2DProj';
    }
  }

  get glsl_versionText() {
    const repo = this.__webglResourceRepository!;
    if (
      repo.currentWebGLContextWrapper != null &&
      repo.currentWebGLContextWrapper!.isWebGL2
    ) {
      return '';
      // return '#version 300 es\n'
    } else {
      return '';
    }
  }

  get glslPrecision() {
    return `precision highp float;
precision highp int;
    `;
  }

  static get glslMainBegin() {
    return `
void main() {
`;
  }

  static get glslMainEnd() {
    return `
}
    `;
  }

  getGlslVertexShaderProperies(str = '') {
    return str;
  }

  get glsl1ShaderTextureLodExt() {
    const ext = WebGLResourceRepository.getInstance()
      .currentWebGLContextWrapper!.webgl1ExtSTL;
    return ext != null ? '#extension GL_EXT_shader_texture_lod : require' : '';
  }

  get glsl1ShaderDerivativeExt() {
    const ext = WebGLResourceRepository.getInstance()
      .currentWebGLContextWrapper!.webgl1ExtDRV;
    return ext != null
      ? '#extension GL_OES_standard_derivatives : require'
      : '';
  }

  get toNormalMatrix() {
    return `
mat3 toNormalMatrix(mat4 m) {
  float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
  a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
  a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
  a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3];

  float b00 = a00 * a11 - a01 * a10,
  b01 = a00 * a12 - a02 * a10,
  b02 = a00 * a13 - a03 * a10,
  b03 = a01 * a12 - a02 * a11,
  b04 = a01 * a13 - a03 * a11,
  b05 = a02 * a13 - a03 * a12,
  b06 = a20 * a31 - a21 * a30,
  b07 = a20 * a32 - a22 * a30,
  b08 = a20 * a33 - a23 * a30,
  b09 = a21 * a32 - a22 * a31,
  b10 = a21 * a33 - a23 * a31,
  b11 = a22 * a33 - a23 * a32;

  float determinantVal = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  return mat3(
    a11 * b11 - a12 * b10 + a13 * b09, a12 * b08 - a10 * b11 - a13 * b07, a10 * b10 - a11 * b08 + a13 * b06,
    a02 * b10 - a01 * b11 - a03 * b09, a00 * b11 - a02 * b08 + a03 * b07, a01 * b08 - a00 * b10 - a03 * b06,
    a31 * b05 - a32 * b04 + a33 * b03, a32 * b02 - a30 * b05 - a33 * b01, a30 * b04 - a31 * b02 + a33 * b00) / determinantVal;
}`;
  }

  get getSkinMatrix() {
    return `
#ifdef RN_IS_SKINNING

highp mat4 createMatrixFromQuaternionTransformUniformScale( highp vec4 quaternion, highp vec4 translationScale ) {
  highp vec4 q = quaternion;
  highp vec3 t = translationScale.xyz;
  highp float scale = translationScale.w;

  highp float sx = q.x * q.x;
  highp float sy = q.y * q.y;
  highp float sz = q.z * q.z;
  highp float cx = q.y * q.z;
  highp float cy = q.x * q.z;
  highp float cz = q.x * q.y;
  highp float wx = q.w * q.x;
  highp float wy = q.w * q.y;
  highp float wz = q.w * q.z;

  highp mat4 mat = mat4(
    1.0 - 2.0 * (sy + sz), 2.0 * (cz + wz), 2.0 * (cy - wy), 0.0,
    2.0 * (cz - wz), 1.0 - 2.0 * (sx + sz), 2.0 * (cx + wx), 0.0,
    2.0 * (cy + wy), 2.0 * (cx - wx), 1.0 - 2.0 * (sx + sy), 0.0,
    t.x, t.y, t.z, 1.0
  );

  highp mat4 uniformScaleMat = mat4(
    scale, 0.0, 0.0, 0.0,
    0.0, scale, 0.0, 0.0,
    0.0, 0.0, scale, 0.0,
    0.0, 0.0, 0.0, 1.0
  );

  return mat*uniformScaleMat;
}

highp vec4 unpackedVec2ToNormalizedVec4(highp vec2 vec_xy, highp float criteria){

  highp float r;
  highp float g;
  highp float b;
  highp float a;

  highp float ix = floor(vec_xy.x * criteria);
  highp float v1x = ix / criteria;
  highp float v1y = ix - floor(v1x) * criteria;

  r = ( v1x + 1.0 ) / (criteria-1.0);
  g = ( v1y + 1.0 ) / (criteria-1.0);

  highp float iy = floor( vec_xy.y * criteria);
  highp float v2x = iy / criteria;
  highp float v2y = iy - floor(v2x) * criteria;

  b = ( v2x + 1.0 ) / (criteria-1.0);
  a = ( v2y + 1.0 ) / (criteria-1.0);

  r -= 1.0/criteria;
  g -= 1.0/criteria;
  b -= 1.0/criteria;
  a -= 1.0/criteria;

  r = r*2.0-1.0;
  g = g*2.0-1.0;
  b = b*2.0-1.0;
  a = a*2.0-1.0;

  return vec4(r, g, b, a);
}

mat4 getSkinMatrix(float skeletalComponentSID) {

#ifdef RN_BONE_DATA_TYPE_MAT4X4
  mat4 skinMat = a_weight.x * get_boneMatrix(skeletalComponentSID, int(a_joint.x));
  skinMat += a_weight.y * get_boneMatrix(skeletalComponentSID, int(a_joint.y));
  skinMat += a_weight.z * get_boneMatrix(skeletalComponentSID, int(a_joint.z));
  skinMat += a_weight.w * get_boneMatrix(skeletalComponentSID, int(a_joint.w));
#elif defined(RN_BONE_DATA_TYPE_VEC4X2)
  highp mat4 skinMat = a_weight.x * createMatrixFromQuaternionTransformUniformScale(
    get_boneQuaternion(skeletalComponentSID, int(a_joint.x)),
    get_boneTranslateScale(skeletalComponentSID, int(a_joint.x)));
  skinMat += a_weight.y * createMatrixFromQuaternionTransformUniformScale(
    get_boneQuaternion(skeletalComponentSID, int(a_joint.y)),
    get_boneTranslateScale(skeletalComponentSID, int(a_joint.y)));
  skinMat += a_weight.z * createMatrixFromQuaternionTransformUniformScale(
    get_boneQuaternion(skeletalComponentSID, int(a_joint.z)),
    get_boneTranslateScale(skeletalComponentSID, int(a_joint.z)));
  skinMat += a_weight.w * createMatrixFromQuaternionTransformUniformScale(
    get_boneQuaternion(skeletalComponentSID, int(a_joint.w)),
    get_boneTranslateScale(skeletalComponentSID, int(a_joint.w)));
#elif defined(RN_BONE_DATA_TYPE_VEC4X1)
  highp vec4 boneCompressedChunksX = get_boneCompressedChunk(skeletalComponentSID, int(a_joint.x));
  highp vec4 boneCompressedChunksY = get_boneCompressedChunk(skeletalComponentSID, int(a_joint.y));
  highp vec4 boneCompressedChunksZ = get_boneCompressedChunk(skeletalComponentSID, int(a_joint.z));
  highp vec4 boneCompressedChunksW = get_boneCompressedChunk(skeletalComponentSID, int(a_joint.w));

  highp vec2 criteria = vec2(4096.0, 4096.0);
  highp vec4 boneCompressedInfo = get_boneCompressedInfo(0.0, 0);
  highp mat4 skinMat = a_weight.x * createMatrixFromQuaternionTransformUniformScale(
    unpackedVec2ToNormalizedVec4(boneCompressedChunksX.xy, criteria.x),
    unpackedVec2ToNormalizedVec4(boneCompressedChunksX.zw, criteria.y)*boneCompressedInfo);
  skinMat += a_weight.y * createMatrixFromQuaternionTransformUniformScale(
    unpackedVec2ToNormalizedVec4(boneCompressedChunksY.xy, criteria.x),
    unpackedVec2ToNormalizedVec4(boneCompressedChunksY.zw, criteria.y)*boneCompressedInfo);
  skinMat += a_weight.z * createMatrixFromQuaternionTransformUniformScale(
    unpackedVec2ToNormalizedVec4(boneCompressedChunksZ.xy, criteria.x),
    unpackedVec2ToNormalizedVec4(boneCompressedChunksZ.zw, criteria.y)*boneCompressedInfo);
  skinMat += a_weight.w * createMatrixFromQuaternionTransformUniformScale(
    unpackedVec2ToNormalizedVec4(boneCompressedChunksW.xy, criteria.x),
    unpackedVec2ToNormalizedVec4(boneCompressedChunksW.zw, criteria.y)*boneCompressedInfo);
#endif

  return skinMat;
}

#endif
`;
  }

  get packing() {
    return `
const vec4 bitEnc = vec4(1.,255.,65025.,16581375.);
const vec4 bitDec = 1./bitEnc;

vec4 encodeFloatRGBA(float v) {
  float val = v;
  float r = mod(val, 255.0);
  val -= r;
  float g = mod(val, 65025.0);
  val -= g;
  float b = mod(val, 16581375.0);
  return vec4(r/255.0, g/65025.0, b/16581375.0, 1.0);
}`;
  }

  get processGeometryWithSkinningOptionally() {
    return `
#ifdef RN_IS_SKINNING
bool skinning(
  float skeletalComponentSID,
  in mat3 inNormalMatrix,
  out mat3 outNormalMatrix,
  in vec3 inPosition_inLocal,
  out vec4 outPosition_inWorld,
  in vec3 inNormal_inLocal,
  out vec3 outNormal_inWorld
  )
{
  mat4 skinMat = getSkinMatrix(skeletalComponentSID);
  outPosition_inWorld = skinMat * vec4(inPosition_inLocal, 1.0);
  outNormalMatrix = toNormalMatrix(skinMat);
  outNormal_inWorld = normalize(outNormalMatrix * inNormal_inLocal);

  return true;
}
#endif

bool processGeometryWithMorphingAndSkinning(
  float skeletalComponentSID,
  in mat4 worldMatrix,
  in mat3 inNormalMatrix,
  out mat3 outNormalMatrix,
  in vec3 inPosition_inLocal,
  out vec4 outPosition_inWorld,
  in vec3 inNormal_inLocal,
  out vec3 outNormal_inWorld
) {
  bool isSkinning = false;

  vec3 position_inLocal;
#ifdef RN_IS_MORPHING
  if (u_morphTargetNumber == 0) {
#endif
    position_inLocal = inPosition_inLocal;
#ifdef RN_IS_MORPHING
  } else {
    float vertexIdx = a_baryCentricCoord.w;
    position_inLocal = get_position(vertexIdx, inPosition_inLocal);
  }
#endif


#ifdef RN_IS_SKINNING
  if (skeletalComponentSID >= 0.0) {
    isSkinning = skinning(skeletalComponentSID, inNormalMatrix, outNormalMatrix, position_inLocal, outPosition_inWorld, inNormal_inLocal, outNormal_inWorld);
  } else {
#endif
    outNormalMatrix = inNormalMatrix;
    outPosition_inWorld = worldMatrix * vec4(position_inLocal, 1.0);
    outNormal_inWorld = normalize(inNormalMatrix * inNormal_inLocal);
#ifdef RN_IS_SKINNING
  }
#endif

  return isSkinning;
}`;
  }

  get prerequisites() {
    const webGLResourceRepository = WebGLResourceRepository.getInstance();
    const dataUboDefinition = webGLResourceRepository.getGlslDataUBODefinitionString();
    const dataUBOVec4SizeStr = webGLResourceRepository.getGlslDataUBOVec4SizeString();
    return `uniform float u_materialSID;
uniform sampler2D u_dataTexture;
const int widthOfDataTexture = ${MemoryManager.bufferWidthLength};
const int heightOfDataTexture = ${MemoryManager.bufferHeightLength};

#if defined(GLSL_ES3) && defined(RN_IS_FASTEST_MODE)
  ${dataUBOVec4SizeStr}
  ${dataUboDefinition}
#endif

highp vec4 fetchElement(highp sampler2D tex, int vec4_idx, int texWidth, int texHeight) {
#if defined(GLSL_ES3) && defined(RN_IS_FASTEST_MODE)
  if (vec4_idx < dataUBOVec4Size) {
    return fetchVec4FromVec4Block(vec4_idx);
  } else {
    int idxOnDataTex = vec4_idx - dataUBOVec4Size;
    highp ivec2 uv = ivec2(idxOnDataTex % texWidth, idxOnDataTex / texWidth);
    return texelFetch( tex, uv, 0 );
  }
#elif defined(GLSL_ES3)
  highp ivec2 uv = ivec2(vec4_idx % texWidth, vec4_idx / texWidth);
  return texelFetch( tex, uv, 0 );
#else
  // This idea from https://qiita.com/YVT/items/c695ab4b3cf7faa93885
  highp vec2 invSize = vec2(1.0/float(texWidth), 1.0/float(texHeight));
  highp float t = (float(vec4_idx) + 0.5) * invSize.x;
  highp float x = fract(t);
  highp float y = (floor(t) + 0.5) * invSize.y;
  #ifdef GLSL_ES3
  return texture( tex, vec2(x, y));
  #else
  return texture2D( tex, vec2(x, y));
  #endif
#endif
}

vec2 fetchVec2No16BytesAligned(highp sampler2D tex, int scalar_idx, int texWidth, int texHeight) {
#ifdef GLSL_ES3
  int posIn4bytes = scalar_idx % 4;
#else
  int posIn4bytes = int(mod(float(scalar_idx), 4.0));
#endif

  int basePosIn16bytes = scalar_idx*4 - posIn4bytes;
  if (posIn4bytes == 0) {
    vec4 val = fetchElement(u_dataTexture, basePosIn16bytes, texWidth, texHeight);
    return val.xy;
  } else if (posIn4bytes == 1) {
    vec4 val0 = fetchElement(u_dataTexture, basePosIn16bytes, texWidth, texHeight);
    return vec2(val0.yz);
  } else if (posIn4bytes == 2) {
    vec4 val0 = fetchElement(u_dataTexture, basePosIn16bytes, texWidth, texHeight);
    vec4 val1 = fetchElement(u_dataTexture, basePosIn16bytes+1, texWidth, texHeight);
    return vec2(val0.zw);
  } else if (posIn4bytes == 3) {
    vec4 val0 = fetchElement(u_dataTexture, basePosIn16bytes, texWidth, texHeight);
    vec4 val1 = fetchElement(u_dataTexture, basePosIn16bytes+1, texWidth, texHeight);
    return vec2(val0.w, val1.x);
  }
}

vec3 fetchVec3No16BytesAligned(highp sampler2D tex, int scalar_idx, int texWidth, int texHeight) {
#ifdef GLSL_ES3
  int posIn4bytes = scalar_idx % 4;
#else
  int posIn4bytes = int(mod(float(scalar_idx), 4.0));
#endif

  int basePosIn16bytes = scalar_idx*4 - posIn4bytes;
  if (posIn4bytes == 0) {
    vec4 val = fetchElement(u_dataTexture, basePosIn16bytes, texWidth, texHeight);
    return val.xyz;
  } else if (posIn4bytes == 1) {
    vec4 val0 = fetchElement(u_dataTexture, basePosIn16bytes, texWidth, texHeight);
    return vec3(val0.yzw);
  } else if (posIn4bytes == 2) {
    vec4 val0 = fetchElement(u_dataTexture, basePosIn16bytes, texWidth, texHeight);
    vec4 val1 = fetchElement(u_dataTexture, basePosIn16bytes+1, texWidth, texHeight);
    return vec3(val0.zw, val1.x);
  } else if (posIn4bytes == 3) {
    vec4 val0 = fetchElement(u_dataTexture, basePosIn16bytes, texWidth, texHeight);
    vec4 val1 = fetchElement(u_dataTexture, basePosIn16bytes+1, texWidth, texHeight);
    return vec3(val0.w, val1.xy);
  }
}

vec4 fetchVec4(highp sampler2D tex, int vec4_idx, int texWidth, int texHeight) {
  return fetchElement(u_dataTexture, vec4_idx, texWidth, texHeight);
}

float fetchScalarNo16BytesAligned(highp sampler2D tex, int scalar_idx, int texWidth, int texHeight) {
  vec4 val = fetchElement(u_dataTexture, scalar_idx, texWidth, texHeight);
  return val.x;
}

mat2 fetchMat2No16BytesAligned(highp sampler2D tex, int scalar_idx, int texWidth, int texHeight) {
  int vec4_idx = scalar_idx*4;
  vec4 col0 = fetchElement(u_dataTexture, vec4_idx, texWidth, texHeight);

  mat2 val = mat2(
    col0.x, col0.y,
    col0.z, col0.w
    );

  return val;
}

mat2 fetchMat2(highp sampler2D tex, int vec4_idx, int texWidth, int texHeight) {
  vec4 col0 = fetchElement(u_dataTexture, vec4_idx, texWidth, texHeight);

  mat2 val = mat2(
    col0.x, col0.y,
    col0.z, col0.w
    );

  return val;
}

mat3 fetchMat3No16BytesAligned(highp sampler2D tex, int scalar_idx, int texWidth, int texHeight) {
#ifdef GLSL_ES3
  int posIn4bytes = scalar_idx % 4;
#else
  int posIn4bytes = int(mod(float(scalar_idx), 4.0));
#endif

  int basePosIn16bytes = scalar_idx*4 - posIn4bytes;
  if (posIn4bytes == 0) {
    vec4 col0 = fetchElement(u_dataTexture, basePosIn16bytes, texWidth, texHeight);
    vec4 col1 = fetchElement(u_dataTexture, basePosIn16bytes + 1, texWidth, texHeight);
    vec4 col2 = fetchElement(u_dataTexture, basePosIn16bytes + 2, texWidth, texHeight);
    mat3 val = mat3(
      col0.x, col0.y, col0.z,
      col0.w, col1.x, col1.y,
      col1.z, col1.w, col2.x
      );
    return val;
  } else if (posIn4bytes == 1) {
    vec4 col0 = fetchElement(u_dataTexture, basePosIn16bytes, texWidth, texHeight);
    vec4 col1 = fetchElement(u_dataTexture, basePosIn16bytes + 1, texWidth, texHeight);
    vec4 col2 = fetchElement(u_dataTexture, basePosIn16bytes + 2, texWidth, texHeight);
    mat3 val = mat3(
      col0.y, col0.z, col0.w,
      col1.x, col1.y, col1.z,
      col1.w, col2.x, col2.y
      );
    return val;
  } else if (posIn4bytes == 2) {
    vec4 col0 = fetchElement(u_dataTexture, basePosIn16bytes, texWidth, texHeight);
    vec4 col1 = fetchElement(u_dataTexture, basePosIn16bytes + 1, texWidth, texHeight);
    vec4 col2 = fetchElement(u_dataTexture, basePosIn16bytes + 2, texWidth, texHeight);
    mat3 val = mat3(
      col0.z, col0.w, col1.x,
      col1.y, col1.z, col1.w,
      col2.x, col2.y, col2.z
      );
    return val;
  } else { // posIn4bytes == 3
    vec4 col0 = fetchElement(u_dataTexture, basePosIn16bytes, texWidth, texHeight);
    vec4 col1 = fetchElement(u_dataTexture, basePosIn16bytes + 1, texWidth, texHeight);
    vec4 col2 = fetchElement(u_dataTexture, basePosIn16bytes + 2, texWidth, texHeight);
    mat3 val = mat3(
      col0.w, col1.x, col1.y,
      col1.z, col1.w, col2.x,
      col2.y, col2.z, col2.w
      );
    return val;
  }

}

mat3 fetchMat3(highp sampler2D tex, int vec4_idx, int texWidth, int texHeight) {
  vec4 col0 = fetchElement(u_dataTexture, vec4_idx, texWidth, texHeight);
  vec4 col1 = fetchElement(u_dataTexture, vec4_idx + 1, texWidth, texHeight);
  vec4 col2 = fetchElement(u_dataTexture, vec4_idx + 2, texWidth, texHeight);

  mat3 val = mat3(
    col0.x, col0.y, col0.z,
    col0.w, col1.x, col1.y,
    col1.z, col1.w, col2.x
    );

  return val;
}

mat4 fetchMat4(highp sampler2D tex, int vec4_idx, int texWidth, int texHeight) {
  vec4 col0 = fetchElement(u_dataTexture, vec4_idx, texWidth, texHeight);
  vec4 col1 = fetchElement(u_dataTexture, vec4_idx + 1, texWidth, texHeight);
  vec4 col2 = fetchElement(u_dataTexture, vec4_idx + 2, texWidth, texHeight);
  vec4 col3 = fetchElement(u_dataTexture, vec4_idx + 3, texWidth, texHeight);

  mat4 val = mat4(
    col0.x, col0.y, col0.z, col0.w,
    col1.x, col1.y, col1.z, col1.w,
    col2.x, col2.y, col2.z, col2.w,
    col3.x, col3.y, col3.z, col3.w
    );

  return val;
}

float rand(const vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec3 descramble(vec3 v) {
  float seed = 0.0;
  v.x -= sin(fract(v.y*20.0));
  v.z -= cos(fract(-v.y*10.0));
  return v;
}

`;
  }

  get mainPrerequisites() {
    const processApproach = SystemState.currentProcessApproach;
    if (ProcessApproach.isFastestApproach(processApproach)) {
      return `
  float materialSID = u_currentComponentSIDs[0];

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = int(u_currentComponentSIDs[${WellKnownComponentTIDs.LightComponentTID}]);
  #endif

  float skeletalComponentSID = -1.0;
  #ifdef RN_IS_SKINNING
    skeletalComponentSID = u_currentComponentSIDs[${WellKnownComponentTIDs.SkeletalComponentTID}];
  #endif
`;
    } else {
      return `
  float materialSID = u_materialSID;

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = get_lightNumber(0.0, 0);
  #endif

  float skeletalComponentSID = -1.0;
  #ifdef RN_IS_SKINNING
    skeletalComponentSID = float(get_skinningMode(0.0, 0));
  #endif
      `;
    }
  }

  get pointSprite() {
    return `  vec4 position_inWorld = worldMatrix * vec4(a_position, 1.0);
  vec3 viewPosition = get_viewPosition(cameraSID, 0);
  float distanceFromCamera = length(position_inWorld.xyz - viewPosition);
  vec3 pointDistanceAttenuation = get_pointDistanceAttenuation(materialSID, 0);
  float distanceAttenuationFactor = sqrt(1.0/(pointDistanceAttenuation.x + pointDistanceAttenuation.y * distanceFromCamera + pointDistanceAttenuation.z * distanceFromCamera * distanceFromCamera));
  float maxPointSize = get_pointSize(materialSID, 0);
  gl_PointSize = clamp(distanceAttenuationFactor * maxPointSize, 0.0, maxPointSize);`;
  }

  get pbrUniformDefinition() {
    let shaderText = '';
    shaderText += 'uniform vec2 uMetallicRoughnessFactors;\n';
    shaderText += 'uniform vec3 uBaseColorFactor;\n';
    shaderText += 'uniform vec2 uOcclusionFactors;';
    shaderText += 'uniform vec3 uEmissiveFactor;';
    shaderText += 'uniform sampler2D uMetallicRoughnessTexture;\n';

    const occlusionTexture = true; //material.getTextureFromPurpose(GLBoost.TEXTURE_PURPOSE_OCCLUSION);
    if (occlusionTexture) {
      shaderText += 'uniform sampler2D uOcclusionTexture;\n';
    }

    const emissiveTexture = true; //material.getTextureFromPurpose(GLBoost.TEXTURE_PURPOSE_EMISSIVE);
    if (emissiveTexture) {
      shaderText += 'uniform sampler2D uEmissiveTexture;\n';
    }

    const diffuseEnvCubeTexture = true; //material.getTextureFromPurpose(GLBoost.TEXTURE_PURPOSE_IBL_DIFFUSE_ENV_CUBE);
    if (diffuseEnvCubeTexture) {
      shaderText += 'uniform sampler2D u_brdfLutTexture;\n';
      shaderText += 'uniform samplerCube uDiffuseEnvTexture;\n';
      shaderText += 'uniform samplerCube uSpecularEnvTexture;\n';
      shaderText += 'uniform vec4 uIBLParameters;\n'; // Ka * amount of ambient lights
    }

    shaderText += 'uniform vec4 ambient;\n'; // Ka * amount of ambient lights

    return shaderText;
  }

  get mipmapLevel() {
    return `
    // https://stackoverflow.com/questions/24388346/how-to-access-automatic-mipmap-level-in-glsl-fragment-shader-texture
    float mipmapLevel(vec3 uv_as_texel)
    {
      vec3  dx_vtc        = dFdx(uv_as_texel);
      vec3  dy_vtc        = dFdy(uv_as_texel);
      float delta_max_sqr = max(dot(dx_vtc, dx_vtc), dot(dy_vtc, dy_vtc));
      float mml = 0.5 * log2(delta_max_sqr);
      return max( 0.0, mml );
    }`;
  }

  get pbrMethodDefinition() {
    return `
    const float M_PI = 3.141592653589793;
    const float c_MinRoughness = 0.04;

    float angular_n_h(float NH) {
      return acos(NH);
    }

    float sqr(float x) {
      return x*x;
    }

    float d_phong(float NH, float c1) {
      return pow(
        cos(acos(NH))
        , c1
      );
    }

    // this is from https://www.unrealengine.com/blog/physically-based-shading-on-mobile
    vec3 envBRDFApprox( vec3 F0, float Roughness, float NoV ) {
      const vec4 c0 = vec4(-1, -0.0275, -0.572, 0.022 );
      const vec4 c1 = vec4(1, 0.0425, 1.04, -0.04 );
      vec4 r = Roughness * c0 + c1;
      float a004 = min( r.x * r.x, exp2( -9.28 * NoV ) ) * r.x + r.y;
      vec2 AB = vec2( -1.04, 1.04 ) * a004 + r.zw;

      return F0 * AB.x + AB.y;
    }

    // GGX NDF
    float d_ggx(float NH, float alphaRoughness) {
      float roughnessSqr = alphaRoughness * alphaRoughness;
      float f = (roughnessSqr - 1.0) * NH * NH + 1.0;
      return roughnessSqr / (M_PI * f * f);
    }

    float d_torrance_reiz(float NH, float c3) {
      float CosSquared = NH*NH;
      float TanSquared = (1.0 - CosSquared)/CosSquared;
      //return (1.0/M_PI) * sqr(c3/(CosSquared * (c3*c3 + TanSquared)));  // gamma = 2, aka GGX
      return (1.0/sqrt(M_PI)) * (sqr(c3)/(CosSquared * (c3*c3 + TanSquared))); // gamma = 1, D_Berry
    }

    float d_beckmann(float NH, float m) {
      float co = 1.0 / (4.0 * m * m * NH * NH * NH * NH);
      float expx = exp((NH * NH - 1.0) / (m * m * NH * NH));
      return co * expx;
    }

    // the same as glTF WebGL sample
    // https://github.com/KhronosGroup/glTF-WebGL-PBR/blob/88eda8c5358efe03128b72b6c5f5f6e5b6d023e1/shaders/pbr-frag.glsl#L188
    // That is, Unreal Engine based approach, but modified to use alphaRoughness (squared artist's roughness parameter),
    // and based on 'Separable Masking and Shadowing' approximation (propesed by Christophe Schlick)
    // https://www.cs.virginia.edu/~jdl/bib/appearance/analytic%20models/schlick94b.pdf
    float g_shielding(float NL, float NV, float alphaRoughness) {
      float r = alphaRoughness;

      // Local Shadowing using "Schlick-Smith" Masking Function
      float localShadowing = 2.0 * NL / (NL + sqrt(r * r + (1.0 - r * r) * (NL * NL)));

      // Local Masking using "Schlick-Smith" Masking Function
      float localMasking = 2.0 * NV / (NV + sqrt(r * r + (1.0 - r * r) * (NV * NV)));

      return localShadowing * localMasking;
    }

    // The code from https://google.github.io/filament/Filament.html#listing_approximatedspecularv
    // The idea is from [Heitz14] Eric Heitz. 2014. Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs.
    float v_SmithGGXCorrelated(float NL, float NV, float alphaRoughness) {
      float a2 = alphaRoughness * alphaRoughness;
      float GGXV = NL * sqrt(NV * NV * (1.0 - a2) + a2);
      float GGXL = NV * sqrt(NL * NL * (1.0 - a2) + a2);
      return 0.5 / (GGXV + GGXL);
    }

    float v_SmithGGXCorrelatedFast(float NL, float NV, float alphaRoughness) {
      float a = alphaRoughness;
      float GGXV = NL * (NV * (1.0 - a) + a);
      float GGXL = NV * (NL * (1.0 - a) + a);
      return 0.5 / (GGXV + GGXL);
    }

    // The Schlick Approximation to Fresnel
    vec3 fresnel(vec3 f0, float VH) {
      return vec3(f0) + (vec3(1.0) - f0) * pow(1.0 - VH, 5.0);
    }

    vec3 cook_torrance_specular_brdf(float NH, float NL, float NV, vec3 F, float alphaRoughness) {
      float D = d_ggx(NH, alphaRoughness);
      float V = v_SmithGGXCorrelated(NL, NV, alphaRoughness);
      return vec3(D)*vec3(V)*F;
//      float G = g_shielding(NL, NV, alphaRoughness);
//      return vec3(D)*vec3(G)*F/vec3(4.0*NL*NV);

    }

    vec3 diffuse_brdf(vec3 albedo)
    {
      return albedo / M_PI;
    }

    vec3 srgbToLinear(vec3 srgbColor) {
      return pow(srgbColor, vec3(2.2));
    }

    float srgbToLinear(float value) {
      return pow(value, 2.2);
    }

    vec3 linearToSrgb(vec3 linearColor) {
      return pow(linearColor, vec3(1.0/2.2));
    }

    float linearToSrgb(float value) {
      return pow(value, 1.0/2.2);
    }

    vec3 fresnelSchlickRoughness(vec3 F0, float cosTheta, float roughness)
    {
      return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(1.0 - cosTheta, 5.0);
    }

    vec3 normalBlendingUDN(sampler2D baseMap, sampler2D detailMap, vec2 baseUv, vec2 detailUv) {
      vec3 t = ${this.glsl_texture}(baseMap,   baseUv).xyz * 2.0 - 1.0;
      vec3 u = ${this.glsl_texture}(detailMap, detailUv).xyz * 2.0 - 1.0;
      vec3 r = normalize(vec3(t.xy + u.xy, t.z));
      return r;
    }

    vec2 uvTransform(vec2 scale, vec2 offset, float rotation, vec2 uv) {
      mat3 translationMat = mat3(1,0,0, 0,1,0, offset.x, offset.y, 1);
      mat3 rotationMat = mat3(
          cos(rotation), -sin(rotation), 0,
          sin(rotation),  cos(rotation), 0,
                      0,             0, 1
      );
      mat3 scaleMat = mat3(scale.x,0,0, 0,scale.y,0, 0,0,1);

      mat3 matrix = translationMat * rotationMat * scaleMat;
      vec2 uvTransformed = ( matrix * vec3(uv.xy, 1) ).xy;

      return uvTransformed;
    }

    `;
  }

  get simpleMVPPosition() {
    return `
  float cameraSID = u_currentComponentSIDs[${WellKnownComponentTIDs.CameraComponentTID}];
  mat4 worldMatrix = get_worldMatrix(a_instanceID);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);
  gl_Position = projectionMatrix * viewMatrix * worldMatrix * vec4(a_position, 1.0);
    `;
  }

  get perturbedNormal() {
    return `
#ifdef RN_USE_TANGENT_ATTRIBUTE
  vec3 perturb_normal(vec3 normal_inWorld, vec3 viewVector, vec2 texcoord) {
    vec3 tangent_inWorld = normalize(v_tangent_inWorld);
    vec3 binormal_inWorld = normalize(v_binormal_inWorld);
    mat3 tbnMat_tangent_to_world = mat3(tangent_inWorld, binormal_inWorld, normal_inWorld);

    vec3 normal = ${this.glsl_texture}(u_normalTexture, texcoord).xyz * 2.0 - 1.0;
    return normalize(tbnMat_tangent_to_world * normal);
  }
#else
  #ifdef RN_IS_SUPPORTING_STANDARD_DERIVATIVES
    // This is based on http://www.thetenthplanet.de/archives/1180
    mat3 cotangent_frame(vec3 normal, vec3 position, vec2 uv) {
      uv = gl_FrontFacing ? uv : -uv;

      // get edge vectors of the pixel triangle
      vec3 dp1 = dFdx(position);
      vec3 dp2 = dFdy(position);
      vec2 duv1 = dFdx(uv);
      vec2 duv2 = dFdy(uv);

      // solve the linear system
      vec3 dp2perp = cross(dp2, normal);
      vec3 dp1perp = cross(normal, dp1);
      vec3 tangent = dp2perp * duv1.x + dp1perp * duv2.x;
      vec3 bitangent = dp2perp * duv1.y + dp1perp * duv2.y;

      // construct a scale-invariant frame
      float invMat = inversesqrt(max(dot(tangent, tangent), dot(bitangent, bitangent)));
      return mat3(tangent * invMat, bitangent * invMat, normal);
    }

    vec3 perturb_normal(vec3 normal, vec3 viewVector, vec2 texcoord) {
      vec3 normalTex = ${this.glsl_texture}(u_normalTexture, texcoord).xyz * 2.0 - 1.0;

      mat3 tbnMat_tangent_to_world = cotangent_frame(normal, -viewVector, texcoord);
      return normalize(tbnMat_tangent_to_world * normalTex);
    }
  #else
    vec3 perturb_normal(vec3 normal, vec3 viewVector, vec2 texcoord) {
      return normal;
    }
  #endif
#endif
`;
  }

  static getStringFromShaderAnyDataType(
    data: ShaderAttributeOrSemanticsOrString
  ): string {
    if (data instanceof ShaderSemanticsClass) {
      return 'u_' + data.str;
    } else if (data instanceof VertexAttributeClass) {
      return data.shaderStr;
    } else {
      return data as string;
    }
  }
  abstract get attributeNames(): AttributeNames;
  abstract get attributeSemantics(): Array<VertexAttributeEnum>;
  abstract get attributeCompositions(): Array<CompositionTypeEnum>;
}
