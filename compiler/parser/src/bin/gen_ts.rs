use std::io::Write;

use seglisp::parse::ParsedDocument;
use serendipity_parser::Module;

pub fn main() {
    let types = seglisp::ts_type_roots!(ParsedDocument<Module>);

    std::io::stdout()
        .write_all(types.as_bytes())
        .expect("failed to write types");
}
