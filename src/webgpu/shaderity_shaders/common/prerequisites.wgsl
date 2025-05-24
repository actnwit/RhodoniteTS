struct StorageData {
  data: array<vec4<f32>>,
}
@group(0) @binding(0) var<storage> storageData: StorageData;
struct BlendShapeData {
  data: array<vec4<f32>>,
}
@group(0) @binding(1) var<storage> blendShapeData: BlendShapeData;
struct UniformMorphOffsets {
  data: array<vec4<u32>, /* shaderity: @{maxMorphDataNumber} */ >,
}
@group(0) @binding(2) var<uniform> uniformMorphOffsets: UniformMorphOffsets;
struct UniformMorphWeights {
  data: array<vec4<f32>, /* shaderity: @{maxMorphDataNumber} */ >,
}
@group(0) @binding(3) var<uniform> uniformMorphWeights: UniformMorphWeights;

struct UniformDrawParameters {
  materialSid: u32,
  cameraSID: u32,
  currentPrimitiveIdx: u32,
  morphTargetNumber: u32,
}

@group(3) @binding(0) var<uniform> uniformDrawParameters: UniformDrawParameters;

const M_PI: f32 = 3.141592653589793;
const RECIPROCAL_PI: f32 = 0.3183098861837907;
const Epsilon: f32 = 0.0000001;
const c_MinRoughness: f32 = 0.04;
const kEps: f32 = 1e-4;

fn fetchElement(vec4_idx: u32) -> vec4<f32>
{
  return storageData.data[vec4_idx];
}

fn fetchElementFromBlendShapeBuffer(vec4_idx: u32) -> vec4<f32>
{
  return blendShapeData.data[vec4_idx];
}

fn fetchVec3No16BytesAligned(scalar_idx: u32) -> vec3<f32> {
  let posIn4bytes = scalar_idx % 4u;

  let basePosIn16bytes = (scalar_idx - posIn4bytes) / 4u;
  if (posIn4bytes == 0u) {
    let val = fetchElement(basePosIn16bytes);
    return val.xyz;
  } else if (posIn4bytes == 1u) {
    let val0 = fetchElement(basePosIn16bytes);
    return vec3<f32>(val0.yzw);
  } else if (posIn4bytes == 2u) {
    let val0 = fetchElement(basePosIn16bytes);
    let val1 = fetchElement(basePosIn16bytes+1u);
    return vec3<f32>(val0.zw, val1.x);
  } else { // posIn4bytes == 3
    let val0 = fetchElement(basePosIn16bytes);
    let val1 = fetchElement(basePosIn16bytes+1u);
    return vec3<f32>(val0.w, val1.xy);
  }
}

fn fetchVec3No16BytesAlignedFromBlendShapeBuffer(scalar_idx: u32) -> vec3<f32> {
  let posIn4bytes = scalar_idx % 4u;

  let basePosIn16bytes = (scalar_idx - posIn4bytes) / 4u;
  if (posIn4bytes == 0u) {
    let val = fetchElementFromBlendShapeBuffer(basePosIn16bytes);
    return val.xyz;
  } else if (posIn4bytes == 1u) {
    let val0 = fetchElementFromBlendShapeBuffer(basePosIn16bytes);
    return vec3<f32>(val0.yzw);
  } else if (posIn4bytes == 2u) {
    let val0 = fetchElementFromBlendShapeBuffer(basePosIn16bytes);
    let val1 = fetchElementFromBlendShapeBuffer(basePosIn16bytes+1u);
    return vec3<f32>(val0.zw, val1.x);
  } else { // posIn4bytes == 3
    let val0 = fetchElementFromBlendShapeBuffer(basePosIn16bytes);
    let val1 = fetchElementFromBlendShapeBuffer(basePosIn16bytes+1u);
    return vec3<f32>(val0.w, val1.xy);
  }
}

fn fetchVec4(vec4_idx: u32) -> vec4<f32> {
  return fetchElement(vec4_idx);
}

fn fetchScalarNo16BytesAligned(scalar_idx: u32) -> f32 {
  let posIn4bytes = scalar_idx % 4u;
  let basePosIn16bytes = (scalar_idx - posIn4bytes) / 4u;
  let val = fetchElement(basePosIn16bytes);
  if (posIn4bytes == 0u) {
    return val.x;
  } else if (posIn4bytes == 1u) {
    return val.y;
  } else if (posIn4bytes == 2u) {
    return val.z;
  } else { // posIn4bytes == 3u
    return val.w;
  }
}




