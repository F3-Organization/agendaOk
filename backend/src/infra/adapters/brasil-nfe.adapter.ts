import { env } from "../config/configs";

// ── Request types ──────────────────────────────────────────────────

export interface NfseTomador {
  CpfCnpj: string;
  NmTomador: string;
  Endereco?: {
    Cep?: string | undefined;
    Logradouro?: string | undefined;
    Complemento?: string | undefined;
    Numero?: string | undefined;
    Bairro?: string | undefined;
    CodMunicipio?: string | undefined;
    Municipio?: string | undefined;
    Uf?: string | undefined;
    CodPais?: number | undefined;
    Pais?: string | undefined;
  } | undefined;
  Contato?: {
    Telefone?: string | undefined;
    Email?: string | undefined;
  } | undefined;
}

export interface NfseServico {
  Descricao: string;
  ItemListaServico: string;
  CodTributacaoMunicipio?: string | undefined;
  CodigoCnae?: string | undefined;
  NaturezaOperacao?: number | undefined;
  IssRetido?: boolean | undefined;
  ExigibilidadeISS?: number | undefined;
  CodMunicipioIncidencia?: string | undefined;
  CodMunicipioPrestacao?: string | undefined;
  Valores: {
    ValorServico: number;
    Aliquota: number;
    DescontoIncondicionado?: number | undefined;
  };
}

export interface NfseInfo {
  SerieRps?: string | undefined;
  NumeroRps?: string | undefined;
  IdentificadorInterno?: string | undefined;
  EnviarEmail?: boolean | undefined;
  DataCompetencia?: string | undefined;
  DataEmissao?: string | undefined;
  Tomador: NfseTomador;
  Servico: NfseServico;
}

export interface NfseTransmitirRequest {
  TipoAmbiente: 1 | 2;
  Lote?: number | undefined;
  nFSInfo: NfseInfo[];
}

// ── Response types ─────────────────────────────────────────────────

export interface NfseNotaResponse {
  Cancelada?: boolean | undefined;
  NumeroRPS?: number | undefined;
  DtEmissao?: string | undefined;
  CpfCnpjPrestador?: string | undefined;
  CpfCnpjTomador?: string | undefined;
  NumeroNFSe?: string | undefined;
  CodVerificacao?: string | undefined;
  IdentificadorInterno?: string | undefined;
  Status?: number | undefined;
  Erro?: string | undefined;
  Base64Xml?: string | undefined;
  Base64Doc?: string | undefined;
  Valores?: {
    BaseCalculo?: number | undefined;
    ValorLiquido?: number | undefined;
    ValorISS?: number | undefined;
    ValorISSRetido?: number | undefined;
    Aliquota?: number | undefined;
  } | undefined;
}

export interface NfseTransmitirResponse {
  DataRecebimento?: string | undefined;
  Lote?: number | undefined;
  CodLote?: string | undefined;
  Protocolo?: string | undefined;
  CodTipoAmbiente?: number | undefined;
  MunicipioEnvio?: string | undefined;
  StatusLote?: number | undefined; // 1=processado, 2=aguardando, 3=erro, 4=erro análise
  Error?: string | undefined;
  Notas?: NfseNotaResponse[] | undefined;
}

export interface NfseConsultaResponse extends NfseTransmitirResponse {}

// ── Adapter ────────────────────────────────────────────────────────

export class BrasilNFeAdapter {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor() {
    this.token = env.brasilNfe.token!;
    this.baseUrl = env.brasilNfe.baseUrl!;
  }

  /**
   * Transmits an NFS-e to the municipal provider.
   * Endpoint: POST /services/fiscal/EnviarNotaFiscalServico
   */
  async emitirNfse(request: NfseTransmitirRequest): Promise<NfseTransmitirResponse> {
    const url = `${this.baseUrl}/services/fiscal/EnviarNotaFiscalServico`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`[BrasilNFe] HTTP ${response.status} emitting NFS-e:`, result);
      throw new Error(`BrasilNFe API Error: ${JSON.stringify(result)}`);
    }

    // StatusLote 3 or 4 = error
    if (result.StatusLote === 3 || result.StatusLote === 4) {
      console.error(`[BrasilNFe] Lot error (StatusLote=${result.StatusLote}):`, result.Error);
      throw new Error(`BrasilNFe Lot Error: ${result.Error || 'Unknown error'}`);
    }

    return result as NfseTransmitirResponse;
  }

  /**
   * Queries the status of a previously submitted NFS-e lot.
   * Endpoint: POST /services/fiscal/BuscarNotaFiscalServico
   */
  async consultarNfse(codLote: string, rpsNumbers?: string[]): Promise<NfseConsultaResponse> {
    const url = `${this.baseUrl}/services/fiscal/BuscarNotaFiscalServico`;

    const body: any = { codLote };
    if (rpsNumbers?.length) {
      body.Rps = rpsNumbers;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`[BrasilNFe] HTTP ${response.status} querying NFS-e:`, result);
      throw new Error(`BrasilNFe Query Error: ${JSON.stringify(result)}`);
    }

    return result as NfseConsultaResponse;
  }

  /**
   * Cancels a previously emitted NFS-e.
   * Endpoint: POST /services/fiscal/CancelarNotaFiscal
   */
  async cancelarNfse(numeroNfse: string, motivo: 1 | 2 | 3 | 9 = 1): Promise<any> {
    const url = `${this.baseUrl}/services/fiscal/CancelarNotaFiscal`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        TipoAmbiente: env.isProduction() ? 1 : 2,
        TipoDocumento: 1, // Always 1 for NFS-e
        NumeroNFSe: numeroNfse,
        CodCancelamentoNFSe: motivo,
      }),
    });

    return await response.json();
  }
}
