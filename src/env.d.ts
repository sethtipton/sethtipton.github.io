/// <reference types="astro/client" />

import type { StyleTransferController } from './lib/style-transfer/controller';
import type { StyleTransferDiagnosticEntry } from './lib/style-transfer/diagnostics';

declare global {
  interface ImportMetaEnv {
    readonly PUBLIC_STYLE_TRANSFER_API_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface Window {
    __siteThemeControllerInitialized?: boolean;
    __syncSiteTheme?: () => void;
    __siteStyleTransfer?: StyleTransferController;
    __siteStyleTransferDiagnostics?: {
      clear: () => void;
      getEntries: () => StyleTransferDiagnosticEntry[];
    };
    __syncSiteStyleTransfer?: () => void;
    __syncThemeQueryLinks?: () => void;
  }
}

export {};
