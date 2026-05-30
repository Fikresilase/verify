"use client";

import Image from "next/image";
import { Icon } from "@/app/components/Icon";
import type { LoadingStage } from "./types";

export function ScannerCard({
  accountSuffix,
  isProcessing,
  loadingStage,
  onCapture,
  onClear,
  onDemo,
  onVerify,
  previewImage,
}: {
  accountSuffix: string;
  isProcessing: boolean;
  loadingStage: LoadingStage;
  onCapture: (file: File) => void;
  onClear: () => void;
  onDemo: () => void;
  onVerify: () => void;
  previewImage: string;
}) {
  return (
    <div className="surface-line overflow-hidden rounded-lg border bg-[#fbfdfb] p-4 shadow-[0_24px_70px_rgba(13,23,36,0.12)]">
      <div
        className={`relative flex w-full items-center justify-center overflow-hidden rounded-lg border border-[#c6c6cd] bg-[#eef4f8] ${
          previewImage ? "h-[min(58vw,300px)] min-h-48 md:aspect-square md:h-auto" : "h-[min(52vw,240px)] min-h-40 md:h-72"
        }`}
      >
        {previewImage ? <ReceiptPreview image={previewImage} /> : <CameraCaptureButton isProcessing={isProcessing} />}
        {previewImage && !isProcessing && <ClearPreviewButton onClear={onClear} />}
      </div>
      <CameraActions
        accountSuffix={accountSuffix}
        isProcessing={isProcessing}
        loadingStage={loadingStage}
        onDemo={onDemo}
        onVerify={onVerify}
        previewImage={previewImage}
      />
      <input
        id="receipt-camera-input"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={isProcessing}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onCapture(file);
          event.target.value = "";
        }}
        type="file"
      />
    </div>
  );
}

function ClearPreviewButton({ onClear }: { onClear: () => void }) {
  return (
    <button
      aria-label="Upload another receipt"
      className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#c6c6cd] bg-[#fbfdfb]/95 text-[#ba1a1a] shadow-[0_14px_30px_-18px_rgba(17,24,39,0.7)]"
      onClick={onClear}
      type="button"
    >
      <span className="text-2xl font-black leading-none">x</span>
    </button>
  );
}

function ReceiptPreview({ image }: { image: string }) {
  return <Image alt="Captured receipt" className="object-cover" fill sizes="(max-width: 768px) 100vw, 600px" src={image} unoptimized />;
}

function CameraCaptureButton({ isProcessing }: { isProcessing: boolean }) {
  return (
    <label
      aria-disabled={isProcessing}
      className="flex h-28 w-28 cursor-pointer items-center justify-center rounded-full bg-[#111827] text-[#fbfdfb] shadow-[0_24px_50px_-28px_rgba(17,24,39,0.82)]"
      htmlFor="receipt-camera-input"
    >
      <Icon name="camera" size={44} />
      <span className="sr-only">Open camera</span>
    </label>
  );
}

function CameraActions({
  accountSuffix,
  isProcessing,
  loadingStage,
  onDemo,
  onVerify,
  previewImage,
}: {
  accountSuffix: string;
  isProcessing: boolean;
  loadingStage: LoadingStage;
  onDemo: () => void;
  onVerify: () => void;
  previewImage: string;
}) {
  return (
    <div className="px-2 pt-4 text-center md:pt-5">
      <h1 className="text-xl font-bold text-[#111827] md:text-2xl">{getVerifyTitle({ isProcessing, loadingStage, previewImage })}</h1>
      <p className="mx-auto mt-1.5 max-w-xs text-sm font-medium leading-5 text-[#45464d] md:mt-2">
        {previewImage ? "Review the captured receipt, then verify the transaction." : "Tap the camera button after the payment receipt is visible."}
      </p>
      {previewImage && !isProcessing && (
        <div className="mx-auto mt-4 w-full max-w-xs space-y-3 md:mt-5">
          {accountSuffix && <div className="rounded-lg border border-[#c6c6cd] bg-[#fbfdfb] px-3 py-2 text-xs font-semibold text-[#45464d]">CBE suffix: {accountSuffix}</div>}
          <button className="h-12 w-full rounded-lg bg-[#111827] text-base font-bold text-[#fbfdfb] shadow-[0_16px_34px_-22px_rgba(17,24,39,0.8)]" onClick={onVerify} type="button">
            Verify Receipt
          </button>
        </div>
      )}
      {!previewImage && !isProcessing && (
        <button className="mt-3 text-sm font-bold text-[#006c49] md:mt-5" onClick={onDemo} type="button">
          Try sample receipt
        </button>
      )}
    </div>
  );
}

function getVerifyTitle({ isProcessing, loadingStage, previewImage }: { isProcessing: boolean; loadingStage: LoadingStage; previewImage: string }) {
  if (loadingStage === "checking_image") return "Checking the image";
  if (loadingStage === "verifying_transaction") return "Verifying the transaction";
  if (isProcessing) return "Verifying receipt";
  if (previewImage) return "Receipt captured";
  return "Capture your receipt";
}
