export interface SessionResponseDto {
  id?: number;
  login?: string;
  roles?: string[];
  permisos?: any[];
  token?: string;
  accessToken?: string;
  access_token?: string;
}
