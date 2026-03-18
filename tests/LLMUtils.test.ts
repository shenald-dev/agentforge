import { LLMUtils } from "../src/utils/LLMUtils";

describe("LLMUtils JSON Extraction", () => {
    it("should parse standard JSON", () => {
        const input = '{"key": "value"}';
        const result = LLMUtils.extractJson<{key: string}>(input);
        expect(result).toEqual({ key: "value" });
    });

    it("should parse JSON wrapped in markdown blocks", () => {
        const input = `Here is your JSON response:
\`\`\`json
{
  "name": "agentforge"
}
\`\`\`
Have a great day!`;
        const result = LLMUtils.extractJson<{name: string}>(input);
        expect(result).toEqual({ name: "agentforge" });
    });

    it("should parse JSON with trailing commas", () => {
        const input = `\`\`\`json
{
  "skills": ["typescript", "nodejs",],
  "name": "developer",
}
\`\`\``;
        const result = LLMUtils.extractJson(input);
        expect(result).toEqual({
            skills: ["typescript", "nodejs"],
            name: "developer"
        });
    });

    it("should fallback to raw brace matching for messy inputs", () => {
        const input = `This is not a markdown block but { "foo": "bar" } is inside it.`;
        const result = LLMUtils.extractJson<{foo: string}>(input);
        expect(result).toEqual({ foo: "bar" });
    });

    it("should return null for completely invalid inputs", () => {
        const input = `Just some regular text without any JSON content.`;
        const result = LLMUtils.extractJson(input);
        expect(result).toBeNull();
    });
});
