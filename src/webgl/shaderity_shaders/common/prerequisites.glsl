precision highp sampler2DArray;

const float Epsilon = 0.0000001;

float saturate(float x) {
  return clamp(x, 0.0, 1.0);
}

float saturateEpsilonToOne(float x) {
  return clamp(x, Epsilon, 1.0);
}

const uint INVALID_ID = 0xFFFFFFFFu;

uniform highp sampler2D u_dataTexture; // skipProcess=true
/* shaderity: @{widthOfDataTexture} */

#if defined(GLSL_ES3) && defined(RN_IS_DATATEXTURE_MODE) && defined(RN_IS_UBO_ENABLED)
/* shaderity: @{dataUBOVec4Size} */
/* shaderity: @{dataUBODefinition} */
#endif

layout (std140) uniform UniformMorphOffsets {
  ivec4 data[/* shaderity: @{maxMorphOffsetsDataNumber} */];
} uniformMorphOffsets;

layout (std140) uniform UniformMorphWeights {
  vec4 data[/* shaderity: @{maxMorphWeightsDataNumber} */];
} uniformMorphWeights;

highp vec4 fetchElement(int vec4_idx) {
  highp ivec2 uv = ivec2(vec4_idx % widthOfDataTexture, vec4_idx / widthOfDataTexture);
  return texelFetch( u_dataTexture, uv, 0 );
  // This idea from https://qiita.com/YVT/items/c695ab4b3cf7faa93885
  // highp vec2 invSize = vec2(1.0/float(widthOfDataTexture), 1.0/float(heightOfDataTexture));
  // highp float t = (float(vec4_idx) + 0.5) * invSize.x;
  // highp float x = fract(t);
  // highp float y = (floor(t) + 0.5) * invSize.y;
  // return texture( u_dataTexture, vec2(x, y));
}

vec2 fetchVec2No16BytesAligned(int scalar_idx) {
#ifdef GLSL_ES3
  int posIn4bytes = scalar_idx % 4;
#else
  int posIn4bytes = int(mod(float(scalar_idx), 4.0));
#endif

  int basePosIn16bytes = (scalar_idx - posIn4bytes) / 4;
  if (posIn4bytes == 0) {
    vec4 val = fetchElement(basePosIn16bytes);
    return val.xy;
  } else if (posIn4bytes == 1) {
    vec4 val0 = fetchElement(basePosIn16bytes);
    return vec2(val0.yz);
  } else if (posIn4bytes == 2) {
    vec4 val0 = fetchElement(basePosIn16bytes);
    vec4 val1 = fetchElement(basePosIn16bytes+1);
    return vec2(val0.zw);
  } else { // posIn4bytes == 3
    vec4 val0 = fetchElement(basePosIn16bytes);
    vec4 val1 = fetchElement(basePosIn16bytes+1);
    return vec2(val0.w, val1.x);
  }
}

vec3 fetchVec3No16BytesAligned(int scalar_idx) {
#ifdef GLSL_ES3
  int posIn4bytes = scalar_idx % 4;
#else
  int posIn4bytes = int(mod(float(scalar_idx), 4.0));
#endif

  int basePosIn16bytes = (scalar_idx - posIn4bytes) / 4;
  if (posIn4bytes == 0) {
    vec4 val = fetchElement(basePosIn16bytes);
    return val.xyz;
  } else if (posIn4bytes == 1) {
    vec4 val0 = fetchElement(basePosIn16bytes);
    return vec3(val0.yzw);
  } else if (posIn4bytes == 2) {
    vec4 val0 = fetchElement(basePosIn16bytes);
    vec4 val1 = fetchElement(basePosIn16bytes+1);
    return vec3(val0.zw, val1.x);
  } else { // posIn4bytes == 3
    vec4 val0 = fetchElement(basePosIn16bytes);
    vec4 val1 = fetchElement(basePosIn16bytes+1);
    return vec3(val0.w, val1.xy);
  }
}

vec4 fetchVec4(int vec4_idx) {
  return fetchElement(vec4_idx);
}

