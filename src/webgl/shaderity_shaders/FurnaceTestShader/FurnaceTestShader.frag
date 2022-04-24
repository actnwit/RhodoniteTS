#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec2 v_texcoord;
in vec3 v_normal_inWorld;
in vec4 v_position_inWorld;

#pragma shaderity: require(../common/rt0.glsl)


/* shaderity: @{getters} */

#define MATH_PI 3.141592

// These codes are referenced from https://github.com/knarkowicz/FurnaceTest
float roughnessRemap(float userRoughness) {
  return userRoughness * userRoughness;
}

// GGX NDF
float d_ggx(float userRoughness, float NH) {
  float alphaRoughness = userRoughness * userRoughness;
  float roughnessSqr = alphaRoughness * alphaRoughness;
  float f = (roughnessSqr - 1.0) * NH * NH + 1.0;
  return roughnessSqr / (MATH_PI * f * f);
}

// this is from https://www.unrealengine.com/blog/physically-based-shading-on-mobile
vec2 envBRDFApprox( float Roughness, float NoV ) {
  const vec4 c0 = vec4(-1, -0.0275, -0.572, 0.022 );
  const vec4 c1 = vec4(1, 0.0425, 1.04, -0.04 );
  vec4 r = Roughness * c0 + c1;
  float a004 = min( r.x * r.x, exp2( -9.28 * NoV ) ) * r.x + r.y;
  vec2 AB = vec2( -1.04, 1.04 ) * a004 + r.zw;

  return AB;
}

float specularIBL(float userRoughness, float NV, float f0) {
  /// Use specular BRDF LUT
  // vec3 brdf = texture2D(u_brdfLutTexture, vec2(NV, 1.0 - userRoughness)).rgb;
  // float specular = 1.0 * (f0 * brdf.x + brdf.y);

  /// Use specular BRDF Approx
  vec2 f_ab = envBRDFApprox(userRoughness, NV);
  vec3 specular = vec3(f0) * f_ab.x + f_ab.y;
  return specular.x;
}

// The Schlick Approximation to Fresnel
float fresnel(float f0, float VH) {
  return f0 + (1.0 - f0) * pow(1.0 - VH, 5.0);
}

float smithG1(float roughness, float NoV)
{
	float a = roughnessRemap( roughness );
	float a2 = a * a;
	float NoV2 = NoV * NoV;
	float lambda = (-1.0 + sqrt(1.0 + a2 * (1.0 - NoV2) / NoV2)) * 0.5;
	return 1.0 / (1.0 + lambda);
}

float smithG(float roughness, float NoV, float NoL)
{
	float a = roughnessRemap( roughness );
	float a2 = a * a;
	float NoV2 = NoV * NoV;
	float NoL2 = NoL * NoL;
	float lambdaV = (-1.0 + sqrt(1.0 + a2 * (1.0 - NoV2) / NoV2)) * 0.5;
	float lambdaL = (-1.0 + sqrt(1.0 + a2 * (1.0 - NoL2) / NoL2)) * 0.5;
	return 1.0 / (1.0 + lambdaV + lambdaL);
}

float g_shieldingForWeak(float alphaRoughness, float NV, float NL) {
  float r = alphaRoughness;

  // Local Masking using "Schlick-Smith" Masking Function
  float localMasking = 2.0 * NV / (NV + sqrt(r * r + (1.0 - r * r) * (NV * NV)));

  return localMasking;
}


float g_shielding(float roughness, float NV, float NL) {
  float a = roughnessRemap( roughness );
  float r = a;

  // Local Shadowing using "Schlick-Smith" Masking Function
  float localShadowing = 2.0 * NL / (NL + sqrt(r * r + (1.0 - r * r) * (NL * NL)));

  // Local Masking using "Schlick-Smith" Masking Function
  float localMasking = 2.0 * NV / (NV + sqrt(r * r + (1.0 - r * r) * (NV * NV)));

  return localShadowing * localMasking;
}

float v_SmithGGXCorrelatedForWeak(float roughness, float NV, float NL) {
  float a = roughnessRemap( roughness );
  float a2 = a * a;
  float GGXV = NL * sqrt(NV * NV * (1.0 - a2) + a2);
  return 0.5 / (GGXV);
}

