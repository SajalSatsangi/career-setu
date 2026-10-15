import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>करियरसेतु</h1>
      <p>Bridge to career opportunities.</p>

      <Link href="/signup">Create an account</Link>
      {" | "}
      <Link href="/login">Sign in</Link>
    </main>
  );
}