float fetchScalarNo16BytesAligned(int scalar_idx) {
#ifdef GLSL_ES3
  int posIn4bytes = scalar_idx % 4;
#else
  int posIn4bytes = int(mod(float(scalar_idx), 4.0));
#endif
  int basePosIn16bytes = (scalar_idx - posIn4bytes) / 4;
  vec4 val = fetchElement(basePosIn16bytes);
  if (posIn4bytes == 0) {
    return val.x;
  } else if (posIn4bytes == 1) {
    return val.y;
  } else if (posIn4bytes == 2) {
    return val.z;
  } else if (posIn4bytes == 3) {
    return val.w;
  }
}

mat2 fetchMat2No16BytesAligned(int scalar_idx) {
  int vec4_idx = scalar_idx*4;
  vec4 col0 = fetchElement(vec4_idx);

  mat2 val = mat2(
    col0.x, col0.y,
    col0.z, col0.w
    );

  return val;
}

mat2 fetchMat2(int vec4_idx) {
  vec4 col0 = fetchElement(vec4_idx);

  mat2 val = mat2(
    col0.x, col0.y,
    col0.z, col0.w
    );

  return val;
}

mat3 fetchMat3No16BytesAligned(int scalar_idx) {
#ifdef GLSL_ES3
  int posIn4bytes = scalar_idx % 4;
#else
  int posIn4bytes = int(mod(float(scalar_idx), 4.0));
#endif

  int basePosIn16bytes = (scalar_idx - posIn4bytes) / 4;
  if (posIn4bytes == 0) {
    vec4 col0 = fetchElement(basePosIn16bytes);
    vec4 col1 = fetchElement(basePosIn16bytes + 1);
    vec4 col2 = fetchElement(basePosIn16bytes + 2);
    mat3 val = mat3(
      col0.x, col0.y, col0.z,
      col0.w, col1.x, col1.y,
      col1.z, col1.w, col2.x
      );
    return val;
  } else if (posIn4bytes == 1) {
    vec4 col0 = fetchElement(basePosIn16bytes);
    vec4 col1 = fetchElement(basePosIn16bytes + 1);
    vec4 col2 = fetchElement(basePosIn16bytes + 2);
    mat3 val = mat3(
      col0.y, col0.z, col0.w,
      col1.x, col1.y, col1.z,
      col1.w, col2.x, col2.y
      );
    return val;
  } else if (posIn4bytes == 2) {
    vec4 col0 = fetchElement(basePosIn16bytes);
    vec4 col1 = fetchElement(basePosIn16bytes + 1);
    vec4 col2 = fetchElement(basePosIn16bytes + 2);
    mat3 val = mat3(
      col0.z, col0.w, col1.x,
      col1.y, col1.z, col1.w,
      col2.x, col2.y, col2.z
      );
    return val;
  } else { // posIn4bytes == 3
    vec4 col0 = fetchElement(basePosIn16bytes);
    vec4 col1 = fetchElement(basePosIn16bytes + 1);
    vec4 col2 = fetchElement(basePosIn16bytes + 2);
    mat3 val = mat3(
      col0.w, col1.x, col1.y,
      col1.z, col1.w, col2.x,
      col2.y, col2.z, col2.w
      );
    return val;
  }

}

mat3 fetchMat3(int vec4_idx) {
  vec4 col0 = fetchElement(vec4_idx);
  vec4 col1 = fetchElement(vec4_idx + 1);
  vec4 col2 = fetchElement(vec4_idx + 2);

  mat3 val = mat3(
    col0.x, col0.y, col0.z,
    col0.w, col1.x, col1.y,
    col1.z, col1.w, col2.x
    );

  return val;
}