fn fetchMat4(vec4_idx: u32) -> mat4x4<f32>
{
  let col0 = fetchElement(vec4_idx);
  let col1 = fetchElement(vec4_idx + 1u);
  let col2 = fetchElement(vec4_idx + 2u);
  let col3 = fetchElement(vec4_idx + 3u);

  let val = mat4x4<f32>(
    col0.x, col0.y, col0.z, col0.w,
    col1.x, col1.y, col1.z, col1.w,
    col2.x, col2.y, col2.z, col2.w,
    col3.x, col3.y, col3.z, col3.w
    );

  return val;
}


fn fetchMat4x3(vec4_idx: u32) -> mat4x3<f32> {
  let col0 = fetchElement(vec4_idx);
  let col1 = fetchElement(vec4_idx + 1u);
  let col2 = fetchElement(vec4_idx + 2u);

  let val = mat4x3<f32>(
    col0.x, col0.y, col0.z, col0.w,
    col1.x, col1.y, col1.z, col1.w,
    col2.x, col2.y, col2.z, col2.w);

  return val;
}


fn fetchMat3No16BytesAligned(scalar_idx: u32) -> mat3x3<f32> {
  let posIn4bytes = scalar_idx % 4u;

  let basePosIn16bytes = (scalar_idx - posIn4bytes) / 4u;
  if (posIn4bytes == 0u) {
    let col0 = fetchElement(basePosIn16bytes);
    let col1 = fetchElement(basePosIn16bytes + 1u);
    let col2 = fetchElement(basePosIn16bytes + 2u);
    let val = mat3x3<f32>(
      col0.x, col0.y, col0.z,
      col0.w, col1.x, col1.y,
      col1.z, col1.w, col2.x
      );
    return val;
  } else if (posIn4bytes == 1u) {
    let col0 = fetchElement(basePosIn16bytes);
    let col1 = fetchElement(basePosIn16bytes + 1u);
    let col2 = fetchElement(basePosIn16bytes + 2u);
    let val = mat3x3<f32>(
      col0.y, col0.z, col0.w,
      col1.x, col1.y, col1.z,
      col1.w, col2.x, col2.y
      );
    return val;
  } else if (posIn4bytes == 2u) {
    let col0 = fetchElement(basePosIn16bytes);
    let col1 = fetchElement(basePosIn16bytes + 1u);
    let col2 = fetchElement(basePosIn16bytes + 2u);
    let val = mat3x3<f32>(
      col0.z, col0.w, col1.x,
      col1.y, col1.z, col1.w,
      col2.x, col2.y, col2.z
      );
    return val;
  } else { // posIn4bytes == 3u
    let col0 = fetchElement(basePosIn16bytes);
    let col1 = fetchElement(basePosIn16bytes + 1u);
    let col2 = fetchElement(basePosIn16bytes + 2u);
    let val = mat3x3<f32>(
      col0.w, col1.x, col1.y,
      col1.z, col1.w, col2.x,
      col2.y, col2.z, col2.w
      );
    return val;
  }
}

fn uvTransform(scale: vec2f, offset: vec2f, rotation: f32, uv: vec2f) -> vec2f {
  let translationMat = mat3x3(1,0,0, 0,1,0, offset.x, offset.y, 1);
  let rotationMat = mat3x3(
      cos(rotation), -sin(rotation), 0,
      sin(rotation), cos(rotation), 0,
                  0,             0, 1
  );
  let scaleMat = mat3x3(scale.x,0,0, 0,scale.y,0, 0,0,1);

  let matrix = translationMat * rotationMat * scaleMat;
  let uvTransformed = ( matrix * vec3f(uv.xy, 1) ).xy;

  return uvTransformed;
}

#ifdef RN_IS_NODE_SHADER
#else
fn getTexcoord(texcoordIndex: u32, input: VertexOutput) -> vec2<f32> {
  var texcoord: vec2f;
  if(texcoordIndex == 2){
    texcoord = input.texcoord_2;
  } else if(texcoordIndex == 1){
    texcoord = input.texcoord_1;
  }else{
    texcoord = input.texcoord_0;
  }
  return texcoord;
}
#endif

