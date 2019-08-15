import { inject, IWrappedComponent } from 'mobx-react';
import { stores as _stores } from '../hooks/stores';

type Stores = typeof _stores;

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type Subtract<T, K> = Omit<T, keyof K>;

export default function withStores<TInjectedProps extends keyof Stores>(
    ...stores: TInjectedProps[]
) {
    function injected<TComponentProps extends Pick<Stores, TInjectedProps>>(
        c: React.ComponentType<TComponentProps>
    ) {
        return (inject(... stores)(c) as any) as
            React.FC<
                Subtract<TComponentProps, Pick<Stores, TInjectedProps>> &
                Partial<Pick<Stores, TInjectedProps>>
            > &
            IWrappedComponent<TComponentProps>;
    }

    return injected;
}