# 📥 Guia de Importação de Usuários

## Passo 1: Exportar Usuários do Manus

```bash
# No servidor Manus, execute:
cd /home/ubuntu/delmack_real_estate
node scripts/export-users.mjs
```

Isso vai gerar dois arquivos:
- `export-users.sql` - Script SQL para importar
- `export-users.csv` - Arquivo CSV para referência

## Passo 2: Transferir Arquivo para Servidor Local

```bash
# Copie o arquivo export-users.sql para seu servidor local
scp export-users.sql seu-usuario@seu-servidor:/caminho/para/delmack/
```

## Passo 3: Importar no Servidor Local

```bash
# No servidor local, execute:
mysql -u delmack_user -p delmack < export-users.sql

# Digite a senha quando solicitado
```

## Passo 4: Verificar Importação

```bash
# Conectar ao MySQL
mysql -u delmack_user -p delmack

# Dentro do MySQL, execute:
SELECT COUNT(*) as total_usuarios FROM users;
SELECT email, role, companyId FROM users LIMIT 5;
```

## Alternativa: Importação Manual via phpMyAdmin

1. Abra phpMyAdmin do servidor local
2. Selecione o banco `delmack`
3. Clique em "Importar"
4. Selecione o arquivo `export-users.sql`
5. Clique em "Executar"

## Troubleshooting

### Erro: "Access denied for user"
- Verifique as credenciais no `.env`
- Certifique-se que o usuário MySQL tem permissão

### Erro: "Table 'delmack.users' doesn't exist"
- Execute as migrations primeiro: `pnpm db:push`

### Erro: "Duplicate entry"
- O script já fez a importação
- Ou execute: `DELETE FROM users;` antes de importar novamente

## Dados Exportados

O script exporta apenas:
- ✅ Email
- ✅ Senha (hash mantido)
- ✅ Role (superadmin, admin, manager, broker, finance, viewer)
- ✅ Company ID

Não exporta:
- ❌ Vendas
- ❌ Comissões
- ❌ Propriedades
- ❌ Documentos

## Segurança

⚠️ **Importante:**
- O arquivo `export-users.sql` contém senhas (hashed)
- Mantenha-o seguro
- Não compartilhe publicamente
- Delete após importação
