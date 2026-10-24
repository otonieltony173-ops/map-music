const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.static(__dirname));

// Conectar ao banco
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) console.error('Erro no banco:', err);
  else console.log('✅ Banco conectado!');
});

// Criar tabelas e usuários padrão
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT UNIQUE,
    senha TEXT,
    nivel TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS escalas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT,
    local TEXT,
    equipe TEXT,
    musicas TEXT,
    criadoPor TEXT,
    criadoEm TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS confirmacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    escalaId INTEGER,
    funcao TEXT,
    nome TEXT,
    status TEXT,
    FOREIGN KEY(escalaId) REFERENCES escalas(id)
  )`);

  // Inserir usuários padrão
  db.get('SELECT * FROM usuarios WHERE usuario = ?', ['lider'], (err, row) => {
    if (!row) {
      db.run('INSERT INTO usuarios (usuario, senha, nivel) VALUES (?, ?, ?)', 
        ['lider', '1234', 'admin']);
      console.log('✅ Usuário líder criado!');
    }
  });

  db.get('SELECT * FROM usuarios WHERE usuario = ?', ['membro'], (err, row) => {
    if (!row) {
      db.run('INSERT INTO usuarios (usuario, senha, nivel) VALUES (?, ?, ?)', 
        ['membro', '1234', 'membro']);
      console.log('✅ Usuário membro criado!');
    }
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;
  db.get('SELECT * FROM usuarios WHERE usuario = ? AND senha = ?', 
    [usuario, senha], 
    (err, user) => {
      if (user) {
        res.json({ sucesso: true, usuario: user.usuario, nivel: user.nivel });
      } else {
        res.json({ sucesso: false, mensagem: 'Usuário ou senha inválidos' });
      }
    });
});

// Salvar escala
app.post('/api/escalas', (req, res) => {
  const { data, local, equipe, musicas, usuario } = req.body;
  db.run('INSERT INTO escalas (data, local, equipe, musicas, criadoPor, criadoEm) VALUES (?, ?, ?, ?, ?, datetime("now"))',
    [data, local, JSON.stringify(equipe), JSON.stringify(musicas), usuario],
    function(err) {
      if (err) res.json({ sucesso: false });
      else res.json({ sucesso: true, id: this.lastID });
    });
});

// Listar escalas
app.get('/api/escalas', (req, res) => {
  db.all('SELECT * FROM escalas ORDER BY criadoEm DESC', (err, rows) => {
    if (err) res.json([]);
    else {
      const escalas = rows.map(e => ({
        ...e,
        equipe: JSON.parse(e.equipe || '[]'),
        musicas: JSON.parse(e.musicas || '[]')
      }));
      res.json(escalas);
    }
  });
});

// Confirmar presença
app.post('/api/confirmar', (req, res) => {
  const { escalaId, funcao, nome, status } = req.body;
  db.run('REPLACE INTO confirmacoes (escalaId, funcao, nome, status) VALUES (?, ?, ?, ?)',
    [escalaId, funcao, nome, status],
    (err) => {
      if (err) res.json({ sucesso: false });
      else res.json({ sucesso: true });
    });
});

// Obter confirmações
app.get('/api/confirmacoes/:escalaId', (req, res) => {
  db.all('SELECT * FROM confirmacoes WHERE escalaId = ?', [req.params.escalaId], (err, rows) => {
    if (err) res.json([]);
    else res.json(rows);
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
