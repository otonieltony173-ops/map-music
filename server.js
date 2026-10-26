const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');

const app = express();
const PORTA = process.env.PORT || 3000;

// ==============================================
// CONEXÃO
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
// ESCALA — FINAL traduzindo nomes do index para o banco
// ==============================================
app.get('/api/escala', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('escala')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.log('Erro ao carregar escala:', error);
      return res.json({});
    }
    
    // Converte nomes do banco para nomes que o index espera
    if (data) {
      res.json({
        id: data.id,
        dataExibicao: data.dataexibicao,
        local: data.Local,
        teclado: data.teclado,
        guitarra: data.guitarra,
        contrabaixo: data.contrabaixo,
        violao: data.violao,
        bateria: data.bateria,
        ministro: data.Ministro,
        backvocal: data.Backvocal,
        vocal: data.Vocal,
        lider: data.Lider,
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
    } else {
      res.json({ id: 1 });
    }
  } catch (erro) {
    console.log('Exceção ao carregar escala:', erro);
    res.json({ id: 1 });
  }
});

app.post('/api/escala', async (req, res) => {
  const dados = req.body;
  try {
    const { data, error } = await supabase
      .from('escala')
      .upsert({
        id: 1,
        dataexibicao: dados.dataExibicao || null,
        "Local": dados.local || null,
        teclado: dados.teclado || null,
        guitarra: dados.guitarra || null,
        contrabaixo: dados.contrabaixo || null,
        violao: dados.violao || null,
        bateria: dados.bateria || null,
        Ministro: dados.ministro || null,
        Backvocal: dados.backvocal || null,
        Vocal: dados.vocal || null,
        Lider: dados.lider || null,
        statusteclado: dados.statusTeclado || 'pendente',
        statusguitarra: dados.statusGuitarra || 'pendente',
        statuscontrabaixo: dados.statusContrabaixo || 'pendente',
        statusviolao: dados.statusViolao || 'pendente',
        statusbateria: dados.statusBateria || 'pendente',
        statusministro: dados.statusMinistro || 'pendente',
        statusbackvocal: dados.statusBackvocal || 'pendente',
        statusvocal: dados.statusVocal || 'pendente',
        statuslider: dados.statusLider || 'pendente',
        cultomusicas: dados.cultoMusicas || []
      }, { onConflict: 'id' });

    if (error) {
      console.log('Erro ao salvar escala:', error);
      return res.json({ sucesso: false, erro: error.message });
    }
    res.json({ sucesso: true, mensagem: 'Escala salva com sucesso!' });
  } catch (erro) {
    console.log('Exceção ao salvar escala:', erro);
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
