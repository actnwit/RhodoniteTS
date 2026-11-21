fn raymarchHitPosition(outPosition: ptr<function, vec4f>) {
  *outPosition = vec4f(g_hitPosition, 1.0);
}
