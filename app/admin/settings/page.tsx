import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { getBusinessSettings, getPaymentsConfig } from "@/lib/admin/settings";
import { site } from "@/lib/site";
import { canEditSettings, getAdminUser } from "@/lib/admin/auth";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getAdminUser();
  // Owner-only, matching the sidebar. Never rely on hiding a link alone.
  if (!user || !canEditSettings(user.role)) notFound();

  const [settings, payments] = await Promise.all([
    getBusinessSettings(),
    getPaymentsConfig(),
  ]);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Business details, contact information, hours, booking rules, and deposits."
      />
      <SettingsForm
        settings={settings}
        payments={payments}
        // The webhook lands on the public site, never the admin subdomain.
        webhookUrl={`${site.url}/api/paystack/webhook`}
      />
    </>
  );
}
