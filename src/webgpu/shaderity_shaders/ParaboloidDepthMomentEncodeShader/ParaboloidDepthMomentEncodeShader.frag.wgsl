/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */

// #param frontHemisphere: bool; // initialValue=true

@fragment
fn main(
  input: VertexOutput
) -> @location(0) vec4<f32> {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  let denom = input.position_inWorld.w;
  if (denom < 0.0) {
    discard;
  }

  let depth = input.position_inWorld.z;
  let dx = dFdx(depth);
  let dy = dFdy(depth);

  let frontHemisphere = get_frontHemisphere(materialSID, 0);
  var rt0: vec4<f32>;
  if (frontHemisphere) {
    rt0.r = depth; // M1
    rt0.g = sq(depth) + 0.25 * (sq(dx) + sq(dy)); // M2
    rt0.b = 1.0;
    rt0.a = 1.0;
  } else {
    rt0.r = 1.0;
    rt0.g = 1.0;
    rt0.b = depth; // M1
    rt0.a = sq(depth) + 0.25 * (sq(dx) + sq(dy)); // M2
  }

  return rt0;
}

