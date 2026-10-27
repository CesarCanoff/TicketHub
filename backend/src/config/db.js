const { Pool } = require('pg');
require('dotenv').config();

// Pool de conexao com o PostgreSQL.
// Em testes unitarios este arquivo nao e usado: os repositories sao
// mockados nos testes de service, entao nao ha conexao real com o banco.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do PostgreSQL', err);
});

module.exports = pool;
