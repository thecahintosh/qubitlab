import {
  marked
} from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

import DOMPurify
  from "https://cdn.jsdelivr.net/npm/dompurify@3.4.16/+esm";

import renderMathInElement
  from "https://cdn.jsdelivr.net/npm/katex@0.19.0/dist/contrib/auto-render.mjs";


marked.setOptions({
  gfm: true,
  breaks: true
});


function protectMath(
  source
) {
  const expressions = [];

  /*
    We temporarily replace LaTeX with tokens so
    Markdown does not accidentally modify it.
  */

  const patterns = [
    /\\\[[\s\S]*?\\\]/g,
    /\$\$[\s\S]*?\$\$/g,
    /\\\([\s\S]*?\\\)/g
  ];


  let result =
    String(
      source ?? ""
    );


  for (
    const pattern
    of patterns
  ) {
    result =
      result.replace(
        pattern,
        match => {
          const index =
            expressions.length;

          expressions.push(
            match
          );

          return (
            `QUBITLABMATH${index}TOKEN`
          );
        }
      );
  }


  return {
    text: result,
    expressions
  };
}


function restoreMath(
  container,
  expressions
) {
  if (
    expressions.length === 0
  ) {
    return;
  }


  const walker =
    document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT
    );


  const nodes = [];


  while (
    walker.nextNode()
  ) {
    nodes.push(
      walker.currentNode
    );
  }


  for (
    const node
    of nodes
  ) {
    let value =
      node.nodeValue;


    let changed =
      false;


    expressions.forEach(
      (
        expression,
        index
      ) => {
        const token =
          `QUBITLABMATH${index}TOKEN`;


        if (
          value.includes(
            token
          )
        ) {
          value =
            value.replaceAll(
              token,
              expression
            );

          changed =
            true;
        }
      }
    );


    if (
      changed
    ) {
      node.nodeValue =
        value;
    }
  }
}


export function renderRichAIText(
  container,
  source
) {
  const {
    text,
    expressions
  } =
    protectMath(
      source
    );


  const markdownHtml =
    marked.parse(
      text
    );


  /*
    Model output is untrusted content.

    Marked converts Markdown to HTML,
    then DOMPurify sanitizes that HTML.
  */

  const safeHtml =
    DOMPurify.sanitize(
      markdownHtml,
      {
        USE_PROFILES: {
          html: true
        }
      }
    );


  container.innerHTML =
    safeHtml;


  restoreMath(
    container,
    expressions
  );


  try {
    renderMathInElement(
      container,
      {
        delimiters: [
          {
            left: "$$",
            right: "$$",
            display: true
          },
          {
            left: "\\[",
            right: "\\]",
            display: true
          },
          {
            left: "\\(",
            right: "\\)",
            display: false
          },
          {
            left: "$",
            right: "$",
            display: false
          }
        ],

        throwOnError: false,

        strict: false
      }
    );
  }

  catch (error) {
    console.error(
      "Math rendering failed:",
      error
    );
  }
}


export function renderAIPlaceholder(
  container,
  message
) {
  container.innerHTML =
    "";


  const placeholder =
    document.createElement(
      "div"
    );


  placeholder.className =
    "ai-placeholder";


  placeholder.textContent =
    message;


  container.appendChild(
    placeholder
  );
}