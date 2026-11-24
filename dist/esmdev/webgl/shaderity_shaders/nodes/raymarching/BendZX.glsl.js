// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/raymarching/BendZX.glsl
var code = "void bendZX(in vec3 position, in float strength, out vec3 outPosition) {\n  float angle = strength * position.z;\n  float c = cos(angle);\n  float s = sin(angle);\n  outPosition = vec3(s * position.z + c * position.x, position.y, c * position.z - s * position.x);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var BendZX_default = { code, shaderStage, isFragmentShader };
export {
  code,
  BendZX_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvcmF5bWFyY2hpbmcvQmVuZFpYLmdsc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcInZvaWQgYmVuZFpYKGluIHZlYzMgcG9zaXRpb24sIGluIGZsb2F0IHN0cmVuZ3RoLCBvdXQgdmVjMyBvdXRQb3NpdGlvbikge1xcbiAgZmxvYXQgYW5nbGUgPSBzdHJlbmd0aCAqIHBvc2l0aW9uLno7XFxuICBmbG9hdCBjID0gY29zKGFuZ2xlKTtcXG4gIGZsb2F0IHMgPSBzaW4oYW5nbGUpO1xcbiAgb3V0UG9zaXRpb24gPSB2ZWMzKHMgKiBwb3NpdGlvbi56ICsgYyAqIHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIGMgKiBwb3NpdGlvbi56IC0gcyAqIHBvc2l0aW9uLngpO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBK1Esa0JBQWM7QUFBVyx1QkFBbUI7QUFBblUsdUJBQUMsTUFBc1IsYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