float v_SmithGGXCorrelated(float roughness, float NV, float NL) {
  float a = roughnessRemap( roughness );
  float a2 = a * a;
  float GGXV = NL * sqrt(NV * NV * (1.0 - a2) + a2);
  float GGXL = NV * sqrt(NL * NL * (1.0 - a2) + a2);
  return 0.5 / (GGXV + GGXL);
}

float vanDerCorpus(int n, int base)
{
    float invBase = 1.0 / float(base);
    float denom   = 1.0;
    float result  = 0.0;

    for(int i = 0; i < 32; ++i)
    {
        if(n > 0)
        {
            denom   = mod(float(n), 2.0);
            result += denom * invBase;
            invBase = invBase / 2.0;
            n       = int(float(n) / 2.0);
        }
    }

    return result;
}

// this is from https://learnopengl.com/PBR/IBL/Specular-IBL
vec2 hammersleyNoBitOps(int i, int N)
{
  return vec2(float(i)/float(N), vanDerCorpus(i, 2));
}

vec3 sampleHemisphereGGX(vec2 Xi, float roughness) {
  float a = roughnessRemap(roughness);
	float a2 = a * a;

  float phi = 2.0 * MATH_PI * Xi.x;
  float cosPhi = cos(phi);
  float sinPhi = sin(phi);
  float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a2 - 1.0) * Xi.y)); // GGX
  float sinTheta = sqrt(1.0 - cosTheta * cosTheta);

  return vec3(sinTheta * cos(phi), sinTheta * sin(phi), cosTheta);
}

float weakWhiteFurnaceTest(float roughness, float NoV, float f0, int g_type, int disable_fresnel)
{
	float vx = sqrt(1.0 - NoV * NoV);
	float vy = 0.0;
	float vz = NoV;

	float integral = 0.0;
	const int sampleNum = 2048;
	for (int i = 0; i < sampleNum; ++i)
	{
    vec2 Xi = hammersleyNoBitOps(i, sampleNum);

    vec3 hvec = sampleHemisphereGGX(Xi, roughness);

		float VoHUnsat = vx * hvec.x + vy * hvec.y + vz * hvec.z;

    float lz = 2.0 * VoHUnsat * hvec.z - vz;

    float NoL = max(lz, 0.0);
		float NoH = max(hvec.z, 0.0);
		float VoH = max(VoHUnsat, 0.0);

    float f = fresnel(f0, VoH);

    float g1 = 0.0;
    if (g_type == 0) {
      g1 = smithG1(roughness, NoV);
    } else if (g_type == 1) {
      g1 = g_shieldingForWeak(roughness, NoV, NoL);
    } else if (g_type == 2) {
      g1 = v_SmithGGXCorrelatedForWeak(roughness, NoV, NoL) * 4.0 * NoV * NoL;
    }

    float pdf = 4.0 * VoH / NoH;
    float integralValue = (g1 * pdf) / (4.0 * NoV);
    if (disable_fresnel == 0) {
      integralValue *= f;
    }
    // integralValue *= 0.5; // Set furnace color 0.5

    integral += integralValue;

	}
	integral /= float(sampleNum);
	return clamp(integral, 0.0, 1.0);
}

