// Debug direto do banco para verificar ownership da propriedade ID 2
import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function debugOwnership() {
  console.log("🔧 Debug de ownership da propriedade ID 2...");
  
  let client;
  try {
    // Conectar ao banco
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: true
    });
    
    client = await pool.connect();
    console.log("✅ Conectado ao banco");
    
    // Buscar a propriedade ID 2
    const propertyResult = await client.query('SELECT id, "userId", street, "number" FROM properties WHERE id = $1', [2]);
    console.log("\n=== PROPRIEDADE ID 2 ===");
    
    if (propertyResult.rows.length === 0) {
      console.log("❌ Propriedade ID 2 não encontrada!");
      return;
    }
    
    const property = propertyResult.rows[0];
    console.log("Property data:", property);
    console.log(`Property userId: "${property.userId}" (type: ${typeof property.userId})`);
    
    // Buscar usuários para comparar
    const usersResult = await client.query('SELECT id, email, "firstName", "lastName" FROM users ORDER BY id');
    console.log("\n=== USUÁRIOS CADASTRADOS ===");
    usersResult.rows.forEach(user => {
      console.log(`User ID: "${user.id}" (type: ${typeof user.id}) - ${user.firstName} ${user.lastName} (${user.email})`);
    });
    
    // Simular verificação de ownership
    console.log("\n=== SIMULAÇÃO DE OWNERSHIP ===");
    usersResult.rows.forEach(user => {
      const propertyUserId = String(property.userId);
      const sessionUserId = String(user.id);
      const hasAccess = propertyUserId === sessionUserId;
      
      console.log(`User ${user.id} (${user.firstName}): "${propertyUserId}" === "${sessionUserId}" = ${hasAccess}`);
    });
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    if (client) {
      client.release();
      console.log("🔌 Conexão fechada");
    }
  }
}

debugOwnership();