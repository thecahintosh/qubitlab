import json
import os
import sys

from groq import Groq


MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-120b"
)


# =========================================================
# SYSTEM PROMPTS
# =========================================================

TUTOR_SYSTEM_PROMPT = """
You are QubitLab Tutor, an adaptive quantum-computing teacher.

Rules:

1. Be technically precise.
2. Adapt explanations to the supplied learner profile.
3. Prefer intuition first, then mathematics.
4. Use Markdown and LaTeX when useful.
5. Use \\(...\\) for inline math.
6. Use \\[...\\] for display math.
7. Trust QubitLab's supplied circuit and statevector.
8. Never invent simulator results.
9. Distinguish amplitudes from probabilities.
10. Do not assume a CNOT automatically creates entanglement.
11. Relate explanations to the current circuit whenever useful.
12. Explain prerequisites when the student appears confused.
"""


CIRCUIT_GENERATOR_PROMPT = """
You generate circuits for QubitLab.

Return ONLY a valid JSON object.

Required structure:

{
  "qubits": 1,
  "gates": []
}

Allowed gates:

H
X
Y
Z
S
T
RX
RY
RZ
CX
SWAP

Examples:

Single-qubit gate:

{
  "type": "H",
  "target": 0
}

Rotation gate:

{
  "type": "RX",
  "target": 0,
  "angle": 1.5708
}

CNOT:

{
  "type": "CX",
  "control": 0,
  "target": 1
}

SWAP:

{
  "type": "SWAP",
  "first": 0,
  "second": 1
}

Rules:

- qubits must be between 1 and 6.
- qubit indices start at 0.
- all indices must be valid.
- CNOT control and target must differ.
- SWAP qubits must differ.
- never include measurement operations.
- never invent unsupported gates.
- if the exact requested operation is unsupported, construct an equivalent
  circuit from supported gates when possible.
- prefer the smallest sensible circuit.
"""


# =========================================================
# STRICT STRUCTURED OUTPUT SCHEMAS
# =========================================================

ASSESSMENT_QUESTION_SCHEMA = {
    "type": "object",

    "properties": {
        "question": {
            "type": "string"
        },

        "topic": {
            "type": "string",
            "enum": [
                "qubits",
                "superposition",
                "gates",
                "measurement",
                "entanglement"
            ]
        },

        "expectedConcepts": {
            "type": "array",

            "items": {
                "type": "string"
            }
        }
    },

    "required": [
        "question",
        "topic",
        "expectedConcepts"
    ],

    "additionalProperties": False
}


ASSESSMENT_GRADE_SCHEMA = {
    "type": "object",

    "properties": {
        "score": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100
        },

        "passed": {
            "type": "boolean"
        },

        "topic": {
            "type": "string",
            "enum": [
                "qubits",
                "superposition",
                "gates",
                "measurement",
                "entanglement"
            ]
        },

        "feedback": {
            "type": "string"
        },

        "correctPoints": {
            "type": "array",

            "items": {
                "type": "string"
            }
        },

        "missingPoints": {
            "type": "array",

            "items": {
                "type": "string"
            }
        }
    },

    "required": [
        "score",
        "passed",
        "topic",
        "feedback",
        "correctPoints",
        "missingPoints"
    ],

    "additionalProperties": False
}


RECOMMENDATION_SCHEMA = {
    "type": "object",

    "properties": {
        "lessonId": {
            "type": "string"
        },

        "reason": {
            "type": "string"
        },

        "focusTopics": {
            "type": "array",

            "items": {
                "type": "string"
            }
        }
    },

    "required": [
        "lessonId",
        "reason",
        "focusTopics"
    ],

    "additionalProperties": False
}


# =========================================================
# GROQ CLIENT
# =========================================================

def get_client():
    api_key = os.getenv(
        "GROQ_API_KEY"
    )

    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY is missing."
        )

    return Groq(
        api_key=api_key,
        timeout=15.0,
        max_retries=1
    )


# =========================================================
# HELPERS
# =========================================================

def pretty(value):
    return json.dumps(
        value,
        indent=2,
        ensure_ascii=False
    )


