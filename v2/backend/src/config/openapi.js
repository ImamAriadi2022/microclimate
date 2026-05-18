const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const openApiPath = path.resolve(__dirname, "../../openapi.yaml");

const loadOpenApiDocument = () => {
  const fileContent = fs.readFileSync(openApiPath, "utf8");
  return yaml.load(fileContent);
};

module.exports = {
  loadOpenApiDocument,
};
