const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function criarTabelas() {
  const cliente = await pool.connect();
  try {
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        usuario TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        nivel TEXT NOT NULL DEFAULT 'lider'
      );
      CREATE TABLE IF NOT EXISTS escala (
        id SERIAL PRIMARY KEY,
        data_exibicao TEXT,
        local TEXT,
        teclado TEXT DEFAULT '',
        guitarra TEXT DEFAULT '',
        contrabaixo TEXT DEFAULT '',
        violao TEXT DEFAULT '',
        bateria TEXT DEFAULT '',
        ministro TEXT DEFAULT '',
        backvocal TEXT DEFAULT '',
        vocal TEXT DEFAULT '',
        lider TEXT DEFAULT '',
        status_teclado TEXT DEFAULT 'pendente',
        status_guitarra TEXT DEFAULT 'pendente',
        status_contrabaixo TEXT DEFAULT 'pendente',
        status_violao TEXT DEFAULT 'pendente',
        status_bateria TEXT DEFAULT 'pendente',
        status_ministro TEXT DEFAULT 'pendente',
        status_backvocal TEXT DEFAULT 'pendente',
        status_vocal TEXT DEFAULT 'pendente',
        status_lider TEXT DEFAULT 'pendente',
        culto_musicas JSONB DEFAULT '[]'::jsonb,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS equipe (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        funcao TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS repertorio (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        link TEXT DEFAULT '',
        ensaiada INTEGER DEFAULT 0
      );
      INSERT INTO usuarios (usuario, senha, nivel)
      VALUES ('lider', '1234', 'admin')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Tabelas prontas!');
  } catch (erro) {
    console.error('❌ Erro nas tabelas:', erro);
  } finally {
    cliente.release();
  }
}

app.post('/api/login', async (req, res) => {
  const { usuario, senha } = req.body;
  try {
    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE usuario = $1 AND senha = $2',
      [usuario, senha]
    );
    if (resultado.rows.length > 0) {
      res.json({ sucesso: true, usuario, nivel: resultado.rows[0].nivel });
    } else {
      res.json({ sucesso: false, mensagem: 'Usuário ou senha incorretos' });
    }
  } catch (erro) {
    res.json({ sucesso: false, mensagem: 'Erro no servidor' });
  }
});

