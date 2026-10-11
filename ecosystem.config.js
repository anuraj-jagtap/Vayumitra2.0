module.exports = {
  apps: [
    {
      name: 'vayumitra-backend',
      cwd: './backend',
      script: '../venv/bin/python',
      args: 'manage.py runserver 0.0.0.0:8000',
      autorestart: true,
      watch: false,
      env: {
        PYTHONUNBUFFERED: '1',
      },
    },
    {
      name: 'vayumitra-ml',
      cwd: './ml-api',
      script: '../venv/bin/python',
      args: '-m uvicorn api:app --host 0.0.0.0 --port 8001',
      autorestart: true,
      watch: false,
      env: {
        PYTHONUNBUFFERED: '1',
      },
    },
    {
      name: 'vayumitra-landing',
      cwd: './landing',
      script: 'npx',
      args: 'vite preview --host 0.0.0.0 --port 5173',
      autorestart: true,
      watch: false,
    },
    {
      name: 'vayumitra-citizen',
      cwd: './citizen',
      script: 'npx',
      args: 'vite preview --host 0.0.0.0 --port 5174',
      autorestart: true,
      watch: false,
    },
    {
      name: 'vayumitra-policymaker',
      cwd: './policymaker',
      script: 'npx',
      args: 'vite preview --host 0.0.0.0 --port 5175',
      autorestart: true,
      watch: false,
    },
  ],
};
