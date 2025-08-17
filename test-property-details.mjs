import { initializeDB } from "./server/db.js";
import { properties } from "./shared/schema.js";
import { eq } from "drizzle-orm";

async function testPropertyDetails() {
  try {
    console.log("🔧 Testando PropertyDetails...");
    
    // Inicializar banco
    const { db } = await initializeDB();
    
    // Buscar todas as propriedades
    const allProperties = await db.select().from(properties);
    console.log(`Encontradas ${allProperties.length} propriedades:`);
    
    allProperties.forEach(prop => {
      console.log(`ID: ${prop.id}, Sequência: ${prop.sequenceNumber}, Usuário: ${prop.userId}, Endereço: ${prop.street}, ${prop.number}`);
    });
    
    if (allProperties.length > 0) {
      const testProperty = allProperties[0];
      console.log(`\n📋 Testando propriedade específica (ID: ${testProperty.id}):`);
      
      const specificProperty = await db.select().from(properties).where(eq(properties.id, testProperty.id));
      console.log("Propriedade encontrada:", specificProperty[0]);
      
      // Verificar se o userId é string ou number
      console.log(`UserId type: ${typeof testProperty.userId}, Value: "${testProperty.userId}"`);
    }
    
    console.log("\n✅ Teste concluído");
    
  } catch (error) {
    console.error("❌ Erro no teste:", error);
  }
}

testPropertyDetails();