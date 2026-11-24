// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/SmoothStep.glsl
var code = "void _smoothstep(in float value, in float edge0, in float edge1, out float outValue) {\n  outValue = smoothstep(edge0, edge1, value);\n}\nvoid _smoothstep(in vec2 value, in vec2 edge0, in vec2 edge1, out vec2 outValue) {\n  outValue = smoothstep(edge0, edge1, value);\n}\nvoid _smoothstep(in vec3 value, in vec3 edge0, in vec3 edge1, out vec3 outValue) {\n  outValue = smoothstep(edge0, edge1, value);\n}\nvoid _smoothstep(in vec4 value, in vec4 edge0, in vec4 edge1, out vec4 outValue) {\n  outValue = smoothstep(edge0, edge1, value);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var SmoothStep_default = { code, shaderStage, isFragmentShader };
export {
  code,
  SmoothStep_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvU21vb3RoU3RlcC5nbHNsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJ2b2lkIF9zbW9vdGhzdGVwKGluIGZsb2F0IHZhbHVlLCBpbiBmbG9hdCBlZGdlMCwgaW4gZmxvYXQgZWRnZTEsIG91dCBmbG9hdCBvdXRWYWx1ZSkge1xcbiAgb3V0VmFsdWUgPSBzbW9vdGhzdGVwKGVkZ2UwLCBlZGdlMSwgdmFsdWUpO1xcbn1cXG52b2lkIF9zbW9vdGhzdGVwKGluIHZlYzIgdmFsdWUsIGluIHZlYzIgZWRnZTAsIGluIHZlYzIgZWRnZTEsIG91dCB2ZWMyIG91dFZhbHVlKSB7XFxuICBvdXRWYWx1ZSA9IHNtb290aHN0ZXAoZWRnZTAsIGVkZ2UxLCB2YWx1ZSk7XFxufVxcbnZvaWQgX3Ntb290aHN0ZXAoaW4gdmVjMyB2YWx1ZSwgaW4gdmVjMyBlZGdlMCwgaW4gdmVjMyBlZGdlMSwgb3V0IHZlYzMgb3V0VmFsdWUpIHtcXG4gIG91dFZhbHVlID0gc21vb3Roc3RlcChlZGdlMCwgZWRnZTEsIHZhbHVlKTtcXG59XFxudm9pZCBfc21vb3Roc3RlcChpbiB2ZWM0IHZhbHVlLCBpbiB2ZWM0IGVkZ2UwLCBpbiB2ZWM0IGVkZ2UxLCBvdXQgdmVjNCBvdXRWYWx1ZSkge1xcbiAgb3V0VmFsdWUgPSBzbW9vdGhzdGVwKGVkZ2UwLCBlZGdlMSwgdmFsdWUpO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBK2hCLGtCQUFjO0FBQVcsdUJBQW1CO0FBQW5sQiwyQkFBQyxNQUFzaUIsYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
