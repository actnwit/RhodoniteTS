// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/SdRoundBox.wgsl
var code = "fn sdRoundBox(position: vec3f, size: vec3f, radius: f32, outDistance: ptr<function, f32>) {\n  let q = abs(position) - size;\n  *outDistance = length(max(q, vec3f(0.0))) - radius;\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SdRoundBox_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SdRoundBox_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL1NkUm91bmRCb3gud2dzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiZm4gc2RSb3VuZEJveChwb3NpdGlvbjogdmVjM2YsIHNpemU6IHZlYzNmLCByYWRpdXM6IGYzMiwgb3V0RGlzdGFuY2U6IHB0cjxmdW5jdGlvbiwgZjMyPikge1xcbiAgbGV0IHEgPSBhYnMocG9zaXRpb24pIC0gc2l6ZTtcXG4gICpvdXREaXN0YW5jZSA9IGxlbmd0aChtYXgocSwgdmVjM2YoMC4wKSkpIC0gcmFkaXVzO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBMkwsa0JBQWM7QUFBVyx1QkFBbUI7QUFBL08sMkJBQUMsTUFBa00sYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
