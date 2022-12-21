use wasm_bindgen::prelude::*;

use std::collections::BTreeSet;

use itertools::Itertools;
use seglisp::{
    js_interop::{InteropInto, JsInterop, JsValue},
    parser::{
        self, BodyContext, ListPattern, Parse, ParseError, ParseNode, ParseResult, SegmentContext,
        SigilPattern, SymbolPattern,
    },
    Body, ReadHost, ReaderConfiguration, SegLisp, Segment, SimpleReader,
};

macro_rules! set {
    {$($e:expr),*} => {
        {
            let mut set = BTreeSet::new();

            $(set.insert($e);)*

            set
        }
    }
}

#[derive(Debug, Clone, JsInterop)]
pub struct Module<'ast> {
    pub declarations: Vec<ParseNode<Declaration<'ast>>>,
}

impl<'ast> Parse<'ast, Body<'ast>> for Module<'ast> {
    fn parse(ctx: &mut BodyContext<'ast>) -> ParseResult<Self> {
        Ok(Self {
            declarations: ctx.parse_segments_flat()?,
        })
    }
}

#[derive(Debug, Clone, JsInterop)]
pub enum Declaration<'ast> {
    Main {
        main_keyword: Verbatim<'ast>,
        body: InnerExpression<'ast>,
    },
    Define {
        define_keyword: Verbatim<'ast>,
        identifier: Verbatim<'ast>,
        assign_token: Verbatim<'ast>,
        value: InnerExpression<'ast>,
    },
    Function {
        function_keyword: Verbatim<'ast>,
        identifier: Verbatim<'ast>,
        parameters: ParsedVec<'ast, ParameterDeclaration<'ast>>,
        arrow_token: Verbatim<'ast>,
        body: InnerExpression<'ast>,
    },
}

impl<'ast> Parse<'ast, Segment<'ast>> for Declaration<'ast> {
    fn parse(ctx: &mut SegmentContext<'ast>) -> ParseResult<Self> {
        let keyword: ParseNode<&str> = ctx.parse_from(SymbolPattern::Any)?;

        match keyword.value {
            "main" => Ok(Declaration::Main {
                main_keyword: keyword,
                body: Box::new(ctx.parse()?),
            }),
            "const" => Ok(Declaration::Define {
                define_keyword: keyword,
                identifier: ctx.parse_from(SymbolPattern::Any)?,
                assign_token: ctx.parse_from(SigilPattern::Exact(":="))?,
                value: Box::new(ctx.parse()?),
            }),
            "fn" => Ok(Declaration::Function {
                function_keyword: keyword,
                identifier: ctx.parse_from(SymbolPattern::Any)?,
                parameters: ctx.parse_from(
                    ListPattern::<ParameterDeclaration>::each().expect_delimiter('('),
                )?,
                arrow_token: ctx.parse_from(SigilPattern::Exact("->"))?,
                body: Box::new(ctx.parse()?),
            }),
            v => Err(ParseError::WrongTokenContents {
                expected: "TODO: a declaration".into(),
                found: v.into(),
            }),
        }
    }
}

pub type InnerExpression<'ast> = Box<ParseNode<Expression<'ast>>>;
pub type ParsedVec<'ast, T> = ParseNode<Vec<ParseNode<T>>>;
pub type Verbatim<'ast> = ParseNode<&'ast str>;

