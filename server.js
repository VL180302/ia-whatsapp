const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Z-API
const INSTANCE_ID = "3F2203E24F1091863F1F62A6D661BA0A";
const TOKEN = "4A20206FA05E57A6E615C537";
const CLIENT_TOKEN = "F795495fcc59e4524970d1636b4d0b845S";

// memória simples
const usuarios = {};

async function enviarMensagem(phone, message) {
  await axios.post(
    `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
    { phone, message },
    {
      headers: {
        "Client-Token": CLIENT_TOKEN
      }
    }
  );
}

function menu() {
  return `👋 *Info & Clima*

Como podemos te ajudar? ❄️

1️⃣ Instalação
2️⃣ Manutenção
3️⃣ Limpeza
4️⃣ Orçamento

Digite o número 👇`;
}

app.post("/webhook", async (req, res) => {
  try {
    const phone = req.body.phone;
    const mensagem = (req.body.text?.message || "").toLowerCase();

    if (!phone) return res.sendStatus(200);

    if (!usuarios[phone]) {
      usuarios[phone] = { etapa: "inicio" };
    }

    const user = usuarios[phone];
    let resposta = "";

    if (mensagem.includes("oi") || mensagem.includes("olá") || mensagem === "menu") {
      user.etapa = "menu";
      resposta = menu();
    }

    else if (mensagem === "1" || mensagem.includes("instala")) {
      user.etapa = "instalacao";
      resposta = `🔧 *Instalação*

💰 R$700 (até 3 metros)

Me envie:
📍 Bairro
🏠 Casa ou apartamento
❄️ BTUs`;
    }

    else if (mensagem === "2" || mensagem.includes("manutenção")) {
      user.etapa = "manutencao";
      resposta = `🛠️ *Manutenção*

Descreva o problema:
(ex: não gela, vazando)

📍 Informe seu bairro`;
    }

    else if (mensagem === "3" || mensagem.includes("limpeza")) {
      user.etapa = "limpeza";
      resposta = `🧼 *Limpeza*

💰 R$400

📍 Bairro
📆 Dia desejado`;
    }

    else if (mensagem === "4" || mensagem.includes("orçamento") || mensagem.includes("orcamento")) {
      user.etapa = "orcamento";
      resposta = `📋 *Orçamento*

Envie:

📍 Bairro  
❄️ BTUs  
🏠 Casa/apto  
📏 Distância`;
    }

    else if (user.etapa !== "inicio") {
      resposta = `Perfeito 👍

👨‍🔧 Um atendente vai continuar com você em breve.`;
      user.etapa = "final";
    }

    else {
      resposta = "Digite *menu* para ver as opções.";
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