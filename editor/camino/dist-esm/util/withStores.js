import { inject } from 'mobx-react';
export default function withStores(...stores) {
    function injected(c) {
        return inject(...stores)(c);
    }
    return injected;
}
