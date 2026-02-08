#!/usr/bin/env python3
"""
Script de Importação de Excel para Sistema Delmack
Importa dados históricos de vendas do Excel para o banco de dados MySQL

Uso: python3 import_excel.py <arquivo_excel.xlsx>
Exemplo: python3 import_excel.py 01Relatório_Jan_2025.xlsx
"""

import sys
import os
import pandas as pd
import mysql.connector
from datetime import datetime
from decimal import Decimal
import re

# Configuração do banco de dados (lê de variável de ambiente)
DATABASE_URL = os.getenv('DATABASE_URL')

def parse_database_url(url):
    """Parse DATABASE_URL format: mysql://user:pass@host:port/database?params"""
    # Remover parâmetros de query string (como ?ssl=...)
    if '?' in url:
        url = url.split('?')[0]
    
    pattern = r'mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)'
    match = re.match(pattern, url)
    if not match:
        raise ValueError(f"Invalid DATABASE_URL format: {url}")
    
    user, password, host, port, database = match.groups()
    return {
        'user': user,
        'password': password,
        'host': host,
        'port': int(port),
        'database': database,
        'ssl_disabled': False,  # TiDB requer SSL
        'ssl_verify_cert': False,
        'ssl_verify_identity': False
    }

def connect_db():
    """Conecta ao banco de dados MySQL"""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable not set")
    
    db_config = parse_database_url(DATABASE_URL)
    return mysql.connector.connect(**db_config)

def normalize_date(value):
    """Normaliza datas do Excel para formato MySQL"""
    if pd.isna(value) or value is None or value == '':
        return None
    
    if isinstance(value, datetime):
        return value.strftime('%Y-%m-%d %H:%M:%S')
    
    if isinstance(value, str):
        # Tentar vários formatos comuns
        formats = ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y']
        for fmt in formats:
            try:
                dt = datetime.strptime(value, fmt)
                return dt.strftime('%Y-%m-%d %H:%M:%S')
            except ValueError:
                continue
    
    return None

def normalize_decimal(value):
    """Normaliza valores decimais"""
    if pd.isna(value) or value is None or value == '':
        return None
    
    if isinstance(value, str):
        # Remove símbolos de moeda e espaços
        value = value.replace('R$', '').replace('$', '').replace('.', '').replace(',', '.').strip()
        try:
            return float(value)
        except ValueError:
            return None
    
    return float(value)

def normalize_text(value):
    """Normaliza texto"""
    if pd.isna(value) or value is None or value == '':
        return None
    return str(value).strip()

