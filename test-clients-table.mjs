import { db } from './server/db.js';
import { clients } from './shared/schema.js';

console.log('🔄 Testando conexão com Neon e estrutura da tabela clients...');

try {
  // Testar se a tabela existe executando uma query simples
  const result = await db.select().from(clients).limit(1);
  console.log('✅ Tabela clients existe e está acessível!');
  console.log('📊 Registros encontrados:', result.length);
  
  // Verificar a estrutura da tabela executando uma query de contagem
  const count = await db.$count(clients);
  console.log('🗄️ Total de clientes no banco:', count);
  
  console.log('✅ Estrutura da tabela clients verificada com sucesso!');
  
} catch (error) {
  console.error('❌ Erro ao acessar tabela clients:', error.message);
} finally {
  process.exit(0);
}