mat4 fetchMat4No16BytesAligned(int scalar_idx) {
#ifdef GLSL_ES3
  int posIn4bytes = scalar_idx % 4;
#else
  int posIn4bytes = int(mod(float(scalar_idx), 4.0));
#endif

  int basePosIn16bytes = (scalar_idx - posIn4bytes) / 4;
  if (posIn4bytes == 0) {
    vec4 col0 = fetchElement(basePosIn16bytes);
    vec4 col1 = fetchElement(basePosIn16bytes + 1);
    vec4 col2 = fetchElement(basePosIn16bytes + 2);
    vec4 col3 = fetchElement(basePosIn16bytes + 3);
    mat4 val = mat4(
      col0.x, col0.y, col0.z, col0.w,
      col1.x, col1.y, col1.z, col1.w,
      col2.x, col2.y, col2.z, col2.w,
      col3.x, col3.y, col3.z, col3.w
      );
    return val;
  } else if (posIn4bytes == 1) {
    vec4 col0 = fetchElement(basePosIn16bytes);
    vec4 col1 = fetchElement(basePosIn16bytes + 1);
    vec4 col2 = fetchElement(basePosIn16bytes + 2);
    vec4 col3 = fetchElement(basePosIn16bytes + 3);
    vec4 col4 = fetchElement(basePosIn16bytes + 4);
    mat4 val = mat4(
      col0.y, col0.z, col0.w, col1.x,
      col1.y, col1.z, col1.w, col2.x,
      col2.y, col2.z, col2.w, col3.x,
      col3.y, col3.z, col3.w, col4.x
      );
    return val;
  } else if (posIn4bytes == 2) {
    vec4 col0 = fetchElement(basePosIn16bytes);
    vec4 col1 = fetchElement(basePosIn16bytes + 1);
    vec4 col2 = fetchElement(basePosIn16bytes + 2);
    vec4 col3 = fetchElement(basePosIn16bytes + 3);
    vec4 col4 = fetchElement(basePosIn16bytes + 4);
    mat4 val = mat4(
      col0.z, col0.w, col1.x, col1.y,
      col1.z, col1.w, col2.x, col2.y,
      col2.z, col2.w, col3.x, col3.y,
      col3.z, col3.w, col4.x, col4.y
      );
    return val;
  } else { // posIn4bytes == 3
    vec4 col0 = fetchElement(basePosIn16bytes);
    vec4 col1 = fetchElement(basePosIn16bytes + 1);
    vec4 col2 = fetchElement(basePosIn16bytes + 2);
    vec4 col3 = fetchElement(basePosIn16bytes + 3);
    vec4 col4 = fetchElement(basePosIn16bytes + 4);
    mat4 val = mat4(
      col0.w, col1.x, col1.y, col1.z,
      col1.w, col2.x, col2.y, col2.z,
      col2.w, col3.x, col3.y, col3.z,
      col3.w, col4.x, col4.y, col4.z
      );
    return val;
  }
}

mat4 fetchMat4(int vec4_idx) {
  vec4 col0 = fetchElement(vec4_idx);
  vec4 col1 = fetchElement(vec4_idx + 1);
  vec4 col2 = fetchElement(vec4_idx + 2);
  vec4 col3 = fetchElement(vec4_idx + 3);

  mat4 val = mat4(
    col0.x, col0.y, col0.z, col0.w,
    col1.x, col1.y, col1.z, col1.w,
    col2.x, col2.y, col2.z, col2.w,
    col3.x, col3.y, col3.z, col3.w
    );

  return val;
}

