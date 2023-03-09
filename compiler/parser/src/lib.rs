use wasm_bindgen::prelude::*;

use std::collections::BTreeSet;

use itertools::Itertools;
use seglisp::{
    js_interop::{InteropInto, JsInterop, JsValue},
    parse::{
        impl_parse, ExpectedString, ListPattern, Parse, ParseError, ParseNode, ParseResult, Sigil,
        SigilPattern, Symbol, SymbolPattern,
    },
    Body, Diagnostic, DiagnosticLocation, DiagnosticPhase, DiagnosticSeverity, NodeContext,
    SegLisp, SegLispNode, Segment,
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
    fn parse(ctx: &NodeContext<'ast, Body<'ast>>) -> ParseResult<Self> {
        Ok(Self {
            declarations: ctx.parse_segments_flat()?,
        })
    }
}

#[derive(Debug, Clone, JsInterop)]
pub struct GenericParameter<'ast> {
    name: Verbatim<'ast>,
    constraint: Option<ParseNode<TypeConstraint<'ast>>>,
}

impl_parse! {
    fn <'ast> parse::<GenericParameter<'ast>>(ctx: Segment) {
        Ok(GenericParameter {
            name: ctx.parse_from(Symbol!())?,
            constraint: ctx.parse::<TypeConstraint>().map(Some).unwrap_or(None)
        })
    }
}

#[derive(Debug, Clone, JsInterop)]
pub enum Declaration<'ast> {
    Main {
        main_keyword: Verbatim<'ast>,
        body: InnerExpression<'ast>,
    },
    Const {
        const_keyword: Verbatim<'ast>,
        identifier: Verbatim<'ast>,
        type_: Option<ParseNode<TypeConstraint<'ast>>>,
        equals_token: Verbatim<'ast>,
        value: InnerExpression<'ast>,
    },
    Function {
        function_keyword: Verbatim<'ast>,
        identifier: Verbatim<'ast>,
        generic_parameters: Option<ParsedVec<GenericParameter<'ast>>>,
        parameters: ParsedVec<ParameterDeclaration<'ast>>,
        constraint: Option<ParseNode<TypeConstraint<'ast>>>,
        arrow_token: Verbatim<'ast>,
        body: InnerExpression<'ast>,
    },

    Import {
        import_keyword: Verbatim<'ast>,
        pattern: ParseNode<BindingPattern<'ast>>,
        equal_token: Verbatim<'ast>,
        use_keyword: Verbatim<'ast>,
        module_specifier: ParseNode<&'ast str>,
    },

    Export {
        export_keyword: Verbatim<'ast>,
        elements: ParsedVec<RecordElement<'ast>>,
    },

    TypeAlias {
        type_keyword: Verbatim<'ast>,
        name: Verbatim<'ast>,
        generic_parameters: Option<ParsedVec<GenericParameter<'ast>>>,
        equals_token: Verbatim<'ast>,
        value: ParseNode<Type<'ast>>,
    },

    Interface {
        interface_keyword: Verbatim<'ast>,
        name: Verbatim<'ast>,
        generic_parameters: Option<ParsedVec<GenericParameter<'ast>>>,
        constraint: Option<ParseNode<TypeConstraint<'ast>>>,
        body: ParsedVec<InterfaceField<'ast>>,
    },
}

