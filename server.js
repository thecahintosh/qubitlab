import express from "express";

import {
  spawn
} from "node:child_process";

import {
  randomUUID
} from "node:crypto";


const app =
  express();


const PORT =
  Number(
    process.env.PORT ||
    8000
  );


const AI_WORKER_TIMEOUT_MS =
  Number(
    process.env.AI_WORKER_TIMEOUT_MS ||
    20000
  );


const AI_RATE_LIMIT =
  Number(
    process.env.AI_RATE_LIMIT_PER_MINUTE ||
    12
  );


const AI_RATE_WINDOW_MS =
  60_000;


const rateBuckets =
  new Map();


app.use(
  express.json({
    limit: "128kb"
  })
);



/* ======================================================
   CONFIG
====================================================== */

app.get(
  "/api/config",
  (
    req,
    res
  ) => {
    res.json({
      supabaseUrl:
        process.env.SUPABASE_URL ||
        "",

      supabasePublishableKey:
        process.env.SUPABASE_PUBLISHABLE_KEY ||
        ""
    });
  }
);



/* ======================================================
   HEALTH
====================================================== */

app.get(
  "/api/health",
  (
    req,
    res
  ) => {
    res.json({
      status:
        "ok",

      service:
        "QubitLab",

      version:
        "0.7.0",

      ai: {
        configured:
          Boolean(
            process.env.GROQ_API_KEY
          ),

        model:
          process.env.GROQ_MODEL ||
          "openai/gpt-oss-120b",

        workerTimeoutMs:
          AI_WORKER_TIMEOUT_MS,

        userRateLimitPerMinute:
          AI_RATE_LIMIT
      }
    });
  }
);



/* ======================================================
   SUPABASE AUTH
====================================================== */

async function verifySupabaseUser(
  token
) {
  const supabaseUrl =
    process.env.SUPABASE_URL;


  const publishableKey =
    process.env
      .SUPABASE_PUBLISHABLE_KEY;


  if (
    !supabaseUrl ||
    !publishableKey
  ) {
    throw new Error(
      "Supabase configuration missing."
    );
  }


  const response =
    await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,

          apikey:
            publishableKey
        }
      }
    );


  if (
    !response.ok
  ) {
    return null;
  }


  return await response.json();
}



async function requireAuthenticatedUser(
  req,
  res,
  next
) {
  const requestId =
    req.requestId ||
    randomUUID();


  req.requestId =
    requestId;


  try {
    const authorization =
      req.headers.authorization ||
      "";


    if (
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return res
        .status(401)
        .json({
          ok:
            false,

          errorCode:
            "AUTH_ERROR",

          error:
            "Authentication required.",

          requestId
        });
    }


    const token =
      authorization.slice(
        7
      );


    const user =
      await verifySupabaseUser(
        token
      );


    if (
      !user?.id
    ) {
      return res
        .status(401)
        .json({
          ok:
            false,

          errorCode:
            "AUTH_ERROR",

          error:
            "Your session is invalid or expired.",

          requestId
        });
    }


    req.user =
      user;


    next();
  }

  catch (error) {
    console.error(
      `[${requestId}] Auth error:`,
      error
    );


    res
      .status(500)
      .json({
        ok:
          false,

        errorCode:
          "INTERNAL_ERROR",

        error:
          "Unable to verify authentication.",

        requestId
      });
  }
}



/* ======================================================
   PER-USER RATE LIMIT
====================================================== */

function checkAIRateLimit(
  req,
  res,
  next
) {
  const userId =
    req.user.id;


  const now =
    Date.now();


  const existing =
    rateBuckets.get(
      userId
    );


  let bucket;


  if (
    !existing ||
    now - existing.startedAt >=
      AI_RATE_WINDOW_MS
  ) {
    bucket = {
      startedAt:
        now,

      count:
        0
    };
  }

  else {
    bucket =
      existing;
  }


  if (
    bucket.count >=
    AI_RATE_LIMIT
  ) {
    const remainingMs =
      AI_RATE_WINDOW_MS -
      (
        now -
        bucket.startedAt
      );


    const retryAfter =
      Math.max(
        1,
        Math.ceil(
          remainingMs /
          1000
        )
      );


    res.set(
      "Retry-After",
      String(
        retryAfter
      )
    );


    return res
      .status(429)
      .json({
        ok:
          false,

        errorCode:
          "RATE_LIMIT",

        error:
          `Too many AI requests. Try again in about ${retryAfter} seconds.`,

        requestId:
          req.requestId
      });
  }


  bucket.count++;


  rateBuckets.set(
    userId,
    bucket
  );


  next();
}



