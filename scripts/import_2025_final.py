#!/usr/bin/env python3
"""
Script para importar dados de 2025 do Excel para o banco de dados Delmack
Com fuzzy matching para mapear nomes de corretores
"""

import os
import sys
import openpyxl
from datetime import datetime
from decimal import Decimal
from difflib import SequenceMatcher
import mysql.connector
from mysql.connector import Error

# Configurações
UPLOAD_DIR = "/home/ubuntu/upload"
MONTHS = {
    "01": "January",
    "02": "February",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    "10": "October",
    "11": "November",
    "12": "December",
}

# Lista de corretores cadastrados (do arquivo CORRETORESBAGGIO)
KNOWN_BROKERS = [
    "Adriana Simões Barbosa Karter",
    "Allan Sobiech",
    "Charles Luciano Lucca",
    "Diego Ferreira dos Santos",
    "Edmar Antunes",
    "Fabiano Buziak",
    "Fabio Simões",
    "Joseli do Rocio Bueno",
    "Marco Antonio do Nascimento João",
    "Maria Carolina Munhoz de Miranda Nicolodi",
    "Odair Amancio",
    "Priscilla Gomes Ziolkowski",
    "Priscilla Pires Andrelle",
    "Regiana Mirian Baggio Favarini",
    "Rosani Felix dos Santos",
    "Sandra Maria Alves de Lima Przybysz",
]

