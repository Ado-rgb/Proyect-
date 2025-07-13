const fs = require("fs");
const path = require("path");

const handler = async (msg, { conn, args }) => {
  const chatId = msg.key.remoteJid;
  const senderId = msg.key.participant || msg.key.remoteJid;
  const senderClean = senderId.replace(/[^0-9]/g, "");
  const isGroup = chatId.endsWith("@g.us");

  if (!isGroup) {
    await conn.sendMessage(chatId, {
      text: "❌ *Este comando solo funciona en grupos.*"
    }, { quoted: msg });
    return;
  }

  const metadata = await conn.groupMetadata(chatId);
  const participante = metadata.participants.find(p => p.id === senderId);
  const isAdmin = participante?.admin === "admin" || participante?.admin === "superadmin";
  const isOwner = global.owner.some(([id]) => id === senderClean);
  const isFromMe = msg.key.fromMe;

  if (!isAdmin && !isOwner && !isFromMe) {
    await conn.sendMessage(chatId, {
      text: "🚫 *Solo administradores y dueños pueden usar este comando.*"
    }, { quoted: msg });
    return;
  }

  if (!args[0]) {
    await conn.sendMessage(chatId, {
      text: `
⚙️ *Uso correcto:*

*abrir 10s*  → Abrir grupo en 10 segundos ⏳  
*abrir 10m*  → Abrir grupo en 10 minutos ⏰  
*abrir 1h*   → Abrir grupo en 1 hora 🕐  
`.trim()
    }, { quoted: msg });
    return;
  }

  const match = args[0].match(/^(\d+)([smh])$/i);
  if (!match) {
    await conn.sendMessage(chatId, {
      text: "❌ *Formato inválido.* Usa: abrir 10s | abrir 10m | abrir 1h"
    }, { quoted: msg });
    return;
  }

  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  let milliseconds = 0;

  if (unit === "s") milliseconds = amount * 1000;
  else if (unit === "m") milliseconds = amount * 60 * 1000;
  else if (unit === "h") milliseconds = amount * 60 * 60 * 1000;

  if (milliseconds <= 0) {
    await conn.sendMessage(chatId, {
      text: "❌ *Tiempo inválido.*"
    }, { quoted: msg });
    return;
  }

  const tiempoPath = path.resolve("./tiempo2.json");
  if (!fs.existsSync(tiempoPath)) {
    fs.writeFileSync(tiempoPath, JSON.stringify({}, null, 2));
  }

  const tiempoData = JSON.parse(fs.readFileSync(tiempoPath, "utf-8"));
  const ahora = Date.now();
  tiempoData[chatId] = ahora + milliseconds;
  fs.writeFileSync(tiempoPath, JSON.stringify(tiempoData, null, 2));

  await conn.sendMessage(chatId, {
    text: `
⏳ *Grupo programado para abrirse automáticamente en:*  
*${amount}${unit.toUpperCase()}* ✅  
*SYA TEAM BOT* 🔥`.trim()
  }, { quoted: msg });

  await conn.sendMessage(chatId, {
    react: { text: "✅", key: msg.key }
  });
};

handler.command = ["abrir"];
module.exports = handler;