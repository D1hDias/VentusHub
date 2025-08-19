// Servidor JavaScript puro para teste
require('dotenv').config();

console.log("🚀 Servidor JavaScript puro iniciando...");
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

try {
  const express = require('express');
  console.log("✅ Express importado");
  
  const app = express();
  console.log("✅ Express app criado");
  
  app.get('/', (req, res) => {
    res.json({ message: 'VentusHub Simple JS Server Working' });
  });
  
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  const port = process.env.PORT || 5000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Servidor JavaScript rodando na porta ${port}`);
  });
  
} catch (error) {
  console.error("❌ Erro no servidor JavaScript:", error);
  process.exit(1);
}