#[derive(Debug, Clone, JsInterop)]
pub enum Expression<'ast> {
    // Elemental Terms
    Number(&'ast str),
    String(String),
    Boolean(bool),
    Name(&'ast str),
    Hole,
    None,

    // Unary operator
    Unary {
        operator: ParseNode<UnaryOp>,
        expression: InnerExpression<'ast>,
    },

    // Binary Operators
    Compare {
        operator: ParseNode<CompareOp>,
        left: InnerExpression<'ast>,
        right: InnerExpression<'ast>,
    },
    Arithmetic {
        operator: ParseNode<ArithmeticOp>,
        left: InnerExpression<'ast>,
        right: InnerExpression<'ast>,
    },
    Accessor {
        accessee: InnerExpression<'ast>,
        index: InnerExpression<'ast>,
    },

    // Compound terms
    Function {
        fn_keyword: Verbatim<'ast>,
        name: Option<Verbatim<'ast>>,
        parameters: Box<ParsedVec<'ast, ParameterDeclaration<'ast>>>,
        arrow_token: Verbatim<'ast>,
        body: InnerExpression<'ast>,
    },
    Call {
        callee: InnerExpression<'ast>,
        parameters: ParseNode<Vec<ParseNode<Expression<'ast>>>>,
    },
    With {
        with_keyword: Verbatim<'ast>,
        bindings: ParsedVec<'ast, Assignment<'ast>>,
        body: InnerExpression<'ast>,
    },
    Tuple {
        elements: ParsedVec<'ast, Expression<'ast>>,
    },
    List {
        elements: ParsedVec<'ast, Expression<'ast>>,
    },
    Procedure {
        body: ParsedVec<'ast, Statement<'ast>>,
    },
    If {
        if_keyword: Verbatim<'ast>,
        condition: InnerExpression<'ast>,
        then: InnerExpression<'ast>,
        else_keyword: Verbatim<'ast>,
        _else: InnerExpression<'ast>,
    },

    Record {
        elements: ParsedVec<'ast, RecordElement<'ast>>,
    },
}

impl<'ast> Parse<'ast, Segment<'ast>> for Expression<'ast> {
    fn parse(ctx: &mut SegmentContext<'ast>) -> ParseResult<Self> {
        // #region helpers
        fn parse_expression<'ast>(ctx: &mut SegmentContext<'ast>) -> ParseResult<Expression<'ast>> {
            parse_indicated(ctx)
        }
        fn parse_indicated<'ast>(ctx: &mut SegmentContext<'ast>) -> ParseResult<Expression<'ast>> {
            let next = ctx.require_peek().map(|v| &v.value)?;

            match next {
                SegLisp::Symbol("fn") => Ok(Expression::Function {
                    fn_keyword: ctx.parse_from(SymbolPattern::Exact("fn"))?,
                    name: ctx.parse_from(SymbolPattern::Any).map(Some).unwrap_or(None),
                    parameters: Box::new(ctx.parse_from(ListPattern::each())?),
                    arrow_token: ctx.parse_from(SigilPattern::Exact("->"))?,
                    body: Box::new(ctx.parse()?),
                }),
                SegLisp::Symbol("with") => Ok(Expression::With {
                    with_keyword: ctx.parse_from(SymbolPattern::Exact("with"))?,
                    bindings: ctx.parse_from(ListPattern::each())?,
                    body: Box::new(ctx.parse()?),
                }),
                SegLisp::Symbol("if") => Ok(Expression::If {
                    if_keyword: ctx.parse_from(SymbolPattern::Exact("if"))?,
                    condition: Box::new(ctx.parse()?),
                    then: Box::new(ctx.parse()?),
                    else_keyword: ctx.parse_from(SymbolPattern::Exact("else"))?,
                    _else: Box::new(ctx.parse()?),
                }),
                _ => ctx.parse_node(parse_compare).map(|v| v.value),
            }
        }
        fn parse_compare<'ast>(ctx: &mut SegmentContext<'ast>) -> ParseResult<Expression<'ast>> {
            let left = ctx.parse_node(parse_arith)?;

            let next = ctx.peek().map(|v| &v.value);

            match next {
                Some(SegLisp::Sigil("==" | "!=" | "<=" | ">=" | "<" | ">")) => {
                    Ok(Expression::Compare {
                        operator: ctx.parse()?,
                        left: Box::new(left),
                        right: Box::new(ctx.parse_node(parse_compare)?),
                    })
                }
                Some(_) | None => Ok(left.value),
            }
        }
        fn parse_arith<'ast>(ctx: &mut SegmentContext<'ast>) -> ParseResult<Expression<'ast>> {
            let left = ctx.parse_node(parse_term)?;

            let next = ctx.peek().map(|v| &v.value);

            match next {
                Some(SegLisp::Sigil("+" | "-")) => Ok(Expression::Arithmetic {
                    operator: ctx.parse()?,
                    left: Box::new(left),
                    right: Box::new(ctx.parse_node(parse_arith)?),
                }),
                Some(_) | None => Ok(left.value),
            }
        }
        fn parse_term<'ast>(ctx: &mut SegmentContext<'ast>) -> ParseResult<Expression<'ast>> {
            let left = ctx.parse_node(parse_factor)?;

            let next = ctx.peek().map(|v| &v.value);

            match next {
                Some(SegLisp::Sigil("*" | "/" | "%")) => Ok(Expression::Arithmetic {
                    operator: ctx.parse()?,
                    left: Box::new(left),
                    right: Box::new(ctx.parse_node(parse_term)?),
                }),
                Some(_) | None => Ok(left.value),
            }
        }
        fn parse_factor<'ast>(ctx: &mut SegmentContext<'ast>) -> ParseResult<Expression<'ast>> {
            let next = ctx.peek().map(|v| &v.value);

            match next {
                Some(SegLisp::Sigil("!" | "-")) => Ok(Expression::Unary {
                    operator: ctx.parse()?,
                    expression: Box::new(ctx.parse_node(parse_factor)?),
                }),
                Some(_) | None => ctx.parse_node(parse_postfix).map(|v| v.value),
            }
        }
        fn parse_postfix<'ast>(ctx: &mut SegmentContext<'ast>) -> ParseResult<Expression<'ast>> {
            let mut element_node = ctx.parse_node(parse_element)?;

            loop {
                match ctx.peek().map(|v| &v.value) {
                    Some(SegLisp::List {
                        delimiters: ('(', _),
                        ..
                    }) => {
                        element_node = ctx.parse_node(|ctx| {
                            Ok(Expression::Call {
                                callee: Box::new(element_node),
                                parameters: ctx.parse_from(ListPattern::each())?,
                            })
                        })?;
                    }
                    Some(SegLisp::List {
                        delimiters: ('[', _),
                        ..
                    }) => {
                        element_node = ctx.parse_node(|ctx| {
                            let mut element: ParsedVec<Expression> =
                                ctx.parse_from(ListPattern::single())?;

                            Ok(Expression::Accessor {
                                accessee: Box::new(element_node),
                                index: Box::new(element.value.remove(0)),
                            })
                        })?;
                    }
                    Some(_) | None => break,
                }
            }

            Ok(element_node.value)
        }
        fn parse_element<'ast>(ctx: &mut SegmentContext<'ast>) -> ParseResult<Expression<'ast>> {
            // List-delimited expressions
            if let Some(SegLisp::List {
                delimiters: (d, _), ..
            }) = ctx.peek().map(|v| &v.value)
            {
                return match d {
                    '(' => {
                        let mut elements: ParsedVec<Expression> =
                            ctx.parse_from(ListPattern::each())?;

                        if elements.value.len() == 1 {
                            Ok(elements.value.remove(0).value)
                        } else {
                            Ok(Expression::Tuple { elements })
                        }
                    }
                    '[' => {
                        let elements: ParsedVec<Expression> = ctx.parse_from(ListPattern::each())?;

                        Ok(Expression::List { elements })
                    }
                    '{' => {
                        let elements: ParsedVec<RecordElement> =
                            ctx.parse_from(ListPattern::each())?;

                        Ok(Expression::Record { elements })
                    }
                    _ => unreachable!(),
                };
            }

            let r = match &ctx.require_next()?.value {
                // Keyword expressions
                SegLisp::Symbol("true") => Ok(Expression::Boolean(true)),
                SegLisp::Symbol("false") => Ok(Expression::Boolean(false)),
                SegLisp::Symbol("none") => Ok(Expression::None),
                SegLisp::Sigil("@") => Ok(Expression::Hole),

                // Basic expressions
                SegLisp::Symbol(s) => Ok(Expression::Name(s)),
                SegLisp::Number(v) => Ok(Expression::Number(v)),
                SegLisp::String(v) => Ok(Expression::String(v.clone())),

                // Proc
                SegLisp::Sigil("#") => Ok(Expression::Procedure {
                    body: ctx.parse_from(ListPattern::each().expect_delimiter('['))?,
                }),

                SegLisp::Sigil(_) => Err(ParseError::WrongToken("TODO: not a sigil".into())),
                SegLisp::List { .. } => unreachable!(),
            };

            r
        }
        // #endregion

        parse_expression(ctx)
    }
}

