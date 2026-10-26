const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');

const app = express();
const PORTA = process.env.PORT || 3000;

// ==============================================
// CONEXÃO — usando os nomes que JÁ estão no Render ✅
// ==============================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

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
    const { data } = await supabase
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
    const { data } = await supabase
      .from('escala')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (!data) return res.json({ id: 1 });

    res.json({
      id: data.id,
      dataExibicao: data.dataexibicao,
      local: data.local,
      teclado: data.teclado,
      guitarra: data.guitarra,
      contrabaixo: data.contrabaixo,
      violao: data.violao,
      bateria: data.bateria,
      ministro: data.ministro,
      backvocal: data.backvocal,
      vocal: data.vocal,
      lider: data.lider,
      statusTeclado: data.statusteclado || 'pendente',
      statusGuitarra: data.statusguitarra || 'pendente',
      statusContrabaixo: data.statuscontrabaixo || 'pendente',
      statusViolao: data.statusviolao || 'pendente',
      statusBateria: data.statusbateria || 'pendente',
      statusMinistro: data.statusministro || 'pendente',
      statusBackvocal: data.statusbackvocal || 'pendente',
      statusVocal: data.statusvocal || 'pendente',
      statusLider: data.statuslider || 'pendente',
      cultoMusicas: data.cultomusicas || []
    });
  } catch {
    res.json({ id: 1 });
  }
});

app.post('/api/escala', async (req, res) => {
  try {
    const d = req.body;
    
    const { data, error } = await supabase.from('escala').upsert({
      id: 1,
      dataexibicao: d.dataExibicao,
      local: d.local,
      teclado: d.teclado,
      guitarra: d.guitarra,
      contrabaixo: d.contrabaixo,
      violao: d.violao,
      bateria: d.bateria,
      ministro: d.ministro,
      backvocal: d.backvocal,
      vocal: d.vocal,
      lider: d.lider,
      statusteclado: d.statusTeclado,
      statusguitarra: d.statusGuitarra,
      statuscontrabaixo: d.statusContrabaixo,
      statusviolao: d.statusViolao,
      statusbateria: d.statusBateria,
      statusministro: d.statusMinistro,
      statusbackvocal: d.statusBackvocal,
      statusvocal: d.statusVocal,
      statuslider: d.statusLider,
      cultomusicas: d.cultoMusicas
    }, { onConflict: 'id' }).select();

    if (error) {
      console.log('❌ ERRO:', error);
      return res.json({ sucesso: false, mensagem: error.message });
    }
    
    res.json({ sucesso: true, mensagem: '✅ Escala salva com sucesso!' });
  } catch (erro) {
    console.log('❌ EXCEÇÃO:', erro);
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
    if (error) throw error;
    res.json({ sucesso: true, data });
  } catch (erro) {
    console.log('Erro ao salvar membro:', erro);
    res.json({ sucesso: false });
  }
});

app.delete('/api/equipe/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('equipe').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ sucesso: true });
  } catch { res.json({ sucesso: false }); }
});

// ==============================================
// REPERTÓRIO / MATERIAIS
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
    if (error) throw error;
    res.json({ sucesso: true, data });
  } catch (erro) {
    console.log('Erro ao salvar música:', erro);
    res.json({ sucesso: false });
  }
});

app.put('/api/repertorio/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('repertorio')
      .update(req.body)
      .eq('id', req.params.id)
      .select();
    if (error) throw error;
    res.json({ sucesso: true, data });
  } catch { res.json({ sucesso: false }); }
});

app.delete('/api/repertorio/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('repertorio').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ sucesso: true });
  } catch { res.json({ sucesso: false }); }
});

// ==============================================
// INICIAR SERVIDOR
// ==============================================
app.listen(PORTA, () => {
  console.log(`🚀 Servidor rodando na porta ${PORTA}`);
});
