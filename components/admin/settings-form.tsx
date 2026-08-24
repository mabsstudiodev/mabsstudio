"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  CalendarCog,
  Clock,
  Phone,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardBody, CardFooter, CardHeader } from "./ui/card";
import { CheckboxField, Field } from "./ui/field";
import { Tabs, TabPanel, type TabDefinition } from "./ui/tabs";
import { useToast } from "./ui/toast";
import {
  bookingSettingsSchema,
  businessHoursSchema,
  businessInfoSchema,
  contactInfoSchema,
  socialLinksSchema,
} from "@/lib/admin/schemas";
import {
  updateBookingSettings,
  updateBusinessHours,
  updateBusinessInfo,
  updateContactInfo,
  updateSocialLinks,
} from "@/lib/admin/actions";
import { toUserMessage } from "@/lib/admin/data-source";
import {
  WEEK_DAYS,
  type BookingSettings,
  type BusinessHours,
  type BusinessInfo,
  type BusinessSettings,
  type ContactInfo,
  type SocialLinks,
} from "@/types/admin";

const TABS: TabDefinition[] = [
  { id: "business", label: "Business", icon: Building2 },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "hours", label: "Hours", icon: Clock },
  { id: "booking", label: "Booking", icon: CalendarCog },
  { id: "social", label: "Social", icon: Share2 },
];

/**
 * Settings, split into one form per section so a save touches only what the
 * admin actually edited — never one giant form posting everything at once.
 */
export function SettingsForm({ settings }: { settings: BusinessSettings }) {
  const [active, setActive] = React.useState("business");

  return (
    <>
      <Tabs tabs={TABS} active={active} onChange={setActive} label="Settings sections" />

      <TabPanel id="business" active={active}>
        <BusinessSection value={settings.business} />
      </TabPanel>
      <TabPanel id="contact" active={active}>
        <ContactSection value={settings.contact} />
      </TabPanel>
      <TabPanel id="hours" active={active}>
        <HoursSection value={settings.hours} />
      </TabPanel>
      <TabPanel id="booking" active={active}>
        <BookingSection value={settings.booking} />
      </TabPanel>
      <TabPanel id="social" active={active}>
        <SocialSection value={settings.social} />
      </TabPanel>
    </>
  );
}

/** Shared submit row — disabled until something actually changes. */
function SaveRow({
  isSubmitting,
  isDirty,
  label,
}: {
  isSubmitting: boolean;
  isDirty: boolean;
  label: string;
}) {
  return (
    <CardFooter>
      <Button type="submit" size="sm" loading={isSubmitting} disabled={!isDirty}>
        {isSubmitting ? "Updating settings..." : label}
      </Button>
    </CardFooter>
  );
}

