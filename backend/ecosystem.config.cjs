module.exports = {
  apps: [
    {
      name: 'stick-backend',
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
