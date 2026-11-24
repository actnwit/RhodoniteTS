// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/nodes/raymarching/BendXZ.wgsl
var code = "fn bendXZ(position: vec3f, strength: f32, outPosition: ptr<function, vec3f>) {\n  let angle = strength * position.x;\n  let c = cos(angle);\n  let s = sin(angle);\n  *outPosition = vec3f(c * position.x - s * position.z, position.y, s * position.x + c * position.z);\n}\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var BendXZ_default = { code, shaderStage, isFragmentShader };
export {
  code,
  BendXZ_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL25vZGVzL3JheW1hcmNoaW5nL0JlbmRYWi53Z3NsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJmbiBiZW5kWFoocG9zaXRpb246IHZlYzNmLCBzdHJlbmd0aDogZjMyLCBvdXRQb3NpdGlvbjogcHRyPGZ1bmN0aW9uLCB2ZWMzZj4pIHtcXG4gIGxldCBhbmdsZSA9IHN0cmVuZ3RoICogcG9zaXRpb24ueDtcXG4gIGxldCBjID0gY29zKGFuZ2xlKTtcXG4gIGxldCBzID0gc2luKGFuZ2xlKTtcXG4gICpvdXRQb3NpdGlvbiA9IHZlYzNmKGMgKiBwb3NpdGlvbi54IC0gcyAqIHBvc2l0aW9uLnosIHBvc2l0aW9uLnksIHMgKiBwb3NpdGlvbi54ICsgYyAqIHBvc2l0aW9uLnopO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBaVIsa0JBQWM7QUFBVyx1QkFBbUI7QUFBclUsdUJBQUMsTUFBd1IsYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
