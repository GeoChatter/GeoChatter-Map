import type { AlertItem } from '../types.js';

let alerts = $state<AlertItem[]>([]);

export function getAlerts() {
	return alerts;
}

export function showAlert(message: string, type: AlertItem['type'] = 'info') {
	const id = Math.random().toString(36).slice(2);
	alerts = [...alerts, { id, message, type }];
	setTimeout(() => {
		alerts = alerts.filter((a) => a.id !== id);
	}, 4000);
}
