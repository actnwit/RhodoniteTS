// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/SdRepeatZX.wgsl
var code = "fn sdRepeatZX(position: vec3f, interval: f32, outPosition: ptr<function, vec3f>) {\n  *outPosition = vec3f((fract(position.x / interval) - 0.5) * interval, position.y, (fract(position.z / interval) - 0.5) * interval);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdRepeatZX_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdRepeatZX_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL1NkUmVwZWF0Wlgud2dzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiZm4gc2RSZXBlYXRaWChwb3NpdGlvbjogdmVjM2YsIGludGVydmFsOiBmMzIsIG91dFBvc2l0aW9uOiBwdHI8ZnVuY3Rpb24sIHZlYzNmPikge1xcbiAgKm91dFBvc2l0aW9uID0gdmVjM2YoKGZyYWN0KHBvc2l0aW9uLnggLyBpbnRlcnZhbCkgLSAwLjUpICogaW50ZXJ2YWwsIHBvc2l0aW9uLnksIChmcmFjdChwb3NpdGlvbi56IC8gaW50ZXJ2YWwpIC0gMC41KSAqIGludGVydmFsKTtcXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQWlPLGtCQUFjO0FBQVcsdUJBQW1CO0FBQXJSLDJCQUFDLE1BQXdPLGFBQXlCLGlCQUF1QjsiLAogICJuYW1lcyI6IFtdCn0K
