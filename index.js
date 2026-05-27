require('dotenv').config();

const {
Client,
GatewayIntentBits,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle
} = require('discord.js');

const {
joinVoiceChannel,
getVoiceConnection
} = require('@discordjs/voice');

const { QuickDB } = require('quick.db');
const db = new QuickDB();

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMembers,
GatewayIntentBits.GuildVoiceStates
]
});

client.once('ready', () => {
console.log(`🟢 ${client.user.tag} aktif`);
});

function saat() {
return new Date().toLocaleString("tr-TR");
}

/* ================= INTERACTION ================= */

client.on('interactionCreate', async interaction => {

try {

/* ================= KOMUTLAR ================= */

if(interaction.isChatInputCommand()) {

/* MESAI PANEL */

if(interaction.commandName === "mesai-panel") {

const embed = new EmbedBuilder()
.setTitle("🚓 BCSO MESAI SISTEMI")
.setDescription(
"Mesai giriş/çıkış sistemi aktif.\n\n" +
"⚠️ Mesaide değilken botu açık bırakmanız strike sebebidir."
)
.setImage("https://media.discordapp.net/attachments/1498313566015717446/1498797722365460683/image.png?ex=6a180a67&is=6a16b8e7&hm=8253fb6be5195a27bcb080c06ed90d8365dd88fb751efd20866947c6e1ce0127&=&format=webp&quality=lossless&width=1872&height=761")
.setColor("#2b2d31");

const row = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("mesai_gir")
.setLabel("MESAİYE GİR")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("mesai_cik")
.setLabel("MESAİDEN ÇIK")
.setStyle(ButtonStyle.Danger)

);

return interaction.reply({
embeds:[embed],
components:[row]
});
}

/* MESAI SIRALAMA */

if(interaction.commandName === "mesai-siralama") {

const all = await db.all();

const filtre = all
.filter(x => x.id.startsWith("toplam_"))
.sort((a,b) => b.value - a.value)
.slice(0,20);

if(filtre.length <= 0) {
return interaction.reply({
content:"❌ Veri bulunamadı.",
ephemeral:true
});
}

let text = "";

for(let i = 0; i < filtre.length; i++) {

const userId = filtre[i].id.replace("toplam_","");

const member = await interaction.guild.members.fetch(userId).catch(()=>null);

text += `#${i+1} - ${member ? member.user.tag : "Kullanıcı"} → ${filtre[i].value} dakika\n`;
}

const embed = new EmbedBuilder()
.setTitle("🏆 MESAİ SIRALAMASI")
.setDescription(text)
.setColor("Gold");

return interaction.reply({
embeds:[embed]
});
}

/* MESAI EKLE */

if(interaction.commandName === "mesai-ekle") {

const uye = interaction.options.getUser("uye");
const dakika = interaction.options.getInteger("dakika");

await db.add(`toplam_${uye.id}`, dakika);

return interaction.reply({
content:`✅ ${uye} kullanıcısına ${dakika} dakika mesai eklendi.`,
ephemeral:true
});
}

/* MESAI SIFIRLA */

if(interaction.commandName === "mesai-sifirla") {

const uye = interaction.options.getUser("uye");

await db.set(`toplam_${uye.id}`, 0);

return interaction.reply({
content:`✅ ${uye} kullanıcısının mesaisi sıfırlandı.`,
ephemeral:true
});
}

/* KATIL */

if(interaction.commandName === "katil") {

const kanal = interaction.member.voice.channel;

if(!kanal) {
return interaction.reply({
content:"❌ Önce bir ses kanalına gir.",
ephemeral:true
});
}

joinVoiceChannel({
channelId: kanal.id,
guildId: kanal.guild.id,
adapterCreator: kanal.guild.voiceAdapterCreator,
selfDeaf: false
});

return interaction.reply({
content:`✅ ${kanal.name} kanalına katıldım.`,
ephemeral:true
});
}

/* AYRIL */

if(interaction.commandName === "ayril") {

const connection = getVoiceConnection(interaction.guild.id);

if(!connection) {
return interaction.reply({
content:"❌ Bot ses kanalında değil.",
ephemeral:true
});
}

connection.destroy();

return interaction.reply({
content:"✅ Ses kanalından ayrıldım.",
ephemeral:true
});
}

}

/* ================= BUTTON ================= */

if(interaction.isButton()) {

/* MESAI GIR */

if(interaction.customId === "mesai_gir") {

await db.set(`mesai_${interaction.user.id}`, Date.now());

const log = interaction.guild.channels.cache.find(
c => c.name === "⏰・ᴍᴇꜱᴀɪ-ʟᴏɢ"
);

if(log) {

await log.send(
`🚓 **MESAİ BİLDİRİMİ**

👮 Personel: ${interaction.user}
📟 Durum: MESAİYE BAŞLADI (10-41)
🕒 Saat: ${saat()}`
);

}

return interaction.reply({
content:"✅ Mesaiye giriş yaptın.",
ephemeral:true
});
}

/* MESAI CIK */

if(interaction.customId === "mesai_cik") {

const start = await db.get(`mesai_${interaction.user.id}`);

if(!start) {

return interaction.reply({
content:"❌ Aktif mesain yok.",
ephemeral:true
});

}

const dakika = Math.floor((Date.now() - start) / 60000);

await db.add(`toplam_${interaction.user.id}`, dakika);

await db.delete(`mesai_${interaction.user.id}`);

const log = interaction.guild.channels.cache.find(
c => c.name === "⏰・ᴍᴇꜱᴀɪ-ʟᴏɢ"
);

if(log) {

await log.send(
`🚓 **MESAİ BİLDİRİMİ**

👮 Personel: ${interaction.user}
📟 Durum: MESAİ BİTTİ (10-42)
🕒 Çıkış Saati: ${saat()}
⏱ Süre: ${dakika} dakika`
);

}

return interaction.reply({
content:`✅ Mesaiden çıktın. (${dakika} dakika)`,
ephemeral:true
});
}

}

} catch(err) {

console.log(err);

if(!interaction.replied) {

interaction.reply({
content:"❌ Bir hata oluştu.",
ephemeral:true
}).catch(()=>{});

}

}

});

client.login(process.env.TOKEN);
