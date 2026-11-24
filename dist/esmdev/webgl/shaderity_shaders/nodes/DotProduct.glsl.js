// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/DotProduct.glsl
var code = "\nvoid dotProduct(in vec2 lfs, in vec2 rhs, out float outValue) {\n  outValue = dot(lfs, rhs);\n}\nvoid dotProduct(in vec3 lfs, in vec3 rhs, out float outValue) {\n  outValue = dot(lfs, rhs);\n}\nvoid dotProduct(in vec4 lfs, in vec4 rhs, out float outValue) {\n  outValue = dot(lfs, rhs);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var DotProduct_default = { code, shaderStage, isFragmentShader };
export {
  code,
  DotProduct_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvRG90UHJvZHVjdC5nbHNsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJcXG52b2lkIGRvdFByb2R1Y3QoaW4gdmVjMiBsZnMsIGluIHZlYzIgcmhzLCBvdXQgZmxvYXQgb3V0VmFsdWUpIHtcXG4gIG91dFZhbHVlID0gZG90KGxmcywgcmhzKTtcXG59XFxudm9pZCBkb3RQcm9kdWN0KGluIHZlYzMgbGZzLCBpbiB2ZWMzIHJocywgb3V0IGZsb2F0IG91dFZhbHVlKSB7XFxuICBvdXRWYWx1ZSA9IGRvdChsZnMsIHJocyk7XFxufVxcbnZvaWQgZG90UHJvZHVjdChpbiB2ZWM0IGxmcywgaW4gdmVjNCByaHMsIG91dCBmbG9hdCBvdXRWYWx1ZSkge1xcbiAgb3V0VmFsdWUgPSBkb3QobGZzLCByaHMpO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBd1Msa0JBQWM7QUFBVyx1QkFBbUI7QUFBNVYsMkJBQUMsTUFBK1MsYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
