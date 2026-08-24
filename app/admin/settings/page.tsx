import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";
import { getBusinessSettings } from "@/lib/admin/settings";
import { canEditSettings, getAdminUser } from "@/lib/admin/auth";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getAdminUser();
  // Owner-only, matching the sidebar. Never rely on hiding a link alone.
  if (!user || !canEditSettings(user.role)) notFound();

  const settings = await getBusinessSettings();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Business details, contact information, hours, and booking rules."
      />
      <SettingsForm settings={settings} />
    </>
  );
}
