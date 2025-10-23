/**
 * Serviço de integração com a API do Properfy
 * Responsável por autenticar e buscar dados de imóveis
 */

import axios, { AxiosInstance } from "axios";

interface ProperfyAuthResponse {
  token: string;
  company: number;
  name: string;
  email: string;
  avatar: string;
  settings: {
    url: string;
    logo: string;
  };
}

interface ProperfyProperty {
  id: number;
  reference?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  neighborhood?: string;
  number?: string;
  complement?: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  value?: number;
  [key: string]: any;
}

interface ProperfyListResponse {
  current_page: number;
  data: ProperfyProperty[];
  total?: number;
  per_page?: number;
  last_page?: number;
}

class ProperfyService {
  private apiUrl: string;
  private token: string | null = null;
  private client: AxiosInstance | null = null;
  private lastTokenTime: number = 0;
  private tokenExpiryTime: number = 3600000; // 1 hora em ms

  constructor(
    private email: string,
    private password: string,
    private sandbox: boolean = true
  ) {
    this.apiUrl = sandbox
      ? "https://sandbox.properfy.com.br/api"
      : "https://sistema.dominiodaimobiliaria.com.br/api";
  }

  /**
   * Autentica na API do Properfy e obtém um token
   */
  async authenticate(): Promise<string> {
    try {
      // Verifica se o token ainda é válido
      if (this.token && Date.now() - this.lastTokenTime < this.tokenExpiryTime) {
        return this.token;
      }

      const response = await axios.post<ProperfyAuthResponse>(
        `${this.apiUrl}/auth/token`,
        {
          vrcEmail: this.email,
          vrcPass: this.password,
        }
      );

      this.token = response.data.token;
      this.lastTokenTime = Date.now();

      // Cria cliente axios com token
      this.client = axios.create({
        baseURL: this.apiUrl,
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });

      return this.token;
    } catch (error) {
      console.error("[Properfy] Erro ao autenticar:", error);
      throw new Error("Falha ao autenticar na API do Properfy");
    }
  }

  /**
   * Busca imóvel por referência
   */
  async getPropertyByReference(reference: string): Promise<ProperfyProperty | null> {
    try {
      await this.authenticate();

      if (!this.client) {
        throw new Error("Cliente não inicializado");
      }

      // Buscar por referência usando o endpoint correto
      const response = await this.client.get<ProperfyListResponse>(
        "/property/property",
        {
          params: {
            chrAlias: reference, // Campo de referência no Properfy
          },
        }
      );

      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      }

      return null;
    } catch (error) {
      console.error("[Properfy] Erro ao buscar imóvel por referência:", error);
      return null;
    }
  }

  /**
   * Lista todos os imóveis com paginação
   */
  async listProperties(page: number = 1, size: number = 10): Promise<ProperfyListResponse | null> {
    try {
      await this.authenticate();

      if (!this.client) {
        throw new Error("Cliente não inicializado");
      }

      const response = await this.client.get<ProperfyListResponse>(
        "/property/property",
        {
          params: {
            page,
            limit: size,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("[Properfy] Erro ao listar imóveis:", error);
      return null;
    }
  }

  /**
   * Busca imóvel por ID
   */
  async getPropertyById(id: number): Promise<ProperfyProperty | null> {
    try {
      await this.authenticate();

      if (!this.client) {
        throw new Error("Cliente não inicializado");
      }

      const response = await this.client.get<ProperfyProperty>(
        `/property/property/${id}`
      );

      return response.data;
    } catch (error) {
      console.error("[Properfy] Erro ao buscar imóvel por ID:", error);
      return null;
    }
  }
}

/**
 * Cria uma instância do serviço Properfy
 * Usa as credenciais fornecidas para autenticação
 */
export function createProperfyService(
  email: string,
  password: string,
  sandbox: boolean = true
): ProperfyService {
  return new ProperfyService(email, password, sandbox);
}

export type { ProperfyProperty, ProperfyListResponse, ProperfyAuthResponse };

