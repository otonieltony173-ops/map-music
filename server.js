const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORTA = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Banco de dados
const db = new sqlite3.Database('./dados.db', (err) => {
  if (err) console.error('❌ Erro no banco:', err);
  else console.log('✅ Banco de dados pronto!');
});

// Cria tabelas
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT UNIQUE,
    senha TEXT,
    nivel TEXT
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS escala (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    dataExibicao TEXT, local TEXT,
    teclado TEXT, guitarra TEXT, baixo TEXT, violao TEXT, bateria TEXT,
    ministro TEXT, backVocal TEXT, lider TEXT, ministros TEXT,
    statusTeclado TEXT, statusGuitarra TEXT, statusBaixo TEXT,
    statusViolao TEXT, statusBateria TEXT, statusMinistro TEXT,
    statusBackVocal TEXT, statusLider TEXT, statusMinistros TEXT,
    repertorio TEXT
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS equipe (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT, funcao TEXT
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS repertorio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT, link TEXT, ensaiada INTEGER DEFAULT 0
  )`);
  
  // Usuários padrão
  db.get('SELECT * FROM usuarios WHERE usuario = ?', ['lider'], (err, row) => {
    if (!row) db.run('INSERT INTO usuarios (usuario, senha, nivel) VALUES (?, ?, ?)', ['lider', '1234', 'admin']);
  });
  db.get('SELECT * FROM usuarios WHERE usuario = ?', ['membro'], (err, row) => {
    if (!row) db.run('INSERT INTO usuarios (usuario, senha, nivel) VALUES (?, ?, ?)', ['membro', '1234', 'membro']);
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;
  db.get('SELECT * FROM usuarios WHERE usuario = ?', [usuario], (err, user) => {
    if (!user || user.senha !== senha) {
      return res.status(401).json({ sucesso: false, mensagem: 'Usuário ou senha incorretos' });
    }
    res.json({ sucesso: true, usuario: user.usuario, nivel: user.nivel });
  });
});

// Escala
app.get('/api/escala', (req, res) => {
  db.get('SELECT * FROM escala WHERE id = 1', [], (err, esc) => {
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
});

app.post('/api/escala', (req, res) => {
  const e = req.body;
  const rep = JSON.stringify(e.repertorio || []);
  
  db.get('SELECT id FROM escala WHERE id = 1', [], (err, existe) => {
    if (existe) {
      db.run(`UPDATE escala SET
        dataExibicao=?, local=?, teclado=?, guitarra=?, baixo=?, violao=?, bateria=?,
        ministro=?, backVocal=?, lider=?, ministros=?, repertorio=?,
        statusTeclado=?, statusGuitarra=?, statusBaixo=?, statusViolao=?,
        statusBateria=?, statusMinistro=?, statusBackVocal=?, statusLider=?, statusMinistros=?
        WHERE id=1`,
        [e.dataExibicao, e.local, e.teclado, e.guitarra, e.baixo, e.violao, e.bateria,
         e.ministro, e.backVocal, e.lider, e.ministros, rep,
         e.statusTeclado, e.statusGuitarra, e.statusBaixo, e.statusViolao,
         e.statusBateria, e.statusMinistro, e.statusBackVocal, e.statusLider, e.statusMinistros],
        () => res.json({ sucesso: true })
      );
    } else {
      db.run(`INSERT INTO escala VALUES (
        1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
      )`,
        [e.dataExibicao, e.local, e.teclado, e.guitarra, e.baixo, e.violao, e.bateria,
         e.ministro, e.backVocal, e.lider, e.ministros,
         e.statusTeclado, e.statusGuitarra, e.statusBaixo, e.statusViolao,
         e.statusBateria, e.statusMinistro, e.statusBackVocal, e.statusLider, e.statusMinistros,
         rep],
        () => res.json({ sucesso: true })
      );
    }
  });
});

// Equipe
app.get('/api/equipe', (req, res) => {
  db.all('SELECT * FROM equipe', [], (err, rows) => res.json(rows));
});

app.post('/api/equipe', (req, res) => {
  const { nome, funcao } = req.body;
  db.run('INSERT INTO equipe (nome, funcao) VALUES (?, ?)', [nome, funcao], function(err) {
    res.json({ id: this.lastID, nome, funcao });
  });
});

app.delete('/api/equipe/:id', (req, res) => {
  db.run('DELETE FROM equipe WHERE id = ?', [req.params.id], () => res.json({ sucesso: true }));
});

// Repertório
app.get('/api/repertorio', (req, res) => {
  db.all('SELECT * FROM repertorio', [], (err, rows) => res.json(rows));
});

app.post('/api/repertorio', (req, res) => {
  const { nome, link, ensaiada } = req.body;
  db.run('INSERT INTO repertorio (nome, link, ensaiada) VALUES (?, ?, ?)', 
    [nome, link, ensaiada ? 1 : 0], function(err) {
      res.json({ id: this.lastID, nome, link, ensaiada });
    });
});

app.put('/api/repertorio/:id', (req, res) => {
  db.run('UPDATE repertorio SET ensaiada = ? WHERE id = ?', 
    [req.body.ensaiada ? 1 : 0, req.params.id], () => res.json({ sucesso: true }));
});

app.delete('/api/repertorio/:id', (req, res) => {
  db.run('DELETE FROM repertorio WHERE id = ?', [req.params.id], () => res.json({ sucesso: true }));
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORTA, () => console.log(`✅ Servidor rodando na porta ${PORTA}`));
