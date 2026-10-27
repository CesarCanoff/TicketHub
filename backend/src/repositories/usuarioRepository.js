const db = require('../config/db');

/**
 * Camada de acesso a dados da tabela "usuario".
 * Mantida separada dos services para que a regra de negócio
 * possa ser testada com um repository falso (mock), sem banco real.
 */
const usuarioRepository = {
  async buscarPorEmail(email) {
    const { rows } = await db.query(
      'SELECT * FROM usuario WHERE email = $1 AND ativo = TRUE',
      [email]
    );
    return rows[0] || null;
  },

  async buscarPorId(id) {
    const { rows } = await db.query(
      'SELECT * FROM usuario WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },
};

module.exports = usuarioRepository;
