import { read } from "../src";

const result = read`function foo() {
    console.log("Hello world!");
}`;

async function main() {
  for await (const node of result) {
    console.dir(node);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
