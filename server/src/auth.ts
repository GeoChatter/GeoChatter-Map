import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { Socket } from 'socket.io';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export interface JwtPayload {
	sub: string;
	name: string;
	pic?: string;
}

export function signToken(payload: JwtPayload): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
	return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function devTokenRoute(req: Request, res: Response) {
	const name = String(req.query.name || 'Player');
	const sub = String(req.query.sub || name);
	const pic = req.query.pic ? String(req.query.pic) : undefined;
	const token = signToken({ sub, name, pic });
	res.json({ token, sub, name, pic });
}

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
	try {
		const token = socket.handshake.auth?.token || socket.handshake.query?.token;
		if (!token || typeof token !== 'string') {
			return next(new Error('Missing token'));
		}
		const payload = verifyToken(token);
		socket.data.user = payload;
		next();
	} catch (err) {
		next(new Error('Authentication error'));
	}
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
	const header = req.headers.authorization || '';
	const token = header.startsWith('Bearer ') ? header.slice(7) : '';
	if (!token) {
		res.status(401).json({ error: 'Missing token' });
		return;
	}
	try {
		req.user = verifyToken(token);
		next();
	} catch {
		res.status(401).json({ error: 'Invalid token' });
	}
}

declare global {
	namespace Express {
		interface Request {
			user?: JwtPayload;
		}
	}
}
