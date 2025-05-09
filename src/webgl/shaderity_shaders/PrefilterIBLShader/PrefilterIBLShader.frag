#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableFragmentExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec2 v_texcoord_0;

uniform samplerCube u_baseColorTexture; // initialValue=(0,white)
uniform int u_cubeMapFaceId; // initialValue=0
uniform int u_distributionType; // initialValue=0
uniform float u_roughness; // initialValue=0.0
uniform int u_sampleCount; // initialValue=1024

#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{getters} */

const int cLambertian = 0;
const int cGGX = 1;
const int cCharlie = 2;

// http://holger.dammertz.org/stuff/notes_HammersleyOnHemisphere.html
float radicalInverse_VdC(uint bits)
{
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return float(bits) * 2.3283064365386963e-10; // / 0x100000000
}

vec2 hammersley2d(int i, int N) {
    return vec2(float(i)/float(N), radicalInverse_VdC(uint(i)));
}

mat3 createTBN(vec3 normal)
{
    vec3 bitangent = vec3(0.0, 1.0, 0.0);
    float NdotUp = dot(normal, vec3(0.0, 1.0, 0.0));
    float epsilon = 0.0000001;
    if (1.0 - abs(NdotUp) <= epsilon)
    {
      bitangent = (NdotUp > 0.0) ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 0.0, -1.0);
    }
    vec3 tangent = normalize(cross(bitangent, normal));
    bitangent = cross(normal, tangent);
    return mat3(tangent, bitangent, normal);
}

vec4 getImportanceSampleLambertian(int sampleIndex, vec3 N, float roughness, float materialSID)
{
    vec2 xi = hammersley2d(sampleIndex, get_sampleCount(materialSID, 0));

    float sinTheta = sqrt(1.0 - xi.y);
    float cosTheta = sqrt(xi.y);
    float phi = 2.0 * PI * xi.x;
    float pdf = cosTheta / PI;

    vec3 localDirection = normalize(vec3(
        sinTheta * cos(phi),
        sinTheta * sin(phi),
        cosTheta
    ));
    vec3 direction = createTBN(N) * localDirection;

    return vec4(direction, pdf);
}

// GGX NDF
float d_GGX(float NH, float alphaRoughness) {
  float roughnessSqr = alphaRoughness * alphaRoughness;
  float f = (roughnessSqr - 1.0) * NH * NH + 1.0;
  return roughnessSqr / (PI * f * f);
}

// We learnd a lot from the following resources
// https://bruop.github.io/ibl/
vec4 getImportanceSampleGGX(int sampleIndex, vec3 N, float roughness, float materialSID)
{
    vec2 xi = hammersley2d(sampleIndex, get_sampleCount(materialSID, 0));

    float alpha = roughness * roughness;
    float cosTheta = clamp(sqrt((1.0 - xi.y) / (1.0 + (alpha * alpha - 1.0) * xi.y)), 0.0, 1.0);
    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
    float phi = 2.0 * PI * xi.x;
    float pdf = d_GGX(cosTheta, alpha);
    pdf /= 4.0;

    vec3 localDirection = normalize(vec3(
        sinTheta * cos(phi),
        sinTheta * sin(phi),
        cosTheta
    ));
    vec3 direction = createTBN(N) * localDirection;

    return vec4(direction, pdf);
}

float D_Charlie(float sheenRoughness, float NdotH)
{
    sheenRoughness = max(sheenRoughness, 0.000001); //clamp (0,1]
    float invR = 1.0 / sheenRoughness;
    float cos2h = NdotH * NdotH;
    float sin2h = 1.0 - cos2h;
    return (2.0 + invR) * pow(sin2h, invR * 0.5) / (2.0 * MATH_PI);
}

