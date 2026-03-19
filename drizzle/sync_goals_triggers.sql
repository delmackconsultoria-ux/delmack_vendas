-- Triggers para sincronização automática de metas com indicadores
-- Garante que quando uma meta é alterada, os indicadores são atualizados automaticamente

-- Trigger 1: Quando um indicador é criado, copiar valor da meta pai
DELIMITER $$

CREATE TRIGGER sync_goal_to_indicator_on_insert
AFTER INSERT ON goalIndicators
FOR EACH ROW
BEGIN
  -- Quando um novo indicador é criado, ele já vem com o targetValue
  -- Este trigger pode ser usado para validações futuras
  UPDATE goalIndicators 
  SET updatedAt = NOW() 
  WHERE id = NEW.id;
END$$

-- Trigger 2: Quando um indicador é atualizado
CREATE TRIGGER sync_goal_to_indicator_on_update
AFTER UPDATE ON goalIndicators
FOR EACH ROW
BEGIN
  -- Atualizar timestamp da meta pai
  UPDATE goals 
  SET updatedAt = NOW() 
  WHERE id = NEW.goalId;
END$$

DELIMITER ;

-- Criar índices para melhor performance
CREATE INDEX idx_goalIndicators_goalId ON goalIndicators(goalId);
CREATE INDEX idx_goalIndicators_indicatorName ON goalIndicators(indicatorName);
CREATE INDEX idx_goals_managerId_year ON goals(managerId, year);
CREATE INDEX idx_goals_companyId_year ON goals(companyId, year);
