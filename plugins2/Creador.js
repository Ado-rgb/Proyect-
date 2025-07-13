const handler = async (msg, { conn }) => {
  const creators = [
    {
      number: "50493732693@s.whatsapp.net",
      name: "Wirk (🇭🇳 Honduras)"
    },
    {
      number: "51921826291@s.whatsapp.net",
      name: "Maycol (🇵🇪 Perú)"
    },
    {
      number: "573133374132@s.whatsapp.net",
      name: "Andrés (🇨🇴 Colombia)"
    }
  ];

  const contactCards = creators.map(({ number, name }) => ({
    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL;waid=${number.split('@')[0]}:+${number.split('@')[0]}\nEND:VCARD`
  }));

  const infoText = `📞 *Contactos Oficiales del Creadores del Subbot SYA TEAM*

¿Tienes dudas, sugerencias o quieres soporte técnico personalizado?
Puedes comunicarte directamente con cualquiera de los desarrolladores y fundadores:

👨‍💻 *Wirk* (🇭🇳 Honduras)
🔢 +504 9373 2693

👨‍💻 *Maycol* (🇵🇪 Perú)
🔢 +51 921 826 291

👨‍💻 *Andres* (🇨🇴 Colombia)
🔢 +57 313 337 4132

💬 *Toca cualquier contacto para enviar un mensaje directo por WhatsApp.*`;

  // Enviar tarjetas de contacto
  await conn.sendMessage(msg.key.remoteJid, {
    contacts: {
      displayName: "Creadores del Subbot",
      contacts: contactCards
    }
  });

  // Enviar texto con detalles
  await conn.sendMessage(msg.key.remoteJid, {
    text: infoText
  }, { quoted: msg });
};

handler.command = ['creador', 'owner', 'dueño'];
module.exports = handler;