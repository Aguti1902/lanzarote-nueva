"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { Booking } from "@/types";
import { assessCancellation } from "@/lib/cancellation";
import { formatDateShort, formatPrice } from "@/lib/format";
import { PageHero } from "@/components/PageHero";
import { useLocale } from "@/components/LocaleProvider";
import { useSettingsHero } from "@/hooks/useSettingsHero";

const inputClass =
  "w-full rounded border border-sand-line bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20";

type Step = "lookup" | "cancel" | "done";

export default function CancelarReservaPage() {
  const { dict, href } = useLocale();
  const hero = useSettingsHero("excursions");
  const c = dict.cancel;
  const [step, setStep] = useState<Step>("lookup");
  const [bookingId, setBookingId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [selected, setSelected] = useState(false);
  const [reason, setReason] = useState("");
  const [doneMessage, setDoneMessage] = useState("");

  const assessment = useMemo(
    () => (booking ? assessCancellation(booking) : null),
    [booking]
  );

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBooking(null);
    setLoading(true);
    try {
      const res = await fetch("/api/bookings/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      const found = data.booking as Booking;
      if (found.status === "cancelled") {
        setError(c.alreadyCancelled);
        return;
      }
      if (found.status === "completed") {
        setError(c.alreadyCompleted);
        return;
      }
      setBooking(found);
      setSelected(false);
      setReason("");
      setStep("cancel");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(e: FormEvent) {
    e.preventDefault();
    if (!booking) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          email,
          reason,
          confirm_service: selected,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setDoneMessage(data.message || c.success);
      setBooking(data.booking as Booking);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  function statusLabel(status: Booking["status"]) {
    const map = {
      pending: c.statusPending,
      confirmed: c.statusConfirmed,
      completed: c.statusCompleted,
      cancelled: c.statusCancelled,
    };
    return map[status] || status;
  }

  return (
    <>
      <PageHero
        image={hero.image}
        title={c.title}
        subtitle={c.subtitle}
        compact
        objectPosition={hero.objectPosition}
      />

      <section className="mx-auto max-w-2xl px-4 py-14 md:px-6">
        {step === "lookup" && (
          <form
            onSubmit={handleLookup}
            className="animate-fade-up space-y-4 bg-white p-6 ring-1 ring-sand-line md:p-8"
          >
            <p className="text-sm text-ink-muted">{c.intro}</p>
            <div>
              <label className="mb-1 block text-sm font-bold">
                {dict.manage.bookingId}
              </label>
              <input
                className={inputClass}
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="R-1001 / CR-1001 / T-1001 / BK-1001"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold">
                {dict.common.email}
              </label>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-60"
            >
              {loading ? dict.manage.searching : c.continue}
            </button>
            <Link
              href={href("/gestionar-reserva")}
              className="inline-flex items-center gap-2 text-sm font-bold text-ocean hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              {c.backManage}
            </Link>
          </form>
        )}

        {step === "cancel" && booking && assessment && (
          <form
            onSubmit={handleCancel}
            className="animate-fade-up space-y-8 bg-white p-6 ring-1 ring-sand-line md:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep("lookup");
                  setBooking(null);
                  setError("");
                }}
                className="inline-flex items-center gap-2 rounded border border-ocean/40 px-4 py-2 text-sm font-bold text-ocean hover:bg-sky-soft"
              >
                <ArrowLeft className="h-4 w-4" />
                {c.back}
              </button>
              <p className="text-sm text-ink-muted">
                {dict.confirmation.locator}{" "}
                <span className="font-bold text-ocean">{booking.id}</span>
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl text-ink">{c.whichService}</h2>
              <label
                className={`mt-4 flex cursor-pointer gap-4 border p-4 transition ${
                  selected
                    ? "border-ocean bg-ocean/5"
                    : "border-sand-line bg-sky-soft/40 hover:border-ocean/40"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 accent-[var(--ocean)]"
                  checked={selected}
                  onChange={(e) => setSelected(e.target.checked)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-ink">
                    {booking.tourTitle}
                  </span>
                  <span className="mt-1 block text-sm text-ink-muted">
                    {c.serviceDate}: {formatDateShort(booking.date)} ·{" "}
                    {booking.adults + (booking.children || 0)} {c.passengers}
                  </span>
                  <span className="mt-1 block text-sm">
                    {dict.common.total}:{" "}
                    <strong>
                      {formatPrice(booking.amountTotal ?? booking.totalPrice)}
                    </strong>
                    {" · "}
                    {dict.manage.status}: {statusLabel(booking.status)}
                  </span>
                  {assessment.free ? (
                    <span className="mt-2 block text-sm font-bold text-success">
                      {c.freeCancel}
                    </span>
                  ) : (
                    <span className="mt-2 block text-sm font-bold text-red-600">
                      {c.feeCancel.replace(
                        "{fee}",
                        formatPrice(assessment.fee)
                      )}
                    </span>
                  )}
                </span>
              </label>
            </div>

            <fieldset>
              <legend className="font-display text-lg text-ink">
                {c.reasonTitle}
              </legend>
              <div className="mt-4 space-y-3">
                {c.reasons.map((item) => (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-start gap-3 text-sm"
                  >
                    <input
                      type="radio"
                      name="cancel-reason"
                      className="mt-0.5 accent-[var(--ocean)]"
                      value={item.id}
                      checked={reason === item.id}
                      onChange={() => setReason(item.id)}
                      required
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading || !selected || !reason}
              className="btn-primary w-full justify-center disabled:opacity-60"
            >
              {loading ? c.cancelling : c.submit}
            </button>
          </form>
        )}

        {step === "done" && (
          <div className="animate-fade-up bg-white p-8 text-center ring-1 ring-sand-line">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h2 className="mt-4 font-display text-2xl text-ink">{c.doneTitle}</h2>
            <p className="mt-3 text-ink-muted">{doneMessage}</p>
            {booking && (
              <p className="mt-4 text-sm">
                {dict.confirmation.locator}{" "}
                <strong className="text-ocean">{booking.id}</strong>
              </p>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={href("/")} className="btn-primary">
                {dict.common.backHome}
              </Link>
              <Link
                href={href("/gestionar-reserva")}
                className="rounded border border-ocean/40 px-5 py-3 text-sm font-bold text-ocean hover:bg-sky-soft"
              >
                {c.backManage}
              </Link>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
