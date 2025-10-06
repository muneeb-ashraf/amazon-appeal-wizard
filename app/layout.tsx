import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
    title: 'Amazon Appeal Wizard',
    description: 'A minimal Next.js app scaffold'
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    )
}
