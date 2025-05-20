export function maskToken(token: string, visibleChars = 3, maxLenght = 10): string {
	if (!token) return "(missing!)";
	if (token.length <= visibleChars) return "*".repeat(maxLenght - token.length);
	return token.slice(0, visibleChars) + "*".repeat(maxLenght - visibleChars);
}