def normal_completion(
    messages,
    temperature=0.3
):
    client = get_client()

    response = (
        client.chat.completions.create(
            model=MODEL,

            messages=messages,

            temperature=temperature,

            reasoning_format="hidden"
        )
    )

    content = (
        response
        .choices[0]
        .message
        .content
    )

    if not content:
        raise RuntimeError(
            "AI provider returned an empty response."
        )

    return content.strip()


def json_object_completion(
    messages,
    temperature=0.1
):
    """
    Flexible JSON mode.

    We keep circuit generation here because
    different gate types have different fields.
    """

    client = get_client()

    response = (
        client.chat.completions.create(
            model=MODEL,

            messages=messages,

            temperature=temperature,

            reasoning_format="hidden",

            response_format={
                "type": "json_object"
            }
        )
    )

    content = (
        response
        .choices[0]
        .message
        .content
    )

    if not content:
        raise RuntimeError(
            "AI provider returned an empty JSON response."
        )

    try:
        return json.loads(
            content
        )

    except json.JSONDecodeError as exc:
        raise ValueError(
            "AI provider returned malformed JSON."
        ) from exc


def json_completion(
    messages,
    schema_name,
    schema,
    temperature=0.1
):
    """
    Strict JSON Schema mode.

    Used for outputs whose structure is fixed:
    assessments and recommendations.
    """

    client = get_client()

    response = (
        client.chat.completions.create(
            model=MODEL,

            messages=messages,

            temperature=temperature,

            reasoning_format="hidden",

            response_format={
                "type": "json_schema",

                "json_schema": {
                    "name":
                        schema_name,

                    "strict":
                        True,

                    "schema":
                        schema
                }
            }
        )
    )

    content = (
        response
        .choices[0]
        .message
        .content
    )

    if not content:
        raise RuntimeError(
            "AI provider returned an empty structured response."
        )

    try:
        return json.loads(
            content
        )

    except json.JSONDecodeError as exc:
        raise ValueError(
            "AI provider returned malformed structured JSON."
        ) from exc


def build_context(data):
    return f"""
CURRENT CIRCUIT:
{pretty(data.get("circuit", {}))}

SIMULATOR STATEVECTOR:
{pretty(data.get("statevector", []))}

LEARNER PROFILE:
{pretty(data.get("learningProfile", data.get("mastery", {})))}

CURRENT EXECUTION STEP:
{data.get("currentStep")}

ACTIVE LESSON:
{pretty(data.get("activeLesson"))}
""".strip()


def clean_history(history):
    if not isinstance(
        history,
        list
    ):
        return []

    cleaned = []

    for message in history[-12:]:
        if not isinstance(
            message,
            dict
        ):
            continue

        role = message.get(
            "role"
        )

        content = message.get(
            "content"
        )

        if (
            role not in
            [
                "user",
                "assistant"
            ]
        ):
            continue

        if not isinstance(
            content,
            str
        ):
            continue

        cleaned.append({
            "role":
                role,

            "content":
                content[:5000]
        })

    return cleaned


# =========================================================
# TUTOR
# =========================================================

def handle_tutor(data):
    question = (
        data.get("question")
        or ""
    ).strip()

    if not question:
        raise ValueError(
            "A tutor question is required."
        )

    if len(question) > 5000:
        raise ValueError(
            "Tutor question is too long."
        )

    messages = [
        {
            "role":
                "system",

            "content":
                TUTOR_SYSTEM_PROMPT
        },

        {
            "role":
                "system",

            "content":
                build_context(
                    data
                )
        }
    ]

    messages.extend(
        clean_history(
            data.get(
                "history",
                []
            )
        )
    )

    messages.append({
        "role":
            "user",

        "content":
            question
    })

    answer = normal_completion(
        messages,
        temperature=0.35
    )

    return {
        "answer":
            answer
    }


# =========================================================
# EXPLAIN
# =========================================================

def handle_explain(data):
    prompt = f"""
{build_context(data)}

Explain the current quantum circuit.

Structure the response as:

## Goal

## Gate-by-gate evolution

## Final state

## Measurement meaning

## Key concept

Use equations where they improve understanding.

Adapt the explanation to the learner profile.
"""

    answer = normal_completion(
        [
            {
                "role":
                    "system",

                "content":
                    TUTOR_SYSTEM_PROMPT
            },

            {
                "role":
                    "user",

                "content":
                    prompt
            }
        ],

        temperature=0.25
    )

    return {
        "answer":
            answer
    }