/* ======================================================
   PAYLOAD VALIDATION
====================================================== */

function validateAIPayload(
  req,
  res,
  next
) {
  const body =
    req.body;


  if (
    !body ||
    typeof body !==
      "object" ||
    Array.isArray(
      body
    )
  ) {
    return res
      .status(400)
      .json({
        ok:
          false,

        errorCode:
          "INVALID_REQUEST",

        error:
          "Invalid AI request.",

        requestId:
          req.requestId
      });
  }


  const allowedModes =
    new Set([
      "tutor",
      "explain",
      "debug",
      "generate",
      "assess",
      "recommend"
    ]);


  if (
    !allowedModes.has(
      body.mode
    )
  ) {
    return res
      .status(400)
      .json({
        ok:
          false,

        errorCode:
          "INVALID_REQUEST",

        error:
          "Invalid AI mode.",

        requestId:
          req.requestId
      });
  }


  next();
}



/* ======================================================
   PYTHON WORKER
====================================================== */

function runPythonAI(
  payload,
  requestId
) {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const python =
        spawn(
          "python3",
          [
            "ai/ai.py"
          ],
          {
            env:
              process.env,

            stdio: [
              "pipe",
              "pipe",
              "pipe"
            ]
          }
        );


      let stdout =
        "";

      let stderr =
        "";

      let settled =
        false;


      const finishReject = (
        error
      ) => {
        if (settled) {
          return;
        }

        settled =
          true;

        clearTimeout(
          timeout
        );

        reject(
          error
        );
      };


      const finishResolve = (
        value
      ) => {
        if (settled) {
          return;
        }

        settled =
          true;

        clearTimeout(
          timeout
        );

        resolve(
          value
        );
      };


      const timeout =
        setTimeout(
          () => {
            python.kill(
              "SIGKILL"
            );


            const error =
              new Error(
                "AI worker timed out."
              );


            error.code =
              "TIMEOUT";


            finishReject(
              error
            );
          },
          AI_WORKER_TIMEOUT_MS
        );


      python.stdout.on(
        "data",
        chunk => {
          stdout +=
            chunk.toString();


          if (
            stdout.length >
            500_000
          ) {
            python.kill(
              "SIGKILL"
            );


            const error =
              new Error(
                "AI worker returned too much data."
              );


            error.code =
              "INTERNAL_ERROR";


            finishReject(
              error
            );
          }
        }
      );


      python.stderr.on(
        "data",
        chunk => {
          stderr +=
            chunk.toString();


          if (
            stderr.length >
            100_000
          ) {
            stderr =
              stderr.slice(
                -100_000
              );
          }
        }
      );


      python.on(
        "error",
        error => {
          error.code =
            "INTERNAL_ERROR";


          finishReject(
            error
          );
        }
      );


      python.on(
        "close",
        code => {
          if (
            settled
          ) {
            return;
          }


          let response;


          try {
            response =
              JSON.parse(
                stdout
              );
          }

          catch {
            console.error(
              `[${requestId}] Invalid worker output`,
              {
                code,
                stderr
              }
            );


            const error =
              new Error(
                "AI worker returned an invalid response."
              );


            error.code =
              "INTERNAL_ERROR";


            finishReject(
              error
            );

            return;
          }


          if (
            !response.ok
          ) {
            console.error(
              `[${requestId}] AI worker error`,
              {
                errorCode:
                  response.errorCode,

                stderr
              }
            );


            const error =
              new Error(
                response.error ||
                "AI request failed."
              );


            error.code =
              response.errorCode ||
              "PROVIDER_ERROR";


            finishReject(
              error
            );

            return;
          }


          finishResolve(
            response
          );
        }
      );


      python.stdin.on(
        "error",
        error => {
          error.code =
            "INTERNAL_ERROR";


          finishReject(
            error
          );
        }
      );


      python.stdin.write(
        JSON.stringify(
          payload
        )
      );


      python.stdin.end();
    }
  );
}



