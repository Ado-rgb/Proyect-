const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { pipeline } = require('stream');
const streamPipeline = promisify(pipeline);

const handler = async (msg, { conn, text, usedPrefix }) => {
  if (!text) {
    return await conn.sendMessage(msg.key.remoteJid, {
      text: `❗ *Uso incorrecto*\n\n✏️ Ejemplo:\n*${usedPrefix}play2doc* La Factoría - Perdoname`
    }, { quoted: msg });
  }

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: '⌛', key: msg.key }
  });

  try {
    const searchUrl = `https://api.neoxr.eu/api/video?q=${encodeURIComponent(text)}&apikey=GataDios`;
    const searchRes = await axios.get(searchUrl);
    const videoInfo = searchRes.data;

    if (!videoInfo || !videoInfo.data?.url) throw new Error('No se pudo encontrar el video.');

    const title = videoInfo.title || 'Desconocido';
    const thumbnail = videoInfo.thumbnail;
    const duration = videoInfo.fduration || '00:00';
    const views = videoInfo.views || 'Desconocidas';
    const author = videoInfo.channel || 'Desconocido';
    const videoLink = `https://youtu.be/${videoInfo.id}`;

    const captionPreview = `
🎥 ══► *SYA TEAM BOT* ◄══ 🎥

📝 *Información del video*

• 📌 *Título:* ${title}
• ⏳ *Duración:* ${duration}
• 👀 *Vistas:* ${views}
• 🎙️ *Canal:* ${author}
• 🔗 *Enlace:* ${videoLink}

⚠️ *Si falla el audio/video usa* _${usedPrefix}ff_

⏳ *Procesando video, espera un momento...*`;

    await conn.sendMessage(msg.key.remoteJid, {
      image: { url: thumbnail },
      caption: captionPreview.trim()
    }, { quoted: msg });

    const qualities = ['720p', '480p', '360p'];
    let videoData = null;

    for (const quality of qualities) {
      try {
        const apiUrl = `https://api.neoxr.eu/api/youtube?url=${encodeURIComponent(videoLink)}&apikey=GataDios&type=video&quality=${quality}`;
        const response = await axios.get(apiUrl);
        if (response.data?.status && response.data?.data?.url) {
          videoData = {
            url: response.data.data.url,
            title: response.data.title || title
          };
          break;
        }
      } catch {
        continue;
      }
    }

    if (!videoData) throw new Error('No se pudo obtener el video en ninguna calidad.');

    const tmpDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    const filePath = path.join(tmpDir, `${Date.now()}_video.mp4`);

    const videoStream = await axios.get(videoData.url, {
      responseType: 'stream',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    await streamPipeline(videoStream.data, fs.createWriteStream(filePath));

    const stats = fs.statSync(filePath);
    if (!stats || stats.size < 100000) {
      fs.unlinkSync(filePath);
      throw new Error('El archivo descargado está corrupto o vacío.');
    }

    const finalCaption = `
✅ *Video listo para descargar*

© SYA TEAM BOT
`.trim();

    await conn.sendMessage(msg.key.remoteJid, {
      document: fs.readFileSync(filePath),
      mimetype: 'video/mp4',
      fileName: `${videoData.title}.mp4`,
      caption: finalCaption
    }, { quoted: msg });

    fs.unlinkSync(filePath);

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '✅', key: msg.key }
    });

  } catch (error) {
    console.error(error);
    await conn.sendMessage(msg.key.remoteJid, {
      text: `❌ Error: ${error.message}`
    }, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '❌', key: msg.key }
    });
  }
};

handler.command = ['play2doc'];
module.exports = handler;