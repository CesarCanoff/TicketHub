const { Router } = require('express');
const chamadoController = require('../controllers/chamadoController');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');

const router = Router();

router.use(auth); // todas as rotas de chamado exigem login

router.get('/', chamadoController.listar);
router.get('/:id', chamadoController.detalhes);
router.post('/', authorize('CLIENTE'), chamadoController.criar);
router.patch('/:id/assumir', authorize('TECNICO'), chamadoController.assumir);
router.patch('/:id/encerrar', authorize('TECNICO'), chamadoController.encerrar);

module.exports = router;
