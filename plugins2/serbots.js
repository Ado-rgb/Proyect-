const fs = require("fs");
const path = require("path");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const QRCode = require("qrcode");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const { subBots, socketEvents, reconnectionAttempts } = require("../indexsubbots");

const MAX_SUBBOTS = 200;

const handler = async (msg, { conn, command, sock }) => {
  const usarPairingCode = ["sercode", "code"].includes(command);
  let sentCodeMessage = false;

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function serbot() {
    const number = msg.key?.participant || msg.key.remoteJid;
    const sessionDir = path.join(__dirname, "../subbots");
    const sessionPath = path.join(sessionDir, number);
    const rid = number.split("@")[0];
    try {
      if (subBots.includes(sessionPath)) {
        return await conn.sendMessage(
          msg.key.remoteJid,
          {
            text: "ℹ️ *Ese subbot ya existe.* 🧹 Usa *.delbots* para borrar tu sesión actual🔁 Luego pide un nuevo código con: *.code* o *.sercode*",
          },
          { quoted: msg },
        );
      }

      subBots.push(sessionPath);

      /* ───────── VERIFICACIÓN DE LÍMITE ───────── */
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }

      const subbotDirs = fs
        .readdirSync(sessionDir)
        .filter((d) => fs.existsSync(path.join(sessionDir, d, "creds.json")));

      if (subbotDirs.length >= MAX_SUBBOTS) {
        await conn.sendMessage(
          msg.key.remoteJid,
          {
            text: `🚫 *Límite alcanzado:* existen ${subbotDirs.length}/${MAX_SUBBOTS} sesiones de sub-bot activas.\nVuelve a intentarlo más tarde.`,
          },
          { quoted: msg },
        );
        return;
      }
      const restantes = MAX_SUBBOTS - subbotDirs.length;
      await conn.sendMessage(
        msg.key.remoteJid,
        {
          text: `ℹ️ Quedan *${restantes}* espacios disponibles para conectar nuevos sub-bots.`,
        },
        { quoted: msg },
      );
      /* ─────────────────────────────────────────── */

      await conn.sendMessage(msg.key.remoteJid, { react: { text: "⌛", key: msg.key } });

      let socky;
      async function createSocket() {
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();
        const logger = pino({ level: "silent" });

        socky = makeWASocket({
          version,
          logger,
          auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
          },
          printQRInTerminal: !usarPairingCode,
          browser: ["Windows", "Chrome"],
          syncFullHistory: false,
        });

        return { socky, saveCreds };
      }

      let readyBot = false;
      let connectionTimeout;

      async function setupSocketEvents() {
        const { socky, saveCreds } = await createSocket();

        connectionTimeout = setTimeout(async () => {
          if (!readyBot) {
            await conn.sendMessage(
              msg.key.remoteJid,
              {
                text: "⏰ *Tiempo de espera agotado.*\nNo se escaneó el código a tiempo. Vuelve a intentarlo.",
              },
              { quoted: msg },
            );

            const index = subBots.indexOf(sessionPath);
            if (index !== -1) subBots.splice(index, 1);

            socky.end(new Error("Timeout"));
            if (fs.existsSync(sessionPath)) {
              fs.rmSync(sessionPath, { recursive: true, force: true });
            }
          }
        }, 60000);

        socky.ev.on("connection.update", async ({ qr, connection, lastDisconnect }) => {
          if (qr && !sentCodeMessage) {
            if (usarPairingCode) {
              const code = await socky.requestPairingCode(rid);
              await conn.sendMessage(
                msg.key.remoteJid,
                {
                  video: { url: "https://cdn.russellxz.click/b0cbbbd3.mp4" },
                  caption:
                    "🔐 *Código generado:*\nAbre WhatsApp > Vincular dispositivo y pega el siguiente código:",
                  gifPlayback: true,
                },
                { quoted: msg },
              );
              await sleep(1000);
              await conn.sendMessage(
                msg.key.remoteJid,
                { text: `\`\`\`${code}\`\`\`` },
                { quoted: msg },
              );
            } else {
              const qrImage = await QRCode.toBuffer(qr);
              await conn.sendMessage(
                msg.key.remoteJid,
                {
                  image: qrImage,
                  caption:
                    "📲 Escanea este código QR desde *WhatsApp > Vincular dispositivo* para conectarte como sub-bot.",
                },
                { quoted: msg },
              );
            }
            sentCodeMessage = true;
          }

          if (connection === "open") {
            readyBot = true;
            clearTimeout(connectionTimeout);
            reconnectionAttempts.set(sessionPath, 0);
            await conn.sendMessage(
              msg.key.remoteJid,
              {
                text: `╔═════════『 🤖 𝙎𝙐𝘽𝘽𝙊𝙏 𝘾𝙊𝙉𝙀𝘾𝙏𝘼𝘿𝙊 』═════════╗

🌐 *SYA TEAM BOT - ACTIVADO*
✨ Tu subbot ya está *online* y listo para el desmadre

📨 *IMPORTANTE:*
🔒 Revisa tu *mensaje privado* para ver instrucciones detalladas
😵‍💫 *Si no entiendes es porque el bot es muy sabio... o tú muy bruto* 💀

📦 *Comandos básicos:*
• \`help\` → Muestra ayuda general
• \`menu\` → Lista de comandos disponibles

⚙️ *Modo actual:* PRIVADO
🫵 Sólo tú puedes usar el bot (por ahora)
💬 *Actívalo para otros desde tu privado* 👀

🎛️ *Cambiar prefijo rápido:*  
Usa: \`.setprefix ✨\`  
Luego escribe comandos con ese prefijo. Ej: \`✨menu\`

🧹 *Borrar sesión:*
• \`.delbots\` → Elimina subbot actual
• \`.code\` o \`.sercode\` → Solicita nuevo código

💎 *BY SYA ULTRA SYSTEM v2.0* 💎
╚══════════════════════════════════╝`,
              },
              { quoted: msg },
            );
            await conn.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
            const ownerJid = `${socky.user.id.split(":")[0]}@s.whatsapp.net`;
            socky
              .sendMessage(ownerJid, {
                text: `╭━━━🎉 𝗦𝗬𝗔 𝗧𝗘𝗔𝗠 - 𝗦𝗨𝗕𝗕𝗢𝗧 𝗣𝗥𝗘𝗠𝗜𝗨𝗠 🎉━━━╮

✨ ¡Qué onda crack! Bienvenido al sistema *ultra mamalón* de SYA TEAM SubBots  
Tu subbot ya está 🔛 *conectado y listo pa' la acción*

📍 *INFO RÁPIDA QUE SÍ IMPORTA:*

🔒 El bot *solo te responde a vos* por ahora (modo privado activado)  
🛠️ ¿Querés que funcione en GRUPOS?

➤ Mandate al grupo donde lo quieras usar  
➤ Escribí: \`.addgrupo\`  
✔️ Boom! Ya responde a todos los que hablen ahí

👤 ¿Y pa' que responda a otros por privado?

💬 Mandá: \`.addlista 50412345678\`  
📌 O respondé un mensaje de alguien y poné: \`.addlista\`  
➡️ Y con eso ya queda autorizado

🔁 ¿Querés cambiar el prefijo de comandos?

👉 Usá: \`.setprefix símbolo\`  
Ejemplo: \`.setprefix 🌀\` → Luego usás: \`🌀menu\`, \`🌀help\`, etc.

📑 ¿Qué comandos hay?

Solo tirá: \`.menu\` o \`.help\` y mirá todo lo que puede hacer

━━━━━━━━━━━━━━━━━━━━━━
💎 *SYA ULTRA SYSTEM * 💎
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`,
              })
              .catch(() => {
                return;
              });
            await socketEvents(socky);
          }

          if (connection === "close") {
            clearTimeout(connectionTimeout);
            const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log(`❌ Subbot ${sessionPath} desconectado (status: ${statusCode}).`);

            const shouldReconnect =
              statusCode !== DisconnectReason.loggedOut &&
              statusCode !== DisconnectReason.badSession &&
              statusCode !== DisconnectReason.forbidden &&
              statusCode !== 403;

            if (shouldReconnect) {
              const attempts = (reconnectionAttempts.get(sessionPath) || 0) + 1;
              reconnectionAttempts.set(sessionPath, attempts);

              if (attempts <= 3) {
                console.log(`💱 Intentando reconectar! (Intento ${attempts}/3)`);
                if (!readyBot && statusCode !== DisconnectReason.restartRequired) {
                  await conn.sendMessage(
                    msg.key.remoteJid,
                    {
                      text: `╭───〔 *⚠️ SUBBOT* 〕───╮
│
│⚠️ *Problema de conexión detectado:*
│ Razón: ${statusCode}
│ Intentando reconectar...
│
│ 🔄 Si el problema persiste, ejecuta:
│ #delbots
│ para eliminar tu sesión y solicita una nueva con:
│ #sercode / #code
│
╰────✦ *SYA* ✦────╯`,
                    },
                    { quoted: msg },
                  );
                }
                const index = subBots.indexOf(sessionPath);
                if (index !== -1) subBots.splice(index, 1);

                setTimeout(() => {
                  if (fs.existsSync(sessionPath)) {
                    subBots.push(sessionPath);
                    setupSocketEvents().catch((e) => console.error("Error en reconexión:", e));
                  } else {
                    console.log(`ℹ️ La sesión ${sessionPath} fue eliminada. Cancelando reconexión.`);
                    reconnectionAttempts.delete(sessionPath);
                  }
                }, 3000);
              } else {
                console.log(
                  `❌ Límite de reconexión alcanzado para ${sessionPath}. Eliminando sesión.`,
                );
                await conn.sendMessage(
                  msg.key.remoteJid,
                  {
                    text: `⚠️ *Límite de reconexión alcanzado.*\nLa sesión ha sido eliminada. Usa ${global.prefix}sercode para volver a conectar.`,
                  },
                  { quoted: msg },
                );

                const index = subBots.indexOf(sessionPath);
                if (index !== -1) subBots.splice(index, 1);

                if (fs.existsSync(sessionPath)) {
                  fs.rmSync(sessionPath, { recursive: true, force: true });
                }
                reconnectionAttempts.delete(sessionPath);
              }
            } else {
              console.log(`❌ No se puede reconectar con el bot ${sessionPath}.`);
              if (!readyBot) {
                await conn.sendMessage(
                  msg.key.remoteJid,
                  {
                    text: `⚠️ *Sesión eliminada.*\n${statusCode}\nUsa ${global.prefix}sercode para volver a conectar.`,
                  },
                  { quoted: msg },
                );
              }
              const index = subBots.indexOf(sessionPath);
              if (index !== -1) subBots.splice(index, 1);
              if (fs.existsSync(sessionPath)) {
                fs.rmSync(sessionPath, { recursive: true, force: true });
              }
            }
          }
        });

        socky.ev.on("creds.update", saveCreds);
      }

      await setupSocketEvents();
    } catch (e) {
      console.error("❌ Error en serbot:", e);

      const index = subBots.indexOf(sessionPath);
      if (index !== -1) {
        subBots.splice(index, 1);
      }
      await conn.sendMessage(
        msg.key.remoteJid,
        { text: `❌ *Error inesperado:* ${e.message}` },
        { quoted: msg },
      );
    }
  }

  await serbot();
};

handler.command = ["sercode", "code", "jadibot", "serbot", "qr"];
handler.tags = ["owner"];
handler.help = ["serbot", "code"];
module.exports = handler;
