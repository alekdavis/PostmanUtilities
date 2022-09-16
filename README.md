# Postman Utilities Library
This repo holds the [`utils`](utils.js) JavaScript class that can simplify and reduce [Postman](https://www.postman.com/) test and pre-request code.

## Overview
The `utils` library is a simple JavaScript object that, when included in a collection folder's pre-request script, will be available to all scripts called after it. The object exposes various functions intended to make Postman tests shorter, simpler and more consistent.

## Usage
To use the `utils` library, copy the [`utils.js`](utils.js) source code and paste it in the pre-request script of the test collection's root folder. Then you can call the `utils` functions from anywhere in the test code base.

The `utils` source code comments explain how to use the library, but a more detailed description is provided here.

Most `utils` functions are logically grouped under the inner classes (namespaces).

### Conventions
Parameters which are common in the function group are defined in the group sections. Similar to the `pm` parameter described below, they are not included in the function definition unless the function specific usage differs from the common usage.

### Parameters
The following parameters are common to all `utils` functions:

* `pm`:
For the sake of consistency, all `utils` functions expect the global `pm` object to be passed as the first parameter, including the ones that don't really need it.

### Functions
The `utils` functions are logically grouped in nested classes (namespaces) and include:

* [**Folder level functions**](#folder-level-functions) for setting up tests
* [**Primary test functions**](#primary-test-functions) for testing request results
* [**Data validation functions**](#data-validation-functions) for checking data returned from requests
* [**Trace functions**](#trace-functions) for trace logging
* [**General purpose functions**](#general-purpose-functions) for miscellaneous operations

## Folder level functions
Before we get to the overview of the folder level functions, let's summarize how folder scripts work. Folder scripts can be defined for pre-requests and post-requests. For each request in the test collection being executed, Postman first runs pre-request scripts defined in all request parent folders starting from the top level folder. Then Postman runs request's pre-request script, executes the request, and runs all post-request scripts defined in the parent folder just as it did with folder pre-requests. Finally, it runs request tests. And it is worth repeating: this logic gets executed for every request in the test collection. You may not need to run any scripts for any or all folders, which is fine: you simple do not add any code to them; but when you do, you may need to run the code once per test collection execution or for every request in the collection.

Use folder level functions to run test or pre-request code attached to test collection folders (but not request scripts).

Folder level functions are grouped under the `utils.run` namespace and include:

* [`utils.run.once`](#utilsrunonce):
Invokes code in the specified custom inline function once per test collection run.
* [`utils.run.always`](#utilsrunalways):
Invokes code in the specified custom inline function for every request during test collection run.

### Parameters
The following parameters are common to all folder level functions:

* `name`:
Unique name of the folder in the test collection. Because Postman API does not provide a way to determine the current folder, pass a unique name of the folder when calling these functions (the name may need to be unique in the collection) via the `name` parameter.
* `process`:
Inline function containing the code to be executed once or always.
* `onerror`:
Optional function containing code to be executed on error in the `process` function.

### `utils.run.once`
Invokes code in the specified custom inline function once per test collection run.

#### Prototype
```JavaScript
utils.run.once(pm, name, process, onerror)
```
#### Example
Initialize settings for the test collection run in the collection folder's pre-request script.

```JavaScript
utils.run.once(pm, "Client_Credentials_Flow_Tests", function() {
    console.log("This code will be executed once in the begining of the test collection run.");
}, function() {
    console.log("This code will be executed if an error occurs in code above.");
});
```

### `utils.run.always`
Invokes code in the specified custom inline function for every request during test collection run.

#### Prototype
```JavaScript
utils.run.always(pm, name, process, onerror)
```

#### Example

Initialize settings for the test collection run in the collection folder's pre-request script.
```JavaScript
utils.run.always(pm, "Client_Credentials_Flow_Tests", function() {
    console.log("This code will be executed for every test.");
}, function() {
    console.log("This code will be executed if an error occurs in code above.");
});
```

## Primary test functions
Use primary test functions to initialize and execute tests. Primary test functions are grouped under the `utils.test` namespace and include:
* [`utils.test.initialize`](#utilstestinitialize):
Use to initialize request data in pre-request scripts.
* [`utils.test.positive`](#utilstestpositive):
Use to execute positive tests.
* [`utils.test.negative`](#utilstestnegative):
Use to execute negative tests.
* [`utils.test.neutral`](#utilstestneutral):
Use if you need to execute additional tests that must run separately from the primary (positive or negative) test defined for a request.

### Parameters
The following parameters are common to all primary test functions:

* `name`:
All primary test functions require the `name` parameter to hold the unique name of the request (or test). In most cases, instead of hard coding request (or test name), pass the `null` value and the functions will set the name to the global `pm.info.requestName` property holding the name of the request. You should only specify an explicitly defined name if you run multiple tests for a single request, so that you can differentiate between them in the test logs.
* `process`:
Inline function containing the code to be executed (this function is optional for `utils.test.positive` and `utils.test.negative` functions because they already provide the minimal test functionality that may be sufficient for certain cases).
* `onerror`:
The optional error handler that can be handy if you need to implement special logic (like stopping test execution or skipping to a specific test) on operation failure in the default or custom `process` function.

### `utils.test.initialize`
Use to initialize request data in pre-request scripts.

#### Prototype
```JavaScript
utils.test.initialize(pm, name, process, onerror)
```

#### Example
```JavaScript
utils.test.initialize(pm, null, function() {
    console.log("Add initialization logic here.");
}, function() {
    console.log("This code will be executed if an error occurs in code above.");
});
```

### `utils.test.positive`
Use to run positive tests. By default, it will check the response's HTTP status code against the specified value. If the returned HTTP status code matches the expected value, this function will call additional custom code if one is specified via the `process` parameter.

#### Prototype
```JavaScript
utils.test.positive(pm, name, status, process, onerror)
```

#### Parameters
* `status`:
Expected HTTP status code returned in HTTP response (default value: `200`; it is recommended to explicitly set the expected value).

#### Examples
A positive test that only checks for the default `200 OK` HTTP status code passed in the HTTP response.
```JavaScript
utils.test.positive(pm);
```

A positive test that only checks for the `204 No Content` HTTP status code passed in the HTTP response.
```JavaScript
utils.test.positive(pm, null, 204);
```

A positive test that checks for the `200 OK` HTTP status code passed in the HTTP response and implements additional check.
```JavaScript
utils.test.positive(pm, null, 200, function() {
    console.log("Add custom validation checks here.");
});
```

A positive test that checks for the `200 OK` HTTP status code passed in the HTTP response and implements additional check and error handling.
```JavaScript
utils.test.positive(pm, null, 200, function() {
    console.log("Add custom validation checks here.");
}, function() {
    console.log("This code will be executed if an error occurs in code above or default test logic.");
});
```

### `utils.test.negative`
Use to run negative tests. By default, it will check the response's HTTP status code against the specified value. If the returned HTTP status code matches the expected value, this function will also check the value of the `serviceCode` (or similar) property defined in the data object returned in HTTP response. You can also add additional checks in the custom code defined in the `process` parameter.

#### Prototype
```JavaScript
utils.test.negative(pm, name, status, serviceCode, process, onerror)
```

#### Parameters
* `status`:
Expected HTTP status code returned in HTTP response (default value: `400`; it is recommended to explicitly set the expected value).
* `serviceCode`:
Optional string value of the property holding error code returned by the HTTP response. By default, the name of the property is expected to be `serviceCode`. To check a different property, add the name followed by the colon(`:`) or equal (`=`) character before the expected value, such as `'errorCode=IllegalOperation'`.

#### Examples
A negative test that only checks for the default `400 Bad Request` HTTP status code passed in the HTTP response.
```JavaScript
utils.test.negative(pm);
```

A negative test that only checks for the `401 Unauthorized` HTTP status code passed in the HTTP response.
```JavaScript
utils.test.negative(pm, null, 401);
```

A negative test that checks for the `400 Bad Request` HTTP status code passed in the HTTP response and the specified `serviceCode` returned via response data.
```JavaScript
utils.test.negative(pm, null, null, 'IllegalNameValue');
```

A negative test that checks for the `401 Unauthorized` HTTP status code passed in the HTTP response and the specified `errorCode` returned via response data.
```JavaScript
utils.test.negative(pm, null, 401, 'errorCode:CallerIsNotAdmin');
```

A negative test that checks for the `400 Bad Request` HTTP status code passed in the HTTP response and implements additional check.
```JavaScript
utils.test.negative(pm, null, 400, null, function() {
    console.log("Add custom validation checks here.");
});
```

A negative test that checks for the `404 Not Found` HTTP status code passed in the HTTP response and implements additional check and error handling.
```JavaScript
utils.test.negative(pm, null, 404, null, function() {
    console.log("Add custom validation checks here.");
}, function() {
    console.log("This code will be executed if an error occurs in code above or default test logic.");
});
```

### `utils.test.neutral`
This function is intended for a rare case when you need to implement multiple tests for the same request. It is similar to the `utils.test.positive` and `utils.test.negative` functions, except it does not perform any default validation and totally relies on the custom test code specified by the caller in the `process` parameter. Also, because multiple tests are associated with the request, it is recommended to give each of them a unique name (for example, you can append an incremented index to the default test name as illustrated in the example below). Generally, you should avoid using this function.

#### Prototype
```JavaScript
utils.test.neutral(pm, name, process, onerror)
```

#### Example
A positive test that checks for the returned `200 OK` HTTP status code and some custom validation followed by two additional tests.
```JavaScript
var i = 1;

utils.test.positive(pm, utils.name(pm, null, i++),  200, function() {
    console.log("Add custom validation checks here.");
});

utils.test.neutral(pm, utils.name(pm, null, i++), function() {
    console.log("Add more custom validation checks here.");
});

utils.test.neutral(pm, utils.name(pm, null, i++), function() {
    console.log("Add even more custom validation checks here.");
});
```

## Data validation functions
Use data validation functions to check data returned by the HTTP response object. Data validation functions are grouped under the `utils.expect` namespace in three categories:

* [**Response validation functions**](#response-validation-functions) for checking HTTP response data
* [**Property validation functions**](#property-validation-functions) for checking object properties
* [**String validation functions**](#string-validation-functions) for checking string property values

## Response validation functions
Response validation functions check the type of data returned in HTTP response. They are grouped under the `utils.expect.response` namespace and include:

* [`utils.expect.response.text`](#utilsexpectresponsetext):
Expects HTTP response to return a simple data type, such as string.
* [`utils.expect.response.json`](#utilsexpectresponsejson):
Expects HTTP response to return any JSON object.
* [`utils.expect.response.one`](#utilsexpectresponseone):
Expects HTTP response to return a single JSON element.
* [`utils.expect.response.many`](#utilsexpectresponsemany):
Expects HTTP response to return a JSON collection.
* [`utils.expect.response.empty`](#utilsexpectresponseempty):
Expects HTTP response to return an empty JSON collection.
* [`utils.expect.response.nonempty`](#utilsexpectresponsenonempty):
Expects HTTP response to return a non-empty JSON collection.
* [`utils.expect.response.unique`](#utilsexpectresponseunique):
Expects HTTP response to return a JSON collection with a single element.

### `utils.expect.response.text`
Expects HTTP response to return a simple (not the JSON) data type, such as string.

#### Prototype
```JavaScript
utils.expect.response.text(pm)
```

#### Example
Check if the HTTP response data can be initialized as text.
```JavaScript
utils.expect.response.text(pm);
```

### `utils.expect.response.json`
Expects HTTP response to return any JSON object. It can be a single element, a collection, an empty collection, basically, anything that comes in a JSON format.

#### Prototype
```JavaScript
utils.expect.response.json(pm)
```

#### Example
Check if the HTTP response data contains a JSON object.
```JavaScript
utils.expect.response.json(pm);
```

### `utils.expect.response.one`
Expects HTTP response to return a single JSON element (not a collection and not a collection with a single item).

#### Prototype
```JavaScript
utils.expect.response.one(pm)
```

#### Example
Check if the HTTP response data contains a single JSON element.
```JavaScript
utils.expect.response.one(pm);
```

### `utils.expect.response.many`
Expects HTTP response to return a JSON collection (can be empty or contain the specified minimum and/or maximum number of items). The `utils.expect.response.many` function can be called via one of these shortcuts:

* [`utils.expect.response.empty`](#utilsexpectresponseempty) to check for an empty collection
* [`utils.expect.response.nonempty`](#utilsexpectresponsenonempty) to check for a non-empty collection
* [`utils.expect.response.unique`](#utilsexpectresponseunique) to check for a collection with a single (unique) item

#### Prototype
```JavaScript
utils.expect.response.many(pm, min = 0, max = -1)
```

#### Parameters
* `min`:
Minimum number of expected items in the collection (default value: `0`).
* `max`:
Maximum number of expected items in the collection (default value: `-1`; indicates that there is no maximum limit).

#### Example
Check if the HTTP response data contains a JSON collection with at least 2 and at most 10 items.
```JavaScript
utils.expect.response.many(pm, 2, 10);
```

### `utils.expect.response.empty`
Expects HTTP response to return an empty JSON collection (but not `null`).

#### Prototype
```JavaScript
utils.expect.response.empty(pm)
```

#### Example
Check if the HTTP response data contains an empty JSON collection (but not `null`).
```JavaScript
utils.expect.response.empty(pm);
```

### `utils.expect.response.nonempty`
Expects HTTP response to return a non-empty JSON collection (one or more items).

#### Prototype
```JavaScript
utils.expect.response.nonempty(pm)
```

#### Example
Check if the HTTP response data contains a JSON collection with at least one item.
```JavaScript
utils.expect.response.nonempty(pm);
```

### `utils.expect.response.unique`
Expects HTTP response to return a JSON collection with a single element (but not a single element matching the condition of the utils.expect.response.one function).

#### Prototype
```JavaScript
utils.expect.response.unique(pm)
```

#### Example
Check if the  HTTP response contains a JSON collection with a single element.

```JavaScript
utils.expect.response.unique(pm);
```

## Property validation functions
Property validation functions check the named property of the specified object. The primary benefits of these functions (compared to the underlying [Chai assertions](https://www.chaijs.com/api/bdd/) they use) is that that they always check to make sure that the property exist before additional validation (so you can skip one test step) and generate more complete error messages on assertion failures (the default assertion errors do not mention named of the properties being checked, which makes them not that useful). Property validation functions are grouped under the `utils.expect.property` namespace and include:

* [`utils.expect.property.exist`](#utilsexpectpropertyexist):
Expects the specified object to have a property with the given name.
* [`utils.expect.property.notexist`](#utilsexpectpropertynotexist):
Expects the specified object to not have a property with the given name.
* [`utils.expect.property.equal`](#utilsexpectpropertyequal):
Expects a named property of the specified object to be equal to the specific value.
* [`utils.expect.property.notequal`](#utilsexpectpropertynotequal):
Expects a named property of the specified object to not be equal to the specific value.

### Parameters
The following parameters are common to all property validation functions:

* `data`:
Data object which property is being checked.
* `name`:
Name of the property being checked.

### `utils.expect.property.exist`
Expects the specified object to have a property with the given name.

#### Prototype
```JavaScript
utils.expect.property.exist(pm, data, name)
```

#### Example
Check if the JSON object returned in the HTTP response contains a property `id`.

```JavaScript
var response = pm.response.json();
utils.expect.property.exist(pm, response, "id");
```

### `utils.expect.property.notexist`
Expects the specified object to not have a property with the given name.

#### Prototype
```JavaScript
utils.expect.property.notexist(pm, data, name)
```

#### Example
Check if the JSON object returned in the HTTP response does not contain a property `id`.

```JavaScript
var response = pm.response.json();
utils.expect.property.notexist(pm, response, "id");
```

### `utils.expect.property.equal`:
Expects a named property of the specified object to be equal to the specific value (can be any simple data type, such as boolean, integer, etc.).

#### Prototype
```JavaScript
utils.expect.property.equal(pm, data, name, value)
```

#### Parameters
* `value`:
Expected property value held by the specified object property (can be any simple data type including `null`).

#### Example
Check if the JSON object returned in the HTTP response contains a property `active` holding the boolean value of `true`.

```JavaScript
var response = pm.response.json();
utils.expect.property.equal(pm, response, "active", true);
```

### `utils.expect.property.notequal`:
Expects a named property of the specified object to not be equal to the specific value (can be any simple data type, such as boolean, integer, etc.).

#### Parameters
* `value`:
Expected property that the specified object property should not hold (can be any simple data type including `null`).

#### Example
Check if the JSON object returned in the HTTP response contains a property `active` that does not hold the value of `true`.

```JavaScript
var response = pm.response.json();
utils.expect.property.notequal(pm, response, "active", true);
```

## String validation functions
String validation functions are a subset of property validation functions that focus on string properties. They are grouped under the `utils.expect.property.string` namespace and include:

* [`utils.expect.property.string.exact`](#utilsexpectpropertystringexact):
Expects the named object property to be equal to the specified string value.
* [`utils.expect.property.string.partial`](#utilsexpectpropertystringpartial):
Expects the named object property to be contain the specified string value.
* [`utils.expect.property.string.start`](#utilsexpectpropertystringstart):
Expects the named object property to start with the specified string value.
* [`utils.expect.property.string.end`](#utilsexpectpropertystringend):
Expects the named object property to end with the specified string value.
* [`utils.expect.property.string.match`](#utilsexpectpropertystringmatch):
Expects the named object property to match the specified regular expression.

### Parameters

* `data`:
Data object which string property is being checked.
* `name`:
Name of the string property being checked.
* `value`:
String value to be checked against (can be `null`).

### `utils.expect.property.string.exact`
Expects the named object property to be equal to the specified string value.

#### Prototype
```JavaScript
utils.expect.property.string.exact(pm, data, name, value, ignoreCase)
```
#### Parameters
* `ignoreCase`:
Indicates whether string comparison should be case insensitive (default value: `false`).

#### Example
Check if the JSON object returned in the HTTP response contains the string property `name` holding the value of `John` (check is case sensitive).

```JavaScript
var response = pm.response.json();
utils.expect.property.string.exact(pm, response, "name", "John");
```

### `utils.expect.property.string.partial`
Expects the named object property to be contain the specified string value.

#### Prototype
```JavaScript
utils.expect.property.string.partial(pm, data, name, value, ignoreCase)
```
#### Parameters
* `ignoreCase`:
Indicates whether string comparison should be case insensitive (default value: `false`).

#### Example
Check if the JSON object returned in the HTTP response contains the string property `name` holding the value of `John` anywhere in the string, e.g. `John Jr.` or `Big John` (check is case sensitive).

```JavaScript
var response = pm.response.json();
utils.expect.property.string.partial(pm, response, "name", "John");
```

### `utils.expect.property.string.start`
Expects the named object property to start with the specified string value.

#### Prototype
```JavaScript
utils.expect.property.string.start(pm, data, name, value, ignoreCase)
```
#### Parameters
* `ignoreCase`:
Indicates whether string comparison should be case insensitive (default value: `false`).

#### Example
Check if the JSON object returned in the HTTP response contains the string property `name` holding the value of `John` in the beginning of the string, e.g. `John Jr.` (check is case sensitive).

```JavaScript
var response = pm.response.json();
utils.expect.property.string.start(pm, response, "name", "John");
```

### `utils.expect.property.string.end`
Expects the named object property to end with the specified string value.

#### Prototype
```JavaScript
utils.expect.property.string.end(pm, data, name, value, ignoreCase)
```
#### Parameters
* `ignoreCase`:
Indicates whether string comparison should be case insensitive (default value: `false`).

#### Example
Check if the JSON object returned in the HTTP response contains the string property `name` holding the value of `John` at the end of the string, e.g. `Big John` (check is case sensitive).

```JavaScript
var response = pm.response.json();
utils.expect.property.string.end(pm, response, "name", "John");
```

### `utils.expect.property.string.match`
Expects the named object property to match the specified regular expression.

#### Prototype
```JavaScript
utils.expect.property.string.match(pm, data, name, value)
```

#### Example
Check if the JSON object returned in the HTTP response contains the string property `name` holding the value that matches a regular expression `/^John$/`.

```JavaScript
var response = pm.response.json();
utils.expect.property.string.match(pm, response, "name", /^John$/);
```

## Trace functions
Trace functions print trace messages that can indicate the start and end of pre-request and test script execution. You can also customize trace function to print your custom trace messages.

### Trace levels
There are three default trace levels:
* `0`:
Trace logs are turned off.
* `1`:
Trace logs reflect only only script start calls.
* `2`:
Trace logs reflect both function start and end calls.

You can use your own custom trace levels higher than level 2.

Trace functions belong to the `utils.trace` namespace and are divided into two groups:
* [**Trace initialization**](#trace-initialization) for setting trace level
* [**Trace logging**](#trace-logging) for writing trace log messages

### Trace initialization
To set the trace level (which will be stored in an environment variable for the duration of the test collection run), call one of the trace initialization functions from the test collection's pre-request folder (you only need to do this once). Trace initialization functions belong to the `utils.trace.set` namespace and include:

* `utils.trace.set.none(pm)`:
Sets trace level to `0`.
* `utils.trace.set.minimal(pm)`:
Sets trace level to `1`.
* `utils.trace.set.default`:
Same as `utils.trace.set.all(pm)`.
* `utils.trace.set.all(pm)`:
Sets trace level to `2`.
* `utils.trace.set.custom(pm, level)`:
Use this to set any custom trace level (parameter `level` is expected to hold a positive integer value).

#### Example
Set trace level to log both start and end of the scrips (when called from the test collection folder's pre-request script).
```JavaScript
utils.run.once(pm, "Client_Credentials_Flow_Tests", function() {
    utils.trace.set.all(pm);
});
```

### Trace logging
Both, the [folder level](#folder-level-functions) and the [primary test functions](#primary-test-functions) already call the trace function to log the start and/or end of the operation, but if you want to add your own trace messages, you can do it via following function:

* `utils.trace.log(pm, message, level)`

The `utils.trace.log` function takes the trace message and the log level values. It will compare the log level to the level initialized via one of the `utils.trace.set` functions (or the default) and if the specified level is the same or lower than the trace message will be logged; otherwise, it will be suppressed.

#### Example
The following message will be only printed to console if the trace level is set to the custom value of `3` or higher (e.g. via `utils.trace.set.custom(pm, 3)`).
```JavaScript
utils.trace.log(pm, "This message will be printed only if current trace level of '3' or higher.", 3);
```

## General-purpose functions
General-purpose functions include:
* [`utils.name`](#utilsname):
Builds the name of the test to be used in primary test functions or elsewhere.
* [`utils.wait`](#utilswait):
Pauses script execution for the specified number of seconds or milliseconds.
* [`utils.stop`](#utilsstop):
Stops test execution.
* [`utils.skip`](#utilsskip):
Skips test execution to the specified test.

### `utils.name`
Builds the name of the test to be used in primary test functions or elsewhere. This function is used internally, but you can use it if you need to reference or build a non-default test name (i.e. name of the test that does not match the `pm.info.requestName` value).

#### Prototype
```JavaScript
utils.name(pm, name, suffix)
```
#### Parameters
* `name`:
Name of the test. If not specified, `pm.info.requestName` will be used.

* `suffix`:
If specified, the value will be appended to the `name` parameter.

#### Example
Logs name of the request with auto-incremented suffix.
```JavaScript
var i = 1;
console.log(utils.name(pm, null, i++));
console.log(utils.name(pm, null, i++));
```

### `utils.wait`
Pauses script execution for the specified number of seconds or milliseconds.

#### Prototype
```JavaScript
utils.wait(pm, timeout, seconds = true)
```

#### Parameters
* `timeout`:
Sleep/wait time in seconds (default) or milliseconds.

* `seconds`:
Indicates whether timeout is specified in seconds (default or if the value is `true`) or milliseconds (if the value is `false`).

#### Example
Pause execution for 5 seconds.
```JavaScript
utils.wait(pm, 5);
```

### `utils.stop`:
Stops test execution.

#### Prototype
```JavaScript
utils.stop(pm, timeout, seconds = true)
```

#### Example
Stop test run.
```JavaScript
utils.stop(pm);
```

### `utils.skip`:
Skips test execution to the specified test.

#### Prototype
```JavaScript
utils.skip(pm, name)
```

#### Parameters
* `name`:
Name of the test case in the running collection which will be executed next.

#### Example
Skip test execution to the request with the name 'User-Get-Positive-ById'.
```JavaScript
utils.skip(pm, "User-Get-Positive-ById");
```

## Miscellaneous functions
The undocumented functions and properties are intended for internal use and unless you want to extend or rewrite the framework, you should not care about them.

## Resources
* [**Chai Assertion Library**](https://www.chaijs.com/)
* [**Online Chai Assertion Tester**](https://jsfiddle.net/alekdavis/Lsg1uj27/)
