const { createChamadoService, STATUS } = require('../../src/services/chamadoService');

// Repositories falsos (mocks) — os testes não tocam no PostgreSQL.
function criarMocks() {
  const chamadoRepository = {
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listarPorCliente: jest.fn(),
    listarParaTecnico: jest.fn(),
    atualizarStatus: jest.fn(),
    atribuirTecnico: jest.fn(),
  };
  const categoriaRepository = {
    buscarPorId: jest.fn(),
  };
  return { chamadoRepository, categoriaRepository };
}

const CLIENTE = { id: 1, tipo: 'CLIENTE' };
const OUTRO_CLIENTE = { id: 2, tipo: 'CLIENTE' };
const TECNICO = { id: 10, tipo: 'TECNICO' };
const OUTRO_TECNICO = { id: 11, tipo: 'TECNICO' };

describe('chamadoService.criar', () => {
  test('cliente consegue abrir um chamado com dados válidos', async () => {
    const { chamadoRepository, categoriaRepository } = criarMocks();
    categoriaRepository.buscarPorId.mockResolvedValue({ id: 1, ativo: true });
    chamadoRepository.criar.mockResolvedValue({ id: 99, status: STATUS.ABERTO });

    const service = createChamadoService({ chamadoRepository, categoriaRepository });

    const resultado = await service.criar(
      { titulo: 'Rede lenta', descricao: 'Internet caindo direto', categoriaId: 1 },
      CLIENTE
    );

    expect(resultado.status).toBe(STATUS.ABERTO);
    expect(chamadoRepository.criar).toHaveBeenCalledWith({
      titulo: 'Rede lenta',
      descricao: 'Internet caindo direto',
      categoriaId: 1,
      clienteId: CLIENTE.id,
    });
  });

  test('técnico não pode abrir chamado', async () => {
    const { chamadoRepository, categoriaRepository } = criarMocks();
    const service = createChamadoService({ chamadoRepository, categoriaRepository });

    await expect(
      service.criar({ titulo: 'x', descricao: 'y', categoriaId: 1 }, TECNICO)
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(chamadoRepository.criar).not.toHaveBeenCalled();
  });

  test('rejeita chamado sem título', async () => {
    const { chamadoRepository, categoriaRepository } = criarMocks();
    const service = createChamadoService({ chamadoRepository, categoriaRepository });

    await expect(
      service.criar({ titulo: '   ', descricao: 'algo', categoriaId: 1 }, CLIENTE)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('rejeita categoria inexistente ou inativa', async () => {
    const { chamadoRepository, categoriaRepository } = criarMocks();
    categoriaRepository.buscarPorId.mockResolvedValue(null);
    const service = createChamadoService({ chamadoRepository, categoriaRepository });

    await expect(
      service.criar({ titulo: 'x', descricao: 'y', categoriaId: 999 }, CLIENTE)
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('chamadoService.listar', () => {
  test('cliente vê apenas os próprios chamados', async () => {
    const { chamadoRepository, categoriaRepository } = criarMocks();
    chamadoRepository.listarPorCliente.mockResolvedValue([{ id: 1 }]);
    const service = createChamadoService({ chamadoRepository, categoriaRepository });

    await service.listar(CLIENTE);

    expect(chamadoRepository.listarPorCliente).toHaveBeenCalledWith(CLIENTE.id);
    expect(chamadoRepository.listarParaTecnico).not.toHaveBeenCalled();
  });

  test('técnico vê a fila de chamados disponíveis', async () => {
    const { chamadoRepository, categoriaRepository } = criarMocks();
    chamadoRepository.listarParaTecnico.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const service = createChamadoService({ chamadoRepository, categoriaRepository });

    await service.listar(TECNICO);

    expect(chamadoRepository.listarParaTecnico).toHaveBeenCalled();
    expect(chamadoRepository.listarPorCliente).not.toHaveBeenCalled();
  });
});

describe('chamadoService.buscarDetalhes', () => {
  test('cliente não pode ver chamado de outro cliente', async () => {
    const { chamadoRepository, categoriaRepository } = criarMocks();
    chamadoRepository.buscarPorId.mockResolvedValue({ id: 1, cliente_id: OUTRO_CLIENTE.id });
    const service = createChamadoService({ chamadoRepository, categoriaRepository });

    await expect(service.buscarDetalhes(1, CLIENTE)).rejects.toMatchObject({ statusCode: 403 });
  });

  test('lança 404 quando o chamado não existe', async () => {
    const { chamadoRepository, categoriaRepository } = criarMocks();
    chamadoRepository.buscarPorId.mockResolvedValue(null);
    const service = createChamadoService({ chamadoRepository, categoriaRepository });

    await expect(service.buscarDetalhes(1, CLIENTE)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('chamadoService.assumir', () => {
  test('técnico assume um chamado aberto', async () => {
    const { chamadoRepository, categoriaRepository } = criarMocks();
    chamadoRepository.buscarPorId.mockResolvedValue({ id: 1, status: STATUS.ABERTO });
    chamadoRepository.atribuirTecnico.mockResolvedValue({ id: 1, status: STATUS.EM_ATENDIMENTO });
    const service = createChamadoService({ chamadoRepository, categoriaRepository });

    const resultado = await service.assumir(1, TECNICO);

    expect(chamadoRepository.atribuirTecnico).toHaveBeenCalledWith(1, TECNICO.id);
    expect(resultado.status).toBe(STATUS.EM_ATENDIMENTO);
  });

  test('não permite assumir chamado que já está em atendimento', async () => {
    const { chamadoRepository, categoriaRepository } = criarMocks();
    chamadoRepository.buscarPorId.mockResolvedValue({ id: 1, status: STATUS.EM_ATENDIMENTO });
    const service = createChamadoService({ chamadoRepository, categoriaRepository });

    await expect(service.assumir(1, TECNICO)).rejects.toMatchObject({ statusCode: 409 });
  });

  test('cliente não pode assumir chamado', async () => {
    const { chamadoRepository, categoriaRepository } = criarMocks();
    const service = createChamadoService({ chamadoRepository, categoriaRepository });

    await expect(service.assumir(1, CLIENTE)).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('chamadoService.encerrar', () => {
  test('técnico responsável encerra o chamado', async () => {
    const { chamadoRepository, categoriaRepository } = criarMocks();
    chamadoRepository.buscarPorId.mockResolvedValue({
      id: 1,
      status: STATUS.EM_ATENDIMENTO,
      tecnico_id: TECNICO.id,
    });
    chamadoRepository.atualizarStatus.mockResolvedValue({ id: 1, status: STATUS.FECHADO });
    const service = createChamadoService({ chamadoRepository, categoriaRepository });

    const resultado = await service.encerrar(1, TECNICO);

    expect(resultado.status).toBe(STATUS.FECHADO);
  });

  test('técnico que não é o responsável não pode encerrar', async () => {
    const { chamadoRepository, categoriaRepository } = criarMocks();
    chamadoRepository.buscarPorId.mockResolvedValue({
      id: 1,
      status: STATUS.EM_ATENDIMENTO,
      tecnico_id: OUTRO_TECNICO.id,
    });
    const service = createChamadoService({ chamadoRepository, categoriaRepository });

    await expect(service.encerrar(1, TECNICO)).rejects.toMatchObject({ statusCode: 403 });
  });

  test('não permite encerrar chamado já fechado', async () => {
    const { chamadoRepository, categoriaRepository } = criarMocks();
    chamadoRepository.buscarPorId.mockResolvedValue({
      id: 1,
      status: STATUS.FECHADO,
      tecnico_id: TECNICO.id,
    });
    const service = createChamadoService({ chamadoRepository, categoriaRepository });

    await expect(service.encerrar(1, TECNICO)).rejects.toMatchObject({ statusCode: 409 });
  });
});
