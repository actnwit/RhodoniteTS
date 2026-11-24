// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/SdCapsule.wgsl
var code = "fn sdCapsule(position: vec3f, pointA: vec3f, pointB: vec3f, radius: f32, outDistance: ptr<function, f32>) {\n  let pa = position - pointA;\n  let ba = pointB - pointA;\n  let denominator = dot(ba, ba);\n  var h = 0.0;\n  if (denominator > 0.0) {\n    h = clamp(dot(pa, ba) / denominator, 0.0, 1.0);\n  }\n  *outDistance = length(pa - ba * h) - radius;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdCapsule_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdCapsule_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL1NkQ2Fwc3VsZS53Z3NsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJmbiBzZENhcHN1bGUocG9zaXRpb246IHZlYzNmLCBwb2ludEE6IHZlYzNmLCBwb2ludEI6IHZlYzNmLCByYWRpdXM6IGYzMiwgb3V0RGlzdGFuY2U6IHB0cjxmdW5jdGlvbiwgZjMyPikge1xcbiAgbGV0IHBhID0gcG9zaXRpb24gLSBwb2ludEE7XFxuICBsZXQgYmEgPSBwb2ludEIgLSBwb2ludEE7XFxuICBsZXQgZGVub21pbmF0b3IgPSBkb3QoYmEsIGJhKTtcXG4gIHZhciBoID0gMC4wO1xcbiAgaWYgKGRlbm9taW5hdG9yID4gMC4wKSB7XFxuICAgIGggPSBjbGFtcChkb3QocGEsIGJhKSAvIGRlbm9taW5hdG9yLCAwLjAsIDEuMCk7XFxuICB9XFxuICAqb3V0RGlzdGFuY2UgPSBsZW5ndGgocGEgLSBiYSAqIGgpIC0gcmFkaXVzO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBdVcsa0JBQWM7QUFBVyx1QkFBbUI7QUFBM1osMEJBQUMsTUFBOFcsYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
