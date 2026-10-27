/**
 * Erro de aplicação com um status HTTP associado.
 * Os controllers usam err.statusCode para responder ao cliente,
 * e os services lançam este erro em vez de erros genéricos,
 * o que facilita muito os testes unitários (basta checar a mensagem/status).
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

module.exports = AppError;
