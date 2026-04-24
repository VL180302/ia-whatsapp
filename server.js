const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Z-API
const INSTANCE_ID = "F2203E24F1091863F1F62A6D661BA0A";
const TOKEN = "4A20206FA05E57A6E615C537";
const CLIENT_TOKEN = "F795495fcc59e4524970d1636b4d0b845S";

// memória de usuários
const usuarios = {};

// enviar mensagem
async function enviarMensagem(phone, message) {
  await axios.post(
    `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}/send-text`,
    { phone, message },
    {
      headers: { "Client-Token": CLIENT_TOKEN }
    }
  );
}

// menu bonito
function menu() {
  return `👋 *Info & Clima ❄️*

Atendimento especializado em ar-condicionado.

Como podemos te ajudar hoje?

━━━━━━━━━━━━━━━
1️⃣ Instalação  
2️⃣ Manutenção  
3️⃣ Limpeza  
4️⃣ Orçamento  
━━━━━━━━━━━━━━━

Digite o número da opção 👇`;
}

// webhook
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
    if (mensagem.includes("oi") || mensagem.includes("olá") || mensagem === "menu") {
      user.etapa = "menu";
      resposta = menu();
    }

    // INSTALAÇÃO
    else if (mensagem === "1" || mensagem.includes("instala")) {
      user.etapa = "inst_bairro";
      resposta = `🔧 *Instalação de Ar*

💰 Valor: *R$700* (até 3 metros)

Para continuar, me informe seu *bairro* 📍`;
    }

    else if (user.etapa === "inst_bairro") {
      user.dados.bairro = mensagem;
      user.etapa = "inst_tipo";
      resposta = "🏠 É casa ou apartamento?";
    }

    else if (user.etapa === "inst_tipo") {
      user.dados.tipo = mensagem;
      user.etapa = "inst_btus";
      resposta = "❄️ Qual a potência do ar (BTUs)?";
    }

    else if (user.etapa === "inst_btus") {
      user.dados.btus = mensagem;
      user.etapa = "confirmar";

      resposta = `✅ *Resumo do pedido*

📍 Bairro: ${user.dados.bairro}
🏠 Tipo: ${user.dados.tipo}
❄️ BTUs: ${user.dados.btus}

Confirmar atendimento?

1️⃣ Sim  
2️⃣ Não`;
    }

    // LIMPEZA
    else if (mensagem === "3" || mensagem.includes("limpeza")) {
      user.etapa = "limp_bairro";
      resposta = `🧼 *Limpeza de Ar*

💰 Valor: *R$400*

📍 Qual seu bairro?`;
    }

    else if (user.etapa === "limp_bairro") {
      user.dados.bairro = mensagem;
      user.etapa = "limp_dia";
      resposta = "📆 Qual dia deseja o serviço?";
    }

    else if (user.etapa === "limp_dia") {
      user.dados.dia = mensagem;
      user.etapa = "confirmar";

      resposta = `✅ *Resumo do pedido*

📍 Bairro: ${user.dados.bairro}
📆 Dia: ${user.dados.dia}

Confirmar?

1️⃣ Sim  
2️⃣ Não`;
    }

    // MANUTENÇÃO
    else if (mensagem === "2" || mensagem.includes("manutenção")) {
      user.etapa = "man_desc";
      resposta = `🛠️ *Manutenção*

Descreva o problema 👇  
(ex: não gela, vazando água)`;
    }

    else if (user.etapa === "man_desc") {
      user.dados.problema = mensagem;
      user.etapa = "man_bairro";
      resposta = "📍 Qual seu bairro?";
    }

    else if (user.etapa === "man_bairro") {
      user.dados.bairro = mensagem;
      user.etapa = "confirmar";

      resposta = `✅ *Resumo do pedido*

📍 Bairro: ${user.dados.bairro}
⚠️ Problema: ${user.dados.problema}

Confirmar?

1️⃣ Sim  
2️⃣ Não`;
    }

    // CONFIRMAÇÃO
    else if (user.etapa === "confirmar" && mensagem === "1") {
      resposta = `🎉 *Pedido confirmado!*

👨‍🔧 Um técnico irá entrar em contato em breve.

Obrigado por escolher a *Info & Clima* ❄️`;
      user.etapa = "final";
    }

    else if (user.etapa === "confirmar" && mensagem === "2") {
      user.etapa = "menu";
      user.dados = {};
      resposta = "Tudo bem 👍 vamos começar novamente.\n\n" + menu();
    }

    // ORÇAMENTO
    else if (mensagem === "4" || mensagem.includes("orçamento")) {
      resposta = `📋 *Orçamento*

Envie:

📍 Bairro  
❄️ BTUs  
🏠 Tipo (casa/apto)  
📸 Fotos do local

👨‍🔧 Vamos analisar e te responder rápido!`;
    }

    // fallback
    else {
      resposta = "Não entendi 🤔\nDigite *menu* para ver as opções.";
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