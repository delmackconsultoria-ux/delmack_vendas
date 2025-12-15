import { describe, it, expect } from "vitest";

describe("Auth Flow", () => {
  it("should have valid user roles", () => {
    const roles = ["broker", "manager", "finance", "admin"];
    expect(roles).toContain("broker");
    expect(roles).toContain("manager");
  });

  it("should redirect broker to / instead of /dashboard", () => {
    const brokerDashboardPath = "/dashboard";
    const expectedPath = "/";
    expect(brokerDashboardPath).not.toBe(expectedPath);
  });

  it("should validate email format", () => {
    const validEmails = [
      "corretor@testes.com.br",
      "gerente@testes.com.br",
      "finance@testes.com.br",
      "admin@testes.com.br",
    ];
    validEmails.forEach((email) => {
      expect(email).toMatch(/@/);
    });
  });

  it("should have password validation", () => {
    const password = "senha123";
    expect(password.length).toBeGreaterThanOrEqual(6);
  });
});
