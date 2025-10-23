/**
 * Serviço de integração com a API do Properfy
 * Responsável por autenticar e buscar dados de imóveis com segurança máxima
 * 
 * Segurança implementada:
 * - Credenciais via variáveis de ambiente (nunca em código)
 * - Cache de tokens com expiração
 * - Rate limiting e retry logic
 * - Validação de entrada
 * - Tratamento de erros seguro
 * - Logging de operações
 */

import axios, { AxiosInstance, AxiosError } from "axios";

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

interface ProperfyServiceConfig {
  email: string;
  password: string;
  sandbox?: boolean;
  timeout?: number;
  retries?: number;
}

class ProperfyService {
  private apiUrl: string;
  private token: string | null = null;
  private client: AxiosInstance | null = null;
  private lastTokenTime: number = 0;
  private tokenExpiryTime: number = 3600000; // 1 hora em ms
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly email: string;
  private readonly password: string;

  constructor(config: ProperfyServiceConfig) {
    this.email = config.email;
    this.password = config.password;
    this.timeout = config.timeout || 10000; // 10 segundos
    this.maxRetries = config.retries || 3;

    this.apiUrl = config.sandbox !== false
      ? "https://sandbox.properfy.com.br/api"
      : "https://sistema.dominiodaimobiliaria.com.br/api";
  }

  /**
   * Autentica na API do Properfy com retry logic
   */
  async authenticate(): Promise<string> {
    try {
      // Verifica se o token ainda é válido
      if (this.token && Date.now() - this.lastTokenTime < this.tokenExpiryTime) {
        return this.token;
      }

      let lastError: Error | null = null;

      // Retry logic
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          const response = await axios.post<ProperfyAuthResponse>(
            `${this.apiUrl}/auth/token`,
            {
              vrcEmail: this.email,
              vrcPass: this.password,
            },
            {
              timeout: this.timeout,
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
            timeout: this.timeout,
          });

          console.log("[Properfy] Autenticação bem-sucedida");
          return this.token;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          if (attempt < this.maxRetries) {
            // Aguarda antes de tentar novamente (exponential backoff)
            const delay = Math.pow(2, attempt - 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError || new Error("Falha ao autenticar na API do Properfy");
    } catch (error) {
      const message = error instanceof AxiosError 
        ? `Erro HTTP ${error.response?.status}: ${error.message}`
        : error instanceof Error 
        ? error.message 
        : "Erro desconhecido";
      
      console.error(`[Properfy] Erro ao autenticar: ${message}`);
      throw new Error(`Falha ao autenticar na API do Properfy: ${message}`);
    }
  }

  /**
   * Busca imóvel por referência com validação
   */
  async getPropertyByReference(reference: string): Promise<ProperfyProperty | null> {
    try {
      // Validação de entrada
      if (!reference || typeof reference !== "string" || reference.trim().length === 0) {
        throw new Error("Referência inválida");
      }

      const sanitizedReference = reference.trim().toUpperCase();

      await this.authenticate();

      if (!this.client) {
        throw new Error("Cliente não inicializado");
      }

      console.log(`[Properfy] Buscando imóvel por referência: ${sanitizedReference}`);

      const response = await this.client.get<ProperfyListResponse>(
        "/property/property",
        {
          params: {
            chrAlias: sanitizedReference,
          },
        }
      );

      if (response.data.data && response.data.data.length > 0) {
        console.log(`[Properfy] Imóvel encontrado: ${sanitizedReference}`);
        return response.data.data[0];
      }

      console.log(`[Properfy] Imóvel não encontrado: ${sanitizedReference}`);
      return null;
    } catch (error) {
      const message = error instanceof AxiosError 
        ? `Erro HTTP ${error.response?.status}: ${error.message}`
        : error instanceof Error 
        ? error.message 
        : "Erro desconhecido";
      
      console.error(`[Properfy] Erro ao buscar imóvel por referência: ${message}`);
      return null;
    }
  }

  /**
   * Lista imóveis com paginação e validação
   */
  async listProperties(page: number = 1, size: number = 10): Promise<ProperfyListResponse | null> {
    try {
      // Validação de entrada
      if (!Number.isInteger(page) || page < 1) {
        throw new Error("Página deve ser um número inteiro positivo");
      }
      if (!Number.isInteger(size) || size < 1 || size > 100) {
        throw new Error("Tamanho deve estar entre 1 e 100");
      }

      await this.authenticate();

      if (!this.client) {
        throw new Error("Cliente não inicializado");
      }

      console.log(`[Properfy] Listando imóveis: página ${page}, tamanho ${size}`);

      const response = await this.client.get<ProperfyListResponse>(
        "/property/property",
        {
          params: {
            page,
            limit: size,
          },
        }
      );

      console.log(`[Properfy] Imóveis listados com sucesso`);
      return response.data;
    } catch (error) {
      const message = error instanceof AxiosError 
        ? `Erro HTTP ${error.response?.status}: ${error.message}`
        : error instanceof Error 
        ? error.message 
        : "Erro desconhecido";
      
      console.error(`[Properfy] Erro ao listar imóveis: ${message}`);
      return null;
    }
  }

  /**
   * Busca imóvel por ID com validação
   */
  async getPropertyById(id: number): Promise<ProperfyProperty | null> {
    try {
      // Validação de entrada
      if (!Number.isInteger(id) || id < 1) {
        throw new Error("ID deve ser um número inteiro positivo");
      }

      await this.authenticate();

      if (!this.client) {
        throw new Error("Cliente não inicializado");
      }

      console.log(`[Properfy] Buscando imóvel por ID: ${id}`);

      const response = await this.client.get<ProperfyProperty>(
        `/property/property/${id}`
      );

      console.log(`[Properfy] Imóvel encontrado: ID ${id}`);
      return response.data;
    } catch (error) {
      const message = error instanceof AxiosError 
        ? `Erro HTTP ${error.response?.status}: ${error.message}`
        : error instanceof Error 
        ? error.message 
        : "Erro desconhecido";
      
      console.error(`[Properfy] Erro ao buscar imóvel por ID: ${message}`);
      return null;
    }
  }

  /**
   * Verifica a saúde da conexão com Properfy
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch (error) {
      console.error("[Properfy] Health check falhou");
      return false;
    }
  }
}

/**
 * Cria uma instância do serviço Properfy com credenciais seguras
 * As credenciais devem estar em variáveis de ambiente:
 * - PROPERFY_EMAIL
 * - PROPERFY_PASSWORD
 */
export function createProperfyService(config?: Partial<ProperfyServiceConfig>): ProperfyService {
  const email = config?.email || process.env.PROPERFY_EMAIL;
  const password = config?.password || process.env.PROPERFY_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Credenciais do Properfy não configuradas. " +
      "Configure PROPERFY_EMAIL e PROPERFY_PASSWORD nas variáveis de ambiente."
    );
  }

  return new ProperfyService({
    email,
    password,
    sandbox: config?.sandbox ?? true,
    timeout: config?.timeout ?? 10000,
    retries: config?.retries ?? 3,
  });
}

export type { ProperfyProperty, ProperfyListResponse, ProperfyAuthResponse, ProperfyServiceConfig };

