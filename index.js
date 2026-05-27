require('dotenv').config();

const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('BCSO Botu Aktif ve Çalışıyor!');
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Web sunucusu ${port} portunda çalışıyor.`);
});

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    InteractionType
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
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const CADET_ROLE_ID = "1438149589579599958";

const KANALLAR = {
    MESAI_LOG: "⏰・ᴍᴇꜱᴀɪ-ʟᴏɢ",
    BASVURU_DURUM: "📚・ʙᴀşᴠᴜʀᴜ-ᴅᴜʀᴜᴍ",
    PANEL_FOTO: "https://media.discordapp.net/attachments/1498313566015717446/1498797722365460683/image.png"
};

client.once('ready', () => {
    console.log(`🟢 ${client.user.tag} aktif`);
});

function saat() {
    return new Date().toLocaleString("tr-TR");
}

client.on('interactionCreate', async interaction => {

    try {

        /* =========================
           MODAL İŞLEMLERİ
        ========================= */

        if (
            interaction.type === InteractionType.ModalSubmit &&
            interaction.customId === 'basvuru_modal'
        ) {

            const ooc = interaction.fields.getTextInputValue('ooc_bilgi');
            const ic = interaction.fields.getTextInputValue('ic_bilgi');
            const aktiflik = interaction.fields.getTextInputValue('aktiflik');
            const neden = interaction.fields.getTextInputValue('neden_bcso');
            const bilgi = interaction.fields.getTextInputValue('polislik_bilgi');

            const durumKanali = interaction.guild.channels.cache.find(
                c => c.name === KANALLAR.BASVURU_DURUM
            );

            const embed = new EmbedBuilder()
                .setTitle("📝 YENİ PERSONEL BAŞVURUSU")
                .setColor("Blue")
                .addFields(
                    {
                        name: "👤 Başvuran",
                        value: `${interaction.user} (${interaction.user.id})`
                    },
                    {
                        name: "🌐 OOC İsim/Yaş",
                        value: ooc
                    },
                    {
                        name: "🛡️ İC İsim/Yaş",
                        value: ic
                    },
                    {
                        name: "⏳ Aktiflik Süresi",
                        value: aktiflik
                    },
                    {
                        name: "❓ Neden BCSO?",
                        value: neden
                    },
                    {
                        name: "📚 Polislik Bilgisi",
                        value: `${bilgi}/10`
                    }
                );

            const row = new ActionRowBuilder().addComponents(

                new ButtonBuilder()
                    .setCustomId(`onayla_${interaction.user.id}`)
                    .setLabel("ONAYLA")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId(`reddet_${interaction.user.id}`)
                    .setLabel("REDDET")
                    .setStyle(ButtonStyle.Danger)

            );

            if (durumKanali) {
                await durumKanali.send({
                    embeds: [embed],
                    components: [row]
                });
            }

            return interaction.reply({
                content: "✅ Başvurunuz başarıyla iletildi.",
                ephemeral: true
            });
        }

        /* =========================
           BUTONLAR
        ========================= */

        if (interaction.isButton()) {

            /* BAŞVURU FORMU */

            if (interaction.customId === "basvuru_yap") {

                const modal = new ModalBuilder()
                    .setCustomId('basvuru_modal')
                    .setTitle('BCSO Başvuru Formu');

                modal.addComponents(

                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ooc_bilgi')
                            .setLabel("OOC İsim Soyisim / Yaş")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    ),

                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('ic_bilgi')
                            .setLabel("İC İsim Soyisim / Yaş")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    ),

                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('aktiflik')
                            .setLabel("Aktiflik Süreniz")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    ),

                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('neden_bcso')
                            .setLabel("Neden BCSO?")
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    ),

                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('polislik_bilgi')
                            .setLabel("Polislik Bilginiz (0-10)")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                );

                return interaction.showModal(modal);
            }

            /* BAŞVURU ONAY */

            if (interaction.customId.startsWith("onayla_")) {

                const member = await interaction.guild.members.fetch(
                    interaction.customId.split("_")[1]
                );

                await member.roles.add(CADET_ROLE_ID);

                await interaction.message.edit({
                    embeds: [
                        EmbedBuilder
                            .from(interaction.message.embeds[0])
                            .setColor("Green")
                            .setTitle("✅ ONAYLANDI")
                    ],
                    components: []
                });

                return interaction.reply({
                    content: "✅ Başvuru onaylandı ve rol verildi.",
                    ephemeral: true
                });
            }

            /* BAŞVURU RED */

            if (interaction.customId.startsWith("reddet_")) {

                await interaction.message.edit({
                    embeds: [
                        EmbedBuilder
                            .from(interaction.message.embeds[0])
                            .setColor("Red")
                            .setTitle("❌ REDDEDİLDİ")
                    ],
                    components: []
                });

                return interaction.reply({
                    content: "❌ Başvuru reddedildi.",
                    ephemeral: true
                });
            }

            /* MESAİ GİR */

            if (interaction.customId === "mesai_gir") {

                await db.set(`mesai_${interaction.user.id}`, Date.now());

                const log = interaction.guild.channels.cache.find(
                    c => c.name === KANALLAR.MESAI_LOG
                );

                if (log) {

                    await log.send(
`🚓 **MESAİ BİLDİRİMİ**

