# Contrato de Licenciamento de Sistema - Delmack

**Documento de Especificação Técnica e Comercial**

**Versão:** 1.0  
**Data:** 16 de Dezembro de 2024  
**Elaborado por:** Delmack Consultoria

---

## 1. Objeto do Contrato

Este documento estabelece os termos e condições para o licenciamento do **Sistema de Gestão de Vendas Imobiliárias Delmack**, uma plataforma web completa para gerenciamento de vendas, comissões e equipes de corretores imobiliários.

### 1.1 Modalidades de Licenciamento

| Modalidade | Descrição | Valor Sugerido |
|------------|-----------|----------------|
| **Licença Vitalícia** | Acesso permanente ao sistema na versão contratada | A definir |
| **Licença Mensal** | Acesso mensal com renovação automática | A definir |
| **Licença Trimestral** | Acesso por 3 meses com desconto | A definir |
| **Licença Semestral** | Acesso por 6 meses com desconto | A definir |
| **Licença Anual** | Acesso por 12 meses com desconto | A definir |

---

## 2. Arquitetura do Sistema

### 2.1 Visão Geral da Arquitetura

O sistema Delmack é construído sobre uma arquitetura moderna de três camadas, utilizando tecnologias de ponta para garantir escalabilidade, segurança e manutenibilidade.

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO                    │
│  React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui         │
│  SPA (Single Page Application) com roteamento client-side   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE APLICAÇÃO                       │
│  Node.js + Express 4 + tRPC 11 (API type-safe)              │
│  Autenticação JWT + Cookies de sessão                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE DADOS                           │
│  TiDB (MySQL compatível) + Drizzle ORM                       │
│  AWS S3 para armazenamento de arquivos                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Stack Tecnológico Detalhado

| Componente | Tecnologia | Versão | Finalidade |
|------------|------------|--------|------------|
| **Frontend** | React | 19.x | Interface de usuário reativa |
| **Estilização** | Tailwind CSS | 4.x | Framework CSS utilitário |
| **Componentes UI** | shadcn/ui | Latest | Biblioteca de componentes acessíveis |
| **Backend** | Node.js | 22.x | Runtime JavaScript server-side |
| **Framework Web** | Express | 4.x | Servidor HTTP e middleware |
| **API** | tRPC | 11.x | API type-safe end-to-end |
| **ORM** | Drizzle | Latest | Mapeamento objeto-relacional |
| **Banco de Dados** | TiDB | Latest | Banco MySQL distribuído |
| **Armazenamento** | AWS S3 | - | Arquivos e documentos |
| **Autenticação** | JWT + bcrypt | - | Tokens e hash de senhas |

### 2.3 Modelo de Dados

O sistema possui **12 tabelas principais** organizadas da seguinte forma:

| Tabela | Descrição | Campos Principais |
|--------|-----------|-------------------|
| `users` | Usuários do sistema | id, name, email, password, role, companyId, isActive |
| `companies` | Empresas clientes | id, name, licenseType, licenseExpiry, contractResponsible |
| `properties` | Imóveis cadastrados | id, reference, address, city, state, value |
| `sales` | Vendas realizadas | id, propertyId, buyerName, saleValue, status, proposalDocumentUrl |
| `commissions` | Comissões de corretores | id, saleId, brokerId, value, status |
| `actionLogs` | Histórico de ações | id, userId, action, details, createdAt |

---

## 3. Segurança do Sistema

### 3.1 Medidas de Segurança Implementadas

O sistema implementa múltiplas camadas de segurança para proteger os dados dos usuários e da empresa.

| Aspecto | Implementação | Nível de Proteção |
|---------|---------------|-------------------|
| **Senhas** | Hash bcrypt com salt | Alto |
| **Sessões** | JWT com expiração + cookies HttpOnly | Alto |
| **Comunicação** | HTTPS/TLS obrigatório | Alto |
| **Banco de Dados** | Conexão SSL, credenciais isoladas | Alto |
| **Armazenamento** | S3 com URLs presigned temporárias | Alto |
| **Controle de Acesso** | RBAC (Role-Based Access Control) | Alto |

### 3.2 Perfis de Acesso e Permissões

O sistema implementa controle de acesso baseado em papéis (RBAC) com 5 níveis:

| Perfil | Permissões | Acesso a Dados |
|--------|------------|----------------|
| **Super Admin** | Gerenciar todas as empresas, usuários, licenças | Global |
| **Manager** | Gerenciar equipe, aprovar vendas, relatórios | Empresa |
| **Finance** | Relatórios financeiros, aprovar comissões | Empresa |
| **Broker** | Registrar vendas, ver próprias comissões | Pessoal |
| **Admin** | Configurações da empresa | Empresa |