def get_database_connection():
    """Conecta ao banco de dados MySQL"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "delmack"),
            port=int(os.getenv("DB_PORT", "3306")),
        )
        return connection
    except Error as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        sys.exit(1)

def load_broker_mapping(connection):
    """Carrega mapeamento de nomes de corretores para IDs do banco"""
    cursor = connection.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, name FROM brokers WHERE companyId = %s ORDER BY name",
        (os.getenv("COMPANY_ID", "B I IMOVEIS LTDA"),)
    )
    
    brokers = cursor.fetchall()
    mapping = {}
    for broker in brokers:
        # Normalizar nome para comparação
        normalized_name = broker["name"].upper().strip()
        mapping[normalized_name] = broker["id"]
    
    cursor.close()
    return mapping

def fuzzy_match(name, candidates, threshold=0.6):
    """Encontra o melhor match usando fuzzy matching"""
    if not name:
        return None
    
    name_upper = name.upper().strip()
    best_match = None
    best_score = threshold
    
    for candidate in candidates:
        candidate_upper = candidate.upper().strip()
        score = SequenceMatcher(None, name_upper, candidate_upper).ratio()
        
        if score > best_score:
            best_score = score
            best_match = candidate
    
    return best_match

def parse_date(date_value):
    """Converte data do Excel para formato MySQL"""
    if not date_value:
        return None
    
    if isinstance(date_value, datetime):
        return date_value.strftime("%Y-%m-%d")
    
    try:
        if isinstance(date_value, str):
            # Formato DD/MM/YYYY
            parts = date_value.split("/")
            if len(parts) == 3:
                return f"{parts[2]}-{parts[1]}-{parts[0]}"
        return None
    except:
        return None

def parse_decimal(value):
    """Converte valor para Decimal"""
    if not value:
        return None
    
    try:
        if isinstance(value, str):
            # Remover símbolos de moeda e espaços
            value = value.replace("R$", "").replace(".", "").replace(",", ".").strip()
        return Decimal(str(value))
    except:
        return None

def import_monthly_file(connection, file_path, month_num, broker_mapping, year=2025):
    """Importa dados de um arquivo mensal"""
    print(f"\n{'='*70}")
    print(f"Importando: {os.path.basename(file_path)}")
    print(f"{'='*70}")
    
    try:
        wb = openpyxl.load_workbook(file_path, data_only=True)
        ws = wb["GERAL"]
        
        # Pular cabeçalhos (linhas 1-3)
        data_rows = list(ws.iter_rows(min_row=4, values_only=True))
        
        imported = 0
        errors = 0
        skipped = 0
        cursor = connection.cursor()
        
        company_id = os.getenv("COMPANY_ID", "B I IMOVEIS LTDA")
        
        for row_idx, row in enumerate(data_rows, start=4):
            try:
                # Extrair dados da linha
                reference = row[0]  # REFERÊNCIA
                property_name = row[2]  # IMÓVEL
                neighborhood = row[3]  # BAIRRO
                sale_date = parse_date(row[4])  # DATA DA VENDA
                angaria_date = parse_date(row[5])  # DATA DA ANGARIAÇÃO
                divulgation_value = parse_decimal(row[7])  # VALOR DE DIVULGAÇÃO
                sale_value = parse_decimal(row[8])  # VALOR VENDA
                business_type = row[9]  # TIPO DE NEGÓCIO
                angaria_store = row[10]  # LOJA ANGARIADORA
                sell_store = row[11]  # LOJA VENDEDORA
                commission = parse_decimal(row[12])  # COMISSÃO
                commission_percent = parse_decimal(row[13])  # % COMISSÃO
                angariador_name = row[14]  # ANGARIADOR
                
                # Pular linhas vazias
                if not reference:
                    continue
                
                # Pular linhas com comissão pendente
                if not commission or commission == 0:
                    skipped += 1
                    continue
                
                # Buscar ID de corretor usando fuzzy matching
                angariador_id = None
                matched_name = None
                
                if angariador_name:
                    # Primeiro tentar match exato
                    normalized = angariador_name.upper().strip()
                    if normalized in broker_mapping:
                        angariador_id = broker_mapping[normalized]
                        matched_name = angariador_name
                    else:
                        # Tentar fuzzy match
                        best_match = fuzzy_match(angariador_name, KNOWN_BROKERS, threshold=0.7)
                        if best_match:
                            normalized_match = best_match.upper().strip()
                            if normalized_match in broker_mapping:
                                angariador_id = broker_mapping[normalized_match]
                                matched_name = best_match
                                print(f"  ℹ️ Linha {row_idx}: '{angariador_name}' → '{best_match}'")
                
                if not angariador_id:
                    print(f"  ⚠️ Linha {row_idx}: Corretor '{angariador_name}' não encontrado")
                    skipped += 1
                    continue
                
                # Preparar dados para inserção
                insert_query = """
                INSERT INTO sales (
                    id, companyId, propertyId, buyerName, saleDate, angariationDate,
                    saleValue, brokerAngariador, brokerAngariadorName, businessType,
                    status, registeredAt, registeredBy, registeredByName,
                    realEstateCommission, observation, propertyType
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                """
                
                # Gerar ID único
                sale_id = f"hist-2025-{month_num:02d}-{imported+1:05d}"
                
                # Preparar valores
                values = (
                    sale_id,
                    company_id,
                    f"prop-{reference}",  # propertyId baseado em referência
                    property_name or "N/A",  # buyerName
                    sale_date,
                    angaria_date,
                    sale_value,
                    angariador_id,
                    matched_name or angariador_name,
                    business_type,
                    "commission_paid",  # Status histórico
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "system",
                    "Sistema de Importação",
                    commission,
                    f"Bairro: {neighborhood} | Loja Angariadora: {angaria_store} | Loja Vendedora: {sell_store}",
                    property_name,
                )
                
                cursor.execute(insert_query, values)
                imported += 1
                
                if imported % 20 == 0:
                    print(f"  ✓ {imported} linhas importadas...")
                
            except Exception as e:
                errors += 1
                print(f"  ✗ Erro na linha {row_idx}: {str(e)}")
        
        connection.commit()
        cursor.close()
        
        print(f"\n✅ Importação concluída!")
        print(f"   Importadas: {imported} vendas")
        print(f"   Ignoradas (sem comissão): {skipped}")
        print(f"   Erros: {errors}")
        
        return imported, skipped, errors
        
    except Exception as e:
        print(f"❌ Erro ao processar arquivo: {str(e)}")
        return 0, 0, 1

def main():
    """Função principal"""
    print("\n" + "="*70)
    print("IMPORTADOR DE DADOS 2025 - DELMACK")
    print("="*70)
    
    # Conectar ao banco
    connection = get_database_connection()
    
    # Carregar mapeamento de corretores
    broker_mapping = load_broker_mapping(connection)
    print(f"\n✓ {len(broker_mapping)} corretores carregados do banco")
    
    # Importar arquivos mensais
    total_imported = 0
    total_skipped = 0
    total_errors = 0
    
    for month_num in range(1, 13):
        month_str = f"{month_num:02d}"
        month_name = MONTHS[month_str]
        
        # Procurar arquivo
        file_path = None
        for file in os.listdir(UPLOAD_DIR):
            if file.startswith(month_str) and "2025" in file and file.endswith(".xlsx"):
                file_path = os.path.join(UPLOAD_DIR, file)
                break
        
        if file_path and os.path.exists(file_path):
            imported, skipped, errors = import_monthly_file(connection, file_path, month_num, broker_mapping)
            total_imported += imported
            total_skipped += skipped
            total_errors += errors
        else:
            print(f"\n⚠️ Arquivo não encontrado para {month_name}/2025")
    
    # Resumo final
    print("\n" + "="*70)
    print("RESUMO FINAL")
    print("="*70)
    print(f"Total de vendas importadas: {total_imported}")
    print(f"Total de linhas ignoradas: {total_skipped}")
    print(f"Total de erros: {total_errors}")
    if (total_imported + total_skipped + total_errors) > 0:
        print(f"Taxa de sucesso: {(total_imported / (total_imported + total_skipped + total_errors) * 100):.1f}%")
    
    connection.close()
    print("\n✅ Importação finalizada!")

if __name__ == "__main__":
    main()