impl<'ast> Parse<'ast, Segment<'ast>> for Declaration<'ast> {
    fn parse(ctx: &NodeContext<'ast, Segment<'ast>>) -> ParseResult<Self> {
        let keyword: ParseNode<&str> = ctx.parse_from(SymbolPattern::Any)?;

        match keyword.value {
            "main" => Ok(Declaration::Main {
                main_keyword: keyword,
                body: Box::new(ctx.parse()?),
            }),

            "const" => Ok(Declaration::Const {
                const_keyword: keyword,
                identifier: ctx.parse_from(SymbolPattern::Any)?,
                type_: ctx.parse().map(Some).unwrap_or(None),
                equals_token: ctx.parse_from(SigilPattern::Exact("="))?,
                value: Box::new(ctx.parse()?),
            }),

            "fn" => Ok(Declaration::Function {
                function_keyword: keyword,
                identifier: ctx.parse_from(SymbolPattern::Any)?,
                generic_parameters: ctx
                    .parse_from(ListPattern::each().expect_delimiter('['))
                    .map(Some)
                    .unwrap_or(None),
                parameters: ctx.parse_from(
                    ListPattern::<ParameterDeclaration>::each().expect_delimiter('('),
                )?,
                constraint: ctx.parse().map(Some).unwrap_or(None),
                arrow_token: ctx.parse_from(SigilPattern::Exact("->"))?,
                body: Box::new(ctx.parse()?),
            }),

            "import" => Ok(Declaration::Import {
                import_keyword: keyword,
                pattern: ctx.parse()?,
                equal_token: ctx.parse_from(Sigil!["="])?,
                use_keyword: ctx.parse_from(Symbol!("use"))?,
                module_specifier: {
                    let mut s: ParsedVec<ExpectedString> =
                        ctx.parse_from(ListPattern::single().expect_delimiter('('))?;

                    let node = s.value.remove(0);

                    node.map(|v| v.value)
                },
            }),

            "export" => Ok(Declaration::Export {
                export_keyword: keyword,
                elements: ctx.parse_from(ListPattern::each().expect_delimiter('{'))?,
            }),

            "type" => Ok(Declaration::TypeAlias {
                type_keyword: keyword,
                name: ctx.parse_from(Symbol!())?,
                generic_parameters: ctx
                    .parse_from(ListPattern::each().expect_delimiter('['))
                    .map(Some)
                    .unwrap_or(None),
                equals_token: ctx.parse_from(Sigil!["="])?,
                value: ctx.parse()?,
            }),

            "interface" => Ok(Declaration::Interface {
                interface_keyword: keyword,
                name: ctx.parse_from(Symbol!())?,
                generic_parameters: ctx
                    .parse_from(ListPattern::each().expect_delimiter('['))
                    .map(Some)
                    .unwrap_or(None),
                constraint: ctx.parse().map(Some).unwrap_or(None),
                body: ctx.parse_from(ListPattern::each().expect_delimiter('{'))?,
            }),

            v => {
                ctx.add_diagnostic(Diagnostic {
                    abridged: false,
                    inner_diagnostics: None,
                    location: DiagnosticLocation::Range(keyword.range),
                    message: format!("unknown global '{v}', expected one of 'main', 'const', 'fn', 'type', 'interface'"),
                    note: None,
                    phase: DiagnosticPhase::Parse,
                    severity: DiagnosticSeverity::Error,
                    subject: None, // TODO: subject
                });
                Err(ParseError::WrongTokenContents {
                    expected: "TODO: a declaration".into(),
                    found: v.into(),
                })
            }
        }
    }
}

#[derive(Debug, Clone, JsInterop)]
pub struct InterfaceField<'ast> {
    name: Verbatim<'ast>,
    constraint: ParseNode<TypeConstraint<'ast>>,
}

impl_parse! {
    fn <'ast> parse::<InterfaceField<'ast>>(ctx: Segment) {
        Ok(InterfaceField {
            name: ctx.parse_from(Symbol!())?,
            constraint: ctx.parse()?
        })
    }
}

pub type InnerExpression<'ast> = Box<ParseNode<Expression<'ast>>>;
pub type ParsedVec<T> = ParseNode<Vec<ParseNode<T>>>;
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

    // As ::= $expr:Expression 'as' $type:Type
    As {
        expr: InnerExpression<'ast>,
        as_token: Verbatim<'ast>,
        type_: Box<ParseNode<Type<'ast>>>,
    },

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
        generic_parameters: Option<ParsedVec<GenericParameter<'ast>>>,
        parameters: ParsedVec<ParameterDeclaration<'ast>>,
        constraint: Option<ParseNode<TypeConstraint<'ast>>>,
        arrow_token: Verbatim<'ast>,
        body: InnerExpression<'ast>,
    },

    Call {
        callee: InnerExpression<'ast>,
        parameters: ParseNode<Vec<ParseNode<Expression<'ast>>>>,
    },

    With {
        with_keyword: Verbatim<'ast>,
        bindings: ParsedVec<Assignment<'ast>>,
        body: InnerExpression<'ast>,
    },

    Tuple {
        elements: ParsedVec<Expression<'ast>>,
    },

    List {
        elements: ParsedVec<Expression<'ast>>,
    },

    Procedure {
        body: ParsedVec<Statement<'ast>>,
    },

    If {
        if_keyword: Verbatim<'ast>,
        condition: InnerExpression<'ast>,
        then_keyword: Verbatim<'ast>,
        then: InnerExpression<'ast>,
        else_keyword: Verbatim<'ast>,
        _else: InnerExpression<'ast>,
    },

    Record {
        elements: ParsedVec<RecordElement<'ast>>,
    },

    FieldAccess {
        accessee: InnerExpression<'ast>,
        field: Verbatim<'ast>,
    },
}

