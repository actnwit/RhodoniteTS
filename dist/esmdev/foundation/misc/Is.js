// src/foundation/misc/Is.ts
var IsObj = {
  /**
   * Checks if a value is defined (not undefined).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not undefined
   */
  defined(val, ..._args) {
    return val !== void 0;
  },
  /**
   * Checks if a value is undefined.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is undefined
   */
  undefined(val, ..._args) {
    return val === void 0;
  },
  /**
   * Checks if a value is null.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is null
   */
  null(val, ..._args) {
    return val === null;
  },
  /**
   * Checks if a value exists (is neither null nor undefined).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not null and not undefined
   */
  exist(val, ..._args) {
    return val !== null && val !== void 0;
  },
  /**
   * Checks if a value is a function.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is a function
   */
  function(val, ..._args) {
    return typeof val === "function";
  },
  /**
   * Checks if a value is strictly equal to true.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is exactly true
   */
  true(val, ..._args) {
    return val === true;
  },
  /**
   * Checks if a value is truthy (converts to true in boolean context).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is truthy
   */
  truly(val, ..._args) {
    return !!val;
  },
  /**
   * Checks if a value is strictly equal to false.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is exactly false
   */
  false(val, ..._args) {
    return val === false;
  },
  /**
   * Checks if a value is falsy (converts to false in boolean context).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is falsy
   */
  falsy(val, ..._args) {
    return !val;
  },
  /**
   * Checks if a string contains another string.
   * @param thisStr - The string to search in
   * @param queryStr - The string to search for
   * @returns True if thisStr contains queryStr
   */
  stringContaining(thisStr, queryStr) {
    return thisStr.indexOf(queryStr) !== -1;
  }
};
var Derivatives = {
  /**
   * Creates a negated version of a validation function.
   * @param fn - The function to negate
   * @returns A function that returns the opposite result of the input function
   */
  not(fn) {
    return function() {
      return fn.apply(null, [...arguments]);
    };
  },
  /**
   * Creates a function that checks if all values pass the validation.
   * @param fn - The validation function to apply to all values
   * @returns A function that returns true if all values pass validation
   */
  all(fn) {
    return function() {
      if (Array.isArray(arguments[0])) {
        return arguments[0].every(fn);
      }
      return [...arguments].every(fn);
    };
  },
  /**
   * Creates a function that checks if any value passes the validation.
   * @param fn - The validation function to apply to values
   * @returns A function that returns true if any value passes validation
   */
  any(fn) {
    return function() {
      if (Array.isArray(arguments[0])) {
        return arguments[0].some(fn);
      }
      return [...arguments].some(fn);
    };
  }
};
var NotObj = {
  /**
   * Checks if a value is undefined (negated version of defined).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is undefined
   */
  defined(val, ..._args) {
    return val === void 0;
  },
  /**
   * Checks if a value is defined (negated version of undefined).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not undefined
   */
  undefined(val, ..._args) {
    return val !== void 0;
  },
  /**
   * Checks if a value is not null.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not null
   */
  null(val, ..._args) {
    return val !== null;
  },
  /**
   * Checks if a value does not exist (is null or undefined).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is null or undefined
   */
  exist(val, ..._args) {
    return val === null || val === void 0;
  },
  /**
   * Checks if a value is not a function.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not a function
   */
  function(val, ..._args) {
    return typeof val !== "function";
  },
  /**
   * Checks if a value is not strictly equal to true.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not exactly true
   */
  true(val, ..._args) {
    return val !== true;
  },
  /**
   * Checks if a value is not truthy (negated version of truly).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not truthy
   */
  truly(val, ..._args) {
    return !val;
  },
  /**
   * Checks if a value is not strictly equal to false.
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not exactly false
   */
  false(val, ..._args) {
    return val !== false;
  },
  /**
   * Checks if a value is not falsy (negated version of falsy).
   * @param val - The value to check
   * @param args - Additional arguments (unused)
   * @returns True if the value is not falsy
   */
  falsy(val, ..._args) {
    return !!val;
  }
};
for (const subFn in Derivatives) {
  if (Object.hasOwn(Derivatives, subFn)) {
    IsObj[subFn] = {};
    for (const fn in IsObj) {
      if (Object.hasOwn(IsObj, fn)) {
        if (subFn === "not") {
          IsObj[subFn][fn] = Derivatives[subFn](NotObj[fn]);
        } else {
          IsObj[subFn][fn] = Derivatives[subFn](IsObj[fn]);
        }
      }
    }
  }
}
var Is = IsObj;
export {
  Is,
  IsObj
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWlzYy9Jcy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gSW5zcGlyZWQgYnkgaHR0cHM6Ly9naXRodWIuY29tL2Vucmljb21hcmluby9pc1xudHlwZSBGblR5cGUgPSAodmFsOiB1bmtub3duKSA9PiBib29sZWFuO1xuXG4vKipcbiAqIEEgdXRpbGl0eSBvYmplY3QgY29udGFpbmluZyB2YXJpb3VzIHR5cGUgY2hlY2tpbmcgYW5kIHZhbGlkYXRpb24gZnVuY3Rpb25zLlxuICogUHJvdmlkZXMgbWV0aG9kcyB0byBjaGVjayBpZiB2YWx1ZXMgYXJlIGRlZmluZWQsIG51bGwsIGZ1bmN0aW9ucywgdHJ1dGh5L2ZhbHN5LCBldGMuXG4gKiBBbHNvIGluY2x1ZGVzIGRlcml2YXRpdmUgbWV0aG9kcyBsaWtlIGBub3RgLCBgYWxsYCwgYW5kIGBhbnlgIGZvciBtb3JlIGNvbXBsZXggdmFsaWRhdGlvbnMuXG4gKi9cbmV4cG9ydCBjb25zdCBJc09iaiA9IHtcbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIHZhbHVlIGlzIGRlZmluZWQgKG5vdCB1bmRlZmluZWQpLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIGNoZWNrXG4gICAqIEBwYXJhbSBhcmdzIC0gQWRkaXRpb25hbCBhcmd1bWVudHMgKHVudXNlZClcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdmFsdWUgaXMgbm90IHVuZGVmaW5lZFxuICAgKi9cbiAgZGVmaW5lZCh2YWw6IHVua25vd24sIC4uLl9hcmdzOiB1bmtub3duW10pOiB2YWwgaXMgRXhjbHVkZTxPYmplY3QsIHVuZGVmaW5lZD4ge1xuICAgIHJldHVybiB2YWwgIT09IHZvaWQgMDtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgdmFsdWUgaXMgdW5kZWZpbmVkLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIGNoZWNrXG4gICAqIEBwYXJhbSBhcmdzIC0gQWRkaXRpb25hbCBhcmd1bWVudHMgKHVudXNlZClcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdmFsdWUgaXMgdW5kZWZpbmVkXG4gICAqL1xuICB1bmRlZmluZWQodmFsOiB1bmtub3duLCAuLi5fYXJnczogdW5rbm93bltdKTogdmFsIGlzIHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHZhbCA9PT0gdm9pZCAwO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSB2YWx1ZSBpcyBudWxsLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIGNoZWNrXG4gICAqIEBwYXJhbSBhcmdzIC0gQWRkaXRpb25hbCBhcmd1bWVudHMgKHVudXNlZClcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdmFsdWUgaXMgbnVsbFxuICAgKi9cbiAgbnVsbCh2YWw6IHVua25vd24sIC4uLl9hcmdzOiB1bmtub3duW10pOiB2YWwgaXMgbnVsbCB7XG4gICAgcmV0dXJuIHZhbCA9PT0gbnVsbDtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgdmFsdWUgZXhpc3RzIChpcyBuZWl0aGVyIG51bGwgbm9yIHVuZGVmaW5lZCkuXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgdmFsdWUgdG8gY2hlY2tcbiAgICogQHBhcmFtIGFyZ3MgLSBBZGRpdGlvbmFsIGFyZ3VtZW50cyAodW51c2VkKVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB2YWx1ZSBpcyBub3QgbnVsbCBhbmQgbm90IHVuZGVmaW5lZFxuICAgKi9cbiAgZXhpc3QodmFsPzogdW5rbm93biwgLi4uX2FyZ3M6IHVua25vd25bXSk6IHZhbCBpcyBPYmplY3Qge1xuICAgIHJldHVybiB2YWwgIT09IG51bGwgJiYgdmFsICE9PSB1bmRlZmluZWQ7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIHZhbHVlIGlzIGEgZnVuY3Rpb24uXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgdmFsdWUgdG8gY2hlY2tcbiAgICogQHBhcmFtIGFyZ3MgLSBBZGRpdGlvbmFsIGFyZ3VtZW50cyAodW51c2VkKVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB2YWx1ZSBpcyBhIGZ1bmN0aW9uXG4gICAqL1xuICBmdW5jdGlvbih2YWw6IHVua25vd24sIC4uLl9hcmdzOiB1bmtub3duW10pOiB2YWwgaXMgRnVuY3Rpb24ge1xuICAgIHJldHVybiB0eXBlb2YgdmFsID09PSAnZnVuY3Rpb24nO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSB2YWx1ZSBpcyBzdHJpY3RseSBlcXVhbCB0byB0cnVlLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIGNoZWNrXG4gICAqIEBwYXJhbSBhcmdzIC0gQWRkaXRpb25hbCBhcmd1bWVudHMgKHVudXNlZClcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdmFsdWUgaXMgZXhhY3RseSB0cnVlXG4gICAqL1xuICB0cnVlKHZhbDogdW5rbm93biwgLi4uX2FyZ3M6IHVua25vd25bXSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB2YWwgPT09IHRydWU7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIHZhbHVlIGlzIHRydXRoeSAoY29udmVydHMgdG8gdHJ1ZSBpbiBib29sZWFuIGNvbnRleHQpLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIGNoZWNrXG4gICAqIEBwYXJhbSBhcmdzIC0gQWRkaXRpb25hbCBhcmd1bWVudHMgKHVudXNlZClcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdmFsdWUgaXMgdHJ1dGh5XG4gICAqL1xuICB0cnVseSh2YWw6IHVua25vd24sIC4uLl9hcmdzOiB1bmtub3duW10pOiBib29sZWFuIHtcbiAgICByZXR1cm4gISF2YWw7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIHZhbHVlIGlzIHN0cmljdGx5IGVxdWFsIHRvIGZhbHNlLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIGNoZWNrXG4gICAqIEBwYXJhbSBhcmdzIC0gQWRkaXRpb25hbCBhcmd1bWVudHMgKHVudXNlZClcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdmFsdWUgaXMgZXhhY3RseSBmYWxzZVxuICAgKi9cbiAgZmFsc2UodmFsOiB1bmtub3duLCAuLi5fYXJnczogdW5rbm93bltdKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHZhbCA9PT0gZmFsc2U7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIHZhbHVlIGlzIGZhbHN5IChjb252ZXJ0cyB0byBmYWxzZSBpbiBib29sZWFuIGNvbnRleHQpLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIGNoZWNrXG4gICAqIEBwYXJhbSBhcmdzIC0gQWRkaXRpb25hbCBhcmd1bWVudHMgKHVudXNlZClcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdmFsdWUgaXMgZmFsc3lcbiAgICovXG4gIGZhbHN5KHZhbDogdW5rbm93biwgLi4uX2FyZ3M6IHVua25vd25bXSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhdmFsO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSBzdHJpbmcgY29udGFpbnMgYW5vdGhlciBzdHJpbmcuXG4gICAqIEBwYXJhbSB0aGlzU3RyIC0gVGhlIHN0cmluZyB0byBzZWFyY2ggaW5cbiAgICogQHBhcmFtIHF1ZXJ5U3RyIC0gVGhlIHN0cmluZyB0byBzZWFyY2ggZm9yXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhpc1N0ciBjb250YWlucyBxdWVyeVN0clxuICAgKi9cbiAgc3RyaW5nQ29udGFpbmluZyh0aGlzU3RyOiBzdHJpbmcsIHF1ZXJ5U3RyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpc1N0ci5pbmRleE9mKHF1ZXJ5U3RyKSAhPT0gLTE7XG4gIH0sXG59O1xuXG4vKipcbiAqIERlcml2YXRpdmUgZnVuY3Rpb25zIHRoYXQgbW9kaWZ5IHRoZSBiZWhhdmlvciBvZiBiYXNlIHZhbGlkYXRpb24gZnVuY3Rpb25zLlxuICogUHJvdmlkZXMgYG5vdGAsIGBhbGxgLCBhbmQgYGFueWAgbW9kaWZpZXJzIGZvciBtb3JlIGNvbXBsZXggdmFsaWRhdGlvbiBzY2VuYXJpb3MuXG4gKi9cbmNvbnN0IERlcml2YXRpdmVzID0ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5lZ2F0ZWQgdmVyc2lvbiBvZiBhIHZhbGlkYXRpb24gZnVuY3Rpb24uXG4gICAqIEBwYXJhbSBmbiAtIFRoZSBmdW5jdGlvbiB0byBuZWdhdGVcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIG9wcG9zaXRlIHJlc3VsdCBvZiB0aGUgaW5wdXQgZnVuY3Rpb25cbiAgICovXG4gIG5vdChmbjogRm5UeXBlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBmbi5hcHBseShudWxsLCBbLi4uYXJndW1lbnRzXSBhcyBhbnkpO1xuICAgIH07XG4gIH0sXG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IGNoZWNrcyBpZiBhbGwgdmFsdWVzIHBhc3MgdGhlIHZhbGlkYXRpb24uXG4gICAqIEBwYXJhbSBmbiAtIFRoZSB2YWxpZGF0aW9uIGZ1bmN0aW9uIHRvIGFwcGx5IHRvIGFsbCB2YWx1ZXNcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0aGF0IHJldHVybnMgdHJ1ZSBpZiBhbGwgdmFsdWVzIHBhc3MgdmFsaWRhdGlvblxuICAgKi9cbiAgYWxsKGZuOiBGblR5cGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYXJndW1lbnRzWzBdKSkge1xuICAgICAgICByZXR1cm4gYXJndW1lbnRzWzBdLmV2ZXJ5KGZuKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBbLi4uYXJndW1lbnRzXS5ldmVyeShmbik7XG4gICAgfTtcbiAgfSxcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgY2hlY2tzIGlmIGFueSB2YWx1ZSBwYXNzZXMgdGhlIHZhbGlkYXRpb24uXG4gICAqIEBwYXJhbSBmbiAtIFRoZSB2YWxpZGF0aW9uIGZ1bmN0aW9uIHRvIGFwcGx5IHRvIHZhbHVlc1xuICAgKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0cnVlIGlmIGFueSB2YWx1ZSBwYXNzZXMgdmFsaWRhdGlvblxuICAgKi9cbiAgYW55KGZuOiBGblR5cGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkoYXJndW1lbnRzWzBdKSkge1xuICAgICAgICByZXR1cm4gYXJndW1lbnRzWzBdLnNvbWUoZm4pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFsuLi5hcmd1bWVudHNdLnNvbWUoZm4pO1xuICAgIH07XG4gIH0sXG59O1xuXG4vKipcbiAqIE5lZ2F0ZWQgdmVyc2lvbnMgb2YgdGhlIGJhc2UgdmFsaWRhdGlvbiBmdW5jdGlvbnMuXG4gKiBFYWNoIG1ldGhvZCByZXR1cm5zIHRoZSBvcHBvc2l0ZSByZXN1bHQgb2YgaXRzIGNvcnJlc3BvbmRpbmcgbWV0aG9kIGluIElzT2JqLlxuICovXG5jb25zdCBOb3RPYmogPSB7XG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSB2YWx1ZSBpcyB1bmRlZmluZWQgKG5lZ2F0ZWQgdmVyc2lvbiBvZiBkZWZpbmVkKS5cbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBjaGVja1xuICAgKiBAcGFyYW0gYXJncyAtIEFkZGl0aW9uYWwgYXJndW1lbnRzICh1bnVzZWQpXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIHZhbHVlIGlzIHVuZGVmaW5lZFxuICAgKi9cbiAgZGVmaW5lZCh2YWw6IHVua25vd24sIC4uLl9hcmdzOiB1bmtub3duW10pOiB2YWwgaXMgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdmFsID09PSB2b2lkIDA7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIHZhbHVlIGlzIGRlZmluZWQgKG5lZ2F0ZWQgdmVyc2lvbiBvZiB1bmRlZmluZWQpLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIGNoZWNrXG4gICAqIEBwYXJhbSBhcmdzIC0gQWRkaXRpb25hbCBhcmd1bWVudHMgKHVudXNlZClcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdmFsdWUgaXMgbm90IHVuZGVmaW5lZFxuICAgKi9cbiAgdW5kZWZpbmVkKHZhbDogdW5rbm93biwgLi4uX2FyZ3M6IHVua25vd25bXSk6IHZhbCBpcyBPYmplY3Qge1xuICAgIHJldHVybiB2YWwgIT09IHZvaWQgMDtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgdmFsdWUgaXMgbm90IG51bGwuXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgdmFsdWUgdG8gY2hlY2tcbiAgICogQHBhcmFtIGFyZ3MgLSBBZGRpdGlvbmFsIGFyZ3VtZW50cyAodW51c2VkKVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB2YWx1ZSBpcyBub3QgbnVsbFxuICAgKi9cbiAgbnVsbCh2YWw6IHVua25vd24sIC4uLl9hcmdzOiB1bmtub3duW10pOiB2YWwgaXMgT2JqZWN0IHtcbiAgICByZXR1cm4gdmFsICE9PSBudWxsO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSB2YWx1ZSBkb2VzIG5vdCBleGlzdCAoaXMgbnVsbCBvciB1bmRlZmluZWQpLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIGNoZWNrXG4gICAqIEBwYXJhbSBhcmdzIC0gQWRkaXRpb25hbCBhcmd1bWVudHMgKHVudXNlZClcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdmFsdWUgaXMgbnVsbCBvciB1bmRlZmluZWRcbiAgICovXG4gIGV4aXN0KHZhbD86IHVua25vd24sIC4uLl9hcmdzOiB1bmtub3duW10pOiB2YWwgaXMgdW5kZWZpbmVkIHwgbnVsbCB7XG4gICAgcmV0dXJuIHZhbCA9PT0gbnVsbCB8fCB2YWwgPT09IHVuZGVmaW5lZDtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgdmFsdWUgaXMgbm90IGEgZnVuY3Rpb24uXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgdmFsdWUgdG8gY2hlY2tcbiAgICogQHBhcmFtIGFyZ3MgLSBBZGRpdGlvbmFsIGFyZ3VtZW50cyAodW51c2VkKVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB2YWx1ZSBpcyBub3QgYSBmdW5jdGlvblxuICAgKi9cbiAgZnVuY3Rpb24odmFsOiB1bmtub3duLCAuLi5fYXJnczogdW5rbm93bltdKTogdmFsIGlzIEV4Y2x1ZGU8dW5rbm93biwgRnVuY3Rpb24+IHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbCAhPT0gJ2Z1bmN0aW9uJztcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgdmFsdWUgaXMgbm90IHN0cmljdGx5IGVxdWFsIHRvIHRydWUuXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgdmFsdWUgdG8gY2hlY2tcbiAgICogQHBhcmFtIGFyZ3MgLSBBZGRpdGlvbmFsIGFyZ3VtZW50cyAodW51c2VkKVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB2YWx1ZSBpcyBub3QgZXhhY3RseSB0cnVlXG4gICAqL1xuICB0cnVlKHZhbDogdW5rbm93biwgLi4uX2FyZ3M6IHVua25vd25bXSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB2YWwgIT09IHRydWU7XG4gIH0sXG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIHZhbHVlIGlzIG5vdCB0cnV0aHkgKG5lZ2F0ZWQgdmVyc2lvbiBvZiB0cnVseSkuXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgdmFsdWUgdG8gY2hlY2tcbiAgICogQHBhcmFtIGFyZ3MgLSBBZGRpdGlvbmFsIGFyZ3VtZW50cyAodW51c2VkKVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB2YWx1ZSBpcyBub3QgdHJ1dGh5XG4gICAqL1xuICB0cnVseSh2YWw6IHVua25vd24sIC4uLl9hcmdzOiB1bmtub3duW10pOiBib29sZWFuIHtcbiAgICByZXR1cm4gIXZhbDtcbiAgfSxcblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgdmFsdWUgaXMgbm90IHN0cmljdGx5IGVxdWFsIHRvIGZhbHNlLlxuICAgKiBAcGFyYW0gdmFsIC0gVGhlIHZhbHVlIHRvIGNoZWNrXG4gICAqIEBwYXJhbSBhcmdzIC0gQWRkaXRpb25hbCBhcmd1bWVudHMgKHVudXNlZClcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdmFsdWUgaXMgbm90IGV4YWN0bHkgZmFsc2VcbiAgICovXG4gIGZhbHNlKHZhbDogdW5rbm93biwgLi4uX2FyZ3M6IHVua25vd25bXSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB2YWwgIT09IGZhbHNlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSB2YWx1ZSBpcyBub3QgZmFsc3kgKG5lZ2F0ZWQgdmVyc2lvbiBvZiBmYWxzeSkuXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgdmFsdWUgdG8gY2hlY2tcbiAgICogQHBhcmFtIGFyZ3MgLSBBZGRpdGlvbmFsIGFyZ3VtZW50cyAodW51c2VkKVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB2YWx1ZSBpcyBub3QgZmFsc3lcbiAgICovXG4gIGZhbHN5KHZhbDogdW5rbm93biwgLi4uX2FyZ3M6IHVua25vd25bXSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhIXZhbDtcbiAgfSxcbn07XG5cbnR5cGUgSXNJbXBsVHlwZSA9IHR5cGVvZiBJc09iajtcbi8vIGludGVyZmFjZSBJc0ltcGxUeXBlIHtcbi8vICAgW3M6IHN0cmluZ106IHtbczogc3RyaW5nXTogRm5UeXBlfTtcbi8vIH1cblxuLyoqXG4gKiBFeHRlbmRlZCBpbnRlcmZhY2UgdGhhdCBpbmNsdWRlcyB0aGUgYmFzZSB2YWxpZGF0aW9uIG1ldGhvZHMgcGx1cyBkZXJpdmF0aXZlIG1ldGhvZHMuXG4gKiBQcm92aWRlcyBgbm90YCwgYGFsbGAsIGFuZCBgYW55YCBtb2RpZmllcnMgZm9yIGNvbXBsZXggdmFsaWRhdGlvbiBzY2VuYXJpb3MuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSXNUeXBlIGV4dGVuZHMgSXNJbXBsVHlwZSB7XG4gIG5vdDogdHlwZW9mIE5vdE9iajtcbiAgYWxsOiB0eXBlb2YgSXNPYmo7XG4gIGFueTogdHlwZW9mIElzT2JqO1xufVxuXG4vLyBBZGQgZGVyaXZhdGl2ZXMgdG8gdGhlIElzT2JqXG5mb3IgKGNvbnN0IHN1YkZuIGluIERlcml2YXRpdmVzKSB7XG4gIGlmIChPYmplY3QuaGFzT3duKERlcml2YXRpdmVzLCBzdWJGbikpIHtcbiAgICAoSXNPYmogYXMgYW55KVtzdWJGbl0gPSB7fSBhcyB0eXBlb2YgSXNPYmo7XG4gICAgZm9yIChjb25zdCBmbiBpbiBJc09iaikge1xuICAgICAgaWYgKE9iamVjdC5oYXNPd24oSXNPYmosIGZuKSkge1xuICAgICAgICBpZiAoc3ViRm4gPT09ICdub3QnKSB7XG4gICAgICAgICAgKElzT2JqIGFzIGFueSlbc3ViRm5dW2ZuXSA9IChEZXJpdmF0aXZlcyBhcyBhbnkpW3N1YkZuXSgoTm90T2JqIGFzIG5ldmVyKVtmbl0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIChJc09iaiBhcyBhbnkpW3N1YkZuXVtmbl0gPSAoRGVyaXZhdGl2ZXMgYXMgYW55KVtzdWJGbl0oKElzT2JqIGFzIG5ldmVyKVtmbl0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTWFpbiBleHBvcnQgcHJvdmlkaW5nIGNvbXByZWhlbnNpdmUgdHlwZSBjaGVja2luZyBhbmQgdmFsaWRhdGlvbiB1dGlsaXRpZXMuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGltcG9ydCB7IElzIH0gZnJvbSAnLi9Jcyc7XG4gKlxuICogLy8gQmFzaWMgdXNhZ2VcbiAqIElzLmRlZmluZWQodmFsdWUpOyAgICAgICAgLy8gQ2hlY2sgaWYgdmFsdWUgaXMgZGVmaW5lZFxuICogSXMubnVsbCh2YWx1ZSk7ICAgICAgICAgICAvLyBDaGVjayBpZiB2YWx1ZSBpcyBudWxsXG4gKiBJcy5mdW5jdGlvbih2YWx1ZSk7ICAgICAgIC8vIENoZWNrIGlmIHZhbHVlIGlzIGEgZnVuY3Rpb25cbiAqXG4gKiAvLyBOZWdhdGVkIGNoZWNrc1xuICogSXMubm90LmRlZmluZWQodmFsdWUpOyAgICAvLyBDaGVjayBpZiB2YWx1ZSBpcyB1bmRlZmluZWRcbiAqIElzLm5vdC5udWxsKHZhbHVlKTsgICAgICAgLy8gQ2hlY2sgaWYgdmFsdWUgaXMgbm90IG51bGxcbiAqXG4gKiAvLyBBcnJheSB2YWxpZGF0aW9uXG4gKiBJcy5hbGwuZGVmaW5lZChbMSwgMiwgM10pOyAvLyBDaGVjayBpZiBhbGwgdmFsdWVzIGFyZSBkZWZpbmVkXG4gKiBJcy5hbnkubnVsbChbMSwgbnVsbCwgM10pOyAvLyBDaGVjayBpZiBhbnkgdmFsdWUgaXMgbnVsbFxuICogYGBgXG4gKi9cbmV4cG9ydCBjb25zdCBJcyA9IElzT2JqIGFzIElzVHlwZTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFRTyxJQUFNLFFBQVE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU9uQixRQUFRLFFBQWlCLE9BQXFEO0FBQzVFLFdBQU8sUUFBUTtBQUFBLEVBQ2pCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxVQUFVLFFBQWlCLE9BQW9DO0FBQzdELFdBQU8sUUFBUTtBQUFBLEVBQ2pCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxLQUFLLFFBQWlCLE9BQStCO0FBQ25ELFdBQU8sUUFBUTtBQUFBLEVBQ2pCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxNQUFNLFFBQWtCLE9BQWlDO0FBQ3ZELFdBQU8sUUFBUSxRQUFRLFFBQVE7QUFBQSxFQUNqQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUUEsU0FBUyxRQUFpQixPQUFtQztBQUMzRCxXQUFPLE9BQU8sUUFBUTtB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
