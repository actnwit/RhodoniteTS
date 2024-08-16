/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */

@group(1) @binding(0) var baseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(0) var baseColorSampler: sampler;

// #param cubeMapFaceId: i32; // initialValue=0

fn dirToPanoramaUV(dir: vec3f) -> vec2f
{
	return vec2f(
		0.5f + 0.5f * atan2(dir.z, dir.x) / M_PI,
		1.f - acos(dir.y) / M_PI);
}

fn uvToDirection(faceId: i32, uv: vec2f) -> vec3f
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

	let uv: vec2f = input.texcoord_0 * 2.0 - 1.0;
	let direction: vec3f = normalize(uvToDirection(get_cubeMapFaceId(materialSID, 0), uv));
  let panoramaUv: vec2f = dirToPanoramaUV(direction);
	let rt0: vec4f = vec4f(textureSample(baseColorTexture, baseColorSampler, panoramaUv).rgb, 1.0);

  return rt0;
}
