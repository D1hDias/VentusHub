#!/bin/bash

# Script de conexão rápida ao servidor Hostinger
# IP: 31.97.245.82

SERVER_IP="31.97.245.82"
USER="root"

echo "🚀 Conectando ao servidor Hostinger VPS..."
echo "IP: $SERVER_IP"
echo "User: $USER"
echo ""

# Função para conectar via SSH
connect_ssh() {
    echo "📡 Conectando via SSH..."
    ssh $USER@$SERVER_IP
}

# Função para upload de arquivo
upload_file() {
    if [ -z "$1" ]; then
        echo "❌ Uso: $0 upload <arquivo>"
        exit 1
    fi
    
    echo "📤 Uploading $1 para $SERVER_IP:/tmp/"
    scp "$1" $USER@$SERVER_IP:/tmp/
    echo "✅ Upload concluído!"
}

# Função para baixar logs
download_logs() {
    echo "📥 Baixando logs do servidor..."
    mkdir -p logs
    scp $USER@$SERVER_IP:/var/log/pm2/ventushub.log ./logs/
    scp $USER@$SERVER_IP:/usr/local/lsws/logs/error.log ./logs/lsws-error.log
    echo "✅ Logs baixados para ./logs/"
}

# Verificar parâmetro
case "$1" in
    "upload")
        upload_file "$2"
        ;;
    "logs")
        download_logs
        ;;
    "ssh"|"")
        connect_ssh
        ;;
    *)
        echo "Uso:"
        echo "  $0                 # Conectar via SSH"
        echo "  $0 ssh            # Conectar via SSH"
        echo "  $0 upload <file>  # Upload arquivo"
        echo "  $0 logs           # Baixar logs"
        exit 1
        ;;
esac