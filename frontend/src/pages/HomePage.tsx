import { useAuthStore } from "../store/authStore";

export function HomePage() {
  const profile = useAuthStore((state) => state.profile);
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <div className="page">
      <h1>Summit Sprint</h1>
      {profile && (
        <p>
          Welcome, {profile.display_name}. Best WPM: {profile.best_wpm}. Races completed:{" "}
          {profile.races_completed}.
        </p>
      )}
      <button onClick={signOut}>Log out</button>
    </div>
  );
}