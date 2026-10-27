const createAuthService = require('../../src/services/authService');

function criarMocks() {
  const usuarioRepository = { buscarPorEmail: jest.fn() };
  const bcryptLib = { compare: jest.fn() };
  const jwtLib = { sign: jest.fn(() => 'token-falso') };
  return { usuarioRepository, bcryptLib, jwtLib };
}

const USUARIO = {
  id: 1,
  nome: 'Carlos Silva',
  email: 'carlos.silva@test.com',
  senha_hash: 'hash-qualquer',
  tipo: 'TECNICO',
};

describe('authService.login', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'segredo-de-teste';
  });

  test('autentica com credenciais válidas e retorna token', async () => {
    const { usuarioRepository, bcryptLib, jwtLib } = criarMocks();
    usuarioRepository.buscarPorEmail.mockResolvedValue(USUARIO);
    bcryptLib.compare.mockResolvedValue(true);

    const service = createAuthService({ usuarioRepository, bcryptLib, jwtLib });
    const resultado = await service.login('carlos.silva@test.com', '123456');

    expect(resultado.token).toBe('token-falso');
    expect(resultado.usuario.email).toBe(USUARIO.email);
    expect(resultado.usuario.senha_hash).toBeUndefined(); // nunca vaza o hash
  });

  test('rejeita e-mail inexistente', async () => {
    const { usuarioRepository, bcryptLib, jwtLib } = criarMocks();
    usuarioRepository.buscarPorEmail.mockResolvedValue(null);

    const service = createAuthService({ usuarioRepository, bcryptLib, jwtLib });

    await expect(service.login('nao-existe@test.com', '123456')).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  test('rejeita senha incorreta', async () => {
    const { usuarioRepository, bcryptLib, jwtLib } = criarMocks();
    usuarioRepository.buscarPorEmail.mockResolvedValue(USUARIO);
    bcryptLib.compare.mockResolvedValue(false);

    const service = createAuthService({ usuarioRepository, bcryptLib, jwtLib });

    await expect(service.login('carlos.silva@test.com', 'errada')).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  test('rejeita quando e-mail ou senha não são informados', async () => {
    const { usuarioRepository, bcryptLib, jwtLib } = criarMocks();
    const service = createAuthService({ usuarioRepository, bcryptLib, jwtLib });

    await expect(service.login('', '')).rejects.toMatchObject({ statusCode: 400 });
    expect(usuarioRepository.buscarPorEmail).not.toHaveBeenCalled();
  });
});
