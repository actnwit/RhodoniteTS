// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/raymarching/OpSmoothSubtraction.glsl
var code = "void opSmoothSubtraction(in float base, in float subtractor, in float smoothness, out float outValue) {\n  float k = max(smoothness, 0.0001);\n  float h = clamp(0.5 - 0.5 * (subtractor + base) / k, 0.0, 1.0);\n  outValue = mix(base, -subtractor, h) + k * h * (1.0 - h);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var OpSmoothSubtraction_default = { code, shaderStage, isFragmentShader };
export {
  code,
  OpSmoothSubtraction_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvcmF5bWFyY2hpbmcvT3BTbW9vdGhTdWJ0cmFjdGlvbi5nbHNsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJ2b2lkIG9wU21vb3RoU3VidHJhY3Rpb24oaW4gZmxvYXQgYmFzZSwgaW4gZmxvYXQgc3VidHJhY3RvciwgaW4gZmxvYXQgc21vb3RobmVzcywgb3V0IGZsb2F0IG91dFZhbHVlKSB7XFxuICBmbG9hdCBrID0gbWF4KHNtb290aG5lc3MsIDAuMDAwMSk7XFxuICBmbG9hdCBoID0gY2xhbXAoMC41IC0gMC41ICogKHN1YnRyYWN0b3IgKyBiYXNlKSAvIGssIDAuMCwgMS4wKTtcXG4gIG91dFZhbHVlID0gbWl4KGJhc2UsIC1zdWJ0cmFjdG9yLCBoKSArIGsgKiBoICogKDEuMCAtIGgpO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBcVIsa0JBQWM7QUFBVyx1QkFBbUI7QUFBelUsb0NBQUMsTUFBNFIsYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
