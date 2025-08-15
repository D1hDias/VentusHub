// Teste simples para verificar se tsx funciona em produção
console.log("🚀 Teste simples iniciando...");
console.log(`Node.js versão: ${process.version}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log("✅ Teste simples funcionando!");

// Servidor HTTP básico
import { createServer } from "http";

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World - VentusHub Test');
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`✅ Servidor de teste rodando na porta ${port}`);
});