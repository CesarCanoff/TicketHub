const categoriaRepository = require('../repositories/categoriaRepository');

async function listar(req, res) {
  try {
    const categorias = await categoriaRepository.listarAtivas();
    return res.status(200).json(categorias);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao listar categorias.' });
  }
}

module.exports = { listar };
