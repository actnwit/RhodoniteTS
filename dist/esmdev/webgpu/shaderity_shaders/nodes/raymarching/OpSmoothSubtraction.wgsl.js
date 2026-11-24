// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/OpSmoothSubtraction.wgsl
var code = "fn opSmoothSubtraction(base: f32, subtractor: f32, smoothness: f32, outValue: ptr<function, f32>) {\n  let k = max(smoothness, 0.0001);\n  let h = clamp(0.5 - 0.5 * (subtractor + base) / k, 0.0, 1.0);\n  *outValue = mix(base, -subtractor, h) + k * h * (1.0 - h);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var OpSmoothSubtraction_default = { code, shaderStage, isFragmentShader };
export {
  code,
  OpSmoothSubtraction_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL09wU21vb3RoU3VidHJhY3Rpb24ud2dzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiZm4gb3BTbW9vdGhTdWJ0cmFjdGlvbihiYXNlOiBmMzIsIHN1YnRyYWN0b3I6IGYzMiwgc21vb3RobmVzczogZjMyLCBvdXRWYWx1ZTogcHRyPGZ1bmN0aW9uLCBmMzI+KSB7XFxuICBsZXQgayA9IG1heChzbW9vdGhuZXNzLCAwLjAwMDEpO1xcbiAgbGV0IGggPSBjbGFtcCgwLjUgLSAwLjUgKiAoc3VidHJhY3RvciArIGJhc2UpIC8gaywgMC4wLCAxLjApO1xcbiAgKm91dFZhbHVlID0gbWl4KGJhc2UsIC1zdWJ0cmFjdG9yLCBoKSArIGsgKiBoICogKDEuMCAtIGgpO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBOFEsa0JBQWM7QUFBVyx1QkFBbUI7QUFBbFUsb0NBQUMsTUFBcVIsYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
