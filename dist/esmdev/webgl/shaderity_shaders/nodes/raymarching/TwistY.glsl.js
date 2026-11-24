// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/nodes/raymarching/TwistY.glsl
var code = "void twistY(in vec3 position, in float strength, out vec3 outPosition) {\n  float angle = strength * position.y;\n  float c = cos(angle);\n  float s = sin(angle);\n  outPosition = vec3(c * position.x - s * position.z, position.y, s * position.x + c * position.z);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var TwistY_default = { code, shaderStage, isFragmentShader };
export {
  code,
  TwistY_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvbm9kZXMvcmF5bWFyY2hpbmcvVHdpc3RZLmdsc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcInZvaWQgdHdpc3RZKGluIHZlYzMgcG9zaXRpb24sIGluIGZsb2F0IHN0cmVuZ3RoLCBvdXQgdmVjMyBvdXRQb3NpdGlvbikge1xcbiAgZmxvYXQgYW5nbGUgPSBzdHJlbmd0aCAqIHBvc2l0aW9uLnk7XFxuICBmbG9hdCBjID0gY29zKGFuZ2xlKTtcXG4gIGZsb2F0IHMgPSBzaW4oYW5nbGUpO1xcbiAgb3V0UG9zaXRpb24gPSB2ZWMzKGMgKiBwb3NpdGlvbi54IC0gcyAqIHBvc2l0aW9uLnosIHBvc2l0aW9uLnksIHMgKiBwb3NpdGlvbi54ICsgYyAqIHBvc2l0aW9uLnopO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBK1Esa0JBQWM7QUFBVyx1QkFBbUI7QUFBblUsdUJBQUMsTUFBc1IsYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
