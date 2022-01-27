// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

export interface PeekableArray<T> extends Array<T> {
  take(): T;
  peek(): T | undefined;
  isDone(): boolean;
}

export function peekableArray<T>(arr: T[]): PeekableArray<T> {
  const cursor = {
    offset: 0,
  };
  return Object.assign(arr, {
    isDone() {
      console.log("Called done()", cursor, arr.length);
      return cursor.offset >= arr.length;
    },
    take(): T {
      if (cursor.offset < arr.length) {
        const value = arr[cursor.offset];
        cursor.offset += 1;
        console.log("Taken value from", arr, "offset is now", cursor);
        return value;
      } else {
        throw new Error("Reached end of array.");
      }
    },
    peek(): T | undefined {
      if (cursor.offset < arr.length) {
        return arr[cursor.offset];
      } else {
        return undefined;
      }
    },
  });
}
