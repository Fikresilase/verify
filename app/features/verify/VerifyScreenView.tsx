"use client";

import { CbeSuffixModal } from "./CbeSuffixModal";
import { ScannerCard } from "./ScannerCard";
import type { ReceiptVerificationState } from "./useReceiptVerification";

export function VerifyScreenView({ state }: { state: ReceiptVerificationState }) {
  return (
    <section className="mx-auto flex h-full min-h-0 w-full max-w-xl items-center justify-center">
      <div className="w-full">
        <ScannerCard
          accountSuffix={state.accountSuffix}
          isProcessing={state.isProcessing}
          loadingStage={state.loadingStage}
          onCapture={state.handleCapture}
          onClear={state.clearReceipt}
          onDemo={state.handleDemoReceipt}
          onVerify={() => void state.handleVerify()}
          previewImage={state.previewImage}
        />
        {state.showSuffixPrompt && (
          <CbeSuffixModal
            accountNumber={state.suffixAccountNumber}
            onAccountNumberChange={state.setSuffixAccountNumber}
            onClose={() => state.setShowSuffixPrompt(false)}
            onSave={state.saveSuffix}
            suffix={state.suffix}
          />
        )}
      </div>
    </section>
  );
}
