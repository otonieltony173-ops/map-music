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
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log('⚠️ Variáveis de ambiente do Supabase não configuradas!');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    res.json({ sucesso: false, mensagem: 'Usuário ou senha incorretos' });
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

    if (error || !data) {
      return res.json({ id: 1 });
    }
    res.json(data);
  } catch {
    res.json({ id: 1 });
  }
});

app.post('/api/escala', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('escala')
      .upsert(req.body, { onConflict: 'id' });

    if (error) {
      console.log('ERRO SUPABASE:', error);
      return res.json({ sucesso: false, mensagem: error.message });
    }
    res.json({ sucesso: true, mensagem: 'Escala salva com sucesso!' });
  } catch (erro) {
    console.log('ERRO:', erro);
    res.json({ sucesso: false, mensagem: 'Erro ao salvar' });
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
  try {
    const { data, error } = await supabase.from('equipe').insert(req.body).select();
    res.json({ sucesso: true, data });
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
  try {
    const { data, error } = await supabase.from('repertorio').insert(req.body).select();
    res.json({ sucesso: true, data });
  } catch { res.json({ sucesso: false }); }
});

app.put('/api/repertorio/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('repertorio')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
    res.json({ sucesso: true, data });
  } catch { res.json({ sucesso: false }); }
});

app.delete('/api/repertorio/:id', async (req, res) => {
  try {
    await supabase.from('repertorio').delete().eq('id', req.params.id);
    res.json({ sucesso: true });
  } catch { res.json({ sucesso: false }); }
});

// ==============================================
// INICIAR SERVIDOR
// ==============================================
app.listen(PORTA, () => {
  console.log(`🚀 Servidor rodando na porta ${PORTA}`);
});