### 3.3 Proteção de Dados Sensíveis

Os seguintes dados são considerados sensíveis e recebem tratamento especial:

- **Senhas**: Nunca armazenadas em texto plano, sempre com hash bcrypt
- **CPF/CNPJ**: Validados e armazenados de forma segura
- **Documentos**: Armazenados no S3 com URLs temporárias (expiram em 24h)
- **Tokens de API**: Armazenados como variáveis de ambiente, nunca no código

---

## 4. Riscos e Limitações

### 4.1 Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Indisponibilidade da plataforma Manus** | Baixa | Alto | Backups regulares, exportação de dados |
| **Perda de dados** | Muito Baixa | Alto | Backups automáticos do banco de dados |
| **Vulnerabilidades de segurança** | Baixa | Alto | Atualizações regulares, monitoramento |
| **Integração Properfy indisponível** | Média | Baixo | Sistema funciona com preenchimento manual |
| **Limite de armazenamento S3** | Baixa | Médio | Monitoramento de uso, limpeza periódica |

### 4.2 Dependências Externas

O sistema depende dos seguintes serviços externos:

| Serviço | Fornecedor | Criticidade | Fallback |
|---------|------------|-------------|----------|
| **Hospedagem** | Manus Platform | Alta | N/A (core) |
| **Banco de Dados** | TiDB (via Manus) | Alta | Backups |
| **Armazenamento** | AWS S3 (via Manus) | Média | Download local |
| **API de Imóveis** | Properfy | Baixa | Preenchimento manual |
| **CEP** | ViaCEP | Baixa | Preenchimento manual |

### 4.3 Limitações Conhecidas

1. **Não é possível hospedar fora da plataforma Manus** sem modificações significativas
2. **Integrações com sistemas legados** podem requerer desenvolvimento adicional
3. **Personalização visual profunda** requer conhecimento técnico
4. **Limite de 10MB por arquivo** para upload de documentos
5. **Relatórios customizados** além do escopo atual requerem desenvolvimento

---

## 5. Escopo Atual do Sistema

### 5.1 Módulos Incluídos

O sistema na versão atual inclui os seguintes módulos funcionais:

#### 5.1.1 Módulo de Autenticação
- Login com email e senha
- Recuperação de senha (via notificação)
- Gestão de sessões
- Botão de visualizar/ocultar senha

#### 5.1.2 Módulo de Gestão de Usuários
- Cadastro de usuários individuais
- Upload em lote via Excel
- Ativação/desativação (soft delete)
- Edição de perfil e permissões
- Filtros por status (ativo/inativo)

#### 5.1.3 Módulo de Vendas
- Formulário completo com 30+ campos
- Busca de imóvel via API Properfy
- Upload de proposta de compra (anexo)
- Validação de CPF/CNPJ
- Busca automática de CEP
- Preview antes de salvar

#### 5.1.4 Módulo de Comissões
- Cálculo automático baseado em 7 tipos de negócio
- Divisão entre angariador e vendedor
- Status: pendente, recebido, pago, cancelado
- Relatório de comissões por período

#### 5.1.5 Módulo de Dashboards
- Dashboard por perfil (Broker, Manager, Finance)
- KPIs em tempo real
- Gráficos interativos (Recharts)
- Filtros por período e corretor

#### 5.1.6 Módulo de Indicadores
- 27 KPIs operacionais
- Modal de detalhamento com gráfico de evolução
- Filtros dinâmicos

#### 5.1.7 Módulo de Relatórios
- Relatórios financeiros
- Exportação de dados
- Análise de performance

#### 5.1.8 Módulo de Ranking
- Top 3 corretores
- Performance individual
- Comparativo mensal

#### 5.1.9 Módulo Multi-Empresa (Super Admin)
- Gestão de múltiplas empresas
- Controle de licenças
- Alertas de vencimento
- Métricas por empresa
- Histórico de ações (logs)

### 5.2 Funcionalidades por Perfil

| Funcionalidade | Super Admin | Manager | Finance | Broker |
|----------------|:-----------:|:-------:|:-------:|:------:|
| Gerenciar empresas | ✅ | ❌ | ❌ | ❌ |
| Gerenciar usuários | ✅ | ✅ | ❌ | ❌ |
| Registrar vendas | ❌ | ✅ | ❌ | ✅ |
| Aprovar vendas | ❌ | ✅ | ✅ | ❌ |
| Ver todas as comissões | ✅ | ✅ | ✅ | ❌ |
| Ver próprias comissões | ❌ | ❌ | ❌ | ✅ |
| Relatórios financeiros | ✅ | ✅ | ✅ | ❌ |
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Indicadores | ❌ | ✅ | ✅ | ✅ |
| Ranking | ❌ | ✅ | ❌ | ✅ |
| Backup de anexos | ✅ | ✅ | ❌ | ❌ |

