import { redirect } from "next/navigation";

export default function ApiPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/data-platform`);
}
