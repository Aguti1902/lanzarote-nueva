"use client";

import type { ReactNode, MouseEvent } from "react";
import {
  isAndroidUserAgent,
  whatsappAndroidMessengerIntent,
  whatsappUrl,
} from "@/lib/whatsapp";

type Props = {
  locale: string;
  className?: string;
  children: ReactNode;
  /** Optional pre-filled message; defaults to a localized greeting */
  text?: string;
};

/**
 * Opens WhatsApp with a localized message.
 * On Android, prefers the Messenger app package so devices with WhatsApp Business
 * installed (but not registered) do not show the Business error dialog.
 */
export function WhatsAppLink({ locale, className, children, text }: Props) {
  const href = whatsappUrl(locale, text);

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!isAndroidUserAgent()) return;
    e.preventDefault();
    window.location.href = whatsappAndroidMessengerIntent(locale, text);
  }

  return (
    <a
      href={href}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  );
}