fn saturate(x: f32) -> f32 {
  return clamp(x, 0.0, 1.0);
}

fn saturateVec3f(v: vec3f) -> vec3f {
  return vec3f(saturate(v.x), saturate(v.y), saturate(v.z));
}

fn saturateEpsilonToOne(x: f32) -> f32 {
  return clamp(x, Epsilon, 1.0);
}

fn saturateEpsilonToOneVec3f(v: vec3f) -> vec3f {
  return vec3f(saturateEpsilonToOne(v.x), saturateEpsilonToOne(v.y), saturateEpsilonToOne(v.z));
}

fn max3(v: vec3f) -> f32
{
  return max(max(v.x, v.y), v.z);
}

fn sqF32(t: f32) -> f32
{
  return t * t;
}

fn sqVec2f(t: vec2f) -> vec2f
{
  return t * t;
}

fn sqVec3f(t: vec3f) -> vec3f
{
  return t * t;
}

fn sqVec4f(t: vec4f) -> vec4f
{
  return t * t;
}

fn inverse4x4(m: mat4x4<f32>) -> mat4x4<f32> {
    let a00 = m[0][0]; let a01 = m[0][1]; let a02 = m[0][2]; let a03 = m[0][3];
    let a10 = m[1][0]; let a11 = m[1][1]; let a12 = m[1][2]; let a13 = m[1][3];
    let a20 = m[2][0]; let a21 = m[2][1]; let a22 = m[2][2]; let a23 = m[2][3];
    let a30 = m[3][0]; let a31 = m[3][1]; let a32 = m[3][2]; let a33 = m[3][3];

    let b00 = a00 * a11 - a01 * a10;
    let b01 = a00 * a12 - a02 * a10;
    let b02 = a00 * a13 - a03 * a10;
    let b03 = a01 * a12 - a02 * a11;
    let b04 = a01 * a13 - a03 * a11;
    let b05 = a02 * a13 - a03 * a12;
    let b06 = a20 * a31 - a21 * a30;
    let b07 = a20 * a32 - a22 * a30;
    let b08 = a20 * a33 - a23 * a30;
    let b09 = a21 * a32 - a22 * a31;
    let b10 = a21 * a33 - a23 * a31;
    let b11 = a22 * a33 - a23 * a32;

    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (abs(det) < 1e-6) {
        return mat4x4<f32>(1.0, 0.0, 0.0, 0.0,
                            0.0, 1.0, 0.0, 0.0,
                            0.0, 0.0, 1.0, 0.0,
                            0.0, 0.0, 0.0, 1.0);
    }

    let invDet = 1.0 / det;

    var inv: mat4x4<f32>;

    inv[0][0] = ( a11 * b11 - a12 * b10 + a13 * b09) * invDet;
    inv[0][1] = (-a01 * b11 + a02 * b10 - a03 * b09) * invDet;
    inv[0][2] = ( a31 * b05 - a32 * b04 + a33 * b03) * invDet;
    inv[0][3] = (-a21 * b05 + a22 * b04 - a23 * b03) * invDet;

    inv[1][0] = (-a10 * b11 + a12 * b08 - a13 * b07) * invDet;
    inv[1][1] = ( a00 * b11 - a02 * b08 + a03 * b07) * invDet;
    inv[1][2] = (-a30 * b05 + a32 * b02 - a33 * b01) * invDet;
    inv[1][3] = ( a20 * b05 - a22 * b02 + a23 * b01) * invDet;

    inv[2][0] = ( a10 * b10 - a11 * b08 + a13 * b06) * invDet;
    inv[2][1] = (-a00 * b10 + a01 * b08 - a03 * b06) * invDet;
    inv[2][2] = ( a30 * b04 - a31 * b02 + a33 * b00) * invDet;
    inv[2][3] = (-a20 * b04 + a21 * b02 - a23 * b00) * invDet;

    inv[3][0] = (-a10 * b09 + a11 * b07 - a12 * b06) * invDet;
    inv[3][1] = ( a00 * b09 - a01 * b07 + a02 * b06) * invDet;
    inv[3][2] = (-a30 * b03 + a31 * b01 - a32 * b00) * invDet;
    inv[3][3] = ( a20 * b03 - a21 * b01 + a22 * b00) * invDet;

    return inv;
}

