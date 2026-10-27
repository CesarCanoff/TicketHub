const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

/**
 * Recebe o repository por injeção (parâmetro do factory) para que os
 * testes unitários possam passar um repository falso, sem tocar no banco.
 */
function createAuthService({ usuarioRepository, bcryptLib = bcrypt, jwtLib = jwt } = {}) {
  return {
    async login(email, senha) {
      if (!email || !senha) {
        throw new AppError('Informe e-mail e senha.', 400);
      }

      const usuario = await usuarioRepository.buscarPorEmail(email);
      if (!usuario) {
        throw new AppError('Credenciais inválidas.', 401);
      }

      const senhaValida = await bcryptLib.compare(senha, usuario.senha_hash);
      if (!senhaValida) {
        throw new AppError('Credenciais inválidas.', 401);
      }

      const token = jwtLib.sign(
        { id: usuario.id, tipo: usuario.tipo },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );

      return {
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          tipo: usuario.tipo,
        },
      };
    },
  };
}

module.exports = createAuthService;
