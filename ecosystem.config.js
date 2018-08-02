module.exports = {
  apps : [
    {
      name      : 'API',
      script    : 'pm2 start index.js',
      env: {
        COMMON_VARIABLE: 'true'
      },
      env_production : {
        NODE_ENV: 'production'
      }
    }
  ],
  deploy : {
    production : {
      user : 'root',
      host : '144.202.40.32',
      ref  : 'origin/master',
      repo : 'git@github.com:kienphan/eatat.git',
      path : '/root/eatat-msgbot',
      'post-deploy' : 'nvm use --lts && npm install && pm2 reload ecosystem.config.js --env production && pm2 restart all'
    },
    // dev : {
    //   user : 'node',
    //   host : '212.83.163.1',
    //   ref  : 'origin/master',
    //   repo : 'git@github.com:repo.git',
    //   path : '/var/www/development',
    //   'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env dev',
    //   env  : {
    //     NODE_ENV: 'dev'
    //   }
    // }
  }
};