#ifdef RN_IS_PIXEL_SHADER
#ifdef RN_USE_TANGENT
  fn getTBN(normal_inWorld: vec3f, tangent_inWorld_: vec3f, binormal_inWorld_: vec3f, viewVector: vec3f, texcoord: vec2f, isFront: bool) -> mat3x3<f32> {
    let tangent_inWorld = normalize(tangent_inWorld_);
    let binormal_inWorld = normalize(binormal_inWorld_);
    let tbnMat_tangent_to_world = mat3x3<f32>(tangent_inWorld, binormal_inWorld, normal_inWorld);

    return tbnMat_tangent_to_world;
  }
#else
    // This is based on http://www.thetenthplanet.de/archives/1180
    fn cotangent_frame(normal_inWorld: vec3f, position: vec3f, uv_: vec2f, isFront: bool) -> mat3x3<f32> {
      var uv: vec2f;
      if (isFront) {
        uv = uv_;
      } else {
        uv = -uv_;
      }

      // get edge vectors of the pixel triangle
      let dp1 = dpdx(position);
      let dp2 = -dpdy(position); // Because the Y direction of the window coordinate system is different from that of WebGL, this one is set to minus to make the result match the WebGL version.
      let duv1 = dpdx(uv);
      let duv2 = -dpdy(uv); // Because the Y direction of the window coordinate system is different from that of WebGL, this one is set to minus to make the result match the WebGL version.

      // solve the linear system
      let dp2perp = cross(dp2, normal_inWorld);
      let dp1perp = cross(normal_inWorld, dp1);
      let tangent = dp2perp * duv1.x + dp1perp * duv2.x;
      var bitangent = dp2perp * duv1.y + dp1perp * duv2.y;
      bitangent *= -1.0;

      // construct a scale-invariant frame
      let invMat = 1.0 / sqrt(max(dot(tangent, tangent), dot(bitangent, bitangent)));
      return mat3x3<f32>(normalize(tangent * invMat), normalize(bitangent * invMat), normal_inWorld);
    }

    fn getTBN(normal_inWorld: vec3f, tangent_inWorld: vec3f, binormal_inWorld: vec3f, viewVector: vec3f, texcoord: vec2f, isFront: bool) -> mat3x3<f32> {
      let tbnMat_tangent_to_world = cotangent_frame(normal_inWorld, -viewVector, texcoord, isFront);

      return tbnMat_tangent_to_world;
    }
#endif
#endif

fn srgbToLinear(srgbColor: vec3f) -> vec3f {
  return pow(srgbColor, vec3f(2.2));
}

fn linearToSrgb(linearColor: vec3f) -> vec3f {
  return pow(linearColor, vec3f(1.0/2.2));
}

var<private> a_instanceIds: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);

#ifdef RN_USE_POSITION_FLOAT
  var<private> a_position: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 1.0);
#endif
#ifdef RN_USE_POSITION_INT
  var<private> a_position: vec4<i32> = vec4<i32>(0, 0, 0, 1);
#endif
#ifdef RN_USE_POSITION_UINT
  var<private> a_position: vec4<u32> = vec4<u32>(0u, 0u, 0u);
#endif

var<private> a_normal: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
var<private> a_tangent: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);
var<private> a_texcoord_0: vec2<f32> = vec2<f32>(0.0, 0.0);
var<private> a_texcoord_1: vec2<f32> = vec2<f32>(0.0, 0.0);
#ifdef RN_USE_COLOR_0_FLOAT
  var<private> a_color_0: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);
#endif
#ifdef RN_USE_COLOR_0_INT
  var<private> a_color_0: vec4<i32> = vec4<i32>(0, 0, 0, 0);
#endif
#ifdef RN_USE_COLOR_0_UINT
  var<private> a_color_0: vec4<u32> = vec4<u32>(0u, 0u, 0u, 0u);
#endif
var<private> a_joint: vec4<u32> = vec4<u32>(0u, 0u, 0u, 0u);
var<private> a_weight: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);
var<private> a_baryCentricCoord: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);
var<private> a_texcoord_2: vec2<f32> = vec2<f32>(0.0, 0.0);
