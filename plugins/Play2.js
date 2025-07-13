const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { promisify } = require("util");
const { pipeline } = require("stream");
const streamPipe = promisify(pipeline);

const pendingJobs = {};

module.exports = async (msg, { conn, text }) => {
  const chatId = msg.key.remoteJid;
  const prefix = global.prefix || ".";

  if (!text) {
    return conn.sendMessage(
      chatId,
      {
        text: `⚠️ *Uso correcto:*\n${prefix}playpro <término>\nEjemplo:\n*${prefix}playpro* bad bunny diles`,
      },
      { quoted: msg }
    );
  }

  // Aviso de carga
  await conn.sendMessage(chatId, {
    react: { text: "⏳", key: msg.key },
  });

  // Buscando el video en YouTube
  const search = await yts(text);
  const video = search.videos[0];

  if (!video)
    return await conn.sendMessage(
      chatId,
      { text: "❌ No se encontraron resultados para tu búsqueda." },
      { quoted: msg }
    );

  const { title, url, thumbnail, timestamp: duration, views, author } = video;

  const viewsFormatted = views.toLocaleString();

  // Mensaje con la info y opciones
  const infoMsg = `
🎵 *SYA TEAM BOT - PLAY2* 🎵

📌 *Título:* ${title}
⏳ *Duración:* ${duration}
👁️ *Vistas:* ${viewsFormatted}
🔗 *Enlace:* ${url}

📥 *Opciones para descargar*:

👍 _1_  · Audio MP3
❤️ _2_  · Video MP4
📄 _4_  · Audio Documento
📁 _3_  · Video Documento

✳️ Responde o reacciona al mensaje con el número o emoji correspondiente.

─────────────────────
⚙️ *Desarrollado por Sya Team Admins* ⚙️
`.trim();

  // Enviar mensaje con preview
  const preview = await conn.sendMessage(
    chatId,
    { image: { url: thumbnail }, caption: infoMsg },
    { quoted: msg }
  );

  // Guardar trabajo pendiente
  pendingJobs[preview.key.id] = {
    chatId,
    videoUrl: url,
    title,
    commandMsg: msg,
    downloaded: { audio: false, video: false, audioDoc: false, videoDoc: false },
  };

  // Confirmar recepción
  await conn.sendMessage(chatId, { react: { text: "✅", key: msg.key } });

  // Listener único para respuestas y reacciones
  if (!conn._listenerPlaypro) {
    conn._listenerPlaypro = true;

    conn.ev.on("messages.upsert", async (ev) => {
      for (const m of ev.messages) {
        try {
          // Reacciones (emojis)
          if (m.message?.reactionMessage) {
            const { key: reactKey, text: emoji } = m.message.reactionMessage;
            const job = pendingJobs[reactKey.id];
            if (job) await processDownload(conn, job, emoji, job.commandMsg);
          }

          // Mensajes citados con texto
          const context = m.message?.extendedTextMessage?.contextInfo;
          const quotedId = context?.stanzaId;
          const textMsg = (
            m.message?.conversation?.toLowerCase() ||
            m.message?.extendedTextMessage?.text?.toLowerCase() ||
            ""
          ).trim();

          if (quotedId && pendingJobs[quotedId]) {
            const job = pendingJobs[quotedId];
            const cId = m.key.remoteJid;

            if (["1", "audio", "4", "audiodoc"].includes(textMsg)) {
              const isDoc = ["4", "audiodoc"].includes(textMsg);
              await conn.sendMessage(cId, { react: { text: isDoc ? "📄" : "🎵", key: m.key } });
              await conn.sendMessage(cId, { text: "🎶 Descargando audio..." }, { quoted: m });
              await downloadAudio(conn, job, isDoc, m);
            } else if (["2", "video", "3", "videodoc"].includes(textMsg)) {
              const isDoc = ["3", "videodoc"].includes(textMsg);
              await conn.sendMessage(cId, { react: { text: isDoc ? "📁" : "🎬", key: m.key } });
              await conn.sendMessage(cId, { text: "🎥 Descargando video..." }, { quoted: m });
              await downloadVideo(conn, job, isDoc, m);
            } else {
              await conn.sendMessage(cId, {
                text: "❗ Opciones válidas:\n1 / audio\n4 / audiodoc\n2 / video\n3 / videodoc",
              }, { quoted: m });
            }

            // Borra pendiente tras 5 minutos para liberar memoria
            if (!job._timeout) {
              job._timeout = setTimeout(() => delete pendingJobs[quotedId], 5 * 60 * 1000);
            }
          }
        } catch (err) {
          console.error("Error en playpro listener:", err);
        }
      }
    });
  }
};

