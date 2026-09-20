import { getTranslations } from "next-intl/server";
import { Home, Wifi } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SettingsPanel } from "@/components/settings-panel";
import { StatsCard } from "@/components/electricity/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RouterCharts } from "@/components/router/router-charts";
import { CollectorToggle } from "@/components/router/collector-toggle";
import { getCollectorEnabled, getRouterDashboardData } from "@/lib/router-data";

// The collector rewrites the data files every few minutes, so always read them
// at request time rather than letting the production build statically cache this page.
export const dynamic = "force-dynamic";

export default async function RouterPage() {
  const t = await getTranslations("router");
  const tCommon = await getTranslations("dashboard");
  const data = await getRouterDashboardData();
  const collectorEnabled = await getCollectorEnabled();
  const speedUnit = t("speedUnit");

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
            <Home className="size-3.5" />
            {tCommon("title")}
          </Link>
          <span>/</span>
          <span className="text-foreground">{t("headerTitle")}</span>
        </nav>
        <div className="flex items-center gap-2">
          <CollectorToggle initialEnabled={collectorEnabled} />
          <SettingsPanel />
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{t("headerTitle")}</h1>
        {data.latest ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {t("lastUpdated")}:{" "}
            {new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "short" }).format(
              new Date(data.latest.ts)
            )}
          </p>
        ) : null}
      </div>

      {!data.hasData ? (
        <section className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-center">
          <Wifi className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">{t("emptyState")}</p>
        </section>
      ) : (
        <>
          {data.latest ? (
            <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title={t("cards.download")}
                value={`${data.latest.totals.downSpeed.toLocaleString("sv-SE")} ${speedUnit}`}
              />
              <StatsCard
                title={t("cards.upload")}
                value={`${data.latest.totals.upSpeed.toLocaleString("sv-SE")} ${speedUnit}`}
              />
              <StatsCard
                title={t("cards.clients")}
                value={`${data.latest.totals.clients}`}
              />
              <StatsCard
                title={t("cards.cpuMem")}
                value={`${Math.round((data.latest.cpuUsage ?? 0) * 100)}% / ${Math.round(
                  (data.latest.memUsage ?? 0) * 100
                )}%`}
              />
            </section>
          ) : null}

          {data.latest && data.latest.nodes.length > 0 ? (
            <section className="mb-8">
              <h2 className="mb-3 text-lg font-medium text-muted-foreground">{t("nodesHeading")}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.latest.nodes.map((node) => (
                  <Card key={node.mac}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>{node.nickname || node.model}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-normal ${
                            node.role === "master"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {node.role === "master" ? t("roleMain") : t("roleSatellite")}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        {node.model}
                        {node.firmware ? ` · ${node.firmware}` : ""}
                      </p>
                      <p>
                        {t("nodeInternet")}:{" "}
                        <span
                          className={
                            node.inetStatus === "online" ? "text-emerald-600" : "text-amber-600"
                          }
                        >
                          {node.inetStatus || "—"}
                        </span>
                      </p>
                      {node.role !== "master" ? (
                        <p>
                          {t("nodeSignal")}: 2.4G {node.signal2g ?? "—"} · 5G {node.signal5g ?? "—"}
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <RouterCharts
              throughput={data.throughput}
              resources={data.resources}
              dailyThroughput={data.dailyThroughput}
              topClients={data.topClients}
              labels={{
                throughputTitle: t("charts.throughputTitle"),
                resourcesTitle: t("charts.resourcesTitle"),
                dailyTitle: t("charts.dailyTitle"),
                clientsTitle: t("charts.clientsTitle"),
                clientsNote: t("charts.clientsNote"),
                down: t("charts.down"),
                up: t("charts.up"),
                cpu: t("charts.cpu"),
                mem: t("charts.mem"),
                avgDown: t("charts.avgDown"),
                avgUp: t("charts.avgUp"),
                speedUnit,
              }}
            />
          </section>
        </>
      )}
    </main>
  );
}