def import_sales_from_excel(file_path, company_id='default_company'):
    """
    Importa vendas do Excel para o banco de dados
    
    Args:
        file_path: Caminho do arquivo Excel
        company_id: ID da empresa (padrão: 'default_company')
    """
    print(f"\n{'='*60}")
    print(f"IMPORTAÇÃO DE EXCEL PARA SISTEMA DELMACK")
    print(f"{'='*60}\n")
    print(f"📁 Arquivo: {file_path}")
    print(f"🏢 Company ID: {company_id}\n")
    
    # Ler Excel (header na linha 2, dados começam na linha 4)
    print("📖 Lendo arquivo Excel...")
    try:
        df_geral = pd.read_excel(file_path, sheet_name='GERAL', header=2, skiprows=[3])
        # Remover linhas vazias
        df_geral = df_geral.dropna(how='all')
        print(f"   ✅ Aba GERAL: {len(df_geral)} linhas")
        print(f"   Colunas: {list(df_geral.columns[:10])}...")
    except Exception as e:
        print(f"   ❌ Erro ao ler aba GERAL: {e}")
        return
    
    # Conectar ao banco
    print("\n🔌 Conectando ao banco de dados...")
    try:
        conn = connect_db()
        cursor = conn.cursor()
        print("   ✅ Conectado com sucesso")
    except Exception as e:
        print(f"   ❌ Erro ao conectar: {e}")
        return
    
    # Mapear colunas do Excel para campos do banco
    # Nota: 'TIPO DE  NEGÓCIO ' tem espaço extra no final
    column_mapping = {
        'REFERÊNCIA': 'propertyReference',
        'IMÓVEL': 'propertyAddress',
        'BAIRRO': 'propertyNeighborhood',
        'DATA DA VENDA': 'saleDate',
        'DATA DA ANGARIAÇÃO': 'listingDate',
        'VALOR DE DIVULGAÇÃO': 'advertisementValue',
        'VALOR VENDA': 'saleValue',
        'TIPO DE  NEGÓCIO ': 'businessType',  # Espaço extra no final!
        'LOJA ANGARIADORA': 'listingStore',
        'LOJA VENDEDORA': 'sellingStore',
        'COMISSÃO': 'totalCommission',
        '% COMISSÃO': 'totalCommissionPercent',
        'ANGARIADOR': 'brokerAngariadorName',
        'VENDEDOR': 'brokerVendedorName',
        'DE ONDE VEIO O CLIENTE': 'clientOrigin',
        'FORMA DE PAGAMENTO': 'paymentMethod',
        'SITUAÇÃO CARTEIRA': 'portfolioStatus',  # Alterado de 'status' para 'portfolioStatus'
        'EQUIPE': 'team',
        'TEMPO VENDA': 'listingToSaleDays',
        'APOIO PREMIAÇÃO': 'supportAward',  # Novo campo
    }
    
    # Estatísticas
    stats = {
        'total': len(df_geral),
        'imported': 0,
        'skipped': 0,
        'errors': 0
    }
    
    print(f"\n📊 Processando {stats['total']} vendas...")
    print("-" * 60)
    
    for idx, row in df_geral.iterrows():
        try:
            # Dados obrigatórios
            property_reference = normalize_text(row.get('REFERÊNCIA'))
            sale_value = normalize_decimal(row.get('VALOR VENDA'))
            
            if not property_reference or not sale_value:
                print(f"⚠️  Linha {idx+2}: Dados obrigatórios faltando (REFERÊNCIA ou VALOR VENDA)")
                stats['skipped'] += 1
                continue
            
            # Comprador genérico se não houver
            buyer_name = f"Comprador {property_reference}"
            
            # Preparar dados
            sale_data = {
                'id': f"import_{company_id}_{property_reference}_{idx}",
                'companyId': company_id,
                'propertyId': f"prop_{property_reference}",  # Criar property se não existir
                'buyerName': buyer_name,
                'saleValue': sale_value,
                'saleDate': normalize_date(row.get('DATA DA VENDA')),
                'listingDate': normalize_date(row.get('DATA DA ANGARIAÇÃO')),
                'advertisementValue': normalize_decimal(row.get('VALOR DE DIVULGAÇÃO')),
                'businessType': normalize_text(row.get('TIPO DE  NEGÓCIO')),
                'listingStore': normalize_text(row.get('LOJA ANGARIADORA')),
                'sellingStore': normalize_text(row.get('LOJA VENDEDORA')),
                'totalCommission': normalize_decimal(row.get('COMISSÃO')),
                'totalCommissionPercent': normalize_decimal(row.get('% COMISSÃO')),
                'brokerAngariadorName': normalize_text(row.get('ANGARIADOR')),
                'brokerVendedorName': normalize_text(row.get('VENDEDOR')),
                'clientOrigin': normalize_text(row.get('DE ONDE VEIO O CLIENTE')),
                'paymentMethod': normalize_text(row.get('FORMA DE PAGAMENTO')),
                'status': 'sale',  # Status padrão para vendas importadas
                'portfolioStatus': normalize_text(row.get('SITUAÇÃO CARTEIRA')),  # Novo campo
                'team': normalize_text(row.get('EQUIPE')),
                'region': normalize_text(row.get('REGIÃO')),
                'bankName': normalize_text(row.get('BANCO')),
                'financedAmount': normalize_decimal(row.get('VALOR FINANCIADO')),
                'bankReturnPercentage': normalize_decimal(row.get('% RETORNO BANCÁRIO')),
                'deedStatus': normalize_text(row.get('STATUS ESCRITURAÇÃO')),
                'managementResponsible': normalize_text(row.get('RESPONSÁVEL')),
                'observations': normalize_text(row.get('OBSERVAÇÕES')),
            }
            
            # Calcular campos derivados
            if sale_data['advertisementValue'] and sale_data['saleValue']:
                sale_data['priceDiscount'] = sale_data['advertisementValue'] - sale_data['saleValue']
            
            if sale_data['financedAmount'] and sale_data['bankReturnPercentage']:
                sale_data['bankReturnAmount'] = sale_data['financedAmount'] * (sale_data['bankReturnPercentage'] / 100)
            
            if sale_data['listingDate'] and sale_data['saleDate']:
                try:
                    listing_dt = datetime.strptime(sale_data['listingDate'], '%Y-%m-%d %H:%M:%S')
                    sale_dt = datetime.strptime(sale_data['saleDate'], '%Y-%m-%d %H:%M:%S')
                    sale_data['listingToSaleDays'] = (sale_dt - listing_dt).days
                except:
                    pass
            
            # Criar property se não existir
            property_insert = """
                INSERT IGNORE INTO properties (id, companyId, propertyReference, address, isFromBaggio)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(property_insert, (
                sale_data['propertyId'],
                company_id,
                property_reference,
                normalize_text(row.get('IMÓVEL', property_reference)),
                True if sale_data['listingStore'] == 'Baggio' else False
            ))
            
            # Inserir venda
            sale_insert = """
                INSERT INTO sales (
                    id, companyId, propertyId, buyerName, saleValue, saleDate,
                    listingDate, advertisementValue, businessType, listingStore, sellingStore,
                    totalCommission, totalCommissionPercent, brokerAngariadorName, brokerVendedorName,
                    clientOrigin, paymentMethod, status, portfolioStatus, team, region, bankName,
                    financedAmount, bankReturnPercentage, bankReturnAmount, deedStatus,
                    managementResponsible, observations, priceDiscount, listingToSaleDays,
                    registeredAt, createdAt, updatedAt
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), NOW()
                )
            """
            
            cursor.execute(sale_insert, (
                sale_data['id'],
                sale_data['companyId'],
                sale_data['propertyId'],
                sale_data['buyerName'],
                sale_data['saleValue'],
                sale_data['saleDate'],
                sale_data['listingDate'],
                sale_data['advertisementValue'],
                sale_data['businessType'],
                sale_data['listingStore'],
                sale_data['sellingStore'],
                sale_data['totalCommission'],
                sale_data['totalCommissionPercent'],
                sale_data['brokerAngariadorName'],
                sale_data['brokerVendedorName'],
                sale_data['clientOrigin'],
                sale_data['paymentMethod'],
                sale_data['status'],
                sale_data.get('portfolioStatus'),  # Novo campo
                sale_data['team'],
                sale_data['region'],
                sale_data['bankName'],
                sale_data['financedAmount'],
                sale_data['bankReturnPercentage'],
                sale_data.get('bankReturnAmount'),  # Calculado, pode não existir
                sale_data['deedStatus'],
                sale_data['managementResponsible'],
                sale_data['observations'],
                sale_data.get('priceDiscount'),  # Calculado, pode não existir
                sale_data.get('listingToSaleDays'),  # Calculado, pode não existir
            ))
            
            stats['imported'] += 1
            if (idx + 1) % 10 == 0:
                print(f"   ✅ Processadas {idx + 1}/{stats['total']} vendas...")
        
        except Exception as e:
            print(f"❌ Linha {idx+2}: Erro ao importar - {str(e)}")
            print(f"   Dados: REF={property_reference}, VALOR={sale_value}")
            import traceback
            traceback.print_exc()
            stats['errors'] += 1
            continue
    
    # Commit
    conn.commit()
    cursor.close()
    conn.close()
    
    # Relatório final
    print("\n" + "="*60)
    print("📊 RELATÓRIO DE IMPORTAÇÃO")
    print("="*60)
    print(f"Total de linhas no Excel: {stats['total']}")
    print(f"✅ Importadas com sucesso: {stats['imported']}")
    print(f"⚠️  Ignoradas (dados faltando): {stats['skipped']}")
    print(f"❌ Erros: {stats['errors']}")
    print(f"\n{'='*60}\n")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python3 import_excel.py <arquivo_excel.xlsx>")
        print("Exemplo: python3 import_excel.py 01Relatório_Jan_2025.xlsx")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"❌ Arquivo não encontrado: {file_path}")
        sys.exit(1)
    
    # Obter company_id do segundo argumento ou usar padrão
    company_id = sys.argv[2] if len(sys.argv) > 2 else 'default_company'
    
    import_sales_from_excel(file_path, company_id)
