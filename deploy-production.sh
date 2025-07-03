#!/bin/bash

# Deploy script for VentusHub - Production
# Este script faz deploy completo do sistema real

echo "🚀 Iniciando deploy do VentusHub..."

# Variáveis
SERVER_IP="31.97.245.82"
SERVER_USER="root"
APP_DIR="/var/www/ventushub"
REPO_URL="https://github.com/D1hDias/VentusHub.git"

echo "📡 Conectando ao servidor..."

ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
echo "🔄 Parando aplicação..."
pm2 stop ventushub || true

echo "📂 Preparando diretório..."
cd /var/www
rm -rf ventushub
git clone https://github.com/D1hDias/VentusHub.git ventushub
cd ventushub

echo "📦 Instalando dependências..."
npm install --force --omit=optional

echo "🏗️ Buildando aplicação..."
npm run build

echo "🔧 Configurando servidor de produção..."
cat > server-production.js << 'EOF'
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
const sql = neon(process.env.DATABASE_URL);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'ventushub-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files (React build)
app.use(express.static(join(__dirname, 'client/dist')));

// Serve assets from client folder (for development parity)
app.use('/src/assets', express.static(join(__dirname, 'client/src/assets')));

// Format dates utility
function formatDates(obj) {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map(formatDates);
  }
  if (typeof obj === 'object') {
    const formatted = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.includes('date') || key.includes('Date') || key === 'created_at' || key === 'updated_at') {
        formatted[key] = value ? new Date(value).toISOString() : null;
      } else if (typeof value === 'object') {
        formatted[key] = formatDates(value);
      } else {
        formatted[key] = value;
      }
    }
    return formatted;
  }
  return obj;
}

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await sql`
      SELECT id, email, first_name, last_name, password 
      FROM users 
      WHERE email = ${email} 
      LIMIT 1
    `;
    
    if (result.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const user = result[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name
    };
    
    res.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, cpf, creci, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `;
    
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const result = await sql`
      INSERT INTO users (first_name, last_name, email, password, cpf, creci, phone, created_at, updated_at)
      VALUES (${firstName}, ${lastName}, ${email}, ${hashedPassword}, ${cpf}, ${creci}, ${phone}, NOW(), NOW())
      RETURNING id, email, first_name, last_name
    `;
    
    const newUser = result[0];
    
    res.json({ 
      success: true, 
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/auth/user', (req, res) => {
  if (req.session.userId) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Não autenticado' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

app.get('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

// Properties routes
app.get('/api/properties', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const properties = await sql`
      SELECT * FROM properties 
      WHERE user_id = ${req.session.userId}
      ORDER BY created_at DESC
    `;
    
    res.json(formatDates(properties));
  } catch (error) {
    console.error('Properties error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/proposals', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const proposals = await sql`
      SELECT p.*, pr.address as property_address 
      FROM proposals p
      JOIN properties pr ON p.property_id = pr.id
      WHERE pr.user_id = ${req.session.userId}
      ORDER BY p.created_at DESC
    `;
    
    res.json(formatDates(proposals));
  } catch (error) {
    console.error('Proposals error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/contracts', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const contracts = await sql`
      SELECT c.*, pr.address as property_address 
      FROM contracts c
      JOIN properties pr ON c.property_id = pr.id
      WHERE pr.user_id = ${req.session.userId}
      ORDER BY c.created_at DESC
    `;
    
    res.json(formatDates(contracts));
  } catch (error) {
    console.error('Contracts error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    res.json({ notifications: [], totalCount: 0 });
  } catch (error) {
    console.error('Notifications error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Catch all handler: send back React's index.html file
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'client/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ VentusHub Server running on port ${PORT}`);
});
EOF

echo "🔐 Configurando variáveis de ambiente..."
cat > .env << 'ENVEOF'
DATABASE_URL=postgresql://neondb_owner:jLYKXC2kH6zG@ep-hidden-poetry-a5lzrjjz.us-east-2.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=ventushub-secret-production-2025
VITE_SUPABASE_URL=https://hocaexectpwpapnrmhxp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvY2FleGVjdHB3cGFwbnJtaHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDg4NjksImV4cCI6MjA2NjI4NDg2OX0.ereGpycsNRxhhK1Pq4a6x5E0VAIzKSjQfTMfWU_Y-iU
ENVEOF

echo "🚀 Iniciando aplicação com PM2..."
pm2 delete ventushub || true
pm2 start server-production.js --name "ventushub" --node-args="--experimental-modules"

echo "✅ Deploy concluído! Aplicação rodando em http://31.97.245.82:5000"
pm2 status
ENDSSH

echo "🎉 Deploy finalizado com sucesso!"