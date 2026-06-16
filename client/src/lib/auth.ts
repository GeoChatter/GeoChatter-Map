export interface JwtPayload {
	sub: string;
	name: string;
	pic?: string;
	iat: number;
	exp: number;
}

export function parseJwt(token: string): JwtPayload | null {
	try {
		return JSON.parse(atob(token.split('.')[1])) as JwtPayload;
	} catch {
		return null;
	}
}
