require('dotenv').config();
const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle 
} = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent, // Form mesajlarını okumak için şart
        GatewayIntentBits.GuildMessages
    ]
});

// AYARLAR - Buraları mutlaka doldur!
const LOG_KANAL_ID = "BURAYA_LOG_KANAL_ID_YAZ"; 
const VERILECEK_ROL_ID = "BURAYA_ROL_ID_YAZ"; 

client.once('ready', () => {
    console.log(`🟢 ${client.user.tag} aktif`);
});

function saat() {
    return new Date().toLocaleString("tr-TR");
}

/* ================= BAŞVURU SİSTEMİ ================= */
client.on('messageCreate', async (message) => {
    // Sadece log kanalındaki embedli mesajları yakala
    if (message.channel.id === LOG_KANAL_ID && message.embeds.length > 0) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('onayla').setLabel('Onayla').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('reddet').setLabel('Reddet').setStyle(ButtonStyle.Danger)
        );
        await message.edit({ components: [row] });
    }
});

/* ================= INTERACTION (MESAİ + BUTONLAR) ================= */
client.on('interactionCreate', async interaction => {
    try {
        // BAŞVURU BUTONLARI
        if (interaction.isButton()) {
            if (interaction.customId === 'onayla') {
                const userId = interaction.message.embeds[0].fields[0].value.replace(/\D/g, '');
                const member = await interaction.guild.members.fetch(userId);
                await member.roles.add(VERILECEK_ROL_ID);
                return interaction.reply({ content: '✅ Başvuru onaylandı, rol verildi.', ephemeral: true });
            }
            if (interaction.customId === 'reddet') {
                return interaction.reply({ content: '❌ Başvuru reddedildi.', ephemeral: true });
            }

            // MESAİ BUTONLARI (Mevcut kodun)
            if (interaction.customId === "mesai_gir") {
                await db.set(`mesai_${interaction.user.id}`, Date.now());
                return interaction.reply({ content: "✅ Mesaiye giriş yaptın.", ephemeral: true });
            }
            if (interaction.customId === "mesai_cik") {
                const start = await db.get(`mesai_${interaction.user.id}`);
                if (!start) return interaction.reply({ content: "❌ Aktif mesain yok.", ephemeral: true });
                const dakika = Math.floor((Date.now() - start) / 60000);
                await db.add(`toplam_${interaction.user.id}`, dakika);
                await db.delete(`mesai_${interaction.user.id}`);
                return interaction.reply({ content: `✅ Mesaiden çıktın. (${dakika} dakika)`, ephemeral: true });
            }
        }

        // KOMUTLAR
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === "mesai-panel") {
                const embed = new EmbedBuilder().setTitle("🚓 BCSO MESAI SISTEMI").setColor("#2b2d31");
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("mesai_gir").setLabel("MESAİYE GİR").setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId("mesai_cik").setLabel("MESAİDEN ÇIK").setStyle(ButtonStyle.Danger)
                );
                return interaction.reply({ embeds: [embed], components: [row] });
            }
            // Diğer komutlarını buraya eklemeye devam edebilirsin...
        }
    } catch (err) {
        console.log(err);
    }
});

client.login(process.env.TOKEN);
