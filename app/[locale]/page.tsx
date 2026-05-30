import { getTranslations } from "next-intl/server";
import { Zap, ClipboardList, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SettingsPanel } from "@/components/settings-panel";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <SettingsPanel />
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-medium text-muted-foreground">
          {t("categoriesHeading")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Household Electricity card */}
          <Link
            href="/electricity"
            id="card-electricity"
            className="group relative flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div className="flex size-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 transition-colors group-hover:bg-amber-500/20">
                <Zap className="size-6" />
              </div>
              <ArrowRight className="size-5 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">
                {t("cards.electricity.title")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {t("cards.electricity.description")}
              </p>
            </div>
          </Link>

          {/* Family Chores card */}
          <Link
            href="/chores"
            id="card-chores"
            className="group relative flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div className="flex size-12 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 transition-colors group-hover:bg-violet-500/20">
                <ClipboardList className="size-6" />
              </div>
              <ArrowRight className="size-5 text-muted-foreground opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">
                {t("cards.chores.title")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {t("cards.chores.description")}
              </p>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
