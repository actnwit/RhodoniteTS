// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/SdRepeatZ.wgsl
var code = "fn sdRepeatZ(position: vec3f, interval: f32, outPosition: ptr<function, vec3f>) {\n  *outPosition = vec3f(position.x, position.y, (fract(position.z / interval) - 0.5) * interval);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdRepeatZ_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdRepeatZ_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL1NkUmVwZWF0Wi53Z3NsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJmbiBzZFJlcGVhdFoocG9zaXRpb246IHZlYzNmLCBpbnRlcnZhbDogZjMyLCBvdXRQb3NpdGlvbjogcHRyPGZ1bmN0aW9uLCB2ZWMzZj4pIHtcXG4gICpvdXRQb3NpdGlvbiA9IHZlYzNmKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIChmcmFjdChwb3NpdGlvbi56IC8gaW50ZXJ2YWwpIC0gMC41KSAqIGludGVydmFsKTtcXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQTJMLGtCQUFjO0FBQVcsdUJBQW1CO0FBQS9PLDBCQUFDLE1BQWtNLGFBQXlCLGlCQUF1QjsiLAogICJuYW1lcyI6IFtdCn0K
