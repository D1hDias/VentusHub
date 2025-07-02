module.exports = {
  apps: [{
    name: 'ventushub',
    script: 'dist/index.js',
    cwd: '/var/www/ventushub.com.br',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/ventushub-error.log',
    out_file: '/var/log/pm2/ventushub-out.log',
    log_file: '/var/log/pm2/ventushub.log',
    time: true
  }]
};