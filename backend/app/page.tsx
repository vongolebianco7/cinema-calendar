export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 32 }}>
      <h1>CINEMA DAYS API</h1>
      <p>Backend is running.</p>
      <ul>
        <li><a href="/api/health">/api/health</a></li>
        <li><a href="/api/movies">/api/movies</a></li>
        <li><a href="/api/releases">/api/releases</a></li>
      </ul>
    </main>
  );
}
