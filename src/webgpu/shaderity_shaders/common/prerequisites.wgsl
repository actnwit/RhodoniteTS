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
const c_MinRoughness: f32 = 0.00001;

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

fn saturateEpsilonToOne(x: f32) -> f32 {
  let Epsilon = 0.0000001;
  return clamp(x, Epsilon, 1.0);
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