# =========================================================
# DEBUG
# =========================================================

def handle_debug(data):
    goal = (
        data.get("goal")
        or
        "Determine whether this circuit is logically correct."
    )

    if len(goal) > 5000:
        raise ValueError(
            "Debugging goal is too long."
        )

    prompt = f"""
{build_context(data)}

LEARNER GOAL:

{goal}

Debug the circuit.

Explain:

1. What the circuit currently does.
2. Whether that matches the learner's goal.
3. The first meaningful mistake, if any.
4. The smallest useful correction.
5. Why the correction works.

Do not invent an error if the circuit is already correct.
"""

    answer = normal_completion(
        [
            {
                "role":
                    "system",

                "content":
                    TUTOR_SYSTEM_PROMPT
            },

            {
                "role":
                    "user",

                "content":
                    prompt
            }
        ],

        temperature=0.2
    )

    return {
        "answer":
            answer
    }


# =========================================================
# CIRCUIT GENERATION
# =========================================================

def handle_generate(data):
    prompt = (
        data.get("prompt")
        or ""
    ).strip()

    if not prompt:
        raise ValueError(
            "A circuit-generation prompt is required."
        )

    if len(prompt) > 3000:
        raise ValueError(
            "Circuit-generation prompt is too long."
        )

    circuit = json_object_completion(
        [
            {
                "role":
                    "system",

                "content":
                    CIRCUIT_GENERATOR_PROMPT
            },

            {
                "role":
                    "user",

                "content":
                    f"""
Create this circuit:

{prompt}

Respond only with the valid QubitLab JSON object.
"""
            }
        ],

        temperature=0.1
    )

    return {
        "circuit":
            circuit
    }


# =========================================================
# ASSESSMENT
# =========================================================

def handle_assess(data):
    stage = data.get(
        "stage",
        "question"
    )

    context = build_context(
        data
    )

    if stage == "question":
        result = json_completion(
            [
                {
                    "role":
                        "system",

                    "content":
                        TUTOR_SYSTEM_PROMPT
                },

                {
                    "role":
                        "user",

                    "content":
                        f"""
{context}

Create ONE short conceptual knowledge-check question.

Requirements:

- relate it to the active lesson or current circuit,
- test understanding rather than memorization,
- make it answerable in roughly 1-4 sentences,
- test only ONE topic.

Return the structured assessment question.
"""
                }
            ],

            schema_name=
                "assessment_question",

            schema=
                ASSESSMENT_QUESTION_SCHEMA,

            temperature=
                0.1
        )

        return {
            "assessment":
                result
        }


    if stage == "grade":
        question = (
            data.get("question")
            or ""
        )

        answer = (
            data.get("answer")
            or ""
        ).strip()

        topic = (
            data.get("topic")
            or "gates"
        )

        expected_concepts = (
            data.get(
                "expectedConcepts",
                []
            )
        )

        if not answer:
            raise ValueError(
                "Assessment answer is required."
            )

        if len(answer) > 5000:
            raise ValueError(
                "Assessment answer is too long."
            )

        result = json_completion(
            [
                {
                    "role":
                        "system",

                    "content":
                        "You are a fair quantum-computing examiner."
                },

                {
                    "role":
                        "user",

                    "content":
                        f"""
QUESTION:

{question}

TOPIC:

{topic}

EXPECTED CONCEPTS:

{pretty(expected_concepts)}

STUDENT ANSWER:

{answer}

Grade conceptual understanding rather than writing style.

A score of 70 or higher should normally pass.

Return the structured grade.
"""
                }
            ],

            schema_name=
                "assessment_grade",

            schema=
                ASSESSMENT_GRADE_SCHEMA,

            temperature=
                0.1
        )

        return {
            "assessment":
                result
        }


    raise ValueError(
        "Invalid assessment stage."
    )


# =========================================================
# RECOMMENDATION
# =========================================================

