const Shaderity = require("shaderity-node")

module.exports = {
  process(src, filename, config, options) {
    const json = {};

    json.code = Shaderity.requireFile(src, filename);

    json.shaderStage = Shaderity.shaderStage(filename);

    return 'module.exports = ' + JSON.stringify(json) + ';';
  },
};
