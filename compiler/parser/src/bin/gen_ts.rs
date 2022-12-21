use std::io::Write;

use serendipity_parser::Module;

pub fn main() {
    let types = seglisp::ts_type_roots!(Module);

    std::io::stdout()
        .write(types.as_bytes())
        .expect("failed to write types");
}
