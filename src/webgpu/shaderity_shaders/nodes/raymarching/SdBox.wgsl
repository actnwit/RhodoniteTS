fn sdBox(position: vec3f, size: vec3f, outDistance: ptr<function, f32>) {
  vec3 q=abs(position)-size;
  *outDistance = length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);
}
