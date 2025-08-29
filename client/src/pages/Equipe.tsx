import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Settings, Crown, User, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from "framer-motion";
import { useSmoothtTransitions } from "@/hooks/useSmoothtTransitions";
import { useResponsive } from "@/hooks/useMediaQuery";

export default function Equipe() {
  const { user } = useAuth();
  const { getListVariants, getListItemVariants } = useSmoothtTransitions();
  const { isMobile } = useResponsive();

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestão de Equipe
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Gerencie sua equipe de corretores e suas permissões
            </p>
          </div>
        </div>
        
        <Button className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar Corretor
        </Button>
      </div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        variants={getListVariants()}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={getListItemVariants()}>
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Corretores</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              +2 novos este mês
            </p>
          </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={getListItemVariants()}>
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Corretores Ativos</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              87.5% da equipe
            </p>
          </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={getListItemVariants()}>
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Crown className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Você + 1 admin
            </p>
          </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Team Members List */}
      <motion.div
        variants={getListItemVariants()}
        initial="hidden"
        animate="visible"
      >
        <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription>
            Gerencie os membros da sua imobiliária e suas permissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current user */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-medium">{user?.name || 'Você'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.email}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
                      Proprietário
                    </span>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Ativo
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">
                  Administrador Principal
                </span>
              </div>
            </div>

            {/* Example team members */}
            <div className="space-y-3">
              {[
                { name: 'Maria Silva', email: 'maria@exemplo.com', role: 'Corretor Senior', status: 'Ativo' },
                { name: 'João Santos', email: 'joao@exemplo.com', role: 'Corretor', status: 'Ativo' },
                { name: 'Ana Costa', email: 'ana@exemplo.com', role: 'Corretor Junior', status: 'Inativo' },
              ].map((member, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {member.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {member.role}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          member.status === 'Ativo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        </Card>
      </motion.div>

      {/* Coming Soon Notice */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Funcionalidades em Desenvolvimento
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              O sistema completo de gestão de equipe estará disponível em breve. 
              Inclui convites por email, gestão de permissões detalhadas e relatórios de performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}