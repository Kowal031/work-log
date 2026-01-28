import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Pobierz token z parametrów URL
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("token") || urlParams.get("access_token");

    if (!tokenFromUrl) {
      setError("Brak tokenu dostępu. Link może być nieprawidłowy lub wygasły.");
    } else {
      setToken(tokenFromUrl);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!token) {
      setError("Brak tokenu dostępu");
      return;
    }

    // Walidacja podstawowa
    if (!password || !confirmPassword) {
      setError("Wszystkie pola są wymagane");
      return;
    }

    if (password.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków");
      return;
    }

    if (password !== confirmPassword) {
      setError("Hasła nie są zgodne");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implementacja wysyłki do /api/auth/update-password
      console.log("Update password attempt with token");

      // Symulacja sukcesu
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas zmiany hasła");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło do swojego konta</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 mt-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-800 dark:text-green-200 mb-2">Hasło zostało pomyślnie zmienione!</p>
              <a href="/login" className="text-sm text-primary hover:underline">
                Przejdź do logowania
              </a>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Nowe hasło</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || !token || success}
              required
            />
            <p className="text-xs text-muted-foreground">Minimum 8 znaków</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading || !token || success}
              required
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 mt-4">
          <Button type="submit" className="w-full" disabled={isLoading || !token || success}>
            {isLoading ? "Zmiana hasła..." : "Zmień hasło"}
          </Button>

          {!success && (
            <p className="text-sm text-muted-foreground text-center">
              <a href="/login" className="text-primary hover:underline">
                Powrót do logowania
              </a>
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