#[derive(Debug, Clone, JsInterop)]
pub struct ParameterDeclaration<'ast>(&'ast str);

impl<'ast> Parse<'ast, Segment<'ast>> for ParameterDeclaration<'ast> {
    fn parse(ctx: &mut SegmentContext<'ast>) -> ParseResult<Self> {
        Ok(ParameterDeclaration(
            ctx.parse_from(SymbolPattern::Any)?.value,
        ))
    }
}

#[derive(Debug, Clone, JsInterop)]
pub struct Assignment<'ast> {
    symbol: Verbatim<'ast>,
    equal_token: Verbatim<'ast>,
    value: ParseNode<Expression<'ast>>,
}

impl<'ast> Parse<'ast, Segment<'ast>> for Assignment<'ast> {
    fn parse(ctx: &mut parser::ParseContext<'ast, Segment<'ast>>) -> ParseResult<Self> {
        Ok(Self {
            symbol: ctx.parse_from(SymbolPattern::Any)?,
            equal_token: ctx.parse_from(SigilPattern::Exact("="))?,
            value: ctx.parse()?,
        })
    }
}

#[derive(Debug, Clone, JsInterop)]
pub enum RecordElement<'ast> {
    KeyValuePair(Verbatim<'ast>, ParseNode<Expression<'ast>>),
    Identifier(Verbatim<'ast>),
    Spread(ParseNode<Expression<'ast>>),
}

impl<'ast> Parse<'ast, Segment<'ast>> for RecordElement<'ast> {
    fn parse(ctx: &mut parser::ParseContext<'ast, Segment<'ast>>) -> ParseResult<Self> {
        let next = ctx.require_peek()?;

        match next.value.clone() {
            SegLisp::Symbol(_)
                if matches!(ctx.peek().map(|v| &v.value), Some(SegLisp::Sigil(":"))) =>
            {
                let s = ctx.parse_from(SymbolPattern::Any)?;
                ctx.next();
                Ok(RecordElement::KeyValuePair(s, ctx.parse()?))
            }
            SegLisp::Symbol(_) => Ok(RecordElement::Identifier(
                ctx.parse_from(SymbolPattern::Any)?,
            )),
            SegLisp::Sigil("...") => {
                ctx.next();
                Ok(RecordElement::Spread(ctx.parse()?))
            }
            _ => Err(ParseError::WrongToken(
                "one of '<symbol> : <expression>', symbol, or '...'".into(),
            )),
        }
    }
}

#[derive(Debug, Clone, JsInterop)]
pub enum CompareOp {
    Equal,
    NotEqual,
    LessThanOrEqual,
    GreaterThanOrEqual,
    LessThan,
    GreaterThan,
}

impl<'ast> Parse<'ast, Segment<'ast>> for CompareOp {
    fn parse(ctx: &mut SegmentContext<'ast>) -> ParseResult<Self> {
        let sigil: &str = ctx
            .parse_from(SigilPattern::Destructure(&SigilPattern::OneOf(set! {
                        "==", "!=", "<=", ">=", "<", ">"
            })))?
            .value;

        Ok(match sigil {
            "==" => CompareOp::Equal,
            "!=" => CompareOp::NotEqual,
            "<=" => CompareOp::LessThanOrEqual,
            ">=" => CompareOp::GreaterThanOrEqual,
            "<" => CompareOp::LessThan,
            ">" => CompareOp::GreaterThan,
            _ => unreachable!(),
        })
    }
}

