const { Router } = require('express');
const categoriaController = require('../controllers/categoriaController');
const auth = require('../middlewares/auth');

const router = Router();

router.use(auth);
router.get('/', categoriaController.listar);

module.exports = router;
