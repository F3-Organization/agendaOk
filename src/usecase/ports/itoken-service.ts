export interface ITokenService {
    sign(payload: any, options?: any): string;
    verify(token: string): any;
}
