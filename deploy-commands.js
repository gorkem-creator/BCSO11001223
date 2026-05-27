const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

// Komutlarımızı tanımlıyoruz
const commands = [
    new SlashCommandBuilder()
        .setName('mesai-panel')
        .setDescription('Mesai sistemini başlatır.'),
    
    new SlashCommandBuilder()
        .setName('mesai-siralama')
        .setDescription('Mesai sıralamasını gösterir.'),
    
    new SlashCommandBuilder()
        .setName('mesai-ekle')
        .setDescription('Kullanıcıya mesai ekler.')
        .addUserOption(option => option.setName('uye').setDescription('Üye').setRequired(true))
        .addIntegerOption(option => option.setName('dakika').setDescription('Dakika').setRequired(true)),
    
    new SlashCommandBuilder()
        .setName('mesai-sifirla')
        .setDescription('Kullanıcının mesaisini sıfırlar.')
        .addUserOption(option => option.setName('uye').setDescription('Üye').setRequired(true))
];

// Discord REST API ayarları
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Komutlar Discord\'a yükleniyor...');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID), 
            { body: commands },
        );

        console.log('✅ Başarıyla tüm komutlar yüklendi!');
    } catch (error) {
        console.error('Komut yükleme hatası:', error);
    }
})();
