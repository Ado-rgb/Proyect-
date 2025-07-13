const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const FormData = require('form-data');
const axios = require('axios');

const remini = async (imageBuffer, operation = "enhance") => {
  const validOperations = ["enhance", "recolor", "dehaze"];
  operation = validOperations.includes(operation) ? operation : "enhance";

  const form = new FormData();
  form.append('image', imageBuffer, {
    filename: 'image_to_enhance.jpg',
    contentType: 'image/jpeg'
  });
  form.append('model_version', '1');

  try {
    const { data } = await axios({
      method: 'post',
      url: `https://inferenceengine.vyro.ai/${operation}.vyro`,
      data: form,
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'okhttp/4.9.3',
        'Accept-Encoding': 'gzip'
      },
      responseType: 'arraybuffer',
      timeout: 30000
    });

    return data;
  } catch (error) {
    console.error('❌ Error en API Remini:', error.message);
    throw new Error('No se pudo procesar la imagen. Inténtalo de nuevo más tarde.');
  }
};

const handler = async (msg, { conn }) => {
  try {
    // Validar mensaje citado
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "🚫 *Error:* Debes *responder a una imagen* con el comando *`.hd`* para mejorarla."
      }, { quoted: msg });
    }

    // Validar tipo de archivo
    const mime = quoted.imageMessage?.mimetype || "";
    if (!/^image\/(jpe?g|png)$/i.test(mime)) {
      return await conn.sendMessage(msg.key.remoteJid, {
        text: "⚠️ *Formato no soportado.* Solo se permiten imágenes *JPG* o *PNG*."
      }, { quoted: msg });
    }

    // Reacción: inicio de procesamiento
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "🔄", key: msg.key }
    });

    // Descargar imagen
    const mediaStream = await downloadContentFromMessage(quoted.imageMessage, "image");
    let buffer = Buffer.alloc(0);
    for await (const chunk of mediaStream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    if (buffer.length === 0) throw new Error("La imagen está vacía o no se pudo descargar");

    // Crear carpeta temporal si no existe
    const tmpDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    // Procesar imagen con IA
    const inicio = Date.now();
    const enhancedImage = await remini(buffer);
    console.log(`✅ Procesamiento completado en ${(Date.now() - inicio) / 1000}s`);

    // Enviar imagen mejorada
    await conn.sendMessage(msg.key.remoteJid, {
      image: enhancedImage,
      caption:
`🖼️ *Imagen Mejorada con Tecnología HD*

💡 *Consejo:* Para mejores resultados, utiliza fotos con buena iluminación.

🤖 *Sya Team Ultra 2.0*`
    }, { quoted: msg });

    // Reacción de éxito
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "✅", key: msg.key }
    });

  } catch (error) {
    console.error('❌ Error en comando .hd:', error);

    let errorMsg = "❌ *Error al procesar la imagen.*";
    if (error.message.toLowerCase().includes("timeout")) {
      errorMsg = "⌛ *El servidor tardó demasiado en responder.* Intenta con una imagen más pequeña.";
    } else if (error.message.includes("vacía") || error.message.includes("descargar")) {
      errorMsg = "⚠️ *No se pudo descargar la imagen.* Intenta con otra foto.";
    }

    await conn.sendMessage(msg.key.remoteJid, {
      text: errorMsg
    }, { quoted: msg });

    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: "❌", key: msg.key }
    });
  }
};

handler.command = ['hd', 'enhance', 'remini'];
handler.tags = ['tools'];
handler.help = [
  'hd <responde a imagen> - Mejora la calidad de la imagen',
  'enhance <responde a imagen> - Alternativa para mejorar imágenes',
  'remini <responde a imagen> - Usa IA para mejorar fotos'
];

module.exports = handler;