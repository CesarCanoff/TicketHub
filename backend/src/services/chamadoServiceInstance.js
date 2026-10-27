const { createChamadoService } = require('./chamadoService');
const chamadoRepository = require('../repositories/chamadoRepository');
const categoriaRepository = require('../repositories/categoriaRepository');

module.exports = createChamadoService({ chamadoRepository, categoriaRepository });
