import { read } from "../src";

const result = read`object: "test",
"my key": #/object/,

# comment
external:
  nested_key: read(./other.xson)`;

async function main() {
  for await (const node of result) {
    console.dir(node);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
