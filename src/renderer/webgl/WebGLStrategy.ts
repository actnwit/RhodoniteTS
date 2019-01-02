export default interface WebGLStrategy {
  setupGPUData(): void;
  attachGPUData(): void;
  setupShaderProgram(): void;
  attatchShaderProgram(): void;
}

