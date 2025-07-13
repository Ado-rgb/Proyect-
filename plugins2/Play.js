const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { promisify } = require("util");
const { pipeline } = require("stream");
const streamPipe = promisify(pipeline);

const pending = {}; // almacén de tareas

module.exports = async (msg, { conn, text }) => {
  const subID = (conn.user.id || "").split(":")[0] + "@s.whatsapp.net";
  const pref = (() => {
    try {
      const p = JSON.parse(fs.readFileSync("prefixes.json", "utf8"));
      return p[subID] || ".";
    } catch {
      return ".";
    }
  })();

  if (!text) {
    return conn.sendMessage(msg.key.remoteJid, {
      text: `🎧 Usa el comando así:\n${pref}play <nombre de canción o artista>\nEj: ${pref}play Quevedo bzrp`,
    }, { quoted: msg });
  }

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: "🔍", key: msg.key }
  });

  const res = await yts(text);
  const video = res.videos[0];
  if (!video) {
    return conn.sendMessage(msg.key.remoteJid, {
      text: "❌ No encontré resultados. Prueba con otro título.",
    }, { quoted: msg });
  }

  const { url: videoUrl, title, timestamp: duration, views, author } = video;
  const viewsFmt = views.toLocaleString();

  const caption = `
╭─────────────✦
│ 🤖 *SYA TEAM BOT - SubBot Conectado*
╰─────────────✦
🎶 *Título:* ${title}
📏 *Duración:* ${duration}
👁️ *Vistas:* ${viewsFmt}
👤 *Autor:* ${author}
🔗 *Link:* ${videoUrl}

🎧 Opciones disponibles (responde):
🟢 Audio MP3 → 1 / audio / 👍
🔴 Video MP4 → 2 / video / ❤️
📄 Audio Doc  → 4 / audiodoc / 📄
📁 Video Doc  → 3 / videodoc / 📁

*By SYA TEAM BOT* ✨
`.trim();

  const preview = await conn.sendMessage(msg.key.remoteJid, {
    image: { url: video.thumbnail },
    caption
  }, { quoted: msg });

  pending[preview.key.id] = {
    chatId: msg.key.remoteJid,
    videoUrl,
    title,
    commandMsg: msg,
    done: { audio: false, video: false, audioDoc: false, videoDoc: false }
  };

  await conn.sendMessage(msg.key.remoteJid, {
    react: { text: "✅", key: msg.key }
  });

  if (!conn._playListenerSyaTeam) {
    conn._playListenerSyaTeam = true;
    conn.ev.on("messages.upsert", async ev => {
      for (const m of ev.messages) {
        // REACCIONES
        if (m.message?.reactionMessage) {
          const { key: reactKey, text: emoji } = m.message.reactionMessage;
          const job = pending[reactKey.id];
          if (job) await handleDownload(conn, job, emoji, job.commandMsg);
        }

        // RESPUESTAS
        try {
          const ctx = m.message?.extendedTextMessage?.contextInfo;
          const citado = ctx?.stanzaId;
          const texto = (
            m.message?.conversation?.toLowerCase() ||
            m.message?.extendedTextMessage?.text?.toLowerCase() || ""
          ).trim();
          const job = pending[citado];
          const chatId = m.key.remoteJid;
          if (citado && job) {
            if (["1", "audio", "4", "audiodoc"].includes(texto)) {
              const isDoc = ["4", "audiodoc"].includes(texto);
              await conn.sendMessage(chatId, { react: { text: isDoc ? "📄" : "🎵", key: m.key } });
              await conn.sendMessage(chatId, { text: "🎧 Descargando audio..." }, { quoted: m });
              await downloadAudio(conn, job, isDoc, m);
            } else if (["2", "video", "3", "videodoc"].includes(texto)) {
              const isDoc = ["3", "videodoc"].includes(texto);
              await conn.sendMessage(chatId, { react: { text: isDoc ? "📁" : "🎬", key: m.key } });
              await conn.sendMessage(chatId, { text: "🎥 Descargando video..." }, { quoted: m });
              await downloadVideo(conn, job, isDoc, m);
            } else {
              await conn.sendMessage(chatId, {
                text: `⚠️ Opciones válidas:\n1/audio, 4/audiodoc → audio\n2/video, 3/videodoc → video`
              }, { quoted: m });
            }

            if (!job._timer) {
              job._timer = setTimeout(() => delete pending[citado], 5 * 60 * 1000);
            }
          }
        } catch (e) {
          console.error("❌ Error procesando respuesta:", e);
        }
      }
    });
  }
};

