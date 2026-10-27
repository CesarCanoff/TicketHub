const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

// Handler final para rota inexistente
app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

module.exports = app;
