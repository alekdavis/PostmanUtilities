// DESCRIPTION
// A library of utility functions for calling and implementing tests,
// checking results, handling errors, and performing a variety of
// miscellaneous operations in Postman.
//
// EXPECTATIONS
// The REST API being tested is expected to  be consistent in returning
// successful results and error details. In particular, errors are
// expected to return an HTTP status code in the 4xx or 5xx range along
// with the data object coplying with RFC7807 (see description at:
// https://tools.ietf.org/html/rfc7807). The default implementation
// assumes that the error details object contains a custom property,
// such as 'serviceCode' identifying error; if your problem details object
// relies on a different property, pass the appropriate name or change
// the default).
//
// REQUIREMENTS
// All functions implemented in this library accept the global 'pm'
// object as the first parameter (not all need it, but it makes
// the API consistent).
//
// EXAMPLES
//
// 1. A simple positive test checking for HTTP response with status
//    code 200.
//
//    utils.test.positive(pm);
//
// 2. A simple negative test checking for HTTP respons with status
//    code 400 and JSON error result containing 'serviceCode'
//    property with the value of 'BadRequest'.
//
//    utils.test.negative(pm, null, 400, "BadRequest");
//
// 2. A negative test checking for HTTP respons with status
//    code 400 and JSON error result containing 'errorCode'
//    property with the value of 'BadRequest'.
//
//    utils.test.negative(pm, null, 400, "errorCode:BadRequest");
//
// 4. A more typical positive test checking for HTTP response with
//    status code 200 and performing additional validations.
//
//    utils.test.positive(pm, null, 200, function() {
//      utils.expect.response.text(pm);
//      pm.expect(pm.response.text()).to.be.a("string");
//    });
//
// 5. A positive test with special error handling logic performed
//    on test failure:
//
//    utils.test.positive(pm, null, 200,
//      function() {
//        pm.expect(pm.response.text()).to.be.a("string");
//      },
//      function() {
//        console.warn("EXITING TEST RUN DUE TO ERROR");
//        utils.stop();
//      }
//    );
//
// 6. Two tests performed for one request.
//
//    var i = 1;
//
//    utils.test.positive(pm, utils.name(pm, null, i++),  200, function() {
//      pm.expect(pm.response.text()).to.be.a("string");
//    });
//
//    utils.test.neutral(pm, utils.name(pm, null, i++), function() {
//      pm.expect(pm.response.text()).not.to.be.an("array");
//    });
//
// 7. Initialization logic in a test pre-request.
//
//    utils.test.initialize(pm, null,
//      function() {
//        console.log("Executing pre-request script");
//      },
//      function() {
//          console.error("EXITING TEST RUN DUE TO ERROR IN PRE-REQUEST");
//          utils.stop();
//      }
//    );
//
// 8. Folder pre-request code that gets executed once per test run.
//
//    utils.run.once(pm, "Name-Of-The-Folder-X", function() {
//      utils.trace.set.all(pm);
//      console.log("Code in this folder gets called only once.")
//    });
//
// 9. Folder pre-request code that gets executed for every request
//    during each test run.
//
//    utils.run.always(pm, "Name-Of-The-Folder-Y", function() {
//      utils.trace.set.all(pm);
//      console.log("Code in this folder gets called only once.")
//    });
//

