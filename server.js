const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Z-API
const INSTANCE_ID = "F2203E24F1091863F1F62A6D661BA0A";
const TOKEN = "4A20206FA05E57A6E615C537";
const CLIENT_TOKEN = "F795495fcc59e4524970d1636b4d0b845S";

// 📞 SEU NÚMERO (com DDI)
const ADMIN = "552430273312";

// banco simples (arquivo)
const DB_FILE = "clientes.json";

// carregar clientes
let clientes = [];
if (fs.existsSync(DB_FILE)) {
  clientes = JSON.parse(fs.readFileSync(DB_FILE));
}

// salvar clientes
function salvarCliente(cliente) {
  clientes.push(cliente);
  fs.writeFileSync(DB_FILE, JSON.stringify(clientes, null, 2));
}

// enviar mensagem
async function enviarMensagem(phone, message) {
  await axios.post(
    `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
    { phone, message },
    { headers: { "Client-Token": CLIENT_TOKEN } }
  );
}

// agenda simples
function diasDisponiveis() {
  return `📅 *Dias disponíveis:*

- Segunda
- Terça
- Quarta
- Quinta
- Sexta`;
}

// memória
const usuarios = {};

app.post("/webhook", async (req, res) => {
  try {
    const phone = req.body.phone;
    const mensagem = (req.body.text?.message || "").toLowerCase();

    if (!phone) return res.sendStatus(200);

    if (!usuarios[phone]) {
      usuarios[phone] = { etapa: "menu", dados: {} };
    }

    const user = usuarios[phone];
    let resposta = "";

    // MENU
    if (mensagem.includes("oi") || mensagem.includes("menu")) {
      resposta = `👋 *Info & Clima*

Como podemos ajudar?

1️⃣ Instalação
2️⃣ Manutenção
3️⃣ Limpeza
4️⃣ Orçamento`;
      user.etapa = "menu";
    }

    // INSTALAÇÃO
    else if (mensagem === "1") {
      user.etapa = "bairro";
      user.tipo = "Instalação";
      resposta = "📍 Qual seu bairro?";
    }

    else if (user.etapa === "bairro") {
      user.dados.bairro = mensagem;
      user.etapa = "dia";
      resposta = diasDisponiveis();
    }

    else if (user.etapa === "dia") {
      user.dados.dia = mensagem;

      salvarCliente({
        telefone: phone,
        tipo: user.tipo,
        bairro: user.dados.bairro,
        dia: user.dados.dia
      });

      resposta = `✅ *Agendamento realizado!*

📍 Bairro: ${user.dados.bairro}
📅 Dia: ${user.dados.dia}

👨‍🔧 Entraremos em contato!`;

      // 🔔 notifica você
      await enviarMensagem(
        ADMIN,
        `📢 NOVO CLIENTE

📞 ${phone}
📍 ${user.dados.bairro}
📅 ${user.dados.dia}
🛠 ${user.tipo}`
      );

      user.etapa = "final";
    }

    // LIMPEZA
    else if (mensagem === "3") {
      user.tipo = "Limpeza";
      user.etapa = "bairro";
      resposta = "📍 Qual seu bairro?";
    }

    // MANUTENÇÃO
    else if (mensagem === "2") {
      user.tipo = "Manutenção";
      user.etapa = "bairro";
      resposta = "📍 Qual seu bairro?";
    }

    // ORÇAMENTO
    else if (mensagem === "4") {
      resposta = `📋 Envie:

📍 Bairro
❄️ BTUs
📸 Fotos

👨‍🔧 Vamos responder rápido!`;
    }

    else {
      resposta = "Digite *menu* para começar.";
    }

    await enviarMensagem(phone, resposta);
    res.sendStatus(200);

  } catch (err) {
    console.log(err.message);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});