import express from 'express';

const app = express();
const port = 5000;

app.get('/', (req, res) => {
  res.send('Servidor de teste funcionando!');
});

app.listen(port, () => {
  console.log(`Servidor de teste rodando em http://localhost:${port}`);
});