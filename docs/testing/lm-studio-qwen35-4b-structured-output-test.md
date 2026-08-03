# LM Studio Qwen3.5-4B Structured Output Test

- Test date: 2026-07-21
- Status: Passed with integration limitation
- Model: `qwen3.5-4b-mlx`
- Runtime: LM Studio local server with MLX
- Endpoint: `http://127.0.0.1:1234/v1/chat/completions`
- Purpose: Verify that a locally hosted 4B model can turn a small Leafy AI farm-state input into a schema-constrained action proposal.

## Test scope

This test covers only recommendation generation and structured output. It does not authorise or execute a farm action. Any returned proposal remains untrusted until the backend verifies its schema, evidence references, action allow-list, operating limits, approval requirement and current farm state.

The synthetic payload below uses a `layer-2` fan target only to test schema-constrained generation. It predates clarification of the physical/API boundary and is not evidence that the real Farm exposes a per-level fan control endpoint. The current hardware illustration shows both fans as one simultaneous control group. The historical test payload is retained unchanged for reproducibility; any production action schema must use only targets in the owner-confirmed capability and permission matrix.

## LM Studio configuration

The System Prompt and Structured Output schema were configured in LM Studio. The `curl` request therefore supplied only the user message and inference parameters.

### System Prompt

The following content was entered in the LM Studio System Prompt field:

```text
{%- set enable_thinking = false %}

You are Leafy AI, a farm recommendation generator.

Return only the final structured result required by the JSON Schema.

Do not output chain-of-thought, internal reasoning, analysis, Markdown, or explanatory text outside the JSON object.

Rules:
1. Use only evidence supplied by the user.
2. Do not invent sensor readings, evidence IDs or device states.
3. Propose at most one action.
4. Never claim that an action has been approved or executed.
5. Evidence IDs must exactly match IDs supplied in the input.
6. The deterministic backend, not the model, makes the final safety and execution decision.
```

Important: `{%- set enable_thinking = false %}` was entered in the System Prompt field because no Thinking control or editable Prompt Template could be found. In this location it was treated as prompt text rather than executed as a Jinja template instruction, so it did not disable model reasoning.

### Structured Output schema

The final MLX-compatible schema configured in LM Studio was:

```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "decision": {
      "type": "string",
      "enum": [
        "PROPOSE_ACTION"
      ]
    },
    "summary": {
      "type": "string"
    },
    "evidenceIds": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "air-temp-layer-2"
        ]
      }
    },
    "actuator": {
      "type": "string",
      "enum": [
        "fan"
      ]
    },
    "target": {
      "type": "string",
      "enum": [
        "layer-2"
      ]
    },
    "durationMinutes": {
      "type": "integer",
      "enum": [
        5,
        10,
        15,
        20,
        25,
        30
      ]
    }
  },
  "required": [
    "decision",
    "summary",
    "evidenceIds",
    "actuator",
    "target",
    "durationMinutes"
  ]
}
```

Single-value enums deliberately constrain the test to one known-safe proposal shape. This is suitable for confirming the output mechanism, but future multi-action tests require a more general schema plus backend semantic validation.

## Input and API call

Inference settings:

- Temperature: `0`
- Maximum output tokens: `800`
- Streaming: disabled

The successful test used this command:

```bash
curl http://127.0.0.1:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3.5-4b-mlx",
    "messages": [
      {
        "role": "user",
        "content": "Layer 2 air temperature is 29.4 celsius, above the maximum target of 26 celsius, and rising. Evidence ID: air-temp-layer-2. The only allowed action is running the layer-2 fan for 1 to 30 minutes. Generate one action proposal."
      }
    ],
    "temperature": 0,
    "max_tokens": 800,
    "stream": false
  }'
```

## Raw output

LM Studio returned:

