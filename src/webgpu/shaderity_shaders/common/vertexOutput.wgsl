struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) position_inWorld : vec4<f32>,
  @location(1) normal_inWorld : vec3<f32>,
  @location(2) texcoord_0 : vec2<f32>,
  @location(3) color_0 : vec4<f32>,
  @location(4) texcoord_1 : vec2<f32>,
  @location(5) texcoord_2 : vec2<f32>,
  @location(6) tangent_inWorld : vec3<f32>,
  @location(7) binormal_inWorld : vec3<f32>,
  @location(8) baryCentricCoord: vec3<f32>,
  @location(9) @interpolate(flat) instanceIds: vec4<u32>,
  @location(10) normal_inView : vec3<f32>,
}
