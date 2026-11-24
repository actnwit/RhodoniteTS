// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/raymarching/SdCapsule.glsl
var code = "void sdCapsule(in vec3 position, in vec3 pointA, in vec3 pointB, in float radius, out float outDistance) {\n  vec3 pa = position - pointA;\n  vec3 ba = pointB - pointA;\n  float denominator = dot(ba, ba);\n  float h = denominator > 0.0 ? clamp(dot(pa, ba) / denominator, 0.0, 1.0) : 0.0;\n  outDistance = length(pa - ba * h) - radius;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdCapsule_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdCapsule_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvcmF5bWFyY2hpbmcvU2RDYXBzdWxlLmdsc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcInZvaWQgc2RDYXBzdWxlKGluIHZlYzMgcG9zaXRpb24sIGluIHZlYzMgcG9pbnRBLCBpbiB2ZWMzIHBvaW50QiwgaW4gZmxvYXQgcmFkaXVzLCBvdXQgZmxvYXQgb3V0RGlzdGFuY2UpIHtcXG4gIHZlYzMgcGEgPSBwb3NpdGlvbiAtIHBvaW50QTtcXG4gIHZlYzMgYmEgPSBwb2ludEIgLSBwb2ludEE7XFxuICBmbG9hdCBkZW5vbWluYXRvciA9IGRvdChiYSwgYmEpO1xcbiAgZmxvYXQgaCA9IGRlbm9taW5hdG9yID4gMC4wID8gY2xhbXAoZG90KHBhLCBiYSkgLyBkZW5vbWluYXRvciwgMC4wLCAxLjApIDogMC4wO1xcbiAgb3V0RGlzdGFuY2UgPSBsZW5ndGgocGEgLSBiYSAqIGgpIC0gcmFkaXVzO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBc1Ysa0JBQWM7QUFBVyx1QkFBbUI7QUFBMVksMEJBQUMsTUFBNlYsYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