async function handleDownload(conn, job, emoji, quotedMsg) {
  const mapping = {
    "👍": "audio",
    "❤️": "video",
    "📄": "audioDoc",
    "📁": "videoDoc"
  };
  const key = mapping[emoji];
  if (key) {
    const isDoc = key.endsWith("Doc");
    await conn.sendMessage(job.chatId, {
      text: `⏳ Descargando ${isDoc ? "documento" : key}...`
    }, { quoted: job.commandMsg });

    if (key.startsWith("audio")) await downloadAudio(conn, job, isDoc, quotedMsg);
    else await downloadVideo(conn, job, isDoc, quotedMsg);
  }
}

async function downloadAudio(conn, job, asDocument, quoted) {
  const { chatId, videoUrl, title } = job;
  const api = `https://api.neoxr.eu/api/youtube?url=${encodeURIComponent(videoUrl)}&type=audio&quality=128kbps&apikey=GataDios`;
  const res = await axios.get(api);
  if (!res.data?.status || !res.data.data?.url) throw new Error("Audio no disponible");

  const tmp = path.join(__dirname, "../tmp");
  if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);

  const inFile = path.join(tmp, `${Date.now()}_in.m4a`);
  const outFile = path.join(tmp, `${Date.now()}_out.mp3`);

  const download = await axios.get(res.data.data.url, { responseType: "stream" });
  await streamPipe(download.data, fs.createWriteStream(inFile));

  await new Promise((res, rej) =>
    ffmpeg(inFile)
      .audioCodec("libmp3lame")
      .audioBitrate("128k")
      .format("mp3")
      .save(outFile)
      .on("end", res)
      .on("error", rej)
  );

  const buffer = fs.readFileSync(outFile);
  await conn.sendMessage(chatId, {
    [asDocument ? "document" : "audio"]: buffer,
    mimetype: "audio/mpeg",
    fileName: `${title}.mp3`
  }, { quoted });

  fs.unlinkSync(inFile);
  fs.unlinkSync(outFile);
}

async function downloadVideo(conn, job, asDocument, quoted) {
  const { chatId, videoUrl, title } = job;
  const qualities = ["720p", "480p", "360p"];
  let url = null;

  for (let q of qualities) {
    try {
      const r = await axios.get(`https://api.neoxr.eu/api/youtube?url=${encodeURIComponent(videoUrl)}&type=video&quality=${q}&apikey=GataDios`);
      if (r.data?.status && r.data.data?.url) {
        url = r.data.data.url;
        break;
      }
    } catch {}
  }

  if (!url) throw new Error("Video no disponible");

  const tmp = path.join(__dirname, "../tmp");
  if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);

  const file = path.join(tmp, `${Date.now()}_video.mp4`);
  const dl = await axios.get(url, { responseType: "stream" });
  await streamPipe(dl.data, fs.createWriteStream(file));

  await conn.sendMessage(chatId, {
    [asDocument ? "document" : "video"]: fs.readFileSync(file),
    mimetype: "video/mp4",
    fileName: `${title}.mp4`,
    caption: asDocument ? undefined : `🎬 Tu video está listo.\n© SYA TEAM BOT`
  }, { quoted });

  fs.unlinkSync(file);
}

module.exports.command = ["play"];