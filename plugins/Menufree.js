const handler = async (msg, { conn }) => {
  const chatId = msg.key.remoteJid;
  const prefix = global.prefix;

  try {
    // Reacción al ejecutar el comando
    await conn.sendMessage(chatId, { react: { text: "📋", key: msg.key } });

    // Imagen para el menú
    const imgUrl = 'https://cdn.russellxz.click/706326cf.jpeg';

    // Texto del menú con estilo fresco y organizado
    const texto = `
✨ *FREE FIRE MENU* ✨

🗺️ *Mapas disponibles*  
▶️ Usa: *${prefix}mapas*

📜 *Reglas del grupo*  
▶️ *${prefix}reglas*  
▶️ *${prefix}setreglas*

⚔️ *Lista Versus*  
▶️ *${prefix}4vs4*  
▶️ *${prefix}6vs6*  
▶️ *${prefix}12vs12*  
▶️ *${prefix}16vs16*  
▶️ *${prefix}20vs20*  
▶️ *${prefix}24vs24*  
▶️ *${prefix}guerr*

───────────────────  
👑 *Desarrollado por Sya Admins*  
🤖 *Powered by SYA TEAM BOT*
`.trim();

    // Enviar imagen y texto del menú
    await conn.sendMessage(chatId, {
      image: { url: imgUrl },
      caption: texto
    }, { quoted: msg });

  } catch (error) {
    console.error("❌ Error en .menufree:", error);
    await conn.sendMessage(chatId, {
      text: "❌ No se pudo cargar el menú, intenta nuevamente."
    }, { quoted: msg });
  }
};

handler.command = ['menufree'];
module.exports = handler;