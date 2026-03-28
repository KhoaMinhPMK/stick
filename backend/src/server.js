const express = require('express');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const apiV1Routes = require('./routes/apiV1');

const app = express();
const port = Number(process.env.PORT || 3040);

const openApiPath = path.join(__dirname, '..', 'docs', 'openapi.yaml');
const openApiDocument = YAML.load(openApiPath);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'stick-api-prod',
    timestamp: new Date().toISOString(),
  });
});

app.get('/hello', (_req, res) => {
  res.status(200).json({
    message: 'Hello from STICK backend',
  });
});

app.get('/docs.json', (_req, res) => {
  res.status(200).json(openApiDocument);
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { explorer: true }));
app.use('/api/v1', apiV1Routes);

app.use((req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.listen(port, () => {
  console.log(`STICK backend listening on http://localhost:${port}`);
  console.log(`Swagger UI available at http://localhost:${port}/docs`);
});
