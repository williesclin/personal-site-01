import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'QuantPath Labs｜以數據理解機率，以紀錄改善決策',description:'樂透機率分析、個人預算規劃與模型驗證工作台。',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="zh-Hant"><body>{children}</body></html>}
