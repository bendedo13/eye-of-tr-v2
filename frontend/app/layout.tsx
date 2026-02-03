import { ReactNode } from 'react';
import './globals.css';

type Props = {
    children: ReactNode;
};

// Since we have a root layout, but we want our localized layout to handle
// most of the configuration, we keep this as minimal as possible.
export default function RootLayout({ children }: Props) {
    return children;
}