#[derive(Debug, Clone, JsInterop)]
pub enum ArithmeticOp {
    Add,
    Subtract,
    Multiply,
    Divide,
    Modulus,
}

impl<'ast> Parse<'ast, Segment<'ast>> for ArithmeticOp {
    fn parse(ctx: &mut SegmentContext<'ast>) -> ParseResult<Self> {
        let sigil: &str = ctx
            .parse_from(SigilPattern::Destructure(&SigilPattern::OneOf(set! {
                        "/", "*", "%", "+", "-"
            })))?
            .value;

        Ok(match sigil {
            "/" => ArithmeticOp::Divide,
            "*" => ArithmeticOp::Multiply,
            "%" => ArithmeticOp::Modulus,
            "+" => ArithmeticOp::Add,
            "-" => ArithmeticOp::Subtract,
            _ => unreachable!(),
        })
    }
}

#[derive(Debug, Clone, JsInterop)]
pub enum UnaryOp {
    Negate,
    Minus,
}

impl<'ast> Parse<'ast, Segment<'ast>> for UnaryOp {
    fn parse(ctx: &mut SegmentContext<'ast>) -> ParseResult<Self> {
        let sigil: &str = ctx
            .parse_from(SigilPattern::Destructure(&SigilPattern::OneOf(set! {
                        "!", "-"
            })))?
            .value;

        Ok(match sigil {
            "!" => UnaryOp::Negate,
            "-" => UnaryOp::Minus,
            _ => unreachable!(),
        })
    }
}

pub type InnerStatement<'ast> = Box<ParseNode<Statement<'ast>>>;

