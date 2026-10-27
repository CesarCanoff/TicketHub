const db = require('../config/db');

const categoriaRepository = {
  async listarAtivas() {
    const { rows } = await db.query(
      'SELECT id, nome FROM categoria_servico WHERE ativo = TRUE ORDER BY nome'
    );
    return rows;
  },

  async buscarPorId(id) {
    const { rows } = await db.query(
      'SELECT * FROM categoria_servico WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },
};

module.exports = categoriaRepository;
