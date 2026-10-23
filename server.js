const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const app = express();
const PORTA = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Banco de dados
const db = new Database('./dados.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT UNIQUE,
    senha TEXT,
    nivel TEXT
  );
  CREATE TABLE IF NOT EXISTS escala (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    dataExibicao TEXT, local TEXT,
    teclado TEXT, guitarra TEXT, baixo TEXT, violao TEXT, bateria TEXT,
    ministro TEXT, backVocal TEXT, lider TEXT, ministros TEXT,
    statusTeclado TEXT, statusGuitarra TEXT, statusBaixo TEXT,
    statusViolao TEXT, statusBateria TEXT, statusMinistro TEXT,
    statusBackVocal TEXT, statusLider TEXT, statusMinistros TEXT,
    repertorio TEXT
  );
  CREATE TABLE IF NOT EXISTS equipe (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT, funcao TEXT
  );
  CREATE TABLE IF NOT EXISTS repertorio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT, link TEXT, ensaiada INTEGER DEFAULT 0
  );
`);

// Usuários padrão
const verificaUsuario = db.prepare('SELECT * FROM usuarios WHERE usuario = ?');
if (!verificaUsuario.get('lider')) {
  db.prepare('INSERT INTO usuarios (usuario, senha, nivel) VALUES (?, ?, ?)')
    .run('lider', '1234', 'admin');
}
if (!verificaUsuario.get('membro')) {
  db.prepare('INSERT INTO usuarios (usuario, senha, nivel) VALUES (?, ?, ?)')
    .run('membro', '1234', 'membro');
}

// Login
app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;
  const user = verificaUsuario.get(usuario);
  if (!user || user.senha !== senha) {
    return res.status(401).json({ sucesso: false, mensagem: 'Usuário ou senha incorretos' });
  }
  res.json({ sucesso: true, usuario: user.usuario, nivel: user.nivel });
});

// Escala
app.get('/api/escala', (req, res) => {
  const esc = db.prepare('SELECT * FROM escala WHERE id = 1').get();
  if (!esc) return res.json({});
  res.json({
    dataExibicao: esc.dataExibicao, local: esc.local,
    teclado: esc.teclado, guitarra: esc.guitarra, baixo: esc.baixo,
    violao: esc.violao, bateria: esc.bateria,
    ministro: esc.ministro, backVocal: esc.backVocal,
    lider: esc.lider, ministros: esc.ministros,
    statusTeclado: esc.statusTeclado, statusGuitarra: esc.statusGuitarra,
    statusBaixo: esc.statusBaixo, statusViolao: esc.statusViolao,
    statusBateria: esc.statusBateria, statusMinistro: esc.statusMinistro,
    statusBackVocal: esc.statusBackVocal, statusLider: esc.statusLider,
    statusMinistros: esc.statusMinistros,
    repertorio: esc.repertorio ? JSON.parse(esc.repertorio) : []
  });
});

app.post('/api/escala', (req, res) => {
  const e = req.body;
  const existe = db.prepare('SELECT id FROM escala WHERE id = 1').get();
  const rep = JSON.stringify(e.repertorio || []);
  
  if (existe) {
    db.prepare(`UPDATE escala SET
      dataExibicao=?, local=?, teclado=?, guitarra=?, baixo=?, violao=?, bateria=?,
      ministro=?, backVocal=?, lider=?, ministros=?, repertorio=?,
      statusTeclado=?, statusGuitarra=?, statusBaixo=?, statusViolao=?,
      statusBateria=?, statusMinistro=?, statusBackVocal=?, statusLider=?, statusMinistros=?
      WHERE id=1`).run(
      e.dataExibicao, e.local, e.teclado, e.guitarra, e.baixo, e.violao, e.bateria,
      e.ministro, e.backVocal, e.lider, e.ministros, rep,
      e.statusTeclado, e.statusGuitarra, e.statusBaixo, e.statusViolao,
      e.statusBateria, e.statusMinistro, e.statusBackVocal, e.statusLider, e.statusMinistros
    );
  } else {
    db.prepare(`INSERT INTO escala VALUES (
      1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
    )`).run(
      e.dataExibicao, e.local, e.teclado, e.guitarra, e.baixo, e.violao, e.bateria,
      e.ministro, e.backVocal, e.lider, e.ministros,
      e.statusTeclado, e.statusGuitarra, e.statusBaixo, e.statusViolao,
      e.statusBateria, e.statusMinistro, e.statusBackVocal, e.statusLider, e.statusMinistros,
      rep
    );
  }
  res.json({ sucesso: true });
});

// Equipe
app.get('/api/equipe', (req, res) => res.json(db.prepare('SELECT * FROM equipe').all()));
app.post('/api/equipe', (req, res) => {
  const { nome, funcao } = req.body;
  const id = db.prepare('INSERT INTO equipe (nome, funcao) VALUES (?, ?)').run(nome, funcao).lastInsertRowid;
  res.json({ id, nome, funcao });
});
app.delete('/api/equipe/:id', (req, res) => {
  db.prepare('DELETE FROM equipe WHERE id = ?').run(req.params.id);
  res.json({ sucesso: true });
});

// Repertório
app.get('/api/repertorio', (req, res) => res.json(db.prepare('SELECT * FROM repertorio').all()));
app.post('/api/repertorio', (req, res) => {
  const { nome, link, ensaiada } = req.body;
  const id = db.prepare('INSERT INTO repertorio (nome, link, ensaiada) VALUES (?, ?, ?)')
    .run(nome, link, ensaiada ? 1 : 0).lastInsertRowid;
  res.json({ id, nome, link, ensaiada });
});
app.put('/api/repertorio/:id', (req, res) => {
  db.prepare('UPDATE repertorio SET ensaiada = ? WHERE id = ?')
    .run(req.body.ensaiada ? 1 : 0, req.params.id);
  res.json({ sucesso: true });
});
app.delete('/api/repertorio/:id', (req, res) => {
  db.prepare('DELETE FROM repertorio WHERE id = ?').run(req.params.id);
  res.json({ sucesso: true });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORTA, () => console.log(`✅ Servidor rodando na porta ${PORTA}`));
