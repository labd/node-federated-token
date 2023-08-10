const setup = async function () {
	process.env.ENVIRONMENT = "test";

	process.env.INTERNAL_API_URL = "https://localhost";

	// Commercetools configuration
	process.env.CTP_PROJECT_KEY = "nl-unittest";
	process.env.CTP_CLIENT_ID = "foo";
	process.env.CTP_CLIENT_SECRET = "foo";
	process.env.CTP_SCOPES = "foo";
	process.env.CTP_API_URL = "https://localhost";
	process.env.CTP_AUTH_URL = "https://localhost";
};

export default setup;
