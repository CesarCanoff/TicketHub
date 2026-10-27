const db = require('../config/db');

const SELECT_BASE = `
  SELECT
    c.id, c.titulo, c.descricao, c.status,
    c.criado_em, c.atualizado_em,
    c.categoria_id, cat.nome AS categoria_nome,
    c.cliente_id, cli.nome AS cliente_nome,
    c.tecnico_id, tec.nome AS tecnico_nome
  FROM chamado c
  JOIN categoria_servico cat ON cat.id = c.categoria_id
  JOIN usuario cli ON cli.id = c.cliente_id
  LEFT JOIN usuario tec ON tec.id = c.tecnico_id
`;

const chamadoRepository = {
  async criar({ titulo, descricao, categoriaId, clienteId }) {
    const { rows } = await db.query(
      `INSERT INTO chamado (titulo, descricao, categoria_id, cliente_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [titulo, descricao, categoriaId, clienteId]
    );
    return this.buscarPorId(rows[0].id);
  },

  async buscarPorId(id) {
    const { rows } = await db.query(`${SELECT_BASE} WHERE c.id = $1`, [id]);
    return rows[0] || null;
  },

  async listarPorCliente(clienteId) {
    const { rows } = await db.query(
      `${SELECT_BASE} WHERE c.cliente_id = $1 ORDER BY c.atualizado_em DESC`,
      [clienteId]
    );
    return rows;
  },

  async listarParaTecnico() {
    // Tecnico ve chamados ainda nao atribuidos ou atribuidos a ele mesmo.
    const { rows } = await db.query(
      `${SELECT_BASE} WHERE c.status != 'FECHADO' ORDER BY c.criado_em ASC`
    );
    return rows;
  },

  async atualizarStatus(id, status) {
    await db.query('UPDATE chamado SET status = $1 WHERE id = $2', [status, id]);
    return this.buscarPorId(id);
  },

  async atribuirTecnico(id, tecnicoId) {
    await db.query(
      `UPDATE chamado SET tecnico_id = $1, status = 'EM_ATENDIMENTO' WHERE id = $2`,
      [tecnicoId, id]
    );
    return this.buscarPorId(id);
  },
};

module.exports = chamadoRepository;
