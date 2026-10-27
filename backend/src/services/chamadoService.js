const AppError = require('../utils/AppError');

const STATUS = {
  ABERTO: 'ABERTO',
  EM_ATENDIMENTO: 'EM_ATENDIMENTO',
  FECHADO: 'FECHADO',
};

function createChamadoService({ chamadoRepository, categoriaRepository }) {
  return {
    async criar({ titulo, descricao, categoriaId }, usuarioLogado) {
      if (usuarioLogado.tipo !== 'CLIENTE') {
        throw new AppError('Apenas clientes podem abrir chamados.', 403);
      }
      if (!titulo || !titulo.trim()) {
        throw new AppError('O título é obrigatório.', 400);
      }
      if (!descricao || !descricao.trim()) {
        throw new AppError('A descrição é obrigatória.', 400);
      }

      const categoria = await categoriaRepository.buscarPorId(categoriaId);
      if (!categoria || !categoria.ativo) {
        throw new AppError('Categoria de serviço inválida.', 400);
      }

      return chamadoRepository.criar({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        categoriaId,
        clienteId: usuarioLogado.id,
      });
    },

    // Cliente ve so os proprios chamados; tecnico ve os disponiveis/atribuidos.
    async listar(usuarioLogado) {
      if (usuarioLogado.tipo === 'CLIENTE') {
        return chamadoRepository.listarPorCliente(usuarioLogado.id);
      }
      return chamadoRepository.listarParaTecnico();
    },

    async buscarDetalhes(chamadoId, usuarioLogado) {
      const chamado = await chamadoRepository.buscarPorId(chamadoId);
      if (!chamado) {
        throw new AppError('Chamado não encontrado.', 404);
      }

      const ehDono = usuarioLogado.tipo === 'CLIENTE' && chamado.cliente_id === usuarioLogado.id;
      const ehTecnico = usuarioLogado.tipo === 'TECNICO';

      if (!ehDono && !ehTecnico) {
        throw new AppError('Você não tem permissão para ver este chamado.', 403);
      }

      return chamado;
    },

    async assumir(chamadoId, usuarioLogado) {
      if (usuarioLogado.tipo !== 'TECNICO') {
        throw new AppError('Apenas técnicos podem assumir chamados.', 403);
      }

      const chamado = await chamadoRepository.buscarPorId(chamadoId);
      if (!chamado) {
        throw new AppError('Chamado não encontrado.', 404);
      }
      if (chamado.status !== STATUS.ABERTO) {
        throw new AppError('Este chamado já está em atendimento ou foi encerrado.', 409);
      }

      return chamadoRepository.atribuirTecnico(chamadoId, usuarioLogado.id);
    },

    async encerrar(chamadoId, usuarioLogado) {
      if (usuarioLogado.tipo !== 'TECNICO') {
        throw new AppError('Apenas técnicos podem encerrar chamados.', 403);
      }

      const chamado = await chamadoRepository.buscarPorId(chamadoId);
      if (!chamado) {
        throw new AppError('Chamado não encontrado.', 404);
      }
      if (chamado.tecnico_id !== usuarioLogado.id) {
        throw new AppError('Apenas o técnico responsável pode encerrar este chamado.', 403);
      }
      if (chamado.status === STATUS.FECHADO) {
        throw new AppError('Este chamado já está encerrado.', 409);
      }

      return chamadoRepository.atualizarStatus(chamadoId, STATUS.FECHADO);
    },
  };
}

module.exports = { createChamadoService, STATUS };
