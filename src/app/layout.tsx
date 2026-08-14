import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "खेजरोली नगर पालिका नागरिक मंच | चुनाव 2026",
  description: "खेजरोली नगर पालिका चुनावों के लिए नागरिक सुझाव, फीडबैक और विकास लाइव डैशबोर्ड। आओ मिलकर बनाएं एक बेहतर खेजरोली।",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="hi">
      <body>
        {children}
      </body>
    </html>
  );
}
