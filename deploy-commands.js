const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
    new SlashCommandBuilder().setName('mesai-panel').setDescription('Mesai panelini gönderir.'),
    new SlashCommandBuilder().setName('basvuru-panel').setDescription('Başvuru panelini gönderir.'),
    new SlashCommandBuilder().setName('mesai-kontrol').setDescription('Kullanıcı mesaisini gösterir.').addUserOption(o => o.setName('uye').setRequired(true)),
    new SlashCommandBuilder().setName('mesai-ekle').setDescription('Mesai ekler.').addUserOption(o => o.setName('uye').setRequired(true)).addIntegerOption(o => o.setName('dakika').setRequired(true)),
    new SlashCommandBuilder().setName('mesai-sifirla').setDescription('Sıfırlar.').addUserOption(o => o.setName('uye').setRequired(true))
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log('✅ Tüm komutlar yüklendi.');
})();
