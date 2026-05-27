require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [

new SlashCommandBuilder()
.setName('mesai-panel')
.setDescription('Mesai panelini gönderir'),

new SlashCommandBuilder()
.setName('mesai-siralama')
.setDescription('Mesai sıralamasını gösterir'),

new SlashCommandBuilder()
.setName('mesai-ekle')
.setDescription('Bir kullanıcıya mesai ekler')

.addUserOption(option =>
option
.setName('uye')
.setDescription('Üye seç')
.setRequired(true))

.addIntegerOption(option =>
option
.setName('dakika')
.setDescription('Dakika gir')
.setRequired(true)),

new SlashCommandBuilder()
.setName('mesai-sifirla')
.setDescription('Bir kullanıcının mesaisini sıfırlar')

.addUserOption(option =>
option
.setName('uye')
.setDescription('Üye seç')
.setRequired(true)),

new SlashCommandBuilder()
.setName('katil')
.setDescription('Bulunduğun ses kanalına katılır'),

new SlashCommandBuilder()
.setName('ayril')
.setDescription('Ses kanalından ayrılır')

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {

try {

console.log('🔄 Komutlar yükleniyor...');

await rest.put(
Routes.applicationCommands(process.env.CLIENT_ID),
{ body: commands }
);

console.log('✅ Komutlar başarıyla yüklendi.');

} catch (error) {

console.error(error);

}

})();
