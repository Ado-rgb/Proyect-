const fs = require("fs");
const path = require("path");

const handler = async (msg, { conn }) => {
  try {
    const rawID = conn.user?.id || "";
    const subbotID = rawID.split(":")[0] + "@s.whatsapp.net";

    const prefixPath = path.resolve("prefixes.json");
    const menuConfigPath = path.resolve("setmenu.json");

    let prefixes = {};
    if (fs.existsSync(prefixPath)) {
      prefixes = JSON.parse(fs.readFileSync(prefixPath, "utf-8"));
    }

    const usedPrefix = prefixes[subbotID] || ".";

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "💥", key: msg.key }
    });

    let customData = {};
    if (fs.existsSync(menuConfigPath)) {
      customData = JSON.parse(fs.readFileSync(menuConfigPath, "utf8"));
    }

    const personal = customData[subbotID];
    const imageBuffer = personal?.imagen ? Buffer.from(personal.imagen, "base64") : null;
    const nombreMenu = personal?.nombre || "SYA SUBBOT";

    const caption = personal ? `
╭──❍ 𓂃 𝑺𝒖𝒃𝒃𝒐𝒕 𝑷𝒆𝒓𝒔𝒐𝒏𝒂𝒍𝒊𝒛𝒂𝒅𝒐 ❍──╮
│   𝙈𝙚𝙣𝙪́: *${nombreMenu}*
╰────────────────────────╯

🔹 Subbot conectado correctamente.
🔹 Disfruta de los comandos de música, juegos, IA y más.

┏━━🧠 𝗜𝗻𝘁𝗲𝗹𝗶𝗴𝗲𝗻𝗰𝗶𝗮
┃ ✦ ${usedPrefix}chatgpt
┃ ✦ ${usedPrefix}geminis
┗━━━━━━━━━━━━━━

┏━━📥 𝗗𝗲𝘀𝗰𝗮𝗿𝗴𝗮𝘀
┃ ✦ ${usedPrefix}play / playdoc
┃ ✦ ${usedPrefix}play2 / play2doc
┃ ✦ ${usedPrefix}ytmp3 / ytmp3doc
┃ ✦ ${usedPrefix}ytmp4 / ytmp4doc
┃ ✦ ${usedPrefix}apk / fb / ig / tt
┗━━━━━━━━━━━━━━

┏━━🎭 𝗠𝘂𝗹𝘁𝗶𝗺𝗲𝗱𝗶𝗮
┃ ✦ ${usedPrefix}s / ver / hd
┃ ✦ ${usedPrefix}toimg / toaudio / tts
┃ ✦ ${usedPrefix}whatmusic / perfil
┗━━━━━━━━━━━━━━

┏━━👥 𝗚𝗿𝘂𝗽𝗼𝘀
┃ ✦ ${usedPrefix}abrirgrupo / cerrargrupo
┃ ✦ ${usedPrefix}infogrupo / kick
┃ ✦ ${usedPrefix}modoadmins on/off
┃ ✦ ${usedPrefix}antilink on/off
┃ ✦ ${usedPrefix}welcome on/off
┃ ✦ ${usedPrefix}tagall / damelink
┃ ✦ ${usedPrefix}antidelete
┗━━━━━━━━━━━━━━

┏━━🎮 𝗝𝘂𝗲𝗴𝗼𝘀
┃ ✦ ${usedPrefix}kiss / slap
┃ ✦ ${usedPrefix}topkiss / topslap
┃ ✦ ${usedPrefix}verdad / reto
┗━━━━━━━━━━━━━━

┏━━⚙️ 𝗖𝗼𝗻𝗳𝗶𝗴𝘀 & 𝗗𝘂𝗲ñ𝗼
┃ ✦ ${usedPrefix}setprefix / ping
┃ ✦ ${usedPrefix}creador / get
┃ ✦ ${usedPrefix}addlista / dellista
┃ ✦ ${usedPrefix}addgrupo / delgrupo
┃ ✦ ${usedPrefix}setmenu / delmenu
┗━━━━━━━━━━━━━━

📌 *SYA SUBBOT* — Sistema de subbots.
`.trim() : `
⟪ 𝗠𝗘𝗡𝗨́ - SYA SUBBOT ⟫

🔸 Usa: *${usedPrefix}menurpg* para comenzar en el modo RPG
🔸 Invita a tus amigos a usar el subbot con: *${usedPrefix}serbot* o *${usedPrefix}code*

*🧠 IA & Chat:*
  ✦ ${usedPrefix}chatgpt
  ✦ ${usedPrefix}geminis

*📥 Descargas:*
  ✦ ${usedPrefix}play / playdoc
  ✦ ${usedPrefix}ytmp3 / ytmp3doc
  ✦ ${usedPrefix}ytmp4 / ytmp4doc
  ✦ ${usedPrefix}apk / ig / tt / fb

*🎭 Stickers & Multimedia:*
  ✦ ${usedPrefix}s / ver / hd
  ✦ ${usedPrefix}toimg / toaudio / whatmusic

*👥 Grupos:*
  ✦ ${usedPrefix}abrirgrupo / cerrargrupo
  ✦ ${usedPrefix}modoadmins on/off
  ✦ ${usedPrefix}tagall / damelink
  ✦ ${usedPrefix}infogrupo / kick

*🎮 Juegos:*
  ✦ ${usedPrefix}verdad / reto / kiss / slap

⚙️ Configuración:
  ✦ ${usedPrefix}setprefix
  ✦ ${usedPrefix}setmenu / delmenu
  ✦ ${usedPrefix}creador / ping

╚═⟪ SYA SUBBOT - Sistema ✅ ⟫═╝
`.trim();

    await conn.sendMessage(
      msg.key.remoteJid,
      {
        image: imageBuffer ? imageBuffer : { url: `https://cdn.russellxz.click/204a84cb.jpeg` },
        caption
      },
      { quoted: msg }
    );

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "✅", key: msg.key }
    });

  } catch (err) {
    console.error("❌ Error en el menú:", err);
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ Ocurrió un error mostrando el menú.",
      quoted: msg
    });
  }
};

handler.command = ['menu', 'help', 'ayuda', 'comandos'];
module.exports = handler;