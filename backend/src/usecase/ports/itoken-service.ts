export interface ITokenService {
    sign(payload: any, options?: any): string;
    signWithCompany(payload: { id: string; companyId: string }): string;
    verify(token: string): any;
}
