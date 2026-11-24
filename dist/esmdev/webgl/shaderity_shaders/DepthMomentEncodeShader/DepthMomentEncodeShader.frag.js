// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/DepthMomentEncodeShader/DepthMomentEncodeShader.frag
var code = "\n\n/* shaderity: @{glslPrecision} */\n\n/* shaderity: @{definitions} */\n\n/* shaderity: @{prerequisites} */\n\n/* shaderity: @{vertexIn} */\n\n/* shaderity: @{renderTargetBegin} */\n\n/* shaderity: @{getters} */\n\n\nvoid main (){\n\n/* shaderity: @{mainPrerequisites} */\n\n  float depth = gl_FragCoord.z;\n  float dx = dFdx(depth);\n  float dy = dFdy(depth);\n\n  rt0.x = depth; // M1\n  rt0.y = sq(depth) + 0.25 * (sq(dx) + sq(dy)); // M2\n  rt0.z = 0.0;\n  rt0.w = 1.0;\n\n\n}\n\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var DepthMomentEncodeShader_default = { code, shaderStage, isFragmentShader };
export {
  code,
  DepthMomentEncodeShader_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvRGVwdGhNb21lbnRFbmNvZGVTaGFkZXIvRGVwdGhNb21lbnRFbmNvZGVTaGFkZXIuZnJhZyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiXFxuXFxuLyogc2hhZGVyaXR5OiBAe2dsc2xQcmVjaXNpb259ICovXFxuXFxuLyogc2hhZGVyaXR5OiBAe2RlZmluaXRpb25zfSAqL1xcblxcbi8qIHNoYWRlcml0eTogQHtwcmVyZXF1aXNpdGVzfSAqL1xcblxcbi8qIHNoYWRlcml0eTogQHt2ZXJ0ZXhJbn0gKi9cXG5cXG4vKiBzaGFkZXJpdHk6IEB7cmVuZGVyVGFyZ2V0QmVnaW59ICovXFxuXFxuLyogc2hhZGVyaXR5OiBAe2dldHRlcnN9ICovXFxuXFxuXFxudm9pZCBtYWluICgpe1xcblxcbi8qIHNoYWRlcml0eTogQHttYWluUHJlcmVxdWlzaXRlc30gKi9cXG5cXG4gIGZsb2F0IGRlcHRoID0gZ2xfRnJhZ0Nvb3JkLno7XFxuICBmbG9hdCBkeCA9IGRGZHgoZGVwdGgpO1xcbiAgZmxvYXQgZHkgPSBkRmR5KGRlcHRoKTtcXG5cXG4gIHJ0MC54ID0gZGVwdGg7IC8vIE0xXFxuICBydDAueSA9IHNxKGRlcHRoKSArIDAuMjUgKiAoc3EoZHgpICsgc3EoZHkpKTsgLy8gTTJcXG4gIHJ0MC56ID0gMC4wO1xcbiAgcnQwLncgPSAxLjA7XFxuXFxuXFxufVxcblxcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUF5ZSxrQkFBYztBQUFXLHVCQUFtQjtBQUE3aEIsd0NBQUMsTUFBZ2YsYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