---

## 6. Serviços Adicionais (Fora do Escopo)

Os seguintes itens **não estão incluídos** na licença padrão e serão cobrados separadamente:

### 6.1 Customizações

| Item | Descrição | Estimativa |
|------|-----------|------------|
| Novo campo no formulário | Adicionar campo simples | 2-4 horas |
| Novo relatório | Criar relatório customizado | 8-16 horas |
| Nova integração | Conectar com sistema externo | 16-40 horas |
| Personalização visual | Mudança de cores, logo, layout | 4-8 horas |
| Novo módulo | Funcionalidade completamente nova | 40+ horas |

### 6.2 Suporte e Manutenção

| Serviço | Descrição | Cobrança |
|---------|-----------|----------|
| Suporte técnico | Atendimento via chat/email | Incluso (horário comercial) |
| Suporte emergencial | Atendimento fora do horário | Por hora |
| Treinamento | Capacitação de usuários | Por sessão |
| Migração de dados | Importação de dados legados | Por projeto |

---

## 7. Backup e Recuperação

### 7.1 Política de Backup

| Tipo | Frequência | Retenção | Responsável |
|------|------------|----------|-------------|
| Banco de dados | Automático (plataforma) | 30 dias | Manus |
| Arquivos S3 | Redundância automática | Indefinido | AWS |
| Exportação manual | Sob demanda | Usuário define | Cliente |

### 7.2 Procedimento de Backup Manual

O sistema oferece funcionalidade de backup manual através do botão **"Backup Anexos"** disponível para Manager e Super Admin, que exporta:

- Lista de todos os documentos anexados
- URLs temporárias para download (válidas por 24h)
- Metadados das vendas associadas

---

## 8. Níveis de Serviço (SLA)

### 8.1 Disponibilidade

| Métrica | Compromisso |
|---------|-------------|
| Uptime mensal | 99.5% |
| Tempo de resposta (API) | < 500ms (P95) |
| Tempo de carregamento (página) | < 3s |

### 8.2 Suporte

| Prioridade | Tempo de Resposta | Tempo de Resolução |
|------------|-------------------|-------------------|
| Crítica (sistema indisponível) | 1 hora | 4 horas |
| Alta (funcionalidade principal) | 4 horas | 24 horas |
| Média (funcionalidade secundária) | 8 horas | 72 horas |
| Baixa (melhoria/dúvida) | 24 horas | 5 dias úteis |

---

## 9. Termos e Condições

### 9.1 Propriedade Intelectual

O código-fonte do sistema permanece propriedade da **Delmack Consultoria**. A licença concede direito de **uso**, não de propriedade ou modificação do código.

### 9.2 Confidencialidade

Ambas as partes concordam em manter confidenciais todas as informações sensíveis trocadas durante a vigência do contrato, incluindo dados de clientes, estratégias comerciais e detalhes técnicos.

### 9.3 Limitação de Responsabilidade

A Delmack Consultoria não se responsabiliza por:
- Perdas decorrentes de uso indevido do sistema
- Indisponibilidade causada por terceiros (Manus, AWS)
- Dados inseridos incorretamente pelos usuários
- Decisões de negócio baseadas em relatórios do sistema

### 9.4 Rescisão

O contrato pode ser rescindido:
- Por qualquer parte, com aviso prévio de 30 dias
- Imediatamente, em caso de violação grave dos termos
- Automaticamente, ao término do período de licença (exceto vitalícia)

---

## 10. Anexos

### Anexo A: Credenciais de Acesso (Super Admin)

| Campo | Valor |
|-------|-------|
| Email | delmackconsultoria@gmail.com |
| Senha | (fornecida separadamente) |

### Anexo B: URLs do Sistema

| Ambiente | URL |
|----------|-----|
| Produção | (a definir após publicação) |
| Desenvolvimento | https://3000-xxx.manusvm.computer |

### Anexo C: Contatos

| Função | Contato |
|--------|---------|
| Suporte Técnico | suporte@delmack.com.br |
| Comercial | comercial@delmack.com.br |

---

**Documento gerado automaticamente pelo Sistema Delmack**  
**Versão do Sistema:** 7fc149ea  
**Data de Geração:** 16/12/2024
