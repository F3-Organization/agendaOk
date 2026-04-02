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

export class FocusNFeAdapter {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor() {
    this.token = env.focusNfe.token;
    this.baseUrl = env.focusNfe.baseUrl;
  }

  async emitirNfse(reference: string, data: Partial<NfseRequest>): Promise<any> {
    const url = `${this.baseUrl}/nfse?ref=${reference}`;
    const auth = Buffer.from(`${this.token}:`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`[FocusNFe] Error emitting invoice:`, result);
      throw new Error(`FocusNFe API Error: ${result.mensagem || JSON.stringify(result)}`);
    }

    return result;
  }

  async consultarNfse(reference: string): Promise<any> {
    const url = `${this.baseUrl}/nfse/${reference}`;
    const auth = Buffer.from(`${this.token}:`).toString('base64');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    return await response.json();
  }
}
