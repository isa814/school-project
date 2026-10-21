import { startInvoicePaymentAction } from "@/app/actions/student";
import { Input, Label, SubmitButton } from "@/components/ui";

/** Server-action payment form. Amount is entered in naira; the action converts it to kobo and checks the balance. */
export function PayForm({ invoiceId, outstandingKobo }: { invoiceId: string; outstandingKobo: number }) {
  const naira = (outstandingKobo / 100).toFixed(2);
  return (
    <form action={startInvoicePaymentAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <div>
        <Label htmlFor={`amt-${invoiceId}`}>Amount (NGN)</Label>
        <Input id={`amt-${invoiceId}`} name="amount" type="number" step="0.01" min="100" max={naira} defaultValue={naira} className="w-40" required />
      </div>
      <SubmitButton pendingText="Opening Paystack…">Pay with Paystack</SubmitButton>
    </form>
  );
}