impl<'ast> Parse<'ast, Segment<'ast>> for Expression<'ast> {
    fn parse(ctx: &NodeContext<'ast, Segment<'ast>>) -> ParseResult<Self> {
        // #region helpers
        fn parse_expression<'ast>(
            ctx: &NodeContext<'ast, Segment<'ast>>,
        ) -> ParseResult<Expression<'ast>> {
            parse_indicated(ctx)
        }
        // Expr items that have a leading token that "indicates" a production
        fn parse_indicated<'ast>(
            ctx: &NodeContext<'ast, Segment<'ast>>,
        ) -> ParseResult<Expression<'ast>> {
            let next = ctx.require_peek().map(|v| &v.value)?;

            match next {
                SegLisp::Symbol("fn") => Ok(Expression::Function {
                    fn_keyword: ctx.parse_from(SymbolPattern::Exact("fn"))?,
                    name: ctx.parse_from(SymbolPattern::Any).map(Some).unwrap_or(None),
                    generic_parameters: ctx
                        .parse_from(ListPattern::each().expect_delimiter('['))
                        .map(Some)
                        .unwrap_or(None),
                    parameters: ctx.parse_from(ListPattern::each())?,
                    constraint: ctx.parse::<TypeConstraint>().map(Some).unwrap_or(None),
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
                    then_keyword: ctx.parse_from(SymbolPattern::Exact("then"))?,
                    then: Box::new(ctx.parse()?),
                    else_keyword: ctx.parse_from(SymbolPattern::Exact("else"))?,
                    _else: Box::new(ctx.parse()?),
                }),
                _ => ctx.parse_node(parse_compare).map(|v| v.value),
            }
        }
        fn parse_compare<'ast>(
            ctx: &NodeContext<'ast, Segment<'ast>>,
        ) -> ParseResult<Expression<'ast>> {
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
        fn parse_arith<'ast>(
            ctx: &NodeContext<'ast, Segment<'ast>>,
        ) -> ParseResult<Expression<'ast>> {
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
        fn parse_term<'ast>(
            ctx: &NodeContext<'ast, Segment<'ast>>,
        ) -> ParseResult<Expression<'ast>> {
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
        fn parse_factor<'ast>(
            ctx: &NodeContext<'ast, Segment<'ast>>,
        ) -> ParseResult<Expression<'ast>> {
            let next = ctx.peek().map(|v| &v.value);

            match next {
                Some(SegLisp::Sigil("!" | "-")) => Ok(Expression::Unary {
                    operator: ctx.parse()?,
                    expression: Box::new(ctx.parse_node(parse_factor)?),
                }),
                Some(_) | None => ctx.parse_node(parse_postfix).map(|v| v.value),
            }
        }
        fn parse_postfix<'ast>(
            ctx: &NodeContext<'ast, Segment<'ast>>,
        ) -> ParseResult<Expression<'ast>> {
            let mut lower_node = ctx.parse_node(parse_field_access)?;

            loop {
                match ctx.peek().map(|v| &v.value) {
                    Some(SegLisp::List {
                        delimiters: ('(', _),
                        ..
                    }) => {
                        lower_node = ctx.parse_node(|ctx| {
                            Ok(Expression::Call {
                                callee: Box::new(lower_node),
                                parameters: ctx.parse_from(ListPattern::each())?,
                            })
                        })?;
                    }
                    Some(SegLisp::List {
                        delimiters: ('[', _),
                        ..
                    }) => {
                        lower_node = ctx.parse_node(|ctx| {
                            let mut element: ParsedVec<Expression> =
                                ctx.parse_from(ListPattern::single())?;

                            Ok(Expression::Accessor {
                                accessee: Box::new(lower_node),
                                index: Box::new(element.value.remove(0)),
                            })
                        })?;
                    }
                    Some(_) | None => break,
                }
            }

            Ok(lower_node.value)
        }

        fn parse_field_access<'ast>(
            ctx: &NodeContext<'ast, Segment<'ast>>,
        ) -> ParseResult<Expression<'ast>> {
            let lower_node = ctx.parse_node(parse_element)?;

            if let Some(SegLisp::Sigil(".")) = ctx.peek().map(|v| &v.value) {
                ctx.next().unwrap();

                Ok(Expression::FieldAccess {
                    accessee: Box::new(lower_node),
                    field: ctx.parse_from(Symbol!())?,
                })
            } else {
                Ok(lower_node.value)
            }
        }

        fn parse_element<'ast>(
            ctx: &NodeContext<'ast, Segment<'ast>>,
        ) -> ParseResult<Expression<'ast>> {
            // List-delimited expressions
            if let Some(
                node @ SegLispNode {
                    value:
                        SegLisp::List {
                            delimiters: (d, _), ..
                        },
                    ..
                },
            ) = ctx.peek()
            {
                return match d {
                    '(' => {
                        let mut elements: ParsedVec<Expression> =
                            ctx.parse_from(ListPattern::each())?;

                        if elements.value.is_empty() {
                            ctx.add_diagnostic(Diagnostic {
                                abridged: false,
                                inner_diagnostics: None,
                                location: DiagnosticLocation::Range(node.range),
                                message: "empty tuple (use 'none' instead)".into(),
                                note: None,
                                phase: DiagnosticPhase::Parse,
                                severity: DiagnosticSeverity::Warning,
                                subject: None, // TODO
                            });
                            Ok(Expression::Tuple { elements })
                        } else if elements.value.len() == 1 {
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
pub struct TypeConstraint<'ast> {
    colon_token: Verbatim<'ast>,
    type_: Box<ParseNode<Type<'ast>>>,
}

impl_parse! {
    fn <'ast> parse::<TypeConstraint<'ast>>(ctx: Segment) {
        Ok(TypeConstraint {
            colon_token: ctx.parse_from(Sigil![":"])?,
            type_: Box::new(ctx.parse()?)
        })
    }
}

#[derive(Debug, Clone, JsInterop)]
pub enum Type<'ast> {
    Kind,
    Never,
    Unknown,

    Reference {
        name: Verbatim<'ast>,
        generic_parameters: Option<ParsedVec<Type<'ast>>>,
    },

    Union {
        left: Box<ParseNode<Type<'ast>>>,
        right: Box<ParseNode<Type<'ast>>>,
    },

    Tuple {
        members: ParsedVec<Type<'ast>>,
    },

    Function {
        fn_keyword: Verbatim<'ast>,
        parameters: ParsedVec<Type<'ast>>,
        arrow_token: Verbatim<'ast>,
        return_type: Box<ParseNode<Type<'ast>>>,
    },
}

impl_parse! {
    fn <'ast> parse::<Type<'ast>>(ctx: Segment) {
        fn parse_simple<'ast>(ctx: &NodeContext<'ast, Segment<'ast>>) -> ParseResult<Type<'ast>> {
            Ok(match &ctx.require_peek()?.value {
                SegLisp::Sigil("*") => {
                    ctx.next().unwrap();
                    Type::Kind
                },
                SegLisp::Sigil("!") => {
                    ctx.next().unwrap();
                    Type::Never
                },
                SegLisp::Sigil("_") => {
                    ctx.next().unwrap();
                    Type::Unknown
                },
                SegLisp::Symbol("fn") => {
                    Type::Function {
                        fn_keyword: ctx.parse_from(Symbol!["fn"]).unwrap(),
                        parameters: ctx.parse_from(ListPattern::each().expect_delimiter('('))?,
                        arrow_token: ctx.parse_from(Sigil!("->"))?,
                        return_type: Box::new(ctx.parse()?)

                    }
                }
                SegLisp::Symbol(_) => {
                    Type::Reference {
                        name: ctx.parse_from(Symbol!()).unwrap(),
                        generic_parameters: ctx.parse_from(ListPattern::each().expect_delimiter('[')).map(Some).unwrap_or(None),
                    }
                }
                SegLisp::List { delimiters: ('(', _), contents } => {
                    if contents.data.len() > 1 {
                        Type::Tuple { members: ctx.parse_from(ListPattern::each().expect_delimiter('('))? }
                    } else {
                        let mut v: ParsedVec<Type<'ast>> = ctx.parse_from(ListPattern::single().expect_delimiter('('))?;

                        v.value.remove(0).value
                    }
                }
                _ => todo!("guh")
            })
        }

        fn parse_compound<'ast>(ctx: &NodeContext<'ast, Segment<'ast>>) -> ParseResult<Type<'ast>> {
            let t: ParseNode<Type<'ast>> = ctx.parse_node(parse_simple)?;

            if let Some(SegLisp::Sigil("|")) = ctx.peek().map(|node| &node.value) {
                ctx.next().unwrap();
                Ok(Type::Union {
                    left: Box::new(t),
                    right: Box::new(ctx.parse_node(parse_simple)?)
                })
            } else {
                Ok(t.value)
            }
        }

        parse_compound(ctx)
    }
}

#[derive(Debug, Clone, JsInterop)]
pub struct ParameterDeclaration<'ast> {
    name: Verbatim<'ast>,
    type_: Option<ParseNode<TypeConstraint<'ast>>>,
}

impl<'ast> Parse<'ast, Segment<'ast>> for ParameterDeclaration<'ast> {
    fn parse(ctx: &NodeContext<'ast, Segment<'ast>>) -> ParseResult<Self> {
        Ok(ParameterDeclaration {
            name: ctx.parse_from(SymbolPattern::Any)?,
            type_: ctx.parse::<TypeConstraint>().map(Some).unwrap_or(None),
        })
    }
}

#[derive(Debug, Clone, JsInterop)]
pub struct Assignment<'ast> {
    symbol: Verbatim<'ast>,
    equal_token: Verbatim<'ast>,
    value: ParseNode<Expression<'ast>>,
}

impl<'ast> Parse<'ast, Segment<'ast>> for Assignment<'ast> {
    fn parse(ctx: &NodeContext<'ast, Segment<'ast>>) -> ParseResult<Self> {
        Ok(Self {
            symbol: ctx.parse_from(SymbolPattern::Any)?,
            equal_token: ctx.parse_from(SigilPattern::Exact("="))?,
            value: ctx.parse()?,
        })
    }
}

#[derive(Debug, Clone, JsInterop)]
pub enum RecordElement<'ast> {
    KeyValuePair {
        key: Verbatim<'ast>,
        value: ParseNode<Expression<'ast>>,
    },
    Identifier {
        name: Verbatim<'ast>,
    },
    Spread {
        value: ParseNode<Expression<'ast>>,
    },
}

