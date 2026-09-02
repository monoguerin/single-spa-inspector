import browser from "webextension-polyfill";

export async function evalDevtoolsCmd(devToolsCommandString) {
  const commandString = `window.__SINGLE_SPA_DEVTOOLS__.${devToolsCommandString}`;
  return evalCmd(commandString);
}

export function evalCmd(commandString) {
  return new Promise((resolve, reject) => {
    const handleEval = (result, err) => {
      if (err && (err.isError || err.isException)) {
        reject(
          new Error(
            `evalCmd '${commandString}' failed: ${JSON.stringify(err)}`,
          ),
        );
      }
      resolve(result)
    };
    browser.devtools.inspectedWindow
      .eval(commandString, handleEval)
      ?.then((result) => handleEval(result[0], result[1]))
      .catch(reject);
  });
}
