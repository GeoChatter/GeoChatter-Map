export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6_371_000;
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

export function scoreDistance(distance: number): number {
	if (distance <= 150) return 5000;
	const score = 5000 * Math.exp(-(distance - 150) / 2_000_000);
	return Math.max(0, Math.round(score));
}
