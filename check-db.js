#!/usr/bin/env node

/**
 * Script de diagnóstico para verificar conectividade com Neon Database
 */

import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Carregar variáveis de ambiente
dotenv.config();

async function checkDatabaseConnectivity() {
  console.log('🔍 Verificando conectividade com Neon Database...\n');
  
  // Verificar configurações
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não configurada no .env');
    process.exit(1);
  }
  
  console.log('✅ DATABASE_URL encontrada');
  console.log('🔗 URL:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@'));
  
  try {
    // Configurar Neon
    neonConfig.webSocketConstructor = ws.default;
    neonConfig.poolQueryViaFetch = true;
    neonConfig.useSecureWebSocket = true;
    neonConfig.fetchConnectionCache = true;
    
    console.log('\n🔧 Configurações Neon aplicadas');
    
    // Criar pool de conexões
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      min: 0,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 8000,
      query_timeout: 15000,
      statement_timeout: 15000,
      allowExitOnIdle: true,
    });
    
    console.log('🏊 Pool de conexões criado');
    
    // Teste 1: Conectar
    console.log('\n📡 Teste 1: Estabelecendo conexão...');
    const client = await Promise.race([
      pool.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na conexão (8s)')), 8000)
      )
    ]);
    console.log('✅ Conexão estabelecida');
    
    // Teste 2: Query simples
    console.log('📊 Teste 2: Executando query de teste...');
    const result = await Promise.race([
      client.query('SELECT NOW() as current_time, version() as db_version'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na query (5s)')), 5000)
      )
    ]);
    console.log('✅ Query executada com sucesso');
    console.log('⏰ Hora atual do DB:', result.rows[0].current_time);
    console.log('🗄️ Versão do PostgreSQL:', result.rows[0].db_version.split(' ')[0]);
    
    // Teste 3: Verificar tabelas principais
    console.log('\n🔍 Teste 3: Verificando estrutura do banco...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log('📋 Tabelas encontradas:');
    tables.rows.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    // Teste 4: Verificar índices e performance
    console.log('\n⚡ Teste 4: Verificando performance...');
    const start = Date.now();
    await client.query('SELECT COUNT(*) FROM users');
    const duration = Date.now() - start;
    console.log(`✅ Query de contagem executada em ${duration}ms`);
    
    // Liberar cliente
    client.release();
    
    // Fechar pool
    await pool.end();
    
    console.log('\n🎉 Todos os testes passaram! O banco está funcionando corretamente.');
    console.log('💡 Se ainda houver erros no aplicativo, pode ser um problema temporário de rede.');
    
  } catch (error) {
    console.error('\n❌ Erro durante os testes:');
    console.error('📝 Erro:', error.message);
    console.error('🔧 Stack:', error.stack);
    
    // Sugestões de correção
    console.log('\n💡 Possíveis soluções:');
    console.log('1. Verificar se sua conexão de internet está estável');
    console.log('2. Verificar se o Neon Database não está em manutenção');
    console.log('3. Tentar novamente em alguns minutos');
    console.log('4. Verificar se a DATABASE_URL está correta');
    console.log('5. Verificar se há firewall bloqueando a conexão');
    
    process.exit(1);
  }
}

// Executar verificação
checkDatabaseConnectivity();