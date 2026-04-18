// // ReceiptVoucher.tsx
// import { PaymentState } from "@/types/receiptType";
// import { Account } from "@/types/sendTransferTypes";
// import { forwardRef } from "react";

// interface Props {
//   state: PaymentState;
//   customer: Account;
// }

// const ReceiptVoucher = forwardRef<HTMLDivElement, Props>(({ state, customer }, ref) => {
//   return (
//     <div ref={ref} className="w-[210mm] h-[148mm] p-6 border rounded-md text-[12px]">
//       {/* Header */}
//       <div className="flex justify-between border-b pb-2 mb-3">
//         <div>
//           <h1 className="text-lg font-bold">YOUR COMPANY NAME HERE</h1>
//           <p className="text-xs text-gray-600">YOUR COMPANY TAGLINE HERE</p>
//         </div>
//         <div className="text-right text-xs">
//           <p>Tel.: 04 666 0000</p>
//           <p>Fax: 04 555 6666</p>
//           <p>P.O. Box: 00000</p>
//           <p>Dubai - U.A.E.</p>
//         </div>
//       </div>

//       {/* Voucher Header */}
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="font-bold">RECEIPT VOUCHER</h2>
//         <p className="font-bold text-red-600">No. {state.orderVoucherNo || "----"}</p>
//       </div>

//       {/* Info */}
//       <p className="mb-2">Received from: <span className="font-bold">{customer.name}</span></p>
//       <p className="mb-2">Phone: {customer.phone || "------"}</p>
//       <p className="mb-2">The sum of Dirhams: <span className="font-bold">{state.totalAmount}</span></p>
//       <p className="mb-2">Discount: {state.discount}</p>
//       <p className="mb-2">Note: {state.note}</p>
//       <p className="mb-6">Date: {state.createdAt instanceof Date ? state.createdAt.toLocaleDateString() : state.createdAt}</p>

//       {/* Signatures */}
//       <div className="flex justify-between mt-12 text-xs">
//         <p>Receivers Sign توقيع المستلم</p>
//         <p>Accountant المحاسب</p>
//       </div>
//     </div>
//   );
// });

// export default ReceiptVoucher;
