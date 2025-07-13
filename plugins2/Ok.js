const fs = require('fs');

const handler = async (msg, { conn }) => {
  try {
    const userId = msg.key.participant || msg.key.remoteJid;
    const rpgFile = './rpg.json';

    // 🧾 Verifica si el usuario tiene una eliminación pendiente
    if (!global.pendingDeletions || !global.pendingDeletions[userId]) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: `❌ *No tienes una solicitud activa para eliminar tu cuenta.*\n📌 Usa \`${global.prefix}deleterpg\` para iniciar la eliminación.`,
      }, { quoted: msg });
    }

    // 🛑 Cancela el temporizador y elimina la solicitud de la lista
    clearTimeout(global.pendingDeletions[userId]);
    delete global.pendingDeletions[userId];

    // 📂 Cargar archivo de RPG
    const rpgData = JSON.parse(fs.readFileSync(rpgFile, 'utf-8'));

    // 📌 Validar si el usuario tiene cuenta
    if (!rpgData.usuarios[userId]) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "⚠️ *No tienes una cuenta activa en el gremio Sya RPG.*\n🔹 Usa `.rpg nombre edad` para crearla.",
      }, { quoted: msg });
    }

    // 🔄 Reintegrar personajes a la tienda
    const usuario = rpgData.usuarios[userId];
    if (usuario.personajes && usuario.personajes.length > 0) {
      rpgData.tiendaPersonajes.push(...usuario.personajes);
    }

    // 🗑️ Eliminar cuenta del usuario
    delete rpgData.usuarios[userId];

    // 💾 Guardar cambios
    fs.writeFileSync(rpgFile, JSON.stringify(rpgData, null, 2));

    // ✅ Confirmación al usuario
    await conn.sendMessage(msg.key.remoteJid, {
      text: `🗑️ *Tu cuenta ha sido eliminada con éxito del gremio Sya Team Subbot.*\n\n🎮 Si deseas volver a jugar, regístrate con:\n\`${global.prefix}rpg <nombre> <edad>\``,
    }, { quoted: msg });

    // ✅ Emoji de confirmación
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "✅", key: msg.key }
    });

  } catch (error) {
    console.error("❌ Error en el comando .ok:", error);

    // ❌ Mensaje de error visible al usuario
    await conn.sendMessage(msg.key.remoteJid, {
      text: "❌ *Ocurrió un error al confirmar la eliminación.*\n🔁 Inténtalo más tarde o contacta a un admin.",
    }, { quoted: msg });

    // ❌ Emoji de error
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "❌", key: msg.key }
    });
  }
};

handler.command = ['ok'];
module.exports = handler;