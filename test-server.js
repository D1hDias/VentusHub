import express from 'express';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Backend funcionando!' });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API funcionando!',
    timestamp: new Date().toISOString()
  });
});

const port = 5000;
app.listen(port, '127.0.0.1', () => {
  console.log(`Servidor rodando na porta ${port}`);
});