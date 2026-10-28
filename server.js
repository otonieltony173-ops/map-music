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
// MIDDLEWARES — CORRIGIDO AQUI ✅
// ==============================================
app.use(cors());
app.use(express.json());
// Servir arquivos da raiz do projeto
app.use(express.static(path.join(__dirname)));

// Rota principal — garante que index.html aparece ✅
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==============================================
// DADOS DE ACESSO
// ==============================================
const usuarios = [
  { usuario: 'lider', senha: 'lider123', nivel: 'lider' },
  { usuario: 'membro', senha: 'membro123', nivel: 'membro' }
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
// ROTAS — ESCALA
// ==============================================

app.get('/api/escala', async (req, res) => {
  const { data } = req.query;
  
  if (data) {
    const { data: escala, error } = await supabase
      .from('escala')
      .select('*')
      .eq('dataexibicao', data)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ erro: error.message });
    }
    
    if (!escala) {
      return res.json({
        dataexibicao: data,
        local: '',
        cultomusicas: [],
        teclado: '', guitarra: '', contrabaixo: '', violao: '', bateria: '', projecao: '',
        ministro: '', backvocal: '', vocal: '', lider: '',
        statusteclado: 'pendente', statusguitarra: 'pendente', statuscontrabaixo: 'pendente',
        statusviolao: 'pendente', statusbateria: 'pendente', statusprojecao: 'pendente',
        statusministro: 'pendente', statusbackvocal: 'pendente', statusvocal: 'pendente',
        statuslider: 'pendente'
      });
    }
    
    return res.json({
      id: escala.id,
      dataexibicao: escala.dataexibicao,
      local: escala.local || '',
      cultomusicas: escala.cultomusicas || [],
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
      statusteclado: escala.statusteclado || 'pendente',
      statusguitarra: escala.statusguitarra || 'pendente',
      statuscontrabaixo: escala.statuscontrabaixo || 'pendente',
      statusviolao: escala.statusviolao || 'pendente',
      statusbateria: escala.statusbateria || 'pendente',
      statusprojecao: escala.statusprojecao || 'pendente',
      statusministro: escala.statusministro || 'pendente',
      statusbackvocal: escala.statusbackvocal || 'pendente',
      statusvocal: escala.statusvocal || 'pendente',
      statuslider: escala.statuslider || 'pendente'
    });
  } else {
    const { data: escalas, error } = await supabase
      .from('escala')
      .select('id, dataexibicao, local, created_at')
      .order('dataexibicao', { ascending: false });
    
    if (error) {
      return res.status(500).json({ erro: error.message });
    }
    
    return res.json(escalas.map(e => ({
      id: e.id,
      dataexibicao: e.dataexibicao,
      local: e.local
    })));
  }
});

app.post('/api/escala', async (req, res) => {
  const {
    dataexibicao, local, cultomusicas,
    teclado, guitarra, contrabaixo, violao, bateria, projecao,
    ministro, backvocal, vocal, lider,
    statusteclado, statusguitarra, statuscontrabaixo, statusviolao,
    statusbateria, statusprojecao, statusministro, statusbackvocal,
    statusvocal, statuslider
  } = req.body;

  if (!dataexibicao) {
    return res.status(400).json({ sucesso: false, mensagem: 'Data é obrigatória!' });
  }

  const { data: existente } = await supabase
    .from('escala')
    .select('id')
    .eq('dataexibicao', dataexibicao)
    .single();

  const dados = {
    dataexibicao,
    local: local || '',
    cultomusicas: cultomusicas || [],
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
    statusteclado: statusteclado || 'pendente',
    statusguitarra: statusguitarra || 'pendente',
    statuscontrabaixo: statuscontrabaixo || 'pendente',
    statusviolao: statusviolao || 'pendente',
    statusbateria: statusbateria || 'pendente',
    statusprojecao: statusprojecao || 'pendente',
    statusministro: statusministro || 'pendente',
    statusbackvocal: statusbackvocal || 'pendente',
    statusvocal: statusvocal || 'pendente',
    statuslider: statuslider || 'pendente'
  };

  let resultado;
  if (existente) {
    resultado = await supabase
      .from('escala')
      .update(dados)
      .eq('id', existente.id)
      .select();
  } else {
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

app.delete('/api/escala/:data', async (req, res) => {
  const { data } = req.params;
  const { error } = await supabase
    .from('escala')
    .delete()
    .eq('dataexibicao', data);
  
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
