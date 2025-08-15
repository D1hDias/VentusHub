// Versão mínima do servidor para identificar onde está o problema
import dotenv from 'dotenv';
dotenv.config();

console.log("🚀 Servidor mínimo iniciando...");
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

try {
  import express from "express";
  console.log("✅ Express importado");
  
  const app = express();
  console.log("✅ Express app criado");
  
  app.get('/', (req, res) => {
    res.json({ message: 'VentusHub Minimal Server Working' });
  });
  
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`✅ Servidor mínimo rodando na porta ${port}`);
  });
  
} catch (error) {
  console.error("❌ Erro no servidor mínimo:", error);
  process.exit(1);
}