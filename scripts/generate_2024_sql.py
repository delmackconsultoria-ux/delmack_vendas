#!/usr/bin/env python3
"""
Script para gerar SQL de importação de dados de 2024
Lê arquivos Excel e gera INSERT statements prontos para importação
"""

import os
import openpyxl
from datetime import datetime
from decimal import Decimal
from difflib import SequenceMatcher

# Configurações
UPLOAD_DIR = "/home/ubuntu/upload"
OUTPUT_FILE = "/home/ubuntu/delmack_real_estate/scripts/import_2024_data.sql"

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

# Lista de corretores cadastrados
KNOWN_BROKERS = [
    "Adriana Simoes Barbosa Karter",
    "Allan Sobiech",
    "Charles Luciano Lucca",
    "Diego Ferreira dos Santos",
    "Edmar Antunes",
    "Fabiano Buziak",
    "Fabio Simoes",
    "Joseli do Rocio Bueno",
    "Marco Antonio do Nascimento Joao",
    "Maria Carolina Munhoz de Miranda Nicolodi",
    "Odair Amancio",
    "Priscilla Gomes Ziolkowski",
    "Priscilla Pires Andrelle",
    "Regiana Mirian Baggio Favarini",
    "Rosani Felix dos Santos",
    "Sandra Maria Alves de Lima Przybysz",
]

# Mapeamento de nomes abreviados para nomes completos
ABBREVIATED_NAMES = {
    "Marco Joao": "Marco Antonio do Nascimento Joao",
    "Marco João": "Marco Antonio do Nascimento Joao",
    "Rosani": "Rosani Felix dos Santos",
    "Odair": "Odair Amancio",
    "Fabio": "Fabio Simoes",
    "Regiana": "Regiana Mirian Baggio Favarini",
    "Diego": "Diego Ferreira dos Santos",
    "Allan": "Allan Sobiech",
    "Outros": None,
    "Leonardo": None,
    "Dinamar": None,
    "Cleverson": None,
}

def normalize_name(name):
    """Normaliza nome removendo acentos"""
    if not name:
        return None
    return name.upper().strip().replace("Ã", "A").replace("ã", "a").replace("É", "E").replace("é", "e").replace("Í", "I").replace("í", "i").replace("Ó", "O").replace("ó", "o").replace("Ú", "U").replace("ú", "u").replace("Ç", "C").replace("ç", "c")

def fuzzy_match(name, candidates, threshold=0.6):
    """Encontra o melhor match usando fuzzy matching"""
    if not name:
        return None
    
    name_upper = normalize_name(name)
    best_match = None
    best_score = threshold
    
    for candidate in candidates:
        candidate_upper = normalize_name(candidate)
        score = SequenceMatcher(None, name_upper, candidate_upper).ratio()
        
        if score > best_score:
            best_score = score
            best_match = candidate
    
    return best_match

def parse_date(date_value):
    """Converte data do Excel para formato MySQL"""
    if not date_value:
        return "NULL"
    
    if isinstance(date_value, datetime):
        return f"'{date_value.strftime('%Y-%m-%d')}'"
    
    try:
        if isinstance(date_value, str):
            parts = date_value.split("/")
            if len(parts) == 3:
                return f"'{parts[2]}-{parts[1]}-{parts[0]}'"
        return "NULL"
    except:
        return "NULL"

def parse_decimal(value):
    """Converte valor para Decimal"""
    if not value:
        return "NULL"
    
    try:
        if isinstance(value, str):
            value = value.replace("R$", "").replace(".", "").replace(",", ".").strip()
        decimal_value = Decimal(str(value))
        return str(decimal_value)
    except:
        return "NULL"

def escape_sql_string(value):
    """Escapa string para SQL"""
    if not value:
        return "NULL"
    
    value_str = str(value).strip()
    if not value_str:
        return "NULL"
    
    value_str = value_str.replace("'", "''")
    return f"'{value_str}'"

