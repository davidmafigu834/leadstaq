import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function OldShareRedirect({ params }: { params: { slug: string } }) {
  redirect(`/cloud/share/${params.slug}`);
}
