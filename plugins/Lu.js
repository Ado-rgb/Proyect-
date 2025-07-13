const axios = require('axios');

const handler = async (msg, { conn, args, usedPrefix, command }) => {
    const text = args.join(' ');
    const chatId = msg.key.remoteJid;

    if (!text) {
        return conn.sendMessage(chatId, { 
            text: `✳️ Ingresa tu pregunta\nEjemplo: *${usedPrefix + command}* ¿quién inventó WhatsApp?` 
        }, { quoted: msg });
    }

    try {
        await conn.sendMessage(chatId, { react: { text: '⏳', key: msg.key } });

        const name = msg.pushName || 'Usuario';
        const result = await askNightAI(text);

        const responseMsg = `╭━〔 *RESPUESTA IA* 〕━⬣
│  ✦ *Pregunta:* ${text}
│  ✦ *Usuario:* ${name}
╰━━━━━━━━━━━━⬣

${result}

╭━〔 *FUENTE* 〕━⬣
│  ✦ *Powered by NightAPI*
╰━━━━━━━━━━━━⬣`;

        await conn.sendMessage(chatId, { text: responseMsg }, { quoted: msg });
        await conn.sendMessage(chatId, { react: { text: '✅', key: msg.key } });

    } catch (error) {
        console.error(error);
        await conn.sendMessage(chatId, { 
            text: `❌ Error: ${error.message}` 
        }, { quoted: msg });
        await conn.sendMessage(chatId, { react: { text: '❌', key: msg.key } });
    }
};

async function askNightAI(message) {
    const { data } = await axios.get(`https://nightapi.is-a.dev/api/xex`, {
        params: { message }
    });

    if (!data?.status || !data?.result) {
        throw new Error('No se obtuvo respuesta válida de la API');
    }

    return data.result;
}

handler.help = ['xex <pregunta>'];
handler.command = ['xex', 'nightai', 'asknight'];
handler.tags = ['ai'];
handler.register = true;
module.exports = handler;
