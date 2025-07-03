#!/bin/bash

# Script para verificar status das portas no Hostinger VPS
# IP: 31.97.245.82

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header "STATUS DAS PORTAS - VentusHub"

# Verificar portas essenciais
echo ""
print_header "Portas Essenciais"

# SSH (22)
if netstat -tlnp | grep -q :22; then
    print_success "SSH (22) - Ativa"
else
    print_error "SSH (22) - Inativa"
fi

# HTTP (80)
if netstat -tlnp | grep -q :80; then
    print_success "HTTP (80) - Ativa"
    echo "   $(netstat -tlnp | grep :80 | head -1)"
else
    print_error "HTTP (80) - Inativa"
fi

# HTTPS (443)
if netstat -tlnp | grep -q :443; then
    print_success "HTTPS (443) - Ativa"
    echo "   $(netstat -tlnp | grep :443 | head -1)"
else
    print_error "HTTPS (443) - Inativa"
fi

# OpenLiteSpeed Admin (7080)
if netstat -tlnp | grep -q :7080; then
    print_success "OpenLiteSpeed Admin (7080) - Ativa"
else
    print_error "OpenLiteSpeed Admin (7080) - Inativa"
fi

# Aplicação Node.js (5000)
if netstat -tlnp | grep -q :5000; then
    print_success "Aplicação Node.js (5000) - Ativa"
    echo "   $(netstat -tlnp | grep :5000)"
else
    print_error "Aplicação Node.js (5000) - Inativa"
fi

echo ""
print_header "Status dos Serviços"

# PM2
if command -v pm2 >/dev/null 2>&1; then
    if pm2 list | grep -q "ventushub"; then
        print_success "PM2 - VentusHub rodando"
        pm2 status | grep ventushub
    else
        print_warning "PM2 - VentusHub não encontrado"
    fi
else
    print_error "PM2 não instalado"
fi

# OpenLiteSpeed
if systemctl is-active --quiet lsws; then
    print_success "OpenLiteSpeed - Ativo"
else
    print_error "OpenLiteSpeed - Inativo"
fi

# Apache (verificar conflitos)
if systemctl is-active --quiet apache2; then
    print_warning "Apache2 - Ativo (pode conflitar com OpenLiteSpeed)"
else
    print_success "Apache2 - Inativo (sem conflitos)"
fi

# Nginx (verificar conflitos)
if systemctl is-active --quiet nginx; then
    print_warning "Nginx - Ativo (pode conflitar com OpenLiteSpeed)"
else
    print_success "Nginx - Inativo (sem conflitos)"
fi

echo ""
print_header "Firewall Status"
ufw status

echo ""
print_header "Teste de Conectividade"

# Teste local
echo "Testando aplicação local..."
if curl -s --connect-timeout 5 http://localhost:5000 >/dev/null; then
    print_success "Aplicação responde em localhost:5000"
else
    print_error "Aplicação não responde em localhost:5000"
fi

echo ""
print_header "URLs de Teste"
echo "🌐 HTTP:  http://31.97.245.82"
echo "🔒 HTTPS: https://31.97.245.82"
echo "🎛️  Admin: https://31.97.245.82:7080"
echo "🌍 Site:  https://www.ventushub.com.br"

echo ""
print_header "Resumo"
if netstat -tlnp | grep -q :5000 && systemctl is-active --quiet lsws; then
    print_success "Stack completa funcionando!"
else
    print_warning "Verifique os serviços acima"
fi