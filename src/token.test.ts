import { FederatedToken, AccessToken } from "./token"
import { test, assert, describe } from "vitest";

describe("FederatedToken", () => {

  test("setAccessToken", () => {
		const federatedToken = new FederatedToken();
    const token: AccessToken = {
      token: "exampleToken",
      exp: 1234567890,
    };
    federatedToken.setAccessToken("exampleName", token);
    assert.equal(federatedToken.tokens.exampleName, token);
    assert.isTrue(federatedToken.isModified());
  });

  test("setRefreshToken", () => {
		const federatedToken = new FederatedToken();
    federatedToken.setRefreshToken("exampleName", "exampleToken");
    assert.equal(federatedToken.refreshTokens.exampleName, "exampleToken");
  });

  test("isModified", () => {
		const federatedToken = new FederatedToken();
    assert.isFalse(federatedToken.isModified());
    federatedToken.setAccessToken("exampleName", {
      token: "exampleToken",
      exp: 1234567890,
    });
    assert.isTrue(federatedToken.isModified());
  });

  test("loadAccessToken", () => {
    const at = Buffer.from(
      JSON.stringify({
        tokens: {
          exampleName: {
            token: "exampleToken",
            exp: 1234567890,
          },
        },
        value1: "exampleValue1",
        value2: "exampleValue2",
      })
    ).toString("base64");

		const federatedToken = new FederatedToken();
    federatedToken.loadAccessToken(at);

    assert.deepStrictEqual(
      federatedToken.tokens.exampleName,
      {
        token: "exampleToken",
        exp: 1234567890,
      },
      "Token object should be loaded correctly"
    );

    assert.deepStrictEqual(
      federatedToken.values,
      {
        value1: "exampleValue1",
        value2: "exampleValue2",
      },
      "Values should be loaded correctly"
    );

    assert.isFalse(
      federatedToken.isModified(),
      "isModified should be false when trackModified is false and token is modified"
    );
  });

  test("loadAccessToken with trackModified = true", () => {
    const at = Buffer.from(
      JSON.stringify({
        tokens: {
          exampleName: {
            token: "exampleToken",
            exp: 1234567890,
          },
        },
        value1: "exampleValue1",
        value2: "exampleValue2",
      })
    ).toString("base64");

		const federatedToken = new FederatedToken();
    federatedToken.loadAccessToken(at, true);

    assert.deepStrictEqual(
      federatedToken.tokens.exampleName,
      {
        token: "exampleToken",
        exp: 1234567890,
      },
      "Token object should be loaded correctly"
    );

    assert.deepStrictEqual(
      federatedToken.values,
      {
        value1: "exampleValue1",
        value2: "exampleValue2",
      },
      "Values should be loaded correctly"
    );

    assert.isTrue(
      federatedToken.isModified(),
      "isModified should be true when trackModified is true and token is modified"
    );
  });

  test("dumpAccessToken", () => {
		const federatedToken = new FederatedToken();
    federatedToken.setAccessToken("exampleName", {
      token: "exampleToken",
      exp: 1234567890,
    });
    federatedToken.values = {
      value1: "exampleValue1",
      value2: "exampleValue2",
    };

    const expectedDump = Buffer.from(
      JSON.stringify({
        tokens: {
          exampleName: {
            token: "exampleToken",
            exp: 1234567890,
          },
        },
        value1: "exampleValue1",
        value2: "exampleValue2",
      })
    ).toString("base64");

    assert.equal(federatedToken.dumpAccessToken(), expectedDump);
  });

  test("loadRefreshToken", () => {
    const value = Buffer.from(
      JSON.stringify({
        exampleName: "exampleToken",
      })
    ).toString("base64");

		const federatedToken = new FederatedToken();
    federatedToken.loadRefreshToken(value);

    assert.deepStrictEqual(
      federatedToken.refreshTokens,
      {
        exampleName: "exampleToken",
      },
      "Refresh tokens should be loaded correctly"
    );
  });

  test("dumpRefreshToken", () => {
		const federatedToken = new FederatedToken();
    federatedToken.refreshTokens = {
      exampleName: "exampleToken",
    };

    const expectedDump = Buffer.from(
      JSON.stringify({
        exampleName: "exampleToken",
      })
    ).toString("base64");

    assert.equal(federatedToken.dumpRefreshToken(), expectedDump);
  });
});
