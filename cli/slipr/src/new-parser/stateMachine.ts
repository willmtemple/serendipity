// Copyright (c) William Temple.
// Licensed under the terms of the MIT license.

/* eslint-disable header/header */

import { debug } from "./utils";


// #region State Handler Types

/**
 * The type used to control the behavior of the state machine.
 */
type StateResult<States, Result> = StateTransitionResult<States> | StateResolveResult<Result> | StateRejectResult;

const enum StateResultKind {
    Transition,
    Resolution,
    Rejection
}

interface StateTransitionResult<State> {
    kind: StateResultKind.Transition,
    next: State
}

interface StateResolveResult<Value> {
    kind: StateResultKind.Resolution,
    value: Value
}

interface StateRejectResult {
    kind: StateResultKind.Rejection,
    error: Error
}

const _sm_resolve = <Value extends unknown>(value: Value): StateResolveResult<Value> => ({ kind: StateResultKind.Resolution as const, value });
const _sm_transition = <Next extends unknown>(next: Next): StateTransitionResult<Next> => ({ kind: StateResultKind.Transition as const, next });
const _sm_reject = (error: Error): StateRejectResult => ({ kind: StateResultKind.Rejection as const, error })

type StateResultHandlers<States, Result> = [
    transition: (next: States) => StateTransitionResult<States>,
    resolve: (value: Result) => StateResolveResult<Result>,
    reject: (error: Error) => StateRejectResult
];

/**
 * The type of the state handler, which will produce one of:
 * (1) an error
 * (2) a resolution with a final value
 * (3) a transition to a new state
 */
type StateHandlerFunction<State, States, Result> = (state: State) => Promise<StateResult<States, Result>>;

// #endregion

// #region State Information Types

/**
 * Every state type has to implement this interface, because the `state` key
 * is used for control flow.
 */
type BaseState = { state: string };

/**
 * Defines the execution behavior of the state machine. The properties of
 * this object have methods as their values that produce state results. The
 * method to use as the executor of the state machine is chosen based on the
 * `state` property of the state object. So if the state extends
 * `{ state: "foo" }`, then the `foo` property from this state table will be
 * used to handle the next transition.
 */
type StateTable<States extends BaseState, Result> = {
    [K in States["state"]]: StateHandlerFunction<Extract<States, { state: K}>, States, Result>;
};

// This value will be used as a marker to create a type that
// cannot come from any source but our code.
declare const __sm_constraint_error: unique symbol;

/**
 * A virtual error type that is generated when createStateMachine is
 * given invalid inputs.
 */
type StateMachineError<Message extends string> = {
    [__sm_constraint_error]: "State Machine Error",
    message: Message
}

/**
 * This message indicates that the State Table contained unreachable keys.
 */
type _SM_ERR_UNREACHABLE = "Unreachable handlers were found in the State Table. Only include properties that are possible `state` values.";

/**
 * A state machine, in other words, a function of an initial state that produces a promise
 * to return an eventual value.
 */
type StateMachine<States, Result> = (state: States) => Promise<Result>;

/**
 * A utility type constructor that consumes a function type and produces
 * the type of the keys of its return type that are _not_ included as variants
 * of `state` in a state type. This is used to generate an error, and is a
 * utility type just to avoid writing it inline later.
 */
type ExtraFunctionReturnKeys<Func extends (...args: never[]) => unknown, States extends BaseState> = Exclude<keyof ReturnType<Func>, States["state"]>

/**
 * Create a state machine from a descriptor.
 * 
 * @param descriptor - defines the state machine, this function is used to bind the state transition handlers
 *                     into the state table, giving the entries in the state table the ability to resolve,
 *                     transition, or reject the state machine.
 * @returns a state machine, in other words, a function of an initial state that produces a
 *          promise to return an eventual value
 */
type StateMachineDescriptor<States, Result, Table> = (...handlers: StateResultHandlers<States, Result>) => Table;

/**
 * Create a state machine descriptor with tightly bound types. The only purpose of this outer function is to
 * provide strong type boundaries in the generic types `States` and `Result`. The state machine is actually
 * described using the descriptor function that is returned from this one.
 * 
 * @returns a state machine descriptor, in other words, a function that consumes a descriptor and produces
 *          a state machine
 */
export function createStateMachine<States extends BaseState, Result>(): <Table extends StateTable<States, Result>>(
    descriptor: StateMachineDescriptor<States, Result, Table>
) => ExtraFunctionReturnKeys<typeof descriptor, States> extends never ? StateMachine<States, Result> : StateMachineError<_SM_ERR_UNREACHABLE> {
    // This outer lambda and the nested factory pattern to construct the state machines
    // are required for really strange reasons, but they come down to
    // inflexibility in TypeScript with respect to optional and inferred generics
    // _It is required to have the strongest type checking on the State Table_
    return (descriptor) => {
    // Construct the state table
    const table = descriptor(_sm_transition, _sm_resolve, _sm_reject);

    // This function becomes the actual state machine
    const handler: StateMachine<States, Result> = (async (init: States) => {
        let state: States = init;
        do {
            // Get the result of the state, catching any exceptions and converting them to rejection results
            const result = await ((): Promise<StateResult<States, Result>> => {
                try {
                    return table[state.state as States["state"]](state as Extract<States, { state: States["state"]}>);
                } catch (error: unknown) {
                    return Promise.resolve({
                        kind: StateResultKind.Rejection,
                        error: error as Error
                    });
                }
            })();

            switch (result.kind) {
                case StateResultKind.Resolution:
                    return result.value;
                case StateResultKind.Rejection:
                    throw result.error;
                case StateResultKind.Transition:
                    state = result.next;
                    break;
                default:
                    // Following line is only valid if this is unreachable and `typeof result`
                    // can be refined to `never`
                    debug.exhaust(result);
            }
        // We're using a constant condition sensibly here.
        // eslint-disable-next-line no-constant-condition
        } while (true);
    })
    
    // Cast to never here is required due to the complexity of the return type.
    // I could cast it to that type, but why bother writing that out when there's
    // a constraint on `const handler: StateMachine<...>` above?

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return handler as never;
    }
}

// #endregion
