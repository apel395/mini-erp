import './globals.css'

export const metadata = {
  title: 'Nexus Invoicing Web Console',
  description: 'Clean Room Mini ERP Interface UI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}