function BusinessSection({ value }: { value: BusinessInfo }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BusinessInfo>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: value,
  });

  async function onSubmit(values: BusinessInfo) {
    try {
      await updateBusinessInfo(values);
      toast.success("Business information saved.");
    } catch (error) {
      toast.error(
        "Settings not saved",
        toUserMessage(error, "We couldn't save these settings. Please try again.")
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader
          title="Business information"
          description="Used across the website, SEO metadata, and booking emails."
        />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name" required error={errors.name?.message}>
              {(props) => <Input {...props} {...register("name")} />}
            </Field>
            <Field label="Owner name" required error={errors.owner?.message}>
              {(props) => <Input {...props} {...register("owner")} />}
            </Field>
          </div>
          <Field label="Tagline" required error={errors.tagline?.message}>
            {(props) => <Input {...props} {...register("tagline")} />}
          </Field>
          <Field label="Description" required error={errors.description?.message}>
            {(props) => <Textarea {...props} rows={3} {...register("description")} />}
          </Field>
          <Field label="Location" required error={errors.location?.message}>
            {(props) => <Input {...props} {...register("location")} />}
          </Field>
        </CardBody>
        <SaveRow
          isSubmitting={isSubmitting}
          isDirty={isDirty}
          label="Save business information"
        />
      </Card>
    </form>
  );
}

function ContactSection({ value }: { value: ContactInfo }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ContactInfo>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: value,
  });

  async function onSubmit(values: ContactInfo) {
    try {
      await updateContactInfo(values);
      toast.success("Contact details saved.");
    } catch (error) {
      toast.error(
        "Settings not saved",
        toUserMessage(error, "We couldn't save these settings. Please try again.")
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader
          title="Contact details"
          description="Shown on the contact page, in the footer, and in booking emails."
        />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" required error={errors.phone?.message}>
              {(props) => <Input {...props} type="tel" {...register("phone")} />}
            </Field>
            <Field
              label="WhatsApp"
              required
              hint="The number booking messages are sent to."
              error={errors.whatsapp?.message}
            >
              {(props) => <Input {...props} type="tel" {...register("whatsapp")} />}
            </Field>
          </div>
          <Field label="Email" required error={errors.email?.message}>
            {(props) => <Input {...props} type="email" {...register("email")} />}
          </Field>

          <div className="border-t border-admin-border pt-4">
            <p className="mb-4 text-sm font-semibold text-navy">Web presence</p>
            <div className="space-y-4">
              <Field
                label="Website URL"
                required
                hint="Drives Open Graph tags, the sitemap, and robots.txt."
                error={errors.websiteUrl?.message}
              >
                {(props) => (
                  <Input {...props} type="url" {...register("websiteUrl")} />
                )}
              </Field>
              <Field
                label="Google Maps URL"
                hint="Optional. Used for the map link on the contact page."
                error={errors.mapsUrl?.message}
              >
                {(props) => <Input {...props} type="url" {...register("mapsUrl")} />}
              </Field>
            </div>
          </div>
        </CardBody>
        <SaveRow
          isSubmitting={isSubmitting}
          isDirty={isDirty}
          label="Save contact details"
        />
      </Card>
    </form>
  );
}

function HoursSection({ value }: { value: BusinessHours }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BusinessHours>({
    resolver: zodResolver(businessHoursSchema),
    defaultValues: value,
  });

  const appointmentOnly = watch("appointmentOnly");

  async function onSubmit(values: BusinessHours) {
    try {
      await updateBusinessHours(values);
      toast.success("Opening hours saved.");
    } catch (error) {
      toast.error(
        "Settings not saved",
        toUserMessage(error, "We couldn't save these settings. Please try again.")
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader
          title="Opening hours"
          description="The studio currently runs by appointment only — the day grid is ready for when that changes."
        />
        <CardBody className="space-y-5">
          <CheckboxField
            label="Appointment only"
            description="When on, the website shows “By appointment only” instead of the hours below."
            {...register("appointmentOnly")}
          />

          <div
            className={
              appointmentOnly ? "space-y-3 opacity-60" : "space-y-3"
            }
          >
            {WEEK_DAYS.map((day) => (
              <div
                key={day}
                className="grid grid-cols-1 items-start gap-3 border-t border-admin-border pt-3 sm:grid-cols-[9rem_1fr_1fr]"
              >
                <CheckboxField
                  label={day.charAt(0).toUpperCase() + day.slice(1)}
                  {...register(`${day}.open` as const)}
                />
                <Field label="Opens" error={errors[day]?.from?.message}>
                  {(props) => (
                    <Input {...props} type="time" {...register(`${day}.from` as const)} />
                  )}
                </Field>
                <Field label="Closes" error={errors[day]?.to?.message}>
                  {(props) => (
                    <Input {...props} type="time" {...register(`${day}.to` as const)} />
                  )}
                </Field>
              </div>
            ))}
          </div>
        </CardBody>
        <SaveRow isSubmitting={isSubmitting} isDirty={isDirty} label="Save opening hours" />
      </Card>
    </form>
  );
}

function BookingSection({ value }: { value: BookingSettings }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BookingSettings>({
    resolver: zodResolver(bookingSettingsSchema),
    defaultValues: value,
  });

  async function onSubmit(values: BookingSettings) {
    try {
      await updateBookingSettings(values);
      toast.success("Booking settings saved.");
    } catch (error) {
      toast.error(
        "Settings not saved",
        toUserMessage(error, "We couldn't save these settings. Please try again.")
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader
          title="Booking settings"
          description="Controls how the public booking form behaves."
        />
        <CardBody className="space-y-4">
          <CheckboxField
            label="Bookings enabled"
            description="Turn off to stop accepting new requests through the website."
            {...register("enabled")}
          />
          <CheckboxField
            label="Allow same-day bookings"
            {...register("allowSameDay")}
          />

          <div className="grid gap-4 border-t border-admin-border pt-4 sm:grid-cols-3">
            <Field
              label="Minimum notice"
              hint="Hours"
              required
              error={errors.minimumNoticeHours?.message}
            >
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={0}
                  {...register("minimumNoticeHours", { valueAsNumber: true })}
                />
              )}
            </Field>
            <Field
              label="Booking window"
              hint="Days ahead"
              required
              error={errors.maximumWindowDays?.message}
            >
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={1}
                  {...register("maximumWindowDays", { valueAsNumber: true })}
                />
              )}
            </Field>
            <Field
              label="Default duration"
              hint="Minutes"
              required
              error={errors.defaultDurationMinutes?.message}
            >
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={15}
                  step={15}
                  {...register("defaultDurationMinutes", { valueAsNumber: true })}
                />
              )}
            </Field>
          </div>

          <Field
            label="Confirmation message"
            required
            hint="Shown to the customer after a request is sent."
            error={errors.confirmationMessage?.message}
          >
            {(props) => (
              <Textarea {...props} rows={3} {...register("confirmationMessage")} />
            )}
          </Field>
        </CardBody>
        <SaveRow
          isSubmitting={isSubmitting}
          isDirty={isDirty}
          label="Save booking settings"
        />
      </Card>
    </form>
  );
}

function SocialSection({ value }: { value: SocialLinks }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SocialLinks>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: value,
  });

  async function onSubmit(values: SocialLinks) {
    try {
      await updateSocialLinks(values);
      toast.success("Social links saved.");
    } catch (error) {
      toast.error(
        "Settings not saved",
        toUserMessage(error, "We couldn't save these settings. Please try again.")
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader
          title="Social media"
          description="Leave a field empty and its icon stays hidden across the website."
        />
        <CardBody className="space-y-4">
          <Field label="Instagram" error={errors.instagram?.message}>
            {(props) => (
              <Input
                {...props}
                type="url"
                placeholder="https://instagram.com/…"
                {...register("instagram")}
              />
            )}
          </Field>
          <Field label="TikTok" error={errors.tiktok?.message}>
            {(props) => (
              <Input
                {...props}
                type="url"
                placeholder="https://tiktok.com/@…"
                {...register("tiktok")}
              />
            )}
          </Field>
          <Field label="Facebook" error={errors.facebook?.message}>
            {(props) => (
              <Input
                {...props}
                type="url"
                placeholder="https://facebook.com/…"
                {...register("facebook")}
              />
            )}
          </Field>
          <Field label="X (Twitter)" error={errors.x?.message}>
            {(props) => (
              <Input
                {...props}
                type="url"
                placeholder="https://x.com/…"
                {...register("x")}
              />
            )}
          </Field>
        </CardBody>
        <SaveRow isSubmitting={isSubmitting} isDirty={isDirty} label="Save social links" />
      </Card>
    </form>
  );
}