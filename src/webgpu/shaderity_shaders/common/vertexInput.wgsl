#ifdef RN_USE_INSTANCE
  @location(8) instance_ids: vec4<u32>,
#endif


#ifdef RN_USE_POSITION_FLOAT
  @location(0) position: vec4<f32>,
#endif
#ifdef RN_USE_POSITION_INT
  @location(0) position: vec4<i32>,
#endif
#ifdef RN_USE_POSITION_UINT
  @location(0) position: vec4<u32>,
#endif

#ifdef RN_USE_NORMAL
  @location(1) normal: vec3<f32>,
#endif
#ifdef RN_USE_TANGENT
  @location(2) tangent: vec4<f32>,
#endif
#ifdef RN_USE_TEXCOORD_0
  @location(3) texcoord_0: vec2<f32>,
#endif
#ifdef RN_USE_TEXCOORD_1
  @location(4) texcoord_1: vec2<f32>,
#endif

#ifdef RN_USE_COLOR_0_FLOAT
  @location(5) color_0: vec4<f32>,
#endif
#ifdef RN_USE_COLOR_0_INT
  @location(5) color_0: vec4<i32>,
#endif
#ifdef RN_USE_COLOR_0_UINT
  @location(5) color_0: vec4<u32>,
#endif

#ifdef RN_USE_JOINTS_0
  @location(6) joints_0: vec4<u32>,
#endif
#ifdef RN_USE_WEIGHTS_0
  @location(7) weights_0: vec4<f32>,
#endif
#ifdef RN_USE_BARY_CENTRIC_COORD
  @location(10) baryCentricCoord: vec4<f32>,
#endif
#ifdef RN_USE_TEXCOORD_2
  @location(11) texcoord_2: vec2<f32>,
#endif
  @builtin(vertex_index) vertexIdx : u32,

