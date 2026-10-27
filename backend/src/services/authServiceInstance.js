const createAuthService = require('./authService');
const usuarioRepository = require('../repositories/usuarioRepository');

// Ponto único onde o service "real" é montado com o repository real.
// Nos testes, criamos o service manualmente com um repository mockado
// em vez de importar este arquivo.
module.exports = createAuthService({ usuarioRepository });
