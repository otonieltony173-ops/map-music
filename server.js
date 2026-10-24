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
  connectionString: 'postgresql://postgres:map12novaestacao@sxinommlolgttufauaky.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

// ==============================================
// CONFIGURAÇÕES
// ==============================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// ==============================================
// INICIALIZAR TABELAS (se não existirem)
// ==============================================
async function inicializarBanco() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        usuario TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        tipo TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS membros (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        funcao TEXT NOT NULL,
        ativo BOOLEAN DEFAULT true
      );
      
      CREATE TABLE IF NOT EXISTS escalas (
        id SERIAL PRIMARY KEY,
        data TEXT NOT NULL,
        observacoes TEXT DEFAULT '',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS escala_membros (
        id SERIAL PRIMARY KEY,
        escala_id INTEGER REFERENCES escalas(id) ON DELETE CASCADE,
        membro_id INTEGER REFERENCES membros(id),
        status TEXT DEFAULT 'pendente',
        funcao_na_escala TEXT
      );
      
      CREATE TABLE IF NOT EXISTS materiais (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        link TEXT DEFAULT '',
        status TEXT DEFAULT 'nao_ensaiada',
        ativo BOOLEAN DEFAULT true
      );
      
      CREATE TABLE IF NOT EXISTS escalas_musicas (
        id SERIAL PRIMARY KEY,
        escala_id INTEGER REFERENCES escalas(id) ON DELETE CASCADE,
        material_id INTEGER REFERENCES materiais(id)
      );
    `);

    // Inserir usuários padrão se não existirem
    const checkLider = await pool.query('SELECT id FROM usuarios WHERE usuario = $1', ['lider']);
    if (checkLider.rows.length === 0) {
      await pool.query(
        'INSERT INTO usuarios (usuario, senha, tipo) VALUES ($1, $2, $3)',
        ['lider', '1234', 'lider']
      );
    }

    const checkMembro = await pool.query('SELECT id FROM usuarios WHERE usuario = $1', ['membro']);
    if (checkMembro.rows.length === 0) {
      await pool.query(
        'INSERT INTO usuarios (usuario, senha, tipo) VALUES ($1, $2, $3)',
        ['membro', '123456', 'membro']
      );
    }

    console.log('✅ Banco de dados pronto e conectado!');
  } catch (err) {
    console.error('❌ Erro ao inicializar banco:', err.message);
    throw err; // Repassa o erro para a função de inicialização
  }
}

// ==============================================
// ROTAS DE AUTENTICAÇÃO
// ==============================================
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    const resultado = await pool.query(
      'SELECT tipo FROM usuarios WHERE usuario = $1 AND senha = $2',
      [usuario, senha]
    );
    
    if (resultado.rows.length > 0) {
      res.json({ sucesso: true, tipo: resultado.rows[0].tipo });
    } else {
      res.json({ sucesso: false, mensagem: 'Usuário ou senha incorretos' });
    }
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message });
  }
});

// ==============================================
// ROTAS DE MEMBROS
// ==============================================
app.get('/api/membros', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM membros WHERE ativo = true ORDER BY nome');
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.post('/api/membros', async (req, res) => {
  try {
    const { nome, funcao } = req.body;
    const resultado = await pool.query(
      'INSERT INTO membros (nome, funcao) VALUES ($1, $2) RETURNING *',
      [nome, funcao]
    );
    res.json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.put('/api/membros/:id', async (req, res) => {
  try {
    const { nome, funcao } = req.body;
    const resultado = await pool.query(
      'UPDATE membros SET nome = $1, funcao = $2 WHERE id = $3 RETURNING *',
      [nome, funcao, req.params.id]
    );
    res.json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.delete('/api/membros/:id', async (req, res) => {
  try {
    await pool.query('UPDATE membros SET ativo = false WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ==============================================
// ROTAS DE ESCALA
// ==============================================
app.get('/api/escala', async (req, res) => {
  try {
    const escala = await pool.query('SELECT * FROM escalas ORDER BY id DESC LIMIT 1');
    if (escala.rows.length === 0) return res.json(null);
    
    const escalaAtual = escala.rows[0];
    const membrosEscala = await pool.query(`
      SELECT em.*, m.nome, m.funcao 
      FROM escala_membros em 
      JOIN membros m ON em.membro_id = m.id 
      WHERE em.escala_id = $1
    `, [escalaAtual.id]);
    
    const musicasEscala = await pool.query(`
      SELECT emu.material_id, m.nome, m.link, m.status 
      FROM escalas_musicas emu
      JOIN materiais m ON emu.material_id = m.id
      WHERE emu.escala_id = $1
    `, [escalaAtual.id]);

    res.json({
      ...escalaAtual,
      membros: membrosEscala.rows,
      musicas: musicasEscala.rows
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.post('/api/escala', async (req, res) => {
  try {
    const { data, observacoes, membros, musicas } = req.body;
    
    // Criar nova escala
    const escalaResult = await pool.query(
      'INSERT INTO escalas (data, observacoes) VALUES ($1, $2) RETURNING *',
      [data, observacoes]
    );
    const escalaId = escalaResult.rows[0].id;
    
    // Adicionar membros
    for (const m of membros || []) {
      await pool.query(
        'INSERT INTO escala_membros (escala_id, membro_id, status, funcao_na_escala) VALUES ($1, $2, $3, $4)',
        [escalaId, m.membro_id, m.status || 'pendente', m.funcao_na_escala || m.funcao]
      );
    }
    
    // Adicionar músicas
    for (const mid of musicas || []) {
      await pool.query(
        'INSERT INTO escalas_musicas (escala_id, material_id) VALUES ($1, $2)',
        [escalaId, mid]
      );
    }
    
    res.json({ sucesso: true, escalaId });
  } catch (err) {
    res.status(500).json({ sucesso: false, erro: err.message });
  }
});

app.patch('/api/escala/:escalaId/membro/:membroId/status', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query(
      'UPDATE escala_membros SET status = $1 WHERE escala_id = $2 AND membro_id = $3',
      [status, req.params.escalaId, req.params.membroId]
    );
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ==============================================
// ROTAS DE MATERIAIS / MÚSICAS
// ==============================================
app.get('/api/materiais', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM materiais WHERE ativo = true ORDER BY nome');
    res.json(resultado.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.post('/api/materiais', async (req, res) => {
  try {
    const { nome, link, status } = req.body;
    const resultado = await pool.query(
      'INSERT INTO materiais (nome, link, status) VALUES ($1, $2, $3) RETURNING *',
      [nome, link, status || 'nao_ensaiada']
    );
    res.json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.put('/api/materiais/:id', async (req, res) => {
  try {
    const { nome, link, status } = req.body;
    const resultado = await pool.query(
      'UPDATE materiais SET nome = $1, link = $2, status = $3 WHERE id = $4 RETURNING *',
      [nome, link, status, req.params.id]
    );
    res.json(resultado.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.delete('/api/materiais/:id', async (req, res) => {
  try {
    await pool.query('UPDATE materiais SET ativo = false WHERE id = $1', [req.params.id]);
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ==============================================
// PÁGINA PRINCIPAL
// ==============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==============================================
// INICIAR SERVIDOR
// ==============================================
async function iniciarServidor() {
  try {
    await inicializarBanco();
    app.listen(PORTA, () => {
      console.log(`🚀 Servidor rodando na porta ${PORTA}`);
      console.log(`✅ Sistema pronto e conectado ao banco!`);
    });
  } catch (err) {
    console.error('❌ Falha ao iniciar o servidor:', err.message);
    process.exit(1);
  }
}

iniciarServidor();
