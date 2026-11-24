// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/common/packing.glsl
var code = "const vec4 bitEnc = vec4(1.,255.,65025.,16581375.);\nconst vec4 bitDec = 1./bitEnc;\n\nvec4 encodeFloatRGBA(float v) {\n  float val = v;\n  float r = mod(val, 255.0);\n  val -= r;\n  float g = mod(val, 65025.0);\n  val -= g;\n  float b = mod(val, 16581375.0);\n  return vec4(r/255.0, g/65025.0, b/16581375.0, 1.0);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var packing_default = { code, shaderStage, isFragmentShader };
export {
  code,
  packing_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvY29tbW9uL3BhY2tpbmcuZ2xzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiY29uc3QgdmVjNCBiaXRFbmMgPSB2ZWM0KDEuLDI1NS4sNjUwMjUuLDE2NTgxMzc1Lik7XFxuY29uc3QgdmVjNCBiaXREZWMgPSAxLi9iaXRFbmM7XFxuXFxudmVjNCBlbmNvZGVGbG9hdFJHQkEoZmxvYXQgdikge1xcbiAgZmxvYXQgdmFsID0gdjtcXG4gIGZsb2F0IHIgPSBtb2QodmFsLCAyNTUuMCk7XFxuICB2YWwgLT0gcjtcXG4gIGZsb2F0IGcgPSBtb2QodmFsLCA2NTAyNS4wKTtcXG4gIHZhbCAtPSBnO1xcbiAgZmxvYXQgYiA9IG1vZCh2YWwsIDE2NTgxMzc1LjApO1xcbiAgcmV0dXJuIHZlYzQoci8yNTUuMCwgZy82NTAyNS4wLCBiLzE2NTgxMzc1LjAsIDEuMCk7XFxufVxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUFrVSxrQkFBYztBQUFXLHVCQUFtQjtBQUF0WCx3QkFBQyxNQUF5VSxhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==