// Maneja descargas según elección
async function processDownload(conn, job, emoji, quotedMsg) {
  const map = {
    "👍": "audio",
    "❤️": "video",
    "📄": "audioDoc",
    "📁": "videoDoc",
  };
  const choice = map[emoji];
  if (!choice) return;
  const asDoc = choice.endsWith("Doc");
  await conn.sendMessage(job.chatId, { text: `⏳ Descargando ${asDoc ? "documento" : choice}...` }, { quoted: job.commandMsg });
  if (choice.startsWith("audio")) await downloadAudio(conn, job, asDoc, job.commandMsg);
  else await downloadVideo(conn, job, asDoc, job.commandMsg);
}

// Descarga audio y envía
async function downloadAudio(conn, job, asDocument, quoted) {
  const apiURL = `https://api.neoxr.eu/api/youtube?url=${encodeURIComponent(job.videoUrl)}&type=audio&quality=128kbps&apikey=GataDios`;
  const res = await axios.get(apiURL);
  if (!res.data?.status || !res.data.data?.url) throw new Error("No se pudo obtener el audio");
  
  const tmpDir = path.join(__dirname, "../tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
  
  const inputPath = path.join(tmpDir, `${Date.now()}_in.m4a`);
  const outputPath = path.join(tmpDir, `${Date.now()}_out.mp3`);
  
  const downloadStream = await axios.get(res.data.data.url, { responseType: "stream" });
  await streamPipe(downloadStream.data, fs.createWriteStream(inputPath));
  
  await new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec("libmp3lame")
      .audioBitrate("128k")
      .format("mp3")
      .save(outputPath)
      .on("end", resolve)
      .on("error", reject);
  });

  const buffer = fs.readFileSync(outputPath);

  await conn.sendMessage(job.chatId, {
    [asDocument ? "document" : "audio"]: buffer,
    mimetype: "audio/mpeg",
    fileName: `${job.title}.mp3`,
  }, { quoted });

  fs.unlinkSync(inputPath);
  fs.unlinkSync(outputPath);
}

// Descarga video y envía
async function downloadVideo(conn, job, asDocument, quoted) {
  const qualities = ["720p", "480p", "360p"];
  let videoURL = null;

  for (const q of qualities) {
    try {
      const res = await axios.get(`https://api.neoxr.eu/api/youtube?url=${encodeURIComponent(job.videoUrl)}&type=video&quality=${q}&apikey=GataDios`);
      if (res.data?.status && res.data.data?.url) {
        videoURL = res.data.data.url;
        break;
      }
    } catch {}
  }

  if (!videoURL) throw new Error("No se pudo obtener el video");

  const tmpDir = path.join(__dirname, "../tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

  const filePath = path.join(tmpDir, `${Date.now()}_video.mp4`);

  const videoStream = await axios.get(videoURL, { responseType: "stream" });
  await streamPipe(videoStream.data, fs.createWriteStream(filePath));

  await conn.sendMessage(job.chatId, {
    [asDocument ? "document" : "video"]: fs.readFileSync(filePath),
    mimetype: "video/mp4",
    fileName: `${job.title}.mp4`,
    caption: asDocument ? undefined : `🎬 Aquí tienes tu video\n© Sya Team Bot`,
  }, { quoted });

  fs.unlinkSync(filePath);
}

module.exports.command = ["play2"];