const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORTA = process.env.PORT || 3000;

// ==============================================
// CONEXÃO COM O BANCO DE DADOS SUPABASE
// ==============================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'COLA_AQUI_A_SUA_STRING_DE_CONEXAO',
  ssl: { rejectUnauthorized: false }
});

// ==============================================
// CONFIGURAÇÕES
// ==============================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// ==============================================
// TESTE DE CONEXÃO
// ==============================================
pool.connect((err) => {
  if (err) {
    console.error('❌ ERRO ao conectar no banco:', err.message);
  } else {
    console.log('✅ Conectado ao banco de dados com sucesso!');
  }
});

// ==============================================
// LOGIN
// ==============================================
app.post('/api/login', async (req, res) => {
  const { usuario, senha } = req.body;
  try {
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE usuario = $1 AND senha = $2',
      [usuario, senha]
    );
    if (resultado.rows.length === 1) {
      res.json({
        sucesso: true,
        usuario: resultado.rows[0].usuario,
        nivel: resultado.rows[0].nivel
      });
    } else {
      res.json({ sucesso: false, mensagem: 'Usuário ou senha incorretos' });
    }
  } catch (erro) {
    res.json({ sucesso: false, mensagem: 'Erro no servidor: ' + erro.message });
  }
});

// ==============================================
// ESCALA
// ==============================================
app.get('/api/escala', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM escala WHERE id = 1');
    if (resultado.rows.length === 0) {
      return res.json({});
    }
    res.json(resultado.rows[0]);
  } catch (erro) {
    res.json({ erro: erro.message });
  }
});

app.post('/api/escala', async (req, res) => {
  const dados = req.body;
  try {
    await pool.query(`
      INSERT INTO escala (
        id, dataExibicao, "local", teclado, guitarra, contrabaixo, violao, bateria,
        ministro, backvocal, vocal, lider, statusTeclado, statusGuitarra,
        statusContrabaixo, statusViolao, statusBateria, statusMinistro,
        statusBackvocal, statusVocal, statusLider, cultoMusicas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      ON CONFLICT (id) DO UPDATE SET
        dataExibicao = $2, "local" = $3, teclado = $4, guitarra = $5, contrabaixo = $6,
        violao = $7, bateria = $8, ministro = $9, backvocal = $10, vocal = $11,
        lider = $12, statusTeclado = $13, statusGuitarra = $14, statusContrabaixo = $15,
        statusViolao = $16, statusBateria = $17, statusMinistro = $18,
        statusBackvocal = $19, statusVocal = $20, statusLider = $21, cultoMusicas = $22
    `, [
      1, dados.dataExibicao, dados.local, dados.teclado, dados.guitarra,
      dados.contrabaixo, dados.violao, dados.bateria, dados.ministro,
      dados.backvocal, dados.vocal, dados.lider, dados.statusTeclado,
      dados.statusGuitarra, dados.statusContrabaixo, dados.statusViolao,
      dados.statusBateria, dados.statusMinistro, dados.statusBackvocal,
      dados.statusVocal, dados.statusLider, JSON.stringify(dados.cultoMusicas || [])
    ]);
    res.json({ sucesso: true });
  } catch (erro) {
    res.json({ sucesso: false, erro: erro.message });
  }
});

// ==============================================
// EQUIPE
// ==============================================
app.get('/api/equipe', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM equipe ORDER BY id');
    res.json(resultado.rows);
  } catch (erro) {
    res.json([]);
  }
});

app.post('/api/equipe', async (req, res) => {
  const { nome, funcao } = req.body;
  try {
    await pool.query('INSERT INTO equipe (nome, funcao) VALUES ($1, $2)', [nome, funcao]);
    res.json({ sucesso: true });
  } catch (erro) {
    res.json({ sucesso: false, erro: erro.message });
  }
});

app.delete('/api/equipe/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM equipe WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) {
    res.json({ sucesso: false });
  }
});

// ==============================================
// REPERTÓRIO / MATERIAIS
// ==============================================
app.get('/api/repertorio', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM repertorio ORDER BY id');
    res.json(resultado.rows);
  } catch (erro) {
    res.json([]);
  }
});

app.post('/api/repertorio', async (req, res) => {
  const { nome, link, ensaiada } = req.body;
  try {
    await pool.query(
      'INSERT INTO repertorio (nome, link, ensaiada) VALUES ($1, $2, $3)',
      [nome, link, ensaiada || 0]
    );
    res.json({ sucesso: true });
  } catch (erro) {
    res.json({ sucesso: false });
  }
});

app.put('/api/repertorio/:id', async (req, res) => {
  const { ensaiada } = req.body;
  try {
    await pool.query(
      'UPDATE repertorio SET ensaiada = $1 WHERE id = $2',
      [ensaiada, req.params.id]
    );
    res.json({ sucesso: true });
  } catch (erro) {
    res.json({ sucesso: false });
  }
});

app.delete('/api/repertorio/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM repertorio WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) {
    res.json({ sucesso: false });
  }
});

// ==============================================
// INICIAR SERVIDOR
// ==============================================
app.listen(PORTA, () => {
  console.log(`🚀 Servidor rodando na porta ${PORTA}`);
});
