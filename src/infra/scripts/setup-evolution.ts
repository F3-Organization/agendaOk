import { EvolutionApiAdapter } from '../adapters/evolution-api.adapter';
import { env } from '../config/configs';
import * as qrcode from 'qrcode-terminal';

async function setup() {
    console.log('🚀 Iniciando Setup da Evolution API...');
    
    const adapter = new EvolutionApiAdapter();
    const systemBot = env.evolution.systemBotInstance;
    const webhookUrl = env.evolution.webhookUrl;
    const forceLogout = process.argv.includes('--logout');

    try {
        if (forceLogout) {
            console.log(`🔌 Desconectando instância ${systemBot}...`);
            try {
                await adapter.logoutInstance(systemBot);
                console.log('✅ Desconectado com sucesso.');
            } catch (e) {
                console.log('⚠️ Erro ao desconectar (pode já estar desconectado).');
            }
        }

        console.log(`🔍 Verificando instância: ${systemBot}...`);
        let instanceExists = false;
        
        try {
            const state = await adapter.fetchInstance(systemBot);
            console.log(`✅ Instância encontrada. Status: ${state.instance.status}`);
            instanceExists = true;
        } catch (error) {
            console.log(`⚠️ Instância ${systemBot} não encontrada. Criando...`);
        }

        if (!instanceExists) {
            await adapter.createInstance(systemBot);
            console.log(`✅ Instância ${systemBot} criada com sucesso.`);
        }

        console.log(`🔗 Configurando Webhook: ${webhookUrl}...`);
        await adapter.setWebhook(systemBot, webhookUrl);
        console.log('✅ Webhook configurado com sucesso.');

        console.log('📡 Verificando conexão...');
        const state = await adapter.fetchInstance(systemBot);
        
        if (state.instance.status !== 'open') {
            console.log('\n📱 Instância NÃO conectada. Gerando QR Code...');
            const connection = await adapter.connectInstance(systemBot);
            
            console.log('\n--------------------------------------------------');
            console.log('✨ INSTRUÇÕES DE CONEXÃO ✨');
            console.log('1. Abra o WhatsApp no seu celular.');
            console.log('2. Vá em Configurações > Aparelhos Conectados.');
            console.log('3. Escaneie o QR Code abaixo diretamente no terminal:');
            console.log('\n📦 QR CODE:');
            qrcode.generate(connection.code, { small: true });
            console.log('\n--------------------------------------------------\n');
        } else {
            console.log('🎉 Tudo pronto! O Bot do Sistema está ONLINE e conectado.');
        }

    } catch (error: any) {
        console.error('❌ Erro durante o setup:', error.message);
        process.exit(1);
    }
}

setup();
