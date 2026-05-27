require('dotenv').config();
const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType 
} = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

// --- WEB SUNUCUSU (Render Uyumu İçin) ---
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('BCSO Botu Aktif ve Çalışıyor!'));
app.listen(port, () => console.log(`Web sunucusu ${port} portunda çalışıyor.`));
// ----------------------------------------

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ]
});

// AYARLAR
const CADET_ROLE_ID = "1438149589579599958";
const KANALLAR = {
    MESAI_LOG: "⏰・ᴍᴇꜱᴀɪ-ʟᴏɢ",
    BASVURU_DURUM: "📚・ʙᴀşᴠᴜʀᴜ-ᴅᴜʀᴜᴍ",
    PANEL_FOTO: "https://media.discordapp.net/attachments/1498313566015717446/1498797722365460683/image.png"
};

client.once('ready', () => console.log(`🟢 BCSO Denetim Sistemi Başarıyla Başladı.`));

client.on('interactionCreate', async interaction => {
    // MODAL (FORM) İŞLEMLERİ
    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'basvuru_modal') {
        const ooc = interaction.fields.getTextInputValue('ooc_bilgi');
        const ic = interaction.fields.getTextInputValue('ic_bilgi');
        const aktiflik = interaction.fields.getTextInputValue('aktiflik');
        const neden = interaction.fields.getTextInputValue('neden_bcso');
        const bilgi = interaction.fields.getTextInputValue('polislik_bilgi');

        const durumKanali = interaction.guild.channels.cache.find(c => c.name === KANALLAR.BASVURU_DURUM);
        const embed = new EmbedBuilder()
            .setTitle("📝 YENİ PERSONEL BAŞVURUSU")
            .setColor("Blue")
            .addFields(
                { name: "👤 Başvuran", value: `${interaction.user} (${interaction.user.id})` },
                { name: "🌐 OOC İsim/Yaş", value: ooc },
                { name: "🛡️ İC İsim/Yaş", value: ic },
                { name: "⏳ Aktiflik Süresi", value: aktiflik },
                { name: "❓ Neden BCSO?", value: neden },
                { name: "📚 Polislik Bilgisi", value: `${bilgi}/10` }
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`onayla_${interaction.user.id}`).setLabel("ONAYLA").setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`reddet_${interaction.user.id}`).setLabel("REDDET").setStyle(ButtonStyle.Danger)
        );
        if (durumKanali) await durumKanali.send({ embeds: [embed], components: [row] });
        return interaction.reply({ content: "✅ Başvurunuz başarıyla iletildi.", ephemeral: true });
    }

    // BUTON İŞLEMLERİ
    if (interaction.isButton()) {
        if (interaction.customId === "basvuru_yap") {
            const modal = new ModalBuilder().setCustomId('basvuru_modal').setTitle('BCSO Başvuru Formu');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ooc_bilgi').setLabel("OOC İsim Soyisim / Yaş").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('ic_bilgi').setLabel("İC İsim Soyisim / Yaş").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('aktiflik').setLabel("Aktiflik Süreniz").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('neden_bcso').setLabel("Neden BCSO?").setStyle(TextInputStyle.Paragraph).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('polislik_bilgi').setLabel("Polislik Bilginiz (0-10)").setStyle(TextInputStyle.Short).setRequired(true))
            );
            return interaction.showModal(modal);
        }
        
        if (interaction.customId.startsWith("onayla_")) {
            const member = await interaction.guild.members.fetch(interaction.customId.split("_")[1]);
            await member.roles.add(CADET_ROLE_ID);
            await interaction.message.edit({ embeds: [EmbedBuilder.from(interaction.message.embeds[0]).setColor("Green").setTitle("✅ ONAYLANDI")], components: [] });
            return interaction.reply({ content: "Rol verildi.", ephemeral: true });
        }
        
        if (interaction.customId.startsWith("reddet_")) {
            await interaction.message.edit({ embeds: [EmbedBuilder.from(interaction.message.embeds[0]).setColor("Red").setTitle("❌ REDDEDİLDİ")], components: [] });
            return interaction.reply({ content: "Başvuru reddedildi.", ephemeral: true });
        }
    }

    // SLASH KOMUTLAR
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'mesai-panel') {
            const embed = new EmbedBuilder().setTitle("🚓 BCSO MESAI").setImage(KANALLAR.PANEL_FOTO).setDescription("Mesaide değilken botu açık bırakmanız Strike 1 ile sonuçlanır.");
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("mesai_gir").setLabel("GİRİŞ (10-41)").setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId("mesai_cik").setLabel("ÇIKIŞ (10-42)").setStyle(ButtonStyle.Danger)
            );
            return interaction.reply({ embeds: [embed], components: [row] });
        }
        if (interaction.commandName === 'basvuru-panel') {
            const embed = new EmbedBuilder().setTitle("👮 BCSO BAŞVURU").setDescription("Blaine County Sheriff Office bünyesinde görev yapabilmek için formu doldurun.\n⚠️ 5X Strike = İhraç.\nℹ️ Herkes Deputy Cadet olarak başlar.");
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("basvuru_yap").setLabel("BAŞVURU YAP").setStyle(ButtonStyle.Primary));
            return interaction.reply({ embeds: [embed], components: [row] });
        }
    }
});

client.login(process.env.TOKEN);
