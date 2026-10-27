const { Router } = require('express');

const authRoutes = require('./authRoutes');
const chamadoRoutes = require('./chamadoRoutes');
const categoriaRoutes = require('./categoriaRoutes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/chamados', chamadoRoutes);
router.use('/categorias', categoriaRoutes);

module.exports = router;
