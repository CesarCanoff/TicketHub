const authService = require('../services/authServiceInstance');

async function login(req, res) {
  try {
    const { email, senha } = req.body;
    const resultado = await authService.login(email, senha);
    return res.status(200).json(resultado);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ erro: err.message });
  }
}

module.exports = { login };
