const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');

const app = express();
const PORTA = process.env.PORT || 3000;

// ==============================================
// CONEXÃO COM SUPABASE
// ==============================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log('⚠️ Variáveis de ambiente não configuradas!');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Teste de conexão
(async () => {
  try {
    const { data, error } = await supabase.from('escala').select('id').limit(1);
    if (error) console.log('⚠️ Tabela escala ainda vazia ou sem permissão');
    else console.log('✅ Conectado ao Supabase com sucesso!');
  } catch(e) {
    console.log('Erro de conexão:', e.message);
  }
})();

// ==============================================
// MIDDLEWARES
// ==============================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==============================================
// DADOS DE ACESSO (simples — pode mover para tabela depois)
// ==============================================
const usuarios = [
  { usuario: 'lider', senha: 'lider123', nivel: 'lider' },
  { usuario: 'membro', senha: 'membro123', nivel: 'membro' }
  // Adicione outros aqui se precisar
];

// ==============================================
// ROTAS DE AUTENTICAÇÃO
// ==============================================
app.post('/api/login', async (req, res) => {
  const { usuario, senha } = req.body;
  const u = usuarios.find(x => x.usuario === usuario && x.senha === senha);
  
  if (u) {
    res.json({ sucesso: true, usuario: u.usuario, nivel: u.nivel });
  } else {
    res.json({ sucesso: false, mensagem: 'Usuário ou senha incorretos!' });
  }
});

// ==============================================
// ROTAS — VÁRIAS ESCALAS
// ==============================================

// Listar TODAS as escalas
app.get('/api/escala', async (req, res) => {
  const { data } = req.query;
  
  if (data) {
    // Buscar uma escala específica pela data
    const { data: escala, error } = await supabase
      .from('escala')
      .select('*')
      .eq('data_exibicao', data)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ erro: error.message });
    }
    
    if (!escala) {
      return res.json({
        dataExibicao: data,
        local: '',
        cultoMusicas: [],
        teclado: '', guitarra: '', contrabaixo: '', violao: '', bateria: '', projecao: '',
        ministro: '', backvocal: '', vocal: '', lider: '',
        statusTeclado: 'pendente', statusGuitarra: 'pendente', statusContrabaixo: 'pendente',
        statusViolao: 'pendente', statusBateria: 'pendente', statusProjecao: 'pendente',
        statusMinistro: 'pendente', statusBackvocal: 'pendente', statusVocal: 'pendente',
        statusLider: 'pendente'
      });
    }
    
    return res.json({
      id: escala.id,
      dataExibicao: escala.data_exibicao,
      local: escala.local || '',
      cultoMusicas: escala.culto_musicas || [],
      teclado: escala.teclado || '',
      guitarra: escala.guitarra || '',
      contrabaixo: escala.contrabaixo || '',
      violao: escala.violao || '',
      bateria: escala.bateria || '',
      projecao: escala.projecao || '',
      ministro: escala.ministro || '',
      backvocal: escala.backvocal || '',
      vocal: escala.vocal || '',
      lider: escala.lider || '',
      statusTeclado: escala.status_teclado || 'pendente',
      statusGuitarra: escala.status_guitarra || 'pendente',
      statusContrabaixo: escala.status_contrabaixo || 'pendente',
      statusViolao: escala.status_violao || 'pendente',
      statusBateria: escala.status_bateria || 'pendente',
      statusProjecao: escala.status_projecao || 'pendente',
      statusMinistro: escala.status_ministro || 'pendente',
      statusBackvocal: escala.status_backvocal || 'pendente',
      statusVocal: escala.status_vocal || 'pendente',
      statusLider: escala.status_lider || 'pendente'
    });
  } else {
    // Listar todas as escalas
    const { data: escalas, error } = await supabase
      .from('escala')
      .select('id, data_exibicao, local, created_at')
      .order('data_exibicao', { ascending: false });
    
    if (error) {
      return res.status(500).json({ erro: error.message });
    }
    
    return res.json(escalas.map(e => ({
      id: e.id,
      dataExibicao: e.data_exibicao,
      local: e.local
    })));
  }
});

