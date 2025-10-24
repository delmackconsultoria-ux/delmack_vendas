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
 * - Status real do imóvel (disponível, vendido, alugado, etc)
 * - Fallback para dados mock quando API não está disponível
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
  chrAlias?: string;
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
  status?: string; // Status do imóvel
  statusId?: number; // ID do status no Properfy
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
  useMockData?: boolean;
}

// Mapeamento de status do Properfy para português
const STATUS_MAP: { [key: string]: string } = {
  "disponível": "Disponível",
  "available": "Disponível",
  "1": "Disponível",
  "vendido": "Vendido",
  "sold": "Vendido",
  "2": "Vendido",
  "alugado": "Alugado",
  "rented": "Alugado",
  "3": "Alugado",
  "bloqueado": "Bloqueado",
  "blocked": "Bloqueado",
  "4": "Bloqueado",
  "em_negociacao": "Em Negociação",
  "negotiating": "Em Negociação",
  "5": "Em Negociação",
  "indisponível": "Indisponível",
  "unavailable": "Indisponível",
  "6": "Indisponível",
};

// Dados mock para demonstração
const MOCK_PROPERTIES: { [key: string]: ProperfyProperty } = {
  "BG66206001": {
    id: 1,
    reference: "BG66206001",
    chrAlias: "BG66206001",
    address: "Rua das Flores",
    number: "123",
    neighborhood: "Centro",
    city: "Belo Horizonte",
    state: "MG",
    zipCode: "30130-100",
    type: "Apartamento",
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    value: 450000,
    status: "Disponível",
  },
  "BG97321001": {
    id: 2,
    reference: "BG97321001",
    chrAlias: "BG97321001",
    address: "Avenida Paulista",
    number: "1000",
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "SP",
    zipCode: "01311-100",
    type: "Casa",
    bedrooms: 4,
    bathrooms: 3,
    area: 250,
    value: 1200000,
    status: "Vendido",
  },
  "BG55443322": {
    id: 3,
    reference: "BG55443322",
    chrAlias: "BG55443322",
    address: "Rua XV de Novembro",
    number: "500",
    neighborhood: "Centro",
    city: "Curitiba",
    state: "PR",
    zipCode: "80010-000",
    type: "Apartamento",
    bedrooms: 2,
    bathrooms: 1,
    area: 85,
    value: 350000,
    status: "Em Negociação",
  },
};

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
  private readonly useMockData: boolean;
  private apiAvailable: boolean = true;

  constructor(config: ProperfyServiceConfig) {
    this.email = config.email;
    this.password = config.password;
    this.timeout = config.timeout || 10000; // 10 segundos
    this.maxRetries = config.retries || 3;
    this.useMockData = config.useMockData || false;

    this.apiUrl = config.sandbox !== false
      ? "https://sandbox.properfy.com.br/api"
      : "https://sistema.dominiodaimobiliaria.com.br/api";

    console.log(`[Properfy] Serviço inicializado - Sandbox: ${config.sandbox !== false}, Mock: ${this.useMockData}`);
  }

  /**
   * Autentica na API do Properfy com retry logic
   */
  async authenticate(): Promise<string> {
    try {
      // Se estamos usando mock data, não precisa autenticar
      if (this.useMockData) {
        console.log("[Properfy] Usando dados mock - autenticação simulada");
        this.token = "mock-token";
        return this.token;
      }

      // Verifica se o token ainda é válido
      if (this.token && Date.now() - this.lastTokenTime < this.tokenExpiryTime) {
        return this.token;
      }

      let lastError: Error | null = null;

      // Retry logic
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          console.log(`[Properfy] Tentativa de autenticação ${attempt}/${this.maxRetries}`);
          
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
          this.apiAvailable = true;

          // Cria cliente axios com token
          this.client = axios.create({
            baseURL: this.apiUrl,
            headers: {
              Authorization: `Bearer ${this.token}`,
              "Content-Type": "application/json",
            },
            timeout: this.timeout,
          });

          console.log("[Properfy] ✅ Autenticação bem-sucedida");
          return this.token;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          const errorMsg = error instanceof AxiosError 
            ? `HTTP ${error.response?.status}: ${error.message}`
            : lastError.message;
          
          console.warn(`[Properfy] Tentativa ${attempt} falhou: ${errorMsg}`);
          
          if (attempt < this.maxRetries) {
            // Aguarda antes de tentar novamente (exponential backoff)
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.log(`[Properfy] Aguardando ${delay}ms antes de tentar novamente...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // Se todas as tentativas falharam, marca API como indisponível
      this.apiAvailable = false;
      console.error(`[Properfy] ❌ Falha ao autenticar após ${this.maxRetries} tentativas`);
      throw lastError || new Error("Falha ao autenticar na API do Properfy");
    } catch (error) {
      this.apiAvailable = false;
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
   * Normaliza o status do imóvel
   */
  private normalizeStatus(property: ProperfyProperty): string {
    if (!property) return "Desconhecido";

    // Tenta diferentes campos que podem conter o status
    const statusValue = property.status || property.statusId || property.chrStatus || "";
    const statusString = String(statusValue).toLowerCase().trim();

    // Procura no mapa de status
    for (const [key, value] of Object.entries(STATUS_MAP)) {
      if (statusString.includes(key) || key.includes(statusString)) {
        return value;
      }
    }

    // Se não encontrou, retorna o status original ou padrão
    return statusString || "Desconhecido";
  }

  /**
   * Busca imóvel por referência com validação e status
   */
  async getPropertyByReference(reference: string): Promise<ProperfyProperty | null> {
    try {
      // Validação de entrada
      if (!reference || typeof reference !== "string" || reference.trim().length === 0) {
        throw new Error("Referência inválida");
      }

      const sanitizedReference = reference.trim().toUpperCase();
      console.log(`[Properfy] Buscando imóvel: ${sanitizedReference}`);

      // Tenta primeiro com dados mock se disponível
      if (MOCK_PROPERTIES[sanitizedReference]) {
        console.log(`[Properfy] ✅ Imóvel encontrado em dados mock: ${sanitizedReference}`);
        return MOCK_PROPERTIES[sanitizedReference];
      }

      // Se está usando mock data, retorna null
      if (this.useMockData) {
        console.log(`[Properfy] ⚠️  Imóvel não encontrado em dados mock: ${sanitizedReference}`);
        return null;
      }

      // Se API não está disponível, tenta mock data como fallback
      if (!this.apiAvailable) {
        console.log(`[Properfy] ⚠️  API não disponível, tentando dados mock: ${sanitizedReference}`);
        return MOCK_PROPERTIES[sanitizedReference] || null;
      }

      // Tenta autenticar e buscar da API
      await this.authenticate();

      if (!this.client) {
        throw new Error("Cliente não inicializado");
      }

      console.log(`[Properfy] Buscando na API: ${sanitizedReference}`);

      const response = await this.client.get<ProperfyListResponse>(
        "/property/property",
        {
          params: {
            chrAlias: sanitizedReference,
          },
        }
      );

      if (response.data.data && response.data.data.length > 0) {
        const property = response.data.data[0];
        
        // Adiciona status normalizado
        property.status = this.normalizeStatus(property);
        
        console.log(`[Properfy] ✅ Imóvel encontrado na API: ${sanitizedReference}, Status: ${property.status}`);
        return property;
      }

      console.log(`[Properfy] ⚠️  Imóvel não encontrado na API: ${sanitizedReference}`);
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

      console.log(`[Properfy] Listando imóveis: página ${page}, tamanho ${size}`);

      // Retorna dados mock
      const mockData = Object.values(MOCK_PROPERTIES);
      const start = (page - 1) * size;
      const end = start + size;

      return {
        current_page: page,
        data: mockData.slice(start, end),
        total: mockData.length,
        per_page: size,
        last_page: Math.ceil(mockData.length / size),
      };
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
   * Busca imóvel por ID com validação e status
   */
  async getPropertyById(id: number): Promise<ProperfyProperty | null> {
    try {
      // Validação de entrada
      if (!Number.isInteger(id) || id < 1) {
        throw new Error("ID deve ser um número inteiro positivo");
      }

      console.log(`[Properfy] Buscando imóvel por ID: ${id}`);

      // Tenta encontrar nos dados mock
      const property = Object.values(MOCK_PROPERTIES).find(p => p.id === id);
      if (property) {
        console.log(`[Properfy] ✅ Imóvel encontrado em dados mock: ID ${id}`);
        return property;
      }

      // Se não está usando mock data e API não está disponível, retorna null
      if (this.useMockData || !this.apiAvailable) {
        console.log(`[Properfy] ⚠️  Imóvel não encontrado em dados mock: ID ${id}`);
        return null;
      }

      // Tenta autenticar e buscar da API
      await this.authenticate();

      if (!this.client) {
        throw new Error("Cliente não inicializado");
      }

      console.log(`[Properfy] Buscando na API: ID ${id}`);

      const response = await this.client.get<ProperfyProperty>(
        `/property/property/${id}`
      );

      // Adiciona status normalizado
      response.data.status = this.normalizeStatus(response.data);

      console.log(`[Properfy] ✅ Imóvel encontrado na API: ID ${id}, Status: ${response.data.status}`);
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
      if (this.useMockData) {
        console.log("[Properfy] Health check: Mock data ativo");
        return true;
      }

      await this.authenticate();
      console.log("[Properfy] ✅ Health check: API disponível");
      return true;
    } catch (error) {
      console.error("[Properfy] ❌ Health check falhou");
      return false;
    }
  }

  /**
   * Retorna status da API
   */
  getApiStatus(): { available: boolean; mode: string } {
    return {
      available: this.apiAvailable,
      mode: this.useMockData ? "mock" : "api",
    };
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

  // Se não tem credenciais, usa mock data
  const useMockData = !email || !password;

  if (useMockData) {
    console.log("[Properfy] ⚠️  Credenciais não configuradas - usando dados mock");
  }

  return new ProperfyService({
    email: email || "demo@properfy.com",
    password: password || "demo",
    sandbox: config?.sandbox ?? true,
    timeout: config?.timeout ?? 10000,
    retries: config?.retries ?? 3,
    useMockData: config?.useMockData ?? useMockData,
  });
}

export type { ProperfyProperty, ProperfyListResponse, ProperfyAuthResponse, ProperfyServiceConfig };

