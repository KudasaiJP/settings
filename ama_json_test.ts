import { assert, fail } from "https://deno.land/std@0.178.0/testing/asserts.ts";

function assertString(
  expr: unknown,
): asserts expr is string {
  assert(
    typeof expr === "string",
    `文字列ではありません: ${expr} は ${typeof expr} です`,
  );
}

function assertStartsWith(
  expr: unknown,
  ...strings: string[]
): asserts expr {
  assertString(expr);
  assert(
    strings.some((str) => expr.startsWith(str)),
    `${strings.join(" または ")} で始まっていません`,
  );
}

function assertDateString(expr: unknown): asserts expr {
  assertString(expr);
  const REGEXP = /20\d{2}-\d{2}-\d{2}(T\d{2}:\d{2}\+09:00)?/;
  assert(REGEXP.test(expr), "日付のフォーマットが正しくありません");
  const time = new Date(expr).getTime();
  assert(!Number.isNaN(time), "存在しない日付です");
}

// deno-lint-ignore no-explicit-any
let json: any[];

Deno.test("JSONの形式が正しいことを確認", async () => {
  try {
    const text = await Deno.readTextFile("./ama.json");
    json = JSON.parse(text);
    assert(Array.isArray(json));
  } catch {
    fail("JSONの形式が正しくありません");
  }
});

Deno.test("各項目の確認", async (t) => {
  for (let i = 0; i < json.length; i++) {
    const ama = json[i];
    assert(ama.title != null, `${i + 1} 番目の項目にタイトルがありません`);

    await t.step(`【${ama.title}】`, async (t) => {
      await t.step("タイトルを確認", () => {
        assertString(ama.title);
      });

      if (ama.date != null) {
        await t.step("日付を確認", () => {
          assertDateString(ama.date);
        });
      }

      if (ama.note != null) {
        await t.step("注釈を確認", () => {
          assertString(ama.note);
        });
      }

      if (ama.website != null) {
        await t.step("Websiteを確認", () => {
          assertStartsWith(ama.website, "http://", "https://");
        });
      }

      if (ama.twitter != null) {
        await t.step("Twitterを確認", () => {
          assertStartsWith(ama.twitter, "https://twitter.com");
        });
      }

      if (ama.discord != null) {
        await t.step("Discordを確認", () => {
          assertStartsWith(
            ama.discord,
            "https://discord.gg",
            "https://discord.com/invite",
          );
        });
      }

      if (ama.telegram != null) {
        await t.step("Telegramを確認", () => {
          assertStartsWith(ama.telegram, "https://t.me");
        });
      }

      await t.step("不要なキーの検出", () => {
        const acceptableKeys = [
          "title",
          "date",
          "note",
          "website",
          "twitter",
          "discord",
          "telegram",
        ];
        const unnecessaryKeys = Object.keys(ama).filter((key) =>
          !acceptableKeys.includes(key)
        );
        assert(
          unnecessaryKeys.length === 0,
          `不要なキーが含まれています: ${unnecessaryKeys.join(", ")}`,
        );
      });
    });
  }
});
