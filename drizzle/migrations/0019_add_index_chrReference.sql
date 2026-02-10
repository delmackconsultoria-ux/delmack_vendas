-- Adicionar índice na coluna chrReference para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_chrReference ON properfyProperties(chrReference);
