const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const loadOpenApiDocument = () => {
  const openApiPath = path.join(__dirname, "..", "..", "openapi.yaml");
  const raw = fs.readFileSync(openApiPath, "utf8");
  return yaml.load(raw);
};

module.exports = {
  loadOpenApiDocument,
};
