import { PageHeader } from "@/components/admin/page-header";
import { TestimonialsView } from "@/components/admin/testimonials-view";
import { getTestimonials } from "@/lib/admin/testimonials";
import { getServices } from "@/lib/admin/services";

export const metadata = { title: "Testimonials" };

export default async function TestimonialsPage() {
  const [testimonials, services] = await Promise.all([
    getTestimonials(),
    getServices(),
  ]);

  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Manage customer reviews. Only published reviews appear on the website."
      />
      <TestimonialsView testimonials={testimonials} services={services} />
    </>
  );
}
