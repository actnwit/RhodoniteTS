// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/raymarching/SdRepeatX.glsl
var code = "void sdRepeatX(in vec3 position, in float interval, out vec3 outPosition) {\n  outPosition.x = (fract(position.x / interval) - 0.5) * interval;\n  outPosition.yz = position.yz;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdRepeatX_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdRepeatX_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvcmF5bWFyY2hpbmcvU2RSZXBlYXRYLmdsc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcInZvaWQgc2RSZXBlYXRYKGluIHZlYzMgcG9zaXRpb24sIGluIGZsb2F0IGludGVydmFsLCBvdXQgdmVjMyBvdXRQb3NpdGlvbikge1xcbiAgb3V0UG9zaXRpb24ueCA9IChmcmFjdChwb3NpdGlvbi54IC8gaW50ZXJ2YWwpIC0gMC41KSAqIGludGVydmFsO1xcbiAgb3V0UG9zaXRpb24ueXogPSBwb3NpdGlvbi55ejtcXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQXdMLGtCQUFjO0FBQVcsdUJBQW1CO0FBQTVPLDBCQUFDLE1BQStMLGFBQXlCLGlCQUF1QjsiLAogICJuYW1lcyI6IFtdCn0K
