export function maskToken(token: string, visibleChars = 3): string {
	if (!token) return "(missing!)";
	if (token.length <= visibleChars) return "*".repeat(token.length);
	return token.slice(0, visibleChars) + "*".repeat(token.length - visibleChars);
}