/* ======================================================
   AI ERROR MAPPING
====================================================== */

function aiErrorStatus(
  code
) {
  switch (
    code
  ) {
    case "RATE_LIMIT":
      return 429;


    case "TIMEOUT":
      return 504;


    case "INVALID_REQUEST":
      return 400;


    case "PROVIDER_AUTH":
      return 502;


    case "PROVIDER_ERROR":
      return 503;


    default:
      return 500;
  }
}


function aiPublicMessage(
  error
) {
  switch (
    error.code
  ) {
    case "RATE_LIMIT":
      return (
        "The AI service is temporarily rate limited. Try again shortly."
      );


    case "TIMEOUT":
      return (
        "The AI request took too long. Please try again."
      );


    case "INVALID_REQUEST":
      return (
        error.message ||
        "The AI request could not be processed."
      );


    case "PROVIDER_AUTH":
      return (
        "The AI service is temporarily unavailable."
      );


    case "PROVIDER_ERROR":
      return (
        "The AI provider is temporarily unavailable. Please try again."
      );


    default:
      return (
        "Something went wrong while processing the AI request."
      );
  }
}



/* ======================================================
   AI HEALTH
====================================================== */

app.get(
  "/api/ai/health",
  async (
    req,
    res
  ) => {
    const requestId =
      randomUUID();


    try {
      const response =
        await runPythonAI(
          {
            mode:
              "health"
          },
          requestId
        );


      res.json({
        ...response,

        requestId
      });
    }

    catch (error) {
      console.error(
        `[${requestId}] AI health error:`,
        error
      );


      res
        .status(
          aiErrorStatus(
            error.code
          )
        )
        .json({
          ok:
            false,

          errorCode:
            error.code ||
            "INTERNAL_ERROR",

          error:
            aiPublicMessage(
              error
            ),

          requestId
        });
    }
  }
);



/* ======================================================
   AUTHENTICATED AI
====================================================== */

app.post(
  "/api/ai",

  (
    req,
    res,
    next
  ) => {
    req.requestId =
      randomUUID();

    next();
  },

  requireAuthenticatedUser,

  checkAIRateLimit,

  validateAIPayload,

  async (
    req,
    res
  ) => {
    const requestId =
      req.requestId;


    const startedAt =
      Date.now();


    try {
      const payload = {
        ...req.body,

        user: {
          id:
            req.user.id
        }
      };


      const response =
        await runPythonAI(
          payload,
          requestId
        );


      const elapsed =
        Date.now() -
        startedAt;


      console.log(
        `[${requestId}] AI success mode=${req.body.mode} duration=${elapsed}ms`
      );


      res.json({
        ...response,

        requestId
      });
    }

    catch (error) {
      const elapsed =
        Date.now() -
        startedAt;


      console.error(
        `[${requestId}] AI failure mode=${req.body?.mode} code=${error.code || "INTERNAL_ERROR"} duration=${elapsed}ms`
      );


      const status =
        aiErrorStatus(
          error.code
        );


      res
        .status(
          status
        )
        .json({
          ok:
            false,

          errorCode:
            error.code ||
            "INTERNAL_ERROR",

          error:
            aiPublicMessage(
              error
            ),

          requestId
        });
    }
  }
);



/* ======================================================
   EXPRESS ERROR HANDLER
====================================================== */

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error?.type ===
      "entity.too.large"
    ) {
      return res
        .status(413)
        .json({
          ok:
            false,

          errorCode:
            "INVALID_REQUEST",

          error:
            "Request payload is too large."
        });
    }


    console.error(
      "Unhandled server error:",
      error
    );


    res
      .status(500)
      .json({
        ok:
          false,

        errorCode:
          "INTERNAL_ERROR",

        error:
          "An internal server error occurred."
      });
  }
);



/* ======================================================
   FRONTEND
====================================================== */

app.use(
  express.static(
    "public"
  )
);



/* ======================================================
   START
====================================================== */

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `QubitLab running on port ${PORT}`
    );
  }
);