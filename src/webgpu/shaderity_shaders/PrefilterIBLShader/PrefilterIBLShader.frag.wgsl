/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */


@group(1) @binding(0) var baseColorTexture: texture_cube<f32>; // initialValue=white
@group(2) @binding(0) var baseColorSampler: sampler;
// #param cubeMapFaceId: i32; // initialValue=0
// #param distributionType: i32; // initialValue=0
// #param roughness: f32; // initialValue=0.0
// #param sampleCount: i32; // initialValue=1024

const cLambertian: i32 = 0;
const cGGX: i32 = 1;
const cCharlie: i32 = 2;
// http://holger.dammertz.org/stuff/notes_HammersleyOnHemisphere.html
fn radicalInverse_VdC(_bits: u32) -> f32
{
    var bits = (_bits << 16u) | (_bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return f32(bits) * 2.3283064365386963e-10; // / 0x100000000
}

fn hammersley2d(i: i32, N: i32) -> vec2f {
    return vec2f(f32(i)/f32(N), radicalInverse_VdC(u32(i)));
}

fn createTBN(normal: vec3f) -> mat3x3<f32>
{
    var bitangent = vec3f(0.0, 1.0, 0.0);
    let NdotUp = dot(normal, vec3f(0.0, 1.0, 0.0));
    let epsilon = 0.0000001;
    if (1.0 - abs(NdotUp) <= epsilon)
    {
      bitangent = select(vec3(0.0, 0.0, -1.0), vec3(0.0, 0.0, 1.0), NdotUp > 0.0);
    }
    let tangent = normalize(cross(bitangent, normal));
    bitangent = cross(normal, tangent);
    return mat3x3<f32>(tangent, bitangent, normal);
}

fn getImportanceSampleLambertian(sampleIndex: i32, N: vec3f, roughness: f32, materialSID: u32) -> vec4f
{
    let xi = hammersley2d(sampleIndex, get_sampleCount(materialSID, 0));

    let sinTheta = sqrt(1.0 - xi.y);
    let cosTheta = sqrt(xi.y);
    let phi = 2.0 * M_PI * xi.x;
    let pdf = cosTheta / M_PI;

    let localDirection = normalize(vec3f(
        sinTheta * cos(phi),
        sinTheta * sin(phi),
        cosTheta
    ));
    let direction = createTBN(N) * localDirection;

    return vec4f(direction, pdf);
}

// GGX NDF
fn d_GGX(NH: f32, alphaRoughness: f32) -> f32 {
  let roughnessSqr = alphaRoughness * alphaRoughness;
  let f = (roughnessSqr - 1.0) * NH * NH + 1.0;
  return roughnessSqr / (M_PI * f * f);
}

// We learnd a lot from the following resources
// https://bruop.github.io/ibl/
fn getImportanceSampleGGX(sampleIndex: i32, N: vec3f, roughness: f32, materialSID: u32) -> vec4f
{
    let xi = hammersley2d(sampleIndex, get_sampleCount(materialSID, 0));

    let alpha = roughness * roughness;
    let cosTheta = clamp(sqrt((1.0 - xi.y) / (1.0 + (alpha * alpha - 1.0) * xi.y)), 0.0, 1.0);
    let sinTheta = sqrt(1.0 - cosTheta * cosTheta);
    let phi = 2.0 * M_PI * xi.x;
    var pdf = d_GGX(cosTheta, alpha);
    pdf /= 4.0;

    let localDirection = normalize(vec3f(
        sinTheta * cos(phi),
        sinTheta * sin(phi),
        cosTheta
    ));
    let direction = createTBN(N) * localDirection;

    return vec4f(direction, pdf);
}

fn D_Charlie(sheenRoughness_: f32, NdotH: f32) -> f32
{
    let sheenRoughness = max(sheenRoughness_, 0.000001); //clamp (0,1]
    let invR = 1.0 / sheenRoughness;
    let cos2h = NdotH * NdotH;
    let sin2h = 1.0 - cos2h;
    return (2.0 + invR) * pow(sin2h, invR * 0.5) / (2.0 * M_PI);
}

fn getImportanceSampleCharlie(sampleIndex: i32, N: vec3f, roughness: f32, materialSID: u32) -> vec4f
{
  let xi = hammersley2d(sampleIndex, get_sampleCount(materialSID, 0));

  let alpha = roughness * roughness;
  let sinTheta = pow(xi.y, alpha / (2.0*alpha + 1.0));
  let cosTheta = sqrt(1.0 - sinTheta * sinTheta);
  let phi = 2.0 * M_PI * xi.x;
  var pdf = D_Charlie(alpha, cosTheta);
  pdf /= 4.0;

  let localDirection = normalize(vec3f(
      sinTheta * cos(phi),
      sinTheta * sin(phi),
      cosTheta
  ));
  let direction = createTBN(N) * localDirection;

  return vec4f(direction, pdf);
}

// We learnd a lot from the following resources
// https://developer.nvidia.com/gpugems/gpugems3/part-iii-rendering/chapter-20-gpu-based-importance-sampling
// https://cgg.mff.cuni.cz/~jaroslav/papers/2007-sketch-fis/Final_sap_0073.pdf
// https://google.github.io/filament/Filament.html#annex/importancesamplingfortheibl/pre-filteredimportancesampling
fn computeLod(pdf: f32, width: u32, sampleCount: i32) -> f32
{
    // 6.0 is the number of faces of the cubemap
    // log4 = 0.5 * log2
    // We don't use the constant K in the filament document
    return 0.5 * log2( 6.0 * f32(width) * f32(width) / (f32(sampleCount) * pdf));
}

fn prefilter(N: vec3f, materialSID: u32) -> vec3f
{
    var color = vec3f(0.f);
    var weight = 0.0f;
    let sampleCount = get_sampleCount(materialSID, 0);

    let texSize: vec2<u32> = textureDimensions(baseColorTexture, 0);

    for(var i = 0; i < get_sampleCount(materialSID, 0); i++)
    {
        var importanceSample: vec4<f32>;

        let distributionType = get_distributionType(materialSID, 0);
        if(distributionType == cLambertian) {
            importanceSample = getImportanceSampleLambertian(i, N, get_roughness(materialSID, 0), materialSID);
        } else if(distributionType == cGGX) {
            importanceSample = getImportanceSampleGGX(i, N, get_roughness(materialSID, 0), materialSID);
        } else {
            importanceSample = getImportanceSampleCharlie(i, N, get_roughness(materialSID, 0), materialSID);
        }

        let H = vec3f(importanceSample.xyz);
        let pdf = importanceSample.w;
        let lod = computeLod(pdf, texSize.x, sampleCount);

        if(distributionType == cLambertian)
        {
            let lambertian = textureSampleLevel(baseColorTexture, baseColorSampler, H, lod).rgb;
            color += lambertian;
        }
        else if(distributionType == cGGX || distributionType == cCharlie)
        {
            let V = N;
            let L = normalize(reflect(-V, H));
            let NdotL = dot(N, L);

            if (NdotL > 0.0)
            {
                let sampleColor = textureSampleLevel(baseColorTexture, baseColorSampler, L, lod).rgb;
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
        color /= f32(sampleCount);
    }

    return color.rgb;
}

fn uvToDir(faceId: i32, uv: vec2f) -> vec3f
{
	if (faceId == 0) {
		return vec3f(1.f, uv.y, -uv.x);
  } else if(faceId == 1) {
		return vec3f(-1.f, uv.y, uv.x);
  } else if(faceId == 2) {
		return vec3f(uv.x, -1.f, uv.y);
  } else if(faceId == 3) {
		return vec3f(uv.x, 1.f, -uv.y);
  } else if(faceId == 4) {
		return vec3f(uv.x, uv.y, 1.f);
  } else {
    return vec3f(-uv.x, uv.y, -1.f);
  }
}

// learned a lot from https://github.com/KhronosGroup/glTF-Sample-Viewer
@fragment
fn main (
  input: VertexOutput,
) -> @location(0) vec4<f32> {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  let uv = input.texcoord_0 * 2.0 - 1.0;
  let scan = uvToDir(get_cubeMapFaceId(materialSID, 0), uv);
  var direction = normalize(scan);
  direction.y = -direction.y;

  let rt0 = vec4f(prefilter(direction, materialSID), 1.0);

  return rt0;
}
