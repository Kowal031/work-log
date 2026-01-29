import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Walidacja podstawowa
    if (!email || !password || !confirmPassword) {
      setError("Wszystkie pola są wymagane");
      return;
    }

    if (!email.includes("@")) {
      setError("Nieprawidłowy format adresu email");
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error response
        setError(data.message || "Wystąpił błąd podczas rejestracji");
        return;
      }

      // Success - show success message and redirect after delay
      setSuccess(true);

      setTimeout(() => {
        window.location.href = data.redirectUrl || "/login";
      }, 2000);
    } catch (err) {
      console.error("Registration error:", err);
      setError("Wystąpił błąd połączenia. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Rejestracja</CardTitle>
        <CardDescription>Utwórz nowe konto, aby rozpocząć</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 mt-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500 rounded-lg p-3">
              <p className="text-sm text-green-600 dark:text-green-400">
                ✓ Konto zostało utworzone pomyślnie! Przekierowywanie do logowania...
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || success}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || success}
              required
            />
            <p className="text-xs text-muted-foreground">Minimum 8 znaków</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading || success}
              required
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 mt-4">
          <Button type="submit" className="w-full" disabled={isLoading || success}>
            {isLoading ? "Tworzenie konta..." : success ? "Konto utworzone!" : "Zarejestruj się"}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Masz już konto?{" "}
            <a href="/login" className="text-primary hover:underline">
              Zaloguj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
