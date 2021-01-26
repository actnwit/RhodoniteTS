const exec = require('child_process').exec;
const sampleList = require('./samples/typescript-samples.json');


function build(sampleDir){
  for (let sampleName of sampleList[sampleDir]) {
    exec(`npx tsc ./samples/${sampleDir}/${sampleName}/main.ts --lib es2017,dom --target es2017 --module umd --moduleResolution node --sourceMap`, (err, stdout, stderr) => {
      if (err) { console.log(err); }
      console.log(stdout);
    });
  }
}

build('simple');
build('test_e2e');