vec4 getImportanceSampleCharlie(int sampleIndex, vec3 N, float roughness, float materialSID)
{
    vec2 xi = hammersley2d(sampleIndex, get_sampleCount(materialSID, 0));

    float alpha = roughness * roughness;
    float sinTheta = pow(xi.y, alpha / (2.0*alpha + 1.0));
    float cosTheta = sqrt(1.0 - sinTheta * sinTheta);
    float phi = 2.0 * PI * xi.x;
    float pdf = D_Charlie(alpha, cosTheta);
    pdf /= 4.0;

    vec3 localDirection = normalize(vec3(
        sinTheta * cos(phi),
        sinTheta * sin(phi),
        cosTheta
    ));
    vec3 direction = createTBN(N) * localDirection;

    return vec4(direction, pdf);
}

// We learnd a lot from the following resources
// https://developer.nvidia.com/gpugems/gpugems3/part-iii-rendering/chapter-20-gpu-based-importance-sampling
// https://cgg.mff.cuni.cz/~jaroslav/papers/2007-sketch-fis/Final_sap_0073.pdf
// https://google.github.io/filament/Filament.html#annex/importancesamplingfortheibl/pre-filteredimportancesampling
float computeLod(float pdf, int width, int sampleCount)
{
    // 6.0 is the number of faces of the cubemap
    // log4 = 0.5 * log2
    // We don't use the constant K in the filament document
    return 0.5 * log2( 6.0 * float(width) * float(width) / (float(sampleCount) * pdf));
}

vec3 prefilter(vec3 N, float materialSID)
{
    vec3 color = vec3(0.f);
    float weight = 0.0f;
    int sampleCount = get_sampleCount(materialSID, 0);

    ivec2 texSize = textureSize(u_baseColorTexture, 0);

    for(int i = 0; i < get_sampleCount(materialSID, 0); ++i)
    {
        vec4 importanceSample;

        int distributionType = get_distributionType(materialSID, 0);
        if(distributionType == cLambertian) {
            importanceSample = getImportanceSampleLambertian(i, N, get_roughness(materialSID, 0), materialSID);
        } else if(distributionType == cGGX) {
            importanceSample = getImportanceSampleGGX(i, N, get_roughness(materialSID, 0), materialSID);
        } else {
            importanceSample = getImportanceSampleCharlie(i, N, get_roughness(materialSID, 0), materialSID);
        }

        vec3 H = vec3(importanceSample.xyz);
        float pdf = importanceSample.w;
        float lod = computeLod(pdf, texSize.x, sampleCount);

        if(distributionType == cLambertian)
        {
            vec3 lambertian = textureLod(u_baseColorTexture, H, lod).rgb;
            color += lambertian;
        }
        else if(distributionType == cGGX || distributionType == cCharlie)
        {
            vec3 V = N;
            vec3 L = normalize(reflect(-V, H));
            float NdotL = dot(N, L);

            if (NdotL > 0.0)
            {
                vec3 sampleColor = textureLod(u_baseColorTexture, L, lod).rgb;
                color += sampleColor * NdotL;
                weight += NdotL;
            }
        }
    }

    if(weight != 0.0f)
    {
        color /= weight;
    }
    else
    {
        color /= float(sampleCount);
    }

    return color.rgb;
}

vec3 uvToDir(int faceId, vec2 uv)
{
	if(faceId == 0)
		return vec3(1.f, uv.y, -uv.x);
	else if(faceId == 1)
		return vec3(-1.f, uv.y, uv.x);
	else if(faceId == 2)
		return vec3(+uv.x, -1.f, +uv.y);
	else if(faceId == 3)
		return vec3(+uv.x, 1.f, -uv.y);
	else if(faceId == 4)
		return vec3(+uv.x, uv.y, 1.f);
	else
    return vec3(-uv.x, +uv.y, -1.f);
}

// learned a lot from https://github.com/KhronosGroup/glTF-Sample-Viewer
void main ()
{
#pragma shaderity: require(../common/mainPrerequisites.glsl)

  vec2 uv = v_texcoord_0 * 2.0 - 1.0;
  vec3 scan = uvToDir(get_cubeMapFaceId(materialSID, 0), uv);
  vec3 direction = normalize(scan);
  direction.y = -direction.y;

  rt0 = vec4(prefilter(direction, materialSID), 1.0);

#pragma shaderity: require(../common/glFragColor.glsl)
}
