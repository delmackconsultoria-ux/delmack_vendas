import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../../db';
import { indicatorGoals } from '../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

describe('Indicator Goals', () => {
  let db: any;
  const testCompanyId = 'B I IMOVEIS LTDA';
  const testYear = 2026;

  beforeAll(async () => {
    db = await getDb();
  });

  it('should retrieve all goals for a year', async () => {
    if (!db) {
      console.log('Database not available, skipping test');
      return;
    }

    const goals = await db
      .select()
      .from(indicatorGoals)
      .where(
        and(
          eq(indicatorGoals.companyId, testCompanyId),
          eq(indicatorGoals.year, testYear)
        )
      );

    expect(goals).toBeDefined();
    expect(goals.length).toBeGreaterThan(0);
    expect(goals[0]).toHaveProperty('indicatorName');
    expect(goals[0]).toHaveProperty('monthlyGoal');
  });

  it('should have correct meta values for VGV', async () => {
    if (!db) {
      console.log('Database not available, skipping test');
      return;
    }

    const vgvGoal = await db
      .select()
      .from(indicatorGoals)
      .where(
        and(
          eq(indicatorGoals.companyId, testCompanyId),
          eq(indicatorGoals.indicatorName, 'Negócios no mês (unidades)'),
          eq(indicatorGoals.year, testYear)
        )
      )
      .limit(1);

    expect(vgvGoal.length).toBe(1);
    expect(Number(vgvGoal[0].monthlyGoal)).toBe(24);
  });

  it('should have correct meta values for Commission Received', async () => {
    if (!db) {
      console.log('Database not available, skipping test');
      return;
    }

    const commissionGoal = await db
      .select()
      .from(indicatorGoals)
      .where(
        and(
          eq(indicatorGoals.companyId, testCompanyId),
          eq(indicatorGoals.indicatorName, 'Comissão Recebida'),
          eq(indicatorGoals.year, testYear)
        )
      )
      .limit(1);

    expect(commissionGoal.length).toBe(1);
    expect(Number(commissionGoal[0].monthlyGoal)).toBe(525000);
  });

  it('should have annual average calculated correctly', async () => {
    if (!db) {
      console.log('Database not available, skipping test');
      return;
    }

    const goal = await db
      .select()
      .from(indicatorGoals)
      .where(
        and(
          eq(indicatorGoals.companyId, testCompanyId),
          eq(indicatorGoals.indicatorName, 'Comissão Recebida'),
          eq(indicatorGoals.year, testYear)
        )
      )
      .limit(1);

    if (goal.length > 0) {
      const monthlyGoal = Number(goal[0].monthlyGoal);
      const annualAverage = Number(goal[0].annualAverage);
      expect(annualAverage).toBe(monthlyGoal * 12);
    }
  });

  it('should have all 26 goals inserted', async () => {
    if (!db) {
      console.log('Database not available, skipping test');
      return;
    }

    const allGoals = await db
      .select()
      .from(indicatorGoals)
      .where(
        and(
          eq(indicatorGoals.companyId, testCompanyId),
          eq(indicatorGoals.year, testYear)
        )
      );

    expect(allGoals.length).toBe(26);
  });

  afterAll(async () => {
    // Cleanup if needed
  });
});