#[derive(Debug, Clone, JsInterop)]
pub enum Statement<'ast> {
    Let {
        let_keyword: Verbatim<'ast>,
        assignment: ParseNode<Assignment<'ast>>,
    },
    Set(ParseNode<Assignment<'ast>>),
    If {
        if_keyword: Verbatim<'ast>,
        condition: InnerExpression<'ast>,
        then: InnerStatement<'ast>,
        _else: Option<InnerStatement<'ast>>,
    },
    ForIn {
        for_keyword: Verbatim<'ast>,
        binding: Verbatim<'ast>,
        in_keyword: Verbatim<'ast>,
        iterator: InnerExpression<'ast>,
        body: InnerStatement<'ast>,
    },
    Forever(InnerStatement<'ast>),
    Do(InnerExpression<'ast>),
    Break,
    Continue,
    Pass,

    Expression(InnerExpression<'ast>),
}

impl<'ast> Parse<'ast, Segment<'ast>> for Statement<'ast> {
    fn parse(ctx: &mut parser::ParseContext<'ast, Segment<'ast>>) -> ParseResult<Self> {
        let next = ctx.require_peek()?;

        Ok(match next.value.clone() {
            SegLisp::Symbol("let") => Self::Let {
                let_keyword: ctx.parse_from(SymbolPattern::Any)?,
                assignment: ctx.parse()?,
            },
            SegLisp::Symbol("if") => Self::If {
                if_keyword: ctx.parse_from(SymbolPattern::Any)?,
                condition: Box::new(ctx.parse()?),
                then: Box::new(ctx.parse()?),
                _else: None, // TODO
            },
            SegLisp::Symbol("for") => Self::ForIn {
                for_keyword: ctx.parse_from(SymbolPattern::Any)?,
                binding: ctx.parse_from(SymbolPattern::Any)?,
                in_keyword: ctx.parse_from(SymbolPattern::Exact("in"))?,
                iterator: Box::new(ctx.parse()?),
                body: Box::new(ctx.parse()?),
            },
            SegLisp::Symbol("loop") => Self::Forever(Box::new(ctx.parse()?)),
            SegLisp::Symbol("do") => Self::Do(Box::new(ctx.parse()?)),
            SegLisp::Symbol("break") => Self::Break,
            SegLisp::Symbol("continue") => Self::Continue,
            SegLisp::Symbol("pass") => Self::Pass,
            SegLisp::Symbol(_)
                if matches!(ctx.peek().map(|v| &v.value), Some(SegLisp::Sigil("="))) =>
            {
                Self::Set(ctx.parse()?)
            }
            _ => Statement::Expression(Box::new(ctx.parse()?)),
        })
    }
}

#[wasm_bindgen]
pub fn parse_bytes(data: &[u8]) -> JsValue {
    let mut reader = SimpleReader(ReaderConfiguration {
        ..Default::default()
    });

    let data = core::str::from_utf8(data).unwrap();

    let result = reader.read(&data);

    let parser = parser::Parser::of(result.module.unwrap().body);

    parser.parse::<Module>().unwrap().to_js_value()
}

impl core::fmt::Display for Module<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        for decl in &self.declarations {
            writeln!(f, "{};\n", decl.value)?;
        }

        Ok(())
    }
}

impl core::fmt::Display for Declaration<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Declaration::Main { body, .. } => {
                write!(f, "main {}", body.value)?;
            }
            Declaration::Define {
                identifier, value, ..
            } => {
                write!(f, "const {} := {}", identifier.value, value.value)?;
            }
            Declaration::Function {
                identifier,
                parameters,
                body,
                ..
            } => {
                write!(f, "fn {}(", identifier.value)?;

                write!(
                    f,
                    "{}",
                    parameters
                        .value
                        .iter()
                        .map(|v| v.value.0.to_string())
                        .join(", ")
                )?;

                write!(f, ") = {}", body.value)?;
            }
        };

        Ok(())
    }
}