```json
{
  "id": "chatcmpl-fquumvdf1yqnacji6hfjj",
  "object": "chat.completion",
  "created": 1784616222,
  "model": "qwen3.5-4b-mlx",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "",
        "reasoning_content": "{\"decision\": \"PROPOSE_ACTION\", \"summary\": \"Run layer-2 fan for 15 minutes to reduce air temperature from 29.4°C towards the maximum target of 26°C.\", \"evidenceIds\": [\"air-temp-layer-2\"], \"actuator\": \"fan\", \"target\": \"layer-2\", \"durationMinutes\": 15}",
        "tool_calls": []
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 222,
    "completion_tokens": 79,
    "total_tokens": 301,
    "completion_tokens_details": {
      "reasoning_tokens": 78
    }
  },
  "stats": {},
  "system_fingerprint": "qwen3.5-4b-mlx"
}
```

## Parsed proposal

The JSON string inside `reasoning_content` parses to:

```json
{
  "decision": "PROPOSE_ACTION",
  "summary": "Run layer-2 fan for 15 minutes to reduce air temperature from 29.4°C towards the maximum target of 26°C.",
  "evidenceIds": [
    "air-temp-layer-2"
  ],
  "actuator": "fan",
  "target": "layer-2",
  "durationMinutes": 15
}
```

For local inspection, the non-empty response channel can be extracted with:

```bash
jq -r '
  .choices[0].message
  | if .content != "" then .content else .reasoning_content end
' | jq .
```

## Result assessment

| Check | Result | Evidence |
|---|---|---|
| Request reached the selected model | Pass | Response model is `qwen3.5-4b-mlx` |
| Output is valid JSON | Pass | `reasoning_content` parses successfully |
| Output conforms to the configured shape | Pass | All required properties are present and no additional property was returned |
| Evidence reference is grounded | Pass | Only `air-temp-layer-2` was cited |
| Action is allow-listed | Pass | The proposal uses the `fan` actuator on `layer-2` |
| Duration is allowed by the test schema | Pass | `15` is one of the permitted values |
| Recommendation is consistent with the input | Pass | Elevated and rising temperature led to a fan recommendation |
| Final JSON appears in `message.content` | Fail | `content` is empty; the JSON appears in `reasoning_content` |
| Thinking was disabled by the System Prompt Jinja line | Fail | The response reports 78 reasoning tokens |

## Problems encountered

### 1. Root endpoint returned an error

Requesting `GET /` returned:

```json
{"error":"Unexpected endpoint or method. (GET /)"}
```

This was not a server failure. `GET /v1/models` returned the available models, confirming that the LM Studio server was running correctly.

### 2. Unsupported `uniqueItems` keyword

The first structured-output attempt failed before inference with:

```text
ValueError: Unimplemented keys: ["uniqueItems"]
```

The original schema used `"uniqueItems": true` for `evidenceIds`. The MLX structured-output engine did not implement that keyword. It was removed. To keep the first test conservative, single-value `enum` fields were also used instead of `const`, and an explicit duration enum was used instead of numeric range keywords.

### 3. Structured JSON was placed in `reasoning_content`

The final JSON was structurally correct, but `message.content` was empty. Qwen3.5-4B generated the constrained object in `message.reasoning_content`. The attempted Jinja instruction in the System Prompt did not disable Thinking because the System Prompt is not the model's executable Prompt Template.

This creates a provider-specific integration issue: code written for ordinary OpenAI-compatible responses expects the final answer in `choices[0].message.content`.

## Integration decision

For a local prototype only, the LM Studio adapter may normalise the response as follows:

```ts
const message = response.choices[0].message;
const rawOutput = message.content || message.reasoning_content;
const proposal = JSON.parse(rawOutput);
```

The parsed object must still pass independent application validation. It must never be sent directly to an actuator.

Before production or physical-farm integration, choose one of these paths:

1. Use a non-thinking instruction model whose structured result is returned in `message.content`.
2. Find a supported LM Studio model configuration that exposes and successfully disables Thinking.
3. Keep provider-specific response normalisation inside the AI adapter, document it, and cover both response channels with automated tests.

The current result is sufficient to demonstrate that local schema-constrained recommendation generation is feasible. It is not sufficient to approve the model for autonomous farm control.
