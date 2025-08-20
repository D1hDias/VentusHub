import { db } from './db.js';
import { cartorios } from '../shared/schema.js';

// Dados dos RGIs (Registros Gerais de Imóveis) do Rio de Janeiro
const cartoriosData = [
  {
    numero: '1º',
    nome: '1º RGI',
    nomeCompleto: '1º Registro Geral de Imóveis do Rio de Janeiro',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    site: 'https://www.1sri-rj.com.br/',
    ativo: true,
    permiteConsultaOnline: true,
    observacoes: 'Atende a 1ª Região de Registro de Imóveis'
  },
  {
    numero: '2º',
    nome: '2º RGI',
    nomeCompleto: '2º Registro Geral de Imóveis do Rio de Janeiro',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    site: 'https://www.2rgi-rj.com.br/',
    ativo: true,
    permiteConsultaOnline: true,
    observacoes: 'Atende a 2ª Região de Registro de Imóveis'
  },
  {
    numero: '3º',
    nome: '3º RGI',
    nomeCompleto: '3º Registro Geral de Imóveis do Rio de Janeiro',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    site: 'https://3ri-rj.com.br/',
    ativo: true,
    permiteConsultaOnline: true,
    observacoes: 'Atende a 3ª Região de Registro de Imóveis'
  },
  {
    numero: '4º',
    nome: '4º RGI',
    nomeCompleto: '4º Registro Geral de Imóveis do Rio de Janeiro',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    site: 'https://www.4rgirj.com.br/',
    ativo: true,
    permiteConsultaOnline: true,
    observacoes: 'Atende a 4ª Região de Registro de Imóveis'
  },
  {
    numero: '5º',
    nome: '5º RGI',
    nomeCompleto: '5º Registro Geral de Imóveis do Rio de Janeiro',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    site: 'https://www.5rgi-rj.com.br/',
    ativo: true,
    permiteConsultaOnline: true,
    observacoes: 'Atende a 5ª Região de Registro de Imóveis'
  },
  {
    numero: '6º',
    nome: '6º RGI',
    nomeCompleto: '6º Registro Geral de Imóveis do Rio de Janeiro',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    site: 'https://6ri-rj.com.br/',
    ativo: true,
    permiteConsultaOnline: true,
    observacoes: 'Atende a 6ª Região de Registro de Imóveis'
  },
  {
    numero: '7º',
    nome: '7º RGI',
    nomeCompleto: '7º Registro Geral de Imóveis do Rio de Janeiro',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    site: 'https://www.7ri-rj.com.br/',
    ativo: true,
    permiteConsultaOnline: true,
    observacoes: 'Atende a 7ª Região de Registro de Imóveis'
  },
  {
    numero: '8º',
    nome: '8º RGI',
    nomeCompleto: '8º Registro Geral de Imóveis do Rio de Janeiro',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    site: 'http://www.8ri-rj.com.br/index3.asp',
    ativo: true,
    permiteConsultaOnline: true,
    observacoes: 'Atende a 8ª Região de Registro de Imóveis'
  },
  {
    numero: '9º',
    nome: '9º RGI',
    nomeCompleto: '9º Registro Geral de Imóveis do Rio de Janeiro',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    site: 'https://www.9rgirj.com.br/',
    ativo: true,
    permiteConsultaOnline: true,
    observacoes: 'Atende a 9ª Região de Registro de Imóveis'
  },
  {
    numero: '10º',
    nome: '10º RGI',
    nomeCompleto: '10º Registro Geral de Imóveis do Rio de Janeiro',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    site: 'https://www.10ri-rj.com.br/',
    ativo: true,
    permiteConsultaOnline: true,
    observacoes: 'Atende a 10ª Região de Registro de Imóveis'
  },
  {
    numero: '11º',
    nome: '11º RGI',
    nomeCompleto: '11º Registro Geral de Imóveis do Rio de Janeiro',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    site: 'https://www.11rirj.com.br/',
    ativo: true,
    permiteConsultaOnline: true,
    observacoes: 'Atende a 11ª Região de Registro de Imóveis'
  },
  {
    numero: '12º',
    nome: '12º RGI',
    nomeCompleto: '12º Registro Geral de Imóveis do Rio de Janeiro',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    site: 'https://www.registrodeimoveis.org.br/12rj/',
    ativo: true,
    permiteConsultaOnline: true,
    observacoes: 'Atende a 12ª Região de Registro de Imóveis'
  }
];

/**
 * Função para popular a tabela de cartórios com os RGIs do Rio de Janeiro
 */
export async function seedCartorios() {
  try {
    console.log('🏢 Iniciando seed da tabela cartórios...');
    
    // Inserir cartórios se não existirem
    for (const cartorio of cartoriosData) {
      try {
        await db.insert(cartorios).values(cartorio).onConflictDoNothing();
        console.log(`✅ Cartório ${cartorio.nome} inserido/verificado`);
      } catch (error) {
        console.log(`⚠️ Cartório ${cartorio.nome} já existe ou erro:`, error);
      }
    }
    
    console.log('🎉 Seed da tabela cartórios concluído com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao executar seed da tabela cartórios:', error);
    return false;
  }
}

/**
 * Função para listar todos os cartórios
 */
export async function listarCartorios() {
  try {
    const todosCartorios = await db.select().from(cartorios);
    console.log('📋 Cartórios cadastrados:', todosCartorios.length);
    return todosCartorios;
  } catch (error) {
    console.error('❌ Erro ao listar cartórios:', error);
    return [];
  }
}

// Executar seed se arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCartorios()
    .then(() => listarCartorios())
    .then(() => process.exit(0));
}