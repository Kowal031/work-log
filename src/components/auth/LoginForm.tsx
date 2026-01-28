import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Walidacja podstawowa
    if (!email || !password) {
      setError("Wszystkie pola są wymagane");
      return;
    }

    if (!email.includes("@")) {
      setError("Nieprawidłowy format adresu email");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implementacja wysyłki do /api/auth/login
      console.log("Login attempt:", { email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas logowania");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Logowanie</CardTitle>
        <CardDescription>Wprowadź swoje dane, aby się zalogować</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 mt-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
              <p className="text-sm text-destructive">{error}</p>
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
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              className="mb-0"
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
            <div className="text-sm">
              <a href="/password-recovery" className="text-primary hover:underline">
                Zapomniałeś hasła?
              </a>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 mt-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Nie masz konta?{" "}
            <a href="/register" className="text-primary hover:underline">
              Zarejestruj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
