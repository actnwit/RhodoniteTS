// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/common/fullscreen.wgsl
var code = "let x = f32((vertexIdx & 1u) << 2u);\nlet y = f32((vertexIdx & 2u) << 1u);\noutput.texcoord_0.x = x * 0.5;\noutput.texcoord_0.y = y * 0.5;\noutput.texcoord_0.y = 1.0 - output.texcoord_0.y;\noutput.position = vec4f(x - 1.0, y - 1.0, 0, 1);\n";
var shaderStage = "fragment";
var isFragmentShader = true;
var fullscreen_default = { code, shaderStage, isFragmentShader };
export {
  code,
  fullscreen_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL2NvbW1vbi9mdWxsc2NyZWVuLndnc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcImxldCB4ID0gZjMyKCh2ZXJ0ZXhJZHggJiAxdSkgPDwgMnUpO1xcbmxldCB5ID0gZjMyKCh2ZXJ0ZXhJZHggJiAydSkgPDwgMXUpO1xcbm91dHB1dC50ZXhjb29yZF8wLnggPSB4ICogMC41O1xcbm91dHB1dC50ZXhjb29yZF8wLnkgPSB5ICogMC41O1xcbm91dHB1dC50ZXhjb29yZF8wLnkgPSAxLjAgLSBvdXRwdXQudGV4Y29vcmRfMC55O1xcbm91dHB1dC5wb3NpdGlvbiA9IHZlYzRmKHggLSAxLjAsIHkgLSAxLjAsIDAsIDEpO1xcblwiLFwic2hhZGVyU3RhZ2VcIjpcImZyYWdtZW50XCIsXCJpc0ZyYWdtZW50U2hhZGVyXCI6dHJ1ZX0iXSwKICAibWFwcGluZ3MiOiAiO0FBQUMsV0FBTztBQUFtUCxrQkFBYztBQUFXLHVCQUFtQjtBQUF2UywyQkFBQyxNQUEwUCxhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==