def handle_recommend(data):
    result = json_completion(
        [
            {
                "role":
                    "system",

                "content":
                    TUTOR_SYSTEM_PROMPT
            },

            {
                "role":
                    "user",

                "content":
                    f"""
Choose the learner's NEXT quantum lesson.

LEARNER PROFILE:

{pretty(data.get("learningProfile", {}))}

ACTIVE LESSON:

{pretty(data.get("activeLesson"))}

AVAILABLE LESSONS:

{pretty(data.get("lessonCatalog", []))}

Choose exactly ONE lesson from AVAILABLE LESSONS.

Prioritize:

1. prerequisite gaps,
2. low mastery,
3. logical learning progression.

The lessonId MUST exactly match one of the provided lesson IDs.

Return the structured recommendation.
"""
            }
        ],

        schema_name=
            "lesson_recommendation",

        schema=
            RECOMMENDATION_SCHEMA,

        temperature=
            0.1
    )

    return {
        "recommendation":
            result
    }


# =========================================================
# REQUEST ROUTER
# =========================================================

def handle_request(data):
    mode = data.get(
        "mode"
    )

    if mode == "tutor":
        return handle_tutor(
            data
        )

    if mode == "explain":
        return handle_explain(
            data
        )

    if mode == "debug":
        return handle_debug(
            data
        )

    if mode == "generate":
        return handle_generate(
            data
        )

    if mode == "assess":
        return handle_assess(
            data
        )

    if mode == "recommend":
        return handle_recommend(
            data
        )

    if mode == "health":
        return {
            "status":
                "ok",

            "service":
                "QubitLab AI",

            "model":
                MODEL,

            "groqKeyConfigured":
                bool(
                    os.getenv(
                        "GROQ_API_KEY"
                    )
                )
        }

    raise ValueError(
        "Unsupported AI mode."
    )


# =========================================================
# ERROR CLASSIFICATION
# =========================================================

def classify_exception(exc):
    status = getattr(
        exc,
        "status_code",
        None
    )

    name = (
        exc.__class__
        .__name__
        .lower()
    )

    text = str(
        exc
    ).lower()


    if (
        status == 429
        or "ratelimit" in name
    ):
        return (
            "RATE_LIMIT",

            "The AI service is temporarily rate limited. Try again shortly."
        )


    if (
        "timeout" in name
        or "timed out" in text
    ):
        return (
            "TIMEOUT",

            "The AI service took too long to respond."
        )


    if (
        status in
        [
            400,
            413,
            422
        ]
    ):
        return (
            "INVALID_REQUEST",

            "The AI provider could not process this request."
        )


    if (
        status in
        [
            401,
            403
        ]
    ):
        return (
            "PROVIDER_AUTH",

            "The AI service configuration could not be authenticated."
        )


    if (
        status
        and
        status >= 500
    ):
        return (
            "PROVIDER_ERROR",

            "The AI provider is temporarily unavailable."
        )


    if (
        "connection" in name
        or "connection" in text
    ):
        return (
            "PROVIDER_ERROR",

            "Unable to reach the AI provider."
        )


    if isinstance(
        exc,
        ValueError
    ):
        return (
            "INVALID_REQUEST",

            str(exc)
        )


    return (
        "INTERNAL_ERROR",

        "The AI request could not be completed."
    )


# =========================================================
# MAIN
# =========================================================

def main():
    try:
        raw_input = (
            sys.stdin.read()
        )

        if not raw_input:
            raise ValueError(
                "No request payload received."
            )


        if len(raw_input) > 120_000:
            raise ValueError(
                "AI request payload is too large."
            )


        data = json.loads(
            raw_input
        )


        result = handle_request(
            data
        )


        print(
            json.dumps(
                {
                    "ok":
                        True,

                    **result
                },

                ensure_ascii=False
            )
        )


    except Exception as exc:
        (
            error_code,
            public_message
        ) = classify_exception(
            exc
        )


        print(
            json.dumps(
                {
                    "ok":
                        False,

                    "errorCode":
                        error_code,

                    "error":
                        public_message
                },

                ensure_ascii=False
            )
        )


        print(
            f"[QubitLab AI] {error_code}: {exc}",
            file=sys.stderr
        )


        sys.exit(1)


if __name__ == "__main__":
    main()