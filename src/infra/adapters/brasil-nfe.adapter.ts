import { env } from "../config/configs";

export interface NfseRequest {
  data_emissao?: string;
  prestador: {
    cnpj: string;
    inscricao_municipal: string;
    codigo_municipio: string;
  };
  tomador: {
    cnpj?: string;
    cpf?: string;
    inscricao_municipal?: string;
    nome_completo: string;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cep: string;
      codigo_municipio: string;
      uf: string;
    };
    email: string;
  };
  servico: {
    aliquota: number;
    discriminacao: string;
    iss_retido: boolean;
    item_lista_servico: string;
    codigo_tributacao_municipio?: string;
    valor_servicos: number;
  };
}

export class BrasilNFeAdapter {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor() {
    this.token = env.brasilNfe.token;
    this.baseUrl = env.brasilNfe.baseUrl;
  }

  async emitirNfse(reference: string, data: Partial<NfseRequest>): Promise<any> {
    const url = `${this.baseUrl}/nfse?ref=${reference}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`[BrasilNFe] Error emitting invoice:`, result);
      throw new Error(`BrasilNFe API Error: ${result.message || JSON.stringify(result)}`);
    }

    return result;
  }

  async consultarNfse(reference: string): Promise<any> {
    const url = `${this.baseUrl}/nfse/${reference}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    return await response.json();
  }
}
