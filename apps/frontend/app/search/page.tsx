import SearchClient from "./SearchClient";

export default function SearchPage() {
  return (
    <div className="container">
      <h1 style={{ color: "var(--color-artifact)", marginBottom: "30px" }}>Global Patch Search</h1>
      <SearchClient />
    </div>
  );
}
