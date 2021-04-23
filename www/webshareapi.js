const exec = require("cordova/exec");

module.exports = {
  /**
   * Share method as defined on https://www.w3.org/TR/web-share/#share-method.
   */
  share: function (param) {
    // Verify parameter types
    if (typeof param !== "object" || param === null)
      return Promise.reject(
        new TypeError("Expected a dictionary as first parameter!")
      );

    if (
      param.title &&
      (typeof param.title !== "string" || param.title.length === 0)
    )
      return Promise.reject(new TypeError("Title must be a non empty string!"));

    if (
      param.text &&
      (typeof param.text !== "string" || param.text.length === 0)
    )
      return Promise.reject(new TypeError("Text must be a non empty string!"));

    if (param.url && (typeof param.url !== "string" || param.url.length === 0))
      return Promise.reject(new TypeError("URL must be a non empty string!"));

    // 1. If the current settings object's responsible document is not allowed to use the "web-share"
    //    permission, return a promise rejected with with a "NotAllowedError" DOMException.
    //
    // --> This is skipped as this being an android app we do not need a specific permission to share.

    // 2. If [[sharePromise]] is not null, return a promise rejected with InvalidStateError.
    //
    // --> Implementation detail: The promise is in the native Java code, therefore we can't check this yet.

    // 3. Let window be relevant global object of this.
    //
    // --> Skipped, already the case.

    // 4. If window does not have transient activation, return a promise rejected with
    //    a "NotAllowedError" DOMException.
    if ("hasFocus" in document && !document.hasFocus())
      return Promise.reject(
        new DOMException(
          "You are not allowed to share while the document is unfocused.",
          "NotAllowedError"
        )
      );

    // 5. Consume user activation of window.
    //
    // --> Skipped as not possible to do with cordova.

    // 6. If none of data's members title, text, or url or file are present, return a promise
    //    rejected with a TypeError.
    //
    // --> Implementation detail: As sharing with only a title won't work,
    //     we also throw an error if it is the only property present.
    if (!(param.url || param.text || param.files)) {
      return Promise.reject(new TypeError("Missing content to share!"));
    }

    // 7. If data's files member is present:
    if (param.files) {
      if (!Array.isArray(param.files))
        return Promise.reject(
          new TypeError("The 'files' property has to be an array!")
        );
      // 7.1 If data's files member is empty, or if the implementation does not support file sharing,
      // return a promise rejected with a TypeError, and abort these steps.
      if (param.files.length === 0)
        return Promise.reject(
          new TypeError("The 'files' array has to have at least 1 item!")
        );

      // TODO: Add files support
      return Promise.reject(
        new TypeError("Sharing of files is currently unsupported!")
      );
    }

    // 8. If data's url member is present:
    if (typeof param.url === "string") {
      try {
        // 8.2 Let url be the result of running the URL parser on data's url with base.
        var parsedURL = new URL(
          param.url,
          // 8.1 Let base be the this value's relevant settings object's api base URL.
          location
        );
      } catch (e) {
        // 8.3 If url is failure, return a promise rejected with TypeError.
        return Promise.reject(new TypeError("Could not parse URL! " + e));
      }

      // 8.4 If url's scheme is not "http" or "https", return a promise rejected with TypeError.
      if (parsedURL.protocol !== "http:" && parsedURL.protocol !== "https:") {
        return Promise.reject(
          new TypeError(
            "Invalid protocol! Can only share URLs with 'http' or 'https' protocol."
          )
        );
      }

      // 8.5 Set data to a copy of data, with its url member set to the result of running the
      //     URL serializer on url.
      param = Object.assign({}, param, { url: parsedURL.toString() });
    }

    // 9. If a file type is being blocked due to security considerations,
    // return a promise rejected with with a "NotAllowedError" DOMException.
    //
    // --> Skipped: Impossible to access browser security checks with cordova

    // 10. Set [[sharePromise]] to be a new promise.
    //
    // --> Implementation detail: The promise is in the native Java code, it will be done in the next block after step 2.

    // 11. Return [[sharePromise]]
    //
    // --> Implementation detail: Cordova plugins work with callbacks, so we wrap the native code call in a JS promise.
    return new Promise((resolve, reject) =>
      exec(
        resolve,
        (errorCode) => {
          if (errorCode === "AlreadySharing")
            reject(
              new DOMException(
                "Cannot share twice at the same time!",
                "InvalidStateError"
              )
            );
          if (errorCode === "Cancel")
            reject(
              new DOMException("Operation canceled by the user.", "AbortError")
            );
        },
        "WebShareAPI",
        "share",
        [param]
      )
    );
  },
};
