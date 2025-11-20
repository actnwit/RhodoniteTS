/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

@fragment
fn main(
  input: VertexOutput,
) -> @location(0) vec4<f32> {
/* shaderity: @{mainPrerequisites} */

  let uvBase = input.texcoord_0;

  let framebufferSize: vec2f = get_framebufferSize(materialSID, 0);
  var blurDirection: vec2f;
  let isHorizontal: bool = get_isHorizontal(materialSID, 0);
  if (isHorizontal) {
    blurDirection = vec2f(1.0, 0.0);
  } else { // vertical
    blurDirection = vec2f(0.0, 1.0);
  }
	let tFrag: vec2f = 1.0 / framebufferSize;

  var color = vec4f(0.0, 0.0, 0.0, 0.0);
  let gaussianKernelSize: i32 = get_gaussianKernelSize(materialSID, 0);
  let minStrideLength = - f32(gaussianKernelSize - 1) / 2.0;

  for (var i=0u; i < u32(gaussianKernelSize); i++) {

    let strideLength = minStrideLength + f32(i);
    let stride: vec2f = strideLength * blurDirection;

    let gaussianRatio = get_gaussianRatio(materialSID, i);
    let uv = uvBase + stride * tFrag;
    // uv.y = 1.0 - uv.y;
    color += textureSampleLevel(baseColorTexture, baseColorSampler, uv, 0.0) * gaussianRatio;
  }

  return color;
}
