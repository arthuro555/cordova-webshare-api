package com.arthuro555.cordova.webshare;

import android.app.Activity;
import android.content.Intent;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class WebShareAPI extends CordovaPlugin {
    /**
     * Internal slot defined on https://www.w3.org/TR/web-share/#internal-slots.
     * 
     * --> Implementation detail: No promises in Cordova, we use a callback that is wrapped
     * into a promise in JS.
     */
    private static CallbackContext sharePromise;

    private static final int SHARE_RESULT = 73829912;

    /**
     * Step 2, 9 and 11 of the share method as defined
     * on https://www.w3.org/TR/web-share/#share-method.
     * 
     * Rest of the steps in JavaScript.
     */
    private void share(JSONObject options, CallbackContext callbackContext) throws JSONException {
        // 2. If [[sharePromise]] is not null, return a promise rejected with InvalidStateError.
        if (sharePromise != null) {
            callbackContext.error("AlreadySharing");
            return;
        }

        // 9. Set [[sharePromise]] to be a new promise.
        sharePromise = callbackContext;

        // 11.1 If there are no share targets available,
        //      reject [[sharePromise]] with an "AbortError" DOMException.
        //
        // --> Skip, as there is always the clipboard as target.

        Intent shareIntent = new Intent();
        shareIntent.setAction(Intent.ACTION_SEND);

        if (options.has("url"))
            shareIntent.putExtra(Intent.EXTRA_TEXT, options.getString("url"));
        else if (options.has("text"))
            shareIntent.putExtra(Intent.EXTRA_TEXT, options.getString("text"));

        if (options.has("title"))
            shareIntent.putExtra(Intent.EXTRA_TITLE, options.getString("title"));

        shareIntent.setType("text/plain");

        // 11.2 Present the user with a choice of one or more share targets,
        //      selected at the user agent's discretion. The user MUST be
        //      given the option to cancel rather than choosing any of the
        //      share targets. Wait for the user's choice.
        cordova.startActivityForResult(
                this,
                Intent.createChooser(
                        shareIntent,
                        options.optString("url", options.optString("text", ""))
                ),
                SHARE_RESULT
        );
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("share")) {
            share(args.getJSONObject(0), callbackContext);
            return true;
        }
        return false;
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent intent) {
        // 11.4 Activate the chosen share target, convert data to a format suitable for
        //      ingestion into the target, and transmit the converted data to the target.
        //
        // 11.5 If an error occurs starting the target or transmitting the data,
        //      reject [[sharePromise]] with an "DataError" DOMException.
        //
        // --> Skipped, those steps are handled automatically by the Android API.

        if (requestCode == SHARE_RESULT) {
            // 11.3 If the user chose to cancel the share operation,
            //      reject [[sharePromise]] with an "AbortError" DOMException.
            if (resultCode == Activity.RESULT_CANCELED) 
              sharePromise.error("Cancel");
            
            // 11.6 Once the data has been successfully transmitted to the target,
            //      resolve [[sharePromise]] with undefined.
            else sharePromise.success();

            // 11.7 Set [[sharePromise]] to null.
            sharePromise = null;
        }
    }
}
