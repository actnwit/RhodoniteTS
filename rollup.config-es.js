import typescript from 'rollup-plugin-typescript2';
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
  input: 'src/main.ts',

  plugins: [
    nodeResolve({ jsnext: true }),
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          target: "ES2015",
          module: "es2015",
          moduleResolution: "node",
        }
      }
    })
  ],
  
  output: {
    file: 'dist/rhodonite.mjs',
    format: 'es',
    name: 'rhodonite'
  }

}