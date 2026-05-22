const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const { healthRouter } = require("./routes/healthRoutes");
const { userFeatureRouter } = require("./routes/userFeatureRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { loadOpenApiDocument } = require("./config/openapi");

const app = express();
const openApiDocument = loadOpenApiDocument();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/docs.json", (_req, res) => {
  res.status(200).json(openApiDocument);
});

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: "Microclimate User Backend API Docs",
    swaggerOptions: {
      displayRequestDuration: true,
      tryItOutEnabled: true,
    },
  })
);

app.use(healthRouter);
app.use(userFeatureRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = {
  app,
};