impl<'ast> Parse<'ast, Segment<'ast>> for RecordElement<'ast> {
    fn parse(ctx: &NodeContext<'ast, Segment<'ast>>) -> ParseResult<Self> {
        let next = ctx.require_peek()?;

        match next.value.clone() {
            SegLisp::Symbol(_)
                if matches!(ctx.peek().map(|v| &v.value), Some(SegLisp::Sigil(":"))) =>
            {
                let s = ctx.parse_from(SymbolPattern::Any)?;
                ctx.next();
                Ok(RecordElement::KeyValuePair {
                    key: s,
                    value: ctx.parse()?,
                })
            }
            SegLisp::Symbol(_) => Ok(RecordElement::Identifier {
                name: ctx.parse_from(SymbolPattern::Any)?,
            }),
            SegLisp::Sigil("...") => {
                ctx.next();
                Ok(RecordElement::Spread {
                    value: ctx.parse()?,
                })
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
    fn parse(ctx: &NodeContext<'ast, Segment<'ast>>) -> ParseResult<Self> {
        let sigil: &str = ctx
            .parse_from(SigilPattern::OneOf(set! {
                        "==", "!=", "<=", ">=", "<", ">"
            }))?
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
    fn parse(ctx: &NodeContext<'ast, Segment<'ast>>) -> ParseResult<Self> {
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
    fn parse(ctx: &NodeContext<'ast, Segment<'ast>>) -> ParseResult<Self> {
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
    fn parse(ctx: &NodeContext<'ast, Segment<'ast>>) -> ParseResult<Self> {
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
            SegLisp::Symbol("loop") => {
                ctx.next().unwrap();
                Self::Forever(Box::new(ctx.parse()?))
            }
            SegLisp::Symbol("do") => {
                ctx.next().unwrap();
                Self::Do(Box::new(ctx.parse()?))
            }
            SegLisp::Symbol("break") => {
                ctx.next().unwrap();
                Self::Break
            }
            SegLisp::Symbol("continue") => {
                ctx.next().unwrap();
                Self::Continue
            }
            SegLisp::Symbol("pass") => {
                ctx.next().unwrap();
                Self::Pass
            }
            SegLisp::Symbol(_)
                if matches!(ctx.peek().map(|v| &v.value), Some(SegLisp::Sigil("="))) =>
            {
                Self::Set(ctx.parse()?)
            }
            _ => Statement::Expression(Box::new(ctx.parse()?)),
        })
    }
}

#[derive(Debug, Clone, JsInterop)]
pub enum BindingPattern<'ast> {
    Identifier {
        name: Verbatim<'ast>,
    },
    Tuple {
        patterns: ParsedVec<BindingPattern<'ast>>,
    },
    Record {
        elements: ParsedVec<RecordBindingElement<'ast>>,
    },
}

impl_parse! {
    fn <'ast> parse::<BindingPattern<'ast>>(ctx: Segment) {
        match ctx.require_peek()?.value {
            SegLisp::Symbol(_) => Ok(BindingPattern::Identifier {
                name: ctx.parse_from(Symbol!())?
            }),
            SegLisp::List { delimiters : ('(', _), .. } => {
                let mut values: ParsedVec<BindingPattern> = ctx.parse_from(ListPattern::each().expect_delimiter('('))?;
                if values.value.len() == 1 {
                    Ok(values.value.remove(0).value)
                } else {
                    Ok(BindingPattern::Tuple {
                        patterns: values
                    })
                }
            },
            SegLisp::List { delimiters: ('{', _), .. } => {
                Ok(BindingPattern::Record {
                    elements: ctx.parse_from(ListPattern::each().expect_delimiter('{'))?
                })
            },
            _ => Err(ParseError::WrongToken("symbol or list".into()))
        }
    }
}

#[derive(Debug, Clone, JsInterop)]
pub enum RecordBindingElement<'ast> {
    Identifier {
        name: Verbatim<'ast>,
    },
    KeyValuePair {
        name: Verbatim<'ast>,
        pattern: ParseNode<BindingPattern<'ast>>,
    },
    Rest {
        name: Verbatim<'ast>,
    },
}

impl_parse! {
    fn <'ast> parse::<RecordBindingElement<'ast>>(ctx: Segment) {
        let next = ctx.require_peek()?;

        match next.value.clone() {
            SegLisp::Symbol(_)
                if matches!(ctx.peek().map(|v| &v.value), Some(SegLisp::Sigil(":"))) =>
            {
                let s = ctx.parse_from(SymbolPattern::Any)?;
                ctx.next();
                Ok(RecordBindingElement::KeyValuePair {
                    name: s,
                    pattern: ctx.parse()?,
                })
            }
            SegLisp::Symbol(_) => Ok(RecordBindingElement::Identifier {
                name: ctx.parse_from(SymbolPattern::Any)?,
            }),
            SegLisp::Sigil("...") => {
                ctx.next();
                Ok(RecordBindingElement::Rest {
                    name: ctx.parse_from(Symbol!())?,
                })
            }
            _ => Err(ParseError::WrongToken(
                "one of '<symbol> : <expression>', symbol, or '...'".into(),
            )),
        }
    }
}

#[wasm_bindgen]
pub fn parse_bytes(data: &[u8]) -> JsValue {
    let result = seglisp::read_str(
        &Default::default(),
        core::str::from_utf8(data).expect("data was not valid UTF-8"),
    );

    let host = seglisp::parse::ParseHost::default();

    let result = result.parse::<Module>(&host);

    result.to_js_value()
}

#[wasm_bindgen]
pub fn print_parse(data: &[u8]) -> String {
    let result = seglisp::read_str(
        &Default::default(),
        core::str::from_utf8(data).expect("data was not valid UTF-8"),
    );

    let host = seglisp::parse::ParseHost::default();

    let result = result.parse::<Module>(&host);

    format!("{}", result.result.unwrap().value)
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
            Declaration::Const {
                identifier, value, ..
            } => {
                write!(f, "const {} = {}", identifier.value, value.value)?;
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
                        .map(|v| v.value.name.value.to_string())
                        .join(", ")
                )?;

                write!(f, ") = {}", body.value)?;
            }
            _ => write!(f, "<not implemented>")?,
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
            Expression::As {
                expr,
                as_token: _,
                type_: _,
            } => write!(f, "{} as {}", expr.value, "<nimpl>"),
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
                    .map(|v| v.value.name.value.to_string())
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
            Expression::FieldAccess { accessee, field } => {
                write!(f, "({}).{}", accessee.value, field.value)
            }
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
            RecordElement::KeyValuePair { key, value } => {
                write!(f, "{}: ({})", key.value, value.value)
            }
            RecordElement::Identifier { name } => write!(f, "{}", name.value),
            RecordElement::Spread { value } => write!(f, "...({})", value.value),
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
