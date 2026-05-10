import { BrasilNFeAdapter, NfseTransmitirResponse } from "../../infra/adapters/brasil-nfe.adapter";
import { env } from "../../infra/config/configs";

export interface EmitirNfseParams {
    referenceId: string;
    tomadorCpfCnpj: string;
    tomadorNome: string;
    tomadorEmail: string;
    tomadorEndereco?: string | undefined;
    valorServicos: number;
    planName: string;
}

export interface NfseResult {
    emitted: boolean;
    codLote?: string | undefined;
    numeroNfse?: string | undefined;
    statusLote?: number | undefined;
}

export class FiscalService {
    constructor(private readonly brasilNfeAdapter: BrasilNFeAdapter) {}

    /**
     * Emits an NFS-e for a subscription payment.
     * Uses EnviarEmail: true so BrasilNFe auto-sends the invoice to the customer.
     */
    async emitirNfseAssinatura(params: EmitirNfseParams): Promise<NfseResult> {
        const today = new Date().toISOString().substring(0, 10);
        const tipoAmbiente: 1 | 2 = env.isProduction() ? 1 : 2;

        const response = await this.brasilNfeAdapter.emitirNfse({
            TipoAmbiente: tipoAmbiente,
            nFSInfo: [{
                IdentificadorInterno: params.referenceId,
                EnviarEmail: true,
                DataCompetencia: today,
                DataEmissao: today,
                Tomador: {
                    CpfCnpj: params.tomadorCpfCnpj.replace(/\D/g, ''),
                    NmTomador: params.tomadorNome,
                    Endereco: {
                        Logradouro: params.tomadorEndereco || 'Não informado',
                        Numero: 'S/N',
                        Bairro: 'Não informado',
                        Cep: '00000000',
                        CodMunicipio: env.brasilNfe.codigoMunicipio,
                        Uf: 'SP',
                    },
                    Contato: {
                        Email: params.tomadorEmail,
                    },
                },
                Servico: {
                    Descricao: `Assinatura Mensal ${env.company.name} - Plano ${params.planName}`,
                    ItemListaServico: env.fiscal.itemListaServico,
                    CodigoCnae: env.fiscal.codigoCnae,
                    NaturezaOperacao: env.fiscal.naturezaOperacao,
                    IssRetido: false,
                    ExigibilidadeISS: 1,
                    CodMunicipioIncidencia: env.brasilNfe.codigoMunicipio,
                    Valores: {
                        ValorServico: params.valorServicos,
                        Aliquota: env.fiscal.aliquotaIss,
                    },
                },
            }],
        });

        const nota = response.Notas?.[0];
        const emitted = response.StatusLote === 1 && nota?.Status === 1;

        console.log(
            `[Fiscal] NFS-e ref=${params.referenceId} — ` +
            `StatusLote: ${response.StatusLote}, ` +
            `CodLote: ${response.CodLote || 'N/A'}, ` +
            `NumeroNFSe: ${nota?.NumeroNFSe || 'pending'}, ` +
            `Ambiente: ${tipoAmbiente === 1 ? 'Produção' : 'Homologação'}`
        );

        return {
            emitted,
            codLote: response.CodLote,
            numeroNfse: nota?.NumeroNFSe,
            statusLote: response.StatusLote,
        };
    }

    /**
     * Queries the status of a previously submitted NFS-e lot.
     * Useful for async municipalities that don't return the NFS-e immediately.
     */
    async consultarStatusNfse(codLote: string): Promise<NfseTransmitirResponse> {
        return this.brasilNfeAdapter.consultarNfse(codLote);
    }
}