app.get('/api/escala', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM escala ORDER BY id DESC LIMIT 1');
    if (resultado.rows.length === 0) {
      return res.json({
        dataExibicao: '', local: '',
        teclado: '', guitarra: '', contrabaixo: '', violao: '', bateria: '',
        ministro: '', backvocal: '', vocal: '', lider: '',
        statusTeclado: 'pendente', statusGuitarra: 'pendente',
        statusContrabaixo: 'pendente', statusViolao: 'pendente',
        statusBateria: 'pendente', statusMinistro: 'pendente',
        statusBackvocal: 'pendente', statusVocal: 'pendente',
        statusLider: 'pendente',
        cultoMusicas: []
      });
    }
    const esc = resultado.rows[0];
    res.json({
      dataExibicao: esc.data_exibicao,
      local: esc.local,
      teclado: esc.teclado,
      guitarra: esc.guitarra,
      contrabaixo: esc.contrabaixo,
      violao: esc.violao,
      bateria: esc.bateria,
      ministro: esc.ministro,
      backvocal: esc.backvocal,
      vocal: esc.vocal,
      lider: esc.lider,
      statusTeclado: esc.status_teclado,
      statusGuitarra: esc.status_guitarra,
      statusContrabaixo: esc.status_contrabaixo,
      statusViolao: esc.status_violao,
      statusBateria: esc.status_bateria,
      statusMinistro: esc.status_ministro,
      statusBackvocal: esc.status_backvocal,
      statusVocal: esc.status_vocal,
      statusLider: esc.status_lider,
      cultoMusicas: esc.culto_musicas || []
    });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

app.post('/api/escala', async (req, res) => {
  const {
    dataExibicao, local, cultoMusicas,
    teclado, guitarra, contrabaixo, violao, bateria,
    ministro, backvocal, vocal, lider,
    statusTeclado, statusGuitarra, statusContrabaixo, statusViolao, statusBateria,
    statusMinistro, statusBackvocal, statusVocal, statusLider
  } = req.body;

  try {
    const existe = await pool.query('SELECT id FROM escala LIMIT 1');
    if (existe.rows.length > 0) {
      await pool.query(`
        UPDATE escala SET
          data_exibicao = $1, local = $2, culto_musicas = $3,
          teclado = $4, guitarra = $5, contrabaixo = $6, violao = $7, bateria = $8,
          ministro = $9, backvocal = $10, vocal = $11, lider = $12,
          status_teclado = $13, status_guitarra = $14, status_contrabaixo = $15,
          status_violao = $16, status_bateria = $17, status_ministro = $18,
          status_backvocal = $19, status_vocal = $20, status_lider = $21,
          atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $22
      `, [
        dataExibicao, local, JSON.stringify(cultoMusicas),
        teclado, guitarra, contrabaixo, violao, bateria,
        ministro, backvocal, vocal, lider,
        statusTeclado, statusGuitarra, statusContrabaixo, statusViolao, statusBateria,
        statusMinistro, statusBackvocal, statusVocal, statusLider,
        existe.rows[0].id
      ]);
    } else {
      await pool.query(`
        INSERT INTO escala (
          data_exibicao, local, culto_musicas,
          teclado, guitarra, contrabaixo, violao, bateria,
          ministro, backvocal, vocal, lider,
          status_teclado, status_guitarra, status_contrabaixo,
          status_violao, status_bateria, status_ministro,
          status_backvocal, status_vocal, status_lider
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
      `, [
        dataExibicao, local, JSON.stringify(cultoMusicas),
        teclado, guitarra, contrabaixo, violao, bateria,
        ministro, backvocal, vocal, lider,
        statusTeclado, statusGuitarra, statusContrabaixo, statusViolao, statusBateria,
        statusMinistro, statusBackvocal, statusVocal, statusLider
      ]);
    }
    res.json({ sucesso: true });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

app.get('/api/equipe', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM equipe ORDER BY nome');
    res.json(resultado.rows.map(m => ({
      ...m,
      funcaoNome: {
        ministro: 'Ministro',
        backvocal: 'Back Vocal',
        vocal: 'Vocal',
        teclado: 'Teclado',
        guitarra: 'Guitarra',
        violao: 'Violão',
        contrabaixo: 'Contrabaixo',
        bateria: 'Bateria',
        lider: 'Líder'
      }[m.funcao] || m.funcao
    })));
  } catch (erro) {
    res.status(500).json([]);
  }
});

app.post('/api/equipe', async (req, res) => {
  const { nome, funcao } = req.body;
  try {
    const resultado = await pool.query(
      'INSERT INTO equipe (nome, funcao) VALUES ($1, $2) RETURNING *',
      [nome, funcao]
    );
    res.json(resultado.rows[0]);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

app.delete('/api/equipe/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM equipe WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

app.get('/api/repertorio', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM repertorio ORDER BY nome');
    res.json(resultado.rows);
  } catch (erro) {
    res.status(500).json([]);
  }
});

app.post('/api/repertorio', async (req, res) => {
  const { nome, link, ensaiada } = req.body;
  try {
    const resultado = await pool.query(
      'INSERT INTO repertorio (nome, link, ensaiada) VALUES ($1, $2, $3) RETURNING *',
      [nome, link, ensaiada]
    );
    res.json(resultado.rows[0]);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

app.put('/api/repertorio/:id', async (req, res) => {
  const { ensaiada } = req.body;
  try {
    const resultado = await pool.query(
      'UPDATE repertorio SET ensaiada = $1 WHERE id = $2 RETURNING *',
      [ensaiada, req.params.id]
    );
    res.json(resultado.rows[0]);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

app.delete('/api/repertorio/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM repertorio WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
});

const PORTA = process.env.PORT || 3000;
criarTabelas().then(() => {
  app.listen(PORTA, () => console.log(`✅ Servidor rodando na porta ${PORTA}`));
});
