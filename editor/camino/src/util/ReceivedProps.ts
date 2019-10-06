export type ReceivedProps<T> = Readonly<T> & Readonly<{
    children? : React.ReactNode
}>;