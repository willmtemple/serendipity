// Copyright (c) Serendipity Project Contributors
// All rights reserved.
// Licensed under the terms of the GNU General Public License v3 or later.

import { Module } from "@serendipity/syntax-surface";

export const surfaceExample: Module = {
  globals: [
    {
      globalKind: "define",
      name: "recList",
      value: {
        exprKind: "tuple",
        values: [
          {
            exprKind: "number",
            value: 1
          },
          {
            exprKind: "name",
            name: "recList"
          }
        ]
      }
    },
    {
      globalKind: "definefunc",
      name: "take",
      parameters: ["n", "list"],
      body: {
        exprKind: "if",
        cond: {
          exprKind: "compare",
          op: "==",
          left: {
            exprKind: "name",
            name: "n"
          },
          right: {
            exprKind: "number",
            value: 0
          }
        },
        then: {
          exprKind: "void"
        },
        _else: {
          exprKind: "tuple",
          values: [
            {
              exprKind: "accessor",
              accessee: {
                exprKind: "name",
                name: "list"
              },
              index: {
                exprKind: "number",
                value: 0
              }
            },
            {
              exprKind: "call",
              callee: {
                exprKind: "name",
                name: "take"
              },
              parameters: [
                {
                  exprKind: "arithmetic",
                  op: "-",
                  left: {
                    exprKind: "name",
                    name: "n"
                  },
                  right: {
                    exprKind: "number",
                    value: 1
                  }
                },
                {
                  exprKind: "accessor",
                  accessee: {
                    exprKind: "name",
                    name: "list"
                  },
                  index: {
                    exprKind: "number",
                    value: 1
                  }
                }
              ]
            }
          ]
        }
      }
    },
    {
      globalKind: "define",
      name: "recListFunc",
      value: {
        exprKind: "closure",
        parameters: ["n"],
        body: {
          exprKind: "tuple",
          values: [
            {
              exprKind: "name",
              name: "n"
            },
            {
              exprKind: "call",
              callee: {
                exprKind: "name",
                name: "recListFunc"
              },
              parameters: [
                {
                  exprKind: "arithmetic",
                  op: "*",
                  left: {
                    exprKind: "name",
                    name: "n"
                  },
                  right: {
                    exprKind: "number",
                    value: 2
                  }
                }
              ]
            }
          ]
        }
      }
    },
    {
      globalKind: "define",
      name: "mkMain",
      value: {
        exprKind: "closure",
        body: {
          exprKind: "procedure",
          body: [
            {
              statementKind: "forin",
              binding: "x",
              value: {
                exprKind: "list",
                contents: [
                  {
                    exprKind: "number",
                    value: 1
                  },
                  {
                    exprKind: "number",
                    value: 2
                  },
                  {
                    exprKind: "number",
                    value: 3
                  },
                  {
                    exprKind: "number",
                    value: 4
                  }
                ]
              },
              body: {
                statementKind: "print",
                value: {
                  exprKind: "name",
                  name: "x"
                }
              }
            },
            {
              statementKind: "print",
              value: {
                exprKind: "call",
                callee: {
                  exprKind: "closure",
                  body: {
                    exprKind: "arithmetic",
                    op: "*",
                    left: {
                      exprKind: "name",
                      name: "foo"
                    },
                    right: {
                      exprKind: "number",
                      value: 5
                    }
                  },
                  parameters: ["foo"]
                },
                parameters: [
                  {
                    exprKind: "arithmetic",
                    op: "+",
                    left: {
                      exprKind: "number",
                      value: 10
                    },
                    right: {
                      exprKind: "name",
                      name: "n"
                    }
                  }
                ]
              }
            },
            {
              statementKind: "forin",
              binding: "i",
              value: {
                exprKind: "call",
                callee: {
                  exprKind: "name",
                  name: "take"
                },
                parameters: [
                  {
                    exprKind: "number",
                    value: 32
                  },
                  {
                    exprKind: "call",
                    parameters: [
                      {
                        exprKind: "number",
                        value: 1
                      }
                    ],
                    callee: {
                      exprKind: "name",
                      name: "recListFunc"
                    }
                  }
                ]
              },
              body: {
                statementKind: "do",
                body: {
                  exprKind: "procedure",
                  body: [
                    {
                      statementKind: "print",
                      value: {
                        exprKind: "name",
                        name: "i"
                      }
                    }
                  ]
                }
              }
            },
            /* {
                            statementKind: "forin",
                            binding: "i",
                            value: {
                                exprKind: "call",
                                parameters: [
                                    {
                                        exprKind: "number",
                                        value: 2
                                    }
                                ],
                                callee: {
                                    exprKind: "name",
                                    name: "recListFunc"
                                }
                            },
                            body: {
                                statementKind: "do",
                                body: {
                                    exprKind: "procedure",
                                    body: [
                                        {
                                            statementKind: "print",
                                            value: {
                                                exprKind: "name",
                                                name: "i"
                                            }
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            statementKind: "forin",
                            binding: "i",
                            value: {
                                exprKind: "name",
                                name: "recList",
                            },
                            body: {
                                statementKind: "do",
                                body: {
                                    exprKind: "procedure",
                                    body: [
                                        {
                                            statementKind: "print",
                                            value: {
                                                exprKind: "name",
                                                name: "i"
                                            }
                                        }
                                    ]
                                }
                            }
                        },*/
            {
              statementKind: "forin",
              binding: "i",
              value: {
                exprKind: "call",
                parameters: [
                  {
                    exprKind: "number",
                    value: 1
                  },
                  {
                    exprKind: "number",
                    value: 22
                  }
                ],
                callee: {
                  exprKind: "name",
                  name: "range"
                }
              },
              body: {
                statementKind: "do",
                body: {
                  exprKind: "procedure",
                  body: [
                    {
                      statementKind: "print",
                      value: {
                        exprKind: "name",
                        name: "i"
                      }
                    }
                  ]
                }
              }
            }
          ]
        },
        parameters: ["n"]
      }
    },
    {
      globalKind: "define",
      name: "foo",
      value: {
        exprKind: "arithmetic",
        op: "%",
        left: {
          exprKind: "number",
          value: 10
        },
        right: {
          exprKind: "number",
          value: 7
        }
      }
    },
    {
      globalKind: "define",
      name: "range",
      value: {
        exprKind: "closure",
        parameters: ["i", "n"],
        body: {
          exprKind: "if",
          cond: {
            exprKind: "compare",
            op: ">=",
            left: {
              exprKind: "name",
              name: "i"
            },
            right: {
              exprKind: "name",
              name: "n"
            }
          },
          then: {
            exprKind: "void"
          },
          _else: {
            exprKind: "tuple",
            values: [
              {
                exprKind: "name",
                name: "i"
              },
              {
                exprKind: "call",
                callee: {
                  exprKind: "name",
                  name: "range"
                },
                parameters: [
                  {
                    exprKind: "arithmetic",
                    op: "+",
                    left: {
                      exprKind: "name",
                      name: "i"
                    },
                    right: {
                      exprKind: "number",
                      value: 1
                    }
                  },
                  {
                    exprKind: "name",
                    name: "n"
                  }
                ]
              }
            ]
          }
        }
      }
    },
    {
      globalKind: "main",
      body: {
        exprKind: "call",
        callee: {
          exprKind: "name",
          name: "mkMain"
        },
        parameters: [
          {
            exprKind: "name",
            name: "foo"
          }
        ]
      }
    }
  ]
};
