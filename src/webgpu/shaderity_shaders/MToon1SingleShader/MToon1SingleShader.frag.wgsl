/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

const EPS_COL: f32 = 0.00001;

#pragma shaderity: require(../common/opticalDefinition.wgsl)

#pragma shaderity: require(../common/perturbedNormal.wgsl)

@fragment
fn main (
  input: VertexOutput,
  @builtin(front_facing) isFront: bool
) -> @location(0) vec4<f32> {
  var rt0 = vec4f(1.0, 0.0, 0.0, 1.0);

  return rt0;
}
