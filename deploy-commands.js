const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
    // Mesai Sistemi Komutları
    new SlashCommandBuilder()
        .setName('mesai-panel')
        .setDescription('Mesai giriş/çıkış panelini gönderir.'),
    
    new SlashCommandBuilder()
        .setName('mesai-kontrol')
        .setDescription('Bir kullanıcının toplam mesai süresini gösterir.')
        .addUserOption(option => option.setName('uye').setDescription('Mesaisine bakılacak üye').setRequired(true)),
    
    new SlashCommandBuilder()
        .setName('mesai-ekle')
        .setDescription('Bir kullanıcıya mesai süresi ekler.')
        .addUserOption(option => option.setName('uye').setDescription('Üye seçin').setRequired(true))
        .addIntegerOption(option => option.setName('dakika').setDescription('Eklenecek dakika miktarı').setRequired(true)),
    
    new SlashCommandBuilder()
        .setName('mesai-sifirla')
        .setDescription('Bir kullanıcının mesaisini sıfırlar.')
        .addUserOption(option => option.setName('uye').setDescription('Sıfırlanacak üye').setRequired(true)),

    // Başvuru Sistemi Komutu
    new SlashCommandBuilder()
        .setName('basvuru-panel')
        .setDescription('Başvuru form panelini gönderir.')
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('🔄 Slash komutları Discord\'a yükleniyor...');
        
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('✅ Başarıyla tamamlandı! Tüm komutlar aktif.');
    } catch (error) {
        console.error('❌ Hata oluştu:', error);
    }
})();
