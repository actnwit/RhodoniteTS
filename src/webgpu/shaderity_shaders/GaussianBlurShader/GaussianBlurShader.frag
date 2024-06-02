/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */

@group(1) @binding(0) var baseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(0) var baseColorSampler: sampler;

@fragment
fn main(
  input: VertexOutput,
  @builtin(frag_coord) fragCoord: vec4<f32>,
) -> @location(0) vec4<f32> {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  let offset = fragCoord.st;

  var framebufferSize: f32;
  var blurDirection: vec2<f32>;
  let isHorizontal: bool = get_isHorizontal(materialSID, 0);
  if (isHorizontal) {
    framebufferSize = get_framebufferSize(materialSID, 0).x;
    blurDirection = vec2f(1.0, 0.0);
  } else { // vertical
    framebufferSize = get_framebufferSize(materialSID, 0).y;
    blurDirection = vec2f(0.0, 1.0);
  }
	let tFrag = 1.0 / framebufferSize;

  var color = vec4f(0.0, 0.0, 0.0, 1.0);
  let gaussianKernelSize: i32 = get_gaussianKernelSize(materialSID, 0);
  let minStrideLength = - f32(gaussianKernelSize - 1) / 2.0;

  for (let i=0; i < gaussianKernelSize; i++) {

    let strideLength = minStrideLength + f32(i);
    let stride: vec2f = strideLength * blurDirection;

    let gaussianRatio = get_gaussianRatio(materialSID, 0)[i];
    color += vec4f(textureSample(baseColorTexture, baseColorSampler, (offset + stride) * tFrag).rgb, 1.0) * gaussianRatio;
  }

  return color;
}
