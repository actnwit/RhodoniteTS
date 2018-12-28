import typescript from 'rollup-plugin-typescript2';
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
  input: 'src/main.ts',

  plugins: [
    nodeResolve({ jsnext: true }),
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          module: "es2015",
          moduleResolution: "node",
        }
      }
    })
  ],
  
  output: {
    file: 'dist/rhodonite.js',
    format: 'umd',//'es',
    name: 'rhodonite'
  }

}