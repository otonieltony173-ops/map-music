const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');

const app = express();
const PORTA = process.env.PORT || 3000;

// ==============================================
// CONEXÃO — PELAS VARIÁVEIS DE AMBIENTE
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
    const { error } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
    if (error && error.code === 'PGRST116') {
      console.log('⚠️ Tabelas ainda não criadas');
    } else if (!error) {
      console.log('✅ Conectado ao Supabase com sucesso!');
    }
  } catch (e) {
    console.log('ℹ️ Aguardando configuração...');
  }
})();

// ==============================================
// CONFIGURAÇÕES
// ==============================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// ==============================================
// LOGIN
// ==============================================
app.post('/api/login', async (req, res) => {
  const { usuario, senha } = req.body;
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('usuario', usuario)
      .eq('senha', senha)
      .single();

    if (data) {
      res.json({ sucesso: true, usuario: data.usuario, nivel: data.nivel });
    } else {
      res.json({ sucesso: false, mensagem: 'Usuário ou senha incorretos' });
    }
  } catch {
    res.json({ sucesso: false, mensagem: 'Erro no servidor' });
  }
});

// ==============================================
// ESCALA
// ==============================================
app.get('/api/escala', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('escala')
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code === 'PGRST116') return res.json({});
    res.json(data || {});
  } catch {
    res.json({});
  }
});

app.post('/api/escala', async (req, res) => {
  const dados = req.body;
  try {
    const { error } = await supabase.from('escala').upsert({
      id: 1,
      dataExibicao: dados.dataExibicao,
      local: dados.local,
      teclado: dados.teclado,
      guitarra: dados.guitarra,
      contrabaixo: dados.contrabaixo,
      violao: dados.violao,
      bateria: dados.bateria,
      ministro: dados.ministro,
      backvocal: dados.backvocal,
      vocal: dados.vocal,
      lider: dados.lider,
      statusTeclado: dados.statusTeclado,
      statusGuitarra: dados.statusGuitarra,
      statusContrabaixo: dados.statusContrabaixo,
      statusViolao: dados.statusViolao,
      statusBateria: dados.statusBateria,
      statusMinistro: dados.statusMinistro,
      statusBackvocal: dados.statusBackvocal,
      statusVocal: dados.statusVocal,
      statusLider: dados.statusLider,
      cultoMusicas: dados.cultoMusicas || []
    });
    res.json(error ? { sucesso: false } : { sucesso: true });
  } catch {
    res.json({ sucesso: false });
  }
});

// ==============================================
// EQUIPE
// ==============================================
app.get('/api/equipe', async (req, res) => {
  try {
    const { data } = await supabase.from('equipe').select('*').order('id');
    res.json(data || []);
  } catch { res.json([]); }
});

app.post('/api/equipe', async (req, res) => {
  const { nome, funcao } = req.body;
  try {
    await supabase.from('equipe').insert({ nome, funcao });
    res.json({ sucesso: true });
  } catch { res.json({ sucesso: false }); }
});

app.delete('/api/equipe/:id', async (req, res) => {
  try {
    await supabase.from('equipe').delete().eq('id', req.params.id);
    res.json({ sucesso: true });
  } catch { res.json({ sucesso: false }); }
});

// ==============================================
// REPERTÓRIO
// ==============================================
app.get('/api/repertorio', async (req, res) => {
  try {
    const { data } = await supabase.from('repertorio').select('*').order('id');
    res.json(data || []);
  } catch { res.json([]); }
});

app.post('/api/repertorio', async (req, res) => {
  const { nome, link, ensaiada } = req.body;
  try {
    await supabase.from('repertorio').insert({ nome, link, ensaiada: ensaiada || 0 });
    res.json({ sucesso: true });
  } catch { res.json({ sucesso: false }); }
});

app.put('/api/repertorio/:id', async (req, res) => {
  const { ensaiada } = req.body;
  try {
    await supabase.from('repertorio').update({ ensaiada }).eq('id', req.params.id);
    res.json({ sucesso: true });
  } catch { res.json({ sucesso: false }); }
});

app.delete('/api/repertorio/:id', async (req, res) => {
  try {
    await supabase.from('repertorio').delete().eq('id', req.params.id);
    res.json({ sucesso: true });
  } catch { res.json({ sucesso: false }); }
});

// ==============================================
// INICIAR
// ==============================================
app.listen(PORTA, () => {
  console.log(`🚀 Servidor rodando na porta ${PORTA}`);
});