impl core::fmt::Display for Expression<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Expression::Number(n) => write!(f, "{n}"),
            Expression::String(contents) => write!(f, "\"{contents}\""),
            Expression::Boolean(b) => write!(f, "{b}"),
            Expression::Name(n) => write!(f, "{n}"),
            Expression::Hole => write!(f, "@"),
            Expression::None => write!(f, "none"),
            Expression::Unary {
                operator,
                expression,
            } => write!(f, "{}({})", operator.value, expression.value),
            Expression::Compare {
                operator,
                left,
                right,
            } => write!(f, "({}) {} ({})", left.value, operator.value, right.value),
            Expression::Arithmetic {
                operator,
                left,
                right,
            } => write!(f, "({}) {} ({})", left.value, operator.value, right.value),
            Expression::Accessor { accessee, index } => {
                write!(f, "({})[{}]", accessee.value, index.value)
            }
            Expression::Function {
                parameters, body, ..
            } => write!(
                f,
                "fn ({}) -> ({})",
                parameters
                    .value
                    .iter()
                    .map(|v| v.value.0.to_string())
                    .join(", "),
                body.value
            ),
            Expression::Call { callee, parameters } => write!(
                f,
                "({})({})",
                callee.value,
                parameters
                    .value
                    .iter()
                    .map(|v| format!("{}", v.value))
                    .join(", ")
            ),
            Expression::With { bindings, body, .. } => write!(
                f,
                "with ({}) ({})",
                bindings
                    .value
                    .iter()
                    .map(|v| format!("{}", v.value))
                    .join(", "),
                body.value
            ),
            Expression::Tuple { elements } => write!(
                f,
                "({})",
                elements
                    .value
                    .iter()
                    .map(|v| format!("{}", v.value))
                    .join(", ")
            ),
            Expression::List { elements } => write!(
                f,
                "[{}]",
                elements
                    .value
                    .iter()
                    .map(|v| format!("{}", v.value))
                    .join(", ")
            ),
            Expression::Procedure { body } => {
                write!(f, "#[")?;

                for stmt in &body.value {
                    write!(f, "{};", stmt.value)?;
                }

                write!(f, "]")
            }
            Expression::If {
                condition,
                then,
                _else,
                ..
            } => write!(
                f,
                "if {} ({}) else ({})",
                condition.value, then.value, _else.value
            ),
            Expression::Record { elements } => write!(
                f,
                "{{{}}}",
                elements
                    .value
                    .iter()
                    .map(|v| format!("{}", v.value))
                    .join(", ")
            ),
        }
    }
}

impl core::fmt::Display for Assignment<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} = {}", self.symbol.value, self.value.value)
    }
}

impl core::fmt::Display for UnaryOp {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            match self {
                UnaryOp::Negate => "!",
                UnaryOp::Minus => "-",
            }
        )
    }
}

impl core::fmt::Display for ArithmeticOp {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            match self {
                ArithmeticOp::Add => "+",
                ArithmeticOp::Subtract => "-",
                ArithmeticOp::Multiply => "*",
                ArithmeticOp::Divide => "/",
                ArithmeticOp::Modulus => "%",
            }
        )
    }
}

impl core::fmt::Display for CompareOp {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            match self {
                CompareOp::Equal => "==",
                CompareOp::NotEqual => "!=",
                CompareOp::LessThanOrEqual => "<=",
                CompareOp::GreaterThanOrEqual => ">=",
                CompareOp::LessThan => "<",
                CompareOp::GreaterThan => ">",
            }
        )
    }
}

impl core::fmt::Display for RecordElement<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RecordElement::KeyValuePair(k, v) => write!(f, "{}: ({})", k.value, v.value),
            RecordElement::Identifier(n) => write!(f, "{}", n.value),
            RecordElement::Spread(e) => write!(f, "...({})", e.value),
        }
    }
}

impl core::fmt::Display for Statement<'_> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Statement::Let { assignment, .. } => write!(
                f,
                "let {} = ({})",
                assignment.value.symbol.value, assignment.value.value.value
            ),
            Statement::Set(ParseNode {
                value: Assignment { symbol, value, .. },
                ..
            }) => {
                write!(f, "{} = {}", symbol.value, value.value)
            }
            Statement::If {
                condition,
                then,
                _else,
                ..
            } => {
                write!(f, "if ({}) {}", condition.value, then.value)?;

                if let Some(e) = _else {
                    write!(f, "else {}", e.value)?;
                }

                Ok(())
            }
            Statement::ForIn {
                binding,
                iterator,
                body,
                ..
            } => write!(
                f,
                "for {} in ({}) [{}]",
                binding.value, iterator.value, body.value
            ),
            Statement::Forever(body) => write!(f, "loop {}", body.value),
            Statement::Do(body) => write!(f, "do {}", body.value),
            Statement::Break => write!(f, "break"),
            Statement::Continue => write!(f, "continue"),
            Statement::Pass => write!(f, "pass"),
            Statement::Expression(e) => write!(f, "{}", e.value),
        }
    }
}
