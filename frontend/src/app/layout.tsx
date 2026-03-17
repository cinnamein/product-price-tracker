import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "올리브영 제품 시세",
  description: "올리브영 제품의 가격 변동을 추적합니다",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div
          style={{
            maxWidth: 460,
            margin: "0 auto",
            minHeight: "100vh",
            background: "#fff",
            boxShadow: "0 0 40px rgba(0,0,0,0.06)",
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