mat4x3 fetchMat4x3(int vec4_idx) {
  vec4 col0 = fetchElement(vec4_idx);
  vec4 col1 = fetchElement(vec4_idx + 1);
  vec4 col2 = fetchElement(vec4_idx + 2);

  mat4x3 val = mat4x3(
    col0.x, col0.y, col0.z, col0.w,
    col1.x, col1.y, col1.z, col1.w,
    col2.x, col2.y, col2.z, col2.w);
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

const float M_PI = 3.14159265358979323846;
const float RECIPROCAL_PI = 0.3183098861837907;

float max3(vec3 v)
{
  return max(max(v.x, v.y), v.z);
}

float sq(float t)
{
  return t * t;
}

vec2 sq(vec2 t)
{
  return t * t;
}

vec3 sq(vec3 t)
{
  return t * t;
}

vec4 sq(vec4 t)
{
  return t * t;
}

vec2 uvTransform(vec2 scale, vec2 offset, float rotation, vec2 uv) {
  mat3 translationMat = mat3(1,0,0, 0,1,0, offset.x, offset.y, 1);
  mat3 rotationMat = mat3(
      cos(rotation), -sin(rotation), 0,
      sin(rotation), cos(rotation), 0,
                  0,             0, 1
  );
  mat3 scaleMat = mat3(scale.x,0,0, 0,scale.y,0, 0,0,1);

  mat3 matrix = translationMat * rotationMat * scaleMat;
  vec2 uvTransformed = ( matrix * vec3(uv.xy, 1) ).xy;

  return uvTransformed;
}

// getTBN: Compute tangent-to-world matrix for normal mapping
#ifdef RN_USE_TANGENT
  // When tangent attributes are available
  mat3 getTBN(vec3 normal_inWorld, vec3 tangent_inWorld_, vec3 bitangent_inWorld_, vec3 viewVector, vec2 texcoord) {
    vec3 tangent_inWorld = normalize(tangent_inWorld_);
    vec3 bitangent_inWorld = normalize(bitangent_inWorld_);
    mat3 tbnMat_tangent_to_world = mat3(tangent_inWorld, bitangent_inWorld, normal_inWorld);

    return tbnMat_tangent_to_world;
  }
#else
  #ifdef RN_IS_PIXEL_SHADER
    // This is based on http://www.thetenthplanet.de/archives/1180
    // Pixel shader can use dFdx/dFdy to compute cotangent frame
    mat3 cotangent_frame(vec3 normal_inWorld, vec3 position, vec2 uv) {
      uv = gl_FrontFacing ? uv : -uv;

      // get edge vectors of the pixel triangle
      vec3 dp1 = dFdx(position);
      vec3 dp2 = dFdy(position);
      vec2 duv1 = dFdx(uv);
      vec2 duv2 = dFdy(uv);

      // solve the linear system
      vec3 dp2perp = cross(dp2, normal_inWorld);
      vec3 dp1perp = cross(normal_inWorld, dp1);
      vec3 tangent = dp2perp * duv1.x + dp1perp * duv2.x;
      vec3 bitangent = dp2perp * duv1.y + dp1perp * duv2.y;
      bitangent *= -1.0;

      // construct a scale-invariant frame
      float invMat = inversesqrt(max(dot(tangent, tangent), dot(bitangent, bitangent)));
      return mat3(normalize(tangent * invMat), normalize(bitangent * invMat), normal_inWorld);
    }

    mat3 getTBN(vec3 normal_inWorld, vec3 tangent_inWorld_, vec3 bitangent_inWorld_, vec3 viewVector, vec2 texcoord) {
      mat3 tbnMat_tangent_to_world = cotangent_frame(normal_inWorld, -viewVector, texcoord);

      return tbnMat_tangent_to_world;
    }
  #else // RN_IS_VERTEX_SHADER
    // Vertex shader fallback: Generate TBN from normal when tangent attributes are not available
    // This is an approximation - it generates a consistent tangent space from the normal vector
    mat3 getTBN(vec3 normal_inWorld, vec3 tangent_inWorld_, vec3 bitangent_inWorld_, vec3 viewVector, vec2 texcoord) {
      vec3 n = normalize(normal_inWorld);

      // Choose a helper vector that is not parallel to the normal
      // Use (0, 1, 0) unless the normal is nearly parallel to it, then use (1, 0, 0)
      vec3 helper = abs(n.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);

      // Compute tangent and bitangent using cross products
      vec3 tangent = normalize(cross(helper, n));
      vec3 bitangent = normalize(cross(n, tangent));

      return mat3(tangent, bitangent, n);
    }
  #endif
#endif

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

#if defined(RN_USE_WIREFRAME) && defined(RN_IS_PIXEL_SHADER)
float edge_ratio(vec3 bary3, float wireframeWidthInner, float wireframeWidthRelativeScale) {
  vec3 d = fwidth(bary3);
  vec3 x = bary3+vec3(1.0 - wireframeWidthInner)*d;
  vec3 a3 = smoothstep(vec3(0.0), d, x);
  float factor = min(min(a3.x, a3.y), a3.z);

  return clamp((1.0 - factor), 0.0, 1.0);
}
#endif // defined(RN_USE_WIREFRAME) && defined(RN_IS_PIXEL_SHADER)

// Implementation copied from https://webgpu.github.io/webgpu-samples/samples/cornell#./common.wgsl
uvec3 g_rnd;
void init_rand(uvec3 invocation_id,uvec3 seed){
  uvec3 A = uvec3(1741651u * 1009u,
      140893u * 1609u * 13u,
  6521u * 983u * 7u * 2u);
  g_rnd = (invocation_id * A) ^ seed;
}

float random_f32(){
  uvec3 C = uvec3(60493u * 9377u,
      11279u * 2539u * 23u,
  7919u * 631u * 5u * 3u);
  g_rnd = (g_rnd * C) ^ (g_rnd.yzx >> uvec3(4u));
  return float(g_rnd.x ^ g_rnd.y) / float(0xffffffffu);
}
