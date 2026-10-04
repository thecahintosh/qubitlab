const runButton = document.getElementById("runButton");

const output = document.getElementById("output");

runButton.addEventListener("click", async () => {

  try {

    const response =
      await fetch("/api/health");

    const data =
      await response.json();

    output.textContent =
      JSON.stringify(
        data,
        null,
        2
      );

  } catch (error) {

    output.textContent =
      `Error: ${error.message}`;

  }

});