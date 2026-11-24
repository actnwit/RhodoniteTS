// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/RaymarchTBN.wgsl
var code = "fn raymarchTBN(outValue: ptr<function, mat3x3<f32>>) {\n  let viewVector = get_viewPosition(uniformDrawParameters.cameraSID) - g_hitPosition;\n  *outValue = getTBN(g_hitNormal, vec3f(1.0, 0.0, 0.0), vec3f(0.0, 1.0, 0.0), viewVector, vec2f(0.0));\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var RaymarchTBN_default = { code, shaderStage, isFragmentShader };
export {
  code,
  RaymarchTBN_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL1JheW1hcmNoVEJOLndnc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcImZuIHJheW1hcmNoVEJOKG91dFZhbHVlOiBwdHI8ZnVuY3Rpb24sIG1hdDN4MzxmMzI+Pikge1xcbiAgbGV0IHZpZXdWZWN0b3IgPSBnZXRfdmlld1Bvc2l0aW9uKHVuaWZvcm1EcmF3UGFyYW1ldGVycy5jYW1lcmFTSUQpIC0gZ19oaXRQb3NpdGlvbjtcXG4gICpvdXRWYWx1ZSA9IGdldFRCTihnX2hpdE5vcm1hbCwgdmVjM2YoMS4wLCAwLjAsIDAuMCksIHZlYzNmKDAuMCwgMS4wLCAwLjApLCB2aWV3VmVjdG9yLCB2ZWMyZigwLjApKTtcXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQTZQLGtCQUFjO0FBQVcsdUJBQW1CO0FBQWpULDRCQUFDLE1BQW9RLGFBQXlCLGlCQUF1QjsiLAogICJuYW1lcyI6IFtdCn0K
