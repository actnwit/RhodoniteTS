// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/Step.glsl
var code = "void _step(in float value, in float edge, out float outValue) {\n  outValue = step(edge, value);\n}\nvoid _step(in vec2 value, in vec2 edge, out vec2 outValue) {\n  outValue = step(edge, value);\n}\nvoid _step(in vec3 value, in vec3 edge, out vec3 outValue) {\n  outValue = step(edge, value);\n}\nvoid _step(in vec4 value, in vec4 edge, out vec4 outValue) {\n  outValue = step(edge, value);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var Step_default = { code, shaderStage, isFragmentShader };
export {
  code,
  Step_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvU3RlcC5nbHNsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJ2b2lkIF9zdGVwKGluIGZsb2F0IHZhbHVlLCBpbiBmbG9hdCBlZGdlLCBvdXQgZmxvYXQgb3V0VmFsdWUpIHtcXG4gIG91dFZhbHVlID0gc3RlcChlZGdlLCB2YWx1ZSk7XFxufVxcbnZvaWQgX3N0ZXAoaW4gdmVjMiB2YWx1ZSwgaW4gdmVjMiBlZGdlLCBvdXQgdmVjMiBvdXRWYWx1ZSkge1xcbiAgb3V0VmFsdWUgPSBzdGVwKGVkZ2UsIHZhbHVlKTtcXG59XFxudm9pZCBfc3RlcChpbiB2ZWMzIHZhbHVlLCBpbiB2ZWMzIGVkZ2UsIG91dCB2ZWMzIG91dFZhbHVlKSB7XFxuICBvdXRWYWx1ZSA9IHN0ZXAoZWRnZSwgdmFsdWUpO1xcbn1cXG52b2lkIF9zdGVwKGluIHZlYzQgdmFsdWUsIGluIHZlYzQgZWRnZSwgb3V0IHZlYzQgb3V0VmFsdWUpIHtcXG4gIG91dFZhbHVlID0gc3RlcChlZGdlLCB2YWx1ZSk7XFxufVxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUE4WSxrQkFBYztBQUFXLHVCQUFtQjtBQUFsYyxxQkFBQyxNQUFxWixhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==
