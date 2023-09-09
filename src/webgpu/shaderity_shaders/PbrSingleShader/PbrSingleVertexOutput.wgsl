struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) normal : vec3<f32>,
  @location(1) texcoord_0 : vec2<f32>,
  @location(2) color_0 : vec2<f32>,
}
