// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/SdTubeY.wgsl
var code = "fn sdTubeY(position: vec3f, width: f32, outDistance: ptr<function, f32>) {\n  *outDistance = length(position.xz) - width;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdTubeY_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdTubeY_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL1NkVHViZVkud2dzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiZm4gc2RUdWJlWShwb3NpdGlvbjogdmVjM2YsIHdpZHRoOiBmMzIsIG91dERpc3RhbmNlOiBwdHI8ZnVuY3Rpb24sIGYzMj4pIHtcXG4gICpvdXREaXN0YW5jZSA9IGxlbmd0aChwb3NpdGlvbi54eikgLSB3aWR0aDtcXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQWlJLGtCQUFjO0FBQVcsdUJBQW1CO0FBQXJMLHdCQUFDLE1BQXdJLGFBQXlCLGlCQUF1QjsiLAogICJuYW1lcyI6IFtdCn0K
