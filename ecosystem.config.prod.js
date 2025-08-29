module.exports = {
  apps: [{
    name: 'ventushub-prod',
    script: './dist/server/index.js',
    
    // Configuração de instâncias
    instances: 'max',  // Usar todos os cores disponíveis
    exec_mode: 'cluster',  // Modo cluster para alta disponibilidade
    
    // Variáveis de ambiente
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
    },
    
    // Configuração de logs
    error_file: '/var/log/pm2/ventushub-error.log',
    out_file: '/var/log/pm2/ventushub-out.log',
    log_file: '/var/log/pm2/ventushub-combined.log',
    time: true,
    
    // Configuração de restart
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G',
    
    // Watch (desabilitado em produção)
    watch: false,
    
    // Configuração de graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Auto restart em caso de crash
    autorestart: true,
    
    // Configuração de CPU e memória
    node_args: '--max-old-space-size=2048',
  }],

  deploy: {
    production: {
      user: 'deploy',
      host: 'SEU_IP_VPS',
      ref: 'origin/main',
      repo: 'git@github.com:seu-usuario/ventushub.git',
      path: '/var/www/app.ventushub.com.br',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.prod.js --env production',
      'pre-deploy': 'git pull',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};