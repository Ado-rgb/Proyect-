const fs = require('fs')

module.exports = async (msg, { conn, usedPrefix }) => {
  try {
    await conn.sendMessage(msg.key.remoteJid, {
      react: { text: '⚔️', key: msg.key }
    })

    const menuText = `╭───𖣘『 *🌌 SYA TEAM BOT - MODO RPG* 』𖣘───╮

🔰 *Comienza tu aventura:*
│ 🧙‍♂️ ${usedPrefix}rpg <nombre> <edad>

🛡️ *Usuario:*
│ ⚔️ ${usedPrefix}nivel      ⚒️ ${usedPrefix}picar
│ ⛏️ ${usedPrefix}minar      🔨 ${usedPrefix}minar2
│ 💼 ${usedPrefix}work       🕵️ ${usedPrefix}crime
│ 🏴‍☠️ ${usedPrefix}robar    🎁 ${usedPrefix}cofre
│ 📦 ${usedPrefix}claim      🤺 ${usedPrefix}batallauser
│ 🏥 ${usedPrefix}hospital   🩹 ${usedPrefix}hosp

🎭 *Personajes:*
│ 👤 ${usedPrefix}per           🔰 ${usedPrefix}nivelper
│ ⚔️ ${usedPrefix}luchar        💥 ${usedPrefix}poder
│ 🕊️ ${usedPrefix}volar         🌌 ${usedPrefix}otromundo
│ 🌠 ${usedPrefix}otrouniverso  👼 ${usedPrefix}mododios
│ 😈 ${usedPrefix}mododiablo    ⚡ ${usedPrefix}podermaximo
│ 👾 ${usedPrefix}enemigos      🧾 ${usedPrefix}verper
│ 💰 ${usedPrefix}vender        ❌ ${usedPrefix}quitarventa

🐾 *Mascotas:*
│ 💧 ${usedPrefix}daragua        💓 ${usedPrefix}darcariño
│ 🍖 ${usedPrefix}darcomida      😎 ${usedPrefix}presumir
│ 🎯 ${usedPrefix}cazar          🧠 ${usedPrefix}entrenar
│ 🚶 ${usedPrefix}pasear         🌟 ${usedPrefix}supermascota
│ 🐶 ${usedPrefix}mascota        🏥 ${usedPrefix}curar
│ 📈 ${usedPrefix}nivelmascota   🐾 ${usedPrefix}batallamascota
│ 🛍️ ${usedPrefix}compra         🐕 ${usedPrefix}tiendamascotas
│ 📖 ${usedPrefix}vermascotas

✨ *Otros comandos útiles:*
│ ➕ ${usedPrefix}addmascota      ➕ ${usedPrefix}addper
│ 🗑️ ${usedPrefix}deleteuser      🗑️ ${usedPrefix}deleteper
│ 🗑️ ${usedPrefix}deletemascota   📊 ${usedPrefix}totalper
│ 💱 ${usedPrefix}tran            💸 ${usedPrefix}transferir
│ 🎁 ${usedPrefix}dame            🏧 ${usedPrefix}dep
│ 🪙 ${usedPrefix}bal             💼 ${usedPrefix}saldo
│ 🏦 ${usedPrefix}retirar         🏛️ ${usedPrefix}depositar
│ 🧼 ${usedPrefix}delrpg          🚀 ${usedPrefix}rpgazura

🏆 *TOP Jugadores:*
│ 🏅 ${usedPrefix}topuser         🥇 ${usedPrefix}topmascotas
│ 🥈 ${usedPrefix}topper

╰─────𖣘 *Desarrollado por SYA TEAM* 𖣘─────╯`

    await conn.sendMessage(msg.key.remoteJid, {
      image: { url: 'https://cdn.russellxz.click/0abb8549.jpeg' },
      caption: menuText
    }, { quoted: msg })

  } catch (error) {
    console.error('❌ Error en el comando .menurpg:', error)
    await conn.sendMessage(msg.key.remoteJid, {
      text: '❌ *Ocurrió un error al mostrar el menú RPG.*'
    }, { quoted: msg })
  }
}

module.exports.command = ['menurpg']