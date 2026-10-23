const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORTA = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS escalas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataExibicao TEXT,
    local TEXT,
    teclado TEXT,
    guitarra TEXT,
    baixo TEXT,
    violao TEXT,
    bateria TEXT,
    ministro TEXT,
    backVocal TEXT,
    lider TEXT,
    ministros TEXT,
    repertorio TEXT,
    presenca TEXT,
    criadoEm DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  console.log('📦 Banco de dados pronto!');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/escala', (req, res) => {
  const { dataExibicao, local, teclado, guitarra, baixo, violao, bateria, 
          ministro, backVocal, lider, ministros, repertorio, presenca } = req.body;
  
  db.run(`INSERT INTO escalas 
    (dataExibicao, local, teclado, guitarra, baixo, violao, bateria, 
     ministro, backVocal, lider, ministros, repertorio, presenca)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [dataExibicao, local, teclado, guitarra, baixo, violao, bateria,
     ministro, backVocal, lider, ministros, JSON.stringify(repertorio), JSON.stringify(presenca)],
    function(err) {
      if (err) {
        return res.status(500).json({ erro: err.message });
      }
      res.json({ sucesso: true, id: this.lastID });
    }
  );
});

app.listen(PORTA, () => {
  console.log(`🚀 Servidor rodando na porta ${PORTA}`);
});