👮 Personel: ${interaction.user}
📟 Durum: MESAİYE BAŞLADI (10-41)
🕒 Saat: ${saat()}`
                    );

                }

                return interaction.reply({
                    content: "✅ Mesaiye giriş yaptın.",
                    ephemeral: true
                });
            }

            /* MESAİ ÇIK */

            if (interaction.customId === "mesai_cik") {

                const start = await db.get(`mesai_${interaction.user.id}`);

                if (!start) {

                    return interaction.reply({
                        content: "❌ Aktif mesain yok.",
                        ephemeral: true
                    });

                }

                const dakika = Math.floor((Date.now() - start) / 60000);

                await db.add(`toplam_${interaction.user.id}`, dakika);

                await db.delete(`mesai_${interaction.user.id}`);

                const log = interaction.guild.channels.cache.find(
                    c => c.name === KANALLAR.MESAI_LOG
                );

                if (log) {

                    await log.send(
`🚓 **MESAİ BİLDİRİMİ**

👮 Personel: ${interaction.user}
📟 Durum: MESAİ BİTTİ (10-42)
🕒 Çıkış Saati: ${saat()}
⏱ Süre: ${dakika} dakika`
                    );

                }

                return interaction.reply({
                    content: `✅ Mesaiden çıktın. (${dakika} dakika)`,
                    ephemeral: true
                });
            }
        }

        /* =========================
           SLASH KOMUTLAR
        ========================= */

        if (interaction.isChatInputCommand()) {

            /* MESAİ PANEL */

            if (interaction.commandName === 'mesai-panel') {

                const embed = new EmbedBuilder()
                    .setTitle("🚓 BCSO MESAI")
                    .setDescription(
                        "Mesaide değilken botu açık bırakmanız Strike 1 ile sonuçlanır."
                    )
                    .setImage(KANALLAR.PANEL_FOTO)
                    .setColor("DarkBlue");

                const row = new ActionRowBuilder().addComponents(

                    new ButtonBuilder()
                        .setCustomId("mesai_gir")
                        .setLabel("GİRİŞ (10-41)")
                        .setStyle(ButtonStyle.Success),

                    new ButtonBuilder()
                        .setCustomId("mesai_cik")
                        .setLabel("ÇIKIŞ (10-42)")
                        .setStyle(ButtonStyle.Danger)

                );

                return interaction.reply({
                    embeds: [embed],
                    components: [row]
                });
            }

            /* BAŞVURU PANEL */

            if (interaction.commandName === 'basvuru-panel') {

                const embed = new EmbedBuilder()
                    .setTitle("👮 BCSO BAŞVURU")
                    .setDescription(
                        "Blaine County Sheriff Office bünyesinde görev yapabilmek için formu doldurun.\n\n⚠️ 5X Strike = İhraç\nℹ️ Herkes Deputy Cadet olarak başlar."
                    )
                    .setImage(KANALLAR.PANEL_FOTO)
                    .setColor("Blue");

                const row = new ActionRowBuilder().addComponents(

                    new ButtonBuilder()
                        .setCustomId("basvuru_yap")
                        .setLabel("BAŞVURU YAP")
                        .setStyle(ButtonStyle.Primary)

                );

                return interaction.reply({
                    embeds: [embed],
                    components: [row]
                });
            }

            /* MESAİ SIRALAMA */

            if (interaction.commandName === "mesai-siralama") {

                const all = await db.all();

                const filtre = all
                    .filter(x => x.id.startsWith("toplam_"))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 20);

                if (filtre.length <= 0) {
                    return interaction.reply({
                        content: "❌ Veri bulunamadı.",
                        ephemeral: true
                    });
                }

                let text = "";

                for (let i = 0; i < filtre.length; i++) {

                    const userId = filtre[i].id.replace("toplam_", "");

                    const member = await interaction.guild.members.fetch(userId).catch(() => null);

                    text += `#${i + 1} - ${member ? member.user.tag : "Kullanıcı"} → ${filtre[i].value} dakika\n`;
                }

                const embed = new EmbedBuilder()
                    .setTitle("🏆 MESAİ SIRALAMASI")
                    .setDescription(text)
                    .setColor("Gold");

                return interaction.reply({
                    embeds: [embed]
                });
            }

            /* MESAİ EKLE */

            if (interaction.commandName === "mesai-ekle") {

                const uye = interaction.options.getUser("uye");
                const dakika = interaction.options.getInteger("dakika");

                await db.add(`toplam_${uye.id}`, dakika);

                return interaction.reply({
                    content: `✅ ${uye} kullanıcısına ${dakika} dakika mesai eklendi.`,
                    ephemeral: true
                });
            }

            /* MESAİ SIFIRLA */

            if (interaction.commandName === "mesai-sifirla") {

                const uye = interaction.options.getUser("uye");

                await db.set(`toplam_${uye.id}`, 0);

                return interaction.reply({
                    content: `✅ ${uye} kullanıcısının mesaisi sıfırlandı.`,
                    ephemeral: true
                });
            }

            /* SES KANALINA KATIL */

            if (interaction.commandName === "katil") {

                const kanal = interaction.member.voice.channel;

                if (!kanal) {

                    return interaction.reply({
                        content: "❌ Önce bir ses kanalına gir.",
                        ephemeral: true
                    });

                }

                joinVoiceChannel({
                    channelId: kanal.id,
                    guildId: kanal.guild.id,
                    adapterCreator: kanal.guild.voiceAdapterCreator,
                    selfDeaf: false
                });

                return interaction.reply({
                    content: `✅ ${kanal.name} kanalına katıldım.`,
                    ephemeral: true
                });
            }

            /* SES KANALINDAN AYRIL */

            if (interaction.commandName === "ayril") {

                const connection = getVoiceConnection(interaction.guild.id);

                if (!connection) {

                    return interaction.reply({
                        content: "❌ Bot ses kanalında değil.",
                        ephemeral: true
                    });

                }

                connection.destroy();

                return interaction.reply({
                    content: "✅ Ses kanalından ayrıldım.",
                    ephemeral: true
                });
            }
        }

    } catch (err) {

        console.log(err);

        if (!interaction.replied) {

            interaction.reply({
                content: "❌ Bir hata oluştu.",
                ephemeral: true
            }).catch(() => { });

        }

    }

});

client.login(process.env.TOKEN);
