struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) position_inWorld : vec3<f32>,
  @location(1) normal_inWorld : vec3<f32>,
  @location(2) texcoord_0 : vec2<f32>,
  @location(3) color_0 : vec2<f32>,
  @location(4) texcoord_1 : vec2<f32>,
  @location(5) texcoord_2 : vec2<f32>,
}
