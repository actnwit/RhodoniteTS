var t=`/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

@fragment
fn main(
  input: VertexOutput
) -> @location(0) vec4<f32> {
/* shaderity: @{mainPrerequisites} */

  // position_inWorld and color_0 carry the clip space positions of this frame (without the jitter) and of
  // the previous frame (see MotionVectorShader.vert.wgsl).
  let currentPosition_inClip = input.position_inWorld;
  let previousPosition_inClip = input.color_0;

  // The motion from the previous frame in texture coordinates. In WebGPU, the v axis of the texture
  // coordinates points down while the NDC y axis points up.
  var velocity = vec2<f32>(2.0, 2.0); // moves the history lookup off screen, i.e. rejects the history
  if (previousPosition_inClip.w > 0.0) {
    let currentNdc = currentPosition_inClip.xy / currentPosition_inClip.w;
    let previousNdc = previousPosition_inClip.xy / previousPosition_inClip.w;
    velocity = (currentNdc - previousNdc) * vec2<f32>(0.5, -0.5);
  }

  // z: the depth, used to pick the motion vector of the closest surface around a pixel.
  return vec4<f32>(velocity, input.position.z, 1.0);
}
`,n="fragment",o=!0,r={code:t,shaderStage:n,isFragmentShader:o};export{t as code,r as default,o as isFragmentShader,n as shaderStage};