// Salvar/Atualizar escala
app.post('/api/escala', async (req, res) => {
  const {
    dataExibicao, local, cultoMusicas,
    teclado, guitarra, contrabaixo, violao, bateria, projecao,
    ministro, backvocal, vocal, lider,
    statusTeclado, statusGuitarra, statusContrabaixo, statusViolao,
    statusBateria, statusProjecao, statusMinistro, statusBackvocal,
    statusVocal, statusLider
  } = req.body;

  if (!dataExibicao) {
    return res.status(400).json({ sucesso: false, mensagem: 'Data é obrigatória!' });
  }

  // Verificar se já existe para essa data
  const { data: existente } = await supabase
    .from('escala')
    .select('id')
    .eq('data_exibicao', dataExibicao)
    .single();

  const dados = {
    data_exibicao: dataExibicao,
    local: local || '',
    culto_musicas: cultoMusicas || [],
    teclado: teclado || '',
    guitarra: guitarra || '',
    contrabaixo: contrabaixo || '',
    violao: violao || '',
    bateria: bateria || '',
    projecao: projecao || '',
    ministro: ministro || '',
    backvocal: backvocal || '',
    vocal: vocal || '',
    lider: lider || '',
    status_teclado: statusTeclado || 'pendente',
    status_guitarra: statusGuitarra || 'pendente',
    status_contrabaixo: statusContrabaixo || 'pendente',
    status_violao: statusViolao || 'pendente',
    status_bateria: statusBateria || 'pendente',
    status_projecao: statusProjecao || 'pendente',
    status_ministro: statusMinistro || 'pendente',
    status_backvocal: statusBackvocal || 'pendente',
    status_vocal: statusVocal || 'pendente',
    status_lider: statusLider || 'pendente'
  };

  let resultado;
  if (existente) {
    // Atualizar
    resultado = await supabase
      .from('escala')
      .update(dados)
      .eq('id', existente.id)
      .select();
  } else {
    // Criar nova
    resultado = await supabase
      .from('escala')
      .insert(dados)
      .select();
  }

  if (resultado.error) {
    console.log('Erro ao salvar escala:', resultado.error);
    return res.json({ sucesso: false, mensagem: 'Erro ao salvar!' });
  }

  res.json({ sucesso: true, mensagem: 'Escala salva!', dados: resultado.data?.[0] });
});

// Excluir escala
app.delete('/api/escala/:data', async (req, res) => {
  const { data } = req.params;
  const { error } = await supabase
    .from('escala')
    .delete()
    .eq('data_exibicao', data);
  
  if (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
  res.json({ sucesso: true });
});

// ==============================================
// ROTAS — EQUIPE
// ==============================================
app.get('/api/equipe', async (req, res) => {
  const { data: membros, error } = await supabase.from('equipe').select('*').order('nome');
  if (error) return res.status(500).json([]);
  res.json(membros || []);
});

app.post('/api/equipe', async (req, res) => {
  const { nome, funcao } = req.body;
  const { data, error } = await supabase.from('equipe').insert({ nome, funcao }).select();
  if (error) return res.status(500).json({ erro: error.message });
  res.json({ sucesso: true, dados: data?.[0] });
});

app.delete('/api/equipe/:id', async (req, res) => {
  const { id } = req.params;
  await supabase.from('equipe').delete().eq('id', id);
  res.json({ sucesso: true });
});

// ==============================================
// ROTAS — REPERTÓRIO
// ==============================================
app.get('/api/repertorio', async (req, res) => {
  const { data: musicas, error } = await supabase.from('repertorio').select('*').order('nome');
  if (error) return res.status(500).json([]);
  res.json(musicas || []);
});

app.post('/api/repertorio', async (req, res) => {
  const { nome, link, ensaiada } = req.body;
  const { data, error } = await supabase.from('repertorio').insert({ nome, link, ensaiada }).select();
  if (error) return res.status(500).json({ erro: error.message });
  res.json({ sucesso: true, dados: data?.[0] });
});

app.put('/api/repertorio/:id', async (req, res) => {
  const { id } = req.params;
  const { ensaiada } = req.body;
  await supabase.from('repertorio').update({ ensaiada }).eq('id', id);
  res.json({ sucesso: true });
});

app.delete('/api/repertorio/:id', async (req, res) => {
  const { id } = req.params;
  await supabase.from('repertorio').delete().eq('id', id);
  res.json({ sucesso: true });
});

// ==============================================
// INICIAR SERVIDOR
// ==============================================
app.listen(PORTA, () => {
  console.log(`🚀 Servidor rodando na porta ${PORTA}`);
});
