const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORTA = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const ARQUIVO_DADOS = path.join(__dirname, 'dados.json');

function lerDados() {
    if (!fs.existsSync(ARQUIVO_DADOS)) {
        return {
            usuarios: [
                { usuario: 'lider', senha: '1234', nivel: 'admin' },
                { usuario: 'membro', senha: '123456', nivel: 'membro' }
            ],
            escala: {
                dataExibicao: '',
                local: '',
                ministro: '',
                backvocal: '',
                teclado: '',
                guitarra: '',
                violao: '',
                contrabaixo: '',
                bateria: '',
                lider: '',
                musicasDaEscala: [],
                statusMinistro: 'pendente',
                statusBackvocal: 'pendente',
                statusTeclado: 'pendente',
                statusGuitarra: 'pendente',
                statusViolao: 'pendente',
                statusContrabaixo: 'pendente',
                statusBateria: 'pendente',
                statusLider: 'pendente'
            },
            equipe: [],
            repertorio: []
        };
    }
    try {
        return JSON.parse(fs.readFileSync(ARQUIVO_DADOS, 'utf8'));
    } catch {
        return {
            usuarios: [
                { usuario: 'lider', senha: '1234', nivel: 'admin' },
                { usuario: 'membro', senha: '123456', nivel: 'membro' }
            ],
            escala: {},
            equipe: [],
            repertorio: []
        };
    }
}

function salvarDados(dados) {
    fs.writeFileSync(ARQUIVO_DADOS, JSON.stringify(dados, null, 2));
}

// LOGIN
app.post('/api/login', (req, res) => {
    const { usuario, senha } = req.body;
    const dados = lerDados();
    const achou = dados.usuarios.find(u => u.usuario === usuario && u.senha === senha);
    if (achou) {
        res.json({ sucesso: true, usuario: achou.usuario, nivel: achou.nivel });
    } else {
        res.json({ sucesso: false, mensagem: 'Usuário ou senha incorretos' });
    }
});

// ESCALA — CARREGAR
app.get('/api/escala', (req, res) => {
    const dados = lerDados();
    res.json(dados.escala || {});
});

// ESCALA — SALVAR TUDO
app.post('/api/escala', (req, res) => {
    const dados = lerDados();
    dados.escala = { ...dados.escala, ...req.body };
    salvarDados(dados);
    res.json({ sucesso: true });
});

// ATUALIZAR SÓ O STATUS DE PRESENÇA
app.post('/api/escala/status', (req, res) => {
    const { cargo, status } = req.body;
    const dados = lerDados();
    if (!dados.escala) dados.escala = {};
    
    const chave = 'status' + cargo.charAt(0).toUpperCase() + cargo.slice(1);
    dados.escala[chave] = status;
    
    salvarDados(dados);
    res.json({ sucesso: true });
});

// EQUIPE
app.get('/api/equipe', (req, res) => {
    res.json(lerDados().equipe);
});

app.post('/api/equipe', (req, res) => {
    const dados = lerDados();
    dados.equipe.push({ id: Date.now(), ...req.body });
    salvarDados(dados);
    res.json({ sucesso: true });
});

app.delete('/api/equipe/:id', (req, res) => {
    const dados = lerDados();
    dados.equipe = dados.equipe.filter(m => m.id !== parseInt(req.params.id));
    salvarDados(dados);
    res.json({ sucesso: true });
});

// REPERTÓRIO / MATERIAIS
app.get('/api/repertorio', (req, res) => {
    res.json(lerDados().repertorio);
});

app.post('/api/repertorio', (req, res) => {
    const dados = lerDados();
    dados.repertorio.push({ id: Date.now(), ...req.body });
    salvarDados(dados);
    res.json({ sucesso: true });
});

app.put('/api/repertorio/:id', (req, res) => {
    const dados = lerDados();
    const musica = dados.repertorio.find(m => m.id === parseInt(req.params.id));
    if (musica) {
        Object.assign(musica, req.body);
        salvarDados(dados);
    }
    res.json({ sucesso: true });
});

app.delete('/api/repertorio/:id', (req, res) => {
    const dados = lerDados();
    dados.repertorio = dados.repertorio.filter(m => m.id !== parseInt(req.params.id));
    salvarDados(dados);
    res.json({ sucesso: true });
});

app.listen(PORTA, () => {
    console.log(`✅ Servidor rodando na porta ${PORTA}`);
});