def generate_sql():
    """Gera arquivo SQL com dados de 2024"""
    
    print("Gerando SQL de importacao de 2024...")
    
    # Criar mapeamento de corretores
    broker_id_map = {}
    for i, broker_name in enumerate(KNOWN_BROKERS, 1):
        broker_id = f"broker-{i:02d}"
        normalized = normalize_name(broker_name)
        broker_id_map[normalized] = (broker_id, broker_name)
    
    # Abrir arquivo SQL para escrita
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as sql_file:
        # Cabecalho
        sql_file.write("-- =====================================================\n")
        sql_file.write("-- Importacao de Dados Historicos 2024 - Delmack\n")
        sql_file.write(f"-- Gerado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        sql_file.write("-- =====================================================\n\n")
        
        sql_file.write("-- Desabilitar verificacao de chaves estrangeiras\n")
        sql_file.write("SET FOREIGN_KEY_CHECKS=0;\n\n")
        
        total_imported = 0
        total_skipped = 0
        
        # Processar cada mes
        for month_num in range(1, 13):
            month_str = f"{month_num:02d}"
            month_name = MONTHS[month_str]
            
            # Procurar arquivo
            file_path = None
            for file in os.listdir(UPLOAD_DIR):
                if file.startswith(month_str) and "2024" in file and file.endswith(".xlsx"):
                    file_path = os.path.join(UPLOAD_DIR, file)
                    break
            
            if not file_path:
                print(f"Arquivo nao encontrado para {month_name}/2024")
                continue
            
            print(f"Processando {os.path.basename(file_path)}...", end=" ", flush=True)
            
            try:
                wb = openpyxl.load_workbook(file_path, data_only=True)
                ws = wb["Geral"]
                
                month_imported = 0
                month_skipped = 0
                
                sql_file.write(f"-- {month_name.upper()} 2024\n")
                
                # Processar linhas
                for row_idx, row in enumerate(ws.iter_rows(min_row=4, values_only=True), start=4):
                    try:
                        # Extrair dados
                        reference = row[0]
                        property_name = row[2]
                        neighborhood = row[3]
                        sale_date = row[4]
                        angaria_date = row[5]
                        sale_value = row[8]
                        business_type = row[9]
                        angaria_store = row[10]
                        sell_store = row[11]
                        commission = row[12]
                        angariador_name = row[14]
                        
                        # Pular linhas vazias
                        if not reference:
                            continue
                        
                        # Pular linhas sem comissao ou sem valor de venda
                        if not commission or commission == 0 or not sale_value or sale_value == 0:
                            month_skipped += 1
                            continue
                        
                        # Mapear corretor
                        angariador_id = None
                        matched_name = None
                        
                        if angariador_name:
                            # Primeiro tentar mapeamento de nomes abreviados
                            if angariador_name in ABBREVIATED_NAMES:
                                full_name = ABBREVIATED_NAMES[angariador_name]
                                if full_name:
                                    normalized_full = normalize_name(full_name)
                                    if normalized_full in broker_id_map:
                                        angariador_id, matched_name = broker_id_map[normalized_full]
                            
                            # Se nao encontrou, tentar match exato
                            if not angariador_id:
                                normalized = normalize_name(angariador_name)
                                if normalized in broker_id_map:
                                    angariador_id, matched_name = broker_id_map[normalized]
                            
                            # Se ainda nao encontrou, tentar fuzzy match
                            if not angariador_id:
                                best_match = fuzzy_match(angariador_name, KNOWN_BROKERS, threshold=0.6)
                                if best_match:
                                    normalized_match = normalize_name(best_match)
                                    if normalized_match in broker_id_map:
                                        angariador_id, matched_name = broker_id_map[normalized_match]
                        
                        if not angariador_id:
                            month_skipped += 1
                            continue
                        
                        # Gerar ID unico
                        sale_id = f"hist-2024-{month_num:02d}-{month_imported+1:05d}"
                        
                        # Preparar valores
                        values = (
                            escape_sql_string(sale_id),
                            escape_sql_string("B I IMOVEIS LTDA"),
                            escape_sql_string(f"prop-{reference}"),
                            escape_sql_string(property_name or "N/A"),
                            parse_date(sale_date),
                            parse_date(angaria_date),
                            parse_decimal(sale_value),
                            escape_sql_string(angariador_id),
                            escape_sql_string(matched_name or angariador_name),
                            escape_sql_string(business_type),
                            escape_sql_string("commission_paid"),
                            escape_sql_string(datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                            escape_sql_string("system"),
                            escape_sql_string("Sistema de Importacao"),
                            parse_decimal(commission),
                            escape_sql_string(f"Bairro: {neighborhood} | Loja Angariadora: {angaria_store} | Loja Vendedora: {sell_store}"),
                            escape_sql_string(property_name),
                        )
                        
                        # Gerar INSERT
                        insert_sql = f"INSERT INTO sales (id, companyId, propertyId, buyerName, saleDate, angariationDate, saleValue, brokerAngariador, brokerAngariadorName, businessType, status, registeredAt, registeredBy, registeredByName, realEstateCommission, observation, propertyType) VALUES ({', '.join(values)});\n"
                        
                        sql_file.write(insert_sql)
                        month_imported += 1
                        total_imported += 1
                        
                    except Exception as e:
                        month_skipped += 1
                        continue
                
                sql_file.write(f"\n")
                print(f"OK ({month_imported} vendas, {month_skipped} ignoradas)")
                total_skipped += month_skipped
                
            except Exception as e:
                print(f"ERRO: {e}")
        
        # Rodape
        sql_file.write("-- Reabilitar verificacao de chaves estrangeiras\n")
        sql_file.write("SET FOREIGN_KEY_CHECKS=1;\n\n")
        sql_file.write(f"-- Total de vendas importadas: {total_imported}\n")
        sql_file.write(f"-- Total de linhas ignoradas: {total_skipped}\n")
    
    print(f"\n{'='*60}")
    print(f"SQL gerado com sucesso!")
    print(f"   Arquivo: {OUTPUT_FILE}")
    print(f"   Total de vendas: {total_imported}")
    print(f"   Total ignoradas: {total_skipped}")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    generate_sql()
