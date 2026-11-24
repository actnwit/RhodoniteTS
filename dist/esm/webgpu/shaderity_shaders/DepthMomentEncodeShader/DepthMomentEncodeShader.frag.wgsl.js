var n=`/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

@fragment
fn main(
  input: VertexOutput
) -> @location(0) vec4<f32> {
/* shaderity: @{mainPrerequisites} */

  let depth = input.position.z;
  let dx = dpdx(depth);
  let dy = dpdy(depth);

  var rt0: vec4<f32>;
  rt0.x = depth; // M1
  rt0.y = sqF32(depth) + 0.25 * (sqF32(dx) + sqF32(dy)); // M2
  rt0.z = 0.0;
  rt0.w = 1.0;

  return rt0;
}
`,r="fragment",d=!0,i={code:n,shaderStage:r,isFragmentShader:d};export{n as code,i as default,d as isFragmentShader,r as shaderStage};
