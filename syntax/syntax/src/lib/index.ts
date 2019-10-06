import * as surface from './lang/syntax/surface';
import * as abstract from './lang/syntax/abstract';

import * as compiler from '../test/lower/index';
import * as interp from '../test/interp/eval';

export = {
    SurfaceSyntax : surface,
    AbstractSyntax : abstract,

    LoweringCompiler : compiler.createLoweringCompiler(),
    Interpreter : interp.Interpreter
}