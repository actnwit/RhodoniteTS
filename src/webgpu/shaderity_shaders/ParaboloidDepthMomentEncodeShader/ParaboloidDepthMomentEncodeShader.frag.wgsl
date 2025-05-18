/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

// #param frontHemisphere: bool; // initialValue=true

@fragment
fn main(
  input: VertexOutput
) -> @location(0) vec4<f32> {
/* shaderity: @{mainPrerequisites} */

  let denom = input.color_0.w;
  if (denom < 0.0) {
    discard;
  }

  let depth = input.color_0.z;
  let dx = dpdx(depth);
  let dy = dpdy(depth);

  let frontHemisphere = get_frontHemisphere(materialSID, 0);
  var rt0: vec4<f32>;
  if (frontHemisphere) {
    rt0.r = depth; // M1
    rt0.g = sqF32(depth) + 0.25 * (sqF32(dx) + sqF32(dy)); // M2
    rt0.b = 1.0;
    rt0.a = 1.0;
  } else {
    rt0.r = 1.0;
    rt0.g = 1.0;
    rt0.b = depth; // M1
    rt0.a = sqF32(depth) + 0.25 * (sqF32(dx) + sqF32(dy)); // M2
  }

  return rt0;
}

