// Copyright (c) Serendipity Project Contributors.
// All rights reserved.
// Licensed under the MIT license.

const defaultFrom = "no one";

export default {
  defaultFrom,
  hello(from?: string) {
    console.log("Hello world. From:", from ?? defaultFrom, ".");
  }
};
