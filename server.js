const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORTA = process.env.PORT || 3000;
const ARQUIVO_DADOS = './dados.json';

// ==============================================
// CONFIGURAÇÕES
// ==============================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// ==============================================
// GERENCIAR DADOS
// ==============================================
function lerDados() {
  try {
    if (!fs.existsSync(ARQUIVO_DADOS)) {
      return {
        usuarios: [
          { usuario: 'lider', senha: '1234', tipo: 'lider' },
          { usuario: 'membro', senha: '1234', tipo: 'membro' }
        ],
        membros: [],
        escalas: [],
        escala_membros: [],
        materiais: [],
        escalas_musicas: []
      };
    }
    const texto = fs.readFileSync(ARQUIVO_DADOS, 'utf8');
    return JSON.parse(texto);
  } catch (err) {
    console.error('Erro ao ler dados:', err);
    return {
      usuarios: [
        { usuario: 'lider', senha: '1234', tipo: 'lider' },
        { usuario: 'membro', senha: '1234', tipo: 'membro' }
      ],
      membros: [],
      escalas: [],
      escala_membros: [],
      materiais: [],
      escalas_musicas: []
    };
  }
}

function salvarDados(dados) {
  try {
    fs.writeFileSync(ARQUIVO_DADOS, JSON.stringify(dados, null, 2));
    return true;
  } catch (err) {
    console.error('Erro ao salvar dados:', err);
    return false;
  }
}

// ==============================================
// ROTAS DE AUTENTICAÇÃO
// ==============================================
app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;
  const dados = lerDados();
  const usuarioEncontrado = dados.usuarios.find(
    u => u.usuario === usuario && u.senha === senha
  );
  
  if (usuarioEncontrado) {
    res.json({ sucesso: true, tipo: usuarioEncontrado.tipo });
  } else {
    res.json({ sucesso: false, mensagem: 'Usuário ou senha incorretos' });
  }
});

// ==============================================
// ROTAS DE MEMBROS
// ==============================================
app.get('/api/membros', (req, res) => {
  const dados = lerDados();
  res.json(dados.membros.filter(m => m.ativo !== false));
});

app.post('/api/membros', (req, res) => {
  const dados = lerDados();
  const novo = { id: Date.now(), ...req.body, ativo: true };
  dados.membros.push(novo);
  salvarDados(dados);
  res.json(novo);
});

app.put('/api/membros/:id', (req, res) => {
  const dados = lerDados();
  const id = parseInt(req.params.id);
  const idx = dados.membros.findIndex(m => m.id === id);
  if (idx !== -1) {
    dados.membros[idx] = { ...dados.membros[idx], ...req.body };
    salvarDados(dados);
    res.json(dados.membros[idx]);
  } else {
    res.status(404).json({ erro: 'Não encontrado' });
  }
});

app.delete('/api/membros/:id', (req, res) => {
  const dados = lerDados();
  const id = parseInt(req.params.id);
  const idx = dados.membros.findIndex(m => m.id === id);
  if (idx !== -1) {
    dados.membros[idx].ativo = false;
    salvarDados(dados);
    res.json({ sucesso: true });
  } else {
    res.status(404).json({ erro: 'Não encontrado' });
  }
});

// ==============================================
// ROTAS DE ESCALA
// ==============================================
app.get('/api/escala', (req, res) => {
  const dados = lerDados();
  if (dados.escalas.length === 0) return res.json(null);
  
  const escalaAtual = dados.escalas[dados.escalas.length - 1];
  const membrosEscala = dados.escala_membros.filter(
    em => em.escala_id === escalaAtual.id
  ).map(em => {
    const membro = dados.membros.find(m => m.id === em.membro_id);
    return { ...em, nome: membro?.nome, funcao: membro?.funcao };
  });
  
  const musicasEscala = dados.escalas_musicas.filter(
    em => em.escala_id === escalaAtual.id
  ).map(em => {
    const mat = dados.materiais.find(m => m.id === em.material_id);
    return { material_id: em.material_id, ...mat };
  });
  
  res.json({
    ...escalaAtual,
    membros: membrosEscala,
    musicas: musicasEscala
  });
});

app.post('/api/escala', (req, res) => {
  const dados = lerDados();
  const { data, observacoes, membros, musicas } = req.body;
  
  const novaEscala = {
    id: Date.now(),
    data,
    observacoes,
    criado_em: new Date().toISOString()
  };
  dados.escalas.push(novaEscala);
  
  membros?.forEach(m => {
    dados.escala_membros.push({
      id: Date.now() + Math.random(),
      escala_id: novaEscala.id,
      membro_id: m.membro_id,
      status: m.status || 'pendente',
      funcao_na_escala: m.funcao_na_escala || m.funcao
    });
  });
  
  musicas?.forEach(mid => {
    dados.escalas_musicas.push({
      id: Date.now() + Math.random(),
      escala_id: novaEscala.id,
      material_id: mid
    });
  });
  
  salvarDados(dados);
  res.json({ sucesso: true, escalaId: novaEscala.id });
});

app.patch('/api/escala/:escalaId/membro/:membroId/status', (req, res) => {
  const dados = lerDados();
  const { escalaId, membroId } = req.params;
  const { status } = req.body;
  
  const item = dados.escala_membros.find(
    em => em.escala_id === parseInt(escalaId) && em.membro_id === parseInt(membroId)
  );
  if (item) {
    item.status = status;
    salvarDados(dados);
    res.json({ sucesso: true });
  } else {
    res.status(404).json({ erro: 'Não encontrado' });
  }
});

// ==============================================
// ROTAS DE MATERIAIS / MÚSICAS
// ==============================================
app.get('/api/materiais', (req, res) => {
  const dados = lerDados();
  res.json(dados.materiais.filter(m => m.ativo !== false));
});

app.post('/api/materiais', (req, res) => {
  const dados = lerDados();
  const novo = { id: Date.now(), ...req.body, ativo: true };
  dados.materiais.push(novo);
  salvarDados(dados);
  res.json(novo);
});

app.put('/api/materiais/:id', (req, res) => {
  const dados = lerDados();
  const id = parseInt(req.params.id);
  const idx = dados.materiais.findIndex(m => m.id === id);
  if (idx !== -1) {
    dados.materiais[idx] = { ...dados.materiais[idx], ...req.body };
    salvarDados(dados);
    res.json(dados.materiais[idx]);
  } else {
    res.status(404).json({ erro: 'Não encontrado' });
  }
});

app.delete('/api/materiais/:id', (req, res) => {
  const dados = lerDados();
  const id = parseInt(req.params.id);
  const idx = dados.materiais.findIndex(m => m.id === id);
  if (idx !== -1) {
    dados.materiais[idx].ativo = false;
    salvarDados(dados);
    res.json({ sucesso: true });
  } else {
    res.status(404).json({ erro: 'Não encontrado' });
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
app.listen(PORTA, () => {
  console.log(`🚀 Servidor rodando na porta ${PORTA}`);
  console.log(`✅ Sistema pronto!`);
  console.log(`🔑 Líder: lider / 1234`);
  console.log(`🔑 Membro: membro / 1234`);
});
