"use client";

import React from "react";
import GeneratorDetails from "@/components/admin/GeneratorDetails";
import { useRouter, useSearchParams } from "next/navigation";

export default function GeneratorDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [generatorId, setGeneratorId] = React.useState<string>("");
  const from = searchParams.get("from")?.toLowerCase();

  const handleNavigate = React.useCallback(() => {
    if (from === "technician") {
      router.push("/technician?page=generators");
      return;
    }

    router.push("/admin?page=Generators");
  }, [from, router]);

  React.useEffect(() => {
    params.then((p) => setGeneratorId(p.id));
  }, [params]);

  if (!generatorId) return null;

  return (
    <GeneratorDetails
      generatorId={generatorId}
      onNavigate={handleNavigate}
    />
  );
}
