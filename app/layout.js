import "./globals.css";

export const metadata = {
  title: "Dhorpatan Jam Polls",
  description: "Poll and vote app for Dhorpatan Jam"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