utils = {
    // Version of this library.
    version: "1.0.0",

    // Default name of the problem details object property returning
    // application specific error code.
    defaultServiceCodePropertyName: "serviceCode",

    // DESCRIPTION
    // Primary test functions that can be used for implementing
    // positive, negative, and neutral tests.
    test: {

    // DESCRIPTION
    // Use this function to implement custom pre-request logic
    // intended for test pre-requests only.
    //
    // PARAMETERS
    // - name (string, optional)
    //  Unique (across the test collection) name of the test.
    //  If not specified, the name will be set to the value of
    //  'pm.info.requestname' property (which is the recommended value
    //  to be passed to 'pm.test' unless the request has multiple tests).
    //
    // - process (function)
    //  Inline function that will be executed on every explicit call.
    //
    // - onerror
    //  Same as in the 'once' function.
    initialize: function(pm, name, process, onerror) {
        if (process === undefined ||
            process === null ||
            (typeof process !== 'function')) {
            return;
        }
        name = utils.name(pm, name);

        if (onerror === undefined ||
            onerror === null ||
            (typeof onerror !== 'function')) {
            utils.run.always(pm, name, process, null, false);
        } else {
            utils.run.always(pm, name, process, onerror, false);
        }
    },

    // DESCRITION
    // Implements a positive test. By default, this function
    // will check the returned HTTP status code. It can also
    // call the code from the inline custom function if one is
    // specified and invoke special code in case of error (also
    // if error handling code is provided).
    //
    // PARAMETERS
    // - name
    //  Same as in the 'test.initialize' function.
    //
    // - status (integer, optional, default=200)
    //  Expected HTTP status code identifying success.
    //
    // - process (function, optional)
    //  Implements custom processing logic.
    //
    // - onerror (function, optional)
    //  Implements custom error handling logic.
    positive: function(pm, name, status, process, onerror) {
        name = utils.name(pm, name);

        pm.test(name, function() {

            if (status === undefined || status === null) {
                status = 200;
            }

            try {
                // Invoke pre-test code (console message, etc).
                utils.prologue(pm, name);

                // If returned HTTP status code matches the expected value...
                if (pm.response.code === status) {
                    // If a custom function with additional tests is specified...
                    if (process !== undefined &&
                        process !== null &&
                        (typeof process === 'function')) {

                        // Perform custom tests.
                        process();
                    }
                } else {
                    // Process error based on either problem details object
                    // or HTTP status code returned in the response.
                    utils.error(pm, status);
                }
            } catch (e) {
                // Call custom error handler (if one is specified)
                // before performing standard error handling.
                if (onerror !== undefined) {
                    utils.failure(pm, onerror);
                }

                // Call standard error handler.
                utils.exception(pm, e, name);
            } finally {
                // Invoke post-test code (console message, etc).
                utils.epilogue(pm, name);
            }
        });
    },

    // DESCRITION
    // Implements a negative test. By default, this function
    // will check the returned HTTP status code and an optional
    // service code returned via the problem details object.
    // Just as with the 'positive' function, you can pass
    // custom functions with additional logic and error handling.
    //
    // PARAMETERS
    // - name
    //  Same as in the 'test.initialize' function.
    //
    // - status (integer, optional, default=400)
    //  Expected HTTP status identifying error.
    //
    // - serviceCode (string, optional)
    //  Extended property of the problem details object returned by
    //  the REST API on error that needs to be checked for a specific
    //  value. By default, the problem details property name is
    //  assumed to be 'serviceCode'. To use a different property name
    //  add it in front of the expected value and separete the name
    //  from the value by a colon (or equal sign), e.g.
    //  'errorCode:InvalidInput' (or 'errorCode=InvalidInput').
    //
    // - process
    //  Same as in the 'test.initialize' function.
    //
    // - onerror
    //  Same as in the 'test.initialize' function.
    negative: function(pm, name, status, serviceCode, process, onerror) {
        name = utils.name(pm, name);

        pm.test(name, function() {

            // If HTTP status code is not specified, set it to 400.
            if (status === undefined || status === null) {
                status = 400;
            }

            try {
                // Invoke pre-test code (console message, etc).
                utils.prologue(pm, name);

                // First compare returned HTTP status code to the expected.
                if (pm.response.code === status) {
                    // Since negative test case assumes an error,
                    // get the problem details object from the response.
                    var response = pm.response.json();

                    // If we also need to check service code, validate it as well.
                    if (serviceCode !== undefined &&
                        serviceCode !== null &&
                        serviceCode !== "") {

                        var errorCodePropertyName;
	                    var errorCodePropertyValue;

                        // If the service code property contains colon or equal sign,
                        // it means that we mwy be using a non-default property name,
                        // so we will get it from the string following the separator
                        // character (the value can contain the separator character,
                        // because only the first occurrence of the separator character
                        // is considered to be a separator).
	                    if (serviceCode.includes(":")) {
		                    var keyValuePair = serviceCode.split(":");

                            errorCodePropertyName  = keyValuePair[0];

                            // Remove first item (name) from the array and join the rest.
                            // to restore the original value in case it contained the
                            // separator character.
		                    errorCodePropertyValue = keyValuePair.slice(1).join(":");
                        } else if (serviceCode.includes("=")) {
                            var keyValuePair = serviceCode.split("=");

                            errorCodePropertyName  = keyValuePair[0];

                            // Remove first item (name) from the array and join the rest
                            // to restore the original value in case it contained the
                            // separator character.
                            errorCodePropertyValue = keyValuePair.slice(1).join("=");
                        } else {
                            errorCodePropertyName  = utils.defaultServiceCodePropertyName;
                            errorCodePropertyValue = serviceCode;
                        }

                        // Validate returned service code.
                        pm.expect(response).to.have.property(errorCodePropertyName);

                        if (response[errorCodePropertyName] !== errorCodePropertyValue) {
                            pm.expect.fail(
                                "Expected response '" + errorCodePropertyName + "' property to be '" +
                                errorCodePropertyValue + "' but got '" +
                                response[errorCodePropertyName] + "'")
                        }
                    }

                    // If a custom function with additional tests is specified...
                    if (process !== undefined &&
                        process !== null &&
                        (typeof process === 'function')) {

                        // Perform custom tests.
                        process();
                    }
                } else {
                    pm.response.to.have.status(status);
                }
            } catch (e) {
                // Call custom error handler (if one is specified)
                // before performing standard error handling.
                if (onerror !== undefined) {
                    utils.failure(pm, onerror);
                }

                // Call standard error handler.
                utils.exception(pm, e, name);
            } finally {
                // Invoke post-test code (console message, etc).
                utils.epilogue(pm, name);
            }
        });
    },

    // DESCRITION
    // Implements test that is not dependent on the value of
    // the returned HTTP status code. Use this function if you
    // need to implement more than one tests for a request.
    //
    // PARAMETERS
    // - name
    //  Same as in the 'test.initialize' function.
    //
    // - process
    //  Same as in the 'test.initialize' function.
    //
    // - onerror
    //  Same as in the 'test.initialize' function.
    neutral: function(pm, name, process, onerror) {
        name = utils.name(pm, name);

        pm.test(name, function() {
            try {
                // Invoke pre-test code (console message, etc).
                utils.prologue(pm, name);

                if (process !== undefined &&
                    process !== null &&
                    (typeof process === 'function')) {

                    // Perform custom tests.
                    process();
                }
            } catch (e) {
                // Call custom error handler (if one is specified)
                // before performing standard error handling.
                if (onerror !== undefined) {
                    utils.failure(pm, onerror);
                }

                // Call standard error handler.
                utils.exception(pm, e, name);
            } finally {
                // Invoke post-test code (console message, etc).
                utils.epilogue(pm, name);
            }
        });
    }
    // End of 'utils.test' functions.
    },

    // DESCRIPTION
    // Functions to be used in request workflow.
    run: {

    // DESCRITION
    // Executes code in the inline function once per collection run,
    // which can be handy for pre-request scripts defined in folders
    // for one-time initializations.
    //
    // PARAMETERS
    // - name (string)
    //  Descriptive name describing the collection being tested.
    //  This name will be used as the name of the environment variable
    //  to prevent consecutive test runs.
    //
    // - process (function)
    //  Inline function with the code that must be executed once.
    //
    // - onerror
    //  Inline function with the code that must be executed on error.
    once: function(pm, name, process, onerror) {
        if (process === undefined ||
            process === null ||
            (typeof process !== 'function')) {
            return;
        }

        if (name === undefined ||
            name === null ||
            (typeof name !== 'string')) {
            return;
        }

        var firstRun = pm.variables.get(name);

        if (firstRun !== undefined) {
            return;
        }

        var failed = false;

        try {
            utils.trace.log(pm, name + ": Script started", 1);

            pm.variables.set(name, false);

            if (process !== undefined &&
                process !== null &&
                (typeof process === 'function')) {
                process();
            }
        }
        catch (e) {
            failed = true;

            // Call custom error handler (if one is specified)
            // before performing standard error handling.
            if (onerror !== undefined) {
                utils.failure(pm, onerror);
            }

            // Call standard error handler.
            utils.exception(pm, e, name);
        } finally {
            if (failed) {
                console.error(name + ": Script failed");
            } else {
                utils.trace.log(pm, name + ": Script ended", 2);
            }
        }
    },

    // DESCRIPTION
    // Executes code in the inline function for every request during
    // test collection run, which can be handy for pre-request scripts
    // defined for folders in repeateed initializations.
    //
    // PARAMETERS
    // - name
    //  Same as in the 'run.once' function.
    //
    // - process (function)
    //  Inline function that will be executed on every explicit call.
    //
    // - onerror
    //  Same as in the 'run.once' function.
    always: function(pm, name, process, onerror, folder=true) {
        if (process === undefined ||
            process === null ||
            (typeof process !== 'function')) {
            return;
        }

        var failed = false;
        var type   = folder ? "Script" : "Pre-request";

        try
        {
            utils.trace.log(pm, name + ": " + type + " started", 1);

            process();
        }
        catch (e) {
            failed = true;

            // Call custom error handler (if one is specified)
            // before performing standard error handling.
            if (onerror !== undefined) {
                utils.failure(pm, onerror);
            }

            // Call standard error handler.
            utils.exception(pm, e, name);
        } finally {
            if (failed) {
                console.error(name + ": " + type + " failed");
            } else {
                utils.trace.log(pm, name + ": " + type + " ended", 2);
            }
        }
    }
    // End of 'utils.run' functions.
    },

    // DESCRIPTION
    // Data validation fuinctions that are split in subgroups targeting
    // specific objects being validated: response, property, string, etc.
    expect: {

    // DESCRIPTION
    // Functions validating HTTP response.
    response: {

        // DESCRITION
        // Expects response to return any text element.
        text: function(pm) {
            try
            {
                response = pm.response.text();
            }
            catch (e)
            {
                pm.expect.fail("Response must return a valid text object: " + e.message);
            }
        },

        // DESCRITION
        // Expects response to return any JSON element.
        json: function(pm) {
            try
            {
                response = pm.response.json();
            }
            catch (e)
            {
                pm.expect.fail("Response must return a valid JSON object: " + e.message);
            }
        },

        // DESCRITION
        // Expects response to return a single JSON element (not an array,
        // and, in particular, not a JSON array containing a single item).
        one: function(pm) {
            try
            {
                response = pm.response.json();
            }
            catch (e)
            {
                pm.expect.fail("Response must return a valid JSON object: " + e.message);
            }

            if ("length" in response) {
                pm.expect.fail("Response must return a single object and not an array");
            }
        },

        // DESCRITION
        // Expects response to return a JSON array.
        // The array can be empty or contain the expected number of items
        // identified by the 'min' and 'max' parameters (if 'max' is -1,
        // it means there is no maximum).
        // The array can also contain a single item which is treated
        // NOT the same as a single JSON element.
        //
        // PARAMETERS
        // - min (non-negative integer, optional, default=0)
        //  Minimal expected number of elements in the collection.
        //
        // - max (integer, optional, default=-1)
        //  Maximum expected number of elements in the collection.
        //  Use -1 for unlimited maximum number.
        many: function (pm, min = 0, max = -1) {
            var response = null;

            try
            {
                response = pm.response.json();
            }
            catch (e)
            {
                pm.expect.fail("Response must return a valid JSON object: " + e.message);
            }

            pm.expect(response).to.be.an("array", "Response must return an array");

            if (min == 0 && max == 0) {
                pm.expect(response).to.be.empty("Response must return an empty array");
            } else if (min == 1 && max == 1) {
                pm.expect(response).to.have.lengthOf(1, "Response must return a single item");
            } else if (min == max) {
                pm.expect(response.length).to.equal(min, "Response must return exactly " + min + " item(s)");
            } else if (max > 0) {
                if (min > 0) {
                    pm.expect(response.length).to.be.at.least(min, "Response must return at least " + min + " item(s)");
                }
                pm.expect(response.length).to.be.at.most(max, "Response must return at most " + max + " item(s)");
            } else if (min == 1) {
                pm.expect(response.length).to.be.at.least(1, "Response must return at least one item");
            } else if (min > 0) {
                pm.expect(response.length).to.be.at.least(min, "Response must return at least " + min + " item(s)");
            }
        },

        // DESCRITION
        // Expects response to contain an empty array.
        empty: function(pm) {
            utils.expect.response.many(pm, 0, 0);
        },

        // DESCRITION
        // Expects response to contain an non-empty array.
        nonempty: function(pm) {
            utils.expect.response.many(pm, 1, -1);
        },

        // DESCRITION
        // Expects response to contain an array holding a single item.
        unique: function(pm) {
            utils.expect.response.many(pm, 1, 1);
        }

    // End of 'utils.expect.response' functions.
    },

    // DESCRIPTION
    // Functions validating object properties.
    // String-specific validation functions are grouped under the
    // 'utils.expect.property.string' subcluss.
    property: {

        // DESCRIPTION
        // Expects object to have a named property holding any value
        // including null.
        //
        // PARAMETERS
        // - data (object)
        //  Data object which property is being checked.
        //
        // - name (string)
        //  Property name.
        exist: function(pm, data, name) {
            pm.expect(data).to.have.property(name);
        },

        // DESCRIPTION
        // Expects object to not have a named property holding any value
        // including null.
        //
        // PARAMETERS
        // - data (object)
        //  Data object which property is being checked.
        //
        // - name (string)
        //  Property name.
        notexist: function(pm, data, name) {
            pm.expect(data).to.not.have.property(name);
        },

        // DESCRIPTION
        // Expects object property to exist and equal the specified value.
        //
        // PARAMETERS
        // - data
        //  Same as in 'utils.expect.property.exist'.
        //
        // - name
        //  Same as in 'utils.expect.property.exist'.
        //
        // - value (object)
        //  Expected value (can be null).
        equal: function(pm, data, name, value) {
            utils.expect.property.exist(pm, data, name);

            if (value !== undefined) {
                if (value === null) {
                    pm.expect(data[name]).to.be.null;
                } else {
                    var msg = "Expected '" + name +
                        "' property to equal '" + value +
                        "' but got '" + data[name] +
                        "'";

                    pm.expect(data[name]).to.equal(value, msg);
                }
            }
        },

        // DESCRIPTION
        // Expects object property to exist and equal the specified value.
        //
        // PARAMETERS
        // - data
        //  Same as in 'utils.expect.property.exist'.
        //
        // - name
        //  Same as in 'utils.expect.property.exist'.
        //
        // - value (object)
        //  Expected value (can be null).
        notequal: function(pm, data, name, value) {
            utils.expect.property.exist(pm, data, name);

            if (value !== undefined) {
                if (value === null) {
                    pm.expect(data[name]).to.not.be.null;
                } else {
                    var msg = "Expected '" + name +
                        "' property to not equal '" + value +
                        "' but got '" + data[name] +
                        "'";

                    pm.expect(data[name]).to.not.equal(value, msg);
                }
            }
        },

        // DESCRIPTION
        // Functions validating string properties.
        string: {

            // DESCRIPTION
            // Expects the string object property to exist and
            // be exactly the same as the specified value.
            //
            // PARAMETERS
            // - data
            //  Same as in 'utils.expect.property.exist'.
            //
            // - name
            //  Same as in 'utils.expect.property.exist'.
            //
            // - value (string)
            //  Expected string value (can be null).
            //
            // - ignoreCase (boolean, default=false)
            //  Set to 'true' for case-insensitive comparisons.
            exact: function(pm, data, name, value, ignoreCase = false) {
                utils.expect.property.exist(pm, data, name);

                if (value === null) {
                    pm.expect(data[name]).to.be.null;
                } else {
                    var msg = "Expected '" + name +
                        "' property to match '" + value +
                        "' but got '" + data[name] +
                        "'";

                    if (ignoreCase) {
                        pm.expect(data[name].toUpperCase()).to.equal(value.toUpperCase(),
                            msg + " (case-insensitive)");
                    } else {
                        pm.expect(data[name]).to.equal(value, msg + " (case-sensitive)");
                    }
                }
            },

            // DESCRIPTION
            // Expects the string object property to exist and contain the specified value.
            //
            // PARAMETERS
            // - data
            //  Same as in 'utils.expect.property.exist'.
            //
            // - name
            //  Same as in 'utils.expect.property.exist'.
            //
            // - value (string)
            //  Expected substring value (cannot be null).
            //
            // - ignoreCase (boolean, default=false)
            //  Set to 'true' for case-insensitive comparisons.
            partial: function(pm, data, name, value, ignoreCase = false) {
                utils.expect.property.exist(pm, data, name);

                var msg = "Expected '" + name +
                    "' property to contain '" + value +
                    "' but got '" + data[name] +
                    "'";

                if (ignoreCase) {
                    pm.expect(data[name].toUpperCase()).to.have.string(value.toUpperCase(), msg + " (case-insensitive)");
                } else {
                    pm.expect(data[name]).to.have.string(value, msg + " (case-sensitive)");
                }
            },

            // DESCRIPTION
            // Expects the string object property to exist and start with the specified value.
            //
            // PARAMETERS
            // - data
            //  Same as in 'utils.expect.property.exist'.
            //
            // - name
            //  Same as in 'utils.expect.property.exist'.
            //
            // - value (string)
            //  Expected beginning of the string value (cannot be null).
            //
            // - ignoreCase (boolean, default=false)
            //  Set to 'true' for case-insensitive comparisons.
            start: function(pm, data, name, value, ignoreCase = false) {
                utils.expect.property.exist(pm, data, name);

                var msg = "Expected '" + name +
                    "' property to start with '" + value +
                    "' but got '" + data[name] +
                    "'";

                if (data[name] === null) {
                    pm.fail(msg);
                }

                if (ignoreCase) {
                    if (!data[name].toUpperCase().startsWith(value.toUpperCase())) {
                        pm.fail(msg + " (case-insensitive)");
                    }
                } else {
                    if (!data[name].startsWith(value)) {
                        pm.fail(msg + " (case-sensitive)");
                    }
                }
            },

            // DESCRIPTION
            // Expects the string object property to exist and end with the specified value.
            //
            // PARAMETERS
            // - data
            //  Same as in 'utils.expect.property.exist'.
            //
            // - name
            //  Same as in 'utils.expect.property.exist'.
            //
            // - value (string)
            //  Expected ending of the string value (cannot be null).
            //
            // - ignoreCase (boolean, default=false)
            //  Set to 'true' for case-insensitive comparisons.
            end: function(pm, data, name, value, ignoreCase = false) {
                utils.expect.property.exist(pm, data, name);

                if (value !== undefined) {
                    if (value === null) {
                        pm.expect(data[name]).to.be.null;
                    } else {
                        var msg = "Expected '" + name +
                            "' property to end with '" + value +
                            "' but got '" + data[name] +
                            "'";

                        if (data[name] === null) {
                            pm.fail(msg);
                        }

                        if (ignoreCase) {
                            if (!data[name].toUpperCase().endsWith(value.toUpperCase())) {
                                pm.fail(msg + " (case-insensitive)");
                            }
                        } else {
                            if (!data[name].startsWith(value)) {
                                pm.fail(msg + " (case-sensitive)");
                            }
                        }
                    }
                }
            },

            // DESCRIPTION
            // Expects the string object property to exist and
            // match the specified regular expression.
            //
            // PARAMETERS
            // - data
            //  Same as in 'utils.expect.property.exist'.
            //
            // - name
            //  Same as in 'utils.expect.property.exist'.
            //
            // - value (regular expression)
            //  Regular expression (can be null).
            match: function(pm, data, name, value) {
                utils.expect.property.exist(pm, data, name);

                if (value !== undefined) {
                    if (value === null) {
                        pm.expect(data[name]).to.be.null;
                    } else {
                        var msg = "Expected '" + name +
                            "' property to match regex '" + value +
                            "' but got '" + data[name] +
                            "'";

                        pm.expect(data[name]).to.match(value, msg);
                    }
                }
            }

        // End of 'utils.expect.property.string' functions.
        }
    // End of 'utils.expect.property' functions.
    }
    // End of 'utils.expect' functions.
    },

    // DESCRIPTION
    // Functions implementing trace logging.
    trace: {

    // Variable used for setting and checking trace level.
    variableName: "TRACE_LEVEL",

    // Defualt trace level (start and end of functions).
    defaultLevel: 2,

    // DESCRIPTION
    // Functions setting trace level (must be called at beginning of test run).
    set: {
        // DESCRITION
        // Do not print trace messages to console
        // (trace level = 0).
        none: function(pm) {
            utils.trace.set.custom(pm, 0);
        },

        // DESCRITION
        // Only print trace messages indicating start of the operation to console
        // (trace level = 1).
        minimal: function(pm) {
            utils.trace.set.custom(pm, 1);
        },

        // DESCRITION
        // Print both start and end of operation trace messages to console.
        // (trace level = 2).
        all: function(pm) {
            utils.trace.set.custom(pm, 2);
        },

        // DESCRITION
        // Default is to print all.
        // (trace level = 2).
        default: function(pm) {
            utils.trace.set.custom(pm, utils.trace.defaultLevel);
        },

        // DESCRITION
        // You can set your own trace level higher than 2 and selectively
        // print your trace messages.
        // (trace level = level).
        custom: function(pm, level) {
            pm.collectionVariables.set(utils.trace.variableName, level)
        }
    },

    // DESCRIPTION
    // Prints a trace message (normally about starting or ending function).
    //
    // PARAMETERS
    // - message (string)
    //     Trace message.
    //
    // - level (integer: 1, 2, ...)
    //  Specifies trace level of the message which must not be greater than
    //  the value of the 'trace' collection variable.
    log: function(pm, message, level) {
        var traceLevel =  Number(pm.collectionVariables.get(utils.trace.variableName));

        if (traceLevel === undefined || traceLevel === null || traceLevel === NaN) {
            traceLevel = utils.trace.defaultLevel;
        }

        if (traceLevel >= level) {
            console.info(message);
        }
    }
    // End of 'utils.trace' functions.
    },

    // GENERAL-PURPOSE UTILITY FUNCTIONS
    // The following are intended for public use (in test scripts).

    // DESCRIPTION
    // Called from the pre-request scripts to indicate
    // the start of the pre-request script execution.
    //
    // PARAMETERS
    // - name
    //  Same as in the 'test.initialize' function.
    //
    // - suffix (string or integer)
    //  Will be appended to the name (can be a number or a string).
    name: function(pm, name, suffix) {
        if (name === undefined || name === null || name === "") {
            name = pm.info.requestName;
        }

        if (suffix !== undefined && suffix !== null) {
            name = name + suffix;
        }

        return name;
    },

    // DESCRIPTION
    // Stops executing test collection.
    stop: function(pm) {
        postman.setNextRequest(null);
    },

    // DESCRIPTION
    // Skips execution to the specified test.
    //
    // PARAMETERS
    // - name
    //  Name of the test case in the running collection which
    //  will be executed next.
    skip: function(pm, name) {
        postman.setNextRequest(name)
    },

    // DESCRIPTION
    // Waits/sleeps for the specified number of seconds (or milliseconds).
    //
    // PARAMETERS
    // - timeout (positive integer)
    //  Sleep/wait time in seconds (default) or milliseconds.
    //
    // - seconds (boolean)
    //  Indicates whether timeout is specified in seconds (default or
    //  if the value is true) or milliseconds (if the value is false).
    wait: function(pm, timeout, seconds = true) {

        if (seconds) {
            timeout *= 1000;
        }

        setTimeout(function(){}, timeout);
    },

    // PRIVATE FUNCTIONS
    // The following functions are intended for private use only (within this library).

    // DESCRIPTION
    // Called from a primary test script to indicate
    // the start of the script execution.
    //
    // PARAMETERS
    // - name
    //  Same as in the 'test.initialize' function.
    prologue: function(pm, name) {
        if (name === undefined || name === null || name === "") {
            name = pm.info.requestName;
        }
        //console.info("TEST: " + name);
        utils.trace.log(pm, name + ": Test started", 1);
    },

    // DESCRIPTION
    // Called from a primary test script to indicate
    // the start of the script execution.
    //
    // PARAMETERS
    // - name
    //  Same as in the 'test.initialize' function.
    epilogue: function(pm, name) {
        if (name === undefined || name === null || name === "") {
            name = pm.info.requestName;
        }
        //console.info("DONE: " + name);
        utils.trace.log(pm, name + ": Test ended", 2);
    },

    // ERROR HANDLING
    // These functions are used by primary functions to handle errors and exceptions.

    // DESCRIPTION
    // Calls custom error handler (if one is specified).
    //
    // PARAMETERS
    // - onerror
    //  Same as in the 'test.initialize' function.
    failure: function(pm, onerror) {
        // Check if custom error handler is specified and call it
        // before performing standard error handling.
        if (onerror !== undefined &&
            onerror !== null &&
            (typeof onerror === 'function')) {

            try {
                // Call custom inline function in response to error.
                onerror();
            } catch (e) {
                console.error("Failed in 'onerror' handler: " + e.message);
            }
        }
    },

    // DESCRIPTION
    // Prints exception info to console and causes test to fail.
    //
    // PARAMETERS
    // - e (exception)
    //  Exception object.
    //
    // - name
    //  Same as in the 'test.initialize' function.
    exception: function(pm, e, name) {
        //console.error(JSON.stringify(e.toJSON()).replace(/,\s*"stack".*$/, "}"));
        //var response = pm.response.text();
        //
        //if (response != null) {
        //    console.log(response);
        //}
        //if (e.actual != null) {
        //    console.error("ActualResult: " + JSON.stringify(e.actual));
        //}
        console.error(name + ": " + e.name + ": " + e.message);

        pm.expect.fail(e.message);
    },

    // DESCRIPTION
    // Fails test with an error message returned by the REST API
    // or unexpected invalid HTTP status error if the API did not
    // return a valid error.
    //
    // PARAMETERS
    // - status (integer)
    //  Actual HTTP status returned in the response.
    error: function(pm, status) {
        var error = null;

        try {
            error = pm.response.json();
        } catch {
        }

        var message = "Expected response to have status code " + status +
                " but got " +  pm.response.code;

        if (error !== null) {
            //console.error("ERROR DETAILS: " + JSON.stringify(error));
            if ("detail" in error) {
                message += (": " + error.detail);
            } else if ("title" in error) {
                message += (": " + error.title);
            }
        }

        pm.expect.fail(message);
    }
// End of 'utils' functions..
};
