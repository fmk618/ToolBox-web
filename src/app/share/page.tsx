import type { Metadata } from "next";
import ShareDecryptClient from "./share-decrypt-client";

export const metadata: Metadata = {
  title: "加密分享",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SharePage() {
  return <ShareDecryptClient />;
}
