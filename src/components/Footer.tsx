"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function Footer() {
  const pathname = usePathname();
  const [brand, setBrand] = useState("Lanzarote Travels");
  const [phone, setPhone] = useState("+34 600 000 000");
  const [email, setEmail] = useState("hola@lanzarotetravels.com");
  const [hours, setHours] = useState("Lunes–Domingo · 8:00–20:00");
  const [destinations, setDestinations] = useState<string[]>([
    "Playa Blanca",
    "Puerto Calero",
    "Puerto del Carmen",
    "Arrecife",
    "Costa Teguise",
  ]);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/transfers").then((r) => r.json()),
    ])
      .then(([settingsData, transfersData]) => {
        if (settingsData.settings) {
          setBrand(settingsData.settings.brandName);
          setPhone(settingsData.settings.phone);
          setEmail(settingsData.settings.email);
          setHours(settingsData.settings.hours);
        }
        if (transfersData.destinations?.length) {
          setDestinations(
            transfersData.destinations.map(
              (d: { name: string }) => d.name
            )
          );
        }
      })
      .catch(() => undefined);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-auto border-t border-sand-line bg-bg-deep text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4 md:px-6">
        <div>
          <p className="font-display text-2xl">{brand}</p>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Excursiones en grupo reducido y grupo grande, tours privados,
            minibus a disposición y traslados privados desde el aeropuerto.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold tracking-wide text-white/90 uppercase">
            Explorar
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>
              <Link href="/excursiones" className="hover:text-white">
                Excursiones
              </Link>
            </li>
            <li>
              <Link href="/cruceristas" className="hover:text-white">
                Para cruceristas
              </Link>
            </li>
            <li>
              <Link href="/traslados" className="hover:text-white">
                Traslados
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-white">
                Blog
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold tracking-wide text-white/90 uppercase">
            Traslados aeropuerto
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            {destinations.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold tracking-wide text-white/90 uppercase">
            Contacto
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="hover:text-white"
              >
                {phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${email}`} className="hover:text-white">
                {email}
              </a>
            </li>
            <li>{hours}</li>
            <li>
              <Link href="/admin" className="text-white/40 hover:text-white/70">
                Acceso administración
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {brand}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
