import { NextResponse } from "next/server";
import {
  addBooking,
  getBookings,
  markCashCollected,
  updateBooking,
  updateBookingStatus,
} from "@/lib/bookings";
import {
  createCreditNoteForBooking,
  createInvoiceForBooking,
} from "@/lib/invoices";
import { assessCancellation } from "@/lib/cancellation";
import {
  assignBookingToCruiseGroup,
  syncCruiseGroupCapacity,
} from "@/lib/cruise-groups";
import { getTransfersData } from "@/lib/content";
import { getCruiseShoreTourById } from "@/lib/cruise-itineraries";
import { getTourById } from "@/lib/content";
import { isTourDateBookable } from "@/lib/tour-availability";
import { notifyNewBooking } from "@/lib/notify";
import {
  calcTransferTotal,
  type TransferDirection,
} from "@/lib/transfer-price";
import type { BookingStatus, PaymentMethod } from "@/types";

function isDateBlocked(
  blockedDates: Array<{ date: string; seats?: number }> | undefined,
  date: string
): boolean {
  if (!blockedDates?.length) return false;
  return blockedDates.some((b) => b.date === date);
}

export async function GET() {
  const bookings = await getBookings();
  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      type,
      tourId,
      tourTitle,
      date,
      time,
      adults,
      children,
      totalPrice,
      paymentMethod,
      customer,
      transfer,
      minibus,
      groupId,
      locale,
      status: requestedStatus,
      pickupZone,
      bookingMethod,
      source,
    } = body;

    if (!type || !tourTitle || !date || !customer?.name || !customer?.email) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    if (tourId) {
      const tourIdStr = String(tourId);
      const shoreTour = await getCruiseShoreTourById(tourIdStr);
      if (shoreTour && isDateBlocked(shoreTour.blockedDates, String(date))) {
        return NextResponse.json(
          { error: "Esta fecha no está disponible para la excursión" },
          { status: 400 }
        );
      }

      if (!shoreTour && (type === "tour" || type === "minibus")) {
        const tour = await getTourById(tourIdStr);
        if (tour && !isTourDateBookable(tour, String(date))) {
          return NextResponse.json(
            {
              error:
                "Ese día no hay excursión. Elija una fecha disponible en el calendario.",
            },
            { status: 400 }
          );
        }
      }
    }

    const normalizedTime =
      typeof time === "string" && time.trim() ? time.trim() : undefined;
    const transferPayload =
      transfer && typeof transfer === "object"
        ? {
            ...transfer,
            time:
              (typeof transfer.time === "string" && transfer.time.trim()) ||
              normalizedTime,
            returnDate:
              typeof transfer.returnDate === "string" && transfer.returnDate.trim()
                ? transfer.returnDate.trim().slice(0, 10)
                : undefined,
            returnTime:
              typeof transfer.returnTime === "string" && transfer.returnTime.trim()
                ? transfer.returnTime.trim()
                : undefined,
          }
        : transfer;

    const methodNorm =
      typeof bookingMethod === "string" && bookingMethod.trim()
        ? bookingMethod.trim().toLowerCase()
        : undefined;

    const status =
      requestedStatus === "pending" ||
      requestedStatus === "confirmed" ||
      requestedStatus === "completed" ||
      requestedStatus === "cancelled"
        ? requestedStatus
        : methodNorm === "request" || methodNorm === "phone"
          ? "pending"
          : "confirmed";

    const localeNorm =
      typeof locale === "string" && locale.trim()
        ? locale.trim().toLowerCase().slice(0, 5)
        : undefined;

    const adultsNum = Number(adults) || 1;
    const childrenNum = Number(children) || 0;
    let resolvedTotal = Number(totalPrice) || 0;

    if (type === "transfer" && transferPayload) {
      const transfers = await getTransfersData();
      const destId =
        typeof transferPayload.destinationId === "string"
          ? transferPayload.destinationId
          : undefined;
      const destName =
        typeof transferPayload.destination === "string"
          ? transferPayload.destination
          : undefined;
      const dest =
        transfers.destinations.find((d) => d.id === destId) ||
        transfers.destinations.find(
          (d) => d.name.toLowerCase() === String(destName || "").toLowerCase()
        );
      const dir = transferPayload.direction as TransferDirection | undefined;
      if (
        dest &&
        (dir === "airport_to_hotel" ||
          dir === "hotel_to_airport" ||
          dir === "return")
      ) {
        resolvedTotal = calcTransferTotal({
          destination: dest,
          direction: dir,
          passengers: adultsNum + childrenNum,
        });
      }
    }

    let booking = await addBooking({
      type,
      tourId,
      tourTitle,
      date,
      time: normalizedTime || transferPayload?.time,
      adults: adultsNum,
      children: childrenNum,
      totalPrice: resolvedTotal,
      paymentMethod: (paymentMethod as PaymentMethod) || "card",
      paymentStatus: status === "pending" ? "unpaid" : "paid",
      customer,
      transfer: transferPayload,
      minibus,
      status,
      locale: localeNorm,
      pickupZone:
        typeof pickupZone === "string" && pickupZone.trim()
          ? pickupZone.trim()
          : undefined,
      groupId: groupId ? String(groupId) : undefined,
    });

    if (customer?.cruiseShip || booking.groupId) {
      const assigned = await assignBookingToCruiseGroup(booking);
      booking = assigned.booking;
    }

    const invoice = await createInvoiceForBooking(booking);

    void notifyNewBooking(booking, {
      bookingMethod: methodNorm,
      source: typeof source === "string" ? source : undefined,
    }).catch((err) => {
      console.error("[bookings] notify failed", err);
    });

    return NextResponse.json({ booking, invoice }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "No se pudo crear la reserva" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, collectCash, cancellationReason, customer } = body as {
      id: string;
      status?: BookingStatus;
      collectCash?: boolean;
      cancellationReason?: string;
      customer?: Partial<{
        name: string;
        email: string;
        phone: string;
        hotel: string;
        cruiseShip: string;
        flightNumber: string;
        notes: string;
        taxId: string;
      }>;
    };
    if (!id) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    if (collectCash) {
      const booking = await markCashCollected(id);
      if (!booking) {
        return NextResponse.json({ error: "No encontrada" }, { status: 404 });
      }
      return NextResponse.json({ booking });
    }

    if (customer && typeof customer === "object") {
      const existing = (await getBookings()).find((b) => b.id === id);
      if (!existing) {
        return NextResponse.json({ error: "No encontrada" }, { status: 404 });
      }
      const name =
        customer.name != null ? String(customer.name).trim() : existing.customer.name;
      if (!name) {
        return NextResponse.json(
          { error: "El nombre no puede estar vacío" },
          { status: 400 }
        );
      }
      const booking = await updateBooking(id, {
        customer: {
          ...existing.customer,
          ...Object.fromEntries(
            Object.entries(customer).map(([key, value]) => [
              key,
              value == null ? "" : String(value).trim(),
            ])
          ),
          name,
        },
      });
      if (!booking) {
        return NextResponse.json({ error: "No encontrada" }, { status: 404 });
      }
      return NextResponse.json({ booking });
    }

    if (!status) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    if (status === "cancelled") {
      const existing = (await getBookings()).find((b) => b.id === id);
      if (!existing) {
        return NextResponse.json({ error: "No encontrada" }, { status: 404 });
      }
      const assessment = assessCancellation(existing);
      const booking = await updateBooking(id, {
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancellationFee: assessment.fee,
        cancellationReason:
          (cancellationReason && String(cancellationReason).trim()) ||
          existing.cancellationReason ||
          "admin",
        ...(assessment.refundAmount > 0
          ? { paymentStatus: "refunded" as const }
          : {}),
      });
      if (!booking) {
        return NextResponse.json({ error: "No encontrada" }, { status: 404 });
      }
      if (booking.groupId) {
        try {
          await syncCruiseGroupCapacity(booking.groupId);
        } catch {
          /* ignore capacity sync errors on cancel */
        }
      }
      let creditNote = null;
      if (assessment.refundAmount > 0) {
        creditNote = await createCreditNoteForBooking(booking, {
          refundAmount: assessment.refundAmount,
        });
      }
      return NextResponse.json({ booking, creditNote, assessment });
    }

    const booking = await updateBookingStatus(id, status);
    if (!booking) {
      return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
