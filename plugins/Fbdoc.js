const axios = require("axios");
const fs = require("fs");
const path = require("path");

const handler = async (msg, { conn, text, command }) => {
  const chatId = msg.key.remoteJid;

  if (!text) {
    return await conn.sendMessage(chatId, {
      text: `⚠️ *Uso inválido.*\nEnvía un enlace válido de Facebook.\n\nEjemplo:\n📌 *${global.prefix + command}* https://fb.watch/ncowLHMp-x/`
    }, { quoted: msg });
  }

  if (!text.match(/(facebook\.com|fb\.watch)/i)) {
    return await conn.sendMessage(chatId, {
      text: `❌ *Este no es un enlace válido de Facebook.*\n\nIntenta con algo como:\n📌 *${global.prefix + command}* https://fb.watch/ncowLHMp-x/`
    }, { quoted: msg });
  }

  await conn.sendMessage(chatId, {
    react: { text: "⏳", key: msg.key }
  });

  try {
    const { data } = await axios.get(`https://api.dorratz.com/fbvideo?url=${encodeURIComponent(text)}`);

    if (!data || !Array.isArray(data) || data.length === 0 || !data[0].url) {
      return await conn.sendMessage(chatId, {
        text: "⚠️ No se encontró el video o está inaccesible."
      }, { quoted: msg });
    }

    const videoUrl = data[0].url;

    const tmpDir = path.resolve("./tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    const fileName = `fb_${Date.now()}.mp4`;
    const filePath = path.join(tmpDir, fileName);

    const videoStream = await axios.get(videoUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(filePath);

    await new Promise((resolve, reject) => {
      videoStream.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    if (!fs.existsSync(filePath)) {
      return await conn.sendMessage(chatId, {
        text: "❌ Falló la descarga del archivo. Intenta de nuevo."
      }, { quoted: msg });
    }

    const stats = fs.statSync(filePath);
    const sizeMB = stats.size / (1024 * 1024);

    if (sizeMB > 500) {
      fs.unlinkSync(filePath);
      return await conn.sendMessage(chatId, {
        text: `🚫 Archivo muy pesado: *${sizeMB.toFixed(2)}MB* (máximo permitido 500MB).`
      }, { quoted: msg });
    }

    const resoList = data.map(item => `• ${item.resolution}`).join("\n");

    const caption = `
📥 *Descarga completa* ✅
📄 *Resoluciones disponibles:*
${resoList}

📝 Video enviado como documento (720p).
🔥 Powered by SYA TEAM BOT
`.trim();

    await conn.sendMessage(chatId, {
      document: fs.readFileSync(filePath),
      mimetype: "video/mp4",
      fileName: fileName,
      caption
    }, { quoted: msg });

    fs.unlinkSync(filePath);

    await conn.sendMessage(chatId, {
      react: { text: "✅", key: msg.key }
    });

  } catch (error) {
    console.error("Error en fbdoc:", error);
    await conn.sendMessage(chatId, {
      text: "⚠️ Error al procesar el video. Intenta más tarde."
    }, { quoted: msg });
  }
};

handler.command = ["fbdoc", "facebookdoc"];
module.exports = handler;