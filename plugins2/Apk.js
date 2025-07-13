const fetch = require('node-fetch');

const handler = async (msg, { conn, text, args, usedPrefix, command }) => {
  if (!args.length) {
    return await conn.sendMessage(msg.key.remoteJid, {
      text: `⚠️ Uso incorrecto\n\nEjemplo:\n${usedPrefix + command} whatsapp`,
    }, { quoted: msg });
  }

  const query = args.join(" ");
  const apiUrl = `https://api.neoxr.eu/api/apk?q=${encodeURIComponent(query)}&no=1&apikey=GataDios`;

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: "⏳", key: msg.key }
  });

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`API falló: ${response.status} ${response.statusText}`);

    const data = await response.json();
    if (!data.status || !data.data || !data.file?.url) {
      throw new Error("No se pudo obtener info del APK.");
    }

    const apkInfo = data.data;
    const apkFile = data.file;

    const fileResponse = await fetch(apkFile.url);
    if (!fileResponse.ok) throw new Error("No se pudo descargar el APK.");
    const fileBuffer = await fileResponse.buffer();

    const caption = `
📱 *Nombre:* ${apkInfo.name}
📦 *Tamaño:* ${apkInfo.size}
⭐ *Rating:* ${apkInfo.rating}
📥 *Instalaciones:* ${apkInfo.installs}
👨‍💻 *Desarrollador:* ${apkInfo.developer}
📂 *Categoría:* ${apkInfo.category}
🔄 *Versión:* ${apkInfo.version}
📅 *Actualizado:* ${apkInfo.updated}
📋 *Requisitos:* ${apkInfo.requirements}
🔗 *ID:* ${apkInfo.id}

*💥 Sya Team Subbot*
`.trim();

    await conn.sendMessage(msg.key.remoteJid, {
      image: { url: apkInfo.thumbnail },
      caption
    }, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      document: fileBuffer,
      mimetype: 'application/vnd.android.package-archive',
      fileName: apkFile.filename
    }, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "✅", key: msg.key }
    });

  } catch (err) {
    console.error("❌ Error en comando apk:", err.message);
    await conn.sendMessage(msg.key.remoteJid, {
      text: `❌ Error:\n_${err.message}_\n\nIntenta de nuevo luego.`,
    }, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "❌", key: msg.key }
    });
  }
};

handler.command = ['apk'];
module.exports = handler;