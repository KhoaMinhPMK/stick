module.exports = {
  apps: [
    {
      name: 'stick-api-prod',
      script: 'src/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3040,
      },
    },
  ],
};