float whiteFurnaceTest(float roughness, float NoV, float f0, int g_type, int disable_fresnel)
{
	float vx = sqrt(1.0 - NoV * NoV);
	float vy = 0.0;
	float vz = NoV;

	float integral = 0.0;
	const int sampleNum = 4096;
	for (int i = 0; i < sampleNum; ++i)
	{

    vec2 Xi = hammersleyNoBitOps(i, sampleNum);

    vec3 hvec = sampleHemisphereGGX(Xi, roughness);

		float VoHUnsat = vx * hvec.x + vy * hvec.y + vz * hvec.z;
		float lx = 2.0 * VoHUnsat * hvec.x - vx;
		float ly = 2.0 * VoHUnsat * hvec.y - vy;
		float lz = 2.0 * VoHUnsat * hvec.z - vz;

		float NoL = max(lz, 0.0);
		float NoH = max(hvec.z, 0.0);
    float VoH = max(VoHUnsat, 0.0);

    float f = fresnel(f0, VoH);

    float g = 0.0;
    if (g_type == 0) {
      g = smithG(roughness, NoV, NoL);
    } else if (g_type == 1){
      g = g_shielding(roughness, NoV, NoL);
    } else if (g_type == 2){
      g = v_SmithGGXCorrelated(roughness, NoV, NoL) * (4.0 * NoV * NoL);
    } else if (g_type == 3) {
      g = 0.0;
    }

    float pdf = 4.0 * VoH / NoH;
    float integralValue = (g * pdf) / (4.0 * NoV);
    if (disable_fresnel == 0 && g_type != 3) {
      integralValue *= f;
    }
    // integralValue *= 0.5; // Set furnace color 0.5
    integral += integralValue;
	}
  integral /= float(sampleNum);
  if (g_type == 3) {
    integral = specularIBL(roughness, NoV, f0);
  }
	return clamp(integral, 0.0, 1.0);
}

void main ()
{
#pragma shaderity: require(../common/mainPrerequisites.glsl)

  vec2 quadSizeInPixel = get_screenInfo(materialSID, 0);
  float roughness = 0.0;
  float NoV = 0.0; // normal dot view vector

  // 2D mode
  int mode = get_mode(materialSID, 0);
  if (mode == 0) {
    roughness = (gl_FragCoord.y) / quadSizeInPixel.y;
    NoV = (gl_FragCoord.x) / quadSizeInPixel.x;
  } else {
    // object mode
    // Roughness
    const float c_MinRoughness = 0.04;
    vec2 metallicRoughnessFactor = get_metallicRoughnessFactor(materialSID, 0);
    float userRoughness = metallicRoughnessFactor.y;
    float metallic = metallicRoughnessFactor.x;

    vec4 ormTexel = texture2D(u_metallicRoughnessTexture, v_texcoord);
    userRoughness = ormTexel.g * userRoughness;
    userRoughness = clamp(userRoughness, c_MinRoughness, 1.0);
    roughness = userRoughness;

    // vec3 viewVector = normalize(vec3(0.0, 0.0, 10.0) - v_position_inWorld.xyz);
    // vec3 viewVector = normalize(u_viewPosition - v_position_inWorld.xyz);
    vec3 viewVector = vec3(0.0, 0.0, 1.0);
    NoV = dot(v_normal_inWorld, viewVector);
  }

  int debugView = get_debugView(materialSID, 0);
  float f0 = get_f0(materialSID, 0);
  int g_type = get_g_type(materialSID, 0);
  int disable_fresnel = get_disable_fresnel(materialSID, 0);

  if (debugView == 0) {
    float whiteFurnaceResult = whiteFurnaceTest(roughness, NoV, f0, g_type, disable_fresnel);
    rt0 = vec4(whiteFurnaceResult, whiteFurnaceResult, whiteFurnaceResult, 1.0);

  } else if (debugView == 1) {
    float weakWhiteFurnaceResult = weakWhiteFurnaceTest(roughness, NoV, f0, g_type, disable_fresnel);
    rt0 = vec4(weakWhiteFurnaceResult, weakWhiteFurnaceResult, weakWhiteFurnaceResult, 1.0);

  } else if (debugView == 2){
    float nn = NoV*0.5+0.5;
    rt0 = vec4(nn, nn, nn, 1.0);

  } else if (debugView == 3){
    rt0 = vec4(v_normal_inWorld.xyz, 1.0);

  } else if (debugView == 4){
    float whiteFurnaceResult = whiteFurnaceTest(roughness, NoV, f0, g_type, disable_fresnel);
    float weakWhiteFurnaceResult = weakWhiteFurnaceTest(roughness, NoV, f0, g_type, disable_fresnel);
    rt0 = vec4(whiteFurnaceResult, weakWhiteFurnaceResult, 0.0, 1.0);

  } else if (debugView == 5){
    rt0 = vec4(roughness, NoV, 0.0, 1.0);

  } else {
    rt0 = vec4(1.0, 1.0, 1.0, 1.0);
  }

  #pragma shaderity: require(../common/glFragColor.glsl)
}
