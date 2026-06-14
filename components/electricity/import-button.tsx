"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportDialog } from "@/components/electricity/import-dialog";

export function ImportButton() {
  const t = useTranslations("electricity.import");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop-only: the importer is not intended for mobile. */}
      <Button
        variant="outline"
        size="sm"
        className="ml-auto hidden md:inline-flex"
        onClick={() => setOpen(true)}
      >
        <Upload className="size-4" aria-hidden="true" />
        {t("button")}
      </Button>
      {open ? (
        <ImportDialog onClose={() => setOpen(false)} onImported={() => router.refresh()} />
      ) : null}
    </>
  );
}
