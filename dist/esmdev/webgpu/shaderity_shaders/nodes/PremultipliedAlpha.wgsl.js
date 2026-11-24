// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/PremultipliedAlpha.wgsl
var code = "\nfn _premultipliedAlphaVec4f(value: vec4<f32>, outValue: ptr<function, vec4<f32>>) {\n  *outValue = vec4<f32>(value.rgb * value.a, value.a);\n}\n\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var PremultipliedAlpha_default = { code, shaderStage, isFragmentShader };
export {
  code,
  PremultipliedAlpha_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL1ByZW11bHRpcGxpZWRBbHBoYS53Z3NsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJcXG5mbiBfcHJlbXVsdGlwbGllZEFscGhhVmVjNGYodmFsdWU6IHZlYzQ8ZjMyPiwgb3V0VmFsdWU6IHB0cjxmdW5jdGlvbiwgdmVjNDxmMzI+Pikge1xcbiAgKm91dFZhbHVlID0gdmVjNDxmMzI+KHZhbHVlLnJnYiAqIHZhbHVlLmEsIHZhbHVlLmEpO1xcbn1cXG5cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBdUosa0JBQWM7QUFBVyx1QkFBbUI7QUFBM00sbUNBQUMsTUFBOEosYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
