const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

// 🔐 COLOQUE SEUS DADOS AQUI
const INSTANCE_ID = "3F2203E24F1091863F1F62A6D661BA0A";
const TOKEN = "4A20206FA05E57A6E615C537";
const CLIENT_TOKEN = "F795495fcc59e4524970d1636b4d0b845S";

app.post("/webhook", async (req, res) => {
  try {
    console.log("Mensagem recebida:");

    const mensagem = req.body.text?.message;
    const telefone = req.body.phone;

    if (!mensagem) return res.sendStatus(200);

    let resposta = "";

    if (mensagem.toLowerCase() === "oi") {
      resposta = `Olá! 👋

Escolha uma opção:
1️⃣ Instalação
2️⃣ Manutenção
3️⃣ Limpeza`;
    } else if (mensagem === "1") {
      resposta = "Instalação: R$700 (até 3 metros de tubulação)";
    } else if (mensagem === "2") {
      resposta = "Manutenção: consulte valores";
    } else if (mensagem === "3") {
      resposta = "Limpeza: R$400";
    }

    if (resposta) {
      await axios.post(
        `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
        {
          phone: telefone,
          message: resposta
        },
        {
          headers: {
            "Client-Token": CLIENT_TOKEN
          }
        }
      );

      console.log("Resposta enviada ✅");
    }

    res.sendStatus(200);

  } catch (error) {
    console.log("Erro:", error.response?.data || error.message);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
