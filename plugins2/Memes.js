const hispamemes = require("hispamemes");

const handler = async (msg, { conn }) => {
  try {
    const meme = hispamemes.meme();

    // Reacción inicial mientras carga
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "🕒", key: msg.key }
    });

    // Caption con diseño limpio, moderno y representando al team
    const caption = `
╭─────────────
│ 🔱 *SYA Team Subbot*  
│ 📸 *Meme aleatorio cargado con flow*
│  
│ 😹 *¿Te gustó?*
│ 🔁 Usa *.meme* otra vez pa otro
│ 🌐 Fuente: *Hispamemes API*
╰─────────────
`.trim();

    // Enviar el meme
    await conn.sendMessage(msg.key.remoteJid, {
      image: { url: meme },
      caption,
      mimetype: 'image/jpeg'
    }, { quoted: msg });

    // Reacción final de éxito
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "✅", key: msg.key }
    });

  } catch (e) {
    console.error("❌ Error en el comando .meme:", e);

    // Mensaje de error pa no dejar callado al bot
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ *Ocurrió un error al obtener el meme.*\n📌 Intenta de nuevo más tarde o verifica conexión.",
      quoted: msg
    });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "❌", key: msg.key }
    });
  }
};

handler.command = ['meme', 'memes'];
module.exports = handler;