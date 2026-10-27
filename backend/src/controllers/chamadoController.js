const chamadoService = require('../services/chamadoServiceInstance');

async function criar(req, res) {
  try {
    const chamado = await chamadoService.criar(req.body, req.usuario);
    return res.status(201).json(chamado);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ erro: err.message });
  }
}

async function listar(req, res) {
  try {
    const chamados = await chamadoService.listar(req.usuario);
    return res.status(200).json(chamados);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ erro: err.message });
  }
}

async function detalhes(req, res) {
  try {
    const chamado = await chamadoService.buscarDetalhes(Number(req.params.id), req.usuario);
    return res.status(200).json(chamado);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ erro: err.message });
  }
}

async function assumir(req, res) {
  try {
    const chamado = await chamadoService.assumir(Number(req.params.id), req.usuario);
    return res.status(200).json(chamado);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ erro: err.message });
  }
}

async function encerrar(req, res) {
  try {
    const chamado = await chamadoService.encerrar(Number(req.params.id), req.usuario);
    return res.status(200).json(chamado);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ erro: err.message });
  }
}

module.exports = { criar, listar, detalhes, assumir, encerrar };
